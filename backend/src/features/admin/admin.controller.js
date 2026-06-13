'use strict';

const asyncHandler = require('../../shared/http/asyncHandler');
const svc = require('./admin.service');

const getUsers = asyncHandler(async (req, res) => {
  const users = await svc.listUsers();
  res.json({ users });
});

const getPredictions = asyncHandler(async (req, res) => {
  const result = await svc.getPredictionsForMatch(req.params.matchId);
  res.json(result);
});

const createUser = asyncHandler(async (req, res) => {
  const { username, password, pick1, pick2 } = req.body;
  const user = await svc.createUser(username, password, pick1, pick2);
  res.json({ user });
});

const updatePicks = asyncHandler(async (req, res) => {
  const { pick1, pick2 } = req.body;
  await svc.updateUserPicks(req.params.userId, pick1, pick2);
  res.json({ success: true });
});

const resetPassword = asyncHandler(async (req, res) => {
  const newPassword = req.body.password || req.body.newPassword;
  const user = await svc.resetUserPassword(req.params.userId, newPassword);
  res.json({ success: true, user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await svc.deleteUser(req.params.userId, req.user.id);
  res.json({ success: true, user });
});

const setUserPrediction = asyncHandler(async (req, res) => {
  const { userId, matchId } = req.params;
  const raw = req.body;
  const scores = {
    ft_home: parseInt(raw.ft_home, 10),
    ft_away: parseInt(raw.ft_away, 10),
    ht_home: raw.ht_home != null ? parseInt(raw.ht_home, 10) : null,
    ht_away: raw.ht_away != null ? parseInt(raw.ht_away, 10) : null,
  };
  const result = await svc.setUserPrediction(userId, matchId, scores);
  res.json({ success: true, ...result });
});

module.exports = { getUsers, getPredictions, createUser, updatePicks, resetPassword, deleteUser, setUserPrediction };
