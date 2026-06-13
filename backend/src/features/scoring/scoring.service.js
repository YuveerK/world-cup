'use strict';

const logger = require('../../shared/logging/logger');
const repo = require('./scoring.repository');
const rules = require('./scoring.rules');

// Score all predictions for a finished match. Persists result + points rows.
async function scoreFromData(matchId, ftHome, ftAway, htHome = null, htAway = null) {
  const id = repo.normalizeId(matchId);
  await repo.upsertResult(id, ftHome, ftAway, htHome, htAway);

  const preds = await repo.getPredictionsForMatch(id);
  if (!preds.length) return { scored: 0 };

  const ft = { home: ftHome, away: ftAway };
  const ht = htHome !== null && htAway !== null ? { home: htHome, away: htAway } : null;
  const scored = rules.scoreAllPredictions(preds, ft, ht);
  const rows = scored.map((r) => ({ ...r, match_id: id }));
  await repo.upsertPoints(rows);

  logger.info(`Scored match ${id} (FT ${ftHome}-${ftAway}), ${preds.length} predictions processed`);
  return { scored: preds.length, pointsRows: rows };
}

// Score only the half-time portion while preserving existing FT/outcome/closest.
async function scoreHalfTimeFromData(matchId, htHome, htAway) {
  const id = repo.normalizeId(matchId);
  const preds = await repo.getPredictionsForMatch(id);
  if (!preds.length) return { scored: 0 };

  const existing = await repo.getExistingPointsForMatch(id, preds.map((p) => p.user_id));
  const existingByUserId = new Map(existing.map((r) => [r.user_id, r]));
  const ht = { home: htHome, away: htAway };
  const scored = rules.scoreHalfTimePredictions(preds, ht, existingByUserId);
  const rows = scored.map((r) => ({ ...r, match_id: id }));
  await repo.upsertPoints(rows);

  logger.info(`HT scored match ${id} (${htHome}-${htAway}), ${preds.length} predictions processed`);
  return { scored: preds.length, pointsRows: rows };
}

module.exports = { scoreFromData, scoreHalfTimeFromData };
