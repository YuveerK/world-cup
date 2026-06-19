import { roundPoints } from '@/lib/utils/number';

export function HeadToHeadTable({ row, allRows }) {
  const opponent = allRows.find((r) => r.selectedRank === (row.selectedRank === 1 ? 2 : 1));
  if (!opponent) return null;

  const metrics = [
    { label: 'Total Points', a: roundPoints(row.total), b: roundPoints(opponent.total), aRaw: row.total || 0, bRaw: opponent.total || 0 },
    { label: 'Scoring Rate', a: `${row.accuracy}%`, b: `${opponent.accuracy}%`, aRaw: row.accuracy, bRaw: opponent.accuracy },
    { label: 'FT Exact', a: row.exactFT, b: opponent.exactFT, aRaw: row.exactFT, bRaw: opponent.exactFT },
    { label: 'HT Exact', a: row.exactHT, b: opponent.exactHT, aRaw: row.exactHT, bRaw: opponent.exactHT },
    { label: 'Perfect Picks', a: row.perfectPredictions || 0, b: opponent.perfectPredictions || 0, aRaw: row.perfectPredictions || 0, bRaw: opponent.perfectPredictions || 0 },
    { label: 'Best Day', a: `+${roundPoints(row.bestDay || 0)}`, b: `+${roundPoints(opponent.bestDay || 0)}`, aRaw: row.bestDay || 0, bRaw: opponent.bestDay || 0 },
    { label: 'Consistency (σ)', a: row.stdDev || 0, b: opponent.stdDev || 0, aRaw: opponent.stdDev || 0, bRaw: row.stdDev || 0 },
  ];

  return (
    <div>
      <div className="mb-3 grid grid-cols-3 items-center gap-2 text-center text-[10px] font-bold uppercase tracking-widest">
        <span className="truncate text-blue-600">{row.username}</span>
        <span className="text-slate-400">vs</span>
        <span className="truncate text-slate-600">{opponent.username}</span>
      </div>
      <div className="space-y-1.5">
        {metrics.map(({ label, a, b, aRaw, bRaw }) => {
          const aWins = aRaw > bRaw;
          const bWins = bRaw > aRaw;
          return (
            <div key={label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <span className={`rounded-lg px-2.5 py-1.5 text-right text-sm font-black tabular-nums ${aWins ? 'bg-blue-50 text-blue-700' : bWins ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>{a}</span>
              <span className="whitespace-nowrap text-center text-[10px] font-bold text-slate-400">{label}</span>
              <span className={`rounded-lg px-2.5 py-1.5 text-left text-sm font-black tabular-nums ${bWins ? 'bg-blue-50 text-blue-700' : aWins ? 'bg-slate-50 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>{b}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
