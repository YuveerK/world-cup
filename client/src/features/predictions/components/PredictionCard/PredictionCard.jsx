import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Eye,
  Loader2,
  Save,
  Users,
  XCircle,
} from "lucide-react";
import { TeamBlock } from "./TeamBlock";
import { ScoreInputGroup } from "./ScoreInputGroup";
import { formatDate, formatTime } from "@/lib/date/index";
import { roundPoints } from "@/lib/utils/number";
import {
  displayStatus,
  hasMatchScore,
  isPredictionLocked,
  scoreStatusLabel,
  scoreText,
  canShowMatchDetails,
  statusPillLabel,
} from "@/features/matches/utils/matchStatus";
import { outcomeLabel } from "@/features/matches/utils/matchFormatters";

function numEq(a, b) {
  const na = a == null || a === "" ? null : Number(a);
  const nb = b == null || b === "" ? null : Number(b);
  return na === nb;
}

export function PredictionCard({
  match,
  draft,
  updateDraft,
  savePrediction,
  prediction,
  points,
  saving,
  onViewStats,
  onViewPredictions,
}) {
  const hasPrediction = Boolean(prediction);
  const locked = isPredictionLocked(match);
  const matchTotal = points
    ? roundPoints(
        (points.ht_pts || 0) +
          (points.ft_pts || 0) +
          (points.closest_pts || 0) +
          (points.outcome_pts || 0),
      )
    : 0;
  const status = displayStatus(match);
  // Require `locked` (past kickoff) as a second guard so a bad API status value
  // on an upcoming match can never collapse the input form.
  const isLive = locked && status === "LIVE";
  const isFinished = status === "FINISHED";
  const isUpcoming = !locked;

  // Dirty check: draft differs from saved prediction?
  const isDirty = hasPrediction
    ? !numEq(draft.ht_home, prediction.ht_home) ||
      !numEq(draft.ht_away, prediction.ht_away) ||
      !numEq(draft.ft_home, prediction.ft_home) ||
      !numEq(draft.ft_away, prediction.ft_away)
    : String(draft.ft_home ?? "") !== "" ||
      String(draft.ft_away ?? "") !== "" ||
      String(draft.ht_home ?? "") !== "" ||
      String(draft.ht_away ?? "") !== "";

  const isPristine = hasPrediction && !isDirty;

  const htEarned = (points?.ht_pts || 0) > 0;
  const ftEarned = (points?.ft_pts || 0) > 0;
  const outEarned = (points?.outcome_pts || 0) > 0;
  const clsEarned = roundPoints(points?.closest_pts || 0) > 0;

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white ${
        isLive
          ? "border-rose-300 shadow-sm ring-1 ring-rose-100"
          : "border-slate-200"
      }`}
    >
      {/* ── Header bar ── */}
      <div
        className={`flex items-center justify-between gap-2 border-b px-3 py-2 sm:px-4 ${
          isLive
            ? "border-rose-100 bg-rose-50/70"
            : "border-slate-100 bg-slate-50/60"
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <span className="flex shrink-0 items-center gap-1.5 font-medium">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {formatDate(match.date)} · {formatTime(match.date)}
          </span>
          {match.group && (
            <span className="shrink-0 font-semibold">{match.group}</span>
          )}
          {match.stage && (
            <span className="hidden font-medium text-slate-400 sm:inline">
              {match.stage}
            </span>
          )}
        </div>
        <div
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
            isLive
              ? "bg-rose-600 text-white shadow-sm"
              : isFinished
                ? "bg-slate-100 text-slate-500"
                : "bg-sky-50 text-sky-600"
          }`}
        >
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
              <p
                className={`whitespace-nowrap text-2xl font-black tabular-nums leading-none sm:text-3xl ${
                  isLive ? "text-red-600" : "text-slate-950"
                }`}
              >
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
              <p className="text-xl font-black uppercase leading-none text-slate-300 sm:text-2xl">
                vs
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">
                {formatTime(match.date)}
              </p>
            </div>
          )}
          {(canShowMatchDetails(match) ||
            (match?.home?.abbreviation !== "TBD" &&
              match?.away?.abbreviation !== "TBD")) && (
            <button
              className="btn btn-secondary px-2.5 py-1 text-xs"
              onClick={() => onViewStats(match)}
            >
              {canShowMatchDetails(match) ? (
                <Activity className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Users className="h-3 w-3" aria-hidden="true" />
              )}
              {canShowMatchDetails(match) ? "Stats" : "Lineups"}
            </button>
          )}
        </div>

        <TeamBlock team={match.away} align="right" />
      </div>

      {/* ── UPCOMING: input form with smart button ── */}
      {isUpcoming && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
          <div className="mx-auto flex w-full flex-col items-center gap-2.5 sm:max-w-sm">
            <div className="flex w-full items-end justify-between gap-3">
              <ScoreInputGroup
                label="Half time"
                homeValue={draft.ht_home ?? ""}
                awayValue={draft.ht_away ?? ""}
                onHome={(v) => updateDraft(match.id, "ht_home", v)}
                onAway={(v) => updateDraft(match.id, "ht_away", v)}
                disabled={locked}
              />
              <ScoreInputGroup
                label="Full time"
                homeValue={draft.ft_home ?? ""}
                awayValue={draft.ft_away ?? ""}
                onHome={(v) => updateDraft(match.id, "ft_home", v)}
                onAway={(v) => updateDraft(match.id, "ft_away", v)}
                required
                disabled={locked}
              />
            </div>
            <button
              className={`btn h-[38px] w-full ${
                saving
                  ? "btn-primary"
                  : isPristine
                    ? "border border-slate-200 bg-white text-slate-400"
                    : "btn-primary"
              }`}
              onClick={() => savePrediction(match)}
              disabled={saving || isPristine}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : isPristine ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Save className="h-4 w-4" aria-hidden="true" />
              )}
              {saving
                ? "Saving…"
                : isPristine
                  ? "Saved"
                  : hasPrediction
                    ? "Update"
                    : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* ── LIVE: spectator summary + hero pts badge ── */}
      {isLive && hasPrediction && (
        <div className="border-t border-rose-100 bg-rose-50/30 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-4">
            {/* Left: locked prediction (no ✓/✗ — match still in progress) */}
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Your prediction
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="font-mono text-sm font-bold tabular-nums text-slate-600">
                  HT{" "}
                  {prediction.ht_home != null
                    ? `${prediction.ht_home}–${prediction.ht_away}`
                    : "—"}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums text-slate-600">
                  FT {prediction.ft_home}–{prediction.ft_away}
                </span>
              </div>
              <div className="mt-2">
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {outcomeLabel(prediction.ft_home, prediction.ft_away)}
                </span>
              </div>
            </div>

            {/* Right: hero live pts badge */}
            <div
              className={`shrink-0 rounded-2xl px-4 py-3 text-center shadow-sm ${
                matchTotal > 0 ? "bg-rose-600" : "bg-slate-100"
              }`}
            >
              <div className="mb-0.5 flex items-center justify-center gap-1">
                {matchTotal > 0 && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                )}
                <p
                  className={`text-[10px] font-bold uppercase tracking-wide ${
                    matchTotal > 0 ? "text-rose-200" : "text-slate-400"
                  }`}
                >
                  live
                </p>
              </div>
              <p
                className={`text-2xl font-black leading-none tabular-nums ${
                  matchTotal > 0 ? "text-white" : "text-slate-400"
                }`}
              >
                {points ? matchTotal : "—"}
              </p>
              <p
                className={`mt-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  matchTotal > 0 ? "text-rose-200" : "text-slate-400"
                }`}
              >
                pts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── FINISHED: compact post-match summary ── */}
      {isFinished && hasPrediction && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-4">
            {/* Left: pick scores + indicators */}
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Your prediction
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums">
                  <span
                    className={htEarned ? "text-emerald-700" : "text-slate-500"}
                  >
                    HT{" "}
                    {prediction.ht_home != null
                      ? `${prediction.ht_home}–${prediction.ht_away}`
                      : "—"}
                  </span>
                  {points &&
                    prediction.ht_home != null &&
                    (htEarned ? (
                      <CheckCircle2
                        className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        className="h-3.5 w-3.5 shrink-0 text-rose-300"
                        aria-hidden="true"
                      />
                    ))}
                </span>
                <span className="flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums">
                  <span
                    className={ftEarned ? "text-emerald-700" : "text-slate-500"}
                  >
                    FT {prediction.ft_home}–{prediction.ft_away}
                  </span>
                  {points &&
                    (ftEarned ? (
                      <CheckCircle2
                        className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        className="h-3.5 w-3.5 shrink-0 text-rose-300"
                        aria-hidden="true"
                      />
                    ))}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                    outEarned && points
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {outEarned && points && (
                    <CheckCircle2
                      className="mr-0.5 inline h-2.5 w-2.5"
                      aria-hidden="true"
                    />
                  )}
                  {outcomeLabel(prediction.ft_home, prediction.ft_away)}
                </span>
                {clsEarned && (
                  <span className="flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                    <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
                    Closest
                  </span>
                )}
              </div>
            </div>

            {/* Right: hero pts badge */}
            <div
              className={`shrink-0 rounded-2xl px-4 py-3 text-center shadow-sm ${
                matchTotal > 0 ? "bg-blue-600" : "bg-slate-100"
              }`}
            >
              <p
                className={`text-2xl font-black leading-none tabular-nums ${matchTotal > 0 ? "text-white" : "text-slate-400"}`}
              >
                {points ? matchTotal : "—"}
              </p>
              <p
                className={`mt-0.5 text-[10px] font-bold uppercase tracking-wide ${matchTotal > 0 ? "text-blue-200" : "text-slate-400"}`}
              >
                pts
              </p>
            </div>
          </div>
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
