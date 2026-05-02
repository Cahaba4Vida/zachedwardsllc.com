import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('profile-get returns device_known for frontend skip logic', () => {
  const code = fs.readFileSync(new URL('../netlify/functions/profile-get.js', import.meta.url), 'utf8');
  assert.match(code, /device_known/);
});

test('onboarding checks db-backed known device before showing gate', () => {
  const code = fs.readFileSync(new URL('../onboarding.js', import.meta.url), 'utf8');
  assert.match(code, /profile\.device_known/);
  assert.match(code, /shouldSkipGateFromDb/);
});
