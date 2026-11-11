/** Keep historical values independent of future edits to the routine library. */
export function snapshot(
  routine,
  date,
  slot,
  count,
  id = globalThis.crypto?.randomUUID?.() ||
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
) {
  return {
    id,
    routineId: routine.id,
    name: routine.name,
    date,
    slot,
    count,
    minutes: routine.minutes,
    kcal: routine.kcal,
    load: { ...routine.load },
  };
}
