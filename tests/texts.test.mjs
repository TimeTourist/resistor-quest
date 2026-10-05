import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';

test('Poängraden säger vad sviten räknar', () => {
  const t = load({ storage: { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5 }), 'fargkoden-level': 'medium' } });
  assert.match(t.$('#score').textContent, /0 av 5 i rad på tolerans till Mästare/);
});

test('Om nivåerna beskriver den nya svitregeln', () => {
  const t = load();
  assert.match(t.$('details .gnote').textContent, /nollställer/);
});
