import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel, load } from './harness.mjs';
import { answer, until } from './answer.mjs';

const sample = (t, k = 400) => Array.from({ length: k }, () => {
  t.g('next()');
  return t.g('({...S.plan, n: S.n, flip: !!(S.style && S.style.flip) || !!S.bflip})');
});

test('skillFormat följer trappan', () => {
  const t = atLevel('intro'), f = (lv, s) => t.g(`skillFormat('${lv}','${s}')`);
  assert.equal(f('intro', 'dir'), 'new'); assert.equal(f('intro', 'v'), null);
  assert.equal(f('easy', 'v'), 'new'); assert.equal(f('easy', 'dir'), 'mc'); assert.equal(f('easy', 't'), null);
  assert.equal(f('medium', 't'), 'new'); assert.equal(f('medium', 'v'), 'mc'); assert.equal(f('medium', 'dir'), 'hard');
  assert.equal(f('tc', 'k'), 'new'); assert.equal(f('tc', 't'), 'mc'); assert.equal(f('tc', 'v'), 'hard');
  assert.equal(f('hard', 'e'), 'new');
  for (const s of ['dir', 'v', 't', 'k']) assert.equal(f('hard', s), 'hard');
});

test('nextStreak: bara det nya räknar upp, fel nollställer, tips står still', () => {
  const t = atLevel('intro'), n = (...a) => t.g(`nextStreak(${a.join(',')})`);
  assert.equal(n(3, true, false, true), 4);
  assert.equal(n(3, true, false, false), 3);
  assert.equal(n(3, true, true, true), 3);
  assert.equal(n(3, false, false, true), 0);
  assert.equal(n(3, false, false, false), 0);
});

test('Nykomling: bara riktningsfrågor, som räknas', () => {
  for (const p of sample(atLevel('intro'), 50)) { assert.equal(p.type, 'dir'); assert.equal(p.counts, true); }
});

test('Lärling: resistans räknas, riktning är flerval som inte räknas, inga vända motstånd', () => {
  const ps = sample(atLevel('easy'));
  for (const p of ps) {
    assert.ok(['v', 'dir'].includes(p.skill));
    assert.equal(p.fmt, 'mc');
    assert.equal(p.counts, p.skill === 'v');
    // Riktningsfrågor har alltid ett vänt eller rättvänt motstånd, men läs- och byggfrågor vänds inte här
    if (p.type !== 'dir') assert.equal(p.flip, false);
    if (p.skill === 'v') assert.ok(['v', 'd', 'x'].includes(p.focus));
  }
  const share = ps.filter(p => p.skill === 'v').length / ps.length;
  assert.ok(share > 0.5 && share < 0.7, `andel nytt ${share}`);
});

test('Gesäll: tolerans räknas, resistans som flerval, vända motstånd förekommer', () => {
  const ps = sample(atLevel('medium'));
  for (const p of ps) {
    assert.ok(['t', 'v'].includes(p.skill));
    assert.equal(p.fmt, 'mc');
    assert.equal(p.counts, p.skill === 't');
    assert.notEqual(p.type, 'dir');
  }
  assert.ok(ps.some(p => p.flip), 'minst ett vänt motstånd');
});

test('Mästare: TK på sexband, tolerans som flerval, resistans i svår variant', () => {
  for (const p of sample(atLevel('tc'))) {
    assert.ok(['k', 't', 'v'].includes(p.skill));
    if (p.skill === 'k') { assert.equal(p.n, 6); assert.equal(p.fmt, 'mc'); assert.equal(p.counts, true); }
    if (p.skill === 't') { assert.equal(p.fmt, 'mc'); assert.equal(p.counts, false); }
    if (p.skill === 'v') { assert.equal(p.fmt, 'hard'); assert.equal(p.counts, false); }
  }
});

test('Stormästare: E-serie som flerval eller hela motstånd i svår variant, allt räknas', () => {
  for (const p of sample(atLevel('hard'))) {
    assert.equal(p.counts, true);
    if (p.type === 'series') assert.equal(p.fmt, 'mc');
    else { assert.equal(p.focus, 'all'); assert.equal(p.fmt, 'hard'); assert.ok(['read', 'build'].includes(p.type)); }
  }
});

test('Öva: formatet följer nivån', () => {
  const tc = atLevel('tc', { 'fargkoden-mode': 'practice', 'fargkoden-part': 'v' });
  for (const p of sample(tc, 30)) { assert.equal(p.focus, 'v'); assert.equal(p.fmt, 'hard'); }
  const md = atLevel('medium', { 'fargkoden-mode': 'practice', 'fargkoden-part': 'v' });
  for (const p of sample(md, 30)) { assert.equal(p.focus, 'v'); assert.equal(p.fmt, 'mc'); }
});

test('Öva på Mästare, Temp.koeff.: alltid sexband och flerval', () => {
  const t = atLevel('tc', { 'fargkoden-mode': 'practice', 'fargkoden-part': 'k' });
  for (const p of sample(t, 40)) { assert.equal(p.n, 6); assert.equal(p.fmt, 'mc'); assert.equal(p.focus, 'k'); }
});

test('Gesäll: rätt på gammalt står still, rätt på nytt räknar upp, fel nollställer', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't'); answer(t, true); assert.equal(t.g('S.streak'), 1);
  until(t, p => p.skill === 'v'); answer(t, true); assert.equal(t.g('S.streak'), 1);
  until(t, p => p.skill === 't'); answer(t, true); assert.equal(t.g('S.streak'), 2);
  until(t, p => p.skill === 'v'); answer(t, false); assert.equal(t.g('S.streak'), 0);
});

test('5 i rad på det nya låser upp nästa nivå', () => {
  const t = load({ storage: { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5 }), 'fargkoden-level': 'medium' } });
  for (let i = 0; i < 5; i++) { until(t, p => p.skill === 't'); answer(t, true); }
  assert.equal(t.g('S.lvBest.medium'), 5);
  assert.equal(t.g('unlocked("tc")'), true);
});
