import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './ackord-harness.mjs';

const t = load({ start: true });
const sp = (r, q) => t.g(`spellTxt(N('${r}'), '${q}')`);

test('Treklangerna stavas efter bokstäverna', () => {
  assert.equal(sp('F♯', 'maj'), 'F♯ A♯ C♯');
  assert.equal(sp('B♭', 'min'), 'B♭ D♭ F');
  assert.equal(sp('B', 'dim'), 'B D F');
  assert.equal(sp('C', 'aug'), 'C E G♯');
  assert.equal(sp('D', 'sus4'), 'D G A');
  assert.equal(sp('E♭', 'sus2'), 'E♭ F B♭');
  assert.equal(sp('C♯', 'min'), 'C♯ E G♯');
  assert.equal(t.g("chordName(N('F♯'), 'min')"), 'F♯m');
});

test('Grundtonerna som frågas ger aldrig dubbelkors eller dubbelbe', () => {
  for (const q of ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4']) {
    const roots = JSON.parse(t.g(`JSON.stringify(rootsFor('${q}'))`));
    assert.ok(roots.length >= 7, `${q} har för få grundtoner`);
    for (const r of roots) assert.doesNotMatch(sp(r, q), /𝄪|𝄫/, `${r}${q}`);
  }
});

test('Tonklasser: oktaven spelar ingen roll, och ackorden ryms på klaviaturen', () => {
  assert.equal(t.g('samePcs([60, 64, 67], [64, 67, 72])'), true);
  assert.equal(t.g('samePcs([60, 64, 67], [60, 63, 67])'), false);
  for (const q of ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'])
    assert.ok(t.g(`ROOT_NAMES.every(r => voicing(N(r), '${q}').every(m => m >= LO && m <= HI))`), q);
});

test('Varje frågetyp: giltiga alternativ, exakt ett rätt och inga dubbeltecken', () => {
  const types = JSON.parse(t.g("JSON.stringify(BUILT.flatMap(x => allTypes(x).map(y => y.id)))"));
  assert.ok(types.length >= 13);
  for (const id of types) {
    for (let i = 0; i < 150; i++) {
      const Q = JSON.parse(t.g(`(() => { const Q = BUILT.flatMap(allTypes).find(x => x.id === '${id}').make();
        return JSON.stringify({kind: Q.kind, opts: Q.opts, right: Q.right, prompt: Q.prompt, answer: Q.answer, ok: Q.kind === 'keys' ? Q.check(Q.answer) : null}); })()`));
      assert.doesNotMatch(Q.prompt + JSON.stringify(Q.opts || []), /𝄪|𝄫|undefined|NaN/, `${id}: ${Q.prompt}`);
      if (Q.kind === 'mc') {
        assert.ok(Q.opts.length >= 2 && Q.right >= 0 && Q.right < Q.opts.length, id);
        assert.equal(new Set(Q.opts).size, Q.opts.length, `${id} har dubbletter: ${Q.opts}`);
      } else assert.equal(Q.ok, true, `${id}: facit godkänns inte`);
    }
  }
});

test('Halvtonssteg upp från E är F, och E♯ finns inte bland alternativen', () => {
  for (let i = 0; i < 200; i++) {
    const Q = JSON.parse(t.g("JSON.stringify(allTypes('tangent').find(x => x.id === 'tangent-halvton-upp').make())"));
    const right = Q.opts[Q.right];
    if (Q.prompt.includes('från E.')) assert.equal(right, 'F');
    if (Q.prompt.includes('från B.')) assert.equal(right, 'C');
    assert.ok(!Q.opts.some(o => o === Q.prompt.match(/från (\w)/)[1] + '♯' && o !== right), Q.opts.join());
  }
});

test('Skalorna stavas efter bokstäverna och förtecknen följer kvintcirkeln', () => {
  const sc = (r, m) => t.g(`scale(N('${r}'), '${m}').map(nName).join(' ')`);
  assert.equal(sc('D', 'maj'), 'D E F♯ G A B C♯');
  assert.equal(sc('E♭', 'maj'), 'E♭ F G A♭ B♭ C D');
  assert.equal(sc('B♭', 'min'), 'B♭ C D♭ E♭ F G♭ A♭');
  assert.equal(sc('A', 'min'), 'A B C D E F G');
  for (let i = 0; i < 12; i++) if (i !== 6) assert.equal(t.g(`accCount(N(CIRCLE[${i}]))`), t.g(`circleAcc(${i})`), `plats ${i}`);
  for (const k of JSON.parse(t.g('JSON.stringify(MIN_KEYS)'))) assert.equal(t.g(`accCount(N('${k}'), 'min')`), t.g(`accCount(upN(N('${k}'), 3, 2))`), `${k}m`);
});

test('Stegen: C Dm Em F G Am Bdim, inga dubbeltecken och allt ryms på klaviaturen', () => {
  assert.equal(t.g("[0,1,2,3,4,5,6].map(d => diat(N('C'), d).name).join(' ')"), 'C Dm Em F G Am Bdim');
  assert.equal(t.g("[0,1,2,3,4,5,6].map(d => diat(N('D'), d).name).join(' ')"), 'D Em F♯m G A Bm C♯dim');
  for (const k of JSON.parse(t.g('JSON.stringify(MAJ_KEYS)'))) for (let d = 0; d < 7; d++) {
    const D = JSON.parse(t.g(`JSON.stringify(diat(N('${k}'), ${d}))`));
    assert.doesNotMatch(D.names.join(' '), /𝄪|𝄫/, `${k} ${d}`);
    assert.ok(D.ms.every(m => m >= 60 && m <= 83), `${k} ${d}: ${D.ms}`);
    assert.equal(t.g(`samePcs(${JSON.stringify(D.ms)}, voicing(N('${D.names[0]}'), '${D.q}'))`), true, `${k} ${d}`);
  }
});

test('Vilken durtonart hör ackorden hemma i: exakt en tonart rymmer alla tre', () => {
  const Q = () => JSON.parse(t.g("(() => { const Q = allTypes('steg').find(x => x.id === 'steg-tonart').make(); return JSON.stringify({p: Q.prompt, r: Q.opts[Q.right]}); })()"));
  for (let i = 0; i < 100; i++) {
    const { p, r } = Q();
    const chords = p.split(':')[0].replace(' och ', ', ').split(', ');
    const fits = JSON.parse(t.g(`JSON.stringify(Array.from({length: 12}, (_, pc) => pc).filter(pc => ${JSON.stringify(chords)}.every(c => { const q = /dim$/.test(c) ? 'dim' : /m$/.test(c) ? 'min' : 'maj'; const root = c.replace(/(dim|m)$/, ''); return diatSet(pc).includes(pcOf(N(root)) + q); })))`));
    assert.equal(fits.length, 1, p);
    assert.equal(t.g(`pcOf(N('${r.replace('-dur', '')}'))`), fits[0], p);
  }
});

test('En skala: samma ton två gånger är fel, en annan oktav är rätt', () => {
  assert.equal(t.g("(() => { const ms = scaleMidi(N('G')); return samePcs(ms.map(m => m + 12 > 83 ? m : m + 12), ms); })()"), true);
  assert.equal(t.g("(() => { const ms = scaleMidi(N('G')); return samePcs([...ms.slice(0, 6), ms[0] + 12], ms); })()"), false);
});
