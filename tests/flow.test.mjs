import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel, load } from './harness.mjs';
import { answer, until } from './answer.mjs';

// SVG-element har ingen click(), så klicket skickas som ett event
const tap = (t, sel) => t.$(sel).dispatchEvent(new t.w.MouseEvent('click', { bubbles: true }));

const enter = t => t.doc.body.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

test('Nästa är grå före svar och aktiv efter, på samma plats', () => {
  const t = atLevel('medium');
  until(t, p => p.type === 'read');
  assert.equal(t.$('#main').textContent, 'Nästa');
  assert.equal(t.$('#main').disabled, true);
  answer(t, true);
  assert.equal(t.$('#main').disabled, false);
  assert.equal(t.doc.activeElement, t.$('#main'));
});

test('Fel svar: valt blir rött, rätt blir grönt, alternativen är låsta', () => {
  const t = atLevel('medium');
  until(t, p => p.type === 'read');
  answer(t, false);
  assert.equal(t.$$('#q .opt.bad').length, 1);
  assert.equal(t.$$('#q .opt.ok').length, 1);
  assert.ok(t.$$('#q .opt').every(b => b.disabled));
});

test('Rätt svar: bara grönt', () => {
  const t = atLevel('medium');
  until(t, p => p.type === 'build');
  answer(t, true);
  assert.equal(t.$$('#q .opt.bad').length, 0);
  assert.equal(t.$$('#q .opt.ok').length, 1);
});

test('Raden om det frågan lär ut och Allt om motståndet visas först efter svar', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'read');
  assert.equal(t.$('.lesson'), null);
  assert.equal(t.$('#more').hidden, true);
  answer(t, true);
  assert.match(t.$('.lesson').textContent, /Toleransbandet är/);
  assert.equal(t.$('#more').hidden, false);
  assert.match(t.$('#more').textContent, /Allt om motståndet/);
});

test('Enter efter svar ger nästa fråga', () => {
  const t = atLevel('easy');
  until(t, p => p.type === 'read');
  answer(t, true);
  enter(t);
  assert.equal(t.g('S.answered'), false);
  assert.equal(t.$('#main').disabled, true);
});

test('Riktning och E-serie markeras också', () => {
  const t = atLevel('intro');
  t.g('next()'); answer(t, false);
  assert.equal(t.$$('[data-dir].bad').length, 1); assert.equal(t.$$('[data-dir].ok').length, 1);
  const h = atLevel('hard');
  until(h, p => p.type === 'series'); answer(h, false);
  assert.equal(h.$$('[data-sr].bad').length, 1); assert.equal(h.$$('[data-sr].ok').length, 1);
});

test('Stormästare läs: Svara är grå tills allt är ifyllt', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  assert.equal(t.$('#main').textContent, 'Svara');
  assert.equal(t.$('#main').disabled, true);
  t.g("S.entry = {...S.entry, v:'47', mult:100, tol:5, tc:50}; render()");
  assert.equal(t.$('#main').disabled, false);
});

test('Tips och sedan rätt: sviten står still och raden säger att tipset kostade', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't');
  t.$('[data-hint]').click();
  answer(t, true);
  assert.equal(t.g('S.streak'), 0);
  assert.match(t.$('.lesson').textContent, /Tipset kostade/);
});

test('Byta nivå efter svar: Allt om motståndet försvinner och Nästa är grå', () => {
  const t = atLevel('medium');
  until(t, p => p.type === 'read');
  answer(t, true);
  tap(t, '#map [data-level="tc"]');
  assert.equal(t.$('#more').hidden, true);
  t.$('#play').click();
  assert.equal(t.g('S.level'), 'tc');
  assert.equal(t.$('#more').hidden, true);
  assert.equal(t.$('#main').disabled, true);
});

test('Eldprovet: valet markeras men inget rätt/fel och inget Allt om motståndet', () => {
  const t = atLevel('ultra');
  t.$('#examStart').click();
  t.g("S.exam.queue[S.exam.i] = {t:'series'}; next()");
  answer(t, false);
  assert.equal(t.$$('#q .ok, #q .bad').length, 0);
  assert.equal(t.$$('#q .chosen').length, 1);
  assert.equal(t.$('#more').hidden, true);
});

for (const lv of ['intro', 'easy', 'medium', 'tc', 'hard']) {
  test(`${lv}: 60 flervalssvar, rätt och fel, utan fel i sidan`, () => {
    const t = atLevel(lv);
    for (let i = 0; i < 60; i++) {
      until(t, p => p.fmt === 'mc');
      answer(t, i % 2 === 0);
      assert.ok(t.$('.lesson'), 'raden om det frågan lär ut finns');
    }
    assert.deepEqual(t.errors.map(String), []);
  });
}

test('Huvudknappen sitter uppe till höger bredvid frågan, före och efter svar', () => {
  for (const lv of ['intro', 'medium', 'hard']) {
    const t = atLevel(lv);
    for (let i = 0; i < 10; i++) {
      t.g('next()');
      assert.ok(t.$('#q .qtop .prompt + .qbtns #main'), `${lv}: ${t.g('S.type')} före svar`);
      if (t.g('S.plan.fmt') === 'mc' || t.g('S.type') === 'build') {
        answer(t, false);
        assert.ok(t.$('#q .qtop .prompt + .qbtns #main'), `${lv}: ${t.g('S.type')} efter svar`);
        assert.equal(t.$$('#q #main').length, 1);
      }
    }
  }
});
