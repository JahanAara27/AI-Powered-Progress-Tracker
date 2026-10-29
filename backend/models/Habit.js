const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Habit title is required'],
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
});

habitSchema.index({ userId: 1, active: 1 });

module.exports = mongoose.model('Habit', habitSchema);
