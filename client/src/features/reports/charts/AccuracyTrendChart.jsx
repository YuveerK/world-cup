import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { isActiveReportDay } from '../utils/reportData';

export function AccuracyTrendChart({ row, matchdays }) {
  const data = matchdays
    .map((day, i) => ({ name: `MD${i + 1}`, acc: row.matchdayAccuracy?.[i] ?? null, active: isActiveReportDay(day) }))
    .filter((d) => d.active && d.acc !== null);

  if (data.length < 2) return <p className="py-4 text-center text-xs text-slate-400">Not enough matchdays yet</p>;

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} interval={data.length > 8 ? 1 : 0} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                <p className="text-sm font-black text-blue-600">{payload[0].value}% hit rate</p>
              </div>
            );
          }}
        />
        <Line type="monotone" dataKey="acc" stroke="#2563eb" strokeWidth={2}
          dot={{ r: 3, fill: '#2563eb', stroke: 'white', strokeWidth: 2 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
