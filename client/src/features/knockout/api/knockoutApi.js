import { apiRequest, API_BASE } from '@/lib/api/apiClient';

function resolveFlagUrl(flag) {
  if (!flag) return null;
  if (/^https?:\/\//i.test(flag)) return flag;
  return `${API_BASE}${flag}`;
}

function resolveMatchFlags(match) {
  return {
    ...match,
    home: { ...(match.home || {}), flag: resolveFlagUrl(match.home?.flag) },
    away: { ...(match.away || {}), flag: resolveFlagUrl(match.away?.flag) },
  };
}

export async function getKnockoutBracket() {
  const data = await apiRequest('/knockout');
  const rounds = (data.rounds || []).map((round) => ({
    ...round,
    matches: (round.matches || []).map(resolveMatchFlags),
  }));
  return { ...data, rounds };
}
