import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { classifyFallback } = require('../netlify/functions/_quote.js');

test('website basic fallback returns actual quoted total above deposit', () => {
  const quote = classifyFallback('website', {
    pages_needed: 'Home, About, Contact',
    features: 'forms',
    project_summary: 'Simple business website for lead generation',
  });

  assert.equal(quote.classification, 'basic');
  assert.equal(quote.deposit_cents, 10000);
  assert.ok(quote.quoted_total_cents > quote.deposit_cents);
});

test('app custom fallback returns custom quote and fixed custom deposit', () => {
  const quote = classifyFallback('app', {
    platforms: 'Both',
    auth_needed: 'Yes',
    payments_needed: 'Yes',
    features: 'AI chatbot, admin dashboard, analytics, automation',
    project_summary: 'A multi-role app with subscriptions, voice AI, dashboards, and analytics',
  });

  assert.equal(quote.classification, 'custom');
  assert.equal(quote.deposit_cents, 100000);
  assert.ok(quote.quoted_total_cents >= 850000);
});


test('software request fallback returns a valid software quote', () => {
  const quote = classifyFallback('software', {
    goal: 'Automation workflow',
    features: 'dashboard, login, API integrations, automation',
    project_summary: 'Need a custom internal tool with roles, dashboards, and workflow automation',
  });

  assert.equal(quote.kind, 'software');
  assert.equal(quote.classification, 'custom');
  assert.equal(quote.deposit_cents, 75000);
  assert.ok(quote.quoted_total_cents >= 600000);
});
