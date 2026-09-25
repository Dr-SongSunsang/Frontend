import heroStretch from '../assets/hero.png'
import stretchNeck from '../assets/stretch-neck.png'
import stretchShoulder from '../assets/stretch-shoulder.png'

export type StretchingTargetPart = 'neck' | 'shoulder' | 'back'

export type StretchingRecommendation = {
  id: string
  title: string
  targetPart: StretchingTargetPart
  targetLabel: string
  channelTitle: string
  durationLabel: string
  recommendedTimeLabel: string
  summary: string
  thumbnailUrl: string
  thumbnailAlt: string
  method: string[]
  youtubeVideoId?: string
  youtubeUrl?: string
}

type ApiStretchingRecommendation = {
  id?: unknown
  videoId?: unknown
  youtubeVideoId?: unknown
  title?: unknown
  targetPart?: unknown
  part?: unknown
  channelTitle?: unknown
  creator?: unknown
  durationLabel?: unknown
  duration?: unknown
  recommendedTimeLabel?: unknown
  recommendedTime?: unknown
  summary?: unknown
  description?: unknown
  thumbnailUrl?: unknown
  imageUrl?: unknown
  method?: unknown
  steps?: unknown
  snippet?: unknown
  contentDetails?: unknown
}

const BACKEND_HTTP_URL = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const STRETCHING_API_URL = import.meta.env.VITE_STRETCHING_API_URL || `${BACKEND_HTTP_URL}/api/stretching/recommendations`
const USE_MOCK = import.meta.env.VITE_USE_MOCK_STRETCHING !== 'false'
const MOCK_SHOULD_FAIL = import.meta.env.VITE_MOCK_STRETCHING_ERROR === 'true'

export const mockStretchingRecommendations: StretchingRecommendation[] = [
  {
    id: 'neck-release',
    title: '목 긴장 완화 스트레칭',
    targetPart: 'neck',
    targetLabel: '목',
    channelTitle: 'TurtleNeck 추천',
    durationLabel: '5분',
    recommendedTimeLabel: '20초씩 3세트',
    summary: '오래 앉아 있을 때 굳기 쉬운 목 옆 라인을 천천히 이완해요.',
    thumbnailUrl: stretchNeck,
    thumbnailAlt: '앉아서 목을 옆으로 기울이는 스트레칭',
    method: [
      '허리를 세우고 어깨 힘을 편안하게 빼요.',
      '한 손으로 머리 옆을 잡고 목을 천천히 기울여요.',
      '반대쪽 어깨가 올라가지 않게 유지하며 20초간 호흡해요.',
    ],
    youtubeVideoId: 'mock-neck-release',
    youtubeUrl: 'https://www.youtube.com/results?search_query=neck+stretch+desk',
  },
  {
    id: 'shoulder-opening',
    title: '어깨 말림 교정 스트레칭',
    targetPart: 'shoulder',
    targetLabel: '어깨',
    channelTitle: 'TurtleNeck 추천',
    durationLabel: '7분',
    recommendedTimeLabel: '30초씩 2세트',
    summary: '앞으로 말린 어깨와 답답한 가슴을 함께 열어주는 루틴이에요.',
    thumbnailUrl: stretchShoulder,
    thumbnailAlt: '앉아서 어깨를 여는 스트레칭',
    method: [
      '양손을 등 뒤에서 가볍게 잡고 가슴을 열어요.',
      '어깨를 귀에서 멀어지게 내린 뒤 턱을 살짝 당겨요.',
      '통증이 없는 범위에서 30초간 자세를 유지해요.',
    ],
    youtubeVideoId: 'mock-shoulder-opening',
    youtubeUrl: 'https://www.youtube.com/results?search_query=rounded+shoulder+stretch',
  },
  {
    id: 'back-reset',
    title: '허리 부담 줄이는 앉은 자세 리셋',
    targetPart: 'back',
    targetLabel: '허리',
    channelTitle: 'TurtleNeck 추천',
    durationLabel: '6분',
    recommendedTimeLabel: '15초씩 4세트',
    summary: '의자에 오래 앉은 뒤 허리와 등 전체의 긴장을 부드럽게 풀어요.',
    thumbnailUrl: heroStretch,
    thumbnailAlt: '스트레칭을 준비하는 TurtleNeck 캐릭터',
    method: [
      '의자 앞쪽에 앉아 양발을 바닥에 단단히 둬요.',
      '양손을 무릎 위에 올리고 등을 둥글게 말았다가 천천히 펴요.',
      '호흡에 맞춰 15초씩 반복하며 허리에 힘이 과하게 들어가지 않게 해요.',
    ],
    youtubeVideoId: 'mock-back-reset',
    youtubeUrl: 'https://www.youtube.com/results?search_query=lower+back+stretch+chair',
  },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function readRecord(value: unknown) {
  return isRecord(value) ? value : {}
}

function readMethod(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string') && value.length > 0 ? value : fallback
}

function readTargetPart(value: unknown): StretchingTargetPart {
  if (value === 'neck' || value === 'shoulder' || value === 'back') return value
  return 'neck'
}

function getTargetLabel(targetPart: StretchingTargetPart) {
  const labels: Record<StretchingTargetPart, string> = {
    neck: '목',
    shoulder: '어깨',
    back: '허리',
  }

  return labels[targetPart]
}

function createYoutubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
}

function formatYoutubeDuration(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback

  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return readString(value, fallback)

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  const totalMinutes = hours * 60 + minutes

  if (seconds === 0) return `${totalMinutes}분`
  return totalMinutes > 0 ? `${totalMinutes}분 ${seconds}초` : `${seconds}초`
}

function mapApiStretchingRecommendation(item: ApiStretchingRecommendation, index: number): StretchingRecommendation {
  const fallback = mockStretchingRecommendations[index % mockStretchingRecommendations.length]
  const id = readRecord(item.id)
  const snippet = readRecord(item.snippet)
  const thumbnails = readRecord(snippet.thumbnails)
  const thumbnail = readRecord(thumbnails.maxres ?? thumbnails.high ?? thumbnails.medium ?? thumbnails.default)
  const contentDetails = readRecord(item.contentDetails)
  const youtubeVideoId = readString(item.youtubeVideoId ?? item.videoId ?? id.videoId, '')
  const targetPart = readTargetPart(item.targetPart ?? item.part)
  const title = readString(item.title ?? snippet.title, fallback.title)

  return {
    id: readString(typeof item.id === 'string' ? item.id : undefined, youtubeVideoId || `recommendation-${index}`),
    title,
    targetPart,
    targetLabel: getTargetLabel(targetPart),
    channelTitle: readString(item.channelTitle ?? item.creator ?? snippet.channelTitle, fallback.channelTitle),
    durationLabel: formatYoutubeDuration(item.durationLabel ?? item.duration ?? contentDetails.duration, fallback.durationLabel),
    recommendedTimeLabel: readString(item.recommendedTimeLabel ?? item.recommendedTime, fallback.recommendedTimeLabel),
    summary: readString(item.summary ?? item.description ?? snippet.description, fallback.summary),
    thumbnailUrl: readString(item.thumbnailUrl ?? item.imageUrl ?? thumbnail.url, fallback.thumbnailUrl),
    thumbnailAlt: `${title} 썸네일`,
    method: readMethod(item.method ?? item.steps, fallback.method),
    youtubeVideoId,
    youtubeUrl: youtubeVideoId ? createYoutubeUrl(youtubeVideoId) : undefined,
  }
}

export async function fetchStretchingRecommendations(): Promise<StretchingRecommendation[]> {
  if (USE_MOCK) {
    await new Promise((resolve) => window.setTimeout(resolve, 600))
    if (MOCK_SHOULD_FAIL) throw new Error('스트레칭 추천을 불러오지 못했어요.')
    return mockStretchingRecommendations
  }

  const response = await fetch(STRETCHING_API_URL)
  if (!response.ok) throw new Error('스트레칭 추천을 불러오지 못했어요.')

  const value: unknown = await response.json()
  const items = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.items) ? value.items : null
  if (!items) throw new Error('스트레칭 추천 응답 형식을 확인할 수 없어요.')

  const validItems = items.filter(isRecord)
  if (validItems.length !== items.length) {
    throw new Error('스트레칭 추천 응답 형식을 확인할 수 없어요.')
  }

  return validItems.map((item, index) => mapApiStretchingRecommendation(item, index))
}
