const Goal = require('../models/Goal');
const PredictionHistory = require('../models/PredictionHistory');
const {
  requestConsistencyPrediction,
  requestGoalPrediction,
} = require('../services/mlService');

// @desc Request 7-day Habit Consistency Prediction from ML Service
// @route POST /api/predictions/consistency
const predictConsistency = async (req, res, next) => {
  try {
    const result = await requestConsistencyPrediction(req.user._id);
    res.json({
      success: true,
      prediction: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Request Goal Completion Prediction from ML Service
// @route POST /api/predictions/goal
const predictGoal = async (req, res, next) => {
  try {
    const { goalId } = req.body;

    let goal = null;
    if (goalId) {
      goal = await Goal.findOne({ _id: goalId, userId: req.user._id });
    } else {
      // Find the first active goal with milestones
      goal = await Goal.findOne({ userId: req.user._id, status: 'in_progress' });
    }

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'No active goal found to predict. Please create a goal with milestones first.',
      });
    }

    const result = await requestGoalPrediction(req.user._id, goal);

    res.json({
      success: true,
      goal: {
        id: goal._id,
        title: goal.title,
        targetDate: goal.targetDate,
      },
      prediction: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get prediction history stored in MongoDB
// @route GET /api/predictions/history
const getPredictionHistory = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
    const history = await PredictionHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('goalId', 'title targetDate');

    res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  predictConsistency,
  predictGoal,
  getPredictionHistory,
};
