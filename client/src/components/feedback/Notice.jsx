import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function Notice({ notice }) {
  const isSuccess = notice.type === 'success';
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
      isSuccess
        ? 'border-blue-100 bg-blue-50 text-blue-800'
        : 'border-rose-100 bg-rose-50 text-rose-800'
    }`}>
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" aria-hidden="true" />
      ) : (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
      )}
      <span>{notice.message}</span>
    </div>
  );
}
