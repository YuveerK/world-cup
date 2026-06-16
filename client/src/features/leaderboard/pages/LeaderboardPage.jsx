import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { useAuth } from '@/app/providers/AuthContext';
import { useAppData } from '@/app/providers/AppDataContext';
import { LeaderboardPageHeader } from '../components/LeaderboardPageHeader';
import { LeaderboardRankings } from '../components/LeaderboardRankings';
import { LeaderboardSummary } from '../components/LeaderboardSummary';
import { useLeaderboardSummary } from '../hooks/useLeaderboardSummary';

export function LeaderboardPage({ onViewStats }) {
  const { user: currentUser } = useAuth();
  const { leaderboard, fixturesById, loading, error, refresh } = useAppData();

  const { leader, scoredPredictions, maxPoints } = useLeaderboardSummary(leaderboard);

  if (loading) return <LoadingPanel label="Loading leaderboard" />;

  if (!leaderboard.length) {
    return (
      <EmptyState
        title={error ? 'Could not load leaderboard' : 'No leaderboard yet'}
        detail={error || 'Players will appear after accounts and predictions are created.'}
      />
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <LeaderboardPageHeader onRefresh={refresh} />

      <LeaderboardSummary
        leader={leader}
        playerCount={leaderboard.length}
        scoredPredictions={scoredPredictions}
        currentUser={currentUser}
        leaderboard={leaderboard}
      />

      <LeaderboardRankings
        leaderboard={leaderboard}
        fixturesById={fixturesById}
        currentUser={currentUser}
        maxPoints={maxPoints}
        onViewStats={onViewStats}
      />
    </div>
  );
}
