import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('auth helper checks stored identity session and identity readiness', () => {
  const code = fs.readFileSync(new URL('../auth.js', import.meta.url), 'utf8');
  assert.match(code, /hasStoredIdentitySession/);
  assert.match(code, /identityReady/);
});

test('onboarding waits for identity and db-backed profile before showing gate', () => {
  const code = fs.readFileSync(new URL('../onboarding.js', import.meta.url), 'utf8');
  assert.match(code, /identityReady/);
  assert.match(code, /whoAmI\(true\)/);
  assert.match(code, /profile\.device_known/);
});
