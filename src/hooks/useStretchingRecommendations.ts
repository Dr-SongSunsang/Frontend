import { useCallback, useEffect, useState } from 'react'
import { fetchStretchingRecommendations, type StretchingRecommendation } from '../api/stretching'

type StretchingRecommendationStatus = 'loading' | 'success' | 'error'

export function useStretchingRecommendations() {
  const [recommendations, setRecommendations] = useState<StretchingRecommendation[]>([])
  const [status, setStatus] = useState<StretchingRecommendationStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [requestKey, setRequestKey] = useState(0)

  const retry = useCallback(() => {
    setStatus('loading')
    setErrorMessage('')
    setRequestKey((key) => key + 1)
  }, [])

  useEffect(() => {
    let isActive = true

    fetchStretchingRecommendations()
      .then((items) => {
        if (!isActive) return
        setRecommendations(items)
        setStatus('success')
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setRecommendations([])
        setErrorMessage(error instanceof Error ? error.message : '스트레칭 추천을 불러오지 못했어요.')
        setStatus('error')
      })

    return () => {
      isActive = false
    }
  }, [requestKey])

  return { recommendations, status, errorMessage, retry }
}
