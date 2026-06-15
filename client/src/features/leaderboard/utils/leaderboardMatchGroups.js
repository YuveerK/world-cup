import { dayKeyOf } from '@/lib/date/index';

export function groupMatchesByDay(matchPoints = [], fixturesById) {
  const map = new Map();

  for (const entry of matchPoints) {
    const match = fixturesById?.get(String(entry.match_id));
    const key = match?.date ? dayKeyOf(match.date) : 'tbc';

    if (!map.has(key)) {
      map.set(key, {
        key,
        date: match?.date ? new Date(match.date) : null,
        items: [],
      });
    }

    map.get(key).items.push({ entry, match });
  }

  const groups = [...map.values()].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
  groups.forEach((group) => {
    group.items.sort((a, b) => new Date(a.match?.date || 0) - new Date(b.match?.date || 0));
  });

  return groups;
}
