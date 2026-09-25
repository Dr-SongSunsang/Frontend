import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import './App.css'
import { mockPostureStatisticsHistory, type PostureStatisticsSummary, type PostureStatisticsTrendUnit, type PostureTrendPoint } from './api/statistics'
import { mockStretchingRecommendations, type StretchingRecommendation, type StretchingTargetPart } from './api/stretching'
import turtle from './assets/turtle.png'
import { usePostureMeasurement, type PostureViewStatus } from './hooks/usePostureMeasurement'
import { useStretchingRecommendations } from './hooks/useStretchingRecommendations'

type IconName =
  | 'alert'
  | 'arrow-left'
  | 'calendar'
  | 'camera'
  | 'chart'
  | 'check'
  | 'chevron'
  | 'clock'
  | 'heart'
  | 'home'
  | 'play'
  | 'refresh'

type PostureState = {
  status: PostureViewStatus
  title: string
  message: string
}

const featuredStretchingRecommendations = mockStretchingRecommendations.slice(0, 2)

const targetFilters: Array<{ id: 'all' | StretchingTargetPart; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'neck', label: '목' },
  { id: 'shoulder', label: '어깨' },
  { id: 'back', label: '허리' },
]

type StretchingSortOption = 'recommended' | 'popular' | 'latest'

const stretchingSortOptions: Array<{ id: StretchingSortOption; label: string }> = [
  { id: 'recommended', label: '추천순' },
  { id: 'popular', label: '인기순' },
  { id: 'latest', label: '최신순' },
]

const postureStates: Record<PostureViewStatus, PostureState> = {
  analyzing: {
    status: 'analyzing',
    title: '자세를 분석중이에요',
    message: '60% 완료',
  },
  normal: {
    status: 'normal',
    title: '바른 자세에요!',
    message: '지금 자세를 그대로 유지해 주세요.',
  },
  needsCorrection: {
    status: 'needsCorrection',
    title: '교정이 필요해요!',
    message: '목과 어깨를 편안하게 펴 주세요.',
  },
  uncalibrated: {
    status: 'uncalibrated',
    title: '기준 자세 설정이 필요해요',
    message: '바른 자세로 앉은 뒤 기준을 설정해 주세요.',
  },
  calibrating: {
    status: 'calibrating',
    title: '기준 자세를 설정 중이에요',
    message: '바른 자세로 가만히 있어 주세요.',
  },
  disconnected: {
    status: 'disconnected',
    title: '기기 연결이 끊어졌어요',
    message: '연결을 확인하는 동안 잠시만 기다려 주세요.',
  },
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    alert: <><path d="M12 3 2.7 19h18.6L12 3Z" /><path d="M12 8v5M12 17h.01" /></>,
    'arrow-left': <path d="m15 18-6-6 6-6" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    camera: <><path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5Z" /><circle cx="12" cy="13" r="3.5" /></>,
    chart: <path d="M5 0H3C1.34 0 0 1.23 0 2.75v14.44c0 1.52 1.34 2.75 3 2.75h18c1.66 0 3-1.23 3-2.75V2.75C24 1.23 22.66 0 21 0h-2v1.38c0 1.9-1.68 3.43-3.75 3.43h-6.5C6.68 4.81 5 3.28 5 1.38V0Zm10 8.94c0-.76.67-1.38 1.5-1.38S18 8.18 18 8.94v6.87c0 .76-.67 1.38-1.5 1.38s-1.5-.62-1.5-1.38V8.94Zm-9 4.12c.83 0 1.5.62 1.5 1.38v1.37c0 .76-.67 1.38-1.5 1.38s-1.5-.62-1.5-1.38v-1.37c0-.76.67-1.38 1.5-1.38s1.5.62 1.5 1.38Zm6-1.37v4.12c0 .76-.67 1.38-1.5 1.38S9 16.57 9 15.81v-4.12c0-.76.67-1.38 1.5-1.38s1.5.62 1.5 1.38Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z" />,
    home: <path d="M0 24V8L12 0l12 8v16h-9v-9.33H9V24H0Z" />,
    play: <path d="m9 7 8 5-8 5Z" />,
    refresh: <><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" /><path d="M3 21v-5h5M3 12A9 9 0 0 1 18.4 5.6L21 8" /><path d="M21 3v5h-5" /></>,
  }

  const filledIcons: IconName[] = ['chart', 'heart', 'home']

  return <svg className={filledIcons.includes(name) ? 'icon--filled' : undefined} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function PostureIllustration({ status }: { status: PostureViewStatus }) {
  if (status === 'analyzing' || status === 'calibrating') {
    return (
      <div className="analysis-illustration" aria-hidden="true">
        <div className="analysis-paper">
          <span />
          <span />
          <span />
        </div>
        <div className="analysis-check"><Icon name="check" /></div>
      </div>
    )
  }

  return (
    <div className={`posture-character posture-character--${status}`} aria-hidden="true">
      <img src={turtle} alt="" />
      <span><Icon name={status === 'normal' ? 'check' : 'alert'} /></span>
    </div>
  )
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function formatDegrees(value: number | null | undefined) {
  return value == null ? '-' : `${value.toFixed(1)}°`
}

function Splash({ onEnter }: { onEnter: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onEnter, 1800)
    return () => window.clearTimeout(timer)
  }, [onEnter])

  return (
    <section className="splash" aria-label="TurtleNeck 시작 화면">
      <img src={turtle} alt="TurtleNeck 거북이 캐릭터" />
    </section>
  )
}

function SiteHeader() {
  const getNavClass = ({ isActive }: { isActive: boolean }) => isActive ? 'active' : undefined

  return (
    <header className="site-header">
      <Link className="wordmark" to="/" aria-label="TurtleNeck 홈"><img src={turtle} alt="" /><span>TurtleNeck</span></Link>
      <nav className="desktop-nav" aria-label="주요 메뉴">
        <NavLink className={getNavClass} to="/" end>홈</NavLink>
        <NavLink className={getNavClass} to="/posture">자세 측정</NavLink>
        <NavLink className={getNavClass} to="/stretching">스트레칭</NavLink>
        <NavLink className={getNavClass} to="/statistics">통계</NavLink>
      </nav>
    </header>
  )
}

function BottomNav() {
  const navItems: Array<{ to: string; label: string; icon: IconName; end?: boolean }> = [
    { to: '/', label: '홈', icon: 'home', end: true },
    { to: '/posture', label: '자세 측정', icon: 'camera' },
    { to: '/stretching', label: '스트레칭', icon: 'heart' },
    { to: '/statistics', label: '통계', icon: 'chart' },
  ]

  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      {navItems.map((item) => (
        <NavLink
          className={({ isActive }) => isActive ? 'active' : undefined}
          end={item.end}
          key={item.to}
          to={item.to}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

function MobilePageHeader({ title }: { title: string }) {
  return (
    <header className="mobile-page-header">
      <Link to="/" aria-label="홈으로 돌아가기"><Icon name="arrow-left" /></Link>
      <h1>{title}</h1>
      <span aria-hidden="true" />
    </header>
  )
}

function MainPage() {
  return (
    <main className="home-main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__copy">
          <p className="hero__eyebrow">더 건강한 오늘을 위한 작은 습관</p>
          <h1 id="hero-title"><strong>바른 자세</strong>가 만드는<br />더 나은 일상</h1>
          <p className="hero__description">AI와 센서로 분석하는 스마트 자세 관리 서비스</p>
        </div>
        <div className="hero__visual" aria-hidden="true">
          <img src={turtle} alt="" />
        </div>
        <Link className="primary-button" to="/posture"><Icon name="play" />기록 시작하기</Link>
      </section>

      <section className="recommendation" aria-labelledby="recommend-title">
        <div className="section-heading">
          <div className="section-heading__title"><img src={turtle} alt="" /><h2 id="recommend-title">오늘의 추천 스트레칭</h2></div>
          <Link to="/stretching">전체 보기 <Icon name="chevron" /></Link>
        </div>
        <div className="routine-list">
          {featuredStretchingRecommendations.map((recommendation) => (
            <Link className="routine-card" to={`/stretching/${recommendation.id}`} key={recommendation.id}>
              <img src={recommendation.thumbnailUrl} alt={recommendation.thumbnailAlt} />
              <p>{recommendation.title}</p>
              <small><span aria-hidden="true" /> {recommendation.targetLabel} · {recommendation.durationLabel}</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

function PosturePage() {
  const {
    status,
    measurement,
    socketState,
    alertMessage,
    durationSeconds,
    calibration,
    startCalibration,
  } = usePostureMeasurement()
  const postureState = postureStates[status]
  const isBad = status === 'needsCorrection' && measurement?.status === 'BAD'
  const isMeasuring = status === 'normal' || status === 'needsCorrection'
  const statusTitle = isBad ? '위험한 자세가 지속되고 있어요' : postureState.title
  const statusMessage = status === 'calibrating'
    ? `${calibration.secondsRemaining}초 동안 바른 자세로 가만히 있어 주세요.`
    : status === 'needsCorrection' && alertMessage ? alertMessage : postureState.message

  return (
    <main className={`feature-main posture-main posture-main--${postureState.status}${isBad ? ' posture-main--bad' : ''}`}>
      <section className="feature-page posture-page" aria-labelledby="posture-status-title" aria-live="polite">
        <div className="posture-stage">
          <PostureIllustration status={postureState.status} />
          {(postureState.status === 'analyzing' || postureState.status === 'calibrating') && (
            <div className="analysis-loader" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        <div className="posture-status-copy">
          <h2 id="posture-status-title">{statusTitle}</h2>
          <p>{statusMessage}</p>
        </div>

        {isMeasuring && measurement && (
          <section className="posture-readout" aria-label="현재 측정 정보">
            <div className="posture-readout__primary">
              <span>{status === 'normal' ? '자세 유지 시간' : '교정 필요 시간'}</span>
              <strong>{formatDuration(durationSeconds)}</strong>
            </div>
            <div>
              <span>현재 기울기</span>
              <strong>{formatDegrees(measurement.current_delta)}</strong>
            </div>
            <div>
              <span>기준 기울기</span>
              <strong>{formatDegrees(measurement.baseline_delta)}</strong>
            </div>
            <div>
              <span>기준 편차</span>
              <strong>{formatDegrees(measurement.deviation)}</strong>
            </div>
            <p className="posture-device-status">
              <span aria-hidden="true" />
              {measurement.device_id} · 연결됨
            </p>
          </section>
        )}

        {status === 'uncalibrated' && (
          <div className="posture-calibration">
            {calibration.error && <p role="alert">{calibration.error}</p>}
            <button className="action-button" type="button" onClick={startCalibration}>
              <Icon name="camera" />
              {calibration.phase === 'failed' ? '기준 자세 다시 설정' : '기준 자세 설정'}
            </button>
          </div>
        )}

        {status === 'disconnected' && socketState === 'disconnected' && (
          <p className="posture-reconnect">자동으로 다시 연결하고 있어요.</p>
        )}
      </section>
    </main>
  )
}

function StretchingCard({ recommendation }: { recommendation: StretchingRecommendation }) {
  return (
    <Link className="stretch-card" to={`/stretching/${recommendation.id}`}>
      <div className="stretch-card__media">
        <img src={recommendation.thumbnailUrl} alt={recommendation.thumbnailAlt} />
        <span>{recommendation.targetLabel}</span>
      </div>
      <div className="stretch-card__body">
        {recommendation.channelTitle && <small>{recommendation.channelTitle}</small>}
        <h3>{recommendation.title}</h3>
        <p>{recommendation.summary}</p>
        <em><Icon name="clock" /> {recommendation.durationLabel}</em>
      </div>
    </Link>
  )
}

function StretchingLoadingState() {
  return (
    <div className="stretch-state" aria-live="polite" aria-label="스트레칭 추천을 불러오는 중">
      {[0, 1, 2].map((item) => (
        <div className="stretch-card stretch-card--loading" key={item}>
          <span />
          <div>
            <i />
            <i />
            <i />
          </div>
        </div>
      ))}
    </div>
  )
}

function StretchingErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="stretch-feedback" role="alert">
      <span><Icon name="alert" /></span>
      <h3>추천 스트레칭을 불러오지 못했어요</h3>
      <p>{message}</p>
      <button className="action-button" type="button" onClick={onRetry}><Icon name="refresh" />다시 시도</button>
    </div>
  )
}

function StretchingPage() {
  const { recommendations, status, errorMessage, retry } = useStretchingRecommendations()
  const [selectedTarget, setSelectedTarget] = useState<'all' | StretchingTargetPart>('all')
  const [sortOption, setSortOption] = useState<StretchingSortOption>('recommended')
  const visibleRecommendations = useMemo(() => {
    const filteredRecommendations = selectedTarget === 'all'
      ? recommendations
      : recommendations.filter((recommendation) => recommendation.targetPart === selectedTarget)

    if (sortOption === 'popular') {
      return [...filteredRecommendations].sort((a, b) => b.viewCount - a.viewCount)
    }

    if (sortOption === 'latest') {
      return [...filteredRecommendations].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    }

    return filteredRecommendations
  }, [recommendations, selectedTarget, sortOption])

  return (
    <main className="feature-main">
      <MobilePageHeader title="스트레칭" />
      <section className="feature-page stretching-page" aria-labelledby="stretching-title">
        <div className="feature-intro">
          <p className="feature-kicker">오늘도 가볍게</p>
          <h2 id="stretching-title">굳은 목과 어깨를<br />천천히 풀어볼까요?</h2>
          <p>집이나 사무실에서 바로 따라 할 수 있는 루틴이에요.</p>
        </div>

        {status === 'loading' && <StretchingLoadingState />}
        {status === 'error' && <StretchingErrorState message={errorMessage} onRetry={retry} />}
        {status === 'success' && (
          <>
            <div className="stretch-controls">
              <div className="target-filter" aria-label="부위별 스트레칭 필터">
                {targetFilters.map((filter) => (
                  <button
                    aria-pressed={selectedTarget === filter.id}
                    className={selectedTarget === filter.id ? 'active' : undefined}
                    key={filter.id}
                    type="button"
                    onClick={() => setSelectedTarget(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <label className="stretch-sort">
                <select
                  aria-label="스트레칭 정렬"
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value as StretchingSortOption)}
                >
                  {stretchingSortOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
                <Icon name="chevron" />
              </label>
            </div>

            <div className="stretch-list">
              {visibleRecommendations.map((recommendation) => (
                <StretchingCard recommendation={recommendation} key={recommendation.id} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function StretchingDetailPage() {
  const { routineId } = useParams()
  const { recommendations, status, errorMessage, retry } = useStretchingRecommendations()
  const recommendation = recommendations.find((item) => item.id === routineId)

  if (status === 'success' && !recommendation) return <Navigate to="/stretching" replace />

  return (
    <main className="feature-main">
      <header className="mobile-page-header">
        <Link to="/stretching" aria-label="스트레칭 목록으로 돌아가기"><Icon name="arrow-left" /></Link>
        <h1>스트레칭</h1>
        <span aria-hidden="true" />
      </header>
      {status === 'loading' && (
        <section className="feature-page stretching-page">
          <StretchingLoadingState />
        </section>
      )}
      {status === 'error' && (
        <section className="feature-page stretching-page">
          <StretchingErrorState message={errorMessage} onRetry={retry} />
        </section>
      )}
      {status === 'success' && recommendation && (
        <article className="feature-page routine-detail">
          <img className="routine-detail__image" src={recommendation.thumbnailUrl} alt={recommendation.thumbnailAlt} />
          <div className="routine-detail__body">
            <p className="feature-kicker">
              {recommendation.targetLabel}{recommendation.channelTitle ? ` · ${recommendation.channelTitle}` : ''}
            </p>
            <h2>{recommendation.title}</h2>
            <p className="routine-duration"><Icon name="clock" /> {recommendation.durationLabel} · {recommendation.recommendedTimeLabel}</p>
            <p className="routine-summary">{recommendation.summary}</p>
            <ol>
              {recommendation.method.map((step) => <li key={step}>{step}</li>)}
            </ol>
            {recommendation.youtubeUrl ? (
              <a className="action-button" href={recommendation.youtubeUrl} target="_blank" rel="noreferrer"><Icon name="play" />영상으로 보기</a>
            ) : (
              <button className="action-button" type="button"><Icon name="play" />루틴 시작하기</button>
            )}
          </div>
        </article>
      )}
    </main>
  )
}

function formatDurationMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}분`
  if (minutes === 0) return `${hours}시간`
  return `${hours}시간 ${minutes}분`
}

function formatMonthDay(date: string) {
  const [, month, day] = date.split('-').map(Number)
  return `${month}월 ${day}일`
}

function formatStatisticsPeriod(startDate: string, endDate: string) {
  return `${formatMonthDay(startDate)}~ ${formatMonthDay(endDate)}`
}

function getRatioComparison(summary: PostureStatisticsSummary) {
  if (summary.previousGoodPostureRatio === null) return null
  const delta = summary.goodPostureRatio - summary.previousGoodPostureRatio
  const direction = delta >= 0 ? 'up' : 'down'
  const label = `${Math.abs(delta)}%`

  return { direction, label }
}

function StatisticsLineChart({ points }: { points: PostureTrendPoint[] }) {
  const axisValues = [100, 75, 50, 25, 0]
  const width = 340
  const height = 244
  const plotLeft = 40
  const plotRight = 10
  const plotTop = 12
  const plotBottom = 34
  const plotWidth = width - plotLeft - plotRight
  const plotHeight = height - plotTop - plotBottom
  type PositionedPoint = PostureTrendPoint & { x: number; y: number | null; value: number | null }

  const positionedPoints: PositionedPoint[] = points.map((point, index) => {
    const x = points.length === 1 ? plotLeft + plotWidth / 2 : plotLeft + (plotWidth * index) / (points.length - 1)
    const value = typeof point.value === 'number' ? Math.max(0, Math.min(100, point.value)) : null
    const y = value === null ? null : plotTop + plotHeight - (plotHeight * value) / 100

    return { ...point, x, y, value }
  })
  const plottablePoints = positionedPoints.filter((point): point is PositionedPoint & { y: number; value: number } => point.y !== null && point.value !== null)
  const pathData = plottablePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const chartLabel = plottablePoints.map((point) => `${point.label} ${point.value}%`).join(', ')

  return (
    <svg className="statistics-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={chartLabel}>
      {axisValues.map((value) => {
        const y = plotTop + plotHeight - (plotHeight * value) / 100
        return (
          <g key={value}>
            <text x={plotLeft - 9} y={y + 4} textAnchor="end">{value === 0 ? '0' : `${value}%`}</text>
            <line className={value === 0 ? 'chart-axis' : undefined} x1={plotLeft} x2={width - plotRight} y1={y} y2={y} />
          </g>
        )
      })}

      {pathData && <path className="chart-trend-line" d={pathData} />}

      {plottablePoints.map((point) => (
        <circle cx={point.x} cy={point.y} key={point.id} r="5" />
      ))}

      {positionedPoints.map((point) => (
        <text className="chart-x-label" x={point.x} y={height - 9} textAnchor="middle" key={point.id}>{point.label}</text>
      ))}
    </svg>
  )
}

function StatisticsEmptyState() {
  return (
    <div className="statistics-empty" role="status">
      <span><Icon name="calendar" /></span>
      <h3>아직 측정 기록이 없어요</h3>
      <p>자세 측정을 시작하면 기간별 변화가 여기에 표시됩니다.</p>
      <Link className="action-button" to="/posture"><Icon name="play" />자세 측정 시작</Link>
    </div>
  )
}

function StatisticsPage() {
  const [periodIndex, setPeriodIndex] = useState(mockPostureStatisticsHistory.length - 1)
  const [trendUnit, setTrendUnit] = useState<PostureStatisticsTrendUnit>('daily')
  const statistics = mockPostureStatisticsHistory[periodIndex]
  const trend = statistics.trends[trendUnit]
  const hasTrendData = trend.points.some((point) => typeof point.value === 'number')
  const comparison = getRatioComparison(statistics.summary)
  const canMovePrevious = periodIndex > 0
  const canMoveNext = periodIndex < mockPostureStatisticsHistory.length - 1
  const periodLabel = formatStatisticsPeriod(statistics.period.startDate, statistics.period.endDate)
  const trendOptions: Array<{ unit: PostureStatisticsTrendUnit; label: string }> = [
    { unit: 'daily', label: '일간' },
    { unit: 'weekly', label: '주간' },
  ]

  return (
    <main className="feature-main statistics-main">
      <section className="statistics-page" aria-labelledby="statistics-title">
        <header className="statistics-period-bar">
          <button type="button" aria-label="이전 기간" disabled={!canMovePrevious} onClick={() => setPeriodIndex((current) => Math.max(0, current - 1))}>
            <Icon name="chevron" />
          </button>
          <h1 id="statistics-title"><Icon name="calendar" />{periodLabel}</h1>
          <button type="button" aria-label="다음 기간" disabled={!canMoveNext} onClick={() => setPeriodIndex((current) => Math.min(mockPostureStatisticsHistory.length - 1, current + 1))}>
            <Icon name="chevron" />
          </button>
        </header>

        <div className="statistics-content">
          <section className="statistics-summary" aria-label="자세 통계 요약">
            <div>
              <strong>{formatDurationMinutes(statistics.summary.goodPostureMinutes)}</strong>
              <span>바른자세 유지 시간</span>
            </div>
            <div>
              <strong>{statistics.summary.goodPostureRatio}%</strong>
              <span>바른 자세 유지 비율</span>
            </div>
            <div>
              <strong>{statistics.summary.correctionCount}회</strong>
              <span>교정 필요 횟수</span>
            </div>
          </section>

          <section className="posture-trend" aria-labelledby="posture-trend-title">
            <div className="posture-trend__header">
              <div>
                <h2 id="posture-trend-title">{trend.title}</h2>
                <div className="trend-tabs" role="tablist" aria-label="통계 단위">
                  {trendOptions.map((option) => (
                    <button
                      aria-selected={trendUnit === option.unit}
                      className={trendUnit === option.unit ? 'active' : undefined}
                      key={option.unit}
                      role="tab"
                      type="button"
                      onClick={() => setTrendUnit(option.unit)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasTrendData && (
                <div className="posture-trend__score">
                  <strong>{statistics.summary.goodPostureRatio}%</strong>
                  {comparison && (
                    <span className={`trend-comparison trend-comparison--${comparison.direction}`}>
                      <span>(지난주 대비 </span><i aria-hidden="true" /><b>{comparison.label}</b><span>)</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {hasTrendData ? <StatisticsLineChart points={trend.points} /> : <StatisticsEmptyState />}
          </section>
        </div>
      </section>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="feature-main not-found-main">
      <MobilePageHeader title="페이지 없음" />
      <section className="feature-page not-found-page" aria-labelledby="not-found-title">
        <span className="not-found-page__icon"><Icon name="alert" /></span>
        <p className="feature-kicker">404</p>
        <h2 id="not-found-title">페이지를 찾을 수 없어요</h2>
        <p>입력한 주소가 올바른지 확인하거나 홈으로 돌아가 주세요.</p>
        <Link className="action-button" to="/"><Icon name="home" />홈으로 이동</Link>
      </section>
    </main>
  )
}

function RoutedApp() {
  const [showSplash, setShowSplash] = useState(true)

  if (showSplash) return <Splash onEnter={() => setShowSplash(false)} />

  return (
    <div className="page-shell">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/posture" element={<PosturePage />} />
        <Route path="/stretching" element={<StretchingPage />} />
        <Route path="/stretching/:routineId" element={<StretchingDetailPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

function App() {
  return <div className="app"><BrowserRouter><RoutedApp /></BrowserRouter></div>
}

export default App
