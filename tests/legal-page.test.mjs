import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const legalHtml = fs.readFileSync(new URL('../legal/index.html', import.meta.url), 'utf8');
const requestJs = fs.readFileSync(new URL('../request.js', import.meta.url), 'utf8');

test('legal page exists with deposit policy copy', () => {
  assert.match(legalHtml, /deposit policy/i);
  assert.match(legalHtml, /quote acceptance/i);
});

test('request flow links to legal page', () => {
  assert.match(requestJs, /\/legal\//);
});
