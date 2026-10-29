const express = require('express');
const router = express.Router();
const {
  createHabit,
  getHabits,
  updateHabit,
  deleteHabit,
} = require('../controllers/habitController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(createHabit)
  .get(getHabits);

router.route('/:id')
  .patch(updateHabit)
  .delete(deleteHabit);

module.exports = router;
