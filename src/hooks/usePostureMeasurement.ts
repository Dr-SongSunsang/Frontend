import { useCallback, useEffect, useRef, useState } from 'react'
import {
  calibrateDevice,
  POSTURE_DEVICE_ID,
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
  secondsRemaining: 5,
  error: null,
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
      if (postureStatus.current !== message.status) {
        postureStatus.current = message.status
        setDurationSeconds(0)
      }
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
  }, [measurement?.status, status])

  useEffect(() => () => {
    if (countdownId.current !== undefined) window.clearInterval(countdownId.current)
  }, [])

  const startCalibration = useCallback(async () => {
    if (calibration.phase === 'running') return

    setCalibration({ phase: 'running', secondsRemaining: 5, error: null })
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
      setCalibration({ phase: 'failed', secondsRemaining: 5, error: result.message })
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
