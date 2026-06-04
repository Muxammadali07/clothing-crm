const InventoryItem = require('../models/InventoryItem');
const AuditLog = require('../models/AuditLog');
const { ok, fail } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    const items = await InventoryItem.find().sort({ createdAt: -1 });
    ok(res, { items });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { sku, productName, category, quantity, price } = req.body;
    if (!sku || !productName || price == null) return fail(res, 400, 'SKU, productName and price are required');
    const item = await InventoryItem.create({ sku, productName, category, quantity, price, createdBy: req.user._id });
    await AuditLog.create({ user: req.user._id, action: 'CREATE', entity: 'InventoryItem', entityId: item._id });
    ok(res, { item }, 201);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return fail(res, 404, 'Item not found');
    ok(res, { item });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return fail(res, 404, 'Item not found');
    await AuditLog.create({ user: req.user._id, action: 'UPDATE', entity: 'InventoryItem', entityId: item._id });
    ok(res, { item });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return fail(res, 404, 'Item not found');
    await AuditLog.create({ user: req.user._id, action: 'DELETE', entity: 'InventoryItem', entityId: req.params.id });
    ok(res, { message: 'Item deleted' });
  } catch (err) { next(err); }
};
