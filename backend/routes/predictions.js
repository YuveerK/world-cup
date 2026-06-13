const { Router } = require('express');
const axios = require('axios');
const supabase = require('../lib/supabase');
const requireAuth = require('../middleware/auth');
const { scoreFromData, tryScoreFifaById } = require('./scoring');

const router = Router();
const BASE = 'https://api.fifa.com/api/v3';
const COMPETITION = '17';
const SEASON = '285023';

// Short-lived calendar cache so a burst of saves near kickoff doesn't hammer
// the FIFA API (kickoff times effectively never change within the window).
let calendarCache = { at: 0, results: null };
const CALENDAR_TTL_MS = 60_000;

async function getCalendar() {
  if (calendarCache.results && Date.now() - calendarCache.at < CALENDAR_TTL_MS) {
    return calendarCache.results;
  }
  const { data } = await axios.get(
    `${BASE}/calendar/matches?idCompetition=${COMPETITION}&idSeason=${SEASON}&count=500&language=en`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  calendarCache = { at: Date.now(), results: data.Results || [] };
  return calendarCache.results;
}

async function getMatchKickoff(matchId) {
  const results = await getCalendar();
  const match = results.find(m => String(m.IdMatch) === String(matchId));
  return match ? new Date(match.Date) : null;
}

// POST /predictions/:matchId  { ft_home, ft_away, ht_home?, ht_away? }
// No lockout — predictions can be submitted at any time.
// If the match is already scored, points are recalculated immediately.
router.post('/:matchId', requireAuth, async (req, res) => {
  const { matchId } = req.params;
  const raw = req.body;

  const ft_home = parseInt(raw.ft_home);
  const ft_away = parseInt(raw.ft_away);
  if ([ft_home, ft_away].some(v => isNaN(v) || v < 0)) {
    return res.status(400).json({ error: 'ft_home and ft_away are required' });
  }

  const ht_home = raw.ht_home != null ? parseInt(raw.ht_home) : null;
  const ht_away = raw.ht_away != null ? parseInt(raw.ht_away) : null;
  if ((ht_home === null) !== (ht_away === null)) {
    return res.status(400).json({ error: 'Provide both ht_home and ht_away, or neither' });
  }

  try {
    const kickoff = await getMatchKickoff(matchId);
    if (kickoff && new Date() >= kickoff) {
      return res.status(423).json({ error: 'Predictions are locked after kickoff' });
    }

    const { error } = await supabase
      .from('predictions')
      .upsert(
        { user_id: req.user.id, match_id: matchId, ht_home, ht_away, ft_home, ft_away, submitted_at: new Date().toISOString() },
        { onConflict: 'user_id,match_id' }
      );
    if (error) throw error;

    // We only reach here before kickoff (post-kickoff saves are locked above),
    // so when the kickoff time is known the match can't have a result yet —
    // skip the (expensive) result lookup and FIFA re-score entirely.
    if (kickoff) {
      return res.json({ success: true, scored: false });
    }

    // Kickoff unknown (match not in calendar) — fall back to result/FIFA scoring
    const { data: result } = await supabase
      .from('match_results')
      .select('*')
      .eq('match_id', matchId)
      .maybeSingle();

    if (result && result.ht_home != null && result.ht_away != null) {
      await scoreFromData(matchId, result.ft_home, result.ft_away, result.ht_home, result.ht_away);
      return res.json({ success: true, scored: true });
    }

    // No stored result yet — check FIFA API directly (handles status lag)
    const scored = await tryScoreFifaById(matchId);
    if (!scored && result) {
      await scoreFromData(matchId, result.ft_home, result.ft_away, result.ht_home, result.ht_away);
      return res.json({ success: true, scored: true, partialResult: true });
    }
    res.json({ success: true, scored });
  } catch (err) {
    console.error('prediction upsert error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /predictions/my
router.get('/my', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('match_id, ht_home, ht_away, ft_home, ft_away, submitted_at')
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ predictions: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /predictions/my/points
router.get('/my/points', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('points')
      .select('match_id, ht_pts, ft_pts, closest_pts, outcome_pts')
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ points: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /predictions/force/:matchId  — dev only, same as regular but bypasses nothing (already no lockout)
router.post('/force/:matchId', requireAuth, async (req, res) => {
  req.params.matchId = req.params.matchId;
  return router.handle({ ...req, url: `/${req.params.matchId}`, params: { matchId: req.params.matchId } }, res, () => {});
});

// GET /predictions/:matchId/all  (only after kickoff)
router.get('/:matchId/all', requireAuth, async (req, res) => {
  const { matchId } = req.params;
  try {
    const kickoff = await getMatchKickoff(matchId);
    if (kickoff && new Date() < kickoff) {
      return res.status(403).json({ error: 'Predictions are hidden until kickoff' });
    }
    const { data, error } = await supabase
      .from('predictions')
      .select('user_id, ht_home, ht_away, ft_home, ft_away, users(username)')
      .eq('match_id', matchId);
    if (error) throw error;
    res.json({ predictions: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
