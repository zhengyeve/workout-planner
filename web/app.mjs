import bank from './bank.mjs';
import { localDate } from './dates.mjs';
import { createHistoryStore, STORAGE_KEY } from './storage.mjs';
import { messages, errorMessage } from './messages.mjs';
import { byId, changeTab, notice } from './dom.mjs';
import { createViews } from './views.mjs';
import { createEditor } from './editor.mjs';
import { bindBackup } from './backup.mjs';
import { bindRecommendations } from './plans-view.mjs';

// Delay access to localStorage until load/save so denied storage is recoverable.
const store = createHistoryStore({
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
});
const dateInput = byId('date');
dateInput.value = localDate();
const getDate = () => dateInput.value;
const getSlot = () => byId('plan-slot').value;
const getEntries = () => store.state.entries;

function commit(entries) {
  try {
    store.save(entries);
    views.render();
    return true;
  } catch (error) {
    const message = messages.saveFailed({ reason: errorMessage(error) });
    notice(message);
    alert(message);
    return false;
  }
}

const editor = createEditor({
  getDate,
  getSlot,
  getEntries,
  commit,
  onSaved(date) {
    dateInput.value = date;
    views.render();
  },
});
const views = createViews({ getEntries, getDate, openEntry: editor.openEntry });
bindBackup({ store, onRestored: views.render });
bindRecommendations({ getEntries, getDate, getSlot, commit });

try {
  store.load();
} catch {
  notice(messages.storageReadFailed);
}

byId('bank-size').textContent = bank.length;
for (const button of document.querySelectorAll('[data-tab]')) {
  button.addEventListener('click', () => changeTab(button.dataset.tab));
}
dateInput.addEventListener('change', () => {
  if (!dateInput.value) dateInput.value = localDate();
  views.render();
});
byId('jump-today').addEventListener('click', () => {
  dateInput.value = localDate();
  views.render();
});
byId('window').addEventListener('change', views.renderHistory);
byId('search').addEventListener('input', views.renderBank);
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  try {
    store.receive(event.newValue);
    views.render();
  } catch {
    notice(messages.storageChangedFailed);
  }
});
views.render();
views.renderBank();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => notice(messages.offlineUnavailable));
}
