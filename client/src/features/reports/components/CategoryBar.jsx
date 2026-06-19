import { roundPoints } from '@/lib/utils/number';

export function CategoryBar({ label, value, maxValue, barClass }) {
  const width = maxValue > 0 ? `${Math.min(100, Math.max(0, (value / maxValue) * 100))}%` : '0%';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className="text-xs font-black text-slate-950">{roundPoints(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width }} />
      </div>
    </div>
  );
}
