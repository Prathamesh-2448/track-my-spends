const Category = require('../models/Category');

// @desc    Get all categories (default + user custom)
// @route   GET /api/categories
// @access  Private
exports.getCategories = async (req, res, next) => {
  try {
    // Get default categories and user's custom categories
    const categories = await Category.find({
      $or: [{ isDefault: true }, { user: req.user.id }],
    }).sort({ isDefault: -1, name: 1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create custom category
// @route   POST /api/categories
// @access  Private
exports.createCategory = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    // Handle duplicate category name for user
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Make sure user can only update their own categories
    if (category.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update default categories',
      });
    }

    if (category.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category',
      });
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Make sure user can only delete their own categories
    if (category.isDefault) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete default categories',
      });
    }

    if (category.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this category',
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Initialize default categories
// @route   POST /api/categories/init-defaults
// @access  Private (or can be called on server start)
exports.initializeDefaultCategories = async (req, res, next) => {
  try {
    const defaultCategories = [
      { name: 'Food & Dining', icon: '🍔', color: '#EF4444', isDefault: true },
      { name: 'Transportation', icon: '🚗', color: '#3B82F6', isDefault: true },
      { name: 'Shopping', icon: '🛍️', color: '#8B5CF6', isDefault: true },
      { name: 'Entertainment', icon: '🎬', color: '#EC4899', isDefault: true },
      { name: 'Bills & Utilities', icon: '💡', color: '#F59E0B', isDefault: true },
      { name: 'Healthcare', icon: '🏥', color: '#10B981', isDefault: true },
      { name: 'Education', icon: '📚', color: '#6366F1', isDefault: true },
      { name: 'Travel', icon: '✈️', color: '#14B8A6', isDefault: true },
      { name: 'Groceries', icon: '🛒', color: '#84CC16', isDefault: true },
      { name: 'Other', icon: '📁', color: '#6B7280', isDefault: true },
    ];

    // Check if default categories already exist
    const existingDefaults = await Category.find({ isDefault: true });

    if (existingDefaults.length === 0) {
      await Category.insertMany(defaultCategories);
      
      res.status(201).json({
        success: true,
        message: 'Default categories initialized',
        count: defaultCategories.length,
      });
    } else {
      res.status(200).json({
        success: true,
        message: 'Default categories already exist',
      });
    }
  } catch (error) {
    next(error);
  }
};