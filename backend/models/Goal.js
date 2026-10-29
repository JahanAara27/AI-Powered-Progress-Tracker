const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },
});

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: 120,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  targetDate: {
    type: String, // YYYY-MM-DD
    required: [true, 'Target deadline date is required'],
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'deferred'],
    default: 'in_progress',
  },
  milestones: [milestoneSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

goalSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
