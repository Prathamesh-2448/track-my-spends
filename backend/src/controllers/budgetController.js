const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const Category = require('../models/Category');

// @desc    Get all budgets for user
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user.id })
      .populate('category', 'name icon color')
      .sort({ startDate: -1 });

    // Calculate spent amount for each budget
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const expenses = await Expense.aggregate([
          {
            $match: {
              user: req.user._id,
              category: budget.category._id,
              date: {
                $gte: budget.startDate,
                $lte: budget.endDate,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalSpent: { $sum: '$amount' },
            },
          },
        ]);

        const spent = expenses[0]?.totalSpent || 0;
        const percentage = (spent / budget.amount) * 100;
        const isOverBudget = spent > budget.amount;
        const isNearLimit = percentage >= budget.alertThreshold;

        return {
          ...budget.toObject(),
          spent,
          percentage: Math.round(percentage * 100) / 100,
          remaining: Math.max(budget.amount - spent, 0),
          isOverBudget,
          isNearLimit,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: budgetsWithSpent.length,
      data: budgetsWithSpent,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single budget
// @route   GET /api/budgets/:id
// @access  Private
exports.getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id).populate(
      'category',
      'name icon color'
    );

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    // Make sure user owns this budget
    if (budget.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this budget',
      });
    }

    // Calculate spent amount
    const expenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          category: budget.category._id,
          date: {
            $gte: budget.startDate,
            $lte: budget.endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const spent = expenses[0]?.totalSpent || 0;
    const percentage = (spent / budget.amount) * 100;

    res.status(200).json({
      success: true,
      data: {
        ...budget.toObject(),
        spent,
        percentage: Math.round(percentage * 100) / 100,
        remaining: Math.max(budget.amount - spent, 0),
        isOverBudget: spent > budget.amount,
        isNearLimit: percentage >= budget.alertThreshold,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Verify category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Auto-calculate end date based on period if not provided
    if (!req.body.endDate && req.body.startDate) {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(startDate);

      switch (req.body.period) {
        case 'weekly':
          endDate.setDate(endDate.getDate() + 7);
          break;
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'yearly':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      req.body.endDate = endDate;
    }

    const budget = await Budget.create(req.body);
    await budget.populate('category', 'name icon color');

    res.status(201).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Budget already exists for this category in this period',
      });
    }
    next(error);
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res, next) => {
  try {
    let budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    // Make sure user owns this budget
    if (budget.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this budget',
      });
    }

    budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name icon color');

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    // Make sure user owns this budget
    if (budget.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this budget',
      });
    }

    await budget.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get budget alerts (over budget or near limit)
// @route   GET /api/budgets/alerts
// @access  Private
exports.getBudgetAlerts = async (req, res, next) => {
  try {
    const budgets = await Budget.find({
      user: req.user.id,
      isActive: true,
      endDate: { $gte: new Date() }, // Only active budgets
    }).populate('category', 'name icon color');

    const alerts = [];

    for (const budget of budgets) {
      const expenses = await Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            category: budget.category._id,
            date: {
              $gte: budget.startDate,
              $lte: budget.endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$amount' },
          },
        },
      ]);

      const spent = expenses[0]?.totalSpent || 0;
      const percentage = (spent / budget.amount) * 100;

      if (spent > budget.amount) {
        alerts.push({
          type: 'over_budget',
          budget: budget,
          spent,
          percentage: Math.round(percentage * 100) / 100,
          message: `You've exceeded your ${budget.category.name} budget by ${Math.round((spent - budget.amount) * 100) / 100}`,
        });
      } else if (percentage >= budget.alertThreshold) {
        alerts.push({
          type: 'near_limit',
          budget: budget,
          spent,
          percentage: Math.round(percentage * 100) / 100,
          message: `You've used ${Math.round(percentage)}% of your ${budget.category.name} budget`,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};