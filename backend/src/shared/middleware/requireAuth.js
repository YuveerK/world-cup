'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { UnauthorizedError } = require('../http/errors');

module.exports = function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return next(new UnauthorizedError());
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    next(new UnauthorizedError('Invalid token'));
  }
};
