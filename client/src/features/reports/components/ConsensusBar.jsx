export function ConsensusBar({ matchId, consensus }) {
  const data = consensus?.get(String(matchId));
  if (!data || !data.total) return null;
  const { votes, total } = data;
  const home = Math.round((votes.home / total) * 100);
  const draw = Math.round((votes.draw / total) * 100);
  const away = 100 - home - draw;
  return (
    <div className="mt-2.5 rounded-lg bg-slate-50 px-2.5 pt-2 pb-2.5">
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400">
        <span>Group prediction</span>
        <span>{total} submitted</span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full">
        {home > 0 && <div className="bg-blue-500" style={{ width: `${home}%` }} />}
        {draw > 0 && <div className="bg-slate-300" style={{ width: `${draw}%` }} />}
        {away > 0 && <div className="bg-rose-400" style={{ width: `${away}%` }} />}
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-semibold">
        <span className="text-blue-600">{home}% H</span>
        <span className="text-slate-400">{draw}% D</span>
        <span className="text-rose-500">{away}% A</span>
      </div>
    </div>
  );
}
