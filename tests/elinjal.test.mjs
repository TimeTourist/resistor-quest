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
test('Vad är E6?: standardvärden, raka linjalen efter svaret, och vid fel tänds samma värde med olika nollor', () => {
  for (const ok of [true, false]) {
    const t = atGrade('e', 0);
    until(t, p => p.eq === 'vad');
    assert.equal(t.$('#q .prompt').textContent.trim(), 'Vad är E6?');
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), 'Standardvärden som motstånd säljs i');
    assert.ok(t.$('#q .e6note'));
    answer(t, ok);
    assert.equal(t.$$('#q svg.elin .lval').length, 6);
    assert.equal(t.$$('#q .eex .mk').length, ok ? 0 : 3);
  }
  const t = atGrade('e', 0);
  until(t, p => p.eq === 'vad');
  assert.match(t.g('S.cq.wrong'), /ovanlig.*E24 och E96/);
});

test('Varför glesare: rätt svar är procent, och vid fel faller värdena, staplarna växer och tabellen visas', () => {
  const t = atGrade('e', 0);
  until(t, p => p.eq === 'glesare');
  assert.equal(t.$('#q .prompt').textContent.trim(), 'Varför ligger värdena glesare högre upp?');
  assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), 'Toleransen är i procent, så stora värden täcker fler ohm');
  assert.equal(t.$$('#q svg.elin .lbar').length, 0, 'inga staplar före svaret');
  assert.ok(t.$('#q .e6note'));
  answer(t, false);
  assert.equal(t.$$('#q svg.elin .lbar').length, 6);
  assert.ok(t.$('#q svg.elin .lcover'));
  assert.match(t.$('#q .eptab').textContent, /68 Ω ±13,6 Ω/);
  assert.ok(t.g('S.cq.anim.total') >= t.g('linEnd(6)'));
});

test('E6-raden syns inte på Gesäll, och inte på Eldprovet', () => {
  const t = atGrade('e', 2);
  for (let i = 0; i < 10; i++) { t.g('next()'); assert.equal(t.$('#q .e6note'), null); }
  const u = load({ storage: ALL_OPEN });
  u.g("openTopic('ultra'); beginExam(); GRADES.e[4] = eGlesare; S.exam.queue[S.exam.i] = {topic: 'e'}; next()");
  assert.equal(u.$('#q .e6note'), null);
});
test('Ordna med värden: lapparna visar text, fel flyger som text, och rätt fyller lådorna i ordning', () => {
  const t = atGrade('e', 0);
  t.g(`ORDER_SETS.test = {keys: ['a','b','c'], init: () => ({v: 'x'}), chip: (k, o) => k.toUpperCase() + o.v,
    prompt: o => 'Testa ' + o.v, wrong: 'fel', anim: () => ({total: 1.5}), after: () => '<p class="tafter">efter</p>',
    layout: o => '<div class="tlay">' + o.keys.map(k => '<i class="obox' + (o.placed[k] ? ' ok' : '') + '" data-oslot="' + k + '">' + (o.placed[k] ? oswHTML(k) : '') + '</i>').join('') + '</div>'};
    GRADES.e[0] = orderPlan('test'); next()`);
  assert.equal(t.g('S.type'), 'order');
  assert.equal(t.$('#q .prompt').textContent.trim(), 'Testa x');
  assert.ok(t.$('#q .tlay'));
  assert.deepEqual(t.$$('#q [data-ord]').map(b => b.textContent.trim()).sort(), ['Ax', 'Bx', 'Cx']);
  assert.equal(t.$('#q [data-ord="a"]').getAttribute('aria-label'), 'Ax');
  t.$('#q [data-ord="b"]').click();
  assert.equal(t.g('S.ord.missed'), true);
  for (const k of ['a', 'b', 'c']) t.$(`#q [data-ord="${k}"]`).click();
  // Ett fel ger ett sista försök
  assert.equal(t.g('S.ord.round'), 2);
  t.$('#q [data-ord="c"]').click();
  for (const k of ['a', 'b', 'c']) t.$(`#q [data-ord="${k}"]`).click();
  assert.equal(t.g('S.answered'), true);
  assert.equal(t.g('S.ok'), false);
  assert.ok(t.$('#q .tafter'), 'felanimeringen');
  assert.match(t.$('#q .obox[data-oslot="a"]').textContent, /Ax/);
});

test('Ordna med färger fungerar som förut: färgrutor, inga textlappar', () => {
  const t = atGrade('ohm', 1);
  until(t, p => p.type === 'order');
  const chip = t.$('#q [data-ord]');
  assert.equal(chip.textContent.trim(), '');
  assert.match(chip.getAttribute('style'), /background/);
});
