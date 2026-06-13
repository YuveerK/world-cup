import { useState, useMemo } from 'react';

export function usePredictionFilters(fixtures) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const visibleFixtures = useMemo(() => {
    const q = query.trim().toLowerCase();
    return fixtures
      .filter(m => statusFilter === 'ALL' || m.status === statusFilter)
      .filter(m => !q || [m.home?.name, m.away?.name, m.group, m.stage, m.city].filter(Boolean).some(v => v.toLowerCase().includes(q)))
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  }, [fixtures, query, statusFilter]);

  return { query, setQuery, statusFilter, setStatusFilter, visibleFixtures };
}
