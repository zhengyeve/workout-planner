import test from 'node:test';
import assert from 'node:assert/strict';
import * as module from '../web/entries.mjs';
test('snapshots preserve values independently of routine library changes', () => {
  const routine = {
    id: 'routine',
    name: 'Original name',
    minutes: 10,
    kcal: 50,
    load: { core: 2 },
  };
  const entry = module.snapshot(routine, '2026-11-11', 'pm', 2, 'entry');
  routine.load.core = 3;
  routine.minutes = 20;
  assert.equal(entry.load.core, 2);
  assert.equal(entry.minutes, 10);
  assert.equal(entry.id, 'entry');
  assert.equal(entry.routineId, 'routine');
});

test('new workouts can be logged when randomUUID is unavailable', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  try {
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: {} });
    const routine = { id: 'routine', name: 'Workout', minutes: 10, kcal: 50, load: {} };
    const first = module.snapshot(routine, '2026-11-11', 'am', 1);
    const second = module.snapshot(routine, '2026-11-11', 'am', 1);
    assert.equal(typeof first.id, 'string');
    assert.ok(first.id.length > 0);
    assert.notEqual(first.id, second.id);
  } finally {
    Object.defineProperty(globalThis, 'crypto', descriptor);
  }
});
