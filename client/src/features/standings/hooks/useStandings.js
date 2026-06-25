import { useCallback, useEffect, useState } from 'react';
import { getStandings } from '../api/standingsApi';

export function useStandings() {
  const [groups, setGroups] = useState([]);
  const [thirdPlace, setThirdPlace] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStandings();
      setGroups(data.groups);
      setThirdPlace(data.thirdPlace);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { groups, thirdPlace, loading, error, refresh: load };
}
