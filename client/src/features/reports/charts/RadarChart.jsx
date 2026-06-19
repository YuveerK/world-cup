import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadarChart, ResponsiveContainer, Tooltip } from 'recharts';

export function RadarChart({ row, allRows }) {
  const cats = [
    { label: 'HT', key: 'ht_pts' },
    { label: 'FT', key: 'ft_pts' },
    { label: 'Closest', key: 'closest_pts' },
    { label: 'Outcome', key: 'outcome_pts' },
    { label: 'Winner', key: 'winner_pts' },
  ];
  const maxVals = cats.map((c) => Math.max(...allRows.map((r) => r[c.key] || 0), 1));
  const data = cats.map((c, i) => ({
    category: c.label,
    value: Math.round(Math.min(100, ((row[c.key] || 0) / maxVals[i]) * 100)),
    fullMark: 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RechartsRadarChart data={data} margin={{ top: 8, right: 28, bottom: 8, left: 28 }}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#475569', fontWeight: 700 }} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{payload[0].payload.category}</p>
                <p className="text-sm font-black text-blue-600">{payload[0].value}% of best</p>
              </div>
            );
          }}
        />
        <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.12} strokeWidth={2}
          dot={{ r: 3, fill: '#2563eb', stroke: 'white', strokeWidth: 1.5 }}
          isAnimationActive={false}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
