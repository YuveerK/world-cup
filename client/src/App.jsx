import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from './api';
import { AppHeader } from '@/app/layout/AppHeader';
import { Notice } from '@/components/feedback/Notice';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { MatchStatsDialog } from '@/features/matches/components/MatchStatsDialog';
import { useMatchStats } from '@/features/matches/hooks/useMatchStats';
import { usePredictionFilters } from '@/features/predictions/hooks/usePredictionFilters';
import { usePredictionDrafts } from '@/features/predictions/hooks/usePredictionDrafts';
import { PredictionsPage } from '@/features/predictions/pages/PredictionsPage';
import { LeaderboardPage } from '@/features/leaderboard/pages/LeaderboardPage';
import { MatchdayReportPage } from '@/features/reports/pages/MatchdayReportPage';
import { AdminPage } from '@/features/admin/pages/AdminPage';
import { ProfilePage } from '@/features/account/pages/ProfilePage';
import { isRealTeam } from '@/features/matches/utils/matchFormatters';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { parseScore } from '@/lib/utils/number';
import { getStoredToken, storeToken, clearStoredToken } from '@/lib/storage/tokenStorage';
import { CardPreviewPage } from '@/dev/CardPreviewPage';

function App() {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [points, setPoints] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [winnerPick, setWinnerPick] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [adminMatchId, setAdminMatchId] = useState('');
  const [adminRows, setAdminRows] = useState([]);
  const [adminDrafts, setAdminDrafts] = useState({});
  const [adminPasswordDrafts, setAdminPasswordDrafts] = useState({});
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSavingUserId, setAdminSavingUserId] = useState(null);
  const [adminPasswordSavingUserId, setAdminPasswordSavingUserId] = useState(null);
  const [adminDeletingUserId, setAdminDeletingUserId] = useState(null);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [usernameForm, setUsernameForm] = useState({ username: '', currentPassword: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingMatchId, setSavingMatchId] = useState(null);
  const [savingWinner, setSavingWinner] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notice, setNotice] = useState(null);

  const matchStats = useMatchStats();
  const { drafts, updateDraft } = usePredictionDrafts(predictions);
  const { query, setQuery, statusFilter, setStatusFilter, visibleFixtures } = usePredictionFilters(fixtures);

  const location = useLocation();
  const navigate = useNavigate();

  // Clear notice whenever the user navigates to a different page
  useEffect(() => { setNotice(null); }, [location.pathname]);

  // Auto-dismiss success notices after 3 seconds
  useEffect(() => {
    if (notice?.type === 'success') {
      const t = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  const isAuthed = Boolean(token && user);
  const isRestoringSession = Boolean(token && !user && loading);
  const isAdmin = Boolean(user?.isAdmin);

  const predictionsByMatch = useMemo(() => {
    return new Map(predictions.map((p) => [String(p.match_id), p]));
  }, [predictions]);

  const pointsByMatch = useMemo(() => {
    return new Map(points.map((p) => [String(p.match_id), p]));
  }, [points]);

  const teams = useMemo(() => {
    const byName = new Map();
    fixtures.forEach((match) => {
      [match.home, match.away].forEach((team) => {
        if (isRealTeam(team) && !byName.has(team.name)) byName.set(team.name, team);
      });
    });
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [fixtures]);

  const fixturesById = useMemo(() => {
    return new Map(fixtures.map((match) => [String(match.id), match]));
  }, [fixtures]);

  const totals = useMemo(() => {
    return points.reduce(
      (acc, p) => {
        acc.ht += p.ht_pts || 0;
        acc.ft += p.ft_pts || 0;
        acc.closest += p.closest_pts || 0;
        acc.outcome += p.outcome_pts || 0;
        return acc;
      },
      { ht: 0, ft: 0, closest: 0, outcome: 0 },
    );
  }, [points]);

  async function loadPublicData() {
    const [fixturesData, leaderboardData] = await Promise.all([
      apiRequest('/fixtures'),
      apiRequest('/leaderboard'),
    ]);
    setFixtures(fixturesData.matches || []);
    setLeaderboard(leaderboardData.leaderboard || []);
  }

  async function loadPrivateData(activeToken = token) {
    if (!activeToken) return;
    const [meData, predictionData, pointData] = await Promise.all([
      apiRequest('/auth/me', { token: activeToken }),
      apiRequest('/predictions/my', { token: activeToken }),
      apiRequest('/predictions/my/points', { token: activeToken }),
    ]);
    setUser(meData.user);
    setWinnerPick(meData.user?.winner || meData.user?.pick1 || '');
    setPredictions(predictionData.predictions || []);
    setPoints(pointData.points || []);
  }

  async function refreshAll(activeToken = token) {
    setLoading(true);
    try {
      await loadPublicData();
      if (activeToken) await loadPrivateData(activeToken);
      setNotice(null);
    } catch (error) {
      if (/Unauthorized|Invalid token/i.test(error.message)) logout();
      setNotice({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshAll(token); }, []);

  // Keep scores in sync with the backend, which re-scores every ~30s.
  // Silent background refresh: never toggles the loading state or shows notices,
  // pauses while the tab is hidden, and pauses while a score input is focused
  // so it can never disrupt a prediction the user is mid-entry.
  useEffect(() => {
    const POLL_MS = 30_000;

    const isEditingScore = () => document.activeElement?.classList?.contains('score-field');

    async function silentRefresh() {
      if (document.visibilityState !== 'visible' || isEditingScore()) return;
      try {
        await loadPublicData();
        if (token) await loadPrivateData(token);
      } catch (error) {
        if (/Unauthorized|Invalid token/i.test(error.message)) logout();
      }
    }

    const intervalId = setInterval(silentRefresh, POLL_MS);

    function handleVisibility() {
      if (document.visibilityState === 'visible') silentRefresh();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    // When the user finishes editing scores (focus leaves the score fields for
    // something other than another score field), do an immediate catch-up sync.
    function handleFocusOut(event) {
      const leftScore = event.target?.classList?.contains('score-field');
      const enteringScore = event.relatedTarget?.classList?.contains('score-field');
      if (leftScore && !enteringScore) silentRefresh();
    }
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [token]);

  useEffect(() => {
    if (!user) return;
    setUsernameForm((c) => ({ ...c, username: user.username || '' }));
  }, [user?.username]);

  useEffect(() => {
    if (!isAdmin || location.pathname !== '/admin' || adminMatchId || !fixtures.length) return;
    const first = [...fixtures]
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      .find((match) => match.home?.name && match.away?.name);
    if (first) setAdminMatchId(String(first.id));
  }, [location.pathname, adminMatchId, fixtures, isAdmin]);


  useEffect(() => {
    if (!isAdmin || location.pathname !== '/admin' || !adminMatchId) return;
    loadAdminPredictions(adminMatchId);
  }, [location.pathname, adminMatchId, isAdmin]);

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const path = authMode === 'signup' ? '/auth/signup' : '/auth/login';
      const data = await apiRequest(path, { method: 'POST', body: credentials });
      storeToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setWinnerPick(data.user?.winner || data.user?.pick1 || '');
      await Promise.all([loadPrivateData(data.token), loadPublicData()]);
      setNotice({ type: 'success', message: authMode === 'signup' ? 'Account created.' : 'Signed in.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setPredictions([]);
    setPoints([]);
    setUsernameForm({ username: '', currentPassword: '' });
    setDeletePassword('');
    setWinnerPick('');
    navigate('/');
  }

  async function savePrediction(match) {
    const id = String(match.id);
    const draft = drafts[id] || {};
    const ftHome = parseScore(draft.ft_home);
    const ftAway = parseScore(draft.ft_away);
    const htHome = parseScore(draft.ht_home);
    const htAway = parseScore(draft.ht_away);

    if (ftHome === null || ftAway === null) {
      setNotice({ type: 'error', message: 'Full-time home and away scores are required.' });
      return;
    }
    if ((htHome === null) !== (htAway === null)) {
      setNotice({ type: 'error', message: 'Add both half-time scores, or leave both blank.' });
      return;
    }

    setSavingMatchId(id);
    setNotice(null);
    try {
      const body = { ft_home: ftHome, ft_away: ftAway };
      if (htHome !== null && htAway !== null) { body.ht_home = htHome; body.ht_away = htAway; }
      await apiRequest(`/predictions/${match.id}`, { method: 'POST', token, body });
      await Promise.all([loadPrivateData(token), loadPublicData()]);
      setNotice({ type: 'success', message: `${teamName(match.home)} vs ${teamName(match.away)} saved.` });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setSavingMatchId(null);
    }
  }

  async function loadAdminPredictions(matchId = adminMatchId) {
    if (!isAdmin || !token || !matchId) return;
    setAdminLoading(true);
    try {
      const data = await apiRequest(`/admin/predictions/${matchId}`, { token });
      const rows = data.rows || [];
      setAdminRows(rows);
      setAdminDrafts(() => {
        const next = {};
        rows.forEach((row) => {
          next[row.user.id] = {
            ht_home: row.prediction?.ht_home != null ? String(row.prediction.ht_home) : '',
            ht_away: row.prediction?.ht_away != null ? String(row.prediction.ht_away) : '',
            ft_home: row.prediction?.ft_home != null ? String(row.prediction.ft_home) : '',
            ft_away: row.prediction?.ft_away != null ? String(row.prediction.ft_away) : '',
          };
        });
        return next;
      });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setAdminLoading(false);
    }
  }

  function updateAdminDraft(userId, field, value) {
    const cleanValue = value === '' ? '' : String(Math.max(0, Number.parseInt(value, 10) || 0));
    setAdminDrafts((current) => ({
      ...current,
      [userId]: { ...(current[userId] || {}), [field]: cleanValue },
    }));
  }

  function updateAdminPasswordDraft(userId, value) {
    setAdminPasswordDrafts((current) => ({ ...current, [userId]: value }));
  }

  async function saveAdminPrediction(userId) {
    const match = fixturesById.get(String(adminMatchId));
    const draft = adminDrafts[userId] || {};
    const ftHome = parseScore(draft.ft_home);
    const ftAway = parseScore(draft.ft_away);
    const htHome = parseScore(draft.ht_home);
    const htAway = parseScore(draft.ht_away);

    if (!adminMatchId || !match) {
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

    setAdminSavingUserId(userId);
    setNotice(null);
    try {
      const body = { ft_home: ftHome, ft_away: ftAway };
      if (htHome !== null && htAway !== null) { body.ht_home = htHome; body.ht_away = htAway; }
      await apiRequest(`/admin/users/${userId}/predict/${adminMatchId}`, { method: 'POST', token, body });
      await Promise.all([loadAdminPredictions(adminMatchId), loadPublicData()]);
      if (token) await loadPrivateData(token);
      setNotice({ type: 'success', message: `Admin prediction saved for ${teamName(match.home)} vs ${teamName(match.away)}.` });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setAdminSavingUserId(null);
    }
  }

  async function saveAdminPassword(userId, username) {
    const password = (adminPasswordDrafts[userId] || '').trim();
    if (password.length < 8) {
      setNotice({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    setAdminPasswordSavingUserId(userId);
    setNotice(null);
    try {
      await apiRequest(`/admin/users/${userId}/password`, { method: 'PUT', token, body: { password } });
      setAdminPasswordDrafts((c) => ({ ...c, [userId]: '' }));
      setNotice({ type: 'success', message: `Password reset for ${username}.` });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setAdminPasswordSavingUserId(null);
    }
  }

  async function deleteAdminUser(userId, username) {
    setAdminDeletingUserId(userId);
    setNotice(null);
    try {
      await apiRequest(`/admin/users/${userId}`, { method: 'DELETE', token });
      setAdminDrafts((c) => { const n = { ...c }; delete n[userId]; return n; });
      setAdminPasswordDrafts((c) => { const n = { ...c }; delete n[userId]; return n; });
      await Promise.all([loadAdminPredictions(adminMatchId), loadPublicData()]);
      if (token) await loadPrivateData(token);
      setNotice({ type: 'success', message: `${username} and related data were deleted.` });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setAdminDeletingUserId(null);
    }
  }

  async function saveWinnerPick() {
    if (!winnerPick) {
      setNotice({ type: 'error', message: 'Choose an overall winner.' });
      return;
    }
    setSavingWinner(true);
    setNotice(null);
    try {
      await apiRequest('/auth/picks', { method: 'PUT', token, body: { winner: winnerPick } });
      await loadPrivateData(token);
      setNotice({ type: 'success', message: 'Overall winner saved.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setSavingWinner(false);
    }
  }

  async function changeUsername(event) {
    event.preventDefault();
    const username = usernameForm.username.trim();
    if (username.length < 2) {
      setNotice({ type: 'error', message: 'Username must be at least 2 characters.' });
      return;
    }
    if (!usernameForm.currentPassword) {
      setNotice({ type: 'error', message: 'Enter your current password to change username.' });
      return;
    }
    setSavingUsername(true);
    setNotice(null);
    try {
      const data = await apiRequest('/auth/username', {
        method: 'PUT',
        token,
        body: { username, currentPassword: usernameForm.currentPassword },
      });
      storeToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setUsernameForm({ username: data.user.username, currentPassword: '' });
      await Promise.all([loadPrivateData(data.token), loadPublicData()]);
      setNotice({ type: 'success', message: 'Username updated.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setSavingUsername(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (passwordForm.newPassword.length < 8) {
      setNotice({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotice({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    setSavingPassword(true);
    setNotice(null);
    try {
      const data = await apiRequest('/auth/password', {
        method: 'PUT',
        token,
        body: { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
      });
      if (data.token) { storeToken(data.token); setToken(data.token); }
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setNotice({ type: 'success', message: 'Password updated.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setSavingPassword(false);
    }
  }

  async function deleteOwnAccount(event) {
    event.preventDefault();
    if (!deletePassword) {
      setNotice({ type: 'error', message: 'Enter your current password to delete the account.' });
      return;
    }
    const confirmed = window.confirm(`Delete ${user?.username || 'this account'} and all related predictions and points? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingAccount(true);
    setNotice(null);
    try {
      await apiRequest('/auth/account', { method: 'DELETE', token, body: { currentPassword: deletePassword } });
      logout();
      await loadPublicData();
      setNotice({ type: 'success', message: 'Account and related data were deleted.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setDeletingAccount(false);
    }
  }

  const noticeEl = notice ? <Notice notice={notice} /> : null;

  return (
    <div className="min-h-screen">
      <AppHeader isAuthed={isAuthed || isRestoringSession} isAdmin={isAdmin} onLogout={logout} />

      <Routes>
        <Route
          path="/admin"
          element={
            loading ? (
              <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <LoadingPanel label="Loading" />
              </main>
            ) : !isAuthed || !isAdmin ? (
              <Navigate to="/" replace />
            ) : (
              <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <section className="space-y-6">
                  {noticeEl}
                  <AdminPage
                    fixtures={fixtures}
                    fixturesById={fixturesById}
                    currentUser={user}
                    selectedMatchId={adminMatchId}
                    setSelectedMatchId={setAdminMatchId}
                    rows={adminRows}
                    drafts={adminDrafts}
                    updateDraft={updateAdminDraft}
                    savePrediction={saveAdminPrediction}
                    savingUserId={adminSavingUserId}
                    passwordDrafts={adminPasswordDrafts}
                    updatePasswordDraft={updateAdminPasswordDraft}
                    savePassword={saveAdminPassword}
                    savingPasswordUserId={adminPasswordSavingUserId}
                    deleteUser={deleteAdminUser}
                    deletingUserId={adminDeletingUserId}
                    loading={adminLoading}
                    refresh={() => loadAdminPredictions(adminMatchId)}
                    onViewStats={matchStats.open}
                  />
                </section>
              </main>
            )
          }
        />
        <Route
          path="/leaderboard"
          element={
            loading ? (
              <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <LoadingPanel label="Loading" />
              </main>
            ) : !isAuthed ? (
              <Navigate to="/" replace />
            ) : (
              <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <section className="space-y-6">
                  {noticeEl}
                  <LeaderboardPage
                    leaderboard={leaderboard}
                    fixturesById={fixturesById}
                    currentUser={user}
                    loading={loading}
                    refreshAll={() => refreshAll(token)}
                    onViewStats={matchStats.open}
                  />
                </section>
              </main>
            )
          }
        />
        <Route
          path="/reports"
          element={
            loading ? (
              <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <LoadingPanel label="Loading reports" />
              </main>
            ) : !isAuthed ? (
              <Navigate to="/" replace />
            ) : (
              <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <section className="space-y-6">
                  {noticeEl}
                  <MatchdayReportPage
                    leaderboard={leaderboard}
                    fixtures={fixtures}
                    currentUser={user}
                    loading={loading}
                    refreshAll={() => refreshAll(token)}
                    token={token}
                  />
                </section>
              </main>
            )
          }
        />
        <Route
          path="/profile"
          element={
            isRestoringSession ? (
              <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <LoadingPanel label="Restoring session" />
              </main>
            ) : !isAuthed ? (
              <Navigate to="/" replace />
            ) : (
              <ProfilePage
                user={user}
                notice={noticeEl}
                usernameForm={usernameForm}
                setUsernameForm={setUsernameForm}
                savingUsername={savingUsername}
                onChangeUsername={changeUsername}
                passwordForm={passwordForm}
                setPasswordForm={setPasswordForm}
                savingPassword={savingPassword}
                onChangePassword={changePassword}
                deletePassword={deletePassword}
                setDeletePassword={setDeletePassword}
                deletingAccount={deletingAccount}
                onDeleteAccount={deleteOwnAccount}
              />
            )
          }
        />
        <Route
          path="/dev/cards"
          element={
            !isAuthed || !isAdmin ? <Navigate to="/" replace /> : <CardPreviewPage />
          }
        />

        <Route
          path="/"
          element={
            <PredictionsPage
              notice={noticeEl}
              authNotice={notice}
              isAuthed={isAuthed}
              isRestoringSession={isRestoringSession}
              loading={loading}
              authMode={authMode}
              setAuthMode={setAuthMode}
              credentials={credentials}
              setCredentials={setCredentials}
              handleAuth={handleAuth}
              busy={busy}
              user={user}
              token={token}
              predictions={predictions}
              totals={totals}
              leaderboard={leaderboard}
              fixtures={fixtures}
              visibleFixtures={visibleFixtures}
              predictionsByMatch={predictionsByMatch}
              pointsByMatch={pointsByMatch}
              teams={teams}
              drafts={drafts}
              updateDraft={updateDraft}
              savePrediction={savePrediction}
              savingMatchId={savingMatchId}
              winnerPick={winnerPick}
              setWinnerPick={setWinnerPick}
              saveWinnerPick={saveWinnerPick}
              savingWinner={savingWinner}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              refreshAll={() => refreshAll(token)}
              onViewStats={matchStats.open}
            />
          }
        />
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

export default App;
