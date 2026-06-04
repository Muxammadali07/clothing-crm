const Opportunity = require('../models/Opportunity');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? { owner: req.user._id } : {};
    const opportunities = await Opportunity.find(filter)
      .populate('customer', 'name company')
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    ok(res, { opportunities });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { title, customer, stage, amount, closeDate, notes } = req.body;
    if (!title || !customer) return fail(res, 400, 'Title and customer are required');
    const opp = await Opportunity.create({ title, customer, stage, amount, closeDate, notes, owner: req.user._id });
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entity: 'Opportunity', entityId: opp._id });
    ok(res, { opportunity: opp }, 201);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id)
      .populate('customer', 'name company email')
      .populate('owner', 'name email');
    if (!opp) return fail(res, 404, 'Opportunity not found');
    ok(res, { opportunity: opp });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!opp) return fail(res, 404, 'Opportunity not found');
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entity: 'Opportunity', entityId: opp._id });
    ok(res, { opportunity: opp });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const opp = await Opportunity.findByIdAndDelete(req.params.id);
    if (!opp) return fail(res, 404, 'Opportunity not found');
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entity: 'Opportunity', entityId: req.params.id });
    ok(res, { message: 'Opportunity deleted' });
  } catch (err) { next(err); }
};
