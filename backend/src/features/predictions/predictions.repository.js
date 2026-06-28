'use strict';

const supabase = require('../../clients/supabaseClient');

async function upsertPrediction(userId, matchId, { ft_home, ft_away, ht_home, ht_away, et_ht_home = null, et_ht_away = null, et_ft_home = null, et_ft_away = null, pen_home = null, pen_away = null }) {
  const { error } = await supabase
    .from('predictions')
    .upsert(
      { user_id: userId, match_id: String(matchId), ht_home, ht_away, ft_home, ft_away, et_ht_home, et_ht_away, et_ft_home, et_ft_away, pen_home, pen_away, submitted_at: new Date().toISOString() },
      { onConflict: 'user_id,match_id' }
    );
  if (error) throw error;
}

async function findByUser(userId) {
  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, ht_home, ht_away, ft_home, ft_away, et_ht_home, et_ht_away, et_ft_home, et_ft_away, pen_home, pen_away, submitted_at')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

async function findPointsByUser(userId) {
  const { data, error } = await supabase
    .from('points')
    .select('match_id, ht_pts, ft_pts, closest_pts, outcome_pts, et_ht_pts, et_ft_pts, et_outcome_pts, et_closest_pts, pen_exact_pts, pen_winner_pts, pen_closest_pts')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

async function findByMatch(matchId) {
  const id = String(matchId);
  const [{ data: predictions, error: predErr }, { data: points, error: ptsErr }, { data: result, error: resErr }] = await Promise.all([
    supabase.from('predictions')
      .select('user_id, ht_home, ht_away, ft_home, ft_away, et_ht_home, et_ht_away, et_ft_home, et_ft_away, pen_home, pen_away, submitted_at, users(username)')
      .eq('match_id', id),
    supabase.from('points')
      .select('user_id, ht_pts, ft_pts, closest_pts, outcome_pts, et_ht_pts, et_ft_pts, et_outcome_pts, et_closest_pts, pen_exact_pts, pen_winner_pts, pen_closest_pts')
      .eq('match_id', id),
    supabase.from('match_results')
      .select('ht_home, ht_away, ft_home, ft_away, et_ht_home, et_ht_away, et_ft_home, et_ft_away, pen_home, pen_away')
      .eq('match_id', id)
      .maybeSingle(),
  ]);
  if (predErr) throw predErr;
  if (ptsErr) throw ptsErr;
  if (resErr) throw resErr;

  const ptsByUser = new Map((points || []).map((p) => [p.user_id, p]));
  const actualResult = result
    ? {
        ht_home: result.ht_home, ht_away: result.ht_away,
        ft_home: result.ft_home, ft_away: result.ft_away,
        et_ht_home: result.et_ht_home, et_ht_away: result.et_ht_away,
        et_ft_home: result.et_ft_home, et_ft_away: result.et_ft_away,
        pen_home: result.pen_home, pen_away: result.pen_away,
      }
    : null;

  return {
    actualResult,
    predictions: (predictions || []).map((pred) => {
      const pts = ptsByUser.get(pred.user_id) || {};
      return {
        user_id: pred.user_id,
        username: pred.users?.username,
        ht_home: pred.ht_home, ht_away: pred.ht_away,
        ft_home: pred.ft_home, ft_away: pred.ft_away,
        et_ht_home: pred.et_ht_home, et_ht_away: pred.et_ht_away,
        et_ft_home: pred.et_ft_home, et_ft_away: pred.et_ft_away,
        pen_home: pred.pen_home, pen_away: pred.pen_away,
        submitted_at: pred.submitted_at ?? null,
        ht_pts: pts.ht_pts ?? null,
        ft_pts: pts.ft_pts ?? null,
        closest_pts: pts.closest_pts ?? null,
        outcome_pts: pts.outcome_pts ?? null,
        et_ht_pts: pts.et_ht_pts ?? null,
        et_ft_pts: pts.et_ft_pts ?? null,
        et_outcome_pts: pts.et_outcome_pts ?? null,
        et_closest_pts: pts.et_closest_pts ?? null,
        pen_exact_pts: pts.pen_exact_pts ?? null,
        pen_winner_pts: pts.pen_winner_pts ?? null,
        pen_closest_pts: pts.pen_closest_pts ?? null,
      };
    }),
  };
}

module.exports = { upsertPrediction, findByUser, findPointsByUser, findByMatch };
