import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Server,
  Database,
  Sparkles,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Navbar from '../components/Navbar';

export default function Settings() {
  const { user, logout, seedDemo } = useAuth();
  const [healthInfo, setHealthInfo] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkHealth = async () => {
    try {
      setCheckingHealth(true);
      const res = await api.get('/health');
      setHealthInfo(res.data);
    } catch (err) {
      console.error('Failed to fetch backend health', err);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedDemo();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error('Seed demo failed', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Settings & System Diagnostics"
        subtitle="Manage user account parameters, inspect microservices topology, and test pipeline connectivity"
      />

      <main className="p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* User Account Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900">User Account</h3>
              <p className="text-xs text-slate-500">Authenticated user session information</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase">Full Name</label>
              <p className="text-sm font-semibold text-navy-900 mt-0.5">{user?.name || 'Explorer'}</p>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase">Email Address</label>
              <p className="text-sm font-semibold text-navy-900 mt-0.5">{user?.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase">Account Member Since</label>
              <p className="text-xs text-slate-600 mt-0.5">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active session'}
              </p>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase">Security Role</label>
              <p className="text-xs font-semibold text-emerald-600 mt-0.5">JWT Authorized User</p>
            </div>
          </div>
        </div>

        {/* System Topology & ML Microservice Status Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">Microservices Architecture</h3>
                <p className="text-xs text-slate-500">Real-time status of Node.js backend and Python FastAPI ML engine</p>
              </div>
            </div>

            <button
              onClick={checkHealth}
              disabled={checkingHealth}
              className="p-2 text-slate-400 hover:text-navy-900 rounded-lg hover:bg-slate-100"
              title="Refresh Service Status"
            >
              <RefreshCw className={`w-4 h-4 ${checkingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-xs font-bold text-navy-900">Main Node.js Express API</p>
                  <p className="text-[11px] text-slate-500">Port 5000 &bull; REST, JWT Auth, Mongoose Aggregations</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Operational
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-violet-600" />
                <div>
                  <p className="text-xs font-bold text-navy-900">Dedicated Python FastAPI ML Microservice</p>
                  <p className="text-[11px] text-slate-500">
                    Port 8000 &bull; Target URL: {healthInfo?.ml_service_url || 'http://127.0.0.1:8000'}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Models Loaded
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-navy-900">Database Layer</p>
                  <p className="text-[11px] text-slate-500">MongoDB Atlas / In-Memory resilient cluster</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Demo Data Management Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-navy-900">Evaluation Dataset Generator</h3>
                <p className="text-xs text-slate-500">
                  Pre-load 14 days of historical check-ins, practice sessions, and goals for evaluation
                </p>
              </div>
            </div>

            <button
              onClick={handleSeed}
              disabled={seeding}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                seedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              {seedSuccess ? '14 Days Loaded!' : seeding ? 'Generating...' : 'Seed 14-Day History'}
            </button>
          </div>
        </div>

        {/* Sign Out Card */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of ProgressIQ
          </button>
        </div>
      </main>
    </div>
  );
}
