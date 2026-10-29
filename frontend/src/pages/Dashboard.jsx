import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Flame,
  Target,
  BrainCircuit,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import api from '../api/client';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [habits, setHabits] = useState([]);
  const [todayCheckins, setTodayCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, habitsRes, checkinsRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/habits'),
        api.get('/checkins'),
      ]);
      setData(dashRes.data.data);
      setHabits(habitsRes.data.habits || []);
      setTodayCheckins(checkinsRes.data.checkIns || []);
    } catch (err) {
      console.error('Error fetching dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleCheckin = async (habitId, currentStatus) => {
    try {
      setCheckingIn(habitId);
      const newStatus = currentStatus === 'completed' ? 'missed' : 'completed';
      const todayStr = new Date().toISOString().split('T')[0];
      await api.post('/checkins', {
        habitId,
        date: todayStr,
        status: newStatus,
        practiceMinutes: newStatus === 'completed' ? 30 : 0,
      });
      await fetchDashboardData();
    } catch (err) {
      console.error('Checkin toggle failed', err);
    } finally {
      setCheckingIn(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar title="Personal Dashboard" subtitle="Loading metrics..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium">Aggregating historical records & ML metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  const weeklySummary = data?.weeklyActivitySummary || [];
  const latestConsistency = data?.latestConsistencyPrediction;
  const latestGoal = data?.latestGoalPrediction;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Personal Dashboard"
        subtitle="Daily tracking overview, historical performance, and predictive signals"
        onDataRefresh={fetchDashboardData}
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Top 4 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Today's Completion */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Progress</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-900">{data?.todayCompletionRate || 0}%</span>
              <span className="text-xs text-slate-500">
                ({data?.completedToday || 0}/{data?.totalHabits || 0} habits)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data?.todayCompletionRate || 0)}%` }}
              />
            </div>
          </div>

          {/* 2. Habit Streak */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Streak</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-900">{data?.currentStreak || 0}</span>
              <span className="text-xs text-slate-500">consecutive days</span>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {data?.currentStreak && data.currentStreak > 3 ? 'Excellent momentum maintained' : 'Build momentum with daily check-ins'}
            </p>
          </div>

          {/* 3. Total Active Habits */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Habits</span>
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-900">{data?.totalHabits || 0}</span>
              <span className="text-xs text-slate-500">habits tracked</span>
            </div>
            <Link to="/habits" className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold mt-3 hover:underline">
              Manage habits <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* 4. Active Goals */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Goals</span>
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-900">{data?.activeGoals || 0}</span>
              <span className="text-xs text-slate-500">target roadmaps</span>
            </div>
            <Link to="/goals" className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold mt-3 hover:underline">
              View milestones <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Predictive AI Intelligence Showcase Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Habit Consistency Prediction */}
          <div className="bg-gradient-to-br from-white to-brand-50/40 rounded-2xl p-6 border border-brand-100 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 text-brand-700 tracking-wide uppercase">
                    ML Inference
                  </span>
                  <span className="text-xs text-slate-400">Horizon: 7 Days</span>
                </div>
                <h3 className="text-base font-bold text-navy-900 mt-2">7-Day Habit Consistency Forecast</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-brand-600 text-white shadow-xs">
                <BrainCircuit className="w-5 h-5" />
              </div>
            </div>

            {latestConsistency && !latestConsistency.insufficientData && latestConsistency.probability !== null ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-extrabold text-navy-900">
                      {Math.round(latestConsistency.probability * 100)}%
                    </span>
                    <span className="text-xs text-slate-500 ml-2">Consistency Probability</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      latestConsistency.category === 'High'
                        ? 'bg-emerald-100 text-emerald-800'
                        : latestConsistency.category === 'Moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {latestConsistency.category} Confidence
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Key Drivers</p>
                  {latestConsistency.contributingFactors?.slice(0, 2).map((factor, i) => (
                    <p key={i} className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                      {factor}
                    </p>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    to="/predictions"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
                  >
                    View detailed breakdown & recommendations <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 py-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Run your first AI consistency forecast or click <strong>Seed Demo Data</strong> in the top bar to simulate 14 days.
                </p>
                <Link
                  to="/predictions"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Run AI Consistency Model
                </Link>
              </div>
            )}
          </div>

          {/* Latest Goal Completion Prediction */}
          <div className="bg-gradient-to-br from-white to-violet-50/40 rounded-2xl p-6 border border-violet-100 shadow-xs relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 tracking-wide uppercase">
                    Milestone Model
                  </span>
                  <span className="text-xs text-slate-400">Horizon: Deadline</span>
                </div>
                <h3 className="text-base font-bold text-navy-900 mt-2">Goal Completion Probability</h3>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-600 text-white shadow-xs">
                <Target className="w-5 h-5" />
              </div>
            </div>

            {latestGoal && !latestGoal.insufficientData && latestGoal.probability !== null ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-4xl font-extrabold text-navy-900">
                      {Math.round(latestGoal.probability * 100)}%
                    </span>
                    <span className="text-xs text-slate-500 ml-2">Completion Likelihood</span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      latestGoal.category === 'High'
                        ? 'bg-emerald-100 text-emerald-800'
                        : latestGoal.category === 'Moderate'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {latestGoal.category} Probability
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contributing Signals</p>
                  {latestGoal.contributingFactors?.slice(0, 2).map((factor, i) => (
                    <p key={i} className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                      {factor}
                    </p>
                  ))}
                </div>

                <div className="pt-2">
                  <Link
                    to="/predictions"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900"
                  >
                    Inspect goal velocity & timeline <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 py-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No goal completion predictions generated yet. Select an active goal to evaluate its likelihood.
                </p>
                <Link
                  to="/predictions"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Evaluate Active Goals
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Activity Trends Chart & Today's Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Bar Chart (2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-navy-900">7-Day Completion Velocity</h3>
                <p className="text-xs text-slate-500">Daily habit completion rate across the last 7 calendar days</p>
              </div>
              <Link to="/analytics" className="text-xs font-semibold text-brand-600 hover:underline">
                Full analytics
              </Link>
            </div>

            <div className="h-64 w-full">
              {weeklySummary.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      unit="%"
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                      }}
                      formatter={(val, name) => [
                        `${val}%`,
                        name === 'completionRate' ? 'Completion Rate' : name,
                      ]}
                    />
                    <Bar dataKey="completionRate" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {weeklySummary.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.completionRate >= 75 ? '#4f46e5' : entry.completionRate >= 50 ? '#818cf8' : '#cbd5e1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No activity recorded in the past 7 days.
                </div>
              )}
            </div>
          </div>

          {/* Today's Habits Checklist (1 column) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-navy-900">Today's Check-Ins</h3>
              <Link to="/habits" className="text-xs font-semibold text-brand-600 hover:underline">
                View all
              </Link>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-72 pr-1">
              {habits.length > 0 ? (
                habits.map((habit) => {
                  const checkin = todayCheckins.find(
                    (c) => c.habitId?._id === habit._id || c.habitId === habit._id
                  );
                  const isCompleted = checkin?.status === 'completed';

                  return (
                    <div
                      key={habit._id}
                      onClick={() => handleToggleCheckin(habit._id, checkin?.status)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isCompleted
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-slate-50/80 border-slate-200/70 hover:bg-slate-100/70 text-navy-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <div className="truncate">
                          <p className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                            {habit.title}
                          </p>
                          <span className="text-[10px] text-slate-400 capitalize">{habit.frequency}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {habit.currentStreak > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            <Flame className="w-3 h-3" />
                            {habit.currentStreak}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 space-y-2">
                  <p>No habits configured yet.</p>
                  <Link
                    to="/habits"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add your first habit
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
