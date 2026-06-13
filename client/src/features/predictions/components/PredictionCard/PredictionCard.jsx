import { Activity, CalendarDays, Loader2, Save, Target } from 'lucide-react';
import { TeamBlock } from './TeamBlock';
import { ScoreInputGroup } from './ScoreInputGroup';
import { formatDate, formatTime } from '@/lib/date/index';
import { numberOrBlank } from '@/lib/utils/number';
import { displayStatus, hasMatchScore, isPredictionLocked, scoreStatusLabel, scoreText, canShowMatchDetails, statusPillLabel } from '@/features/matches/utils/matchStatus';
import { outcomeLabel } from '@/features/matches/utils/matchFormatters';

export function PredictionCard({ match, draft, updateDraft, savePrediction, prediction, points, saving, onViewStats }) {
  const hasPrediction = Boolean(prediction);
  const locked = isPredictionLocked(match);
  const matchTotal = points
    ? Math.round(((points.ht_pts || 0) + (points.ft_pts || 0) + (points.closest_pts || 0) + (points.outcome_pts || 0)) * 10) / 10
    : 0;
  const status = displayStatus(match);
  const isLive = status === 'LIVE';
  const isFinished = status === 'FINISHED';

  return (
    <article className={`overflow-hidden rounded-xl border bg-white ${
      isLive ? 'border-rose-300 shadow-sm ring-1 ring-rose-100' : 'border-slate-200'
    }`}>
      <div className={`flex items-center justify-between gap-2 border-b px-3 py-2.5 sm:px-5 sm:py-3 ${
        isLive ? 'border-rose-100 bg-rose-50/70' : 'border-slate-100 bg-slate-50/60'
      }`}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <span className="flex shrink-0 items-center gap-1.5 font-medium">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {formatDate(match.date)} · {formatTime(match.date)}
          </span>
          {match.group && <span className="shrink-0 font-semibold">{match.group}</span>}
          {match.stage && <span className="hidden font-medium text-slate-400 sm:inline">{match.stage}</span>}
        </div>
        <div className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
          isLive
            ? 'bg-rose-600 text-white shadow-sm'
            : isFinished
            ? 'bg-slate-100 text-slate-500'
            : 'bg-sky-50 text-sky-600'
        }`}>
          {isLive && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          )}
          {statusPillLabel(match)}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-4 sm:gap-6 sm:px-5 sm:py-6">
        <TeamBlock team={match.home} align="left" />

        <div className="flex flex-col items-center gap-2 sm:gap-3">
          {hasMatchScore(match) ? (
            <div className={`rounded-xl px-3 py-2.5 text-center sm:px-5 sm:py-3 ${
              isLive
                ? 'bg-rose-50 ring-1 ring-rose-200'
                : 'bg-slate-900 ring-1 ring-slate-800'
            }`}>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{scoreStatusLabel(match)}</p>
              <p className={`whitespace-nowrap text-2xl font-bold tabular-nums sm:text-3xl ${isLive ? 'text-rose-700' : 'text-white'}`}>
                {scoreText(match)}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center ring-1 ring-slate-100 sm:px-5 sm:py-3">
              <p className="text-xl font-bold text-slate-300 sm:text-2xl">vs</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-400">{formatTime(match.date)}</p>
            </div>
          )}
          {canShowMatchDetails(match) && (
            <button className="btn btn-secondary px-3 py-1.5 text-xs" onClick={() => onViewStats(match)}>
              <Activity className="h-3 w-3" aria-hidden="true" />
              Stats
            </button>
          )}
        </div>

        <TeamBlock team={match.away} align="right" />
      </div>

      <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-4 sm:px-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <ScoreInputGroup
            label="Half time"
            homeValue={draft.ht_home ?? ''}
            awayValue={draft.ht_away ?? ''}
            onHome={(v) => updateDraft(match.id, 'ht_home', v)}
            onAway={(v) => updateDraft(match.id, 'ht_away', v)}
            disabled={locked}
          />
          <ScoreInputGroup
            label="Full time"
            homeValue={draft.ft_home ?? ''}
            awayValue={draft.ft_away ?? ''}
            onHome={(v) => updateDraft(match.id, 'ft_home', v)}
            onAway={(v) => updateDraft(match.id, 'ft_away', v)}
            required
            disabled={locked}
          />
          <button
            className={`btn col-span-2 h-11 w-full md:col-span-1 md:w-auto md:min-w-[100px] ${
              isLive ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-700' : 'btn-primary'
            }`}
            onClick={() => savePrediction(match)}
            disabled={saving || locked}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {locked ? 'Locked' : hasPrediction ? 'Update' : 'Save'}
          </button>
        </div>

        {hasPrediction && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-slate-100 bg-white px-3 py-2">
            <Target className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="text-xs text-slate-500">
              Your pick: <span className="font-semibold text-slate-700">
                HT {numberOrBlank(prediction.ht_home) || '—'}-{numberOrBlank(prediction.ht_away) || '—'} / FT {prediction.ft_home}-{prediction.ft_away}
              </span>
            </span>
            <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {outcomeLabel(prediction.ft_home, prediction.ft_away)}
            </span>
          </div>
        )}
      </div>

      {points && (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-white px-3 py-3 sm:px-5">
          {[
            { label: 'HT', val: points.ht_pts || 0 },
            { label: 'FT', val: points.ft_pts || 0 },
            { label: 'Closest', val: Math.round((points.closest_pts || 0) * 10) / 10 },
            { label: 'Outcome', val: points.outcome_pts || 0 },
          ].map(({ label, val }) => (
            <span key={label} className="badge">
              {label} <span className={val > 0 ? 'font-semibold text-slate-800' : ''}>{val}</span>
            </span>
          ))}
          <span className={`ml-auto rounded-lg px-3 py-1.5 text-sm font-semibold ${
            matchTotal > 0
              ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
              : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100'
          }`}>
            {matchTotal} pts
          </span>
        </div>
      )}
    </article>
  );
}
