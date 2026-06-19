export function timeBeforeKickoff(submittedAt, matchDate) {
  if (!submittedAt || !matchDate) return null;
  const diffMs = new Date(matchDate) - new Date(submittedAt);
  if (diffMs < 0) return 'after kickoff';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m before`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h before`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h before` : `${days}d before`;
}
