import { roundPoints } from '@/lib/utils/number';

export function TimingCorrelation({ row, fixturesById }) {
  const groups = { early: { n: 0, pts: 0, earned: 0 }, late: { n: 0, pts: 0, earned: 0 } };
  (row.match_points || []).forEach((entry) => {
    if (!entry.scored || !entry.prediction?.submitted_at) return;
    const match = fixturesById?.get(String(entry.match_id));
    if (!match?.date) return;
    const diffH = (new Date(match.date) - new Date(entry.prediction.submitted_at)) / 3_600_000;
    const g = diffH >= 24 ? groups.early : groups.late;
    g.n++;
    g.pts += roundPoints(entry.match_total || 0);
    if (roundPoints(entry.match_total || 0) > 0) g.earned++;
  });

  if (!groups.early.n && !groups.late.n) return <p className="py-2 text-xs text-slate-400">No submission timing data yet.</p>;

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: 'Early birds', sub: '24h+ before KO', g: groups.early },
        { label: 'Last-minute', sub: 'Under 24h before', g: groups.late },
      ].map(({ label, sub, g }) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-[10px] text-slate-400">{sub}</p>
          <p className="mt-2 text-xl font-black text-slate-950">{g.n ? `${Math.round((g.earned / g.n) * 100)}%` : '—'}</p>
          <p className="text-[10px] text-slate-400">{g.n} matches · +{g.pts} pts</p>
        </div>
      ))}
    </div>
  );
}
