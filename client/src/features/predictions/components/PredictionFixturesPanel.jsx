import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { usePredictionDayGroups } from '../hooks/usePredictionDayGroups';
import { MatchControls } from './MatchControls';
import { MatchDayNav } from './MatchDayNav';
import { PredictionDaySection } from './PredictionDaySection';

export function PredictionFixturesPanel({
  loading,
  visibleFixtures,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  refreshAll,
  drafts,
  updateDraft,
  savePrediction,
  predictionsByMatch,
  pointsByMatch,
  savingMatchId,
  onViewStats,
  onViewPredictions,
}) {
  const {
    dayGroups,
    activeDay,
    setSelectedDay,
    groupsToRender,
  } = usePredictionDayGroups(visibleFixtures);

  return (
    <>
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
            <PredictionDaySection
              key={group.key}
              group={group}
              drafts={drafts}
              updateDraft={updateDraft}
              savePrediction={savePrediction}
              predictionsByMatch={predictionsByMatch}
              pointsByMatch={pointsByMatch}
              savingMatchId={savingMatchId}
              onViewStats={onViewStats}
              onViewPredictions={onViewPredictions}
            />
          ))}
        </div>
      ) : (
        <EmptyState title="No matches found" detail="Adjust the search or status filter." />
      )}
    </>
  );
}
