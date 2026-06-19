import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import LogEntry from './components/LogEntry';
import TrendView from './components/TrendView';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-eco-light">Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-eco-light text-gray-900 font-sans">
        <header className="bg-eco text-white p-4 shadow-md flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">EcoPulse</h1>
          {user && (
            <button 
              onClick={() => auth.signOut()} 
              className="text-sm bg-eco-dark px-3 py-1 rounded hover:bg-green-800 transition"
            >
              Sign Out
            </button>
          )}
        </header>

        <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
            <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/" />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/log" element={user ? <LogEntry /> : <Navigate to="/" />} />
            <Route path="/trend" element={user ? <TrendView /> : <Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
