export function localDate() {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()]
    .map((n) => String(n).padStart(2, '0'))
    .join('-');
}
export function daysBefore(date, days) {
  const day = new Date(date + 'T00:00:00Z');
  day.setUTCDate(day.getUTCDate() - days);
  return day.toISOString().slice(0, 10);
}
