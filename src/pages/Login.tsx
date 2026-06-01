import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, User, Lock, Loader2, Landmark } from 'lucide-react';
import api from '../api';
import { useToast } from '../components/Notification';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter both username and password.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data;

      localStorage.setItem('epms_token', token);
      localStorage.setItem('epms_user', JSON.stringify(user));

      showToast('Authentication successful. Welcome to PayMaster EPMS.', 'success');
      // Force navigation to dashboard
      navigate('/', { replace: true });
      window.location.reload(); // Refresh to trigger authenticated state load
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Login failed. Please verify credentials.';
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-3">
          <div className="bg-slate-900 text-white p-2 rounded-md">
            <Landmark className="h-7 w-7" />
          </div>
          <span className="text-2xl font-semibold text-slate-950 font-sans tracking-tight">PayMaster Ltd</span>
        </div>
        <h2 className="mt-6 text-center text-xl font-medium text-slate-800">
          Employee Payroll Management System
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500 font-mono">
          SECURE ADMINISTRATIVE PORTAL
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 rounded-md shadow-sm sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin} id="login-form">
            <div>
              <label htmlFor="username-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="username-input"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 hover:border-slate-400 transition"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 hover:border-slate-400 transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                id="login-submit-button"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-slate-900 hover:bg-slate-850 focus:outline-none focus:ring-1 focus:ring-slate-950 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Authenticating...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="rounded-md bg-slate-50 p-3 border border-slate-100">
              <span className="block text-xs font-semibold text-slate-800 font-mono tracking-wider mb-1 uppercase">
                Demo Auth Credentials
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-mono">
                <div>User: <span className="font-semibold text-slate-900">admin</span></div>
                <div>Pass: <span className="font-semibold text-slate-900">Password123</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
