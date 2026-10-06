import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade } from './harness.mjs';
import { answer, until } from './answer.mjs';

const isOrder = set => p => p.type === 'order' && p.set === set;
const clickKey = (t, k) => t.$(`[data-ord="${k}"]`).click();

test('Ordna värdena: Lärling, tio tomma lådor med 0–9 ovanför och färgerna blandade under', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  assert.match(t.$('#q .prompt').textContent, /nummerordning/);
  assert.deepEqual(t.$$('#q .oslot span').map(s => s.textContent), ['0','1','2','3','4','5','6','7','8','9']);
  assert.equal(t.$$('#q .obox .osw').length, 0, 'lådorna är tomma');
  assert.equal(t.$$('#q [data-ord]').length, 10);
  assert.ok(t.$('#q').classList.contains('kind-order'));
  assert.match(t.$('#q .kindtag').textContent, /ordning/i);
});

test('Ordna värdena: varje klick flyger till rätt låda, grön i tur och ordning, röd annars, med ljud', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  t.g("S.played = []; ['blip','thud'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  clickKey(t, 'black');
  assert.ok(t.$('#q [data-oslot="black"].ok .osw'));
  clickKey(t, 'red');
  assert.ok(t.$('#q [data-oslot="red"].bad .osw'), 'hamnar på sin plats, men röd');
  assert.ok(t.$('[data-ord="red"]').disabled);
  clickKey(t, 'brown');
  assert.ok(t.$('#q [data-oslot="brown"].ok'));
  assert.deepEqual(Array.from(t.g('S.played')), ['blip', 'thud', 'blip']);
  assert.equal(t.g('S.answered'), false);
});

test('Ordna värdena: alla gröna är rätt, en röd gör frågan fel', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  answer(t, true);
  assert.equal(t.g('S.answered'), true); assert.equal(t.g('S.ok'), true);
  t.g('S.grade.ohm = 1; S.up = 0');
  until(t, isOrder('d'));
  answer(t, false);
  assert.equal(t.g('S.ok'), false);
  assert.match(t.$('#q .lesson').textContent, /Svart 0, brun 1/);
});

test('Ordna multiplikatorerna: Gesäll, från ×0,01 till ×1M', () => {
  const t = atGrade('ohm', 2);
  until(t, isOrder('m'));
  assert.deepEqual(t.$$('#q .oslot span').map(s => s.textContent), ['×0,01','×0,1','×1','×10','×100','×1k','×10k','×100k','×1M']);
  answer(t, true);
  assert.equal(t.g('S.ok'), true);
});

test('Peka: Lärling pekar på siffrorna, Gesäll bara på multiplikatorn', () => {
  const l = atGrade('ohm', 1), roles = new Set();
  for (let i = 0; i < 300; i++) { l.g('next()'); if (l.g('S.type') === 'point') roles.add(l.g('S.pointRole')); }
  assert.deepEqual([...roles].sort(), ['d1', 'd2', 'd3']);
  const g = atGrade('ohm', 2), groles = new Set();
  for (let i = 0; i < 200; i++) { g.g('next()'); if (g.g('S.type') === 'point') groles.add(g.g('S.pointRole')); }
  assert.deepEqual([...groles], ['mult']);
});

test('Lärling blandar färg ↔ siffra, ordna och peka; Gesäll blandar peka och ordna', () => {
  const kinds = (grade, n) => { const t = atGrade('ohm', grade), s = new Set(); for (let i = 0; i < n; i++) { t.g('next()'); s.add(t.g('S.type')); } return [...s].sort(); };
  assert.deepEqual(kinds(1, 200), ['choice', 'order', 'point']);
  assert.deepEqual(kinds(2, 100), ['order', 'point']);
});

test('Ordna: flygturen är spänning, rätt eller fel syns och hörs först när färgen landar', async () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  t.g("S.instant = false; S.played = []; ['blip','thud','whoosh'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.g('S.ord.fakeRate = 0');
  clickKey(t, 'black');
  const box = () => t.$('#q [data-oslot="black"]');
  assert.ok(box().classList.contains('fly'), 'på väg');
  assert.ok(!box().classList.contains('ok') && !box().classList.contains('bad'));
  assert.deepEqual(Array.from(t.g('S.played')), ['whoosh']);
  clickKey(t, 'brown');
  assert.equal(t.$('#q [data-oslot="brown"] .osw'), null, 'inga nya klick medan en färg flyger');
  await new Promise(r => setTimeout(r, 1300));
  assert.ok(box().classList.contains('ok'));
  assert.ok(!box().classList.contains('fly'));
  assert.deepEqual(Array.from(t.g('S.played')), ['whoosh', 'blip']);
});

test('Ordna: ibland låtsas ett rätt val flyga mot fel låda och vänder', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  t.g('S.instant = false; S.ord.fakeRate = 1');
  clickKey(t, 'black');
  const decoy = t.g('S.ord.decoy');
  assert.ok(decoy && decoy !== 'black', 'en annan låda att låtsas mot');
  assert.equal(t.g(`S.ord.placed['${decoy}']`), undefined, 'en tom låda');
  t.g('S.ord.fakeRate = 1'); 
});

test('Ordna: fel val låtsas aldrig, och var femte rätt ungefär gör det', () => {
  const t = atGrade('ohm', 1);
  let fakes = 0, rights = 0;
  for (let i = 0; i < 60; i++) {
    t.g('S.grade.ohm = 1; S.up = 0; S.down = 0'); until(t, isOrder('d'));
    clickKey(t, 'brown');
    assert.equal(t.g('S.ord.decoy'), null, 'fel val');
    clickKey(t, 'black');
    rights++; if (t.g('S.ord.decoy')) fakes++;
  }
  assert.ok(fakes > 3 && fakes < 25, `${fakes} av ${rights}`);
});
