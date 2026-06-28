'use strict';

const { LockedError } = require('../../shared/http/errors');
const { getMatchKickoff } = require('../fixtures/fixtures.cache');
const { scoreFromData } = require('../scoring/scoring.service');
const { tryScoreById } = require('../scoring/fifaScoring.service');
const repo = require('./predictions.repository');
const scoringRepo = require('../scoring/scoring.repository');

async function savePrediction(userId, matchId, scores) {
  const kickoff = await getMatchKickoff(matchId);
  if (kickoff && Date.now() >= kickoff.getTime()) {
    throw new LockedError('Predictions are locked after kickoff');
  }

  await repo.upsertPrediction(userId, matchId, scores);

  // Match is in the calendar and hasn't kicked off — no result to score yet.
  if (kickoff) return { scored: false };

  // Kickoff unknown (match not yet in calendar): check if a result already exists.
  const result = await scoringRepo.findResult(matchId);
  if (result && result.ht_home != null && result.ht_away != null) {
    await scoreFromData(
      matchId, result.ft_home, result.ft_away, result.ht_home, result.ht_away,
      result.et_ht_home, result.et_ht_away, result.et_ft_home, result.et_ft_away,
      result.pen_home, result.pen_away,
    );
    return { scored: true };
  }

  // No stored result — try scoring directly from the FIFA live endpoint.
  const scored = await tryScoreById(matchId);
  if (!scored && result) {
    await scoreFromData(
      matchId, result.ft_home, result.ft_away, result.ht_home, result.ht_away,
      result.et_ht_home, result.et_ht_away, result.et_ft_home, result.et_ft_away,
      result.pen_home, result.pen_away,
    );
    return { scored: true, partialResult: true };
  }
  return { scored };
}

async function getMyPredictions(userId) {
  return repo.findByUser(userId);
}

async function getMyPoints(userId) {
  return repo.findPointsByUser(userId);
}

async function getPredictionsForMatch(matchId) {
  const { predictions, actualResult } = await repo.findByMatch(matchId);
  return { predictions, actualResult };
}

module.exports = { savePrediction, getMyPredictions, getMyPoints, getPredictionsForMatch };
