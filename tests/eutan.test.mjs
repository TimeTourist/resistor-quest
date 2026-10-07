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

test('Nykomling: Vad betyder 12 i E12? och Vad är E12?, båda förekommer', () => {
  const t = atGrade('e', 0), seen = new Set();
  for (let i = 0; i < 40; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['namn', 'vad']);
});

test('Nykomling: 12 i E12 betyder att 10–100 är uppdelat i 12 steg', () => {
  const t = atGrade('e', 0);
  until(t, p => p.eq === 'namn');
  assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), '10–100 är uppdelat i 12 steg');
  answer(t, false);
  assert.equal(t.$$('#q .edot').length, 12);
  assert.match(t.g('S.cq.wrong'), /12 steg.*20 %/);
});

test('Nykomling: Vad är E12? Standardvärden, och vid fel tänds samma värde med olika nollor', () => {
  for (const ok of [true, false]) {
    const t = atGrade('e', 0);
    until(t, p => p.eq === 'vad');
    assert.equal(t.$('#q .prompt').textContent.trim(), 'Vad är E12?');
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), 'Standardvärden som motstånd säljs i');
    answer(t, ok);
    assert.equal(t.$$('#q .edot').length, 12, 'klockan fylls');
    assert.equal(t.$$('#q .eex .mk').length, ok ? 0 : 3, 'tre exempel vid fel');
    if (!ok) assert.match(t.$('#q .eex').textContent, /4,7 Ω.*47 Ω.*4,7 kΩ/);
  }
});

test('Nykomling: Vad är E12? vid fel låser tills exemplen har tänts', () => {
  const t = atGrade('e', 0);
  until(t, p => p.eq === 'vad');
  assert.ok(t.g('S.cq.anim.total') >= 2.4);
});
