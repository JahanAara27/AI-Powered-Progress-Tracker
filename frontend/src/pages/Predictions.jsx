import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  History,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import api from '../api/client';
import Navbar from '../components/Navbar';

export default function Predictions() {
  const location = useLocation();
  const [consistencyPred, setConsistencyPred] = useState(null);
  const [goalPred, setGoalPred] = useState(null);
  const [history, setHistory] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [predictingConsistency, setPredictingConsistency] = useState(false);
  const [predictingGoal, setPredictingGoal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [goalsRes, historyRes] = await Promise.all([
        api.get('/goals'),
        api.get('/predictions/history?limit=15'),
      ]);

      const loadedGoals = goalsRes.data.goals || [];
      setGoals(loadedGoals);
      setHistory(historyRes.data.history || []);

      if (loadedGoals.length > 0) {
        const passedGoalId = location.state?.selectedGoalId;
        const initialGoal = passedGoalId || loadedGoals[0]._id;
        setSelectedGoalId(initialGoal);
      }

      // Check if there is existing consistency and goal predictions in history
      const latestCons = historyRes.data.history?.find((h) => h.predictionType === 'consistency');
      const latestG = historyRes.data.history?.find((h) => h.predictionType === 'goal');

      if (latestCons) {
        setConsistencyPred({
          prediction: latestCons.probability,
          category: latestCons.category,
          prediction_horizon: '7 days',
          contributing_factors: latestCons.contributingFactors || [],
          recommendations: latestCons.recommendations || [],
          model_version: latestCons.modelVersion,
          insufficient_data: latestCons.insufficientData,
        });
      }

      if (latestG) {
        setGoalPred({
          prediction: latestG.probability,
          category: latestG.category,
          prediction_horizon: 'Target Date',
          contributing_factors: latestG.contributingFactors || [],
          recommendations: latestG.recommendations || [],
          model_version: latestG.modelVersion,
          insufficient_data: latestG.insufficientData,
        });
      }
    } catch (err) {
      console.error('Failed to load prediction setup', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handlePredictConsistency = async () => {
    try {
      setPredictingConsistency(true);
      const res = await api.post('/predictions/consistency');
      setConsistencyPred(res.data.prediction);
      // Refresh history
      const histRes = await api.get('/predictions/history?limit=15');
      setHistory(histRes.data.history || []);
    } catch (err) {
      console.error('Consistency prediction failed', err);
    } finally {
      setPredictingConsistency(false);
    }
  };

  const handlePredictGoal = async () => {
    try {
      setPredictingGoal(true);
      const res = await api.post('/predictions/goal', {
        goalId: selectedGoalId || undefined,
      });
      setGoalPred(res.data.prediction);
      // Refresh history
      const histRes = await api.get('/predictions/history?limit=15');
      setHistory(histRes.data.history || []);
    } catch (err) {
      console.error('Goal prediction failed', err);
    } finally {
      setPredictingGoal(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Navbar
        title="Predictive Machine Learning Engine"
        subtitle="Independent Scikit-learn inference service for 7-day consistency and milestone deadline forecasting"
        onDataRefresh={fetchInitialData}
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* ML Engine Status Banner & Disclaimer */}
        <div className="bg-indigo-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold tracking-wide backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-brand-300" />
              Machine Learning Backend Connected (FastAPI & Random Forest)
            </div>
            <h2 className="text-xl font-bold tracking-tight">AI Empirical Progress Forecasting</h2>
            <p className="text-xs text-indigo-200 leading-relaxed">
              ProgressIQ models temporal behavioral features—rolling completion rates (7d, 14d, 30d), streak continuity,
              activity variance, and milestone velocity—to forecast future performance without lookahead bias.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 shrink-0 z-10 text-right md:text-left">
            <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">Model Deployment</p>
            <p className="text-sm font-bold text-white mt-0.5">Scikit-learn Pipeline v1.0</p>
            <p className="text-[11px] text-indigo-200 mt-1">Supervised Classification</p>
          </div>

          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Prediction Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. Habit Consistency Prediction */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 tracking-wide uppercase">
                    Model 1: Habit Consistency
                  </span>
                  <h3 className="text-lg font-bold text-navy-900 mt-2">7-Day Consistency Probability</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Probability of sustaining your defined routine target in the next 7 calendar days.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-brand-50 text-brand-600">
                  <BrainCircuit className="w-6 h-6" />
                </div>
              </div>

              {/* Prediction Output Display */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                {consistencyPred ? (
                  consistencyPred.insufficient_data ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                      <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Insufficient Historical Activity Records</span>
                      </div>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        The consistency model requires at least <strong>3 to 7 daily check-ins</strong> to establish
                        statistically significant rolling features and activity variance.
                      </p>
                      <p className="text-xs text-slate-600">
                        Tip: Click <strong>"Seed Demo Data"</strong> in the top header to load 14 days of realistic activity!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Big Probability Gauge */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Estimated Probability
                          </p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl font-extrabold text-navy-900">
                              {Math.round(consistencyPred.prediction * 100)}%
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              (Horizon: {consistencyPred.prediction_horizon})
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                            consistencyPred.category === 'High'
                              ? 'bg-emerald-100 text-emerald-800'
                              : consistencyPred.category === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {consistencyPred.category} Confidence
                        </span>
                      </div>

                      {/* Contributing Factors */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                          Key Contributing Behavioral Factors
                        </h4>
                        <div className="space-y-1.5">
                          {consistencyPred.contributing_factors?.map((factor, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                              <span>{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          Targeted Improvement Recommendations
                        </h4>
                        <div className="space-y-1.5">
                          {consistencyPred.recommendations?.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <p>No consistency prediction generated yet.</p>
                    <p>Click below to evaluate your habit continuity using the trained Random Forest model.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trigger Button */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={handlePredictConsistency}
                disabled={predictingConsistency}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className={`w-4 h-4 ${predictingConsistency ? 'animate-spin' : ''}`} />
                {predictingConsistency ? 'Running Inference...' : 'Run Habit Consistency Forecast'}
              </button>
            </div>
          </div>

          {/* 2. Goal Completion Prediction */}
          <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 tracking-wide uppercase">
                    Model 2: Goal Completion
                  </span>
                  <h3 className="text-lg font-bold text-navy-900 mt-2">Goal Milestone Completion Forecast</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Estimate the likelihood of achieving all milestones before the designated deadline.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-violet-50 text-violet-600">
                  <Target className="w-6 h-6" />
                </div>
              </div>

              {/* Goal Selector */}
              {goals.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select Target Goal to Evaluate</label>
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {goals.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.title} ({g.completedMilestones}/{g.totalMilestones} done &bull; {g.daysRemaining}d left)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Prediction Output Display */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                {goalPred ? (
                  goalPred.insufficient_data ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Insufficient Milestone Data</span>
                      </div>
                      <p className="text-xs text-amber-700">
                        Please define at least 1 milestone for this goal to calculate completion velocity.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Big Probability Gauge */}
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            Completion Likelihood
                          </p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-4xl font-extrabold text-navy-900">
                              {Math.round(goalPred.prediction * 100)}%
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              (Horizon: {goalPred.prediction_horizon})
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                            goalPred.category === 'High'
                              ? 'bg-emerald-100 text-emerald-800'
                              : goalPred.category === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {goalPred.category} Likelihood
                        </span>
                      </div>

                      {/* Contributing Factors */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
                          Velocity & Timeline Factors
                        </h4>
                        <div className="space-y-1.5">
                          {goalPred.contributing_factors?.map((factor, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                              <span>{factor}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          Milestone Acceleration Actions
                        </h4>
                        <div className="space-y-1.5">
                          {goalPred.recommendations?.map((rec, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-violet-50/40 p-2.5 rounded-xl border border-violet-100">
                              <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 mt-0.5 shrink-0" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400 space-y-2">
                    <p>No goal prediction evaluated yet.</p>
                    <p>Choose an active goal and run the predictive milestone classifier.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trigger Button */}
            <div className="mt-8 pt-4 border-t border-slate-100">
              <button
                onClick={handlePredictGoal}
                disabled={predictingGoal || goals.length === 0}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Sparkles className={`w-4 h-4 ${predictingGoal ? 'animate-spin' : ''}`} />
                {predictingGoal ? 'Analyzing Goal Milestones...' : 'Forecast Goal Completion Likelihood'}
              </button>
            </div>
          </div>
        </div>

        {/* Prediction History Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900 flex items-center gap-2">
                <History className="w-4 h-4 text-brand-600" />
                Stored Prediction Audit History
              </h3>
              <p className="text-xs text-slate-500">
                Persistent audit log stored in MongoDB tracking model version, date, and probabilistic confidence.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{history.length} Records</span>
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">Prediction Type</th>
                    <th className="py-3 px-4 font-semibold">Target / Subject</th>
                    <th className="py-3 px-4 font-semibold">Probability</th>
                    <th className="py-3 px-4 font-semibold">Confidence Category</th>
                    <th className="py-3 px-4 font-semibold">Model Version</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-navy-900 font-medium">
                  {history.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(item.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.predictionType === 'consistency' ? 'bg-brand-50 text-brand-700' : 'bg-violet-50 text-violet-700'
                        }`}>
                          {item.predictionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {item.goalId?.title || 'Habit 7-Day Target'}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {item.probability !== null && item.probability !== undefined
                          ? `${Math.round(item.probability * 100)}%`
                          : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.category === 'High'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.category === 'Moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : item.category === 'Low'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {item.modelVersion || '1.0-rf'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No predictions recorded yet. Run a forecast above to log your first prediction.
            </div>
          )}
        </div>

        {/* Scientific Disclaimer Footer */}
        <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200/80 flex items-start gap-3 text-slate-500 text-xs">
          <ShieldAlert className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <p>
            <strong>Machine Learning Notice:</strong> Predictions generated by ProgressIQ are statistical estimations derived
            from historical rolling check-ins, velocity metrics, and persona patterns. They represent analytical guidance to
            help optimize routines and are not deterministic guarantees of future human performance.
          </p>
        </div>
      </main>
    </div>
  );
}
