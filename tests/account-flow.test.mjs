import assert from 'node:assert/strict';
import fs from 'node:fs';

const accountHtml = fs.readFileSync(new URL('../account/index.html', import.meta.url), 'utf8');
const requestJs = fs.readFileSync(new URL('../request.js', import.meta.url), 'utf8');
assert.match(accountHtml, /data-projects/, 'account page should expose a client projects container');
assert.match(accountHtml, /data-account-banner/, 'account page should expose a checkout banner container');
assert.match(requestJs, /accepted_terms/, 'request flow should require accepted terms before checkout');
assert.match(requestJs, /data-terms-check/, 'request flow should render agreement checkboxes');
console.log('account flow smoke test passed');
