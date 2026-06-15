export function formatPlacedAt(submittedAt) {
  if (!submittedAt) return null;
  const d = new Date(submittedAt);
  if (Number.isNaN(d.valueOf())) return null;
  const date = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(d);
  const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(d);
  return `${date} · ${time}`;
}
