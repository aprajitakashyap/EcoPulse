import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function Onboarding() {
  const [commuteMode, setCommuteMode] = useState('car');
  const [dietType, setDietType] = useState('omnivore');
  const [location, setLocation] = useState({ lat: null, lon: null, city: '' });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().onboardingComplete) {
          navigate('/dashboard');
        } else {
          setLoading(false);
        }
      }
    };
    checkProfile();
  }, [navigate]);

  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          city: 'Auto-detected'
        });
      }, (error) => {
        alert("Could not get location. Please allow location access.");
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!location.lat || !location.lon) {
      alert("Please detect your location for accurate AQI data.");
      return;
    }

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        commuteMode,
        dietType,
        location,
        onboardingComplete: true,
        streak: 0,
        lastLogDate: null
      }, { merge: true });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert("Failed to save profile.");
    }
  };

  if (loading) return <div>Checking profile...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-2 text-eco-dark">Set up your Eco Profile</h2>
      <p className="text-gray-600 mb-6 text-sm">We need a few details to personalize your experience and AQI recommendations.</p>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Location</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={location.city || "Not set"} 
              className="flex-1 p-2 border rounded bg-gray-50 text-gray-500"
            />
            <button 
              type="button" 
              onClick={getLocation}
              className="bg-gray-200 text-gray-800 px-3 py-2 rounded hover:bg-gray-300 transition text-sm"
            >
              Detect
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Typical Commute</label>
          <select 
            value={commuteMode} 
            onChange={(e) => setCommuteMode(e.target.value)}
            className="w-full p-2 border rounded focus:ring-eco focus:border-eco outline-none"
          >
            <option value="car">Car</option>
            <option value="bus">Bus</option>
            <option value="train">Train</option>
            <option value="bike">Bike</option>
            <option value="walk">Walk</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
          <select 
            value={dietType} 
            onChange={(e) => setDietType(e.target.value)}
            className="w-full p-2 border rounded focus:ring-eco focus:border-eco outline-none"
          >
            <option value="meat_heavy">Meat Heavy</option>
            <option value="omnivore">Omnivore</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>

        <button type="submit" className="w-full bg-eco text-white py-2 rounded-lg font-semibold hover:bg-eco-dark transition shadow-md mt-4">
          Complete Setup
        </button>
      </form>
    </div>
  );
}

export default Onboarding;
