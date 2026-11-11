import bank from './bank.mjs';
import { daysBefore } from './dates.mjs';
import { totals } from './history.mjs';
import { messages } from './messages.mjs';
import { byId, element, button } from './dom.mjs';

export function summary(entries) {
  return messages.summary(totals(entries));
}

export function createViews({ getEntries, getDate, openEntry }) {
  function entryRow(entry, showDate = false) {
    const row = element('div', undefined, 'row');
    const title = element('div');
    const metadata = [showDate ? entry.date : null, messages.slots[entry.slot], summary([entry])];
    title.append(
      element('strong', entry.name + (entry.count > 1 ? ` ×${entry.count}` : '')),
      element('small', metadata.filter(Boolean).join(' · ')),
    );
    row.append(
      title,
      button(messages.edit, () => openEntry(entry)),
    );
    return row;
  }

  function renderHistory() {
    const sorted = [...getEntries()].sort(
      (left, right) => right.date.localeCompare(left.date) || right.slot.localeCompare(left.slot),
    );
    const period = Number(byId('window').value);
    const entries = sorted.filter(
      (entry) => entry.date >= daysBefore(getDate(), period - 1) && entry.date <= getDate(),
    );
    byId('overview').replaceChildren(
      element('p', messages.throughDate({ date: getDate(), summary: summary(entries) })),
    );
    const loads = Object.keys(messages.loads).map((key) => [
      key,
      entries.reduce((total, entry) => total + (entry.load[key] || 0) * entry.count, 0),
    ]);
    const maximum = Math.max(1, ...loads.map(([, points]) => points));
    byId('loads').replaceChildren(
      ...loads.map(([key, points]) => {
        const progress = element('progress');
        progress.max = maximum;
        progress.value = points;
        progress.setAttribute('aria-label', messages.loads[key]);
        const row = element('div', undefined, 'load');
        row.append(
          element('span', messages.loads[key]),
          progress,
          element('span', messages.loadPoints({ points })),
        );
        return row;
      }),
    );
    const frequency = new Map();
    for (const entry of entries)
      frequency.set(entry.name, (frequency.get(entry.name) || 0) + entry.count);
    byId('frequency').replaceChildren(
      ...[...frequency]
        .sort((left, right) => right[1] - left[1])
        .map(([name, count]) => element('p', `${name} ×${count}`)),
    );
    byId('all-entries').replaceChildren(
      ...(sorted.length
        ? sorted.map((entry) => entryRow(entry, true))
        : [element('p', messages.noHistory, 'empty')]),
    );
  }

  function render() {
    const daily = getEntries().filter((entry) => entry.date === getDate());
    const total = totals(daily);
    const metrics = [
      [total.minutes, messages.trainingMinutes],
      [total.kcal, messages.calories],
      [daily.reduce((count, entry) => count + entry.count, 0), messages.completions],
    ];
    byId('metrics').replaceChildren(
      ...metrics.map(([value, label]) => {
        const metric = element('div', undefined, 'metric');
        metric.append(element('strong', value), element('span', label));
        return metric;
      }),
    );
    byId('daily').replaceChildren(
      ...(daily.length
        ? daily.map((entry) => entryRow(entry))
        : [element('p', messages.noDailyWorkouts, 'empty')]),
    );
    byId('plans').replaceChildren();
    renderHistory();
  }

  function renderBank() {
    const term = byId('search').value.trim().toLowerCase();
    const filtered = bank.filter((routine) =>
      [routine.name, ...routine.exercises].some((text) => text.toLowerCase().includes(term)),
    );
    byId('catalog').replaceChildren(
      ...(filtered.length
        ? filtered.map((routine) => {
            const card = element('article', undefined, 'card');
            const head = element('div', undefined, 'card-head');
            const title = element('div');
            title.append(
              element('h2', routine.name),
              element('p', summary([{ ...routine, count: 1 }])),
            );
            head.append(
              title,
              button(messages.log, () => openEntry(null, routine.id)),
            );
            const tags = element('div', undefined, 'tags');
            for (const [key, load] of Object.entries(routine.load))
              if (load >= 2) tags.append(element('span', messages.loads[key], 'tag'));
            const details = element('details');
            const exercises = element('ul');
            exercises.append(...routine.exercises.map((name) => element('li', name)));
            details.append(element('summary', messages.viewExercises), exercises);
            card.append(head, tags, details);
            return card;
          })
        : [element('p', messages.noRoutines, 'empty')]),
    );
  }
  return { render, renderHistory, renderBank };
}
