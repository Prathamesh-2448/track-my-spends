const User = require('../models/User');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const SavingsGoal = require('../models/SavingsGoal');

// @desc    Get comprehensive dashboard data
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    // Date ranges
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // === INCOME & BALANCE ===
    const income = user.income || 0;

    // Total expenses for current month
    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    const monthlyExpenseTotal = monthlyExpenses[0]?.total || 0;

    // Balance calculation
    const balance = income - monthlyExpenseTotal;

    // === EXPENSE STATISTICS ===
    // Category breakdown for current month
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
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

    // Yearly expenses
    const yearlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startOfYear },
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
    const yearlyExpenseTotal = yearlyExpenses[0]?.total || 0;

    // Recent expenses (last 5)
    const recentExpenses = await Expense.find({ user: req.user.id })
      .populate('category', 'name icon color')
      .sort({ date: -1 })
      .limit(5);

    // === BUDGET STATUS ===
    const activeBudgets = await Budget.find({
      user: req.user.id,
      isActive: true,
      endDate: { $gte: today },
    }).populate('category', 'name icon color');

    const budgetStatus = await Promise.all(
      activeBudgets.map(async (budget) => {
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

        return {
          budget: budget,
          spent,
          percentage: Math.round(percentage * 100) / 100,
          remaining: Math.max(budget.amount - spent, 0),
          isOverBudget: spent > budget.amount,
        };
      })
    );

    // Count over budget categories
    const overBudgetCount = budgetStatus.filter((b) => b.isOverBudget).length;

    // === SAVINGS GOALS ===
    const savingsGoals = await SavingsGoal.find({
      user: req.user.id,
      isCompleted: false,
    })
      .sort({ targetDate: 1 })
      .limit(5);

    const totalSavingsTarget = savingsGoals.reduce(
      (sum, g) => sum + g.targetAmount,
      0
    );
    const totalSavingsCurrent = savingsGoals.reduce(
      (sum, g) => sum + g.currentAmount,
      0
    );

    // === SPENDING TRENDS (Last 6 months) ===
    const sixMonthsAgo = new Date(
      today.getFullYear(),
      today.getMonth() - 5,
      1
    );

    const monthlyTrends = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    // Format monthly trends
    const trendData = monthlyTrends.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      total: item.total,
      count: item.count,
    }));

    // === TOP SPENDING CATEGORIES (Current month) ===
    const topCategories = categoryBreakdown.slice(0, 5);

    // === FINANCIAL HEALTH SCORE ===
    let healthScore = 100;

    // Deduct points if over budget
    if (overBudgetCount > 0) {
      healthScore -= overBudgetCount * 10;
    }

    // Deduct points if spending > 80% of income
    if (income > 0) {
      const spendingRatio = (monthlyExpenseTotal / income) * 100;
      if (spendingRatio > 80) {
        healthScore -= 15;
      } else if (spendingRatio > 60) {
        healthScore -= 10;
      }
    }

    // Add points for active savings
    if (savingsGoals.length > 0) {
      healthScore += 10;
    }

    healthScore = Math.max(0, Math.min(100, healthScore));

    // === COMPILE DASHBOARD DATA ===
    const dashboard = {
      overview: {
        income,
        monthlyExpenses: monthlyExpenseTotal,
        balance,
        yearlyExpenses: yearlyExpenseTotal,
        healthScore: Math.round(healthScore),
      },
      expenses: {
        monthly: monthlyExpenseTotal,
        yearly: yearlyExpenseTotal,
        categoryBreakdown,
        topCategories,
        recentExpenses,
      },
      budgets: {
        total: activeBudgets.length,
        overBudget: overBudgetCount,
        budgetStatus,
      },
      savings: {
        activeGoals: savingsGoals.length,
        totalTarget: totalSavingsTarget,
        totalCurrent: totalSavingsCurrent,
        progress:
          totalSavingsTarget > 0
            ? (totalSavingsCurrent / totalSavingsTarget) * 100
            : 0,
        goals: savingsGoals,
      },
      trends: {
        monthlyData: trendData,
      },
    };

    res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get spending trends with custom date range
// @route   GET /api/dashboard/trends
// @access  Private
exports.getSpendingTrends = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    let groupStage;

    switch (groupBy) {
      case 'day':
        groupStage = {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' },
        };
        break;
      case 'week':
        groupStage = {
          year: { $year: '$date' },
          week: { $week: '$date' },
        };
        break;
      case 'month':
      default:
        groupStage = {
          year: { $year: '$date' },
          month: { $month: '$date' },
        };
        break;
    }

    const trends = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: groupStage,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgExpense: { $avg: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: trends.length,
      data: trends,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category-wise comparison
// @route   GET /api/dashboard/category-comparison
// @access  Private
exports.getCategoryComparison = async (req, res, next) => {
  try {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Current month expenses by category
    const currentMonth = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: currentMonthStart },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
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
    ]);

    // Last month expenses by category
    const lastMonth = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Create comparison map
    const lastMonthMap = {};
    lastMonth.forEach((item) => {
      lastMonthMap[item._id.toString()] = item.total;
    });

    const comparison = currentMonth.map((item) => {
      const categoryId = item._id.toString();
      const lastMonthTotal = lastMonthMap[categoryId] || 0;
      const change = item.total - lastMonthTotal;
      const changePercentage =
        lastMonthTotal > 0 ? (change / lastMonthTotal) * 100 : 100;

      return {
        category: {
          id: item._id,
          name: item.categoryInfo.name,
          icon: item.categoryInfo.icon,
          color: item.categoryInfo.color,
        },
        currentMonth: item.total,
        lastMonth: lastMonthTotal,
        change,
        changePercentage: Math.round(changePercentage * 100) / 100,
      };
    });

    res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (error) {
    next(error);
  }
};