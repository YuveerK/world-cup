import { apiRequest, API_BASE } from '@/lib/api/apiClient';

function resolveFlagUrl(flag) {
  if (!flag) return null;
  if (/^https?:\/\//i.test(flag)) return flag;
  return `${API_BASE}${flag}`;
}

function resolveFlags(groups) {
  return groups.map((group) => ({
    ...group,
    teams: (group.teams || []).map((entry) => ({
      ...entry,
      team: {
        ...(entry.team || {}),
        flag: resolveFlagUrl(entry.team?.flag),
      },
    })),
  }));
}

export async function getStandings() {
  const data = await apiRequest('/standings');
  return resolveFlags(data.groups || []);
}
