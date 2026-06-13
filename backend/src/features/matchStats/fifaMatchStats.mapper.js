'use strict';

const { MATCH_STATUS, isHalfTimePayload, locale } = require('../fixtures/fifaFixtures.mapper');

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

// Event types that add no analytical value to the timeline display
const SKIP_TYPES = new Set([79, 83]);

function mapPlayer(p) {
  return {
    id: p.IdPlayer,
    name: locale(p.ShortName) || locale(p.PlayerName),
    shirtNumber: p.ShirtNumber,
    position: POSITION[p.Position] ?? p.Position,
    captain: p.Captain || false,
    pictureUrl: p.PlayerPicture?.PictureUrl || null,
  };
}

function mapLineup(teamData) {
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
    starters: players.filter((p) => p.Status === 1).map(mapPlayer),
    substitutes: players.filter((p) => p.Status === 2).map(mapPlayer),
  };
}

function mapEvent(e, homeId, awayId) {
  const typeLabel = e.TypeLocalized?.[0]?.Description || EVENT_TYPE[e.Type] || `Type ${e.Type}`;
  const side = e.IdTeam === homeId ? 'home' : e.IdTeam === awayId ? 'away' : null;
  return {
    eventId: e.EventId,
    minute: e.MatchMinute,
    type: typeLabel,
    typeCode: e.Type,
    side,
    playerId: e.IdPlayer || null,
    subPlayerId: e.IdSubPlayer || null,
    description: e.EventDescription?.[0]?.Description || null,
    score: e.HomeGoals != null ? { home: e.HomeGoals, away: e.AwayGoals } : null,
  };
}

function statsArrayToObject(arr) {
  const out = {};
  if (Array.isArray(arr)) {
    for (const row of arr) {
      if (Array.isArray(row) && row.length >= 2) out[row[0]] = row[1];
    }
  }
  return out;
}

function mapTeamStats(raw, homeId, awayId) {
  if (!raw || typeof raw !== 'object') return null;
  const home = statsArrayToObject(raw[homeId]);
  const away = statsArrayToObject(raw[awayId]);
  if (!Object.keys(home).length && !Object.keys(away).length) return null;
  return { home, away };
}

function mapMatchStats(matchId, live, timeline, teamStatsRaw) {
  const homeId = live.HomeTeam?.IdTeam;
  const awayId = live.AwayTeam?.IdTeam;
  const events = (timeline?.Event || [])
    .filter((e) => !SKIP_TYPES.has(e.Type))
    .map((e) => mapEvent(e, homeId, awayId));

  return {
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
    home: mapLineup(live.HomeTeam),
    away: mapLineup(live.AwayTeam),
    events,
    teamStats: mapTeamStats(teamStatsRaw, homeId, awayId),
  };
}

module.exports = { mapMatchStats };
