'use strict';

const { CORS_ORIGINS } = require('./env');

module.exports = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // non-browser / same-origin
    if (CORS_ORIGINS.includes(origin)) return cb(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
};
