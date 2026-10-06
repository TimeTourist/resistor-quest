import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { load } from './harness.mjs';
import { answer, cont } from './answer.mjs';

const devHtml = readFileSync(new URL('../dev.html', import.meta.url), 'utf8');
function dev(storage = {}) {
  const dom = new JSDOM(devHtml, { url: 'http://localhost/dev.html', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) { for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v); } });
  const w = dom.window;
  return { w, g: e => w.eval(e), $: s => w.document.querySelector(s), $$: s => [...w.document.querySelectorAll(s)] };
}
const edit = (d, el, val) => { el.value = val; el.dispatchEvent(new d.w.Event('input', { bubbles: true })); };

test('Förhandsvisning: ?test=true&topic=ohm&grade=2 öppnar Resistansens Gesäll och stannar där', () => {
  const t = load({ url: 'http://localhost/index.html?test=true&topic=ohm&grade=2' });
  assert.equal(t.g('S.topic'), 'ohm');
  assert.equal(t.g('S.grade.ohm'), 2);
  assert.ok(['point', 'order'].includes(t.g('S.type')));
  for (let i = 0; i < 4; i++) { answer(t, true); cont(t); }
  assert.equal(t.g('S.grade.ohm'), 2, 'graden ändras inte i förhandsvisningen');
  assert.equal(t.g("localStorage.getItem('fargkoden2-grade')"), null, 'förhandsvisningen sparar inget');
});

test('Förhandsvisning: utan testläge ignoreras topic och grade', () => {
  const t = load({ url: 'http://localhost/index.html?topic=ohm&grade=2' });
  assert.equal(t.g('S.topic'), 'body');
  assert.equal(t.g('S.grade.ohm'), 0);
});

test('Katalogen i dev.html täcker varje ämne och grad i spelet', () => {
  const d = dev(), game = load();
  const topics = JSON.parse(game.g('JSON.stringify(TOPICS)'));
  const cat = JSON.parse(d.g('JSON.stringify(CATALOG)'));
  assert.deepEqual(Object.keys(cat).sort(), [...topics, 'ultra'].sort());
  for (const t of topics) {
    const n = game.g(`GRADES.${t}.length`);
    for (let g = 0; g < n; g++) assert.ok(cat[t].some(r => r.g === g), `${t} saknar rad för grad ${g}`);
    assert.ok(cat[t].every(r => r.g >= 0 && r.g <= 5), `${t} har en rad utanför graderna`);
  }
  const ids = Object.values(cat).flat().map(r => r.id);
  assert.equal(new Set(ids).size, ids.length, 'id:n är unika');
});

test('dev.html: utan ändringar säger prompten det', () => {
  const d = dev();
  d.$('#gen').click();
  assert.match(d.$('#prompt').value, /Inga ändringar/);
});

test('dev.html: ändrad text, kommentar och ny rad hamnar i prompten och sparas', () => {
  const d = dev();
  d.$('[data-tab="ohm"]').click();
  const row = d.$('tr[data-id="ohm-peka"]');
  edit(d, row.querySelector('[data-f="wrong"]'), 'Ny felanimering');
  edit(d, row.querySelector('[data-f="comment"]'), 'Tydligare pil');
  d.$('#add').click();
  const added = d.$$('tr[data-id]').at(-1);
  edit(d, added.querySelector('[data-f="name"]'), 'Min idé');
  d.$('#gen').click();
  const p = d.$('#prompt').value;
  assert.match(p, /## Resistansen/);
  assert.match(p, /Gesäll · Peka på multiplikatorn/);
  assert.match(p, /Felanimering: ".*" → "Ny felanimering"/);
  assert.match(p, /Kommentar: "Tydligare pil"/);
  assert.match(p, /Ny frågetyp under Idéer: "Min idé"/);
  // Sparas: en ny sida med samma lagring ger samma prompt
  const d2 = dev({ 'fargkoden-dev': d.g("localStorage.getItem('fargkoden-dev')") });
  d2.$('#gen').click();
  assert.equal(d2.$('#prompt').value, p);
});

test('dev.html: flytt till en annan grad och ny ordning syns i prompten', () => {
  const d = dev();
  d.g("move('ohm', 'ohm-mastare', 'ohm-peka', false)");
  d.$('#gen').click();
  const p = d.$('#prompt').value;
  assert.match(p, /flyttad från Mästare till Gesäll/);
  assert.match(p, /Ny ordning på Gesäll: .*Siffror och nollor.*Peka på multiplikatorn/);
});

test('dev.html: Visa-länken öppnar spelet på rätt ämne och grad', () => {
  const d = dev();
  d.$('[data-tab="ohm"]').click();
  const a = d.$('tr[data-id="ohm-peka"] a.show');
  assert.match(a.getAttribute('href'), /index\.html\?test=true&topic=ohm&grade=2$/);
});

test('dev.html: Återställ fungerar utan webbläsarens dialogruta: första trycket frågar på knappen, andra återställer', () => {
  const d = dev();
  d.g('window.confirm = () => false');
  d.$('[data-tab="ohm"]').click();
  edit(d, d.$('tr[data-id="ohm-peka"] [data-f="comment"]'), 'test');
  d.$('#reset').click();
  assert.match(d.$('#reset').textContent, /Säker\?/);
  assert.equal(d.g("state.rows.ohm.find(r => r.id === 'ohm-peka').comment"), 'test', 'inget händer på första trycket');
  d.$('#reset').click();
  assert.equal(d.g("state.rows.ohm.find(r => r.id === 'ohm-peka').comment"), '');
  assert.match(d.$('#reset').textContent, /^Återställ$/);
});

test('dev.html: ta bort en rad fungerar utan dialogruta', () => {
  const d = dev();
  d.g('window.confirm = () => false');
  d.$('[data-tab="ohm"]').click();
  const del = () => d.$('tr[data-id="ohm-peka"] .del');
  del().click();
  assert.ok(d.$('tr[data-id="ohm-peka"]'), 'frågar först');
  assert.match(del().textContent, /Säker\?/);
  del().click();
  assert.equal(d.$('tr[data-id="ohm-peka"]'), null);
});
