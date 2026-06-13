'use strict';

// Express 4 does not catch async errors automatically — wrap every async
// route handler so rejections are forwarded to the error-handler middleware.
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
