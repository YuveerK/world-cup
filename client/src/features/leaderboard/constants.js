export const LEADERBOARD_CATEGORY_STATS = [
  { label: 'HT Exact', pointsKey: 'ht_pts' },
  { label: 'FT Exact', pointsKey: 'ft_pts' },
  { label: 'Closest', pointsKey: 'closest_pts' },
  { label: 'Outcome', pointsKey: 'outcome_pts' },
  { label: 'Winner', pointsKey: 'winner_pts', highlight: true },
];

export const MATCH_POINT_PILL_CONFIG = [
  { label: 'HT', pointsKey: 'ht_pts', className: 'border-amber-100 bg-amber-50 text-amber-700' },
  { label: 'FT', pointsKey: 'ft_pts', className: 'border-blue-100 bg-blue-50 text-blue-700' },
  { label: 'Closest', pointsKey: 'closest_pts', className: 'border-violet-100 bg-violet-50 text-violet-700' },
  { label: 'Outcome', pointsKey: 'outcome_pts', className: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
];
