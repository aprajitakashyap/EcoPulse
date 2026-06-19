import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

function TrendView() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        
        const entriesRef = collection(db, 'users', user.uid, 'entries');
        const q = query(entriesRef, orderBy('timestamp', 'desc'), limit(7));
        const querySnapshot = await getDocs(q);
        
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push(doc.data());
        });
        
        // Reverse to show oldest to newest (left to right)
        setEntries(data.reverse());
      } catch (err) {
        console.error("Error fetching entries:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading trends...</div>;

  // Simple SVG bar chart setup
  const maxCo2e = Math.max(...entries.map(e => e.co2e), 10); // at least 10 for scale
  const chartHeight = 200;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Weekly Carbon Footprint</h2>
        <Link to="/dashboard" className="text-eco hover:underline text-sm font-medium">← Back</Link>
      </div>
      
      {entries.length === 0 ? (
        <p className="text-gray-500 text-center py-10">No entries yet. Start logging to see trends!</p>
      ) : (
        <div className="relative w-full h-64 flex items-end justify-between pb-8 border-b border-gray-200 px-4">
          {entries.map((entry, idx) => {
            const barHeight = (entry.co2e / maxCo2e) * chartHeight;
            const dateStr = new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' });
            return (
              <div key={idx} className="flex flex-col items-center group w-12">
                {/* Tooltip on hover */}
                <span className="opacity-0 group-hover:opacity-100 transition text-xs font-bold bg-gray-800 text-white px-2 py-1 rounded absolute -top-8 whitespace-nowrap">
                  {entry.co2e} kg
                </span>
                
                {/* Bar */}
                <div 
                  className="w-8 bg-eco hover:bg-eco-dark transition-all rounded-t-md" 
                  style={{ height: `${barHeight}px` }}
                ></div>
                
                {/* Label */}
                <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left">{dateStr}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TrendView;
