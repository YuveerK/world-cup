import { Crown, Star, TrendingUp } from 'lucide-react';
import { Flag } from '@/features/matches/components/Flag';
import { PointBadge } from '@/components/ui/PointBadge';
import { formatDate, formatTime } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';
import { displayStatus } from '@/features/matches/utils/matchStatus';
import { teamName, matchTitle } from '@/features/matches/utils/matchFormatters';
import { predictionText, resultText, predictionOutcome, resultOutcome, scoreDistance } from '@/features/predictions/utils/predictionDisplay';
import {
  halfTimeDetail,
  fullTimeDetail,
  closestDetail,
  outcomeDetail,
  summaryScoreText,
  summaryHalfTimeScoreText,
  summaryVerdict,
} from '../utils/summaryFormatters';

export function PlayerShareCard({ player, entry, match, currentUser }) {
  const matchTotal = roundPoints(entry.match_total);
  const maxMatchPoints = 25;
  const performanceWidth = `${Math.min(100, Math.max(0, (matchTotal / maxMatchPoints) * 100))}%`;
  const prediction = entry.prediction;
  const scoreLine = summaryScoreText(entry, match);
  const halfTimeLine = summaryHalfTimeScoreText(entry);
  const isCurrentUser = player.username === currentUser?.username;
  const predictedOutcome = predictionOutcome(prediction);
  const actualOutcome = resultOutcome(entry, match);
  const distance = scoreDistance(entry);
  const ruleRows = [
    { label: 'Half-time exact', max: 5, points: entry.ht_pts, detail: halfTimeDetail(entry) },
    { label: 'Full-time exact', max: 10, points: entry.ft_pts, detail: fullTimeDetail(entry) },
    { label: 'Closest score', max: 6, points: entry.closest_pts, detail: closestDetail(entry, distance) },
    { label: 'Win / Draw', max: 4, points: entry.outcome_pts, detail: outcomeDetail(entry, predictedOutcome, actualOutcome) },
  ];

  return (
    <article className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.10)]">
      <header className="border-b border-slate-200 bg-white px-5 py-6 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">World Cup Prediction League</span>
              {isCurrentUser && <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">You</span>}
              <span className="rounded-md bg-gradient-to-r from-amber-400 to-yellow-400 px-2 py-1 text-xs font-black text-blue-950">{summaryVerdict(entry)}</span>
            </div>
            <h3 className="truncate text-4xl font-black text-slate-950 sm:text-5xl">{player.username}</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {matchTitle(match, entry.match_id)} · {match?.date ? `${formatDate(match.date)} ${formatTime(match.date)}` : 'Date TBC'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[390px]">
            <SummaryHeroMetric icon={Crown} label="Rank" value={`#${player.rank}`} />
            <SummaryHeroMetric icon={TrendingUp} label="Match" value={`${matchTotal}`} suffix="pts" />
            <SummaryHeroMetric icon={Star} label="Total" value={`${roundPoints(player.total)}`} suffix="pts" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <SummaryTeam team={match?.home} />
          <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-amber-50 px-6 py-4 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">{displayStatus(match || {}) || 'Pending'}</p>
            <p className="mt-1 text-4xl font-black text-blue-950">{scoreLine}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">{halfTimeLine}</p>
          </div>
          <SummaryTeam team={match?.away} align="right" />
        </div>
      </header>

      <section className="px-5 py-6 sm:px-7">
        <div className="grid gap-3 md:grid-cols-4">
          <SummaryInfoTile label="Prediction" value={predictionText(prediction)} />
          <SummaryInfoTile label="Result" value={resultText(entry, match)} />
          <SummaryInfoTile label="Winner Pick" value={player.winner || 'Not set'} />
          <SummaryInfoTile label="Scored Predictions" value={`${player.match_points?.filter((row) => row.scored).length || 0}`} />
        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Match performance</p>
              <p className="text-lg font-bold text-slate-950">{matchTotal} <span className="text-sm font-semibold text-slate-500">of {maxMatchPoints} pts</span></p>
            </div>
            <p className="text-sm font-semibold text-blue-600">
              {roundPoints(entry.ht_pts)} + {roundPoints(entry.ft_pts)} + {roundPoints(entry.closest_pts)} + {roundPoints(entry.outcome_pts)}
            </p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 shadow-sm" style={{ width: performanceWidth }} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {ruleRows.map((rule) => (
            <SummaryRuleCard key={rule.label} {...rule} />
          ))}
        </div>

        <div className="mt-5 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-5">
          <PointBadge label="HT" points={player.ht_pts} />
          <PointBadge label="FT" points={player.ft_pts} />
          <PointBadge label="Closest" points={player.closest_pts} />
          <PointBadge label="Outcome" points={player.outcome_pts} />
          <PointBadge label="Winner" points={player.winner_pts} />
        </div>
      </section>
    </article>
  );
}

function SummaryHeroMetric({ icon: Icon, label, value, suffix }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
        {label}
      </div>
      <p className="text-2xl font-black text-slate-950">
        {value}
        {suffix && <span className="ml-1 text-sm font-semibold text-slate-400">{suffix}</span>}
      </p>
    </div>
  );
}

function SummaryTeam({ team, align }) {
  return (
    <div className={`flex items-center gap-3 ${align === 'right' ? 'md:flex-row-reverse md:text-right' : ''}`}>
      <div className="shrink-0 overflow-hidden rounded-lg ring-2 ring-slate-200">
        <Flag team={team} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-base font-black text-slate-950 sm:text-lg">{teamName(team)}</p>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{team?.abbreviation || 'TBD'}</p>
      </div>
    </div>
  );
}

function SummaryInfoTile({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryRuleCard({ label, max, points, detail }) {
  const cleanPoints = roundPoints(points);
  const width = `${Math.min(100, Math.max(0, (cleanPoints / max) * 100))}%`;
  const hasPoints = cleanPoints > 0;

  return (
    <div className={`rounded-xl border p-4 transition ${hasPoints ? 'border-blue-200 bg-blue-50/70' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-950">{label}</p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">{detail}</p>
        </div>
        <span className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-black ${hasPoints ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
          +{cleanPoints}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${hasPoints ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 'bg-slate-300'}`} style={{ width }} />
      </div>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Max {max} pts</p>
    </div>
  );
}
