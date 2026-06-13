'use strict';

const logger = require('../logging/logger');

// Must have 4 parameters — Express identifies error handlers by arity.
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  logger.error(err.message, err.stack);
  res.status(500).json({ error: 'Internal server error' });
};
