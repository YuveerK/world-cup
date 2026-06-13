'use strict';

const asyncHandler = require('../../shared/http/asyncHandler');
const { getRankedLeaderboard } = require('./leaderboard.service');

const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await getRankedLeaderboard();
  res.json({ leaderboard });
});

module.exports = { getLeaderboard };
