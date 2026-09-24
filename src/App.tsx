import { useEffect, useState, type ReactNode } from 'react'
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
import turtle from './assets/turtle.png'
import stretchNeck from './assets/stretch-neck.png'
import stretchShoulder from './assets/stretch-shoulder.png'
import { usePostureMeasurement, type PostureViewStatus } from './hooks/usePostureMeasurement'

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
  | 'stretch'

type Routine = {
  id: string
  title: string
  creator: string
  duration: string
  image: string
  imageAlt: string
  steps: string[]
}

type PostureState = {
  status: PostureViewStatus
  title: string
  message: string
}

const routines: Routine[] = [
  {
    id: 'neck',
    title: '하루 두 번! 꼭 해야하는 15분 상체 순환 스트레칭',
    creator: '행트',
    duration: '15분',
    image: stretchNeck,
    imageAlt: '앉아서 목과 어깨를 스트레칭하는 여성',
    steps: ['어깨를 편안하게 내리고 바르게 앉아요.', '한쪽 손으로 머리를 잡고 천천히 기울여요.', '반대쪽도 같은 자세로 20초간 유지해요.'],
  },
  {
    id: 'shoulder',
    title: '목 결림, 어깨 뭉침을 풀어주는 스트레칭',
    creator: '예린 mind yoga',
    duration: '10분',
    image: stretchShoulder,
    imageAlt: '앉아서 목을 스트레칭하는 여성',
    steps: ['양손을 어깨에 올리고 가슴을 활짝 펴요.', '팔꿈치로 큰 원을 그리며 천천히 돌려요.', '호흡을 유지하며 반대 방향으로 반복해요.'],
  },
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
    stretch: <><circle cx="12" cy="5" r="2" /><path d="m9 21 2-7-3-3M15 21l-2-7 3-4M5 8l3 3 4-3 4 2 3-3" /></>,
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
          {routines.map((routine) => (
            <Link className="routine-card" to={`/stretching/${routine.id}`} key={routine.id}>
              <img src={routine.image} alt={routine.imageAlt} />
              <p>{routine.title}</p>
              <small><span aria-hidden="true" /> {routine.creator}</small>
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

function StretchingPage() {
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
          <span><Icon name="stretch" /></span>
          <p><strong>오늘의 목표 15분</strong><small>짧게라도 몸을 움직여 보세요</small></p>
          <b>0 / 15</b>
        </div>

        <div className="stretch-list">
          {routines.map((routine) => (
            <Link className="stretch-item" to={`/stretching/${routine.id}`} key={routine.id}>
              <img src={routine.image} alt={routine.imageAlt} />
              <span>
                <small>{routine.creator}</small>
                <strong>{routine.title}</strong>
                <em><Icon name="clock" /> {routine.duration}</em>
              </span>
              <Icon name="chevron" />
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

function StretchingDetailPage() {
  const { routineId } = useParams()
  const routine = routines.find((item) => item.id === routineId)

  if (!routine) return <Navigate to="/stretching" replace />

  return (
    <main className="feature-main">
      <header className="mobile-page-header">
        <Link to="/stretching" aria-label="스트레칭 목록으로 돌아가기"><Icon name="arrow-left" /></Link>
        <h1>스트레칭</h1>
        <span aria-hidden="true" />
      </header>
      <article className="feature-page routine-detail">
        <img className="routine-detail__image" src={routine.image} alt={routine.imageAlt} />
        <div className="routine-detail__body">
          <p className="feature-kicker">{routine.creator}</p>
          <h2>{routine.title}</h2>
          <p className="routine-duration"><Icon name="clock" /> 약 {routine.duration}</p>
          <ol>
            {routine.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <button className="action-button" type="button"><Icon name="play" />루틴 시작하기</button>
        </div>
      </article>
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
