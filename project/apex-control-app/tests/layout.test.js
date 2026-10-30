import test from 'node:test';
import assert from 'node:assert/strict';

// Load compiled or source modules
import {
  APEX_200S_LAYOUT,
  APEX_200S_KEY_COUNT,
  LAYOUT_BOUNDS,
  LAYOUT_VERIFIED,
} from '../src/lib/keyboard-layout.ts';

test('Keyboard Layout — Key count & structure', () => {
  assert.equal(typeof APEX_200S_KEY_COUNT, 'number');
  assert.equal(APEX_200S_KEY_COUNT, 84, 'APEX 200S has 84 standard keys (75% compact)');

  const knob = APEX_200S_LAYOUT.find((k) => k.id === 'knob');
  assert.ok(knob, 'Layout contains dedicated rotary encoder/knob');
  assert.equal(knob.isSpecial, true);

  // Total items = 84 keys + 1 knob = 85
  assert.equal(APEX_200S_LAYOUT.length, 85);
});

test('Keyboard Layout — Unique key IDs', () => {
  const ids = APEX_200S_LAYOUT.map((k) => k.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length, 'All key IDs must be unique');
});

test('Keyboard Layout — Dimensions and bounds', () => {
  assert.ok(LAYOUT_BOUNDS.width > 15, 'Layout width accommodates 75% form factor');
  assert.ok(LAYOUT_BOUNDS.height >= 6, 'Layout height accommodates 6 rows');

  APEX_200S_LAYOUT.forEach((k) => {
    assert.ok(k.x >= 0, `Key ${k.id} x is non-negative`);
    assert.ok(k.y >= 0, `Key ${k.id} y is non-negative`);
    assert.ok(k.w > 0, `Key ${k.id} width > 0`);
    assert.ok(k.h > 0, `Key ${k.id} height > 0`);
  });
});

test('Keyboard Layout — Verification metadata', () => {
  assert.equal(LAYOUT_VERIFIED, false, 'Layout must be marked unverified until checked with physical device');
});
