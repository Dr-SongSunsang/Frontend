import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
} from 'react-router-dom'
import './App.css'
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
  const getNavClass = ({ isActive }: { isActive: boolean }) => isActive ? 'active' : undefined

  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      <NavLink className={getNavClass} to="/statistics"><Icon name="chart" /><span>통계</span></NavLink>
      <NavLink className={({ isActive }) => `bottom-nav__home${isActive ? ' active' : ''}`} to="/" end><span><Icon name="home" /></span><b>홈</b></NavLink>
      <NavLink className={getNavClass} to="/stretching"><Icon name="heart" /><span>스트레칭</span></NavLink>
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
        <small>{recommendation.channelTitle}</small>
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
  const visibleRecommendations = useMemo(
    () => selectedTarget === 'all'
      ? recommendations
      : recommendations.filter((recommendation) => recommendation.targetPart === selectedTarget),
    [recommendations, selectedTarget],
  )

  return (
    <main className="feature-main">
      <MobilePageHeader title="스트레칭" />
      <section className="feature-page stretching-page" aria-labelledby="stretching-title">
        <div className="feature-intro">
          <p className="feature-kicker">오늘도 가볍게</p>
          <h2 id="stretching-title">굳은 목과 어깨를<br />천천히 풀어볼까요?</h2>
          <p>집이나 사무실에서 바로 따라 할 수 있는 루틴이에요.</p>
        </div>

        <div className="stretch-summary">
          <span><img src={turtle} alt="" /></span>
          <p><strong>오늘의 추천 루틴</strong><small>목, 어깨, 허리 상태에 맞춰 골라 보세요</small></p>
          <b>{status === 'success' ? `${recommendations.length}개` : '...'}</b>
        </div>

        {status === 'loading' && <StretchingLoadingState />}
        {status === 'error' && <StretchingErrorState message={errorMessage} onRetry={retry} />}
        {status === 'success' && (
          <>
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
            <p className="feature-kicker">{recommendation.targetLabel} · {recommendation.channelTitle}</p>
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

function StatisticsPage() {
  const weeklyScores = [55, 72, 62, 88, 76, 42, 68]
  const days = ['월', '화', '수', '목', '금', '토', '일']

  return (
    <main className="feature-main">
      <MobilePageHeader title="통계" />
      <section className="feature-page statistics-page" aria-labelledby="statistics-title">
        <div className="statistics-heading">
          <span><Icon name="calendar" /></span>
          <div><p>이번 주 자세 리포트</p><h2 id="statistics-title">꾸준히 좋아지고 있어요</h2></div>
        </div>

        <div className="score-grid">
          <div><span>평균 자세 점수</span><strong>78<small>점</small></strong><em>지난주보다 +6</em></div>
          <div><span>측정 시간</span><strong>4.2<small>시간</small></strong><em>목표의 84%</em></div>
        </div>

        <section className="weekly-chart" aria-labelledby="weekly-title">
          <div><h3 id="weekly-title">주간 자세 점수</h3><span>9월 21일 - 27일</span></div>
          <div className="chart-bars">
            {weeklyScores.map((score, index) => (
              <span className={index === 3 ? 'best' : undefined} key={days[index]}>
                <i style={{ height: `${score}%` }}><b>{score}</b></i><small>{days[index]}</small>
              </span>
            ))}
          </div>
        </section>

        <div className="weekly-tip"><img src={turtle} alt="" /><p><strong>이번 주 한마디</strong><span>목요일의 바른 자세를 잘 유지했어요. 다음 주에도 틈틈이 어깨를 펴주세요!</span></p></div>
      </section>
    </main>
  )
}

function RoutedApp() {
  const [showSplash, setShowSplash] = useState(true)
  const location = useLocation()
  const isImmersiveRoute = location.pathname === '/posture'

  if (showSplash) return <Splash onEnter={() => setShowSplash(false)} />

  return (
    <div className={`page-shell${isImmersiveRoute ? ' page-shell--immersive' : ''}`}>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/posture" element={<PosturePage />} />
        <Route path="/stretching" element={<StretchingPage />} />
        <Route path="/stretching/:routineId" element={<StretchingDetailPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isImmersiveRoute && <BottomNav />}
    </div>
  )
}

function App() {
  return <div className="app"><BrowserRouter><RoutedApp /></BrowserRouter></div>
}

export default App
