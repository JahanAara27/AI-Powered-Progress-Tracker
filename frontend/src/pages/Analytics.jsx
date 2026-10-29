import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import api from '../api/client';
import Navbar from '../components/Navbar';

export default function Analytics() {
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [wRes, mRes] = await Promise.all([
        api.get('/analytics/weekly'),
        api.get('/analytics/monthly'),
      ]);
      setWeeklyData(wRes.data.data);
      setMonthlyData(mRes.data.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const trendData = monthlyData?.trendData || [];
  const weeklyBreakdown = weeklyData?.dailyBreakdown || [];
  const goals = monthlyData?.goals || [];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Progress Analytics"
        subtitle="Empirical historical data, variance indicators, and habit completion distributions"
        onDataRefresh={fetchAnalytics}
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Analytics High-level Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Average Completion Rate */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">30-Day Avg Rate</span>
              <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-900">
                {monthlyData?.averageCompletionRate || 0}%
              </span>
              <span className="text-xs text-slate-500">monthly mean</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Overall habit execution velocity</p>
          </div>

          {/* Activity Variance */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity Variance</span>
              <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-900">
                {monthlyData?.activityVariance !== undefined ? monthlyData.activityVariance : '0.00'}
              </span>
              <span className="text-xs text-slate-500">σ² rate variance</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {monthlyData?.activityVariance < 0.08 ? 'Low variance: highly regular routine' : 'Elevated day-to-day variance'}
            </p>
          </div>

          {/* Missed Check-ins */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Missed Check-Ins</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-900">
                {monthlyData?.totalMissed || 0}
              </span>
              <span className="text-xs text-slate-500">past 30 days</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Inactivity signals factored into ML model</p>
          </div>

          {/* Total Practice Time */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Practice</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-navy-900">
                {Math.round((monthlyData?.totalMinutes || 0) / 60 * 10) / 10}
              </span>
              <span className="text-xs text-slate-500">hours logged</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Cumulative deliberate practice depth</p>
          </div>
        </div>

        {/* 30-Day Daily Completion Trends (AreaChart) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-navy-900">30-Day Daily Completion Trend & Discipline Curve</h3>
              <p className="text-xs text-slate-500">Chronological daily completion rates showing stability and momentum over time</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              Last 30 Days
            </span>
          </div>

          <div className="h-72 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    }}
                    formatter={(val) => [`${val}%`, 'Daily Completion Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No activity history available. Seed demo data to preview.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Habit Rates and Practice Time Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Habit Completion Rates */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-navy-900">7-Day Habit Completion Rates</h3>
                <p className="text-xs text-slate-500">Completed vs Missed daily breakdowns</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {weeklyBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="completed" name="Completed" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="missed" name="Missed" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No weekly records.
                </div>
              )}
            </div>
          </div>

          {/* Daily Practice Minutes Trend */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-navy-900">Daily Practice Engagement (Minutes)</h3>
                <p className="text-xs text-slate-500">Deliberate focus duration logged per day</p>
              </div>
            </div>

            <div className="h-64 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData.slice(-14)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} unit="m" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                      formatter={(val) => [`${val} minutes`, 'Practice Time']}
                    />
                    <Line
                      type="monotone"
                      dataKey="practiceMinutes"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No practice time data available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goal Completion History Section */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900">Goal Completion Roadmap & Milestone History</h3>
              <p className="text-xs text-slate-500">Historical milestone execution velocity across all personal objectives</p>
            </div>
          </div>

          {goals.length > 0 ? (
            <div className="space-y-4 divide-y divide-slate-100">
              {goals.map((goal) => (
                <div key={goal._id} className="pt-4 first:pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-navy-900">{goal.title}</h4>
                      <p className="text-xs text-slate-500">
                        Target: {goal.targetDate} &bull; {goal.daysRemaining} days remaining
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-600">
                        {goal.completedMilestones}/{goal.totalMilestones} Milestones
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700">
                        {goal.completionPercentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${goal.completionPercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No active goals found.</div>
          )}
        </div>
      </main>
    </div>
  );
}
