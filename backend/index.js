require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow localhost, any private-LAN IP (so the dev server works from a phone on
// the same network), plus any extra origins listed in CORS_ORIGINS for prod.
const extraOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // non-browser / same-origin requests
      if (extraOrigins.includes(origin)) return cb(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
        return cb(null, true);
      }
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

const BASE = 'https://api.fifa.com/api/v3';
const COMPETITION = '17';
const SEASON = '285023';

const HTTP_HEADERS = { 'User-Agent': 'Mozilla/5.0' };

const MATCH_STATUS = {
  0: 'TBD',
  1: 'UPCOMING',
  2: 'FINISHED',
  3: 'LIVE',
  4: 'FINISHED',
  5: 'FINISHED',
  6: 'ABANDONED',
  7: 'SUSPENDED',
  8: 'CANCELLED',
};

const POSITION = { 0: 'GK', 1: 'DF', 2: 'MF', 3: 'FW' };

const EVENT_TYPE = {
  0: 'Goal',
  1: 'Assist',
  2: 'Yellow Card',
  3: 'Red Card',
  4: 'Yellow-Red Card',
  5: 'Substitution',
  7: 'Kick Off',
  8: 'End Time',
  12: 'Attempt',
  15: 'Offside',
  16: 'Corner',
  18: 'Foul',
  26: 'Match End',
  57: 'Goal Prevention',
  78: 'Resume',
  79: 'Coin Toss',
  83: 'Delay',
};

function get(url) {
  return axios.get(url, { headers: HTTP_HEADERS }).then((r) => r.data);
}

function locale(arr) {
  if (!arr || !arr.length) return null;
  return (arr.find((x) => x.Locale === 'en-GB') || arr[0]).Description;
}

function transformTeam(team) {
  if (!team) return null;
  return {
    name: locale(team.TeamName) || team.ShortClubName,
    abbreviation: team.Abbreviation,
    countryCode: team.IdCountry,
    flagUrl: team.PictureUrl
      ? team.PictureUrl.replace('{format}', 'sq').replace('{size}', '1')
      : null,
    score: team.Score ?? null,
    penaltyScore: null,
  };
}

function hasCalendarScore(match) {
  return match.HomeTeamScore != null && match.AwayTeamScore != null;
}

function isPastMatch(match) {
  const date = new Date(match.Date || match.LocalDate || 0);
  return !Number.isNaN(date.valueOf()) && date <= new Date();
}

function isHalfTimePayload(match) {
  const period = Number(match?.Period);
  const time = String(match?.MatchTime ?? '').trim().toUpperCase();
  const hasScore = (match?.HomeTeam?.Score ?? match?.HomeTeamScore) != null && (match?.AwayTeam?.Score ?? match?.AwayTeamScore) != null;
  return (
    period === 4 ||
    time === 'HT' ||
    time === 'HALF TIME' ||
    time === 'HALFTIME' ||
    (match?.MatchStatus === 3 && time === '' && hasScore)
  );
}

function transformStatus(match, live = null) {
  const statusCode = live?.MatchStatus ?? match.MatchStatus;
  const mapped = MATCH_STATUS[statusCode] ?? `STATUS_${statusCode}`;
  const canInferFinished = !['LIVE', 'FINISHED', 'ABANDONED', 'SUSPENDED', 'CANCELLED'].includes(mapped);

  if (canInferFinished && hasCalendarScore(match) && isPastMatch(match)) {
    return 'FINISHED';
  }

  return mapped;
}

function transformMatch(m, live = null) {
  const home = transformTeam(live?.HomeTeam || m.Home || m.HomeTeam);
  const away = transformTeam(live?.AwayTeam || m.Away || m.AwayTeam);
  const status = transformStatus(m, live);
  const isHalfTime = status === 'LIVE' && (isHalfTimePayload(live) || isHalfTimePayload(m));
  const homeScore = live?.HomeTeam?.Score ?? m.HomeTeamScore;
  const awayScore = live?.AwayTeam?.Score ?? m.AwayTeamScore;

  let score = null;
  if (homeScore != null && awayScore != null) {
    score = {
      home: homeScore,
      away: awayScore,
      homePenalty: live?.HomeTeamPenaltyScore ?? m.HomeTeamPenaltyScore ?? null,
      awayPenalty: live?.AwayTeamPenaltyScore ?? m.AwayTeamPenaltyScore ?? null,
    };
  }

  const placeholder = (ph) => ({ name: ph || 'TBD', abbreviation: 'TBD', countryCode: null, flagUrl: null, score: null, penaltyScore: null });

  return {
    id: m.IdMatch,
    stageId: m.IdStage,
    date: m.Date,
    localDate: m.LocalDate,
    status,
    phase: isHalfTime ? 'HALF_TIME' : null,
    isHalfTime,
    period: live?.Period ?? m.Period ?? null,
    minute: live?.MatchTime || m.MatchTime || null,
    home: home ?? placeholder(m.PlaceHolderA),
    away: away ?? placeholder(m.PlaceHolderB),
    score,
    stage: locale(m.StageName),
    group: locale(m.GroupName),
    stadium: m.Stadium ? locale(m.Stadium.Name) : null,
    city: m.Stadium ? locale(m.Stadium.CityName) : null,
    country: m.Stadium ? m.Stadium.IdCountry : null,
    url: `https://www.fifa.com/en/match-centre/match/${COMPETITION}/${SEASON}/${m.IdStage}/${m.IdMatch}`,
  };
}

async function fetchFixtures() {
  const data = await get(
    `${BASE}/calendar/matches?idCompetition=${COMPETITION}&idSeason=${SEASON}&count=500&language=en`
  );
  const matches = data.Results || [];
  const enriched = await Promise.all(matches.map(async (match) => {
    if (match.MatchStatus !== 3) return { match, live: null };

    try {
      const live = await get(`${BASE}/live/football/${COMPETITION}/${SEASON}/${match.IdStage}/${match.IdMatch}?language=en`);
      return { match, live };
    } catch (err) {
      console.error(`live fixture enrich failed for match ${match.IdMatch}:`, err.message);
      return { match, live: null };
    }
  }));

  return enriched.map(({ match, live }) => transformMatch(match, live));
}

function transformPlayer(p) {
  return {
    id: p.IdPlayer,
    name: locale(p.ShortName) || locale(p.PlayerName),
    shirtNumber: p.ShirtNumber,
    position: POSITION[p.Position] ?? p.Position,
    captain: p.Captain || false,
    pictureUrl: p.PlayerPicture?.PictureUrl || null,
  };
}

function transformLineup(teamData) {
  if (!teamData) return null;
  const players = teamData.Players || [];
  const coaches = teamData.Coaches || [];
  const headCoach = coaches.find((c) => c.Role === 0);

  return {
    name: locale(teamData.TeamName) || teamData.ShortClubName,
    abbreviation: teamData.Abbreviation,
    countryCode: teamData.IdCountry,
    tactics: teamData.Tactics || null,
    headCoach: headCoach ? locale(headCoach.Alias) || locale(headCoach.Name) : null,
    starters: players.filter((p) => p.Status === 1).map(transformPlayer),
    substitutes: players.filter((p) => p.Status === 2).map(transformPlayer),
  };
}

// FIFA Enhanced Football Intelligence stats live on a separate host, keyed by
// the match's IdIFES (found in the live payload's Properties), not the IdMatch.
const FDH_BASE = 'https://fdh-api.fifa.com/v1';

function statsArrayToObject(arr) {
  const out = {};
  if (Array.isArray(arr)) {
    for (const row of arr) {
      if (Array.isArray(row) && row.length >= 2) out[row[0]] = row[1];
    }
  }
  return out;
}

async function fetchTeamStats(ifesId, homeId, awayId) {
  if (!ifesId) return null;
  try {
    const data = await axios
      .get(`${FDH_BASE}/stats/match/${ifesId}/teams.json`, { headers: HTTP_HEADERS, timeout: 8000 })
      .then((r) => r.data);
    if (!data || typeof data !== 'object') return null;
    const home = statsArrayToObject(data[homeId]);
    const away = statsArrayToObject(data[awayId]);
    if (!Object.keys(home).length && !Object.keys(away).length) return null;
    return { home, away };
  } catch (err) {
    console.error('teamStats fetch failed:', err.message);
    return null;
  }
}

function transformEvent(e, homeId, awayId) {
  const typeLabel = e.TypeLocalized?.[0]?.Description || EVENT_TYPE[e.Type] || `Type ${e.Type}`;
  const description = e.EventDescription?.[0]?.Description || null;
  const side = e.IdTeam === homeId ? 'home' : e.IdTeam === awayId ? 'away' : null;

  return {
    eventId: e.EventId,
    minute: e.MatchMinute,
    type: typeLabel,
    typeCode: e.Type,
    side,
    playerId: e.IdPlayer || null,
    // For substitutions IdSubPlayer is the player coming OFF; for goals it is the assister.
    subPlayerId: e.IdSubPlayer || null,
    description,
    score: e.HomeGoals != null ? { home: e.HomeGoals, away: e.AwayGoals } : null,
  };
}

// ─── FIFA Proxy Routes ──────────────────────────────────────────────────────

app.get('/fixtures', async (req, res) => {
  try {
    const matches = await fetchFixtures();
    const { group, status, date, grouped } = req.query;

    let filtered = matches;
    if (group) filtered = filtered.filter((m) => m.group?.toLowerCase().includes(group.toLowerCase()));
    if (status) filtered = filtered.filter((m) => m.status === status.toUpperCase());
    if (date) filtered = filtered.filter((m) => m.date?.startsWith(date));

    if (grouped === 'true' || grouped === '1') {
      const byDate = {};
      for (const m of filtered) {
        const day = m.date ? m.date.split('T')[0] : 'Unknown';
        if (!byDate[day]) byDate[day] = [];
        byDate[day].push(m);
      }
      const days = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, matches]) => ({ date: day, matches }));
      return res.json({ success: true, totalDays: days.length, totalMatches: filtered.length, days });
    }

    res.json({ success: true, total: filtered.length, matches: filtered });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/fixtures/live', async (req, res) => {
  try {
    const matches = await fetchFixtures();
    const live = matches.filter((m) => m.status === 'LIVE');
    res.json({ success: true, total: live.length, matches: live });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/fixtures/today', async (req, res) => {
  try {
    const matches = await fetchFixtures();
    const today = new Date().toISOString().split('T')[0];
    const todayMatches = matches.filter((m) => m.date?.startsWith(today));
    res.json({ success: true, date: today, total: todayMatches.length, matches: todayMatches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/fixtures/:matchId/stats', async (req, res) => {
  try {
    const { matchId } = req.params;
    let { stageId } = req.query;

    if (!stageId) {
      const all = await fetchFixtures();
      const found = all.find((m) => String(m.id) === String(matchId));
      if (!found) return res.status(404).json({ success: false, error: 'Match not found' });
      stageId = found.stageId;
    }

    const [live, timeline] = await Promise.all([
      get(`${BASE}/live/football/${COMPETITION}/${SEASON}/${stageId}/${matchId}?language=en`),
      get(`${BASE}/timelines/${COMPETITION}/${SEASON}/${stageId}/${matchId}?language=en`),
    ]);

    const homeId = live.HomeTeam?.IdTeam;
    const awayId = live.AwayTeam?.IdTeam;

    const SKIP_TYPES = new Set([79, 83]);
    const events = (timeline.Event || [])
      .filter((e) => !SKIP_TYPES.has(e.Type))
      .map((e) => transformEvent(e, homeId, awayId));

    const teamStats = await fetchTeamStats(live.Properties?.IdIFES, homeId, awayId);

    const stats = {
      matchId,
      status: MATCH_STATUS[live.MatchStatus] ?? `STATUS_${live.MatchStatus}`,
      phase: isHalfTimePayload(live) ? 'HALF_TIME' : null,
      isHalfTime: isHalfTimePayload(live),
      period: live.Period ?? null,
      minute: live.MatchTime || null,
      attendance: live.Attendance ?? null,
      possession: live.BallPossession
        ? { home: live.BallPossession.Possession, away: 100 - live.BallPossession.Possession }
        : null,
      score: {
        home: live.HomeTeam?.Score ?? null,
        away: live.AwayTeam?.Score ?? null,
        homePenalty: live.HomeTeamPenaltyScore ?? null,
        awayPenalty: live.AwayTeamPenaltyScore ?? null,
      },
      home: transformLineup(live.HomeTeam),
      away: transformLineup(live.AwayTeam),
      events,
      teamStats,
    };

    res.json({ success: true, stats });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Game Routes ────────────────────────────────────────────────────────────

app.use('/auth', require('./routes/auth'));
app.use('/predictions', require('./routes/predictions'));
app.use('/scoring', require('./routes/scoring'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/admin', require('./routes/admin'));

// ─── Scoring Poller ─────────────────────────────────────────────────────────

const { checkAndScoreFinishedMatches } = require('./routes/scoring');
const SCORING_INTERVAL_MS = 30_000;
setInterval(checkAndScoreFinishedMatches, SCORING_INTERVAL_MS);
checkAndScoreFinishedMatches();

// ─── Start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`World Cup 2026 API → http://localhost:${PORT}`);
  console.log('  GET  /fixtures                  all fixtures');
  console.log('  GET  /fixtures/:id/stats        match lineup + events');
  console.log('  POST /auth/signup               register');
  console.log('  POST /auth/login                login');
  console.log('  GET  /auth/me                   current user');
  console.log('  PUT  /auth/username             change username');
  console.log('  PUT  /auth/picks                set overall winner pick');
  console.log('  POST /predictions/:matchId      submit prediction');
  console.log('  GET  /predictions/my            my predictions');
  console.log('  GET  /predictions/my/points     my points breakdown');
  console.log('  GET  /leaderboard               ranked leaderboard');
  console.log('  POST /scoring/trigger           manually trigger scoring');
});
