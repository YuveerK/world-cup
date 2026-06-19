import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CHART_PALETTE } from '../constants';
import { isActiveReportDay } from '../utils/reportData';
import { roundPoints } from '@/lib/utils/number';

export function TournamentProgressChart({ rows, matchdays, highlightUsername }) {
  const scored = matchdays.map((day, i) => ({ day, i })).filter(({ day }) => isActiveReportDay(day));
  if (!scored.length || !rows.length) return null;

  const data = scored.map(({ i }) => {
    const point = { name: `MD${i + 1}` };
    rows.forEach((r) => { point[r.username] = roundPoints(r.cumulativeTotals[i] || 0); });
    return point;
  });

  const sorted = [...rows].sort((a, b) => (a.rank || 99) - (b.rank || 99));
  const colorOf = (username) => {
    const idx = sorted.findIndex((r) => r.username === username);
    return CHART_PALETTE[idx % CHART_PALETTE.length];
  };
  const slugOf = (username) => username.replace(/[^a-z0-9]/gi, '_');

  const hasHighlight = Boolean(highlightUsername && rows.find((r) => r.username === highlightUsername));
  const hl = rows.find((r) => r.username === highlightUsername);
  const others = rows.filter((r) => r.username !== highlightUsername);

  const lastData = data[data.length - 1] || {};
  const legendRows = sorted.map((r) => ({
    username: r.username,
    color: colorOf(r.username),
    pts: lastData[r.username] ?? 0,
    rank: r.rank,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const items = [...payload]
      .filter((p) => p.value != null)
      .sort((a, b) => b.value - a.value)
      .map((p, i) => ({ ...p, rank: i + 1 }));
    return (
      <div className="min-w-[180px] rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-2xl backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-1.5">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        </div>
        <div className="space-y-1.5">
          {items.map((p) => {
            const color = colorOf(p.dataKey);
            const isHl = p.dataKey === highlightUsername;
            return (
              <div key={p.dataKey} className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white" style={{ backgroundColor: color }}>
                  {p.rank}
                </span>
                <span className={`flex-1 truncate ${isHl ? 'font-black' : 'font-semibold'} text-xs text-slate-700`}>
                  {p.dataKey}
                </span>
                <span className="text-xs font-black tabular-nums" style={{ color }}>{p.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: -8 }}>
          <defs>
            {[...others, ...(hl ? [hl] : [])].map((r) => {
              const color = colorOf(r.username);
              const slug = slugOf(r.username);
              const isHlPlayer = hasHighlight && r.username === highlightUsername;
              const opacity = hasHighlight && !isHlPlayer ? 0 : 0.18;
              return (
                <linearGradient key={slug} id={`grad-${slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={opacity} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700, letterSpacing: 1 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<CustomTooltip />} />
          {others.map((r) => {
            const color = colorOf(r.username);
            const slug = slugOf(r.username);
            return (
              <Area key={r.username} type="monotone" dataKey={r.username}
                stroke={color} strokeWidth={hasHighlight ? 1 : 2} strokeOpacity={hasHighlight ? 0.2 : 0.85}
                fill={`url(#grad-${slug})`} fillOpacity={1}
                dot={false} activeDot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            );
          })}
          {hl && (() => {
            const color = colorOf(hl.username);
            const slug = slugOf(hl.username);
            return (
              <Area key={hl.username} type="monotone" dataKey={hl.username}
                stroke={color} strokeWidth={3} strokeOpacity={1}
                fill={`url(#grad-${slug})`} fillOpacity={1}
                dot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: color, stroke: 'white', strokeWidth: 3 }}
                isAnimationActive={false}
              />
            );
          })()}
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-2">
        {legendRows.map((r) => {
          const dimmed = hasHighlight && r.username !== highlightUsername;
          return (
            <div key={r.username} className="flex items-center gap-1.5 transition-opacity" style={{ opacity: dimmed ? 0.35 : 1 }}>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="text-[11px] font-semibold text-slate-600">{r.username}</span>
              <span className="text-[11px] font-black tabular-nums" style={{ color: r.color }}>{r.pts}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
