import { KeyRound, Loader2, Save } from 'lucide-react';

export function AccountSecurityPanel({ form, setForm, saving, onSubmit }) {
  return (
    <form className="panel p-5" onSubmit={onSubmit}>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100">
          <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
        </div>
        <h2 className="text-sm font-semibold text-slate-700">Password</h2>
      </div>

      <div className="grid gap-3">
        <input className="field" type="password" placeholder="Current password" value={form.currentPassword}
          onChange={(e) => setForm((c) => ({ ...c, currentPassword: e.target.value }))}
          autoComplete="current-password" required />
        <input className="field" type="password" placeholder="New password" value={form.newPassword}
          onChange={(e) => setForm((c) => ({ ...c, newPassword: e.target.value }))}
          autoComplete="new-password" minLength={4} required />
        <input className="field" type="password" placeholder="Confirm new password" value={form.confirmPassword}
          onChange={(e) => setForm((c) => ({ ...c, confirmPassword: e.target.value }))}
          autoComplete="new-password" minLength={4} required />
      </div>

      <button className="btn btn-primary mt-4 w-full" disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        Update password
      </button>
    </form>
  );
}
