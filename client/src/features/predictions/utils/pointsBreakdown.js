import { scorePair } from './predictionRows';

// Mirrors backend scoring.rules.js — keep in sync.
export const SCORING = {
  HT_EXACT: 5,
  FT_EXACT: 10,
  OUTCOME: 4,
  CLOSEST_POOL: 6,
  ET_HT_EXACT: 3,
  ET_FT_EXACT: 6,
  ET_OUTCOME: 3,
  ET_CLOSEST_POOL: 4,
  PEN_EXACT: 5,
  PEN_WINNER: 3,
  PEN_CLOSEST_POOL: 4,
};

// Actual scores per phase, in match order, for phases that happened.
export function getResultTimeline(actual) {
  if (!actual) return [];
  const segments = [];
  if (actual.ht_home != null) segments.push({ label: 'HT', score: scorePair(actual.ht_home, actual.ht_away) });
  if (actual.ft_home != null) segments.push({ label: "90'", score: scorePair(actual.ft_home, actual.ft_away) });
  if (actual.et_ht_home != null) segments.push({ label: 'ET HT', score: scorePair(actual.et_ht_home, actual.et_ht_away) });
  if (actual.et_ft_home != null) segments.push({ label: 'ET', score: scorePair(actual.et_ft_home, actual.et_ft_away) });
  if (actual.pen_home != null) segments.push({ label: 'Pens', score: scorePair(actual.pen_home, actual.pen_away) });
  return segments;
}

// One line item per scoring rule that applied to this match.
// state: 'earned' | 'missed' | 'nopick'; shortLabel feeds compact summaries.
export function buildPointsBreakdown(row, actual, { homeName, awayName } = {}) {
  if (!actual || actual.ft_home == null) return [];

  const lines = [];
  const ftActual = scorePair(actual.ft_home, actual.ft_away);

  if (actual.ht_home != null) {
    lines.push(exactLine('ht', 'Exact half-time score', 'HT exact', scorePair(row.ht_home, row.ht_away), scorePair(actual.ht_home, actual.ht_away), row.ht_pts));
  }
  lines.push(exactLine('ft', "Exact 90' score", "90' exact", scorePair(row.ft_home, row.ft_away), ftActual, row.ft_pts));
  lines.push(outcomeLine('outcome', "90' outcome", "90' result", row.ft_home, row.ft_away, actual.ft_home, actual.ft_away, row.outcome_pts, homeName, awayName));
  lines.push(closestLine('closest', "Closest 90' score", "90' closest", scorePair(row.ft_home, row.ft_away), ftActual, row.closest_pts, SCORING.CLOSEST_POOL));

  if (actual.et_ht_home != null) {
    lines.push(exactLine('et_ht', 'Exact ET half-time', 'ET HT exact', scorePair(row.et_ht_home, row.et_ht_away), scorePair(actual.et_ht_home, actual.et_ht_away), row.et_ht_pts));
  }
  if (actual.et_ft_home != null) {
    const etActual = scorePair(actual.et_ft_home, actual.et_ft_away);
    lines.push(exactLine('et_ft', 'Exact ET score', 'ET exact', scorePair(row.et_ft_home, row.et_ft_away), etActual, row.et_ft_pts));
    lines.push(outcomeLine('et_outcome', 'ET outcome', 'ET result', row.et_ft_home, row.et_ft_away, actual.et_ft_home, actual.et_ft_away, row.et_outcome_pts, homeName, awayName));
    lines.push(closestLine('et_closest', 'Closest ET score', 'ET closest', scorePair(row.et_ft_home, row.et_ft_away), etActual, row.et_closest_pts, SCORING.ET_CLOSEST_POOL));
  }

  if (actual.pen_home != null) {
    const penActual = scorePair(actual.pen_home, actual.pen_away);
    lines.push(exactLine('pen_exact', 'Exact shoot-out score', 'Pens exact', scorePair(row.pen_home, row.pen_away), penActual, row.pen_exact_pts));
    lines.push(outcomeLine('pen_winner', 'Shoot-out winner', 'Pens winner', row.pen_home, row.pen_away, actual.pen_home, actual.pen_away, row.pen_winner_pts, homeName, awayName));
    lines.push(closestLine('pen_closest', 'Closest shoot-out score', 'Pens closest', scorePair(row.pen_home, row.pen_away), penActual, row.pen_closest_pts, SCORING.PEN_CLOSEST_POOL));
  }

  return lines;
}

function exactLine(id, label, shortLabel, pick, actualPair, pts) {
  const earned = (pts || 0) > 0;
  return {
    id,
    label,
    shortLabel,
    pts: pts || 0,
    state: pick == null ? 'nopick' : earned ? 'earned' : 'missed',
    detail: pick == null ? 'no pick' : earned ? `picked ${pick}` : `picked ${pick}, was ${actualPair}`,
  };
}

function outcomeLine(id, label, shortLabel, pickHome, pickAway, actualHome, actualAway, pts, homeName, awayName) {
  const earned = (pts || 0) > 0;
  const hasPick = pickHome != null;
  const picked = hasPick ? outcomeName(pickHome, pickAway, homeName, awayName) : null;
  return {
    id,
    label,
    shortLabel,
    pts: pts || 0,
    state: !hasPick ? 'nopick' : earned ? 'earned' : 'missed',
    detail: !hasPick
      ? 'no pick'
      : earned
        ? `picked ${picked}`
        : `picked ${picked}, was ${outcomeName(actualHome, actualAway, homeName, awayName)}`,
  };
}

function closestLine(id, label, shortLabel, pick, actualPair, pts, pool) {
  const earned = (pts || 0) > 0;
  return {
    id,
    label,
    shortLabel,
    pts: pts || 0,
    state: pick == null ? 'nopick' : earned ? 'earned' : 'missed',
    detail: pick == null ? 'no pick' : earned ? splitDetail(pool, pts, actualPair) : 'not the closest pick',
  };
}

// Winners of a closest pool split it evenly, so the tie size is pool / share.
function splitDetail(pool, pts, actualPair) {
  const ties = Math.max(1, Math.round(pool / pts));
  return ties > 1 ? `${ties}-way tie · ${pool} pts ÷ ${ties}` : `closest to ${actualPair}`;
}

function outcomeName(home, away, homeName, awayName) {
  const sign = Math.sign(Number(home) - Number(away));
  if (sign > 0) return homeName || 'home win';
  if (sign < 0) return awayName || 'away win';
  return 'a draw';
}
