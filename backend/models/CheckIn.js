const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
    index: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: [true, 'Date string (YYYY-MM-DD) is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must match YYYY-MM-DD format'],
    index: true,
  },
  status: {
    type: String,
    enum: ['completed', 'missed'],
    default: 'completed',
  },
  practiceMinutes: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

// Ensure a user can only have one checkin record per habit per day
checkInSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
checkInSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('CheckIn', checkInSchema);
