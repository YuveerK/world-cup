'use strict';

const supabase = require('../../clients/supabaseClient');

async function findById(id) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function findByIdMinimal(id) {
  const { data, error } = await supabase
    .from('users').select('id, password').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function updateUsername(id, username) {
  const { data, error } = await supabase
    .from('users').update({ username }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

async function updatePassword(id, passwordHash) {
  const { error } = await supabase.from('users').update({ password: passwordHash }).eq('id', id);
  if (error) throw error;
}

async function updatePicks(id, pick1, pick2) {
  const { error } = await supabase.from('users').update({ pick1, pick2 }).eq('id', id);
  if (error) throw error;
}

async function listAll() {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, pick1, pick2, created_at')
    .order('created_at');
  if (error) throw error;
  return data || [];
}

async function updateWinnerPts(winningTeam, pts) {
  const { error } = await supabase
    .from('users')
    .update({ winner_pts: pts })
    .or(`pick1.eq.${winningTeam},pick2.eq.${winningTeam}`);
  if (error) throw error;
}

module.exports = {
  findById,
  findByIdMinimal,
  updateUsername,
  updatePassword,
  updatePicks,
  listAll,
  updateWinnerPts,
};
