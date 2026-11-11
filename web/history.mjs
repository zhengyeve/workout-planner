import { daysBefore } from './dates.mjs';
import { loadKeys } from './load.mjs';

export function totals(entries) {
  return entries.reduce(
    (sum, entry) => ({
      minutes: sum.minutes + entry.minutes * entry.count,
      kcal: sum.kcal + entry.kcal * entry.count,
    }),
    { minutes: 0, kcal: 0 },
  );
}

export function recentLoad(entries, date) {
  const previous = daysBefore(date, 1);
  const earlier = daysBefore(date, 2);
  const load = Object.fromEntries(loadKeys.map((key) => [key, 0]));
  for (const entry of entries) {
    const weight =
      entry.date === date ? 1 : entry.date === previous ? 0.75 : entry.date === earlier ? 0.4 : 0;
    for (const key of loadKeys) load[key] += (entry.load[key] || 0) * entry.count * weight;
  }
  return load;
}
