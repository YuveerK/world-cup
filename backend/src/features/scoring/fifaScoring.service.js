'use strict';

const fifaClient = require('../../clients/fifaClient');
const logger = require('../../shared/logging/logger');
const { FINISHED_AFTER_MS } = require('../../config/constants');
const { FIFA_PERIODS } = require('../../config/fifaPeriods');
const usersRepo = require('../users/users.repository');
const { scoreFromData, scoreHalfTimeFromData, scoreEtProgressFromData } = require('./scoring.service');
const repo = require('./scoring.repository');

function isLongPastKickoff(match) {
  const t = match?.Date ? new Date(match.Date).getTime() : NaN;
  return Number.isFinite(t) && Date.now() - t > FINISHED_AFTER_MS;
}

function hasCalendarScore(match) {
  return match.HomeTeamScore != null && match.AwayTeamScore != null;
}

function normalizeId(id) { return String(id); }

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readScorePair(source, homeKeys, awayKeys) {
  if (!source) return null;
  for (const hk of homeKeys) {
    for (const ak of awayKeys) {
      const home = numberOrNull(source[hk]);
      const away = numberOrNull(source[ak]);
      if (home !== null && away !== null) return { home, away };
    }
  }
  return null;
}

const SCORE_HOME_KEYS = ['HomeGoals', 'HomeGoal', 'HomeScore', 'HomeTeamScore', 'Home'];
const SCORE_AWAY_KEYS = ['AwayGoals', 'AwayGoal', 'AwayScore', 'AwayTeamScore', 'Away'];

function eventMinuteNumber(event) {
  const raw = event.MatchMinute ?? event.Minute ?? event.EventMinute;
  const m = String(raw ?? '').match(/\d+/);
  return m ? Number(m[0]) : null;
}

function eventDescription(event) {
  return [
    event.EventDescription?.[0]?.Description,
    event.TypeLocalized?.[0]?.Description,
  ].filter(Boolean).join(' ').toLowerCase();
}

function eventScore(event) {
  return readScorePair(event, ['HomeGoals', 'HomeGoal', 'HomeScore', 'HomeTeamScore'], ['AwayGoals', 'AwayGoal', 'AwayScore', 'AwayTeamScore']);
}

function firstHalfEndScore(timeline) {
  const events = timeline?.Event || [];
  const firstHalfEnd = [...events].reverse().find((e) => {
    const desc = eventDescription(e);
    return desc.includes('first period') && (desc.includes('end') || desc.includes('brings'));
  });
  return eventScore(firstHalfEnd || {});
}

// Returns the score at the end of a given period using the timeline's End Time events.
// Period constants: FIRST_HALF=3, SECOND_HALF=5, ET_FIRST_HALF=7, ET_SECOND_HALF=9.
// Uses TypeLocalized 'End Time' as the primary signal — confirmed present in 2022 World Cup Final timeline.
function getPeriodEndScore(timeline, period) {
  const events = timeline?.Event || [];
  const endEvent = [...events].reverse().find((e) => {
    if (Number(e.Period) !== period) return false;
    const typeDesc = e.TypeLocalized?.[0]?.Description ?? '';
    if (typeDesc === 'End Time') return true;
    const desc = eventDescription(e);
    return desc.includes('end') || desc.includes('brings') || desc.includes('blows');
  });
  return eventScore(endEvent || {});
}

function inferHalfTimeFromTimeline(timeline) {
  const events = timeline?.Event || [];
  const ended = firstHalfEndScore(timeline);
  if (ended) return ended;
  const candidates = events
    .map((e) => ({ minute: eventMinuteNumber(e), score: eventScore(e) }))
    .filter((x) => x.score && x.minute !== null && x.minute <= 45)
    .sort((a, b) => a.minute - b.minute);
  return candidates.length ? candidates[candidates.length - 1].score : null;
}

function getHalfTimeScore(live, timeline, { allowTimelineFallback = true } = {}) {
  return (
    readScorePair(live.FirstHalfTime, SCORE_HOME_KEYS, SCORE_AWAY_KEYS) ||
    readScorePair(live.HalfTime, SCORE_HOME_KEYS, SCORE_AWAY_KEYS) ||
    firstHalfEndScore(timeline) ||
    (allowTimelineFallback ? inferHalfTimeFromTimeline(timeline) : null)
  );
}

// Bug Fix 2: accept ET and penalty data to determine the true match winner.
// The final can go to ET/pens, in which case ftHome === ftAway (draw at 90 min).
async function checkTournamentWinner(live, ftHome, ftAway, etFtScore, penHome, penAway) {
  const stageName = (live.StageName?.[0]?.Description || '').toLowerCase();
  if (!stageName.includes('final')) return;
  if (stageName.includes('third') || stageName.includes('3rd') || stageName.includes('semi')) return;

  const homeTeam = live.HomeTeam?.TeamName?.[0]?.Description || live.HomeTeam?.ShortClubName;
  const awayTeam = live.AwayTeam?.TeamName?.[0]?.Description || live.AwayTeam?.ShortClubName;

  let winner = null;
  if (penHome !== null && penAway !== null) {
    winner = penHome > penAway ? homeTeam : penAway > penHome ? awayTeam : null;
  } else if (etFtScore) {
    winner = etFtScore.home > etFtScore.away ? homeTeam : etFtScore.away > etFtScore.home ? awayTeam : null;
  } else {
    winner = ftHome > ftAway ? homeTeam : ftAway > ftHome ? awayTeam : null;
  }
  if (!winner) return;

  await usersRepo.updateWinnerPts(winner, 25);
  logger.info(`Awarded 25 winner pts for tournament winner: ${winner}`);
}

async function scoreFromFifa(match) {
  const matchId = normalizeId(match.IdMatch);
  const stageId = match.IdStage;

  const [live, timeline] = await Promise.all([
    fifaClient.getLive(stageId, matchId),
    fifaClient.getTimeline(stageId, matchId).catch(() => null),
  ]);

  // Only score when the live endpoint confirms a known final or pre-game state.
  // Unknown codes (e.g. 11 = weather delay), LIVE (3), suspended (7), abandoned (6),
  // cancelled (8) all indicate the match is not yet done.
  if (![0, 1, 2, 4, 5].includes(live.MatchStatus)) {
    logger.info(`Match ${matchId} has non-final status ${live.MatchStatus} — skipping scoring`);
    return;
  }

  // Skip scoring during any half-time interval — match not yet over.
  const period = Number(live.Period);
  if (
    period === FIFA_PERIODS.REGULAR_HT ||
    period === FIFA_PERIODS.PRE_ET_INTERVAL ||
    period === FIFA_PERIODS.ET_HT
  ) {
    logger.info(`Match ${matchId} is at half-time interval (period ${period}) — skipping scoring`);
    return;
  }

  // Extract the authoritative 90-min score from the timeline (SECOND_HALF end event).
  // live.HomeTeam.Score is the 120-min score for ET matches — do NOT use it as FT.
  const ftFromTimeline = getPeriodEndScore(timeline, FIFA_PERIODS.SECOND_HALF);
  let ftHome, ftAway;

  if (ftFromTimeline) {
    ftHome = ftFromTimeline.home;
    ftAway = ftFromTimeline.away;
  } else {
    // Before falling back to live.HomeTeam.Score, check whether the match went to ET.
    // For ET matches the live score is the 120-min cumulative total — using it as FT
    // would score everyone's 90-min predictions against the wrong number.
    const matchWentToEt = getPeriodEndScore(timeline, FIFA_PERIODS.ET_FIRST_HALF) ||
                          getPeriodEndScore(timeline, FIFA_PERIODS.ET_SECOND_HALF) ||
                          live.HomeTeamPenaltyScore != null;
    if (matchWentToEt) {
      logger.warn(
        `Match ${matchId} went to extra time but the timeline has no Period 5 end event — ` +
        `cannot safely determine the 90-min FT score. Auto-scoring skipped. ` +
        `Please set the result manually via the admin panel.`
      );
      return;
    }
    // Safe fallback: no ET detected, so live.HomeTeam.Score is the 90-min score.
    ftHome = live.HomeTeam?.Score ?? null;
    ftAway = live.AwayTeam?.Score ?? null;
  }

  if (ftHome === null || ftAway === null) return;

  if ([0, 1].includes(live.MatchStatus) && ftHome === 0 && ftAway === 0 && !isLongPastKickoff(match)) {
    logger.info(`Match ${matchId} shows pre-match status with 0–0 — skipping`);
    return;
  }

  const ht = getHalfTimeScore(live, timeline);

  // ET scores from timeline ET_FIRST_HALF (105 min) and ET_SECOND_HALF (120 min) end events.
  const etHtScore = getPeriodEndScore(timeline, FIFA_PERIODS.ET_FIRST_HALF);
  const etFtScore = getPeriodEndScore(timeline, FIFA_PERIODS.ET_SECOND_HALF);

  // Penalty scores already provided directly by the live endpoint.
  const penHome = live.HomeTeamPenaltyScore != null ? Number(live.HomeTeamPenaltyScore) : null;
  const penAway = live.AwayTeamPenaltyScore != null ? Number(live.AwayTeamPenaltyScore) : null;

  await scoreFromData(
    matchId,
    ftHome, ftAway,
    ht?.home ?? null, ht?.away ?? null,
    etHtScore?.home ?? null, etHtScore?.away ?? null,
    etFtScore?.home ?? null, etFtScore?.away ?? null,
    penHome, penAway,
  );
  await checkTournamentWinner(live, ftHome, ftAway, etFtScore, penHome, penAway);
}

async function scoreLiveMatch(match) {
  const matchId = normalizeId(match.IdMatch);
  const stageId = match.IdStage;

  const [live, timeline] = await Promise.all([
    fifaClient.getLive(stageId, matchId),
    fifaClient.getTimeline(stageId, matchId).catch(() => null),
  ]);

  if (live.MatchStatus !== 3) {
    if (live.HomeTeam?.Score != null && live.AwayTeam?.Score != null) {
      return scoreFromFifa(match);
    }
    return { scored: 0 };
  }

  const ht = getHalfTimeScore(live, timeline, { allowTimelineFallback: false });
  if (ht) {
    await scoreHalfTimeFromData(matchId, ht.home, ht.away);
  }

  // Live extra-time scoring — mirrors regular half-time. The presence of a period-end
  // score in the timeline is itself the "phase confirmed" signal:
  //   ET_FIRST_HALF end  → ET half time is final (award ET HT now).
  //   ET_SECOND_HALF end → ET full time is final (award the full ET package). While the
  //     match is still LIVE this only happens during the penalty shootout.
  const etHt = getPeriodEndScore(timeline, FIFA_PERIODS.ET_FIRST_HALF);
  const etFt = getPeriodEndScore(timeline, FIFA_PERIODS.ET_SECOND_HALF);
  if (etHt || etFt) {
    await scoreEtProgressFromData(matchId, etHt, etFt);
  }

  return { scored: ht ? 1 : 0 };
}

// Try to score a match by its ID — returns true if scoring was attempted.
async function tryScoreById(matchId) {
  try {
    const data = await fifaClient.getCalendar();
    const match = (data.Results || []).find((m) => normalizeId(m.IdMatch) === normalizeId(matchId));
    if (!match) return false;
    if (!hasCalendarScore(match)) return false;
    if (match.MatchStatus === 3) return false;
    if (![2, 4, 5].includes(match.MatchStatus) && match.HomeTeamScore === 0 && match.AwayTeamScore === 0) return false;
    await scoreFromFifa(match);
    return true;
  } catch (err) {
    logger.error('tryScoreById error:', err.message);
    return false;
  }
}

async function checkAndScoreFinishedMatches() {
  try {
    const data = await fifaClient.getCalendar();
    const results = data.Results || [];

    const liveMatches = results.filter((m) => m.MatchStatus === 3);
    // Exclude matches at any HT interval even when the calendar marks them as finished —
    // this happens during weather suspensions where FIFA's API flips status codes.
    const officiallyFinished = results.filter(
      (m) => [2, 4, 5].includes(m.MatchStatus) &&
        Number(m.Period) !== FIFA_PERIODS.REGULAR_HT &&
        Number(m.Period) !== FIFA_PERIODS.PRE_ET_INTERVAL &&
        Number(m.Period) !== FIFA_PERIODS.ET_HT
    );
    const inferredFinished = results.filter(
      (m) =>
        [0, 1].includes(m.MatchStatus) &&
        hasCalendarScore(m) &&
        (m.HomeTeamScore > 0 || m.AwayTeamScore > 0 || isLongPastKickoff(m))
    );

    const candidateIds = [
      ...officiallyFinished.map((m) => normalizeId(m.IdMatch)),
      ...inferredFinished.map((m) => normalizeId(m.IdMatch)),
    ];
    const alreadyScored = candidateIds.length
      ? await repo.findResultsIn(candidateIds)
      : [];

    const scoredMap = new Map(alreadyScored.map((r) => [normalizeId(r.match_id), r]));

    // For inferred matches: skip once fully scored (ht+ft both stored).
    const completeScoredSet = new Set(
      alreadyScored
        .filter((r) => r.ht_home != null && r.ht_away != null)
        .map((r) => normalizeId(r.match_id))
    );

    // For officially finished matches: re-score if the stored result doesn't match the
    // calendar score (handles cases where a match was incorrectly scored while suspended).
    // Bug Fix 1: the calendar's HomeTeamScore is the 120-min score for ET matches, so
    // compare against et_ft_home when available, not ft_home (the 90-min score).
    function needsRescoring(match) {
      const stored = scoredMap.get(normalizeId(match.IdMatch));
      if (!stored || stored.ht_home == null || stored.ht_away == null) return true;
      const refHome = stored.et_ft_home != null ? stored.et_ft_home : stored.ft_home;
      const refAway = stored.et_ft_away != null ? stored.et_ft_away : stored.ft_away;
      return Number(refHome) !== match.HomeTeamScore || Number(refAway) !== match.AwayTeamScore;
    }

    const toScore = [
      ...officiallyFinished.filter((m) => needsRescoring(m)),
      ...inferredFinished.filter((m) => !completeScoredSet.has(normalizeId(m.IdMatch))),
    ];

    for (const match of liveMatches) {
      try {
        await scoreLiveMatch(match);
      } catch (err) {
        logger.error(`Live scoring failed for match ${match.IdMatch}:`, err.message);
      }
    }

    for (const match of toScore) {
      try {
        await scoreFromFifa(match);
      } catch (err) {
        logger.error(`Scoring failed for match ${match.IdMatch}:`, err.message);
      }
    }
  } catch (err) {
    logger.error('Scoring poll error:', err.message);
  }
}

module.exports = { checkAndScoreFinishedMatches, scoreFromFifa, tryScoreById };
