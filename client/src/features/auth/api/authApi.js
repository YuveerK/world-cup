import { apiRequest } from '@/lib/api/apiClient';

export async function login(credentials) {
  return apiRequest('/auth/login', { method: 'POST', body: credentials });
}

export async function signup(credentials) {
  return apiRequest('/auth/signup', { method: 'POST', body: credentials });
}

export async function getMe(token) {
  return apiRequest('/auth/me', { token });
}

export async function updatePicks(body, token) {
  return apiRequest('/auth/picks', { method: 'PUT', token, body });
}

export async function updateUsername(body, token) {
  return apiRequest('/auth/username', { method: 'PUT', token, body });
}

export async function updatePassword(body, token) {
  return apiRequest('/auth/password', { method: 'PUT', token, body });
}

export async function deleteAccount(body, token) {
  return apiRequest('/auth/account', { method: 'DELETE', token, body });
}
