import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getUserProfile, setUserProfile } from '../db';

const CITY_COORDS = {
  'delhi':{'lat':28.6139,'lon':77.2090},'new delhi':{'lat':28.6139,'lon':77.2090},
  'mumbai':{'lat':19.0760,'lon':72.8777},'bangalore':{'lat':12.9716,'lon':77.5946},
  'bengaluru':{'lat':12.9716,'lon':77.5946},'chennai':{'lat':13.0827,'lon':80.2707},
  'kolkata':{'lat':22.5726,'lon':88.3639},'hyderabad':{'lat':17.3850,'lon':78.4867},
  'pune':{'lat':18.5204,'lon':73.8567},'london':{'lat':51.5074,'lon':-0.1278},
  'new york':{'lat':40.7128,'lon':-74.0060},'san francisco':{'lat':37.7749,'lon':-122.4194},
  'paris':{'lat':48.8566,'lon':2.3522},'tokyo':{'lat':35.6762,'lon':139.6503},
  'sydney':{'lat':-33.8688,'lon':151.2093},
};

function Onboarding() {
  const [commuteMode, setCommuteMode] = useState('car');
  const [dietType, setDietType] = useState('omnivore');
  const [location, setLocation] = useState({ lat: null, lon: null, city: '' });
  const [manualCity, setManualCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { navigate('/'); return; }
      try {
        const p = await getUserProfile(user.uid);
        if (p?.onboardingComplete) navigate('/dashboard');
        else setLoading(false);
      } catch { setLoading(false); }
    });
    return () => unsub();
  }, [navigate]);

  const getLocation = () => {
    if (!('geolocation' in navigator)) { alert('Geolocation not supported. Enter city manually.'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude, city: 'Auto-detected' }),
      () => alert('Could not get location. Enter city manually.')
    );
  };

  const applyManualCity = () => {
    if (!manualCity.trim()) return;
    const key = manualCity.trim().toLowerCase();
    const match = CITY_COORDS[key];
    setLocation(match ? { ...match, city: manualCity.trim() } : { lat: 28.6139, lon: 77.2090, city: manualCity.trim() });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!location.lat) { alert('Please set your location first.'); return; }
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) { navigate('/'); return; }
      await setUserProfile(user.uid, { commuteMode, dietType, location, onboardingComplete: true, streak: 0, lastLogDate: null });
      navigate('/dashboard');
    } catch (err) { alert('Failed to save: ' + err.message); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <p style={{ color: '#7a9e8c' }}>Checking your profile...</p>
    </div>
  );

  const inputClass = "w-full p-3 rounded-xl outline-none text-sm transition";
  const inputStyle = { border: '1.5px solid #c8e6c9', background: '#f8fff8' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #e8f5e9 0%, #e3f4f4 40%, #ede9fb 100%)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-3xl overflow-hidden shadow-xl" style={{ background: '#fff', border: '1px solid #e2ded8' }}>
          <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #a8d5a2, #7ec8c8, #b8a9e0)' }} />
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🌿</div>
              <h2 className="text-2xl font-extrabold" style={{ color: '#1e3a2f' }}>Set up your Eco Profile</h2>
              <p className="text-sm mt-1" style={{ color: '#7a9e8c' }}>Under 60 seconds — personalises your AQI & CO₂ insights.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Location */}
              <fieldset>
                <legend className="block text-sm font-bold mb-2" style={{ color: '#2d4a3e' }}>📍 Your Location</legend>
                <div className="flex gap-2 mb-2">
                  <input type="text" readOnly value={location.city || 'Not set'}
                    className={`${inputClass} flex-1`} style={{ ...inputStyle, color: '#7a9e8c' }}
                    aria-label="Detected location" />
                  <button type="button" onClick={getLocation}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-80"
                    style={{ background: '#d4edda', color: '#2d6a4f' }}>
                    📍 Detect
                  </button>
                </div>
                <div className="flex gap-2">
                  <label htmlFor="manual-city" className="sr-only">Enter city</label>
                  <input id="manual-city" type="text" placeholder="Or type city (e.g. Delhi)..."
                    value={manualCity} onChange={e => setManualCity(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyManualCity(); } }}
                    className={`${inputClass} flex-1`} style={inputStyle} />
                  <button type="button" onClick={applyManualCity}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition hover:opacity-80"
                    style={{ background: '#e3f4f4', color: '#2a6b6b' }}>
                    Set
                  </button>
                </div>
                {location.city && (
                  <p className="text-xs mt-2 font-medium" style={{ color: '#52b788' }}>
                    ✓ {location.city} ({location.lat?.toFixed(2)}, {location.lon?.toFixed(2)})
                  </p>
                )}
              </fieldset>

              {/* Commute */}
              <div>
                <label htmlFor="commute-mode" className="block text-sm font-bold mb-2" style={{ color: '#2d4a3e' }}>
                  🚗 Typical Commute Mode
                </label>
                <select id="commute-mode" value={commuteMode} onChange={e => setCommuteMode(e.target.value)}
                  className={inputClass} style={inputStyle}>
                  <option value="car">🚗 Car</option>
                  <option value="bus">🚌 Bus</option>
                  <option value="train">🚆 Train</option>
                  <option value="bike">🚴 Bike</option>
                  <option value="walk">🚶 Walk</option>
                </select>
              </div>

              {/* Diet */}
              <div>
                <label htmlFor="diet-type" className="block text-sm font-bold mb-2" style={{ color: '#2d4a3e' }}>
                  🥗 Diet Type
                </label>
                <select id="diet-type" value={dietType} onChange={e => setDietType(e.target.value)}
                  className={inputClass} style={inputStyle}>
                  <option value="meat_heavy">🥩 Meat Heavy</option>
                  <option value="omnivore">🍽️ Omnivore</option>
                  <option value="vegetarian">🥗 Vegetarian</option>
                  <option value="vegan">🌱 Vegan</option>
                </select>
              </div>

              <button type="submit" disabled={saving || !location.lat}
                className="w-full py-3 rounded-xl font-bold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #52b788, #40b5b5)' }}>
                {saving ? 'Saving...' : 'Complete Setup →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
