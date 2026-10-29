const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');
const Goal = require('../models/Goal');
const PredictionHistory = require('../models/PredictionHistory');
const { formatGoal } = require('./goalController');

function getRecentDates(count) {
  const dates = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// @desc Dashboard Overview Analytics
// @route GET /api/analytics/dashboard
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const totalHabits = await Habit.countDocuments({ userId, active: true });
    const activeGoals = await Goal.countDocuments({ userId, status: 'in_progress' });

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCheckIns = await CheckIn.find({ userId, date: todayStr });

    const completedToday = todayCheckIns.filter(c => c.status === 'completed').length;
    const todayCompletionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

    // Calculate maximum current streak
    const allCheckIns = await CheckIn.find({ userId }).sort({ date: 1 }).lean();
    let currentStreak = 0;
    let runningStreak = 0;
    const byDate = new Map();
    for (const c of allCheckIns) {
      if (!byDate.has(c.date)) {
        byDate.set(c.date, 0);
      }
      if (c.status === 'completed') {
        byDate.set(c.date, byDate.get(c.date) + 1);
      }
    }

    const sortedDates = Array.from(byDate.keys()).sort();
    for (const date of sortedDates) {
      if (byDate.get(date) > 0) {
        runningStreak += 1;
      } else {
        runningStreak = 0;
      }
    }
    currentStreak = runningStreak;

    // Weekly summary (last 7 days)
    const recent7Dates = getRecentDates(7);
    const weeklyCheckIns = await CheckIn.find({
      userId,
      date: { $in: recent7Dates },
    }).lean();

    const weeklyActivitySummary = recent7Dates.map(dateStr => {
      const dayCheckIns = weeklyCheckIns.filter(c => c.date === dateStr);
      const completed = dayCheckIns.filter(c => c.status === 'completed').length;
      const missed = dayCheckIns.filter(c => c.status === 'missed').length;
      const practiceMinutes = dayCheckIns.reduce((sum, c) => sum + (c.practiceMinutes || 0), 0);
      const rate = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : (completed > 0 ? 100 : 0);
      
      const dayName = new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' });

      return {
        date: dateStr,
        day: dayName,
        completed,
        missed,
        completionRate: rate,
        practiceMinutes,
      };
    });

    // Latest predictions from MongoDB history
    const latestConsistency = await PredictionHistory.findOne({
      userId,
      predictionType: 'consistency',
    }).sort({ createdAt: -1 });

    const latestGoal = await PredictionHistory.findOne({
      userId,
      predictionType: 'goal',
    }).sort({ createdAt: -1 }).populate('goalId', 'title targetDate');

    res.json({
      success: true,
      data: {
        totalHabits,
        activeGoals,
        todayCompletionRate,
        completedToday,
        currentStreak,
        weeklyActivitySummary,
        latestConsistencyPrediction: latestConsistency,
        latestGoalPrediction: latestGoal,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Weekly Analytics (7-day deep dive)
// @route GET /api/analytics/weekly
const getWeeklyAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const habits = await Habit.find({ userId, active: true }).lean();
    const recent7Dates = getRecentDates(7);

    const checkIns = await CheckIn.find({
      userId,
      date: { $in: recent7Dates },
    }).populate('habitId', 'title').lean();

    const habitsCount = Math.max(1, habits.length);

    const dailyBreakdown = recent7Dates.map(dateStr => {
      const dayItems = checkIns.filter(c => c.date === dateStr);
      const completed = dayItems.filter(c => c.status === 'completed').length;
      const missed = dayItems.filter(c => c.status === 'missed').length;
      const totalMinutes = dayItems.reduce((acc, c) => acc + (c.practiceMinutes || 0), 0);
      const dayRate = Math.round((completed / habitsCount) * 100);

      return {
        date: dateStr,
        day: new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' }),
        completed,
        missed,
        rate: Math.min(100, dayRate),
        practiceMinutes: totalMinutes,
      };
    });

    const totalCompleted = dailyBreakdown.reduce((sum, d) => sum + d.completed, 0);
    const totalMinutes = dailyBreakdown.reduce((sum, d) => sum + d.practiceMinutes, 0);
    const avgWeeklyRate = Math.round(
      dailyBreakdown.reduce((sum, d) => sum + d.rate, 0) / dailyBreakdown.length
    );

    res.json({
      success: true,
      data: {
        dailyBreakdown,
        totalCompleted,
        totalMinutes,
        avgWeeklyRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Monthly Analytics (30-day trends and variance)
// @route GET /api/analytics/monthly
const getMonthlyAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const habits = await Habit.find({ userId, active: true }).lean();
    const recent30Dates = getRecentDates(30);

    const checkIns = await CheckIn.find({
      userId,
      date: { $in: recent30Dates },
    }).lean();

    const habitsCount = Math.max(1, habits.length);

    let totalCompleted = 0;
    let totalMissed = 0;
    let totalMinutes = 0;
    const rates = [];

    const trendData = recent30Dates.map(dateStr => {
      const dayItems = checkIns.filter(c => c.date === dateStr);
      const completed = dayItems.filter(c => c.status === 'completed').length;
      const missed = dayItems.filter(c => c.status === 'missed').length;
      const minutes = dayItems.reduce((acc, c) => acc + (c.practiceMinutes || 0), 0);
      const rate = Math.min(100, Math.round((completed / habitsCount) * 100));

      totalCompleted += completed;
      totalMissed += missed;
      totalMinutes += minutes;
      rates.push(rate / 100);

      return {
        date: dateStr,
        completed,
        missed,
        rate,
        practiceMinutes: minutes,
      };
    });

    // Calculate statistical variance and std deviation
    const meanRate = rates.reduce((sum, r) => sum + r, 0) / (rates.length || 1);
    const variance = rates.reduce((sum, r) => sum + Math.pow(r - meanRate, 2), 0) / (rates.length || 1);
    const stdDev = Math.sqrt(variance);

    // Goal history
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        trendData,
        totalCompleted,
        totalMissed,
        totalMinutes,
        averageCompletionRate: Math.round(meanRate * 100),
        activityVariance: Number(variance.toFixed(4)),
        consistencyStdDev: Number(stdDev.toFixed(4)),
        goals: goals.map(formatGoal),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
};
