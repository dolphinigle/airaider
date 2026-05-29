import { test, expect } from '@playwright/test';

// Smoke test: loads the GUI, verifies status bar + end-day, opens
// build modal via cell click, opens pursue modal via lead pursue button.
// Assumes server + vite dev are already running on :3000 and :5173.

test('GUI loads + core widgets render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('app-root')).toBeVisible();
  await expect(page.getByTestId('status-bar')).toBeVisible();
  await expect(page.getByTestId('end-day')).toContainText(/END DAY/i);
  await expect(page.getByTestId('fort-grid')).toBeVisible();
  await expect(page.getByTestId('lead-board')).toBeVisible();
  await expect(page.getByTestId('captive-panel')).toBeVisible();
  await expect(page.getByTestId('merc-panel')).toBeVisible();
  await expect(page.getByTestId('log-panel')).toBeVisible();
});

test('click empty cell opens BuildModal', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('app-root').waitFor();
  // Cell 2 is the empty starter cell.
  await page.getByTestId('cell-2').click();
  await expect(page.getByTestId('build-modal')).toBeVisible();
  await expect(page.getByTestId('build-scouting-post')).toBeVisible();
});

test('END DAY button + pursue lead flow', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('app-root').waitFor();
  // If scouting-post not yet built, build it first.
  if (await page.getByTestId('cell-2').textContent().then((t) => t?.includes('build room'))) {
    await page.getByTestId('cell-2').click();
    await page.getByTestId('build-scouting-post').click();
  }
  // Click END DAY at least once to refresh leads.
  await page.getByTestId('end-day').click();
  // Wait for a lead to appear.
  await page.waitForSelector('[data-testid^="lead-"]', { timeout: 5000 });
  // Click first pursue button.
  const pursueBtn = page.locator('[data-testid^="pursue-"]').first();
  await pursueBtn.click();
  await expect(page.getByTestId('pursue-modal')).toBeVisible();
  await expect(page.getByTestId('pursue-party-zone')).toBeVisible();
});
