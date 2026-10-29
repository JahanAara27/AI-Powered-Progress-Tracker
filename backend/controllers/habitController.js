const Habit = require('../models/Habit');
const CheckIn = require('../models/CheckIn');

// Helper to compute streaks for a specific habit
async function calculateHabitStreaks(userId, habitId) {
  const checkins = await CheckIn.find({ userId, habitId }).sort({ date: 1 }).lean();
  if (!checkins || checkins.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalCompleted: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let runningStreak = 0;
  let totalCompleted = 0;

  for (const c of checkins) {
    if (c.status === 'completed') {
      runningStreak += 1;
      totalCompleted += 1;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
  }

  // Current streak is the running streak ending on or near the most recent checkin
  currentStreak = runningStreak;

  return { currentStreak, longestStreak, totalCompleted };
}

// @desc Create a new habit
// @route POST /api/habits
const createHabit = async (req, res, next) => {
  try {
    const { title, description, frequency } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const habit = await Habit.create({
      userId: req.user._id,
      title,
      description: description || '',
      frequency: frequency === 'weekly' ? 'weekly' : 'daily',
    });

    res.status(201).json({
      success: true,
      habit: {
        ...habit.toObject(),
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all habits for the user with streak statistics
// @route GET /api/habits
const getHabits = async (req, res, next) => {
  try {
    const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: -1 });

    const habitsWithStats = await Promise.all(
      habits.map(async (h) => {
        const stats = await calculateHabitStreaks(req.user._id, h._id);
        return {
          ...h.toObject(),
          ...stats,
        };
      })
    );

    res.json({
      success: true,
      habits: habitsWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update habit
// @route PATCH /api/habits/:id
const updateHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const { title, description, frequency, active } = req.body;
    if (title !== undefined) habit.title = title;
    if (description !== undefined) habit.description = description;
    if (frequency !== undefined) habit.frequency = frequency;
    if (active !== undefined) habit.active = active;

    await habit.save();
    const stats = await calculateHabitStreaks(req.user._id, habit._id);

    res.json({
      success: true,
      habit: {
        ...habit.toObject(),
        ...stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete habit
// @route DELETE /api/habits/:id
const deleteHabit = async (req, res, next) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    await Habit.deleteOne({ _id: req.params.id, userId: req.user._id });
    await CheckIn.deleteMany({ habitId: req.params.id, userId: req.user._id });

    res.json({
      success: true,
      message: 'Habit and associated check-ins deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createHabit,
  getHabits,
  updateHabit,
  deleteHabit,
  calculateHabitStreaks,
};
