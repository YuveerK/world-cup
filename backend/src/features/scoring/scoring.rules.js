'use strict';

const HT_EXACT_PTS = 5;
const FT_EXACT_PTS = 10;
const CLOSEST_TOTAL_PTS = 6;
const OUTCOME_PTS = 4;

const ET_HT_EXACT_PTS = 3;
const ET_FT_EXACT_PTS = 6;
const ET_OUTCOME_PTS = 3;
const ET_CLOSEST_TOTAL_PTS = 4;
const PEN_EXACT_PTS = 5;
const PEN_WINNER_PTS = 3;
const PEN_CLOSEST_TOTAL_PTS = 4;

function outcome(home, away) {
  return Math.sign(home - away); // 1 home win, -1 away win, 0 draw
}

function calcHtPts(pred, ht) {
  if (!ht || pred.ht_home === null || pred.ht_away === null) return 0;
  return pred.ht_home === ht.home && pred.ht_away === ht.away ? HT_EXACT_PTS : 0;
}

function calcFtPts(pred, ft) {
  return pred.ft_home === ft.home && pred.ft_away === ft.away ? FT_EXACT_PTS : 0;
}

function calcOutcomePts(pred, ft) {
  return outcome(pred.ft_home, pred.ft_away) === outcome(ft.home, ft.away) ? OUTCOME_PTS : 0;
}

// Returns { winnerIds: Set, ptsEach: number }
function computeClosest(preds, ft) {
  const distances = preds.map((p) => ({
    user_id: p.user_id,
    dist: Math.abs(p.ft_home - ft.home) + Math.abs(p.ft_away - ft.away),
  }));
  const minDist = Math.min(...distances.map((d) => d.dist));
  const winners = distances.filter((d) => d.dist === minDist);
  return {
    winnerIds: new Set(winners.map((d) => d.user_id)),
    ptsEach: CLOSEST_TOTAL_PTS / winners.length,
  };
}

// Pure function: takes predictions + match scores, returns scored rows.
function scoreAllPredictions(preds, ft, ht) {
  const { winnerIds, ptsEach } = computeClosest(preds, ft);
  return preds.map((p) => ({
    user_id: p.user_id,
    ht_pts: calcHtPts(p, ht),
    ft_pts: calcFtPts(p, ft),
    outcome_pts: calcOutcomePts(p, ft),
    closest_pts: winnerIds.has(p.user_id) ? ptsEach : 0,
  }));
}

// ── Extra time ────────────────────────────────────────────────────────────────

function calcEtHtPts(pred, etActual) {
  if (pred.et_ht_home == null || !etActual) return 0;
  return pred.et_ht_home === etActual.htHome && pred.et_ht_away === etActual.htAway ? ET_HT_EXACT_PTS : 0;
}

function calcEtFtPts(pred, etActual) {
  if (pred.et_ft_home == null || !etActual) return 0;
  return pred.et_ft_home === etActual.ftHome && pred.et_ft_away === etActual.ftAway ? ET_FT_EXACT_PTS : 0;
}

function calcEtOutcomePts(pred, etActual) {
  if (pred.et_ft_home == null || !etActual) return 0;
  return outcome(pred.et_ft_home, pred.et_ft_away) === outcome(etActual.ftHome, etActual.ftAway) ? ET_OUTCOME_PTS : 0;
}

// Only ET-predictors (et_ft_home != null) compete for ET closest.
function computeEtClosest(etPreds, etActual) {
  const distances = etPreds.map((p) => ({
    user_id: p.user_id,
    dist: Math.abs(p.et_ft_home - etActual.ftHome) + Math.abs(p.et_ft_away - etActual.ftAway),
  }));
  const minDist = Math.min(...distances.map((d) => d.dist));
  const winners = distances.filter((d) => d.dist === minDist);
  return {
    winnerIds: new Set(winners.map((d) => d.user_id)),
    ptsEach: ET_CLOSEST_TOTAL_PTS / winners.length,
  };
}

// etPreds: only predictions where et_ft_home != null. etActual: { htHome, htAway, ftHome, ftAway }
function scoreEtPredictions(etPreds, etActual) {
  if (!etPreds.length) return [];
  const { winnerIds, ptsEach } = computeEtClosest(etPreds, etActual);
  return etPreds.map((p) => ({
    user_id: p.user_id,
    et_ht_pts: calcEtHtPts(p, etActual),
    et_ft_pts: calcEtFtPts(p, etActual),
    et_outcome_pts: calcEtOutcomePts(p, etActual),
    et_closest_pts: winnerIds.has(p.user_id) ? ptsEach : 0,
  }));
}

// ── Penalties ─────────────────────────────────────────────────────────────────

function calcPenExactPts(pred, penActual) {
  if (pred.pen_home == null || !penActual) return 0;
  return pred.pen_home === penActual.home && pred.pen_away === penActual.away ? PEN_EXACT_PTS : 0;
}

function calcPenWinnerPts(pred, penActual) {
  if (pred.pen_home == null || !penActual) return 0;
  const predOutcome = outcome(pred.pen_home, pred.pen_away);
  const actualOutcome = outcome(penActual.home, penActual.away);
  // Penalty outcomes should never be draws; guard just in case of bad data.
  if (predOutcome === 0 || actualOutcome === 0) return 0;
  return predOutcome === actualOutcome ? PEN_WINNER_PTS : 0;
}

// Only pen-predictors (pen_home != null) compete for pen closest.
function computePenClosest(penPreds, penActual) {
  const distances = penPreds.map((p) => ({
    user_id: p.user_id,
    dist: Math.abs(p.pen_home - penActual.home) + Math.abs(p.pen_away - penActual.away),
  }));
  const minDist = Math.min(...distances.map((d) => d.dist));
  const winners = distances.filter((d) => d.dist === minDist);
  return {
    winnerIds: new Set(winners.map((d) => d.user_id)),
    ptsEach: PEN_CLOSEST_TOTAL_PTS / winners.length,
  };
}

// penPreds: only predictions where pen_home != null. penActual: { home, away }
function scorePenPredictions(penPreds, penActual) {
  if (!penPreds.length) return [];
  const { winnerIds, ptsEach } = computePenClosest(penPreds, penActual);
  return penPreds.map((p) => ({
    user_id: p.user_id,
    pen_exact_pts: calcPenExactPts(p, penActual),
    pen_winner_pts: calcPenWinnerPts(p, penActual),
    pen_closest_pts: winnerIds.has(p.user_id) ? ptsEach : 0,
  }));
}

// Pure function: scores only HT, preserving existing FT/outcome/closest pts.
function scoreHalfTimePredictions(preds, ht, existingByUserId) {
  return preds.map((p) => {
    const existing = existingByUserId.get(p.user_id) || {};
    return {
      user_id: p.user_id,
      ht_pts: p.ht_home === ht.home && p.ht_away === ht.away ? HT_EXACT_PTS : 0,
      ft_pts: existing.ft_pts || 0,
      closest_pts: existing.closest_pts || 0,
      outcome_pts: existing.outcome_pts || 0,
    };
  });
}

module.exports = {
  scoreAllPredictions,
  scoreHalfTimePredictions,
  scoreEtPredictions,
  scorePenPredictions,
  computeClosest,
  HT_EXACT_PTS,
  FT_EXACT_PTS,
  CLOSEST_TOTAL_PTS,
  OUTCOME_PTS,
  ET_HT_EXACT_PTS,
  ET_FT_EXACT_PTS,
  ET_OUTCOME_PTS,
  ET_CLOSEST_TOTAL_PTS,
  PEN_EXACT_PTS,
  PEN_WINNER_PTS,
  PEN_CLOSEST_TOTAL_PTS,
};
