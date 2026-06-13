const { Router } = require('express');
const supabase = require('../lib/supabase');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [{ data: users, error }, { data: results, error: resultsError }] = await Promise.all([
      supabase
      .from('users')
      .select(`
        id, username, pick1, winner_pts,
        points(match_id, ht_pts, ft_pts, closest_pts, outcome_pts),
        predictions(match_id, ft_home, ft_away, ht_home, ht_away)
      `),
      supabase
        .from('match_results')
        .select('match_id, ht_home, ht_away, ft_home, ft_away')
    ]);

    if (error) throw error;
    if (resultsError) throw resultsError;

    const resultMap = new Map((results || []).map(r => [String(r.match_id), r]));

    const rows = (users || [])
      .map(u => {
        const pts = u.points || [];
        const preds = u.predictions || [];
        const pointMap = new Map(pts.map(p => [String(p.match_id), p]));
        const predMap = new Map(preds.map(p => [String(p.match_id), p]));
        const matchIds = [...new Set([
          ...pts.map(p => String(p.match_id)),
          ...preds.map(p => String(p.match_id)),
        ])];

        const htTotal = pts.reduce((s, p) => s + (p.ht_pts || 0), 0);
        const ftTotal = pts.reduce((s, p) => s + (p.ft_pts || 0), 0);
        const closestTotal = pts.reduce((s, p) => s + (p.closest_pts || 0), 0);
        const outcomeTotal = pts.reduce((s, p) => s + (p.outcome_pts || 0), 0);
        const total = htTotal + ftTotal + closestTotal + outcomeTotal + (u.winner_pts || 0);

        const match_points = matchIds.map(matchId => {
          const p = pointMap.get(matchId) || {};
          const closestPts = Math.round((p.closest_pts || 0) * 10) / 10;
          return {
            match_id: matchId,
            ht_pts: p.ht_pts || 0,
            ft_pts: p.ft_pts || 0,
            closest_pts: closestPts,
            outcome_pts: p.outcome_pts || 0,
            match_total: Math.round(((p.ht_pts || 0) + (p.ft_pts || 0) + (p.closest_pts || 0) + (p.outcome_pts || 0)) * 10) / 10,
            prediction: predMap.get(matchId) || null,
            result: resultMap.get(matchId) || null,
            scored: pointMap.has(matchId),
          };
        }).sort((a, b) => {
          if (b.match_total !== a.match_total) return b.match_total - a.match_total;
          return String(a.match_id).localeCompare(String(b.match_id));
        });

        return {
          id: u.id,
          username: u.username,
          winner: u.pick1,
          total: Math.round(total * 10) / 10,
          ht_pts: htTotal,
          ft_pts: ftTotal,
          closest_pts: Math.round(closestTotal * 10) / 10,
          outcome_pts: outcomeTotal,
          winner_pts: u.winner_pts || 0,
          predictions_count: preds.length,
          match_points,
        };
      })
      .sort((a, b) => b.total - a.total)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    res.json({ leaderboard: rows });
  } catch (err) {
    console.error('Leaderboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
