import { useEffect, useState, type ReactNode } from 'react'
import './App.css'
import turtle from './assets/turtle.png'
import stretchNeck from './assets/stretch-neck.png'
import stretchShoulder from './assets/stretch-shoulder.png'

type IconName = 'chart' | 'chevron' | 'heart' | 'home' | 'play' | 'stretch'

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    chart: <><path d="M5 19V10M12 19V5M19 19v-7" /><path d="M3 21h18" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5a5.5 5.5 0 0 0 1-8.9Z" />,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v11h14V10M9 21v-7h6v7" /></>,
    play: <path d="m9 7 8 5-8 5Z" />,
    stretch: <><circle cx="12" cy="5" r="2" /><path d="m9 21 2-7-3-3M15 21l-2-7 3-4M5 8l3 3 4-3 4 2 3-3" /></>,
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
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
