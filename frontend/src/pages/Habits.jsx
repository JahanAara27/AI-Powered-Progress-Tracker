import React, { useState, useEffect } from 'react';
import {
  Plus,
  Flame,
  Award,
  Clock,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'daily',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const [habitsRes, checkinsRes] = await Promise.all([
        api.get('/habits'),
        api.get(`/checkins?date=${todayStr}`),
      ]);
      setHabits(habitsRes.data.habits || []);
      setCheckins(checkinsRes.data.checkIns || []);
    } catch (err) {
      console.error('Failed to load habits', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveHabit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingHabit) {
        await api.patch(`/habits/${editingHabit._id}`, formData);
      } else {
        await api.post('/habits', formData);
      }
      setShowCreateModal(false);
      setEditingHabit(null);
      setFormData({ title: '', description: '', frequency: 'daily' });
      await fetchData();
    } catch (err) {
      console.error('Failed to save habit', err);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this habit and all its history?')) return;
    try {
      await api.delete(`/habits/${id}`);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete habit', err);
    }
  };

  const handleCheckin = async (habitId, status, minutes = 30) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await api.post('/checkins', {
        habitId,
        date: todayStr,
        status,
        practiceMinutes: status === 'completed' ? minutes : 0,
      });
      await fetchData();
    } catch (err) {
      console.error('Checkin failed', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Habit Management"
        subtitle="Maintain daily routines, record practice duration, and nurture unbroken streaks"
        onDataRefresh={fetchData}
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Active Habits ({habits.length})</h2>
            <p className="text-xs text-slate-500">
              Check in daily to feed the machine learning models with continuous historical signals.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingHabit(null);
              setFormData({ title: '', description: '', frequency: 'daily' });
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Habit
          </button>
        </div>

        {/* Habit Cards Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading habits...</div>
        ) : habits.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mx-auto flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-900">No habits tracked yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first habit or use the "Seed Demo Data" button in the navigation header to import a full 14-day history.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {habits.map((habit) => {
              const todayStr = new Date().toISOString().split('T')[0];
              const checkin = checkins.find(
                (c) => c.habitId?._id === habit._id || c.habitId === habit._id
              );
              const isCompleted = checkin?.status === 'completed';
              const isMissed = checkin?.status === 'missed';

              return (
                <div
                  key={habit._id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    {/* Header: Frequency badge & edit/delete */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-600">
                        {habit.frequency}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingHabit(habit);
                            setFormData({
                              title: habit.title,
                              description: habit.description || '',
                              frequency: habit.frequency || 'daily',
                            });
                            setShowCreateModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded-md hover:bg-slate-100"
                          title="Edit Habit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteHabit(habit._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                          title="Delete Habit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-navy-900 leading-snug">{habit.title}</h3>
                    {habit.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{habit.description}</p>
                    )}

                    {/* Streak counters */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70">
                        <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase">Current Streak</p>
                          <p className="text-xs font-bold text-navy-900">{habit.currentStreak || 0} days</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/70">
                        <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <p className="text-[10px] font-medium text-slate-500 uppercase">Longest Streak</p>
                          <p className="text-xs font-bold text-navy-900">{habit.longestStreak || 0} days</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Today's check-in status and practice buttons */}
                  <div className="mt-5 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-slate-500">Today's Check-in</span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <Check className="w-3.5 h-3.5" /> Completed ({checkin.practiceMinutes || 30}m)
                        </span>
                      )}
                      {isMissed && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500">
                          <X className="w-3.5 h-3.5" /> Marked Missed
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleCheckin(habit._id, 'completed', 30)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                          isCompleted
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Done (30m)
                      </button>

                      <button
                        onClick={() => handleCheckin(habit._id, 'completed', 60)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                          isCompleted && checkin.practiceMinutes >= 60
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Deep (60m)
                      </button>

                      <button
                        onClick={() => handleCheckin(habit._id, 'missed', 0)}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                          isMissed
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        Missed
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal for Create/Edit Habit */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-navy-900">
              {editingHabit ? 'Edit Habit' : 'Create New Habit'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Define a routine to track daily consistency and practice duration.
            </p>

            <form onSubmit={handleSaveHabit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Habit Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems Reading"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Specific purpose, target resources, or daily focus..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="daily">Daily Target</option>
                  <option value="weekly">Weekly Target</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                >
                  {editingHabit ? 'Save Changes' : 'Create Habit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
