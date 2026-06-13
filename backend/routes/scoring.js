const { Router } = require('express');
const axios = require('axios');
const supabase = require('../lib/supabase');

const router = Router();
const BASE = 'https://api.fifa.com/api/v3';
const COMPETITION = '17';
const SEASON = '285023';

// FIFA leaves some finished matches at MatchStatus 0/1 with a 0–0 score, which
// is indistinguishable from a pre-match fixture by score alone. Once this long
// has passed since kickoff we treat a non-live match as finished regardless of
// its (possibly 0–0) score, so genuine goalless results still get scored.
const FINISHED_AFTER_MS = 150 * 60 * 1000;

function isLongPastKickoff(match) {
  const t = match?.Date ? new Date(match.Date).getTime() : NaN;
  return Number.isFinite(t) && Date.now() - t > FINISHED_AFTER_MS;
}

async function get(url) {
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  return data;
}

function matchIdKey(matchId) {
  return String(matchId);
}

function sameMatchId(left, right) {
  return matchIdKey(left) === matchIdKey(right);
}

function hasCalendarScore(match) {
  return match.HomeTeamScore != null && match.AwayTeamScore != null;
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readScorePair(source, homeKeys, awayKeys) {
  if (!source) return null;

  for (const homeKey of homeKeys) {
    for (const awayKey of awayKeys) {
      const home = numberOrNull(source[homeKey]);
      const away = numberOrNull(source[awayKey]);
      if (home !== null && away !== null) {
        return { home, away };
      }
    }
  }

  return null;
}

function eventMinuteNumber(event) {
  const raw = event.MatchMinute ?? event.Minute ?? event.EventMinute;
  const match = String(raw ?? '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

function eventDescription(event) {
  return [
    event.EventDescription?.[0]?.Description,
    event.TypeLocalized?.[0]?.Description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function eventScore(event) {
  return readScorePair(
    event,
    ['HomeGoals', 'HomeGoal', 'HomeScore', 'HomeTeamScore'],
    ['AwayGoals', 'AwayGoal', 'AwayScore', 'AwayTeamScore']
  );
}

function firstHalfEndScore(timeline) {
  const events = timeline?.Event || [];
  const firstHalfEnd = [...events].reverse().find(event => {
    const description = eventDescription(event);
    return description.includes('first period') && (description.includes('end') || description.includes('brings'));
  });

  return eventScore(firstHalfEnd || {});
}

function inferHalfTimeFromTimeline(timeline) {
  const events = timeline?.Event || [];
  const endedScore = firstHalfEndScore(timeline);
  if (endedScore) return endedScore;

  const firstHalfScoredEvents = events
    .map(event => ({ minute: eventMinuteNumber(event), score: eventScore(event) }))
    .filter(item => item.score && item.minute !== null && item.minute <= 45)
    .sort((a, b) => a.minute - b.minute);

  return firstHalfScoredEvents.length ? firstHalfScoredEvents[firstHalfScoredEvents.length - 1].score : null;
}

function getHalfTimeScore(live, timeline, options = {}) {
  const { allowTimelineFallback = true } = options;
  return (
    readScorePair(
      live.FirstHalfTime,
      ['HomeGoals', 'HomeGoal', 'HomeScore', 'HomeTeamScore', 'Home'],
      ['AwayGoals', 'AwayGoal', 'AwayScore', 'AwayTeamScore', 'Away']
    ) ||
    readScorePair(
      live.HalfTime,
      ['HomeGoals', 'HomeGoal', 'HomeScore', 'HomeTeamScore', 'Home'],
      ['AwayGoals', 'AwayGoal', 'AwayScore', 'AwayTeamScore', 'Away']
    ) ||
    firstHalfEndScore(timeline) ||
    (allowTimelineFallback ? inferHalfTimeFromTimeline(timeline) : null)
  );
}

// Core scoring logic — takes already-resolved scores
async function scoreFromData(matchId, ftHome, ftAway, htHome = null, htAway = null) {
  const normalizedMatchId = matchIdKey(matchId);
  const { error: resultErr } = await supabase
    .from('match_results')
    .upsert({ match_id: normalizedMatchId, ht_home: htHome, ht_away: htAway, ft_home: ftHome, ft_away: ftAway });
  if (resultErr) throw resultErr;

  const { data: preds, error: predErr } = await supabase
    .from('predictions')
    .select('user_id, ht_home, ht_away, ft_home, ft_away')
    .eq('match_id', normalizedMatchId);
  if (predErr) throw predErr;
  if (!preds || !preds.length) return { scored: 0 };

  const distances = preds.map(p => ({
    user_id: p.user_id,
    dist: Math.abs(p.ft_home - ftHome) + Math.abs(p.ft_away - ftAway),
  }));
  const minDist = Math.min(...distances.map(d => d.dist));
  const winners = distances.filter(d => d.dist === minDist);
  const closestPts = 6 / winners.length;
  const winnerSet = new Set(winners.map(d => d.user_id));
  const actualOutcome = Math.sign(ftHome - ftAway);

  const pointsRows = preds.map(p => ({
    user_id: p.user_id,
    match_id: normalizedMatchId,
    ht_pts: (htHome !== null && htAway !== null && p.ht_home === htHome && p.ht_away === htAway) ? 5 : 0,
    ft_pts: (p.ft_home === ftHome && p.ft_away === ftAway) ? 10 : 0,
    outcome_pts: (Math.sign(p.ft_home - p.ft_away) === actualOutcome) ? 4 : 0,
    closest_pts: winnerSet.has(p.user_id) ? closestPts : 0,
  }));

  const { error: upsertErr } = await supabase
    .from('points')
    .upsert(pointsRows, { onConflict: 'user_id,match_id' });
  if (upsertErr) throw upsertErr;

  return { scored: preds.length, pointsRows };
}

async function scoreHalfTimeFromData(matchId, htHome, htAway) {
  const normalizedMatchId = matchIdKey(matchId);

  const { data: preds, error: predErr } = await supabase
    .from('predictions')
    .select('user_id, ht_home, ht_away')
    .eq('match_id', normalizedMatchId);
  if (predErr) throw predErr;
  if (!preds || !preds.length) return { scored: 0 };

  const userIds = preds.map(p => p.user_id);
  const { data: existingPoints, error: pointsErr } = await supabase
    .from('points')
    .select('user_id, ft_pts, closest_pts, outcome_pts')
    .eq('match_id', normalizedMatchId)
    .in('user_id', userIds);
  if (pointsErr) throw pointsErr;

  const existingByUser = new Map((existingPoints || []).map(p => [p.user_id, p]));
  const pointsRows = preds.map(p => {
    const existing = existingByUser.get(p.user_id) || {};
    return {
      user_id: p.user_id,
      match_id: normalizedMatchId,
      ht_pts: p.ht_home === htHome && p.ht_away === htAway ? 5 : 0,
      ft_pts: existing.ft_pts || 0,
      closest_pts: existing.closest_pts || 0,
      outcome_pts: existing.outcome_pts || 0,
    };
  });

  const { error: upsertErr } = await supabase
    .from('points')
    .upsert(pointsRows, { onConflict: 'user_id,match_id' });
  if (upsertErr) throw upsertErr;

  return { scored: preds.length, pointsRows };
}

async function checkAndScoreFinishedMatches() {
  try {
    const fixtures = await get(
      `${BASE}/calendar/matches?idCompetition=${COMPETITION}&idSeason=${SEASON}&count=500&language=en`
    );
    const results = fixtures.Results || [];

    const liveMatches = results.filter(m => m.MatchStatus === 3);

    // Official: FIFA has confirmed the match is finished
    const officiallyFinished = results.filter(m => [2, 4, 5].includes(m.MatchStatus));

    // Inferred: match has a score but status hasn't updated (FIFA API lag).
    // A non-zero score means it was clearly played; a 0–0 is only treated as a
    // finished result once enough time has passed since kickoff (otherwise a
    // 0–0 is ambiguous with a pre-match fixture).
    const inferredFinished = results.filter(m =>
      ![2, 3, 4, 5].includes(m.MatchStatus) && // not LIVE, not already official
      hasCalendarScore(m) &&
      (m.HomeTeamScore > 0 || m.AwayTeamScore > 0 || isLongPastKickoff(m))
    );

    // Skip official matches that are already correctly scored
    const officialIds = officiallyFinished.map(m => matchIdKey(m.IdMatch));
    const { data: alreadyScored } = officialIds.length
      ? await supabase.from('match_results').select('match_id, ht_home, ht_away').in('match_id', officialIds)
      : { data: [] };

    const completeScoredSet = new Set(
      (alreadyScored || [])
        .filter(r => r.ht_home != null && r.ht_away != null)
        .map(r => matchIdKey(r.match_id))
    );

    // Always re-score inferred matches — their final score may have changed since last run
    const toScore = [
      ...officiallyFinished.filter(m => !completeScoredSet.has(matchIdKey(m.IdMatch))),
      ...inferredFinished,
    ];

    for (const match of liveMatches) {
      try {
        await scoreLiveMatch(match);
      } catch (err) {
        console.error(`Live scoring failed for match ${match.IdMatch}:`, err.message);
      }
    }

    if (!toScore.length) return;

    for (const match of toScore) {
      try {
        await scoreFromFifa(match);
      } catch (err) {
        console.error(`Scoring failed for match ${match.IdMatch}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Scoring poll error:', err.message);
  }
}

async function scoreLiveMatch(match) {
  const matchId = matchIdKey(match.IdMatch);
  const stageId = match.IdStage;

  const [live, timeline] = await Promise.all([
    get(`${BASE}/live/football/${COMPETITION}/${SEASON}/${stageId}/${matchId}?language=en`),
    get(`${BASE}/timelines/${COMPETITION}/${SEASON}/${stageId}/${matchId}?language=en`).catch(() => null),
  ]);

  if (live.MatchStatus !== 3) {
    if (live.HomeTeam?.Score != null && live.AwayTeam?.Score != null) {
      return scoreFromFifa(match);
    }
    return { scored: 0 };
  }

  const halfTimeScore = getHalfTimeScore(live, timeline, { allowTimelineFallback: false });
  if (!halfTimeScore) return { scored: 0 };

  const result = await scoreHalfTimeFromData(matchId, halfTimeScore.home, halfTimeScore.away);
  console.log(`Half-time scored match ${matchId} (${halfTimeScore.home}-${halfTimeScore.away}), ${result.scored} predictions processed`);
  return result;
}

async function scoreFromFifa(match) {
  const matchId = matchIdKey(match.IdMatch);
  const stageId = match.IdStage;

  const [live, timeline] = await Promise.all([
    get(`${BASE}/live/football/${COMPETITION}/${SEASON}/${stageId}/${matchId}?language=en`),
    get(`${BASE}/timelines/${COMPETITION}/${SEASON}/${stageId}/${matchId}?language=en`).catch(() => null),
  ]);

  const liveStatus = live.MatchStatus;

  // Never score a match that is currently live
  if (liveStatus === 3) {
    console.log(`Match ${matchId} is LIVE — skipping scoring`);
    return;
  }

  const ftHome = live.HomeTeam?.Score ?? null;
  const ftAway = live.AwayTeam?.Score ?? null;
  if (ftHome === null || ftAway === null) return;

  // A 0–0 with an UPCOMING/TBD status is normally a pre-match fixture — skip it,
  // UNLESS enough time has passed since kickoff, in which case it's a genuine
  // goalless result that should be scored.
  if ([0, 1].includes(liveStatus) && ftHome === 0 && ftAway === 0 && !isLongPastKickoff(match)) {
    console.log(`Match ${matchId} shows ${liveStatus === 0 ? 'TBD' : 'UPCOMING'} with 0–0 — skipping (pre-match)`);
    return;
  }

  const halfTimeScore = getHalfTimeScore(live, timeline);
  const htHome = halfTimeScore?.home ?? null;
  const htAway = halfTimeScore?.away ?? null;

  const result = await scoreFromData(matchId, ftHome, ftAway, htHome, htAway);
  console.log(`Scored match ${matchId} (${ftHome}-${ftAway}), ${result.scored} predictions processed`);

  await checkTournamentWinner(live, ftHome, ftAway);
}

async function checkTournamentWinner(live, ftHome, ftAway) {
  const stageName = (live.StageName?.[0]?.Description || '').toLowerCase();
  if (!stageName.includes('final')) return;
  if (stageName.includes('third') || stageName.includes('3rd') || stageName.includes('semi')) return;

  const homeTeamName = live.HomeTeam?.TeamName?.[0]?.Description || live.HomeTeam?.ShortClubName;
  const awayTeamName = live.AwayTeam?.TeamName?.[0]?.Description || live.AwayTeam?.ShortClubName;
  const winningTeam = ftHome > ftAway ? homeTeamName : ftAway > ftHome ? awayTeamName : null;
  if (!winningTeam) return;

  const { error } = await supabase
    .from('users')
    .update({ winner_pts: 25 })
    .or(`pick1.eq.${winningTeam},pick2.eq.${winningTeam}`);

  if (!error) console.log(`Awarded 25 winner pts for tournament winner: ${winningTeam}`);
}

// POST /scoring/trigger  — run the FIFA poller now
router.post('/trigger', async (req, res) => {
  try {
    await checkAndScoreFinishedMatches();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /scoring/set-result  — manually set scores and run scoring
router.post('/set-result', async (req, res) => {
  const { matchId, ft_home, ft_away, ht_home, ht_away } = req.body;
  if (!matchId || ft_home == null || ft_away == null) {
    return res.status(400).json({ error: 'matchId, ft_home and ft_away are required' });
  }
  try {
    const result = await scoreFromData(
      matchId,
      parseInt(ft_home), parseInt(ft_away),
      ht_home != null ? parseInt(ht_home) : null,
      ht_away != null ? parseInt(ht_away) : null
    );
    res.json({ success: true, scored: result.scored, points: result.pointsRows });
  } catch (err) {
    console.error('set-result error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /scoring/clear-result  — delete match_results + points rows so you can re-score
router.post('/clear-result', async (req, res) => {
  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ error: 'matchId required' });
  try {
    await supabase.from('match_results').delete().eq('match_id', matchIdKey(matchId));
    await supabase.from('points').delete().eq('match_id', matchIdKey(matchId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Look up a match by ID and score it from the FIFA live endpoint if it has a result
async function tryScoreFifaById(matchId) {
  try {
    const fixtures = await get(
      `${BASE}/calendar/matches?idCompetition=${COMPETITION}&idSeason=${SEASON}&count=500&language=en`
    );
    const match = (fixtures.Results || []).find(m => sameMatchId(m.IdMatch, matchId));
    if (!match) return false;
    if (!hasCalendarScore(match)) return false;
    // Don't attempt to score a live match
    if (match.MatchStatus === 3) return false;
    // 0–0 with non-finished status = pre-match, not a real result
    if (![2, 4, 5].includes(match.MatchStatus) && match.HomeTeamScore === 0 && match.AwayTeamScore === 0) return false;
    await scoreFromFifa(match);
    return true;
  } catch (e) {
    console.error('tryScoreFifaById error:', e.message);
    return false;
  }
}

module.exports = router;
module.exports.checkAndScoreFinishedMatches = checkAndScoreFinishedMatches;
module.exports.scoreFromData = scoreFromData;
module.exports.tryScoreFifaById = tryScoreFifaById;
