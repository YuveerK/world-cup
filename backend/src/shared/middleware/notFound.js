'use strict';

const { NotFoundError } = require('../http/errors');

module.exports = function notFound(req, res, next) {
  next(new NotFoundError(`Cannot ${req.method} ${req.path}`));
};
