import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, ALL_OPEN } from './harness.mjs';
import { kick } from './answer.mjs';

// Allt öppet, inga nycklar och ingen snabbkoll gjord
const fresh = (extra = {}) => load({ start: true, storage: { ...ALL_OPEN, 'fargkoden2-topic': 'body', 'fargkoden2-keys': '[]', 'fargkoden2-seen': '[]', ...extra } });
const open = (t, id) => t.$(`#grid [data-id="${id}"]`).click();

test('Omslaget: första gången visas ämnets animering, namn, rad och Snabbkoll', () => {
  const t = fresh();
  open(t, 'ohm');
  assert.equal(t.g('S.cover'), 'ohm');
  assert.ok(t.$('#spel').classList.contains('cover'));
  assert.equal(t.$('#phead').hidden, true, 'ingen rubrikrad');
  assert.equal(t.$('#gbar').hidden, true, 'ingen stapel');
  assert.match(t.$('#q .eyebrow').textContent, /Ämne 2 av 5/);
  assert.ok(t.$('#q svg.anim'), 'ämnets animering');
  assert.match(t.$('#q .cname').textContent, /Resistansen/);
  assert.match(t.$('#q .cline').textContent, /Vad färgerna betyder i ohm/);
  assert.match(t.$('#q .ulab').textContent, /Snabbkoll/);
  assert.doesNotMatch(t.$('#q').textContent, /Lås upp/);
  assert.match(t.$('#q .kickq').textContent, /enhet/);
  assert.equal(t.$$('#q [data-kick]').length, 4);
  assert.equal([...t.$('#q').classList].filter(c => c.startsWith('kind-')).length, 0, 'ingen typfärg');
});

test('Snabbkoll: fel svar blir rött och går inte att välja igen, och inget räknas', () => {
  const t = fresh();
  open(t, 'ohm');
  const before = t.g('JSON.stringify([S.grade, S.done, S.up, S.down])');
  t.g("S.played = []; ['wrong','right'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  kick(t, false);
  const bad = t.$('#q [data-kick].bad');
  assert.ok(bad, 'valet blir rött');
  assert.equal(bad.getAttribute('aria-disabled'), 'true');
  assert.equal(t.g('S.cover'), 'ohm', 'omslaget står kvar');
  assert.equal(t.g('JSON.stringify([S.grade, S.done, S.up, S.down])'), before);
  kick(t, true);
  assert.equal(t.g('S.cover'), null);
  assert.deepEqual(Array.from(t.g('S.played')), ['wrong', 'right']);
  assert.equal(t.g('S.topic'), 'ohm');
  assert.equal(t.g('S.answered'), false, 'första riktiga frågan väntar');
  assert.equal(t.$('#phead').hidden, false);
  assert.ok(!t.$('#spel').classList.contains('cover'));
});

test('Snabbkoll: bara en gång, även efter omladdning', () => {
  const t = fresh();
  open(t, 'ohm'); kick(t, true);
  t.$('#closeBtn').click(); open(t, 'ohm');
  assert.equal(t.g('S.cover'), null);
  const u = fresh({ 'fargkoden2-seen': t.g("localStorage.getItem('fargkoden2-seen')") });
  open(u, 'ohm');
  assert.equal(u.g('S.cover'), null);
});

test('Omslaget: Byt ämne och Escape avbryter, och snabbkollen väntar kvar', () => {
  const t = fresh();
  open(t, 'tc');
  t.$('#coverClose').click();
  assert.equal(t.g('S.screen'), 'grid');
  assert.match(t.$('#grid [data-id="tc"]').textContent, /Nytt · börja med en snabbkoll/);
  open(t, 'tc');
  assert.equal(t.g('S.cover'), 'tc');
  t.doc.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(t.g('S.screen'), 'grid');
});

test('Omslaget: ett klart ämne och Eldprovet har inget omslag', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'body', 'fargkoden2-done': JSON.stringify({ body: 5 }), 'fargkoden2-keys': '[]', 'fargkoden2-seen': '[]' } });
  open(t, 'body');
  assert.equal(t.g('S.cover'), null);
  t.$('#closeBtn').click(); open(t, 'ultra');
  assert.equal(t.g('S.cover'), null);
  assert.ok(t.$('#dare'));
});

test('Motståndets snabbkoll: ett riktigt motstånd och tre bilder utan text', () => {
  const t = fresh();
  open(t, 'body');
  const opts = t.$$('#q [data-kick]');
  const right = opts.find(b => +b.dataset.kick === t.g('S.kick.right'));
  assert.ok(right.querySelector('svg:not(.pic)'), 'rätt val är ett riktigt motstånd');
  assert.equal(opts.filter(b => b.querySelector('svg.pic')).length, 3);
  assert.ok(opts.find(b => b.getAttribute('aria-label') === 'Kyckling'));
});

test('Snabbkoll i testläge: grön pil på rätt val', () => {
  const t = load({ start: true, url: 'http://localhost/?test=true', storage: { ...ALL_OPEN, 'fargkoden2-topic': 'body', 'fargkoden2-keys': '[]', 'fargkoden2-seen': '[]' } });
  open(t, 'tol');
  assert.equal(+t.$('#q [data-kick].cheat').dataset.kick, t.g('S.kick.right'));
});

test('Snabbkoll: stänger man direkt efter rätt svar går den att göra igen, och det gamla svaret räknas inte', async () => {
  const t = fresh();
  open(t, 'ohm');
  t.g('S.instant = false');
  kick(t, true);
  t.$('#coverClose').click();
  t.g('S.instant = true');
  open(t, 'ohm');
  assert.equal(t.g('S.cover'), 'ohm');
  await new Promise(r => setTimeout(r, 700));
  assert.equal(t.g('S.cover'), 'ohm', 'det gamla svaret vänder inte kortet');
  kick(t, false);
  assert.ok(t.$('#q [data-kick].bad'), 'valen fungerar');
});
