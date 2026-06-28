'use strict';

const supabase = require('../../clients/supabaseClient');

function normalizeId(id) { return String(id); }

async function upsertResult(
  matchId, ftHome, ftAway, htHome, htAway,
  etHtHome = null, etHtAway = null, etFtHome = null, etFtAway = null,
  penHome = null, penAway = null,
) {
  const { error } = await supabase
    .from('match_results')
    .upsert({
      match_id: normalizeId(matchId),
      ht_home: htHome, ht_away: htAway,
      ft_home: ftHome, ft_away: ftAway,
      et_ht_home: etHtHome, et_ht_away: etHtAway,
      et_ft_home: etFtHome, et_ft_away: etFtAway,
      pen_home: penHome, pen_away: penAway,
    });
  if (error) throw error;
}

async function findResult(matchId) {
  const { data, error } = await supabase
    .from('match_results').select('*').eq('match_id', normalizeId(matchId)).maybeSingle();
  if (error) throw error;
  return data;
}

async function findResultsIn(matchIds) {
  if (!matchIds.length) return [];
  const { data, error } = await supabase
    .from('match_results')
    .select('match_id, ht_home, ht_away, ft_home, ft_away, et_ft_home, et_ft_away')
    .in('match_id', matchIds);
  if (error) throw error;
  return data || [];
}

async function deleteResult(matchId) {
  const { error } = await supabase.from('match_results').delete().eq('match_id', normalizeId(matchId));
  if (error) throw error;
}

async function getPredictionsForMatch(matchId) {
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, ht_home, ht_away, ft_home, ft_away, et_ht_home, et_ht_away, et_ft_home, et_ft_away, pen_home, pen_away')
    .eq('match_id', normalizeId(matchId));
  if (error) throw error;
  return data || [];
}

async function getExistingPointsForMatch(matchId, userIds) {
  if (!userIds.length) return [];
  const { data, error } = await supabase
    .from('points')
    .select('user_id, ft_pts, closest_pts, outcome_pts, et_ht_pts, et_ft_pts, et_outcome_pts, et_closest_pts, pen_exact_pts, pen_winner_pts, pen_closest_pts')
    .eq('match_id', normalizeId(matchId))
    .in('user_id', userIds);
  if (error) throw error;
  return data || [];
}

async function upsertPoints(rows) {
  const { error } = await supabase.from('points').upsert(rows, { onConflict: 'user_id,match_id' });
  if (error) throw error;
}

async function deletePoints(matchId) {
  const { error } = await supabase.from('points').delete().eq('match_id', normalizeId(matchId));
  if (error) throw error;
}

module.exports = {
  upsertResult,
  findResult,
  findResultsIn,
  deleteResult,
  getPredictionsForMatch,
  getExistingPointsForMatch,
  upsertPoints,
  deletePoints,
  normalizeId,
};
