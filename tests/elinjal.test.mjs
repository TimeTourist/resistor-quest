import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade, golden, load, ALL_OPEN } from './harness.mjs';
import { answer, until, cont } from './answer.mjs';

export const frag = (t, expr) => { const d = t.doc.createElement('div'); d.innerHTML = t.g(expr); return d; };

test('Raka linjalen: E6-värdena på rak skala, avstånden växer med värdet', () => {
  const t = load();
  const d = frag(t, 'linSVG(6)');
  assert.ok(d.querySelector('svg.elin'));
  const xs = [...d.querySelectorAll('.lval circle')].map(c => +c.getAttribute('cx'));
  assert.equal(xs.length, 6);
  const steps = xs.slice(1).map((x, i) => x - xs[i]);
  steps.slice(1).forEach((s, i) => assert.ok(s > steps[i], 'varje steg längre än det förra'));
  assert.deepEqual([...d.querySelectorAll('.lval text')].map(e => e.textContent), ['10','15','22','33','47','68']);
  assert.equal(d.querySelectorAll('.ltick').length, 10, 'streck vid 10, 20 … 100');
});

test('Raka linjalen: staplarna blir bredare med värdet, och krock och glapp avgörs relativt värdet', () => {
  const t = load();
  const w = d => [...d.querySelectorAll('.lbar')].map(b => +b.getAttribute('width'));
  const ws = w(frag(t, 'linSVG(6, {tol: 20})'));
  ws.slice(1).forEach((x, i) => assert.ok(x > ws[i]));
  const n = (expr, sel) => frag(t, expr).querySelectorAll(sel).length;
  assert.equal(n('linSVG(6, {tol: 20})', '.ecrash, .egap'), 0, 'E6 ±20 % är ren');
  assert.equal(n('linSVG(12, {tol: 10})', '.ecrash, .egap'), 0, 'E12 ±10 % är ren');
  assert.equal(n('linSVG(24, {tol: 5})', '.ecrash, .egap'), 0, 'E24 ±5 % är ren');
  assert.ok(n('linSVG(6, {tol: 40})', '.ecrash') > 0);
  assert.ok(n('linSVG(6, {tol: 10})', '.egap') > 0);
  assert.equal(n('linSVG(6, {tol: 20, cover: true})', '.lcover'), 1);
  assert.equal(n('linSVG(6, {tol: 10, cover: true})', '.lcover'), 0, 'ingen grön linje när det finns glapp');
});

test('Staplarfrågan: E6 i hälften av frågorna, rak linjal och E6 ±40 / ±20 / ±10', () => {
  const t = atGrade('e', 1), seen = {};
  for (let i = 0; i < 80; i++) {
    until(t, p => p.eq === 'staplar');
    const n = +t.$('#q .prompt').textContent.match(/E(\d+)/)[1];
    seen[n] = (seen[n] || 0) + 1;
    assert.ok(t.$('#q svg.elin'), 'rak linjal före svaret');
    assert.equal(t.$('#q .eruler'), null);
    if (n === 6) assert.deepEqual(t.$$('#q [data-c]').map(b => b.textContent.trim()).sort(), ['±10 %', '±20 %', '±40 %']);
  }
  assert.ok(seen[6] > 25 && seen[12] && seen[24]);
  until(t, p => p.eq === 'staplar');
  answer(t, false);
  assert.equal(t.$$('#q .etrow svg.elin').length, 3);
});
