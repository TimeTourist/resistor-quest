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
