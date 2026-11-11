import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('English UI creates, edits, persists, exports, deletes and restores a custom workout', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('#add').click();
  await page.locator('[name=routine]').selectOption('custom');
  await page.locator('[name=customName]').fill('Evening walk');
  await page.locator('[name=minutes]').fill('25');
  await page.locator('[name=kcal]').fill('90');
  await page.locator('[name=tag-cardio]').selectOption('1');
  await page.locator('#entry-form button[type=submit]').click();
  await expect(page.locator('#daily')).toContainText('Evening walk');
  await page.reload();
  await expect(page.locator('#daily')).toContainText('25 min');
  await page.locator('#daily button').click();
  await page.locator('[name=count]').fill('2');
  await page.locator('#entry-form button[type=submit]').click();
  await expect(page.locator('#daily')).toContainText('50 min');
  await page.locator('[data-tab=settings]').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  await page.locator('[data-tab=today]').click();
  await page.locator('#daily button').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#remove').click();
  await expect(page.locator('#daily')).toContainText('No workouts');
  await page.locator('[data-tab=settings]').click();
  await page.locator('#import').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: await readFile(backupPath),
  });
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#restore').click();
  await expect(page.locator('#notice')).toHaveText('Backup restored.');
  await page.locator('[data-tab=history]').click();
  await expect(page.locator('#all-entries')).toContainText('Evening walk');
  await expect(page.locator('#all-entries')).toContainText('50 min');
  expect(errors).toEqual([]);
});

test('invalid restore does not replace saved history', async ({ page }) => {
  await page.goto('/');
  await page.locator('#add').click();
  await page.locator('#entry-form button[type=submit]').click();
  const before = await page.evaluate(() => localStorage.getItem('routine-planner.v1'));
  await page.locator('[data-tab=settings]').click();
  await page.locator('#import').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":2,"entries":[]}'),
  });
  await page.locator('#restore').click();
  await expect(page.locator('#notice')).toContainText('Backup format is not supported.');
  expect(await page.evaluate(() => localStorage.getItem('routine-planner.v1'))).toEqual(before);
});

test('offline reload preserves history and can save another workout', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('#add').click();
  await page.locator('#entry-form button[type=submit]').click();
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) throw Error('No active worker');
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#daily .row')).toHaveCount(1);
  await page.locator('#add').click();
  await page.locator('#entry-form button[type=submit]').click();
  await expect(page.locator('#daily .row')).toHaveCount(2);
});

test('recommendations can be recorded as a complete plan', async ({ page }) => {
  await page.goto('/');
  await page.locator('#recommend button').click();
  await expect(page.locator('#plans .plan')).toHaveCount(3);
  const itemCount = await page.locator('#plans .plan').first().locator('li').count();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#plans .plan').first().locator('button').click();
  await expect(page.locator('#daily .row')).toHaveCount(itemCount);
});

test('editing an existing routine preserves its historical snapshot', async ({ page }) => {
  const { default: bank } = await import('../../web/bank.mjs');
  const original = {
    id: 'old-entry',
    routineId: bank[0].id,
    name: 'Historical name',
    date: '2026-11-11',
    slot: 'am',
    count: 1,
    minutes: 42,
    kcal: 123,
    load: { core: 1 },
  };
  await page.goto('/');
  await page.evaluate(
    (entry) =>
      localStorage.setItem('routine-planner.v1', JSON.stringify({ version: 1, entries: [entry] })),
    original,
  );
  await page.reload();
  await page.locator('#date').fill(original.date);
  await page.locator('#date').dispatchEvent('change');
  await page.locator('#daily button').click();
  await page.locator('[name=count]').fill('2');
  await page.locator('#entry-form button[type=submit]').click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('routine-planner.v1')).entries[0],
  );
  expect(saved).toEqual({ ...original, count: 2 });
});

test('unreadable local data is not overwritten by a new workout', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('routine-planner.v1', '{broken'));
  await page.reload();
  await expect(page.locator('#notice')).toContainText('Unable to read local history');
  await page.locator('#add').click();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#entry-form button[type=submit]').click();
  expect(await page.evaluate(() => localStorage.getItem('routine-planner.v1'))).toBe('{broken');
  await expect(page.locator('#entry-dialog')).toBeVisible();
});

test('English screens fit the viewport', async ({ page }, testInfo) => {
  await page.goto('/');
  for (const tab of ['today', 'history', 'bank', 'settings']) {
    await page.locator(`[data-tab=${tab}]`).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `${tab} should fit`).toBe(false);
  }
  await page.locator('[data-tab=today]').click();
  await page.screenshot({ path: testInfo.outputPath('today.png'), fullPage: true });
});
