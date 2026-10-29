import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  BarChart3,
  BrainCircuit,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigation = [
  { name: 'Dashboard', to: '/', icon: LayoutDashboard },
  { name: 'Habits', to: '/habits', icon: CheckSquare },
  { name: 'Goals', to: '/goals', icon: Target },
  { name: 'Analytics', to: '/analytics', icon: BarChart3 },
  { name: 'AI Predictions', to: '/predictions', icon: BrainCircuit, badge: 'ML' },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-navy-900">
              Progress<span className="text-brand-600">IQ</span>
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Predictive Tracking
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full tracking-wide">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile snippet */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-navy-900 truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-200/50 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
