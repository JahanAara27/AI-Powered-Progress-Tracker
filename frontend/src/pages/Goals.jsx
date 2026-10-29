import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  BrainCircuit,
  Trash2,
  Edit2,
  Sparkles,
  CheckSquare,
} from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';

export default function Goals() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    milestones: [''],
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/goals');
      setGoals(res.data.goals || []);
    } catch (err) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleMilestoneToggle = async (goal, milestoneIndex) => {
    try {
      const updatedMilestones = [...goal.milestones];
      updatedMilestones[milestoneIndex].completed = !updatedMilestones[milestoneIndex].completed;

      await api.patch(`/goals/${goal._id}`, {
        milestones: updatedMilestones,
      });

      await fetchGoals();
    } catch (err) {
      console.error('Failed to update milestone', err);
    }
  };

  const handleAddMilestoneField = () => {
    setFormData({ ...formData, milestones: [...formData.milestones, ''] });
  };

  const handleRemoveMilestoneField = (index) => {
    const updated = formData.milestones.filter((_, i) => i !== index);
    setFormData({ ...formData, milestones: updated.length ? updated : [''] });
  };

  const handleMilestoneChange = (index, value) => {
    const updated = [...formData.milestones];
    updated[index] = value;
    setFormData({ ...formData, milestones: updated });
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.targetDate) return;

    const cleanedMilestones = formData.milestones
      .filter((m) => typeof m === 'string' ? m.trim() : m.title?.trim())
      .map((m) => (typeof m === 'string' ? { title: m.trim(), completed: false } : m));

    try {
      if (editingGoal) {
        await api.patch(`/goals/${editingGoal._id}`, {
          title: formData.title,
          description: formData.description,
          targetDate: formData.targetDate,
          milestones: cleanedMilestones,
        });
      } else {
        await api.post('/goals', {
          title: formData.title,
          description: formData.description,
          targetDate: formData.targetDate,
          milestones: cleanedMilestones,
        });
      }
      setShowModal(false);
      setEditingGoal(null);
      setFormData({ title: '', description: '', targetDate: '', milestones: [''] });
      await fetchGoals();
    } catch (err) {
      console.error('Failed to save goal', err);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this goal and its milestones?')) return;
    try {
      await api.delete(`/goals/${id}`);
      await fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Personal Goals & Milestones"
        subtitle="Deconstruct long-term targets into tangible milestones and forecast completion probability"
        onDataRefresh={fetchGoals}
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-navy-900">Active Goals ({goals.length})</h2>
            <p className="text-xs text-slate-500">
              Each milestone feeds the completion velocity ratio evaluated by the ML classification model.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingGoal(null);
              setFormData({ title: '', description: '', targetDate: '', milestones: ['', ''] });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 mx-auto flex items-center justify-center">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy-900">No active goals yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create a target with milestones or load demo data to view automated progress tracking and predictive modeling.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {goals.map((goal) => {
              const isPastDue = goal.daysRemaining === 0 && goal.completionPercentage < 100;
              return (
                <div
                  key={goal._id}
                  className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              goal.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-violet-100 text-violet-800'
                            }`}
                          >
                            {goal.status.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Target: {goal.targetDate}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-navy-900 mt-2">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-xs text-slate-500 mt-1">{goal.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setFormData({
                              title: goal.title,
                              description: goal.description || '',
                              targetDate: goal.targetDate,
                              milestones: goal.milestones.map((m) => ({ title: m.title, completed: m.completed })),
                            });
                            setShowModal(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded-md hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Metrics */}
                    <div className="mt-5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">
                          Milestones ({goal.completedMilestones}/{goal.totalMilestones})
                        </span>
                        <span className="font-bold text-navy-900">{goal.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${goal.completionPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones Checklist */}
                    <div className="mt-5 space-y-2 max-h-48 overflow-y-auto pr-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Milestone Tasks</p>
                      {goal.milestones?.map((m, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleMilestoneToggle(goal, idx)}
                          className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                            m.completed
                              ? 'bg-emerald-50/50 border-emerald-200/70 text-slate-500'
                              : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100/70 text-navy-900'
                          }`}
                        >
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span className={`text-xs font-medium truncate ${m.completed ? 'line-through' : ''}`}>
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Action: Days remaining & ML Prediction Trigger */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {isPastDue ? (
                        <span className="text-rose-600 font-semibold">Deadline reached</span>
                      ) : (
                        <span><strong>{goal.daysRemaining}</strong> days remaining</span>
                      )}
                    </div>

                    <button
                      onClick={() => navigate('/predictions', { state: { selectedGoalId: goal._id } })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 text-xs font-semibold border border-violet-200/60 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                      Run Goal Forecast
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create/Edit Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-navy-900">
              {editingGoal ? 'Edit Goal' : 'Define New Goal'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Add clear target milestones to track completion velocity and train predictive models.
            </p>

            <form onSubmit={handleSaveGoal} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deploy Microservices Infrastructure"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What does success look like upon completion?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1">Target Completion Date *</label>
                <input
                  type="date"
                  required
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Milestones list */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-navy-900">Milestones</label>
                  <button
                    type="button"
                    onClick={handleAddMilestoneField}
                    className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Milestone
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.milestones.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={`Milestone #${idx + 1}`}
                        value={typeof m === 'string' ? m : m.title}
                        onChange={(e) => handleMilestoneChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      {formData.milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestoneField(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                >
                  {editingGoal ? 'Save Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
