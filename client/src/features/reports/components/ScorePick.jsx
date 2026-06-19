export function ScorePick({ pick, actual, earned, hasPoints }) {
  const correct = earned && hasPoints;
  const incorrect = !earned && hasPoints && pick != null;
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold tabular-nums ${correct ? 'text-emerald-700' : incorrect ? 'text-rose-500' : pick != null ? 'text-slate-600' : 'text-slate-300'}`}>
      {pick != null ? pick : '—'}
      {correct && <span className="text-emerald-500">✓</span>}
      {incorrect && actual != null && <span className="text-[10px] font-normal text-slate-400">({actual})</span>}
    </span>
  );
}
