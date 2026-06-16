export function getRankBadgeClass(rank) {
  if (rank === 1) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-300';
  if (rank === 2) return 'bg-slate-100 text-slate-600 ring-1 ring-slate-300';
  if (rank === 3) return 'bg-orange-50 text-orange-600 ring-1 ring-orange-200';
  return 'bg-slate-50 text-slate-500 ring-1 ring-slate-200';
}

export function getRankProgressClass(rank) {
  if (rank === 1) return 'bg-amber-400';
  if (rank === 2) return 'bg-slate-400';
  if (rank === 3) return 'bg-orange-400';
  return 'bg-blue-400';
}
