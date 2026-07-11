import { test, expect } from '@playwright/test';

test.describe('Template Editor (Canvas)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the template fetch and update API calls
    await page.route('**/api/templates*', async (route) => {
      if (route.request().method() === 'PUT' || route.request().method() === 'POST') {
        const json = { id: 'test-uuid-1' };
        await route.fulfill({ json });
      } else {
        const json = {
          id: 'test-uuid-1',
          name: 'My Canvas Template',
          is_example: false,
          schema_json: { width: 400, height: 600, backgroundColor: '#ffffff', elements: [] }
        };
        await route.fulfill({ json });
      }
    });

    await page.goto('/deck/test-uuid-1?devAuth=1');
  });

  test('should render canvas and toolbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Save Template JSON' })).toBeVisible();
    
    // Check if toolbar buttons are present
    await expect(page.getByTitle('Add Text')).toBeVisible();
    await expect(page.getByTitle('Add Image')).toBeVisible();
    await expect(page.getByTitle('Add Barcode')).toBeVisible();
  });

  test('should add a text element and save', async ({ page }) => {
    await page.getByTitle('Add Text').click();

    // Verify properties panel updates
    await expect(page.getByText('text properties')).toBeVisible();

    // Save Template
    const savePromise = page.waitForResponse(response => 
      response.url().includes('/api/templates') && (response.request().method() === 'PUT' || response.request().method() === 'POST')
    );
    await page.getByRole('button', { name: 'Save Template JSON' }).click();
    
    const saveResponse = await savePromise;
    expect(saveResponse.status()).toBe(200);
    
    // Check if toast appears
    await expect(page.getByText('Template saved successfully')).toBeVisible();
  });
});
