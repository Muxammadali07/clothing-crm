const AuditLog = require('../models/AuditLog');
const { ok } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find()
        .populate('user', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(),
    ]);

    ok(res, { logs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};
