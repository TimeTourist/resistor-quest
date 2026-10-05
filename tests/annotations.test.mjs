import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel } from './harness.mjs';
import { answer, until } from './answer.mjs';

test('valueBands: värde till färger', () => {
  const t = atLevel('intro');
  assert.deepEqual(Array.from(t.g('valueBands(4700, 2)')), ['yellow', 'violet', 'red']);
  assert.deepEqual(Array.from(t.g('valueBands(4.7, 2)')), ['yellow', 'violet', 'gold']);
  assert.deepEqual(Array.from(t.g('valueBands(24900, 3)')), ['red', 'yellow', 'white', 'red']);
  assert.equal(t.g('valueBands(4710, 2)'), null);
});

test('Flerval med värden: efter svar visar varje knapp sina färger', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'read');
  assert.equal(t.$$('#q .ann').length, 0);
  answer(t, false);
  const opts = t.$$('#q [data-pick]');
  assert.ok(opts.every(b => b.querySelector('.ann .sw')));
});

test('Flerval med färger: efter svar visar varje färg sitt värde', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'build');
  answer(t, false);
  for (const b of t.$$('#q [data-tpick]')) assert.match(b.querySelector('.ann').textContent, /±/);
});

test('Flerval med motståndsbilder: värdet under varje bild', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 'v' && p.type === 'build');
  answer(t, true);
  for (const b of t.$$('#q [data-vpick]')) assert.match(b.querySelector('.ann').textContent, /Ω/);
});

test('Riktning: ett vänt motstånd ritas rättvänt efter svar', () => {
  const t = atLevel('intro');
  for (let i = 0; i < 200 && !t.g('S.style.flip'); i++) t.g('next()');
  answer(t, true);
  assert.ok(t.$('#q .res.turn'));
  assert.ok(!t.$('#q .res svg').innerHTML.includes('scale(-1 1)'));
});
