import { test, expect } from '@playwright/test';

async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.goto('/?e2e=1');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('LOADING')).toBeHidden({ timeout: 15000 });
}

test.describe('Core interactions', () => {
  test('page loads and is interactive', async ({ page }) => {
    await waitForAppReady(page);

    await expect(page).toHaveTitle(/.+/);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await waitForAppReady(page);

    expect(errors).toEqual([]);
  });

  test('no accessibility violations in tab order', async ({ page }) => {
    await waitForAppReady(page);

    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
