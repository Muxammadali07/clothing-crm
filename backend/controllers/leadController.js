const Lead = require('../models/Lead');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? { owner: req.user._id } : {};
    const leads = await Lead.find(filter).populate('owner', 'name email').sort({ createdAt: -1 });
    ok(res, { leads });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, source, status, value, email, phone, company, notes } = req.body;
    if (!name) return fail(res, 400, 'Lead name is required');
    const lead = await Lead.create({ name, source, status, value, email, phone, company, notes, owner: req.user._id });
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entity: 'Lead', entityId: lead._id });
    ok(res, { lead }, 201);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('owner', 'name email');
    if (!lead) return fail(res, 404, 'Lead not found');
    ok(res, { lead });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!lead) return fail(res, 404, 'Lead not found');
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entity: 'Lead', entityId: lead._id });
    ok(res, { lead });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return fail(res, 404, 'Lead not found');
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entity: 'Lead', entityId: req.params.id });
    ok(res, { message: 'Lead deleted' });
  } catch (err) { next(err); }
};
