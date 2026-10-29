import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Try login with standard demo account or register if not existing
      try {
        await login('demo@progressiq.dev', 'password123');
      } catch (loginErr) {
        await register('Demo Practitioner', 'demo@progressiq.dev', 'password123');
      }
      navigate('/');
    } catch (err) {
      setError('Demo login initialization failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 mx-auto flex items-center justify-center text-white shadow-md shadow-brand-500/20 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Progress<span className="text-brand-600">IQ</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            AI-Powered Personal Progress Tracker & Machine Learning Engine
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm">
          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                !isRegister ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`py-2 rounded-lg transition-all ${
                isRegister ? 'bg-white text-navy-900 shadow-xs' : 'text-slate-500 hover:text-navy-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Ada Lovelace"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy-900 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Processing...' : isRegister ? 'Register Account' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Login Option */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Instant Demo Access (One-Click)</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Instantly signs into an evaluation account with pre-loaded data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
