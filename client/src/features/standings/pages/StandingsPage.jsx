import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useStandings } from '../hooks/useStandings';
import { StandingsPageHeader } from '../components/StandingsPageHeader';
import { StandingsGroupCard } from '../components/StandingsGroupCard';

export function StandingsPage() {
  const { groups, loading, error, refresh } = useStandings();

  if (loading) return <LoadingPanel label="Loading standings" />;

  if (error) {
    return <EmptyState title="Could not load standings" detail={error} />;
  }

  if (!groups.length) {
    return (
      <EmptyState
        title="No standings available"
        detail="Check back once the group stage begins."
      />
    );
  }

  return (
    <div className="space-y-6">
      <StandingsPageHeader onRefresh={refresh} />

      <div className="grid gap-5">
        {groups.map((group, i) => (
          <StandingsGroupCard
            key={group.id || group.name}
            group={group}
            animationDelay={i * 40}
          />
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">
        Data sourced from the{' '}
        <span className="font-medium text-slate-500">FIFA official API</span>
        {' | '}
        <span className="inline-block h-2 w-2 bg-emerald-500 align-middle" aria-hidden="true" />{' '}
        Advances to Round of 16
      </p>
    </div>
  );
}
