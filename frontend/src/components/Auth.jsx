import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginWithEmail, registerWithEmail } from '../firebase';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
      navigate('/onboarding');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogle = async () => {
    try {
      await loginWithGoogle();
      navigate('/onboarding');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-bold mb-6 text-center text-eco-dark">
        {isRegister ? 'Join EcoPulse' : 'Welcome Back'}
      </h2>
      
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            className="mt-1 w-full p-2 border rounded focus:ring-eco focus:border-eco outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input 
            type="password" 
            required 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            className="mt-1 w-full p-2 border rounded focus:ring-eco focus:border-eco outline-none"
          />
        </div>
        <button type="submit" className="w-full bg-eco text-white py-2 rounded-lg font-semibold hover:bg-eco-dark transition shadow-md">
          {isRegister ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-center">
        <span className="text-gray-500 text-sm">or</span>
      </div>

      <button 
        onClick={handleGoogle}
        className="mt-4 w-full border border-gray-300 bg-white text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition shadow-sm flex items-center justify-center gap-2"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google logo" />
        Continue with Google
      </button>

      <div className="mt-6 text-center text-sm">
        <button onClick={() => setIsRegister(!isRegister)} className="text-eco-dark hover:underline">
          {isRegister ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
        </button>
      </div>
    </div>
  );
}

export default Auth;
