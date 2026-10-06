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
  assert.match(t.$('.kickwhy').textContent, /i ohm/);
  assert.equal(t.g('JSON.stringify([S.grade, S.done, S.up, S.down])'), before);
  kick(t, true);
  assert.equal(t.g('S.view'), null, 'nytt försök går');
});

test('Startfrågan: kortet är kort, och vid fel visas ämnets rad och animering, utan text under valet', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("showLevelCard('body')");
  assert.equal(t.$('#q .kickwhy'), null, 'ingen förklaring innan man svarat');
  assert.equal(t.$('#q .anim'), null, 'ingen animering ovanför frågan');
  assert.doesNotMatch(t.$('#q').textContent, /3 rätt i rad|Svara rätt/);
  kick(t, false);
  const why = t.$('#q .kickwhy');
  assert.ok(why, 'förklaringen visas');
  assert.match(why.textContent, /Hur ett motstånd ser ut/);
  assert.ok(why.querySelector('svg.anim .rbody'), 'animeringen visar motståndet, inte bara banden');
  assert.match(why.textContent, /läs härifrån/);
  assert.ok(why.compareDocumentPosition(t.$('.kickopts')) & t.w.Node.DOCUMENT_POSITION_FOLLOWING, 'förklaringen står ovanför frågan');
  assert.equal(t.$('.kickopts').nextElementSibling, null, 'ingen text under valen');
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

test('Ämneskortet: stapeln visas uppe som vanligt, med ämnets läge', () => {
  const t = load({ storage: { ...ALL_OPEN, 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 2 }), 'fargkoden2-grade': JSON.stringify({ ohm: 2 }) } });
  t.g("showLevelCard('ohm')");
  const bar = t.$('#gbar');
  assert.ok(bar.classList.contains('show'));
  assert.match(bar.querySelector('.gname').textContent, /Resistansen/);
  assert.equal(bar.querySelectorAll('.cells i.full').length, 6, 'två klarade grader');
  assert.ok(t.$$('[data-grade]').length === 5, 'gradprickarna finns kvar på kortet');
  kick(t, true);
  assert.ok(!bar.classList.contains('show'), 'stapeln går undan när frågan börjar');
});

test('Ämneskortet: gyllene kortet visar blandat-stapeln, Eldprovet och låsta ämnen ingen', () => {
  const t = golden('tol');
  t.g("showLevelCard('tol')");
  assert.ok(t.$('#gbar').classList.contains('show'));
  assert.match(t.$('#gbar').textContent, /Blandat/);
  t.g("showLevelCard('ultra')");
  assert.ok(!t.$('#gbar').classList.contains('show'));
  const u = load();
  u.g("showLevelCard('tc')");
  assert.ok(!u.$('#gbar').classList.contains('show'));
});
