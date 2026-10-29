const mongoose = require('mongoose');

const predictionHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  predictionType: {
    type: String,
    enum: ['consistency', 'goal'],
    required: true,
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal',
    default: null,
  },
  probability: {
    type: Number,
    min: 0,
    max: 1,
    default: null,
  },
  category: {
    type: String,
    required: true,
  },
  contributingFactors: {
    type: [String],
    default: [],
  },
  recommendations: {
    type: [String],
    default: [],
  },
  modelVersion: {
    type: String,
    default: '1.0-rf',
  },
  insufficientData: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

predictionHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PredictionHistory', predictionHistorySchema);
