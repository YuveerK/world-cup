export function getRankBadgeClass(rank) {
  if (rank === 1) return 'bg-amber-100 text-amber-700';
  if (rank === 2) return 'bg-slate-200 text-slate-600';
  if (rank === 3) return 'bg-orange-100 text-orange-600';
  return 'bg-slate-100 text-slate-500';
}

export function getRankProgressClass(rank) {
  if (rank === 1) return 'bg-amber-400';
  if (rank === 2) return 'bg-slate-400';
  if (rank === 3) return 'bg-orange-400';
  return 'bg-blue-400';
}
