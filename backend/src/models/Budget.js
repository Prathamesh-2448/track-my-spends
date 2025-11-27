const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Please provide a category'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide budget amount'],
      min: [0, 'Budget amount must be positive'],
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide end date'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate budgets for same category in same period
budgetSchema.index({ user: 1, category: 1, startDate: 1 }, { unique: true });

// Virtual for checking if budget is exceeded
budgetSchema.virtual('spent', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'budget',
  justOne: false,
});

module.exports = mongoose.model('Budget', budgetSchema);