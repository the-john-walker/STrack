interface LandingProps {
  onEnter: () => void;
  show: boolean;
}

export default function Landing({ onEnter, show }: LandingProps) {
  function handleShare(e: React.MouseEvent<HTMLButtonElement>) {
    const url = window.location.href;
    const text =
      'STrack: a free study tracker. Log focus time, set weekly goals, and watch your progress add up.';
    if (navigator.share) {
      navigator.share({ title: 'STrack', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        const btn = e.currentTarget;
        const label = btn.querySelector('.foot-share-label');
        if (label) {
          const orig = label.textContent;
          label.textContent = 'Copied!';
          setTimeout(() => {
            label.textContent = orig;
          }, 1800);
        }
      });
    }
  }

  return (
    <div id="intro" className={show ? 'show' : ''}>
      <div className="intro-inner">
        {/* Nav */}
        <nav className="intro-nav">
          <div className="intro-brand">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="3.5"
                y="3.5"
                width="17"
                height="17"
                rx="4.5"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M8 12.2L10.8 15L16.5 9"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            STrack
            <span className="ver">1.0</span>
          </div>
          <div className="intro-links">
            <a
              className="intro-link"
              href="https://github.com/the-john-walker/STrack"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.607.069-.607 1.003.07 1.531 1.031 1.531 1.031.892 1.529 2.341 1.088 2.91.832.092-.646.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.295 2.748-1.026 2.748-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.31.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </a>
            <a
              className="intro-link"
              href="https://medium.com/@johnwalkerspersonal/list/stracker-24f401730a81"
              target="_blank"
              rel="noopener noreferrer"
            >
              Blog
            </a>
            <a className="intro-link" href="mailto:johnwalkerspersonal@gmail.com?subject=STrack">
              Support
            </a>
            <button className="intro-navbtn" onClick={onEnter}>
              Open STrack &rarr;
            </button>
          </div>
        </nav>

        {/* Body */}
        <div className="intro-body">
          <div className="intro-hero">
            {/* Left: headline + CTA */}
            <div className="intro-left">
              <div className="intro-eyebrow intro-fade" style={{ ['--fd' as string]: '.05s' }}>
                Open source projects to help students study better
              </div>
              <h1 className="intro-title intro-fade" style={{ ['--fd' as string]: '.12s' }}>
                Track your studying.
                <br />
                Save time.
              </h1>
              <p className="intro-tag intro-fade" style={{ ['--fd' as string]: '.2s' }}>
                STrack is a free study tracker. Log your focus time, set weekly goals, and watch
                your progress add up.
              </p>
              <button
                className="intro-enter intro-fade"
                style={{ ['--fd' as string]: '.28s' }}
                onClick={onEnter}
              >
                Open STrack &rarr;
              </button>
            </div>

            {/* Right: animated app preview */}
            <div className="intro-right intro-fade" style={{ ['--fd' as string]: '.22s' }}>
              <div className="intro-preview">
                <div className="pv-bar">
                  <span className="pv-dot" />
                  <span className="pv-dot" />
                  <span className="pv-dot" />
                  <span className="pv-url">strack</span>
                </div>
                <div className="pv-body">
                  <div className="pv-row">
                    <div className="pv-name">
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect
                          x="3.5"
                          y="3.5"
                          width="17"
                          height="17"
                          rx="4.5"
                          stroke="currentColor"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M8 12.2L10.8 15L16.5 9"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      STrack
                    </div>
                    <div className="pv-flame">
                      <svg viewBox="0 0 24 24" fill="var(--flame)" aria-hidden="true">
                        <path d="M12 2.5C9 6 7 8.5 7 12a5 5 0 0 0 10 0c0-1.7-.7-3.2-1.8-4.5.1 1.3-.7 2.3-1.7 2.4C14.3 7.6 13.4 4.9 12 2.5Z" />
                      </svg>
                      6
                    </div>
                  </div>
                  <div className="pv-stats">
                    <div className="pv-stat">
                      <div className="l">Today</div>
                      <div className="v">2.5h</div>
                    </div>
                    <div className="pv-stat">
                      <div className="l">This week</div>
                      <div className="v">11h</div>
                    </div>
                    <div className="pv-stat">
                      <div className="l">Goal</div>
                      <div className="v">73%</div>
                    </div>
                  </div>
                  <div className="pv-chart">
                    {([0.45, 0.52, 0.59, 0.66, 0.73, 0.8, 0.87] as number[]).map((d, i) => (
                      <i
                        key={i}
                        style={{
                          ['--d' as string]: `${d}s`,
                          height: ['48%', '70%', '38%', '88%', '60%', '96%', '52%'][i],
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="intro-bridge intro-fade" style={{ ['--fd' as string]: '.34s' }}>
            A focused set of tools to help you build steady study habits and see your progress grow.
          </p>

          {/* Feature cards */}
          <div className="intro-feats">
            <div className="feat intro-fade" style={{ ['--fd' as string]: '.3s' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2.5 1.5M9 2h6" />
              </svg>
              <h4>Focus timer</h4>
              <p>A clean, distraction-free timer with calm backgrounds to keep you in the zone.</p>
            </div>
            <div className="feat intro-fade" style={{ ['--fd' as string]: '.36s' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="12" cy="12" r="0.5" fill="currentColor" />
              </svg>
              <h4>Goals &amp; plans</h4>
              <p>Set weekly hour goals and get a suggested plan for what to do each session.</p>
            </div>
            <div className="feat intro-fade" style={{ ['--fd' as string]: '.42s' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="m7 14 3-4 3 3 4-6" />
              </svg>
              <h4>Streaks &amp; insights</h4>
              <p>Build daily streaks and see all your stats and charts together in one view.</p>
            </div>
            <div className="feat intro-fade" style={{ ['--fd' as string]: '.48s' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3 3 8l9 5 9-5-9-5Z" />
                <path d="m3 13 9 5 9-5" />
              </svg>
              <h4>Yours to organize</h4>
              <p>Track by your own subjects and goals, and keep everything in your browser.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="intro-foot intro-fade" style={{ ['--fd' as string]: '.5s' }}>
          <span className="foot-text">Free and open source. Built for students.</span>
          <div className="foot-actions">
            <button className="foot-share" onClick={handleShare}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
              </svg>
              <span className="foot-share-label">Share</span>
            </button>
            <a
              className="intro-enter foot-contact"
              href="mailto:johnwalkerspersonal@gmail.com?subject=STrack"
            >
              Contact
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
