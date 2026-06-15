import { useEffect, useState } from 'react';
import { getPredictionsForMatch } from '../api/predictionsApi';

export function useMatchPredictionsSheet(token) {
  const [match, setMatch] = useState(null);
  const [rows, setRows] = useState([]);
  const [actualResult, setActualResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.style.overflow = match ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [match]);

  async function open(nextMatch) {
    setMatch(nextMatch);
    setRows([]);
    setActualResult(null);
    setError(null);
    setLoading(true);

    try {
      const data = await getPredictionsForMatch(nextMatch.id, token);
      setRows(data.rows);
      setActualResult(data.actualResult);
    } catch (err) {
      setError(err.message || 'Could not load predictions.');
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setMatch(null);
    setRows([]);
    setActualResult(null);
    setError(null);
  }

  return {
    match,
    rows,
    actualResult,
    loading,
    error,
    open,
    close,
  };
}
