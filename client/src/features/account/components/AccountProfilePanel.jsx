import { Loader2, Save, Star } from 'lucide-react';

export function AccountProfilePanel({ user, form, setForm, saving, onSubmit }) {
  return (
    <form className="panel p-5" onSubmit={onSubmit}>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100">
          <Star className="h-4 w-4 text-slate-500" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-semibold text-slate-700">Profile</h2>
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-slate-500">Username</span>
          <input
            className="field"
            value={form.username}
            onChange={(e) => setForm((c) => ({ ...c, username: e.target.value }))}
            autoComplete="username"
            minLength={2}
            required
          />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-semibold text-slate-500">Current password</span>
          <input
            className="field"
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm((c) => ({ ...c, currentPassword: e.target.value }))}
            autoComplete="current-password"
            required
          />
        </label>
      </div>

      {user?.isAdmin && (
        <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
          Admin access is tied to this account.
        </p>
      )}

      <button className="btn btn-primary mt-4 w-full" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        Update username
      </button>
    </form>
  );
}
