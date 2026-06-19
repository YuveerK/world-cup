import { formatDayHeading } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';

export function buildShareText(matchday, rows) {
  return [
    `World Cup 2026 Matchday Report - ${formatDayHeading(matchday?.date)}`,
    '',
    ...rows.slice(0, 5).map((r) => `#${r.selectedRank} ${r.username}: +${roundPoints(r.selectedDayTotal)} today, ${roundPoints(r.total)} total`),
  ].join('\n');
}
