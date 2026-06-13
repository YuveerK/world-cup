'use strict';

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super(message, 401); }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(message, 403); }
}

class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(message, 404); }
}

class ConflictError extends AppError {
  constructor(message) { super(message, 409); }
}

class LockedError extends AppError {
  constructor(message) { super(message, 423); }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  LockedError,
};
