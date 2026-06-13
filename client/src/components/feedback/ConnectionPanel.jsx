import { Loader2 } from 'lucide-react';
import { API_BASE } from '@/lib/api/apiClient';

export function ConnectionPanel({ loading }) {
  return (
    <div className="panel px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin text-amber-500" aria-hidden="true" />
            ) : (
              <>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </>
            )}
          </span>
          <span className="text-xs font-semibold text-slate-500">API</span>
        </div>
        <span className={`text-xs font-medium ${loading ? 'text-amber-600' : 'text-blue-600'}`}>
          {loading ? 'Connecting…' : 'Connected'}
        </span>
      </div>
      <p className="mt-2 break-all text-xs text-slate-400">{API_BASE}</p>
    </div>
  );
}
