export function numberOrBlank(value) {
  return value === null || value === undefined ? '' : String(value);
}

export function parseScore(value) {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

export function roundPoints(value) {
  return Math.round((value || 0) * 10) / 10;
}
