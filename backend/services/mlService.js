const axios = require('axios');
const CheckIn = require('../models/CheckIn');
const Habit = require('../models/Habit');
const PredictionHistory = require('../models/PredictionHistory');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Aggregate user historical check-ins by date into DailyActivityRecords for ML features
 */
async function buildUserHistoricalActivities(userId) {
  const habitsCount = await Habit.countDocuments({ userId, active: true });
  const checkins = await CheckIn.find({ userId }).sort({ date: 1 }).lean();

  if (!checkins || checkins.length === 0) {
    return { activities: [], habitsCount };
  }

  // Group by date
  const byDate = new Map();
  for (const c of checkins) {
    if (!byDate.has(c.date)) {
      byDate.set(c.date, {
        date: c.date,
        completed_habits: 0,
        missed_habits: 0,
        practice_minutes: 0,
      });
    }
    const day = byDate.get(c.date);
    if (c.status === 'completed') {
      day.completed_habits += 1;
    } else {
      day.missed_habits += 1;
    }
    day.practice_minutes += Number(c.practiceMinutes || 0);
  }

  // Compute streaks and completion rates
  const sortedDates = Array.from(byDate.keys()).sort();
  const activities = [];
  let currentStreak = 0;

  for (const dateStr of sortedDates) {
    const item = byDate.get(dateStr);
    const dayTotal = Math.max(habitsCount, item.completed_habits + item.missed_habits, 1);
    const rate = Math.min(1.0, Math.max(0.0, item.completed_habits / dayTotal));

    if (item.completed_habits > 0) {
      currentStreak += 1;
    } else {
      currentStreak = 0;
    }

    activities.push({
      date: item.date,
      total_habits: dayTotal,
      completed_habits: item.completed_habits,
      missed_habits: item.missed_habits,
      completion_rate: Number(rate.toFixed(4)),
      practice_minutes: Number(item.practice_minutes.toFixed(1)),
      current_streak: currentStreak,
    });
  }

  return { activities, habitsCount };
}

/**
 * Predict 7-day Habit Consistency using FastAPI ML service
 */
async function requestConsistencyPrediction(userId) {
  const { activities, habitsCount } = await buildUserHistoricalActivities(userId);

  const payload = {
    user_id: userId.toString(),
    habits_count: habitsCount,
    historical_activities: activities,
    target_days: 7,
  };

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/consistency`, payload, {
      timeout: 5000,
    });
    const result = response.data;

    // Save prediction history to MongoDB
    await PredictionHistory.create({
      userId,
      predictionType: 'consistency',
      probability: result.prediction,
      category: result.category,
      contributingFactors: result.contributing_factors || [],
      recommendations: result.recommendations || [],
      modelVersion: result.model_version || '1.0-rf',
      insufficientData: Boolean(result.insufficient_data),
    });

    return result;
  } catch (error) {
    console.error(`[ML Service Error] Consistency prediction failed: ${error.message}`);
    // If ML service is offline, return explicit status
    return {
      prediction: null,
      category: 'Service Offline',
      prediction_horizon: '7 days',
      contributing_factors: [
        'Python ML microservice is temporarily unreachable',
        'Verify ML service is running at ' + ML_SERVICE_URL
      ],
      recommendations: [
        'Ensure ml-service is running on port 8000',
        'Check network connectivity between Node.js and FastAPI'
      ],
      model_version: 'fallback',
      insufficient_data: true,
      error: error.message
    };
  }
}

/**
 * Predict Goal Completion probability using FastAPI ML service
 */
async function requestGoalPrediction(userId, goal) {
  const { activities } = await buildUserHistoricalActivities(userId);

  const totalMilestones = (goal.milestones && goal.milestones.length > 0) ? goal.milestones.length : 1;
  const completedMilestones = (goal.milestones && goal.milestones.length > 0)
    ? goal.milestones.filter(m => m.completed).length
    : 0;

  const payload = {
    user_id: userId.toString(),
    goal_id: goal._id.toString(),
    title: goal.title,
    target_date: goal.targetDate,
    created_at: goal.createdAt ? goal.createdAt.toISOString() : null,
    total_milestones: totalMilestones,
    completed_milestones: completedMilestones,
    historical_activities: activities,
  };

  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/goal`, payload, {
      timeout: 5000,
    });
    const result = response.data;

    // Save prediction history to MongoDB
    await PredictionHistory.create({
      userId,
      goalId: goal._id,
      predictionType: 'goal',
      probability: result.prediction,
      category: result.category,
      contributingFactors: result.contributing_factors || [],
      recommendations: result.recommendations || [],
      modelVersion: result.model_version || '1.0-rf',
      insufficientData: Boolean(result.insufficient_data),
    });

    return result;
  } catch (error) {
    console.error(`[ML Service Error] Goal prediction failed: ${error.message}`);
    return {
      prediction: null,
      category: 'Service Offline',
      prediction_horizon: 'Target Date',
      contributing_factors: [
        'Python ML microservice is temporarily unreachable',
        'Verify ML service is running at ' + ML_SERVICE_URL
      ],
      recommendations: [
        'Ensure ml-service is running on port 8000',
        'Check network connectivity between Node.js and FastAPI'
      ],
      model_version: 'fallback',
      insufficient_data: true,
      error: error.message
    };
  }
}

module.exports = {
  buildUserHistoricalActivities,
  requestConsistencyPrediction,
  requestGoalPrediction,
};
