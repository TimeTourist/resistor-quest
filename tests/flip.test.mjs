import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';
import { answer, cont } from './answer.mjs';

// jsdom saknar animate: en ersättare som sparar varje animering, så att testet själv bestämmer när den är klar
const stubAnimate = t => t.g(`S.anims = []; HTMLElement.prototype.animate = function(kf){
  const a = {el: this, kf, done: null, cancel(){}, set onfinish(f){ a.done = f }}; S.anims.push(a); return a }`);
const finish = t => t.g('S.anims.filter(a => a.done).forEach(a => { const f = a.done; a.done = null; f() })');
// Räknar hur många gånger en ny fråga tas
const countNext = t => t.g('S.nexts = 0; { const n0 = next; next = function(){ S.nexts++; return n0.apply(this, arguments) } }');
const turns = t => t.g("S.anims.filter(a => a.el.id === 'spel' && JSON.stringify(a.kf).includes('rotateY')).length");

test('Nästa efter fel svar: kortet vänds och den nya frågan står på baksidan', () => {
  const t = load();
  stubAnimate(t); countNext(t);
  answer(t, false);
  t.g('S.instant = false; S.lockUntil = 0');
  cont(t);
  assert.equal(turns(t), 1, 'kortet börjar vändas');
  assert.equal(t.g('S.nexts'), 0, 'frågan byts först när kortet står på kant');
  assert.equal(t.g('S.answered'), true);
  finish(t);
  assert.equal(t.g('S.nexts'), 1);
  assert.equal(t.g('S.answered'), false, 'en ny fråga');
  assert.equal(turns(t), 2, 'kortet vänds tillbaka med den nya frågan');
});

test('Rätt svar: kortet vänds innan nästa fråga', () => {
  const t = load();
  stubAnimate(t); countNext(t);
  answer(t, true);
  t.g('stopTimer(); S.instant = false; advance()');
  assert.equal(turns(t), 1);
  finish(t);
  assert.equal(t.g('S.nexts'), 1);
});

test('Ett tryck till medan kortet vänds hoppar inte över en fråga', () => {
  const t = load();
  stubAnimate(t); countNext(t);
  answer(t, false);
  t.g('S.instant = false; S.lockUntil = 0');
  cont(t); cont(t);
  t.doc.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(turns(t), 1, 'bara en vändning');
  finish(t);
  assert.equal(t.g('S.nexts'), 1, 'bara en ny fråga');
});

test('Byt ämne medan kortet vänds: ingen ny fråga tas bakom startsidan', () => {
  const t = load();
  stubAnimate(t); countNext(t);
  answer(t, false);
  t.g('S.instant = false; S.lockUntil = 0');
  cont(t);
  t.$('#closeBtn').click();
  finish(t);
  assert.equal(t.g('S.nexts'), 0);
  assert.equal(t.g('S.screen'), 'grid');
});

test('Eldprovet: kortet vänds mellan frågorna', () => {
  const t = load();
  t.g("goTopic('ultra'); beginExam()");
  stubAnimate(t); countNext(t);
  answer(t, true);
  t.g('stopTimer(); S.instant = false; advance()');
  assert.equal(turns(t), 1);
  finish(t);
  assert.equal(t.g('S.nexts'), 1);
  assert.equal(t.g('S.exam.i'), 1);
});

test('Med S.instant byts frågan direkt utan vändning', () => {
  const t = load();
  stubAnimate(t); countNext(t);
  answer(t, false);
  cont(t);
  assert.equal(turns(t), 0);
  assert.equal(t.g('S.nexts'), 1);
});

// Kortet glider i sidled: animeringarna på kortet som flyttar det med translateX
const slides = t => JSON.parse(t.g(`JSON.stringify(S.anims.filter(a => a.el.id === 'spel' && JSON.stringify(a.kf).includes('translateX')).map(a => a.kf.map(k => k.transform)))`));

test('Upp en grad: kortet flyger ut åt vänster och det nya kommer från höger', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 1 }), 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }) } });
  stubAnimate(t); countNext(t);
  t.g('S.up = 2; S.down = 0');
  answer(t, true);
  assert.equal(t.g('S.moved'), 'up');
  t.g('stopTimer(); S.instant = false; advance()');
  assert.equal(turns(t), 0, 'ingen vändning');
  let s = slides(t);
  assert.equal(s.length, 1);
  assert.match(s[0][1], /translateX\(-/, 'ut åt vänster');
  finish(t);
  assert.equal(t.g('S.nexts'), 1);
  s = slides(t);
  assert.equal(s.length, 2);
  assert.match(s[1][0], /translateX\((?!-)/, 'in från höger');
});

test('Ner en grad: kortet flyger ut åt höger och det nya kommer från vänster', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }) } });
  stubAnimate(t); countNext(t);
  t.g('S.up = 0; S.down = 2');
  answer(t, false);
  assert.equal(t.g('S.moved'), 'down');
  t.g('S.instant = false; S.lockUntil = 0');
  cont(t);
  let s = slides(t);
  assert.equal(s.length, 1);
  assert.match(s[0][1], /translateX\((?!-)/, 'ut åt höger');
  finish(t);
  s = slides(t);
  assert.match(s[1][0], /translateX\(-/, 'in från vänster');
});
