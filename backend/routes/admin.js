const { Router } = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../lib/supabase');
const { isAdminUser } = require('../lib/adminIdentity');
const deleteUserAccount = require('../lib/deleteUserAccount');
const requireAuth = require('../middleware/auth');
const { scoreFromData, tryScoreFifaById } = require('./scoring');

const router = Router();

function requireAdmin(req, res, next) {
  if (!isAdminUser(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// GET /admin/users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, pick1, pick2, created_at')
    .order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ users: data || [] });
});

// GET /admin/predictions/:matchId
router.get('/predictions/:matchId', requireAuth, requireAdmin, async (req, res) => {
  const { matchId } = req.params;
  const normalizedMatchId = String(matchId);

  try {
    const [{ data: users, error: usersError }, { data: predictions, error: predictionsError }, { data: points, error: pointsError }] = await Promise.all([
      supabase
        .from('users')
        .select('id, username, pick1, pick2, created_at')
        .order('username'),
      supabase
        .from('predictions')
        .select('user_id, match_id, ht_home, ht_away, ft_home, ft_away, submitted_at')
        .eq('match_id', normalizedMatchId),
      supabase
        .from('points')
        .select('user_id, match_id, ht_pts, ft_pts, closest_pts, outcome_pts')
        .eq('match_id', normalizedMatchId),
    ]);

    if (usersError) throw usersError;
    if (predictionsError) throw predictionsError;
    if (pointsError) throw pointsError;

    const predictionByUser = new Map((predictions || []).map(p => [p.user_id, p]));
    const pointsByUser = new Map((points || []).map(p => [p.user_id, p]));

    const rows = (users || []).map(user => ({
      user,
      prediction: predictionByUser.get(user.id) || null,
      points: pointsByUser.get(user.id) || null,
    }));

    res.json({ matchId: normalizedMatchId, rows });
  } catch (err) {
    console.error('admin predictions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/signup
router.post('/signup', requireAuth, requireAdmin, async (req, res) => {
  const { username, password, pick1, pick2 } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ username, password: hash, pick1: pick1 || null, pick2: pick2 || null })
      .select('id, username, pick1, pick2')
      .single();
    if (error) throw error;
    res.json({ user: data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /admin/users/:userId/picks
router.put('/users/:userId/picks', requireAuth, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const { pick1, pick2 } = req.body;
  const { error } = await supabase.from('users').update({ pick1, pick2 }).eq('id', userId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// PUT /admin/users/:userId/password
router.put('/users/:userId/password', requireAuth, requireAdmin, async (req, res) => {
  const { userId } = req.params;
  const newPassword = req.body.password || req.body.newPassword;
  if (!newPassword) return res.status(400).json({ error: 'password required' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const { data, error } = await supabase
      .from('users')
      .update({ password: hash })
      .eq('id', userId)
      .select('id, username')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: data });
  } catch (err) {
    console.error('admin password reset error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/users/:userId
router.delete('/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  const { userId } = req.params;

  if (String(userId) === String(req.user.id)) {
    return res.status(400).json({ error: 'Admin account cannot delete itself' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    if (isAdminUser(user)) {
      return res.status(400).json({ error: 'Admin account cannot be deleted' });
    }

    await deleteUserAccount(userId);
    res.json({ success: true, user });
  } catch (err) {
    console.error('admin delete user error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/users/:userId/predict/:matchId
router.post('/users/:userId/predict/:matchId', requireAuth, requireAdmin, async (req, res) => {
  const { userId, matchId } = req.params;
  const normalizedMatchId = String(matchId);
  const raw = req.body;

  const ft_home = parseInt(raw.ft_home);
  const ft_away = parseInt(raw.ft_away);
  if ([ft_home, ft_away].some(v => isNaN(v) || v < 0)) {
    return res.status(400).json({ error: 'ft_home and ft_away required' });
  }
  const ht_home = raw.ht_home != null ? parseInt(raw.ht_home) : null;
  const ht_away = raw.ht_away != null ? parseInt(raw.ht_away) : null;
  if ((ht_home === null) !== (ht_away === null)) {
    return res.status(400).json({ error: 'Provide both ht_home and ht_away, or neither' });
  }
  if ([ht_home, ht_away].some(v => v !== null && (isNaN(v) || v < 0))) {
    return res.status(400).json({ error: 'ht_home and ht_away must be valid scores' });
  }

  try {
    const { error } = await supabase
      .from('predictions')
      .upsert(
        { user_id: userId, match_id: normalizedMatchId, ht_home, ht_away, ft_home, ft_away, submitted_at: new Date().toISOString() },
        { onConflict: 'user_id,match_id' }
      );
    if (error) throw error;

    const { data: result } = await supabase
      .from('match_results')
      .select('*')
      .eq('match_id', normalizedMatchId)
      .maybeSingle();

    if (result && result.ht_home != null && result.ht_away != null) {
      await scoreFromData(normalizedMatchId, result.ft_home, result.ft_away, result.ht_home, result.ht_away);
      return res.json({ success: true, scored: true });
    }

    const scored = await tryScoreFifaById(normalizedMatchId);
    if (!scored && result) {
      await scoreFromData(normalizedMatchId, result.ft_home, result.ft_away, result.ht_home, result.ht_away);
      return res.json({ success: true, scored: true, partialResult: true });
    }
    res.json({ success: true, scored });
  } catch (err) {
    console.error('admin predict error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
