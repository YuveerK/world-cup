'use strict';

const supabase = require('../../clients/supabaseClient');

async function getUsersWithPointsAndPredictions() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, username, pick1, winner_pts,
      points(match_id, ht_pts, ft_pts, closest_pts, outcome_pts),
      predictions(match_id, ft_home, ft_away, ht_home, ht_away)
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
