'use strict';

const HT_EXACT_PTS = 5;
const FT_EXACT_PTS = 10;
const CLOSEST_TOTAL_PTS = 6;
const OUTCOME_PTS = 4;

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
  computeClosest,
  HT_EXACT_PTS,
  FT_EXACT_PTS,
  CLOSEST_TOTAL_PTS,
  OUTCOME_PTS,
};
