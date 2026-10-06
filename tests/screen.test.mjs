import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, atGrade, golden, ALL_OPEN } from './harness.mjs';
import { answer, cont, dare } from './answer.mjs';

const ORDER = ['body', 'ohm', 'tol', 'tc', 'e', 'ultra'];
const curGrade = t => t.$$('#gbar .gseg').indexOf(t.$('#gbar .gseg.cur'));
const open = (t, id) => t.$(`#grid [data-id="${id}"]`).click();
const SEEN = { 'fargkoden2-keys': '[]', 'fargkoden2-seen': JSON.stringify(['body', 'ohm', 'tol', 'tc', 'e']) };

test('Sidan öppnar på startsidan: sex minikort i fast ordning, spelkortet är dolt', () => {
  const t = load({ start: true });
  assert.equal(t.g('S.screen'), 'grid');
  assert.deepEqual(t.$$('#grid .tile').map(x => x.dataset.id), ORDER);
  assert.equal(t.$('#spel').hidden, true);
  assert.equal(t.$('#grid').hidden, false);
  assert.equal(t.$('#map'), null, 'ingen karta');
  assert.equal(t.$('#score'), null, 'ingen statusrad');
  assert.match(t.$('.brand').textContent, /Färgkoden/);
  assert.ok(t.$('#soundBtn'));
});

test('Minikorten: namn, rad om ämnet och läget i foten', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'ohm', 'fargkoden2-done': JSON.stringify({ body: 5, ohm: 2 }),
    'fargkoden2-grade': JSON.stringify({ ohm: 2 }), 'fargkoden2-best': JSON.stringify({ body: 7 }) } });
  const tile = id => t.$(`#grid [data-id="${id}"]`);
  assert.ok(tile('body').classList.contains('done'));
  assert.match(tile('body').textContent, /Klart ✓ · rekord 7 i rad/);
  assert.match(tile('body').textContent, /Spela blandat/);
  assert.ok(tile('ohm').classList.contains('open'));
  assert.match(tile('ohm').textContent, /Vad färgerna betyder i ohm/);
  assert.match(tile('ohm').textContent, /Gesäll · 0 av 3 rätt i rad · fortsätt/);
  assert.equal(tile('ohm').querySelectorAll('.gb .cells i.full').length, 6, 'två klarade grader i ministapeln');
  assert.ok(tile('tol').classList.contains('locked'));
  assert.ok(tile('tol').querySelector('.padlock .kh'), 'hänglås med nyckelhål');
  assert.ok(tile('tol').querySelector('.fog') && tile('tol').querySelector('.chains'));
  assert.match(tile('tol').textContent, /Toleransen/);
  assert.equal(tile('tol').querySelector('.tfoot'), null, 'ingen text om upplåsning');
  assert.match(tile('ultra').textContent, /Alltid öppet/);
  assert.ok(tile('ultra').querySelector('svg.fire'));
});

test('Ett låst kort skakar, utan text, och öppnar inget', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'ohm', 'fargkoden2-done': JSON.stringify({ body: 3 }), ...SEEN } });
  open(t, 'tol');
  const tile = t.$('#grid [data-id="tol"]');
  assert.ok(tile.classList.contains('nope'));
  assert.equal(tile.querySelector('.tfoot'), null);
  assert.equal(t.g('S.screen'), 'grid');
});

test('Ett tryck på ett öppet minikort öppnar spelkortet, Byt ämne går tillbaka', () => {
  const t = load({ start: true, storage: { ...ALL_OPEN, ...SEEN, 'fargkoden2-topic': 'tol', 'fargkoden2-grade': JSON.stringify({ tol: 1 }) } });
  open(t, 'tol');
  assert.equal(t.g('S.screen'), 'play');
  assert.equal(t.g('S.open'), 'tol');
  assert.equal(t.g('S.topic'), 'tol');
  assert.equal(t.$('#spel').hidden, false);
  assert.equal(t.$('#grid').hidden, true);
  assert.match(t.$('#phead').textContent, /Toleransen/);
  assert.ok(t.$('#spel #q').textContent.length > 0, 'en fråga');
  assert.ok(t.$('#spel #more'), 'Allt om motståndet ligger i kortet');
  const close = t.$('#closeBtn');
  assert.match(close.textContent, /Byt ämne/);
  close.click();
  assert.equal(t.g('S.screen'), 'grid');
  assert.equal(t.$('#spel').hidden, true);
  assert.equal(t.$('#grid').hidden, false);
});

test('Minimera och öppna samma ämne: samma fråga och samma antal rätt i rad', () => {
  const t = atGrade('ohm', 2);
  t.g('S.up = 2');
  const q = t.g('JSON.stringify(S.q)'), type = t.g('S.type');
  t.$('#closeBtn').click();
  open(t, 'ohm');
  assert.equal(t.g('JSON.stringify(S.q)'), q);
  assert.equal(t.g('S.type'), type);
  assert.equal(t.g('S.up'), 2);
});

test('Ett annat ämne emellan: ny fråga, men antalet i rad finns kvar per ämne', () => {
  const t = atGrade('ohm', 2);
  t.g('S.up = 2');
  t.$('#closeBtn').click(); open(t, 'tol');
  assert.equal(t.g('S.up'), 0, 'Toleransen har sitt eget');
  t.$('#closeBtn').click(); open(t, 'ohm');
  assert.equal(t.g('S.topic'), 'ohm');
  assert.equal(t.g('S.up'), 2);
  assert.equal(t.g('S.answered'), false);
});

test('Minimera efter ett svar: nästa gång kommer en ny fråga', () => {
  const t = atGrade('tol', 1);
  answer(t, false);
  t.$('#closeBtn').click(); open(t, 'tol');
  assert.equal(t.g('S.answered'), false);
});

test('Minimera medan svaret animeras: timern stoppas och nästa gång kommer en ny fråga', () => {
  const t = atGrade('tol', 1);
  t.g('S.instant = false');
  answer(t, true);
  assert.equal(t.g('S.busy'), true, 'gnistan går');
  t.$('#closeBtn').click();
  assert.equal(t.g('S.timer'), null);
  t.g('S.instant = true');
  open(t, 'tol');
  assert.equal(t.g('S.answered'), false);
  assert.deepEqual(t.errors.map(String), []);
});

test('Escape minimerar spelkortet', () => {
  const t = atGrade('tol', 1);
  t.doc.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(t.g('S.screen'), 'grid');
});

test('Stapeln sitter överst i spelkortet och visar ämnets läge', () => {
  const t = atGrade('ohm', 2);
  const bar = t.$('#spel #gbar');
  assert.ok(bar);
  assert.equal(bar.querySelectorAll('.gseg').length, 5);
  assert.equal(curGrade(t), 2);
  assert.equal(bar.querySelectorAll('.cells i.full').length, 6);
});

test('Stapeln i spelkortet: tryck på en nådd grad, Ja byter grad och ger en ny fråga där', () => {
  const t = atGrade('ohm', 2);
  t.g('S.up = 2; S.down = 1; barIdle()');
  t.g("S.played = []; ['wrong','fanfare'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  assert.deepEqual(t.$$('#gbar [data-gpick]').map(x => +x.dataset.gpick), [0, 1, 3, 4]);
  t.$('#gbar [data-gpick="1"]').click();
  assert.match(t.$('#gbar .gask').textContent, /Gå ner till Lärling\?/);
  assert.equal(t.g('S.grade.ohm'), 2, 'inget händer innan Ja');
  t.$('#gbar [data-gyes]').click();
  assert.equal(t.g('S.grade.ohm'), 1);
  assert.equal(t.g('S.up'), 0); assert.equal(t.g('S.down'), 0);
  assert.equal(t.g('S.done.ohm'), 4, 'nådda grader finns kvar');
  assert.equal(JSON.parse(t.g("localStorage.getItem('fargkoden2-grade')")).ohm, 1, 'sparas');
  assert.deepEqual(Array.from(t.g('S.played')), ['wrong']);
  assert.equal(t.g('S.answered'), false, 'en ny fråga på Lärling');
  assert.equal(curGrade(t), 1);
});

test('Stapeln i spelkortet: Nej stänger frågan, och efter ett svar går graderna inte att välja', () => {
  const t = atGrade('tol', 3);
  t.$('#gbar [data-gpick="0"]').click();
  t.$('#gbar [data-gno]').click();
  assert.equal(t.$('#gbar .gask'), null);
  assert.equal(t.g('S.grade.tol'), 3);
  answer(t, false);
  assert.equal(t.$$('#gbar [data-gpick]').length, 0);
});

test('Blandat: spelkortet säger Blandat, stapeln visar sviten och minikortet är guld', () => {
  const t = golden('tol');
  assert.match(t.$('#phead').textContent, /Blandat/);
  assert.ok(t.$('#gbar .mixrow'), 'sviten i stället för graderna');
  assert.equal(t.$$('#gbar [data-gpick]').length, 0, 'inga gradval på ett gyllene ämne');
  t.$('#closeBtn').click();
  const tile = t.$('#grid [data-id="tol"]');
  assert.ok(tile.classList.contains('done'));
  assert.match(tile.textContent, /Spela blandat/);
});

test('Eldprovets kort: tre tryck, sedan visar stapeln vilken fråga man är på', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')");
  assert.ok(t.$('#spel').classList.contains('examplay'));
  assert.ok(t.$('#dare'));
  for (let i = 0; i < 3; i++) t.$('#dare').click();
  assert.match(t.$('#gbar').textContent, /Fråga 1 av 20/);
});

test('Eldprovets minikort: Pågår med frågans nummer, och provet står kvar om man spelar ett annat ämne emellan', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')"); dare(t);
  answer(t, true);
  t.$('#closeBtn').click();
  assert.match(t.$('#grid [data-id="ultra"]').textContent, /Pågår · fråga 2 av 20/);
  open(t, 'ohm');
  answer(t, true);
  t.$('#closeBtn').click();
  open(t, 'ultra');
  assert.equal(t.g('S.exam.i'), 1, 'provet står på fråga 2');
  assert.equal(t.g('S.answered'), false);
  assert.match(t.$('#gbar').textContent, /Fråga 2 av 20/);
});

test('Guld: minikortet tänds när ämnet blir klart', () => {
  const t = atGrade('body', 4);
  t.g('S.grade.body = 4; S.up = 2; S.done.body = 4; next()');
  answer(t, true); cont(t);
  const tile = t.$('#grid [data-id="body"]');
  assert.ok(tile.classList.contains('done'));
  assert.ok(tile.classList.contains('fresh'));
});

test('Testraden: Lås upp nästa ämne ger en nyckel, Börja om går tillbaka till första besöket', () => {
  const t = load({ start: true, url: 'http://localhost/?test=true', storage: { 'fargkoden2-topic': 'body', 'fargkoden2-keys': '[]', 'fargkoden2-seen': '["body"]' } });
  t.$('#tGive').click();
  assert.equal(t.g("tileState('ohm')"), 'key');
  assert.ok(t.$('#grid [data-id="ohm"] .inkey'));
  open(t, 'body');
  t.$('#tReset').click();
  assert.equal(t.g('S.screen'), 'grid');
  assert.deepEqual(Array.from(t.g('S.keys')), ['body']);
  assert.deepEqual(Array.from(t.g('S.seen')), []);
  assert.equal(t.g("tileState('ohm')"), 'locked');
});
