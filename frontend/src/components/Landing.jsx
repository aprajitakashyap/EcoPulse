import { Link } from 'react-router-dom';

const features = [
  { icon: '📊', title: 'Track Your Carbon Footprint', color: '#d4edda',
    desc: 'Log transport, diet & energy in 30 seconds. Instant CO₂e using DEFRA/EPA factors.' },
  { icon: '🤖', title: 'AI-Powered Daily Insights', color: '#dcd6f7',
    desc: 'Gemini 2.5 Flash reads your habits + local AQI and gives one sharp, personalised tip.' },
  { icon: '🌬️', title: 'Real-Time Air Quality', color: '#b8dff0',
    desc: 'Live AQI for your city. Know when to bike, walk, or stay indoors.' },
  { icon: '📈', title: 'Visual Trends', color: '#fde8d8',
    desc: 'Colour-coded bar charts. Watch your footprint shrink week over week.' },
  { icon: '🔥', title: 'Streaks & Plant Growth', color: '#fef9c3',
    desc: 'Build daily habits. Your plant grows from 🌱 Seed all the way to 🌍 Earth Guardian.' },
  { icon: '🔒', title: 'Secure & Private', color: '#f0e6ff',
    desc: 'Firebase Auth + Firestore with row-level security. Your data stays yours.' },
];

const steps = [
  { number: '01', emoji: '✉️', title: 'Sign Up', desc: 'Email or Google — no credit card needed.', color: '#d4edda' },
  { number: '02', emoji: '📍', title: 'Set Your Profile', desc: 'City, commute mode & diet type.', color: '#b8dff0' },
  { number: '03', emoji: '📝', title: 'Log Daily Activity', desc: 'Transport + food + energy in 30 sec.', color: '#dcd6f7' },
  { number: '04', emoji: '✨', title: 'Get AI Insight', desc: 'One personalised Gemini tip, every day.', color: '#fde8d8' },
];

const stats = [
  { value: '4.7t', label: 'Avg annual CO₂e / person', emoji: '🌡️' },
  { value: '30s',  label: 'To log an activity',        emoji: '⚡' },
  { value: '5',    label: 'AQI levels tracked live',    emoji: '🌬️' },
  { value: '100%', label: 'Free forever',               emoji: '🎉' },
];

const plants = [
  { e: '🌱', l: 'Seed' }, { e: '🌿', l: 'Sprout' }, { e: '🪴', l: 'Growing' },
  { e: '🌳', l: 'Tree' }, { e: '🌍', l: 'Guardian' },
];

export default function Landing() {
  return (
    <div className="min-h-screen text-gray-800" style={{ background: '#faf9f6' }}>

      {/* ── Sticky Nav ── */}
      <nav className="sticky top-0 z-50 px-6 py-3 flex justify-between items-center"
        style={{ background: 'rgba(250,249,246,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8e4de' }}>
        <span className="text-xl font-bold" style={{ color: '#2d6a4f' }}>🌍 EcoPulse</span>
        <div className="flex gap-3">
          <Link to="/auth"
            className="text-sm font-semibold px-4 py-2 rounded-xl transition hover:opacity-80"
            style={{ color: '#2d6a4f' }}>
            Sign In
          </Link>
          <Link to="/auth"
            className="text-sm font-bold px-5 py-2 rounded-xl shadow-sm transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #a8d5a2 0%, #7ec8c8 100%)', color: '#fff' }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6 text-center"
        style={{ background: 'linear-gradient(160deg, #e8f5e9 0%, #e3f4f4 35%, #ede9fb 70%, #fdf4eb 100%)' }}>

        {/* Blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: '#a8d5a2', transform: 'translate(-40%, -40%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: '#b8a9e0', transform: 'translate(30%, 30%)' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: '#7ec8c8', transform: 'translate(-50%, -50%)' }} />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(168,213,162,0.3)', color: '#2d6a4f', border: '1px solid #a8d5a2' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#52b788' }} />
            Powered by Gemini 2.5 Flash + Firebase
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Know Your Impact.<br />
            <span className="hero-gradient-text">Act on It Daily.</span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#4a7c6f' }}>
            EcoPulse tracks your carbon footprint, monitors local air quality in real time,
            and delivers one AI-powered action every single day.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/auth"
              className="font-bold px-8 py-4 rounded-2xl shadow-lg text-lg transition hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #52b788 0%, #40b5b5 100%)', color: '#fff' }}>
              Start Tracking Free →
            </Link>
            <a href="#how-it-works"
              className="font-semibold px-8 py-4 rounded-2xl text-lg transition hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.7)', color: '#2d6a4f', border: '1px solid #a8d5a2' }}>
              See How It Works
            </a>
          </div>

          {/* Plant growth row */}
          <div className="flex justify-center gap-4 sm:gap-8">
            {plants.map((p, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`text-3xl sm:text-4xl transition-transform hover:scale-125 ${i === 4 ? 'scale-125' : ''}`}>
                  {p.e}
                </div>
                <span className="text-xs font-medium" style={{ color: '#6b9e78' }}>{p.l}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: '#9db8a4' }}>Your plant grows as your daily streak builds</p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="py-10 px-6" style={{ background: 'linear-gradient(90deg, #52b788 0%, #40b5b5 50%, #7b6ec8 100%)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="text-3xl mb-1">{s.emoji}</div>
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#1e3a2f' }}>
            Everything you need to go greener
          </h2>
          <p style={{ color: '#7a9e8c' }}>From raw data to AI insights — EcoPulse covers the full loop.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="card-lift rounded-2xl p-6 border"
              style={{ background: f.color, borderColor: 'transparent' }}>
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-base mb-2" style={{ color: '#1e3a2f' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#4a6558' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 px-6"
        style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #e8f4f8 50%, #f3f0fc 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#1e3a2f' }}>Up and running in 4 steps</h2>
            <p style={{ color: '#7a9e8c' }}>No setup headaches. Under 60 seconds.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <div key={s.number} className="card-lift rounded-2xl p-6 text-center relative"
                style={{ background: '#fff', border: `2px solid ${s.color}` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl mx-auto mb-3"
                  style={{ background: s.color }}>
                  {s.emoji}
                </div>
                <div className="text-2xl font-extrabold mb-1" style={{ color: s.color.replace(')', ', 0.6)').replace('rgb', 'rgba') }}>
                  {s.number}
                </div>
                <h3 className="font-bold mb-2" style={{ color: '#1e3a2f' }}>{s.title}</h3>
                <p className="text-sm" style={{ color: '#6b8c7e' }}>{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xl z-10">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dashboard preview ── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#1e3a2f' }}>Your dashboard, at a glance</h2>
          <p style={{ color: '#7a9e8c' }}>Real data. Pastel visuals. One daily action.</p>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ border: '1px solid #e2ded8' }}>
          {/* Mock app header */}
          <div className="px-6 py-4 flex justify-between items-center"
            style={{ background: 'linear-gradient(135deg, #52b788 0%, #40b5b5 100%)' }}>
            <span className="font-bold text-white text-lg">🌍 EcoPulse</span>
            <span className="text-sm px-3 py-1 rounded-full font-medium"
              style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>Dashboard</span>
          </div>

          <div className="p-6 space-y-4" style={{ background: '#faf9f6' }}>
            {/* Welcome */}
            <div className="flex justify-between items-center rounded-2xl p-4"
              style={{ background: '#d4edda' }}>
              <div>
                <p className="font-bold" style={{ color: '#1e3a2f' }}>Welcome back! 👋</p>
                <p className="text-sm" style={{ color: '#4a7c6f' }}>🔥 Streak: <strong>7 days</strong> · <span style={{ color: '#52b788' }}>Tree</span></p>
                <p className="text-xs mt-0.5" style={{ color: '#7a9e8c' }}>Weekly CO₂e: <strong>24.5 kg</strong> · 📍 Delhi</p>
              </div>
              <div className="text-6xl">🌳</div>
            </div>

            {/* AQI + AI */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-4" style={{ background: '#e3f4f4' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#2a6b6b' }}>🌬️ Air Quality</p>
                <p className="text-3xl font-extrabold" style={{ color: '#40b5b5' }}>Fair</p>
                <p className="text-xs mt-1" style={{ color: '#6b9e9e' }}>Level 2 / 5</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: '#ede9fb' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#5b4d8f' }}>🤖 AI Insight</p>
                <p className="text-xs leading-relaxed italic" style={{ color: '#4a4270' }}>
                  "Air is fair — try biking today to cut your 3.5 kg daily footprint."
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { v: '24.5', l: 'kg CO₂e / week', bg: '#d4edda', c: '#2d6a4f' },
                { v: '3.5',  l: 'kg CO₂e / day avg', bg: '#b8dff0', c: '#1a5276' },
                { v: '1274', l: 'kg projected / yr', bg: '#dcd6f7', c: '#5b4d8f' },
              ].map(s => (
                <div key={s.l} className="rounded-2xl p-3" style={{ background: s.bg }}>
                  <p className="text-xl font-extrabold" style={{ color: s.c }}>{s.v}</p>
                  <p className="text-xs mt-0.5" style={{ color: s.c, opacity: 0.7 }}>{s.l}</p>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <div className="flex-1 py-3 rounded-xl text-center font-semibold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #52b788, #40b5b5)' }}>
                + Log Activity
              </div>
              <div className="flex-1 py-3 rounded-xl text-center font-semibold text-sm"
                style={{ background: '#fff', color: '#52b788', border: '1.5px solid #a8d5a2' }}>
                View Trends 📈
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 text-center"
        style={{ background: 'linear-gradient(160deg, #e8f5e9 0%, #e3f4f4 40%, #ede9fb 100%)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">🌍</div>
          <h2 className="text-4xl font-extrabold mb-4" style={{ color: '#1e3a2f' }}>
            Ready to reduce your footprint?
          </h2>
          <p className="text-lg mb-8" style={{ color: '#4a7c6f' }}>
            Join EcoPulse today. Free forever. No credit card needed.
          </p>
          <Link to="/auth"
            className="inline-block font-bold px-10 py-4 rounded-2xl shadow-lg text-lg transition hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #52b788 0%, #40b5b5 100%)', color: '#fff' }}>
            Create Free Account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 text-center text-sm" style={{ background: '#1e3a2f', color: '#7a9e8c' }}>
        <p className="mb-1">
          <span className="font-bold text-white">🌍 EcoPulse</span> — Built with Firebase, Gemini AI & ❤️
        </p>
        <p className="text-xs" style={{ color: '#4a6558' }}>
          Emission factors sourced from DEFRA / EPA guidelines.
        </p>
      </footer>
    </div>
  );
}
