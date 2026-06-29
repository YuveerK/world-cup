'use strict';

const { COMPETITION, SEASON } = require('../../config/constants');
const { FIFA_PERIODS } = require('../../config/fifaPeriods');

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

function locale(arr) {
  if (!arr || !arr.length) return null;
  return (arr.find((x) => x.Locale === 'en-GB') || arr[0]).Description;
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
  const hasScore =
    (match?.HomeTeam?.Score ?? match?.HomeTeamScore) != null &&
    (match?.AwayTeam?.Score ?? match?.AwayTeamScore) != null;
  return (
    period === FIFA_PERIODS.REGULAR_HT || period === FIFA_PERIODS.ET_HT ||
    time === 'HT' ||
    time === 'HALF TIME' ||
    time === 'HALFTIME' ||
    (match?.MatchStatus === 3 && time === '' && hasScore)
  );
}

function mapStatus(match, live = null) {
  const statusCode = live?.MatchStatus ?? match.MatchStatus;
  const mapped = MATCH_STATUS[statusCode] ?? `STATUS_${statusCode}`;
  // Only infer FINISHED for known pre-game statuses (TBD=0, UPCOMING=1).
  // Unknown codes (e.g. 11 = weather delay) must not be treated as finished.
  const canInfer = mapped === 'TBD' || mapped === 'UPCOMING';
  if (canInfer && hasCalendarScore(match) && isPastMatch(match)) return 'FINISHED';
  return mapped;
}

function mapTeam(team) {
  if (!team) return null;
  return {
    name: locale(team.TeamName) || team.ShortClubName,
    abbreviation: team.Abbreviation,
    countryCode: team.IdCountry,
    flagUrl: team.PictureUrl
      ? team.PictureUrl.replace('{format}', 'sq').replace('{size}', '4')
      : null,
    score: team.Score ?? null,
    penaltyScore: null,
  };
}

function placeholder(ph) {
  return { name: ph || 'TBD', abbreviation: 'TBD', countryCode: null, flagUrl: null, score: null, penaltyScore: null };
}

function mapMatch(m, live = null, etMatchIds = null) {
  const home = mapTeam(live?.HomeTeam || m.Home || m.HomeTeam);
  const away = mapTeam(live?.AwayTeam || m.Away || m.AwayTeam);
  const status = mapStatus(m, live);
  const isHalfTime = status === 'LIVE' && (isHalfTimePayload(live) || isHalfTimePayload(m));
  const homeScore = live?.HomeTeam?.Score ?? m.HomeTeamScore;
  const awayScore = live?.AwayTeam?.Score ?? m.AwayTeamScore;

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
    score: homeScore != null && awayScore != null
      ? {
          home: homeScore,
          away: awayScore,
          homePenalty: live?.HomeTeamPenaltyScore ?? m.HomeTeamPenaltyScore ?? null,
          awayPenalty: live?.AwayTeamPenaltyScore ?? m.AwayTeamPenaltyScore ?? null,
        }
      : null,
    aet: etMatchIds ? etMatchIds.has(String(m.IdMatch)) : false,
    stage: locale(m.StageName),
    group: locale(m.GroupName),
    stadium: m.Stadium ? locale(m.Stadium.Name) : null,
    city: m.Stadium ? locale(m.Stadium.CityName) : null,
    country: m.Stadium ? m.Stadium.IdCountry : null,
    url: `https://www.fifa.com/en/match-centre/match/${COMPETITION}/${SEASON}/${m.IdStage}/${m.IdMatch}`,
  };
}

module.exports = { mapMatch, mapStatus, isHalfTimePayload, locale, MATCH_STATUS };
