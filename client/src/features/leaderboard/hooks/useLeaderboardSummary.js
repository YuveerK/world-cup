import { useMemo } from 'react';
import { getLeaderboardSummary } from '../utils/leaderboardSummary';

export function useLeaderboardSummary(leaderboard = []) {
  return useMemo(() => getLeaderboardSummary(leaderboard), [leaderboard]);
}
