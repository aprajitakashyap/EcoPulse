import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

function LogEntry() {
  const [transportMode, setTransportMode] = useState('car');
  const [distanceKm, setDistanceKm] = useState('');
  const [dietType, setDietType] = useState('omnivore');
  const [kwh, setKwh] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLog = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      const idToken = await user.getIdToken();

      const payload = {
        transport: distanceKm ? { mode: transportMode, distanceKm: parseFloat(distanceKm) } : null,
        diet: { type: dietType, days: 1 }, // Assuming 1 day log
        energy: kwh ? { kwh: parseFloat(kwh) } : null
      };

      // 1. Send to Backend to calculate CO2e and securely add to entries collection
      const res = await fetch(`${BACKEND_URL}/api/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to log entry");
      const { co2e } = await res.json();

      // 2. Update Streak logic in Profile
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const data = userDoc.data();
      
      const today = new Date().toDateString();
      let newStreak = data.streak || 0;
      
      if (data.lastLogDate !== today) {
        // Simple streak logic: check if last log was yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (data.lastLogDate === yesterday.toDateString()) {
          newStreak += 1;
        } else {
          newStreak = 1; // Reset or start streak
        }
        await updateDoc(userRef, { streak: newStreak, lastLogDate: today });
      }

      alert(`Activity logged! Added ${co2e} kg CO2e.`);
      navigate('/dashboard');

    } catch (err) {
      console.error(err);
      alert("Error logging activity.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-eco-dark">Log Daily Activity</h2>
      
      <form onSubmit={handleLog} className="space-y-6">
        {/* Transport Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">🚗 Transport</h3>
          <div className="flex gap-4">
            <select 
              value={transportMode} 
              onChange={e => setTransportMode(e.target.value)}
              className="p-2 border rounded focus:ring-eco flex-1"
            >
              <option value="car">Car</option>
              <option value="bus">Bus</option>
              <option value="train">Train</option>
              <option value="bike">Bike</option>
              <option value="walk">Walk</option>
            </select>
            <input 
              type="number" 
              placeholder="km" 
              value={distanceKm}
              onChange={e => setDistanceKm(e.target.value)}
              className="p-2 border rounded focus:ring-eco w-24"
            />
          </div>
        </div>

        {/* Diet Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">🍔 Diet (Today)</h3>
          <select 
            value={dietType} 
            onChange={e => setDietType(e.target.value)}
            className="w-full p-2 border rounded focus:ring-eco"
          >
            <option value="meat_heavy">Meat Heavy</option>
            <option value="omnivore">Omnivore</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>

        {/* Energy Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">⚡ Energy (Optional)</h3>
          <input 
            type="number" 
            placeholder="Electricity usage in kWh" 
            value={kwh}
            onChange={e => setKwh(e.target.value)}
            className="w-full p-2 border rounded focus:ring-eco"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-eco text-white py-3 rounded-lg font-semibold hover:bg-eco-dark transition shadow-md disabled:bg-gray-400"
        >
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
      </form>
    </div>
  );
}

export default LogEntry;
