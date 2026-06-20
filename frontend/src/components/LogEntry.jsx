import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, setUserProfile, addUserEntry } from '../db';
import { calculateCO2e } from '../co2_calculator';

function LogEntry() {
  const [user, setUser] = useState(null);
  const [transportMode, setTransportMode] = useState('car');
  const [distanceKm, setDistanceKm] = useState('');
  const [dietType, setDietType] = useState('omnivore');
  const [kwh, setKwh] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (!u) navigate('/'); else setUser(u); });
    return () => unsub();
  }, [navigate]);

  const handleLog = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true); setLastResult(null);
    try {
      const transportData = distanceKm ? { mode: transportMode, distanceKm: parseFloat(distanceKm) } : null;
      const dietData = { type: dietType, days: 1 };
      const energyData = kwh ? { kwh: parseFloat(kwh) } : null;
      const co2e = calculateCO2e({ transport: transportData, diet: dietData, energy: energyData });

      await addUserEntry(user.uid, { transport: transportData, diet: dietData, energy: energyData, co2e, date: new Date().toISOString() });

      const profileData = (await getUserProfile(user.uid)) || {};
      const today = new Date().toDateString();
      let newStreak = profileData.streak || 0;
      if (profileData.lastLogDate !== today) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        newStreak = profileData.lastLogDate === yesterday.toDateString() ? newStreak + 1 : 1;
        await setUserProfile(user.uid, { streak: newStreak, lastLogDate: today });
      }
      setLastResult({ co2e, streak: newStreak });
      setDistanceKm(''); setKwh('');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  if (!user) return <div className="text-center mt-10" style={{ color: '#9db8a4' }}>Checking auth...</div>;

  const previewCo2e = calculateCO2e({
    transport: distanceKm ? { mode: transportMode, distanceKm: parseFloat(distanceKm) || 0 } : null,
    diet: { type: dietType, days: 1 },
    energy: kwh ? { kwh: parseFloat(kwh) || 0 } : null,
  });

  const sectionStyle = { background: '#f8fff8', border: '1.5px solid #d4edda', borderRadius: '16px', padding: '1rem' };
  const inputClass = "w-full p-2.5 rounded-xl outline-none text-sm";
  const inputStyle = { border: '1.5px solid #c8e6c9', background: '#fff' };

  return (
    <div className="max-w-md mx-auto py-4">
      <div className="flex items-center gap-3 mb-5">
        <Link to="/dashboard" className="text-sm font-semibold hover:underline" style={{ color: '#52b788' }}>← Dashboard</Link>
        <h2 className="text-xl font-extrabold" style={{ color: '#1e3a2f' }}>Log Daily Activity</h2>
      </div>

      {/* Success banner */}
      {lastResult && (
        <div className="rounded-2xl p-4 mb-4 flex justify-between items-center"
          style={{ background: '#d4edda', border: '1.5px solid #a8d5a2' }}>
          <div>
            <p className="font-bold" style={{ color: '#1e3a2f' }}>✅ Logged!</p>
            <p className="text-sm" style={{ color: '#2d6a4f' }}>
              <strong>{lastResult.co2e} kg CO₂e</strong> · 🔥 Streak: {lastResult.streak} day{lastResult.streak !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/dashboard"
            className="px-3 py-1.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #52b788, #40b5b5)' }}>
            Dashboard
          </Link>
        </div>
      )}

      <div className="rounded-3xl overflow-hidden shadow-sm" style={{ background: '#fff', border: '1px solid #e2ded8' }}>
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #a8d5a2, #7ec8c8, #b8a9e0)' }} />
        <form onSubmit={handleLog} className="p-6 space-y-5">

          {/* Transport */}
          <fieldset style={sectionStyle}>
            <legend className="font-bold text-sm mb-3" style={{ color: '#1e3a2f' }}>🚗 Transport</legend>
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="transport-mode" className="block text-xs font-medium mb-1" style={{ color: '#7a9e8c' }}>Mode</label>
                <select id="transport-mode" value={transportMode} onChange={e => setTransportMode(e.target.value)}
                  className={inputClass} style={inputStyle}>
                  <option value="car">🚗 Car (0.20 kg/km)</option>
                  <option value="bus">🚌 Bus (0.10 kg/km)</option>
                  <option value="train">🚆 Train (0.05 kg/km)</option>
                  <option value="bike">🚴 Bike (0 kg/km)</option>
                  <option value="walk">🚶 Walk (0 kg/km)</option>
                </select>
              </div>
              <div>
                <label htmlFor="distance-km" className="block text-xs font-medium mb-1" style={{ color: '#7a9e8c' }}>Distance</label>
                <input id="distance-km" type="number" min="0" step="0.1" placeholder="km"
                  value={distanceKm} onChange={e => setDistanceKm(e.target.value)}
                  className={`${inputClass} w-24`} style={inputStyle} />
              </div>
            </div>
          </fieldset>

          {/* Diet */}
          <fieldset style={{ ...sectionStyle, background: '#f3f0fc', borderColor: '#dcd6f7' }}>
            <legend className="font-bold text-sm mb-3" style={{ color: '#1e3a2f' }}>🥗 Diet (Today)</legend>
            <label htmlFor="diet-type" className="block text-xs font-medium mb-1" style={{ color: '#7a7aaa' }}>What did you eat?</label>
            <select id="diet-type" value={dietType} onChange={e => setDietType(e.target.value)}
              className={inputClass} style={{ border: '1.5px solid #dcd6f7', background: '#fff' }}>
              <option value="meat_heavy">🥩 Meat Heavy (7 kg CO₂e/day)</option>
              <option value="omnivore">🍽️ Omnivore (5 kg CO₂e/day)</option>
              <option value="vegetarian">🥗 Vegetarian (3 kg CO₂e/day)</option>
              <option value="vegan">🌱 Vegan (2 kg CO₂e/day)</option>
            </select>
          </fieldset>

          {/* Energy */}
          <fieldset style={{ ...sectionStyle, background: '#e8f4f8', borderColor: '#b8dff0' }}>
            <legend className="font-bold text-sm mb-3" style={{ color: '#1e3a2f' }}>⚡ Energy (Optional)</legend>
            <label htmlFor="energy-kwh" className="block text-xs font-medium mb-1" style={{ color: '#5b8aa0' }}>kWh used today</label>
            <input id="energy-kwh" type="number" min="0" step="0.1" placeholder="e.g. 5"
              value={kwh} onChange={e => setKwh(e.target.value)}
              className={inputClass} style={{ border: '1.5px solid #b8dff0', background: '#fff' }} />
            <p className="text-xs mt-1" style={{ color: '#7aaabf' }}>0.4 kg CO₂e per kWh</p>
          </fieldset>

          {/* Live preview */}
          {(distanceKm || kwh) && (
            <div className="rounded-xl p-3 text-sm font-semibold text-center"
              style={{ background: 'linear-gradient(135deg, #d4edda, #e3f4f4)', color: '#1e3a2f' }}>
              Estimated CO₂e: <span className="text-lg font-extrabold" style={{ color: '#52b788' }}>{previewCo2e} kg</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #52b788, #40b5b5)' }}>
            {loading ? 'Saving...' : '💾 Save Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LogEntry;
