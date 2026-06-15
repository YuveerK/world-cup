import { AdminMatchPicker } from '../components/AdminMatchPicker';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPredictionsPanel } from '../components/AdminPredictionsPanel';

export function AdminPage({
  fixtures,
  fixturesById,
  currentUser,
  selectedMatchId,
  setSelectedMatchId,
  rows,
  drafts,
  updateDraft,
  savePrediction,
  savingUserId,
  passwordDrafts,
  updatePasswordDraft,
  savePassword,
  savingPasswordUserId,
  deleteUser,
  deletingUserId,
  loading,
  refresh,
  onViewStats,
}) {
  const selectedMatch = fixturesById.get(String(selectedMatchId));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        rows={rows}
        selectedMatchId={selectedMatchId}
        loading={loading}
        onRefresh={refresh}
      />

      <AdminMatchPicker
        fixtures={fixtures}
        selectedMatch={selectedMatch}
        selectedMatchId={selectedMatchId}
        onSelect={setSelectedMatchId}
        onViewStats={onViewStats}
      />

      <AdminPredictionsPanel
        selectedMatchId={selectedMatchId}
        selectedMatch={selectedMatch}
        currentUser={currentUser}
        rows={rows}
        drafts={drafts}
        updateDraft={updateDraft}
        savePrediction={savePrediction}
        savingUserId={savingUserId}
        passwordDrafts={passwordDrafts}
        updatePasswordDraft={updatePasswordDraft}
        savePassword={savePassword}
        savingPasswordUserId={savingPasswordUserId}
        deleteUser={deleteUser}
        deletingUserId={deletingUserId}
        loading={loading}
      />
    </div>
  );
}
