import { test, expect } from '@playwright/test';

test.describe('Receipt Preview Form', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the templates list API call
    await page.route('**/api/templates', async (route) => {
      const json = [
        {
          id: 'test-uuid-1',
          name: 'My Canvas Template',
          is_example: false,
          schema_json: { width: 380, height: 600, backgroundColor: '#ffffff', elements: [] }
        }
      ];
      await route.fulfill({ json });
    });

    // Mock the specific template fetch
    await page.route('**/api/templates/test-uuid-1', async (route) => {
      const json = {
        id: 'test-uuid-1',
        name: 'Invoice Template',
        is_example: false,
        schema_json: { 
          width: 380, 
          height: 600, 
          backgroundColor: '#ffffff', 
          elements: [
            {
              id: 'el-1',
              type: 'text',
              content: 'Customer Name',
              isDynamic: true,
              fieldKey: 'customer_name',
              x: 10, y: 10, width: 200, height: 30
            }
          ] 
        }
      };
      await route.fulfill({ json });
    });

    // Mock the POST receipt call
    await page.route('**/api/receipts*', async (route) => {
      if (route.request().method() === 'POST') {
        if (route.request().url().includes('/share')) {
          await route.fulfill({ json: { share_token: 'test-token' } });
        } else {
          await route.fulfill({ json: { id: 'new-receipt-id' } });
        }
      } else {
        await route.fulfill({ json: [] });
      }
    });

    // Mock templates list for the TemplatePicker
    await page.route('**/api/templates', async (route) => {
      const json = [{
        id: 'test-uuid-1',
        name: 'Invoice Template',
        schema_json: { width: 300, height: 400, backgroundColor: '#ffffff', elements: [] },
        is_example: true,
        created_at: new Date().toISOString()
      }];
      await route.fulfill({ json });
    });

    // Mock customers
    await page.route('**/api/customers', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/preview/test-uuid-1?devAuth=1');
  });

  test('should render dynamic form and live preview', async ({ page }) => {
    await expect(page.getByText('Generate Receipt').first()).toBeVisible();
    await expect(page.getByText(/customer name/i).first()).toBeVisible(); // label
    await expect(page.getByPlaceholder('Customer Name')).toBeVisible();
  });

  test('should bind form input to preview and export', async ({ page }) => {
    // Fill the dynamic field
    await page.getByPlaceholder('Customer Name').fill('John Doe');

    // Due to the DOM structure, verify the preview contains John Doe
    // The TemplateRenderer might render it inside a specific class, we check visibility
    await expect(page.getByText('John Doe')).toBeVisible();

    // Click Export PNG
    await page.getByRole('button', { name: 'PNG' }).click();
    
    // Verify toast for successful save
    await expect(page.getByText('Receipt saved to Ledger')).toBeVisible();
  });
});
