import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('POST /api/search returns items', async ({ request }) => {
  if (!fs.existsSync('prefs.example.json')) test.skip(true, 'prefs.example.json missing');
  const body = JSON.parse(fs.readFileSync('prefs.example.json', 'utf8'));
  const res = await request.post('/api/search', { data: body });
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(Array.isArray(json.items)).toBeTruthy();
});


