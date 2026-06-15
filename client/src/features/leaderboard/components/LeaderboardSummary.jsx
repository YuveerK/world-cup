import { Crown, Medal, Target } from 'lucide-react';

export function LeaderboardSummary({ leader, playerCount, scoredPredictions }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatTile icon={Crown} tint="amber" label="Leader" value={leader?.username || '-'} />
      <StatTile icon={Medal} tint="blue" label="Players" value={playerCount} />
      <StatTile icon={Target} tint="sky" label="Scored predictions" value={scoredPredictions} />
    </div>
  );
}

function StatTile({ icon: Icon, tint, label, value }) {
  const tints = {
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    sky: 'bg-sky-50 text-sky-600',
  };

  return (
    <div className="panel flex items-center gap-3 p-4">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tints[tint]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="truncate text-xl font-bold text-slate-950">{value}</p>
      </div>
    </div>
  );
}
