import './App.css'

const stack = [
  { label: 'Runtime', value: 'React 19' },
  { label: 'Bundler', value: 'Vite 8' },
  { label: 'Language', value: 'TypeScript' },
  { label: 'Lint', value: 'Oxlint' },
]

function App() {
  return (
    <main className="app-shell">
      <header className="topbar">
        <span className="brand-mark" aria-hidden="true">
          T
        </span>
        <span className="brand-name">TurtleNeck Frontend</span>
      </header>

      <section className="workspace" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">React workspace</p>
          <h1 id="page-title">Ready for product work.</h1>
          <p>
            This project is set up with a modern React, TypeScript, and Vite
            toolchain so the frontend can grow from a clean baseline.
          </p>
        </div>

        <dl className="stack-list" aria-label="Frontend stack">
          {stack.map((item) => (
            <div className="stack-item" key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}

export default App
