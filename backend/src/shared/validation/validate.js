'use strict';

const { ValidationError } = require('../http/errors');

// Creates an Express middleware from a plain validator function.
// The validator receives (req) and should throw a ValidationError (or any
// error with .isOperational = true) when input is invalid.
module.exports = function validate(validatorFn) {
  return (req, res, next) => {
    try {
      validatorFn(req);
      next();
    } catch (err) {
      if (err.isOperational) return next(err);
      next(new ValidationError(err.message));
    }
  };
};
