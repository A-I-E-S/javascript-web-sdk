import { expect, test } from '@playwright/test';

test('shell and route navigation are operable with a keyboard', async ({ page }) => {
  await page.goto('/#/overview');
  await expect(page.locator('html')).toHaveAttribute('data-sdk', 'registered');
  await expect(page.locator('#route-view')).toBeVisible();
  await expect(page.locator('#page-title')).toHaveText('Overview');

  const buttonLink = page.locator('a[href="#/components/button"]:visible').first();
  await buttonLink.focus();
  await expect(buttonLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/components\/button$/);
  await expect(page.locator('#page-title')).toHaveText('Button');
});

test('theme and shipping-mode controls expose observable state', async ({ page }) => {
  await page.goto('/#/overview');
  const theme = page.locator('#theme-toggle');
  const mode = page.locator('#shipping-mode-switch');

  await theme.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(theme).toHaveText('☀');
  await expect(theme).toHaveAttribute('aria-label', 'Use light theme');

  await mode.click();
  await expect(mode).toContainText('Import');
});

test('every canonical route renders without a not-found state', async ({ page }) => {
  const routes = [
    '/overview', '/components/button', '/components/alert', '/components/chip',
    '/components/action-menu', '/components/feedback', '/components/overlays',
    '/components/forms', '/components/filters', '/components/tooltip',
    '/components/toast', '/components/table', '/components/stepper',
    '/components/navigation/overview', '/components/navigation/documents',
    '/components/navigation/events', '/usecases/shipment', '/usecases/shipment/reference-1',
    '/usecases/onboarding/login', '/usecases/onboarding/forgot-password',
    '/usecases/onboarding/reset-password', '/lecture', '/icons', '/tokens', '/models', '/api'
  ];
  for (const route of routes) {
    await page.goto(`/#${route}`);
    await expect(page.locator('#route-view')).not.toContainText('Not found');
  }
});

test('compiled Tailwind stylesheet preserves responsive shell and dark computed state', async ({ page }, testInfo) => {
  await page.goto('/#/overview');
  const stylesheet = await page.locator('link[rel="stylesheet"]').getAttribute('href');
  expect(stylesheet).toBe('/packages/theme/theme.css');

  const desktop = testInfo.project.name.includes('desktop');
  await expect(page.locator('#side-nav')).toHaveCSS('display', desktop ? 'block' : 'none');
  await expect(page.locator('#mobile-navigation-toggle')).toHaveCSS('display', desktop ? 'none' : 'grid');

  await page.locator('#theme-toggle').click();
  const background = await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor);
  expect(background).toBe('rgb(2, 6, 23)');
});
