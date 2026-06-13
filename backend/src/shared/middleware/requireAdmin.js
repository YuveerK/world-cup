'use strict';

const { isAdminUser } = require('../../features/users/adminIdentity.service');
const { ForbiddenError } = require('../http/errors');

module.exports = function requireAdmin(req, res, next) {
  if (!isAdminUser(req.user)) return next(new ForbiddenError());
  next();
};
