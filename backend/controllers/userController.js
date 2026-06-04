const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/response');

exports.getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const users = await User.find(filter).sort({ createdAt: -1 });
    ok(res, { users, total: users.length });
  } catch (err) { next(err); }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return fail(res, 404, 'User not found');
    ok(res, { user });
  } catch (err) { next(err); }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return fail(res, 400, 'Name, email and password are required');
    const existing = await User.findOne({ email });
    if (existing) return fail(res, 409, 'Email already in use');
    const user = await User.create({
      name, email, passwordHash: password,
      role: role === 'manager' ? 'manager' : 'admin',
    });
    await AuditLog.create({ user: req.user._id, action: 'CREATE_USER', entity: 'User', entityId: user._id });
    ok(res, { user }, 201);
  } catch (err) { next(err); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { passwordHash, ...updates } = req.body;
    if (updates.password) {
      const target = await User.findById(req.params.id);
      if (!target) return fail(res, 404, 'User not found');
      target.passwordHash = updates.password;
      delete updates.password;
      await target.save();
    }
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!user) return fail(res, 404, 'User not found');
    await AuditLog.create({ user: req.user._id, action: 'UPDATE_USER', entity: 'User', entityId: user._id });
    ok(res, { user });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString())
      return fail(res, 400, 'Cannot delete your own account');
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return fail(res, 404, 'User not found');
    await AuditLog.create({ user: req.user._id, action: 'DELETE_USER', entity: 'User', entityId: req.params.id });
    ok(res, { message: 'User deleted' });
  } catch (err) { next(err); }
};
