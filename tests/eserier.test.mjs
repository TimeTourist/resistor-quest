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

test('E-seriernas Lärling: Vilken tolerans är serien gjord för?, tre stapelrader efter svaret', () => {
  for (const ok of [false, true]) {
    const t = atGrade('e', 1);
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


test('Gyllene E-serierna: blandat spelar alla nya frågor utan fel', () => {
  const t = golden('e');
  for (let i = 0; i < 40; i++) { t.g('next()'); answer(t, i % 2 === 0); }
  assert.deepEqual(t.errors, []);
});

// Som atGrade, men med animeringar (S.instant är av)
const live = (topic, grade) => load({ instant: false, storage: { ...ALL_OPEN, 'fargkoden2-topic': topic,
  'fargkoden2-done': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }), 'fargkoden2-grade': JSON.stringify({ [topic]: grade }) } });

test('Utrullningen: första linjalen rullas ut, nästa visas direkt', () => {
  const t = live('e', 1);
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
  const t = atGrade('e', 1);
  until(t, p => p.eq === 'staplar');
  assert.equal(t.$$('#q .eruler.unroll').length, 0);
  assert.equal(t.g('S.rolled'), true);
});

// Rättningar efter slutgranskningen
test('Linjalen går att läsa på telefon: smal viewBox och värden som inte trängs på samma rad', () => {
  const t = atGrade('e', 0);
  for (const s of [6, 12, 24]) {
    const svg = frag(t, `rulerSVG(${s})`).querySelector('svg');
    const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    assert.ok(vb[2] <= 440, `E${s} viewBox ${vb[2]}`);
    const rows = {};
    for (const l of svg.querySelectorAll('.elab')) (rows[l.getAttribute('y')] ||= []).push(+l.getAttribute('x'));
    for (const xs of Object.values(rows)) for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] >= 24, `E${s}: ${xs[i - 1]}–${xs[i]}`);
  }
});

test('Klockan är högst 330 px bred även i .res', () => {
  const t = atGrade('e', 0);
  const rule = [...t.doc.styleSheets].flatMap(s => [...s.cssRules]).find(r => r.selectorText === '.res .edial');
  assert.ok(rule, 'regeln .res .edial finns');
  assert.equal(rule.style.maxWidth, '330px');
});
