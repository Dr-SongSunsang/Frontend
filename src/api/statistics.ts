export type PostureStatisticsTrendUnit = 'daily' | 'weekly'

export type PostureStatisticsPeriod = {
  startDate: string
  endDate: string
}

export type PostureStatisticsSummary = {
  goodPostureMinutes: number
  goodPostureRatio: number
  previousGoodPostureRatio: number | null
  correctionCount: number
  totalMeasuredMinutes: number
}

export type PostureTrendPoint = {
  id: string
  label: string
  value: number | null
}

export type PostureStatisticsTrend = {
  unit: PostureStatisticsTrendUnit
  title: string
  points: PostureTrendPoint[]
}

export type PostureStatistics = {
  id: string
  period: PostureStatisticsPeriod
  summary: PostureStatisticsSummary
  trends: Record<PostureStatisticsTrendUnit, PostureStatisticsTrend>
}

export const mockPostureStatisticsHistory: PostureStatistics[] = [
  {
    id: '2026-09-14',
    period: {
      startDate: '2026-09-14',
      endDate: '2026-09-20',
    },
    summary: {
      goodPostureMinutes: 0,
      goodPostureRatio: 0,
      previousGoodPostureRatio: null,
      correctionCount: 0,
      totalMeasuredMinutes: 0,
    },
    trends: {
      daily: {
        unit: 'daily',
        title: '일별 바른자세 추이',
        points: [],
      },
      weekly: {
        unit: 'weekly',
        title: '주간 바른자세 추이',
        points: [],
      },
    },
  },
  {
    id: '2026-09-21',
    period: {
      startDate: '2026-09-21',
      endDate: '2026-09-27',
    },
    summary: {
      goodPostureMinutes: 750,
      goodPostureRatio: 68,
      previousGoodPostureRatio: null,
      correctionCount: 8,
      totalMeasuredMinutes: 1103,
    },
    trends: {
      daily: {
        unit: 'daily',
        title: '일별 바른자세 추이',
        points: [
          { id: '2026-09-21', label: 'Mon', value: 38 },
          { id: '2026-09-22', label: 'Tue', value: 54 },
          { id: '2026-09-23', label: 'Wed', value: 46 },
          { id: '2026-09-24', label: 'Thu', value: 62 },
          { id: '2026-09-25', label: 'Fri', value: 67 },
          { id: '2026-09-26', label: 'Sat', value: null },
          { id: '2026-09-27', label: 'Sun', value: null },
        ],
      },
      weekly: {
        unit: 'weekly',
        title: '주간 바른자세 추이',
        points: [
          { id: '2026-08-31', label: '8/31', value: 43 },
          { id: '2026-09-07', label: '9/7', value: 51 },
          { id: '2026-09-14', label: '9/14', value: null },
          { id: '2026-09-21', label: '9/21', value: 68 },
        ],
      },
    },
  },
]
