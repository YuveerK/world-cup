'use strict';

const { ValidationError } = require('../../shared/http/errors');

function validateSignup(req) {
  const { username, password } = req.body;
  if (!username || !password) throw new ValidationError('username and password required');
  if (username.trim().length < 2) throw new ValidationError('Username must be at least 2 characters');
  if (password.length < 8) throw new ValidationError('Password must be at least 8 characters');
}

function validateLogin(req) {
  const { username, password } = req.body;
  if (!username || !password) throw new ValidationError('username and password required');
}

function validateChangeUsername(req) {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const { currentPassword } = req.body;
  if (!username || !currentPassword) throw new ValidationError('username and currentPassword required');
  if (username.length < 2) throw new ValidationError('Username must be at least 2 characters');
}

function validateChangePassword(req) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new ValidationError('currentPassword and newPassword required');
  if (newPassword.length < 8) throw new ValidationError('Password must be at least 8 characters');
}

function validateDeleteAccount(req) {
  const { currentPassword } = req.body;
  if (!currentPassword) throw new ValidationError('currentPassword required');
}

function validatePicks(req) {
  const winner = typeof req.body.winner === 'string' ? req.body.winner.trim() : '';
  const pick1 = winner || (typeof req.body.pick1 === 'string' ? req.body.pick1.trim() : '');
  const pick2 = typeof req.body.pick2 === 'string' ? req.body.pick2.trim() : null;
  if (!pick1) throw new ValidationError('winner required');
  if (pick2 && pick1 === pick2) throw new ValidationError('pick1 and pick2 must be different teams');
}

module.exports = {
  validateSignup,
  validateLogin,
  validateChangeUsername,
  validateChangePassword,
  validateDeleteAccount,
  validatePicks,
};
