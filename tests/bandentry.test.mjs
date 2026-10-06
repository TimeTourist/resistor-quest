import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, atGrade, ALL_OPEN } from './harness.mjs';
import { answer, until, tap } from './answer.mjs';

const readQ = t => until(t, p => p.type === 'read');
const band = (t, i) => tap(t, t.$(`#q [data-band="${i}"]`));
const key = (t, k) => t.$(`#q [data-bekey="${k}"]`).click();
const vals = t => Array.from(t.g('S.be.vals')).map(v => v == null ? null : v.d != null ? String(v.d) : 'x' + v.m);

test('Knappa in, Stormästare: rutor under banden och bara knappsatsen, inga fält och ingen Svara-knapp', () => {
  const t = atGrade('ohm', 4);
  readQ(t);
  assert.equal(t.$$('#q .ebox').length, 0);
  assert.equal(t.$('#submit'), null);
  assert.equal(t.$$('#q .bslot').length, t.g('S.n'), 'en ruta under varje band, även toleransen');
  assert.equal(t.$$('#q [data-bekey]').length, 11, 'siffrorna 0–9 och radera');
  assert.ok(t.$('#q [data-betab="d"][aria-pressed="true"]'));
});

test('Knappa in: markeringen börjar längst till vänster, också när motståndet är vänt', () => {
  const t = atGrade('ohm', 4);
  for (let i = 0; i < 30; i++) {
    t.g('S.grade.ohm = 4; next()');
    if (t.g('S.type') !== 'read') continue;
    const n = t.g('S.n'), flip = t.g('!!S.style.flip');
    assert.equal(t.g('S.be.sel'), flip ? n - 1 : 0);
  }
});

test('Knappa in: en siffra hamnar i det markerade bandet och markeringen hoppar till närmaste lediga åt höger, annars vänster', () => {
  const t = atGrade('ohm', 4);
  readQ(t);
  t.g('S.style.flip = false; S.be.sel = 0; render()');
  key(t, '4');
  assert.deepEqual(vals(t).slice(0, 2), ['4', null]);
  assert.equal(t.g('S.be.sel'), 1, 'till höger');
  band(t, 4);
  key(t, '7');
  assert.equal(t.g('S.be.sel'), 3, 'längst till höger: närmaste lediga åt vänster');
  band(t, 0);
  key(t, '2');
  assert.equal(vals(t)[0], '2', 'skrivs över');
  assert.equal(t.g('S.be.sel'), 1);
});

test('Knappa in, vänt motstånd: från första bandet längst till höger går markeringen åt vänster', () => {
  const t = atGrade('ohm', 4);
  readQ(t);
  // Vänt: första bandet i läsordning (index 0) sitter längst till höger på skärmen
  t.g('S.style.flip = true; S.be.sel = 0; render()');
  key(t, '1');
  assert.equal(t.g('S.be.sel'), 1, 'inget ledigt till höger, så närmaste åt vänster: andra bandet');
  key(t, '2');
  assert.equal(t.g('S.be.sel'), 2, 'högersidan är fylld, så vidare åt vänster');
});

test('Knappa in: fliken × ger multiplikatorerna, och fliken byts bara av en själv', () => {
  const t = atGrade('ohm', 4);
  readQ(t);
  t.$('#q [data-betab="m"]').click();
  assert.ok(t.$('#q [data-betab="m"][aria-pressed="true"]'));
  const ms = t.$$('#q [data-bemult]').map(b => b.textContent);
  assert.ok(ms.includes('×0,01') && ms.includes('×100') && ms.includes('×1M'), ms.join());
  t.$('#q [data-bemult="100"]').click();
  assert.ok(t.$('#q [data-betab="m"][aria-pressed="true"]'), 'fliken ligger kvar');
  assert.ok(t.$$('#q .bslot').some(s => s.textContent === '100'), 'i rutan utan ×');
});

test('Knappa in: rättas när lika många rutor som siffror plus multiplikator är fyllda', () => {
  const t = atGrade('ohm', 4);
  readQ(t);
  answer(t, true);
  assert.equal(t.g('S.answered'), true); assert.equal(t.g('S.ok'), true);
  t.g('S.grade.ohm = 4; S.up = 0; S.down = 0'); readQ(t);
  answer(t, false);
  assert.equal(t.g('S.ok'), false);
});

test('Knappa in: rätt värden i fel band är fel', () => {
  const t = atGrade('ohm', 4);
  readQ(t);
  const k = t.g('nd(S.q)'), n = t.g('S.n');
  // Siffrorna förskjutna ett band, så att toleransbandet får multiplikatorn
  t.g(`S.be.vals = Array(${n}).fill(null)`);
  for (let i = 0; i < k; i++) t.g(`S.be.vals[${i + 1}] = {d: C[S.q[${i}]].d}`);
  t.g(`S.be.sel = 0; beType({m: C[S.q[${k}]].m})`);
  assert.equal(t.g('S.answered'), true);
  assert.equal(t.g('S.ok'), false);
});

test('Knappa in fungerar i Eldprovet', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("goTopic('ultra')"); for (let i = 0; i < 3; i++) t.$('#dare').click();
  for (let i = 0; i < 20; i++) { answer(t, i % 2 === 0); if (t.g('S.exam.done')) break; t.g('next()'); }
  assert.deepEqual(t.errors.map(String), []);
});
