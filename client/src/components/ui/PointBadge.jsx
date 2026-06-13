import { roundPoints } from '@/lib/utils/number';

export function PointBadge({ label, points }) {
  return (
    <span className="badge bg-white">
      {label}
      <span className="font-bold text-slate-950">{roundPoints(points)}</span>
    </span>
  );
}
