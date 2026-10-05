import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel } from './harness.mjs';
import { answer } from './answer.mjs';

const start = t => { t.$('#examStart').click(); };

test('Poängskylt efter varje fråga, ingen markering av rätt och fel', () => {
  const t = atLevel('ultra');
  start(t);
  t.g("S.exam.queue[S.exam.i] = {t:'series'}; next()");
  answer(t, true);
  assert.equal(t.$('.examsign').textContent, '1 av 1 del · totalt 1/1 poäng');
  assert.equal(t.$$('#q .ok, #q .bad').length, 0);
  assert.equal(t.$('.lesson'), null);
  t.$('#main').click();
  t.g("S.exam.queue[S.exam.i] = {t:'dir', hard:true}; next()");
  answer(t, false);
  assert.equal(t.$('.examsign').textContent, '0 av 1 del · totalt 1/2 poäng');
});

test('Läsfråga ger poäng per del', () => {
  const t = atLevel('ultra');
  start(t);
  t.g("S.exam.queue[S.exam.i] = {t:'read', n:4}; next()");
  t.g("S.entry = {...S.entry, v: String(valueOf(S.q)).replace('.', ','), t: '1', k: ''}");
  t.g('answerRead()');
  assert.match(t.$('.examsign').textContent, /^\d av 2 delar · totalt \d\/2 poäng$/);
});

test('Sista frågan: huvudknappen heter Se resultatet och visar utlåtandet', () => {
  const t = atLevel('ultra');
  start(t);
  t.g("S.exam.i = 19; S.exam.queue[19] = {t:'series'}; next()");
  answer(t, true);
  assert.equal(t.$('#main').textContent, 'Se resultatet');
  t.$('#main').click();
  assert.ok(t.$('.verdict'));
});

test('Hela Eldprovet går att spela igenom utan fel i sidan', () => {
  for (let r = 0; r < 3; r++) {
    const t = atLevel('ultra');
    start(t);
    for (let i = 0; i < 20; i++) {
      if (t.g('S.type') === 'read') {
        t.g("S.entry = {...S.entry, v: String(valueOf(S.q)).replace('.', ','), t: String(tolOf(S.q)).replace('.', ','), k: S.n === 6 ? String(tcOf(S.q)) : ''}; render()");
        t.$('#main').click();
      } else answer(t, i % 3 !== 0);
      assert.ok(t.$('.examsign'), `poängskylt efter fråga ${i + 1}`);
      t.$('#main').click();
    }
    assert.ok(t.$('.verdict'));
    assert.deepEqual(t.errors.map(String), []);
  }
});
