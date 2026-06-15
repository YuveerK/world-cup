import { useMemo } from 'react';
import { CheckCircle2, CircleDashed, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { getAdminPredictionStats } from '../utils/adminPredictionStats';

export function AdminPageHeader({ rows, selectedMatchId, loading, onRefresh }) {
  const stats = useMemo(() => getAdminPredictionStats(rows), [rows]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 px-5 py-6 sm:px-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-10 h-48 w-48 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
      </div>

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-300/15 ring-1 ring-amber-300/30">
              <ShieldCheck className="h-5 w-5 text-amber-300" aria-hidden="true" />
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white">Admin control</h2>
          </div>
          <p className="text-sm text-blue-100/80">
            Set or correct any player's prediction &mdash; admin edits are allowed even after kickoff.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onRefresh}
          disabled={!selectedMatchId || loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {selectedMatchId && stats.total > 0 && (
        <div className="relative mt-5 flex flex-wrap gap-2.5">
          <StatChip icon={Users} label="Players" value={stats.total} />
          <StatChip icon={CheckCircle2} label="Predicted" value={stats.predicted} tone="emerald" />
          <StatChip icon={CircleDashed} label="Missing" value={stats.missing} tone="amber" />
        </div>
      )}
    </div>
  );
}

function StatChip({ icon: Icon, label, value, tone = 'slate' }) {
  const toneCls =
    tone === 'emerald'
      ? 'text-blue-300'
      : tone === 'amber'
        ? 'text-amber-300'
        : 'text-blue-100';

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2">
      <Icon className={`h-4 w-4 ${toneCls}`} aria-hidden="true" />
      <span className="text-lg font-black tabular-nums text-white">{value}</span>
      <span className="text-xs font-semibold text-blue-100/70">{label}</span>
    </div>
  );
}
