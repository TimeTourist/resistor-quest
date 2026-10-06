import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade } from './harness.mjs';
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
