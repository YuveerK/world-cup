import { Flame, TrendingDown } from 'lucide-react';

export function StreakIndicator({ value }) {
  if (!value) return null;
  const hot = value > 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${hot ? 'bg-orange-50 text-orange-600' : 'bg-sky-50 text-sky-600'}`}>
      {hot ? <Flame className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
      {Math.abs(value)}
    </span>
  );
}
