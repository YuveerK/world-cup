import { Search, X } from 'lucide-react';
import { ADMIN_PREDICTION_FILTERS } from '../constants';

export function AdminPredictionsToolbar({ query, setQuery, filter, setFilter, stats }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-xs flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          className="field pl-9 pr-9"
          type="search"
          placeholder="Search players..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
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
        {ADMIN_PREDICTION_FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
              filter === option.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {option.label}
            {option.id === 'predicted' && <span className="ml-1.5 text-xs text-slate-400">{stats.predicted}</span>}
            {option.id === 'missing' && <span className="ml-1.5 text-xs text-slate-400">{stats.missing}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
