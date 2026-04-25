import { expect, test } from '@playwright/test'

test('dev-mode attendee can navigate the core tabs', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'NerdCon Quest' })).toBeVisible()

  await page.getByRole('link', { name: /quests/i }).click()
  await expect(page.getByRole('heading', { name: /Quests/i })).toBeVisible()

  await page.getByRole('link', { name: /community/i }).click()
  await expect(page.getByRole('heading', { name: 'Community' })).toBeVisible()

  await page.getByRole('link', { name: /profile/i }).click()
  await expect(page.getByRole('heading', { name: 'Character Sheet' })).toBeVisible()
})
