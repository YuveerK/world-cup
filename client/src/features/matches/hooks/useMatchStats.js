import { useCallback, useEffect, useRef, useState } from 'react';
import { getMatchStats } from '../api/matchesApi';

const LIVE_STATS_POLL_MS = 15_000;

function isLiveMatch(match, stats) {
  return stats?.status ? stats.status === 'LIVE' : match?.status === 'LIVE';
}

export function useMatchStats() {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async (match, { showLoading = false, quiet = false } = {}) => {
    if (!match) return;
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    if (showLoading) {
      setStats(null);
      setError(null);
      setLoading(true);
    }

    try {
      const data = await getMatchStats(match.id, match.stageId);
      if (requestId.current !== currentRequest) return;
      setStats(data.stats);
      setError(null);
    } catch (err) {
      if (requestId.current !== currentRequest || quiet) return;
      setError(err.message);
    } finally {
      if (requestId.current === currentRequest && showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const open = useCallback((match) => {
    setSelectedMatch(match);
    load(match, { showLoading: true });
  }, [load]);

  const close = useCallback(() => {
    requestId.current += 1;
    setSelectedMatch(null);
    setStats(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedMatch || loading || !isLiveMatch(selectedMatch, stats)) return undefined;

    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      load(selectedMatch, { quiet: true });
    };

    const intervalId = window.setInterval(refresh, LIVE_STATS_POLL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') refresh();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [load, loading, selectedMatch, stats?.status]);

  return { selectedMatch, stats, loading, error, open, close };
}
