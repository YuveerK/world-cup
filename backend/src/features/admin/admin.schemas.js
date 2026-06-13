'use strict';

const { ValidationError } = require('../../shared/http/errors');

function validateAdminSignup(req) {
  const { username, password } = req.body;
  if (!username || !password) throw new ValidationError('username and password required');
}

function validateResetPassword(req) {
  const pw = req.body.password || req.body.newPassword;
  if (!pw) throw new ValidationError('password required');
  if (pw.length < 4) throw new ValidationError('Password must be at least 4 characters');
}

function validateSetPrediction(req) {
  const raw = req.body;
  const ft_home = parseInt(raw.ft_home, 10);
  const ft_away = parseInt(raw.ft_away, 10);
  if ([ft_home, ft_away].some((v) => Number.isNaN(v) || v < 0)) {
    throw new ValidationError('ft_home and ft_away required');
  }
  const ht_home = raw.ht_home != null ? parseInt(raw.ht_home, 10) : null;
  const ht_away = raw.ht_away != null ? parseInt(raw.ht_away, 10) : null;
  if ((ht_home === null) !== (ht_away === null)) {
    throw new ValidationError('Provide both ht_home and ht_away, or neither');
  }
  if ([ht_home, ht_away].some((v) => v !== null && (Number.isNaN(v) || v < 0))) {
    throw new ValidationError('ht_home and ht_away must be valid scores');
  }
}

module.exports = { validateAdminSignup, validateResetPassword, validateSetPrediction };
