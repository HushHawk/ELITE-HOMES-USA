import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const unique = randomUUID().slice(0, 8);
const email = `review-${unique}@example.com`;

test('carousel controls, film, property modal, FAQ and mobile navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('talk about');
  await page.getByRole('button', { name: 'Next slide' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('see it first');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Make your move.');
  await expect.poll(() => page.locator('video').evaluate(video => (video as HTMLVideoElement).readyState)).toBeGreaterThan(1);
  await page.getByRole('button', { name: 'Pause background film' }).click();
  await expect(page.getByRole('button', { name: 'Play background film' })).toBeVisible();
  await page.getByRole('button', { name: 'Single-family homes' }).click();
  await expect(page.getByRole('dialog', { name: 'Single-family homes' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Single-family homes' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Single-family homes' })).toBeFocused();
  await page.getByText('Do I need to make repairs first?').click();
  await expect(page.getByText('No. Tell us about any repairs or updates the home needs')).toBeVisible();
  await page.getByRole('button', { name: 'Traditional listing' }).click();
  await expect(page.getByText('Repairs, cleaning or staging may be recommended.')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('dialog', { name: 'Main navigation' }).getByRole('link', { name: 'Services' }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.getByRole('dialog', { name: 'Main navigation' })).not.toBeVisible();
});

test('complete a real offer, view the receipt and update it from the owner inbox', async ({ page }) => {
  await page.goto('/get-offer?from=property&type=Townhomes');
  await expect(page.getByLabel('Property type')).toHaveValue('Townhomes');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Street address')).toBeFocused();
  await page.getByLabel('Street address').fill(`14 Test Lane ${unique}`);
  await page.getByLabel('City', { exact: true }).fill('Jacksonville');
  await page.getByLabel('ZIP code').fill('32218');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Overall condition').selectOption('Needs work');
  await page.getByLabel('Occupancy').selectOption('Vacant');
  await page.getByLabel('When would you like to sell?').selectOption('Exploring options');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByLabel('ZIP code')).toHaveValue('32218');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Occupancy')).toHaveValue('Vacant');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Full name').fill('Test Seller');
  await page.getByLabel('Phone', { exact: true }).fill('904-555-0100');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Review your request' })).toBeVisible();
  await page.getByRole('button', { name: 'Submit Request' }).click();
  await expect(page.getByRole('heading', { name: 'Test request saved.' })).toBeVisible();
  await page.getByRole('link', { name: 'View receipt' }).click();
  await expect(page.getByRole('heading', { name: 'Test request saved.' })).toBeVisible();
  await expect(page.getByText(/Reference [a-f0-9-]{36}/)).toBeVisible();
  expect((await page.request.get('/api/admin/records')).status()).toBe(401);
  await page.goto('/admin');
  await page.getByLabel('Owner access secret').fill(process.env.ELITE_TEST_SECRET!);
  await page.getByRole('button', { name: 'Sign In to Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'General inquiries' }).click();
  await page.locator(".admin-record summary").filter({ hasText: `14 Test Lane ${unique}` }).click();
  const record = page.locator('.admin-record[open]');
  await record.getByLabel('Status').selectOption('Reviewing');
  await record.getByLabel('Add a private note').fill('Verified test inquiry.');
  await record.getByRole('button', { name: 'Save Changes' }).click();
  await expect(record.getByText('Verified test inquiry.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'General inquiries' }).click();
  await page.locator(".admin-record summary").filter({ hasText: `14 Test Lane ${unique}` }).click();
  await expect(record.getByLabel('Status')).toHaveValue('Reviewing');
  await expect(record.getByText('Verified test inquiry.')).toBeVisible();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page.getByRole('button', { name: 'Sign In to Dashboard', exact: true })).toBeVisible();
});

test('contact, consent, deduplication and unsubscribe', async ({ page, request, baseURL }) => {
  await page.goto('/contact');
  const form = page.locator('.contact-form');
  await form.getByLabel('First name').fill('Test');
  await form.getByLabel('Last name').fill('Contact');
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Phone').fill('9045550100');
  await form.getByLabel('How can we help?').fill('This is a preview test.');
  await form.getByRole('button', { name: 'Send My Question' }).click();
  await expect(page.getByText('Your test submission was saved.')).toBeVisible();
  await page.getByLabel('Email address').fill(email);
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Subscribe' }).click();
  const manage = page.getByRole('link', { name: 'Manage subscription' });
  await expect(manage).toBeVisible();
  const repeat = await request.post('/api/newsletter', { headers: { Origin: baseURL! }, data: { requestId: randomUUID(), data: { email, consent: true } } });
  expect(repeat.status()).toBe(201);
  expect((await repeat.json()).unsubscribeToken).toBeUndefined();
  await manage.click();
  await page.getByRole('button', { name: 'Unsubscribe', exact: true }).click();
  await expect(page.getByText('This subscription link is now inactive.')).toBeVisible();
});

test('server enforces origin, validation, honeypot and idempotency', async ({ request, baseURL }) => {
  const requestId = randomUUID();
  const data = { name: 'Test Contact', email, phone: '9045550100', message: 'A retryable test.' };
  const headers = { Origin: baseURL! };
  expect((await request.post('/api/contact', { data: { requestId, data } })).status()).toBe(403);
  expect((await request.post('/api/contact', { headers, data: { requestId, data: { ...data, phone: 'bad' } } })).status()).toBe(422);
  expect((await request.post('/api/contact', { headers, data: { requestId, data, website: 'spam' } })).status()).toBe(400);
  const sends = await Promise.all([1, 2].map(() => request.post('/api/contact', { headers, data: { requestId, data } })));
  const [first, second] = await Promise.all(sends.map(response => response.json()));
  expect(first.reference).toMatch(/[a-f0-9-]{36}/);
  expect(second.reference).toBe(first.reference);
});

test('routes render and homepage has no horizontal overflow', async ({ page }) => {
  test.setTimeout(120_000);
  for (const path of ['/', '/about', '/services', '/reviews', '/contact', '/get-offer', '/how-it-works', '/faq', '/privacypolicy', '/terms-of-use', '/thank-you']) {
    const result = await page.goto(path);
    expect(result?.status(), path).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  }
  expect((await page.goto('/does-not-exist'))?.status()).toBe(404);
  await page.goto('/');
  for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), String(width)).toBe(width);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  const violations = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(violations.violations).toEqual([]);
});
