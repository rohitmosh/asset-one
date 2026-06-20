import React, { useState, useEffect, useRef } from 'react';
import './landing.css';

const API_BASE = 'http://localhost:8000';

interface LandingPageProps {
  onLoginSuccess: (token: string) => void;
}

/* ─── tiny hook: observe when element enters viewport ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── feature cards data ─── */
const FEATURES = [
  {
    icon: '🛡️',
    title: 'Zero-Trust Asset Security',
    desc: 'Cryptographic ledger verification and multi-tier access control ensure every asset interaction is auditable and tamper-proof.',
    gradient: 'from-violet-600 to-indigo-600',
    glow: 'rgba(124,58,237,0.35)',
  },
  {
    icon: '📊',
    title: 'Real-Time Asset Registry',
    desc: 'Live spreadsheet-grade registry with sticky columns, column sorting, inline editing, and multi-format export (Excel / PDF).',
    gradient: 'from-sky-500 to-cyan-500',
    glow: 'rgba(14,165,233,0.3)',
  },
  {
    icon: '🔁',
    title: 'Full Lifecycle Tracking',
    desc: 'Monitor every stage from procurement to decommission. Warranty alerts, end-of-life notifications, and criticality scoring built in.',
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    icon: '👥',
    title: 'Role-Based Governance',
    desc: 'L1 Admin, L2 Custodian, and User roles with granular permission boundaries. Bulk transfer with password-authenticated digital signatures.',
    gradient: 'from-amber-500 to-orange-500',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    icon: '🗺️',
    title: 'Location & Ownership Mapping',
    desc: 'Track physical location, assigned user, custodian, and department for every asset. Instant ownership transfers with full audit trail.',
    gradient: 'from-rose-500 to-pink-500',
    glow: 'rgba(244,63,94,0.3)',
  },
  {
    icon: '📋',
    title: 'Compliance & Deviation Reports',
    desc: 'Auto-detect policy deviations and vulnerability flags. Export compliance-ready reports for internal audit and regulatory review.',
    gradient: 'from-lime-500 to-green-600',
    glow: 'rgba(101,163,13,0.3)',
  },
];

const STATS = [
  { value: '6+', label: 'Asset Categories', sub: 'IT, OT, Network & more' },
  { value: '100%', label: 'Audit Coverage', sub: 'Every action logged' },
  { value: '3-Tier', label: 'Access Control', sub: 'L1 · L2 · User' },
  { value: 'Real-Time', label: 'Ledger Integrity', sub: 'Cryptographic chain' },
];

const STEPS = [
  {
    num: '01',
    title: 'Authenticate Securely',
    desc: 'Login with your OHPC credentials. Role-based access is enforced server-side with JWT tokens and 12-hour sessions.',
    icon: '🔐',
  },
  {
    num: '02',
    title: 'Manage Your Assets',
    desc: 'View, edit, transfer, or retire assets assigned to your scope. All changes are cryptographically signed and immutably logged.',
    icon: '⚙️',
  },
  {
    num: '03',
    title: 'Export & Report',
    desc: 'Generate compliance-ready Excel or PDF exports. Filter by date, classification, location, or lifecycle status in seconds.',
    icon: '📤',
  },
];

const DEMO_USERS = [
  { label: 'L1 Admin', username: 'admin.hq', badge: 'Full Access', color: '#a78bfa' },
  { label: 'L2 Admin · IT', username: 'custodian.it', badge: 'Custodian', color: '#38bdf8' },
  { label: 'L2 Admin · OT', username: 'custodian.ot', badge: 'Custodian', color: '#38bdf8' },
  { label: 'Operations User', username: 'rahul.ops', badge: 'User', color: '#4ade80' },
];

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [logging, setLogging] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const heroAnim = useInView(0.01);
  const statsAnim = useInView(0.1);
  const featuresAnim = useInView(0.05);
  const stepsAnim = useInView(0.1);
  const securityAnim = useInView(0.1);
  const loginAnim = useInView(0.05);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLogging(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('eams_token', data.access_token);
        onLoginSuccess(data.access_token);
      } else {
        const err = await res.json();
        setLoginError(err.detail || 'Authentication failed. Check your credentials.');
      }
    } catch {
      setLoginError('Unable to reach EAMS server. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  const fillDemo = (u: string) => {
    setUsername(u);
    setPassword('password123');
    setLoginError('');
  };

  return (
    <div className="lp-root">
      {/* ── Ambient background orbs ── */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      {/* ════════════════ NAVBAR ════════════════ */}
      <header className={`lp-nav ${scrolled ? 'lp-nav--scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <div className="lp-nav-brand" onClick={() => scrollTo('hero')}>
            <div className="lp-nav-logo">A1</div>
            <div>
              <div className="lp-nav-name">AssetOne</div>
            </div>
          </div>

          <nav className="lp-nav-links">
            {[['Features', 'features'], ['How It Works', 'how-it-works'], ['Security', 'security']].map(([label, id]) => (
              <button key={id} className="lp-nav-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </nav>

          <button className="lp-cta-btn" onClick={() => scrollTo('login')}>
            Access Portal →
          </button>

          <button className="lp-hamburger" onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lp-mobile-menu">
            {[['Features', 'features'], ['How It Works', 'how-it-works'], ['Security', 'security']].map(([label, id]) => (
              <button key={id} className="lp-mobile-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </div>
        )}
      </header>

      {/* ════════════════ HERO ════════════════ */}
      <section id="hero" className="lp-hero">
        <div
          ref={heroAnim.ref}
          className={`lp-hero-content ${heroAnim.inView ? 'lp-anim-in' : 'lp-anim-out'}`}
        >
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            Enterprise Asset Management · OHPC Digital Governance
          </div>

          <h1 className="lp-hero-title">
            Total Control Over<br />
            <span className="lp-gradient-text">Every Asset Digitally</span>
          </h1>

          <p className="lp-hero-desc">
            OHPC's Enterprise Asset Management System delivers cryptographic audit trails,
            zero-trust access control, and real-time lifecycle tracking — all in one
            unified, enterprise-grade platform.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => scrollTo('login')}>
              <span>Access the Portal</span>
              <span className="lp-btn-arrow">→</span>
            </button>
            <button className="lp-btn-ghost" onClick={() => scrollTo('features')}>
              Explore Features
            </button>
          </div>

          <div className="lp-hero-tags">
            {['Cryptographic Ledger', 'Role-Based Access', 'Excel / PDF Export', 'Bulk Operations', 'Audit Log'].map(t => (
              <span key={t} className="lp-tag">✓ {t}</span>
            ))}
          </div>
        </div>

        {/* Dashboard mockup */}
        <div className={`lp-hero-visual ${heroAnim.inView ? 'lp-anim-in-right' : 'lp-anim-out-right'}`} ref={heroAnim.ref}>
          <div className="lp-mockup">
            <div className="lp-mockup-bar">
              <span className="lp-dot lp-dot-red" />
              <span className="lp-dot lp-dot-yellow" />
              <span className="lp-dot lp-dot-green" />
              <span className="lp-mockup-title">Asset Registry — OHPC EAMS</span>
            </div>
            <div className="lp-mockup-body">
              <div className="lp-mockup-sidebar">
                <div className="lp-ms-logo">A1</div>
                {['📋 Assets', '📁 Directory', '🔎 Audit', '⚙️ Settings'].map(i => (
                  <div key={i} className={`lp-ms-item ${i.startsWith('📋') ? 'active' : ''}`}>{i}</div>
                ))}
              </div>
              <div className="lp-mockup-main">
                <div className="lp-mockup-header">
                  <div className="lp-mockup-search">🔍 Search assets…</div>
                  <div className="lp-mockup-actions">
                    <span className="lp-ma-btn">+ Add Asset</span>
                    <span className="lp-ma-btn lp-ma-btn--green">↓ Export</span>
                  </div>
                </div>
                <div className="lp-mockup-table">
                  <div className="lp-mt-header">
                    <span>Sl No</span><span>Asset Name</span><span>Type</span><span>Classification</span><span>Status</span>
                  </div>
                  {[
                    ['01', 'Dell PowerEdge R740', 'Server', 'Confidential', 'Active'],
                    ['02', 'Cisco ASA 5500', 'Firewall', 'Restricted', 'Active'],
                    ['03', 'SCADA HMI Unit-4', 'OT Device', 'Restricted', 'Active'],
                    ['04', 'VMware vSphere Lic.', 'Software', 'Internal', 'Warning'],
                    ['05', 'HP ProLiant DL360', 'Server', 'Confidential', 'Active'],
                  ].map(([no, name, type, cls, status]) => (
                    <div key={no} className="lp-mt-row">
                      <span className="lp-mt-mono">{no}</span>
                      <span className="lp-mt-bold">{name}</span>
                      <span className="lp-mt-muted">{type}</span>
                      <span className={`lp-mt-badge lp-cls-${cls.toLowerCase()}`}>{cls}</span>
                      <span className={`lp-mt-status lp-status-${status.toLowerCase()}`}>{status}</span>
                    </div>
                  ))}
                </div>
                <div className="lp-mockup-footer">
                  <span>Showing 5 of 6 assets · Last synced just now</span>
                  <span className="lp-mf-badge">🔒 Audit chain verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ STATS BAR ════════════════ */}
      <div ref={statsAnim.ref} className={`lp-stats ${statsAnim.inView ? 'lp-anim-in' : 'lp-anim-out'}`}>
        <div className="lp-stats-inner">
          {STATS.map(s => (
            <div key={s.label} className="lp-stat">
              <div className="lp-stat-value">{s.value}</div>
              <div className="lp-stat-label">{s.label}</div>
              <div className="lp-stat-sub">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════ LOGIN SECTION ════════════════ */}
      <section id="login" className="lp-section lp-section--alt">
        <div
          ref={loginAnim.ref}
          className={`lp-login-wrap ${loginAnim.inView ? 'lp-anim-in' : 'lp-anim-out'}`}
        >
          {/* Left copy */}
          <div className="lp-login-copy">
            <div className="lp-section-tag">Secure Access</div>
            <h2 className="lp-section-title" style={{ textAlign: 'left' }}>
              Ready to Take<br /><span className="lp-gradient-text">Command?</span>
            </h2>
            <p className="lp-section-desc" style={{ textAlign: 'left', maxWidth: '400px' }}>
              Log in with your OHPC credentials to access the full Asset Management Portal.
            </p>
          </div>

          {/* Right login form */}
          <div className="lp-login-form-wrap">
            <div className="lp-login-form-card">
              <div className="lp-login-form-header">
                <div className="lp-login-form-logo">
                  <div className="lp-login-logo-icon">A1</div>
                  <div>
                    <div className="lp-login-form-title">AssetOne Portal</div>
                    <div className="lp-login-form-sub">OHPC Enterprise Asset Management</div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="lp-login-form">
                {loginError && (
                  <div className="lp-login-error">
                    <span>⚠️</span>
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="lp-field">
                  <label className="lp-label">Username</label>
                  <input
                    className="lp-input"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="e.g. admin.hq"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>

                <div className="lp-field">
                  <label className="lp-label">Password</label>
                  <input
                    className="lp-input"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="lp-login-submit" disabled={logging}>
                  {logging ? (
                    <><span className="lp-spinner" /> Authenticating…</>
                  ) : (
                    <>🔐 Sign in to EAMS</>
                  )}
                </button>
              </form>

              <div className="lp-demo-section">
                <div className="lp-demo-label">
                  <span className="lp-demo-line" />
                  <span>Demo Quick Access</span>
                  <span className="lp-demo-line" />
                </div>
                <div className="lp-demo-grid">
                  {DEMO_USERS.map(u => (
                    <button
                      key={u.username}
                      className="lp-demo-btn"
                      onClick={() => fillDemo(u.username)}
                      type="button"
                      style={{ '--accent': u.color } as React.CSSProperties}
                    >
                      <span className="lp-demo-role" style={{ color: u.color }}>{u.label}</span>
                      <span className="lp-demo-user">{u.username}</span>
                    </button>
                  ))}
                </div>
                <p className="lp-demo-note">
                  All demo accounts · password: <code>password123</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FEATURES ════════════════ */}
      <section id="features" className="lp-section">
        <div
          ref={featuresAnim.ref}
          className={`lp-section-header ${featuresAnim.inView ? 'lp-anim-in' : 'lp-anim-out'}`}
        >
          <div className="lp-section-tag">Platform Capabilities</div>
          <h2 className="lp-section-title">Everything You Need to Govern Assets</h2>
          <p className="lp-section-desc">
            Built for OHPC's operational complexity — from IT servers to OT field devices,
            with security-first design at every layer.
          </p>
        </div>

        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`lp-feature-card ${featuresAnim.inView ? 'lp-anim-in' : 'lp-anim-out'}`}
              style={{
                transitionDelay: `${i * 80}ms`,
                '--glow': f.glow,
              } as React.CSSProperties}
            >
              <div className="lp-feature-icon-wrap">
                <span className="lp-feature-icon">{f.icon}</span>
              </div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section id="how-it-works" className="lp-section lp-section--alt">
        <div
          ref={stepsAnim.ref}
          className={`lp-section-header ${stepsAnim.inView ? 'lp-anim-in' : 'lp-anim-out'}`}
        >
          <div className="lp-section-tag">Getting Started</div>
          <h2 className="lp-section-title">Three Steps to Full Visibility</h2>
          <p className="lp-section-desc">
            Onboard in minutes. EAMS is designed for immediate productivity —
            no complex setup, no training overhead.
          </p>
        </div>

        <div className="lp-steps">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`lp-step ${stepsAnim.inView ? 'lp-anim-in' : 'lp-anim-out'}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {i < STEPS.length - 1 && <div className="lp-step-connector" />}
              <div className="lp-step-num">{step.num}</div>
              <div className="lp-step-icon">{step.icon}</div>
              <h3 className="lp-step-title">{step.title}</h3>
              <p className="lp-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════ SECURITY SECTION ════════════════ */}
      <section id="security" className="lp-section">
        <div
          ref={securityAnim.ref}
          className={`lp-security ${securityAnim.inView ? 'lp-anim-in' : 'lp-anim-out'}`}
        >
          <div className="lp-security-text">
            <div className="lp-section-tag">Security Architecture</div>
            <h2 className="lp-section-title" style={{ textAlign: 'left' }}>
              Built on a<br /><span className="lp-gradient-text">Cryptographic Foundation</span>
            </h2>
            <p className="lp-section-desc" style={{ textAlign: 'left', maxWidth: '460px' }}>
              Every asset change is hashed with PBKDF2-HMAC-SHA256 and chained
              with the previous entry — creating a tamper-evident, immutable audit ledger.
            </p>
            <div className="lp-security-bullets">
              {[
                ['🔑', 'JWT Authentication', '12-hour session tokens with role claims'],
                ['⛓️', 'Audit Chain Verification', 'Cryptographic hash linking every event'],
                ['🔏', 'Password-Auth Actions', 'Bulk transfers require password re-confirmation'],
                ['🪪', 'RBAC Enforcement', 'Server-side role checks on every endpoint'],
              ].map(([icon, title, sub]) => (
                <div key={title} className="lp-security-bullet">
                  <span className="lp-sb-icon">{icon}</span>
                  <div>
                    <div className="lp-sb-title">{title}</div>
                    <div className="lp-sb-sub">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-security-visual">
            <div className="lp-chain">
              {['Genesis Block', 'Asset Added', 'Ownership Transfer', 'Classification Update', 'Audit Verified'].map((label, i) => (
                <div key={label} className="lp-chain-block" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="lp-chain-block-inner">
                    <div className="lp-chain-hash">#{String(i + 1).padStart(4, '0')}</div>
                    <div className="lp-chain-label">{label}</div>
                    <div className="lp-chain-sig">sha256: {Math.random().toString(16).slice(2, 10)}…</div>
                  </div>
                  {i < 4 && <div className="lp-chain-link">↓</div>}
                </div>
              ))}
              <div className="lp-chain-verified">✅ Chain Integrity Verified</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-nav-logo" style={{ width: '36px', height: '36px', fontSize: '14px' }}>A1</div>
            <div>
              <div className="lp-footer-name">AssetOne · OHPC EAMS</div>
              <div className="lp-footer-sub">Enterprise Asset Management System</div>
            </div>
          </div>
          <div className="lp-footer-links">
            {[['Features', 'features'], ['How It Works', 'how-it-works'], ['Security', 'security'], ['Login', 'login']].map(([label, id]) => (
              <button key={id} className="lp-footer-link" onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </div>
          <div className="lp-footer-copy">
            © 2026 Rohit Mohanty. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
