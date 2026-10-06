import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';
import { answer } from './answer.mjs';

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
