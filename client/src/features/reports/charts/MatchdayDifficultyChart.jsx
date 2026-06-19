import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function MatchdayDifficultyChart({ insights }) {
  const data = insights?.matchdayDifficulty || [];
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.totalPts), 1);

  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} axisLine={false} tickLine={false} interval={data.length > 8 ? 1 : 0} />
        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="text-[10px] font-bold text-slate-400">{label}</p>
                <p className="text-sm font-black text-slate-700">{payload[0].value} total pts</p>
              </div>
            );
          }}
        />
        <Bar dataKey="totalPts" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={`rgba(124,58,237,${0.3 + (d.totalPts / max) * 0.7})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
