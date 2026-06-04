const Customer = require('../models/Customer');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'admin') filter.assignedTo = req.user._id;
    const customers = await Customer.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    ok(res, { customers });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, company, email, phone, status, assignedTo } = req.body;
    if (!name || !email) return fail(res, 400, 'Name and email are required');
    const customer = await Customer.create({
      name, company, email, phone, status, assignedTo,
      createdBy: req.user._id,
    });
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entity: 'Customer', entityId: customer._id });
    ok(res, { customer }, 201);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name');
    if (!customer) return fail(res, 404, 'Customer not found');
    ok(res, { customer });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) return fail(res, 404, 'Customer not found');
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entity: 'Customer', entityId: customer._id });
    ok(res, { customer });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return fail(res, 404, 'Customer not found');
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entity: 'Customer', entityId: req.params.id });
    ok(res, { message: 'Customer deleted' });
  } catch (err) { next(err); }
};
