import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { atGrade } from './harness.mjs';
import { answer, until } from './answer.mjs';

test('Motståndet: Räkna banden är Nykomling, med valen 4, 5 och 6', () => {
  const t = atGrade('body', 0);
  for (let i = 0; i < 20; i++) {
    t.g('next()');
    assert.match(t.g('S.cq.prompt'), /Hur många färgband/);
    assert.deepEqual(t.$$('[data-c]').map(b => b.textContent.trim()), ['4 band', '5 band', '6 band']);
  }
});

test('Motståndet: Fel antal band är Lärling och säger åt en att räkna', () => {
  const t = atGrade('body', 1);
  assert.equal(t.g('S.cq.prompt'), 'Ett av dem är inget motstånd. Räkna banden!');
  assert.equal(t.g('S.cq.odd'), true);
});

test('Motståndet: Färg som inte finns är Gesäll, med turkos och limegrön som falska färger', () => {
  const t = atGrade('body', 2);
  assert.match(t.g('S.cq.prompt'), /färg som inte finns/);
  const fakes = new Set();
  for (let i = 0; i < 120; i++) { t.g('next()'); fakes.add(t.g('S.cq.fake')); }
  assert.deepEqual([...fakes].sort(), ['lime', 'turq']);
  for (const f of fakes) assert.ok(t.g(`C.${f}.hex && C.${f}.n`), f);
});

test('Kortet har en egen färg och en rad om vad man ska göra, per typ av svar', () => {
  const cases = [['body', 1, 'odd', /Vilken ska bort/], ['ohm', 2, 'point', /Peka/], ['ohm', 3, 'mc', /Välj/], ['tol', 3, 'mc', /Välj/]];
  for (const [topic, g, kind, tag] of cases) {
    const t = atGrade(topic, g);
    // Gesäll i Resistansen blandar peka och ordna, Mästare flerval och bygg
    until(t, p => kind === 'point' ? p.type === 'point' : kind === 'mc' ? p.type === 'choice' : true);
    assert.ok(t.$('#q').classList.contains('kind-' + kind), `${topic} ${g}: ${t.$('#q').className}`);
    assert.match(t.$('#q .kindtag, #q .oddhead').textContent, tag);
    assert.equal(t.$$('#q [class*="kind-"]').length, 0);
  }
  const h = atGrade('ohm', 4);
  assert.ok(h.$('#q').classList.contains('kind-entry'));
  assert.match(h.$('#q .kindtag').textContent, /Knappa in|Bygg/);
});



test('dev.html: Motståndets katalog har den nya ordningen', () => {
  const html = readFileSync(new URL('../dev.html', import.meta.url), 'utf8');
  const w = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/dev.html' }).window;
  const rows = JSON.parse(w.eval('JSON.stringify(CATALOG.body)'));
  assert.deepEqual(rows.filter(r => r.g < 3).map(r => [r.g, r.id]), [[0, 'body-rakna'], [1, 'body-antal'], [2, 'body-farg']]);
});

test('Resistansen Nykomling: frågan säger att klammern visar banden som ger ohm-värdet, och värdet står vid klammern', () => {
  const t = atGrade('ohm', 0);
  for (let i = 0; i < 10; i++) {
    t.g('S.grade.ohm = 0; next()');
    assert.equal(t.g('S.cq.prompt'), 'Klammern visar vilka band som ger ohm-värdet.');
    const cards = t.$$('#q [data-c]');
    cards.forEach((c, j) => {
      const want = t.g(`fmtVal(S.cq.vals[${j}])`);
      assert.equal(c.querySelector('.bracket text').textContent, want, `kort ${j}`);
    });
  }
});

test('Toleransens Nykomling: vid fel står antalet band i hörnet på det udda kortet', () => {
  const t = atGrade('tol', 0);
  t.g('next()');
  const right = t.g('S.cq.right');
  answer(t, false);
  const badges = t.$$('#q .badge');
  assert.equal(badges.length, 1);
  assert.ok(t.$(`[data-c="${right}"] .badge.bad`));
  assert.match(badges[0].textContent, /^[456] band$/);
});
