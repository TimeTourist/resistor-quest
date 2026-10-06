import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade, golden, load, ALL_OPEN } from './harness.mjs';
import { answer, until } from './answer.mjs';

// Ritar en sträng från spelet i en div, så att man kan räkna element
const frag = (t, expr) => { const d = t.doc.createElement('div'); d.innerHTML = t.g(expr); return d; };
const n = (d, sel) => d.querySelectorAll(sel).length;

test('Klockan: E12 med nummer har 12 prickar, 12 värden, 12 nummer och 24 streck', () => {
  const t = atGrade('e', 0), d = frag(t, 'dialSVG(12, {count: true})');
  assert.equal(n(d, '.edot'), 12);
  assert.equal(n(d, '.elab'), 12);
  assert.equal(n(d, '.enum'), 12);
  assert.equal(n(d, '.etick'), 24);
  assert.equal(d.querySelector('.emid').textContent, 'E12');
  assert.match(d.querySelector('.esub').textContent, /100 = nytt varv/);
  assert.deepEqual([...d.querySelectorAll('.elab')].map(x => x.textContent), ['10','12','15','18','22','27','33','39','47','56','68','82']);
});

test('Klockan: utan värden står ett frågetecken i mitten, och tom klocka har inga prickar', () => {
  const t = atGrade('e', 0);
  const q = frag(t, 'dialSVG(24, {labels: false})');
  assert.equal(n(q, '.edot'), 24);
  assert.equal(n(q, '.elab'), 0);
  assert.equal(q.querySelector('.emid').textContent, '?');
  const e = frag(t, 'dialSVG(12, {dots: false})');
  assert.equal(n(e, '.edot'), 0);
  assert.equal(e.querySelector('.emid').textContent, 'E12');
});

test('Linjalen: seriens prickar plus 100, värden bara upp till E24', () => {
  const t = atGrade('e', 0);
  const d = frag(t, 'rulerSVG(12)');
  assert.equal(n(d, '.epdot'), 13);
  assert.equal(n(d, '.epdot.next'), 1);
  assert.equal(n(d, '.elab'), 13);
  assert.equal(n(d, '.ebar'), 0);
  const big = frag(t, 'rulerSVG(96)');
  assert.equal(n(big, '.epdot'), 97);
  assert.equal(n(big, '.elab'), 0);
});

test('Linjalen: för stor tolerans krockar, för liten glappar, den rätta är ren', () => {
  const t = atGrade('e', 0);
  for (const [s, big, right, small] of [[6, 50, 20, 1], [12, 20, 10, 1], [24, 10, 5, 1]]) {
    const b = frag(t, `rulerSVG(${s}, {tol: ${big}})`), r = frag(t, `rulerSVG(${s}, {tol: ${right}})`), l = frag(t, `rulerSVG(${s}, {tol: ${small}})`);
    assert.ok(n(b, '.ecrash') > 0 && n(b, '.egap') === 0, `E${s} ±${big} krockar`);
    assert.equal(n(r, '.ecrash') + n(r, '.egap'), 0, `E${s} ±${right} är ren`);
    assert.ok(n(l, '.egap') > 0 && n(l, '.ecrash') === 0, `E${s} ±${small} glappar`);
    assert.equal(n(r, '.ebar'), s + 1);
  }
});

test('Linjalen: värden släpps ner med bock eller kryss', () => {
  const t = atGrade('e', 0), d = frag(t, "rulerSVG(12, {marks: [{v: 47, ok: true}, {v: 64, ok: false}]})");
  assert.equal(n(d, '.emark.ok'), 1);
  assert.equal(n(d, '.emark.bad'), 1);
  assert.match(d.querySelector('.emark.bad').textContent, /✗ 64/);
  assert.match(d.querySelector('.emark.ok').textContent, /✓ 47/);
});

test('E-seriernas Nykomling: Vad betyder 12 i E12?, tom klocka före och 12 prickar efter, både rätt och fel', () => {
  for (const ok of [true, false]) {
    const t = atGrade('e', 0);
    for (let i = 0; i < 10; i++) {
      t.g('next()');
      assert.equal(t.g('S.plan.eq'), 'namn');
      assert.equal(t.$('#q .prompt').textContent.trim(), 'Vad betyder 12 i E12?');
    }
    assert.equal(t.$$('#q .edial').length, 1);
    assert.equal(t.$$('#q .edot').length, 0, 'tom före svaret');
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), '12 värden på varje varv');
    answer(t, ok);
    assert.equal(t.$$('#q .edot').length, 12);
    assert.equal(t.$$('#q .enum').length, 12);
  }
});

test('E-seriernas Lärling: Vilken serie är det här?, rätt svar stämmer med antalet prickar', () => {
  const t = atGrade('e', 1), seen = new Set();
  for (let i = 0; i < 30; i++) {
    t.g('next()');
    assert.equal(t.g('S.plan.eq'), 'klocka');
    const dots = t.$$('#q .edot').length;
    assert.ok([6, 12, 24].includes(dots));
    assert.equal(t.$$('#q .elab').length, 0, 'inga värden före svaret');
    assert.equal(t.$('#q .emid').textContent, '?');
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), 'E' + dots);
    seen.add(dots);
  }
  assert.equal(seen.size, 3, 'E6, E12 och E24 förekommer');
  answer(t, false);
  assert.ok(t.$$('#q .elab').length > 0, 'värdena visas efter svaret');
  assert.match(t.$('#q').textContent, /prickar på varvet/);
});

test('E-seriernas Gesäll: Vilken tolerans är serien gjord för?, tre stapelrader efter svaret', () => {
  for (const ok of [false, true]) {
    const t = atGrade('e', 2);
    until(t, p => p.eq === 'staplar');
    const m = t.$('#q .prompt').textContent.match(/Vilken tolerans är E(6|12|24) gjord för\?/);
    assert.ok(m);
    assert.equal(t.$$('#q [data-c]').length, 3);
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), t.g(`fmtTol(SER_TOL.E${m[1]})`));
    assert.equal(t.$$('#q .eruler').length, 1, 'linjalen före svaret');
    assert.equal(t.$$('#q .etrow').length, 0);
    answer(t, ok);
    const rows = t.$$('#q .etrow');
    assert.equal(rows.length, 3);
    assert.equal(t.$$('#q .etrow.pick').length, 1);
    assert.equal(rows.indexOf(t.$('#q .etrow.pick')) === 1, ok, 'den valda raden har ramen');
    assert.ok(rows[0].querySelector('.ecrash'), 'för stor krockar');
    assert.equal(rows[1].querySelectorAll('.ecrash, .egap').length, 0, 'den rätta är ren');
    assert.ok(rows[2].querySelector('.egap'), 'för liten glappar');
    assert.match(rows[0].textContent, /10 Ω kan vara 1[125] Ω/);
  }
});

test('E-seriernas Gesäll blandar staplarna med serie ↔ tolerans', () => {
  const t = atGrade('e', 2), seen = new Set();
  for (let i = 0; i < 60; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['serietol', 'staplar']);
});

test('E-seriernas Mästare: Inte i E12, värdena faller ner på linjalen, både rätt och fel', () => {
  for (const ok of [false, true]) {
    const t = atGrade('e', 3);
    until(t, p => p.eq === 'e12');
    assert.equal(t.$$('#q .eruler').length, 0, 'ingen linjal före svaret');
    answer(t, ok);
    assert.equal(t.$$('#q .eruler').length, 1);
    assert.equal(t.$$('#q .emark').length, 4);
    assert.equal(t.$$('#q .emark.bad').length, 1);
    assert.equal(t.$$('#q .egrid').length, 0, 'rutnätet är borta');
  }
});

test('E-seriernas Mästare blandar Inte i E12 med Vilken serie', () => {
  const t = atGrade('e', 3), seen = new Set();
  for (let i = 0; i < 60; i++) { t.g('next()'); seen.add(t.g('S.plan.eq') || t.g('S.type')); }
  assert.deepEqual([...seen].sort(), ['e12', 'series']);
});

test('Gyllene E-serierna: blandat spelar alla nya frågor utan fel', () => {
  const t = golden('e');
  for (let i = 0; i < 40; i++) { t.g('next()'); answer(t, i % 2 === 0); }
  assert.deepEqual(t.errors, []);
});

test('E-seriernas Mästare: Inte i E12 är Vilken ska bort?, det udda poppar och tre blir gröna', () => {
  for (const ok of [true, false]) {
    const t = atGrade('e', 3);
    until(t, p => p.eq === 'e12');
    assert.match(t.$('#q').textContent, /Vilken ska bort\?/);
    const right = t.g('S.cq.right');
    answer(t, ok);
    assert.ok(t.$(`[data-c="${right}"]`).classList.contains('gone'));
    assert.equal(t.$$('#q .opt.ok').length, 3);
    assert.equal(t.$$('#q .opt.bad').length, 0);
  }
});

test('Vilken serie: fel svar visar linjalen för serien som toleransen pekar ut, med värdet markerat', () => {
  const t = atGrade('e', 4);
  for (let i = 0; i < 12; i++) {
    t.g("S.grade.e = 4; S.down = 0; next()");
    assert.equal(t.$$('#q .eruler').length, 0, 'ingen linjal före svaret');
    answer(t, false);
    assert.equal(t.$$('#q .eruler').length, 1);
    assert.equal(t.$$('#q .emark').length, 1);
    const ser = t.g('TOL_SER[bandsTol(S.sr.bands)]'), inSer = t.g('seriesOf(S.sr.m3)').includes(ser);
    assert.equal(t.$$('#q .emark.ok').length, inSer ? 1 : 0, ser);
    assert.match(t.$('#q .eruler').getAttribute('aria-label'), new RegExp(ser + '$'));
  }
  t.g('next()'); answer(t, true);
  assert.equal(t.$$('#q .eruler').length, 0, 'rätt svar visar ingen linjal');
});

// Som atGrade, men med animeringar (S.instant är av)
const live = (topic, grade) => load({ instant: false, storage: { ...ALL_OPEN, 'fargkoden2-topic': topic,
  'fargkoden2-done': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }), 'fargkoden2-grade': JSON.stringify({ [topic]: grade }) } });

test('Utrullningen: första linjalen rullas ut, nästa visas direkt', () => {
  const t = live('e', 2);
  // Första frågan som öppnas kan redan ha haft en linjal, och då är utrullningen förbrukad
  t.g('S.rolled = false');
  until(t, p => p.eq === 'staplar');
  assert.equal(t.$$('#q .eruler.unroll').length, 1);
  assert.equal(t.$$('#q .eroll').length, 1, 'klockan som rullas ut');
  assert.ok(t.$('#q .eruler.unroll .epdot').getAttribute('style').includes('--fx'));
  t.g('stopTimer()'); t.g('next()');
  until(t, p => p.eq === 'staplar');
  assert.equal(t.$$('#q .eruler.unroll').length, 0);
  assert.equal(t.g('S.rolled'), true);
});

test('Utrullningen hoppas över med S.instant men räknas ändå', () => {
  const t = atGrade('e', 2);
  until(t, p => p.eq === 'staplar');
  assert.equal(t.$$('#q .eruler.unroll').length, 0);
  assert.equal(t.g('S.rolled'), true);
});
