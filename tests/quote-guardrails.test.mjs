import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeQuote } = require('../netlify/functions/_quote.js');

test('basic website quote clamps to allowed range and fixed billing fields', () => {
  const q = normalizeQuote('website', { classification: 'basic', quoted_total_cents: 1000 }, { business_name: 'Test Co' });
  assert.equal(q.classification, 'basic');
  assert.equal(q.deposit_cents, 10000);
  assert.equal(q.monthly_cents, 1000);
  assert.equal(q.quoted_total_cents, 90000);
});

test('custom app quote clamps to allowed range and fixed billing fields', () => {
  const q = normalizeQuote('app', { classification: 'custom', quoted_total_cents: 99999999 }, { business_name: 'App Co' });
  assert.equal(q.classification, 'custom');
  assert.equal(q.deposit_cents, 100000);
  assert.equal(q.monthly_cents, 7500);
  assert.equal(q.quoted_total_cents, 3500000);
});


test('basic software quote clamps to allowed range and fixed billing fields', () => {
  const q = normalizeQuote('software', { classification: 'basic', quoted_total_cents: 1000 }, { business_name: 'Ops Tool' });
  assert.equal(q.classification, 'basic');
  assert.equal(q.deposit_cents, 25000);
  assert.equal(q.monthly_cents, 0);
  assert.equal(q.quoted_total_cents, 200000);
});
