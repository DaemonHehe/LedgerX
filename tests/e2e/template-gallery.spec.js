import { test, expect } from '@playwright/test';

test.describe('Template Gallery', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the templates API call
    await page.route('**/api/templates', async (route) => {
      const json = [
        {
          id: 'test-uuid-1',
          name: 'Example Template',
          is_example: true,
          schema_json: { width: 400, height: 600, backgroundColor: '#fff', elements: [] }
        },
        {
          id: 'test-uuid-2',
          name: 'My Custom Template',
          is_example: false,
          schema_json: { width: 380, height: 500, backgroundColor: '#fff', elements: [] }
        }
      ];
      await route.fulfill({ json });
    });
    
    await page.goto('/deck?devAuth=1');
  });

  test('should display the gallery with mocked templates', async ({ page }) => {
    await expect(page.getByText('Templates first')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create with wizard' })).toBeVisible();
    
    // Check if the mocked templates are rendered
    await expect(page.getByText('Example Template')).toBeVisible();
    await expect(page.getByText('My Custom Template')).toBeVisible();
  });

  test('should navigate to wizard', async ({ page }) => {
    await page.getByRole('button', { name: 'Create with wizard' }).click();
    await expect(page).toHaveURL(/.*\/deck\/wizard/);
    await expect(page.getByText('Choose format')).toBeVisible();
  });
});
