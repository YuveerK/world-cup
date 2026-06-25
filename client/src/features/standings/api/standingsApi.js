import { apiRequest, API_BASE } from '@/lib/api/apiClient';

function resolveFlagUrl(flag) {
  if (!flag) return null;
  if (/^https?:\/\//i.test(flag)) return flag;
  return `${API_BASE}${flag}`;
}

function resolveTeamFlags(teams) {
  return (teams || []).map((entry) => ({
    ...entry,
    team: { ...(entry.team || {}), flag: resolveFlagUrl(entry.team?.flag) },
  }));
}

function resolveFlags(groups) {
  return groups.map((group) => ({
    ...group,
    teams: resolveTeamFlags(group.teams),
  }));
}

export async function getStandings() {
  const data = await apiRequest('/standings');
  return {
    groups: resolveFlags(data.groups || []),
    thirdPlace: resolveTeamFlags(data.thirdPlace || []),
  };
}
