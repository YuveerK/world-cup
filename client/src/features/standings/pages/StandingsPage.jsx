import { useMemo, useState } from 'react';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { EmptyState } from '@/components/feedback/EmptyState';
import { useAppData } from '@/app/providers/AppDataContext';
import { useStandings } from '../hooks/useStandings';
import { StandingsPageHeader } from '../components/StandingsPageHeader';
import { StandingsGroupCard } from '../components/StandingsGroupCard';
import { ThirdPlaceTable } from '../components/ThirdPlaceTable';
import { TeamResultsSheet } from '../components/TeamResultsSheet';

export function StandingsPage() {
  const { groups, thirdPlace, loading, error, refresh } = useStandings();
  const { fixtures } = useAppData();
  const [selected, setSelected] = useState(null); // { row, groupName }

  const teamMatches = useMemo(() => {
    if (!selected) return [];
    const { team } = selected.row;
    return fixtures
      .filter(
        (m) =>
          m.home?.name === team.name ||
          m.away?.name === team.name ||
          m.home?.abbreviation === team.code ||
          m.away?.abbreviation === team.code,
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selected, fixtures]);

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
    <>
      <div className="space-y-6">
        <StandingsPageHeader onRefresh={refresh} />

        <div className="grid gap-5">
          {groups.map((group, i) => (
            <StandingsGroupCard
              key={group.id || group.name}
              group={group}
              animationDelay={i * 40}
              onTeamClick={(row, groupName) => setSelected({ row, groupName })}
            />
          ))}
        </div>

        <ThirdPlaceTable teams={thirdPlace} animationDelay={groups.length * 40} />

        <p className="text-center text-xs text-slate-400">
          Data sourced from the{' '}
          <span className="font-medium text-slate-500">FIFA official API</span>
          {' | '}
          <span className="inline-block h-2 w-2 bg-emerald-500 align-middle" aria-hidden="true" />{' '}
          Advances to Round of 16
          {' | '}
          <span className="inline-block h-2 w-2 rounded-full bg-blue-500 align-middle" aria-hidden="true" />{' '}
          Advances as best third-placed
        </p>
      </div>

      <TeamResultsSheet
        team={selected?.row.team}
        row={selected?.row}
        groupName={selected?.groupName}
        matches={teamMatches}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
