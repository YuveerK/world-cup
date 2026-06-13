import { TOKEN_KEY } from '@/app/config/constants';

export function getStoredToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function storeToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { return null; }
}

export function clearStoredToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { return null; }
}
