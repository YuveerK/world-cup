'use strict';

const asyncHandler = require('../../shared/http/asyncHandler');
const { ValidationError } = require('../../shared/http/errors');
const { scoreFromData } = require('./scoring.service');
const { checkAndScoreFinishedMatches } = require('./fifaScoring.service');
const repo = require('./scoring.repository');

const trigger = asyncHandler(async (req, res) => {
  await checkAndScoreFinishedMatches();
  res.json({ success: true });
});

const setResult = asyncHandler(async (req, res) => {
  const { matchId, ft_home, ft_away, ht_home, ht_away } = req.body;
  if (!matchId || ft_home == null || ft_away == null) {
    throw new ValidationError('matchId, ft_home and ft_away are required');
  }
  const result = await scoreFromData(
    matchId,
    parseInt(ft_home, 10),
    parseInt(ft_away, 10),
    ht_home != null ? parseInt(ht_home, 10) : null,
    ht_away != null ? parseInt(ht_away, 10) : null
  );
  res.json({ success: true, scored: result.scored, points: result.pointsRows });
});

const clearResult = asyncHandler(async (req, res) => {
  const { matchId } = req.body;
  if (!matchId) throw new ValidationError('matchId required');
  await repo.deleteResult(matchId);
  await repo.deletePoints(matchId);
  res.json({ success: true });
});

module.exports = { trigger, setResult, clearResult };
