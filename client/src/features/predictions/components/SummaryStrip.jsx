import { Crown, Target, TrendingUp, Trophy } from 'lucide-react';

export function SummaryStrip({ user, predictions, totals, leaderboard }) {
  const currentRank = leaderboard.find((row) => row.username === user?.username);
  const total = Math.round((totals.ht + totals.ft + totals.closest + totals.outcome + (user?.winner_pts || 0)) * 10) / 10;

  const items = [
    { label: 'Rank', value: currentRank ? `#${currentRank.rank}` : '—', icon: Crown, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
    { label: 'Total points', value: total, icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Predictions', value: predictions.length, icon: Target, iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
    { label: 'Winner pts', value: user?.winner_pts || 0, icon: Trophy, iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
            </div>
            <div className={`rounded-lg p-2 ${item.iconBg}`}>
              <item.icon className={`h-5 w-5 ${item.iconColor}`} aria-hidden="true" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
