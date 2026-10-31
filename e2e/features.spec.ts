import { test, expect, type Page } from '@playwright/test';

async function open(page: Page, query = '') {
  await page.goto(`/?e2e=1${query}`);
  await expect(page.locator('canvas')).toBeVisible();
}

test.describe('Features', () => {
  // WebGL scenes are slow under software rendering in CI
  test.slow();

  test('city search pins the place and shows its details', async ({ page }) => {
    await open(page);
    const search = page.getByRole('combobox', { name: 'Search countries and cities' });
    await search.fill('tokyo');
    await expect(page.getByRole('option').first()).toContainText('Tokyo');
    await search.press('Enter');

    const panel = page.getByRole('region', { name: 'Pinned location' });
    await expect(panel).toContainText('Tokyo');
    await expect(panel).toContainText('Sunrise');
    await expect(panel).toContainText('Capital');

    await panel.getByRole('button', { name: 'Remove pin' }).click();
    await expect(panel).toBeHidden();
  });

  test('search supports arrow-key selection', async ({ page }) => {
    await open(page);
    const search = page.getByRole('combobox', { name: 'Search countries and cities' });
    await search.fill('guinea');
    await expect(page.getByRole('option').first()).toContainText('Guinea');
    await search.press('ArrowDown');
    await expect(page.getByRole('option', { selected: true })).toContainText('Guinea-Bissau');
  });

  test('a shared link opens a planet at a given moment', async ({ page }) => {
    await open(page, '&view=body&body=Mars&t=2030-01-01T00:00:00.000Z');
    // Planet textures must load before the camera can fly there
    await expect(page.getByText('Olympus Mons', { exact: false })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('sim-date')).toContainText('2030');
  });

  test('time controls can reverse time and set the date', async ({ page }) => {
    await open(page);
    const reverse = page.getByRole('button', { name: 'Run time backward' });
    await reverse.click();
    await expect(page.getByRole('button', { name: 'Run time forward' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await page.getByTestId('sim-date').click();
    await page.getByLabel('Simulation date and time (UTC)').fill('2031-07-04T15:30');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('sim-date')).toContainText('2031');
  });

  test('solar system labels fly to a planet', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Explore Solar System' }).click();
    await page.getByRole('button', { name: 'Fly to Saturn' }).click({ timeout: 30_000 });
    await expect(page.getByText('Its rings are made mostly of ice and rock')).toBeVisible({
      timeout: 15_000,
    });
  });
  test('scale panel switches layout and shows light travel time', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Explore Solar System' }).click();
    const panel = page.getByRole('region', { name: 'Scale' });
    await expect(panel.getByRole('button', { name: 'Museum' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(panel.getByTestId('light-time')).toContainText('8 min');

    await panel.getByRole('button', { name: 'True scale' }).click();
    await expect(panel.getByRole('button', { name: 'True scale' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(panel).toContainText('109 Earths wide');

    await panel.getByRole('button', { name: 'Size lineup' }).click();
    await expect(panel).toContainText('Jupiter is 11 Earths wide');
    // The body list would hide small planets in the lineup
    await expect(page.getByRole('navigation', { name: 'Solar system bodies' })).toBeHidden();

    await panel.getByRole('button', { name: 'Museum' }).click();
    await expect(page.getByRole('navigation', { name: 'Solar system bodies' })).toBeVisible();
  });

  test('the Moon view offers true scale and the next eclipse', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Earth-Moon-Sun' }).click();
    await page.getByRole('button', { name: 'True scale' }).click();
    await expect(page.getByText('shadow is a thin needle', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Next eclipse' }).click();
    await expect(page.getByText(/(Solar|Lunar) eclipse, about/)).toBeVisible();
    await page.getByRole('button', { name: 'Back to diagram' }).click();
    await expect(page.getByText('Not to scale.', { exact: false })).toBeVisible();
  });

  test('the guided tour starts on request and stops when the visitor takes over', async ({
    page,
  }) => {
    await open(page);
    // Tests open at a fixed view, so the attract mode stays off until asked for
    await expect(page.getByRole('region', { name: 'Guided tour' })).toBeHidden();
    await page.getByRole('button', { name: 'Tour', exact: true }).click();
    const tour = page.getByRole('region', { name: 'Guided tour' });
    await expect(tour).toContainText('Welcome to Earth');
    await tour.getByRole('button', { name: 'Next stop' }).click();
    await expect(tour).toContainText('The lights of night');
    await tour.getByRole('button', { name: 'Take control' }).click();
    await expect(tour).toBeHidden();
  });
});
