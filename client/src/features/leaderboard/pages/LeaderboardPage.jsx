import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { LeaderboardPageHeader } from '../components/LeaderboardPageHeader';
import { LeaderboardRankings } from '../components/LeaderboardRankings';
import { LeaderboardSummary } from '../components/LeaderboardSummary';
import { useLeaderboardSummary } from '../hooks/useLeaderboardSummary';

export function LeaderboardPage({
  leaderboard = [],
  fixturesById,
  currentUser,
  loading,
  refreshAll,
  onViewStats,
}) {
  const { leader, scoredPredictions, maxPoints } = useLeaderboardSummary(leaderboard);

  if (loading) return <LoadingPanel label="Loading leaderboard" />;

  if (!leaderboard.length) {
    return <EmptyState title="No leaderboard yet" detail="Players will appear after accounts and predictions are created." />;
  }

  return (
    <div className="space-y-6">
      <LeaderboardPageHeader onRefresh={refreshAll} />

      <LeaderboardSummary
        leader={leader}
        playerCount={leaderboard.length}
        scoredPredictions={scoredPredictions}
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
