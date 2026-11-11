import { localDate } from './dates.mjs';
import { DataError, validate } from './validation.mjs';
import { messages, errorMessage } from './messages.mjs';
import { byId, element, notice } from './dom.mjs';

const MAX_BACKUP_BYTES = 10_000_000;

export function bindBackup({ store, onRestored }) {
  byId('export').addEventListener('click', () => {
    if (!store.writable) return notice(messages.storageExportFailed);
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(store.state, null, 2)], { type: 'application/json' }),
    );
    const anchor = element('a');
    anchor.href = url;
    anchor.download = `routine-planner-${localDate()}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  });
  byId('import').addEventListener('change', () => {
    byId('restore').disabled = !byId('import').files.length;
  });
  byId('restore').addEventListener('click', async () => {
    const file = byId('import').files[0];
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new DataError('backupTooLarge');
      const next = validate(JSON.parse(await file.text()));
      if (!confirm(messages.restoreConfirm({ count: next.entries.length }))) return;
      store.restore(next);
      byId('import').value = '';
      byId('restore').disabled = true;
      onRestored();
      notice(messages.backupRestored);
    } catch (error) {
      notice(messages.restoreFailed({ reason: errorMessage(error) }));
    }
  });
}
