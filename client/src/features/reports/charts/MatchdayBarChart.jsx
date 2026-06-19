import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { isActiveReportDay } from '../utils/reportData';
import { roundPoints } from '@/lib/utils/number';

export function MatchdayBarChart({ row, matchdays }) {
  const scored = matchdays.map((day, i) => ({ day, i })).filter(({ day }) => isActiveReportDay(day));
  if (!scored.length) return <p className="py-4 text-center text-xs text-slate-400">No scored matchdays yet</p>;

  const data = scored.map(({ i }) => ({
    name: `MD${i + 1}`,
    pts: roundPoints(row.dayTotals[i] || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 16, right: 4, bottom: 4, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
        <Tooltip
          cursor={{ fill: '#f8fafc', radius: 6 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="text-sm font-black text-blue-600">+{payload[0].value} pts</p>
              </div>
            );
          }}
        />
        <Bar dataKey="pts" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pts > 0 ? '#2563eb' : '#e2e8f0'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
