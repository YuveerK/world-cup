'use strict';

const bcrypt = require('bcryptjs');
const supabase = require('../../clients/supabaseClient');
const { ValidationError, NotFoundError } = require('../../shared/http/errors');
const usersRepo = require('../users/users.repository');
const deleteUserAccount = require('../users/deleteUser.service');
const { isAdminUser } = require('../users/adminIdentity.service');
const { scoreFromData } = require('../scoring/scoring.service');
const { tryScoreById } = require('../scoring/fifaScoring.service');
const scoringRepo = require('../scoring/scoring.repository');

async function listUsers() {
  return usersRepo.listAll();
}

async function getPredictionsForMatch(matchId) {
  const id = String(matchId);
  const [{ data: users, error: usersErr }, { data: predictions, error: predsErr }, { data: points, error: ptsErr }] =
    await Promise.all([
      supabase.from('users').select('id, username, pick1, pick2, created_at').order('username'),
      supabase.from('predictions').select('user_id, match_id, ht_home, ht_away, ft_home, ft_away, submitted_at').eq('match_id', id),
      supabase.from('points').select('user_id, match_id, ht_pts, ft_pts, closest_pts, outcome_pts').eq('match_id', id),
    ]);
  if (usersErr) throw usersErr;
  if (predsErr) throw predsErr;
  if (ptsErr) throw ptsErr;

  const predByUser = new Map((predictions || []).map((p) => [p.user_id, p]));
  const ptsByUser = new Map((points || []).map((p) => [p.user_id, p]));
  const rows = (users || []).map((user) => ({
    user,
    prediction: predByUser.get(user.id) || null,
    points: ptsByUser.get(user.id) || null,
  }));
  return { matchId: id, rows };
}

async function createUser(username, password, pick1, pick2) {
  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({ username, password: hash, pick1: pick1 || null, pick2: pick2 || null })
    .select('id, username, pick1, pick2')
    .single();
  if (error) throw error;
  return data;
}

async function updateUserPicks(userId, pick1, pick2) {
  await usersRepo.updatePicks(userId, pick1, pick2);
}

async function resetUserPassword(userId, newPassword) {
  const hash = await bcrypt.hash(newPassword, 10);
  const { data, error } = await supabase
    .from('users')
    .update({ password: hash })
    .eq('id', userId)
    .select('id, username')
    .single();
  if (error) throw error;
  if (!data) throw new NotFoundError('User not found');
  return data;
}

async function deleteUser(userId, requestingAdminId) {
  if (String(userId) === String(requestingAdminId)) {
    throw new ValidationError('Admin account cannot delete itself');
  }
  const user = await supabase.from('users').select('id, username').eq('id', userId).single();
  if (user.error || !user.data) throw new NotFoundError('User not found');
  if (isAdminUser(user.data)) throw new ValidationError('Admin account cannot be deleted');
  await deleteUserAccount(userId);
  return user.data;
}

async function setUserPrediction(userId, matchId, scores) {
  const { ft_home, ft_away, ht_home, ht_away } = scores;
  const id = String(matchId);
  const { error } = await supabase
    .from('predictions')
    .upsert(
      { user_id: userId, match_id: id, ht_home, ht_away, ft_home, ft_away, submitted_at: new Date().toISOString() },
      { onConflict: 'user_id,match_id' }
    );
  if (error) throw error;

  const result = await scoringRepo.findResult(id);
  if (result && result.ht_home != null && result.ht_away != null) {
    await scoreFromData(id, result.ft_home, result.ft_away, result.ht_home, result.ht_away);
    return { scored: true };
  }

  const scored = await tryScoreById(id);
  if (!scored && result) {
    await scoreFromData(id, result.ft_home, result.ft_away, result.ht_home, result.ht_away);
    return { scored: true, partialResult: true };
  }
  return { scored };
}

module.exports = {
  listUsers,
  getPredictionsForMatch,
  createUser,
  updateUserPicks,
  resetUserPassword,
  deleteUser,
  setUserPrediction,
};
