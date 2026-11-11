// English copy lives here so a later locale dictionary can reuse stable keys.
// Static page copy remains in index.html until language switching is implemented.
export const messages = {
  slots: { am: 'Morning', pm: 'Evening' },
  loads: {
    legs: 'Legs',
    glutes: 'Glutes / hips',
    core: 'Core',
    upper: 'Shoulders / arms',
    back: 'Back',
    cardio: 'Cardio',
    impact: 'Impact',
  },
  loadLevels: ['None', 'Low', 'Medium', 'High'],
  errors: {
    unsupportedBackup: 'Backup format is not supported.',
    invalidEntries: 'The backup contains duplicate IDs or invalid workout records.',
    historyUnreadable: 'Restore a valid backup before saving workouts.',
    backupTooLarge: 'The backup file is too large.',
  },
  unknownError: 'An unexpected error occurred.',
  storageReadFailed: 'Unable to read local history. Restore a valid JSON file in Backup.',
  storageChangedFailed: 'Updated local history could not be read.',
  storageExportFailed: 'Local history cannot be read.',
  offlineUnavailable:
    'Offline caching is unavailable. Keep this page open or reconnect to load the app.',
  saveFailed: ({ reason }) => `Save failed. ${reason}`,
  restoreFailed: ({ reason }) => `Restore failed. ${reason}`,
  summary: ({ minutes, kcal }) => `${minutes} min · ${kcal} App kcal`,
  edit: 'Edit',
  addWorkout: 'Log workout',
  editWorkout: 'Edit workout',
  workoutSaved: 'Workout saved.',
  workoutDeleted: 'Workout deleted.',
  deleteConfirm: 'Delete this workout record?',
  customWorkout: 'Custom workout',
  noDailyWorkouts: 'No workouts recorded for this day.',
  noHistory: 'Your workout history will appear here after you save a workout.',
  trainingMinutes: 'Training minutes',
  completions: 'Completions',
  calories: 'App kcal',
  throughDate: ({ date, summary }) => `Through ${date} · ${summary}`,
  loadPoints: ({ points }) => `${points} pts`,
  log: 'Log',
  viewExercises: 'View recorded exercises',
  noRoutines: 'No matching routines.',
  firstChoice: 'First choice',
  alternative: ({ number }) => `Alternative ${number}`,
  repeated: ({ count }) => `${count} routines repeated in the last 3 days`,
  noRepeats: 'No repeats in the last 3 days',
  planSummary: ({ minutes, gap, repeats }) =>
    `${minutes} min · ${gap} kcal from target · ${repeats}`,
  recentLoadWarning: 'Includes recently elevated training loads. Adjust to how you feel today.',
  recordPlan: 'Log entire plan as completed',
  recordPlanConfirm: ({ count, date, slot }) => `Log these ${count} workouts for ${date}, ${slot}?`,
  planSaved: 'Workout plan saved.',
  noPlans: 'No combinations fit the current duration and impact limits.',
  rankingExplanation:
    'Ranked by target range, recent training load and repetition. App kcal values are fixed estimates.',
  restoreConfirm: ({ count }) => `Replace local history with ${count} records from this backup?`,
  backupRestored: 'Backup restored.',
};

/** Do not expose browser-specific exception messages as untranslated product copy. */
export function errorMessage(error) {
  if (error?.code && messages.errors[error.code]) return messages.errors[error.code];
  if (error instanceof SyntaxError) return 'The backup is not valid JSON.';
  if (error?.name === 'QuotaExceededError')
    return 'Browser storage is full. Export a backup and free up space.';
  if (error?.name === 'SecurityError')
    return 'Browser storage is unavailable. Check your browser settings.';
  return messages.unknownError;
}
