const Expense = require('../models/Expense');
const Category = require('../models/Category');

// @desc    Get all expenses for user
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res, next) => {
  try {
    // Build query based on filters
    let query = { user: req.user.id };

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }

    // Search by description
    if (req.query.search) {
      query.description = { $regex: req.query.search, $options: 'i' };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Execute query
    const expenses = await Expense.find(query)
      .populate('category', 'name icon color')
      .sort({ date: -1 })
      .limit(limit)
      .skip(startIndex);

    // Get total count
    const total = await Expense.countDocuments(query);

    // Pagination result
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalExpenses: total,
    };

    res.status(200).json({
      success: true,
      count: expenses.length,
      pagination,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
exports.getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate(
      'category',
      'name icon color'
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Make sure user owns this expense
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this expense',
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Verify category exists and user has access to it
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category is default or belongs to user
    if (!category.isDefault && category.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to use this category',
      });
    }

    const expense = await Expense.create(req.body);

    // Populate category before sending response
    await expense.populate('category', 'name icon color');

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Make sure user owns this expense
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this expense',
      });
    }

    // If updating category, verify it exists
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      if (!category.isDefault && category.user.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to use this category',
        });
      }
    }

    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name icon color');

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // Make sure user owns this expense
    if (expense.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this expense',
      });
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats/summary
// @access  Private
exports.getExpenseStats = async (req, res, next) => {
  try {
    // Get date range (default to current month)
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    const endDate = req.query.endDate
      ? new Date(req.query.endDate)
      : new Date();

    // Total expenses in date range
    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Expenses by category
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      {
        $unwind: '$categoryInfo',
      },
      {
        $project: {
          _id: 1,
          total: 1,
          count: 1,
          name: '$categoryInfo.name',
          icon: '$categoryInfo.icon',
          color: '$categoryInfo.color',
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
        },
        total: totalExpenses[0]?.total || 0,
        count: totalExpenses[0]?.count || 0,
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};