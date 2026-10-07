import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, golden } from './harness.mjs';
import { answer } from './answer.mjs';

// Ljuden spelas in: namn och steg
const rec = t => t.g("S.played = []; ['right','fanfare','gold','tick'].forEach(k => { sfx[k] = s => S.played.push(k + ':' + (s || 0)); })");
const played = t => Array.from(t.g('S.played'));
const ladder = () => load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 1 }), 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }) } });

test('Pinget stiger för varje prick i graden, och den tredje pingar högst och följs av fanfaren', () => {
  const t = ladder();
  rec(t);
  for (let i = 0; i < 3; i++) { t.g('next()'); answer(t, true); }
  assert.deepEqual(played(t), ['right:0', 'right:1', 'right:2', 'fanfare:0']);
});

test('Efter fel börjar pinget om från grundtonen', () => {
  const t = ladder();
  rec(t);
  t.g('next()'); answer(t, true);
  t.g('next()'); answer(t, false);
  t.g('next()'); answer(t, true);
  assert.deepEqual(played(t).filter(p => p.startsWith('right')), ['right:0', 'right:0']);
});

test('Blandat efter guldet: samma ping som förut', () => {
  const t = golden('body');
  rec(t);
  for (let i = 0; i < 3; i++) { t.g('next()'); answer(t, true); }
  assert.deepEqual(played(t), ['right:0', 'right:0', 'right:0']);
});

test('Högre steg ger högre ton', () => {
  const freqs = [];
  class FakeAC {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
    resume() {}
    createOscillator() { return { type: '', frequency: { setValueAtTime(f) { freqs.push(f); }, exponentialRampToValueAtTime() {} }, connect: x => x, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: x => x }; }
  }
  const t = load({ audio: FakeAC });
  t.g('sfx.right(0)'); const low = freqs[0];
  freqs.length = 0;
  t.g('sfx.right(1)'); const high = freqs[0];
  assert.ok(high > low * 1.2, `${high} > ${low}`);
});

test('Sista pricken på Stormästare: ett ping och sedan guldet', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 4 }), 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }) } });
  rec(t);
  t.g('S.up = 2; S.down = 0; next()'); answer(t, true);
  assert.deepEqual(played(t), ['right:2', 'gold:0']);
});
