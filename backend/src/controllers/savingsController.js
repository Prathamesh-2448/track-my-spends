const SavingsGoal = require('../models/SavingsGoal');

// @desc    Get all savings goals for user
// @route   GET /api/savings
// @access  Private
exports.getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user.id }).sort({
      isCompleted: 1,
      targetDate: 1,
    });

    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single savings goal
// @route   GET /api/savings/:id
// @access  Private
exports.getSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
      });
    }

    // Make sure user owns this goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this savings goal',
      });
    }

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create savings goal
// @route   POST /api/savings
// @access  Private
exports.createSavingsGoal = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.user = req.user.id;

    // Validate target date is in the future
    if (new Date(req.body.targetDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Target date must be in the future',
      });
    }

    const goal = await SavingsGoal.create(req.body);

    res.status(201).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update savings goal
// @route   PUT /api/savings/:id
// @access  Private
exports.updateSavingsGoal = async (req, res, next) => {
  try {
    let goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
      });
    }

    // Make sure user owns this goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this savings goal',
      });
    }

    // Check if goal is being marked as completed
    if (req.body.isCompleted && !goal.isCompleted) {
      req.body.completedAt = new Date();
    }

    goal = await SavingsGoal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete savings goal
// @route   DELETE /api/savings/:id
// @access  Private
exports.deleteSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
      });
    }

    // Make sure user owns this goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this savings goal',
      });
    }

    await goal.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add amount to savings goal
// @route   POST /api/savings/:id/contribute
// @access  Private
exports.contributeSavings = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount',
      });
    }

    let goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
      });
    }

    // Make sure user owns this goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to contribute to this savings goal',
      });
    }

    // Add amount to current amount
    goal.currentAmount += amount;

    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
      goal.completedAt = new Date();
    }

    await goal.save();

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Withdraw amount from savings goal
// @route   POST /api/savings/:id/withdraw
// @access  Private
exports.withdrawSavings = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount',
      });
    }

    let goal = await SavingsGoal.findById(req.params.id);

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found',
      });
    }

    // Make sure user owns this goal
    if (goal.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to withdraw from this savings goal',
      });
    }

    // Check if sufficient balance
    if (amount > goal.currentAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance in savings goal',
      });
    }

    // Subtract amount from current amount
    goal.currentAmount -= amount;

    // If previously completed, mark as incomplete
    if (goal.currentAmount < goal.targetAmount && goal.isCompleted) {
      goal.isCompleted = false;
      goal.completedAt = null;
    }

    await goal.save();

    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get savings summary
// @route   GET /api/savings/summary
// @access  Private
exports.getSavingsSummary = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user.id });

    const summary = {
      totalGoals: goals.length,
      activeGoals: goals.filter((g) => !g.isCompleted).length,
      completedGoals: goals.filter((g) => g.isCompleted).length,
      totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalCurrentAmount: goals.reduce((sum, g) => sum + g.currentAmount, 0),
      totalRemainingAmount: goals.reduce(
        (sum, g) => sum + Math.max(g.targetAmount - g.currentAmount, 0),
        0
      ),
      overallProgress: 0,
    };

    if (summary.totalTargetAmount > 0) {
      summary.overallProgress =
        (summary.totalCurrentAmount / summary.totalTargetAmount) * 100;
    }

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};