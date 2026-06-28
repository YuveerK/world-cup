import { roundPoints } from '@/lib/utils/number';

export function getPredictionRowTotal(row) {
  return roundPoints(
    (row.ht_pts || 0) + (row.ft_pts || 0) + (row.closest_pts || 0) + (row.outcome_pts || 0) +
    (row.et_ht_pts || 0) + (row.et_ft_pts || 0) + (row.et_outcome_pts || 0) + (row.et_closest_pts || 0) +
    (row.pen_exact_pts || 0) + (row.pen_winner_pts || 0) + (row.pen_closest_pts || 0),
  );
}

export function sortPredictionRowsByPoints(rows = []) {
  return [...rows].sort((a, b) => getPredictionRowTotal(b) - getPredictionRowTotal(a));
}

export function getSubmissionStats(rows = []) {
  const times = rows
    .filter((row) => row.submitted_at)
    .map((row) => new Date(row.submitted_at).getTime())
    .filter(Number.isFinite);

  if (!times.length) return null;

  const earliest = new Date(Math.min(...times));
  const latest = new Date(Math.max(...times));
  const avgMs = times.reduce((sum, time) => sum + time, 0) / times.length;

  return {
    earliest,
    latest,
    avg: new Date(avgMs),
    count: times.length,
  };
}

export function getPredictionUsername(row) {
  return row.username || (Array.isArray(row.users) ? row.users[0]?.username : row.users?.username) || '-';
}

export function hasScoredPredictionRows(rows = []) {
  return rows.some((row) => row.ht_pts != null || row.ft_pts != null);
}

export function scorePair(home, away) {
  return home != null ? `${home}\u2013${away}` : null;
}
