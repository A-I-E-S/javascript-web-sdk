import { expect, test } from '@playwright/test';

test('shell and route navigation are operable with a keyboard', async ({ page }) => {
  await page.goto('/#/overview');
  await expect(page.locator('html')).toHaveAttribute('data-sdk', 'registered');
  await expect(page.locator('#route-view')).toBeVisible();
  await expect(page.locator('#page-title')).toHaveText('Overview');

  const buttonLink = page.locator('a[href="#/components/button"]:visible').first();
  await buttonLink.focus();
  await expect(buttonLink).toBeFocused();
  await buttonLink.press('Enter');
  await expect(page).toHaveURL(/#\/components\/button$/);
});

test('theme and shipping-mode controls expose observable state', async ({ page }) => {
  await page.goto('/#/overview');
  await page.evaluate(() => {
    localStorage.removeItem('africanies-playground-theme');
    localStorage.removeItem('africanies-playground-nav-state');
  });
  await page.reload();
  const theme = page.locator('#theme-toggle');
  const mode = page.locator('#shipping-mode-switch');

  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await expect(mode).toHaveAttribute('role', 'group');
  await expect(mode.getByRole('button')).toHaveCount(2);
  await expect(mode.locator('[data-mode="stn"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(mode.locator('[data-mode="sfn"]')).toHaveAttribute('aria-pressed', 'true');

  await theme.click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(theme).toContainText('Light');
  await expect(theme).toHaveAttribute('aria-label', 'Switch to light theme');
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await mode.locator('[data-mode="stn"]').click();
  await expect(mode.locator('[data-mode="stn"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-shipping-mode', 'stn');
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
    '/usecases/onboarding/reset-password', '/lecture', '/icons', '/tokens'
  ];
  for (const route of routes) {
    await page.goto(`/#${route}`);
    await expect(page.locator('#route-view')).not.toContainText('Not found');
  }
  await page.goto('/#/models');
  await expect(page).toHaveURL(/#\/overview$/);
  await page.goto('/#/api');
  await expect(page).toHaveURL(/#\/overview$/);
});

test('compiled Tailwind stylesheet preserves responsive shell and dark computed state', async ({ page }, testInfo) => {
  await page.goto('/#/overview');
  const stylesheet = await page.locator('link[rel="stylesheet"]').getAttribute('href');
  expect(stylesheet).toBe('/packages/theme/theme.css');

  const desktop = testInfo.project.name.includes('desktop');
  await expect(page.locator('#side-nav')).toHaveCSS('display', desktop ? 'flex' : 'none');
  const mobileToggle = page.locator('#mobile-navigation-toggle');
  if (desktop) await expect(mobileToggle).toHaveCSS('display', 'none');
  else expect(await mobileToggle.evaluate((element) => getComputedStyle(element).display)).toMatch(/flex/);

  await page.locator('#theme-toggle').click();
  const background = await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background).toBe('rgb(39, 39, 41)');
});

test('responsive shell keeps menu, title and shipping mode controls in canonical rows', async ({ page }, testInfo) => {
  await page.goto('/#/components/table');
  const desktop = testInfo.project.name.includes('desktop');
  const header = page.locator('.header');
  const title = page.locator('#page-title');
  const mode = page.locator('#shipping-mode-switch');
  await expect(mode.getByRole('button')).toHaveCount(2);
  if (!desktop) {
    const [headerBox, titleBox, menuBox] = await Promise.all([
      header.boundingBox(),
      title.boundingBox(),
      page.locator('#mobile-navigation-toggle').boundingBox()
    ]);
    if (testInfo.project.name.includes('mobile')) {
      expect(titleBox.y).toBeGreaterThan(menuBox.y + 30);
    } else {
      expect(titleBox.y).toBeLessThan(headerBox.y + 120);
      expect(titleBox.y).toBeGreaterThan(menuBox.y);
    }
  }
});

test('table, filters, modal and toast retain bounded Tailwind presentation', async ({ page }, testInfo) => {
  await page.goto('/#/components/table');
  const tableWrap = page.locator('.table-wrap').first();
  await expect(tableWrap).toHaveCSS('overflow-x', 'auto');
  const overflow = await tableWrap.evaluate((element) => ({ client: element.clientWidth, scroll: element.scrollWidth }));
  if (testInfo.project.name.includes('mobile')) expect(overflow.scroll).toBeGreaterThan(overflow.client);
  await expect(page.getByRole('button', { name: 'Export CSV' }).first()).toHaveCSS('font-weight', '700');

  await page.goto('/#/components/filters');
  const filterBar = page.locator('.filter-bar');
  const direction = await filterBar.evaluate((element) => getComputedStyle(element).flexDirection);
  expect(direction).toBe(testInfo.project.name.includes('mobile') ? 'column' : 'row');

  await page.goto('/#/components/overlays');
  await page.locator('[data-sdk-overlay="modal"]').click();
  const modal = page.locator('.africanies-modal-panel');
  await expect(modal).toBeVisible();
  expect((await modal.boundingBox()).width).toBeLessThanOrEqual(testInfo.project.use.viewport.width);
  await page.keyboard.press('Escape');

  await page.goto('/#/components/toast');
  await page.locator('[data-sdk-toast="success"]').click();
  const host = page.locator('africanies-toast-host');
  await expect(host).toBeVisible();
  const hostBox = await host.boundingBox();
  expect(hostBox.x + hostBox.width).toBeLessThanOrEqual(testInfo.project.use.viewport.width);
});

test('critical playground routes execute registered SDK elements rather than substitutes', async ({ page }) => {
  await page.goto('/#/components/forms');
  await expect(page.locator('[data-sdk-executable]')).toBeVisible();
  await expect(page.locator('[data-sdk-form] africanies-text-input')).toHaveCount(1);
  await expect(page.locator('[data-sdk-form] africanies-select')).toHaveCount(1);
  await expect(page.locator('[data-sdk-form] africanies-search-combobox')).toHaveCount(1);

  await page.goto('/#/components/table');
  await expect(page.locator('africanies-table[data-sdk-table]')).toHaveCount(1);
  const renderedRows = await page.locator('africanies-table[data-sdk-table]').evaluate((element) => element.shadowRoot?.querySelectorAll('tbody tr').length ?? 0);
  expect(renderedRows).toBe(2);

  await page.goto('/#/models');
  await expect(page).toHaveURL(/#\/overview$/);
  await page.goto('/#/api');
  await expect(page).toHaveURL(/#\/overview$/);
});

test('SDK overlay, toast, filter and icon demonstrations perform real work', async ({ page }) => {
  await page.goto('/#/components/overlays');
  await page.locator('[data-sdk-overlay="modal"]').click();
  await expect(page.locator('.africanies-overlay-backdrop')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.africanies-overlay-backdrop')).toHaveCount(0);

  await page.goto('/#/components/toast');
  await page.locator('[data-sdk-toast="stack"]').click();
  await expect(page.locator('africanies-toast-host')).toHaveCount(1);
  expect(await page.locator('africanies-toast-host').evaluate((element) => element.shadowRoot?.querySelectorAll('africanies-toast-item').length ?? 0)).toBeGreaterThan(0);

  await page.goto('/#/components/filters');
  await page.locator('[data-sdk-filter-apply]').click();
  await expect(page.locator('#sdk-filter-output')).not.toBeEmpty();

  await page.goto('/#/icons');
  await page.locator('[data-sdk-icons]').click();
  await expect(page.locator('#sdk-icon-output')).toContainText('SDK sprite loaded');
  await expect(page.locator('#africanies-icon-sprite')).toHaveCount(1);
});

test('final SDK adapters execute toast context, drawer panels and route/header helpers', async ({ page }) => {
  await page.goto('/#/components/toast');
  await page.locator('[data-sdk-with-toast]').click();
  await expect(page.locator('#sdk-with-toast-output')).toContainText('successMessage');

  await page.goto('/#/components/filters');
  await expect(page.locator('africanies-filter-drawer[data-sdk-filter-panel]')).toHaveCount(1);
  await page.locator('[data-sdk-filter-drawer]').click();
  await expect(page.locator('.africanies-drawer-panel africanies-filter-drawer')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/#/components/navigation/overview');
  await expect(page.locator('africanies-app-shell-header')).toHaveCount(1);
  await expect(page.locator('africanies-app-shell-content-header')).toHaveCount(1);
  await expect(page.locator('#sdk-parent-output')).toContainText('/components/navigation');
  await expect(page.locator('#sdk-greeting-output')).toContainText('Amara');

  await page.goto('/#/overview');
  await expect(page.locator('africanies-notification-drawer[data-sdk-notification-panel]')).toHaveCount(1);
  await expect(page.locator('africanies-notification-drawer[data-sdk-notification-panel]')).toContainText('Shipment update');
  await page.locator('[data-sdk-notifications]').click();
  await expect(page.locator('.africanies-drawer-panel africanies-notification-drawer')).toBeVisible();
});

test('confirm dialog surfaces async failure and supports an in-place retry', async ({ page }) => {
  await page.goto('/#/components/overlays');
  await page.locator('[data-sdk-confirm-retry]').click();
  const confirm = page.locator('africanies-confirm-dialog');
  await expect(confirm).toBeVisible();
  await confirm.locator('[data-action="confirm"]').click();
  await expect(page.locator('#sdk-confirm-output')).toContainText('Async error surfaced');
  await expect(confirm).toBeVisible();
  await confirm.locator('[data-action="confirm"]').click();
  await expect(page.locator('#sdk-confirm-output')).toContainText('Confirmed after retry: true');
  await expect(confirm).toHaveCount(0);
});
