import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { dayKeyOf, formatDayHeading } from '@/lib/date/index';
import { displayStatus, isPastMatch } from '@/features/matches/utils/matchStatus';
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
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No matches found" detail="Adjust the search or status filter." />
            )}
          </>
        )}
      </section>

    </main>
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
          />
        ))}
      </div>
    </section>
  );
}
