const express = require('express');
const router = express.Router();
const {
  createCheckIn,
  getCheckIns,
  getCheckInHistory,
} = require('../controllers/checkinController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createCheckIn);
router.get('/', getCheckIns);
router.get('/history', getCheckInHistory);

module.exports = router;
