import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/api';
import { Notice } from '@/components/feedback/Notice';
import { LoadingPanel } from '@/components/feedback/LoadingPanel';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { useAuth } from '@/app/providers/AuthContext';
import { useAppData } from '@/app/providers/AppDataContext';
import { parseScore } from '@/lib/utils/number';
import { teamName } from '@/features/matches/utils/matchFormatters';
import { MatchPredictionsSheet } from '../components/MatchPredictionsSheet';
import { PredictionFixturesPanel } from '../components/PredictionFixturesPanel';
import { SummaryStrip } from '../components/SummaryStrip';
import { WinnerPicker } from '../components/WinnerPicker';
import { useMatchPredictionsSheet } from '../hooks/useMatchPredictionsSheet';
import { usePredictionFilters } from '../hooks/usePredictionFilters';
import { usePredictionDrafts } from '../hooks/usePredictionDrafts';

export function PredictionsPage({ onViewStats }) {
  const { user, setUser, token, isAuthed, isRestoringSession, login, logout } = useAuth();
  const { fixtures, leaderboard, teams, loading: publicLoading, refresh: refreshPublic } = useAppData();

  // Auth form state
  const [authMode, setAuthMode] = useState('login');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState(null);

  // Private data state
  const [predictions, setPredictions] = useState([]);
  const [points, setPoints] = useState([]);
  const [winnerPick, setWinnerPick] = useState(user?.winner || user?.pick1 || '');
  const [savingMatchId, setSavingMatchId] = useState(null);
  const [savingWinner, setSavingWinner] = useState(false);
  const [notice, setNotice] = useState(null);

  const { drafts, updateDraft } = usePredictionDrafts(predictions);
  const { query, setQuery, statusFilter, setStatusFilter, visibleFixtures } = usePredictionFilters(fixtures);
  const matchPredictions = useMatchPredictionsSheet(token);

  // Sync winnerPick when user object changes (login / session restore)
  useEffect(() => {
    setWinnerPick(user?.winner || user?.pick1 || '');
  }, [user?.winner, user?.pick1]);

  // Clear all private state on logout so a second user can't see previous user's data
  useEffect(() => {
    if (isAuthed) return;
    setPredictions([]);
    setPoints([]);
    setWinnerPick('');
  }, [isAuthed]);

  useEffect(() => {
    if (notice?.type === 'success') {
      const t = setTimeout(() => setNotice(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  const predictionsByMatch = useMemo(
    () => new Map(predictions.map((p) => [String(p.match_id), p])),
    [predictions],
  );

  const pointsByMatch = useMemo(
    () => new Map(points.map((p) => [String(p.match_id), p])),
    [points],
  );

  const totals = useMemo(() => points.reduce(
    (acc, p) => {
      acc.ht += p.ht_pts || 0;
      acc.ft += p.ft_pts || 0;
      acc.closest += p.closest_pts || 0;
      acc.outcome += p.outcome_pts || 0;
      return acc;
    },
    { ht: 0, ft: 0, closest: 0, outcome: 0 },
  ), [points]);

  const loadPrivateData = useCallback(async (activeToken = token) => {
    if (!activeToken) return;
    const [predData, pointData] = await Promise.all([
      apiRequest('/predictions/my', { token: activeToken }),
      apiRequest('/predictions/my/points', { token: activeToken }),
    ]);
    setPredictions(predData.predictions || []);
    setPoints(pointData.points || []);
  }, [token]);

  // Fetch private data on mount and when auth state changes
  useEffect(() => {
    if (!isAuthed) return;
    loadPrivateData();
  }, [isAuthed, loadPrivateData]);

  // 30s silent poll — keeps scores and points in sync as matches are scored
  // Pauses when the tab is hidden or a score field is focused
  useEffect(() => {
    if (!isAuthed) return;

    const isEditingScore = () => document.activeElement?.classList?.contains('score-field');

    async function silentRefresh() {
      if (document.visibilityState !== 'visible' || isEditingScore()) return;
      try {
        await loadPrivateData();
      } catch (err) {
        if (/Unauthorized|Invalid token/i.test(err.message)) logout();
      }
    }

    const id = setInterval(silentRefresh, 30_000);

    const onVisibility = () => { if (document.visibilityState === 'visible') silentRefresh(); };
    const onFocusOut = (e) => {
      const leftScore = e.target?.classList?.contains('score-field');
      const enteringScore = e.relatedTarget?.classList?.contains('score-field');
      if (leftScore && !enteringScore) silentRefresh();
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('focusout', onFocusOut);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [isAuthed, loadPrivateData, logout]);

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setAuthNotice(null);
    try {
      const path = authMode === 'signup' ? '/auth/signup' : '/auth/login';
      const data = await apiRequest(path, { method: 'POST', body: credentials });
      login(data);
      await Promise.all([
        loadPrivateData(data.token),
        refreshPublic(),
      ]);
    } catch (err) {
      setAuthNotice({ type: 'error', message: err.message });
    } finally {
      setBusy(false);
    }
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
      await Promise.all([loadPrivateData(), refreshPublic()]);
      setNotice({ type: 'success', message: `${teamName(match.home)} vs ${teamName(match.away)} saved.` });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSavingMatchId(null);
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
      // Patch user in AuthContext immediately — /auth/picks returns only { success: true }
      setUser((u) => ({ ...u, winner: winnerPick, pick1: winnerPick }));
      await loadPrivateData();
      setNotice({ type: 'success', message: 'Overall winner saved.' });
    } catch (err) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setSavingWinner(false);
    }
  }

  function refreshAll() {
    loadPrivateData();
    refreshPublic();
  }

  if (!isAuthed && !isRestoringSession) {
    return (
      <div className="fixed inset-0 z-50 overflow-auto">
        <AuthCard
          authMode={authMode}
          setAuthMode={setAuthMode}
          credentials={credentials}
          setCredentials={setCredentials}
          handleAuth={handleAuth}
          busy={busy}
          notice={authNotice}
        />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="min-w-0 space-y-6">
        {notice && <Notice notice={notice} />}

        {isRestoringSession ? (
          <LoadingPanel label="Restoring session" />
        ) : (
          <>
            <SummaryStrip
              user={user}
              predictions={predictions}
              totals={totals}
              leaderboard={leaderboard}
            />

            <WinnerPicker
              user={user}
              teams={teams}
              winnerPick={winnerPick}
              setWinnerPick={setWinnerPick}
              saveWinnerPick={saveWinnerPick}
              savingWinner={savingWinner}
            />

            <PredictionFixturesPanel
              loading={publicLoading}
              visibleFixtures={visibleFixtures}
              query={query}
              setQuery={setQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              refreshAll={refreshAll}
              drafts={drafts}
              updateDraft={updateDraft}
              savePrediction={savePrediction}
              predictionsByMatch={predictionsByMatch}
              pointsByMatch={pointsByMatch}
              savingMatchId={savingMatchId}
              onViewStats={onViewStats}
              onViewPredictions={matchPredictions.open}
            />
          </>
        )}
      </section>

      <MatchPredictionsSheet
        match={matchPredictions.match}
        rows={matchPredictions.rows}
        currentUser={user}
        actualResult={matchPredictions.actualResult}
        loading={matchPredictions.loading}
        error={matchPredictions.error}
        onClose={matchPredictions.close}
      />
    </main>
  );
}
