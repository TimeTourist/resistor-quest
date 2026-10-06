import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, ALL_OPEN, atGrade, golden } from './harness.mjs';
import { kick, dare } from './answer.mjs';

const TOPICS = ['body', 'ohm', 'tol', 'tc', 'e'];

test('Startfrågan: ämneskortet har ingen Spela-knapp utan en lätt fråga med fyra val', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("showLevelCard('body')");
  assert.equal(t.$('#play'), null);
  assert.match(t.$('.kick').textContent, /Välj motståndet/);
  const opts = t.$$('[data-kick]');
  assert.equal(opts.length, 4);
  const right = opts.find(b => +b.dataset.kick === t.g('S.kick.right'));
  assert.ok(right.querySelector('svg'), 'rätt val är ett riktigt motstånd');
  assert.match(t.$('.kick').textContent, /Kyckling/);
});

test('Startfrågan: varje ämne har en egen fråga', () => {
  const t = load({ storage: ALL_OPEN });
  const qs = TOPICS.map(lv => { t.g(`showLevelCard('${lv}')`); return t.$('.kickq').textContent; });
  assert.equal(new Set(qs).size, 5);
  assert.match(qs[1], /enhet/);
});

test('Startfrågan: rätt svar startar ämnet på vald grad', () => {
  for (const lv of TOPICS) {
    const t = load({ storage: ALL_OPEN });
    t.g(`showLevelCard('${lv}')`);
    t.$('[data-grade="1"]').click();
    kick(t, true);
    assert.equal(t.g('S.view'), null, lv);
    assert.equal(t.g('S.topic'), lv);
    assert.equal(t.g(`S.grade.${lv}`), 1);
    assert.equal(t.g('S.answered'), false, 'första riktiga frågan väntar');
  }
});

test('Startfrågan: fel svar stannar på kortet, säger varför och påverkar inte trappan', () => {
  const t = atGrade('ohm', 2);
  t.g("showLevelCard('ohm')");
  const before = t.g('JSON.stringify([S.grade, S.done, S.up, S.down])');
  kick(t, false);
  assert.equal(t.g('S.view'), 'ohm');
  const bad = t.$('[data-kick].bad');
  assert.ok(bad, 'valet markeras');
  assert.equal(bad.getAttribute('aria-disabled'), 'true');
  assert.match(t.$('.kickmsg').textContent, /ohm|Ω/);
  assert.equal(t.g('JSON.stringify([S.grade, S.done, S.up, S.down])'), before);
  kick(t, true);
  assert.equal(t.g('S.view'), null, 'nytt försök går');
});

test('Startfrågan: fel kort med motståndet säger vad man valde', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("showLevelCard('body')");
  kick(t, false);
  assert.match(t.$('.kickmsg').textContent, /Det där är (en|ett) /);
});

test('Startfrågan: gyllene kortet startar blandat', () => {
  const t = golden('tol');
  t.g("showLevelCard('tol')");
  kick(t, true);
  assert.equal(t.g('S.view'), null);
  assert.notEqual(t.g('S.mixG'), null);
});

test('Startfrågan: låst ämne har ingen fråga', () => {
  const t = load();
  t.g("showLevelCard('tc')");
  assert.equal(t.$('.kick'), null);
  assert.match(t.$('#q').textContent, /Låst/);
});

test('Startfrågan: rätt svar spelar krossat glas', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("S.played = []; ['glass','crack','wrong'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.g("showLevelCard('e')");
  kick(t, false); kick(t, true);
  assert.deepEqual(Array.from(t.g('S.played')), ['wrong', 'glass']);
});

test('Eldprovet: VÅGAR DU, KAN DU TILLRÄCKLIGT, sedan rasar kortet och provet börjar', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("S.played = []; ['glass','crack'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.g("goTopic('ultra')");
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
  t.g("goTopic('ultra')"); dare(t);
  t.g("showLevelCard('ultra')");
  assert.equal(t.$('#dare'), null);
  assert.match(t.$('#play').textContent, /Fortsätt/);
});
