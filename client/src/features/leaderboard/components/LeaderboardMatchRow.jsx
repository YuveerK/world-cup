import { useState } from 'react';
import { Activity, Check, ChevronDown } from 'lucide-react';
import { roundPoints } from '@/lib/utils/number';
import { canShowMatchDetails, displayStatus, hasMatchScore, scoreText } from '@/features/matches/utils/matchStatus';
import { matchTitle, teamName } from '@/features/matches/utils/matchFormatters';
import { MATCH_POINT_PILL_CONFIG } from '../constants';
import { emptyScore, formatScorePair } from '../utils/leaderboardScores';

export function LeaderboardMatchRow({ entry, match, onViewStats }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openKey, setOpenKey] = useState(0);

  const total = roundPoints(entry.match_total);
  const status = displayStatus(match || {}) || (entry.scored ? 'FINISHED' : 'UPCOMING');
  const live = status === 'LIVE';
  const prediction = entry.prediction;

  const htPick = formatScorePair(prediction?.ht_home, prediction?.ht_away);
  const ftPick = formatScorePair(prediction?.ft_home, prediction?.ft_away);
  const htResult = formatScorePair(entry.result?.ht_home, entry.result?.ht_away);
  const ftResult =
    entry.result?.ft_home != null
      ? formatScorePair(entry.result.ft_home, entry.result.ft_away)
      : hasMatchScore(match)
        ? scoreText(match)
        : emptyScore();

  const pointPills = MATCH_POINT_PILL_CONFIG
    .map((config) => ({ ...config, points: entry[config.pointsKey] }))
    .filter(({ points }) => roundPoints(points || 0) > 0);

  const htPts = roundPoints(entry.ht_pts);
  const ftPts = roundPoints(entry.ft_pts);
  const closestPts = roundPoints(entry.closest_pts);
  const outcomePts = roundPoints(entry.outcome_pts);

  const toggle = () => {
    if (!isOpen) setOpenKey((k) => k + 1);
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        className="w-full cursor-pointer px-4 pb-3 pt-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
        onClick={toggle}
        aria-expanded={isOpen}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex flex-col items-center gap-2">
            <MatchFlag team={match?.home} />
            <p className="line-clamp-2 text-center text-xs font-bold leading-tight text-slate-900">
              {teamName(match?.home) || matchTitle(match, entry.match_id)}
            </p>
          </div>

          <div className="shrink-0 px-4 text-center">
            {hasMatchScore(match) ? (
              <p className="whitespace-nowrap text-3xl font-black tabular-nums leading-none text-slate-950">
                {scoreText(match)}
              </p>
            ) : (
              <p className="whitespace-nowrap text-xl font-black uppercase leading-none text-slate-400">VS</p>
            )}

            {live ? (
              <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                Live
              </span>
            ) : (
              <p
                className={`mt-2 text-[10px] font-bold uppercase tracking-wide ${
                  status === 'FINISHED' ? 'text-blue-600' : 'text-amber-600'
                }`}
              >
                {status}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2">
            <MatchFlag team={match?.away} />
            <p className="line-clamp-2 text-center text-xs font-bold leading-tight text-slate-900">
              {teamName(match?.away) || ''}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5">
            {pointPills.map(({ label, points, className }) => (
              <span key={label} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${className}`}>
                {label} +{roundPoints(points)}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={`rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${
                total > 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {total} pts
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </div>
        </div>
      </button>

      {/* Smooth expand/collapse via grid-template-rows */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-100">
            <div className="px-4 pb-4 pt-3" key={openKey}>
              <MatchBreakdownTable
                htPick={htPick}
                ftPick={ftPick}
                htResult={htResult}
                ftResult={ftResult}
                htPts={htPts}
                ftPts={ftPts}
                closestPts={closestPts}
                outcomePts={outcomePts}
              />
            </div>

            {match && canShowMatchDetails(match) && (
              <div
                className="animate-fade-slide-in border-t border-slate-100 px-4 pb-4"
                style={{ animationDelay: '260ms' }}
              >
                <button className="btn btn-secondary w-full justify-center" onClick={() => onViewStats(match)}>
                  <Activity className="h-4 w-4" aria-hidden="true" />
                  Match details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchBreakdownTable({ htPick, ftPick, htResult, ftResult, htPts, ftPts, closestPts, outcomePts }) {
  return (
    <div>
      <div
        className="mb-2 grid animate-fade-slide-in grid-cols-[5rem_1fr_1fr_4.5rem] items-center px-2"
        style={{ animationDelay: '30ms' }}
      >
        <span />
        <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Pick</span>
        <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Result</span>
        <span />
      </div>

      <div className="space-y-1">
        <BreakdownRow label="Half Time" pick={htPick} result={htResult} pts={htPts} delay={80} />
        <BreakdownRow label="Full Time" pick={ftPick} result={ftResult} pts={ftPts} delay={140} />
      </div>

      <div className="mt-3 space-y-0.5 border-t border-slate-100 pt-2.5">
        <BonusRow label="Closest Score" sub="6 pts shared" pts={closestPts} earnedClass="text-violet-600" delay={200} />
        <BonusRow label="Win / Draw" sub="4 pts" pts={outcomePts} earnedClass="text-emerald-600" delay={240} />
      </div>
    </div>
  );
}

function BreakdownRow({ label, pick, result, pts, delay }) {
  const earned = pts > 0;
  return (
    <div
      className="grid animate-fade-slide-in grid-cols-[5rem_1fr_1fr_4.5rem] items-center gap-x-2 rounded-lg bg-slate-50 px-2 py-2.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <span className="text-center text-sm font-black tabular-nums text-slate-600">{pick}</span>
      <div className="flex items-center justify-center gap-1">
        <span className={`text-sm font-black tabular-nums ${earned ? 'text-emerald-600' : 'text-slate-400'}`}>
          {result}
        </span>
        {earned && (
          <Check
            className="h-3 w-3 shrink-0 animate-pop-in text-emerald-500"
            style={{ animationDelay: `${delay + 80}ms` }}
            aria-hidden="true"
          />
        )}
      </div>
      <span className={`text-right text-[11px] font-bold tabular-nums ${earned ? 'text-blue-600' : 'text-slate-300'}`}>
        +{pts} pts
      </span>
    </div>
  );
}

function BonusRow({ label, sub, pts, earnedClass, delay }) {
  const earned = pts > 0;
  return (
    <div
      className="flex animate-fade-slide-in items-center justify-between px-2 py-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className="text-[10px] text-slate-300">·</span>
        <span className="text-[10px] text-slate-400">{sub}</span>
      </div>
      <span className={`text-xs font-bold tabular-nums ${earned ? earnedClass : 'text-slate-300'}`}>
        +{pts} pts
      </span>
    </div>
  );
}

function MatchFlag({ team }) {
  if (!team?.flagUrl) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold text-slate-400">
        {team?.abbreviation || '--'}
      </span>
    );
  }

  return (
    <img
      src={team.flagUrl}
      alt=""
      loading="lazy"
      className="h-12 w-12 shrink-0 rounded-xl border border-slate-100 object-cover shadow-sm"
    />
  );
}
