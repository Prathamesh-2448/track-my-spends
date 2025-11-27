const express = require('express');
const {
  getDashboard,
  getSpendingTrends,
  getCategoryComparison,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/').get(getDashboard);

router.route('/trends').get(getSpendingTrends);

router.route('/category-comparison').get(getCategoryComparison);

module.exports = router;