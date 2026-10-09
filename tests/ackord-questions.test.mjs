import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, pinned, answer, cont, tap } from './ackord-harness.mjs';

const types = (() => { const t = load({ start: true }); return JSON.parse(t.g("JSON.stringify(BUILT.flatMap(x => allTypes(x).map(y => ({id: y.id, g: y.g, topic: x}))))")); })();

for (const { id, g, topic } of types) {
  test(`${id}: rätt och fel svar, och felanimeringen låser tills den är klar`, () => {
    const t = pinned(topic, g, id);
    assert.equal(t.g('S.Q.id'), id);
    answer(t, true);
    assert.equal(t.g('S.ok'), true);
    cont(t);
    for (let i = 0; i < 5; i++) {
      answer(t, false);
      assert.equal(t.g('S.ok'), false);
      assert.ok(t.g('S.anim && S.anim.total > T0'), 'en felanimering');
      assert.ok(t.$('#q .kb svg'), 'klaviaturen visar förklaringen');
      assert.ok(t.$('#q [role="status"]').textContent.length > 10, 'en rad för skärmläsare');
      t.g('S.instant = false; reveal(); S.instant = true');
      assert.ok(t.g('S.lockUntil - S.revealAt >= S.anim.total * 1000'), 'låset väntar in animeringen');
      cont(t);
      assert.equal(t.g('S.answered'), true, 'ett tryck under animeringen går inte vidare');
      t.g('S.lockUntil = 0');
      cont(t);
      assert.equal(t.g('S.answered'), false);
    }
    assert.deepEqual(t.errors, []);
  });
}

test('Bygga ett ackord: en annan oktav räknas som rätt', () => {
  const t = pinned('treklang', 2, 'treklang-bygg');
  const ans = JSON.parse(t.g('JSON.stringify(S.Q.answer)'));
  ans.map(m => m + 12 <= 83 ? m + 12 : m - 12).forEach(m => tap(t, t.$(`#q [data-key="${m}"]`)));
  t.$('#submit').click();
  assert.equal(t.g('S.ok'), true);
});

test('Bygga ett ackord: andra trycket på en tangent tar bort den, och Svara väntar på tre tangenter', () => {
  const t = pinned('treklang', 2, 'treklang-bygg');
  const k = () => t.$('#q [data-key="60"]');
  tap(t, k());
  assert.deepEqual(Array.from(t.g('S.sel')), [60]);
  tap(t, k());
  assert.deepEqual(Array.from(t.g('S.sel')), []);
  assert.ok(t.$('#submit').disabled);
  [60, 61, 62, 63].forEach(m => tap(t, t.$(`#q [data-key="${m}"]`)));
  assert.equal(t.g('S.sel.length'), 3, 'inte fler än tre');
  assert.ok(!t.$('#submit').disabled);
});

// Ett AudioContext som räknar anslag
function fakeAudio(log) {
  const node = () => ({ connect: n => n || node(), gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, detune: { value: 0 }, Q: { value: 0 }, start() {}, stop() {} });
  return class { constructor() { log.made++; this.currentTime = 0; this.state = 'running'; this.sampleRate = 8000; this.destination = node(); }
    createOscillator() { log.osc++; return node(); } createGain() { return node(); } createBiquadFilter() { return node(); }
    createBufferSource() { return node(); } createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; } resume() {} };
}

test('Ljud: greppet spelas en gång när frågan visas, och Spela igen spelar det igen', () => {
  const log = { made: 0, osc: 0 };
  const t = pinned('treklang', 0, 'treklang-durmoll', { audio: fakeAudio(log) });
  const first = log.osc;
  assert.ok(first > 0, 'ackordet spelades');
  t.$('#replay').click();
  assert.equal(log.osc, first * 2);
});

test('Ljud av: inget ljud alls', () => {
  const log = { made: 0, osc: 0 };
  const t = pinned('treklang', 0, 'treklang-durmoll', { audio: fakeAudio(log), storage: { 'ackord1-sound': 'off' } });
  t.$('#replay').click();
  answer(t, false);
  assert.equal(log.made, 0);
});

test('Efter ett fel spelar Spela igen det rätta svaret', () => {
  const log = { made: 0, osc: 0 };
  const t = pinned('treklang', 2, 'treklang-bygg', { audio: fakeAudio(log) });
  answer(t, false);
  const n = log.osc;
  assert.ok(t.$('#replay'), 'knappen finns efter svaret');
  t.$('#replay').click();
  assert.ok(log.osc > n);
  assert.equal(t.g('S.answered'), true, 'Spela igen går inte vidare');
});

test('Varje fråga visar en klaviatur, och i flerval klingar tangenterna utan att vara svaret', () => {
  for (const { id, g, topic } of types) {
    const t = pinned(topic, g, id);
    assert.ok(t.$('#q .kb svg'), `${id} har ingen klaviatur`);
    if (t.g('S.Q.kind') !== 'mc') continue;
    tap(t, t.$('#q [data-key="64"]'));
    assert.equal(t.g('S.answered'), false, id);
    assert.equal(t.$('#q [data-key="64"]').getAttribute('aria-pressed'), 'true', id);
    tap(t, t.$('#q [data-key="64"]'));
    assert.equal(t.$('#q [data-key="64"]').getAttribute('aria-pressed'), 'false', id);
    answer(t, true);
    assert.equal(t.g('S.ok'), true, id);
  }
});
