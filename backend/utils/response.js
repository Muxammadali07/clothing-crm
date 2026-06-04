const ok = (res, data, statusOrMeta) => {
  const status = typeof statusOrMeta === 'number' ? statusOrMeta : 200;
  const meta = typeof statusOrMeta === 'object' ? statusOrMeta : undefined;
  const payload = { success: true, data };
  if (meta) payload.meta = meta;
  return res.status(status).json(payload);
};

const fail = (res, status, message, code) => {
  return res.status(status).json({ success: false, message, ...(code && { code }) });
};

module.exports = { ok, fail };
