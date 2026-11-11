import { DataError, validate } from './validation.mjs';

export const STORAGE_KEY = 'routine-planner.v1';

/** Storage is injected so persistence failures can be tested without a browser. */
export function createHistoryStore(storage) {
  let state = { version: 1, entries: [] };
  let writable = true;

  function receive(raw) {
    try {
      state = raw === null ? { version: 1, entries: [] } : validate(JSON.parse(raw));
      writable = true;
      return state;
    } catch (error) {
      writable = false;
      throw error;
    }
  }

  function write(next) {
    // Publish in-memory state only after the browser accepts the write.
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
    state = next;
    writable = true;
    return state;
  }

  return {
    get state() {
      return state;
    },
    get writable() {
      return writable;
    },
    load() {
      try {
        return receive(storage.getItem(STORAGE_KEY));
      } catch (error) {
        writable = false;
        throw error;
      }
    },
    save(entries) {
      if (!writable) throw new DataError('historyUnreadable');
      return write(validate({ version: 1, entries }));
    },
    restore(data) {
      return write(validate(data));
    },
    receive,
  };
}
