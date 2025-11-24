const express = require('express');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  initializeDefaultCategories,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/').get(getCategories).post(createCategory);

router.route('/init-defaults').post(initializeDefaultCategories);

router.route('/:id').put(updateCategory).delete(deleteCategory);

module.exports = router;