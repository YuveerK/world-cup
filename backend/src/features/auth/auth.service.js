'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../../config/env');
const { UnauthorizedError, NotFoundError, ConflictError } = require('../../shared/http/errors');
const { isAdminUser } = require('../users/adminIdentity.service');
const usersRepo = require('../users/users.repository');
const authRepo = require('./auth.repository');
const { toUserDto } = require('./auth.dto');

function makeToken(user, admin) {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: Boolean(admin) },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function signup(username, password) {
  const hash = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await authRepo.create(username, hash);
  } catch (err) {
    if (err.code === '23505') throw new ConflictError('Username already taken');
    throw err;
  }
  const admin = isAdminUser(user);
  return { token: makeToken(user, admin), user: toUserDto(user, admin) };
}

async function login(username, password) {
  const user = await authRepo.findByUsername(username);
  if (!user) throw new UnauthorizedError('Invalid username or password');
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new UnauthorizedError('Invalid username or password');
  const admin = isAdminUser(user);
  return { token: makeToken(user, admin), user: toUserDto(user, admin) };
}

async function getMe(userId, tokenIsAdmin) {
  const user = await usersRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  const admin = Boolean(tokenIsAdmin || isAdminUser(user));
  return { user: toUserDto(user, admin) };
}

async function changeUsername(userId, newUsername, currentPassword, tokenIsAdmin) {
  const user = await usersRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new UnauthorizedError('Current password is incorrect');
  let updated;
  try {
    updated = await usersRepo.updateUsername(userId, newUsername);
  } catch (err) {
    if (err.code === '23505') throw new ConflictError('Username already taken');
    throw err;
  }
  const admin = Boolean(tokenIsAdmin || isAdminUser(updated));
  return { token: makeToken(updated, admin), user: toUserDto(updated, admin) };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await usersRepo.findByIdMinimal(userId);
  if (!user) throw new NotFoundError('User not found');
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new UnauthorizedError('Current password is incorrect');
  const hash = await bcrypt.hash(newPassword, 10);
  await usersRepo.updatePassword(userId, hash);
}

async function updatePicks(userId, pick1, pick2) {
  await usersRepo.updatePicks(userId, pick1, pick2);
}

module.exports = { signup, login, getMe, changeUsername, changePassword, updatePicks };
