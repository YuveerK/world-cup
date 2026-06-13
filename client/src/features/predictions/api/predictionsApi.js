import { apiRequest } from '@/lib/api/apiClient';

export async function getMyPredictions(token) {
  const data = await apiRequest('/predictions/my', { token });
  return data.predictions || [];
}

export async function getMyPoints(token) {
  const data = await apiRequest('/predictions/my/points', { token });
  return data.points || [];
}

export async function savePrediction(matchId, body, token) {
  return apiRequest(`/predictions/${matchId}`, { method: 'POST', token, body });
}
