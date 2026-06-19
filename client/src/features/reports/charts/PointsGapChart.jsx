import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { isActiveReportDay } from '../utils/reportData';
import { roundPoints } from '@/lib/utils/number';

export function PointsGapChart({ rows, matchdays }) {
  const scored = matchdays.map((day, i) => ({ day, i })).filter(({ day }) => isActiveReportDay(day));
  if (scored.length < 2 || rows.length < 2) return null;

  const data = scored.map(({ i }) => {
    const sorted = [...rows].map((r) => r.cumulativeTotals[i] || 0).sort((a, b) => b - a);
    return {
      name: `MD${i + 1}`,
      '1st–2nd': roundPoints(Math.max(0, (sorted[0] || 0) - (sorted[1] || 0))),
      ...(rows.length >= 3 ? { '2nd–3rd': roundPoints(Math.max(0, (sorted[1] || 0) - (sorted[2] || 0))) } : {}),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={130}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} interval={data.length > 8 ? 1 : 0} />
        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                {payload.map((p) => (
                  <p key={p.dataKey} className="text-xs font-bold" style={{ color: p.color }}>{p.name}: {p.value} pts</p>
                ))}
              </div>
            );
          }}
        />
        <Line type="monotone" dataKey="1st–2nd" name="1st–2nd gap" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
        {rows.length >= 3 && <Line type="monotone" dataKey="2nd–3rd" name="2nd–3rd gap" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 2" dot={false} isAnimationActive={false} />}
      </LineChart>
    </ResponsiveContainer>
  );
}
