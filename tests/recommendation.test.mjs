import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import bank from '../web/bank.mjs';
import { recommend, comparePlans, RANKING_PRIORITIES } from '../web/recommendation.mjs';
import { validate } from '../web/validation.mjs';

const scenarios = JSON.parse(
  await readFile(new URL('./fixtures/recommendations.json', import.meta.url), 'utf8'),
);
for (const { options, entries, expected } of scenarios) {
  test(`ranking preserves v1.1 results for ${JSON.stringify(options)}`, () => {
    const actual = recommend(bank, entries, options).map(
      ({ items, minutes, kcal, repeats, overloaded, score }) => ({
        ids: items.map((item) => item.id),
        minutes,
        kcal,
        repeats,
        overloaded,
        score,
      }),
    );
    assert.deepEqual(actual, expected);
  });
}
test('earlier ranking criteria outweigh every later criterion', () => {
  for (let index = 0; index < RANKING_PRIORITIES.length; index++) {
    const left = Object.fromEntries(RANKING_PRIORITIES.map((key, i) => [key, i > index ? 999 : 0]));
    const right = Object.fromEntries(RANKING_PRIORITIES.map((key) => [key, 0]));
    right[RANKING_PRIORITIES[index]] = 1;
    assert.ok(comparePlans({ criteria: left }, { criteria: right }) < 0);
  }
});
test('fully tied plans preserve enumeration order', () => {
  const routines = ['first', 'second', 'third', 'fourth'].map((id) => ({
    id,
    name: id,
    minutes: 10,
    kcal: 100,
    load: {},
  }));
  assert.deepEqual(
    recommend(routines, [], { date: '2026-11-11', target: 100, maxMinutes: 10 }).map(
      (plan) => plan.items[0].id,
    ),
    ['first', 'second', 'third'],
  );
});
test('every routine can produce a valid historical snapshot', () => {
  assert.equal(new Set(bank.map((routine) => routine.id)).size, bank.length);
  for (const routine of bank) {
    assert.ok(
      Array.isArray(routine.exercises) &&
        routine.exercises.every((name) => typeof name === 'string' && name.length),
    );
    assert.doesNotThrow(() =>
      validate({
        version: 1,
        entries: [
          {
            ...routine,
            id: `entry-${routine.id}`,
            routineId: routine.id,
            date: '2026-11-11',
            slot: 'am',
            count: 1,
          },
        ],
      }),
    );
  }
});
