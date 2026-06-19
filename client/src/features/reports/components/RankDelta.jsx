import { TrendingDown, TrendingUp } from 'lucide-react';

export function RankDelta({ value }) {
  if (!value) return <span className="text-xs font-semibold text-slate-400">—</span>;
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-black ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
      {up ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
      {Math.abs(value)}
    </span>
  );
}
