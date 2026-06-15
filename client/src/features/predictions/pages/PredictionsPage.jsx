import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { MatchPredictionsSheet } from '../components/MatchPredictionsSheet';
import { PredictionFixturesPanel } from '../components/PredictionFixturesPanel';
import { SummaryStrip } from '../components/SummaryStrip';
import { WinnerPicker } from '../components/WinnerPicker';
import { useMatchPredictionsSheet } from '../hooks/useMatchPredictionsSheet';

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
  const matchPredictions = useMatchPredictionsSheet(token);

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

            <PredictionFixturesPanel
              loading={loading}
              visibleFixtures={visibleFixtures}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              refreshAll={refreshAll}
              drafts={drafts}
              updateDraft={updateDraft}
              savePrediction={savePrediction}
              predictionsByMatch={predictionsByMatch}
              pointsByMatch={pointsByMatch}
              savingMatchId={savingMatchId}
              onViewStats={onViewStats}
              onViewPredictions={matchPredictions.open}
            />
          </>
        )}
      </section>

      <MatchPredictionsSheet
        match={matchPredictions.match}
        rows={matchPredictions.rows}
        currentUser={user}
        actualResult={matchPredictions.actualResult}
        loading={matchPredictions.loading}
        error={matchPredictions.error}
        onClose={matchPredictions.close}
      />
    </main>
  );
}
