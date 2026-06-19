import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return navigate('/');

        // Get Profile
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists() || !docSnap.data().onboardingComplete) {
          return navigate('/onboarding');
        }
        
        const userData = docSnap.data();
        setProfile(userData);

        // Fetch Recommendation from Backend
        const idToken = await user.getIdToken();
        const { lat, lon } = userData.location || {};
        
        if (lat && lon) {
          const res = await fetch(`${BACKEND_URL}/api/recommendation?lat=${lat}&lon=${lon}&commuteMode=${userData.commuteMode}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            setInsight(data);
          }
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) return <div className="text-center mt-10">Loading your eco-pulse...</div>;
  if (!profile) return null;

  // Simple visual plant logic (0 to 4 stages)
  const streak = profile.streak || 0;
  const plantStage = Math.min(Math.floor(streak / 2), 4);
  const plantEmojis = ['🌱', '🌿', '🪴', '🌳', '🌍'];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Welcome back!</h2>
          <p className="text-gray-500 text-sm">Your current streak: {streak} days</p>
        </div>
        <div className="text-5xl" title={`Plant growth stage ${plantStage}`}>
          {plantEmojis[plantStage]}
        </div>
      </div>

      {/* AQI & Recommendation */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Local Air Quality</h3>
          {insight ? (
            <div className="flex items-end gap-4">
              <div className={`text-4xl font-bold ${insight.aqi >= 4 ? 'text-red-500' : insight.aqi === 3 ? 'text-yellow-500' : 'text-eco'}`}>
                {insight.aqiText}
              </div>
              <div className="text-sm text-gray-500 pb-1">AQI Level: {insight.aqi}/5</div>
            </div>
          ) : (
            <p className="text-gray-500">Could not fetch AQI.</p>
          )}
        </div>

        <div className="bg-eco-light p-6 rounded-xl shadow-sm border border-green-100">
          <h3 className="text-lg font-semibold text-eco-dark mb-2">Daily AI Insight</h3>
          <p className="text-gray-800 italic">
            "{insight?.recommendation || 'Log an activity to get your daily insight.'}"
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link to="/log" className="flex-1 bg-eco text-white text-center py-3 rounded-lg font-semibold hover:bg-eco-dark transition shadow-md">
          + Log Activity
        </Link>
        <Link to="/trend" className="flex-1 bg-white text-eco border border-eco text-center py-3 rounded-lg font-semibold hover:bg-eco-light transition shadow-md">
          View Trends
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;
