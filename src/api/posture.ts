export type BackendPostureStatus = 'GOOD' | 'WARNING' | 'BAD' | 'UNCALIBRATED'
export type DeviceStatus = 'connected' | 'disconnected'
export type SocketConnectionState = 'connecting' | 'connected' | 'disconnected'

export type PostureMessage = {
  type: 'posture'
  device_id: string
  status: BackendPostureStatus
  current_delta: number
  baseline_delta: number | null
  deviation: number | null
  device_status: DeviceStatus
  timestamp: string
}

export type AlertMessage = {
  type: 'alert'
  device_id: string
  status: Extract<BackendPostureStatus, 'WARNING' | 'BAD'>
  prev_status: BackendPostureStatus
  deviation: number
  message: string
  timestamp: string
}

export type DeviceStatusMessage = {
  type: 'device_status'
  device_id: string
  status: DeviceStatus
  timestamp: string
}

export type CalibrationResult =
  | { success: true; baseline_delta: number; sample_count: number; std_dev: number }
  | { success: false; error_code: string; message: string; std_dev?: number }

type PostureSubscription = {
  onPosture: (message: PostureMessage) => void
  onAlert: (message: AlertMessage) => void
  onDeviceStatus: (message: DeviceStatusMessage) => void
  onConnectionChange: (state: SocketConnectionState) => void
}

const BACKEND_HTTP_URL = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const BACKEND_WS_URL = BACKEND_HTTP_URL.replace(/^http/, 'ws')
const USE_MOCK = import.meta.env.VITE_USE_MOCK_POSTURE !== 'false'
const MOCK_STATUS = parsePostureStatus(import.meta.env.VITE_MOCK_POSTURE_STATUS)

export const POSTURE_DEVICE_ID = import.meta.env.VITE_DEVICE_ID || 'esp32-01'

let mockCalibrated = MOCK_STATUS !== 'UNCALIBRATED'

function parsePostureStatus(value: unknown): BackendPostureStatus | null {
  if (value === 'GOOD' || value === 'WARNING' || value === 'BAD' || value === 'UNCALIBRATED') return value
  return null
}

function isDeviceStatus(value: unknown): value is DeviceStatus {
  return value === 'connected' || value === 'disconnected'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseRealtimeMessage(raw: string): PostureMessage | AlertMessage | DeviceStatusMessage | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || typeof value.type !== 'string' || typeof value.device_id !== 'string' || typeof value.timestamp !== 'string') return null

    if (value.type === 'posture') {
      const status = parsePostureStatus(value.status)
      if (!status || !isDeviceStatus(value.device_status) || typeof value.current_delta !== 'number') return null
      if (value.baseline_delta !== null && typeof value.baseline_delta !== 'number') return null
      if (value.deviation !== null && typeof value.deviation !== 'number') return null

      return {
        type: 'posture',
        device_id: value.device_id,
        status,
        current_delta: value.current_delta,
        baseline_delta: value.baseline_delta,
        deviation: value.deviation,
        device_status: value.device_status,
        timestamp: value.timestamp,
      }
    }

    if (value.type === 'alert') {
      const status = parsePostureStatus(value.status)
      const previousStatus = parsePostureStatus(value.prev_status)
      if ((status !== 'WARNING' && status !== 'BAD') || !previousStatus || typeof value.deviation !== 'number' || typeof value.message !== 'string') return null

      return {
        type: 'alert',
        device_id: value.device_id,
        status,
        prev_status: previousStatus,
        deviation: value.deviation,
        message: value.message,
        timestamp: value.timestamp,
      }
    }

    if (value.type === 'device_status' && isDeviceStatus(value.status)) {
      return {
        type: 'device_status',
        device_id: value.device_id,
        status: value.status,
        timestamp: value.timestamp,
      }
    }
  } catch {
    return null
  }

  return null
}

function createMockPosture(tick: number): PostureMessage {
  const statuses: BackendPostureStatus[] = ['GOOD', 'WARNING', 'BAD', 'GOOD']
  const configuredStatus = MOCK_STATUS === 'UNCALIBRATED' && mockCalibrated ? 'GOOD' : MOCK_STATUS
  const status = !mockCalibrated ? 'UNCALIBRATED' : configuredStatus || statuses[Math.floor(tick / 8) % statuses.length]
  const values: Record<BackendPostureStatus, { current: number; deviation: number | null }> = {
    GOOD: { current: 8.4, deviation: 3.4 },
    WARNING: { current: 18.2, deviation: 13.2 },
    BAD: { current: 27.5, deviation: 22.5 },
    UNCALIBRATED: { current: 7.1, deviation: null },
  }

  return {
    type: 'posture',
    device_id: POSTURE_DEVICE_ID,
    status,
    current_delta: values[status].current,
    baseline_delta: status === 'UNCALIBRATED' ? null : 5,
    deviation: values[status].deviation,
    device_status: 'connected',
    timestamp: new Date().toISOString(),
  }
}

function subscribeToMock(handlers: PostureSubscription): () => void {
  let tick = 0
  let previousStatus: BackendPostureStatus = 'GOOD'
  let intervalId: number | undefined

  handlers.onConnectionChange('connecting')

  const connectionId = window.setTimeout(() => {
    handlers.onConnectionChange('connected')
    handlers.onDeviceStatus({
      type: 'device_status',
      device_id: POSTURE_DEVICE_ID,
      status: 'connected',
      timestamp: new Date().toISOString(),
    })
  }, 250)

  const pushPosture = () => {
    const message = createMockPosture(tick)
    handlers.onPosture(message)

    if (message.status === 'BAD' && previousStatus !== 'BAD') {
      handlers.onAlert({
        type: 'alert',
        device_id: POSTURE_DEVICE_ID,
        status: 'BAD',
        prev_status: previousStatus,
        deviation: message.deviation || 0,
        message: '거북목 자세가 지속되고 있습니다',
        timestamp: message.timestamp,
      })
    }

    previousStatus = message.status
    tick += 1
  }

  const startId = window.setTimeout(() => {
    pushPosture()
    intervalId = window.setInterval(pushPosture, 1000)
  }, 3000)

  return () => {
    window.clearTimeout(connectionId)
    window.clearTimeout(startId)
    if (intervalId !== undefined) window.clearInterval(intervalId)
  }
}

export function subscribePosture(handlers: PostureSubscription): () => void {
  if (USE_MOCK) return subscribeToMock(handlers)

  let socket: WebSocket | null = null
  let reconnectId: number | undefined
  let stopped = false

  const connect = () => {
    if (stopped) return
    handlers.onConnectionChange('connecting')
    socket = new WebSocket(`${BACKEND_WS_URL}/ws/web`)

    socket.onopen = () => handlers.onConnectionChange('connected')
    socket.onmessage = (event) => {
      const message = parseRealtimeMessage(String(event.data))
      if (!message) return
      if (message.type === 'posture') handlers.onPosture(message)
      if (message.type === 'alert') handlers.onAlert(message)
      if (message.type === 'device_status') handlers.onDeviceStatus(message)
    }
    socket.onerror = () => socket?.close()
    socket.onclose = () => {
      if (stopped) return
      handlers.onConnectionChange('disconnected')
      reconnectId = window.setTimeout(connect, 3000)
    }
  }

  connect()

  return () => {
    stopped = true
    if (reconnectId !== undefined) window.clearTimeout(reconnectId)
    socket?.close()
  }
}

function isCalibrationResult(value: unknown): value is CalibrationResult {
  if (!isRecord(value) || typeof value.success !== 'boolean') return false
  if (value.success) return typeof value.baseline_delta === 'number' && typeof value.sample_count === 'number' && typeof value.std_dev === 'number'
  return typeof value.error_code === 'string' && typeof value.message === 'string'
}

export async function calibrateDevice(deviceId: string): Promise<CalibrationResult> {
  if (USE_MOCK) {
    await new Promise((resolve) => window.setTimeout(resolve, 5000))
    mockCalibrated = true
    return { success: true, baseline_delta: 5, sample_count: 50, std_dev: 0.8 }
  }

  try {
    const response = await fetch(`${BACKEND_HTTP_URL}/api/calibrate/${encodeURIComponent(deviceId)}`, { method: 'POST' })
    const value: unknown = await response.json()
    if (isCalibrationResult(value)) return value
    return { success: false, error_code: 'INVALID_RESPONSE', message: '서버 응답을 확인할 수 없어요.' }
  } catch {
    return { success: false, error_code: 'NETWORK_ERROR', message: '서버와 연결할 수 없어요. 잠시 후 다시 시도해 주세요.' }
  }
}
