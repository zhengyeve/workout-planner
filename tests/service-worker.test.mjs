import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../web/sw.js', import.meta.url), 'utf8');
function worker(scope) {
  const handlers = {};
  const cached = [];
  const deleted = [];
  const cache = {
    addAll: async (paths) => cached.push(...paths),
    match: async (request) => ({ url: request.url, fromCache: true }),
  };
  const context = {
    URL,
    Set,
    Promise,
    self: {
      registration: { scope },
      addEventListener: (name, handler) => {
        handlers[name] = handler;
      },
    },
    caches: {
      open: async () => cache,
      keys: async () => ['routine-planner-shell-v4', 'unrelated-cache'],
      delete: async (key) => deleted.push(key),
    },
    fetch: () => {
      throw Error('Network should not be needed');
    },
  };
  vm.runInNewContext(source, context);
  return { handlers, cached, deleted };
}
test('offline cache installation includes all app modules and referenced assets', async () => {
  const { handlers, cached } = worker('https://example.com/planner/');
  await new Promise((resolve, reject) =>
    handlers.install({ waitUntil: (promise) => promise.then(resolve, reject) }),
  );
  const files = await readdir(new URL('../web/', import.meta.url));
  for (const file of files.filter((file) => file !== 'sw.js'))
    assert.ok(cached.includes(`./${file}`), `${file} must be cached`);
  for (const asset of cached)
    await assert.doesNotReject(
      readFile(new URL(`../web/${asset === './' ? 'index.html' : asset}`, import.meta.url)),
    );
});
test('cache activation removes only obsolete planner caches', async () => {
  const { handlers, deleted } = worker('https://example.com/planner/');
  await new Promise((resolve, reject) =>
    handlers.activate({ waitUntil: (promise) => promise.then(resolve, reject) }),
  );
  assert.deepEqual(deleted, ['routine-planner-shell-v4']);
});
test('offline fetch resolves cached modules under a hosting subdirectory', async () => {
  const { handlers } = worker('https://example.com/planner/');
  let response;
  handlers.fetch({
    request: { method: 'GET', url: 'https://example.com/planner/app.mjs' },
    respondWith: (promise) => {
      response = promise;
    },
  });
  assert.deepEqual(await response, { url: 'https://example.com/planner/app.mjs', fromCache: true });
  let intercepted = false;
  handlers.fetch({
    request: { method: 'GET', url: 'https://example.com/other/app.mjs' },
    respondWith: () => {
      intercepted = true;
    },
  });
  assert.equal(intercepted, false);
});
