import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';
import { answer } from './answer.mjs';

const wait = ms => new Promise(r => setTimeout(r, ms));
// jsdom har ingen layout: stapelns läge på skärmen sätts för hand
const barAt = (t, top) => t.g(`document.getElementById('gbar').getBoundingClientRect = () => ({top: ${top}, bottom: ${top + 51}, left: 0, right: 400, width: 400, height: 51})`);
const run = t => { answer(t, true); t.g('stopTimer(); S.instant = false; barFX(S.barPlan, 0)'); };

test('Stapeln ovanför skärmen: den glider in längst upp medan den fylls, och en lucka håller kortet på plats', async () => {
  const t = load();
  barAt(t, -300);
  run(t);
  await wait(30);
  assert.ok(t.$('#gbar').classList.contains('float'), 'stapeln ligger överst på skärmen');
  assert.ok(t.$('#gbargap'), 'luckan där stapeln satt');
  await wait(2100);
  assert.ok(!t.$('#gbar').classList.contains('float'), 'stapeln går tillbaka när den är klar');
  assert.equal(t.$('#gbargap'), null);
});

test('Stapeln syns redan: den stannar på sin plats', async () => {
  const t = load();
  barAt(t, 140);
  run(t);
  await wait(30);
  assert.ok(!t.$('#gbar').classList.contains('float'));
  assert.equal(t.$('#gbargap'), null);
  t.g('clearBar()');
});

test('Ny fråga medan stapeln ligger överst: den går tillbaka och luckan försvinner', async () => {
  const t = load();
  barAt(t, -300);
  run(t);
  await wait(30);
  t.g('clearBar()');
  assert.ok(!t.$('#gbar').classList.contains('float'));
  assert.equal(t.$('#gbargap'), null);
});
