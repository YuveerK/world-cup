import { createElement, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Award, BarChart2, CheckCircle2, Copy, Crown, Eye, FileDown, Flame, Lock, Loader2, Medal, PieChart, Star, Target, TrendingDown, TrendingUp, Trophy, Users, X, Zap } from 'lucide-react';
import { apiRequest } from '@/api';
import { useAuth } from '@/app/providers/AuthContext';
import { useAppData } from '@/app/providers/AppDataContext';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { Podium } from '@/components/ui/Podium';
import { Flag } from '@/features/matches/components/Flag';
import { displayStatus, hasMatchScore, scoreText } from '@/features/matches/utils/matchStatus';
import { matchTitle, teamName } from '@/features/matches/utils/matchFormatters';
import { formatDate, formatDayHeading } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';
import { buildRows, buildMatchInsights, buildTournamentInsights, groupFixturesByMatchday, isActiveReportDay } from '../utils/reportData';
import { buildShareText } from '../utils/reportShare';
import { buildPlayerCsv, downloadPlayerCsv } from '../utils/playerCsv';
import { CategoryBreakdownChart } from '../charts/CategoryBreakdownChart';
import { MatchdayDifficultyChart } from '../charts/MatchdayDifficultyChart';
import { PointsGapChart } from '../charts/PointsGapChart';
import { TournamentProgressChart } from '../charts/TournamentProgressChart';
import { MatchResultCard } from '../components/MatchResultCard';
import { PlayerSpotlight } from '../components/PlayerSpotlight';
import { PredictionsTable } from '../components/PredictionsTable';
import { SnapshotCard } from '../components/SnapshotCard';
import { StandingsRow } from '../components/StandingsRow';

export function MatchdayReportPage() {
  const { user: currentUser, token, isAdmin } = useAuth();
  const { leaderboard, fixtures, loading, error, refresh: refreshAll } = useAppData();

  const matchdays = useMemo(() => groupFixturesByMatchday(fixtures), [fixtures]);
  const defaultKey = useMemo(() => {
    const active = [...matchdays].reverse().find(isActiveReportDay);
    return active?.key || matchdays[0]?.key || '';
  }, [matchdays]);

  const [selectedKey, setSelectedKey] = useState('');
  const [copyState, setCopyState] = useState('Copy summary');
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [predMatch, setPredMatch] = useState(null);
  const [predRows, setPredRows] = useState([]);
  const [predActualResult, setPredActualResult] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState(null);
  const [pdfState, setPdfState] = useState('idle');

  const fixturesById = useMemo(() => new Map(fixtures.map((m) => [String(m.id), m])), [fixtures]);
  const activeKey = selectedKey || defaultKey;
  const selectedIndex = Math.max(0, matchdays.findIndex((d) => d.key === activeKey));
  const selectedMatchday = matchdays[selectedIndex];
  const rows = useMemo(() => buildRows(leaderboard, matchdays, selectedIndex), [leaderboard, matchdays, selectedIndex]);
  const topScorer = rows[0];
  const leader = [...leaderboard].sort((a, b) => b.total - a.total)[0];
  const totalMatchdayPoints = roundPoints(rows.reduce((sum, r) => sum + r.selectedDayTotal, 0));
  const spotlightRow = rows.find((r) => r.username === selectedUsername) || null;
  const allScoredMatchdays = useMemo(() => matchdays.filter(isActiveReportDay), [matchdays]);
  const insights = useMemo(() => buildTournamentInsights(rows, matchdays), [rows, matchdays]);
  const matchInsights = useMemo(() => buildMatchInsights(rows), [rows]);

  useEffect(() => {
    document.body.style.overflow = (spotlightRow || predMatch) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [spotlightRow, predMatch]);

  function handleSelectPlayer(username) {
    setSelectedUsername((prev) => (prev === username ? null : username));
  }

  async function openPredSheet(match) {
    setPredMatch(match);
    setPredRows([]);
    setPredActualResult(null);
    setPredError(null);
    setPredLoading(true);
    try {
      const data = await apiRequest(`/predictions/${match.id}/all`, { token });
      const fetched = Array.isArray(data) ? data : (data?.predictions ?? []);
      setPredRows(fetched);
      setPredActualResult(data?.actualResult ?? null);
    } catch (err) {
      setPredError(err.message || 'Could not load predictions.');
    } finally {
      setPredLoading(false);
    }
  }

  function closePredSheet() {
    setPredMatch(null);
    setPredRows([]);
    setPredActualResult(null);
    setPredError(null);
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(buildShareText(selectedMatchday, rows));
      setCopyState('Copied!');
    } catch {
      setCopyState('Failed');
    }
    window.setTimeout(() => setCopyState('Copy summary'), 1500);
  }

  async function downloadPDF() {
    setPdfState('generating');
    try {
      const [{ pdf }, { MatchdayReportPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../components/MatchdayReportPDF'),
      ]);
      const doc = createElement(MatchdayReportPDF, { rows, matchdays, fixturesById });
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setPdfState('done');
      window.setTimeout(() => setPdfState('idle'), 2500);
    } catch (err) {
      console.error('PDF generation failed', err);
      setPdfState('idle');
    }
  }

  if (loading) return <LoadingPanel label="Loading matchday report" />;
  if (!leaderboard.length || !matchdays.length) {
    return (
      <EmptyState
        title={error ? 'Could not load report data' : 'No report data yet'}
        detail={error || 'Reports will appear after fixtures and player predictions are available.'}
      />
    );
  }

  return (
    <div className="report-sheet space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-amber-50 px-5 py-7 sm:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12]">
          <div className="absolute left-10 right-10 top-12 h-px bg-blue-500" />
          <div className="absolute bottom-12 left-10 right-10 h-px bg-blue-500" />
          <div className="absolute left-1/2 top-12 h-[calc(100%-6rem)] w-px bg-blue-500" />
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -right-10 top-0 h-full w-28 rotate-12 bg-amber-200/35" />
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 via-amber-400 to-emerald-500" />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-blue-100 bg-white/85 px-3 py-2 shadow-sm backdrop-blur">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950">
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="leading-tight">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">FIFA World Cup 2026</p>
                  <p className="text-xs font-black text-slate-950">CAN · MEX · USA</p>
                </div>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Matchday Report
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{formatDayHeading(selectedMatchday?.date)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Matchday points, rank movement, cumulative totals, and detailed player analysis.
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Click any player for their full breakdown
            </p>
          </div>

          <div className="print-hidden flex flex-wrap gap-2 lg:min-w-[220px] lg:flex-col lg:items-stretch">
            <select className="field w-full bg-white text-slate-900" value={activeKey} onChange={(e) => setSelectedKey(e.target.value)}>
              {matchdays.map((day, i) => (
                <option key={day.key} value={day.key}>Matchday {i + 1} — {formatDate(day.date)}</option>
              ))}
            </select>
            <button className="btn w-full justify-center gap-2 border border-amber-200 bg-amber-50 font-semibold text-amber-700 transition hover:bg-amber-100" onClick={downloadPDF} disabled={pdfState === 'generating'}>
              <FileDown className="h-4 w-4" aria-hidden="true" />
              {pdfState === 'generating' ? 'Generating…' : pdfState === 'done' ? 'Opened!' : 'Preview Programme PDF'}
            </button>
            <button className="btn btn-secondary w-full" onClick={copySummary}>
              <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{copyState}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Snapshot stats */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <SnapshotCard icon={Trophy} color="amber" label="Top matchday scorer" value={topScorer ? `+${roundPoints(topScorer.selectedDayTotal)}` : '—'} detail={topScorer?.username} />
        <SnapshotCard icon={Crown} color="blue" label="Overall leader" value={leader?.username || '—'} detail={leader ? `${roundPoints(leader.total)} pts total` : undefined} />
        <SnapshotCard icon={Users} color="indigo" label="Players tracked" value={rows.length} detail={`${selectedMatchday?.matches.length || 0} fixtures this day`} />
        <SnapshotCard icon={Zap} color="violet" label="Points awarded" value={totalMatchdayPoints} detail="Total across all players" />
      </section>

      {/* Category leaders */}
      {allScoredMatchdays.length > 0 && insights && (
        <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <SnapshotCard icon={Award} color="amber" label="HT pts leader" value={`+${roundPoints(insights.htLeader?.ht_pts || 0)}`} detail={insights.htLeader?.username} />
          <SnapshotCard icon={Zap} color="blue" label="FT pts leader" value={`+${roundPoints(insights.ftLeader?.ft_pts || 0)}`} detail={insights.ftLeader?.username} />
          <SnapshotCard icon={Target} color="violet" label="Closest pts leader" value={`+${roundPoints(insights.closestLeader?.closest_pts || 0)}`} detail={insights.closestLeader?.username} />
          <SnapshotCard icon={CheckCircle2} color="emerald" label="Outcome pts leader" value={`+${roundPoints(insights.outcomeLeader?.outcome_pts || 0)}`} detail={insights.outcomeLeader?.username} />
        </section>
      )}

      {/* Tournament quick stats */}
      {allScoredMatchdays.length > 0 && insights && (
        <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <SnapshotCard icon={Flame} color="teal" label="Most consistent" value={insights.consistent?.username || '—'} detail={insights.consistent ? `σ${insights.consistent.stdDev} pts/MD` : 'need 3+ matchdays'} />
          <SnapshotCard icon={Flame} color="orange" label="Best single day" value={insights.biggestHaul.pts ? `+${roundPoints(insights.biggestHaul.pts)}` : '—'} detail={insights.biggestHaul.pts ? `${insights.biggestHaul.username} · ${insights.biggestHaul.matchdayLabel}` : undefined} />
          <SnapshotCard icon={Star} color="indigo" label="Perfect picks leader" value={insights.mostPerfect?.perfectPredictions || 0} detail={insights.mostPerfect ? `HT+FT exact · ${insights.mostPerfect.username}` : undefined} />
          <SnapshotCard icon={TrendingUp} color="rose" label="Biggest comeback" value={insights.biggestComeback ? `+${insights.biggestComeback.initialRank - insights.biggestComeback.selectedRank}` : '—'} detail={insights.biggestComeback?.username || 'no change yet'} />
        </section>
      )}

      {/* Match results */}
      {selectedMatchday?.matches.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3">
          {selectedMatchday.matches.map((match) => (
            <div key={match.id} className="w-full sm:w-[calc(50%-6px)] lg:w-[calc(33.333%-8px)]">
              <MatchResultCard match={match} onClick={() => openPredSheet(match)} consensus={matchInsights.consensus} />
            </div>
          ))}
        </div>
      )}

      {/* Tournament progress chart */}
      {matchdays.length > 1 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-black text-slate-950">
                <TrendingUp className="h-5 w-5 text-blue-600" aria-hidden="true" />
                Tournament Progress
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Cumulative points over all matchdays ·{' '}
                {spotlightRow ? <span className="font-semibold text-blue-600">Highlighting {spotlightRow.username}</span> : 'select a player below to highlight'}
              </p>
            </div>
          </div>
          <TournamentProgressChart rows={rows} matchdays={matchdays} highlightUsername={spotlightRow?.username} />
        </section>
      )}

      {/* Tournament analytics */}
      {allScoredMatchdays.length > 0 && insights && (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-black text-slate-950">
              <BarChart2 className="h-4 w-4 text-violet-600" aria-hidden="true" />
              Matchday Difficulty
            </h3>
            <p className="mb-4 text-xs text-slate-500">Total pts awarded per matchday · lower = harder</p>
            <MatchdayDifficultyChart insights={insights} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-black text-slate-950">
              <TrendingUp className="h-4 w-4 text-amber-500" aria-hidden="true" />
              Points Gap Over Time
            </h3>
            <p className="mb-4 text-xs text-slate-500">Gap between 1st–2nd and 2nd–3rd position</p>
            <PointsGapChart rows={rows} matchdays={matchdays} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-black text-slate-950">
              <PieChart className="h-4 w-4 text-blue-600" aria-hidden="true" />
              Points by Category
            </h3>
            <p className="mb-4 text-xs text-slate-500">How each player earns their points</p>
            <CategoryBreakdownChart rows={rows} />
          </div>
        </section>
      )}

      {/* Standings */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
              <Medal className="h-5 w-5 text-amber-500" aria-hidden="true" />
              Overall Standings
            </h3>
            <p className="mt-0.5 text-sm text-slate-500">Ranked by cumulative points after this matchday · Click a player for detailed analysis</p>
          </div>
        </div>
        <Podium rows={rows} currentUser={currentUser} onSelect={handleSelectPlayer} />
        <div className="space-y-2">
          {rows.map((row) => (
            <StandingsRow
              key={row.id || row.username}
              row={row}
              isCurrentUser={row.username === currentUser?.username}
              isSelected={row.username === selectedUsername}
              onSelect={handleSelectPlayer}
            />
          ))}
        </div>
      </section>

      {/* Player analysis side sheet */}
      {createPortal(
        <>
          <div
            aria-hidden="true"
            onClick={() => setSelectedUsername(null)}
            className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${spotlightRow ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={spotlightRow ? `Player analysis: ${spotlightRow.username}` : 'Player analysis'}
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${spotlightRow ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <Award className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <div className="leading-tight">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Player Analysis</p>
                  <p className="text-sm font-black text-slate-950">{spotlightRow?.username ?? '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => downloadPlayerCsv(spotlightRow, fixturesById)}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    aria-label="Download predictions as CSV"
                  >
                    <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                    CSV
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedUsername(null)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close analysis"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {spotlightRow && (
                <PlayerSpotlight row={spotlightRow} matchdays={matchdays} allRows={rows} fixturesById={fixturesById} />
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Match predictions sheet */}
      {createPortal(
        <>
          <div
            aria-hidden="true"
            onClick={closePredSheet}
            className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${predMatch ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={predMatch ? `Predictions: ${matchTitle(predMatch)}` : 'Match predictions'}
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${predMatch ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex shrink-0 min-w-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <Eye className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
                <div className="min-w-0 leading-tight">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">All Predictions</p>
                  <p className="truncate text-sm font-black text-slate-950">{predMatch ? matchTitle(predMatch) : '—'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePredSheet}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {predMatch && (
                <>
                  <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                    <div className="flex flex-col items-center gap-1.5">
                      <Flag team={predMatch.home} />
                      <p className="line-clamp-2 text-center text-xs font-bold text-slate-900">{teamName(predMatch.home)}</p>
                    </div>
                    <div className="text-center">
                      {hasMatchScore(predMatch) ? (
                        <p className="text-3xl font-black tabular-nums text-slate-950">{scoreText(predMatch)}</p>
                      ) : (
                        <p className="text-base font-black uppercase text-slate-400">VS</p>
                      )}
                      <p className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${displayStatus(predMatch) === 'FINISHED' ? 'text-blue-600' : displayStatus(predMatch) === 'LIVE' ? 'text-red-600' : 'text-amber-600'}`}>
                        {displayStatus(predMatch)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <Flag team={predMatch.away} />
                      <p className="line-clamp-2 text-center text-xs font-bold text-slate-900">{teamName(predMatch.away)}</p>
                    </div>
                  </div>

                  {predLoading && (
                    <div className="flex items-center justify-center gap-2.5 py-16 text-sm font-medium text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      Loading predictions…
                    </div>
                  )}

                  {predError && !predLoading && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-8 text-center">
                      <Lock className="h-8 w-8 text-amber-400" aria-hidden="true" />
                      <div>
                        <p className="font-bold text-slate-900">Predictions hidden</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {predError.includes('kickoff') || predError.includes('hidden')
                            ? 'Predictions are revealed once the match kicks off.'
                            : predError}
                        </p>
                      </div>
                    </div>
                  )}

                  {!predLoading && !predError && predRows.length === 0 && (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-10 text-center">
                      <AlertCircle className="h-8 w-8 text-slate-300" aria-hidden="true" />
                      <div>
                        <p className="font-bold text-slate-900">No predictions yet</p>
                        <p className="mt-1 text-sm text-slate-500">No players have submitted a prediction for this match.</p>
                      </div>
                    </div>
                  )}

                  {!predLoading && !predError && predRows.length > 0 && (
                    <PredictionsTable rows={predRows} currentUser={currentUser} matchDate={predMatch?.date} actualResult={predActualResult} />
                  )}

                  {/* AI Research Prompt — temporarily hidden
                  {isAdmin && predMatch && (() => {
                    const myRow = rows.find((r) => r.username === currentUser?.username)
                      || leaderboard.find((r) => r.username === currentUser?.username);
                    const myCsv = myRow ? buildPlayerCsv(myRow, fixturesById) : '';
                    const topPlayer = [...leaderboard].sort((a, b) => (b.total || 0) - (a.total || 0))[0];
                    const leagueCtx = myRow ? {
                      rank: myRow.rank ?? myRow.selectedRank ?? '?',
                      total: leaderboard.length,
                      pts: roundPoints(myRow.total || 0),
                      gapToLeader: roundPoints(Math.max(0, (topPlayer?.total || 0) - (myRow.total || 0))),
                    } : null;
                    const prompt = buildLlmPrompt(predMatch, myCsv, leagueCtx);
                    return (
                      <details className="group mt-6">
                        <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 transition hover:bg-violet-100">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-violet-600" aria-hidden="true" />
                            <span className="text-xs font-black uppercase tracking-widest text-violet-700">AI Research Prompt</span>
                            <span className="rounded-full bg-violet-200 px-2 py-0.5 text-[10px] font-black text-violet-800">Admin</span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-violet-500 transition-transform group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <div className="mt-2 overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm">
                          <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50/60 px-4 py-2.5">
                            <p className="text-[11px] font-semibold text-violet-600">
                              Your prediction history is pre-filled. Copy and paste into any LLM.
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(prompt);
                                  setPromptCopyState('Copied!');
                                  setTimeout(() => setPromptCopyState('Copy Prompt'), 2500);
                                } catch {}
                              }}
                              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-xs font-black text-violet-700 transition hover:bg-violet-50"
                            >
                              {promptCopyState === 'Copied!'
                                ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                                : <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              }
                              {promptCopyState}
                            </button>
                          </div>
                          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words p-4 font-mono text-[11px] leading-relaxed text-slate-700 [scrollbar-width:thin]">
                            {prompt}
                          </pre>
                        </div>
                      </details>
                    );
                  })()} */}
                </>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Footer */}
      <footer className="print-hidden flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <div>
          <p className="text-sm font-black text-slate-950">Prediction League Matchday Report</p>
          <p className="text-xs text-slate-500">Built for quick sharing, PDF export, and matchday review.</p>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-yellow-500 text-blue-950">
            <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">FIFA</p>
            <p className="text-xs font-black text-slate-950">World Cup 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
