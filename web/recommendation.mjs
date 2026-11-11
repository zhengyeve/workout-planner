import { daysBefore } from './dates.mjs';
import { recentLoad } from './history.mjs';

const MAX_ROUTINES = 4;
const RESULT_LIMIT = 3;
const HISTORY_DAYS = 7;
const REPEAT_DAYS = 3;
const MIN_TARGET_TOLERANCE = 15;
const TARGET_TOLERANCE_RATIO = 0.1;
const HIGH_LOAD = 3;

// Lexicographic ordering: an earlier criterion always wins over a later one.
export const RANKING_PRIORITIES = Object.freeze([
  'outsideTarget',
  'overloaded',
  'repeats',
  'loadOverlap',
  'outsideGap',
  'frequency',
  'gap',
  'minutes',
]);

export function isEligible(routine, { lowImpact = false, maxMinutes }) {
  return routine.minutes <= maxMinutes && (!lowImpact || (routine.load.impact || 0) <= 1);
}

export function comparePlans(left, right) {
  for (const key of RANKING_PRIORITIES) {
    const difference = left.criteria[key] - right.criteria[key];
    if (difference) return difference;
  }
  return 0;
}

function scorePlan(plan, previousLoad, target) {
  let overlap = 0;
  let stacked = 0;
  let overloaded = 0;
  for (const [key, previous] of Object.entries(previousLoad)) {
    const amounts = plan.items.map((routine) => routine.load[key] || 0);
    const combined = amounts.reduce((sum, amount) => sum + amount, 0);
    if (previous >= HIGH_LOAD && amounts.some((amount) => amount === HIGH_LOAD)) overloaded++;
    // Preserve the original heuristic thresholds; these are estimates, not physiology.
    overlap += Math.max(0, previous - 1.5) * Math.max(0, combined - 2);
    stacked += Math.max(0, combined - 4);
  }
  const gap = Math.abs(plan.kcal - target);
  const tolerance = Math.max(MIN_TARGET_TOLERANCE, Math.round(target * TARGET_TOLERANCE_RATIO));
  const outsideTarget = gap > tolerance;
  const criteria = {
    outsideTarget: outsideTarget ? 1 : 0,
    overloaded,
    repeats: plan.repeats,
    loadOverlap: Math.round(overlap + stacked),
    outsideGap: outsideTarget ? gap : 0,
    frequency: plan.frequency,
    gap,
    minutes: plan.minutes,
  };
  return { ...plan, overloaded, criteria, score: RANKING_PRIORITIES.map((key) => criteria[key]) };
}

/** Enumerate combinations without repetition, then rank them using the fixed policy. */
export function recommend(bank, entries, { date, target, maxMinutes, lowImpact = false }) {
  const weekStart = daysBefore(date, HISTORY_DAYS - 1);
  const repeatStart = daysBefore(date, REPEAT_DAYS - 1);
  const week = entries.filter((entry) => entry.date >= weekStart && entry.date <= date);
  const load = recentLoad(week, date);
  const options = bank
    .filter((routine) => isEligible(routine, { lowImpact, maxMinutes }))
    .map((routine) => {
      const used = week.filter((entry) => entry.routineId === routine.id);
      return {
        routine,
        recent: used.some((entry) => entry.date >= repeatStart) ? 1 : 0,
        frequency: used.reduce((count, entry) => count + entry.count, 0),
      };
    });
  const plans = [];
  function search(start, plan) {
    if (plan.items.length) plans.push(scorePlan(plan, load, target));
    if (plan.items.length === MAX_ROUTINES) return;
    for (let index = start; index < options.length; index++) {
      const { routine, recent, frequency } = options[index];
      if (plan.minutes + routine.minutes > maxMinutes) continue;
      search(index + 1, {
        items: [...plan.items, routine],
        minutes: plan.minutes + routine.minutes,
        kcal: plan.kcal + routine.kcal,
        repeats: plan.repeats + recent,
        frequency: plan.frequency + frequency,
      });
    }
  }
  search(0, { items: [], minutes: 0, kcal: 0, repeats: 0, frequency: 0 });
  // Stable sort preserves enumeration order for exact ties.
  plans.sort(comparePlans);
  return plans.slice(0, RESULT_LIMIT);
}
