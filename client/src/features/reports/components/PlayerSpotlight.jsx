import { memo } from 'react';
import { Activity, Award, BarChart2, Check, CheckCircle2, ChevronDown, Clock, Crown, Star, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { Flag } from '@/features/matches/components/Flag';
import { displayStatus, hasMatchScore, scoreText } from '@/features/matches/utils/matchStatus';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { dayKeyOf, formatDayHeading } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';
import { AccuracyTrendChart } from '../charts/AccuracyTrendChart';
import { MatchdayBarChart } from '../charts/MatchdayBarChart';
import { RadarChart } from '../charts/RadarChart';
import { TournamentProgressChart } from '../charts/TournamentProgressChart';
import { CategoryBar } from './CategoryBar';
import { HeadToHeadTable } from './HeadToHeadTable';
import { MetricBox } from './MetricBox';
import { RankDelta } from './RankDelta';
import { ScoreHeatmap } from './ScoreHeatmap';
import { StageBreakdown } from './StageBreakdown';
import { TimingCorrelation } from './TimingCorrelation';

export const PlayerSpotlight = memo(function PlayerSpotlight({ row, matchdays, allRows, fixturesById }) {
  const maxHT = Math.max(...allRows.map((r) => r.ht_pts || 0), 1);
  const maxFT = Math.max(...allRows.map((r) => r.ft_pts || 0), 1);
  const maxClosest = Math.max(...allRows.map((r) => r.closest_pts || 0), 1);
  const maxOutcome = Math.max(...allRows.map((r) => r.outcome_pts || 0), 1);
  const maxWinner = Math.max(...allRows.map((r) => r.winner_pts || 0), 1);

  const rankGrad =
    row.selectedRank === 1 ? 'from-amber-300 to-yellow-500 text-blue-950'
    : row.selectedRank === 2 ? 'from-slate-200 to-slate-400 text-slate-800'
    : row.selectedRank === 3 ? 'from-orange-300 to-amber-500 text-blue-950'
    : 'from-blue-100 to-blue-200 text-blue-950';

  const sortedMatches = [...(row.match_points || [])].sort((a, b) => {
    const mA = fixturesById?.get(String(a.match_id));
    const mB = fixturesById?.get(String(b.match_id));
    return new Date(mA?.date || 0).getTime() - new Date(mB?.date || 0).getTime()
      || String(a.match_id).localeCompare(String(b.match_id));
  });

  const matchdayGroups = (() => {
    const grouped = new Map();
    sortedMatches.forEach((entry) => {
      const match = fixturesById?.get(String(entry.match_id));
      const key = match?.date ? dayKeyOf(match.date) : 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, { key, date: match?.date ? new Date(match.date) : null, entries: [], dayTotal: 0 });
      }
      const g = grouped.get(key);
      g.entries.push(entry);
      g.dayTotal += roundPoints(entry.match_total || 0);
    });
    return [...grouped.values()].sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
  })();

  return (
    <div className="overflow-hidden">
      <header className="relative overflow-hidden border-b border-blue-100 bg-gradient-to-br from-white via-blue-50 to-amber-50 px-5 py-7 sm:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12]">
          <div className="absolute left-8 right-8 top-8 h-px bg-blue-500" />
          <div className="absolute bottom-8 left-8 right-8 h-px bg-blue-500" />
          <div className="absolute left-1/2 top-8 h-[calc(100%-4rem)] w-px bg-blue-500" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-emerald-500" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${rankGrad} text-xl font-black ring-2 ring-white shadow-lg`}>
              #{row.selectedRank}
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Player Analysis</span>
                <RankDelta value={row.rankChange} />
              </div>
              <h3 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{row.username}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {row.match_points?.length || 0} predictions · Winner pick:{' '}
                <span className="font-bold text-blue-700">{row.winner || 'Not set'}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3 sm:flex-col sm:items-end">
            <div className="rounded-2xl border border-blue-100 bg-white px-5 py-3 text-center shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Total Points</p>
              <p className="text-4xl font-black text-slate-950">{roundPoints(row.total)}</p>
            </div>
            {row.winner_pts > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Winner Bonus</p>
                <p className="text-2xl font-black text-amber-700">+{roundPoints(row.winner_pts)}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="space-y-8 p-5 sm:p-7">
        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <MetricBox icon={Crown} label="Rank" value={`#${row.selectedRank}`} />
          <MetricBox icon={Target} label="Scoring Rate" value={`${row.accuracy}%`} sub={`of ${row.match_points?.filter((e) => e.scored).length || 0} played`} />
          <MetricBox icon={Zap} label="FT Exact" value={row.exactFT} sub="full-time scores" />
          <MetricBox icon={Star} label="Matchday" value={`+${row.selectedDayTotal}`} sub="pts this day" />
          <MetricBox icon={CheckCircle2} label="Perfect Picks" value={row.perfectPredictions || 0} sub="HT + FT exact" />
          <MetricBox icon={Activity} label="Streak" value={row.streak > 0 ? `+${row.streak}` : row.streak < 0 ? `${row.streak}` : '—'} sub={row.streak > 0 ? 'hot run 🔥' : row.streak < 0 ? 'cold patch' : 'steady'} />
        </div>

        {/* Scoring breakdown + charts */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <BarChart2 className="h-4 w-4" aria-hidden="true" />
              Scoring Breakdown
            </h4>
            <div className="space-y-3">
              <CategoryBar label="Half-Time Exact" value={row.ht_pts || 0} maxValue={maxHT} barClass="bg-amber-400" />
              <CategoryBar label="Full-Time Exact" value={row.ft_pts || 0} maxValue={maxFT} barClass="bg-blue-500" />
              <CategoryBar label="Closest Score" value={row.closest_pts || 0} maxValue={maxClosest} barClass="bg-violet-500" />
              <CategoryBar label="Outcome (Win/Draw)" value={row.outcome_pts || 0} maxValue={maxOutcome} barClass="bg-emerald-500" />
              <CategoryBar label="W.Cup Winner Bonus" value={row.winner_pts || 0} maxValue={maxWinner} barClass="bg-rose-400" />
            </div>
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Performance Radar</p>
              <RadarChart row={row} allRows={allRows} />
              <p className="mt-2 text-center text-[10px] text-slate-400">Normalised vs top scorer in each category</p>
            </div>
          </div>

          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              Tournament Progress
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              {matchdays.length > 1
                ? <TournamentProgressChart rows={allRows} matchdays={matchdays} highlightUsername={row.username} />
                : <p className="py-4 text-center text-xs text-slate-400">More matchdays needed for progress chart</p>
              }
              <p className="mt-2 text-center text-[10px] text-slate-400">Blue line = this player · Grey = everyone else</p>
            </div>

            <h4 className="mb-4 mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <BarChart2 className="h-4 w-4" aria-hidden="true" />
              Points Per Matchday
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <MatchdayBarChart row={row} matchdays={matchdays} />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { label: 'Best MD', value: `+${roundPoints(Math.max(...(row.dayTotals.length ? row.dayTotals : [0])))}` },
                { label: 'Avg per MD', value: roundPoints(row.dayTotals.length ? row.dayTotals.reduce((a, b) => a + b, 0) / row.dayTotals.length : 0) },
                { label: 'HT Exact', value: row.exactHT },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-0.5 text-xl font-black text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced analytics */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Activity className="h-4 w-4" aria-hidden="true" />
              Accuracy Trend
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <AccuracyTrendChart row={row} matchdays={matchdays} />
              <p className="mt-2 text-center text-[10px] text-slate-400">% of played matches that scored any points, per matchday</p>
            </div>
          </div>
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <BarChart2 className="h-4 w-4" aria-hidden="true" />
              Score Distribution
            </h4>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <ScoreHeatmap row={row} />
            </div>
          </div>
        </div>

        {/* Head-to-Head */}
        <div>
          <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            Head-to-Head vs {row.selectedRank === 1 ? '#2' : 'Leader'}
          </h4>
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <HeadToHeadTable row={row} allRows={allRows} />
          </div>
        </div>

        {/* Stage breakdown + Submission timing */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Trophy className="h-4 w-4" aria-hidden="true" />
              Stage Performance
            </h4>
            <StageBreakdown row={row} fixturesById={fixturesById} />
          </div>
          <div>
            <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Submission Timing
            </h4>
            <TimingCorrelation row={row} fixturesById={fixturesById} />
          </div>
        </div>

        {/* Match history */}
        <div>
          <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <Award className="h-4 w-4" aria-hidden="true" />
            Match History ({sortedMatches.length} predictions · {matchdayGroups.length} matchday{matchdayGroups.length !== 1 ? 's' : ''})
          </h4>
          {matchdayGroups.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No match predictions recorded yet.</p>
          )}
          <div className="space-y-2">
            {matchdayGroups.map(({ key, date, entries, dayTotal }) => {
              const mdIndex = matchdays.findIndex((d) => d.key === key);
              const mdLabel = mdIndex >= 0 ? `Matchday ${mdIndex + 1}` : 'Matchday';
              const hasPoints = dayTotal > 0;

              return (
                <details key={key} name={`spotlight-days-${row.username}`} className="group/day overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3 px-4 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-950">{mdLabel}</p>
                        <p className="text-xs text-slate-400">
                          {date ? formatDayHeading(date) : '—'} · {entries.length} match{entries.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5">
                        <span className={`rounded-lg px-3 py-1.5 text-sm font-black tabular-nums ${hasPoints ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {hasPoints ? `+${dayTotal}` : '0'} pts
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-open/day:rotate-180" aria-hidden="true" />
                      </div>
                    </div>
                  </summary>

                  <div className="space-y-2 border-t border-slate-100 p-3">
                    {entries.map((entry) => {
                      const match = fixturesById?.get(String(entry.match_id));
                      const pts = roundPoints(entry.match_total || 0);
                      const has = pts > 0;
                      const pred = entry.prediction;
                      const res = entry.result;
                      const htPred = pred?.ht_home != null ? `${pred.ht_home}–${pred.ht_away}` : '–';
                      const ftPred = pred?.ft_home != null ? `${pred.ft_home}–${pred.ft_away}` : '–';
                      const htRes = res?.ht_home != null ? `${res.ht_home}–${res.ht_away}` : '–';
                      const ftRes = res?.ft_home != null ? `${res.ft_home}–${res.ft_away}` : null;
                      const catPills = [
                        { label: 'HT', pts: entry.ht_pts, color: 'bg-amber-50 text-amber-700 border border-amber-100' },
                        { label: 'FT', pts: entry.ft_pts, color: 'bg-blue-50 text-blue-700 border border-blue-100' },
                        { label: 'Closest', pts: entry.closest_pts, color: 'bg-violet-50 text-violet-700 border border-violet-100' },
                        { label: 'Outcome', pts: entry.outcome_pts, color: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
                      ].filter(({ pts: p }) => roundPoints(p || 0) > 0);
                      const htCorrect = roundPoints(entry.ht_pts || 0) > 0;
                      const ftCorrect = roundPoints(entry.ft_pts || 0) > 0;
                      const status = match ? displayStatus(match) : (entry.scored ? 'FINISHED' : 'UPCOMING');
                      const live = status === 'LIVE';

                      return (
                        <details key={entry.match_id} className="group/match overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <summary className="cursor-pointer list-none px-4 pb-3 pt-4">
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                              <div className="flex flex-col items-center gap-2">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                                  <Flag team={match?.home} />
                                </div>
                                <p className="line-clamp-2 text-center text-xs font-bold leading-tight text-slate-900">
                                  {teamName(match?.home) || `Match #${entry.match_id}`}
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
                                  <p className={`mt-2 text-[10px] font-bold uppercase tracking-wide ${status === 'FINISHED' ? 'text-blue-600' : 'text-amber-600'}`}>
                                    {status}
                                  </p>
                                )}
                              </div>

                              <div className="flex flex-col items-center gap-2">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                                  <Flag team={match?.away} />
                                </div>
                                <p className="line-clamp-2 text-center text-xs font-bold leading-tight text-slate-900">
                                  {teamName(match?.away) || ''}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <div className="flex flex-wrap gap-1.5">
                                {catPills.map(({ label, pts: p, color }) => (
                                  <span key={label} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${color}`}>
                                    {label} +{roundPoints(p)}
                                  </span>
                                ))}
                              </div>
                              <div className="ml-auto flex items-center gap-2">
                                <span className={`rounded-lg px-3 py-1.5 text-sm font-bold tabular-nums ${has ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {has ? `+${pts}` : entry.scored ? '0' : '–'} pts
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 group-open/match:rotate-180" aria-hidden="true" />
                              </div>
                            </div>
                          </summary>

                          <div className="border-t border-slate-100">
                            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Your Pick</p>
                                  <div className="space-y-2">
                                    {[{ label: 'HT', val: htPred }, { label: 'FT', val: ftPred }].map(({ label, val }) => (
                                      <div key={label} className="flex items-center gap-2">
                                        <span className="w-5 shrink-0 text-[10px] font-black text-slate-400">{label}</span>
                                        <span className="rounded-lg bg-white px-2.5 py-1 text-sm font-black tabular-nums text-slate-800 ring-1 ring-slate-200">{val}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Result</p>
                                  <div className="space-y-2">
                                    {[
                                      { label: 'HT', val: htRes, correct: htCorrect },
                                      { label: 'FT', val: ftRes || '—', correct: ftCorrect },
                                    ].map(({ label, val, correct }) => (
                                      <div key={label} className="flex items-center gap-2">
                                        <span className="w-5 shrink-0 text-[10px] font-black text-slate-400">{label}</span>
                                        <span className={`rounded-lg px-2.5 py-1 text-sm font-black tabular-nums ring-1 ${correct ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-white text-slate-400 ring-slate-200'}`}>{val}</span>
                                        {correct && <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-4">
                              {[
                                { label: 'Half Time', sub: '5 pts', pts: entry.ht_pts },
                                { label: 'Full Time', sub: '10 pts', pts: entry.ft_pts },
                                { label: 'Closest Score', sub: '6 pts shared', pts: entry.closest_pts },
                                { label: 'Win / Draw', sub: '4 pts', pts: entry.outcome_pts },
                              ].map(({ label, sub, pts: p }) => {
                                const earned = roundPoints(p || 0) > 0;
                                return (
                                  <div key={label} className={`rounded-xl p-3.5 ${earned ? 'bg-blue-600 shadow-[0_4px_20px_-6px_rgba(37,99,235,0.55)]' : 'border border-slate-100 bg-slate-50'}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-wide ${earned ? 'text-blue-200' : 'text-slate-400'}`}>{label}</p>
                                    <p className={`mt-1.5 text-2xl font-black tabular-nums leading-none ${earned ? 'text-white' : 'text-slate-300'}`}>+{roundPoints(p || 0)}</p>
                                    <p className={`mt-1 text-[10px] font-medium ${earned ? 'text-blue-300' : 'text-slate-300'}`}>{sub}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}, (prev, next) =>
  prev.row.username === next.row.username &&
  prev.row.total === next.row.total &&
  prev.row.selectedDayTotal === next.row.selectedDayTotal &&
  prev.row.selectedRank === next.row.selectedRank &&
  prev.allRows.length === next.allRows.length &&
  prev.matchdays.length === next.matchdays.length
);
