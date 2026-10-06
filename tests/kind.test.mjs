import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { atGrade } from './harness.mjs';

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

test('Motståndet: Färg som inte finns är Gesäll, med fler falska färger', () => {
  const t = atGrade('body', 2);
  assert.match(t.g('S.cq.prompt'), /färg som inte finns/);
  const fakes = new Set();
  for (let i = 0; i < 120; i++) { t.g('next()'); fakes.add(t.g('S.cq.fake')); }
  assert.ok(fakes.size >= 4, `falska färger: ${[...fakes]}`);
  for (const f of fakes) assert.ok(t.g(`C.${f}.hex && C.${f}.n`), f);
});

test('Kortet har en egen färg och en rad om vad man ska göra, per typ av svar', () => {
  const cases = [['body', 1, 'odd', /Vilken ska bort/], ['ohm', 2, 'point', /Peka/], ['ohm', 3, 'mc', /Välj/], ['tol', 3, 'mc', /Välj/]];
  for (const [topic, g, kind, tag] of cases) {
    const t = atGrade(topic, g);
    assert.ok(t.$('#q').classList.contains('kind-' + kind), `${topic} ${g}: ${t.$('#q').className}`);
    assert.match(t.$('#q .kindtag, #q .oddhead').textContent, tag);
    assert.equal(t.$$('#q [class*="kind-"]').length, 0);
  }
  const h = atGrade('ohm', 4);
  assert.ok(h.$('#q').classList.contains('kind-entry'));
  assert.match(h.$('#q .kindtag').textContent, /Knappa in|Bygg/);
});

test('Kortet: startkortet har ingen typfärg', () => {
  const t = atGrade('ohm', 2);
  t.g("showLevelCard('ohm')");
  assert.equal([...t.$('#q').classList].filter(c => c.startsWith('kind-')).length, 0);
});

test('dev.html: Motståndets katalog har den nya ordningen', () => {
  const html = readFileSync(new URL('../dev.html', import.meta.url), 'utf8');
  const w = new JSDOM(html, { runScripts: 'dangerously', url: 'http://localhost/dev.html' }).window;
  const rows = JSON.parse(w.eval('JSON.stringify(CATALOG.body)'));
  assert.deepEqual(rows.filter(r => r.g < 3).map(r => [r.g, r.id]), [[0, 'body-rakna'], [1, 'body-antal'], [2, 'body-farg']]);
});
