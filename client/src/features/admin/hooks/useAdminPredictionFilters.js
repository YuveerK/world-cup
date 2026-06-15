import { useMemo, useState } from 'react';
import { getAdminPredictionStats } from '../utils/adminPredictionStats';

export function useAdminPredictionFilters(rows = []) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const stats = useMemo(() => getAdminPredictionStats(rows), [rows]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (q && !row.user.username.toLowerCase().includes(q)) return false;
      if (filter === 'predicted' && !row.prediction) return false;
      if (filter === 'missing' && row.prediction) return false;
      return true;
    });
  }, [rows, query, filter]);

  return {
    query,
    setQuery,
    filter,
    setFilter,
    stats,
    visibleRows,
  };
}
