import { dayKeyOf } from '@/lib/date/index';
import { displayStatus } from '@/features/matches/utils/matchStatus';

export function groupFixturesByDay(fixtures = []) {
  const groups = new Map();

  for (const match of fixtures) {
    const key = dayKeyOf(match.date);

    if (!groups.has(key)) {
      const date = match.date ? new Date(match.date) : null;
      groups.set(key, {
        key,
        date: date && !Number.isNaN(date.valueOf()) ? date : null,
        matches: [],
        hasLive: false,
      });
    }

    const group = groups.get(key);
    group.matches.push(match);
    if (displayStatus(match) === 'LIVE') group.hasLive = true;
  }

  return [...groups.values()];
}
