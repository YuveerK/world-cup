import { FIFA_PERIODS } from './fifaPeriods';

export function hasMatchScore(match) {
  const home = Number(match?.score?.home);
  const away = Number(match?.score?.away);
  return Number.isFinite(home) && Number.isFinite(away);
}

export function isPastMatch(match) {
  const date = new Date(match?.date || 0);
  return !Number.isNaN(date.valueOf()) && date <= new Date();
}

export function isHalfTime(match) {
  const minute = String(match?.minute ?? '').trim();
  const rawPeriod = match?.period;
  const period = Number(rawPeriod);
  const hasPeriod = rawPeriod !== undefined && rawPeriod !== null && rawPeriod !== '' && Number.isFinite(period);

  if (period === FIFA_PERIODS.PRE_ET_INTERVAL) return false;

  return Boolean(
    match?.isHalfTime ||
    match?.phase === 'HALF_TIME' ||
    period === FIFA_PERIODS.REGULAR_HT || period === FIFA_PERIODS.ET_HT ||
    minute.toUpperCase() === 'HT' ||
    (match?.status === 'LIVE' && minute === '' && hasMatchScore(match) && !hasPeriod)
  );
}

export function formatMatchMinute(minute) {
  if (minute == null) return null;
  const text = String(minute).trim();
  if (!text) return null;
  if (/^HT$/i.test(text)) return 'HT';
  return text.endsWith("'") ? text : `${text}'`;
}

export function displayStatus(match) {
  // A match that hasn't kicked off yet cannot be LIVE or FINISHED regardless of what
  // the API reports — guards against stale status values on upcoming matches.
  if (!isPastMatch(match)) return 'UPCOMING';
  if (match.status === 'LIVE') return 'LIVE';
  if (match.status === 'FINISHED') return 'FINISHED';
  // Only infer FINISHED from a score when the API hasn't provided a specific status yet
  // (TBD, UPCOMING, or null). Unknown codes like STATUS_11 (weather delay) must not be
  // treated as finished — trust the explicit status string.
  const isKnownPreGame = !match.status || match.status === 'UPCOMING' || match.status === 'TBD';
  if (isKnownPreGame && hasMatchScore(match)) return 'FINISHED';
  return match.status ?? 'UPCOMING';
}

export function scoreStatusLabel(match) {
  const status = displayStatus(match);
  if (status === 'LIVE') {
    const period = Number(match.period);
    // A live penalty score is the strongest phase signal — check before any period
    // logic so a stale/lagging period can't mislabel a shootout as half-time.
    if (period === FIFA_PERIODS.PENALTIES || match.score?.homePenalty != null) return 'Pens';
    if (period === FIFA_PERIODS.PRE_ET_INTERVAL) return 'ET next';
    // Ignore a stale REGULAR_HT period once the match has reached extra time.
    const staleRegularHt = period === FIFA_PERIODS.REGULAR_HT && Boolean(match.aet);
    if (isHalfTime(match) && !staleRegularHt) return 'HT';
    const isEt = period === FIFA_PERIODS.ET_FIRST_HALF || period === FIFA_PERIODS.ET_SECOND_HALF || staleRegularHt;
    const minute = formatMatchMinute(match.minute);
    return minute && !staleRegularHt ? `${isEt ? 'ET' : 'Live'} ${minute}` : (isEt ? 'ET' : 'Live');
  }
  if (status === 'FINISHED') {
    if (match.score?.homePenalty != null) return 'Pens';
    if (match.aet) return 'AET';
    return 'FT';
  }
  if (status === 'SUSPENDED') return 'Suspended';
  if (status === 'ABANDONED') return 'Abandoned';
  if (status === 'CANCELLED') return 'Cancelled';
  if (status?.startsWith('STATUS_')) return 'Delayed';
  return 'Score';
}

export function statusPillLabel(match) {
  const status = displayStatus(match);
  if (status === 'LIVE') {
    const period = Number(match.period);
    // A live penalty score is the strongest phase signal — check before any period
    // logic so a stale/lagging period can't mislabel a shootout as half-time.
    if (period === FIFA_PERIODS.PENALTIES || match.score?.homePenalty != null) return 'Penalties';
    if (period === FIFA_PERIODS.PRE_ET_INTERVAL) return 'Extra time next';
    // Ignore a stale REGULAR_HT period once the match has reached extra time.
    const staleRegularHt = period === FIFA_PERIODS.REGULAR_HT && Boolean(match.aet);
    if (isHalfTime(match) && !staleRegularHt) return 'Half time';
    const isEt = period === FIFA_PERIODS.ET_FIRST_HALF || period === FIFA_PERIODS.ET_SECOND_HALF || staleRegularHt;
    const minute = formatMatchMinute(match.minute);
    return minute && !staleRegularHt ? `${isEt ? 'ET' : 'Live'} · ${minute}` : (isEt ? 'Extra Time' : 'Live');
  }
  if (status === 'FINISHED') {
    if (match.score?.homePenalty != null) return 'Penalties';
    if (match.aet) return 'After ET';
    return 'Full Time';
  }
  if (status === 'SUSPENDED') return 'Suspended';
  if (status === 'ABANDONED') return 'Abandoned';
  if (status === 'CANCELLED') return 'Cancelled';
  if (status?.startsWith('STATUS_')) return 'Delayed';
  return 'Upcoming';
}

export function scoreText(match) {
  if (!hasMatchScore(match)) return null;
  return `${match.score.home}–${match.score.away}`;
}

export function canShowMatchDetails(match) {
  return displayStatus(match) === 'LIVE' || displayStatus(match) === 'FINISHED' || hasMatchScore(match);
}

export function isPredictionLocked(match) {
  return isPastMatch(match);
}
