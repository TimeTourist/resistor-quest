import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';
import { answer, cont } from './answer.mjs';

const ALL = ['body', 'ohm', 'tol', 'tc', 'e', 'ultra'];
const states = t => ALL.map(x => t.g(`tileState('${x}')`));

test('Första besöket: nyckeln sitter i Motståndets lås och ingen snabbkoll är gjord', () => {
  const t = load({ start: true });
  assert.deepEqual(Array.from(t.g('S.keys')), ['body']);
  assert.deepEqual(Array.from(t.g('S.seen')), []);
  assert.deepEqual(states(t), ['key', 'locked', 'locked', 'locked', 'locked', 'exam']);
});

test('Befintlig spelare: inga nycklar, och snabbkollen räknas som gjord där man har framsteg', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'ohm',
    'fargkoden2-done': JSON.stringify({ body: 5, ohm: 3 }), 'fargkoden2-grade': JSON.stringify({ ohm: 3 }) } });
  assert.deepEqual(Array.from(t.g('S.keys')), []);
  assert.deepEqual(Array.from(t.g('S.seen')).sort(), ['body', 'ohm']);
  assert.deepEqual(states(t), ['done', 'open', 'open', 'locked', 'locked', 'exam']);
});

test('Nycklar och snabbkoller sparas och läses tillbaka, och en nyckel till ett låst ämne ignoreras', () => {
  const t = load({ start: true });
  t.g("S.done.body = 3; grantKey('ohm'); S.seen.push('body'); saveKeys()");
  assert.deepEqual(Array.from(t.g('S.flying')), ['ohm'], 'nyckeln ska flyga till låset');
  const keys = t.g("localStorage.getItem('fargkoden2-keys')"), seen = t.g("localStorage.getItem('fargkoden2-seen')");
  assert.deepEqual(JSON.parse(keys), ['body', 'ohm']);
  const u = load({ start: true, storage: { 'fargkoden2-topic': 'body', 'fargkoden2-done': JSON.stringify({ body: 3 }),
    'fargkoden2-keys': JSON.stringify(['body', 'ohm', 'tc']), 'fargkoden2-seen': seen } });
  assert.deepEqual(Array.from(u.g('S.keys')), ['body', 'ohm'], 'Temperaturen är inte upplåsbar');
  assert.deepEqual(Array.from(u.g('S.seen')), ['body']);
  assert.deepEqual(Array.from(u.g('S.flying')), [], 'sparade nycklar sitter redan i låset');
});

test('grantKey: en nyckel per ämne, aldrig för Eldprovet', () => {
  const t = load({ start: true });
  t.g("grantKey('body'); grantKey('ultra'); grantKey(undefined)");
  assert.deepEqual(Array.from(t.g('S.keys')), ['body']);
  assert.deepEqual(Array.from(t.g('S.flying')), []);
});

test('Trasig data i fargkoden2-keys kraschar inte sidan', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'body', 'fargkoden2-keys': '{inte json' } });
  assert.deepEqual(t.errors.map(String), []);
  assert.deepEqual(Array.from(t.g('S.keys')), []);
});

test('Mästare i spelet delar ut nyckeln till nästa ämne och sparar den direkt', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }),
    'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  t.g('S.up = 2');
  answer(t, true);
  assert.deepEqual(Array.from(t.g('S.keys')), ['ohm']);
  assert.deepEqual(JSON.parse(t.g("localStorage.getItem('fargkoden2-keys')")), ['ohm']);
});

test('Eldprovet som låser upp två ämnen delar ut två nycklar', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'ohm', 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 1 }) } });
  t.g("S.exam = {queue: [], i: 20, done: true, score: {ohm: {ok: 3, n: 4}, tol: {ok: 4, n: 4}}}; applyExam()");
  assert.deepEqual(Array.from(t.g('S.keys')).sort(), ['tc', 'tol']);
});

test('Förhandsvisningen från dev.html har inga nycklar och ingen snabbkoll', () => {
  const t = load({ start: true, url: 'http://localhost/index.html?test=true&topic=ohm&grade=2' });
  assert.deepEqual(Array.from(t.g('S.keys')), []);
  assert.deepEqual(Array.from(t.g('S.seen')).sort(), ['body', 'e', 'ohm', 'tc', 'tol']);
});

test('Första besöket: nyckeln sitter i Motståndets lås, och raden ovanför är samma som annars så att korten inte flyttar sig', () => {
  const t = load({ start: true });
  const tile = t.$('#grid [data-id="body"]');
  assert.ok(tile.classList.contains('haskey'));
  assert.ok(tile.querySelector('.inkey svg'), 'nyckeln sitter i låset');
  assert.ok(!tile.querySelector('.inkey').classList.contains('arriving'));
  assert.equal(t.$('#lead').textContent, 'Lär dig läsa motstånd.');
});

test('Ett tryck vrider om nyckeln: låset öppnas och nyckeln är förbrukad, men inget kort öppnas', () => {
  const t = load({ start: true });
  t.g("S.played = []; ['insert','turn','chains'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.$('#grid [data-id="body"]').click();
  assert.deepEqual(Array.from(t.g('S.keys')), []);
  assert.deepEqual(JSON.parse(t.g("localStorage.getItem('fargkoden2-keys')")), []);
  assert.deepEqual(Array.from(t.g('S.played')), ['insert', 'turn', 'chains']);
  assert.equal(t.g('S.screen'), 'grid', 'man väljer själv vilket kort man vill spela');
  const tile = t.$('#grid [data-id="body"]');
  assert.ok(tile.classList.contains('open'));
  assert.ok(tile.classList.contains('fresh'));
  assert.match(tile.textContent, /Nytt!/);
  assert.equal(t.$('#lead').textContent, 'Lär dig läsa motstånd.');
  tile.click();
  assert.equal(t.g('S.cover'), 'body', 'nästa tryck öppnar omslaget');
});

test('Dubbeltryck på nyckeln låser upp en gång och ger inga fel', () => {
  const t = load({ start: true });
  const tile = t.$('#grid [data-id="body"]');
  tile.click(); tile.click();
  assert.equal(t.g('S.screen'), 'grid');
  assert.deepEqual(Array.from(t.g('S.keys')), []);
  assert.deepEqual(t.errors.map(String), []);
});

test('Mästare: nyckeln visas på spelkortet, kortet minimeras och nyckeln sitter i nästa lås', async () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  t.g('S.up = 2');
  answer(t, true);
  t.g('S.instant = false; advance()');
  const win = t.$('#q .keywin');
  assert.match(win.textContent, /Mästare! Du fick nyckeln till Resistansen\./);
  assert.match(win.textContent, /Den flyger till låset\./);
  assert.ok(win.querySelector('svg'));
  await new Promise(r => setTimeout(r, 2400));
  t.g('S.instant = true');
  assert.equal(t.g('S.screen'), 'grid');
  assert.equal(t.g("tileState('ohm')"), 'key');
  const key = t.$('#grid [data-id="ohm"] .inkey');
  assert.ok(key && !key.classList.contains('arriving'), 'nyckeln har landat');
  assert.deepEqual(Array.from(t.g('S.flying')), []);
});

test('Mästare i instant-läge: ett tryck på kortet går direkt till startsidan med nyckeln i låset', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  t.g('S.up = 2');
  answer(t, true); cont(t);
  assert.equal(t.g('S.screen'), 'grid');
  assert.equal(t.g("tileState('ohm')"), 'key');
});

test('Byt ämne direkt efter Mästare: nyckeln hamnar ändå i låset', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  t.g('S.up = 2');
  answer(t, true);
  t.$('#closeBtn').click();
  assert.equal(t.g("tileState('ohm')"), 'key');
  assert.ok(t.$('#grid [data-id="ohm"] .inkey'));
});

test('Eldprovet som låser upp två ämnen: två nycklar i låsen när man går tillbaka', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'ohm', 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 1 }), 'fargkoden2-grade': JSON.stringify({ ohm: 1 }) } });
  t.g("openTopic('ultra'); S.exam = {queue: [], i: 20, done: true, score: {ohm: {ok: 3, n: 4}, tol: {ok: 4, n: 4}}}; next()");
  assert.match(t.$('#q').textContent, /Eldprovet är klart/);
  t.$('#closeBtn').click();
  assert.equal(t.g("tileState('tol')"), 'key');
  assert.equal(t.g("tileState('tc')"), 'key');
  assert.equal(t.$$('#grid .inkey').length, 2);
});

test('Den flygande nyckeln har en egen klass, inte knappklassen .ghost', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  // jsdom saknar animate: en enkel ersättare så att flygturen startar
  t.g('HTMLElement.prototype.animate = function(){ return {cancel(){}, set onfinish(f){}} }');
  t.g('S.up = 2');
  answer(t, true);
  t.g('S.instant = false');
  t.$('#closeBtn').click();
  return new Promise(r => setTimeout(r, 400)).then(() => {
    const g = t.$('body > .keyghost');
    assert.ok(g, 'nyckeln flyger');
    assert.ok(!g.classList.contains('ghost'));
    t.g('S.instant = true');
  });
});
