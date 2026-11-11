import test from 'node:test';
import assert from 'node:assert/strict';

import * as module from '../web/storage.mjs';
const entry = {
  id: 'one',
  routineId: null,
  name: 'Personal workout',
  date: '2026-11-11',
  slot: 'am',
  count: 1,
  minutes: 12,
  kcal: 50,
  load: { core: 2 },
};
function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
  };
}
test('history persists through a new store instance and preserves user names', () => {
  const storage = memoryStorage();
  const store = module.createHistoryStore(storage);
  store.load();
  store.save([entry]);
  const reloaded = module.createHistoryStore(storage);
  reloaded.load();
  assert.deepEqual(reloaded.state.entries, [entry]);
});
test('unreadable history is protected until a valid restore succeeds', () => {
  const storage = memoryStorage('{broken');
  const store = module.createHistoryStore(storage);
  assert.throws(() => store.load());
  assert.equal(store.writable, false);
  assert.throws(() => store.save([entry]), { code: 'historyUnreadable' });
  assert.equal(storage.getItem(), '{broken');
  assert.throws(() => store.restore({ version: 2, entries: [] }));
  assert.equal(store.writable, false);
  store.restore({ version: 1, entries: [entry] });
  assert.equal(store.writable, true);
  assert.deepEqual(store.state.entries, [entry]);
});
test('a failed write preserves the last successful history', () => {
  const storage = memoryStorage(JSON.stringify({ version: 1, entries: [entry] }));
  const store = module.createHistoryStore(storage);
  store.load();
  storage.setItem = () => {
    throw new Error('Storage quota exceeded');
  };
  assert.throws(() => store.save([]));
  assert.deepEqual(store.state.entries, [entry]);
});
test('a failed recovery write keeps unreadable history protected', () => {
  const storage = memoryStorage('invalid');
  const store = module.createHistoryStore(storage);
  assert.throws(() => store.load());
  storage.setItem = () => {
    throw new Error('Storage unavailable');
  };
  assert.throws(() => store.restore({ version: 1, entries: [entry] }));
  assert.equal(store.writable, false);
});

test('storage uses the original key and accepts an existing v1 backup', () => {
  assert.equal(module.STORAGE_KEY, 'routine-planner.v1');
  let savedKey;
  const store = module.createHistoryStore({
    getItem: (key) => {
      assert.equal(key, 'routine-planner.v1');
      return JSON.stringify({ version: 1, entries: [entry] });
    },
    setItem: (key) => {
      savedKey = key;
    },
  });
  store.load();
  assert.deepEqual(store.state.entries, [entry]);
  store.save([]);
  assert.equal(savedKey, 'routine-planner.v1');
});

test('external history updates are validated and deletion resets in-memory history', () => {
  const store = module.createHistoryStore(memoryStorage());
  store.receive(JSON.stringify({ version: 1, entries: [entry] }));
  assert.deepEqual(store.state.entries, [entry]);
  assert.throws(() => store.receive('{broken'));
  assert.equal(store.writable, false);
  assert.deepEqual(store.state.entries, [entry]);
  store.receive(null);
  assert.equal(store.writable, true);
  assert.deepEqual(store.state.entries, []);
});
