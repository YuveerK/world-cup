import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { roundPoints } from '@/lib/utils/number';

export function CategoryBreakdownChart({ rows }) {
  const data = [...rows].sort((a, b) => (b.total || 0) - (a.total || 0)).map((r) => ({
    name: r.username,
    HT: roundPoints(r.ht_pts || 0),
    FT: roundPoints(r.ft_pts || 0),
    Closest: roundPoints(r.closest_pts || 0),
    Outcome: roundPoints(r.outcome_pts || 0),
    Winner: roundPoints(r.winner_pts || 0),
  }));

  const cats = [
    { key: 'HT', color: '#f59e0b' },
    { key: 'FT', color: '#2563eb' },
    { key: 'Closest', color: '#7c3aed' },
    { key: 'Outcome', color: '#059669' },
    { key: 'Winner', color: '#db2777' },
  ].filter((c) => data.some((d) => d[c.key] > 0));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="mb-1 text-xs font-black text-slate-700">{label}</p>
                {payload.filter((p) => p.value > 0).map((p) => (
                  <div key={p.dataKey} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.fill }} />{p.name}
                    </span>
                    <span className="font-bold">{p.value}</span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        {cats.map((c, i) => (
          <Bar key={c.key} dataKey={c.key} stackId="a" fill={c.color}
            radius={i === cats.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
