import { apiRequest } from '@/lib/api/apiClient';

export async function getFixtures() {
  const data = await apiRequest('/fixtures');
  return data.matches || [];
}

export async function getMatchStats(matchId, stageId) {
  const queryString = stageId ? `?stageId=${encodeURIComponent(stageId)}` : '';
  return apiRequest(`/fixtures/${matchId}/stats${queryString}`);
}
