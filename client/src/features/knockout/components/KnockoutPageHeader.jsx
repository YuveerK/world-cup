import { RefreshCw } from 'lucide-react';

export function KnockoutPageHeader({ onRefresh }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-3xl font-semibold text-slate-950 sm:text-4xl">Knockout bracket</h1>
      <button type="button" className="btn btn-secondary shrink-0" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Refresh
      </button>
    </div>
  );
}
