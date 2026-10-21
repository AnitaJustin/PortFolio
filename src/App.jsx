import Hero3D from './Hero3D'

// ✏️ Edit your content here. Everything on the page comes from this object.
const PROFILE = {
  name: 'Anita Justin C',
  role: 'NetSuite · Tableau · Data Science',
  tagline: ' Analyst ',
  intro: 'I am an analytics professional who bridges the gap between deep enterprise system architecture and modern data visualization. I want to be hired for my ability to understand end-to-end business requirements, engineer the underlying data logic, and deliver clear, actionable analytics solutions.',
  about: 'I am an MCA graduate currently working at Deloitte for two years as a NetSuite developer, managing end-to-end client implementations from requirement discovery to deployment. My core technical work spans authoring diverse SuiteScripts (User Events, Map/Reduce, Client scripts, and Suitelets), streamlining data pipelines to organize enterprise data, and tailoring client-facing document layouts. Driven by a passion for uncovering trends and patterns within large datasets—exemplified by my recent Tableau project mapping six decades of music trends—I am actively pivoting deeper into analytics. Right now, I am dedicated to refining my advanced SQL skills and studying machine learning methodologies to build smarter, data-driven solutions.',
  facts: [
    { value: 'Tools', text: 'Tableau, Python, NetSuite, SuiteScript' },
    { value: 'Location', text: 'Chennai' },
  ],
  projects: [
    { title: 'Inside the Spotify Charts', summary: 'A dashboard representing the changing trends in music from 1960s to 2025', tools: ['Tableau', 'python'], screenshot: '/Spotify_tableau.png' ,href: '/Spotify_tableau.png' },
    { title: 'SHEETMUSIC', summary: 'A Django web app that turns a photo of sheet music into playable audio, with a choice of instruments..', tools: ['Python','Django', 'OpenCV',], screenshot: '/sheetMusic.png' , href: '#projects' }
  ],
  skills: ['Python', 'SuiteScript', 'SQL', 'Tableau', 'CSS', 'JavaScript','Django','NumPy','OpenCV'],
  hobbies: [
    { title: 'Reading', text: 'Latest Read : The Secret Letters : Robin Sharma.' },
    { title: 'Violin', text: 'started Learning from 8th std , Still figuring it out. Also learning new Instruments(Guitar,Kalimba)' },
    { title: 'Movies', text: 'Every genre has a place on my watchlist, and I try to watch a bit of everything' },
  ],
  email: 'anitajustinc@email.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/AnitaJustin' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/anitajustinc' },
    { label: 'Résumé', href: '/Anita_Justin_DS.pdf' },
  ],
}

const NAV = [
  ['About', '#about'],
  ['Projects', '#projects'],
  ['Skills', '#skills'],
  ['Beyond work', '#beyond'],
  ['Contact', '#contact'],
]

function Section({ id, title, children }) {
  return (
    <section id={id} className="section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export default function App() {
  const p = PROFILE

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="wrap">
        <nav className="nav" aria-label="Main">
          <a className="logo" href="#top">{p.name}</a>
          <ul>
            {NAV.map(([label, href]) => (
              <li key={href}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </nav>

        <main id="main">
          <section id="top" className="hero">
            <div className="hero-copy">
              <p className="hero-role">{p.role}</p>
              <h1>{p.tagline}</h1>
              <p className="hero-intro">{p.intro}</p>
              <div className="actions">
                <a className="btn btn-primary" href="#projects">View projects</a>
                <a className="btn" href="#contact">Get in touch</a>
              </div>
            </div>
            <Hero3D />
          </section>

          <section id="about" className="section about">
            <h2>About me</h2>
            <div className="about-body">
              <p className="muted">{p.about}</p>
              <div className="grid">
                {p.facts.map((f) => (
                  <div className="fact" key={f.text}>
                    <strong>{f.value}</strong>
                    <span className="muted">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Section id="projects" title="Selected projects">
            <div className="grid">
              {p.projects.map((pr) => (
                <a className="card" href={pr.href} key={pr.title}>
                  <div className="card-img">
                    {pr.screenshot ? (
                      <img src={pr.screenshot} alt={`Screenshot of ${pr.title}`} loading="lazy" />
                    ) : (
                      '[SCREENSHOT]'
                    )}
                  </div>
                  <div className="card-body">
                    <h3>{pr.title}</h3>
                    <p className="muted">{pr.summary}</p>
                    <p className="card-tools">{pr.tools.join(', ')}</p>
                  </div>
                </a>
              ))}
            </div>
          </Section>

          <Section id="skills" title="Skills">
            <ul className="chips">
              {p.skills.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </Section>

          <Section id="beyond" title="Beyond work">
            <div className="grid">
              {p.hobbies.map((h) => (
                <article className="info" key={h.title}>
                  <h3>{h.title}</h3>
                  <p className="muted">{h.text}</p>
                </article>
              ))}
            </div>
          </Section>

          <section id="contact" className="section contact">
            <h2>Let's work together</h2>
            <a className="btn btn-primary" href={`mailto:${p.email}`}>{p.email}</a>
            <div className="links">
               {p.links.map((l) => (
     <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
   ))}
            </div>
          </section>
        </main>

        <footer className="footer">© {new Date().getFullYear()} {p.name}</footer>
      </div>
    </>
  )
}
