
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('agents page exists and points to workspace', () => {
  const html = fs.readFileSync(new URL('../agents/index.html', import.meta.url), 'utf8');
  assert.match(html, /Open AI agent workspace/i);
  assert.match(html, /zeagentic\.netlify\.app/);
});

test('homepage routes agents internally first', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /href="\/agents\/" data-service-card="agents"/);
  assert.match(html, /data-route-browse="\/agents\/" data-route-start="\/agents\//);
});
