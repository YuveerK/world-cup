import { useState } from 'react';
import { ChevronDown, KeyRound, Loader2, Save, Settings2, Trash2 } from 'lucide-react';
import { roundPoints } from '@/lib/utils/number';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { AdminScorePair } from './AdminScorePair';

const FIELDS = ['ht_home', 'ht_away', 'ft_home', 'ft_away'];
const norm = (v) => (v === '' || v == null ? '' : String(v));

function initials(name = '') {
  const parts = name.trim().split(/[\s_-]+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function abbr(team) {
  return team?.abbreviation || teamName(team)?.slice(0, 3)?.toUpperCase() || '';
}

export function AdminPredictionRow({
  row,
  match,
  currentUser,
  draft,
  updateDraft,
  savePrediction,
  saving,
  passwordDraft,
  updatePasswordDraft,
  savePassword,
  savingPassword,
  deleteUser,
  deleting,
}) {
  const [showManage, setShowManage] = useState(false);

  const p = row.points || {};
  const total = row.points
    ? roundPoints((p.ht_pts || 0) + (p.ft_pts || 0) + (p.closest_pts || 0) + (p.outcome_pts || 0))
    : 0;

  const isCurrentUser = String(row.user.id) === String(currentUser?.id);
  const isProtectedAdmin = isCurrentUser || row.user.username === 'UvKal_zA' || row.user.isAdmin;
  const hasPrediction = Boolean(row.prediction);
  const isDirty = FIELDS.some((k) => norm(draft[k]) !== norm(row.prediction?.[k]));

  const homeAbbr = abbr(match?.home);
  const awayAbbr = abbr(match?.away);

  return (
    <div
      className={`rounded-2xl border bg-white p-4 transition sm:p-5 ${
        isDirty ? 'border-blue-300 shadow-sm ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Header: identity + points */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-black text-white shadow-sm">
            {initials(row.user.username)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-base font-bold text-slate-950">{row.user.username}</p>
              {isCurrentUser && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">You</span>
              )}
              {row.user.isAdmin && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">Admin</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
              {hasPrediction ? (
                <>Saved · HT {row.prediction.ht_home ?? '–'}-{row.prediction.ht_away ?? '–'} · FT {row.prediction.ft_home}-{row.prediction.ft_away}</>
              ) : (
                <span className="text-amber-600">No prediction yet</span>
              )}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xl font-black tabular-nums text-slate-950">{total}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">points</p>
        </div>
      </div>

      {/* Points breakdown */}
      {hasPrediction && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <PointPill label="HT" value={p.ht_pts || 0} />
          <PointPill label="FT" value={p.ft_pts || 0} />
          <PointPill label="Closest" value={roundPoints(p.closest_pts || 0)} />
          <PointPill label="Outcome" value={p.outcome_pts || 0} />
        </div>
      )}

      {/* Prediction editor */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <AdminScorePair
          label="Half time"
          tone="ht"
          homeLabel={homeAbbr}
          awayLabel={awayAbbr}
          homeValue={draft.ht_home ?? ''}
          awayValue={draft.ht_away ?? ''}
          onHome={(v) => updateDraft(row.user.id, 'ht_home', v)}
          onAway={(v) => updateDraft(row.user.id, 'ht_away', v)}
        />
        <AdminScorePair
          label="Full time"
          tone="ft"
          homeLabel={homeAbbr}
          awayLabel={awayAbbr}
          homeValue={draft.ft_home ?? ''}
          awayValue={draft.ft_away ?? ''}
          onHome={(v) => updateDraft(row.user.id, 'ft_home', v)}
          onAway={(v) => updateDraft(row.user.id, 'ft_away', v)}
        />
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowManage((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-expanded={showManage}
        >
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          Manage account
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showManage ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5">
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              Unsaved
            </span>
          )}
          <button className="btn btn-primary" onClick={() => savePrediction(row.user.id)} disabled={saving || !isDirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            Save
          </button>
        </div>
      </div>

      {/* Account management (collapsible) */}
      {showManage && (
        <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4">
          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className="field"
              type="password"
              placeholder="Set new password"
              value={passwordDraft}
              onChange={(e) => updatePasswordDraft(row.user.id, e.target.value)}
              minLength={4}
              autoComplete="new-password"
            />
            <button
              className="btn btn-secondary"
              onClick={() => savePassword(row.user.id, row.user.username)}
              disabled={savingPassword || !passwordDraft}
            >
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
              Reset password
            </button>
          </div>
          {!isProtectedAdmin && (
            <button
              className="btn btn-danger justify-self-start"
              onClick={() => deleteUser(row.user.id, row.user.username)}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              Delete account
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PointPill({ label, value }) {
  const active = value > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${
        active ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-400'
      }`}
    >
      <span className="uppercase tracking-wide">{label}</span>
      <span className="tabular-nums">{value}</span>
    </span>
  );
}
