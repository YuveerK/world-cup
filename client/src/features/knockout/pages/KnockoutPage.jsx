import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useKnockout } from '../hooks/useKnockout';
import { KnockoutPageHeader } from '../components/KnockoutPageHeader';
import { KnockoutBracket } from '../components/KnockoutBracket';

export function KnockoutPage() {
  const { data, loading, error, refresh } = useKnockout();

  if (loading) return <LoadingPanel label="Loading bracket" />;

  if (error) {
    return <EmptyState title="Could not load bracket" detail={error} />;
  }

  if (!data || !data.rounds?.length) {
    return (
      <EmptyState
        title="No bracket data available"
        detail="Check back once the knockout stage begins."
      />
    );
  }

  return (
    <div className="space-y-6">
      <KnockoutPageHeader onRefresh={refresh} />
      <KnockoutBracket rounds={data.rounds} />
    </div>
  );
}
