import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, atGrade, pinned, answer, cont, tap } from './ackord-harness.mjs';

test('Ny spelare: åtta kort, nyckeln i Klaviaturens lås, låsta ämnen går inte att öppna men Eldprovet är alltid öppet', () => {
  const t = load({ start: true });
  assert.equal(t.$$('#grid .tile').length, 8);
  assert.ok(t.$('#grid [data-id="tangent"] .inkey'), 'nyckeln sitter i låset');
  assert.doesNotMatch(t.$('#grid').textContent, /Kommer snart/);
  t.$('#grid [data-id="lan"]').click();
  assert.equal(t.g('S.screen'), 'grid', 'låst');
  t.$('#grid [data-id="tangent"]').click();
  t.$('#grid [data-id="tangent"]').click();
  assert.equal(t.g('S.screen'), 'play');
  assert.ok(t.$('#q [data-kick]'), 'omslaget med snabbkoll');
  t.$(`#q [data-kick="${t.g('S.kick.right')}"]`).click();
  assert.ok(t.g('S.Q'), 'första frågan');
  assert.deepEqual(t.errors, []);
});

test('Trappan: tre rätt upp en grad, tre fel ner igen', () => {
  const t = atGrade('tangent', 0, { 'ackord1-done': JSON.stringify({}) });
  for (let i = 0; i < 3; i++) { answer(t, true); cont(t); }
  assert.equal(t.g('S.grade.tangent'), 1);
  assert.equal(t.g('S.done.tangent'), 1);
  for (let i = 0; i < 3; i++) { answer(t, false); cont(t); }
  assert.equal(t.g('S.grade.tangent'), 0);
  assert.equal(t.g('S.done.tangent'), 1, 'klarade grader försvinner inte');
  assert.equal(t.g("JSON.parse(localStorage.getItem('ackord1-grade')).tangent"), 0);
});

test('Mästare i Vägarna ger nyckeln till Lånade ackord, som vrids om och öppnas', () => {
  const t = load({ storage: { 'ackord1-topic': 'vag', 'ackord1-done': JSON.stringify({ tangent: 5, treklang: 5, tonart: 5, steg: 5, fyrklang: 5, vag: 2 }), 'ackord1-grade': JSON.stringify({ vag: 2 }) } });
  for (let i = 0; i < 3; i++) { answer(t, true); if (i < 2) cont(t); }
  assert.equal(t.g('S.done.vag'), 3);
  assert.ok(t.g("S.keys.includes('lan')"));
  cont(t);
  assert.equal(t.g('S.screen'), 'grid', 'nyckeln visas och kortet stängs');
  const tile = () => t.$('#grid [data-id="lan"]');
  assert.ok(tile().querySelector('.inkey'), 'nyckeln sitter i låset');
  tile().click(); tile().click();
  assert.equal(t.g('S.screen'), 'play');
  assert.deepEqual(t.errors, []);
});

test('En nyckel till Tonarterna som förtjänades medan ämnet kom snart vrids om och öppnar ämnet', () => {
  const t = load({ start: true, storage: { 'ackord1-topic': 'treklang', 'ackord1-done': JSON.stringify({ tangent: 5, treklang: 3 }), 'ackord1-keys': JSON.stringify(['tonart']), 'ackord1-seen': JSON.stringify(['tangent', 'treklang']) } });
  const tile = () => t.$('#grid [data-id="tonart"]');
  assert.ok(tile().querySelector('.inkey'));
  assert.doesNotMatch(tile().textContent, /Kommer snart/);
  tile().click();
  tile().click();
  assert.equal(t.g('S.screen'), 'play');
  assert.ok(t.$('#q [data-kick]'), 'omslaget med snabbkoll');
  t.$(`#q [data-kick="${t.g('S.kick.right')}"]`).click();
  assert.equal(t.g('S.Q.id'), 'tonart-fattas');
  assert.deepEqual(t.errors, []);
});

test('Förhandsvisningen öppnar exakt frågetypen, stannar på graden och sparar inget', () => {
  const t = pinned('treklang', 4, 'treklang-flytta', { start: true });
  assert.equal(t.g('S.screen'), 'play');
  assert.equal(t.g('S.Q.id'), 'treklang-flytta');
  for (let i = 0; i < 4; i++) { answer(t, true); cont(t); }
  assert.equal(t.g('S.Q.id'), 'treklang-flytta');
  assert.equal(t.g('S.grade.treklang'), 4);
  assert.equal(t.g("localStorage.getItem('ackord1-grade')"), null);
  assert.ok(!t.$('.testbar').hidden, 'testraden syns');
});

test('Trasig data i minnet: spelet startar ändå på Nykomling', () => {
  const t = load({ start: true, storage: { 'ackord1-done': '{trasig', 'ackord1-grade': '[', 'ackord1-keys': 'x', 'ackord1-topic': 'treklang' } });
  assert.deepEqual(t.errors, []);
  assert.equal(t.g('S.grade.tangent'), 0);
  assert.equal(t.$$('#grid .tile').length, 8);
});

test('Testläget: grön pil på rätt svar, och den går att dölja', () => {
  const t = pinned('tangent', 0, 'tangent-namn');
  assert.ok(t.$(`#q [data-c="${t.g('S.Q.right')}"]`).classList.contains('cheat'));
  t.$('#tCheat').click();
  assert.equal(t.$$('#q .cheat').length, 0);
});

test('Gyllene ämne spelas blandat, med svit', () => {
  const t = load({ storage: { 'ackord1-topic': 'tangent', 'ackord1-done': JSON.stringify({ tangent: 5 }), 'ackord1-grade': JSON.stringify({ tangent: 4 }) } });
  assert.equal(t.g('isMix("tangent")'), true);
  answer(t, true); cont(t); answer(t, true);
  assert.equal(t.g('S.mix.streak'), 2);
});

// Eldprovet: tre tryck på elden startar, inget facit, resultatet höjer ämnen
const startExam = t => { t.$('#grid [data-id="ultra"]').click(); for (let i = 0; i < 3; i++) t.$('#dare').click(); };
test('Eldprovet: 21 frågor utan facit, sedan resultatet, och 3 av 3 klarar ämnet', () => {
  const t = load({ start: true });
  startExam(t);
  assert.equal(t.g('S.exam.queue.length'), 21);
  const right = t.g("S.exam.queue.map(x => x.topic).filter(x => x === 'tangent').length");
  assert.equal(right, 3);
  for (let i = 0; i < 21; i++) {
    const topic = t.g('S.examItem.topic');
    answer(t, topic === 'tangent' || topic === 'treklang');
    assert.equal(t.$$('#q .opt.ok, #q .opt.bad').length, 0, 'inget facit');
    assert.equal(t.$$('#q .tapcue').length, 0, 'ingen förklaring');
    cont(t);
  }
  assert.match(t.$('#q').textContent, /Eldprovet är klart/);
  assert.match(t.$('#q').textContent, /6 av 21 rätt/);
  assert.equal(t.g('S.done.treklang'), 5);
  assert.equal(t.g('S.done.tonart'), 0);
  assert.ok(t.g("S.keys.includes('tonart')"), 'nyckeln till nästa ämne');
  assert.equal(t.g("localStorage.getItem('ackord1-exam')"), null, 'ett klart prov sparas inte');
  t.$('#examStart').click();
  assert.equal(t.g('S.exam.i'), 0, 'göra om');
  assert.deepEqual(t.errors, []);
});

test('Eldprovet: ett pågående prov finns kvar efter omladdning, och 2 av 3 ger Mästare', () => {
  const t = load({ start: true });
  startExam(t);
  for (let i = 0; i < 4; i++) { answer(t, true); cont(t); }
  const saved = t.g("localStorage.getItem('ackord1-exam')");
  const t2 = load({ start: true, storage: { 'ackord1-exam': saved } });
  assert.equal(t2.g('S.exam.i'), 4);
  assert.match(t2.$('#grid [data-id="ultra"]').textContent, /fråga 5 av 21/);
  t2.g("S.exam.score = {fyrklang: {ok: 2, n: 3}}; S.exam.i = 20; saveExam()");
  t2.$('#grid [data-id="ultra"]').click();
  answer(t2, false); cont(t2);
  assert.equal(t2.g('S.done.fyrklang'), 3);
  assert.equal(t2.g('S.done.vag'), 0);
});
