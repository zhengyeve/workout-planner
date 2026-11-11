import bank from './bank.mjs';
import { loadKeys } from './load.mjs';
import { snapshot } from './entries.mjs';
import { messages } from './messages.mjs';
import { byId, element, notice } from './dom.mjs';
import { summary } from './views.mjs';

export function createEditor({ getDate, getSlot, getEntries, commit, onSaved }) {
  const form = byId('entry-form');
  const dialog = byId('entry-dialog');
  const field = (name) => form.elements.namedItem(name);
  let editing = null;

  function readRoutine() {
    const id = field('routine').value;
    // Editing date or count must not refresh old measurements from the bank.
    if (editing?.routineId === id) return { ...editing, id };
    if (id !== 'custom') return bank.find((routine) => routine.id === id);
    return {
      id: null,
      name: field('customName').value.trim() || messages.customWorkout,
      minutes: field('minutes').valueAsNumber,
      kcal: field('kcal').valueAsNumber,
      load: Object.fromEntries(loadKeys.map((key) => [key, Number(field(`tag-${key}`).value)])),
    };
  }

  function updateEntry() {
    const custom = field('routine').value === 'custom';
    byId('custom').hidden = !custom;
    for (const name of ['minutes', 'kcal']) field(name).required = custom;
    for (const input of byId('custom').querySelectorAll('input,select')) input.disabled = !custom;
    const routine = readRoutine();
    const count = field('count').valueAsNumber;
    byId('entry-total').textContent =
      Number.isFinite(routine.minutes) && Number.isFinite(routine.kcal) && Number.isFinite(count)
        ? summary([{ ...routine, count }])
        : '';
  }

  function openEntry(entry = null, routineId) {
    editing = entry;
    form.reset();
    byId('entry-title').textContent = entry ? messages.editWorkout : messages.addWorkout;
    field('date').value = entry?.date || getDate();
    field('slot').value = entry?.slot || getSlot();
    field('routine').value = entry
      ? bank.some((routine) => routine.id === entry.routineId)
        ? entry.routineId
        : 'custom'
      : routineId || bank[0].id;
    field('count').value = entry?.count || 1;
    byId('remove').hidden = !entry;
    if (entry) {
      field('customName').value = entry.name;
      field('minutes').value = entry.minutes;
      field('kcal').value = entry.kcal;
      for (const key of loadKeys) field(`tag-${key}`).value = entry.load[key] || 0;
    }
    updateEntry();
    dialog.showModal();
  }

  for (const routine of [...bank].sort((left, right) => left.name.localeCompare(right.name)))
    field('routine').add(new Option(routine.name, routine.id));
  field('routine').add(new Option(messages.customWorkout, 'custom'));
  for (const key of loadKeys) {
    const label = element('label', messages.loads[key]);
    const select = element('select');
    select.name = `tag-${key}`;
    messages.loadLevels.forEach((text, value) => select.add(new Option(text, value)));
    label.append(select);
    byId('custom-tags').append(label);
  }

  byId('add').addEventListener('click', () => openEntry());
  byId('close').addEventListener('click', () => dialog.close());
  form.addEventListener('input', updateEntry);
  form.addEventListener('change', updateEntry);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const entry = snapshot(
      readRoutine(),
      field('date').value,
      field('slot').value,
      field('count').valueAsNumber,
      editing?.id,
    );
    const entries = editing
      ? getEntries().map((previous) => (previous.id === entry.id ? entry : previous))
      : [...getEntries(), entry];
    if (commit(entries)) {
      onSaved(entry.date);
      dialog.close();
      notice(messages.workoutSaved);
    }
  });
  byId('remove').addEventListener('click', () => {
    if (
      editing &&
      confirm(messages.deleteConfirm) &&
      commit(getEntries().filter((entry) => entry.id !== editing.id))
    ) {
      dialog.close();
      notice(messages.workoutDeleted);
    }
  });
  return { openEntry };
}
