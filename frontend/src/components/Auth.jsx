import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../firebase';

function Auth() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/onboarding');
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\s*\(auth\/.*\)\.?/, ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/onboarding');
    } catch (err) {
      if (!err.message.includes('popup-closed')) {
        setError(err.message.replace('Firebase: ', '').replace(/\s*\(auth\/.*\)\.?/, ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #e8f5e9 0%, #e3f4f4 40%, #ede9fb 100%)' }}>
      <div className="w-full max-w-md">

        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium mb-6 hover:opacity-70 transition"
          style={{ color: '#2d6a4f' }}>
          ← Back to Home
        </Link>

        <div className="rounded-3xl overflow-hidden shadow-xl" style={{ background: '#fff', border: '1px solid #e2ded8' }}>
          <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #a8d5a2, #7ec8c8, #b8a9e0)' }} aria-hidden="true" />

          <div className="p-8">
            <div className="text-center mb-7">
              <div className="text-5xl mb-2" aria-hidden="true">🌍</div>
              <h1 className="text-3xl font-extrabold" style={{ color: '#1e3a2f' }}>EcoPulse</h1>
              <p className="text-sm mt-1" style={{ color: '#7a9e8c' }}>Your smart carbon &amp; air quality assistant</p>
            </div>

            <h2 className="text-lg font-bold mb-5 text-center" style={{ color: '#2d4a3e' }}>
              {isRegister ? 'Create your account' : 'Sign in to your account'}
            </h2>

            {error && (
              <div role="alert" className="p-3 rounded-xl mb-4 text-sm"
                style={{ background: '#fff0f0', color: '#c0392b', border: '1px solid #fcc' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4" noValidate>
              <div>
                <label htmlFor="auth-email" className="block text-sm font-semibold mb-1" style={{ color: '#2d4a3e' }}>
                  Email address
                </label>
                <input
                  id="auth-email" type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full p-3 rounded-xl outline-none transition text-sm"
                  style={{ border: '1.5px solid #c8e6c9', background: '#f8fff8' }}
                  onFocus={e => { e.target.style.borderColor = '#52b788'; }}
                  onBlur={e => { e.target.style.borderColor = '#c8e6c9'; }}
                />
              </div>
              <div>
                <label htmlFor="auth-password" className="block text-sm font-semibold mb-1" style={{ color: '#2d4a3e' }}>
                  Password
                </label>
                <input
                  id="auth-password" type="password" required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  aria-describedby={isRegister ? 'pw-hint' : undefined}
                  className="w-full p-3 rounded-xl outline-none transition text-sm"
                  style={{ border: '1.5px solid #c8e6c9', background: '#f8fff8' }}
                  onFocus={e => { e.target.style.borderColor = '#52b788'; }}
                  onBlur={e => { e.target.style.borderColor = '#c8e6c9'; }}
                />
                {isRegister && <p id="pw-hint" className="text-xs mt-1" style={{ color: '#9db8a4' }}>At least 6 characters</p>}
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-white transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #52b788 0%, #40b5b5 100%)' }}>
                {loading ? 'Please wait…' : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center my-5" aria-hidden="true">
              <hr className="flex-1" style={{ borderColor: '#e8f5e9' }} />
              <span className="mx-3 text-sm" style={{ color: '#9db8a4' }}>or</span>
              <hr className="flex-1" style={{ borderColor: '#e8f5e9' }} />
            </div>

            <button onClick={handleGoogle} disabled={loading}
              className="w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#fff', border: '1.5px solid #d4edda', color: '#2d4a3e' }}
              aria-label="Continue with Google">
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Continue with Google
            </button>

            <div className="mt-5 text-center text-sm">
              <button onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="font-semibold hover:underline transition" style={{ color: '#52b788' }}>
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
