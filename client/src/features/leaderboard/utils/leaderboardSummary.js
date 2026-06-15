export function getLeaderboardSummary(leaderboard = []) {
  const leader = leaderboard[0];
  const scoredPredictions = leaderboard.reduce(
    (sum, row) => sum + (row.match_points || []).filter((entry) => entry.scored).length,
    0
  );

  return {
    leader,
    scoredPredictions,
    maxPoints: leader?.total || 1,
  };
}
