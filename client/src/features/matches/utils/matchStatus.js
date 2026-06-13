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
  const period = Number(match?.period);

  return Boolean(
    match?.isHalfTime ||
    match?.phase === 'HALF_TIME' ||
    period === 4 ||
    minute.toUpperCase() === 'HT' ||
    (match?.status === 'LIVE' && minute === '' && hasMatchScore(match))
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
  if (match.status === 'LIVE') return 'LIVE';
  if (match.status === 'FINISHED') return 'FINISHED';
  if (hasMatchScore(match) && isPastMatch(match)) return 'FINISHED';
  return match.status;
}

export function scoreStatusLabel(match) {
  if (match.status === 'LIVE') {
    if (isHalfTime(match)) return 'HT';
    const minute = formatMatchMinute(match.minute);
    return minute ? `Live ${minute}` : 'Live';
  }
  if (displayStatus(match) === 'FINISHED') return 'FT';
  return 'Score';
}

export function statusPillLabel(match) {
  if (displayStatus(match) === 'LIVE') {
    if (isHalfTime(match)) return 'Half time';
    const minute = formatMatchMinute(match.minute);
    return minute ? `Live · ${minute}` : 'Live';
  }
  if (displayStatus(match) === 'FINISHED') return 'Full Time';
  return 'Upcoming';
}

export function scoreText(match) {
  if (!hasMatchScore(match)) return null;
  return `${match.score.home} - ${match.score.away}`;
}

export function canShowMatchDetails(match) {
  return match?.status === 'LIVE' || displayStatus(match) === 'FINISHED' || hasMatchScore(match);
}

export function isPredictionLocked(match) {
  return isPastMatch(match);
}
