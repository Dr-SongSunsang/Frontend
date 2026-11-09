export type BackendPostureStatus = 'GOOD' | 'WARNING' | 'BAD' | 'UNCALIBRATED'
export type DeviceStatus = 'connected' | 'disconnected'
export type SocketConnectionState = 'connecting' | 'connected' | 'disconnected'

/**
 * 판정 기준. 실제 판정은 서버(compute_status)가 하고, 프론트는 화면 표시와 mock에만 쓴다.
 * 서버에서 임계값을 바꾸면 여기도 같이 맞춰 준다.
 */
export const POSTURE_THRESHOLDS = {
  /** 편차가 이 값 이상이면 주의(WARNING) 진입 */
  warningEnter: 10,
  /** 주의 상태에서 이 값 미만으로 내려와야 정상 복귀 (경계값 깜빡임 방지) */
  warningExit: 8,
  /** 편차가 이 값 이상이면 위험(BAD) 진입 */
  badEnter: 20,
  /** 위험 상태에서 이 값 미만으로 내려와야 주의로 복귀 */
  badExit: 18,
  /** 기준을 넘은 상태가 이 시간 이상 지속될 때만 경고 */
  sustainSeconds: 10,
  /** 한 번 경고한 뒤 다시 울리지 않는 간격 (2~3분) */
  alertCooldownSeconds: 150,
  /** 기준 자세 측정 시간 */
  calibrationSeconds: 5,
  /** 게이지 최대 표시 범위 */
  gaugeMax: 30,
} as const

export type PostureMessage = {
  type: 'posture'
  device_id: string
  status: BackendPostureStatus
  /** 목 각도 = 상측(머리 쪽) pitch - 하측(몸통 쪽) pitch */
  current_delta: number
  /** 기준 자세 설정 시 5초 평균으로 저장된 delta */
  baseline_delta: number | null
  /** |current_delta - baseline_delta| */
  deviation: number | null
  device_status: DeviceStatus
  timestamp: string
  /** 하측(몸통 쪽, 0x68) 센서 pitch. 서버가 전달할 때만 존재 */
  lower_pitch?: number | null
  /** 상측(머리 쪽, 0x69) 센서 pitch. 서버가 전달할 때만 존재 */
  upper_pitch?: number | null
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

function readOptionalNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return null
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
        // 펌웨어는 neck_pitch(하측) / ear_pitch(상측) 이름으로 보낸다. 서버가 그대로 넘겨줘도 읽을 수 있게 둘 다 받는다.
        lower_pitch: readOptionalNumber(value.lower_pitch, value.neck_pitch),
        upper_pitch: readOptionalNumber(value.upper_pitch, value.ear_pitch),
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

const MOCK_BASELINE_DELTA = 5

/** 히스테리시스 판정: 진입 기준과 해제 기준을 다르게 둔다. */
export function classifyDeviation(deviation: number, previous: BackendPostureStatus): Exclude<BackendPostureStatus, 'UNCALIBRATED'> {
  const t = POSTURE_THRESHOLDS
  if (previous === 'BAD') {
    if (deviation >= t.badExit) return 'BAD'
    return deviation >= t.warningExit ? 'WARNING' : 'GOOD'
  }
  if (previous === 'WARNING') {
    if (deviation >= t.badEnter) return 'BAD'
    return deviation >= t.warningExit ? 'WARNING' : 'GOOD'
  }
  if (deviation >= t.badEnter) return 'BAD'
  return deviation >= t.warningEnter ? 'WARNING' : 'GOOD'
}

/** 시간(초)에 따른 mock 편차 시나리오. 바른 자세 → 서서히 숙임 → 거북목 유지 → 경계에서 머뭇 → 회복 */
const mockDeviationScript: Array<{ until: number; from: number; to: number }> = [
  { until: 12, from: 2, to: 3 },
  { until: 18, from: 3, to: 13 },
  { until: 32, from: 13, to: 14 },
  { until: 38, from: 14, to: 24 },
  { until: 56, from: 24, to: 23 },
  { until: 60, from: 23, to: 9 },
  { until: 66, from: 9, to: 9 },
  { until: 70, from: 9, to: 3 },
]
const MOCK_SCRIPT_LENGTH = mockDeviationScript[mockDeviationScript.length - 1].until

function mockDeviationAt(tick: number) {
  const t = tick % MOCK_SCRIPT_LENGTH
  let segmentStart = 0
  for (const segment of mockDeviationScript) {
    if (t < segment.until) {
      const ratio = (t - segmentStart) / (segment.until - segmentStart)
      return segment.from + (segment.to - segment.from) * ratio
    }
    segmentStart = segment.until
  }
  return mockDeviationScript[0].from
}

const fixedMockDeviation: Record<Exclude<BackendPostureStatus, 'UNCALIBRATED'>, number> = {
  GOOD: 3.4,
  WARNING: 13.2,
  BAD: 22.5,
}

function subscribeToMock(handlers: PostureSubscription): () => void {
  let tick = 0
  let status: BackendPostureStatus = 'GOOD'
  let outOfRangeSeconds = 0
  let lastAlertTick = -Infinity
  let alertedStatus: BackendPostureStatus = 'GOOD'
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
    const timestamp = new Date().toISOString()
    // 몸통이 앞뒤로 흔들려도(의자 젖힘 등) 목 각도(delta)에는 영향이 없다는 걸 보여주기 위한 값
    const lowerPitch = 4 * Math.sin(tick / 9) + (Math.random() - 0.5) * 0.6
    const noise = (Math.random() - 0.5) * 0.8

    if (!mockCalibrated) {
      const currentDelta = 7.1 + noise
      handlers.onPosture({
        type: 'posture',
        device_id: POSTURE_DEVICE_ID,
        status: 'UNCALIBRATED',
        current_delta: currentDelta,
        baseline_delta: null,
        deviation: null,
        device_status: 'connected',
        timestamp,
        lower_pitch: lowerPitch,
        upper_pitch: lowerPitch + currentDelta,
      })
      tick += 1
      return
    }

    const fixedStatus = MOCK_STATUS && MOCK_STATUS !== 'UNCALIBRATED' ? MOCK_STATUS : null
    const deviation = Math.max(0, (fixedStatus ? fixedMockDeviation[fixedStatus] : mockDeviationAt(tick)) + noise)
    status = fixedStatus || classifyDeviation(deviation, status)
    const currentDelta = MOCK_BASELINE_DELTA + deviation

    handlers.onPosture({
      type: 'posture',
      device_id: POSTURE_DEVICE_ID,
      status,
      current_delta: currentDelta,
      baseline_delta: MOCK_BASELINE_DELTA,
      deviation,
      device_status: 'connected',
      timestamp,
      lower_pitch: lowerPitch,
      upper_pitch: lowerPitch + currentDelta,
    })

    // 지속 시간 + 재알림 간격 조건 (서버 로직 흉내)
    if (status === 'GOOD') {
      outOfRangeSeconds = 0
      alertedStatus = 'GOOD'
    } else {
      outOfRangeSeconds += 1
      const sustained = outOfRangeSeconds >= POSTURE_THRESHOLDS.sustainSeconds
      const escalated = status === 'BAD' && alertedStatus !== 'BAD'
      const cooledDown = tick - lastAlertTick >= POSTURE_THRESHOLDS.alertCooldownSeconds
      if (sustained && (cooledDown || escalated)) {
        handlers.onAlert({
          type: 'alert',
          device_id: POSTURE_DEVICE_ID,
          status,
          prev_status: alertedStatus,
          deviation,
          message: status === 'BAD' ? '거북목 자세가 지속되고 있습니다' : '고개가 앞으로 나와 있어요',
          timestamp,
        })
        lastAlertTick = tick
        alertedStatus = status
      }
    }

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
    await new Promise((resolve) => window.setTimeout(resolve, POSTURE_THRESHOLDS.calibrationSeconds * 1000))
    mockCalibrated = true
    // 10Hz × 5초 = 50개 샘플 평균
    return { success: true, baseline_delta: MOCK_BASELINE_DELTA, sample_count: 50, std_dev: 0.8 }
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
