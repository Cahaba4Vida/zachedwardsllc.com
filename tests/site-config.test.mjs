import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../site-config.json', import.meta.url), 'utf8'));
assert.equal(Array.isArray(config.wall_items), true, 'wall_items should be an array');
assert.equal(config.wall_items.length, 5, 'wall_items should have 5 entries');
assert.equal(Array.isArray(config.service_cards), true, 'service_cards should be an array');
assert.equal(config.service_cards.length >= 6, true, 'service_cards should have at least 6 entries');
assert.equal(typeof config.welcome.title, 'string', 'welcome title should exist');
console.log('site-config smoke test passed');
