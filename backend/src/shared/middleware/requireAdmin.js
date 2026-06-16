'use strict';

const { ForbiddenError } = require('../http/errors');
const usersRepo = require('../../features/users/users.repository');
const { isAdminUser } = require('../../features/users/adminIdentity.service');

module.exports = async function requireAdmin(req, res, next) {
  try {
    const user = await usersRepo.findById(req.user?.id);
    if (!isAdminUser(user)) return next(new ForbiddenError());
    next();
  } catch {
    next(new ForbiddenError());
  }
};
