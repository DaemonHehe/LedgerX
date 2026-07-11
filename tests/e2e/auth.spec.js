import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
  });

  test('should display login form correctly', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Sign in');
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText(/Login/);
  });

  test('should validate empty fields', async ({ page }) => {
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.login-error')).toHaveText('Enter an email and password to continue.');
  });

  test('should toggle to signup mode', async ({ page }) => {
    await page.getByText('Create one').click();
    
    // Check if mode switched
    await expect(page.locator('h1')).toHaveText('Create account');
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText(/Create account/);
    
    // Toggle back
    await page.getByText('Sign in').click();
    await expect(page.locator('h1')).toHaveText('Sign in');
  });

  test('should show forgot password flow validation', async ({ page }) => {
    await page.getByText('Forgot password?').click();
    await expect(page.locator('.login-error')).toHaveText('Enter your email above first, then tap "Forgot password?".');
  });
});
