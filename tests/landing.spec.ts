import { test, expect } from '@playwright/test';

test.describe('RepoSage Prime Landing & Auth Flow', () => {
  test('homepage has correct title and call to action', async ({ page }) => {
    // 1. Navigate to the homepage
    await page.goto('http://localhost:3000/');

    // 2. Check the title
    await expect(page).toHaveTitle(/RepoSage Prime/);

    // 3. Ensure the Sign In button is visible and works
    const signInButton = page.getByRole('link', { name: /Sign In/i });
    await expect(signInButton).toBeVisible();
    
    // 4. Click it and verify it redirects to Clerk Auth
    await signInButton.click();
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

  test('API health route is responding', async ({ request }) => {
    // Test that your Next.js API isn't throwing 500 errors
    const response = await request.get('/api/demo');
    // It might return 400 (Bad Request) if we don't pass a body, 
    // but as long as it's not a 500 (Internal Server Error), the route is alive!
    expect(response.status()).not.toBe(500);
  });
});