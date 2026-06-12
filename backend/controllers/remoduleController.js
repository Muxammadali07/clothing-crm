const Remodule = require('../models/Remodule');
const { ok, fail } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? { owner: req.user._id } : {};
    const remodules = await Remodule.find(filter)
      .populate('owner', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });
    ok(res, { remodules });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { type, note, relatedTo, relatedModel, dueDate } = req.body;
    if (!type) return fail(res, 400, 'Remodule type is required');
    const remodule = await Remodule.create({ type, note, relatedTo, relatedModel, dueDate, owner: req.user._id });
    ok(res, { remodule }, 201);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const remodule = await Remodule.findById(req.params.id).populate('owner', 'name email');
    if (!remodule) return fail(res, 404, 'Remodule not found');
    ok(res, { remodule });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const remodule = await Remodule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!remodule) return fail(res, 404, 'Remodule not found');
    ok(res, { remodule });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const remodule = await Remodule.findByIdAndDelete(req.params.id);
    if (!remodule) return fail(res, 404, 'Remodule not found');
    ok(res, { message: 'Remodule deleted' });
  } catch (err) { next(err); }
};
