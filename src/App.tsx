import { useEffect, useState, type ReactNode } from 'react'
import './App.css'
import turtle from './assets/turtle.png'
import stretchNeck from './assets/stretch-neck.png'
import stretchShoulder from './assets/stretch-shoulder.png'

type IconName = 'chart' | 'chevron' | 'heart' | 'home' | 'play' | 'stretch'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    chart: <path d="M5 0H3C1.34 0 0 1.23 0 2.75v14.44c0 1.52 1.34 2.75 3 2.75h18c1.66 0 3-1.23 3-2.75V2.75C24 1.23 22.66 0 21 0h-2v1.38c0 1.9-1.68 3.43-3.75 3.43h-6.5C6.68 4.81 5 3.28 5 1.38V0Zm10 8.94c0-.76.67-1.38 1.5-1.38S18 8.18 18 8.94v6.87c0 .76-.67 1.38-1.5 1.38s-1.5-.62-1.5-1.38V8.94Zm-9 4.12c.83 0 1.5.62 1.5 1.38v1.37c0 .76-.67 1.38-1.5 1.38s-1.5-.62-1.5-1.38v-1.37c0-.76.67-1.38 1.5-1.38Zm6-1.37v4.12c0 .76-.67 1.38-1.5 1.38S9 16.57 9 15.81v-4.12c0-.76.67-1.38 1.5-1.38s1.5.62 1.5 1.38Z" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z" />,
    home: <path d="M0 24V8L12 0l12 8v16h-9v-9.33H9V24H0Z" />,
    play: <path d="m9 7 8 5-8 5Z" />,
    stretch: <><circle cx="12" cy="5" r="2" /><path d="m9 21 2-7-3-3M15 21l-2-7 3-4M5 8l3 3 4-3 4 2 3-3" /></>,
  }

  const filledIcons: IconName[] = ['chart', 'heart', 'home']

  return <svg className={filledIcons.includes(name) ? 'icon--filled' : undefined} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
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

function MainPage() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="TurtleNeck 홈"><img src={turtle} alt="" /><span>TurtleNeck</span></a>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          <a className="active" href="/">홈</a><a href="/posture">자세 측정</a><a href="/stretching">스트레칭</a><a href="/statistics">통계</a>
        </nav>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero__copy">
            <p className="hero__eyebrow">더 건강한 오늘을 위한 작은 습관</p>
            <h1 id="hero-title"><strong>바른 자세</strong>가 만드는<br />더 나은 일상</h1>
            <p className="hero__description">AI와 센서로 분석하는 스마트 자세 관리 서비스</p>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <img src={turtle} alt="" />
          </div>
          <a className="primary-button" href="/posture"><Icon name="play" />기록 시작하기</a>
        </section>

        <section className="recommendation" aria-labelledby="recommend-title">
          <div className="section-heading">
            <div className="section-heading__title"><img src={turtle} alt="" /><h2 id="recommend-title">오늘의 추천 스트레칭</h2></div>
            <a href="/stretching">전체 보기 <Icon name="chevron" /></a>
          </div>
          <div className="routine-list">
            <a className="routine-card" href="/stretching/neck">
              <img src={stretchNeck} alt="앉아서 목과 어깨를 스트레칭하는 여성" />
              <p>하루 두 번! 꼭 해야하는 15분 상체 순환 스트레칭</p>
              <small><span aria-hidden="true" /> 행트</small>
            </a>
            <a className="routine-card" href="/stretching/shoulder">
              <img src={stretchShoulder} alt="앉아서 목을 스트레칭하는 여성" />
              <p>목 결림, 어깨 뭉침을 풀어주는 스트레칭</p>
              <small><span aria-hidden="true" /> 예린 mind yoga</small>
            </a>
          </div>
        </section>
      </main>

      <nav className="bottom-nav" aria-label="하단 메뉴">
        <a href="/statistics"><Icon name="chart" /><span>통계</span></a>
        <a className="bottom-nav__home active" href="/" aria-current="page"><span><Icon name="home" /></span><b>홈</b></a>
        <a href="/stretching"><Icon name="heart" /><span>스트레칭</span></a>
      </nav>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  return <div className="app">{showSplash ? <Splash onEnter={() => setShowSplash(false)} /> : <MainPage />}</div>
}

export default App
