const Activity = require('../models/Activity');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? { owner: req.user._id } : {};
    const activities = await Activity.find(filter)
      .populate('owner', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });
    ok(res, { activities });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { type, note, relatedTo, relatedModel, dueDate } = req.body;
    if (!type) return fail(res, 400, 'Activity type is required');
    const activity = await Activity.create({ type, note, relatedTo, relatedModel, dueDate, owner: req.user._id });
    ok(res, { activity }, 201);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id).populate('owner', 'name email');
    if (!activity) return fail(res, 404, 'Activity not found');
    ok(res, { activity });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!activity) return fail(res, 404, 'Activity not found');
    ok(res, { activity });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) return fail(res, 404, 'Activity not found');
    ok(res, { message: 'Activity deleted' });
  } catch (err) { next(err); }
};
