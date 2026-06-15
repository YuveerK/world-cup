import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '@/api';
import { isRealTeam } from '@/features/matches/utils/matchFormatters';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [fixtures, setFixtures] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fixturesById = useMemo(
    () => new Map(fixtures.map((m) => [String(m.id), m])),
    [fixtures],
  );

  const teams = useMemo(() => {
    const byName = new Map();
    fixtures.forEach((match) => {
      [match.home, match.away].forEach((team) => {
        if (isRealTeam(team) && !byName.has(team.name)) byName.set(team.name, team);
      });
    });
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [fixtures]);

  // Core fetch — throws on failure so callers can decide how to surface errors
  const doFetch = useCallback(async () => {
    const [fixturesData, leaderboardData] = await Promise.all([
      apiRequest('/fixtures'),
      apiRequest('/leaderboard'),
    ]);
    setFixtures(fixturesData.matches || []);
    setLeaderboard(leaderboardData.leaderboard || []);
    setError(null);
  }, []);

  // Explicit refresh (initial load + Refresh buttons): surfaces errors
  const refresh = useCallback(async () => {
    try {
      await doFetch();
    } catch (err) {
      setError(err?.message || 'Could not load data');
    }
  }, [doFetch]);

  // Initial load
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // 30s silent poll — pauses when tab is hidden or a score field is focused;
  // uses doFetch directly so transient network hiccups don't overwrite the error state
  useEffect(() => {
    const isEditingScore = () => document.activeElement?.classList?.contains('score-field');

    async function silentRefresh() {
      if (document.visibilityState !== 'visible' || isEditingScore()) return;
      try { await doFetch(); } catch { /* silent — don't disturb the UI mid-session */ }
    }

    const id = setInterval(silentRefresh, 30_000);

    function onVisibility() {
      if (document.visibilityState === 'visible') silentRefresh();
    }
    function onFocusOut(e) {
      const leftScore = e.target?.classList?.contains('score-field');
      const enteringScore = e.relatedTarget?.classList?.contains('score-field');
      if (leftScore && !enteringScore) silentRefresh();
    }

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('focusout', onFocusOut);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [doFetch]);

  return (
    <AppDataContext.Provider value={{ fixtures, fixturesById, teams, leaderboard, loading, error, refresh }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
