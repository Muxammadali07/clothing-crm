const Customer = require('../models/Customer');
const Lead = require('../models/Lead');
const Opportunity = require('../models/Opportunity');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { ok } = require('../utils/response');

exports.summary = async (req, res, next) => {
  try {
    const isManager = req.user.role === 'manager';

    const [totalCustomers, totalLeads, totalOpportunities, totalActivities] = await Promise.all([
      Customer.countDocuments(isManager ? {} : { assignedTo: req.user._id }),
      Lead.countDocuments(isManager ? {} : { owner: req.user._id }),
      Opportunity.countDocuments(isManager ? {} : { owner: req.user._id }),
      Activity.countDocuments(isManager ? {} : { owner: req.user._id }),
    ]);

    // Revenue from won opportunities
    const wonOpps = await Opportunity.find({
      ...(isManager ? {} : { owner: req.user._id }),
      stage: 'won',
    }).select('amount');
    const totalRevenue = wonOpps.reduce((sum, o) => sum + (o.amount || 0), 0);

    // Customers added this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const newCustomersThisMonth = await Customer.countDocuments({
      ...(isManager ? {} : { assignedTo: req.user._id }),
      createdAt: { $gte: startOfMonth },
    });

    // Lead status breakdown
    const leadsByStatus = await Lead.aggregate([
      ...(isManager ? [] : [{ $match: { owner: req.user._id } }]),
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Opportunity pipeline by stage
    const oppsByStage = await Opportunity.aggregate([
      ...(isManager ? [] : [{ $match: { owner: req.user._id } }]),
      { $group: { _id: '$stage', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);

    // Customer growth: last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); sixMonthsAgo.setHours(0, 0, 0, 0);
    const customerGrowth = await Customer.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Employee performance (manager only)
    let employeePerf = [];
    if (isManager) {
      employeePerf = await Customer.aggregate([
        { $match: { assignedTo: { $exists: true } } },
        { $group: { _id: '$assignedTo', customerCount: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { name: '$user.name', customerCount: 1 } },
        { $sort: { customerCount: -1 } },
        { $limit: 10 },
      ]);
    }

    // Active leads count
    const activeLeads = await Lead.countDocuments({
      ...(isManager ? {} : { owner: req.user._id }),
      status: { $in: ['new', 'contacted', 'qualified'] },
    });

    // Pending activities (follow-up tasks)
    const followUpTasks = await Activity.countDocuments({
      ...(isManager ? {} : { owner: req.user._id }),
      completed: false,
    });

    ok(res, {
      totalCustomers, totalLeads, totalOpportunities, totalActivities,
      totalRevenue, newCustomersThisMonth, activeLeads, followUpTasks,
      leadsByStatus, oppsByStage, customerGrowth, employeePerf,
    });
  } catch (err) { next(err); }
};
