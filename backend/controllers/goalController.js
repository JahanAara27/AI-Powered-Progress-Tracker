const Goal = require('../models/Goal');

function formatGoal(goal) {
  const obj = goal.toObject ? goal.toObject() : goal;
  const milestones = obj.milestones || [];
  const total = milestones.length;
  const completed = milestones.filter(m => m.completed).length;
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const target = new Date(obj.targetDate);
  const now = new Date();
  const diffTime = target - now;
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    ...obj,
    totalMilestones: total,
    completedMilestones: completed,
    completionPercentage,
    daysRemaining,
  };
}

// @desc Create a new personal goal
// @route POST /api/goals
const createGoal = async (req, res, next) => {
  try {
    const { title, description, targetDate, milestones } = req.body;

    if (!title || !targetDate) {
      return res.status(400).json({ message: 'Title and targetDate (YYYY-MM-DD) are required' });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      title,
      description: description || '',
      targetDate,
      milestones: Array.isArray(milestones) ? milestones.map(m => ({
        title: typeof m === 'string' ? m : m.title,
        completed: Boolean(m.completed),
        completedAt: m.completed ? new Date() : null,
      })) : [],
    });

    res.status(201).json({
      success: true,
      goal: formatGoal(goal),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all goals for the user
// @route GET /api/goals
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      goals: goals.map(formatGoal),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update goal or milestone progress
// @route PATCH /api/goals/:id
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const { title, description, targetDate, status, milestones } = req.body;

    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (targetDate !== undefined) goal.targetDate = targetDate;
    if (status !== undefined) goal.status = status;

    if (Array.isArray(milestones)) {
      goal.milestones = milestones.map(m => ({
        title: m.title,
        completed: Boolean(m.completed),
        completedAt: m.completed ? (m.completedAt || new Date()) : null,
      }));

      // Automatically mark goal as completed if all milestones are done
      if (goal.milestones.length > 0 && goal.milestones.every(m => m.completed)) {
        goal.status = 'completed';
      }
    }

    await goal.save();

    res.json({
      success: true,
      goal: formatGoal(goal),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete goal
// @route DELETE /api/goals/:id
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await Goal.deleteOne({ _id: req.params.id, userId: req.user._id });

    res.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
  formatGoal,
};
