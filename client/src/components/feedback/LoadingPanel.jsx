import { Loader2 } from 'lucide-react';

export function LoadingPanel({ label }) {
  return (
    <div className="panel grid min-h-52 place-items-center p-8">
      <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" aria-hidden="true" />
        {label}
      </div>
    </div>
  );
}

export function LoadingRows() {
  return (
    <div className="grid gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}
