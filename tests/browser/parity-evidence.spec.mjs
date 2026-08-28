import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const mappings = JSON.parse(readFileSync('parity/symbol-mappings.json', 'utf8')).mappings;
const demonstrations = [...new Map(
  mappings.filter(({ demonstration }) => demonstration).map(({ demonstration }) => [`${demonstration.route}:${demonstration.selector}`, demonstration])
).values()];

test('every recorded executable demonstration resolves on its declared route', async ({ page }) => {
  for (const demonstration of demonstrations) {
    await page.goto(`/#${demonstration.route}`);
    await expect(page.locator(demonstration.selector), `${demonstration.route} ${demonstration.selector}`).toHaveCount(1);
  }
});

test('final parity demonstrations execute observable SDK behavior', async ({ page }) => {
  await page.goto('/#/components/toast');
  await page.locator('[data-sdk-with-toast]').click();
  await expect(page.locator('#sdk-with-toast-output')).toContainText('Shipment saved');

  await page.goto('/#/components/navigation/overview');
  await expect(page.locator('#sdk-parent-output')).toContainText('parent:');
  await expect(page.locator('#sdk-greeting-output')).not.toBeEmpty();

  await page.goto('/#/components/overlays');
  await page.locator('[data-sdk-overlay="confirm"]').click();
  await expect(page.locator('africanies-confirm-dialog')).toHaveCount(1);
});
