export function ScoreHeatmap({ row }) {
  const counts = {};
  let maxCount = 0;
  (row.match_points || []).forEach((e) => {
    const p = e.prediction;
    if (p?.ft_home == null) return;
    const h = Math.min(p.ft_home, 4);
    const a = Math.min(p.ft_away, 4);
    const key = `${h}-${a}`;
    counts[key] = (counts[key] || 0) + 1;
    if (counts[key] > maxCount) maxCount = counts[key];
  });

  const labels = ['0', '1', '2', '3', '4+'];
  if (!Object.keys(counts).length) return <p className="py-4 text-center text-xs text-slate-400">No FT predictions yet</p>;

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full text-center">
        <p className="mb-1 text-[10px] font-bold text-slate-400">Home → / Away ↓</p>
        <table className="mx-auto">
          <thead>
            <tr>
              <td className="p-1" />
              {labels.map((l) => <th key={l} className="p-1 text-center text-[10px] font-black text-slate-500">{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {labels.map((_, h) => (
              <tr key={h}>
                <th className="pr-2 text-right text-[10px] font-black text-slate-500">{labels[h]}</th>
                {labels.map((_, a) => {
                  const key = `${h}-${a}`;
                  const count = counts[key] || 0;
                  const intensity = maxCount > 0 ? count / maxCount : 0;
                  return (
                    <td key={a} className="p-0.5">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-black"
                        style={{
                          backgroundColor: count > 0 ? `rgba(37,99,235,${0.15 + intensity * 0.75})` : '#f8fafc',
                          color: intensity > 0.55 ? 'white' : count > 0 ? '#1e40af' : '#cbd5e1',
                        }}
                      >
                        {count || '·'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-[10px] text-slate-400">Predicted FT scorelines · columns = home goals · rows = away goals</p>
      </div>
    </div>
  );
}
