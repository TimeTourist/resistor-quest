import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, ALL_OPEN } from './harness.mjs';
import { answer, cont, dare } from './answer.mjs';

// Laddar om sidan: allt som sparats i webbläsaren följer med
const reload = t => {
  const ls = t.w.localStorage, storage = {};
  for (let i = 0; i < ls.length; i++) storage[ls.key(i)] = ls.getItem(ls.key(i));
  return load({ storage, start: true });
};
const play = (t, n) => { for (let i = 0; i < n; i++) { answer(t, i % 2 === 0); if (t.g('S.answered')) cont(t); } };

test('Eldprovet sparas: efter en omladdning fortsätter man på samma fråga med samma poäng', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')"); dare(t);
  play(t, 3);
  const queue = t.g('JSON.stringify(S.exam.queue)'), score = t.g('JSON.stringify(S.exam.score)');
  assert.equal(t.g('S.exam.i'), 3);
  const u = reload(t);
  assert.match(u.$('#grid [data-id="ultra"]').textContent, /Pågår · fråga 4 av 20/);
  u.$('#grid [data-id="ultra"]').click();
  assert.equal(u.$('#dare'), null, 'ingen ritual mitt i ett prov');
  assert.equal(u.g('S.exam.i'), 3);
  assert.equal(u.g('JSON.stringify(S.exam.queue)'), queue);
  assert.equal(u.g('JSON.stringify(S.exam.score)'), score);
  assert.equal(u.g('S.examItem.topic'), JSON.parse(queue)[3].topic, 'frågan är från rätt ämne');
});

test('Ett klart Eldprov sparas inte: efter omladdning börjar man om med ritualen', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')"); dare(t);
  play(t, 20);
  assert.ok(t.g('S.exam.done'));
  assert.equal(t.w.localStorage.getItem('fargkoden2-exam'), null);
  const u = reload(t);
  assert.equal(u.g('S.exam'), null);
});

test('Nollställ i testraden tar också bort ett pågående Eldprov', () => {
  const t = load({ storage: ALL_OPEN, url: 'http://localhost/?test=true' });
  t.g("openTopic('ultra')"); dare(t);
  play(t, 2);
  t.$('#tReset').click();
  assert.equal(t.w.localStorage.getItem('fargkoden2-exam'), null);
});

test('Ett trasigt sparat prov ignoreras', () => {
  for (const bad of ['{', '{"queue":[],"i":0,"score":{},"done":false}', '{"queue":"x","i":99}']) {
    const t = load({ storage: { ...ALL_OPEN, 'fargkoden2-exam': bad }, start: true });
    assert.equal(t.g('S.exam'), null, bad);
    assert.deepEqual(t.errors, []);
  }
});
