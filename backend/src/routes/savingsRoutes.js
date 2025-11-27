const express = require('express');
const {
  getSavingsGoals,
  getSavingsGoal,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  contributeSavings,
  withdrawSavings,
  getSavingsSummary,
} = require('../controllers/savingsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/').get(getSavingsGoals).post(createSavingsGoal);

router.route('/summary').get(getSavingsSummary);

router
  .route('/:id')
  .get(getSavingsGoal)
  .put(updateSavingsGoal)
  .delete(deleteSavingsGoal);

router.route('/:id/contribute').post(contributeSavings);

router.route('/:id/withdraw').post(withdrawSavings);

module.exports = router;