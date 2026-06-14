'use strict';

const asyncHandler = require('../../shared/http/asyncHandler');
const authService = require('./auth.service');

const signup = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.signup(username, password);
  res.json(result);
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const result = await authService.login(username, password);
  res.json(result);
});

const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.user.id, req.user.isAdmin);
  res.json(result);
});

const changeUsername = asyncHandler(async (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const result = await authService.changeUsername(
    req.user.id, username, req.body.currentPassword, req.user.isAdmin
  );
  res.json(result);
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(
    req.user.id, req.body.currentPassword, req.body.newPassword, req.user.isAdmin
  );
  res.json(result);
});

const deleteAccount = asyncHandler(async (req, res) => {
  const deleteUserAccount = require('../users/deleteUser.service');
  const bcrypt = require('bcryptjs');
  const usersRepo = require('../users/users.repository');
  const { UnauthorizedError } = require('../../shared/http/errors');

  const user = await usersRepo.findByIdMinimal(req.user.id);
  const ok = await bcrypt.compare(req.body.currentPassword, user.password);
  if (!ok) throw new UnauthorizedError('Current password is incorrect');
  await deleteUserAccount(req.user.id);
  res.json({ success: true });
});

const updatePicks = asyncHandler(async (req, res) => {
  const winner = typeof req.body.winner === 'string' ? req.body.winner.trim() : '';
  const pick1 = winner || (typeof req.body.pick1 === 'string' ? req.body.pick1.trim() : '');
  const pick2 = typeof req.body.pick2 === 'string' ? req.body.pick2.trim() : null;
  await authService.updatePicks(req.user.id, pick1, pick2 || null);
  res.json({ success: true });
});

module.exports = { signup, login, getMe, changeUsername, changePassword, deleteAccount, updatePicks };
