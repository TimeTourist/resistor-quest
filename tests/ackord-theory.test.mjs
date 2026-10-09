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
  const types = JSON.parse(t.g("JSON.stringify(['tangent', 'treklang'].flatMap(x => allTypes(x).map(y => y.id)))"));
  assert.ok(types.length >= 13);
  for (const id of types) {
    for (let i = 0; i < 150; i++) {
      const Q = JSON.parse(t.g(`(() => { const Q = ['tangent', 'treklang'].flatMap(allTypes).find(x => x.id === '${id}').make();
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
