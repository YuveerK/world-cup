export function RankBadge({ rank }) {
  const s = rank === 1
    ? 'bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950 shadow-[0_4px_12px_rgba(250,204,21,0.45)]'
    : rank === 2
    ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700'
    : rank === 3
    ? 'bg-gradient-to-br from-orange-200 to-amber-400 text-blue-950'
    : 'bg-blue-100 text-blue-900';
  return (
    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-black ${s}`}>#{rank}</div>
  );
}
