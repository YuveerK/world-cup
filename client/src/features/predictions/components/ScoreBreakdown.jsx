import { Check, X } from 'lucide-react';
import { roundPoints } from '@/lib/utils/number';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { buildPointsBreakdown, getResultTimeline } from '../utils/pointsBreakdown';
import { getPredictionRowTotal } from '../utils/predictionRows';

// Shared display atoms for scored predictions, used by the match cards and the
// all-predictions sheet so both surfaces speak the same visual language.

export function ScoreToken({ label, score, scored, pts, live }) {
  const earned = scored && pts > 0;
  const missed = scored && pts <= 0;
  const tone = earned
    ? 'earned'
    : live?.tone === 'correct'
      ? 'ontrack'
      : live?.tone === 'possible'
        ? 'possible'
        : 'idle';

  const toneClass = {
    earned: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    ontrack: 'bg-emerald-50/70 text-emerald-700 ring-emerald-100',
    possible: 'bg-amber-50/70 text-amber-700 ring-amber-100',
    idle: 'bg-slate-50 text-slate-500 ring-slate-200/70',
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold ring-1 ${toneClass} ${missed ? 'opacity-70' : ''}`}
    >
      <span className={`text-[8px] font-extrabold uppercase tracking-wide ${earned ? 'text-emerald-500' : 'text-slate-400'}`}>
        {label}
      </span>
      <span className="font-mono tabular-nums">{score}</span>
      {earned && <span className="font-black text-emerald-600">+{roundPoints(pts)}</span>}
      {missed && <X className="h-3 w-3 text-slate-300" aria-hidden="true" />}
      {!scored && live?.tone === 'correct' && <LiveDot className="bg-emerald-400" />}
      {!scored && live?.tone === 'possible' && <LiveDot className="bg-amber-400" />}
    </span>
  );
}

function LiveDot({ className }) {
  return <span className={`h-1.5 w-1.5 rounded-full ${className}`} aria-hidden="true" />;
}

// Points ledger — per-rule breakdown for a scored prediction row.
// Default shows every rule (hits, misses, no-picks) plus the phase timeline and a
// total; compact shows the earned lines stacked with details underneath and a
// one-line summary of the misses (the host surface owns the total).

export function PointsLedger({ row, match, actualResult, compact = false }) {
  const lines = buildPointsBreakdown(row, actualResult, {
    homeName: teamName(match?.home),
    awayName: teamName(match?.away),
  });
  if (!lines.length) return null;

  const total = getPredictionRowTotal(row);
  const visible = compact ? lines.filter((line) => line.state === 'earned') : lines;
  const missedLabels = compact
    ? lines.filter((line) => line.state === 'missed').map((line) => line.shortLabel)
    : [];
  const timeline = compact ? [] : getResultTimeline(actualResult);

  return (
    <div className={compact ? '' : 'rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm'}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">How this scored</p>
        {timeline.length > 0 && (
          <p className="text-[10px] font-semibold text-slate-500">
            {timeline.map((segment) => `${segment.label} ${segment.score}`).join(' · ')}
          </p>
        )}
      </div>

      {visible.length > 0 && (
        <div className="mt-1.5 divide-y divide-slate-100">
          {visible.map((line) => (
            <LedgerLine key={line.id} line={line} stacked={compact} />
          ))}
        </div>
      )}

      {compact && missedLabels.length > 0 && (
        <p className="mt-1.5 flex items-start gap-1.5 border-t border-slate-100 pt-1.5 text-[10px] font-medium text-slate-400">
          <X className="mt-px h-3 w-3 shrink-0 text-slate-300" aria-hidden="true" />
          <span>
            <span className="font-bold">{missedLabels.length} missed</span> · {missedLabels.join(' · ')}
          </span>
        </p>
      )}

      {!compact && (
        <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total</span>
          <span className={`text-xs font-black tabular-nums ${total > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
            {total > 0 ? `+${total}` : '0'}
          </span>
        </div>
      )}
    </div>
  );
}

function LedgerLine({ line, stacked = false }) {
  const earned = line.state === 'earned';
  const noPick = line.state === 'nopick';
  const icon = earned ? (
    <Check className="h-3 w-3 shrink-0 text-emerald-500" aria-hidden="true" />
  ) : (
    <X className={`h-3 w-3 shrink-0 ${noPick ? 'text-slate-200' : 'text-slate-300'}`} aria-hidden="true" />
  );
  const labelClass = `text-[11px] font-semibold ${earned ? 'text-slate-800' : noPick ? 'text-slate-300' : 'text-slate-400'}`;
  const detailClass = `text-[10px] font-medium ${earned ? 'text-slate-500' : 'text-slate-300'}`;
  const ptsClass = `shrink-0 text-[11px] font-black tabular-nums ${earned ? 'text-emerald-600' : 'text-slate-300'}`;
  const pts = earned ? `+${roundPoints(line.pts)}` : '0';

  if (stacked) {
    return (
      <div className="py-1">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5">
            {icon}
            <span className={`truncate ${labelClass}`}>{line.label}</span>
          </span>
          <span className={ptsClass}>{pts}</span>
        </div>
        {line.detail && <p className={`ml-[18px] mt-0.5 ${detailClass}`}>{line.detail}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex min-w-0 items-center gap-1.5">
        {icon}
        <span className={`shrink-0 ${labelClass}`}>{line.label}</span>
        {line.detail && <span className={`truncate ${detailClass}`}>{line.detail}</span>}
      </div>
      <span className={ptsClass}>{pts}</span>
    </div>
  );
}
