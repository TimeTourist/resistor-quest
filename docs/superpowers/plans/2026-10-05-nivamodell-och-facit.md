# Nivåmodell, inmatning och facit i knapparna – implementationsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ny nivåmodell (det nya som flerval, äldre färdigheter i svår variant, svit bara på det nya), en fast huvudknapp, inmatning ett fält i taget och facit direkt i knapparna med "Allt om motståndet" under kortet.

**Architecture:** Allt ligger i `index.html` (ett inline-script, ingen byggkedja). En ny funktion `planQuestion()` bestämmer färdighet, del, format och frågetyp för varje fråga. Kortet ritas om från tillstånd (`render()`) både före och efter svar, så facit läses ur sparade val (`S.pick`, `S.bpick`, `S.pickDir`, `S.pickSr`, `S.fieldOk`) i stället för att klassas på i DOM:en. Tester körs i Node med jsdom som laddar sidan och läser tillståndet via `window.eval`.

**Tech Stack:** Vanilla HTML/CSS/JS. Tester: `node:test` + `jsdom` (devDependency, bara för test).

**Spec:** `docs/superpowers/specs/2026-10-05-nivamodell-och-facit-design.md`

## Global Constraints

- Allt spelinnehåll och alla texter är på svenska, i samma ton som befintliga texter.
- `index.html` förblir en fristående fil som fungerar öppnad direkt i webbläsaren. Inga runtime-beroenden tillkommer.
- `UNLOCK_AT` = 5. Sparade nycklar i localStorage (`fargkoden-stars`, `fargkoden-level`, `fargkoden-mode`, `fargkoden-part`, `fargkoden-best`, `fargkoden-title`) behåller namn och format.
- Ljust och mörkt tema via befintliga CSS-variabler. Nya färger bara via `var(--ok)`, `var(--bad)`, `var(--ok-bg)`, `var(--bad-bg)`, `var(--tip-bg)`, `var(--accent)`, `var(--muted)`, `var(--line)`.
- Fungerar i 360 px bredd utan horisontell skroll.
- Animationer bara under `@media (prefers-reduced-motion:no-preference)`.
- `?test=true`-raden fungerar som förut.
- Kommentarer i koden på svenska, korta, i samma stil som omgivningen.

## Review Focus

1. **Tangentbord på Stormästare medan ett chipfält är aktivt:** siffror som skrivs ska hamna i Siffror (fältet byter), inte försvinna. Test i Task 4.
2. **Öva på Mästare med delen Temp.koeff.:** alltid sexbandsmotstånd och flerval för TK. Test i Task 2.
3. **Tips och sedan rätt på det nya:** sviten står still och raden om det frågan lär ut säger att tipset kostade. Test i Task 3.
4. **"Stanna kvar" i upplåsningsdialogen:** fokus hamnar på huvudknappen så att Enter går vidare. Test i Task 3.
5. **Byta nivå direkt efter ett svar:** "Allt om motståndet" försvinner och den nya frågan har en grå Nästa. Test i Task 3.

---

## Filöversikt

- Modify: `index.html` (allt spel: CSS, HTML, script)
- Create: `package.json` (bara `jsdom` som devDependency och `npm test`)
- Create: `.gitignore` (`node_modules/`)
- Create: `tests/harness.mjs` (laddar spelet i jsdom)
- Create: `tests/answer.mjs` (svarar på aktuell fråga som en spelare)
- Create: `tests/smoke.test.mjs`, `tests/levels.test.mjs`, `tests/flow.test.mjs`, `tests/fields.test.mjs`, `tests/annotations.test.mjs`, `tests/exam.test.mjs`, `tests/texts.test.mjs`

Radnummer nedan gäller v1.0.0 och förskjuts när du redigerar. Leta efter citerad kod, inte radnummer.

---

### Task 1: Testmiljö och röktest

**Files:**
- Create: `package.json`, `.gitignore`, `tests/harness.mjs`, `tests/smoke.test.mjs`

**Interfaces:**
- Produces: `load({storage, url})`, `atLevel(level, extraStorage)`, `ALL_OPEN` i `tests/harness.mjs`. Returvärdet `t` har `t.g(expr)` (eval i sidan), `t.$(sel)`, `t.$$(sel)` (array), `t.w` (window), `t.errors`.

- [ ] **Step 1: Skapa `package.json` och `.gitignore`**

```json
{
  "name": "fargkoden",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"tests/*.test.mjs\""
  },
  "devDependencies": {
    "jsdom": "^30.1.2"
  }
}
```

`.gitignore`:
```
node_modules/
```

Kör: `npm install`
Förväntat: `node_modules/jsdom` finns och `package-lock.json` skapas.

- [ ] **Step 2: Skapa `tests/harness.mjs`**

```js
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

// Laddar spelet i jsdom. storage fylls i localStorage innan scriptet körs.
export function load({ storage = {}, url = 'http://localhost/' } = {}) {
  const errors = [];
  const dom = new JSDOM(html, {
    url, runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
      w.addEventListener('error', e => errors.push(e.error || e.message));
    }
  });
  const w = dom.window, doc = w.document;
  return { w, doc, errors, g: expr => w.eval(expr), $: s => doc.querySelector(s), $$: s => [...doc.querySelectorAll(s)] };
}

// Alla nivåer upplåsta
export const ALL_OPEN = { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5, medium: 5, tc: 5, hard: 5 }) };
export const atLevel = (level, extra = {}) => load({ storage: { ...ALL_OPEN, 'fargkoden-level': level, ...extra } });
```

- [ ] **Step 3: Skriv röktestet `tests/smoke.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel } from './harness.mjs';

for (const lv of ['intro', 'easy', 'medium', 'tc', 'hard']) {
  test(`${lv}: 40 frågor ritas utan fel`, () => {
    const t = atLevel(lv);
    for (let i = 0; i < 40; i++) { t.g('next()'); assert.ok(t.$('#q button'), 'kortet har knappar'); }
    assert.deepEqual(t.errors, []);
  });
}

test('Eldprovet: startkortet visas', () => {
  const t = atLevel('ultra');
  assert.ok(t.$('#examStart'));
});
```

- [ ] **Step 4: Kör testerna**

Kör: `npm test`
Förväntat: 6 tester PASS (koden är oförändrad, testet fastställer utgångsläget).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore tests/harness.mjs tests/smoke.test.mjs
git commit -m "Lägg till testmiljö med jsdom och ett röktest för alla nivåer"
```

---

### Task 2: Nivåmodell och ny svitregel

**Files:**
- Modify: `index.html` (LV, S-initiering, ny modellblock efter `cleared`, `next()`, `syncModes()`, `render()` läs/bygg-grenar, `buildMC()`, `entryHTML()`, `answerRead()`, `finish()`, keydown, click-handler)
- Create: `tests/answer.mjs`, `tests/levels.test.mjs`

**Interfaces:**
- Produces (globala i sidan):
  - `SKILL_ORDER = ['dir','v','t','k','e']`, `NEW_SKILL = {intro:'dir', easy:'v', medium:'t', tc:'k', hard:'e'}`, `NEW_SHARE = 0.6`
  - `skillFormat(level, skill)` → `'new' | 'mc' | 'hard' | null`
  - `flipOK()` → boolean
  - `nextStreak(streak, ok, usedHint, counts)` → number
  - `planQuestion()` → `{skill, focus, fmt:'mc'|'hard', type:'dir'|'read'|'build'|'series', counts:boolean}`. `focus` är `'v'|'d'|'x'|'t'|'k'|'all'|null`.
  - `S.plan`, `S.flipQ`
  - `hardFocus()` → `'v'|'t'|'k'|null` (svår variant som gäller en del, annars null)
  - `bmcRight()` → index (fokus v/d) eller färgnyckel (fokus x/t/k)
- Produces (tester): `answer(t, correct)` och `until(t, pred)` i `tests/answer.mjs`.

- [ ] **Step 1: Skriv testhjälparna `tests/answer.mjs`**

```js
import assert from 'node:assert/strict';

// Går till nästa fråga tills planen uppfyller pred
export function until(t, pred, max = 800) {
  for (let i = 0; i < max; i++) {
    t.g('next()');
    if (pred(t.g('({...S.plan, n: S.n})'))) return;
  }
  throw new Error('hittade ingen sådan fråga');
}

// Svarar på aktuell fråga som en spelare, rätt eller fel
export function answer(t, correct = true) {
  const { g, $$ } = t, type = g('S.type'), fmt = g('S.plan.fmt');
  const pickBy = (sel, attr, right) => {
    const btn = $$(sel).find(b => (b.dataset[attr] === String(right)) === correct);
    assert.ok(btn, `ingen knapp ${sel}`);
    btn.click();
  };
  if (type === 'dir') return pickBy('[data-dir]', 'dir', g("S.ambig ? 'none' : S.style.flip ? 'right' : 'left'"));
  if (type === 'series') return pickBy('[data-sr]', 'sr', g('S.sr.answer'));
  if (fmt === 'mc' && type === 'read')
    return pickBy('[data-pick]', 'pick', g("S.focus + ':' + S.mc[S.focus].findIndex(x => mcEq(x, mcTruth(S.focus)))"));
  if (fmt === 'mc' && type === 'build') {
    const r = g('bmcRight()');
    if (typeof r === 'number') return pickBy('[data-vpick]', 'vpick', r);
    return g("S.focus === 'k'") ? pickBy('[data-kpick]', 'kpick', r) : pickBy('[data-tpick]', 'tpick', r);
  }
  throw new Error(`answer: ${type}/${fmt} stöds inte än`);
}
```

- [ ] **Step 2: Skriv de fallerande testerna `tests/levels.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel, load } from './harness.mjs';
import { answer, until } from './answer.mjs';

const sample = (t, k = 400) => Array.from({ length: k }, () => {
  t.g('next()');
  return t.g('({...S.plan, n: S.n, flip: !!(S.style && S.style.flip) || !!S.bflip})');
});

test('skillFormat följer trappan', () => {
  const t = atLevel('intro'), f = (lv, s) => t.g(`skillFormat('${lv}','${s}')`);
  assert.equal(f('intro', 'dir'), 'new'); assert.equal(f('intro', 'v'), null);
  assert.equal(f('easy', 'v'), 'new'); assert.equal(f('easy', 'dir'), 'mc'); assert.equal(f('easy', 't'), null);
  assert.equal(f('medium', 't'), 'new'); assert.equal(f('medium', 'v'), 'mc'); assert.equal(f('medium', 'dir'), 'hard');
  assert.equal(f('tc', 'k'), 'new'); assert.equal(f('tc', 't'), 'mc'); assert.equal(f('tc', 'v'), 'hard');
  assert.equal(f('hard', 'e'), 'new');
  for (const s of ['dir', 'v', 't', 'k']) assert.equal(f('hard', s), 'hard');
});

test('nextStreak: bara det nya räknar upp, fel nollställer, tips står still', () => {
  const t = atLevel('intro'), n = (...a) => t.g(`nextStreak(${a.join(',')})`);
  assert.equal(n(3, true, false, true), 4);
  assert.equal(n(3, true, false, false), 3);
  assert.equal(n(3, true, true, true), 3);
  assert.equal(n(3, false, false, true), 0);
  assert.equal(n(3, false, false, false), 0);
});

test('Nykomling: bara riktningsfrågor, som räknas', () => {
  for (const p of sample(atLevel('intro'), 50)) { assert.equal(p.type, 'dir'); assert.equal(p.counts, true); }
});

test('Lärling: resistans räknas, riktning är flerval som inte räknas, inga vända motstånd', () => {
  const ps = sample(atLevel('easy'));
  for (const p of ps) {
    assert.ok(['v', 'dir'].includes(p.skill));
    assert.equal(p.fmt, 'mc');
    assert.equal(p.counts, p.skill === 'v');
    // Riktningsfrågor har alltid ett vänt eller rättvänt motstånd, men läs- och byggfrågor vänds inte här
    if (p.type !== 'dir') assert.equal(p.flip, false);
    if (p.skill === 'v') assert.ok(['v', 'd', 'x'].includes(p.focus));
  }
  const share = ps.filter(p => p.skill === 'v').length / ps.length;
  assert.ok(share > 0.5 && share < 0.7, `andel nytt ${share}`);
});

test('Gesäll: tolerans räknas, resistans som flerval, vända motstånd förekommer', () => {
  const ps = sample(atLevel('medium'));
  for (const p of ps) {
    assert.ok(['t', 'v'].includes(p.skill));
    assert.equal(p.fmt, 'mc');
    assert.equal(p.counts, p.skill === 't');
    assert.notEqual(p.type, 'dir');
  }
  assert.ok(ps.some(p => p.flip), 'minst ett vänt motstånd');
});

test('Mästare: TK på sexband, tolerans som flerval, resistans i svår variant', () => {
  for (const p of sample(atLevel('tc'))) {
    assert.ok(['k', 't', 'v'].includes(p.skill));
    if (p.skill === 'k') { assert.equal(p.n, 6); assert.equal(p.fmt, 'mc'); assert.equal(p.counts, true); }
    if (p.skill === 't') { assert.equal(p.fmt, 'mc'); assert.equal(p.counts, false); }
    if (p.skill === 'v') { assert.equal(p.fmt, 'hard'); assert.equal(p.counts, false); }
  }
});

test('Stormästare: E-serie som flerval eller hela motstånd i svår variant, allt räknas', () => {
  for (const p of sample(atLevel('hard'))) {
    assert.equal(p.counts, true);
    if (p.type === 'series') assert.equal(p.fmt, 'mc');
    else { assert.equal(p.focus, 'all'); assert.equal(p.fmt, 'hard'); assert.ok(['read', 'build'].includes(p.type)); }
  }
});

test('Öva: formatet följer nivån', () => {
  const tc = atLevel('tc', { 'fargkoden-mode': 'practice', 'fargkoden-part': 'v' });
  for (const p of sample(tc, 30)) { assert.equal(p.focus, 'v'); assert.equal(p.fmt, 'hard'); }
  const md = atLevel('medium', { 'fargkoden-mode': 'practice', 'fargkoden-part': 'v' });
  for (const p of sample(md, 30)) { assert.equal(p.focus, 'v'); assert.equal(p.fmt, 'mc'); }
});

test('Öva på Mästare, Temp.koeff.: alltid sexband och flerval', () => {
  const t = atLevel('tc', { 'fargkoden-mode': 'practice', 'fargkoden-part': 'k' });
  for (const p of sample(t, 40)) { assert.equal(p.n, 6); assert.equal(p.fmt, 'mc'); assert.equal(p.focus, 'k'); }
});

test('Gesäll: rätt på gammalt står still, rätt på nytt räknar upp, fel nollställer', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't'); answer(t, true); assert.equal(t.g('S.streak'), 1);
  until(t, p => p.skill === 'v'); answer(t, true); assert.equal(t.g('S.streak'), 1);
  until(t, p => p.skill === 't'); answer(t, true); assert.equal(t.g('S.streak'), 2);
  until(t, p => p.skill === 'v'); answer(t, false); assert.equal(t.g('S.streak'), 0);
});

test('5 i rad på det nya låser upp nästa nivå', () => {
  const t = load({ storage: { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5 }), 'fargkoden-level': 'medium' } });
  for (let i = 0; i < 5; i++) { until(t, p => p.skill === 't'); answer(t, true); }
  assert.equal(t.g('S.lvBest.medium'), 5);
  assert.equal(t.g('unlocked("tc")'), true);
});
```

- [ ] **Step 3: Kör och se att de fallerar**

Kör: `npm test`
Förväntat: `levels.test.mjs` FAIL med `skillFormat is not defined` (och liknande).

- [ ] **Step 4: Lägg in nivåmodellen**

I `index.html`, ersätt `LV`:
```js
const LV = {
  intro:{choice:true, varied:true, flip:false},
  ...
  ultra:{choice:false, varied:true, flip:true}
};
```
med:
```js
// varied: motstånden ser olika ut (kroppsfärg, form, nyans)
const LV = {
  intro:{varied:true}, easy:{varied:false}, medium:{varied:true},
  tc:{varied:true}, hard:{varied:true}, ultra:{varied:true}
};
```

Ta bort `const xFocus = ...` och kommentaren ovanför (`// focus som gäller i Stormästare-frågor ...`).

I `const S = {level:'intro',kind:'mix',...` ta bort `kind:'mix',`.

Direkt efter raden `const cleared = lv => ...` lägg in:
```js
// Nivåmodell: varje nivå lär ut en ny färdighet. Förra nivåns färdighet kommer som flerval,
// äldre färdigheter i svår variant (knappsats, hela listan, palett, vända motstånd).
const SKILL_ORDER = ['dir','v','t','k','e'];
const NEW_SKILL = {intro:'dir', easy:'v', medium:'t', tc:'k', hard:'e'};
const NEW_SHARE = 0.6;
// 'new', 'mc', 'hard' eller null (färdigheten kommer först senare)
function skillFormat(level, skill){
  if (level === 'ultra') return 'hard';
  // Stormästare: allt i svår variant utom E-serien, som är nivåns nya färdighet
  if (level === 'hard') return skill === 'e' ? 'new' : 'hard';
  const li = ORDER.indexOf(level), si = SKILL_ORDER.indexOf(skill);
  return si > li ? null : si === li ? 'new' : si === li - 1 ? 'mc' : 'hard';
}
// Vända motstånd i läs- och byggfrågor när läsriktningen är två nivåer gammal
const flipOK = () => skillFormat(S.level, 'dir') === 'hard';
// Bara rätt på det nya räknar upp. Fel på vad som helst nollställer. Rätt med tips står still.
const nextStreak = (streak, ok, usedHint, counts) => !ok ? 0 : counts && !usedHint ? streak + 1 : streak;
// Vad nästa fråga gäller: färdighet, del, format och frågetyp
function planQuestion(){
  const lv = S.level;
  if (lv === 'ultra') return {skill:'all', focus:'all', fmt:'hard', type:S.examItem.t, counts:false};
  if (partActive()) {
    const skill = ['d','x'].includes(S.part) ? 'v' : S.part;
    const fmt = skillFormat(lv, skill) === 'hard' ? 'hard' : 'mc';
    return {skill, focus: skill === 'e' ? null : S.part, fmt, type: skill === 'e' ? 'series' : rnd(['read','build']), counts:true};
  }
  if (lv === 'intro') return {skill:'dir', focus:null, fmt:'mc', type:'dir', counts:true};
  if (lv === 'hard') return Math.random() < 0.4
    ? {skill:'e', focus:null, fmt:'mc', type:'series', counts:true}
    : {skill:'all', focus:'all', fmt:'hard', type:rnd(['read','build']), counts:true};
  const fresh = NEW_SKILL[lv];
  // Riktning i svår variant är ingen egen fråga, den syns som vända motstånd
  const old = SKILL_ORDER.filter(s => s !== fresh && (skillFormat(lv, s) === 'mc' || (skillFormat(lv, s) === 'hard' && s !== 'dir')));
  const skill = !old.length || Math.random() < NEW_SHARE ? fresh : rnd(old);
  const fmt = skillFormat(lv, skill) === 'hard' ? 'hard' : 'mc';
  if (skill === 'dir') return {skill, focus:null, fmt, type:'dir', counts:false};
  const focus = skill === 'v' && lv === 'easy' ? rnd(['v','d','x']) : skill;
  return {skill, focus, fmt, type:rnd(['read','build']), counts: skill === fresh};
}
// Svår variant som gäller en del (Mästare: resistans, Öva på Stormästare), annars null
const hardFocus = () => S.plan && S.plan.fmt === 'hard' && S.focus !== 'all' ? S.focus : null;
```

- [ ] **Step 5: Styr `next()` med planen**

I `next()`, ersätt raderna från `S.examItem = ...` till och med `S.build = Array(n).fill(null); S.slot = 0; S.eCase = false;` med:
```js
  S.examItem = S.level === 'ultra' ? S.exam.queue[S.exam.i] : null;
  S.plan = planQuestion();
  S.type = S.plan.type; S.focus = S.plan.focus;
  const n = S.examItem && S.examItem.n ? S.examItem.n : S.focus === 'k' ? 6 : pickN(), L = LV[S.level];
  S.n = n; S.q = genBands(n);
  S.answered = false; S.mc = null; S.bopts = null; S.parts = null; S.mark = null; S.ambig = false; S.bflip = false;
  S.usedHint = false; S.hintsUsed = new Set(); S.hintOut = ''; S.palOrder = {}; S.palAll = null; S.entry = newEntry();
  S.vText = valueNotation(valueOf(S.q));
  S.flipQ = flipOK() && S.type !== 'dir' && Math.random() < 0.5;
  S.build = Array(n).fill(null); S.slot = 0; S.eCase = false;
```

Ersätt sedan:
```js
  if (S.level === 'ultra' && S.type === 'build') S.bflip = Math.random() < 0.5;
  const xf = xFocus();
  if (xf && S.type === 'build') {
    const k0 = nd(S.q), ask = xf === 'v' ? [...Array(k0 + 1).keys()] : xf === 't' ? [k0 + 1] : [5];
```
med:
```js
  S.bflip = S.type === 'build' && S.plan.fmt === 'hard' && S.flipQ;
  const hf = hardFocus();
  if (hf && S.type === 'build') {
    const k0 = nd(S.q), ask = hf === 'v' ? [...Array(k0 + 1).keys()] : hf === 't' ? [k0 + 1] : [5];
```

Och sist i `next()` ersätt:
```js
    S.style = L.varied ? variedStyle(S.q, L.flip && S.type === 'read' && Math.random() < 0.5) : stdStyle(n);
```
med:
```js
    const fl = S.type === 'read' && S.flipQ;
    S.style = L.varied ? variedStyle(S.q, fl) : {...stdStyle(n), flip: fl};
```

Ta bort `const seriesOK = ...` och kommentaren ovanför. I `syncModes()` ta bort raden `S.kind = S.level === 'intro' ? 'dir' : 'mix';`.

- [ ] **Step 6: Rita läs- och byggfrågor utifrån planen**

I `render()`, ersätt hela grenen `} else if (S.type === 'read') { ... }` med:
```js
  } else if (S.type === 'read') {
    const rq = {v:'Vilken resistans har motståndet?', t:'Vilken tolerans har motståndet?', k:'Vilken temperaturkoefficient har motståndet?',
      d:'Vilka siffror visar motståndet?', x:'Vilken multiplikator har motståndet?', all:'Vilket värde har motståndet?'}[S.focus];
    h += `<p class="prompt">${rq}</p><div class="res">${svg(S.q,{style:S.style, mark:S.mark})}</div>${hintsHTML()}`;
    h += S.plan.fmt === 'hard' ? entryHTML() : mcHTML();
    if (S.n === 6 && S.level === 'medium') h += '<p class="gnote">Sjätte bandet är temperaturkoefficienten. Den behöver du inte kunna på den här nivån.</p>';
  } else {
```

I byggrenen (den som börjar med `const oneB = ...`), ersätt raderna från `const oneB` till och med `h += \`<p class="prompt">${bq}</p>...${hintsHTML()}\`;` med:
```js
    const bq = {v:'Vilket motstånd har värdet', all:'Vilket motstånd har värdet', t:'Vilket toleransband ger', k:'Vilket sjätte band ger',
      d:'Vilka band ger siffrorna', x:'Vilket band ger multiplikatorn'}[S.focus];
    const big = S.level === 'ultra' ? `${S.vText} ${fmtTol(t)}${tc != null ? `<span class="tc">${fmtTc(tc)}</span>` : ''}`
      : {v:fmtVal(v), t:fmtTol(t), k:fmtTc(tc), d:digitStr(S.q).split('').join(' '), x:fmtMult(C[S.q[nd(S.q)]].m),
         all:`${fmtVal(v)} ${fmtTol(t)}${tc != null ? `<span class="tc">${fmtTc(tc)}</span>` : ''}`}[S.focus];
    h += `<p class="prompt">${bq}</p><p class="big">${big}</p>${hintsHTML()}`;
```
och ersätt
```js
    if (oneB) {
      h += bmcHTML();
    } else if (L.choice) {
      ...
    } else {
```
(hela `else if (L.choice) { ... }`-blocket med `S.opts`/`S.optStyles`) med:
```js
    if (S.plan.fmt !== 'hard') {
      h += bmcHTML();
    } else {
```

I `render()` ta också bort `L = LV[S.level],` ur första raden om `L` inte längre används (`const q = document.getElementById('q'), n = S.n;`).

- [ ] **Step 7: Flervalen räknar delar utifrån fokus, inte nivå**

I `buildMC()` ersätt de tre raderna för `d`, `x`, `k`:
```js
    d: S.focus === 'd' ? shuffle([digitStr(b), ...digitDistractors(b).map(digitStr)]) : null,
    x: S.focus === 'x' ? shuffle([C[b[nd(b)]].m, ...multChoices(b).filter(c => c !== b[nd(b)]).map(c => C[c].m)]) : null,
    k: tc != null ? shuffle([tc, ...pickWrong([100, 50, 25, 15, 10, 5, 250, 20, 1], tc, 3)]) : null
```

Lägg till efter `answerBMC` (före `function tcFact`):
```js
// Rätt val i byggflervalet: index för motståndsbilder (v, d), färg för ett enskilt band (x, t, k)
function bmcRight(){
  const k = nd(S.q);
  if (S.focus === 'd') return S.bopts.d.findIndex(o => o.join() === S.q.slice(0, k).join());
  if (S.focus === 'v') return S.bopts.v.findIndex(o => o.join() === S.q.slice(0, k+1).join());
  return S.focus === 'x' ? S.q[k] : S.focus === 'k' ? S.q[5] : S.q[k+1];
}
```

- [ ] **Step 8: Ersätt `xFocus()` i inmatningen**

I `entryHTML()` och `answerRead()`: byt varje `xFocus()` mot `hardFocus()`. I `answerRead()` heter grenen `} else if (xFocus()) {` → `} else if (hardFocus()) {` och `const xf = xFocus();` → `const xf = hardFocus();`.

I keydown-lyssnaren, ersätt
```js
  const typing = S.type === 'read' && !LV[S.level].choice && !S.answered && !e.ctrlKey && !e.metaKey && !e.altKey;
```
med
```js
  const typing = S.type === 'read' && S.plan && S.plan.fmt === 'hard' && !S.answered && !e.ctrlKey && !e.metaKey && !e.altKey;
```
och `if (S.type === 'read' && !LV[S.level].choice) answerRead();` med `if (S.type === 'read' && S.plan.fmt === 'hard') answerRead();`.

I click-lyssnaren, ta bort hela grenen `if (btn.dataset.opt != null) { ... }` och gör nästa `else if (btn.id === 'examStart')` till `if (btn.id === 'examStart')`. Ta bort grenarna för `btn.id === 'bSubmit'` och `btn.id === 'mcSubmit'` (de knapparna finns inte).

- [ ] **Step 9: Ny svitregel i `finish()`**

Ersätt
```js
  if (ok) { S.right++; if (!S.usedHint) S.streak++; } else S.streak = 0;
```
med
```js
  if (ok) S.right++;
  S.streak = nextStreak(S.streak, ok, S.usedHint, S.plan.counts);
```
I samma funktion, ersätt `L.choice`-villkoren så att facit fungerar tills Task 3 skriver om det:
- `(!ok && S.type==='build' && !L.choice && bandsValid(readBuild()))` → `(!ok && S.type==='build' && S.plan.fmt === 'hard' && bandsValid(readBuild()))`
- `(!ok && S.type==='build' && (!L.choice || S.level === 'medium'))` → `(!ok && S.type==='build')`

- [ ] **Step 10: Kör testerna**

Kör: `npm test`
Förväntat: alla PASS, även röktestet.

Kontrollera att inget gammalt finns kvar:
Kör: `grep -nE "xFocus|L\.choice|S\.kind|seriesOK|data-opt|S\.opts|optStyles" index.html`
Förväntat: ingen träff.

- [ ] **Step 11: Commit**

```bash
git add index.html tests/answer.mjs tests/levels.test.mjs
git commit -m "Ny nivåmodell: det nya som flerval, äldre färdigheter svårare, sviten räknar bara det nya"
```

---

### Task 3: Huvudknapp och facit ritat från tillstånd

**Files:**
- Modify: `index.html` (CSS, HTML efter `#q`, svarshanterare, `mcHTML`, `bmcHTML`, `render`, `finish`, `afterFeedback`, keydown, click, `next`, `showExamCard`, `entryHTML`)
- Create: `tests/flow.test.mjs`

**Interfaces:**
- Consumes: `S.plan`, `nextStreak`, `bmcRight`, `hardFocus` (Task 2).
- Produces:
  - `markCls(isRight, isPicked)` → `''|' ok'|' bad'|' chosen'`
  - `needsSubmit()`, `entryReady()` → boolean
  - `mainBtnHTML()`, `lessonText()`, `lessonHTML()`, `moreHTML()`, `seriesWhy()` → string
  - Tillstånd: `S.ok`, `S.pick` (finns), `S.bpick`, `S.pickDir`, `S.pickSr`
  - DOM: `#main` (huvudknappen), `#more` (Allt om motståndet), `.lesson`

- [ ] **Step 1: Skriv de fallerande testerna `tests/flow.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel, load } from './harness.mjs';
import { answer, until } from './answer.mjs';

const enter = t => t.doc.body.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

test('Nästa är grå före svar och aktiv efter, på samma plats', () => {
  const t = atLevel('medium');
  until(t, p => p.type === 'read');
  assert.equal(t.$('#main').textContent, 'Nästa');
  assert.equal(t.$('#main').disabled, true);
  answer(t, true);
  assert.equal(t.$('#main').disabled, false);
  assert.equal(t.doc.activeElement, t.$('#main'));
});

test('Fel svar: valt blir rött, rätt blir grönt, alternativen är låsta', () => {
  const t = atLevel('medium');
  until(t, p => p.type === 'read');
  answer(t, false);
  assert.equal(t.$$('#q .opt.bad').length, 1);
  assert.equal(t.$$('#q .opt.ok').length, 1);
  assert.ok(t.$$('#q .opt').every(b => b.disabled));
});

test('Rätt svar: bara grönt', () => {
  const t = atLevel('medium');
  until(t, p => p.type === 'build');
  answer(t, true);
  assert.equal(t.$$('#q .opt.bad').length, 0);
  assert.equal(t.$$('#q .opt.ok').length, 1);
});

test('Raden om det frågan lär ut och Allt om motståndet visas först efter svar', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'read');
  assert.equal(t.$('.lesson'), null);
  assert.equal(t.$('#more').hidden, true);
  answer(t, true);
  assert.match(t.$('.lesson').textContent, /Toleransbandet är/);
  assert.equal(t.$('#more').hidden, false);
  assert.match(t.$('#more').textContent, /Allt om motståndet/);
});

test('Enter efter svar ger nästa fråga', () => {
  const t = atLevel('easy');
  until(t, p => p.type === 'read');
  answer(t, true);
  enter(t);
  assert.equal(t.g('S.answered'), false);
  assert.equal(t.$('#main').disabled, true);
});

test('Riktning och E-serie markeras också', () => {
  const t = atLevel('intro');
  t.g('next()'); answer(t, false);
  assert.equal(t.$$('[data-dir].bad').length, 1); assert.equal(t.$$('[data-dir].ok').length, 1);
  const h = atLevel('hard');
  until(h, p => p.type === 'series'); answer(h, false);
  assert.equal(h.$$('[data-sr].bad').length, 1); assert.equal(h.$$('[data-sr].ok').length, 1);
});

test('Stormästare läs: Svara är grå tills allt är ifyllt', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  assert.equal(t.$('#main').textContent, 'Svara');
  assert.equal(t.$('#main').disabled, true);
  t.g("S.entry = {...S.entry, v:'47', mult:100, tol:5, tc:50}; render()");
  assert.equal(t.$('#main').disabled, false);
});

test('Tips och sedan rätt: sviten står still och raden säger att tipset kostade', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't');
  t.$('[data-hint]').click();
  answer(t, true);
  assert.equal(t.g('S.streak'), 0);
  assert.match(t.$('.lesson').textContent, /Tipset kostade/);
});

test('Stanna kvar i upplåsningsdialogen ger fokus till huvudknappen', () => {
  const t = load({ storage: { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5 }), 'fargkoden-level': 'medium' } });
  for (let i = 0; i < 5; i++) { until(t, p => p.skill === 't'); answer(t, true); }
  assert.equal(t.$('#unlockDlg').hidden, false);
  t.$('#dlgStay').click();
  assert.equal(t.doc.activeElement, t.$('#main'));
});

test('Byta nivå efter svar: Allt om motståndet försvinner och Nästa är grå', () => {
  const t = atLevel('medium');
  until(t, p => p.type === 'read');
  answer(t, true);
  t.$('[data-level="tc"]').click();
  assert.equal(t.$('#more').hidden, true);
  assert.equal(t.$('#main').disabled, true);
});

test('Eldprovet: valet markeras men inget rätt/fel och inget Allt om motståndet', () => {
  const t = atLevel('ultra');
  t.$('#examStart').click();
  t.g("S.exam.queue[S.exam.i] = {t:'series'}; next()");
  answer(t, false);
  assert.equal(t.$$('#q .ok, #q .bad').length, 0);
  assert.equal(t.$$('#q .chosen').length, 1);
  assert.equal(t.$('#more').hidden, true);
});
```

- [ ] **Step 2: Kör och se att de fallerar**

Kör: `npm test`
Förväntat: `flow.test.mjs` FAIL (t.ex. `#main` saknas).

- [ ] **Step 3: HTML och CSS**

Efter `<section class="card" id="q" aria-live="polite"></section>` lägg till:
```html
  <section class="more" id="more" aria-label="Allt om motståndet" hidden></section>
```

I CSS, ta bort reglerna `.feedback{...}`, `.feedback.ok`, `.feedback.bad`, `.feedback.tip`, `.feedback h2`, `.feedback p`, `.cost`, `.parts`, `.parts li`, och ersätt `.feedback{animation:pop .18s ease-out}` i reduced-motion-blocket med `.lesson{animation:pop .18s ease-out}`. Lägg till (efter `.hint{...}`):
```css
.lesson{margin:14px 0 0;border-radius:10px;padding:10px 14px;line-height:1.45}
.lesson.ok{background:var(--ok-bg)}
.lesson.bad{background:var(--bad-bg)}
.lesson.tip{background:var(--tip-bg)}
.more{margin-top:16px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px 20px}
.more[hidden]{display:none}
.more h2{font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-size:1.5rem;line-height:1.1;margin:0 0 8px}
.more p{margin:0 0 6px}
.opt.chosen{border-color:var(--accent);box-shadow:inset 0 0 0 1.5px var(--accent)}
```

- [ ] **Step 4: Spara valen i stället för att klassa DOM:en**

Lägg till före `function mcHTML()`:
```js
// Facit i knapparna: rätt svar grönt, fel val rött. I Eldprovet markeras bara valet.
function markCls(isRight, isPicked){
  if (!S.answered) return '';
  if (S.level === 'ultra') return isPicked ? ' chosen' : '';
  return isRight ? ' ok' : isPicked ? ' bad' : '';
}
const disAttr = () => S.answered ? ' disabled' : '';
```

Ersätt `mcHTML()`:
```js
function mcHTML(){
  if (!S.mc) { S.mc = buildMC(); S.pick = {v:null, t:null, k:null, d:null, x:null}; }
  const g = S.focus, right = S.mc[g].findIndex(x => mcEq(x, mcTruth(g)));
  return `<div class="mcgroup"><div class="opts mc">${S.mc[g].map((x,i) =>
    `<button class="opt${markCls(i === right, S.pick[g] === i)}" data-pick="${g}:${i}"${disAttr()}>${mcFmt(g, x)}</button>`).join('')}</div></div>`;
}
```
(Etiketten `grp-lbl` ovanför tas bort: den upprepade frågan.)

Ersätt `answerMC()`:
```js
function answerMC(){
  if (S.answered) return;
  const g = S.focus;
  finish(mcEq(S.mc[g][S.pick[g]], mcTruth(g)));
}
```

I `bmcHTML()`: lägg först i funktionen (efter `if (!S.bopts) {...}`):
```js
  const right = bmcRight(), st = {...stdStyle(S.n), flip: S.flipQ};
  const imgBtn = (o, i, lab) => `<button class="opt r${markCls(i === right, S.bpick === i)}" data-vpick="${i}"${disAttr()}>${svg(o, {style: st, label: lab})}</button>`;
  const colBtn = (c, attr) => `<button class="opt bc${markCls(c === right, S.bpick === c)}" data-${attr}="${c}"${disAttr()}><span class="sw" style="${swStyle(c)}"></span>${C[c].n}</button>`;
```
och byt i varje gren:
- `svg(blank0(k).concat(S.q.slice(k)), {label:..., mark:S.mark})` → lägg till `style: st` i options (gör samma för de tre andra `svg(...)` för målmotståndet: `{style: st, label: ..., mark: S.mark}`).
- Bildknapparna `\`<button class="opt r" data-vpick="${i}">${svg(...)}</button>\`` → `imgBtn(o.concat(blank0(S.n - k)), i, 'Sifferband: ' + colorNames(o))` för d, och `imgBtn(o.concat(blank(S.n - k - 1)), i, 'Resistansband: ' + colorNames(o))` för v.
- Färgknapparna för x och t (`data-tpick`) → `colBtn(c, 'tpick')`, för k (`data-kpick`) → `colBtn(c, 'kpick')`.
- Ta bort raderna `<p class="grp-lbl">...</p>` i varje grupp.

Ersätt `answerBMC()`:
```js
function answerBMC(pick){
  if (S.answered) return;
  S.bpick = pick;
  finish(pick === bmcRight());
}
```

I click-lyssnaren:
- Serie-grenen: ersätt de tre raderna efter `if (S.answered) return;` med `S.pickSr = btn.dataset.sr; finish(btn.dataset.sr === S.sr.answer);`
- Riktnings-grenen: ersätt med
```js
    const right = S.ambig ? 'none' : S.style.flip ? 'right' : 'left';
    S.pickDir = btn.dataset.dir; finish(btn.dataset.dir === right);
```
- Ersätt grenarna `btn.id === 'submit'` och `btn.id === 'next'` med:
```js
  } else if (btn.id === 'main') {
    if (S.answered) next(); else if (needsSubmit()) answerRead();
```

I `next()` lägg till i nollställningsraden: `S.bpick = null; S.pickDir = null; S.pickSr = null; S.ok = null;`.

I `render()`, serie-grenen: knapparna blir
```js
`<button class="opt${markCls(k === S.sr.answer, S.pickSr === k)}" data-sr="${k}"${disAttr()}>${k === 'none' ? 'Inte standard' : k}</button>`
```
riktnings-grenen: varje `data-dir`-knapp får `class="opt${markCls(right === 'left', S.pickDir === 'left')}"` osv. med `const right = S.ambig ? 'none' : S.style.flip ? 'right' : 'left';` överst i grenen, samt `${disAttr()}`. (Behåll `wide` på none-knappen: `class="opt wide${markCls(...)}"`.)

Palettgrenen: `.slot` och `.pc` får `${disAttr()}` (slots behåller `disabled` för låsta). I `entryHTML()`: `keyBtn` får `dis || S.answered`, `ebox`-knapparna får `${disAttr()}`, och ta bort `<button class="primary" id="submit">Svara</button>` ur sista raden.

- [ ] **Step 5: Huvudknapp, rad om det frågan lär ut, Allt om motståndet**

Lägg till före `function render()`:
```js
// Huvudknappen: samma plats i varje fråga. Svara där svaret måste bekräftas, annars Nästa (grå tills man svarat).
const needsSubmit = () => S.type === 'read' && S.plan.fmt === 'hard';
function entryReady(){
  const E = S.entry;
  if (S.level === 'ultra') return E.v !== '' && E.t !== '' && (S.n !== 6 || E.k !== '');
  const hf = hardFocus();
  if (hf === 't') return E.tol != null;
  if (hf === 'k') return E.tc != null;
  const v = E.v !== '' && E.mult != null;
  return hf === 'v' ? v : v && E.tol != null && (S.n !== 6 || E.tc != null);
}
function mainBtnHTML(){
  if (S.answered) return `<button class="primary" id="main">${S.level === 'ultra' && S.exam && S.exam.done ? 'Se resultatet' : 'Nästa'}</button>`;
  if (needsSubmit()) return `<button class="primary" id="main"${entryReady() ? '' : ' disabled'}>Svara</button>`;
  return '<button class="primary" id="main" disabled>Nästa</button>';
}
```

Ersätt `srFeedback()` med:
```js
// E-serie: varför svaret blev som det blev
function seriesWhy(){
  const r = S.sr, tol = bandsTol(r.bands), ser = TOL_SER[tol], inAny = seriesOf(r.m3);
  return r.answer === 'none'
    ? (inAny.length
      ? `${fmtTol(tol)} hör till ${ser}, men ${mantTxt(r.m3)} finns inte i ${ser} (det finns först i ${inAny[0]}). Med den här toleransen är värdet alltså inte standard.`
      : `${mantTxt(r.m3)} finns inte i någon standardserie, så värdet är inte standard.`)
    : `${fmtTol(tol)} hör till ${ser}, och ${mantTxt(r.m3)} finns i ${ser}.`;
}
```

Ersätt hela `finish()` med:
```js
function finish(ok){
  S.answered = true; S.ok = ok; S.total++;
  if (ok) S.right++;
  S.streak = nextStreak(S.streak, ok, S.usedHint, S.plan.counts);
  if (S.streak > S.best) { S.best = S.streak; save('fargkoden-best', S.best); }
  const prevLv = S.lvBest[S.level] || 0;
  S.unlockedNow = null;
  if (S.mode === 'play' && S.level !== 'ultra' && S.streak > prevLv) {
    S.lvBest[S.level] = S.streak; save('fargkoden-stars', JSON.stringify(S.lvBest));
    const nx = ORDER[ORDER.indexOf(S.level) + 1];
    if (prevLv < UNLOCK_AT && S.streak >= UNLOCK_AT && nx && nx !== 'ultra') S.unlockedNow = nx;
  }
  if (S.level === 'ultra' && S.exam && !S.exam.done) recordExam(ok);
  render();
  document.getElementById('main').focus({preventScroll:true});
  afterFeedback();
}
const fbClass = ok => !ok ? 'bad' : S.usedHint ? 'tip' : 'ok';
const fbHead = ok => !ok ? 'Inte riktigt.' : S.usedHint ? 'Rätt, men med tips.' : 'Rätt!';
// En rad om det frågan lär ut
function lessonText(){
  const b = S.q, k = nd(b), name = c => C[c].n.toLowerCase();
  if (S.type === 'dir') return directionText(b, S.style);
  if (S.type === 'series') return seriesWhy();
  const t = {
    v: `${digitStr(b)} ${fmtMult(C[b[k]].m)} = ${fmtVal(valueOf(b))}.`,
    d: `Sifferbanden ${b.slice(0, k).map(name).join('–')} ger ${digitStr(b).split('').join(' ')}.`,
    x: `Multiplikatorbandet är ${name(b[k])}, alltså ${fmtMult(C[b[k]].m)}.`,
    t: `Toleransbandet är ${name(b[k+1])}, alltså ${fmtTol(tolOf(b))}.`,
    k: `Sjätte bandet är ${name(b[5])}, alltså ${fmtTc(tcOf(b))}.`,
    all: `${digitStr(b)} ${fmtMult(C[b[k]].m)} = ${fmtAll(b)}.`
  }[S.focus];
  const flipped = (S.type === 'read' && S.style.flip) || S.bflip ? ' Motståndet satt vänt, så det läses från höger.' : '';
  const turned = S.bflip && !S.ok && S.build.join() === b.join() ? ' Du hade rätt färger men byggde åt fel håll: det breda toleransbandet satt till vänster, så Band 1 var slutet.' : '';
  return t + flipped + turned;
}
function lessonHTML(){
  if (!S.answered || S.level === 'ultra') return '';
  const cost = S.ok && S.usedHint ? ` Tipset kostade: sviten står kvar på ${S.streak}.` : '';
  return `<p class="lesson ${fbClass(S.ok)}" role="status"><b>${fbHead(S.ok)}</b> ${lessonText()}${cost}</p>`;
}
// Allt om motståndet, under kortet
function moreHTML(){
  if (!S.answered || S.level === 'ultra') return '';
  let h = '<h2>Allt om motståndet</h2>';
  if (S.type === 'series') {
    const r = S.sr, tol = bandsTol(r.bands);
    return h + `<div class="res">${svg(r.bands, {style: styleFor(r.bands), label: 'Motstånd: ' + colorNames(r.bands)})}</div>
      <p>Motståndet är ${colorNames(r.bands)}, alltså ${fmtVal(r.v)} ${fmtTol(tol)}${r.bands.length === 3 ? ' (tre band, inget toleransband)' : ''}.</p>
      ${meterFB(r.v, tol)}
      <p class="dir">Toleransen avgör serien: ±20 % E6, ±10 % E12, ±5 % E24, ±2 % E48, ±1 % E96. Sedan kollar du om värdet finns i den serien.</p>`;
  }
  const b = S.q, n = b.length, k = nd(b), v = valueOf(b), t = tolOf(b), tc = tcOf(b);
  const chips = b.map((c,i) => `<li><span class="sw" style="${swStyle(c)}"></span>${C[c].n} ${bandDetail(c, roleOf(n,i))}</li>`).join('');
  const st = S.type === 'build' ? stdStyle(n) : {...S.style, flip:false};
  h += `<div class="res">${svg(b, {style: st, label: 'Motståndet rättvänt: ' + colorNames(b)})}</div>
    <p class="calc">${digitStr(b)} ${fmtMult(C[b[k]].m)} = ${fmtVal(v)}, ${fmtTol(t)}${tc != null ? ', ' + fmtTc(tc) : ''}</p>
    <ul class="chips">${chips}</ul>
    ${meterFB(v, t)}
    <p class="dir">${stdInfo(b)}</p>`;
  if (n === 6) h += `<p class="dir">${tcFact(b)}</p>`;
  if (S.type === 'read' && LV[S.level].varied) h += `<p class="dir">${directionText(b, S.style)}</p>`;
  return h;
}
```

Ta bort `tipCost`, `showFeedback`, `easyFull` och `partsHTML` (de används inte längre).

I `render()`, ersätt `h += \`<div id="fb"></div>\`;` och `q.innerHTML = h;` med:
```js
  h += lessonHTML() + mainBtnHTML();
  q.innerHTML = h;
  const more = document.getElementById('more');
  more.innerHTML = moreHTML(); more.hidden = !more.innerHTML;
```

I `showExamCard()`, efter `q.innerHTML = h;` lägg till `document.getElementById('more').hidden = true;`.

I `afterFeedback()`: ta bort raden `if (S.level === 'ultra' && S.exam && S.exam.done) document.getElementById('next').textContent = 'Se resultatet';`, och byt `document.getElementById('next')?.focus(...)` mot `document.getElementById('main')?.focus({preventScroll:true})`.

I keydown-lyssnaren, ersätt de två sista raderna med:
```js
  if (S.answered) { next(); return; }
  if (needsSubmit() && entryReady()) answerRead();
```

Sist i `next()` (efter `render();`):
```js
  // Ingen automatisk skroll efter svar. Har man skrollat ner till Allt om motståndet tas kortet tillbaka i bild.
  const card = document.getElementById('q');
  if (card.getBoundingClientRect().top < 0 && card.scrollIntoView) card.scrollIntoView({block:'start', behavior: reduceMotion() ? 'auto' : 'smooth'});
```

- [ ] **Step 6: Kör testerna**

Kör: `npm test`
Förväntat: alla PASS.

Kör: `grep -nE "showFeedback|srFeedback|easyFull|partsHTML|tipCost|id=\"fb\"|getElementById\('next'\)|id=\"submit\"" index.html`
Förväntat: ingen träff.

- [ ] **Step 7: Commit**

```bash
git add index.html tests/flow.test.mjs
git commit -m "Fast huvudknapp i kortet, facit i knapparna och Allt om motståndet under kortet"
```

---

### Task 4: Inmatning ett fält i taget och facit i rutor och band

**Files:**
- Modify: `index.html` (CSS, `entryHTML` → bara Eldprovet, ny `fieldsHTML`, `answerRead`, `entryReady`, `keyPress`, keydown, click, palettgrenen i `render`)
- Modify: `tests/answer.mjs` (svår variant)
- Create: `tests/fields.test.mjs`

**Interfaces:**
- Consumes: `markCls`, `disAttr`, `entryReady`, `needsSubmit`, `hardFocus` (Task 2–3).
- Produces: `entryFields()` → array av `'v'|'x'|'t'|'k'`; `fieldFilled(f)`; `fieldTruth(f)`; `fieldsHTML()`; `digitsIn()`; `truthAt(i)`; tillstånd `S.fieldOk = {v?, x?, t?, k?}`; knappar `data-field`, `data-fval`, `data-key`.

- [ ] **Step 1: Utöka `answer()` i `tests/answer.mjs` för svår variant**

Före `throw new Error(...)` lägg till:
```js
  if (fmt === 'hard' && type === 'read' && g('S.level') !== 'ultra') {
    const fs = Array.from(g('entryFields()'));
    fs.forEach((f, j) => {
      const wrong = !correct && j === 0;
      t.$(`[data-field="${f}"]`).click();
      if (f === 'v') {
        const d = g('digitStr(S.q)'), typed = wrong ? String(+d + 1) : d;
        for (const ch of typed) t.$(`[data-key="${ch}"]`).click();
      } else {
        const truth = g(`({x: C[S.q[nd(S.q)]].m, t: tolOf(S.q), k: tcOf(S.q)})['${f}']`);
        const btn = $$('[data-fval]').find(b => (+b.dataset.fval === truth) !== wrong);
        btn.click();
      }
    });
    return t.$('#main').click();
  }
  if (fmt === 'hard' && type === 'build') {
    const ask = Array.from(g('S.askSlots ? [...S.askSlots] : [...Array(S.n).keys()]'));
    ask.forEach((i, j) => {
      t.$(`[data-slot="${i}"]`).click();
      const truth = g(`truthAt(${i})`);
      const color = correct || j > 0 ? truth : (truth === 'red' ? 'brown' : 'red');
      t.$(`[data-color="${color}"]`).click();
    });
    return;
  }
```

- [ ] **Step 2: Skriv de fallerande testerna `tests/fields.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel } from './harness.mjs';
import { answer, until } from './answer.mjs';

const key = (t, k) => t.doc.body.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: k, bubbles: true }));

test('Stormästare läs: en ruta per del och ett fält i taget', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  const n = t.g('S.n');
  assert.equal(t.$$('.ebox').length, n === 6 ? 4 : 3);
  assert.ok(t.$('.keypad'), 'knappsats när Siffror är aktiv');
  assert.equal(t.$$('[data-fval]').length, 0, 'ingen lista samtidigt');
  t.$('[data-field="x"]').click();
  assert.equal(t.$('.keypad'), null);
  assert.equal(t.$$('[data-fval]').length, 9);
});

test('Val i en lista går vidare till nästa tomma ruta', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  t.$('[data-field="x"]').click();
  t.$$('[data-fval]')[3].click();
  assert.equal(t.g('S.entry.field'), 't');
});

test('Rätt svar: alla rutor gröna', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  answer(t, true);
  assert.equal(t.$$('.ebox.bad').length, 0);
  assert.equal(t.$$('.ebox.ok').length, t.$$('.ebox').length);
});

test('Fel siffror: Siffror röd med ditt svar överstruket och rätt bredvid', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  answer(t, false);
  const box = t.$('[data-field="v"]');
  assert.ok(box.classList.contains('bad'));
  assert.ok(box.querySelector('s'));
  assert.match(box.querySelector('.right').textContent, new RegExp(t.g('digitStr(S.q)')));
});

test('Mästare: resistans i svår variant har bara Siffror och Multiplikator', () => {
  const t = atLevel('tc');
  until(t, p => p.skill === 'v' && p.type === 'read');
  assert.deepEqual(t.$$('.ebox').map(b => b.dataset.field), ['v', 'x']);
});

test('Tangentbord: siffror hamnar i Siffror även när en lista är aktiv', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'read');
  t.$('[data-field="t"]').click();
  key(t, '4'); key(t, '7');
  assert.equal(t.g('S.entry.v'), '47');
  assert.equal(t.g('S.entry.field'), 'v');
});

test('Palettbygge: fel band rött med rätt färg bredvid, rätt band grönt', () => {
  const t = atLevel('hard');
  until(t, p => p.type === 'build');
  answer(t, false);
  assert.equal(t.$$('.slot.bad').length, 1);
  assert.equal(t.$$('.slot.ok').length, t.g('S.n') - 1);
  assert.ok(t.$('.slot.bad s'));
});
```

- [ ] **Step 3: Kör och se att de fallerar**

Kör: `npm test`
Förväntat: `fields.test.mjs` FAIL (`entryFields is not defined` / fel antal `.ebox`).

- [ ] **Step 4: Implementera `fieldsHTML()`**

Gör `entryHTML()` till bara Eldprovets variant: ta bort hela `} else { ... }`-grenen (den icke-ultra delen med `ebox solo`, knappsats och `chips(...)`) så att funktionen blir:
```js
// Eldprovet: resistans, tolerans och TK skrivs in fritt
function entryHTML(){
  const E = S.entry, six = S.n === 6;
  const caret = f => E.field === f && !S.answered ? '<span class="caret"></span>' : '';
  const keys = ['7','8','9','4','5','6','1','2','3',',','0','⌫'];
  const keyBtn = (k, cls = '', dis = false) => `<button class="key ${cls}" data-key="${k}"${dis || S.answered ? ' disabled' : ''} aria-label="${k === '⌫' ? 'Radera' : k === 'next' ? 'Nästa fält' : k}">${k === 'next' ? 'Nästa' : k}</button>`;
  const box = (f, lab, pre, val, unit) => `<button class="ebox${E.field === f && !S.answered ? ' active' : ''}" data-field="${f}"${disAttr()}><span class="elab">${lab}</span><span class="eval">${pre}${val}${caret(f)}<span class="eunit">${unit}</span></span></button>`;
  const vTxt = /[kM]$/.test(E.v) ? E.v.slice(0, -1) + ' ' + E.v.slice(-1) : E.v;
  const vUnit = /[kM]$/.test(E.v) ? 'Ω' : ' Ω';
  return `<div class="entry"><div class="eboxes">${box('v', 'Resistans', '', vTxt, vUnit)}${box('t', 'Tolerans', '±', E.t, ' %')}${six ? box('k', 'Temp.koeff.', '', E.k, ' ppm/K') : ''}</div>
    <div class="keypad">${keys.map(k => keyBtn(k, /[,⌫]/.test(k) ? 'fn' : '')).join('')}${keyBtn('k', 'fn', E.field !== 'v')}${keyBtn('M', 'fn', E.field !== 'v')}${keyBtn('next', 'fn')}</div></div>
    <p class="hint" id="hint" hidden></p>`;
}
```

Lägg till efter den:
```js
// Svår variant, läs av: rutor överst och ett inmatningsfält i taget under.
// Siffror har knappsats, de andra hela värdelistan. Val i en lista går vidare till nästa tomma ruta.
const FIELD_LBL = {v:'Siffror', x:'Multiplikator', t:'Tolerans', k:'Temp.koeff.'};
const FIELD_PROP = {v:'v', x:'mult', t:'tol', k:'tc'};
const FIELD_VALS = {x:MULTS, t:TOL_VALS, k:TC_VALS};
const FIELD_FMT = {x:fmtMult, t:fmtTol, k:fmtTc};
const entryFields = () => S.focus === 'all' ? ['v','x','t'].concat(S.n === 6 ? ['k'] : []) : S.focus === 'v' ? ['v','x'] : [S.focus];
const digitsIn = () => parseFloat(S.entry.v.replace(',', '.'));
const fieldFilled = f => f === 'v' ? !isNaN(digitsIn()) : S.entry[FIELD_PROP[f]] != null;
const fieldTruth = f => f === 'v' ? digitStr(S.q) : f === 'x' ? fmtMult(C[S.q[nd(S.q)]].m) : f === 't' ? fmtTol(tolOf(S.q)) : fmtTc(tcOf(S.q));
function fieldsHTML(){
  const E = S.entry, fs = entryFields(), done = S.answered;
  if (!fs.includes(E.field)) E.field = fs[0];
  const boxes = fs.map(f => {
    const p = FIELD_PROP[f], raw = f === 'v' ? E.v : E[p] != null ? FIELD_FMT[f](E[p]) : '';
    let txt = raw + (!done && E.field === f && f === 'v' ? '<span class="caret"></span>' : '');
    let cls = !done && E.field === f ? ' active' : '';
    if (done) {
      cls += S.fieldOk[f] ? ' ok' : ' bad';
      if (!S.fieldOk[f]) txt = `<s>${raw || '–'}</s> <span class="right">${fieldTruth(f)}</span>`;
    }
    return `<button class="ebox${cls}" data-field="${f}"${disAttr()}><span class="elab">${FIELD_LBL[f]}</span><span class="eval">${txt}</span></button>`;
  }).join('');
  const pre = fs.includes('v') && !isNaN(digitsIn()) && E.mult != null ? `<p class="epre">= ${fmtVal(Math.round(digitsIn() * E.mult * 1e6) / 1e6)}</p>` : '';
  let panel = '';
  if (!done && E.field === 'v') {
    panel = `<div class="keypad">${['7','8','9','4','5','6','1','2','3',',','0','⌫'].map(k =>
      `<button class="key${/[,⌫]/.test(k) ? ' fn' : ''}" data-key="${k}" aria-label="${k === '⌫' ? 'Radera' : k}">${k}</button>`).join('')}</div>`;
  } else if (!done) {
    const f = E.field, p = FIELD_PROP[f];
    panel = `<div class="chiprow" role="group" aria-label="${FIELD_LBL[f]}">${FIELD_VALS[f].map(x =>
      `<button class="chip" data-fval="${x}" aria-pressed="${E[p] === x}">${FIELD_FMT[f](x)}</button>`).join('')}</div>`;
  }
  return `<div class="entry"><div class="eboxes">${boxes}</div>${pre}${panel}</div><p class="hint" id="hint" hidden></p>`;
}
```

I `render()` läsgrenen: `h += S.plan.fmt === 'hard' ? entryHTML() : mcHTML();` → `h += S.plan.fmt !== 'hard' ? mcHTML() : S.level === 'ultra' ? entryHTML() : fieldsHTML();`

Ersätt `entryReady()` (från Task 3) med:
```js
function entryReady(){
  const E = S.entry;
  if (S.level === 'ultra') return E.v !== '' && E.t !== '' && (S.n !== 6 || E.k !== '');
  return entryFields().every(fieldFilled);
}
```

I `answerRead()`, ersätt allt från `} else if (hardFocus()) {` till och med slutet av funktionen med:
```js
  } else {
    const fs = entryFields();
    if (!fs.every(fieldFilled)) return;
    const ok = {}, vT = valueOf(S.q);
    if (fs.includes('v')) { const vIn = digitsIn() * E.mult; ok.v = compareValues(vIn, vT)[0].ok; ok.x = close(vIn, vT); }
    if (fs.includes('t')) ok.t = close(E.tol, tolOf(S.q));
    if (fs.includes('k')) ok.k = close(E.tc, tcOf(S.q));
    S.fieldOk = ok;
    return finish(fs.every(f => ok[f]));
  }
  hint.hidden = true;
  S.parts = compareValues(vIn, valueOf(S.q)).concat(
    [{label:'Tolerans', ok: close(tIn, tolOf(S.q)), yours: fmtTol(tIn), right: fmtTol(tolOf(S.q))}],
    six ? [{label:'Temperaturkoefficient', ok: close(kIn, tcOf(S.q)), yours: fmtTc(kIn), right: fmtTc(tcOf(S.q))}] : []);
  finish(close(vIn, valueOf(S.q)) && close(tIn, tolOf(S.q)) && (!six || close(kIn, tcOf(S.q))));
}
```
(Ultra-grenen överst, `if (ultra) { ... }`, lämnas orörd. `S.parts` behövs fortfarande för Eldprovets poäng per del.)

I `keyPress()`: ersätt `const f = ultra ? E.field : 'v';` med
```js
  if (!ultra) E.field = 'v';
  const f = ultra ? E.field : 'v';
```

I keydown-lyssnaren, ersätt villkoret
```js
    if (k && (S.level === 'ultra' || !['k','M','next'].includes(k))) { e.preventDefault(); keyPress(k); return; }
```
med
```js
    if (k && (S.level === 'ultra' || (!['k','M','next'].includes(k) && entryFields().includes('v')))) { e.preventDefault(); keyPress(k); return; }
```

I click-lyssnaren, ersätt grenarna `btn.dataset.mult != null`, `btn.dataset.tol != null` och `btn.dataset.tc != null` med:
```js
  } else if (btn.dataset.fval != null) {
    const E = S.entry, fs = entryFields();
    E[FIELD_PROP[E.field]] = +btn.dataset.fval;
    const after = fs.slice(fs.indexOf(E.field) + 1).concat(fs).find(f => !fieldFilled(f));
    if (after) E.field = after;
    render();
```

- [ ] **Step 5: Facit i palettbygget**

Lägg till före `function render()`:
```js
// Bygg med palett: rätt färg för plats i som den byggs (Band 1 är toleransänden när motståndet sitter vänt)
const truthAt = i => S.bflip ? S.q[S.n - 1 - i] : S.q[i];
```

I palettgrenen i `render()`, ersätt slot-knappens `return` med:
```js
        const mark = S.answered && S.level !== 'ultra' && !locked ? (k === truthAt(i) ? ' ok' : ' bad') : '';
        const val = mark === ' bad'
          ? `<span><s>${C[k].n}</s> <span class="sw" style="${swStyle(truthAt(i))}"></span>${C[truthAt(i)].n}</span>`
          : `<span>${k ? C[k].n : 'Välj'}</span>`;
        return `<button class="slot${mark}" data-slot="${i}" aria-pressed="${S.slot===i && !S.answered}"${locked || S.answered ? ' disabled' : ''}><span class="sw ${k?'':'empty'}" ${k?`style="${swStyle(k)}"`:''}></span>${l}${val}</button>`;
```

- [ ] **Step 6: CSS**

Lägg till efter `.ebox.active{...}`:
```css
.ebox.ok,.slot.ok{border-color:var(--ok);background:var(--ok-bg)}
.ebox.bad,.slot.bad{border-color:var(--bad);background:var(--bad-bg)}
.ebox s,.slot s{color:var(--muted)}
.ebox .right{color:var(--ink)}
.entry .chiprow{gap:8px}
.entry .chip{font-size:1.05rem;padding:8px 14px}
p.epre{margin:0}
```
Ta bort de oanvända reglerna `.fields{...}`, `.field label{...}`, `.field input{...}`, `.emul{...}`, `.ebox.solo{...}`.

- [ ] **Step 7: Kör testerna**

Kör: `npm test`
Förväntat: alla PASS.

Kör: `grep -nE "data-mult|data-tol=|data-tc=|ebox solo|emul" index.html`
Förväntat: ingen träff.

- [ ] **Step 8: Commit**

```bash
git add index.html tests/answer.mjs tests/fields.test.mjs
git commit -m "Inmatning ett fält i taget, med facit i rutorna och i de byggda banden"
```

---

### Task 5: Varje alternativ visar vad det står för, och riktningsfacit vänder motståndet

**Files:**
- Modify: `index.html` (CSS, `mcHTML`, `bmcHTML`, riktningsgrenen i `render`)
- Create: `tests/annotations.test.mjs`

**Interfaces:**
- Consumes: `markCls`, `disAttr`, `bmcRight` (Task 2–3).
- Produces: `valueBands(v, k)` → färgnycklar eller `null`; `swatches(cs)`; `mcAnn(g, x)`; `partValue(o)`; CSS-klass `.ann`, `.res.turn`.

- [ ] **Step 1: Skriv de fallerande testerna `tests/annotations.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel } from './harness.mjs';
import { answer, until } from './answer.mjs';

test('valueBands: värde till färger', () => {
  const t = atLevel('intro');
  assert.deepEqual(Array.from(t.g('valueBands(4700, 2)')), ['yellow', 'violet', 'red']);
  assert.deepEqual(Array.from(t.g('valueBands(4.7, 2)')), ['yellow', 'violet', 'gold']);
  assert.deepEqual(Array.from(t.g('valueBands(24900, 3)')), ['red', 'yellow', 'white', 'red']);
  assert.equal(t.g('valueBands(4710, 2)'), null);
});

test('Flerval med värden: efter svar visar varje knapp sina färger', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'read');
  assert.equal(t.$$('#q .ann').length, 0);
  answer(t, false);
  const opts = t.$$('#q [data-pick]');
  assert.ok(opts.every(b => b.querySelector('.ann .sw')));
});

test('Flerval med färger: efter svar visar varje färg sitt värde', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 't' && p.type === 'build');
  answer(t, false);
  for (const b of t.$$('#q [data-tpick]')) assert.match(b.querySelector('.ann').textContent, /±/);
});

test('Flerval med motståndsbilder: värdet under varje bild', () => {
  const t = atLevel('medium');
  until(t, p => p.skill === 'v' && p.type === 'build');
  answer(t, true);
  for (const b of t.$$('#q [data-vpick]')) assert.match(b.querySelector('.ann').textContent, /Ω/);
});

test('Riktning: ett vänt motstånd ritas rättvänt efter svar', () => {
  const t = atLevel('intro');
  for (let i = 0; i < 200 && !t.g('S.style.flip'); i++) t.g('next()');
  answer(t, true);
  assert.ok(t.$('#q .res.turn'));
  assert.ok(!t.$('#q .res svg').innerHTML.includes('scale(-1 1)'));
});
```

- [ ] **Step 2: Kör och se att de fallerar**

Kör: `npm test`
Förväntat: `annotations.test.mjs` FAIL (`valueBands is not defined`).

- [ ] **Step 3: Implementera**

Lägg till före `function mcHTML()`:
```js
// Vad ett alternativ motsvarar i färger: värde till siffer- och multiplikatorband (k siffror), null om det inte går
function valueBands(v, k){
  for (const c of MO) {
    const d = v / C[c].m, r = Math.round(d);
    if (close(d, r) && r >= 10 ** (k - 1) && r < 10 ** k) return String(r).split('').map(x => DIG[+x]).concat([c]);
  }
  return null;
}
const swatches = cs => cs.map(c => `<span class="sw" style="${swStyle(c)}" title="${C[c].n}"></span>`).join('');
function mcAnn(g, x){
  const cs = g === 'v' ? valueBands(x, nd(S.q)) : g === 'd' ? x.split('').map(d => DIG[+d])
    : g === 'x' ? [MO.find(c => close(C[c].m, x))] : g === 't' ? [TOL.find(c => close(C[c].t, x))] : [TCS.find(c => C[c].tc === x)];
  if (!cs || cs.some(c => !c)) return '';
  return `<small class="ann">${swatches(cs)}${cs.length === 1 ? ' ' + C[cs[0]].n : ''}</small>`;
}
// Resistansen som siffer- och multiplikatorbanden i en motståndsbild ger
const partValue = o => Math.round(+o.slice(0, -1).map(c => C[c].d).join('') * C[o[o.length - 1]].m * 100) / 100;
```

I `mcHTML()`: knappens innehåll `${mcFmt(g, x)}` → `${mcFmt(g, x)}${S.answered ? mcAnn(g, x) : ''}`.

I `bmcHTML()`: ersätt `imgBtn` och `colBtn` från Task 3 med:
```js
  const imgBtn = (o, i, lab, ann) => `<button class="opt r${markCls(i === right, S.bpick === i)}" data-vpick="${i}"${disAttr()}>${svg(o, {style: st, label: lab})}${S.answered ? `<small class="ann">${ann}</small>` : ''}</button>`;
  const role = S.focus === 'x' ? 'mult' : S.focus === 'k' ? 'tc' : 'tol';
  const colBtn = (c, attr) => `<button class="opt bc${markCls(c === right, S.bpick === c)}" data-${attr}="${c}"${disAttr()}><span class="sw" style="${swStyle(c)}"></span>${C[c].n}${S.answered ? `<small class="ann">${bandDetail(c, role)}</small>` : ''}</button>`;
```
och ge `imgBtn` fjärde argumentet: för d `o.map(c => C[c].d).join(' ')`, för v `fmtVal(partValue(o))`.

I riktningsgrenen i `render()`, ersätt `<div class="res">${svg(S.q,{style:S.style})}</div>` med:
```js
<div class="res${turn ? ' turn' : ''}">${svg(S.q, {style: turn ? {...S.style, flip:false} : S.style})}</div>
```
och lägg `const turn = S.answered && S.level !== 'ultra' && S.style.flip && !S.ambig;` överst i grenen.

CSS, efter `.opt.bc{...}`:
```css
.opt.bc{flex-wrap:wrap}
.ann{display:block;font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:.85rem;color:var(--muted);margin-top:4px;line-height:1.3}
.opt.bc .ann{flex-basis:100%;margin-top:0}
.ann .sw{width:14px;height:14px;vertical-align:-2px;margin-right:2px}
```
I reduced-motion-blocket:
```css
  .res.turn svg{animation:turn .45s ease-out}
  @keyframes turn{from{transform:scaleX(-1)}}
```

- [ ] **Step 4: Kör testerna**

Kör: `npm test`
Förväntat: alla PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/annotations.test.mjs
git commit -m "Facit i knapparna visar vad varje alternativ står för, och riktningsfacit vänder motståndet"
```

---

### Task 6: Eldprovet med poängskylt

**Files:**
- Modify: `index.html` (`recordExam`, `lessonHTML`, CSS)
- Create: `tests/exam.test.mjs`

**Interfaces:**
- Consumes: `lessonHTML`, `mainBtnHTML`, `markCls` (Task 3).
- Produces: `examTotals()` → `{ok, n}`; `S.examLast = {ok, n}`; `.examsign`.

- [ ] **Step 1: Skriv de fallerande testerna `tests/exam.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atLevel } from './harness.mjs';
import { answer } from './answer.mjs';

const start = t => { t.$('#examStart').click(); };

test('Poängskylt efter varje fråga, ingen markering av rätt och fel', () => {
  const t = atLevel('ultra');
  start(t);
  t.g("S.exam.queue[S.exam.i] = {t:'series'}; next()");
  answer(t, true);
  assert.equal(t.$('.examsign').textContent, '1 av 1 del · totalt 1/1 poäng');
  assert.equal(t.$$('#q .ok, #q .bad').length, 0);
  assert.equal(t.$('.lesson'), null);
  t.$('#main').click();
  t.g("S.exam.queue[S.exam.i] = {t:'dir', hard:true}; next()");
  answer(t, false);
  assert.equal(t.$('.examsign').textContent, '0 av 1 del · totalt 1/2 poäng');
});

test('Läsfråga ger poäng per del', () => {
  const t = atLevel('ultra');
  start(t);
  t.g("S.exam.queue[S.exam.i] = {t:'read', n:4}; next()");
  t.g("S.entry = {...S.entry, v: String(valueOf(S.q)).replace('.', ','), t: '1', k: ''}");
  t.g('answerRead()');
  assert.match(t.$('.examsign').textContent, /^\d av 2 delar · totalt \d\/2 poäng$/);
});

test('Sista frågan: huvudknappen heter Se resultatet och visar utlåtandet', () => {
  const t = atLevel('ultra');
  start(t);
  t.g("S.exam.i = 19; S.exam.queue[19] = {t:'series'}; next()");
  answer(t, true);
  assert.equal(t.$('#main').textContent, 'Se resultatet');
  t.$('#main').click();
  assert.ok(t.$('.verdict'));
});
```

- [ ] **Step 2: Kör och se att de fallerar**

Kör: `npm test`
Förväntat: `exam.test.mjs` FAIL (`.examsign` saknas).

- [ ] **Step 3: Implementera**

Lägg till före `function recordExam`:
```js
const examTotals = () => Object.values(S.exam.score).reduce((a, x) => ({ok: a.ok + x.ok, n: a.n + x.n}), {ok:0, n:0});
```
I `recordExam()`, första raden efter `const sc = ...`: `const before = examTotals();`. Före `S.exam.i++;`:
```js
  const after = examTotals();
  S.examLast = {ok: after.ok - before.ok, n: after.n - before.n};
```

I `lessonHTML()` ersätt `if (!S.answered || S.level === 'ultra') return '';` med:
```js
  if (!S.answered) return '';
  // Eldprovet: inget facit, bara poängen
  if (S.level === 'ultra') {
    const L = S.examLast, T = examTotals();
    return `<p class="examsign" role="status">${L.ok} av ${L.n} ${L.n === 1 ? 'del' : 'delar'} · totalt ${T.ok}/${T.n} poäng</p>`;
  }
```

CSS efter `.lesson.tip{...}`:
```css
.examsign{margin:14px 0 0;font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-size:1.4rem;font-weight:600}
```
Och i reduced-motion-blocket: `.lesson,.examsign{animation:pop .18s ease-out}` (ersätter `.lesson{...}`).

- [ ] **Step 4: Kör testerna**

Kör: `npm test`
Förväntat: alla PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/exam.test.mjs
git commit -m "Eldprovet visar bara poäng efter varje fråga"
```

---

### Task 7: Texter efter den nya modellen och städning

**Files:**
- Modify: `index.html` ("Om nivåerna", `LEARN`, `updateScore`)
- Create: `tests/texts.test.mjs`

**Interfaces:**
- Consumes: `NEW_SKILL` (Task 2).
- Produces: `SKILL_WORD` (svit-text per nivå).

- [ ] **Step 1: Skriv det fallerande testet `tests/texts.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';

test('Poängraden säger vad sviten räknar', () => {
  const t = load({ storage: { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5 }), 'fargkoden-level': 'medium' } });
  assert.match(t.$('#score').textContent, /0 av 5 i rad på tolerans till Mästare/);
});

test('Om nivåerna beskriver den nya svitregeln', () => {
  const t = load();
  assert.match(t.$('details .gnote').textContent, /nollställer/);
});
```

- [ ] **Step 2: Kör och se att det fallerar**

Kör: `npm test`
Förväntat: `texts.test.mjs` FAIL.

- [ ] **Step 3: Implementera**

I `updateScore()`, ersätt
```js
      : !unlocked(nx) ? `<span><b>${Math.min(S.streak, UNLOCK_AT)}</b> av ${UNLOCK_AT} i rad till ${lvName(nx)}</span>`
```
med
```js
      : !unlocked(nx) ? `<span><b>${Math.min(S.streak, UNLOCK_AT)}</b> av ${UNLOCK_AT} i rad på ${SKILL_WORD[S.level]} till ${lvName(nx)}</span>`
```
och lägg till före `function updateScore()`:
```js
// Det som sviten räknar på varje nivå
const SKILL_WORD = {intro:'läsriktning', easy:'resistans', medium:'tolerans', tc:'temperaturkoefficient', hard:'allt'};
```

Ersätt innehållet i `<details>` "Om nivåerna" (första `<p class="gnote">`, `<ul class="lvlist">` och sista `<p class="gnote">`) med:
```html
    <p class="gnote">Nivåerna heter efter hur långt du kommit, från Nykomling till Stormästare. Varje nivå lär ut en ny sak, och det mesta du får gäller just den. <b>5 rätt i rad</b> på det nya låser upp nästa nivå. Frågor om det du lärt dig tidigare räknas inte upp, men ett fel på vad som helst nollställer sviten. Eldprovet är alltid öppet.</p>
    <ul class="lvlist">
      <li><b>Nykomling:</b> läsriktning. Du avgör om motståndet ska läsas från vänster eller höger. Det finns alltid en tydlig ledtråd, och tipset kostar inget.</li>
      <li><b>Lärling:</b> resistansen i ohm, med fyra svarsalternativ. Frågorna gäller ibland hela värdet, ibland bara siffrorna och ibland bara multiplikatorn. Ibland kommer en riktningsfråga från Nykomling.</li>
      <li><b>Gesäll:</b> tolerans. Resistansen frågas fortfarande som flerval, motstånden ser olika ut, och nu kan de sitta vända.</li>
      <li><b>Mästare:</b> temperaturkoefficient, det sjätte bandet. Toleransen kommer som flerval, och resistansen knappar du in själv eller bygger ur paletten.</li>
      <li><b>Stormästare:</b> allt i svår variant. Du knappar in hela värden och bygger motstånd band för band. Nytt är E-serierna, som avgör om ett värde är standard. Ungefär vart tionde motstånd är inte standard, och här räknas alla frågor.</li>
      <li><b>Eldprovet:</b> 20 frågor som testar allt, utan tips och utan färdiga värden. Motstånd kan sitta vända, och riktningsfrågorna är de kluriga sorterna där bara standardvärden, guld och silver eller en multimeter avgör. Efter varje fråga ser du bara dina poäng. Du får en poäng för varje del du klarar, och en färdighet räknas som klarad vid minst hälften rätt. Till sist får du ett utlåtande om vilken nivå du behärskar.</li>
    </ul>
    <p class="gnote">Det du lärde dig på nivån närmast under kommer som flerval. Det du lärde dig tidigare än så kommer i svår variant: du knappar in värdet, väljer ur hela listan eller bygger ur paletten. Under Läge kan du från Lärling och uppåt välja Öva och träna på en del i taget, i samma format som på nivån. Tips finns bara för det nya på varje nivå. Rätt svar med tips räknas, men sviten står still.</p>
```

Ersätt `LEARN`:
```js
const LEARN = {
  easy: 'Som Lärling läser du av resistansen. De första banden är siffror och bandet efter är multiplikatorn, alltså hur många nollor som ska till. Du övar på siffrorna, multiplikatorn och hela värdet. Ibland kommer en riktningsfråga, men det är resistansfrågorna som för dig framåt.',
  medium: 'Som Gesäll lär du dig toleransen, det breda bandet i slutet som säger hur mycket värdet får avvika. Resistansen kommer som flerval, motstånden ser olika ut och kan sitta vända. Det är toleransfrågorna som räknas, men ett fel på vad som helst nollställer sviten.',
  tc: 'Som Mästare lär du dig det sjätte bandet: temperaturkoefficienten i ppm/K, som säger hur mycket resistansen ändras per grad. Toleransen kommer som flerval, och resistansen knappar du nu in själv eller bygger ur paletten.',
  hard: 'Som Stormästare kommer allt i svår variant: du knappar in hela värden och bygger motstånd band för band ur en blandad palett. Nytt är standardvärdena och E-serierna. Här räknas alla frågor. När du känner dig redo väntar Eldprovet.'
};
```

Kontrollera att Eldprovets utlåtande stämmer med trappan: `LADDER` ska vara oförändrad, `[['intro','Nykomling',[]], ['easy','Lärling',['v']], ['medium','Gesäll',['t']], ['tc','Mästare',['k']], ['hard','Stormästare',['e','dirx']]]`. Varje nivå kräver sin nya färdighet, vilket matchar `NEW_SKILL`. Ingen ändring.

- [ ] **Step 4: Städa bort det som inte används**

Kör: `grep -nE "MC_LABELS|grp-lbl|\.star|S\.parts|bandsValid" index.html`

- `MC_LABELS`: används bara om `answerMC`/`mcHTML` refererar till den. Om ingen träff utanför definitionen, ta bort definitionen.
- `.grp-lbl`: används fortfarande inte av `fieldsHTML`. Om ingen HTML-träff finns, ta bort CSS-regeln.
- `bandsValid`: används inte längre i facit. Om bara definitionen träffas, ta bort funktionen.
- `S.parts` ska finnas kvar (Eldprovets poäng per del i `recordExam`).
- Lämna `.star*`-reglerna (utanför det här arbetet).

- [ ] **Step 5: Kör testerna**

Kör: `npm test`
Förväntat: alla PASS.

- [ ] **Step 6: Commit**

```bash
git add index.html tests/texts.test.mjs
git commit -m "Texter om nivåerna efter den nya modellen och städning av oanvänd kod"
```

---

### Task 8: Kontroll i webbläsare

Inga kodändringar om allt stämmer. Det här är en manuell kontroll som jsdom inte kan göra (layout, tema, animation). Be användaren om lov innan sidan öppnas i en webbläsare (Playwright), eller låt användaren göra det.

- [ ] **Step 1: Öppna `index.html?test=true` och lås upp alla nivåer med testraden.**
- [ ] **Step 2: För varje nivå, i 360 px och 1024 px bredd, ljust och mörkt tema:** svara fel en gång och rätt en gång på varje frågetyp. Kontrollera: ingen horisontell skroll, huvudknappen syns utan att skrolla på 360 × 740, rött/grönt syns tydligt i båda teman, annoteringarna ryms i knapparna.
- [ ] **Step 3: Stormästare läs:** hela kortet ryms på 360 × 740 med knappsatsen öppen.
- [ ] **Step 4: Riktning på Nykomling:** vändanimationen syns, och den syns inte med reducerad rörelse påslaget.
- [ ] **Step 5: Eldprovet:** gör hela provet. Kontrollera poängskylten och att resultatet visas.
- [ ] **Step 6:** Rätta det som hittas, kör `npm test` och committa: `git commit -am "Justeringar efter kontroll i webbläsare"`.
