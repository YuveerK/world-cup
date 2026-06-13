import { apiRequest } from '@/lib/api/apiClient';

export async function getAdminPredictions(matchId, token) {
  const data = await apiRequest(`/admin/predictions/${matchId}`, { token });
  return data.rows || [];
}

export async function saveAdminPrediction(userId, matchId, body, token) {
  return apiRequest(`/admin/users/${userId}/predict/${matchId}`, { method: 'POST', token, body });
}

export async function saveAdminPassword(userId, password, token) {
  return apiRequest(`/admin/users/${userId}/password`, { method: 'PUT', token, body: { password } });
}

export async function deleteAdminUser(userId, token) {
  return apiRequest(`/admin/users/${userId}`, { method: 'DELETE', token });
}
