import { roundPoints } from '@/lib/utils/number';

export function LeaderboardCategoryStat({ label, points, highlight }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center ${
        highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-base font-bold ${highlight ? 'text-amber-700' : 'text-slate-900'}`}>
        {roundPoints(points)}
      </p>
    </div>
  );
}
