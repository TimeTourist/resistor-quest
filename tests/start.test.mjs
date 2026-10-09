import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, ALL_OPEN } from './harness.mjs';
import { answer, dare } from './answer.mjs';

test('Eldprovet: VÅGAR DU, KAN DU TILLRÄCKLIGT, sedan rasar kortet och provet börjar', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("S.played = []; ['glass','crack'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.g("openTopic('ultra')");
  assert.ok(t.$('#dare svg'), 'en bild');
  assert.match(t.$('#dare').textContent, /VÅGAR DU\?\?\?/);
  t.$('#dare').click();
  assert.match(t.$('#dare').textContent, /KAN DU TILLRÄCKLIGT\?/);
  assert.equal(t.g('S.exam'), null);
  t.$('#dare').click();
  assert.match(t.$('#dare').textContent, /INGEN NÅD/);
  t.$('#dare').click();
  assert.ok(t.g('S.exam && !S.exam.done'), 'provet har börjat');
  assert.notEqual(t.g('S.type'), 'exam');
  assert.deepEqual(Array.from(t.g('S.played')), ['crack', 'crack', 'glass']);
});

test('Eldprovet: mitt i ett prov fortsätter man utan ritual', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')"); dare(t);
  answer(t, true);
  const i = t.g('S.exam.i');
  t.$('#closeBtn').click();
  t.$('#grid [data-id="ultra"]').click();
  assert.equal(t.$('#dare'), null);
  assert.equal(t.g('S.exam.i'), i);
  assert.equal(t.g('S.answered'), false);
});

test('Förhandsvisningen från dev.html går direkt till spelkortet', () => {
  const t = load({ start: true, url: 'http://localhost/fargkoden.html?test=true&topic=ohm&grade=2' });
  assert.equal(t.g('S.screen'), 'play');
  assert.equal(t.g('S.open'), 'ohm');
  assert.ok(['point', 'order'].includes(t.g('S.type')));
  t.$('#closeBtn').click();
  assert.equal(t.g('S.screen'), 'grid');
});

test('Testraden: Dölj rätt svar tar bort pilarna, Visa rätt svar tar tillbaka dem, och valet sparas', () => {
  const t = load({ url: 'http://localhost/fargkoden.html?test=true&topic=tol&grade=3' });
  const btn = t.$('#tCheat');
  assert.ok(btn, 'knappen finns');
  assert.equal(btn.textContent, 'Dölj rätt svar');
  assert.ok(t.$('#q .cheat'), 'pilen syns från början');
  btn.click();
  assert.equal(t.$('#q .cheat'), null);
  assert.equal(btn.textContent, 'Visa rätt svar');
  t.g('next()');
  assert.equal(t.$('#q .cheat'), null, 'gäller nästa fråga också');
  btn.click();
  assert.ok(t.$('#q .cheat'));
  const u = load({ url: 'http://localhost/fargkoden.html?test=true', storage: { 'fargkoden2-cheat': 'off' } });
  assert.equal(u.$('#tCheat').textContent, 'Visa rätt svar');
  assert.equal(u.$('#q .cheat'), null);
});

test('Eldprovet: ett tryck var som helst på kortet räknas, inte bara på elden', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')");
  t.$('#q .firecard .rule').click();
  assert.match(t.$('#dare').textContent, /KAN DU TILLRÄCKLIGT\?/);
  t.$('#q').click();
  assert.match(t.$('#dare').textContent, /INGEN NÅD/);
  // Också kanten runt frågerutan, men inte Byt ämne
  t.$('#spel .pbody').click();
  assert.ok(t.g('S.exam && !S.exam.done'), 'provet har börjat');
});

test('Eldprovet: Byt ämne räknas inte som ett tryck på elden', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')");
  t.$('#closeBtn').click();
  assert.equal(t.g('S.dare'), 0);
});

test('Elden på minikortet och i stora kortet har egna färger, så att stora elden har alla lager när minikortet är dolt', () => {
  const t = load({ storage: ALL_OPEN, start: true });
  t.g("openTopic('ultra')");
  const tile = t.$('#grid [data-id="ultra"] svg.fire'), big = t.$('#dare svg.fire');
  assert.ok(tile && big);
  const ids = svg => [...svg.querySelectorAll('[id]')].map(e => e.id);
  assert.ok(ids(big).length >= 2);
  assert.ok(ids(big).every(id => !ids(tile).includes(id)), 'olika id');
  // Varje låga hämtar sin färg från sin egen bild
  for (const svg of [tile, big])
    for (const p of svg.querySelectorAll('path[fill^="url"]'))
      assert.ok(svg.querySelector(p.getAttribute('fill').slice(4, -1)), p.getAttribute('fill'));
});
