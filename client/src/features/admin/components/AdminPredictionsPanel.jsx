import { EmptyState } from '@/components/feedback/EmptyState';
import { LoadingRows } from '@/components/feedback/LoadingPanel';
import { useAdminPredictionFilters } from '../hooks/useAdminPredictionFilters';
import { AdminPredictionRow } from './AdminPredictionRow';
import { AdminPredictionsToolbar } from './AdminPredictionsToolbar';

export function AdminPredictionsPanel({
  selectedMatchId,
  selectedMatch,
  currentUser,
  rows = [],
  drafts = {},
  updateDraft,
  savePrediction,
  savingUserId,
  passwordDrafts = {},
  updatePasswordDraft,
  savePassword,
  savingPasswordUserId,
  deleteUser,
  deletingUserId,
  loading,
}) {
  const {
    query,
    setQuery,
    filter,
    setFilter,
    stats,
    visibleRows,
  } = useAdminPredictionFilters(rows);

  if (!selectedMatchId) {
    return (
      <div className="panel p-8">
        <EmptyState title="Choose a match" detail="Select a fixture above to load and edit every player's prediction." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="panel p-5">
        <LoadingRows />
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="panel p-8">
        <EmptyState title="No users found" detail="Create users before managing predictions." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPredictionsToolbar
        query={query}
        setQuery={setQuery}
        filter={filter}
        setFilter={setFilter}
        stats={stats}
      />

      {visibleRows.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleRows.map((row) => (
            <AdminPredictionRow
              key={row.user.id}
              row={row}
              match={selectedMatch}
              currentUser={currentUser}
              draft={drafts[row.user.id] || {}}
              updateDraft={updateDraft}
              savePrediction={savePrediction}
              saving={savingUserId === row.user.id}
              passwordDraft={passwordDrafts[row.user.id] || ''}
              updatePasswordDraft={updatePasswordDraft}
              savePassword={savePassword}
              savingPassword={savingPasswordUserId === row.user.id}
              deleteUser={deleteUser}
              deleting={deletingUserId === row.user.id}
            />
          ))}
        </div>
      ) : (
        <div className="panel p-8">
          <EmptyState title="No players match" detail="Try a different search or filter." />
        </div>
      )}
    </div>
  );
}
