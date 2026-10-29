const express = require('express');
const router = express.Router();
const {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(createGoal)
  .get(getGoals);

router.route('/:id')
  .patch(updateGoal)
  .delete(deleteGoal);

module.exports = router;
