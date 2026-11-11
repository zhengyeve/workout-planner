import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend, validate, daysBefore, totals } from '../web/engine.mjs';

const routine = (id, kcal, load = {}) => ({ id, name: id, kcal, minutes: 10, load });
const bank = [
  routine('recent', 100, { legs: 3 }),
  routine('a', 95, { legs: 3 }),
  routine('b', 95, { back: 2 }),
  routine('c', 98, { core: 2 }),
  routine('d', 99, { upper: 2 }),
];
const date = '2026-11-10';
const done = {
  ...bank[0],
  id: 'entry',
  routineId: 'recent',
  date: '2026-11-08',
  slot: 'pm',
  count: 2,
};
test('calendar windows cross month and DST boundaries', () => {
  assert.equal(daysBefore('2026-11-02', 3), '2026-10-30');
});
test('prefers fresh routines and avoids concentrated recent load', () => {
  const plans = recommend(bank, [done], { date, target: 195, maxMinutes: 20 });
  assert.equal(plans.length, 3);
  assert.ok(plans.every((p) => !p.items.some((r) => r.id === 'recent')));
  assert.ok(!plans[0].items.some((r) => r.id === 'a'));
  assert.equal(plans[0].kcal, 194);
});
test('counts repetitions and rejects invalid backup before restoring', () => {
  assert.deepEqual(totals([done]), { minutes: 20, kcal: 200 });
  assert.equal(validate({ version: 1, entries: [done] }).entries.length, 1);
  assert.throws(() => validate({ version: 1, entries: [done, done] }));
  assert.throws(() => validate({ version: 1, entries: [{ ...done, date: '2026-02-30' }] }));
});
test('recommendation respects low impact and maximum duration', () => {
  const plans = recommend([routine('jump', 100, { impact: 3 }), routine('quiet', 90)], [], {
    date,
    target: 100,
    maxMinutes: 10,
    lowImpact: true,
  });
  assert.deepEqual(
    plans.map((p) => p.items.map((r) => r.id)),
    [['quiet']],
  );
});
test('the cleaned bank includes its latest routines and confirmed values', async () => {
  const { default: routines } = await import('../web/bank.mjs');
  assert.equal(routines.length, 36);
  assert.equal(new Set(routines.map((r) => r.id)).size, 36);
  assert.equal(
    routines.find((r) => r.id === 'morning-body-boost').exercises.at(-1),
    'Arm Shoulder Stretch',
  );
  assert.equal(routines.find((r) => r.id === 'home-hiit').kcal, 103);
  assert.ok(
    routines
      .find((r) => r.id === 'hiit-walking')
      .exercises.includes('Side Wide Steps With Toe Tap'),
  );
});
