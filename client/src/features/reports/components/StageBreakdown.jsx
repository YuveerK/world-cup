import { roundPoints } from '@/lib/utils/number';

export function StageBreakdown({ row, fixturesById }) {
  const stages = {};
  (row.match_points || []).forEach((entry) => {
    if (!entry.scored) return;
    const match = fixturesById?.get(String(entry.match_id));
    const stage = match?.stage || 'Unknown';
    if (!stages[stage]) stages[stage] = { matches: 0, pts: 0, earned: 0 };
    stages[stage].matches++;
    stages[stage].pts += roundPoints(entry.match_total || 0);
    if (roundPoints(entry.match_total || 0) > 0) stages[stage].earned++;
  });

  const list = Object.entries(stages);
  if (list.length < 2) return <p className="py-2 text-xs text-slate-400">Stage breakdown available once multiple stages are played.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <th className="px-3 py-2 text-left">Stage</th>
            <th className="px-3 py-2 text-center">Matches</th>
            <th className="px-3 py-2 text-center">Points</th>
            <th className="px-3 py-2 text-center">Hit rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {list.map(([stage, d]) => (
            <tr key={stage}>
              <td className="px-3 py-2 font-semibold text-slate-700">{stage}</td>
              <td className="px-3 py-2 text-center text-slate-600">{d.matches}</td>
              <td className="px-3 py-2 text-center font-black text-blue-600">+{d.pts}</td>
              <td className="px-3 py-2 text-center font-bold text-slate-600">{Math.round((d.earned / d.matches) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
