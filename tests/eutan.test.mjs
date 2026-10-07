import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade, golden, load, ALL_OPEN } from './harness.mjs';
import { answer, until } from './answer.mjs';

const frag = (t, expr) => { const d = t.doc.createElement('div'); d.innerHTML = t.g(expr); return d; };

test('serOfBands: toleransbandet avgör serien, tre band är E6', () => {
  const t = load();
  assert.equal(t.g("serOfBands(['yellow','violet','red'])"), 'E6');
  assert.equal(t.g("serOfBands(['yellow','violet','red','silver'])"), 'E12');
  assert.equal(t.g("serOfBands(['yellow','violet','red','gold'])"), 'E24');
  assert.equal(t.g("serOfBands(['yellow','violet','black','brown','red'])"), 'E48');
  assert.equal(t.g("serOfBands(['yellow','violet','black','brown','brown'])"), 'E96');
  for (const c of ['green','blue','violet']) assert.equal(t.g(`serOfBands(['yellow','violet','black','brown','${c}'])`), 'E192');
  assert.equal(t.g("serOfBands(['yellow','violet','black','brown','brown','red'])"), 'E96', 'sex band: toleransen är det näst sista');
});

test('bandResistor: rätt antal band, värdet finns i serien och banden ger serien', () => {
  const t = load();
  for (let i = 0; i < 300; i++) {
    const r = JSON.parse(t.g("JSON.stringify(bandResistor({sers: SERS, six: Math.random() < .5, flip: Math.random() < .5}))"));
    assert.equal(t.g(`serOfBands(${JSON.stringify(r.bands)})`), r.ser);
    const n = r.bands.length;
    assert.equal(n, {E6: 3, E12: 4, E24: 4}[r.ser] || (n === 6 ? 6 : 5));
    const k = n <= 4 ? 2 : 3, digits = +r.bands.slice(0, k).map(c => t.g(`C.${c}.d`)).join('');
    const list = t.g(`JSON.stringify(ESER['${r.ser === 'E192' ? 'E96' : r.ser}'][0])`);
    assert.ok(JSON.parse(list).includes(digits), `${digits} finns i ${r.ser}`);
    if (n === 3) assert.equal(r.flip, false, 'tre band vänds inte');
  }
});

test('Trappan: sex steg, det markerade lyser, och med ett krav blir stegen för grova, räcker eller fler än du behöver', () => {
  const t = load();
  let d = frag(t, "stairHTML({hl: 'E24'})");
  assert.equal(d.querySelectorAll('.estep').length, 6);
  assert.match(d.querySelector('.estep.hl').textContent, /E24.*±5 %/);
  d = frag(t, 'stairHTML({need: 10})');
  assert.deepEqual([...d.querySelectorAll('.estep')].map(e => e.className.replace(/estep|mk/g, '').trim()), ['bad', 'ok', 'more', 'more', 'more', 'more']);
  assert.match(d.querySelector('.eneed').textContent, /±10 %/);
});

test('Gesäll: Vilken serie tillhör motståndet?, svaren E6–E96, toleransen står inte utskriven och motståndet sitter rättvänt', () => {
  const t = atGrade('e', 2), seen = new Set();
  for (let i = 0; i < 60; i++) {
    t.g('next()');
    assert.equal(t.g('S.plan.eq'), 'band');
    assert.equal(t.$('#q .prompt').textContent.trim(), 'Vilken serie tillhör motståndet?');
    assert.deepEqual(t.$$('#q [data-c]').map(b => b.textContent.trim()), ['E6','E12','E24','E48','E96']);
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), t.g('serOfBands(S.cq.r.bands)'));
    assert.equal(t.$('#q .etol'), null);
    assert.equal(t.g('S.cq.r.flip'), false);
    assert.ok([3, 4, 5].includes(t.g('S.cq.r.bands.length')));
    seen.add(t.g('S.cq.r.ser'));
  }
  assert.equal(seen.size, 5);
});

test('Vilken serie tillhör motståndet?: efter svaret har toleransbandet en ring, vid fel lappen och pilen till serien', () => {
  for (const ok of [true, false]) {
    const t = atGrade('e', 2);
    until(t, p => p.eq === 'band');
    while (t.g('S.cq.r.bands.length') === 3) t.g('next()');
    answer(t, ok);
    assert.equal(t.$$('#q .res .ring.ok').length, 1, 'ringen');
    assert.equal(!!t.$('#q .eband'), !ok, 'lappen och pilen vid fel');
    if (!ok) {
      const c = t.g('C[S.cq.r.bands[tolIdx(S.cq.r.bands.length)]].n');
      assert.match(t.$('#q .eband').textContent, new RegExp(`${c} ±.* → ${t.g('S.cq.r.ser')}`));
      assert.ok(t.$$('#q [data-c]')[t.g('S.cq.right')].classList.contains('land'), 'rätt knapp lyser upp');
      assert.ok(t.g('S.lockUntil - S.revealAt') >= 0, 'låset sätts');
    }
  }
});

test('Vilken serie tillhör motståndet?: tre band visar platsen för det saknade bandet: Inget band ±20 %', () => {
  const t = atGrade('e', 2);
  for (let i = 0; i < 200 && !(t.g("S.plan.eq === 'band'") && t.g('S.cq.r.bands.length') === 3); i++) t.g('next()');
  answer(t, false);
  assert.match(t.$('#q .eband').textContent, /Inget band ±20 % → E6/);
  assert.ok(t.$('#q .res rect[stroke-dasharray]'), 'det saknade bandet är streckat');
});

test('Lärling: serie ↔ tolerans, vilken serie räcker, staplarna och motståndet med toleransen utskriven', () => {
  const t = atGrade('e', 1), seen = new Set();
  for (let i = 0; i < 120; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['band', 'racker', 'serietol', 'staplar']);
});

test('Lärling: motståndet har toleransen utskriven, och den stämmer med bandet', () => {
  const t = atGrade('e', 1);
  for (let i = 0; i < 20; i++) {
    until(t, p => p.eq === 'band');
    const b = JSON.parse(t.g('JSON.stringify(S.cq.r.bands)'));
    const tol = b.length === 3 ? 20 : t.g(`C.${b[t.g(`tolIdx(${b.length})`)]}.t`);
    assert.equal(t.$('#q .etol').textContent, t.g(`fmtTol(${tol})`));
  }
});

test('Lärling: serie ↔ tolerans visar trappan vid fel med paret markerat', () => {
  const t = atGrade('e', 1);
  until(t, p => p.eq === 'serietol');
  answer(t, false);
  assert.equal(t.$$('#q .estep').length, 6);
  assert.equal(t.$$('#q .estep.hl').length, 1);
  assert.ok(t.g('S.cq.anim.total') >= t.g('stairEnd()'));
});

test('Lärling: vilken serie räcker, rätt svar är serien gjord för toleransen, med en grövre när det finns och alltid en finare', () => {
  const t = atGrade('e', 1);
  for (let i = 0; i < 60; i++) {
    until(t, p => p.eq === 'racker');
    const need = +t.$('#q .prompt').textContent.match(/avvika högst ±(\d+)/)[1];
    const opts = t.$$('#q [data-c]').map(b => b.textContent.trim()), right = opts[t.g('S.cq.right')];
    assert.equal(right, t.g(`TOL_SER[${need}]`));
    const idx = s => t.g(`SERS.indexOf('${s}')`);
    if (need < 20) assert.ok(opts.some(s => idx(s) === idx(right) - 1), 'en grövre');
    assert.ok(opts.some(s => idx(s) > idx(right)), 'en finare');
    assert.equal(new Set(opts).size, 4);
  }
  answer(t, false);
  assert.equal(t.$$('#q .estep.bad').length + t.$$('#q .estep.ok').length + t.$$('#q .estep.more').length, 6);
  assert.ok(t.$('#q .eneed'));
});

test('Samma siffror: tre svar har ledtrådens siffror, det udda finns inte i serien och har andra siffror', () => {
  const t = atGrade('e', 0);
  for (let i = 0; i < 200; i++) {
      t.g('GRADES.e[0] = multiQ; next()');
    const m = JSON.parse(t.g('JSON.stringify(S.cq.m)')), list = JSON.parse(t.g(`JSON.stringify(ESER['${m.ser}'][0])`));
    assert.ok(list.includes(m.hint));
    assert.ok(!list.includes(m.odd), `${m.odd} finns inte i ${m.ser}`);
    assert.notEqual(m.odd, m.hint);
    assert.ok(Math.abs(m.odd - m.hint) <= 8, 'siffror nära ledtråden');
    assert.ok(['E6', 'E12'].includes(m.ser));
    const vals = JSON.parse(t.g('JSON.stringify(S.cq.vals)'));
    const digits = v => { let x = v; while (x >= 100) x /= 10; while (x < 10) x *= 10; return Math.round(x); };
    vals.forEach((v, j) => assert.equal(digits(v), j === t.g('S.cq.right') ? m.odd : m.hint));
    assert.equal(new Set(vals).size, 4);
  }
});

test('Samma siffror: frågan har ledtråden, är Vilken ska bort?, och vid fel delas svaren upp i siffror och multiplikator', () => {
  const t = atGrade('e', 0);
  t.g('GRADES.e[0] = multiQ; next()');
  const m = JSON.parse(t.g('JSON.stringify(S.cq.m)'));
  assert.ok(t.$('#q .oddhead'));
  assert.match(t.$('#q .prompt').textContent, new RegExp(`${t.g(`num(${m.hint} / 10)`)} Ω finns i ${m.ser}`));
  answer(t, false);
  const rows = t.$$('#q .emrow');
  assert.equal(rows.length, 4);
  assert.equal(t.$$('#q .emrow.ok').length, 3);
  assert.match(t.$('#q .emrow.bad').textContent, new RegExp(String(m.odd).split('').join(' ')));
});

test('Räcker säkert: exemplet 3,4 kΩ ±10 % ger E24, eftersom E12:s 3,3 kΩ ±10 % kan bli för lågt', () => {
  const t = load();
  const rows = JSON.parse(t.g('JSON.stringify(safeRows(3400, 10))'));
  const by = s => rows.find(r => r.s === s);
  assert.equal(by('E6').ok, false);
  assert.equal(by('E12').ok, false);
  assert.equal(by('E24').ok, true);
  assert.equal(by('E24').v, 3300);
});

test('Räcker säkert: gränsfall avgörs med tolerans för flyttal', () => {
  const t = load();
  // 3,3 kΩ ±5 % = 3135–3465. Ett fönster på exakt 3135–3465 ska räcka.
  const T = (3135 + 3465) / 2, need = (3465 - T) / T * 100;
  const rows = JSON.parse(t.g(`JSON.stringify(safeRows(${T}, ${need}))`));
  assert.equal(rows.find(r => r.s === 'E24').ok, true);
});

test('Räcker säkert: slumpade uppgifter är alltid lösbara, aldrig E6, och den grövre räcker inte', () => {
  const t = load();
  for (let i = 0; i < 300; i++) {
    const k = JSON.parse(t.g('JSON.stringify(safeTask())'));
    assert.ok(['E12','E24','E48','E96'].includes(k.answer), k.answer);
    const i0 = k.rows.findIndex(r => r.s === k.answer);
    assert.equal(k.rows[i0].ok, true);
    assert.ok(k.rows.slice(0, i0).every(r => !r.ok), 'alla grövre räcker inte');
    assert.ok([20, 10, 5, 2].includes(k.need));
  }
});

test('Räcker säkert: tabellen visas före svaret, och vid fel tallinjen med staplar fram till svaret', () => {
  const t = atGrade('e', 0);
  t.g('GRADES.e[0] = safeQ; next()');
  assert.equal(t.$$('#q .esafe tr').length, 5, 'en rad per serie E6–E96');
  assert.deepEqual(t.$$('#q [data-c]').map(b => b.textContent.trim()), ['E6','E12','E24','E48','E96']);
  answer(t, false);
  const ans = t.g('S.cq.k.answer'), bars = t.$$('#q .esline .ebarr');
  assert.equal(bars.length, t.g(`SERS.indexOf('${ans}')`) + 1);
  assert.ok(bars.at(-1).classList.contains('ok'));
  assert.ok(bars.slice(0, -1).every(b => b.classList.contains('bad')));
  assert.ok(t.$$('#q [data-c]')[t.g('S.cq.right')].classList.contains('land'));
});

test('Mästare: svåra motstånd (E192, sex band, vända), samma siffror och räcker säkert', () => {
  const t = atGrade('e', 3), seen = new Set(), sers = new Set();
  let six = false, flip = false;
  for (let i = 0; i < 300; i++) {
    t.g('next()'); seen.add(t.g('S.plan.eq'));
    if (t.g("S.plan.eq === 'band'")) {
      sers.add(t.g('S.cq.r.ser'));
      six ||= t.g('S.cq.r.bands.length') === 6; flip ||= t.g('S.cq.r.flip');
      assert.equal(t.$$('#q [data-c]').length, 6, 'E6–E192');
    }
  }
  assert.deepEqual([...seen].sort(), ['band', 'multi', 'sakert']);
  assert.ok(sers.has('E192') && six && flip);
});

test('Vänt motstånd med sex band: ringen sitter på toleransbandet efter att det vänts rätt', () => {
  const t = atGrade('e', 3);
  for (let i = 0; i < 500 && !(t.g("S.plan.eq === 'band'") && t.g('S.cq.r.flip') && t.g('S.cq.r.bands.length') === 6); i++) t.g('next()');
  answer(t, false);
  assert.ok(t.$('#q .eturn svg'), 'vänds rätt');
  const ring = t.$('#q .res .ring.ok'), x = +ring.getAttribute('x') + +ring.getAttribute('width') / 2;
  assert.ok(Math.abs(x - t.g('STD_X[6][4]')) < 1, 'ringen på band 5 av 6, rättvänt');
  assert.match(t.$('#q .res').textContent, /inte tolerans/);
});

test('Stormästare: blandar serie ↔ tolerans, räcker, band, samma siffror och räcker säkert', () => {
  const t = atGrade('e', 4), seen = new Set();
  for (let i = 0; i < 300; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['band', 'multi', 'racker', 'sakert', 'serietol']);
});

test('Inga värden behövs: ingen E-fråga har svaret Inte standard, och frågetypen series finns inte', () => {
  for (let g = 0; g < 5; g++) {
    const t = atGrade('e', g);
    for (let i = 0; i < 60; i++) {
      t.g('next()');
      assert.equal(t.g('S.type'), 'choice');
      assert.ok(!/Inte standard/.test(t.$('#q').textContent));
    }
  }
  assert.equal(load().g("typeof genSeriesRead"), 'undefined');
});

test('Eldprovet och blandat spelar alla nya E-frågor utan fel', () => {
  const t = golden('e');
  for (let i = 0; i < 80; i++) { t.g('next()'); answer(t, i % 2 === 0); }
  assert.deepEqual(t.errors, []);
  const u = load({ storage: ALL_OPEN });
  u.g("openTopic('ultra'); beginExam()");
  for (let i = 0; i < 20; i++) { answer(u, i % 3 !== 0); if (u.g('S.answered') && !u.g('S.exam.done')) u.$('#q').click(); }
  assert.deepEqual(u.errors, []);
});

test('Eldprovet: bandfrågan visar ingen ring efter svaret, eftersom provet inte visar facit', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra'); beginExam(); GRADES.e[4] = () => bandQ({sers: SERS.slice(1, 5)}); S.exam.queue[S.exam.i] = {topic: 'e'}; next()");
  assert.equal(t.g('S.plan.eq'), 'band');
  answer(t, true);
  assert.equal(t.$$('#q .ring').length, 0);
});

test('Samma siffror: felanimeringen visar multiplikatorn utan flyttalsskräp', () => {
  const t = atGrade('e', 0);
  for (let i = 0; i < 300; i++) {
    t.g('GRADES.e[0] = multiQ; next()');
    answer(t, false);
    for (const r of t.$$('#q .emrow')) assert.doesNotMatch(r.textContent, /\d\.\d|e[+-]\d/, r.textContent);
  }
});

test('Vilken serie räcker? handlar om motståndens egen tolerans, så att den inte säger emot Räcker säkert', () => {
  const t = atGrade('e', 1);
  until(t, p => p.eq === 'racker');
  assert.match(t.$('#q .prompt').textContent, /^Motstånden får avvika högst ±\d+ % från sitt märkta värde\. Vilken serie räcker, med så få värden som möjligt\?$/);
  answer(t, false);
  assert.match(t.$('#q .eneed').textContent, /^Motstånden får avvika ±\d+ %$/);
});
