import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CalendarDays, Eye, Loader2, X } from 'lucide-react';
import { apiRequest } from '@/lib/api/apiClient';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { Flag } from '@/features/matches/components/Flag';
import { displayStatus, hasMatchScore, isPastMatch, scoreText } from '@/features/matches/utils/matchStatus';
import { matchTitle, teamName } from '@/features/matches/utils/matchFormatters';
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
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = predMatch ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [predMatch]);

  async function openPredSheet(match) {
    setPredMatch(match);
    setPredRows([]);
    setPredError(null);
    setPredLoading(true);
    try {
      const data = await apiRequest(`/predictions/${match.id}/all`, { token });
      const rows = Array.isArray(data) ? data : (data?.predictions ?? []);
      setPredRows(rows);
    } catch (err) {
      setPredError(err.message || 'Could not load predictions.');
    } finally {
      setPredLoading(false);
    }
  }

  function closePredSheet() {
    setPredMatch(null);
    setPredRows([]);
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
            className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-slate-50 shadow-2xl transition-transform duration-300 ease-out ${
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
                    <PredictionsTable rows={predRows} currentUser={user} />
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

function PredictionsTable({ rows, currentUser }) {
  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const totalA = (a.ht_pts || 0) + (a.ft_pts || 0) + (a.closest_pts || 0) + (a.outcome_pts || 0);
      const totalB = (b.ht_pts || 0) + (b.ft_pts || 0) + (b.closest_pts || 0) + (b.outcome_pts || 0);
      return totalB - totalA;
    });
  }, [rows]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Player</th>
              <th className="px-3 py-2.5 text-center">HT pred</th>
              <th className="px-3 py-2.5 text-center">FT pred</th>
              <th className="px-3 py-2.5 text-right">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((row, i) => {
              const total = roundPoints((row.ht_pts || 0) + (row.ft_pts || 0) + (row.closest_pts || 0) + (row.outcome_pts || 0));
              const isYou = String(row.user_id) === String(currentUser?.id);
              const htScored = row.ht_pts != null && row.ht_pts > 0;
              const ftScored = row.ft_pts != null && row.ft_pts > 0;
              const username = row.username
                || (Array.isArray(row.users) ? row.users[0]?.username : row.users?.username)
                || '—';
              return (
                <tr key={row.user_id} className={isYou ? 'bg-blue-50' : 'hover:bg-slate-50'}>
                  <td className="w-8 px-3 py-2.5 text-xs font-bold text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900">{username}</span>
                      {isYou && (
                        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">You</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 text-center font-mono text-xs font-semibold tabular-nums ${htScored ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {row.ht_home != null ? `${row.ht_home}-${row.ht_away}` : '—'}
                  </td>
                  <td className={`px-3 py-2.5 text-center font-mono text-xs font-semibold tabular-nums ${ftScored ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {row.ft_home != null ? `${row.ft_home}-${row.ft_away}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-black tabular-nums text-slate-950">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
