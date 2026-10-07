import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade, golden, load, ALL_OPEN } from './harness.mjs';
import { answer, until } from './answer.mjs';

// Ritar en sträng från spelet i en div, så att man kan räkna element
const frag = (t, expr) => { const d = t.doc.createElement('div'); d.innerHTML = t.g(expr); return d; };
const n = (d, sel) => d.querySelectorAll(sel).length;

test('E-seriernas Lärling: Vilken tolerans är serien gjord för?, tre stapelrader efter svaret', () => {
  for (const ok of [false, true]) {
    const t = atGrade('e', 1);
    until(t, p => p.eq === 'staplar');
    const m = t.$('#q .prompt').textContent.match(/Vilken tolerans är E(6|12|24) gjord för\?/);
    assert.ok(m);
    assert.equal(t.$$('#q [data-c]').length, 3);
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), t.g(`fmtTol(SER_TOL.E${m[1]})`));
    assert.equal(t.$$('#q svg.elin').length, 1, 'linjalen före svaret');
    assert.equal(t.$$('#q .etrow').length, 0);
    answer(t, ok);
    const rows = t.$$('#q .etrow');
    assert.equal(rows.length, 3);
    assert.equal(t.$$('#q .etrow.pick').length, 1);
    assert.equal(rows.indexOf(t.$('#q .etrow.pick')) === 1, ok, 'den valda raden har ramen');
    assert.ok(rows[0].querySelector('.ecrash'), 'för stor krockar');
    assert.equal(rows[1].querySelectorAll('.ecrash, .egap').length, 0, 'den rätta är ren');
    assert.ok(rows[2].querySelector('.egap'), 'för liten glappar');
    assert.match(rows[0].textContent, /10 Ω och 1[125] Ω kan båda bli [\d,]+ Ω/);
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

// Rättningar efter slutgranskningen
