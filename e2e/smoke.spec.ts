import { test, expect } from '@playwright/test';

test('home loads and shows calendar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Inbox/i)).toBeVisible();
  await expect(page.getByText(/Standup/i)).toBeVisible();
});
