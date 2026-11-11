import { daysBefore } from './dates.mjs';
import { loadKeys } from './load.mjs';

export class DataError extends Error {
  constructor(code) {
    super(code);
    this.name = 'DataError';
    this.code = code;
  }
}

function validDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  try {
    return daysBefore(date, 0) === date;
  } catch {
    return false;
  }
}

const integerInRange = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const shortText = (value) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= 120;

function validLoad(load) {
  return (
    load &&
    typeof load === 'object' &&
    !Array.isArray(load) &&
    Object.entries(load).every(
      ([key, value]) => loadKeys.includes(key) && integerInRange(value, 0, 3),
    )
  );
}

function validEntry(entry) {
  return (
    entry &&
    shortText(entry.id) &&
    shortText(entry.name) &&
    (entry.routineId === null || shortText(entry.routineId)) &&
    validDate(entry.date) &&
    ['am', 'pm'].includes(entry.slot) &&
    integerInRange(entry.count, 1, 20) &&
    integerInRange(entry.minutes, 1, 600) &&
    integerInRange(entry.kcal, 0, 3000) &&
    validLoad(entry.load)
  );
}

/** Validate and normalize external data before it can replace saved history. */
export function validate(data) {
  if (data?.version !== 1 || !Array.isArray(data.entries)) throw new DataError('unsupportedBackup');
  const ids = new Set();
  const entries = data.entries.map((entry) => {
    if (!validEntry(entry) || ids.has(entry.id)) throw new DataError('invalidEntries');
    ids.add(entry.id);
    const { id, routineId, name, date, slot, count, minutes, kcal, load } = entry;
    return { id, routineId, name, date, slot, count, minutes, kcal, load: { ...load } };
  });
  return { version: 1, entries };
}
