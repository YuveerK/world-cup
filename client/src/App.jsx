import { Navigate, Route, Routes } from 'react-router-dom';
import { AppHeader } from '@/app/layout/AppHeader';
import { AuthProvider } from '@/app/providers/AuthContext';
import { AppDataProvider } from '@/app/providers/AppDataContext';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { MatchStatsDialog } from '@/features/matches/components/MatchStatsDialog';
import { useMatchStats } from '@/features/matches/hooks/useMatchStats';
import { PredictionsPage } from '@/features/predictions/pages/PredictionsPage';
import { LeaderboardPage } from '@/features/leaderboard/pages/LeaderboardPage';
import { MatchdayReportPage } from '@/features/reports/pages/MatchdayReportPage';
import { AdminPage } from '@/features/admin/pages/AdminPage';
import { ProfilePage } from '@/features/account/pages/ProfilePage';
import { CardPreviewPage } from '@/dev/CardPreviewPage';
import { StandingsPage } from '@/features/standings/pages/StandingsPage';
import { KnockoutPage } from '@/features/knockout/pages/KnockoutPage';
import { useAuth } from '@/app/providers/AuthContext';

const MAIN = 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8';

function AppRoutes() {
  const { isAuthed, isAdmin, isRestoringSession } = useAuth();
  const matchStats = useMatchStats();

  // During session restore, show a loading panel instead of redirecting —
  // otherwise a hard refresh on /leaderboard would bounce the user to /
  const authGuard = (element) => {
    if (isRestoringSession) return <main className={MAIN}><LoadingPanel label="Loading" /></main>;
    if (!isAuthed) return <Navigate to="/" replace />;
    return element;
  };

  return (
    <div className="min-h-screen">
      <AppHeader />

      <Routes>
        <Route
          path="/admin"
          element={
            isRestoringSession ? <main className={MAIN}><LoadingPanel label="Loading" /></main>
            : !isAuthed || !isAdmin ? <Navigate to="/" replace />
            : <main className={MAIN}><AdminPage onViewStats={matchStats.open} /></main>
          }
        />
        <Route
          path="/leaderboard"
          element={authGuard(
            <main className={MAIN}><LeaderboardPage onViewStats={matchStats.open} /></main>
          )}
        />
        <Route
          path="/reports"
          element={authGuard(<main className={MAIN}><MatchdayReportPage /></main>)}
        />
        <Route
          path="/standings"
          element={authGuard(<main className={MAIN}><StandingsPage /></main>)}
        />
        <Route
          path="/knockout"
          element={authGuard(<main className={MAIN}><KnockoutPage /></main>)}
        />
        <Route
          path="/profile"
          element={authGuard(<ProfilePage />)}
        />
        <Route
          path="/dev/cards"
          element={
            isRestoringSession ? <main className={MAIN}><LoadingPanel label="Loading" /></main>
            : !isAuthed || !isAdmin ? <Navigate to="/" replace />
            : <CardPreviewPage />
          }
        />
        <Route path="/" element={<PredictionsPage onViewStats={matchStats.open} />} />
      </Routes>

      {matchStats.selectedMatch && (
        <MatchStatsDialog
          match={matchStats.selectedMatch}
          stats={matchStats.stats}
          loading={matchStats.loading}
          error={matchStats.error}
          onClose={matchStats.close}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppRoutes />
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;
