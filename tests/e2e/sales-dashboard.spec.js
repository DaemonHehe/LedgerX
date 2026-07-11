import { test, expect } from '@playwright/test';

test.describe('Sales Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the templates API
    await page.route('**/api/templates**', async (route) => {
      await route.fulfill({ json: [] });
    });

    // Mock the receipts API
    await page.route('**/api/receipts**', async (route) => {
      const url = route.request().url();
      if (url.includes('/stats')) {
        await route.fulfill({ json: { totalRevenue: 1000, totalReceipts: 10, avgReceiptValue: 100, growth: 5 } });
      } else if (url.includes('/analytics/weekly')) {
        await route.fulfill({ json: [] });
      } else if (url.includes('/analytics/monthly')) {
        await route.fulfill({ json: [] });
      } else if (url.includes('/analytics/by-template')) {
        await route.fulfill({ json: [] });
      } else {
        const json = [
          {
            id: 'receipt-1',
            created_at: new Date().toISOString(),
            templates: { name: 'Invoice Template' },
            form_data: { customer_name: 'Alice Smith', total_amount: '$150.00' }
          },
          {
            id: 'receipt-2',
            created_at: new Date().toISOString(),
            templates: { name: 'Standard Receipt' },
            form_data: { customer_name: 'Bob Jones', total_amount: '$45.00' }
          }
        ];
        await route.fulfill({ 
          json,
          headers: { 
            'x-total-count': '2',
            'access-control-expose-headers': 'x-total-count'
          }
        });
      }
    });

    await page.goto('/dashboard?devAuth=1');
  });

  test('should load and display grid records', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    
    await expect(page.getByText('Sales Dashboard')).toBeVisible();
    await page.getByRole('button', { name: 'Ledger' }).click();
    
    // Check if ag-grid is populated
    await page.waitForTimeout(2000);
    const gridHtml = await page.locator('.ledgerx-grid').innerHTML();
    console.log("GRID HTML:", gridHtml);
    await expect(page.getByText('Invoice Template')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Alice Smith')).toBeVisible();
    await expect(page.getByText('$150.00')).toBeVisible();

    await expect(page.getByText('Standard Receipt')).toBeVisible();
    await expect(page.getByText('Bob Jones')).toBeVisible();
    await expect(page.getByText('$45.00')).toBeVisible();
  });
});
