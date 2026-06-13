import { apiRequest } from '@/lib/api/apiClient';

export async function getLeaderboard() {
  const data = await apiRequest('/leaderboard');
  return data.leaderboard || [];
}
