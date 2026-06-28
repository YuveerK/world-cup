'use strict';

const supabase = require('../../clients/supabaseClient');

async function getUsersWithPointsAndPredictions() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, username, pick1, winner_pts,
      points(match_id, ht_pts, ft_pts, closest_pts, outcome_pts, et_ht_pts, et_ft_pts, et_outcome_pts, et_closest_pts, pen_exact_pts, pen_winner_pts, pen_closest_pts),
      predictions(match_id, ft_home, ft_away, ht_home, ht_away, et_ht_home, et_ht_away, et_ft_home, et_ft_away, pen_home, pen_away)
    `);
  if (error) throw error;
  return data || [];
}

async function getAllResults() {
  const { data, error } = await supabase
    .from('match_results')
    .select('match_id, ht_home, ht_away, ft_home, ft_away');
  if (error) throw error;
  return data || [];
}

module.exports = { getUsersWithPointsAndPredictions, getAllResults };
