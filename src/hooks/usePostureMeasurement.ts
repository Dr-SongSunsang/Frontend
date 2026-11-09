import { useCallback, useEffect, useRef, useState } from 'react'
import {
  calibrateDevice,
  POSTURE_DEVICE_ID,
  POSTURE_THRESHOLDS,
  subscribePosture,
  type BackendPostureStatus,
  type DeviceStatus,
  type PostureMessage,
  type SocketConnectionState,
} from '../api/posture'

export type PostureViewStatus =
  | 'analyzing'
  | 'normal'
  | 'needsCorrection'
  | 'uncalibrated'
  | 'calibrating'
  | 'disconnected'

type CalibrationState = {
  phase: 'idle' | 'running' | 'failed'
  secondsRemaining: number
  error: string | null
}

const initialCalibration: CalibrationState = {
  phase: 'idle',
  secondsRemaining: POSTURE_THRESHOLDS.calibrationSeconds,
  error: null,
}

/** 기준 측정 중 흔들림이 크면 서버가 실패를 돌려준다. 사용자에게 이유를 알기 쉽게 보여준다. */
function getCalibrationErrorMessage(result: { error_code: string; message: string; std_dev?: number }) {
  const isUnstable = typeof result.std_dev === 'number' || /UNSTABLE|MOVEMENT|STD/i.test(result.error_code)
  if (isUnstable) return '측정 중 움직임이 감지됐어요. 바른 자세로 5초간 가만히 있어 주세요.'
  return result.message
}

function mapPostureStatus(status: BackendPostureStatus): PostureViewStatus {
  if (status === 'GOOD') return 'normal'
  if (status === 'WARNING' || status === 'BAD') return 'needsCorrection'
  return 'uncalibrated'
}

export function usePostureMeasurement() {
  const [measurement, setMeasurement] = useState<PostureMessage | null>(null)
  const [socketState, setSocketState] = useState<SocketConnectionState>('connecting')
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>('connected')
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const [calibration, setCalibration] = useState<CalibrationState>(initialCalibration)
  const countdownId = useRef<number | undefined>(undefined)
  const postureStatus = useRef<BackendPostureStatus | null>(null)

  useEffect(() => subscribePosture({
    onPosture: (message) => {
      // 주의 ↔ 위험 전환은 같은 '교정 필요' 구간이므로 시간을 이어서 센다.
      const nextView = mapPostureStatus(message.status)
      const previousView = postureStatus.current ? mapPostureStatus(postureStatus.current) : null
      if (previousView !== nextView) setDurationSeconds(0)
      postureStatus.current = message.status
      setMeasurement(message)
      setDeviceStatus(message.device_status)
      if (message.status === 'GOOD') setAlertMessage(null)
    },
    onAlert: (message) => setAlertMessage(message.message),
    onDeviceStatus: (message) => setDeviceStatus(message.status),
    onConnectionChange: setSocketState,
  }), [])

  const isDisconnected = socketState === 'disconnected' || deviceStatus === 'disconnected'
  let status: PostureViewStatus = measurement ? mapPostureStatus(measurement.status) : 'analyzing'
  if (isDisconnected) status = 'disconnected'
  if (calibration.phase === 'running') status = 'calibrating'

  useEffect(() => {
    if (status !== 'normal' && status !== 'needsCorrection') return
    const intervalId = window.setInterval(() => setDurationSeconds((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(intervalId)
  }, [status])

  useEffect(() => () => {
    if (countdownId.current !== undefined) window.clearInterval(countdownId.current)
  }, [])

  const startCalibration = useCallback(async () => {
    if (calibration.phase === 'running') return

    setCalibration({ phase: 'running', secondsRemaining: POSTURE_THRESHOLDS.calibrationSeconds, error: null })
    countdownId.current = window.setInterval(() => {
      setCalibration((current) => ({
        ...current,
        secondsRemaining: Math.max(0, current.secondsRemaining - 1),
      }))
    }, 1000)

    const result = await calibrateDevice(POSTURE_DEVICE_ID)
    if (countdownId.current !== undefined) window.clearInterval(countdownId.current)
    countdownId.current = undefined

    if (!result.success) {
      setCalibration({ phase: 'failed', secondsRemaining: POSTURE_THRESHOLDS.calibrationSeconds, error: getCalibrationErrorMessage(result) })
      return
    }

    setMeasurement((current) => ({
      type: 'posture',
      device_id: current?.device_id || POSTURE_DEVICE_ID,
      status: 'GOOD',
      current_delta: result.baseline_delta,
      baseline_delta: result.baseline_delta,
      deviation: 0,
      device_status: 'connected',
      timestamp: new Date().toISOString(),
    }))
    postureStatus.current = 'GOOD'
    setDurationSeconds(0)
    setCalibration(initialCalibration)
  }, [calibration.phase])

  return {
    status,
    measurement,
    socketState,
    deviceStatus,
    alertMessage,
    durationSeconds,
    calibration,
    startCalibration,
  }
}
