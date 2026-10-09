import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, atGrade, pinned, answer, cont, tap } from './ackord-harness.mjs';

test('Ny spelare: åtta kort, nyckeln i Klaviaturens lås, och ämnen som inte är byggda går inte att öppna', () => {
  const t = load({ start: true });
  assert.equal(t.$$('#grid .tile').length, 8);
  assert.ok(t.$('#grid [data-id="tangent"] .inkey'), 'nyckeln sitter i låset');
  for (const id of ['fyrklang', 'vag', 'lan', 'ultra']) {
    assert.match(t.$(`#grid [data-id="${id}"]`).textContent, /Kommer snart/);
    t.$(`#grid [data-id="${id}"]`).click();
    assert.equal(t.g('S.screen'), 'grid', id);
  }
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

test('Mästare i Stegen ger nyckeln till Fyrklangerna, som kommer snart', () => {
  const t = load({ storage: { 'ackord1-topic': 'steg', 'ackord1-done': JSON.stringify({ tangent: 5, treklang: 5, tonart: 5, steg: 2 }), 'ackord1-grade': JSON.stringify({ steg: 2 }) } });
  for (let i = 0; i < 3; i++) { answer(t, true); if (i < 2) cont(t); }
  assert.equal(t.g('S.done.steg'), 3);
  assert.ok(t.g("S.keys.includes('fyrklang')"));
  cont(t);
  assert.equal(t.g('S.screen'), 'grid', 'nyckeln visas och kortet stängs');
  const tile = t.$('#grid [data-id="fyrklang"]');
  assert.ok(tile.querySelector('.inkey'), 'nyckeln sitter i låset');
  tile.click();
  assert.equal(t.g('S.screen'), 'grid', 'men ämnet går inte att öppna än');
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
