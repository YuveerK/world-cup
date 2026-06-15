import { useEffect, useState } from 'react';
import { apiRequest } from '@/api';
import { Notice } from '@/components/feedback/Notice';
import { useAuth } from '@/app/providers/AuthContext';
import { useAppData } from '@/app/providers/AppDataContext';
import { parseScore } from '@/lib/utils/number';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { AdminMatchPicker } from '../components/AdminMatchPicker';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { AdminPredictionsPanel } from '../components/AdminPredictionsPanel';

export function AdminPage({ onViewStats }) {
  const { token, user } = useAuth();
  const { fixtures, fixturesById } = useAppData();

  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [rows, setRows] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [savingPasswordUserId, setSavingPasswordUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (notice?.type === 'success') {
      const t = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  // Auto-select first upcoming match with known teams
  useEffect(() => {
    if (selectedMatchId || !fixtures.length) return;
    const first = [...fixtures]
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      .find((m) => m.home?.name && m.away?.name);
    if (first) setSelectedMatchId(String(first.id));
  }, [fixtures, selectedMatchId]);

  useEffect(() => {
    if (!selectedMatchId) return;
    loadAdminPredictions(selectedMatchId);
  }, [selectedMatchId]);

  async function loadAdminPredictions(matchId) {
    setLoading(true);
    try {
      const data = await apiRequest(`/admin/predictions/${matchId}`, { token });
      const newRows = data.rows || [];
      setRows(newRows);
      setDrafts(() => {
        const next = {};
        newRows.forEach((row) => {
          next[row.user.id] = {
            ht_home: row.prediction?.ht_home != null ? String(row.prediction.ht_home) : '',
            ht_away: row.prediction?.ht_away != null ? String(row.prediction.ht_away) : '',
            ft_home: row.prediction?.ft_home != null ? String(row.prediction.ft_home) : '',
            ft_away: row.prediction?.ft_away != null ? String(row.prediction.ft_away) : '',
          };
        });
        return next;
      });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(userId, field, value) {
    const clean = value === '' ? '' : String(Math.max(0, Number.parseInt(value, 10) || 0));
    setDrafts((c) => ({ ...c, [userId]: { ...(c[userId] || {}), [field]: clean } }));
  }

  function updatePasswordDraft(userId, value) {
    setPasswordDrafts((c) => ({ ...c, [userId]: value }));
  }

  async function savePrediction(userId) {
    const match = fixturesById.get(String(selectedMatchId));
    const draft = drafts[userId] || {};
    const ftHome = parseScore(draft.ft_home);
    const ftAway = parseScore(draft.ft_away);
    const htHome = parseScore(draft.ht_home);
    const htAway = parseScore(draft.ht_away);

    if (!selectedMatchId || !match) {
      setNotice({ type: 'error', message: 'Choose a match first.' });
      return;
    }
    if (ftHome === null || ftAway === null) {
      setNotice({ type: 'error', message: 'Full-time home and away scores are required.' });
      return;
    }
    if ((htHome === null) !== (htAway === null)) {
      setNotice({ type: 'error', message: 'Add both half-time scores, or leave both blank.' });
      return;
    }

    setSavingUserId(userId);
    setNotice(null);
    try {
      const body = { ft_home: ftHome, ft_away: ftAway };
      if (htHome !== null && htAway !== null) { body.ht_home = htHome; body.ht_away = htAway; }
      await apiRequest(`/admin/users/${userId}/predict/${selectedMatchId}`, { method: 'POST', token, body });
      await loadAdminPredictions(selectedMatchId);
      setNotice({ type: 'success', message: `Admin prediction saved for ${teamName(match.home)} vs ${teamName(match.away)}.` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSavingUserId(null);
    }
  }

  async function savePassword(userId, username) {
    const password = (passwordDrafts[userId] || '').trim();
    if (password.length < 8) {
      setNotice({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    setSavingPasswordUserId(userId);
    setNotice(null);
    try {
      await apiRequest(`/admin/users/${userId}/password`, { method: 'PUT', token, body: { password } });
      setPasswordDrafts((c) => ({ ...c, [userId]: '' }));
      setNotice({ type: 'success', message: `Password reset for ${username}.` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSavingPasswordUserId(null);
    }
  }

  async function deleteUser(userId, username) {
    setDeletingUserId(userId);
    setNotice(null);
    try {
      await apiRequest(`/admin/users/${userId}`, { method: 'DELETE', token });
      setDrafts((c) => { const n = { ...c }; delete n[userId]; return n; });
      setPasswordDrafts((c) => { const n = { ...c }; delete n[userId]; return n; });
      await loadAdminPredictions(selectedMatchId);
      setNotice({ type: 'success', message: `${username} and related data were deleted.` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setDeletingUserId(null);
    }
  }

  const selectedMatch = fixturesById.get(String(selectedMatchId));

  return (
    <div className="space-y-6">
      {notice && <Notice notice={notice} />}

      <AdminPageHeader
        rows={rows}
        selectedMatchId={selectedMatchId}
        loading={loading}
        onRefresh={() => loadAdminPredictions(selectedMatchId)}
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
        currentUser={user}
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
