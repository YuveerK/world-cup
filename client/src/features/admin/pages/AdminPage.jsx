import { useMemo, useState } from 'react';
import { CheckCircle2, CircleDashed, RefreshCw, Search, ShieldCheck, Users, X } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingRows } from '@/components/feedback/LoadingPanel';
import { AdminPredictionRow } from '../components/AdminPredictionRow';
import { AdminMatchPicker } from '../components/AdminMatchPicker';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'predicted', label: 'Predicted' },
  { id: 'missing', label: 'Missing' },
];

export function AdminPage({
  fixtures,
  fixturesById,
  currentUser,
  selectedMatchId,
  setSelectedMatchId,
  rows,
  drafts,
  updateDraft,
  savePrediction,
  savingUserId,
  passwordDrafts,
  updatePasswordDraft,
  savePassword,
  savingPasswordUserId,
  deleteUser,
  deletingUserId,
  loading,
  refresh,
  onViewStats,
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const selectedMatch = fixturesById.get(String(selectedMatchId));

  const stats = useMemo(() => {
    const predicted = rows.filter((r) => r.prediction).length;
    return { total: rows.length, predicted, missing: rows.length - predicted };
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (q && !row.user.username.toLowerCase().includes(q)) return false;
      if (filter === 'predicted' && !row.prediction) return false;
      if (filter === 'missing' && row.prediction) return false;
      return true;
    });
  }, [rows, query, filter]);

  return (
    <div className="space-y-6">
      {/* Hero header */}
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
              Set or correct any player's prediction — admin edits are allowed even after kickoff.
            </p>
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={refresh}
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

      {/* Match picker */}
      <AdminMatchPicker
        fixtures={fixtures}
        selectedMatch={selectedMatch}
        selectedMatchId={selectedMatchId}
        onSelect={setSelectedMatchId}
        onViewStats={onViewStats}
      />

      {/* Players + predictions */}
      {!selectedMatchId ? (
        <div className="panel p-8">
          <EmptyState title="Choose a match" detail="Select a fixture above to load and edit every player's prediction." />
        </div>
      ) : loading ? (
        <div className="panel p-5">
          <LoadingRows />
        </div>
      ) : rows.length ? (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                className="field pl-9 pr-9"
                type="search"
                placeholder="Search players…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    filter === f.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f.label}
                  {f.id === 'predicted' && <span className="ml-1.5 text-xs text-slate-400">{stats.predicted}</span>}
                  {f.id === 'missing' && <span className="ml-1.5 text-xs text-slate-400">{stats.missing}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Player cards */}
          {visibleRows.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleRows.map((row) => (
                <AdminPredictionRow
                  key={row.user.id}
                  row={row}
                  match={selectedMatch}
                  currentUser={currentUser}
                  draft={drafts[row.user.id] || {}}
                  updateDraft={updateDraft}
                  savePrediction={savePrediction}
                  saving={savingUserId === row.user.id}
                  passwordDraft={passwordDrafts[row.user.id] || ''}
                  updatePasswordDraft={updatePasswordDraft}
                  savePassword={savePassword}
                  savingPassword={savingPasswordUserId === row.user.id}
                  deleteUser={deleteUser}
                  deleting={deletingUserId === row.user.id}
                />
              ))}
            </div>
          ) : (
            <div className="panel p-8">
              <EmptyState title="No players match" detail="Try a different search or filter." />
            </div>
          )}
        </div>
      ) : (
        <div className="panel p-8">
          <EmptyState title="No users found" detail="Create users before managing predictions." />
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

