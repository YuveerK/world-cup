'use strict';

const { ForbiddenError } = require('../http/errors');

// req.user is the decoded JWT payload, which stores the field as isAdmin (camelCase)
module.exports = function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return next(new ForbiddenError());
  next();
};
