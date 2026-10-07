import assert from 'node:assert/strict';

// Går till nästa fråga tills planen uppfyller pred
export function until(t, pred, max = 800) {
  for (let i = 0; i < max; i++) {
    t.g('next()');
    if (pred(t.g('({...S.plan, n: S.n, set: S.ord && S.ord.set})'))) return;
  }
  throw new Error('hittade ingen sådan fråga');
}

// Fortsätt efter svar: ett tryck var som helst på kortet
export const cont = t => t.$('#q').click();

// SVG-element har ingen click(), så klicket skickas som ett event
export const tap = (t, el) => el.dispatchEvent(new t.w.MouseEvent('click', { bubbles: true }));

// Svarar på aktuell fråga som en spelare, rätt eller fel
export function answer(t, correct = true) {
  const { g, $$ } = t, type = g('S.type'), fmt = g('S.plan.fmt');
  const pickBy = (sel, attr, right) => {
    const btn = $$(sel).find(b => (b.dataset[attr] === String(right)) === correct);
    assert.ok(btn, `ingen knapp ${sel}`);
    btn.click();
  };
  if (type === 'choice') return pickBy('[data-c]', 'c', g('S.cq.right'));
  if (type === 'point') {
    const right = g('S.pointAt');
    const el = $$('[data-band]').find(b => (b.dataset.band === String(right)) === correct);
    assert.ok(el, 'inget band att peka på');
    return tap(t, el);
  }
  if (type === 'dir') return pickBy('[data-dir]', 'dir', g("S.style.flip ? 'right' : 'left'"));
  if (type === 'order') {
    // Rätt: i ordning. Fel: en felaktig färg först i varje försök, sedan resten i ordning.
    for (let i = 0; i < 100 && !g('S.answered'); i++) {
      const want = g('S.ord.keys.find(k => !S.ord.placed[k])');
      const k = !correct && !g('S.ord.missed') ? g(`S.ord.keys.find(k => !S.ord.placed[k] && k !== '${want}')`) || want : want;
      t.$(`[data-ord="${k}"]`).click();
    }
    return;
  }
  if (fmt === 'mc' && type === 'read')
    return pickBy('[data-pick]', 'pick', g("S.focus + ':' + S.mc[S.focus].findIndex(x => mcEq(x, mcTruth(S.focus)))"));
  if (fmt === 'mc' && type === 'build') {
    const r = g('bmcRight()');
    if (typeof r === 'number') return pickBy('[data-vpick]', 'vpick', r);
    return g("S.focus === 'k'") ? pickBy('[data-kpick]', 'kpick', r) : pickBy('[data-tpick]', 'tpick', r);
  }
  if (fmt === 'hard' && type === 'read' && g('!!S.be')) {
    // Knappa in under banden: tryck på bandet och skriv, multiplikatorn under fliken ×
    const k = g('nd(S.q)');
    for (let i = 0; i < k; i++) {
      tap(t, t.$(`#q [data-band="${i}"]`));
      const d = g(`C[S.q[${i}]].d`);
      t.$(`#q [data-bekey="${!correct && i === 0 ? (d + 1) % 10 : d}"]`).click();
    }
    tap(t, t.$(`#q [data-band="${k}"]`));
    t.$('#q [data-betab="m"]').click();
    const m = g(`C[S.q[${k}]].m`);
    return $$('#q [data-bemult]').find(b => Math.abs(+b.dataset.bemult - m) < 1e-9 * Math.max(1, m)).click();
  }
  if (fmt === 'hard' && type === 'read') {
    const fs = Array.from(g('entryFields()'));
    fs.forEach((f, j) => {
      const wrong = !correct && j === 0;
      t.$(`[data-field="${f}"]`).click();
      if (f === 'v') {
        const d = g('digitStr(S.q)'), typed = wrong ? String(+d + 1) : d;
        for (const ch of typed) t.$(`[data-key="${ch}"]`).click();
      } else {
        const truth = g(`({x: C[S.q[nd(S.q)]].m, t: tolOf(S.q), k: tcOf(S.q)})['${f}']`);
        const btn = $$('[data-fval]').find(b => (+b.dataset.fval === truth) !== wrong);
        btn.click();
      }
    });
    return t.$('#submit').click();
  }
  if (fmt === 'hard' && type === 'build') {
    const ask = Array.from(g('S.askSlots ? [...S.askSlots] : [...Array(S.n).keys()]'));
    ask.forEach((i, j) => {
      t.$(`[data-slot="${i}"]`).click();
      const truth = g(`truthAt(${i})`);
      const color = correct || j > 0 ? truth : (truth === 'red' ? 'brown' : 'red');
      t.$(`[data-color="${color}"]`).click();
    });
    return;
  }
  throw new Error(`answer: ${type}/${fmt} stöds inte`);
}

// Startfrågan på ett ämneskort: svarar rätt (eller fel) om kortet har en
export function kick(t, correct = true) {
  const right = t.g('S.kick ? S.kick.right : null');
  if (right == null) return false;
  const btn = t.$$('[data-kick]').find(b => (+b.dataset.kick === right) === correct);
  btn.click();
  return true;
}
// Eldprovets kort: tre tryck och provet börjar
export function dare(t) {
  for (let i = 0; i < 3; i++) t.$('#dare').click();
}
