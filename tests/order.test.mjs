import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade } from './harness.mjs';
import { answer, until } from './answer.mjs';

const isOrder = set => p => p.type === 'order' && p.set === set;
const clickKey = (t, k) => t.$(`[data-ord="${k}"]`).click();

test('Ordna värdena: Lärling, tio tomma lådor med 0–9 ovanför och färgerna blandade under', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  assert.match(t.$('#q .prompt').textContent, /nummerordning/);
  assert.deepEqual(t.$$('#q .oslot span').map(s => s.textContent), ['0','1','2','3','4','5','6','7','8','9']);
  assert.equal(t.$$('#q .obox .osw').length, 0, 'lådorna är tomma');
  assert.equal(t.$$('#q [data-ord]').length, 10);
  assert.ok(t.$('#q').classList.contains('kind-order'));
  assert.match(t.$('#q .kindtag').textContent, /ordning/i);
});

test('Ordna: rätt färg landar grön, fel färg studsar tillbaka och den rätta får en grön ledtråd', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  t.g("S.played = []; ['blip','thud'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  clickKey(t, 'black');
  assert.ok(t.$('#q [data-oslot="black"].ok .osw'));
  clickKey(t, 'red');
  assert.equal(t.$('#q [data-oslot="red"] .osw'), null, 'den felaktiga stannar inte');
  assert.ok(!t.$('[data-ord="red"]').disabled, 'den går att välja igen');
  assert.ok(t.$('[data-ord="brown"]').classList.contains('hint'), 'den rätta får en grön ledtråd');
  assert.equal(t.g('S.ord.missed'), true);
  clickKey(t, 'brown');
  assert.ok(t.$('#q [data-oslot="brown"].ok'));
  assert.equal(t.$$('#q .ochip.hint').length, 0, 'ledtråden försvinner');
  assert.deepEqual(Array.from(t.g('S.played')), ['blip', 'thud', 'blip']);
  assert.equal(t.g('S.answered'), false);
});

test('Ordna: utan fel i första försöket är frågan rätt direkt', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  answer(t, true);
  assert.equal(t.g('S.answered'), true); assert.equal(t.g('S.ok'), true);
  assert.equal(t.g('S.ord.round'), 1);
});

test('Ordna: fel i första försöket ger ett sista försök, utan hjälp och med färgerna i samma ordning', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  const pool = t.$$('[data-ord]').map(b => b.dataset.ord);
  const keys = Array.from(t.g('S.ord.keys'));
  clickKey(t, 'brown');
  for (const k of keys) clickKey(t, k);
  assert.equal(t.g('S.answered'), false, 'inte klart');
  assert.equal(t.g('S.ord.round'), 2);
  assert.equal(t.$$('#q .obox .osw').length, 0, 'alla har flugit tillbaka');
  assert.deepEqual(t.$$('[data-ord]').map(b => b.dataset.ord), pool, 'samma ordning');
  assert.match(t.$('#q .ordnote').textContent, /Du får ett sista försök/);
  assert.match(t.$('#q .kindtag').textContent, /Sista försöket/i);
  clickKey(t, 'red');
  assert.ok(t.$('[data-ord="black"]').classList.contains('hint'), 'efter ett fel kommer ledtråden ändå, så att man kan bygga klart');
  for (const k of keys) clickKey(t, k);
  assert.equal(t.g('S.answered'), true); assert.equal(t.g('S.ok'), false);
  assert.match(t.$('#q .lesson').textContent, /Svart 0, brun 1/);
});

test('Ordna: inga ledtrådar i sista försöket förrän man gjort fel, och utan fel är frågan rätt', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  const keys = Array.from(t.g('S.ord.keys'));
  clickKey(t, 'brown'); for (const k of keys) clickKey(t, k);
  assert.equal(t.$$('#q .ochip.hint').length, 0);
  for (const k of keys) clickKey(t, k);
  assert.equal(t.g('S.answered'), true); assert.equal(t.g('S.ok'), true);
});

test('Ordna multiplikatorerna: Gesäll, från ×0,01 till ×1M', () => {
  const t = atGrade('ohm', 2);
  until(t, isOrder('m'));
  assert.deepEqual(t.$$('#q .oslot span').map(s => s.textContent), ['×0,01','×0,1','×1','×10','×100','×1k','×10k','×100k','×1M']);
  answer(t, true);
  assert.equal(t.g('S.ok'), true);
});

test('Peka: Lärling pekar på siffrorna, Gesäll på siffrorna eller multiplikatorn', () => {
  const l = atGrade('ohm', 1), roles = new Set();
  for (let i = 0; i < 300; i++) { l.g('next()'); if (l.g('S.type') === 'point') roles.add(l.g('S.pointRole')); }
  assert.deepEqual([...roles].sort(), ['d1', 'd2', 'd3']);
  const g = atGrade('ohm', 2), groles = new Set();
  for (let i = 0; i < 300; i++) { g.g('next()'); if (g.g('S.type') === 'point') groles.add(g.g('S.pointRole')); }
  assert.deepEqual([...groles].sort(), ['d1', 'd2', 'd3', 'mult']);
});

test('Lärling blandar färg ↔ siffra, ordna och peka; Gesäll blandar peka och ordna', () => {
  const kinds = (grade, n) => { const t = atGrade('ohm', grade), s = new Set(); for (let i = 0; i < n; i++) { t.g('next()'); s.add(t.g('S.type')); } return [...s].sort(); };
  assert.deepEqual(kinds(1, 200), ['choice', 'order', 'point']);
  assert.deepEqual(kinds(2, 100), ['order', 'point']);
});

test('Ordna: flygturen är spänning, rätt eller fel syns och hörs först när färgen landar', async () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  t.g("S.instant = false; S.played = []; ['blip','thud','whoosh'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.g('S.ord.fakeRate = 0');
  clickKey(t, 'black');
  const box = () => t.$('#q [data-oslot="black"]');
  assert.ok(box().classList.contains('fly'), 'på väg');
  assert.ok(!box().classList.contains('ok') && !box().classList.contains('bad'));
  assert.deepEqual(Array.from(t.g('S.played')), ['whoosh']);
  // Man kan klicka på nästa medan den första flyger
  clickKey(t, 'brown');
  assert.ok(t.$('#q [data-oslot="brown"].fly .osw'), 'nästa är också på väg');
  clickKey(t, 'orange');
  assert.equal(t.$('#q [data-oslot="orange"] .osw'), null, 'fel färg sätter sig inte');
  await new Promise(r => setTimeout(r, 1900));
  assert.ok(box().classList.contains('ok'));
  assert.ok(!box().classList.contains('fly'));
  assert.ok(t.$('#q [data-oslot="brown"]').classList.contains('ok'));
  assert.deepEqual(Array.from(t.g('S.played')).filter(x => x !== 'whoosh'), ['blip', 'blip', 'thud']);
});

test('Ordna: ibland låtsas ett rätt val flyga mot fel låda och vänder', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  t.g('S.instant = false; S.ord.fakeRate = 1');
  clickKey(t, 'black');
  const decoy = t.g('S.ord.decoy');
  assert.ok(decoy && decoy !== 'black', 'en annan låda att låtsas mot');
  assert.equal(t.g(`S.ord.placed['${decoy}']`), undefined, 'en tom låda');
  t.g('S.ord.fakeRate = 1'); 
});

test('Ordna: fel val låtsas aldrig, och var femte rätt ungefär gör det', () => {
  const t = atGrade('ohm', 1);
  let fakes = 0, rights = 0;
  for (let i = 0; i < 60; i++) {
    t.g('S.grade.ohm = 1; S.up = 0; S.down = 0'); until(t, isOrder('d'));
    clickKey(t, 'brown');
    assert.equal(t.g('S.ord.decoy'), null, 'fel val');
    clickKey(t, 'black');
    rights++; if (t.g('S.ord.decoy')) fakes++;
  }
  assert.ok(fakes > 3 && fakes < 25, `${fakes} av ${rights}`);
});

test('Ordna: bara färgen som just landade rör sig, de som redan ligger i sina lådor står still', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  clickKey(t, 'black');
  assert.ok(t.$('#q [data-oslot="black"]').classList.contains('landnow'));
  clickKey(t, 'brown');
  assert.ok(!t.$('#q [data-oslot="black"]').classList.contains('landnow'), 'den första studsar inte igen');
  assert.ok(t.$('#q [data-oslot="brown"]').classList.contains('landnow'));
  assert.equal(t.$$('#q .landnow').length, 1);
});

test('Ordna värdena: frågan säger att varje siffra har en färg', () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  assert.equal(t.$('#q .prompt').textContent, 'Varje siffra har en färg. Klicka på färgerna i nummerordning.');
});

const WORDS = ['nollan','ettan','tvåan','trean','fyran','femman','sexan','sjuan','åttan','nian'];
const digitPoint = p => p.type === 'point';
function checkDigitPoint(t, withLabels) {
  const at = t.g('S.pointAt'), k = t.g('nd(S.q)'), d = t.g(`C[S.q[${at}]].d`);
  const digits = [...Array(k).keys()].map(j => t.g(`C[S.q[${j}]].d`));
  const same = digits.filter(x => x === d).length, nth = digits.slice(0, at).filter(x => x === d).length;
  const ord = same > 1 ? ['första ', 'andra ', 'tredje '][nth] : '';
  assert.equal(t.$('#q .prompt').textContent, `Peka på bandet som ger ${ord}${WORDS[d]} i resistansen.`);
  assert.equal(t.$('#q .res .bracket text .hl').textContent, String(d), 'siffran är markerad i värdet');
  assert.match(t.$('#q .res .bracket text').textContent, new RegExp(`^Resistans = ${t.g('ohmTxt(valueOf(S.q))')}$`));
  assert.ok(t.g('C[S.q[nd(S.q)]].m') >= 1, 'multiplikatorn är minst ×1, så att alla siffror syns');
  assert.equal(t.$$('#q .res .blab').length > 0, withLabels);
}

test('Peka på siffra, Lärling: frågan nämner siffran, den är markerad i värdet, siffrorna står under banden', () => {
  const t = atGrade('ohm', 1);
  for (let i = 0; i < 80; i++) {
    t.g('S.grade.ohm = 1; next()');
    if (t.g('S.type') !== 'point') continue;
    checkDigitPoint(t, true);
  }
});

test('Peka på siffra, Gesäll: samma fråga men utan siffrorna under banden; multiplikatorn finns kvar', () => {
  const t = atGrade('ohm', 2), roles = new Set();
  for (let i = 0; i < 200; i++) {
    t.g('S.grade.ohm = 2; next()');
    if (t.g('S.type') !== 'point') continue;
    const r = t.g('S.pointRole'); roles.add(r === 'mult' ? 'mult' : 'digit');
    if (r !== 'mult') checkDigitPoint(t, false);
    else assert.equal(t.$('#q .prompt').textContent, 'Peka på multiplikatorn.');
  }
  assert.deepEqual([...roles].sort(), ['digit', 'mult']);
});

test('Ordna: snabba klick, raden blir klar och frågan avgörs först när alla har landat', async () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  t.g('S.instant = false; S.ord.fakeRate = 0');
  for (const k of Array.from(t.g('S.ord.keys'))) clickKey(t, k);
  assert.equal(t.g('S.answered'), false, 'inte förrän de har landat');
  await new Promise(r => setTimeout(r, 1000));
  assert.equal(t.$$('#q .obox.ok').length, 10);
  assert.equal(t.g('S.ok'), true);
  t.g('stopTimer(); clearBar()');
});

test('Ordna: fel färg flyger till sin egen låda, blir röd där och flyger tillbaka', async () => {
  const t = atGrade('ohm', 1);
  until(t, isOrder('d'));
  t.g('S.instant = false');
  clickKey(t, 'red');
  await new Promise(r => setTimeout(r, 800));
  assert.ok(t.$('#q [data-oslot="red"]').classList.contains('bad'), 'röd i sin egen låda');
  assert.ok(!t.$('#q [data-oslot="black"]').classList.contains('bad'), 'inte i lådan som står på tur');
  await new Promise(r => setTimeout(r, 1100));
  assert.ok(!t.$('#q [data-oslot="red"]').classList.contains('bad'));
  assert.equal(t.$('#q [data-oslot="red"] .osw'), null);
});
