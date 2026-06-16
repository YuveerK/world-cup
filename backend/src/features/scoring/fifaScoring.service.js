'use strict';

const fifaClient = require('../../clients/fifaClient');
const logger = require('../../shared/logging/logger');
const { FINISHED_AFTER_MS } = require('../../config/constants');
const usersRepo = require('../users/users.repository');
const { scoreFromData, scoreHalfTimeFromData } = require('./scoring.service');
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

async function checkTournamentWinner(live, ftHome, ftAway) {
  const stageName = (live.StageName?.[0]?.Description || '').toLowerCase();
  if (!stageName.includes('final')) return;
  if (stageName.includes('third') || stageName.includes('3rd') || stageName.includes('semi')) return;

  const homeTeam = live.HomeTeam?.TeamName?.[0]?.Description || live.HomeTeam?.ShortClubName;
  const awayTeam = live.AwayTeam?.TeamName?.[0]?.Description || live.AwayTeam?.ShortClubName;
  const winner = ftHome > ftAway ? homeTeam : ftAway > ftHome ? awayTeam : null;
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

  if (live.MatchStatus === 3) {
    logger.info(`Match ${matchId} is LIVE — skipping scoring`);
    return;
  }

  const ftHome = live.HomeTeam?.Score ?? null;
  const ftAway = live.AwayTeam?.Score ?? null;
  if (ftHome === null || ftAway === null) return;

  if ([0, 1].includes(live.MatchStatus) && ftHome === 0 && ftAway === 0 && !isLongPastKickoff(match)) {
    logger.info(`Match ${matchId} shows pre-match status with 0–0 — skipping`);
    return;
  }

  const ht = getHalfTimeScore(live, timeline);
  await scoreFromData(matchId, ftHome, ftAway, ht?.home ?? null, ht?.away ?? null);
  await checkTournamentWinner(live, ftHome, ftAway);
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
  if (!ht) return { scored: 0 };
  return scoreHalfTimeFromData(matchId, ht.home, ht.away);
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
    const officiallyFinished = results.filter((m) => [2, 4, 5].includes(m.MatchStatus));
    const inferredFinished = results.filter(
      (m) =>
        ![2, 3, 4, 5].includes(m.MatchStatus) &&
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

    const completeScoredSet = new Set(
      alreadyScored
        .filter((r) => r.ht_home != null && r.ht_away != null)
        .map((r) => normalizeId(r.match_id))
    );

    const toScore = [
      ...officiallyFinished.filter((m) => !completeScoredSet.has(normalizeId(m.IdMatch))),
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
