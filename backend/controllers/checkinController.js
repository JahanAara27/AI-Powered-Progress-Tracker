const CheckIn = require('../models/CheckIn');
const Habit = require('../models/Habit');
const { calculateHabitStreaks } = require('./habitController');

// @desc Create or update a habit check-in for a specific date
// @route POST /api/checkins
const createCheckIn = async (req, res, next) => {
  try {
    const { habitId, date, status, practiceMinutes } = req.body;

    if (!habitId || !date) {
      return res.status(400).json({ message: 'habitId and date (YYYY-MM-DD) are required' });
    }

    const habit = await Habit.findOne({ _id: habitId, userId: req.user._id });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found or access denied' });
    }

    // Upsert check-in
    const checkIn = await CheckIn.findOneAndUpdate(
      { userId: req.user._id, habitId, date },
      {
        status: status === 'missed' ? 'missed' : 'completed',
        practiceMinutes: Math.max(0, Number(practiceMinutes || 0)),
      },
      { new: true, upsert: true, runValidators: true }
    );

    const habitStats = await calculateHabitStreaks(req.user._id, habitId);

    res.status(200).json({
      success: true,
      checkIn,
      habitStats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get check-ins for a specific date (default today)
// @route GET /api/checkins?date=YYYY-MM-DD
const getCheckIns = async (req, res, next) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    const checkIns = await CheckIn.find({
      userId: req.user._id,
      date: targetDate,
    }).populate('habitId', 'title frequency active');

    res.json({
      success: true,
      date: targetDate,
      checkIns,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get chronological check-in history with habit metadata
// @route GET /api/checkins/history
const getCheckInHistory = async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
    const checkIns = await CheckIn.find({ userId: req.user._id })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .populate('habitId', 'title frequency active');

    res.json({
      success: true,
      count: checkIns.length,
      checkIns,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCheckIn,
  getCheckIns,
  getCheckInHistory,
};
