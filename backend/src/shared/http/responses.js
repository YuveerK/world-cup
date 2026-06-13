'use strict';

module.exports = {
  ok: (res, data = {}) => res.json({ success: true, ...data }),
  created: (res, data = {}) => res.status(201).json({ success: true, ...data }),
};
