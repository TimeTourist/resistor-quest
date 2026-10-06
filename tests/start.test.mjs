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
  // Bara bilder på valen, ingen text. Namnet finns för skärmläsare.
  const chicken = opts.find(b => b.getAttribute('aria-label') === 'Kyckling');
  assert.ok(chicken, 'kycklingen har en etikett för skärmläsare');
  assert.equal(chicken.textContent.trim(), '🐔');
  assert.ok(opts.every(b => !/[a-zåäö]/i.test(b.textContent)), 'ingen text på valen');
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
    t.$('#gbar [data-gpick="1"]').click(); t.$('#gbar [data-gyes]').click();
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

test('Stapeln på kortet: ner en grad frågar först, Ja byter grad och nollställer sviten', () => {
  const t = atGrade('ohm', 2);
  t.g('S.up = 2; S.down = 1');
  t.g("S.played = []; ['wrong','fanfare'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.g("showLevelCard('ohm')");
  t.$('#gbar [data-gpick="1"]').click();
  assert.match(t.$('#gbar .gask').textContent, /Gå ner till Lärling\?/);
  assert.equal(t.g('S.grade.ohm'), 2, 'inget händer innan Ja');
  t.$('#gbar [data-gyes]').click();
  assert.equal(t.g('S.grade.ohm'), 1);
  assert.equal(t.g('S.up'), 0); assert.equal(t.g('S.down'), 0);
  assert.equal(t.g('S.done.ohm'), 4, 'nådda grader finns kvar');
  assert.equal(JSON.parse(t.g("localStorage.getItem('fargkoden2-grade')")).ohm, 1, 'sparas');
  assert.deepEqual(Array.from(t.g('S.played')), ['wrong']);
  assert.equal(t.g('S.view'), 'ohm', 'kortet med frågan står kvar');
  assert.equal(t.$('#gbar .gask'), null);
  assert.ok(t.$('#gbar .gseg.cur') === t.$$('#gbar .gseg')[1], 'stapeln visar nya graden');
});

test('Stapeln på kortet: upp igen till en nådd grad, med fanfar; grader över det nådda går inte', () => {
  const t = load({ storage: { ...ALL_OPEN, 'fargkoden2-done': JSON.stringify({ body: 2 }), 'fargkoden2-grade': JSON.stringify({ body: 0 }), 'fargkoden2-topic': 'body' } });
  t.g("S.played = []; ['wrong','fanfare'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.g("showLevelCard('body')");
  assert.deepEqual(t.$$('#gbar [data-gpick]').map(x => +x.dataset.gpick), [1, 2]);
  t.$('#gbar [data-gpick="2"]').click();
  assert.match(t.$('#gbar .gask').textContent, /Gå upp till Gesäll igen\?/);
  t.$('#gbar [data-gyes]').click();
  assert.equal(t.g('S.grade.body'), 2);
  assert.deepEqual(Array.from(t.g('S.played')), ['fanfare']);
});

test('Stapeln på kortet: Nej stänger frågan, och under spelet går stapeln inte att klicka', () => {
  const t = atGrade('tol', 3);
  t.g("showLevelCard('tol')");
  t.$('#gbar [data-gpick="0"]').click();
  t.$('#gbar [data-gno]').click();
  assert.equal(t.$('#gbar .gask'), null);
  assert.equal(t.g('S.grade.tol'), 3);
  kick(t);
  assert.equal(t.$$('#gbar [data-gpick]').length, 0);
});

test('Startkortet ser ut som en start: egen färg och Här börjar det!', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("showLevelCard('ohm')");
  assert.ok(t.$('#q').classList.contains('startcard'));
  assert.match(t.$('#q .startflag').textContent, /Här börjar det!/);
  kick(t, true);
  assert.ok(!t.$('#q').classList.contains('startcard'), 'frågan ser ut som vanligt');
});

test('Startkortet: låst ämne och Eldprovet är inga startkort', () => {
  const t = load();
  t.g("showLevelCard('tc')");
  assert.ok(!t.$('#q').classList.contains('startcard'));
  assert.equal(t.$('#q .startflag'), null);
});

test('Sidan öppnar på startkortet för ämnet man var på, även med sparade framsteg', () => {
  const t = load({ start: true, storage: { ...ALL_OPEN, 'fargkoden2-topic': 'tol' } });
  assert.equal(t.g('S.view'), 'tol');
  assert.ok(t.$('#q .kick'));
  kick(t, true);
  assert.equal(t.g('S.view'), null);
  assert.equal(t.g('S.answered'), false);
});

test('Sidan öppnar på Eldprovets kort om man var där', () => {
  const t = load({ start: true, storage: { ...ALL_OPEN, 'fargkoden2-topic': 'ultra' } });
  assert.ok(t.$('#dare'));
});

test('Förhandsvisningen från dev.html hoppar över startkortet', () => {
  const t = load({ start: true, url: 'http://localhost/index.html?test=true&topic=ohm&grade=2' });
  assert.equal(t.g('S.view'), null);
  assert.equal(t.g('S.type'), 'point');
});
