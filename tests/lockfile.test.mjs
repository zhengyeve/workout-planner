import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Validate all platforms' dependencies, even optional packages skipped on this host.
test('lockfile dependencies have complete version and download metadata', async () => {
  const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
  for (const [path, dependency] of Object.entries(lock.packages)) {
    if (!path || dependency.link) continue;
    assert.match(
      dependency.version ?? '',
      /^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/,
      `${path}: invalid or missing version`,
    );
    assert.match(dependency.resolved ?? '', /^https:\/\//, `${path}: missing download URL`);
    assert.match(
      dependency.integrity ?? '',
      /^sha(256|384|512)-\S+$/,
      `${path}: missing integrity`,
    );
  }
});
