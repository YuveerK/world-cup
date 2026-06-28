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
  const { matchId, ft_home, ft_away, ht_home, ht_away, et_ht_home, et_ht_away, et_ft_home, et_ft_away, pen_home, pen_away } = req.body;
  if (!matchId || ft_home == null || ft_away == null) {
    throw new ValidationError('matchId, ft_home and ft_away are required');
  }

  const parsedFtHome = parseInt(ft_home, 10);
  const parsedFtAway = parseInt(ft_away, 10);
  const parsedEtFtHome = et_ft_home != null ? parseInt(et_ft_home, 10) : null;
  const parsedEtFtAway = et_ft_away != null ? parseInt(et_ft_away, 10) : null;
  const parsedPenHome = pen_home != null ? parseInt(pen_home, 10) : null;
  const parsedPenAway = pen_away != null ? parseInt(pen_away, 10) : null;

  const parsedEtHtHome = et_ht_home != null ? parseInt(et_ht_home, 10) : null;
  const parsedEtHtAway = et_ht_away != null ? parseInt(et_ht_away, 10) : null;

  const parsedHtHome = ht_home != null ? parseInt(ht_home, 10) : null;
  const parsedHtAway = ht_away != null ? parseInt(ht_away, 10) : null;
  if (parsedHtHome !== null && (parsedHtHome > parsedFtHome || parsedHtAway > parsedFtAway)) {
    throw new ValidationError('Half time scores cannot exceed full time scores');
  }
  if ((parsedEtFtHome !== null || parsedEtFtAway !== null) && parsedFtHome !== parsedFtAway) {
    throw new ValidationError('ET scores only allowed when FT is a draw');
  }
  if (parsedEtFtHome !== null && (parsedEtFtHome < parsedFtHome || parsedEtFtAway < parsedFtAway)) {
    throw new ValidationError('ET full time scores must be >= full time scores (ET is cumulative)');
  }
  if (parsedEtHtHome !== null && (parsedEtHtHome < parsedFtHome || parsedEtHtAway < parsedFtAway)) {
    throw new ValidationError('ET half time scores must be >= full time scores (ET is cumulative)');
  }
  if (parsedEtFtHome !== null && parsedEtHtHome !== null &&
      (parsedEtFtHome < parsedEtHtHome || parsedEtFtAway < parsedEtHtAway)) {
    throw new ValidationError('ET full time scores must be >= ET half time scores');
  }
  if ((parsedPenHome !== null || parsedPenAway !== null) && parsedEtFtHome !== parsedEtFtAway) {
    throw new ValidationError('Penalty scores only allowed when ET FT is a draw');
  }
  if (parsedPenHome !== null && parsedPenHome === parsedPenAway) {
    throw new ValidationError('Penalty shootout cannot end in a draw');
  }

  const result = await scoreFromData(
    matchId,
    parsedFtHome, parsedFtAway,
    parsedHtHome, parsedHtAway,
    parsedEtHtHome, parsedEtHtAway,
    parsedEtFtHome, parsedEtFtAway,
    parsedPenHome, parsedPenAway,
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
