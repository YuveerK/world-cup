import { dayKeyOf } from '@/lib/date/index';

function round1(n) {
  return Math.round(n * 10) / 10;
}

function buildDayMap(matchPoints, fixturesById) {
  const map = new Map();
  for (const entry of matchPoints || []) {
    if (!entry.scored) continue;
    const match = fixturesById?.get(String(entry.match_id));
    const key = match?.date ? dayKeyOf(match.date) : null;
    if (!key || key === 'tbc') continue;
    map.set(key, round1((map.get(key) || 0) + (entry.match_total || 0)));
  }
  return map;
}

// Returns an array of { key, dayIndex, dayPts, rank } for each match day
// where the current player has scored, ordered chronologically.
// rank is the cumulative rank across all players at the end of that match day.
export function computeMatchDayHistory(currentRow, leaderboard, fixturesById) {
  if (!leaderboard?.length || !currentRow) return [];

  const currentId = currentRow.id || currentRow.username;

  const playerMaps = leaderboard.map((row) => ({
    id: row.id || row.username,
    dayMap: buildDayMap(row.match_points, fixturesById),
  }));

  const currentPlayerMap = playerMaps.find((p) => p.id === currentId);
  if (!currentPlayerMap?.dayMap.size) return [];

  // Collect all day keys across the whole leaderboard, sorted chronologically
  const allKeys = new Set();
  for (const { dayMap } of playerMaps) {
    for (const key of dayMap.keys()) allKeys.add(key);
  }
  const sortedKeys = [...allKeys].sort();

  // For each day key where the current player scored, compute day pts + cumulative rank
  return sortedKeys
    .filter((key) => currentPlayerMap.dayMap.has(key))
    .map((key, dayIndex) => {
      const keyIdx = sortedKeys.indexOf(key);

      const cumulative = playerMaps.map(({ id, dayMap }) => {
        let cum = 0;
        for (let d = 0; d <= keyIdx; d++) {
          cum += dayMap.get(sortedKeys[d]) || 0;
        }
        return { id, cum: round1(cum) };
      });

      cumulative.sort((a, b) => b.cum - a.cum || String(a.id).localeCompare(String(b.id)));
      const rank = cumulative.findIndex((c) => c.id === currentId) + 1;

      return {
        key,
        dayIndex: dayIndex + 1,
        dayPts: round1(currentPlayerMap.dayMap.get(key) || 0),
        rank,
      };
    });
}
