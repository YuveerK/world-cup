'use strict';

const asyncHandler = require('../../shared/http/asyncHandler');
const { getMatchStats } = require('./matchStats.service');

const getStats = asyncHandler(async (req, res) => {
  const { matchId } = req.params;
  const { stageId } = req.query;
  const stats = await getMatchStats(matchId, stageId);
  res.json({ success: true, stats });
});

module.exports = { getStats };
