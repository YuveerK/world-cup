export function teamName(team) {
  return team?.name || 'TBD';
}

export function isRealTeam(team) {
  const name = teamName(team);
  return name && !/^TBD|Winner|Runner-up|Loser/i.test(name);
}

export function outcomeLabel(home, away) {
  if (home === away) return 'Draw';
  return home > away ? 'Home win' : 'Away win';
}

export function matchTitle(match, matchId) {
  if (!match) return `Match ${matchId}`;
  return `${teamName(match.home)} vs ${teamName(match.away)}`;
}
