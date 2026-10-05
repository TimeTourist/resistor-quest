import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel, load } from './harness.mjs';
import { answer, until } from './answer.mjs';

// SVG-element har ingen click(), så klicket skickas som ett event
const tap = (t, sel) => t.$(sel).dispatchEvent(new t.w.MouseEvent('click', { bubbles: true }));

const enter = t => t.doc.body.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
const GESALL = { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5 }), 'fargkoden-level': 'medium' };

test('Kartan har fem band och Eldprovet, och nivån man står på är markerad', () => {
  const t = load({ storage: GESALL });
  assert.equal(t.$$('#map [data-level]').length, 6);
  assert.ok(t.$('#map [data-level="medium"].on'));
  assert.equal(t.$$('#map .on').length, 1);
  assert.ok(t.$('#map [data-level="tc"] .lock'), 'låst nivå har lås');
  assert.ok(t.$('#map [data-level="intro"] .done'), 'klarad nivå har bock');
});

test('Tryck på ett band visar nivåkortet med namn och Spela', () => {
  const t = load({ storage: GESALL });
  tap(t, '#map [data-level="easy"]');
  assert.equal(t.$('#q h2').textContent, 'Lärling');
  assert.ok(t.$('#map [data-level="easy"].on'), 'bandet för kortet är markerat');
  assert.equal(t.$('#play').disabled, false);
  t.$('#play').click();
  assert.equal(t.g('S.level'), 'easy');
  assert.ok(t.$('#main'), 'en fråga visas');
});

test('Låst nivå: kortet säger vad som krävs och Spela är grå', () => {
  const t = load({ storage: GESALL });
  tap(t, '#map [data-level="tc"]');
  assert.match(t.$('#q').textContent, /Klara Gesäll först/);
  assert.equal(t.$('#play').disabled, true);
});

test('Lågan visar bosskortet och startar Eldprovet', () => {
  const t = load({ storage: GESALL });
  tap(t, '#map [data-level="ultra"]');
  assert.equal(t.$('#q h2').textContent, 'Eldprovet');
  t.$('#examStart').click();
  assert.equal(t.g('S.level'), 'ultra');
  assert.ok(t.g('S.exam && S.exam.i === 0'));
  assert.ok(t.$('#main'));
});

test('Tryck på samma nivå mitt i en fråga och Spela: samma fråga kommer tillbaka', () => {
  const t = load({ storage: GESALL });
  const q = t.g('S.q.join()');
  tap(t, '#map [data-level="medium"]');
  t.$('#play').click();
  assert.equal(t.g('S.q.join()'), q);
});

test('Ny spelare möts av Nykomlings kort', () => {
  const t = load();
  assert.equal(t.$('#q h2').textContent, 'Nykomling');
  t.$('#play').click();
  assert.equal(t.g('S.type'), 'dir');
});

test('5 i rad: efter Nästa visas nästa nivås kort som ny, och Stanna kvar ger en ny fråga på samma nivå', () => {
  const t = load({ storage: GESALL });
  for (let i = 0; i < 5; i++) { until(t, p => p.skill === 't'); answer(t, true); }
  assert.equal(t.$('#unlockDlg'), null, 'ingen dialog');
  t.$('#main').click();
  assert.equal(t.$('#q h2').textContent, 'Mästare');
  assert.match(t.$('.fresh').textContent, /Ny nivå upplåst/);
  assert.equal(t.doc.activeElement, t.$('#play'));
  t.$('#stay').click();
  assert.equal(t.g('S.level'), 'medium');
  assert.equal(t.$('#main').disabled, true);
});

test('5 i rad och Enter: nästa nivås kort, Spela byter nivå', () => {
  const t = load({ storage: GESALL });
  for (let i = 0; i < 5; i++) { until(t, p => p.skill === 't'); answer(t, true); }
  enter(t);
  assert.equal(t.$('#q h2').textContent, 'Mästare');
  enter(t);
  assert.equal(t.$('#q h2').textContent, 'Mästare', 'Enter på kortet hoppar inte förbi det');
  t.$('#play').click();
  assert.equal(t.g('S.level'), 'tc');
});

test('Statusraden visar sviten som fem band', () => {
  const t = load({ storage: GESALL });
  until(t, p => p.skill === 't'); answer(t, true);
  assert.equal(t.$$('#score .pips b').length, 5);
  assert.equal(t.$$('#score .pips b.on').length, 1);
});

test('Statusraden när nästa nivå redan är upplåst', () => {
  const t = load({ storage: { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5, medium: 5 }), 'fargkoden-level': 'medium' } });
  assert.match(t.$('#score').textContent, /Klar! Mästare är upplåst/);
});
