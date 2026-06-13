import { RefreshCw, Search, X } from 'lucide-react';
import { STATUSES } from '../constants';

const STATUS_LABELS = {
  ALL: 'All',
  UPCOMING: 'Upcoming',
  LIVE: 'Live',
  FINISHED: 'Finished',
};

export function MatchControls({ query, setQuery, statusFilter, setStatusFilter, refreshAll, loading }) {
  return (
    <div className="panel p-3 sm:p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            className="field pl-9 pr-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams, groups, stages, cities…"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </label>

        <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1">
          {STATUSES.map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                className={`flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? status === 'LIVE'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'LIVE' && (
                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-rose-500'}`} />
                )}
                {STATUS_LABELS[status] || status}
              </button>
            );
          })}
        </div>

        <button className="btn btn-secondary w-full md:w-auto" onClick={refreshAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>
    </div>
  );
}
