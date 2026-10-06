import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, atGrade, ALL_OPEN, golden } from './harness.mjs';
import { answer, until, tap, cont, kick, dare } from './answer.mjs';

const TOPICS = ['body', 'ohm', 'tol', 'tc', 'e'];
const st = (t, topic) => JSON.parse(t.g(`JSON.stringify({g: S.grade['${topic}'], done: S.done['${topic}']})`));

test('Stegen: 3 rätt i rad upp, 3 fel i rad ner, golv och tak', () => {
  const t = load();
  const L = (s, ok) => t.g(`ladder(${JSON.stringify(s)}, ${ok})`);
  let s = {g: 0, up: 2, down: 0, done: 0};
  s = L(s, true);
  assert.deepEqual([s.g, s.up, s.done, s.moved], [1, 0, 1, 'up']);
  s = L({g: 2, up: 0, down: 2, done: 3}, false);
  assert.deepEqual([s.g, s.down, s.done, s.moved], [1, 0, 3, 'down']);
  // Golv
  s = L({g: 0, up: 0, down: 2, done: 0}, false);
  assert.equal(s.g, 0);
  // Ett rätt nollställer felräkningen och tvärtom
  s = L({g: 1, up: 2, down: 0, done: 1}, false);
  assert.deepEqual([s.up, s.down], [0, 1]);
  s = L({g: 1, up: 0, down: 2, done: 1}, true);
  assert.deepEqual([s.up, s.down], [1, 0]);
  // Tak: 3 rätt på Stormästare ger klart, man stannar på Stormästare
  s = L({g: 4, up: 2, down: 0, done: 4}, true);
  assert.deepEqual([s.g, s.done], [4, 5]);
  // Klarade grader minskar aldrig
  s = L({g: 3, up: 0, down: 2, done: 4}, false);
  assert.deepEqual([s.g, s.done], [2, 4]);
});

test('Upplåsning: Mästare nådd öppnar nästa ämne, Stormästare klar ger ✓', () => {
  const t = load();
  assert.equal(t.g("unlocked('body')"), true);
  assert.equal(t.g("unlocked('ohm')"), false);
  assert.equal(t.g("unlocked('ultra')"), true);
  t.g("S.done.body = 2"); assert.equal(t.g("unlocked('ohm')"), false);
  t.g("S.done.body = 3"); assert.equal(t.g("unlocked('ohm')"), true);
  assert.equal(t.g("cleared('body')"), false);
  t.g("S.done.body = 5"); assert.equal(t.g("cleared('body')"), true);
});

test('Spela: 3 rätt höjer graden och statusraden säger det', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body' } });
  kick(t);
  for (let i = 0; i < 3; i++) { answer(t, true); if (i < 2) cont(t); }
  assert.deepEqual(st(t, 'body'), {g: 1, done: 1});
  assert.match(t.$('#score').textContent, /Upp till Lärling/);
});

test('Från Gesäll till Mästare låser upp nästa ämne och visar dess kort', () => {
  const t = load({ storage: { 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  kick(t);
  for (let i = 0; i < 3; i++) { answer(t, true); cont(t); }
  assert.equal(t.g("unlocked('ohm')"), true);
  assert.equal(t.g('S.view'), 'ohm');
  assert.match(t.$('#q').textContent, /Resistansen/);
});

test('Sparad progress: gamla nycklar läses inte', () => {
  const t = load({ storage: { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5, medium: 5, tc: 5, hard: 5 }), 'fargkoden-level': 'hard' } });
  assert.equal(t.g('S.topic'), 'body');
  assert.equal(t.g("unlocked('ohm')"), false);
  // Första besöket visar Motståndets kort
  assert.equal(t.g('S.view'), 'body');
});

test('Progress sparas under fargkoden2-', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body' } });
  kick(t);
  for (let i = 0; i < 3; i++) { answer(t, true); cont(t); }
  assert.equal(JSON.parse(t.w.localStorage.getItem('fargkoden2-done')).body, 1);
  assert.equal(JSON.parse(t.w.localStorage.getItem('fargkoden2-grade')).body, 1);
});

for (const topic of TOPICS) {
  test(`${topic}: Nykomling är Vilken ska bort?, rätt poppar kortet och tre blir gröna`, () => {
    const t = atGrade(topic, 0);
    for (let i = 0; i < 20; i++) {
      t.g(`S.grade['${topic}'] = 0; S.up = 0; next()`);
      assert.match(t.$('#q').textContent, /Vilken ska bort\?/);
      assert.equal(t.$$('[data-c]').length, 4);
      const right = t.g('S.cq.right');
      answer(t, true);
      assert.ok(t.$(`[data-c="${right}"]`).classList.contains('gone'));
      assert.equal(t.$$('#q .opt.ok').length, 3);
      assert.equal(t.$$('#q .opt.bad').length, 0);
    }
  });
  test(`${topic}: Vilken ska bort? fel: ditt kort grönt med röd ram, det udda poppar`, () => {
    const t = atGrade(topic, 0);
    for (let i = 0; i < 20; i++) {
      t.g('next()');
      const right = t.g('S.cq.right');
      answer(t, false);
      const picked = t.g('S.pickC');
      assert.ok(t.$(`[data-c="${right}"]`).classList.contains('gone'));
      assert.ok(t.$(`[data-c="${picked}"]`).classList.contains('picked'));
      assert.ok(t.$(`[data-c="${picked}"]`).classList.contains('ok'));
      assert.equal(t.$$('#q .opt.ok').length, 3);
      assert.equal(t.$$('#q .opt.bad').length, 0);
      assert.ok(t.$('#q [role="status"]'), 'regeln finns, synlig eller för skärmläsare');
    }
  });
}

test('Det rätta svaret får aldrig klassen bad', () => {
  for (const topic of TOPICS) for (let g = 0; g < 4; g++) {
    const t = atGrade(topic, g);
    for (let i = 0; i < 10; i++) {
      t.g('next()');
      if (t.g('S.type') !== 'choice') continue;
      const right = t.g('S.cq.right');
      answer(t, i % 2 === 0);
      assert.ok(!t.$(`[data-c="${right}"]`).classList.contains('bad'), `${topic} ${g}`);
    }
  }
});

test('Motståndet Lärling: den felaktiga färgen är aldrig en riktig färg och aldrig rosa', () => {
  const t = atGrade('body', 1);
  const real = new Set(t.g("Object.keys(C).filter(k => !FAKE.includes(k))"));
  for (let i = 0; i < 60; i++) {
    t.g('next()');
    const fake = t.g('S.cq.fake');
    assert.ok(!real.has(fake), fake);
    assert.notEqual(fake, 'pink');
  }
});

test('Motståndet Nykomling: det udda har 2, 7 eller 8 band', () => {
  const t = atGrade('body', 0);
  for (let i = 0; i < 40; i++) {
    t.g('next()');
    const ns = t.g('S.cq.ns');
    const odd = ns[t.g('S.cq.right')];
    assert.ok([2, 7, 8].includes(odd), String(odd));
    ns.filter((_, j) => j !== t.g('S.cq.right')).forEach(n => assert.ok([4, 5, 6].includes(n)));
  }
});

test('Peka på band: Motståndets Stormästare frågar efter första bandet, även när motståndet sitter vänt', () => {
  const t = atGrade('body', 4);
  let flipped = 0;
  for (let i = 0; i < 40; i++) {
    t.g('S.grade.body = 4; S.up = 0; S.done.body = 4; next()');
    assert.equal(t.g('S.type'), 'point');
    if (t.g('S.style.flip')) flipped++;
    assert.equal(t.g('S.pointRole'), 'first');
    assert.equal(t.g('S.pointAt'), 0);
    assert.match(t.$('#q .prompt').textContent, /första bandet/);
    answer(t, true);
    assert.equal(t.g('S.ok'), true);
  }
  assert.ok(flipped > 0, 'inget vänt motstånd');
  t.g('next()'); answer(t, false); assert.equal(t.g('S.ok'), false);
});

test('Text: rätt svar ger ingen text, fel svar ger exakt en rad', () => {
  for (const [topic, g] of [['tol', 3], ['e', 2]]) {
    const t = atGrade(topic, g);
    t.g('next()'); answer(t, true);
    assert.equal(t.$$('#q .lesson').length, 0, `${topic} ${g} rätt`);
    t.g('next()'); answer(t, false);
    assert.equal(t.$$('#q .lesson').length, 1, `${topic} ${g} fel`);
  }
});

test('Resistansen: klammern, fyra band till och med Mästare, fem band på Stormästare', () => {
  const t0 = atGrade('ohm', 0);
  for (let i = 0; i < 30; i++) {
    t0.g('next()');
    const br = t0.g('S.cq.brackets'), right = t0.g('S.cq.right');
    br.forEach(([n, to], j) => {
      const k = n === 4 ? 2 : 3;
      if (j === right) assert.notEqual(to, k); else assert.equal(to, k);
    });
  }
  for (const g of [2, 3]) {
    const t = atGrade('ohm', g), ns = new Set();
    for (let i = 0; i < 40; i++) {
      t.g(`S.grade.ohm = ${g}; next()`);
      ns.add(t.g('S.n'));
      assert.ok(t.$('#q .res .bracket'), `grad ${g} har klammer`);
      if (g === 3) assert.ok(!['gold', 'silver'].includes(t.g('S.q[nd(S.q)]')));
    }
    assert.deepEqual([...ns].sort(), [4, 5, 6], `grad ${g} har 4, 5 och 6 band`);
  }
  const t2 = atGrade('ohm', 2);
  const roles = new Set();
  for (let i = 0; i < 60; i++) {
    t2.g('S.grade.ohm = 2; next()');
    roles.add(t2.g('S.pointRole'));
    const k = t2.g('nd(S.q)');
    const labs = t2.$$('#q .res .blab').map(e => e.textContent);
    const want = [...Array(k).keys()].map(j => t2.g(`String(C[S.q[${j}]].d)`)).concat([t2.g('multPlain(C[S.q[nd(S.q)]].m)')]);
    assert.deepEqual(labs, want, 'värdena står under banden');
    assert.equal(t2.g('S.pointAt'), {d1: 0, d2: 1, d3: 2, mult: k}[t2.g('S.pointRole')]);
    if (k === 2) assert.notEqual(t2.g('S.pointRole'), 'd3');
    assert.match(t2.$('#q .prompt').textContent, /^Peka på (första|andra|tredje) siffran\.$|^Peka på multiplikatorn\.$/);
  }
  assert.deepEqual([...roles].sort(), ['d1', 'd2', 'd3', 'mult']);
  const t4 = atGrade('ohm', 4);
  for (let i = 0; i < 20; i++) { t4.g('next()'); assert.equal(t4.g('S.n'), 5); assert.equal(t4.$('#q .res .bracket'), null); }
});

test('Rätt svar: nästa fråga kommer av sig själv, fel svar väntar på Nästa', async () => {
  const t = atGrade('tol', 3, {}, );
  t.g('S.instant = false');
  t.g('next()');
  const before = t.g('S.cq.prompt + S.cq.right');
  answer(t, true);
  assert.equal(t.g('S.busy'), true, 'spänningsfasen låser');
  // Klick under spänningen gör inget annat svar
  t.$$('[data-c]')[0].click();
  assert.equal(t.g('S.answered'), true);
  await new Promise(r => setTimeout(r, 2600));
  assert.equal(t.g('S.answered'), false, 'ny fråga');
  t.g('next()');
  answer(t, false);
  await new Promise(r => setTimeout(r, 2600));
  assert.equal(t.g('S.answered'), true, 'väntar på Nästa');
  assert.equal(t.$$('#q .lesson').length, 1);
});

test('Hoppa över: Enter under spänningen visar utfallet direkt', () => {
  const t = atGrade('tol', 3);
  t.g('S.instant = false');
  t.g('next()');
  answer(t, false);
  assert.equal(t.g('S.busy'), true);
  t.doc.body.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(t.g('S.busy'), false);
  assert.equal(t.$$('#q .lesson').length, 1);
  t.g('clearTimeout(S.timer)');
});

test('Ljud: knappen sparar läget, och med ljudet av spelas inget', () => {
  let made = 0;
  class FakeAC {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = {}; }
    resume() {}
    createOscillator() { made++; return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect: x => x, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect: x => x }; }
    createBiquadFilter() { return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { value: 0 }, connect: x => x }; }
    createBuffer() { return { getChannelData: () => new Float32Array(10) }; }
    createBufferSource() { return { connect: x => x, start() {}, stop() {} }; }
  }
  const t = load({ storage: { ...ALL_OPEN, 'fargkoden2-topic': 'body' }, audio: FakeAC });
  t.g('next()'); answer(t, true);
  assert.ok(made > 0, 'ljud spelas');
  const btn = t.$('#soundBtn');
  assert.equal(btn.getAttribute('aria-pressed'), 'true');
  btn.click();
  assert.equal(btn.getAttribute('aria-pressed'), 'false');
  assert.equal(t.w.localStorage.getItem('fargkoden2-sound'), 'off');
  made = 0;
  t.g('next()'); answer(t, false);
  assert.equal(made, 0, 'inget ljud när det är av');
});

test('Eldprovet: nästa fråga kommer av sig själv även vid fel', async () => {
  const t = load({ storage: ALL_OPEN });
  t.g("goTopic('ultra')"); dare(t);
  t.g('S.instant = false');
  answer(t, false);
  await new Promise(r => setTimeout(r, 2600));
  assert.equal(t.g('S.exam.i'), 1);
  assert.equal(t.g('S.answered'), false);
  t.g('clearTimeout(S.timer)');
});

test('Ingen Nästa-knapp: efter fel svar fortsätter man med ett tryck på kortet eller fingret', () => {
  const t = atGrade('ohm', 1);
  t.g('next()');
  assert.equal(t.$('#main'), null);
  answer(t, false);
  assert.equal(t.$('#main'), null);
  assert.ok(t.$('#cont.tapcue'), 'fingret finns');
  t.$('#q .prompt').dispatchEvent(new t.w.MouseEvent('click', { bubbles: true }));
  assert.equal(t.g('S.answered'), false, 'ny fråga');
  t.g('next()'); answer(t, false);
  t.$('#cont').click();
  assert.equal(t.g('S.answered'), false, 'fingret fortsätter också');
});

test('Efter fel går det att trycka på svarsknapparna och bilden för att gå vidare', () => {
  for (const [topic, g, sel] of [['body', 0, '[data-c]'], ['ohm', 3, '[data-c]'], ['ohm', 4, '[data-slot],[data-field]'], ['body', 3, '[data-dir]'], ['e', 3, '[data-sr]']]) {
    const t = atGrade(topic, g);
    let n = 0;
    for (let i = 0; i < 40 && n < 3; i++) {
      t.g(`S.grade['${topic}'] = ${g}; next()`);
      if (!t.$(sel)) continue;
      answer(t, false);
      const btn = t.$$(sel).find(b => !b.classList.contains('gone'));
      btn.click();
      assert.equal(t.g('S.answered'), false, `${topic} ${g}: tryck på ${sel} fortsätter`);
      n++;
    }
    assert.ok(n > 0, `${topic} ${g} testades`);
  }
});

test('Läsriktning fel: ingen vändning, banden räknas från rätt ände, toleransen och ledtråden visas', () => {
  const t = atGrade('body', 3);
  let flipped = 0;
  for (let i = 0; i < 30; i++) {
    t.g('S.grade.body = 3; next()');
    const flip = t.g('S.style.flip'), n = t.g('S.n'), k = t.g('nd(S.q)');
    if (flip) flipped++;
    answer(t, false);
    assert.equal(t.$('#q .res.turn'), null, 'ingen vändning');
    const marks = t.$$('#q .res .mk.ok');
    assert.equal(marks.length, n);
    const x = lab => +marks.find(m => m.querySelector('text').textContent === lab).querySelector('text').getAttribute('x');
    assert.equal(x('1') < x('2'), !flip, 'räknar från början, i läsriktningen');
    assert.deepEqual(marks.map(m => m.querySelector('text').textContent).sort((a, b) => a - b), Array.from({length: n}, (_, j) => String(j + 1)), 'bara siffror');
    assert.match(t.$('#q .res').textContent, /mellanrum|brett|samlade/, 'ledtråden visas');
    assert.equal(t.$$('#q .lesson').length, 0, 'ingen synlig rad');
    t.g('S.lockUntil = 0'); 
  }
  assert.ok(flipped > 0);
});

test('Resistansens Gesäll: etiketterna under banden har plats och går inte i varandra', () => {
  const t = atGrade('ohm', 2);
  for (let i = 0; i < 30; i++) {
    t.g('S.grade.ohm = 2; next()');
    const xs = t.$$('#q .res .blab').map(e => +e.getAttribute('x'));
    if (!xs.length) continue;
    for (let j = 1; j < xs.length; j++) assert.ok(Math.abs(xs[j] - xs[j - 1]) >= 38, `avstånd ${xs[j] - xs[j - 1]}`);
  }
});

test('Motståndet Lärling fel: de 12 färgerna läggs ut, den falska får ✗ och poppar, de andra får ✓', () => {
  const t = atGrade('body', 1);
  for (let i = 0; i < 15; i++) {
    t.g('S.grade.body = 1; next()');
    const right = t.g('S.cq.right'), fake = t.g('S.cq.fake'), name = t.g(`C['${fake}'].n`);
    answer(t, false);
    const odd = t.$(`[data-c="${right}"]`);
    assert.ok(odd.classList.contains('gone'));
    assert.match(odd.querySelector('.badge.bad').textContent, new RegExp(`${name}.*✗`));
    t.$$('[data-c]').filter(b => b !== odd).forEach(b => assert.match(b.querySelector('.badge.ok').textContent, /✓/));
    const strip = t.$('#q .palstrip');
    assert.equal(strip.querySelectorAll('.real').length, 12, 'de tolv riktiga färgerna');
    assert.ok(strip.querySelector('.fake'), 'den falska färgen läggs bredvid');
    assert.equal(t.$$('#q .lesson').length, 0);
    assert.ok(t.g('qAnim().total') >= 3);
  }
});

test('Motståndet Gesäll fel: banden räknas i grönt och rätt svar studsar', () => {
  const t = atGrade('body', 2);
  for (let i = 0; i < 10; i++) {
    t.g('S.grade.body = 2; next()');
    const n = t.g('S.n'), right = t.g('S.cq.right');
    answer(t, false);
    assert.equal(t.$$('#q .res .mk.ok').length, n);
    assert.ok(t.$(`[data-c="${right}"]`).classList.contains('land'));
    assert.equal(t.$$('#q .lesson').length, 0);
    assert.ok(t.g('qAnim().total') >= 2);
  }
});

test('Motståndet Stormästare fel: pilen glider in och första bandet får grön ring', () => {
  const t = atGrade('body', 4);
  for (let i = 0; i < 10; i++) {
    t.g('S.grade.body = 4; next()');
    answer(t, false);
    assert.ok(t.$('#q .res .sweep'), 'pilen');
    assert.ok(t.$('#q .res .ring.ok.mk'), 'grön ring som kommer efter pilen');
    assert.ok(t.$('#q .res .ring.bad'), 'röd ring på valet');
    assert.match(t.$('#q .res').textContent, /mellanrum|brett|samlade/);
    assert.doesNotMatch(t.$('#q .res').textContent, /±/);
    assert.equal(t.$$('#q .lesson').length, 0);
  }
});

test('Resistansen Nykomling fel: grön klammer tonar in över rätt band, kortet poppar, de andra får ✓', () => {
  const t = atGrade('ohm', 0);
  for (let i = 0; i < 10; i++) {
    t.g('S.grade.ohm = 0; next()');
    const right = t.g('S.cq.right');
    answer(t, false);
    const odd = t.$(`[data-c="${right}"]`);
    assert.ok(odd.querySelector('.bracket.bad'));
    assert.ok(odd.querySelector('.bracket.ok.mk'), 'den gröna klammern kommer efter');
    assert.ok(odd.querySelector('.badge.bad'));
    t.$$('[data-c]').filter(b => b !== odd).forEach(b => assert.ok(b.querySelector('.badge.ok')));
    assert.equal(t.$$('#q .lesson').length, 0);
  }
});

test('Resistansen Lärling fel: markeringen vandrar längs färgskalan och landar på rätt siffra', () => {
  const t = atGrade('ohm', 1);
  for (let i = 0; i < 12; i++) {
    t.g('S.grade.ohm = 1; next()');
    answer(t, false);
    const cells = t.$$('#q .scale span');
    const land = cells.findIndex(c => c.classList.contains('land'));
    assert.ok(land >= 0, 'landar');
    assert.equal(t.$$('#q .scale .walk').length, land, 'vandrar över alla före');
    assert.equal(t.$$('#q .lesson').length, 0);
  }
});

test('Stapeln: planen för rätt, fel, upp och ner', () => {
  const t = atGrade('ohm', 2);
  const plan = () => JSON.parse(t.g('JSON.stringify(S.barPlan)'));
  t.g('S.grade.ohm = 2; S.up = 0; S.down = 0; next()'); answer(t, true);
  let p = plan();
  assert.deepEqual([p.ok, p.from.up, p.to.up, p.to.down], [true, 0, 1, 0]);
  t.g('S.grade.ohm = 2; S.up = 0; S.down = 1; next()'); answer(t, false);
  p = plan();
  assert.deepEqual([p.ok, p.from.down, p.to.down, p.moved], [false, 1, 2, null]);
  t.g('S.grade.ohm = 2; S.up = 0; S.down = 2; next()'); answer(t, false);
  p = plan();
  assert.deepEqual([p.moved, p.from.g, p.to.g], ['down', 2, 1]);
  t.g('S.grade.ohm = 2; S.up = 2; S.down = 0; next()'); answer(t, true);
  p = plan();
  assert.deepEqual([p.moved, p.from.up, p.to.g, p.to.up], ['up', 2, 3, 0]);
});

test('Stapeln visas i slutet av svaret, med fack och sprickor, och glider bort', async () => {
  const t = atGrade('ohm', 3);
  t.g('S.instant = false; S.grade.ohm = 3; S.up = 1; S.down = 0; next()');
  answer(t, true); t.g('reveal()');
  await new Promise(r => setTimeout(r, 1000));
  const bar = t.$('#gbar');
  assert.ok(bar.classList.contains('show'), 'stapeln syns');
  assert.match(bar.textContent, /Resistansen/);
  assert.equal(bar.querySelectorAll('.gseg').length, 5, 'hela skalan, fem grader');
  assert.equal(bar.querySelectorAll('.gseg.cur i.on').length, 2, 'två rätt i rad på aktuell grad');
  assert.equal(bar.querySelectorAll('.gseg.cur')[0], bar.querySelectorAll('.gseg')[3], 'Mästare är aktuell');
  assert.equal(bar.querySelectorAll('.gseg')[2].querySelectorAll('i.full').length, 3, 'Gesäll är klar, mörkgrön');
  await new Promise(r => setTimeout(r, 1500));
  assert.equal(t.g('S.answered'), false, 'nästa fråga');
  assert.ok(!t.$('#gbar').classList.contains('show'), 'stapeln har glidit bort');
  // Fel: en spricka, och man måste vänta in stapeln
  t.g('S.grade.ohm = 3; S.up = 0; S.down = 0; next()');
  answer(t, false); t.g('reveal()');
  const lock = t.g('S.lockUntil - S.revealAt');
  assert.ok(lock >= 1200, `låst i ${lock} ms`);
  await new Promise(r => setTimeout(r, lock - 200));
  assert.equal(t.$('#gbar').querySelectorAll('.gseg')[2].querySelectorAll('i.bad').length, 1, 'ett rött fack på graden under');
  assert.ok(t.$('#gbar').querySelectorAll('.gseg')[2].querySelectorAll('i')[2].classList.contains('bad'), 'rött från höger');
  assert.equal(t.$('#gbar').querySelectorAll('.gseg.cur i.bad').length, 0, 'aktuell grad har inga röda');
  // Vid fel ligger stapeln kvar tills man trycker
  await new Promise(r => setTimeout(r, 900));
  assert.ok(t.$('#gbar').classList.contains('show'), 'stapeln ligger kvar efter fel');
  t.g('S.lockUntil = 0'); cont(t);
  assert.ok(!t.$('#gbar').classList.contains('show'), 'trycket tar bort stapeln');
  t.g('stopTimer(); clearBar()');
});

test('Stapeln: tredje rätt mörknar facken under skakningen', async () => {
  const t = atGrade('ohm', 2);
  t.g('S.instant = false; S.grade.ohm = 2; S.up = 2; S.down = 0; next()');
  answer(t, true); t.g('reveal()');
  await new Promise(r => setTimeout(r, 1250));
  const b = t.$('#gbar');
  assert.ok(b.classList.contains('quake'));
  assert.equal(b.querySelectorAll('.gseg.cur i.ripe').length, 3, 'facken mörknar');
  await new Promise(r => setTimeout(r, 500));
  assert.equal(b.querySelectorAll('.gseg')[2].querySelectorAll('i.full').length, 3);
  t.g('stopTimer(); clearBar()');
});

test('Stapeln: graden under blir röd från höger, Nykomling har inga röda', () => {
  const t = load();
  t.g("barDraw({g: 0, up: 0, down: 2, done: 0}, 'body')");
  assert.equal(t.$$('#gbar i.bad').length, 0);
  t.g("barDraw({g: 2, up: 0, down: 2, done: 2}, 'body')");
  const cells = [...t.$$('#gbar .gseg')[1].querySelectorAll('i')].map(c => c.classList.contains('bad') ? 'r' : c.classList.contains('full') ? 'g' : 't');
  assert.equal(cells.join(''), 'grr');
  assert.equal(t.$$('#gbar .cracks').length, 0, 'inga sprickor längre');
});

test('Stapeln: rätt efter fel läker de röda facken', async () => {
  const t = atGrade('ohm', 2);
  t.g('S.instant = false; S.grade.ohm = 2; S.up = 0; S.down = 2; next()');
  answer(t, true); t.g('reveal()');
  await new Promise(r => setTimeout(r, 1100));
  const low = t.$$('#gbar .gseg')[1];
  assert.equal(low.querySelectorAll('i.bad').length, 0, 'inga röda kvar');
  assert.equal(low.querySelectorAll('i.heal').length, 2, 'de två röda läker');
  assert.equal(t.$$('#gbar .gseg.cur i.on').length, 1, 'första gröna på aktuell grad');
  t.g('stopTimer(); clearBar()');
});

test('Stapeln visas inte i Eldprovet', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("goTopic('ultra')"); dare(t);
  answer(t, true);
  assert.equal(t.g('S.barPlan'), null);
});

test('Gyllene: tre rätt på Stormästare gör ämnet klart, och sedan visas ämnets kort', () => {
  const t = atGrade('body', 4);
  t.g('S.grade.body = 4; S.up = 2; S.done.body = 4; next()');
  answer(t, true);
  assert.equal(t.g('S.done.body'), 5);
  assert.equal(t.g('S.barPlan.moved'), 'top');
  cont(t);
  assert.equal(t.g('S.view'), 'body', 'ämnets kort');
  assert.match(t.$('#q').textContent, /klart/i);
  assert.match(t.$('#q').textContent, /bland/i);
  assert.ok(t.g('S.kick'), 'startfråga på det gyllene kortet');
});

test('Blandat: ett gyllene ämne ger frågor från alla grader, utan trappa, med rekordsvit', () => {
  const t = golden('ohm');
  const grades = new Set();
  for (let i = 0; i < 40; i++) {
    t.g('next()');
    grades.add(t.g('S.mixG'));
    answer(t, true);
  }
  assert.ok(grades.size >= 4, `grader: ${[...grades]}`);
  assert.equal(t.g('S.grade.ohm'), 4, 'trappan rör sig inte');
  assert.equal(t.g('S.done.ohm'), 5);
  assert.equal(t.g('S.mix.streak'), 40);
  assert.equal(JSON.parse(t.w.localStorage.getItem('fargkoden2-best')).ohm, 40);
  t.g('next()'); answer(t, false);
  assert.equal(t.g('S.mix.streak'), 0, 'fel nollställer sviten');
  assert.equal(t.g('S.mix.best.ohm'), 40, 'rekordet står kvar');
  assert.equal(t.g('S.grade.ohm'), 4, 'inga röda, ingen grad att tappa');
  const p = JSON.parse(t.g('JSON.stringify(S.barPlan)'));
  assert.deepEqual([p.mix, p.ok, p.from.streak, p.to.streak], [true, false, 40, 0]);
});

test('Blandat: statusraden, kartan och kortet', () => {
  const t = golden('tol');
  t.g('next()');
  assert.match(t.$('#score').textContent, /Blandat/);
  assert.ok(t.$('#map [data-level="tol"].gold'), 'gyllene band på kartan');
  tap(t, t.$('#map [data-level="tol"]'));
  assert.match(t.$('#q').textContent, /Rekordsvit/);
  assert.equal(t.$$('[data-grade]').length, 0, 'inga gradval på ett gyllene ämne');
});

test('Resistansens Gesäll: ohm-talet står i klammern', () => {
  const t = atGrade('ohm', 2);
  for (let i = 0; i < 20; i++) {
    t.g('S.grade.ohm = 2; next()');
    assert.equal(t.$('#q .res .bracket text').textContent, `Resistans = ${t.g('fmtVal(valueOf(S.q))')}`);
  }
});

test('Resistansens Gesäll: guld och silver förekommer som multiplikator, med ×0,1 och ×0,01', () => {
  const t = atGrade('ohm', 2), seen = new Set();
  for (let i = 0; i < 200; i++) {
    t.g('S.grade.ohm = 2; next()');
    const m = t.g('S.q[nd(S.q)]');
    seen.add(m);
    if (m === 'gold') assert.equal(t.$$('#q .res .blab').at(-1).textContent, '×0,1');
    if (m === 'silver') assert.equal(t.$$('#q .res .blab').at(-1).textContent, '×0,01');
  }
  assert.ok(seen.has('gold') && seen.has('silver'), [...seen].join());
});

test('Testläge: rätt svar har en grön pil, i vanligt läge syns ingen', () => {
  const tt = load({ url: 'http://localhost/?test=true', storage: { 'fargkoden2-topic': 'body', 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }) } });
  const check = (topic, g, n = 15) => {
    for (let i = 0; i < n; i++) {
      tt.g(`S.topic = '${topic}'; S.grade['${topic}'] = ${g}; next()`);
      const type = tt.g('S.type'), fmt = tt.g('S.plan.fmt');
      if (type === 'choice') assert.ok(tt.$(`[data-c="${tt.g('S.cq.right')}"]`).classList.contains('cheat'), `${topic} ${g}`);
      else if (type === 'point') assert.equal(tt.$('#q .cheatmark').dataset.at, String(tt.g('S.pointAt')));
      else if (type === 'dir') assert.ok(tt.$(`[data-dir="${tt.g("S.style.flip ? 'right' : 'left'")}"]`).classList.contains('cheat'));
      else if (type === 'series') assert.ok(tt.$(`[data-sr="${tt.g('S.sr.answer')}"]`).classList.contains('cheat'));
      else if (fmt === 'hard') assert.match(tt.$('#q .cheatline').textContent, /Svar:/);
      else assert.equal(tt.$$('#q .cheat').length, 1, `${topic} ${g} ${type}`);
      assert.ok(tt.$('#q .cheat, #q .cheatmark, #q .cheatline'), `${topic} ${g} ${type} har en pil`);
    }
  };
  for (const topic of ['body', 'ohm', 'tol', 'tc', 'e']) for (let g = 0; g < 5; g++) check(topic, g);
  // Rätt svar enligt pilen ger rätt
  tt.g("S.topic = 'ohm'; S.grade.ohm = 3; next()");
  tt.$('#q .cheat').click();
  assert.equal(tt.g('S.ok'), true);
  const t = atGrade('ohm', 3);
  t.g('next()');
  assert.equal(t.$$('#q .cheat, #q .cheatmark, #q .cheatline').length, 0);
});

test('Resistansen Mästare fel: banden får sina värden och talet byggs upp', () => {
  const t = atGrade('ohm', 3);
  for (let i = 0; i < 15; i++) {
    t.g('S.grade.ohm = 3; next()');
    const k = t.g('nd(S.q)'), right = t.g('S.cq.right');
    answer(t, false);
    assert.equal(t.$$('#q .res .mk.ok').length, k + 1, 'siffrorna och multiplikatorn');
    const row = t.$('#q .calcrow').textContent.replace(/\s/g, '');
    assert.ok(row.startsWith(t.g('digitStr(S.q)')), row);
    assert.ok(row.includes(t.g('ohmTxt(valueOf(S.q))').replace(/\s/g, '')), row);
    assert.ok(t.$(`[data-c="${right}"]`).classList.contains('land'));
    assert.equal(t.$$('#q .lesson').length, 0);
    assert.ok(t.g('qAnim().total') >= 3);
  }
});

test('Resistansen Gesäll fel: markeringen vandrar i läsordning och landar på rätt band', () => {
  const t = atGrade('ohm', 2);
  for (let i = 0; i < 15; i++) {
    t.g('S.grade.ohm = 2; next()');
    const at = t.g('S.pointAt');
    answer(t, false);
    assert.equal(t.$$('#q .res .ring.walk').length, at, 'vandrar över banden före');
    assert.ok(t.$('#q .res .ring.ok.mk'), 'landar med grön ring');
    assert.equal(t.$$('#q .lesson').length, 0);
    assert.ok(t.g('qAnim().total') >= 1.5);
  }
});

test('Resistansen Stormästare fel: talet byggs upp, och vid avläsning får banden sina värden', () => {
  const t = atGrade('ohm', 4);
  const types = new Set();
  for (let i = 0; i < 20; i++) {
    t.g('S.grade.ohm = 4; next()');
    types.add(t.g('S.type'));
    answer(t, false);
    const row = t.$('#q .calcrow').textContent.replace(/\s/g, '');
    assert.ok(row.includes(t.g('fmtVal(valueOf(S.q))').replace(/\s/g, '')), row);
    if (t.g('S.type') === 'read') {
      assert.equal(t.$$('#q .res .mk.ok').length, t.g('nd(S.q)') + 1);
      const texts = t.$$('#q .res .mk.ok text');
      const mult = texts.find(e => e.textContent === t.g('fmtMult(C[S.q[nd(S.q)]].m)'));
      assert.ok(mult, 'hela multiplikatorn står på bandet');
      assert.ok(+mult.getAttribute('y') < 0, 'ovanför motståndet');
      texts.filter(e => e !== mult).forEach(e => assert.ok(+e.getAttribute('y') > 92, 'siffrorna under'));
    }
    assert.equal(t.$$('#q .lesson').length, 0);
  }
  assert.deepEqual([...types].sort(), ['build', 'read']);
});

test('Allt om förra motståndet ligger kvar vid nästa fråga', () => {
  const t = atGrade('ohm', 3);
  t.g('S.grade.ohm = 3; next()'); answer(t, true);
  const val = t.g('fmtVal(valueOf(S.q))');
  assert.match(t.$('#more h2').textContent, /^Allt om motståndet$/);
  cont(t);
  assert.equal(t.$('#more').hidden, false, 'ligger kvar');
  assert.match(t.$('#more h2').textContent, /förra motståndet/);
  assert.ok(t.$('#more').textContent.includes(val));
  answer(t, true);
  assert.match(t.$('#more h2').textContent, /^Allt om motståndet$/, 'byts mot det nya efter svar');
  t.g("goTopic('ultra')"); dare(t);
  assert.equal(t.$('#more').hidden, true, 'inte i Eldprovet');
});

test('Vid fel måste man se hela animeringen: tryck före slutet räknas inte', () => {
  const t = atGrade('body', 0);
  t.g('S.instant = false');
  t.g(`S.grade.body = 0; next()`); answer(t, false);
  t.g('reveal()');
  const lock = t.g('S.lockUntil - S.revealAt');
  assert.ok(lock >= 3000, `animeringen tar ${lock} ms`);
  cont(t);
  assert.equal(t.g('S.answered'), true, 'trycket för tidigt ignoreras');
  t.doc.body.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  assert.equal(t.g('S.answered'), true, 'Enter för tidigt ignoreras');
  t.g('S.lockUntil = 0');
  cont(t);
  assert.equal(t.g('S.answered'), false);
});

test('Fingret visas varje gång spelet väntar efter fel, aldrig efter rätt', () => {
  const t = atGrade('ohm', 1);
  for (let i = 0; i < 5; i++) {
    t.g('S.grade.ohm = 1; next()'); answer(t, false);
    assert.ok(t.$('#cont.tapcue'), `gång ${i + 1}`);
    cont(t);
  }
  t.g('S.grade.ohm = 1; next()'); answer(t, true);
  assert.equal(t.$('#cont'), null);
});

test('Motståndet Nykomling fel: det udda räknar sina band i rött och poppar, de andra räknar i grönt', () => {
  const t = atGrade('body', 0);
  for (let i = 0; i < 15; i++) {
    t.g('S.grade.body = 0; next()');
    const right = t.g('S.cq.right'), ns = t.g('S.cq.ns');
    answer(t, false);
    const odd = t.$(`[data-c="${right}"]`);
    assert.ok(odd.classList.contains('gone'));
    assert.equal(odd.querySelectorAll('.mk.bad').length, ns[right], 'det udda räknar alla sina band i rött');
    assert.match(odd.querySelector('.badge.bad').textContent, new RegExp(`${ns[right]}.*✗`));
    t.$$('[data-c]').filter(b => b !== odd).forEach(b => {
      const n = ns[+b.dataset.c];
      assert.equal(b.querySelectorAll('.mk.ok').length, n);
      assert.match(b.querySelector('.badge.ok').textContent, new RegExp(`${n}.*✓`));
    });
    // Ingen synlig rad, bara för skärmläsare
    assert.equal(t.$$('#q .lesson').length, 0);
    assert.match(t.$('#q .sr[role="status"]').textContent, /4, 5 eller 6/);
  }
});

test('Svår variant: Svara sitter under inmatningen', () => {
  const t = atGrade('ohm', 4);
  until(t, p => p.type === 'read');
  const sub = t.$('#submit');
  assert.ok(sub && sub.closest('.entry'), 'Svara finns i inmatningen');
  assert.equal(t.$('#q .qtop button'), null, 'ingen knapp uppe till höger');
});

test('Glödlampan och Öva finns inte', () => {
  const t = atGrade('ohm', 1);
  assert.equal(t.$('[data-hint]'), null);
  assert.equal(t.$('[data-mode]'), null);
  assert.equal(t.$('#partSeg'), null);
});

test('Allt om motståndet finns kvar efter svar på en fråga med ett motstånd', () => {
  const t = atGrade('ohm', 3);
  t.g('next()'); answer(t, true);
  assert.equal(t.$('#more').hidden, false);
  assert.match(t.$('#more').textContent, /Allt om motståndet/);
});

test('Beroenderegeln: frågorna per ämne och grad använder rätt sorts frågor', () => {
  const kinds = {
    body: [['choice'], ['choice'], ['choice'], ['dir'], ['point']],
    ohm: [['choice'], ['choice'], ['point'], ['choice'], ['read', 'build']],
    tol: [['choice'], ['choice'], ['choice'], ['choice'], ['read', 'build']],
    tc: [['choice'], ['choice'], ['choice'], ['choice'], ['read', 'build']],
    e: [['choice'], ['choice'], ['choice'], ['series'], ['series']]
  };
  for (const topic of TOPICS) for (let g = 0; g < 5; g++) {
    const t = atGrade(topic, g);
    for (let i = 0; i < 15; i++) {
      t.g('next()');
      assert.ok(kinds[topic][g].includes(t.g('S.type')), `${topic} ${g}: ${t.g('S.type')}`);
      const fmt = t.g('S.plan.fmt');
      if (g < 4) assert.notEqual(fmt, 'hard', `${topic} ${g} ska inte vara svår variant`);
      else if (topic !== 'body' && topic !== 'e') assert.equal(fmt, 'hard');
      // Vända motstånd först på Stormästare (riktningsfrågan undantagen)
      if (g < 4 && t.g('S.type') !== 'dir') assert.ok(!t.g('S.style && S.style.flip'), `${topic} ${g} vänt`);
    }
  }
});

for (const topic of TOPICS) for (let g = 0; g < 5; g++) {
  test(`${topic} grad ${g}: 60 svar, rätt och fel, utan fel i sidan`, () => {
    const t = atGrade(topic, g);
    for (let i = 0; i < 60; i++) {
      t.g(`S.grade['${topic}'] = ${g}; S.up = 0; S.down = 0; next()`);
      answer(t, i % 2 === 0);
      assert.equal(t.g('S.answered'), true);
    }
    assert.deepEqual(t.errors.map(String), []);
  });
}

test('Eldprovet: 4 frågor per ämne', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("goTopic('ultra')");
  dare(t);
  const q = t.g('S.exam.queue.map(x => x.topic)');
  for (const topic of TOPICS) assert.equal(q.filter(x => x === topic).length, 4, topic);
  assert.equal(q.length, 20);
});

test('Eldprovet: inget rätt/fel och ingen text under provet', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("goTopic('ultra')"); dare(t);
  for (let i = 0; i < 20; i++) {
    answer(t, i % 2 === 0);
    assert.equal(t.$$('#q .ok, #q .bad').length, 0, t.g('S.type'));
    assert.equal(t.$$('#q .lesson').length, 0);
    assert.equal(t.$('#more').hidden, true);
    cont(t);
  }
  assert.match(t.$('#q').textContent, /Eldprovet är klart/);
  assert.deepEqual(t.errors.map(String), []);
});

test('Eldprovet höjer bara: 4 av 4 ger klart, 3 av 4 ger Mästare, sämre ändrar inget', () => {
  const t = load({ storage: { 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 1 }) } });
  t.g("S.exam = {queue: [], i: 20, done: true, score: {body:{ok:2,n:4}, ohm:{ok:3,n:4}, tol:{ok:4,n:4}, tc:{ok:0,n:4}, e:{ok:3,n:4}}}");
  t.g('applyExam()');
  assert.equal(t.g('S.done.body'), 4);
  assert.equal(t.g('S.done.ohm'), 3);
  assert.equal(t.g('S.done.tol'), 5);
  assert.equal(t.g('S.done.tc'), 0);
  assert.equal(t.g('S.done.e'), 3);
  assert.equal(t.g("unlocked('tc')"), true);
  assert.equal(t.g('S.grade.tol'), 4);
});

test('Kartan: banden fylls efter klarade grader, låsta har lås, klara har ✓', () => {
  const t = load({ storage: { 'fargkoden2-done': JSON.stringify({ body: 5, ohm: 3, tol: 1 }) } });
  const fill = lv => +t.$(`#map [data-level="${lv}"] .fill`)?.getAttribute('height') || 0;
  assert.ok(fill('body') > fill('ohm') && fill('ohm') > fill('tol') && fill('tol') > 0);
  assert.equal(fill('tc'), 0);
  assert.ok(t.$('#map [data-level="body"] .done'));
  // Toleransen är öppen (Resistansen nådde Mästare), Temperaturen och E-serierna är låsta
  assert.equal(t.$('#map [data-level="tol"] .lock'), null);
  assert.ok(t.$('#map [data-level="tc"] .lock'));
  assert.ok(t.$('#map [data-level="e"] .lock'));
});

test('Nivåkortet: fem gradprickar, nådda går att välja och ger den graden', () => {
  const t = load({ storage: { 'fargkoden2-done': JSON.stringify({ body: 5, ohm: 2 }), 'fargkoden2-grade': JSON.stringify({ ohm: 2 }) } });
  tap(t, t.$('#map [data-level="ohm"]'));
  const dots = t.$$('[data-grade]');
  assert.equal(dots.length, 5);
  assert.deepEqual(dots.map(d => d.disabled), [false, false, false, true, true]);
  dots[0].click();
  kick(t);
  assert.equal(t.g('S.topic'), 'ohm');
  assert.equal(t.g('S.grade.ohm'), 0);
  assert.equal(t.g('S.done.ohm'), 2);
});

test('Fel tre gånger i rad tar ner en grad och statusraden säger det', () => {
  const t = atGrade('ohm', 2);
  for (let i = 0; i < 3; i++) { t.g('next()'); answer(t, false); }
  assert.equal(t.g('S.grade.ohm'), 1);
  assert.match(t.$('#score').textContent, /Ner till Lärling/);
});
