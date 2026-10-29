const express = require('express');
const router = express.Router();
const {
  predictConsistency,
  predictGoal,
  getPredictionHistory,
} = require('../controllers/predictionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/consistency', predictConsistency);
router.post('/goal', predictGoal);
router.get('/history', getPredictionHistory);

module.exports = router;
