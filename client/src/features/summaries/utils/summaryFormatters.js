import { displayStatus, hasMatchScore } from '@/features/matches/utils/matchStatus';
import { scoreText } from '@/features/matches/utils/matchStatus';
import { roundPoints } from '@/lib/utils/number';
import { scoreDistance, predictionOutcome, resultOutcome } from '@/features/predictions/utils/predictionDisplay';

export function halfTimeDetail(entry) {
  const prediction = entry.prediction;
  const result = entry.result;
  if (!entry.scored) return 'Pending until the match is scored.';
  if (!prediction) return 'No prediction was found for this match.';
  if (prediction.ht_home == null || prediction.ht_away == null) return 'No half-time score was submitted.';
  if (!result || result.ht_home == null || result.ht_away == null) {
    return entry.ht_pts ? 'Awarded by the scoring engine.' : 'No exact half-time score was awarded.';
  }
  return `Predicted ${prediction.ht_home}-${prediction.ht_away}; half time was ${result.ht_home}-${result.ht_away}.`;
}

export function fullTimeDetail(entry) {
  const prediction = entry.prediction;
  const result = entry.result;
  if (!entry.scored) return 'Pending until the match is scored.';
  if (!prediction) return 'No prediction was found for this match.';
  if (!result) return entry.ft_pts ? 'Awarded by the scoring engine.' : 'No full-time exact score was awarded.';
  return `Predicted ${prediction.ft_home}-${prediction.ft_away}; full time was ${result.ft_home}-${result.ft_away}.`;
}

export function closestDetail(entry, distance) {
  if (!entry.scored) return 'Pending until the match is scored.';
  if (distance == null) return entry.closest_pts ? 'Awarded by the scoring engine.' : 'No closest-score points were awarded.';
  if (entry.closest_pts) {
    return `Score distance was ${distance}; closest predictions split the 6 points.`;
  }
  return `Score distance was ${distance}; another prediction was closer.`;
}

export function outcomeDetail(entry, predictedOutcome, actualOutcome) {
  if (!entry.scored) return 'Pending until the match is scored.';
  if (!predictedOutcome || !actualOutcome) return entry.outcome_pts ? 'Awarded by the scoring engine.' : 'No outcome points were awarded.';
  return `Predicted ${predictedOutcome}; result was ${actualOutcome}.`;
}

export function summaryScoreText(entry, match) {
  if (entry?.result?.ft_home != null && entry?.result?.ft_away != null) {
    return `${entry.result.ft_home} - ${entry.result.ft_away}`;
  }
  return scoreText(match) || '-';
}

export function summaryHalfTimeScoreText(entry) {
  if (entry?.result?.ht_home != null && entry?.result?.ht_away != null) {
    return `HT ${entry.result.ht_home} - ${entry.result.ht_away}`;
  }
  return 'Half time pending';
}

export function summaryVerdict(entry) {
  if (!entry?.prediction) return 'No prediction';
  if (!entry.scored) return 'Prediction submitted';
  const total = roundPoints(entry.match_total);
  if (total >= 19) return 'Elite return';
  if (total >= 10) return 'Strong return';
  if (total > 0) return 'Points earned';
  return 'No points';
}

export function buildSummaryEntry(player, matchId, match) {
  const key = String(matchId || '');
  const found = player?.match_points?.find((entry) => String(entry.match_id) === key);
  if (found) return found;
  return {
    match_id: key,
    ht_pts: 0,
    ft_pts: 0,
    closest_pts: 0,
    outcome_pts: 0,
    match_total: 0,
    prediction: null,
    result: null,
    scored: Boolean(match && (displayStatus(match) === 'FINISHED' || hasMatchScore(match))),
  };
}
