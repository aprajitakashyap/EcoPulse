import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserEntries, deleteUserEntry } from '../db';

// ── Correct stats ────────────────────────────────────────────────────
function calcStats(entries) {
  if (!entries.length) return { total: 0, dailyAvg: 0, projectedYr: 0, best: 0, worst: 0 };
  const total      = Math.round(entries.reduce((s, e) => s + (e.co2e || 0), 0) * 100) / 100;
  const dailyAvg   = Math.round((total / entries.length) * 100) / 100;
  const projectedYr = Math.round(dailyAvg * 365);
  const best       = Math.min(...entries.map(e => e.co2e || 0));
  const worst      = Math.max(...entries.map(e => e.co2e || 0));
  return { total, dailyAvg, projectedYr, best, worst };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function BreakdownBadge({ entry }) {
  const parts = [];
  if (entry.transport?.distanceKm)
    parts.push(`🚗 ${entry.transport.distanceKm}km ${entry.transport.mode}`);
  if (entry.diet?.type)
    parts.push(`🥗 ${entry.diet.type}`);
  if (entry.energy?.kwh)
    parts.push(`⚡ ${entry.energy.kwh}kWh`);
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {parts.map(p => (
        <span key={p} className="text-xs px-2 py-0.5 rounded-full"
          style={{ background:'#f0f0f0', color:'#555' }}>{p}</span>
      ))}
    </div>
  );
}

function DeleteConfirm({ entry, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background:'rgba(0,0,0,0.35)' }}
      onClick={onCancel}>
      <div className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        style={{ background:'#fff' }}
        onClick={e => e.stopPropagation()}>
        <div className="text-3xl mb-3 text-center">🗑️</div>
        <h3 className="text-lg font-extrabold text-center mb-1" style={{ color:'#1e3a2f' }}>Delete this entry?</h3>
        <p className="text-sm text-center mb-1" style={{ color:'#7a9e8c' }}>{formatDate(entry.date)}</p>
        <p className="text-center font-bold text-lg mb-4" style={{ color:'#c0392b' }}>{entry.co2e} kg CO₂e</p>
        <BreakdownBadge entry={entry} />
        <p className="text-xs mt-3 text-center" style={{ color:'#aaa' }}>This will be removed from your history and stats.</p>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold transition hover:opacity-80"
            style={{ background:'#f0f0f0', color:'#555' }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-bold text-white transition hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#f87171,#ef4444)' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function TrendView() {
  const [entries, setEntries]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [userId, setUserId]           = useState(null);
  const [toDelete, setToDelete]       = useState(null);   // entry pending confirm
  const [justDeleted, setJustDeleted] = useState(null);   // for undo toast
  const [undoTimer, setUndoTimer]     = useState(null);

  const loadEntries = useCallback(async (uid) => {
    const data = await getUserEntries(uid);
    setEntries([...data].sort((a, b) => new Date(b.date||0) - new Date(a.date||0)));
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.uid);
      try { await loadEntries(user.uid); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, [loadEntries]);

  // ── Delete flow ──────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!toDelete || !userId) return;
    const entry = toDelete;
    setToDelete(null);

    // Optimistic UI
    setEntries(prev => prev.filter(e =>
      !(e.id && entry.id && e.id === entry.id) && !(e.timestamp === entry.timestamp)
    ));

    // Actually delete
    await deleteUserEntry(userId, entry);

    // Show undo toast for 5 s
    setJustDeleted(entry);
    const t = setTimeout(() => setJustDeleted(null), 5000);
    setUndoTimer(t);
  };

  const handleUndo = async () => {
    if (!justDeleted || !userId) return;
    clearTimeout(undoTimer);
    setJustDeleted(null);

    // Re-add the entry (addUserEntry is imported inline to avoid circular, use db directly)
    const { addUserEntry } = await import('../db');
    await addUserEntry(userId, {
      transport: justDeleted.transport,
      diet: justDeleted.diet,
      energy: justDeleted.energy,
      co2e: justDeleted.co2e,
      date: justDeleted.date,
    });
    await loadEntries(userId);
  };

  if (loading) return (
    <div className="text-center mt-20">
      <div className="text-5xl mb-3">📊</div>
      <p style={{ color:'#7a9e8c' }}>Loading trends...</p>
    </div>
  );

  // Chart uses oldest→newest order
  const chartEntries = [...entries].sort((a, b) => new Date(a.date||0) - new Date(b.date||0));
  const { total, dailyAvg, projectedYr, best, worst } = calcStats(entries);
  const maxCo2e = worst || 1;
  const chartH = 160, barW = 40, barSpacing = 60;
  const chartW = chartEntries.length * barSpacing + 20;

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4">

      {/* Delete confirm modal */}
      {toDelete && (
        <DeleteConfirm
          entry={toDelete}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {/* Undo toast */}
      {justDeleted && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
          style={{ background:'#1e3a2f', color:'#fff', minWidth:'260px' }}>
          <span className="text-sm flex-1">Entry deleted</span>
          <button onClick={handleUndo}
            className="text-sm font-bold px-3 py-1 rounded-lg transition hover:opacity-80"
            style={{ background:'#52b788', color:'#fff' }}>
            Undo
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold" style={{ color:'#1e3a2f' }}>📈 Carbon Trends</h2>
        <Link to="/dashboard" className="text-sm font-semibold hover:underline" style={{ color:'#52b788' }}>← Back</Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-2xl p-12 text-center shadow-sm" style={{ background:'#fff', border:'1px solid #e2ded8' }}>
          <div className="text-5xl mb-4">🌱</div>
          <p className="font-bold" style={{ color:'#1e3a2f' }}>No entries yet</p>
          <p className="text-sm mt-1" style={{ color:'#9db8a4' }}>Start logging to see your trends here.</p>
          <Link to="/log"
            className="inline-block mt-4 px-6 py-2 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
            style={{ background:'linear-gradient(135deg,#52b788,#40b5b5)' }}>
            + Log First Activity
          </Link>
        </div>
      ) : (
        <>
          {/* Stats — all correct formulas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { v: total,        l: 'Total CO₂e (kg)',  bg:'#d4edda', c:'#2d6a4f',
                tip: 'Sum of all logged entries' },
              { v: dailyAvg,     l: 'Daily avg (kg)',   bg:'#b8dff0', c:'#1a5276',
                tip: `${total} ÷ ${entries.length} days logged` },
              { v: projectedYr,  l: 'Projected / yr',  bg:'#dcd6f7', c:'#5b4d8f',
                tip: `${dailyAvg} kg/day × 365` },
              { v: best,         l: 'Best day (kg)',    bg:'#fde8d8', c:'#9a3412',
                tip: 'Lowest CO₂e day logged' },
            ].map(s => (
              <div key={s.l} className="rounded-2xl p-4 text-center shadow-sm cursor-help"
                style={{ background:s.bg }} title={s.tip}>
                <div className="text-2xl font-extrabold" style={{ color:s.c }}>{s.v}</div>
                <div className="text-xs mt-1" style={{ color:s.c, opacity:0.75 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="rounded-2xl p-6 shadow-sm overflow-x-auto" style={{ background:'#fff', border:'1px solid #e2ded8' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color:'#2d4a3e' }}>Daily CO₂e (kg)</h3>
            <svg width={Math.max(chartW, 300)} height={chartH + 50}
              viewBox={`0 0 ${Math.max(chartW, 300)} ${chartH + 50}`}
              aria-label="CO2e bar chart" role="img">
              {[0.25, 0.5, 0.75, 1].map(r => (
                <line key={r} x1={0} y1={chartH*(1-r)} x2={Math.max(chartW,300)} y2={chartH*(1-r)}
                  stroke="#f3f4f6" strokeWidth="1"/>
              ))}
              {chartEntries.map((entry, idx) => {
                const co2e = entry.co2e || 0;
                const barH = Math.max((co2e / maxCo2e) * chartH, 2);
                const x = idx * barSpacing + 10;
                const ratio = co2e / maxCo2e;
                const fill = ratio > 0.75 ? '#f9a8a8' : ratio > 0.4 ? '#93c5fd' : '#86efac';
                const shortDate = entry.date
                  ? new Date(entry.date).toLocaleDateString(undefined, { weekday:'short' })
                  : `D${idx+1}`;
                return (
                  <g key={idx}>
                    <rect x={x} y={chartH-barH} width={barW} height={barH} rx={6} fill={fill} opacity={0.9}>
                      <title>{formatDate(entry.date)}: {co2e} kg CO₂e</title>
                    </rect>
                    <text x={x+barW/2} y={chartH-barH-6} textAnchor="middle"
                      fontSize="10" fill="#374151" fontWeight="700">{co2e}</text>
                    <text x={x+barW/2} y={chartH+18} textAnchor="middle"
                      fontSize="10" fill="#9db8a4">{shortDate}</text>
                  </g>
                );
              })}
              <line x1={0} y1={chartH} x2={Math.max(chartW,300)} y2={chartH}
                stroke="#e8e4de" strokeWidth="1.5"/>
            </svg>
            <div className="flex gap-4 mt-3 text-xs justify-end" style={{ color:'#9db8a4' }}>
              {[['#86efac','Low'],['#93c5fd','Medium'],['#f9a8a8','High']].map(([bg,l]) => (
                <span key={l} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded inline-block" style={{ background:bg }}/> {l}
                </span>
              ))}
            </div>
          </div>

          {/* Entry list with delete */}
          <div className="rounded-2xl shadow-sm" style={{ background:'#fff', border:'1px solid #e2ded8' }}>
            <div className="px-6 pt-5 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold" style={{ color:'#2d4a3e' }}>All Entries</h3>
              <span className="text-xs" style={{ color:'#9db8a4' }}>Tap 🗑 to delete · Undo available for 5s</span>
            </div>
            <div className="divide-y" style={{ borderColor:'#f0ede8' }}>
              {entries.map((entry, idx) => (
                <div key={entry.id || entry.timestamp || idx}
                  className="px-6 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color:'#1e3a2f' }}>
                        {entry.co2e} kg CO₂e
                      </span>
                      {/* Best/worst badges */}
                      {entry.co2e === best && entries.length > 1 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background:'#d4edda', color:'#2d6a4f' }}>🏆 best</span>
                      )}
                      {entry.co2e === worst && entries.length > 1 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background:'#fde8d8', color:'#9a3412' }}>⬆️ highest</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color:'#9db8a4' }}>{formatDate(entry.date)}</p>
                    <BreakdownBadge entry={entry} />
                  </div>
                  <button
                    onClick={() => setToDelete(entry)}
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-80 mt-0.5"
                    style={{ background:'#fff0f0', color:'#ef4444' }}
                    aria-label="Delete entry"
                    title="Delete this entry">
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3 pb-4">
        <Link to="/log"
          className="flex-1 py-3 rounded-xl font-bold text-white text-center transition hover:opacity-90"
          style={{ background:'linear-gradient(135deg,#52b788,#40b5b5)' }}>
          + Log Today
        </Link>
        <Link to="/dashboard"
          className="flex-1 py-3 rounded-xl font-bold text-center transition hover:opacity-90"
          style={{ background:'#fff', color:'#52b788', border:'1.5px solid #a8d5a2' }}>
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}

export default TrendView;
