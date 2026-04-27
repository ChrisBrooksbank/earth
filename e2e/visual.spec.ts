import { test, expect } from '@playwright/test';

/**
 * Visual smoke tests for the Earth Explorer 3D app.
 *
 * This is a WebGL/Three.js app — "visible content" means the canvas rendered
 * and the UI overlay panels appeared, not just that the DOM exists.
 *
 * Run:   npm run test:e2e
 * Update snapshots:  npm run test:e2e:update-snapshots
 */

async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.goto('/?e2e=1');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByText('LOADING')).toBeHidden({ timeout: 15000 });
}

test.describe('Smoke: app renders correctly', () => {
  test('canvas is present and has viewport dimensions', async ({ page }) => {
    await waitForAppReady(page);

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(viewport!.width - 1);
    expect(box!.height).toBeGreaterThanOrEqual(viewport!.height - 1);
  });

  test('UI overlay panels are present', async ({ page }) => {
    await waitForAppReady(page);

    // BodySelector — top-left dropdown trigger
    const bodySelector = page
      .locator('button')
      .filter({ hasText: /earth|mercury|venus|mars|jupiter|saturn|select body/i })
      .first();
    await expect(bodySelector).toBeVisible();

    // ViewModeToggle — top-center pill (contains "Earth" or "Solar System" button)
    const viewToggle = page
      .locator('button')
      .filter({ hasText: /solar system|return to earth|explore/i })
      .first();
    await expect(viewToggle).toBeVisible();
  });

  test('no console errors on load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await waitForAppReady(page);

    // Filter out known benign browser noise
    const realErrors = consoleErrors.filter(
      e => !e.includes('favicon') && !e.includes('net::ERR_')
    );
    expect(realErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('no error overlay visible', async ({ page }) => {
    await waitForAppReady(page);

    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText(/application error/i)).not.toBeVisible();
    await expect(page.getByText(/unhandled runtime error/i)).not.toBeVisible();
  });

  test('page has meaningful rendered height', async ({ page }) => {
    await waitForAppReady(page);

    const bodyHeight = await page.locator('body').evaluate(el => el.scrollHeight);
    expect(bodyHeight).toBeGreaterThan(400);
  });

  test('no broken image/texture requests', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', res => {
      if (
        res.request().resourceType() === 'image' &&
        !res.ok() &&
        res.status() !== 0 // 0 = cancelled (e.g. WebGL texture already loaded)
      ) {
        failed.push(`${res.status()} ${res.url()}`);
      }
    });

    await waitForAppReady(page);

    expect(failed).toEqual([]);
  });
});

test.describe('Visual regression snapshots', () => {
  test('homepage — initial load', async ({ page }) => {
    await waitForAppReady(page);
    // Give Three.js a moment to render the first frame
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: false,
      animations: 'disabled',
      timeout: 15000,
      maxDiffPixelRatio: 0.03, // 3% tolerance — GPU/font anti-aliasing varies
    });
  });
});
