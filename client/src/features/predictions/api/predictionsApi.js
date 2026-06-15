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

export async function getPredictionsForMatch(matchId, token) {
  const data = await apiRequest(`/predictions/${matchId}/all`, { token });
  return {
    rows: Array.isArray(data) ? data : (data?.predictions ?? []),
    actualResult: data?.actualResult ?? null,
  };
}
