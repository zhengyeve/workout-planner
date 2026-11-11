import test from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../web/engine.mjs';
test('validation exposes a stable error code independent of display language', () => {
  assert.throws(() => validate({ version: 2, entries: [] }), { code: 'unsupportedBackup' });
});
test('validation rejects invalid entry values with a stable code', () => {
  assert.throws(() => validate({ version: 1, entries: [{}] }), { code: 'invalidEntries' });
});

test('validation preserves names in any language and copies load data', () => {
  const name = String.fromCodePoint(0x8bad, 0x7ec3);
  const entry = {
    id: 'one',
    routineId: null,
    name,
    date: '2026-11-11',
    slot: 'am',
    count: 1,
    minutes: 10,
    kcal: 20,
    load: { core: 2 },
  };
  const validated = validate({ version: 1, entries: [entry] });
  entry.load.core = 3;
  assert.equal(validated.entries[0].name, name);
  assert.equal(validated.entries[0].load.core, 2);
});

test('validation rejects invalid dates, ranges, load tags and duplicate IDs', () => {
  const entry = {
    id: 'one',
    routineId: null,
    name: 'Workout',
    date: '2026-11-11',
    slot: 'am',
    count: 1,
    minutes: 10,
    kcal: 20,
    load: { core: 2 },
  };
  for (const changes of [
    { date: '2026-02-30' },
    { count: 0 },
    { count: 21 },
    { minutes: NaN },
    { kcal: -1 },
    { slot: 'noon' },
    { load: { unknown: 1 } },
    { load: { core: 4 } },
    { load: [] },
    { name: ' ' },
  ]) {
    assert.throws(() => validate({ version: 1, entries: [{ ...entry, ...changes }] }), {
      code: 'invalidEntries',
    });
  }
  assert.throws(() => validate({ version: 1, entries: [entry, entry] }), {
    code: 'invalidEntries',
  });
});
