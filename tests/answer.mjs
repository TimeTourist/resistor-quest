import assert from 'node:assert/strict';

// Går till nästa fråga tills planen uppfyller pred
export function until(t, pred, max = 800) {
  for (let i = 0; i < max; i++) {
    t.g('next()');
    if (pred(t.g('({...S.plan, n: S.n})'))) return;
  }
  throw new Error('hittade ingen sådan fråga');
}

// Svarar på aktuell fråga som en spelare, rätt eller fel
export function answer(t, correct = true) {
  const { g, $$ } = t, type = g('S.type'), fmt = g('S.plan.fmt');
  const pickBy = (sel, attr, right) => {
    const btn = $$(sel).find(b => (b.dataset[attr] === String(right)) === correct);
    assert.ok(btn, `ingen knapp ${sel}`);
    btn.click();
  };
  if (type === 'dir') return pickBy('[data-dir]', 'dir', g("S.ambig ? 'none' : S.style.flip ? 'right' : 'left'"));
  if (type === 'series') return pickBy('[data-sr]', 'sr', g('S.sr.answer'));
  if (fmt === 'mc' && type === 'read')
    return pickBy('[data-pick]', 'pick', g("S.focus + ':' + S.mc[S.focus].findIndex(x => mcEq(x, mcTruth(S.focus)))"));
  if (fmt === 'mc' && type === 'build') {
    const r = g('bmcRight()');
    if (typeof r === 'number') return pickBy('[data-vpick]', 'vpick', r);
    return g("S.focus === 'k'") ? pickBy('[data-kpick]', 'kpick', r) : pickBy('[data-tpick]', 'tpick', r);
  }
  throw new Error(`answer: ${type}/${fmt} stöds inte än`);
}
