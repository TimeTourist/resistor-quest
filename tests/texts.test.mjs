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

test('Raden om det frågan lär ut böjer färgen efter bandet (rött, inte röd)', () => {
  const t = load({ storage: { 'fargkoden-level': 'easy' } });
  t.g("next(); S.q = ['brown','black','red','red','red','yellow']; S.n = 6; S.type = 'read'; S.style = {flip:false}");
  t.g("S.focus = 't'"); assert.match(t.g('lessonText()'), /Toleransbandet är rött,/);
  t.g("S.focus = 'x'"); assert.match(t.g('lessonText()'), /Multiplikatorbandet är rött,/);
  t.g("S.focus = 'k'"); assert.match(t.g('lessonText()'), /Sjätte bandet är gult,/);
});
