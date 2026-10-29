import React, { useState } from 'react';
import { Sparkles, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ title, subtitle, onDataRefresh }) {
  const { user, seedDemo } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seededSuccess, setSeededSuccess] = useState(false);

  const handleSeedDemo = async () => {
    try {
      setSeeding(true);
      await seedDemo();
      setSeededSuccess(true);
      if (onDataRefresh) {
        onDataRefresh();
      }
      setTimeout(() => setSeededSuccess(false), 3000);
    } catch (err) {
      console.error('Seed demo failed', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-lg font-bold text-navy-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSeedDemo}
          disabled={seeding}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            seededSuccess
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-white hover:bg-brand-50 text-brand-700 border-brand-200 shadow-sm hover:border-brand-300'
          }`}
          title="Pre-populate 14 days of realistic activity data to instantly test ML features and charts"
        >
          {seededSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Demo Data Loaded</span>
            </>
          ) : (
            <>
              <Sparkles className={`w-3.5 h-3.5 text-brand-600 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Generating 14d History...' : 'Seed Demo Data'}</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <div className="text-right">
          <p className="text-xs font-medium text-navy-900">Welcome, {user?.name || 'Explorer'}</p>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ML Models Online
          </span>
        </div>
      </div>
    </header>
  );
}
