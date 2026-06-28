'use strict';

const logger = require('../../shared/logging/logger');
const repo = require('./scoring.repository');
const rules = require('./scoring.rules');

// Score all predictions for a finished match. Persists result + points rows.
async function scoreFromData(
  matchId, ftHome, ftAway, htHome = null, htAway = null,
  etHtHome = null, etHtAway = null, etFtHome = null, etFtAway = null,
  penHome = null, penAway = null,
) {
  const id = repo.normalizeId(matchId);
  await repo.upsertResult(id, ftHome, ftAway, htHome, htAway, etHtHome, etHtAway, etFtHome, etFtAway, penHome, penAway);

  const preds = await repo.getPredictionsForMatch(id);
  if (!preds.length) return { scored: 0 };

  const ft = { home: ftHome, away: ftAway };
  const ht = htHome !== null && htAway !== null ? { home: htHome, away: htAway } : null;
  const scored = rules.scoreAllPredictions(preds, ft, ht);

  // Build a mutable points map keyed by user_id for ET/pen merging.
  const pointsMap = new Map(scored.map((r) => [r.user_id, { ...r, match_id: id }]));

  if (etFtHome !== null && etFtAway !== null) {
    const etPreds = preds.filter((p) => p.et_ft_home != null);
    const etActual = { htHome: etHtHome, htAway: etHtAway, ftHome: etFtHome, ftAway: etFtAway };
    const etScored = rules.scoreEtPredictions(etPreds, etActual);
    for (const r of etScored) {
      const row = pointsMap.get(r.user_id) || { user_id: r.user_id, match_id: id, ht_pts: 0, ft_pts: 0, outcome_pts: 0, closest_pts: 0 };
      Object.assign(row, r);
      pointsMap.set(r.user_id, row);
    }
  }

  if (penHome !== null && penAway !== null) {
    const penPreds = preds.filter((p) => p.pen_home != null);
    const penActual = { home: penHome, away: penAway };
    const penScored = rules.scorePenPredictions(penPreds, penActual);
    for (const r of penScored) {
      const row = pointsMap.get(r.user_id) || { user_id: r.user_id, match_id: id, ht_pts: 0, ft_pts: 0, outcome_pts: 0, closest_pts: 0 };
      Object.assign(row, r);
      pointsMap.set(r.user_id, row);
    }
  }

  const rows = [...pointsMap.values()];
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
