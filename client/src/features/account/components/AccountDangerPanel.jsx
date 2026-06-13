import { Loader2, Trash2 } from 'lucide-react';

export function AccountDangerPanel({ username, password, setPassword, saving, onSubmit }) {
  return (
    <form className="rounded-xl border border-rose-100 bg-white p-5" onSubmit={onSubmit}>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50">
          <Trash2 className="h-4 w-4 text-rose-500" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-semibold text-slate-700">Delete account</h2>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Permanently deletes {username || 'your account'}, all predictions, and points.
      </p>

      <input
        className="field"
        type="password"
        placeholder="Current password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
      />

      <button className="btn btn-danger mt-4 w-full" disabled={saving || !password}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
        Delete account
      </button>
    </form>
  );
}
