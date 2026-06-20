import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, getUserEntries } from '../db';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const REC_CACHE_TTL = 10 * 60 * 1000; // 10 min

function getCachedRec(uid) {
  try {
    const raw = sessionStorage.getItem(`rec_${uid}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < REC_CACHE_TTL) return data;
  } catch {
    // ignore parse errors
  }
  return null;
}

function setCachedRec(uid, data) {
  try {
    sessionStorage.setItem(`rec_${uid}`, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // ignore storage errors
  }
}

// Stats scoped to the last 7 calendar days
function calcStats(entries) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weekEntries = entries.filter(e => e.date && new Date(e.date) >= sevenDaysAgo);
  const weekTotal   = Math.round(weekEntries.reduce((s, e) => s + (e.co2e || 0), 0) * 100) / 100;
  const daysLogged  = weekEntries.length || 1;
  const dailyAvg    = Math.round((weekTotal / daysLogged) * 100) / 100;
  const projectedYr = Math.round(dailyAvg * 365);
  return { weekTotal, dailyAvg, projectedYr, daysLogged: weekEntries.length };
}

// Dots extracted at module level — no component-in-render
function LoadingDots({ colors }) {
  return (
    <div className="flex gap-1 items-center" aria-label="Loading" role="status">
      {colors.map((c, i) => (
        <div key={i} className="w-2 h-2 rounded-full animate-bounce"
          style={{ background: c, animationDelay: `${i * 150}ms` }} />
      ))}
    </div>
  );
}

function Dashboard() {
  const [profile, setProfile]               = useState(null);
  const [entries, setEntries]               = useState([]);
  const [insight, setInsight]               = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [loading, setLoading]               = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/'); return; }
      try {
        const [userData, rawEntries] = await Promise.all([
          getUserProfile(user.uid),
          getUserEntries(user.uid),
        ]);
        if (!userData?.onboardingComplete) { navigate('/onboarding'); return; }
        setProfile(userData);
        setEntries(rawEntries);
        setLoading(false);

        const cached = getCachedRec(user.uid);
        if (cached) { setInsight(cached); return; }

        const { lat, lon } = userData.location || {};
        if (!lat || !lon) return;

        const { weekTotal } = calcStats(rawEntries);
        setInsightLoading(true);
        try {
          const res = await fetch(
            `${BACKEND_URL}/api/recommendation?lat=${lat}&lon=${lon}&commuteMode=${userData.commuteMode}&recentCo2e=${weekTotal}`,
            { signal: AbortSignal.timeout(8000) }
          );
          if (res.ok) {
            const data = await res.json();
            setInsight(data);
            setCachedRec(user.uid, data);
          }
        } catch (fetchErr) {
          console.warn('Recommendation unavailable:', fetchErr.message);
        } finally {
          setInsightLoading(false);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [navigate]);

  if (loading) return (
    <div className="text-center mt-20" role="status" aria-label="Loading dashboard">
      <div className="text-6xl mb-4 animate-bounce" aria-hidden="true">🌍</div>
      <p className="text-lg font-medium" style={{ color: '#7a9e8c' }}>Loading your eco-pulse…</p>
    </div>
  );
  if (!profile) return null;

  const streak = profile.streak || 0;
  const plantStage = Math.min(Math.floor(streak / 2), 4);
  const plantEmojis = ['🌱','🌿','🪴','🌳','🌍'];
  const plantLabels = ['Seed','Sprout','Growing','Tree','Earth Guardian'];
  const { weekTotal, dailyAvg, projectedYr, daysLogged } = calcStats(entries);

  const aqiPal = (aqi) => {
    if (aqi >= 4) return { bg:'#fff0f0', border:'#fcc',    text:'#c0392b' };
    if (aqi === 3) return { bg:'#fffbeb', border:'#fde68a', text:'#b45309' };
    return              { bg:'#e8f5e9', border:'#a8d5a2',  text:'#2d6a4f' };
  };
  const pal = insight ? aqiPal(insight.aqi) : { bg:'#fff', border:'#e2ded8', text:'#2d6a4f' };

  return (
    <div className="space-y-5 py-2">

      {/* Welcome */}
      <section aria-label="User status" className="rounded-2xl p-5 flex justify-between items-center shadow-sm"
        style={{ background:'linear-gradient(135deg,#d4edda 0%,#e3f4f4 100%)', border:'1px solid #b8dde0' }}>
        <div>
          <h2 className="text-xl font-extrabold" style={{ color:'#1e3a2f' }}>Welcome back! 👋</h2>
          <p className="text-sm mt-1" style={{ color:'#4a7c6f' }}>
            🔥 <strong>{streak}</strong> day{streak!==1?'s':''} streak &nbsp;·&nbsp;
            <span style={{ color:'#52b788', fontWeight:700 }}>{plantLabels[plantStage]}</span>
          </p>
          {profile.location?.city && (
            <p className="text-xs mt-0.5" style={{ color:'#9db8a4' }}>📍 {profile.location.city}</p>
          )}
        </div>
        <div className="text-7xl" role="img" aria-label={`Plant growth stage: ${plantLabels[plantStage]}`}>
          {plantEmojis[plantStage]}
        </div>
      </section>

      {/* AQI + AI */}
      <div className="grid md:grid-cols-2 gap-4">
        <section aria-label="Air quality" className="rounded-2xl p-5 shadow-sm"
          style={{ background:pal.bg, border:`1.5px solid ${pal.border}` }}>
          <h3 className="font-bold mb-3" style={{ color:'#1e3a2f' }}>🌬️ Local Air Quality</h3>
          {insightLoading
            ? <LoadingDots colors={['#a8d5a2','#7ec8c8','#b8a9e0']} />
            : insight
              ? <>
                  <div className="text-4xl font-extrabold" style={{ color:pal.text }}>{insight.aqiText}</div>
                  <div className="text-sm mt-1" style={{ color:'#7a9e8c' }}>Level {insight.aqi} / 5</div>
                </>
              : <p className="text-sm italic" style={{ color:'#9db8a4' }}>AQI unavailable</p>
          }
        </section>

        <section aria-label="AI daily insight" className="rounded-2xl p-5 shadow-sm"
          style={{ background:'#ede9fb', border:'1.5px solid #c4b5fd' }}>
          <h3 className="font-bold mb-3" style={{ color:'#4c3b8a' }}>🤖 Daily AI Insight</h3>
          {insightLoading
            ? <LoadingDots colors={['#c4b5fd','#c4b5fd','#c4b5fd']} />
            : <p className="text-sm italic leading-relaxed" style={{ color:'#3d3066' }}>
                &ldquo;{insight?.recommendation || 'Log an activity to get your personalised AI insight!'}&rdquo;
              </p>
          }
        </section>
      </div>

      {/* Weekly summary */}
      {daysLogged > 0 && (
        <section aria-label="Weekly carbon summary" className="rounded-2xl p-5 shadow-sm"
          style={{ background:'#fff', border:'1px solid #e8e4de' }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold" style={{ color:'#2d4a3e' }}>📊 Last 7 Days Summary</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'#d4edda', color:'#2d6a4f' }}>
              {daysLogged} day{daysLogged !== 1 ? 's' : ''} logged
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { v:weekTotal,    l:'kg CO₂e (7 days)',   bg:'#d4edda', c:'#2d6a4f', tip:`Sum of your last 7 days` },
              { v:dailyAvg,     l:'kg CO₂e / day avg',  bg:'#b8dff0', c:'#1a5276', tip:`${weekTotal} ÷ ${daysLogged} days logged` },
              { v:projectedYr,  l:'kg CO₂e / year est', bg:'#dcd6f7', c:'#5b4d8f', tip:`${dailyAvg} kg/day × 365 days` },
            ].map(s => (
              <div key={s.l} className="rounded-xl p-3" style={{ background:s.bg }} title={s.tip}>
                <div className="text-2xl font-extrabold" style={{ color:s.c }}>{s.v}</div>
                <div className="text-xs mt-0.5" style={{ color:s.c, opacity:0.75 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2 text-center" style={{ color:'#9db8a4' }}>
            Hover stats to see formula ·{' '}
            <Link to="/trend" className="underline" style={{ color:'#52b788' }}>full breakdown →</Link>
          </p>
        </section>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link to="/log" aria-label="Log today's activity"
          className="flex-1 text-center py-3 rounded-xl font-bold text-white shadow-sm transition hover:opacity-90"
          style={{ background:'linear-gradient(135deg,#52b788,#40b5b5)' }}>
          + Log Activity
        </Link>
        <Link to="/trend" aria-label="View carbon trends"
          className="flex-1 text-center py-3 rounded-xl font-bold transition hover:opacity-90"
          style={{ background:'#fff', color:'#52b788', border:'1.5px solid #a8d5a2' }}>
          View Trends 📈
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
