'use strict';

const supabase = require('../../clients/supabaseClient');

async function findByUsername(username) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username.trim())
    .single();
  // PGRST116 = row not found — return null instead of throwing
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function create(username, passwordHash) {
  const { data, error } = await supabase
    .from('users')
    .insert({ username: username.trim(), password: passwordHash })
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = { findByUsername, create };
