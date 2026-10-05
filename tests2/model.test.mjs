import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, atGrade, ALL_OPEN } from './harness.mjs';
import { answer, until, tap } from './answer.mjs';

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
  t.$('#play')?.click();
  for (let i = 0; i < 3; i++) { answer(t, true); if (i < 2) t.$('#main').click(); }
  assert.deepEqual(st(t, 'body'), {g: 1, done: 1});
  assert.match(t.$('#score').textContent, /Upp till Lärling/);
});

test('Från Gesäll till Mästare låser upp nästa ämne och visar dess kort', () => {
  const t = load({ storage: { 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  t.$('#play')?.click();
  for (let i = 0; i < 3; i++) { answer(t, true); t.$('#main').click(); }
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
  t.$('#play')?.click();
  for (let i = 0; i < 3; i++) { answer(t, true); t.$('#main').click(); }
  assert.equal(JSON.parse(t.w.localStorage.getItem('fargkoden2-done')).body, 1);
  assert.equal(JSON.parse(t.w.localStorage.getItem('fargkoden2-grade')).body, 1);
});

for (const topic of TOPICS) {
  test(`${topic}: Nykomling är Hitta felet, exakt ett fel, facit tre gröna och ett rött`, () => {
    const t = atGrade(topic, 0);
    for (let i = 0; i < 20; i++) {
      t.g('next()');
      assert.match(t.$('#q').textContent, /Hitta felet/);
      assert.equal(t.$$('[data-c]').length, 4);
      answer(t, i % 2 === 0);
      assert.equal(t.$$('#q .opt.ok').length, 3);
      assert.equal(t.$$('#q .opt.bad').length, 1);
      assert.equal(t.$$('#q .opt.chosen').length, 1);
    }
  });
}

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

test('Peka på band: rätt band, även när motståndet sitter vänt', () => {
  const t = atGrade('body', 4);
  let flipped = 0;
  for (let i = 0; i < 40; i++) {
    t.g('next()');
    assert.equal(t.g('S.type'), 'point');
    if (t.g('S.style.flip')) flipped++;
    const role = t.g('S.pointRole'), at = t.g('S.pointAt'), k = t.g('nd(S.q)');
    assert.equal(at, role === 'first' ? 0 : role === 'mult' ? k : k + 1);
    answer(t, true);
    assert.equal(t.g('S.ok'), true);
  }
  assert.ok(flipped > 0, 'inget vänt motstånd');
  t.g('next()'); answer(t, false); assert.equal(t.g('S.ok'), false);
});

test('Text: rätt svar ger ingen text, fel svar ger exakt en rad', () => {
  for (const [topic, g] of [['body', 0], ['ohm', 1], ['ohm', 3], ['tol', 3], ['e', 2]]) {
    const t = atGrade(topic, g);
    t.g('next()'); answer(t, true);
    assert.equal(t.$$('#q .lesson').length, 0, `${topic} ${g} rätt`);
    t.g('next()'); answer(t, false);
    assert.equal(t.$$('#q .lesson').length, 1, `${topic} ${g} fel`);
  }
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
    ohm: [['choice'], ['choice'], ['choice'], ['read', 'build'], ['read', 'build']],
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
  t.$('#examStart').click();
  const q = t.g('S.exam.queue.map(x => x.topic)');
  for (const topic of TOPICS) assert.equal(q.filter(x => x === topic).length, 4, topic);
  assert.equal(q.length, 20);
});

test('Eldprovet: inget rätt/fel och ingen text under provet', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("goTopic('ultra')"); t.$('#examStart').click();
  for (let i = 0; i < 20; i++) {
    answer(t, i % 2 === 0);
    assert.equal(t.$$('#q .ok, #q .bad').length, 0, t.g('S.type'));
    assert.equal(t.$$('#q .lesson').length, 0);
    assert.equal(t.$('#more').hidden, true);
    t.$('#main').click();
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
  t.$('#play').click();
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
