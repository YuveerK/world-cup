import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Eye,
  Loader2,
  MapPin,
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
import { FIFA_PERIODS } from "@/features/matches/utils/fifaPeriods";
import { outcomeLabel, teamName } from "@/features/matches/utils/matchFormatters";

function formatCountdown(matchDate) {
  if (!matchDate) return null;
  const diffMs = new Date(matchDate) - Date.now();
  if (diffMs <= 0 || diffMs > 24 * 60 * 60 * 1000) return null;
  const totalMins = Math.floor(diffMs / 60000);
  if (totalMins < 60) return { short: `${totalMins}m`, label: 'Lock in now!', level: 'red' };
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const short = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return { short, label: `${short} to go`, level: hours < 6 ? 'amber' : 'slate' };
}

function tzAbbr(date) {
  return new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' })
    .formatToParts(date ? new Date(date) : new Date())
    .find((p) => p.type === 'timeZoneName')?.value ?? '';
}

function numEq(a, b) {
  const na = a == null || a === "" ? null : Number(a);
  const nb = b == null || b === "" ? null : Number(b);
  return na === nb;
}

function normalizeLocationPart(part) {
  return String(part ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function formatMatchLocation(match) {
  const seen = new Set();
  const stadium = String(match?.stadium ?? "").trim();
  const city = String(match?.city ?? "").trim();
  const country = String(match?.country ?? "").trim();
  const stadiumKey = normalizeLocationPart(stadium);
  const cityKey = normalizeLocationPart(city);
  const stadiumAlreadyNamesCity = Boolean(
    stadiumKey && cityKey && stadiumKey.includes(cityKey),
  );

  return [stadium, stadiumAlreadyNamesCity ? "" : city, country]
    .filter(Boolean)
    .filter((part) => {
      const key = normalizeLocationPart(part);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(", ");
}

const LIVE_TONE = {
  green: {
    row: 'border-emerald-200 bg-emerald-50',
    label: 'text-emerald-700',
    score: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    panel: 'border-emerald-200 bg-emerald-50/80',
    panelText: 'text-emerald-800',
    status: 'border-emerald-100 text-emerald-700',
  },
  amber: {
    row: 'border-amber-200 bg-amber-50',
    label: 'text-amber-700',
    score: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-700 ring-amber-200',
    panel: 'border-slate-200 bg-white',
    panelText: 'text-slate-800',
    status: 'border-amber-100 text-amber-700',
  },
  red: {
    row: 'border-rose-200 bg-rose-50',
    label: 'text-rose-700',
    score: 'text-rose-800',
    badge: 'bg-rose-100 text-rose-700 ring-rose-200',
    panel: 'border-rose-200 bg-rose-50/80',
    panelText: 'text-rose-800',
    status: 'border-rose-100 text-rose-700',
  },
  slate: {
    row: 'border-slate-200 bg-slate-50',
    label: 'text-slate-500',
    score: 'text-slate-700',
    badge: 'bg-slate-100 text-slate-500 ring-slate-200',
    panel: 'border-slate-200 bg-white',
    panelText: 'text-slate-700',
    status: 'border-slate-100 text-slate-500',
  },
};

function scorePair(home, away) {
  const homeNum = home == null || home === "" ? null : Number(home);
  const awayNum = away == null || away === "" ? null : Number(away);
  if (!Number.isFinite(homeNum) || !Number.isFinite(awayNum)) return "\u2014";
  return `${homeNum}\u2013${awayNum}`;
}

function parseLiveMinuteValue(minute) {
  const match = String(minute ?? "").trim().match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

function liveToneIcon(tone, className = "h-3.5 w-3.5") {
  if (tone === 'green') return <CheckCircle2 className={`${className} shrink-0`} aria-hidden="true" />;
  if (tone === 'red') return <XCircle className={`${className} shrink-0`} aria-hidden="true" />;
  if (tone === 'amber') return <AlertTriangle className={`${className} shrink-0`} aria-hidden="true" />;
  return <Clock className={`${className} shrink-0`} aria-hidden="true" />;
}

function LivePredictionRow({ label, pick, tone, status, points }) {
  const styles = LIVE_TONE[tone] ?? LIVE_TONE.slate;
  const statusText = points != null && points > 0 ? `+${points}` : status;

  return (
    <div className={`flex min-h-[40px] items-center justify-between gap-3 rounded-lg border px-3 py-2 ${styles.row}`}>
      <div className="flex min-w-0 items-baseline gap-2">
        <span className={`w-5 shrink-0 text-[11px] font-black uppercase tracking-wide ${styles.label}`}>
          {label}
        </span>
        <span className={`font-mono text-sm font-black tabular-nums ${styles.score}`}>
          {pick}
        </span>
      </div>
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${styles.badge}`}>
        {liveToneIcon(tone)}
        {statusText}
      </span>
    </div>
  );
}

function formatCurrentLeadLabel(currentMargin, homeName, awayName) {
  if (currentMargin > 0) return `${homeName} lead`;
  if (currentMargin < 0) return `${awayName} lead`;
  return 'Level';
}

function formatLiveNeedsText({
  ftExactImpossible,
  ftOutcomeOnTrack,
  predHome,
  predAway,
  currentHome,
  currentAway,
  homeName,
  awayName,
}) {
  if (!Number.isFinite(currentHome) || !Number.isFinite(currentAway)) return 'Current score pending';
  if (ftExactImpossible) return 'Exact score already impossible';
  if (currentHome === predHome && currentAway === predAway) return 'Hold this score';

  const currentMargin = currentHome - currentAway;
  const predictedMargin = predHome - predAway;
  const swing = predictedMargin - currentMargin;

  if (!ftOutcomeOnTrack && swing !== 0) {
    const targetScore = `${predHome}\u2013${predAway}`;
    if (predictedMargin > 0) return `${homeName} comeback to ${targetScore}`;
    if (predictedMargin < 0) return `${awayName} comeback to ${targetScore}`;
    return `match to finish ${targetScore}`;
  }

  const exactNeeds = [
    predHome > currentHome ? `${homeName} +${predHome - currentHome}` : null,
    predAway > currentAway ? `${awayName} +${predAway - currentAway}` : null,
  ].filter(Boolean);

  return exactNeeds.length > 0 ? `${exactNeeds.join(', ')} for exact score` : 'Hold this result path';
}

function LiveFtDetailCard({ tone, homeCode, awayCode, pick, current, needs, statusHeading, statusText, heading = 'Full time pick' }) {
  const styles = LIVE_TONE[tone] ?? LIVE_TONE.slate;

  return (
    <div className={`mt-2.5 rounded-lg border px-3 py-2 ${styles.panel}`}>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          {heading}
        </p>
        <p className={`mt-1 font-mono text-base font-black tabular-nums ${styles.panelText}`}>
          {homeCode} {pick} {awayCode}
        </p>
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-slate-600">
        <p className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-500">Current:</span>
          <span className="font-mono font-bold tabular-nums text-slate-700">{homeCode} {current} {awayCode}</span>
        </p>
        <p className="flex items-center justify-between gap-3">
          <span className="font-medium text-slate-500">Needs:</span>
          <span className="text-right font-semibold text-slate-700">{needs}</span>
        </p>
      </div>
      {statusHeading && statusText && (
        <p className={`mt-2 flex items-start gap-1.5 border-t pt-2 text-[11px] font-semibold leading-snug ${styles.status}`}>
          {liveToneIcon(tone, "mt-px h-3.5 w-3.5")}
          <span>
            {statusHeading} - {statusText}
          </span>
        </p>
      )}
    </div>
  );
}

function LiveChipBadge({ scored, pts }) {
  if (!scored) return null;
  const earned = pts > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
        earned ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
      }`}
    >
      {earned ? (
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      ) : (
        <XCircle className="h-3 w-3" aria-hidden="true" />
      )}
      {earned ? `+${roundPoints(pts)}` : 'Missed'}
    </span>
  );
}

function EtPickChip({ label, score, scored, pts, active, liveBadge = null }) {
  const earned = scored && pts > 0;
  const showLive = !scored && liveBadge;
  const base = earned
    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
    : showLive
      ? liveBadge.tone === 'green'
        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
        : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
      : active
        ? 'bg-white text-slate-700 ring-1 ring-slate-200'
        : 'bg-slate-50 text-slate-400 ring-1 ring-slate-100';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] font-semibold ${base}`}>
      <span>{label} {score}</span>
      {scored ? (
        <LiveChipBadge scored={scored} pts={pts} />
      ) : showLive ? (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
            liveBadge.tone === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          <Clock className="h-3 w-3" aria-hidden="true" />
          {liveBadge.text}
        </span>
      ) : null}
    </span>
  );
}

function ExtraPicksDisclosure({ expanded, onToggle, subtitle, prediction, points, active = false, penLiveBadge = null }) {
  // A phase has been scored once its exact-points column is non-null (mirrors the
  // `ht_pts != null` "scored" check used for regular time). ET FT / pens chips total
  // their related bonuses so the badge reflects everything earned from that pick.
  const etHtScored = points?.et_ht_pts != null;
  const etFtScored = points?.et_ft_pts != null;
  const penScored = points?.pen_exact_pts != null;
  const etHtPts = points?.et_ht_pts || 0;
  const etFtPts = (points?.et_ft_pts || 0) + (points?.et_outcome_pts || 0) + (points?.et_closest_pts || 0);
  const penPts = (points?.pen_exact_pts || 0) + (points?.pen_winner_pts || 0) + (points?.pen_closest_pts || 0);

  return (
    <div className="mt-2.5 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50"
      >
        <span className="min-w-0">
          <span className="block text-xs font-bold text-slate-700">Extra-time & pens predictions</span>
          <span className="block text-[11px] text-slate-400">{subtitle}</span>
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        )}
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 pb-3 pt-2">
          {prediction.et_ht_home != null && (
            <EtPickChip
              label="ET HT"
              score={scorePair(prediction.et_ht_home, prediction.et_ht_away)}
              scored={etHtScored}
              pts={etHtPts}
              active={active}
            />
          )}
          {prediction.et_ft_home != null && (
            <EtPickChip
              label="ET FT"
              score={scorePair(prediction.et_ft_home, prediction.et_ft_away)}
              scored={etFtScored}
              pts={etFtPts}
              active={active}
            />
          )}
          {prediction.pen_home != null && (
            <EtPickChip
              label="Pens"
              score={scorePair(prediction.pen_home, prediction.pen_away)}
              scored={penScored}
              pts={penPts}
              active={active}
              liveBadge={penLiveBadge}
            />
          )}
        </div>
      )}
    </div>
  );
}

function outcomeChipLabel(outcome, homeName, awayName) {
  if (outcome === 'Home win') return `${homeName} win`;
  if (outcome === 'Away win') return `${awayName} win`;
  return 'Draw';
}

function FinishedPhaseRow({ label, pick, earned, hasPoints = false, pts = 0 }) {
  const noPick = pick === '—';
  const scored = !noPick && hasPoints;
  const correct = scored && earned;
  const earnedPts = roundPoints(pts);
  // Any awarded points render green, regardless of which phase scored them.
  const c = {
    row: 'bg-emerald-50 border-l-[3px] border-emerald-400',
    label: 'text-emerald-800',
    score: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    icon: 'text-emerald-500',
  };
  const rowCls = correct ? c.row : 'bg-slate-100';
  const statusBadge = correct
    ? c.badge
    : 'bg-rose-50 text-rose-600 ring-rose-100';
  return (
    <div className={`flex min-h-[44px] items-center justify-between gap-3 rounded-xl px-3.5 ${rowCls}`}>
      <span className={`text-sm font-semibold ${correct ? c.label : 'text-slate-600'}`}>
        {label}
      </span>
      <span className="flex items-center gap-2">
        <span className={`font-mono text-sm font-bold tabular-nums ${correct ? c.score : 'text-slate-500'}`}>
          {pick}
        </span>
        {scored && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${statusBadge}`}>
            {correct ? (
              <CheckCircle2 className={`h-3.5 w-3.5 ${c.icon}`} aria-hidden="true" />
            ) : (
              <XCircle className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
            )}
            {correct ? `+${earnedPts}` : 'Missed'}
          </span>
        )}
      </span>
    </div>
  );
}

function BonusTag({ label, pts }) {
  return (
    <span className="flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
      {label}
      <span className="font-black">+{roundPoints(pts || 0)}</span>
    </span>
  );
}

function FinishedUnusedPicksDisclosure({ expanded, onToggle, title, subtitle, prediction, showEt, showPens }) {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex min-h-[44px] w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-slate-50"
      >
        <span className="min-w-0">
          <span className="block text-xs font-bold text-slate-600">{title}</span>
          <span className="block text-[11px] text-slate-400">{subtitle}</span>
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        )}
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 pb-3 pt-2">
          {showEt && prediction.et_ht_home != null && (
            <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-400 ring-1 ring-slate-100">
              ET HT {scorePair(prediction.et_ht_home, prediction.et_ht_away)}
            </span>
          )}
          {showEt && prediction.et_ft_home != null && (
            <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-400 ring-1 ring-slate-100">
              ET FT {scorePair(prediction.et_ft_home, prediction.et_ft_away)}
            </span>
          )}
          {showPens && prediction.pen_home != null && (
            <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] font-semibold text-slate-400 ring-1 ring-slate-100">
              Pens {scorePair(prediction.pen_home, prediction.pen_away)}
            </span>
          )}
        </div>
      )}
    </div>
  );
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
  const [attempted, setAttempted] = useState(false);
  const [extraPicksOpen, setExtraPicksOpen] = useState(false);
  const [finishedUnusedPicksOpen, setFinishedUnusedPicksOpen] = useState(false);
  const hasPrediction = Boolean(prediction);
  const locked = isPredictionLocked(match);
  const isKnockout = !match.group && Boolean(match.stage);
  const matchTotal = points
    ? roundPoints(
        (points.ht_pts || 0) + (points.ft_pts || 0) + (points.closest_pts || 0) + (points.outcome_pts || 0) +
        (points.et_ht_pts || 0) + (points.et_ft_pts || 0) + (points.et_outcome_pts || 0) + (points.et_closest_pts || 0) +
        (points.pen_exact_pts || 0) + (points.pen_winner_pts || 0) + (points.pen_closest_pts || 0),
      )
    : 0;
  const status = displayStatus(match);
  // Require `locked` (past kickoff) as a second guard so a bad API status value
  // on an upcoming match can never collapse the input form.
  const isLive = locked && status === "LIVE";
  const isFinished = status === "FINISHED";
  const isDelayed = locked && !isLive && !isFinished && (status?.startsWith('STATUS_') || status === 'SUSPENDED' || status === 'ABANDONED');
  const isUpcoming = !locked;
  const locationLabel = formatMatchLocation(match);

  // Dirty check: draft differs from saved prediction?
  // An empty draft object means the usePredictionDrafts effect hasn't seeded it yet
  // (one render behind predictions loading). Treat unseeded drafts as matching the
  // prediction so the button never flashes blue before the seed effect fires.
  const draftSeeded = Object.keys(draft).length > 0;
  const isDirty = !draftSeeded ? false : hasPrediction
    ? !numEq(draft.ht_home, prediction.ht_home) ||
      !numEq(draft.ht_away, prediction.ht_away) ||
      !numEq(draft.ft_home, prediction.ft_home) ||
      !numEq(draft.ft_away, prediction.ft_away) ||
      (isKnockout && (
        !numEq(draft.et_ht_home, prediction.et_ht_home) ||
        !numEq(draft.et_ht_away, prediction.et_ht_away) ||
        !numEq(draft.et_ft_home, prediction.et_ft_home) ||
        !numEq(draft.et_ft_away, prediction.et_ft_away) ||
        !numEq(draft.pen_home, prediction.pen_home) ||
        !numEq(draft.pen_away, prediction.pen_away)
      ))
    : String(draft.ft_home ?? "") !== "" ||
      String(draft.ft_away ?? "") !== "" ||
      String(draft.ht_home ?? "") !== "" ||
      String(draft.ht_away ?? "") !== "";

  const isPristine = hasPrediction && !isDirty;

  const htEarned = (points?.ht_pts || 0) > 0;
  const ftEarned = (points?.ft_pts || 0) > 0;
  const outEarned = (points?.outcome_pts || 0) > 0;
  const clsEarned = roundPoints(points?.closest_pts || 0) > 0;
  const etHtEarned = (points?.et_ht_pts || 0) > 0;
  const etEarned = (points?.et_ft_pts || 0) > 0;
  const etOutEarned = (points?.et_outcome_pts || 0) > 0;
  const etClsEarned = roundPoints(points?.et_closest_pts || 0) > 0;
  const penEarned = (points?.pen_exact_pts || 0) > 0;
  const penWinEarned = (points?.pen_winner_pts || 0) > 0;
  const penClsEarned = roundPoints(points?.pen_closest_pts || 0) > 0;

  // How was the match decided? Used to suppress ET/pen ✗ when those phases never happened.
  const matchWentToEt = isFinished && Boolean(match.aet);
  const matchWentToPens = isFinished && match.score?.homePenalty != null;
  const hasEtPrediction = Boolean(prediction?.et_ht_home != null || prediction?.et_ft_home != null);
  const hasPenPrediction = Boolean(prediction?.pen_home != null);
  // "Not applicable" = user predicted the phase but the match never reached it.
  const notApplicableEt = isFinished && hasPrediction && !matchWentToEt && (hasEtPrediction || hasPenPrediction);
  const notApplicablePens = isFinished && hasPrediction && matchWentToEt && !matchWentToPens && hasPenPrediction;

  // Live prediction status
  const htScored = points?.ht_pts != null;
  const isAtHalfTime = match.phase === 'HALF_TIME' || Number(match.period) === FIFA_PERIODS.REGULAR_HT;
  const livePeriod = Number(match.period);
  const isPreEtInterval  = livePeriod === FIFA_PERIODS.PRE_ET_INTERVAL;
  const isInEtFirstHalf   = livePeriod === FIFA_PERIODS.ET_FIRST_HALF;
  const isInEtHalfTime    = livePeriod === FIFA_PERIODS.ET_HT;
  const isInEtSecondHalf  = livePeriod === FIFA_PERIODS.ET_SECOND_HALF;
  const isInEt   = isInEtFirstHalf || isInEtHalfTime || isInEtSecondHalf;
  const isInPens = livePeriod === FIFA_PERIODS.PENALTIES || (isLive && match.score?.homePenalty != null);
  // ── Robust phase signals ──────────────────────────────────────────────────
  // The live `period` can lag during phase transitions (and historical matches
  // replayed as "live" can report a stale period while the timeline already holds
  // ET/pens). Trust persisted result/points signals too, so the card never falls
  // back to the regular-time view once the match has clearly gone past 90'.
  const etScoredSignal = points?.et_ht_pts != null || points?.et_ft_pts != null;
  const penScoredSignal = points?.pen_exact_pts != null;
  const hasLivePenScore = match.score?.homePenalty != null;
  const etUnderwayOrDone = isInEt || isInPens || Boolean(match.aet) || etScoredSignal || hasLivePenScore;
  const penUnderwayOrDone = isInPens || hasLivePenScore || penScoredSignal;
  // 90' score is locked once we're past regulation in any form.
  const regulationOver = isPreEtInterval || etUnderwayOrDone;
  // 120' score is locked once ET is fully done (pens underway, ET FT scored, or AET flagged).
  const etFtDone = penUnderwayOrDone || Boolean(match.aet) || points?.et_ft_pts != null;
  const showEtRowsInline = isPreEtInterval || etUnderwayOrDone;
  const showPenRowInline = penUnderwayOrDone;
  const homeDisplayName = teamName(match.home);
  const awayDisplayName = teamName(match.away);
  const homeCode = match.home?.abbreviation || homeDisplayName;
  const awayCode = match.away?.abbreviation || awayDisplayName;
  const liveHomeScore = hasMatchScore(match) ? Number(match.score.home) : null;
  const liveAwayScore = hasMatchScore(match) ? Number(match.score.away) : null;
  const liveCurrentScore = scorePair(liveHomeScore, liveAwayScore);
  const predFtHome = hasPrediction ? Number(prediction.ft_home) : null;
  const predFtAway = hasPrediction ? Number(prediction.ft_away) : null;
  const hasFtPick = prediction?.ft_home != null && prediction?.ft_away != null &&
    Number.isFinite(predFtHome) && Number.isFinite(predFtAway);
  const hasHtPick = prediction?.ht_home != null && prediction?.ht_away != null &&
    Number.isFinite(Number(prediction.ht_home)) && Number.isFinite(Number(prediction.ht_away));
  const livePredOutcome    = hasFtPick ? outcomeLabel(predFtHome, predFtAway) : null;
  const liveCurrentOutcome = hasMatchScore(match) ? outcomeLabel(Number(match.score.home), Number(match.score.away)) : null;
  const outcomeOnTrack = isLive && hasFtPick && !regulationOver && livePredOutcome === liveCurrentOutcome;
  const liveHtScoreMatches = hasHtPick && hasMatchScore(match) &&
    Number(prediction.ht_home) === liveHomeScore &&
    Number(prediction.ht_away) === liveAwayScore;
  const liveHtTone = !hasHtPick
    ? 'slate'
    : htScored
      ? (htEarned ? 'green' : 'red')
      : isAtHalfTime
        ? (liveHtScoreMatches ? 'green' : 'amber')
        : liveHtScoreMatches ? 'green' : 'slate';
  const liveHtStatus = !hasHtPick
    ? 'No pick'
    : htScored
      ? (htEarned ? 'Correct' : 'Missed')
      : isAtHalfTime
        ? 'Live now'
        : liveHtScoreMatches ? 'On track' : 'Pending';
  const liveFtScoreFinalized = regulationOver;
  // Once ET/pens are actually underway (or done) the 90-min score is confirmed — evaluate the FT pick now.
  const liveFtConfirmed = etUnderwayOrDone;
  const liveFtExactImpossible = isLive && hasFtPick && hasMatchScore(match) && !liveFtScoreFinalized &&
    (liveHomeScore > predFtHome || liveAwayScore > predFtAway);
  const liveFtExact = liveFtConfirmed && hasFtPick && hasMatchScore(match) &&
    predFtHome === liveHomeScore && predFtAway === liveAwayScore;
  const liveFtTone = !hasFtPick || !hasMatchScore(match)
    ? 'slate'
    : liveFtScoreFinalized
      ? (liveFtConfirmed ? (liveFtExact ? 'green' : 'red') : 'slate')
      : liveFtExactImpossible
        ? 'red'
        : outcomeOnTrack
          ? 'green'
          : 'amber';
  const liveFtStatus = !hasFtPick
    ? 'No pick'
    : liveFtScoreFinalized
      ? (liveFtConfirmed ? (liveFtExact ? 'Correct' : 'Missed') : 'Pending')
      : liveFtExactImpossible
        ? 'Impossible'
        : outcomeOnTrack
          ? 'On track'
          : 'Off track';
  const liveFtNeeds = hasFtPick && hasMatchScore(match) && !liveFtScoreFinalized
    ? formatLiveNeedsText({
        ftExactImpossible: liveFtExactImpossible,
        ftOutcomeOnTrack: outcomeOnTrack,
        predHome: predFtHome,
        predAway: predFtAway,
        currentHome: liveHomeScore,
        currentAway: liveAwayScore,
        homeName: homeDisplayName,
        awayName: awayDisplayName,
      })
    : liveFtConfirmed
      ? (liveFtExact ? 'FT prediction matched!' : `FT confirmed ${liveCurrentScore}`)
      : 'FT scoring will update when confirmed';
  const liveCurrentMargin = hasMatchScore(match) ? liveHomeScore - liveAwayScore : 0;
  const liveStatusHeading = hasMatchScore(match)
    ? formatCurrentLeadLabel(liveCurrentMargin, homeDisplayName, awayDisplayName)
    : 'Live score pending';
  const liveStatusText = !hasFtPick
    ? 'No full-time pick submitted'
    : !hasMatchScore(match)
      ? 'FT status will update when live score is available'
      : liveFtScoreFinalized
        ? (liveFtConfirmed
            ? (liveFtExact
                ? 'your FT pick matched the final score'
                : 'your FT pick did not match the final score')
            : 'FT pick will score when full time is confirmed')
        : liveFtTone === 'red'
          ? 'your FT pick is unreachable'
          : liveFtTone === 'green'
            ? 'your FT pick is on track'
            : 'your FT pick is off track';
  // ── Extra-time full-time pick (mirrors the FT logic, but against ET totals) ──
  // During ET the live score is the cumulative 120-min total, and the user's ET
  // full-time pick is also a cumulative total — so they compare directly.
  const predEtFtHome = hasPrediction ? Number(prediction.et_ft_home) : null;
  const predEtFtAway = hasPrediction ? Number(prediction.et_ft_away) : null;
  const hasEtFtPick = prediction?.et_ft_home != null && prediction?.et_ft_away != null &&
    Number.isFinite(predEtFtHome) && Number.isFinite(predEtFtAway);
  // The 120-min ET score is locked once ET is fully done (pens, AET, or ET FT scored).
  const etFtConfirmed = etFtDone;
  const livePredEtOutcome = hasEtFtPick ? outcomeLabel(predEtFtHome, predEtFtAway) : null;
  const etOutcomeOnTrack = isInEt && hasEtFtPick && livePredEtOutcome === liveCurrentOutcome;
  const etFtExactImpossible = isInEt && hasEtFtPick && hasMatchScore(match) &&
    (liveHomeScore > predEtFtHome || liveAwayScore > predEtFtAway);
  const etFtExact = etFtConfirmed && hasEtFtPick && hasMatchScore(match) &&
    predEtFtHome === liveHomeScore && predEtFtAway === liveAwayScore;
  const etFtTone = !hasEtFtPick || !hasMatchScore(match)
    ? 'slate'
    : etFtConfirmed
      ? (etFtExact ? 'green' : 'red')
      : etFtExactImpossible
        ? 'red'
        : etOutcomeOnTrack
          ? 'green'
          : 'amber';
  const etFtNeeds = !hasEtFtPick || !hasMatchScore(match)
    ? 'ET scoring will update live'
    : etFtConfirmed
      ? (etFtExact ? 'ET prediction matched!' : `ET full time ${liveCurrentScore}`)
      : formatLiveNeedsText({
          ftExactImpossible: etFtExactImpossible,
          ftOutcomeOnTrack: etOutcomeOnTrack,
          predHome: predEtFtHome,
          predAway: predEtFtAway,
          currentHome: liveHomeScore,
          currentAway: liveAwayScore,
          homeName: homeDisplayName,
          awayName: awayDisplayName,
        });
  const etStatusText = !hasEtFtPick
    ? 'No extra-time pick submitted'
    : !hasMatchScore(match)
      ? 'ET status will update when live score is available'
      : etFtConfirmed
        ? (etFtExact
            ? 'your ET pick matched the 120-min score'
            : 'your ET pick did not match the 120-min score')
        : etFtTone === 'red'
          ? 'your ET pick is unreachable'
          : etFtTone === 'green'
            ? 'your ET pick is on track'
            : 'your ET pick is off track';
  // ── Penalty shootout pick (live shootout score lives on match.score.*Penalty) ──
  const predPenHome = hasPrediction ? Number(prediction.pen_home) : null;
  const predPenAway = hasPrediction ? Number(prediction.pen_away) : null;
  const hasPenPick = prediction?.pen_home != null && prediction?.pen_away != null &&
    Number.isFinite(predPenHome) && Number.isFinite(predPenAway);
  const curPenHome = match.score?.homePenalty != null ? Number(match.score.homePenalty) : null;
  const curPenAway = match.score?.awayPenalty != null ? Number(match.score.awayPenalty) : null;
  const hasPenScore = Number.isFinite(curPenHome) && Number.isFinite(curPenAway);
  const penCurrentScore = scorePair(curPenHome, curPenAway);
  const penScored = points?.pen_exact_pts != null;
  const predPenWinner = hasPenPick ? Math.sign(predPenHome - predPenAway) : null;
  const penLeaderNow = hasPenScore ? Math.sign(curPenHome - curPenAway) : null;
  const penExact = hasPenPick && hasPenScore && curPenHome === predPenHome && curPenAway === predPenAway;
  const penExactImpossible = hasPenPick && hasPenScore && (curPenHome > predPenHome || curPenAway > predPenAway);
  const penWinnerOnTrack = hasPenPick && hasPenScore && penLeaderNow !== 0 && penLeaderNow === predPenWinner;
  const penTone = !hasPenPick || !hasPenScore
    ? 'slate'
    : penExact || penWinnerOnTrack
      ? 'green'
      : 'amber';
  const penNeeds = !hasPenPick
    ? 'No penalty pick submitted'
    : !hasPenScore
      ? 'Shootout starting…'
      : penExact
        ? 'Penalty prediction matched!'
        : penExactImpossible
          ? (predPenWinner > 0
              ? `${homeDisplayName} to win the shootout`
              : predPenWinner < 0
                ? `${awayDisplayName} to win the shootout`
                : 'Shootout to finish level')
          : (() => {
              const needs = [
                predPenHome > curPenHome ? `${homeCode} +${predPenHome - curPenHome}` : null,
                predPenAway > curPenAway ? `${awayCode} +${predPenAway - curPenAway}` : null,
              ].filter(Boolean);
              return needs.length > 0 ? `${needs.join(', ')} for exact` : 'Hold this shootout score';
            })();
  const penStatusHeading = !hasPenScore
    ? 'Shootout pending'
    : penLeaderNow > 0
      ? `${homeDisplayName} lead shootout`
      : penLeaderNow < 0
        ? `${awayDisplayName} lead shootout`
        : 'Shootout level';
  const penStatusText = !hasPenPick
    ? 'No penalty pick submitted'
    : !hasPenScore
      ? 'shootout score will update live'
      : penExact
        ? 'your penalty pick matches the live shootout'
        : penWinnerOnTrack
          ? 'your penalty winner is on track'
          : penExactImpossible
            ? 'exact shootout score no longer possible'
            : 'penalty shootout in progress';
  // Show the extra-time pick whenever ET is underway/done, and stack the penalty pick
  // beneath it during the shootout so the user can see both at once.
  const showPenDetailCard = penUnderwayOrDone && hasPenPick;
  const showEtDetailCard = etUnderwayOrDone && hasEtFtPick;
  // Live badge for the pens chip — shows the running shootout score until it's scored.
  const penLiveBadge = penUnderwayOrDone && hasPenPick && hasPenScore && !penScored
    ? { tone: penTone === 'green' ? 'green' : 'amber', text: penCurrentScore }
    : null;

  const hasAnyExtraPick = Boolean(prediction?.et_ht_home != null || prediction?.et_ft_home != null || prediction?.pen_home != null);
  const liveMinuteValue = parseLiveMinuteValue(match.minute);
  const shouldAutoShowExtraPicks = isKnockout && hasAnyExtraPick && !isPreEtInterval && !isInEt && !isInPens &&
    hasMatchScore(match) && liveHomeScore === liveAwayScore && liveMinuteValue != null && liveMinuteValue >= 75;
  const extraPicksExpanded = extraPicksOpen || showEtRowsInline || showPenRowInline || shouldAutoShowExtraPicks;
  const extraPicksSubtitle = isPreEtInterval
    ? 'Extra time next'
    : showEtRowsInline || showPenRowInline
    ? 'Live now'
    : shouldAutoShowExtraPicks
      ? 'Match level late - showing ET picks'
      : 'Pending if match reaches extra time';

  // Draft values for validation
  const draftHtHome = draft.ht_home === '' || draft.ht_home == null ? null : Number(draft.ht_home);
  const draftHtAway = draft.ht_away === '' || draft.ht_away == null ? null : Number(draft.ht_away);
  const draftFtHome = draft.ft_home === '' || draft.ft_home == null ? null : Number(draft.ft_home);
  const draftFtAway = draft.ft_away === '' || draft.ft_away == null ? null : Number(draft.ft_away);
  const draftEtHtHome = draft.et_ht_home === '' || draft.et_ht_home == null ? null : Number(draft.et_ht_home);
  const draftEtHtAway = draft.et_ht_away === '' || draft.et_ht_away == null ? null : Number(draft.et_ht_away);
  const draftEtFtHome = draft.et_ft_home === '' || draft.et_ft_home == null ? null : Number(draft.et_ft_home);
  const draftEtFtAway = draft.et_ft_away === '' || draft.et_ft_away == null ? null : Number(draft.et_ft_away);
  const draftPenHome = draft.pen_home === '' || draft.pen_home == null ? null : Number(draft.pen_home);
  const draftPenAway = draft.pen_away === '' || draft.pen_away == null ? null : Number(draft.pen_away);
  // ET and penalty inputs always visible for knockout matches — scoring engine decides
  // whether to use them based on the actual result (ignored if FT is not a draw).
  const showEtInputs = isKnockout;
  const showPenInputs = isKnockout;

  // HT cannot exceed FT
  const htFtErrors = [];
  if (draftHtHome !== null && draftFtHome !== null && draftHtHome > draftFtHome)
    htFtErrors.push(`Half time home (${draftHtHome}) can't be more than full time (${draftFtHome})`);
  if (draftHtAway !== null && draftFtAway !== null && draftHtAway > draftFtAway)
    htFtErrors.push(`Half time away (${draftHtAway}) can't be more than full time (${draftFtAway})`);

  const penErrors = [];
  if (showPenInputs && draftPenHome !== null && draftPenAway !== null && draftPenHome === draftPenAway)
    penErrors.push('Penalty shootout can\'t end in a draw — one team must win');
  const hasErrors = htFtErrors.length > 0 || penErrors.length > 0;
  const canSave = draftFtHome !== null && draftFtAway !== null;
  const handle = (field) => (v) => { setAttempted(false); updateDraft(match.id, field, v); };
  const showMatchDetailsButton = canShowMatchDetails(match) ||
    (match?.home?.abbreviation !== "TBD" && match?.away?.abbreviation !== "TBD");
  const matchDetailsButton = showMatchDetailsButton ? (
    <button
      type="button"
      onClick={() => onViewStats(match)}
      className="flex min-h-[36px] w-full items-center justify-center gap-1.5 border-t border-slate-100 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
    >
      {canShowMatchDetails(match) ? (
        <Activity className="h-3 w-3" aria-hidden="true" />
      ) : (
        <Users className="h-3 w-3" aria-hidden="true" />
      )}
      {canShowMatchDetails(match) ? "View match stats" : "View lineups"}
      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  ) : null;

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white ${
        isLive
          ? "border-slate-200 shadow-sm ring-1 ring-rose-50"
          : "border-slate-200"
      }`}
    >
      {/* ── Header bar ── */}
      <div
        className={`border-b px-3 py-2.5 sm:px-4 ${
          isLive
            ? "border-slate-100 bg-white"
            : "border-slate-100 bg-slate-50/60"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <span className="flex shrink-0 items-center gap-1.5 font-medium text-slate-600">
              <CalendarDays className="h-3 w-3 text-slate-400" aria-hidden="true" />
              {formatDate(match.date)} · {formatTime(match.date)} <span className="text-slate-400">{tzAbbr(match.date)}</span>
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
                  : isDelayed
                    ? "bg-amber-100 text-amber-700"
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
        {locationLabel && (
          <div
            className="mt-1.5 flex min-w-0 items-start gap-1.5 text-xs font-normal leading-snug text-slate-500"
            title={locationLabel}
          >
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="min-w-0 break-words">{locationLabel}</span>
          </div>
        )}
      </div>

      {/* ── Teams + score ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3.5">
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
              {match.score?.homePenalty != null && (
                <p className="mt-1 whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Pens {match.score.homePenalty}&ndash;{match.score.awayPenalty}
                </p>
              )}
              {!isLive && !isFinished ? (
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">
                  {scoreStatusLabel(match)}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-xl font-black uppercase leading-none text-slate-300 sm:text-2xl">
                vs
              </p>
              {(() => {
                const cd = !hasPrediction ? formatCountdown(match.date) : null;
                if (cd) {
                  const chip = {
                    red:   'bg-red-100 text-red-700',
                    amber: 'bg-amber-100 text-amber-700',
                    slate: 'bg-slate-100 text-slate-500',
                  };
                  return (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${chip[cd.level]}`}>
                      <Clock className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                      {formatTime(match.date)} · {cd.label}
                    </span>
                  );
                }
                return (
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                    {formatTime(match.date)}
                  </p>
                );
              })()}
            </div>
          )}
        </div>

        <TeamBlock team={match.away} align="right" />
      </div>

      {/* ── Stats / Lineups — directly below the scoreline ── */}
      {matchDetailsButton}

      {/* ── UPCOMING: input form with smart button ── */}
      {isUpcoming && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
          <div className="mx-auto flex w-full flex-col items-center gap-2.5 sm:max-w-sm">
            <div className="flex w-full items-end justify-between gap-3">
              <ScoreInputGroup
                label="Half time"
                homeValue={draft.ht_home ?? ""}
                awayValue={draft.ht_away ?? ""}
                onHome={handle("ht_home")}
                onAway={handle("ht_away")}
                disabled={locked}
              />
              <ScoreInputGroup
                label="Full time"
                homeValue={draft.ft_home ?? ""}
                awayValue={draft.ft_away ?? ""}
                onHome={handle("ft_home")}
                onAway={handle("ft_away")}
                disabled={locked}
              />
            </div>
            {attempted && htFtErrors.length > 0 && (
              <div className="w-full space-y-1">
                {htFtErrors.map((e, i) => (
                  <p key={i} className="flex items-start gap-1.5 text-[11px] font-medium text-red-600">
                    <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                    {e}
                  </p>
                ))}
              </div>
            )}
            {showEtInputs && (
              <div className="w-full border-t border-slate-200 pt-2">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Extra time</p>
                <p className="mb-2 text-[10px] text-slate-400">Predict in case the match reaches this stage</p>
                <div className="flex w-full items-end justify-between gap-3">
                  <ScoreInputGroup
                    label="ET half time"
                    homeValue={draft.et_ht_home ?? ""}
                    awayValue={draft.et_ht_away ?? ""}
                    onHome={handle("et_ht_home")}
                    onAway={handle("et_ht_away")}
                    disabled={locked}
                  />
                  <ScoreInputGroup
                    label="ET full time"
                    homeValue={draft.et_ft_home ?? ""}
                    awayValue={draft.et_ft_away ?? ""}
                    onHome={handle("et_ft_home")}
                    onAway={handle("et_ft_away")}
                    disabled={locked}
                  />
                </div>
              </div>
            )}
            {showPenInputs && (
              <div className="w-full border-t border-slate-200 pt-2">
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Penalties</p>
                <p className="mb-2 text-[10px] text-slate-400">Predict in case the match reaches this stage</p>
                <div className="flex w-full items-end justify-center gap-3">
                  <ScoreInputGroup
                    label="Penalty score"
                    homeValue={draft.pen_home ?? ""}
                    awayValue={draft.pen_away ?? ""}
                    onHome={handle("pen_home")}
                    onAway={handle("pen_away")}
                    disabled={locked}
                  />
                </div>
                {attempted && penErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {penErrors.map((e, i) => (
                      <p key={i} className="flex items-start gap-1.5 text-[11px] font-medium text-red-600">
                        <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
                        {e}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              className={`btn h-[38px] w-full ${
                saving
                  ? "btn-primary"
                  : isPristine || !canSave
                    ? "border border-slate-200 bg-white text-slate-400"
                    : "btn-primary"
              }`}
              onClick={() => { setAttempted(true); if (!hasErrors) savePrediction(match); }}
              disabled={saving || isPristine || !canSave}
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

      {/* ── LIVE: compact status card ── */}
      {isLive && hasPrediction && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 sm:px-5 sm:py-3">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Your prediction
            </p>
            <span className={`rounded-full px-3 py-1 text-sm font-black tabular-nums ${
              matchTotal > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {matchTotal > 0 ? `${matchTotal} pts` : '0 pts'}
            </span>
          </div>

          <div className="space-y-1.5">
            <LivePredictionRow
              label="HT"
              pick={hasHtPick ? scorePair(prediction.ht_home, prediction.ht_away) : "\u2014"}
              tone={liveHtTone}
              status={liveHtStatus}
              points={htEarned ? points?.ht_pts : null}
            />
            <LivePredictionRow
              label="FT"
              pick={hasFtPick ? scorePair(prediction.ft_home, prediction.ft_away) : "\u2014"}
              tone={liveFtTone}
              status={liveFtStatus}
            />
          </div>

          {showEtDetailCard && (
            <LiveFtDetailCard
              heading="Extra-time pick"
              tone={etFtTone}
              homeCode={homeCode}
              awayCode={awayCode}
              pick={scorePair(prediction.et_ft_home, prediction.et_ft_away)}
              current={liveCurrentScore}
              needs={etFtNeeds}
              statusHeading={liveStatusHeading}
              statusText={etStatusText}
            />
          )}
          {showPenDetailCard && (
            <LiveFtDetailCard
              heading="Penalty pick"
              tone={penTone}
              homeCode={homeCode}
              awayCode={awayCode}
              pick={scorePair(prediction.pen_home, prediction.pen_away)}
              current={penCurrentScore}
              needs={penNeeds}
              statusHeading={penStatusHeading}
              statusText={penStatusText}
            />
          )}
          {!showEtDetailCard && !showPenDetailCard && (
            <LiveFtDetailCard
              tone={liveFtTone}
              homeCode={homeCode}
              awayCode={awayCode}
              pick={hasFtPick ? scorePair(prediction.ft_home, prediction.ft_away) : "\u2014"}
              current={liveCurrentScore}
              needs={liveFtNeeds}
              statusHeading={liveStatusHeading}
              statusText={liveStatusText}
            />
          )}

          {hasAnyExtraPick && (
            <ExtraPicksDisclosure
              expanded={extraPicksExpanded}
              onToggle={() => setExtraPicksOpen((open) => !open)}
              subtitle={extraPicksSubtitle}
              prediction={prediction}
              points={points}
              active={showEtRowsInline || showPenRowInline}
              penLiveBadge={penLiveBadge}
            />
          )}
        </div>
      )}

      {/* ── DELAYED / SUSPENDED: notice + locked prediction ── */}
      {isDelayed && (
        <div className="border-t border-amber-100 bg-amber-50/50 px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-800">Match delayed</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                This match has been suspended and will resume when conditions allow. Your prediction is safely locked in — points will be awarded automatically once the full result is confirmed. No action needed.
              </p>
            </div>
          </div>
          {hasPrediction && (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Your prediction
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="font-mono text-sm font-bold tabular-nums text-slate-500">
                  HT{" "}
                  {prediction.ht_home != null
                    ? `${prediction.ht_home}–${prediction.ht_away}`
                    : "—"}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums text-slate-500">
                  FT {prediction.ft_home}–{prediction.ft_away}
                </span>
              </div>
            </div>
          )}
          {!hasPrediction && (
            <p className="text-[11px] text-slate-400">You didn't submit a prediction for this match.</p>
          )}
        </div>
      )}

      {/* ── FINISHED: compact post-match summary ── */}
      {isFinished && hasPrediction && (
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4 sm:px-5">

          {/* Row 1: "YOUR PREDICTION" label (left) + pts pill (right) */}
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Your prediction
            </p>
            {points && (
              <span
                className={`rounded-full px-3 py-1 text-sm font-black tabular-nums ${
                  matchTotal > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {matchTotal > 0 ? matchTotal : '0'} pts
              </span>
            )}
          </div>

          {/* Row 2: bonus tags (outcome + any earned bonuses), each with its point value */}
          {points && (outEarned || clsEarned || etOutEarned || etClsEarned || penWinEarned || penClsEarned) && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {outEarned && (
                <BonusTag
                  label={outcomeChipLabel(outcomeLabel(prediction.ft_home, prediction.ft_away), homeDisplayName, awayDisplayName)}
                  pts={points.outcome_pts}
                />
              )}
              {clsEarned && <BonusTag label="Closest score" pts={points.closest_pts} />}
              {etOutEarned && <BonusTag label="ET outcome" pts={points.et_outcome_pts} />}
              {etClsEarned && <BonusTag label="ET Closest" pts={points.et_closest_pts} />}
              {penWinEarned && <BonusTag label="Pen winner" pts={points.pen_winner_pts} />}
              {penClsEarned && <BonusTag label="Pen Closest" pts={points.pen_closest_pts} />}
            </div>
          )}

          {/* Phase rows — only phases that actually happened, full-width pill style */}
          <div className="space-y-2">
            <FinishedPhaseRow
              label="Half time"
              pick={prediction.ht_home != null ? `${prediction.ht_home}–${prediction.ht_away}` : '—'}
              earned={htEarned}
              hasPoints={points?.ht_pts != null}
              pts={points?.ht_pts}
            />
            <FinishedPhaseRow
              label="Full time"
              pick={`${prediction.ft_home}–${prediction.ft_away}`}
              earned={ftEarned}
              hasPoints={points?.ft_pts != null}
              pts={points?.ft_pts}
            />
            {matchWentToEt && prediction.et_ht_home != null && (
              <FinishedPhaseRow
                label="ET half time"
                pick={`${prediction.et_ht_home}–${prediction.et_ht_away}`}
                earned={etHtEarned}
                hasPoints={points?.et_ht_pts != null}
                pts={points?.et_ht_pts}
              />
            )}
            {matchWentToEt && prediction.et_ft_home != null && (
              <FinishedPhaseRow
                label="ET full time"
                pick={`${prediction.et_ft_home}–${prediction.et_ft_away}`}
                earned={etEarned}
                hasPoints={points?.et_ft_pts != null}
                pts={points?.et_ft_pts}
              />
            )}
            {matchWentToPens && prediction.pen_home != null && (
              <FinishedPhaseRow
                label="Penalties"
                pick={`${prediction.pen_home}–${prediction.pen_away}`}
                earned={penEarned}
                hasPoints={points?.pen_exact_pts != null}
                pts={points?.pen_exact_pts}
              />
            )}
          </div>

          {/* Not-reached block: phases predicted that never happened — no ✓/✗, just greyed chips */}
          {(notApplicableEt || notApplicablePens) && (
            <FinishedUnusedPicksDisclosure
              expanded={finishedUnusedPicksOpen}
              onToggle={() => setFinishedUnusedPicksOpen((open) => !open)}
              title={notApplicableEt ? "Extra time & penalties not needed" : "Penalties not needed"}
              subtitle={notApplicableEt ? "Decided in 90'" : "Decided in extra time"}
              prediction={prediction}
              showEt={notApplicableEt}
              showPens={notApplicableEt || notApplicablePens}
            />
          )}
        </div>
      )}

      {/* ── View all predictions ── */}
      {onViewPredictions && (
        <button
          type="button"
          onClick={() => onViewPredictions(match)}
          className="flex min-h-[36px] w-full items-center justify-center gap-1.5 border-t border-slate-100 text-[11px] font-semibold text-blue-500 transition hover:bg-slate-50 hover:text-blue-700"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          View all predictions
        </button>
      )}
    </article>
  );
}
