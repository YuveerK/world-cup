import { outcomeLabel } from '@/features/matches/utils/matchFormatters';
import { hasMatchScore, scoreStatusLabel, scoreText } from '@/features/matches/utils/matchStatus';
import { roundPoints } from '@/lib/utils/number';

export function predictionText(prediction) {
  if (!prediction) return 'No prediction';
  const ht = prediction.ht_home != null && prediction.ht_away != null
    ? `HT ${prediction.ht_home}-${prediction.ht_away}`
    : 'HT not entered';
  return `${ht} / FT ${prediction.ft_home}-${prediction.ft_away}`;
}

export function resultText(entry, match) {
  if (entry?.result) {
    const ht = entry.result.ht_home != null && entry.result.ht_away != null
      ? `HT ${entry.result.ht_home}-${entry.result.ht_away}`
      : 'HT unavailable';
    return `${ht} / FT ${entry.result.ft_home}-${entry.result.ft_away}`;
  }
  if (hasMatchScore(match)) return `${scoreStatusLabel(match)} ${scoreText(match)}`;
  return 'Pending result';
}

export function resultOutcome(entry, match) {
  const ftHome = entry?.result?.ft_home ?? match?.score?.home;
  const ftAway = entry?.result?.ft_away ?? match?.score?.away;
  if (ftHome == null || ftAway == null) return null;
  return outcomeLabel(Number(ftHome), Number(ftAway));
}

export function predictionOutcome(prediction) {
  if (!prediction) return null;
  return outcomeLabel(Number(prediction.ft_home), Number(prediction.ft_away));
}

export function scoreDistance(entry) {
  const prediction = entry?.prediction;
  const result = entry?.result;
  if (!prediction || !result) return null;
  return Math.abs(prediction.ft_home - result.ft_home) + Math.abs(prediction.ft_away - result.ft_away);
}

export function summaryPlayerKey(row) {
  if (!row) return '';
  return String(row.id ?? row.username);
}
