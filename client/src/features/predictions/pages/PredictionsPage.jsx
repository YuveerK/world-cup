import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CalendarDays, Clock, Eye, Loader2, X } from 'lucide-react';
import { apiRequest } from '@/lib/api/apiClient';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { Flag } from '@/features/matches/components/Flag';
import { displayStatus, hasMatchScore, isPastMatch, scoreText } from '@/features/matches/utils/matchStatus';
import { matchTitle, outcomeLabel, teamName } from '@/features/matches/utils/matchFormatters';
import { dayKeyOf, formatDayHeading } from '@/lib/date/index';
import { roundPoints } from '@/lib/utils/number';
import { SummaryStrip } from '../components/SummaryStrip';
import { WinnerPicker } from '../components/WinnerPicker';
import { MatchControls } from '../components/MatchControls';
import { MatchDayNav } from '../components/MatchDayNav';
import { PredictionCard } from '../components/PredictionCard';

function groupFixturesByDay(fixtures) {
  const groups = new Map();
  for (const match of fixtures) {
    const key = dayKeyOf(match.date);
    if (!groups.has(key)) {
      const date = match.date ? new Date(match.date) : null;
      groups.set(key, {
        key,
        date: date && !Number.isNaN(date.valueOf()) ? date : null,
        matches: [],
        hasLive: false,
      });
    }
    const group = groups.get(key);
    group.matches.push(match);
    if (displayStatus(match) === 'LIVE') group.hasLive = true;
  }
  return [...groups.values()];
}

export function PredictionsPage({
  notice,
  authNotice,
  isAuthed,
  isRestoringSession,
  loading,
  authMode,
  setAuthMode,
  credentials,
  setCredentials,
  handleAuth,
  busy,
  user,
  token,
  predictions,
  totals,
  leaderboard,
  fixtures,
  visibleFixtures,
  predictionsByMatch,
  pointsByMatch,
  teams,
  drafts,
  updateDraft,
  savePrediction,
  savingMatchId,
  winnerPick,
  setWinnerPick,
  saveWinnerPick,
  savingWinner,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  refreshAll,
  onViewStats,
}) {
  const dayGroups = useMemo(() => groupFixturesByDay(visibleFixtures), [visibleFixtures]);
  const dayKeys = useMemo(() => dayGroups.map((group) => group.key), [dayGroups]);

  const defaultDay = useMemo(() => {
    if (!dayGroups.length) return null;
    const live = dayGroups.find((group) => group.hasLive);
    const upcoming = dayGroups.find((group) => group.matches.some((match) => !isPastMatch(match)));
    return (live || upcoming || dayGroups[0]).key;
  }, [dayGroups]);

  const [selectedDay, setSelectedDay] = useState(null);

  // Commit the default day into state once fixtures are available, so the
  // visible day stops floating with live-status changes during background
  // polls. After this, the day only changes when the user picks one.
  useEffect(() => {
    if (selectedDay === null && defaultDay) setSelectedDay(defaultDay);
  }, [selectedDay, defaultDay]);

  const activeDay =
    selectedDay === 'ALL'
      ? 'ALL'
      : selectedDay && dayKeys.includes(selectedDay)
      ? selectedDay
      : defaultDay;

  const groupsToRender = activeDay === 'ALL' ? dayGroups : dayGroups.filter((group) => group.key === activeDay);

  const [predMatch, setPredMatch] = useState(null);
  const [predRows, setPredRows] = useState([]);
  const [predActualResult, setPredActualResult] = useState(null);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = predMatch ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [predMatch]);

  async function openPredSheet(match) {
    setPredMatch(match);
    setPredRows([]);
    setPredActualResult(null);
    setPredError(null);
    setPredLoading(true);
    try {
      const data = await apiRequest(`/predictions/${match.id}/all`, { token });
      const rows = Array.isArray(data) ? data : (data?.predictions ?? []);
      setPredRows(rows);
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

  if (!isAuthed && !isRestoringSession) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto">
        <AuthCard
          authMode={authMode}
          setAuthMode={setAuthMode}
          credentials={credentials}
          setCredentials={setCredentials}
          handleAuth={handleAuth}
          busy={busy}
          notice={authNotice}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="min-w-0 space-y-6">
        {notice}

        {isRestoringSession ? (
          <LoadingPanel label="Restoring session" />
        ) : (
          <>
            <SummaryStrip
              user={user}
              predictions={predictions}
              totals={totals}
              leaderboard={leaderboard}
            />

            <WinnerPicker
              user={user}
              teams={teams}
              winnerPick={winnerPick}
              setWinnerPick={setWinnerPick}
              saveWinnerPick={saveWinnerPick}
              savingWinner={savingWinner}
            />

            <div className="space-y-3">
              <MatchControls
                query={query}
                setQuery={setQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                refreshAll={refreshAll}
                loading={loading}
              />
              {!loading && dayGroups.length > 0 && (
                <MatchDayNav
                  days={dayGroups}
                  activeDay={activeDay}
                  onSelect={setSelectedDay}
                  totalCount={visibleFixtures.length}
                />
              )}
            </div>

            {loading ? (
              <LoadingPanel label="Loading fixtures" />
            ) : groupsToRender.length ? (
              <div className="space-y-8">
                {groupsToRender.map((group) => (
                  <DaySection
                    key={group.key}
                    group={group}
                    drafts={drafts}
                    updateDraft={updateDraft}
                    savePrediction={savePrediction}
                    predictionsByMatch={predictionsByMatch}
                    pointsByMatch={pointsByMatch}
                    savingMatchId={savingMatchId}
                    onViewStats={onViewStats}
                    onViewPredictions={openPredSheet}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No matches found" detail="Adjust the search or status filter." />
            )}
          </>
        )}
      </section>

      {/* ── All-player predictions side sheet ── */}
      {createPortal(
        <>
          <div
            aria-hidden="true"
            onClick={closePredSheet}
            className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
              predMatch ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={predMatch ? `Predictions: ${matchTitle(predMatch)}` : 'Match predictions'}
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${
              predMatch ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-3.5">
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
                      <p className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${
                        displayStatus(predMatch) === 'FINISHED' ? 'text-blue-600'
                        : displayStatus(predMatch) === 'LIVE' ? 'text-red-600'
                        : 'text-amber-600'
                      }`}>{displayStatus(predMatch)}</p>
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
                      <AlertCircle className="h-8 w-8 text-amber-400" aria-hidden="true" />
                      <div>
                        <p className="font-bold text-slate-900">Could not load predictions</p>
                        <p className="mt-1 text-sm text-slate-500">{predError}</p>
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
                    <PredictionsTable rows={predRows} currentUser={user} matchDate={predMatch?.date} actualResult={predActualResult} />
                  )}
                </>
              )}
            </div>
          </div>
        </>,
        document.body,
      )}
    </main>
  );
}

function timeBeforeKickoff(submittedAt, matchDate) {
  if (!submittedAt || !matchDate) return null;
  const diffMs = new Date(matchDate) - new Date(submittedAt);
  if (diffMs < 0) return 'after kickoff';
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m before`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h before`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h before` : `${days}d before`;
}

function ScorePick({ pick, actual, earned, hasPoints }) {
  const correct = earned && hasPoints;
  const incorrect = !earned && hasPoints && pick != null;
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-bold tabular-nums ${correct ? 'text-emerald-700' : incorrect ? 'text-rose-500' : pick != null ? 'text-slate-600' : 'text-slate-300'}`}>
      {pick != null ? pick : '—'}
      {correct && <span className="text-emerald-500">✓</span>}
      {incorrect && actual != null && <span className="text-[10px] font-normal text-slate-400">({actual})</span>}
    </span>
  );
}

function PredictionsTable({ rows, currentUser, matchDate, actualResult }) {
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const totalA = (a.ht_pts || 0) + (a.ft_pts || 0) + (a.closest_pts || 0) + (a.outcome_pts || 0);
      const totalB = (b.ht_pts || 0) + (b.ft_pts || 0) + (b.closest_pts || 0) + (b.outcome_pts || 0);
      return totalB - totalA;
    });
  }, [rows]);

  const submissionStats = useMemo(() => {
    const times = rows
      .filter((r) => r.submitted_at)
      .map((r) => new Date(r.submitted_at).getTime())
      .filter(Number.isFinite);
    if (!times.length) return null;
    const earliest = new Date(Math.min(...times));
    const latest = new Date(Math.max(...times));
    const avgMs = times.reduce((a, b) => a + b, 0) / times.length;
    return { earliest, latest, avg: new Date(avgMs), count: times.length };
  }, [rows]);

  const hasScored = rows.some((r) => r.ht_pts != null || r.ft_pts != null);

  return (
    <div className="space-y-3">
      {/* Actual result banner */}
      {actualResult && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Match result</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
              {actualResult.ht_home != null && (
                <span className="text-sm font-black tabular-nums text-emerald-900">
                  HT {actualResult.ht_home} – {actualResult.ht_away}
                </span>
              )}
              <span className="text-xs text-emerald-400">·</span>
              <span className="text-sm font-black tabular-nums text-emerald-900">
                FT {actualResult.ft_home} – {actualResult.ft_away}
              </span>
              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                {outcomeLabel(actualResult.ft_home, actualResult.ft_away)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submission timing summary */}
      {submissionStats && (
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-white p-3">
          {[
            { label: 'Earliest', value: timeBeforeKickoff(submissionStats.earliest, matchDate) },
            { label: 'Latest',   value: timeBeforeKickoff(submissionStats.latest, matchDate) },
            { label: 'Average',  value: timeBeforeKickoff(submissionStats.avg, matchDate) },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-900">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Mobile cards (< sm) ── */}
      <div className="space-y-2 sm:hidden">
        {sorted.map((row, i) => {
          const total = roundPoints((row.ht_pts || 0) + (row.ft_pts || 0) + (row.closest_pts || 0) + (row.outcome_pts || 0));
          const isYou = String(row.user_id) === String(currentUser?.id);
          const username = row.username || (Array.isArray(row.users) ? row.users[0]?.username : row.users?.username) || '—';
          const submitted = timeBeforeKickoff(row.submitted_at, matchDate);
          const htEarned = (row.ht_pts || 0) > 0;
          const ftEarned = (row.ft_pts || 0) > 0;
          const outEarned = (row.outcome_pts || 0) > 0;
          const clsEarned = roundPoints(row.closest_pts || 0) > 0;
          const htActual = actualResult?.ht_home != null ? `${actualResult.ht_home}–${actualResult.ht_away}` : null;
          const ftActual = actualResult?.ft_home != null ? `${actualResult.ft_home}–${actualResult.ft_away}` : null;

          return (
            <div key={row.user_id} className={`overflow-hidden rounded-xl border ${isYou ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">{i + 1}</span>
                  <span className="truncate font-bold text-slate-900">{username}</span>
                  {isYou && <span className="shrink-0 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">You</span>}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black tabular-nums ${total > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                  {total} pts
                </span>
              </div>

              {row.ft_home != null && (
                <div className="border-t border-slate-100 px-3.5 py-2.5">
                  {/* Score picks grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`rounded-lg px-2.5 py-2 ${htEarned && hasScored ? 'bg-emerald-50 ring-1 ring-emerald-100' : !htEarned && hasScored && row.ht_home != null ? 'bg-rose-50 ring-1 ring-rose-100' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${htEarned && hasScored ? 'text-emerald-500' : !htEarned && hasScored && row.ht_home != null ? 'text-rose-400' : 'text-slate-400'}`}>Half time</p>
                      <p className={`mt-0.5 font-mono text-base font-black tabular-nums leading-none ${htEarned && hasScored ? 'text-emerald-700' : !htEarned && hasScored && row.ht_home != null ? 'text-rose-600' : row.ht_home != null ? 'text-slate-700' : 'text-slate-300'}`}>
                        {row.ht_home != null ? `${row.ht_home}–${row.ht_away}` : '—'}
                      </p>
                      {hasScored && !htEarned && row.ht_home != null && htActual && (
                        <p className="mt-0.5 text-[9px] text-slate-400">actual {htActual}</p>
                      )}
                      {hasScored && <p className={`mt-1 text-[10px] font-bold ${htEarned ? 'text-emerald-600' : 'text-slate-400'}`}>{htEarned ? `+${row.ht_pts} pts` : '0 pts'}</p>}
                    </div>
                    <div className={`rounded-lg px-2.5 py-2 ${ftEarned && hasScored ? 'bg-emerald-50 ring-1 ring-emerald-100' : !ftEarned && hasScored ? 'bg-rose-50 ring-1 ring-rose-100' : 'bg-slate-50 ring-1 ring-slate-100'}`}>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${ftEarned && hasScored ? 'text-emerald-500' : !ftEarned && hasScored ? 'text-rose-400' : 'text-slate-400'}`}>Full time</p>
                      <p className={`mt-0.5 font-mono text-base font-black tabular-nums leading-none ${ftEarned && hasScored ? 'text-emerald-700' : !ftEarned && hasScored ? 'text-rose-600' : 'text-slate-700'}`}>
                        {row.ft_home}–{row.ft_away}
                      </p>
                      {hasScored && !ftEarned && ftActual && (
                        <p className="mt-0.5 text-[9px] text-slate-400">actual {ftActual}</p>
                      )}
                      {hasScored && <p className={`mt-1 text-[10px] font-bold ${ftEarned ? 'text-emerald-600' : 'text-slate-400'}`}>{ftEarned ? `+${row.ft_pts} pts` : '0 pts'}</p>}
                    </div>
                  </div>

                  {/* Outcome + Closest + Submitted */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {hasScored && (
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${outEarned ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                        {outEarned ? '✓ ' : ''}{outcomeLabel(row.ft_home, row.ft_away)} {outEarned ? `+${row.outcome_pts}` : '0'}
                      </span>
                    )}
                    {!hasScored && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        {outcomeLabel(row.ft_home, row.ft_away)}
                      </span>
                    )}
                    {clsEarned && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                        ✓ Closest +{roundPoints(row.closest_pts)}
                      </span>
                    )}
                    {submitted && (
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {submitted}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Desktop table (sm+) ── */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Player</th>
                <th className="px-3 py-2.5 text-center">
                  HT pick
                  {actualResult?.ht_home != null && (
                    <span className="block text-[9px] font-normal normal-case tracking-normal text-slate-400">actual {actualResult.ht_home}–{actualResult.ht_away}</span>
                  )}
                </th>
                <th className="px-3 py-2.5 text-center">
                  FT pick
                  {actualResult?.ft_home != null && (
                    <span className="block text-[9px] font-normal normal-case tracking-normal text-slate-400">actual {actualResult.ft_home}–{actualResult.ft_away}</span>
                  )}
                </th>
                <th className="px-3 py-2.5 text-center">HT pts</th>
                <th className="px-3 py-2.5 text-center">FT pts</th>
                <th className="px-3 py-2.5 text-center">Cls</th>
                <th className="px-3 py-2.5 text-center">Out</th>
                <th className="px-3 py-2.5 text-center">Submitted</th>
                <th className="px-3 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((row, i) => {
                const total = roundPoints((row.ht_pts || 0) + (row.ft_pts || 0) + (row.closest_pts || 0) + (row.outcome_pts || 0));
                const isYou = String(row.user_id) === String(currentUser?.id);
                const username = row.username || (Array.isArray(row.users) ? row.users[0]?.username : row.users?.username) || '—';
                const ptsCell = (val) => <span className={val > 0 ? 'font-bold text-emerald-700' : 'text-slate-400'}>{val}</span>;
                const htEarned = (row.ht_pts || 0) > 0;
                const ftEarned = (row.ft_pts || 0) > 0;
                return (
                  <tr key={row.user_id} className={isYou ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                    <td className="w-8 px-3 py-2.5 text-xs font-bold text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{username}</span>
                        {isYou && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">You</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs">
                      <ScorePick
                        pick={row.ht_home != null ? `${row.ht_home}–${row.ht_away}` : null}
                        actual={actualResult?.ht_home != null ? `${actualResult.ht_home}–${actualResult.ht_away}` : null}
                        earned={htEarned}
                        hasPoints={hasScored}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs">
                      <ScorePick
                        pick={row.ft_home != null ? `${row.ft_home}–${row.ft_away}` : null}
                        actual={actualResult?.ft_home != null ? `${actualResult.ft_home}–${actualResult.ft_away}` : null}
                        earned={ftEarned}
                        hasPoints={hasScored}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(row.ht_pts || 0)}</td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(row.ft_pts || 0)}</td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(roundPoints(row.closest_pts || 0))}</td>
                    <td className="px-3 py-2.5 text-center text-xs tabular-nums">{ptsCell(row.outcome_pts || 0)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-center text-[11px] text-slate-500">
                      {timeBeforeKickoff(row.submitted_at, matchDate) ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-black tabular-nums text-slate-950">{total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DaySection({
  group,
  drafts,
  updateDraft,
  savePrediction,
  predictionsByMatch,
  pointsByMatch,
  savingMatchId,
  onViewStats,
  onViewPredictions,
}) {
  return (
    <section>
      <div className="z-10 mb-3 flex items-center gap-3 lg:sticky lg:top-[88px]">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3.5 py-1.5 shadow-sm backdrop-blur">
          <CalendarDays className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span className="text-sm font-bold text-slate-900">{formatDayHeading(group.date)}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
            {group.matches.length}
          </span>
          {group.hasLive && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
              </span>
              Live
            </span>
          )}
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {group.matches.map((match) => (
          <PredictionCard
            key={match.id}
            match={match}
            draft={drafts[String(match.id)] || {}}
            updateDraft={updateDraft}
            savePrediction={savePrediction}
            prediction={predictionsByMatch.get(String(match.id))}
            points={pointsByMatch.get(String(match.id))}
            saving={savingMatchId === String(match.id)}
            onViewStats={onViewStats}
            onViewPredictions={onViewPredictions}
          />
        ))}
      </div>
    </section>
  );
}
