const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');
const { hydrateAdminUser, isAdminUser, rememberAdminUser } = require('../lib/adminIdentity');
const deleteUserAccount = require('../lib/deleteUserAccount');
const requireAuth = require('../middleware/auth');

const router = Router();

function makeToken(user, adminOverride = false) {
  const isAdmin = Boolean(adminOverride || hydrateAdminUser(user));
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(u, adminOverride = false) {
  return {
    id: u.id,
    username: u.username,
    isAdmin: Boolean(adminOverride || isAdminUser(u)),
    winner: u.pick1,
    pick1: u.pick1,
    pick2: u.pick2,
    winner_pts: u.winner_pts,
  };
}

router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (username.trim().length < 2) return res.status(400).json({ error: 'Username must be at least 2 characters' });
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .insert({ username: username.trim(), password: hash })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Username already taken' });
      throw error;
    }

    const isAdmin = hydrateAdminUser(data);
    res.json({ token: makeToken(data, isAdmin), user: safeUser(data, isAdmin) });
  } catch (err) {
    console.error('signup error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid username or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid username or password' });

    const isAdmin = hydrateAdminUser(user);
    res.json({ token: makeToken(user, isAdmin), user: safeUser(user, isAdmin) });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });
    if (req.user.isAdmin) rememberAdminUser(user);
    const isAdmin = Boolean(req.user.isAdmin || hydrateAdminUser(user));
    res.json({ user: safeUser(user, isAdmin) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/username', requireAuth, async (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
  const { currentPassword } = req.body;
  if (!username || !currentPassword) return res.status(400).json({ error: 'username and currentPassword required' });
  if (username.length < 2) return res.status(400).json({ error: 'Username must be at least 2 characters' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const isAdmin = Boolean(req.user.isAdmin || hydrateAdminUser(user));
    if (isAdmin) rememberAdminUser(user);

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ username })
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (updateError) {
      if (updateError.code === '23505') return res.status(409).json({ error: 'Username already taken' });
      throw updateError;
    }

    if (isAdmin) rememberAdminUser(updatedUser);
    res.json({ token: makeToken(updatedUser, isAdmin), user: safeUser(updatedUser, isAdmin) });
  } catch (err) {
    console.error('username update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hash })
      .eq('id', req.user.id);

    if (updateError) throw updateError;
    res.json({ success: true });
  } catch (err) {
    console.error('password update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/account', requireAuth, async (req, res) => {
  const { currentPassword } = req.body;
  if (!currentPassword) return res.status(400).json({ error: 'currentPassword required' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password')
      .eq('id', req.user.id)
      .single();

    if (error || !user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    await deleteUserAccount(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('account delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put('/picks', requireAuth, async (req, res) => {
  const winner = typeof req.body.winner === 'string' ? req.body.winner.trim() : '';
  const pick1 = winner || (typeof req.body.pick1 === 'string' ? req.body.pick1.trim() : '');
  const pick2 = typeof req.body.pick2 === 'string' ? req.body.pick2.trim() : null;
  if (!pick1) return res.status(400).json({ error: 'winner required' });
  if (pick2 && pick1 === pick2) return res.status(400).json({ error: 'pick1 and pick2 must be different teams' });

  try {
    const { error } = await supabase
      .from('users')
      .update({ pick1, pick2 })
      .eq('id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
