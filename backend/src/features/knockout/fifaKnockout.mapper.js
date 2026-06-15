'use strict';

const { COMPETITION, SEASON } = require('../../config/constants');
const { mapStatus } = require('../fixtures/fifaFixtures.mapper');

const KNOCKOUT_MATCH_MIN = 73;
const KNOCKOUT_MATCH_MAX = 104;

const ROUND_CONFIG = [
  { key: 'round-of-32', name: 'Round of 32', stage: 'Round of 32' },
  { key: 'round-of-16', name: 'Round of 16', stage: 'Round of 16' },
  { key: 'quarter-finals', name: 'Quarter-finals', stage: 'Quarter-final' },
  { key: 'semi-finals', name: 'Semi-finals', stage: 'Semi-final' },
  { key: 'final', name: 'Final', stage: 'Final' },
  { key: 'third-place', name: 'Third Place', stage: 'Play-off for third place' },
];

const ROUND_BY_STAGE = new Map(ROUND_CONFIG.map((round) => [round.stage, round]));

const BRACKET_SLOT_BY_MATCH_NUMBER = new Map([
  [74, 1],
  [77, 2],
  [73, 3],
  [75, 4],
  [83, 5],
  [84, 6],
  [81, 7],
  [82, 8],
  [76, 9],
  [78, 10],
  [79, 11],
  [80, 12],
  [86, 13],
  [88, 14],
  [85, 15],
  [87, 16],
  [89, 1],
  [90, 2],
  [93, 3],
  [94, 4],
  [91, 5],
  [92, 6],
  [95, 7],
  [96, 8],
  [97, 1],
  [98, 2],
  [99, 3],
  [100, 4],
  [101, 1],
  [102, 2],
  [103, 1],
  [104, 1],
]);

function locale(arr) {
  if (!Array.isArray(arr) || !arr.length) return null;
  return (arr.find((item) => item.Locale === 'en-GB') || arr[0]).Description;
}

function isKnockoutMatch(match) {
  const matchNumber = Number(match.MatchNumber);
  return matchNumber >= KNOCKOUT_MATCH_MIN && matchNumber <= KNOCKOUT_MATCH_MAX;
}

function placeholderLabel(placeholder) {
  if (!placeholder) return 'TBD';

  const winnerMatch = /^W(\d+)$/.exec(placeholder);
  if (winnerMatch) return `Winner ${winnerMatch[1]}`;

  const runnerUpMatch = /^RU(\d+)$/.exec(placeholder);
  if (runnerUpMatch) return `Runner-up ${runnerUpMatch[1]}`;

  return placeholder;
}

function mapSource(placeholder) {
  if (!placeholder) return null;

  const winnerMatch = /^W(\d+)$/.exec(placeholder);
  if (winnerMatch) {
    return { type: 'winner', matchNumber: Number(winnerMatch[1]), label: placeholderLabel(placeholder) };
  }

  const runnerUpMatch = /^RU(\d+)$/.exec(placeholder);
  if (runnerUpMatch) {
    return { type: 'runner-up', matchNumber: Number(runnerUpMatch[1]), label: placeholderLabel(placeholder) };
  }

  return { type: 'seed', seed: placeholder, label: placeholderLabel(placeholder) };
}

function mapParticipant(team, placeholder, score, penaltyScore, winnerId) {
  const id = team?.IdTeam || null;
  const abbreviation = team?.Abbreviation || placeholderLabel(placeholder);

  return {
    id,
    name: locale(team?.TeamName) || team?.ShortClubName || abbreviation,
    abbreviation,
    seed: placeholder || null,
    source: mapSource(placeholder),
    flag: team?.Abbreviation ? `/standings/flags/${team.Abbreviation}` : null,
    score: score ?? null,
    penaltyScore: penaltyScore ?? null,
    winner: Boolean(id && winnerId && String(id) === String(winnerId)),
  };
}

function resolveWinnerSide(match, home, away) {
  if (home.winner) return 'home';
  if (away.winner) return 'away';

  if (home.score == null || away.score == null) return null;
  if (home.score > away.score) return 'home';
  if (away.score > home.score) return 'away';
  if (home.penaltyScore == null || away.penaltyScore == null) return null;
  if (home.penaltyScore > away.penaltyScore) return 'home';
  if (away.penaltyScore > home.penaltyScore) return 'away';

  return null;
}

function mapMatch(entry) {
  const match = entry.match;
  const live = entry.live;
  const stage = locale(match.StageName);
  const round = ROUND_BY_STAGE.get(stage);
  const homeTeam = live?.HomeTeam || match.Home || match.HomeTeam;
  const awayTeam = live?.AwayTeam || match.Away || match.AwayTeam;
  const homeScore = live?.HomeTeam?.Score ?? match.HomeTeamScore;
  const awayScore = live?.AwayTeam?.Score ?? match.AwayTeamScore;
  const homePenaltyScore = live?.HomeTeamPenaltyScore ?? match.HomeTeamPenaltyScore;
  const awayPenaltyScore = live?.AwayTeamPenaltyScore ?? match.AwayTeamPenaltyScore;

  const home = mapParticipant(
    homeTeam,
    match.PlaceHolderA,
    homeScore,
    homePenaltyScore,
    match.Winner,
  );
  const away = mapParticipant(
    awayTeam,
    match.PlaceHolderB,
    awayScore,
    awayPenaltyScore,
    match.Winner,
  );

  return {
    id: match.IdMatch,
    matchNumber: Number(match.MatchNumber),
    bracketSlot: BRACKET_SLOT_BY_MATCH_NUMBER.get(Number(match.MatchNumber)) || null,
    stageId: match.IdStage,
    roundKey: round?.key || null,
    roundName: round?.name || stage,
    stage,
    date: match.Date,
    localDate: match.LocalDate,
    status: mapStatus(match, live),
    minute: live?.MatchTime || match.MatchTime || null,
    home,
    away,
    winnerSide: resolveWinnerSide(match, home, away),
    stadium: match.Stadium ? locale(match.Stadium.Name) : null,
    city: match.Stadium ? locale(match.Stadium.CityName) : null,
    url: `https://www.fifa.com/en/match-centre/match/${COMPETITION}/${SEASON}/${match.IdStage}/${match.IdMatch}`,
  };
}

function mapKnockoutBracket(entries) {
  const matches = entries
    .filter(({ match }) => isKnockoutMatch(match))
    .map(mapMatch)
    .sort((a, b) => a.matchNumber - b.matchNumber);

  const rounds = ROUND_CONFIG.map((round) => ({
    key: round.key,
    name: round.name,
    matches: matches
      .filter((match) => match.roundKey === round.key)
      .sort((a, b) => (a.bracketSlot || a.matchNumber) - (b.bracketSlot || b.matchNumber)),
  })).filter((round) => round.matches.length > 0);

  return {
    rounds,
    matches,
  };
}

module.exports = { mapKnockoutBracket, isKnockoutMatch };
