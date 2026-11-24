import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '01', title: 'Find your community', text: 'Discover campus clubs and request to join student communities.' },
  { icon: '02', title: 'Stay in the loop', text: 'Explore upcoming events and keep up with campus announcements.' },
  { icon: '03', title: 'Make room to learn', text: 'Reserve a library seat and find a focused place to study.' },
  { icon: '04', title: 'Build something', text: 'Share project ideas, collaborate with peers and track your work.' },
];

export default function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" to="/" aria-label="GM University home">
          <img src="/gmu-logo.svg" alt="" />
          <span><strong>GM University</strong><small>Smart Campus</small></span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#campus">Campus</a>
          <a href="#modules">What you can do</a>
          <Link className="landing-signin" to="/login">Sign in</Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero" id="campus">
          <div className="landing-copy">
            <span className="eyebrow"><span className="live-dot" /> YOUR CAMPUS, CONNECTED</span>
            <h1>Make campus life<br /><em>work for you.</em></h1>
            <p>One place to find your people, discover what’s happening and make more of every day at GM University.</p>
            <div className="landing-actions">
              <Link className="primary landing-cta" to="/register">Join the campus</Link>
              <Link className="landing-secondary" to="/login">Already a member? Sign in <span aria-hidden="true">→</span></Link>
            </div>
            <div className="landing-proof">
              <span className="proof-mark">✦</span>
              <span><strong>Learn. Connect. Create.</strong><small>Your university community starts here.</small></span>
            </div>
          </div>
          <div className="landing-art" aria-label="A snapshot of the GM University campus portal">
            <div className="art-glow" />
            <div className="art-building">
              <div className="building-roof" />
              <div className="building-name">GM UNIVERSITY</div>
              <div className="building-columns"><i /><i /><i /><i /><i /></div>
              <div className="building-steps" />
            </div>
            <div className="art-chip chip-events"><span>✦</span> Campus events</div>
            <div className="art-chip chip-learn"><span>⌂</span> Your campus, in one place</div>
            <div className="art-caption">A new day. A thousand possibilities.</div>
          </div>
        </section>

        <section className="landing-modules" id="modules">
          <div className="landing-section-heading">
            <div><span className="eyebrow">MADE FOR CAMPUS LIFE</span><h2>Everything moving you forward.</h2></div>
            <p>Everyday campus tools, brought together in one simple place.</p>
          </div>
          <div className="landing-feature-grid">
            {FEATURES.map((feature) => (
              <article className="landing-feature" key={feature.title}>
                <span className="feature-number">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-bottom">
          <div><span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span><h2>Ready to get connected?</h2></div>
          <Link className="primary landing-cta" to="/register">Create your student account <span aria-hidden="true">→</span></Link>
        </section>
      </main>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} GM University</span>
        <span>Innovating Minds</span>
      </footer>
    </div>
  );
}
