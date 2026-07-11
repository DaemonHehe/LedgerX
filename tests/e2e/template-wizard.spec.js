import { test, expect } from '@playwright/test';

test.describe('Template Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the template creation API
    await page.route('**/api/templates', async (route) => {
      if (route.request().method() === 'POST') {
        const json = { id: 'new-wizard-uuid' };
        await route.fulfill({ json });
      } else {
        route.continue();
      }
    });

    // Mock the subsequent template fetch
    await page.route('**/api/templates/new-wizard-uuid', async (route) => {
      const json = {
        id: 'new-wizard-uuid',
        name: 'Wizard Template',
        is_example: false,
        schema_json: { width: 400, height: 600, backgroundColor: '#ffffff', elements: [] }
      };
      await route.fulfill({ json });
    });

    // Go directly to wizard with devAuth
    await page.goto('/deck/wizard?devAuth=1');
  });

  test('should complete the wizard flow', async ({ page }) => {
    // Step 1: Format
    await expect(page.getByRole('heading', { name: /Choose format/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Thermal/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 2: Header
    await expect(page.getByRole('heading', { name: /Header layout/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Stacked/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 3: Customer
    await expect(page.getByRole('heading', { name: /Customer Details/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /No Customer Info/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 4: Body
    await expect(page.getByRole('heading', { name: /Body/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Bordered Grid/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 5: Totals
    await expect(page.getByRole('heading', { name: /Total section/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /No Total Row/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    // Step 6: Footer
    await expect(page.getByRole('heading', { name: /Footer style/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /Centered Note/ }).click();
    await page.getByRole('button', { name: 'Save & Customize' }).click();

    // After creation, should redirect to canvas editor
    await expect(page).toHaveURL(/.*\/deck\/[a-zA-Z0-9-]+/);
    await expect(page.getByRole('button', { name: 'Save Template JSON' }).first()).toBeVisible();
  });
});
