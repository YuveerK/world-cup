'use strict';

function localeName(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.find((n) => n.Locale === 'en-GB')?.Description || arr[0]?.Description || '';
}

function matchOutcome(match, teamId) {
  if (match.HomeTeamScore == null || match.AwayTeamScore == null) return null;

  const homeScore = Number(match.HomeTeamScore);
  const awayScore = Number(match.AwayTeamScore);

  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return null;

  const isHome = String(match.HomeTeamId) === String(teamId);
  const isAway = String(match.AwayTeamId) === String(teamId);

  if (!isHome && !isAway) return null;
  if (homeScore === awayScore) return 'D';

  const won = isHome ? homeScore > awayScore : awayScore > homeScore;
  return won ? 'W' : 'L';
}

function recentForm(row) {
  const results = Array.isArray(row.MatchResults) ? row.MatchResults : [];
  const completed = results
    .slice()
    .sort((a, b) => new Date(a.StartTime || 0) - new Date(b.StartTime || 0))
    .map((match) => matchOutcome(match, row.IdTeam))
    .filter(Boolean)
    .slice(-5);

  return [...completed, ...Array(5 - completed.length).fill(null)];
}

function mapRow(row) {
  const team = row.Team || {};
  const code = team.Abbreviation || null;

  return {
    position: row.Position,
    team: {
      id: row.IdTeam,
      name: localeName(team.Name) || team.ShortClubName || '',
      abbreviation: code || '---',
      code: code || '---',
      // Relative path; client prefixes it with API base URL to avoid direct
      // browser requests to api.fifa.com image endpoints.
      flag: code ? `/standings/flags/${code}` : null,
    },
    mp: row.Played,
    w: row.Won,
    d: row.Drawn,
    l: row.Lost,
    gf: row.For,
    ga: row.Against,
    gd: row.GoalsDiference, // FIFA's typo is kept to match the source field.
    pts: row.Points,
    form: recentForm(row),
  };
}

function groupAndSort(rows) {
  const map = {};

  for (const row of rows) {
    const id = row.IdGroup;
    const name = localeName(row.Group);
    if (!id) continue;

    if (!map[id]) map[id] = { id, name, teams: [] };
    map[id].teams.push(mapRow(row));
  }

  return Object.values(map)
    .map((group) => ({
      ...group,
      teams: group.teams.sort((a, b) => a.position - b.position),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = { groupAndSort };
