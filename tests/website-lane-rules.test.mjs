import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { classifyFallback } = require('../netlify/functions/_quote.js');

test('website with more than five pages routes to custom', () => {
  const quote = classifyFallback('website', {
    pages_needed: 'Home, About, Services, Portfolio, Pricing, Contact',
    features: 'contact form',
    project_summary: 'Service business website',
  });

  assert.equal(quote.classification, 'custom');
  assert.equal(quote.deposit_cents, 25000);
});

test('website with dashboard routes to custom even with few pages', () => {
  const quote = classifyFallback('website', {
    pages_needed: 'Home, About, Contact',
    features: 'admin dashboard and client portal',
    project_summary: 'Need a business website with a dashboard',
  });

  assert.equal(quote.classification, 'custom');
});
