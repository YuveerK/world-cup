export function formatDate(value) {
  if (!value) return 'Date TBC';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

export function formatTime(value) {
  if (!value) return 'Time TBC';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatDayHeading(value) {
  if (!value) return 'Date to be confirmed';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

export function dayKeyOf(value) {
  if (!value) return 'tbc';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return 'tbc';
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}
