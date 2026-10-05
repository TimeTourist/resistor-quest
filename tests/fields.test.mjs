import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel } from './harness.mjs';
import { answer, until } from './answer.mjs';

const key = (t, k) => t.doc.body.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: k, bubbles: true }));

test('Stormästare läs: en ruta per del och ett fält i taget', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  const n = t.g('S.n');
  assert.equal(t.$$('.ebox').length, n === 6 ? 4 : 3);
  assert.ok(t.$('.keypad'), 'knappsats när Siffror är aktiv');
  assert.equal(t.$$('[data-fval]').length, 0, 'ingen lista samtidigt');
  t.$('[data-field="x"]').click();
  assert.equal(t.$('.keypad'), null);
  assert.equal(t.$$('[data-fval]').length, 9);
});

test('Val i en lista går vidare till nästa tomma ruta', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  t.$('[data-field="x"]').click();
  t.$$('[data-fval]')[3].click();
  assert.equal(t.g('S.entry.field'), 't');
});

test('Rätt svar: alla rutor gröna', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  answer(t, true);
  assert.equal(t.$$('.ebox.bad').length, 0);
  assert.equal(t.$$('.ebox.ok').length, t.$$('.ebox').length);
});

test('Fel siffror: Siffror röd med ditt svar överstruket och rätt bredvid', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  answer(t, false);
  const box = t.$('[data-field="v"]');
  assert.ok(box.classList.contains('bad'));
  assert.ok(box.querySelector('s'));
  assert.match(box.querySelector('.right').textContent, new RegExp(t.g('digitStr(S.q)')));
});

test('Mästare: resistans i svår variant har bara Siffror och Multiplikator', () => {
  const t = atLevel('tc');
  until(t, p => p.skill === 'v' && p.type === 'read');
  assert.deepEqual(t.$$('.ebox').map(b => b.dataset.field), ['v', 'x']);
});

test('Tangentbord: siffror hamnar i Siffror även när en lista är aktiv', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  t.$('[data-field="t"]').click();
  key(t, '4'); key(t, '7');
  assert.equal(t.g('S.entry.v'), '47');
  assert.equal(t.g('S.entry.field'), 'v');
});

test('Palettbygge: fel band rött med rätt färg bredvid, rätt band grönt', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'build');
  answer(t, false);
  assert.equal(t.$$('.slot.bad').length, 1);
  assert.equal(t.$$('.slot.ok').length, t.g('S.n') - 1);
  assert.ok(t.$('.slot.bad s'));
});

for (const lv of ['medium', 'tc', 'hard']) {
  test(`${lv}: 60 svar i alla format, rätt och fel, utan fel i sidan`, () => {
    const t = atLevel(lv);
    for (let i = 0; i < 60; i++) {
      t.g('next()');
      answer(t, i % 2 === 0);
      assert.equal(t.g('S.answered'), true);
      assert.equal(t.g('S.ok'), i % 2 === 0);
    }
    assert.deepEqual(t.errors.map(String), []);
  });
}
