import { AlertCircle } from 'lucide-react';

export function EmptyState({ title, detail }) {
  return (
    <div className="panel flex min-h-48 flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="mb-3 h-8 w-8 text-slate-300" aria-hidden="true" />
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{detail}</p>
    </div>
  );
}
