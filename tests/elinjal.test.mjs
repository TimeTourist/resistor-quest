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
  assert.equal(t.$('#q .e6note'), null, 'E6-raden bara på Vad är E6?');
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
// Placerar alla värden. Fel: ett fel tryck först i varje omgång, så att också det sista försöket blir fel.
const placeAll = (t, ok) => {
  for (let r = 0; r < 2 && !t.g('S.answered'); r++) {
    if (!ok) t.$(`#q [data-ord="${t.g('S.ord.keys[1]')}"]`).click();
    for (const k of t.g('S.ord.keys.slice()')) t.$(`#q [data-ord="${k}"]`).click();
  }
};

test('Placera på skalan: logaritmiska platser på nästan lika avstånd och tre varianter', () => {
  const t = atGrade('e', 0), vs = new Set();
  for (let i = 0; i < 30; i++) {
    until(t, p => p.type === 'order' && t.g("S.ord.set") === 'e6log');
    vs.add(t.g('S.ord.v'));
  }
  assert.deepEqual([...vs].sort(), ['1', '10', 'k']);
  const left = k => parseFloat(t.$(`#q .escale [data-oslot="${k}"]`).style.left);
  const xs = t.g('S.ord.keys.slice()').map(left), steps = xs.slice(1).map((x, i) => x - xs[i]);
  const avg = steps.reduce((a, b) => a + b) / steps.length;
  steps.forEach(s => assert.ok(Math.abs(s - avg) / avg < .15, 'lika avstånd'));
  assert.ok(t.$('#q .escale.log'));
  assert.equal(t.$('#q .e6note'), null, 'E6-raden bara på Vad är E6?');
  assert.match(t.$('#q .escale').textContent, /logaritmisk skala/);
});

test('Placera på skalan: lapparna har värden med enhet, och vid fel tänds bågarna ×1,5', () => {
  const t = atGrade('e', 0);
  until(t, p => p.type === 'order' && t.g("S.ord.set") === 'e6log');
  t.g("S.ord.v = '10'; render()");
  assert.deepEqual(t.$$('#q [data-ord]').map(b => b.textContent.trim()).sort(), ['10 Ω','15 Ω','22 Ω','33 Ω','47 Ω','68 Ω'].sort());
  placeAll(t, false);
  assert.equal(t.g('S.ok'), false);
  assert.equal(t.$$('#q .earc').length, 6);
  assert.match(t.$('#q .after').textContent, /×1,5/);
});

test('Placera: lapparna är små motstånd med rätt färgband och värdet under', () => {
  const t = atGrade('e', 0);
  until(t, p => p.type === 'order' && t.g("S.ord.set") === 'e6log');
  t.g("S.ord.v = 'k'; render()");
  assert.deepEqual(JSON.parse(t.g("JSON.stringify(e6Bands('1.5', 'k'))")), ['brown', 'green', 'red']);
  assert.deepEqual(JSON.parse(t.g("JSON.stringify(e6Bands('1.0', '1'))")), ['brown', 'black', 'gold']);
  assert.deepEqual(JSON.parse(t.g("JSON.stringify(e6Bands('6.8', '10'))")), ['blue', 'grey', 'black']);
  const chip = t.$('#q [data-ord="1.5"]');
  assert.ok(chip.querySelector('svg'), 'ett motstånd');
  assert.equal(chip.getAttribute('aria-label'), '1,5 kΩ');
  assert.match(chip.textContent, /1,5 kΩ/);
});
test('Placera i lådorna: rak skala från 0, avstånden växer, varannan låda högre upp, och vid fel sex staplar', () => {
  const t = atGrade('e', 0);
  until(t, p => p.type === 'order' && t.g("S.ord.set") === 'e6lin');
  assert.ok(t.$('#q .escale.lin'));
  const keys = t.g('S.ord.keys.slice()'), left = k => parseFloat(t.$(`#q [data-oslot="${k}"]`).style.left);
  const steps = keys.slice(1).map((k, i) => left(k) - left(keys[i]));
  steps.slice(1).forEach((s, i) => assert.ok(s > steps[i] - .01, 'avstånden växer'));
  keys.forEach((k, i) => assert.ok(t.$(`#q [data-oslot="${k}"]`).classList.contains('r' + (i % 3)), 'tre rader'));
  assert.match(t.$('#q .escale').textContent, /rak skala/);
  assert.equal(t.$('#q .e6note'), null, 'E6-raden bara på Vad är E6?');
  placeAll(t, false);
  assert.equal(t.$$('#q .ebarl').length, 6);
});

test('Nykomling blandar alla fyra frågorna', () => {
  const t = atGrade('e', 0), seen = new Set();
  for (let i = 0; i < 120; i++) { t.g('next()'); seen.add(t.g('S.plan.eq') || t.g('S.ord.set')); }
  assert.deepEqual([...seen].sort(), ['e6lin', 'e6log', 'glesare', 'vad']);
});
test('Vilken serie hör till motståndet?: bandet inringat före svaret, färgen under, och trappan med motstånd vid fel', () => {
  const t = atGrade('e', 1);
  until(t, p => p.eq === 'bandring');
  const r = JSON.parse(t.g('JSON.stringify(S.cq.r)'));
  assert.equal(t.$$('#q .res .ring').length, 1, 'inringat före svaret');
  assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), t.g(`serOfBands(${JSON.stringify(r.bands)})`));
  assert.ok(t.$('#q .etol'));
  answer(t, false);
  assert.equal(t.$$('#q .estep .emini').length, 6, 'sex små motstånd');
  assert.equal(t.$$('#q .estep.hl').length, 1);
});

test('Lärling: staplarna, motståndet med bandet och räcker', () => {
  const t = atGrade('e', 1), seen = new Set();
  for (let i = 0; i < 90; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['bandring', 'racker', 'staplar']);
});

test('Stormästare: motståndet med bandet, räcker och Mästares tre, ingen serie ↔ tolerans som text', () => {
  const t = atGrade('e', 4), seen = new Set();
  for (let i = 0; i < 200; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['band', 'bandring', 'multi', 'racker', 'sakert']);
});

test('Klockan och den logaritmiska linjalen är borta', () => {
  const t = load();
  for (const f of ['dialSVG', 'rollNow', 'rulerSVG', 'eSerieTol']) assert.equal(t.g(`typeof ${f}`), 'undefined', f);
});

// Rättningar efter slutgranskningen
test('Staplarfrågan: texten om för stor tolerans stämmer, det gemensamma värdet ligger inom båda staplarna', () => {
  const t = load();
  for (const n of [6, 12, 24]) {
    t.g(`S.cq = {tols: ETOL_Q[${n}]}; S.pickC = 0`);
    const d = frag(t, `etolRows(${n}, ETOL_Q[${n}])`), txt = d.querySelector('.etrow p').textContent;
    const m = txt.match(/(\d+) Ω och (\d+) Ω kan båda bli ([\d,]+) Ω/);
    assert.ok(m, txt);
    const [a, b, c] = [+m[1], +m[2], +m[3].replace(',', '.')], big = t.g(`ETOL_Q[${n}][0]`) / 100;
    assert.ok(c >= a * (1 - big) && c <= a * (1 + big) && c >= b * (1 - big) && c <= b * (1 + big), txt);
  }
});

test('Trappans motstånd har värden som finns i sin serie', () => {
  const t = load();
  for (const s of ['E6','E12','E24','E48','E96','E192']) {
    const b = JSON.parse(t.g(`JSON.stringify(MINI['${s}'])`)), k = b.length === 4 ? 2 : 3;
    const d = +b.slice(0, k).map(c => t.g(`C.${c}.d`)).join('');
    const list = JSON.parse(t.g(`JSON.stringify(ESER['${s === 'E192' ? 'E96' : s}'][0])`));
    assert.ok(list.includes(d), `${s}: ${d}`);
  }
});

test('Staplarfrågan har inte E6-raden, den står bara på Vad är E6?', () => {
  const t = atGrade('e', 1);
  for (let i = 0; i < 30; i++) {
    until(t, p => p.eq === 'staplar');
    const n = +t.$('#q .prompt').textContent.match(/E(\d+)/)[1];
    assert.equal(t.$('#q .e6note'), null, 'E6-raden bara på Vad är E6?');
  }
});

test('Placera på skalan: vid fel står → 100, nästa varv efter bågarna', () => {
  const t = atGrade('e', 0);
  until(t, p => p.type === 'order' && t.g("S.ord.set") === 'e6log');
  t.g("S.ord.v = '10'; render()");
  placeAll(t, false);
  assert.match(t.$('#q .after').textContent, /→ 100, nästa varv/);
});

test('Lådorna på skalorna krockar inte med knappsatsens klass, och står i tre rader på den raka skalan', () => {
  const t = atGrade('e', 0);
  until(t, p => p.type === 'order' && t.g("S.ord.set") === 'e6lin');
  assert.equal(t.$$('#q .escale .ebox').length, 0);
  const keys = t.g('S.ord.keys.slice()');
  keys.forEach((k, i) => assert.ok(t.$(`#q [data-oslot="${k}"]`).classList.contains('eslot') && t.$(`#q [data-oslot="${k}"]`).classList.contains('r' + (i % 3))));
});

test('Staplarfrågans förklaring: inzoomad linjal med tre grannvärden, samma skala i alla tre raderna', () => {
  const t = load();
  for (const [n, vals] of [[6, ['22','33','47']], [12, ['27','33','39']], [24, ['30','33','36']]]) {
    t.g(`S.cq = {tols: ETOL_Q[${n}]}; S.pickC = 1`);
    const d = frag(t, `etolRows(${n}, ETOL_Q[${n}])`), rows = [...d.querySelectorAll('.etrow')];
    assert.equal(rows.length, 3);
    rows.forEach(r => assert.deepEqual([...r.querySelectorAll('.lval text')].map(e => e.textContent), vals, `E${n}`));
    const xs = rows.map(r => [...r.querySelectorAll('.lval circle')].map(c => c.getAttribute('cx')).join());
    assert.equal(new Set(xs).size, 1, 'samma skala');
    assert.ok(rows[0].querySelector('.ecrash'), 'för stor krockar');
    assert.equal(rows[1].querySelectorAll('.ecrash, .egap').length, 0, 'rätt är ren');
    assert.ok(rows[2].querySelector('.egap'), 'för liten glappar');
    assert.match(rows[0].textContent, new RegExp(`${vals[0]} Ω och ${vals[1]} Ω kan båda bli`));
  }
});

test('Vilken serie räcker?: ett motstånd med kravets toleransband inringat visas ovanför svaren', () => {
  const t = atGrade('e', 1), seen = new Set();
  for (let i = 0; i < 60; i++) {
    until(t, p => p.eq === 'racker');
    const need = +t.$('#q .prompt').textContent.match(/avvika högst ±(\d+)/)[1];
    const b = JSON.parse(t.g('JSON.stringify(S.cq.bands)'));
    assert.ok(t.$('#q .res svg'), 'ett motstånd');
    assert.equal(t.$$('#q .res .ring').length, 1, 'toleransbandet inringat');
    if (need === 20) assert.equal(b[b.length - 1], null, 'inget band för ±20 %');
    else assert.equal(t.g(`C.${b[b.length - 1]}.t`), need);
    seen.add(need);
  }
  assert.equal(seen.size, 5);
});

test('Staplarfrågan: före svaret visar linjalen den rätta toleransens staplar, utan siffror', () => {
  const t = atGrade('e', 1);
  for (let i = 0; i < 20; i++) {
    until(t, p => p.eq === 'staplar');
    const n = +t.$('#q .prompt').textContent.match(/E(\d+)/)[1], svg = t.$('#q .res svg.elin');
    assert.ok(svg);
    assert.equal(svg.querySelectorAll('.lbar').length, n, 'en stapel per värde');
    assert.equal(svg.querySelectorAll('.ecrash, .egap').length, 0, 'den rätta toleransen: kant i kant');
    assert.equal(svg.querySelectorAll('text').length, 0, 'inga siffror');
  }
});
