import { Activity, CalendarDays, Eye, Loader2, Save, Target, Users } from 'lucide-react';
import { TeamBlock } from './TeamBlock';
import { ScoreInputGroup } from './ScoreInputGroup';
import { formatDate, formatTime } from '@/lib/date/index';
import { numberOrBlank, roundPoints } from '@/lib/utils/number';
import { displayStatus, hasMatchScore, isPredictionLocked, scoreStatusLabel, scoreText, canShowMatchDetails, statusPillLabel } from '@/features/matches/utils/matchStatus';
import { outcomeLabel } from '@/features/matches/utils/matchFormatters';

export function PredictionCard({ match, draft, updateDraft, savePrediction, prediction, points, saving, onViewStats, onViewPredictions }) {
  const hasPrediction = Boolean(prediction);
  const locked = isPredictionLocked(match);
  const matchTotal = points
    ? roundPoints((points.ht_pts || 0) + (points.ft_pts || 0) + (points.closest_pts || 0) + (points.outcome_pts || 0))
    : 0;
  const status = displayStatus(match);
  const isLive = status === 'LIVE';
  const isFinished = status === 'FINISHED';

  return (
    <article className={`overflow-hidden rounded-xl border bg-white ${
      isLive ? 'border-rose-300 shadow-sm ring-1 ring-rose-100' : 'border-slate-200'
    }`}>

      {/* ── Header bar ── */}
      <div className={`flex items-center justify-between gap-2 border-b px-3 py-2 sm:px-4 ${
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

      {/* ── Teams + score ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4">
        <TeamBlock team={match.home} align="left" />

        <div className="flex flex-col items-center gap-1.5">
          {hasMatchScore(match) ? (
            <div className="text-center">
              <p className={`whitespace-nowrap text-2xl font-black tabular-nums leading-none sm:text-3xl ${
                isLive ? 'text-red-600' : 'text-slate-950'
              }`}>
                {scoreText(match)}
              </p>
              {isLive ? (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                  </span>
                  LIVE
                </span>
              ) : (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  {scoreStatusLabel(match)}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xl font-black uppercase leading-none text-slate-300 sm:text-2xl">vs</p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">{formatTime(match.date)}</p>
            </div>
          )}
          {(canShowMatchDetails(match) || (match?.home?.abbreviation !== 'TBD' && match?.away?.abbreviation !== 'TBD')) && (
            <button className="btn btn-secondary px-2.5 py-1 text-xs" onClick={() => onViewStats(match)}>
              {canShowMatchDetails(match) ? (
                <Activity className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Users className="h-3 w-3" aria-hidden="true" />
              )}
              {canShowMatchDetails(match) ? 'Stats' : 'Lineups'}
            </button>
          )}
        </div>

        <TeamBlock team={match.away} align="right" />
      </div>

      {/* ── Inputs ── */}
      <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-3 sm:px-4">
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex items-end justify-center gap-4">
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
          </div>
          <button
            className={`btn h-[38px] w-full ${
              isLive ? 'bg-rose-600 text-white shadow-sm hover:bg-rose-700' : 'btn-primary'
            }`}
            onClick={() => savePrediction(match)}
            disabled={saving || locked}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            {locked ? 'Locked' : hasPrediction ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Pick + points (single compact row) ── */}
      {(hasPrediction || points) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-slate-100 bg-white px-3 py-2.5 sm:px-4">
          {hasPrediction && (
            <div className="flex min-w-0 items-center gap-1.5">
              <Target className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="text-xs">
                <span className={`font-semibold ${points?.ht_pts > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                  HT {numberOrBlank(prediction.ht_home) || '—'}-{numberOrBlank(prediction.ht_away) || '—'}
                </span>
                <span className="text-slate-400"> / </span>
                <span className={`font-semibold ${points?.ft_pts > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                  FT {prediction.ft_home}-{prediction.ft_away}
                </span>
              </span>
              <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                points?.outcome_pts > 0
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {outcomeLabel(prediction.ft_home, prediction.ft_away)}
              </span>
            </div>
          )}

          {points && (
            <div className="ml-auto flex items-center gap-1.5">
              {[
                { label: 'HT', val: points.ht_pts || 0 },
                { label: 'FT', val: points.ft_pts || 0 },
                { label: 'Closest', val: roundPoints(points.closest_pts || 0) },
                { label: 'Outcome', val: points.outcome_pts || 0 },
              ].map(({ label, val }) => (
                <span
                  key={label}
                  className={`rounded-md px-1.5 py-1 text-[11px] font-medium ${
                    val > 0
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                      : 'badge'
                  }`}
                >
                  {label} <span className={val > 0 ? 'font-bold' : ''}>{val}</span>
                </span>
              ))}
              <span className={`ml-1 rounded-lg px-2.5 py-1 text-sm font-bold ${
                matchTotal > 0
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                  : 'bg-slate-50 text-slate-500 ring-1 ring-slate-100'
              }`}>
                {matchTotal} pts
              </span>
            </div>
          )}
        </div>
      )}
      {/* ── View all predictions ── */}
      {onViewPredictions && (
        <button
          type="button"
          onClick={() => onViewPredictions(match)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-2.5 text-[11px] font-semibold text-blue-500 transition hover:bg-slate-50 hover:text-blue-700"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          View all predictions
        </button>
      )}
    </article>
  );
}
