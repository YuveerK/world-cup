'use strict';

const repo = require('./leaderboard.repository');

function round1(n) { return Math.round(n * 10) / 10; }

async function getRankedLeaderboard() {
  const [users, results] = await Promise.all([
    repo.getUsersWithPointsAndPredictions(),
    repo.getAllResults(),
  ]);

  const resultMap = new Map(results.map((r) => [String(r.match_id), r]));

  const rows = users.map((u) => {
    const pts = u.points || [];
    const preds = u.predictions || [];
    const pointMap = new Map(pts.map((p) => [String(p.match_id), p]));
    const predMap = new Map(preds.map((p) => [String(p.match_id), p]));
    const matchIds = [...new Set([...pts.map((p) => String(p.match_id)), ...preds.map((p) => String(p.match_id))])];

    const htTotal = pts.reduce((s, p) => s + (p.ht_pts || 0), 0);
    const ftTotal = pts.reduce((s, p) => s + (p.ft_pts || 0), 0);
    const closestTotal = pts.reduce((s, p) => s + (p.closest_pts || 0), 0);
    const outcomeTotal = pts.reduce((s, p) => s + (p.outcome_pts || 0), 0);
    const total = htTotal + ftTotal + closestTotal + outcomeTotal + (u.winner_pts || 0);

    const match_points = matchIds
      .map((matchId) => {
        const p = pointMap.get(matchId) || {};
        return {
          match_id: matchId,
          ht_pts: p.ht_pts || 0,
          ft_pts: p.ft_pts || 0,
          closest_pts: round1(p.closest_pts || 0),
          outcome_pts: p.outcome_pts || 0,
          match_total: round1((p.ht_pts || 0) + (p.ft_pts || 0) + (p.closest_pts || 0) + (p.outcome_pts || 0)),
          prediction: predMap.get(matchId) || null,
          result: resultMap.get(matchId) || null,
          scored: pointMap.has(matchId),
        };
      })
      .sort((a, b) => b.match_total - a.match_total || String(a.match_id).localeCompare(String(b.match_id)));

    return {
      id: u.id,
      username: u.username,
      winner: u.pick1,
      total: round1(total),
      ht_pts: htTotal,
      ft_pts: ftTotal,
      closest_pts: round1(closestTotal),
      outcome_pts: outcomeTotal,
      winner_pts: u.winner_pts || 0,
      predictions_count: preds.length,
      match_points,
    };
  });

  return rows
    .sort((a, b) => b.total - a.total || a.username.localeCompare(b.username))
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

module.exports = { getRankedLeaderboard };
