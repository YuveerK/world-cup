'use strict';

const supabase = require('../../clients/supabaseClient');

async function upsertPrediction(userId, matchId, { ft_home, ft_away, ht_home, ht_away }) {
  const { error } = await supabase
    .from('predictions')
    .upsert(
      { user_id: userId, match_id: String(matchId), ht_home, ht_away, ft_home, ft_away, submitted_at: new Date().toISOString() },
      { onConflict: 'user_id,match_id' }
    );
  if (error) throw error;
}

async function findByUser(userId) {
  const { data, error } = await supabase
    .from('predictions')
    .select('match_id, ht_home, ht_away, ft_home, ft_away, submitted_at')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

async function findPointsByUser(userId) {
  const { data, error } = await supabase
    .from('points')
    .select('match_id, ht_pts, ft_pts, closest_pts, outcome_pts')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

async function findByMatch(matchId) {
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, ht_home, ht_away, ft_home, ft_away, users(username)')
    .eq('match_id', String(matchId));
  if (error) throw error;
  return data || [];
}

module.exports = { upsertPrediction, findByUser, findPointsByUser, findByMatch };
