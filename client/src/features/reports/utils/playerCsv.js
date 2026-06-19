import { displayStatus } from '@/features/matches/utils/matchStatus';
import { teamName, outcomeLabel } from '@/features/matches/utils/matchFormatters';
import { roundPoints } from '@/lib/utils/number';

function buildPlayerCsv(row, fixturesById) {
  const headers = [
    'date', 'home', 'away', 'status',
    'actual_ft', 'actual_ht',
    'predicted_ft', 'predicted_ht',
    'ht_pts', 'ft_pts', 'closest_pts', 'outcome_pts', 'total_pts',
    'outcome',
  ];

  const outcomeOf = (ftHome, ftAway) => {
    if (ftHome == null || ftAway == null) return '';
    if (ftHome > ftAway) return 'home_win';
    if (ftAway > ftHome) return 'away_win';
    return 'draw';
  };

  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const sorted = [...(row.match_points || [])].sort((a, b) => {
    const mA = fixturesById?.get(String(a.match_id));
    const mB = fixturesById?.get(String(b.match_id));
    return new Date(mA?.date || 0) - new Date(mB?.date || 0);
  });

  const dataRows = sorted.map((entry) => {
    const match = fixturesById?.get(String(entry.match_id));
    const pred = entry.prediction || {};
    const res = entry.result || {};
    const status = match ? displayStatus(match) : (entry.scored ? 'FINISHED' : 'UPCOMING');

    const actualFt = res.ft_home != null
      ? `${res.ft_home}-${res.ft_away}`
      : match?.home_score != null ? `${match.home_score}-${match.away_score}` : '';
    const actualHt = res.ht_home != null ? `${res.ht_home}-${res.ht_away}` : '';
    const predFt = pred.ft_home != null ? `${pred.ft_home}-${pred.ft_away}` : '';
    const predHt = pred.ht_home != null ? `${pred.ht_home}-${pred.ht_away}` : '';

    const ftHome = res.ft_home ?? match?.home_score;
    const ftAway = res.ft_away ?? match?.away_score;

    return [
      match?.date ? new Date(match.date).toISOString().slice(0, 10) : '',
      teamName(match?.home) || `Match #${entry.match_id}`,
      teamName(match?.away) || '',
      status,
      actualFt,
      actualHt,
      predFt,
      predHt,
      roundPoints(entry.ht_pts || 0),
      roundPoints(entry.ft_pts || 0),
      roundPoints(entry.closest_pts || 0),
      roundPoints(entry.outcome_pts || 0),
      roundPoints(entry.match_total || 0),
      outcomeOf(ftHome, ftAway),
    ].map(escape).join(',');
  });

  return [headers.join(','), ...dataRows].join('\n');
}

export { buildPlayerCsv };

export function downloadPlayerCsv(row, fixturesById) {
  const csv = buildPlayerCsv(row, fixturesById);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${row.username}_predictions_wc2026.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
