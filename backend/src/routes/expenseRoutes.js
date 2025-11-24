const express = require('express');
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/').get(getExpenses).post(createExpense);

router.route('/stats/summary').get(getExpenseStats);

router.route('/:id').get(getExpense).put(updateExpense).delete(deleteExpense);

module.exports = router;