import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const Landing    = lazy(() => import('./components/Landing'));
const Auth       = lazy(() => import('./components/Auth'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const Dashboard  = lazy(() => import('./components/Dashboard'));
const LogEntry   = lazy(() => import('./components/LogEntry'));
const TrendView  = lazy(() => import('./components/TrendView'));
const ChatBot    = lazy(() => import('./components/ChatBot'));

function PageSpinner() {
  return (
    <div className="flex h-64 items-center justify-center" role="status" aria-label="Loading page">
      <div className="text-4xl animate-bounce">🌿</div>
    </div>
  );
}

function AppHeader({ user }) {
  const location = useLocation();
  if (['/', '/auth'].includes(location.pathname)) return null;
  return (
    <header className="px-6 py-4 flex justify-between items-center shadow-sm"
      style={{ background: 'linear-gradient(135deg, #52b788 0%, #40b5b5 100%)' }}>
      <h1 className="text-xl font-extrabold text-white tracking-tight">🌍 EcoPulse</h1>
      {user && (
        <button
          onClick={() => auth.signOut()}
          className="text-sm font-semibold px-4 py-1.5 rounded-xl transition"
          style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
          aria-label="Sign out of EcoPulse">
          Sign Out
        </button>
      )}
    </header>
  );
}

function AppRoutes({ user }) {
  const location = useLocation();
  const isAppPage = !['/','auth'].includes(location.pathname);
  return (
    <>
      <AppHeader user={user} />
      <main className={isAppPage ? 'max-w-4xl mx-auto p-4 sm:p-6 lg:p-8' : ''}>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/"           element={user ? <Navigate to="/dashboard" /> : <Landing />} />
            <Route path="/auth"       element={user ? <Navigate to="/dashboard" /> : <Auth />} />
            <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/auth" />} />
            <Route path="/dashboard"  element={user ? <Dashboard />  : <Navigate to="/auth" />} />
            <Route path="/log"        element={user ? <LogEntry />   : <Navigate to="/auth" />} />
            <Route path="/trend"      element={user ? <TrendView />  : <Navigate to="/auth" />} />
            <Route path="*"           element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <ChatBot />
      </Suspense>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #e8f5e9 0%, #e3f4f4 50%, #ede9fb 100%)' }}
        role="status" aria-label="Loading EcoPulse">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌍</div>
          <p className="text-lg font-bold" style={{ color: '#2d6a4f' }}>Loading EcoPulse...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen" style={{ background: '#faf9f6' }}>
        <AppRoutes user={user} />
      </div>
    </Router>
  );
}

export default App;
