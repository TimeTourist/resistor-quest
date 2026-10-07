# E-serierna utan värden: implementationsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Mål:** E-seriernas fem grader lär ut vad en E-serie är, att serie och tolerans hör ihop och att toleransbandet visar serien. Ingen grad kräver att man kan värdena, och varje fråga har en pedagogisk animering vid fel.

**Arkitektur:**
- Alla frågor i E-serierna blir `choice`-frågor. Det gäller också "Vilken serie tillhör motståndet?". Ramverket med `S.cq` har allt som behövs: `res`, `after`, `anim` (`land` och `total`), `odd` och `wrong`.
- Frågetypen `series` med "Inte standard" tas bort helt. Därför blir beroenderegeln choice på alla fem graderna. Det är en avvikelse från specens testavsnitt, och specen rättas i Task 7.
- Nya hjälpare ligger efter `SER_OPTS`/`ETOL_Q` i `index.html`, där E-seriernas övriga ritfunktioner finns.

**Teknik:** en enda `index.html` med vanilla JS och CSS. Testerna körs med `node --test` och jsdom (`tests/harness.mjs`, `tests/answer.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-07-eserier-utan-varden-design.md`

## Globala krav

- Ingen grad kräver att man kan värdena: inget svar "Inte standard", och ingen fråga där man måste veta om ett värde finns i en serie utan att det står i frågan eller i en tabell.
- Serie och tolerans: E6 ±20 %, E12 ±10 %, E24 ±5 %, E48 ±2 %, E96 ±1 % och E192 ±0,5 % och finare (grön ±0,5 %, blå ±0,25 % och violett ±0,1 %). Tre band, alltså inget toleransband, ger ±20 % och E6.
- Varje fråga har en animering vid fel. Låset vid fel väntar in den (`S.cq.anim.total`). Med `S.instant` och `reduceMotion()` visas slutläget direkt. På Eldprovet visas ingen animering.
- Klockan, linjalen, utrullningen och toleransstaplarna finns kvar.
- Text i spelet är på svenska, med decimalkomma (`num()`, `fmtVal()` och `fmtTol()`).
- Efter varje task: hela sviten är grön (`node --test tests/*.test.mjs`).

## Det som granskningen ska titta på särskilt

1. **Vända motstånd och sex band:** toleransbandet ringas in på rätt plats även när motståndet sitter vänt (`flip`) eller har sex band (`tolIdx(6) === 4`). Testas i Task 3.
2. **Uppgifter i "Vilken serie räcker säkert?" som inte går att lösa:** slumpningen får aldrig fastna, och den får aldrig ge E6 eller en uppgift där ingen serie räcker. Testas med 300 slumpade uppgifter i Task 6.
3. **Flyttal:** gränsfall som 3,3 × 1,05 = 3,465 mot fönstrets kant ska avgöras med tolerans (`EPS`), inte bli fel på grund av avrundning. Testas i Task 6.
4. **Det udda svaret i multiplikatorfrågan** får inte råka finnas i serien, och får inte ha samma siffror som ledtråden. Testas med 200 slumpade frågor i Task 5.
5. **Eldprovet och blandat:** alla nya frågor går att spela utan fel i `golden('e')` och på Eldprovet. Testas i Task 7.

---

### Task 1: Gemensamma hjälpare: serien från banden, ett motstånd ur en serie och trappan

**Filer:**
- Ändra: `index.html` (efter `const ETOL_Q = …`, och CSS efter `.res .eruler{…}`)
- Test: `tests/eutan.test.mjs` (ny)

**Gränssnitt:**
- Skapar:
  - `SERS = ['E6','E12','E24','E48','E96','E192']`
  - `SER_T = {...SER_TOL, E192: 0.5}`
  - `serOfBands(b) → 'E6' | … | 'E192'`
  - `bandResistor({sers, six = false, flip = false}) → {bands, ser, flip}`
  - `stairHTML({hl = null, need = null, at = .3, step = .3}) → string`
  - `stairEnd(at = .3, step = .3) → sekunder`

- [ ] **Steg 1: Skriv testerna som ska fallera**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade, golden, load, ALL_OPEN } from './harness.mjs';
import { answer, until } from './answer.mjs';

const frag = (t, expr) => { const d = t.doc.createElement('div'); d.innerHTML = t.g(expr); return d; };

test('serOfBands: toleransbandet avgör serien, tre band är E6', () => {
  const t = load();
  assert.equal(t.g("serOfBands(['yellow','violet','red'])"), 'E6');
  assert.equal(t.g("serOfBands(['yellow','violet','red','silver'])"), 'E12');
  assert.equal(t.g("serOfBands(['yellow','violet','red','gold'])"), 'E24');
  assert.equal(t.g("serOfBands(['yellow','violet','black','brown','red'])"), 'E48');
  assert.equal(t.g("serOfBands(['yellow','violet','black','brown','brown'])"), 'E96');
  for (const c of ['green','blue','violet']) assert.equal(t.g(`serOfBands(['yellow','violet','black','brown','${c}'])`), 'E192');
  assert.equal(t.g("serOfBands(['yellow','violet','black','brown','brown','red'])"), 'E96', 'sex band: toleransen är det näst sista');
});

test('bandResistor: rätt antal band, värdet finns i serien och banden ger serien', () => {
  const t = load();
  for (let i = 0; i < 300; i++) {
    const r = JSON.parse(t.g("JSON.stringify(bandResistor({sers: SERS, six: Math.random() < .5, flip: Math.random() < .5}))"));
    assert.equal(t.g(`serOfBands(${JSON.stringify(r.bands)})`), r.ser);
    const n = r.bands.length;
    assert.equal(n, {E6: 3, E12: 4, E24: 4}[r.ser] || (n === 6 ? 6 : 5));
    const k = n <= 4 ? 2 : 3, digits = +r.bands.slice(0, k).map(c => t.g(`C.${c}.d`)).join('');
    const list = t.g(`JSON.stringify(ESER['${r.ser === 'E192' ? 'E96' : r.ser}'][0])`);
    assert.ok(JSON.parse(list).includes(digits), `${digits} finns i ${r.ser}`);
    if (n === 3) assert.equal(r.flip, false, 'tre band vänds inte');
  }
});

test('Trappan: sex steg, det markerade lyser, och med ett krav blir stegen för grova, räcker eller fler än du behöver', () => {
  const t = load();
  let d = frag(t, "stairHTML({hl: 'E24'})");
  assert.equal(d.querySelectorAll('.estep').length, 6);
  assert.match(d.querySelector('.estep.hl').textContent, /E24.*±5 %/);
  d = frag(t, 'stairHTML({need: 10})');
  assert.deepEqual([...d.querySelectorAll('.estep')].map(e => e.className.replace(/estep|mk/g, '').trim()), ['bad', 'ok', 'more', 'more', 'more', 'more']);
  assert.match(d.querySelector('.eneed').textContent, /±10 %/);
});
```

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/eutan.test.mjs`
Väntat: FAIL, `serOfBands is not defined`.

- [ ] **Steg 3: Skriv koden**

Efter `const ETOL_Q = …` i `index.html`:

```js
// E-serierna utan värden: serien läses från toleransbandet. Tre band (inget toleransband) är ±20 %, alltså E6.
const SERS = ['E6','E12','E24','E48','E96','E192'];
const SER_T = {...SER_TOL, E192: 0.5};
const serOfBands = b => b.length === 3 ? 'E6' : TOL_SER[C[b[tolIdx(b.length)]].t] || 'E192';
// Ett motstånd ur en av serierna. E192 tar värdet ur E96 (som ingår i E192) och får ett grönt, blått eller violett band.
// six: fembandare får ett temperaturband. flip: sitter vänt (inte trebandare).
function bandResistor({sers, six = false, flip = false}){
  const ser = rnd(sers), base = ser === 'E192' ? 'E96' : ser;
  const {bands} = resistorFromSeries(base);
  if (ser === 'E192') bands[bands.length - 1] = rnd(['green','blue','violet']);
  if (six && bands.length === 5) bands.push(rnd(['brown','red','orange','yellow']));
  return {bands, ser, flip: flip && bands.length > 3};
}
// Trappan: serierna i ordning, med dubbelt så många värden och smalare tolerans för varje steg.
// hl: serien frågan gällde. need: toleransen bygget tål, då blir stegen för grova (bad), räcker (ok) eller fler än du behöver (more).
const stairEnd = (at = .3, step = .3) => at + SERS.length * step + .3;
function stairHTML({hl = null, need = null, at = .3, step = .3} = {}){
  const enough = need == null ? null : SERS.find(s => SER_T[s] <= need);
  const fit = s => need == null ? (s === hl ? ' hl' : '') : SER_T[s] > need ? ' bad' : s === enough ? ' ok' : ' more';
  const note = s => need == null ? '' : SER_T[s] > need ? 'för grov' : s === enough ? 'räcker' : 'fler värden än du behöver';
  const rows = SERS.map((s, i) => `<div class="estep${fit(s)} mk" style="animation-delay:${(at + i * step).toFixed(2)}s;--k:${i}">` +
    `<b>${s}</b><span>${fmtTol(SER_T[s])}</span><i>${note(s)}</i></div>`).join('');
  const line = need == null ? '' : `<p class="eneed mk" style="animation-delay:${(at + SERS.length * step).toFixed(2)}s">Bygget tål ${fmtTol(need)}</p>`;
  return `<div class="estair" aria-hidden="true">${rows}</div>${line}`;
}
```

CSS efter `.res .eruler{…}`:

```css
.estair{display:grid;gap:4px;max-width:360px;margin:6px auto}
.estep{display:grid;grid-template-columns:4em 4.5em 1fr;align-items:center;gap:8px;padding:4px 10px;border-radius:8px;
  margin-left:calc(var(--k) * 10px);background:var(--surface);border:1px solid var(--line);font-size:.95rem}
.estep b{font-family:var(--display);font-size:1.1rem}
.estep i{font-style:normal;color:var(--muted);font-size:.85rem}
.estep.hl{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent)}
.estep.bad{border-color:var(--bad);background:var(--bad-bg)}
.estep.ok{border-color:var(--ok);background:var(--ok-bg);box-shadow:0 0 0 2px var(--ok)}
.estep.more{opacity:.6}
.eneed{text-align:center;font-weight:700;margin:4px 0 0}
```

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/eutan.test.mjs`
Väntat: PASS 3/3.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: alla gröna.

```bash
git add index.html tests/eutan.test.mjs
git commit -m "E-serierna: serien från toleransbandet, motstånd ur en serie och trappan"
```

---

### Task 2: Nykomling: Vad betyder 12 i E12? och Vad är E12?

**Filer:**
- Ändra: `index.html` (`GRADES.e[0]`)
- Ändra: `tests/eserier.test.mjs` (testet för Nykomling)
- Test: `tests/eutan.test.mjs`

**Gränssnitt:**
- Använder: `dialSVG(12, {count, pop})`
- Skapar: `eq` `'namn'` och `'vad'` på Nykomling.

- [ ] **Steg 1: Skriv testerna som ska fallera**

Lägg till i `tests/eutan.test.mjs`:

```js
test('Nykomling: Vad betyder 12 i E12? och Vad är E12?, båda förekommer', () => {
  const t = atGrade('e', 0), seen = new Set();
  for (let i = 0; i < 40; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['namn', 'vad']);
});

test('Nykomling: 12 i E12 betyder att 10–100 är uppdelat i 12 steg', () => {
  const t = atGrade('e', 0);
  until(t, p => p.eq === 'namn');
  assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), '10–100 är uppdelat i 12 steg');
  answer(t, false);
  assert.equal(t.$$('#q .edot').length, 12);
  assert.match(t.g('S.cq.wrong'), /12 steg.*20 %/);
});

test('Nykomling: Vad är E12? Standardvärden, och vid fel tänds samma värde med olika nollor', () => {
  for (const ok of [true, false]) {
    const t = atGrade('e', 0);
    until(t, p => p.eq === 'vad');
    assert.equal(t.$('#q .prompt').textContent.trim(), 'Vad är E12?');
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), 'Standardvärden som motstånd säljs i');
    answer(t, ok);
    assert.equal(t.$$('#q .edot').length, 12, 'klockan fylls');
    assert.equal(t.$$('#q .eex .mk').length, ok ? 0 : 3, 'tre exempel vid fel');
    if (!ok) assert.match(t.$('#q .eex').textContent, /4,7 Ω.*47 Ω.*4,7 kΩ/);
  }
});

test('Nykomling: Vad är E12? vid fel låser tills exemplen har tänts', () => {
  const t = atGrade('e', 0);
  until(t, p => p.eq === 'vad');
  assert.ok(t.g('S.cq.anim.total') >= 2.4);
});
```

Ta bort testet `'E-seriernas Nykomling: Vad betyder 12 i E12?, tom klocka före och 12 prickar efter, både rätt och fel'` i `tests/eserier.test.mjs`. Det ersätts av testerna ovan.

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/eutan.test.mjs`
Väntat: FAIL, där `seen` bara innehåller `namn`.

- [ ] **Steg 3: Skriv koden**

Byt `GRADES.e[0]` mot:

```js
    // Nykomling: vad en E-serie är. Klockan fylls efter svaret.
    () => rnd([() => choice(() => {
      const right = '10–100 är uppdelat i 12 steg';
      const opts = shuffle([right, '±12 % tolerans', 'Värden upp till 12 kΩ', '12 färgband']);
      S.cq = {prompt:'Vad betyder 12 i E12?', layout:'txt', right: opts.indexOf(right), opts: opts.map(x => ({html: x})),
        res: () => S.answered ? dialSVG(12, {count: true, pop: true}) : dialSVG(12, {dots: false}),
        wrong: 'E12 delar 10–100 i 12 steg. Varje steg är ungefär 20 % större än det förra. Sedan börjar det om med en nolla till: 100, 120, 150 …'};
    }, {eq: 'namn'}), () => choice(() => {
      const right = 'Standardvärden som motstånd säljs i';
      const opts = shuffle([right, 'En färgkod för motstånd', 'Ett motstånd på 12 Ω', 'En tolerans på ±12 %']);
      // Vid fel: klockan fylls, sedan tänds samma värde med olika nollor
      const ex = ['4,7 Ω', '47 Ω', '4,7 kΩ'], at = 1.3;
      S.cq = {prompt:'Vad är E12?', layout:'txt', right: opts.indexOf(right), opts: opts.map(x => ({html: x})),
        anim: {total: at + ex.length * .4 + .6},
        res: () => !S.answered ? dialSVG(12, {dots: false}) : dialSVG(12, {pop: true}) + (S.ok || inExam() ? ''
          : `<p class="eex">Samma värde: ${ex.map((x, i) => `<span class="mk" style="animation-delay:${(at + i * .4).toFixed(2)}s">${x}</span>`).join(' · ')}</p>`),
        wrong: 'E12 är en lista med standardvärden. Motstånd tillverkas inte i alla värden, bara i de här 12 och samma siffror gånger 10, 100, 1000 …'};
    }, {eq: 'vad'})])(),
```

CSS efter `.eneed{…}`:

```css
.eex{text-align:center;font-weight:700;margin:6px 0 0}
```

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/eutan.test.mjs tests/eserier.test.mjs`
Väntat: PASS.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: alla gröna.

```bash
git add index.html tests/eutan.test.mjs tests/eserier.test.mjs
git commit -m "E-seriernas Nykomling: Vad betyder 12 i E12? (12 steg) och Vad är E12?"
```

---

### Task 3: Vilken serie tillhör motståndet? med felanimeringen, på Gesäll

**Filer:**
- Ändra: `index.html` (ny `bandQ`, `GRADES.e[2]` och CSS)
- Ändra: `tests/eserier.test.mjs` (testerna för Gesäll med staplar och serie ↔ tolerans pekar på grad 2, och flyttas i Task 4)
- Test: `tests/eutan.test.mjs`

**Gränssnitt:**
- Använder: `bandResistor`, `serOfBands`, `SERS` och `SER_T` från Task 1, samt `svg()` med `ring`, `mark`, `markAnim` och `notes`.
- Skapar: `bandQ({sers, six = false, flip = false, showTol = false}) → plan` med `eq: 'band'`, och `S.cq.r = {bands, ser, flip}`.

- [ ] **Steg 1: Skriv testerna som ska fallera**

Lägg till i `tests/eutan.test.mjs`:

```js
test('Gesäll: Vilken serie tillhör motståndet?, svaren E6–E96, toleransen står inte utskriven och motståndet sitter rättvänt', () => {
  const t = atGrade('e', 2), seen = new Set();
  for (let i = 0; i < 60; i++) {
    t.g('next()');
    assert.equal(t.g('S.plan.eq'), 'band');
    assert.equal(t.$('#q .prompt').textContent.trim(), 'Vilken serie tillhör motståndet?');
    assert.deepEqual(t.$$('#q [data-c]').map(b => b.textContent.trim()), ['E6','E12','E24','E48','E96']);
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), t.g('serOfBands(S.cq.r.bands)'));
    assert.equal(t.$('#q .etol'), null);
    assert.equal(t.g('S.cq.r.flip'), false);
    assert.ok([3, 4, 5].includes(t.g('S.cq.r.bands.length')));
    seen.add(t.g('S.cq.r.ser'));
  }
  assert.equal(seen.size, 5);
});

test('Vilken serie tillhör motståndet?: efter svaret har toleransbandet en ring, vid fel lappen och pilen till serien', () => {
  for (const ok of [true, false]) {
    const t = atGrade('e', 2);
    until(t, p => p.eq === 'band');
    while (t.g('S.cq.r.bands.length') === 3) t.g('next()');
    answer(t, ok);
    assert.equal(t.$$('#q .res .ring.ok').length, 1, 'ringen');
    assert.equal(!!t.$('#q .eband'), !ok, 'lappen och pilen vid fel');
    if (!ok) {
      const c = t.g('C[S.cq.r.bands[tolIdx(S.cq.r.bands.length)]].n');
      assert.match(t.$('#q .eband').textContent, new RegExp(`${c} ±.* → ${t.g('S.cq.r.ser')}`));
      assert.ok(t.$$('#q [data-c]')[t.g('S.cq.right')].classList.contains('land'), 'rätt knapp lyser upp');
      assert.ok(t.g('S.lockUntil - S.revealAt') >= 0, 'låset sätts');
    }
  }
});

test('Vilken serie tillhör motståndet?: tre band visar platsen för det saknade bandet: Inget band ±20 %', () => {
  const t = atGrade('e', 2);
  for (let i = 0; i < 200 && !(t.g("S.plan.eq === 'band'") && t.g('S.cq.r.bands.length') === 3); i++) t.g('next()');
  answer(t, false);
  assert.match(t.$('#q .eband').textContent, /Inget band ±20 % → E6/);
  assert.ok(t.$('#q .res rect[stroke-dasharray]'), 'det saknade bandet är streckat');
});
```

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/eutan.test.mjs`
Väntat: FAIL, eftersom eq är `staplar` eller `serietol`.

- [ ] **Steg 3: Skriv koden**

Efter `stairHTML` i `index.html`:

```js
// Vilken serie tillhör motståndet? Bara toleransbandet avgör. showTol: toleransen står utskriven (Lärling).
// Vid fel: ett vänt motstånd vänds rätt, ringen runt toleransbandet, lappen "Guld ±5 % → E24" och rätt knapp lyser upp.
const BAND_T = {turn: .5, ring: .2, lab: .7, seq: 1.2, land: 1.5, total: 2.2};
function bandQ({sers, six = false, flip = false, showTol = false}){
  return choice(() => {
    const r = bandResistor({sers, six: six && Math.random() < .5, flip: flip && Math.random() < .5});
    const opts = sers.includes('E192') ? SERS : SERS.slice(0, 5), n = r.bands.length, ti = n === 3 ? 3 : tolIdx(n);
    const tol = n === 3 ? 20 : C[r.bands[ti]].t;
    const lab = n === 3 ? `Inget band ${fmtTol(20)}` : `${C[r.bands[ti]].n} ${fmtTol(tol)}`;
    const sh = r.flip ? BAND_T.turn : 0, T = k => BAND_T[k] + sh;
    S.cq = {r, prompt:'Vilken serie tillhör motståndet?', layout:'mc', right: opts.indexOf(r.ser), opts: opts.map(x => ({html: x})),
      anim: {land: T('land'), total: T('total')},
      res: () => {
        const fx = S.answered && !S.ok && !inExam();
        // Tre band: ett streckat tomt band där toleransbandet skulle ha suttit
        const b = fx && n === 3 ? [...r.bands, null] : r.bands, st = {...(b.length === 4 && n === 3 ? stdStyle(4) : styleFor(b)), flip: fx ? false : r.flip};
        const o = {style: st, label: `Motstånd med ${n} färgband`};
        // Efter svaret: ring runt toleransbandet. Vid fel dyker den upp i animeringen, och på en trebandare runt det streckade bandet.
        if (S.answered && (n > 3 || fx)) o.ring = [[ti, 'ok', fx ? T('ring') : null]];
        if (fx) {
          o.mark = [[ti, lab]]; o.markKind = 'ok'; o.markAnim = {start: T('lab'), step: 0};
          if (n === 6) o.notes = [{i: 5, text: 'inte tolerans'}];
        }
        const pic = `<div class="${fx && r.flip ? 'eturn' : ''}">${svg(b, o)}</div>`;
        return pic + (showTol ? `<p class="etol">${fmtTol(tol)}</p>` : '')
          + (fx ? `<p class="eband mk" style="animation-delay:${T('seq').toFixed(2)}s">${lab} → <b>${r.ser}</b></p>` : '');
      },
      wrong: n === 3 ? 'Tre band: inget toleransband, alltså ±20 %, och ±20 % är E6.'
        : `Titta på toleransbandet${n === 6 ? ', det näst sista' : ''}: ${C[r.bands[ti]].n.toLowerCase()} är ${fmtTol(tol)}, och ${fmtTol(tol)} är ${r.ser}.`};
  }, {eq: 'band'});
}
```

Byt `GRADES.e[2]` (Gesäll) mot följande. `bandQ` returnerar en plan, precis som `choice()`:

```js
    // Gesäll: vilken serie tillhör motståndet? Bara toleransbandet avgör.
    () => bandQ({sers: SERS.slice(0, 5)}),
```

CSS efter `.eex{…}`:

```css
.etol{text-align:center;font-family:var(--display);font-weight:700;font-size:1.6rem;margin:0}
.eband{text-align:center;font-weight:700;font-size:1.1rem;margin:4px 0 0}
.eband b{color:var(--ok)}
@media (prefers-reduced-motion:no-preference){.eturn svg{animation:turn .45s ease-out both}}
```

Flytta testerna `'E-seriernas Gesäll: Vilken tolerans är serien gjord för?, tre stapelrader efter svaret'` och `'E-seriernas Gesäll blandar staplarna med serie ↔ tolerans'` samt utrullningstesterna, som använder `live('e', 2)` och `atGrade('e', 2)` med `until(… 'staplar')`, till grad 1 i Task 4. Hoppa över dem tillfälligt med `test.skip` och kommentaren `// flyttas till Lärling i Task 4`.

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/eutan.test.mjs tests/eserier.test.mjs`
Väntat: PASS, med de tillfälligt överhoppade testerna som skip.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: gröna. Beroenderegeln i `model.test.mjs` (`e: [['choice'],['choice'],['choice'],…]`) håller fortfarande för grad 2.

```bash
git add index.html tests/eutan.test.mjs tests/eserier.test.mjs
git commit -m "E-seriernas Gesäll: Vilken serie tillhör motståndet? med ringen, lappen och pilen vid fel"
```

---

### Task 4: Lärling: serie ↔ tolerans med trappan, vilken serie räcker, staplarna och motståndet med toleransen utskriven

**Filer:**
- Ändra: `index.html` (`GRADES.e[1]`)
- Ändra: `tests/eserier.test.mjs` (de överhoppade testerna pekar nu på grad 1)
- Test: `tests/eutan.test.mjs`

**Gränssnitt:**
- Använder: `stairHTML`, `stairEnd` och `bandQ` (med `showTol: true`).
- Skapar: `eq` `'serietol'`, `'racker'`, `'staplar'` och `'band'` på Lärling.

- [ ] **Steg 1: Skriv testerna som ska fallera**

```js
test('Lärling: serie ↔ tolerans, vilken serie räcker, staplarna och motståndet med toleransen utskriven', () => {
  const t = atGrade('e', 1), seen = new Set();
  for (let i = 0; i < 120; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['band', 'racker', 'serietol', 'staplar']);
});

test('Lärling: motståndet har toleransen utskriven, och den stämmer med bandet', () => {
  const t = atGrade('e', 1);
  for (let i = 0; i < 20; i++) {
    until(t, p => p.eq === 'band');
    const b = JSON.parse(t.g('JSON.stringify(S.cq.r.bands)'));
    const tol = b.length === 3 ? 20 : t.g(`C.${b[t.g(`tolIdx(${b.length})`)]}.t`);
    assert.equal(t.$('#q .etol').textContent, t.g(`fmtTol(${tol})`));
  }
});

test('Lärling: serie ↔ tolerans visar trappan vid fel med paret markerat', () => {
  const t = atGrade('e', 1);
  until(t, p => p.eq === 'serietol');
  answer(t, false);
  assert.equal(t.$$('#q .estep').length, 6);
  assert.equal(t.$$('#q .estep.hl').length, 1);
  assert.ok(t.g('S.cq.anim.total') >= t.g('stairEnd()'));
});

test('Lärling: vilken serie räcker, rätt svar är serien gjord för toleransen, med en grövre när det finns och alltid en finare', () => {
  const t = atGrade('e', 1);
  for (let i = 0; i < 60; i++) {
    until(t, p => p.eq === 'racker');
    const need = +t.$('#q .prompt').textContent.match(/tål ±(\d+)/)[1];
    const opts = t.$$('#q [data-c]').map(b => b.textContent.trim()), right = opts[t.g('S.cq.right')];
    assert.equal(right, t.g(`TOL_SER[${need}]`));
    const idx = s => t.g(`SERS.indexOf('${s}')`);
    if (need < 20) assert.ok(opts.some(s => idx(s) === idx(right) - 1), 'en grövre');
    assert.ok(opts.some(s => idx(s) > idx(right)), 'en finare');
    assert.equal(new Set(opts).size, 4);
  }
  answer(t, false);
  assert.equal(t.$$('#q .estep.bad').length + t.$$('#q .estep.ok').length + t.$$('#q .estep.more').length, 6);
  assert.ok(t.$('#q .eneed'));
});
```

Ta bort `test.skip` på de tester som hoppades över i Task 3, och byt `atGrade('e', 2)`/`live('e', 2)` mot grad 1 i dem. Testet `'E-seriernas Gesäll blandar staplarna med serie ↔ tolerans'` tas bort, eftersom det ersätts av det första testet ovan. I staplartestet byts rubriken till `'E-seriernas Lärling: Vilken tolerans är serien gjord för?, tre stapelrader efter svaret'`.

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/eutan.test.mjs tests/eserier.test.mjs`
Väntat: FAIL, eftersom grad 1 fortfarande är `klocka`.

- [ ] **Steg 3: Skriv koden**

Lärlings frågor blir namngivna funktioner, så att Stormästare kan använda dem i Task 7. Lägg dem efter `bandQ`. Den gamla Gesäll-koden för `staplar` och `serietol` flyttas hit, och `serietol` får trappan:

```js
// Lärling: serie och tolerans hör ihop
const eSerieTol = () => choice(() => {
      const s = rnd(Object.keys(SER_TOL)), t = SER_TOL[s], line = 'E6 ±20 %, E12 ±10 %, E24 ±5 %, E48 ±2 %, E96 ±1 %.';
      const common = {anim: {total: stairEnd()}, after: () => S.ok ? '' : stairHTML({hl: s}), wrong: line};
      if (Math.random() < .5) {
        const vals = pick4(t, [], Object.values(SER_TOL));
        S.cq = {...common, prompt:`Vilken tolerans hör till ${s}?`, layout:'mc', right: vals.indexOf(t), opts: vals.map(v => ({html: fmtTol(v)}))};
      } else {
        const ss = pick4(s, [], Object.keys(SER_TOL));
        S.cq = {...common, prompt:`Vilken serie hör till ${fmtTol(t)}?`, layout:'mc', right: ss.indexOf(s), opts: ss.map(x => ({html: x}))};
      }
}, {eq: 'serietol'});
const eRacker = () => choice(() => {
      // Vilken serie räcker? Den grövsta serien vars tolerans är högst kravet.
      const need = rnd([20, 10, 5, 2, 1]), right = TOL_SER[need], ri = SERS.indexOf(right);
      const coarse = ri > 0 ? [SERS[ri - 1]] : [], finer = SERS.slice(ri + 1);
      const rest = shuffle(SERS.filter(s => s !== right && !coarse.includes(s) && s !== finer[0]));
      const opts = shuffle([right, ...coarse, finer[0], ...rest].slice(0, 4));
      S.cq = {prompt:`Ditt bygge tål ${fmtTol(need)}. Vilken serie räcker, med så få värden som möjligt?`, layout:'mc',
        right: opts.indexOf(right), opts: opts.map(x => ({html: x})),
        anim: {total: stairEnd() + .4}, after: () => S.ok ? '' : stairHTML({need}),
        wrong: `${fmtTol(need)} räcker, och ${right} är gjord för ${fmtTol(need)}.${coarse.length ? ` ${coarse[0]} är för grov (${fmtTol(SER_T[coarse[0]])}).` : ''} Finare serier fungerar också, men har fler värden än du behöver.`};
}, {eq: 'racker'});
const eStaplar = () => choice(() => {
      const n = rnd([6, 12, 24]), tols = ETOL_Q[n], right = tols[1], opts = shuffle(tols.slice());
      S.cq = {prompt:`Vilken tolerans är E${n} gjord för?`, layout:'mc', right: opts.indexOf(right), tols: opts,
        opts: opts.map(v => ({html: fmtTol(v)})),
        res: () => S.answered && !inExam() ? etolRows(n, tols) : rulerSVG(n, {roll: rollNow()}),
        wrong: `E${n} är gjord för ${fmtTol(right)}. Då når varje värde ungefär fram till grannen, och alla resistanser mellan 10 och 100 täcks. Röd är krock, gul är glapp.`};
}, {eq: 'staplar'});
```

Byt `GRADES.e[1]` mot:

```js
    // Lärling: serie ↔ tolerans, vilken serie räcker, staplarna och motståndet med toleransen utskriven
    () => rnd([eSerieTol, eRacker, eStaplar, () => bandQ({sers: SERS.slice(0, 5), showTol: true})])(),
```

`opts` i `racker` behöver fyra olika serier. `[right, ...coarse, finer[0], ...rest]` har alltid minst fyra element, eftersom `SERS` har sex. För `need = 1` är `finer[0]` E192.

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/eutan.test.mjs tests/eserier.test.mjs`
Väntat: PASS.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: gröna.

```bash
git add index.html tests/eutan.test.mjs tests/eserier.test.mjs
git commit -m "E-seriernas Lärling: serie ↔ tolerans med trappan, vilken serie räcker, staplarna och motståndet med toleransen utskriven"
```

---

### Task 5: Samma siffror, annan multiplikator

**Filer:**
- Ändra: `index.html` (ny `multiQ` efter `bandQ`, och CSS)
- Test: `tests/eutan.test.mjs`

**Gränssnitt:**
- Skapar: `multiQ() → plan` med `eq: 'multi'`, och `S.cq.m = {ser, hint, odd}`, där `hint` och `odd` är tvåsiffriga heltal, som 33 och 29.

- [ ] **Steg 1: Skriv testerna som ska fallera**

```js
test('Samma siffror: tre svar har ledtrådens siffror, det udda finns inte i serien och har andra siffror', () => {
  const t = atGrade('e', 0);
  for (let i = 0; i < 200; i++) {
      t.g('GRADES.e[0] = multiQ; next()');
    const m = JSON.parse(t.g('JSON.stringify(S.cq.m)')), list = JSON.parse(t.g(`JSON.stringify(ESER['${m.ser}'][0])`));
    assert.ok(list.includes(m.hint));
    assert.ok(!list.includes(m.odd), `${m.odd} finns inte i ${m.ser}`);
    assert.notEqual(m.odd, m.hint);
    assert.ok(Math.abs(m.odd - m.hint) <= 8, 'siffror nära ledtråden');
    assert.ok(['E6', 'E12'].includes(m.ser));
    const vals = JSON.parse(t.g('JSON.stringify(S.cq.vals)'));
    const digits = v => { let x = v; while (x >= 100) x /= 10; while (x < 10) x *= 10; return Math.round(x); };
    vals.forEach((v, j) => assert.equal(digits(v), j === t.g('S.cq.right') ? m.odd : m.hint));
    assert.equal(new Set(vals).size, 4);
  }
});

test('Samma siffror: frågan har ledtråden, är Vilken ska bort?, och vid fel delas svaren upp i siffror och multiplikator', () => {
  const t = atGrade('e', 0);
  t.g('GRADES.e[0] = multiQ; next()');
  const m = JSON.parse(t.g('JSON.stringify(S.cq.m)'));
  assert.ok(t.$('#q .oddhead'));
  assert.match(t.$('#q .prompt').textContent, new RegExp(`${t.g(`num(${m.hint} / 10)`)} Ω finns i ${m.ser}`));
  answer(t, false);
  const rows = t.$$('#q .emrow');
  assert.equal(rows.length, 4);
  assert.equal(t.$$('#q .emrow.ok').length, 3);
  assert.match(t.$('#q .emrow.bad').textContent, new RegExp(String(m.odd).split('').join(' ')));
});
```

Testerna sätter frågan med `GRADES.e[0] = multiQ; next()`, eftersom `next()` hämtar planen ur `GRADES[topic][grad]()`. Grad 0 är E-seriernas Nykomling i `atGrade('e', 0)`. I det första testet laddas sidan med `load()`, vars ämne är Motståndet, så där sätts också ämnet: använd `atGrade('e', 0)` i stället för `load()`.

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/eutan.test.mjs`
Väntat: FAIL, `multiQ is not defined`.

- [ ] **Steg 3: Skriv koden**

```js
// Samma siffror, annan multiplikator: ledtråden är ett värde ur serien, tre svar har samma siffror,
// det udda har siffror nära ledtråden som inte finns i serien.
const MULTS = [1, 10, 100, 1000, 10000, 100000];
function multiQ(){
  return choice(() => {
    const ser = rnd(['E6', 'E12']), list = ESER[ser][0], hint = rnd(list);
    let odd; do { odd = hint + rnd([-8,-7,-6,-5,-4,-3,-2,-1,1,2,3,4,5,6,7,8]); } while (odd < 10 || odd > 99 || list.includes(odd));
    const right = rnd4(), ms = shuffle(MULTS.slice()).slice(0, 4);
    const vals = ms.map((k, i) => Math.round((i === right ? odd : hint) / 10 * k * 100) / 100);
    const dg = x => String(x).split('').join(' ');
    const row = (v, i) => { const d = i === right ? odd : hint, k = v / (d / 10);
      return `<div class="emrow ${i === right ? 'bad' : 'ok'} mk" style="animation-delay:${(.4 + i * .4).toFixed(2)}s"><b>${dg(d)}</b> ${fmtMult(k / 10)} = ${fmtVal(v)} ${i === right ? '✗' : '✓'}</div>`; };
    S.cq = {odd: true, m: {ser, hint, odd}, vals, prompt:`${num(hint / 10)} Ω finns i ${ser}. Vilken av resistanserna finns inte i ${ser}?`,
      layout:'mc', right, opts: vals.map(v => ({html: fmtVal(v)})),
      anim: {total: .4 + 4 * .4 + .6},
      after: () => S.ok ? '' : `<div class="emrows"><p class="emhint">${num(hint / 10)} Ω = <b>${dg(hint)}</b> ${fmtMult(0.1)}</p>${vals.map(row).join('')}</div>`,
      wrong: `Samma siffror, ${String(hint).split('').join(' och ')}, med olika multiplikator finns alla i ${ser}. ${fmtVal(vals[right])} har siffrorna ${String(odd).split('').join(' och ')}.`};
  }, {eq: 'multi'});
}
```

CSS:

```css
.emrows{display:grid;gap:4px;max-width:360px;margin:6px auto;font-variant-numeric:tabular-nums}
.emhint{text-align:center;margin:0 0 4px}
.emrow{padding:4px 10px;border-radius:8px;border:1px solid var(--line);background:var(--surface)}
.emrow b{font-family:var(--display);font-size:1.15rem;letter-spacing:.1em}
.emrow.ok{border-color:var(--ok)}
.emrow.bad{border-color:var(--bad);background:var(--bad-bg)}
```

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/eutan.test.mjs`
Väntat: PASS.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: gröna.

```bash
git add index.html tests/eutan.test.mjs
git commit -m "E-serierna: Samma siffror, annan multiplikator, med siffrorna uppdelade vid fel"
```

---

### Task 6: Vilken serie räcker säkert? med tabell och tallinje

**Filer:**
- Ändra: `index.html` (ny `safeTask`, `safeRows`, `safeSVG` och `safeQ` efter `multiQ`, och CSS)
- Test: `tests/eutan.test.mjs`

**Gränssnitt:**
- Skapar:
  - `eCands(ser, T) → number[]`: seriens värden i dekaderna runt T.
  - `safeRows(T, need) → [{s, ts, v, ok}]` för E6–E96.
  - `safeTask() → {T, need, rows, answer}`
  - `safeQ() → plan` med `eq: 'sakert'`

- [ ] **Steg 1: Skriv testerna som ska fallera**

```js
test('Räcker säkert: exemplet 3,4 kΩ ±10 % ger E24, eftersom E12:s 3,3 kΩ ±10 % kan bli för lågt', () => {
  const t = load();
  const rows = JSON.parse(t.g('JSON.stringify(safeRows(3400, 10))'));
  const by = s => rows.find(r => r.s === s);
  assert.equal(by('E6').ok, false);
  assert.equal(by('E12').ok, false);
  assert.equal(by('E24').ok, true);
  assert.equal(by('E24').v, 3300);
});

test('Räcker säkert: gränsfall avgörs med tolerans för flyttal', () => {
  const t = load();
  // 3,3 kΩ ±5 % = 3135–3465. Ett fönster på exakt 3135–3465 ska räcka.
  const T = (3135 + 3465) / 2, need = (3465 - T) / T * 100;
  const rows = JSON.parse(t.g(`JSON.stringify(safeRows(${T}, ${need}))`));
  assert.equal(rows.find(r => r.s === 'E24').ok, true);
});

test('Räcker säkert: slumpade uppgifter är alltid lösbara, aldrig E6, och den grövre räcker inte', () => {
  const t = load();
  for (let i = 0; i < 300; i++) {
    const k = JSON.parse(t.g('JSON.stringify(safeTask())'));
    assert.ok(['E12','E24','E48','E96'].includes(k.answer), k.answer);
    const i0 = k.rows.findIndex(r => r.s === k.answer);
    assert.equal(k.rows[i0].ok, true);
    assert.ok(k.rows.slice(0, i0).every(r => !r.ok), 'alla grövre räcker inte');
    assert.ok([20, 10, 5, 2].includes(k.need));
  }
});

test('Räcker säkert: tabellen visas före svaret, och vid fel tallinjen med staplar fram till svaret', () => {
  const t = atGrade('e', 0);
  t.g('GRADES.e[0] = safeQ; next()');
  assert.equal(t.$$('#q .esafe tr').length, 5, 'en rad per serie E6–E96');
  assert.deepEqual(t.$$('#q [data-c]').map(b => b.textContent.trim()), ['E6','E12','E24','E48','E96']);
  answer(t, false);
  const ans = t.g('S.cq.k.answer'), bars = t.$$('#q .esline .ebarr');
  assert.equal(bars.length, t.g(`SERS.indexOf('${ans}')`) + 1);
  assert.ok(bars.at(-1).classList.contains('ok'));
  assert.ok(bars.slice(0, -1).every(b => b.classList.contains('bad')));
  assert.ok(t.$$('#q [data-c]')[t.g('S.cq.right')].classList.contains('land'));
});
```

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/eutan.test.mjs`
Väntat: FAIL, `safeRows is not defined`.

- [ ] **Steg 3: Skriv koden**

```js
// Vilken serie räcker säkert? En serie räcker om den har ett värde vars hela toleransintervall ryms i fönstret T ± need %.
const SAFE_SERS = SERS.slice(0, 5), EPS = 1e-9;
// Seriens värden i dekaden under, i och över T
function eCands(ser, T){
  const two = ['E6','E12','E24'].includes(ser), e = Math.floor(Math.log10(T));
  return [e - 1, e, e + 1].flatMap(d => ESER[ser][0].map(m => Math.round(m / (two ? 10 : 100) * 10 ** d * 1e6) / 1e6));
}
function safeRows(T, need){
  const lo = T * (1 - need / 100), hi = T * (1 + need / 100);
  const near = vs => vs.reduce((a, v) => Math.abs(Math.log(v / T)) < Math.abs(Math.log(a / T)) ? v : a);
  return SAFE_SERS.map(s => {
    const ts = SER_T[s], c = eCands(s, T);
    const fit = c.filter(v => v * (1 - ts / 100) >= lo * (1 - EPS) && v * (1 + ts / 100) <= hi * (1 + EPS));
    return {s, ts, v: near(fit.length ? fit : c), ok: fit.length > 0};
  });
}
function safeTask(){
  for (;;) {
    const three = Math.random() < .3, m = three ? 100 + Math.floor(Math.random() * 900) : 10 + Math.floor(Math.random() * 90);
    const T = Math.round(m / (three ? 100 : 10) * rnd([1, 10, 100, 1000, 10000]) * 100) / 100, need = rnd([20, 10, 5, 2]);
    const rows = safeRows(T, need), hit = rows.find(r => r.ok);
    if (hit && hit.s !== 'E6') return {T, need, rows, answer: hit.s};
  }
}
// Tallinjen: fönstret i grönt, seriernas staplar fram till svaret, rött där de sticker ut
function safeSVG(k){
  const {T, need} = k, rows = k.rows.slice(0, SAFE_SERS.indexOf(k.answer) + 1), half = Math.max(2.5 * need, 6) / 100;
  const x = v => Math.max(8, Math.min(392, 200 + (v - T) / (T * half) * 170)), lo = T * (1 - need / 100), hi = T * (1 + need / 100);
  let h = `<rect class="ewin" x="${f1(x(lo))}" y="4" width="${f1(x(hi) - x(lo))}" height="${rows.length * 30 + 8}" rx="4"/>`;
  rows.forEach((r, i) => {
    const y = 22 + i * 30, a = r.v * (1 - r.ts / 100), b = r.v * (1 + r.ts / 100), d = (.3 + i * .5).toFixed(2);
    const seg = (p, q, cls) => q > p ? `<line class="${cls}" x1="${f1(x(p))}" x2="${f1(x(q))}" y1="${y}" y2="${y}"/>` : '';
    h += `<g class="ebarr ${r.ok ? 'ok' : 'bad'} mk" style="animation-delay:${d}s"><text x="200" y="${y - 7}">${r.s} ${fmtVal(r.v)} ${fmtTol(r.ts)}</text>`
      + seg(a, Math.min(b, lo), 'out') + seg(Math.max(a, lo), Math.min(b, hi), 'in') + seg(Math.max(a, hi), b, 'out') + '</g>';
  });
  return `<svg class="esline" viewBox="0 0 400 ${rows.length * 30 + 30}" aria-hidden="true">${h}<text class="eaxis" x="200" y="${rows.length * 30 + 26}">${fmtVal(lo)} – ${fmtVal(hi)}</text></svg>`;
}
function safeQ(){
  return choice(() => {
    const k = safeTask(), n = SAFE_SERS.indexOf(k.answer) + 1, land = .3 + n * .5 + .2;
    const near3 = s => eCands(s, k.T).sort((a, b) => Math.abs(Math.log(a / k.T)) - Math.abs(Math.log(b / k.T))).slice(0, 3).sort((a, b) => a - b);
    const table = `<table class="esafe">${SAFE_SERS.map(s => `<tr><th>${s} ${fmtTol(SER_T[s])}</th><td>${near3(s).map(fmtVal).join(' · ')}</td></tr>`).join('')}</table>`;
    const bad = k.rows[n - 2];
    S.cq = {k, prompt:`Du behöver ${fmtVal(k.T)}, och det får avvika högst ${fmtTol(k.need)}. Vilken är den grövsta serien som säkert räcker?`,
      layout:'mc', right: n - 1, opts: SAFE_SERS.map(s => ({html: s})), anim: {land, total: land + .7},
      res: () => table, after: () => S.ok ? '' : safeSVG(k),
      wrong: `${bad.s} har ${fmtVal(bad.v)} ${fmtTol(bad.ts)}, och det kan hamna utanför ${fmtVal(k.T * (1 - k.need / 100))}–${fmtVal(k.T * (1 + k.need / 100))}. ${k.answer} har ${fmtVal(k.rows[n - 1].v)} ${fmtTol(k.rows[n - 1].ts)}, som ryms. Det räcker inte att värdet ligger nära: hela toleransen måste rymmas.`};
  }, {eq: 'sakert'});
}
```

CSS:

```css
.esafe{margin:6px auto;border-collapse:collapse;font-size:.9rem;font-variant-numeric:tabular-nums}
.esafe th{text-align:left;padding:2px 10px 2px 0;font-weight:700;white-space:nowrap}
.esafe td{padding:2px 0}
.esline{display:block;width:100%;max-width:480px;margin:6px auto}
.esline .ewin{fill:var(--ok-bg);stroke:var(--ok);stroke-width:1.5;stroke-dasharray:4 3}
.esline text{font-size:13px;text-anchor:middle;fill:var(--ink)}
.esline .eaxis{fill:var(--muted)}
.esline line{stroke-width:7;stroke-linecap:round}
.esline .in{stroke:var(--muted)}
.esline .ok .in{stroke:var(--ok)}
.esline .out{stroke:var(--bad)}
```

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/eutan.test.mjs`
Väntat: PASS.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: gröna.

```bash
git add index.html tests/eutan.test.mjs
git commit -m "E-serierna: Vilken serie räcker säkert? med tabellen och tallinjen vid fel"
```

---

### Task 7: Mästare och Stormästare, bort med det gamla, dev.html och specen

**Filer:**
- Ändra: `index.html` (`GRADES.e[3]` och `GRADES.e[4]`. Bort med frågetypen `series`, `genSeriesRead`, `seriesWhy`, `seriesRuler`, `SER_OPTS`, `rulerHold` och `marks` i `rulerSVG` med CSS.)
- Ändra: `tests/answer.mjs`, `tests/model.test.mjs`, `tests/eserier.test.mjs`
- Ändra: `dev.html` (`CATALOG.e`)
- Ändra: `docs/superpowers/specs/2026-10-07-eserier-utan-varden-design.md` (beroenderegeln)
- Test: `tests/eutan.test.mjs`

- [ ] **Steg 1: Skriv testerna som ska fallera**

```js
test('Mästare: svåra motstånd (E192, sex band, vända), samma siffror och räcker säkert', () => {
  const t = atGrade('e', 3), seen = new Set(), sers = new Set();
  let six = false, flip = false;
  for (let i = 0; i < 300; i++) {
    t.g('next()'); seen.add(t.g('S.plan.eq'));
    if (t.g("S.plan.eq === 'band'")) {
      sers.add(t.g('S.cq.r.ser'));
      six ||= t.g('S.cq.r.bands.length') === 6; flip ||= t.g('S.cq.r.flip');
      assert.equal(t.$$('#q [data-c]').length, 6, 'E6–E192');
    }
  }
  assert.deepEqual([...seen].sort(), ['band', 'multi', 'sakert']);
  assert.ok(sers.has('E192') && six && flip);
});

test('Vänt motstånd med sex band: ringen sitter på toleransbandet efter att det vänts rätt', () => {
  const t = atGrade('e', 3);
  for (let i = 0; i < 500 && !(t.g("S.plan.eq === 'band'") && t.g('S.cq.r.flip') && t.g('S.cq.r.bands.length') === 6); i++) t.g('next()');
  answer(t, false);
  assert.ok(t.$('#q .eturn svg'), 'vänds rätt');
  const ring = t.$('#q .res .ring.ok'), x = +ring.getAttribute('x') + +ring.getAttribute('width') / 2;
  assert.ok(Math.abs(x - t.g('STD_X[6][4]')) < 1, 'ringen på band 5 av 6, rättvänt');
  assert.match(t.$('#q .res').textContent, /inte tolerans/);
});

test('Stormästare: blandar serie ↔ tolerans, räcker, band, samma siffror och räcker säkert', () => {
  const t = atGrade('e', 4), seen = new Set();
  for (let i = 0; i < 300; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['band', 'multi', 'racker', 'sakert', 'serietol']);
});

test('Inga värden behövs: ingen E-fråga har svaret Inte standard, och frågetypen series finns inte', () => {
  for (let g = 0; g < 5; g++) {
    const t = atGrade('e', g);
    for (let i = 0; i < 60; i++) {
      t.g('next()');
      assert.equal(t.g('S.type'), 'choice');
      assert.ok(!/Inte standard/.test(t.$('#q').textContent));
    }
  }
  assert.equal(load().g("typeof genSeriesRead"), 'undefined');
});

test('Eldprovet och blandat spelar alla nya E-frågor utan fel', () => {
  const t = golden('e');
  for (let i = 0; i < 80; i++) { t.g('next()'); answer(t, i % 2 === 0); }
  assert.deepEqual(t.errors, []);
  const u = load({ storage: ALL_OPEN });
  u.g("openTopic('ultra'); beginExam()");
  for (let i = 0; i < 20; i++) { answer(u, i % 3 !== 0); if (u.g('S.answered') && !u.g('S.exam.done')) u.$('#q').click(); }
  assert.deepEqual(u.errors, []);
});
```

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/eutan.test.mjs`
Väntat: FAIL, eftersom Mästare fortfarande har `e12` och `series`.

- [ ] **Steg 3: Skriv koden**

Byt `GRADES.e[3]` och `GRADES.e[4]` mot:

```js
    // Mästare: svåra motstånd, samma siffror med annan multiplikator, och vilken serie räcker säkert
    () => rnd([() => bandQ({sers: SERS, six: true, flip: true}), multiQ, safeQ])(),
    // Stormästare: allt blandat
    () => rnd([eSerieTol, eRacker, () => bandQ({sers: SERS, six: true, flip: true}), multiQ, safeQ])()
```

`eSerieTol` och `eRacker` är Lärlings namngivna funktioner från Task 4.

Ta bort:
- I `next()`: grenen `if (S.type === 'series') { S.sr = genSeriesRead(); S.ser = … }`, `S.pickSr = null` och `'series'` i `S.moreOK`.
- I `render()`: grenen `if (S.type === 'series') { … }`.
- I `lessonText()`: raden `if (S.type === 'series') return seriesWhy();`.
- I `moreHTML()`: grenen `if (S.type === 'series') { … }`.
- I klickhanteraren: grenen `else if (btn.dataset.sr) { … }`.
- `SER_OPTS`, `genSeriesRead`, `seriesWhy` och `seriesRuler`.
- `rulerHold()` och dess användning i `reveal()`. Den blir `const barStart = S.ok ? .1 : Math.max(anim && !reduceMotion() ? anim.total : .3, 0);`, och kan förenklas till `S.ok ? .1 : anim && !reduceMotion() ? anim.total : .3`.
- `marks` i `rulerSVG` (parametern, ritningen av `.emark`, `.edrop` och nivåerna), och CSS-reglerna för `.emark` och `@keyframes edrop`.

Behåll `seriesOf`, `resistorFromSeries`, `seriesBands`, `pickDec`, `TOL_SER` och `stdInfo`, som används av andra ämnen och av `bandResistor`.

`tests/answer.mjs`: ta bort raden `if (type === 'series') …`.

`tests/model.test.mjs`:
- rad ~293: ta bort `['e', 3, '[data-sr]']`.
- rad ~563: ta bort grenen för `series`.
- rad ~731: `e: [['choice'], ['choice'], ['choice'], ['choice'], ['choice']]`.

`tests/eserier.test.mjs`: ta bort testerna som gäller det som försvann. Det är `'Linjalen: värden släpps ner med bock eller kryss'`, `'E-seriernas Lärling: Vilken serie är det här?, …'`, alla tester för `Inte i E12` och `Vilken serie`, `'E-seriernas Mästare blandar Inte i E12 med Vilken serie'`, `'Vid fel går det inte att gå vidare förrän värdet har fallit ner …'` och `'Värden som faller nära varandra hamnar på olika höjd'`. Kör `grep -n "e12\|series\|marks\|klocka" tests/eserier.test.mjs` efteråt. Det ska inte ge några träffar utom klockans egna tester.

`dev.html`, byt `CATALOG.e` mot:

```js
  e: [
    r('e-namn', 0, 'Vad 12 betyder', 'Vad betyder 12 i E12? 10–100 i 12 steg. En tom klocka ovanför svaren.', 'Flerval (text)', STD,
      'Klockan fylls: 12 prickar poppar in runt varvet, numrerade 1–12. Även vid rätt svar.'),
    r('e-vad', 0, 'Vad är E12?', 'Standardvärden som motstånd säljs i.', 'Flerval (text)', STD,
      'Klockan fylls, sedan tänds 4,7 Ω, 47 Ω och 4,7 kΩ: samma värde med olika nollor.'),
    r('e-serie-tol', 1, 'Serie → tolerans', 'Vilken tolerans hör till E24?', 'Flerval', STD,
      'Trappan: E6 ±20 % till E192 ±0,5 % kommer in steg för steg, paret lyser.'),
    r('e-tol-serie', 1, 'Tolerans → serie', 'Vilken serie hör till ±5 %?', 'Flerval', STD,
      'Trappan: E6 ±20 % till E192 ±0,5 % kommer in steg för steg, paret lyser.'),
    r('e-racker', 1, 'Vilken serie räcker?', 'Ditt bygge tål ±10 %. Vilken serie räcker, med så få värden som möjligt?', 'Flerval', STD,
      'Trappan med kravet: för grov i rött, räcker i grönt, fler värden än du behöver i grått.'),
    r('e-tol-staplar', 1, 'Vilken tolerans är serien gjord för?', 'Vilken tolerans är E12 (E6, E24) gjord för? För stor, rätt och för liten. Linjalen ovanför svaren, och klockan rullas ut första gången.', 'Flerval', STD,
      'Tre rader med toleransstaplar: krock i rött, kant i kant och glapp i gult. Den valda raden har en ram. Även vid rätt svar.'),
    r('e-band-tol', 1, 'Vilken serie, toleransen utskriven', 'Vilken serie tillhör motståndet? Toleransen står under.', 'Flerval', STD,
      'Ringen runt toleransbandet, lappen "Guld ±5 %" och pilen till serien. Rätt knapp lyser upp.'),
    r('e-band', 2, 'Vilken serie tillhör motståndet?', 'Bara toleransbandet avgör: guld, silver, brun, röd eller tre band.', 'Flerval', STD,
      'Ringen runt toleransbandet, lappen "Guld ±5 %" och pilen till serien. Rätt knapp lyser upp.'),
    r('e-band-svar', 3, 'Vilken serie, svårare', 'Också grön, blå och violett (E192), sex band och vända motstånd.', 'Flerval', STD,
      'Vänt motstånd vänds rätt, sedan ringen, lappen och pilen. På sex band: temperaturbandet är inte tolerans.'),
    r('e-multi', 3, 'Samma siffror', '3,3 Ω finns i E6. Vilken finns inte i E6?', VSB, POP,
      'Svaren delas upp i siffror och multiplikator: tre har samma siffror (✓), det udda andra (✗).'),
    r('e-sakert', 3, 'Räcker säkert?', 'Du behöver 3,4 kΩ ±10 %. Vilken är den grövsta serien som säkert räcker? Tabell med värden.', 'Flerval', STD,
      'Tallinjen: fönstret i grönt, seriernas staplar glider in, rött där de sticker ut, den första som ryms är grön.'),
    r('e-blandat', 4, 'Allt blandat', 'Serie ↔ tolerans, räcker, svåra motstånd, samma siffror och räcker säkert.', 'Flerval', STD,
      'Som på respektive grad.')
  ],
```

Specen: byt raden om beroenderegeln mot följande:

"Beroenderegeln i `model.test.mjs` för `e` blir choice på alla fem graderna. Alla frågor, också Vilken serie tillhör motståndet?, byggs som choice-frågor, och frågetypen `series` tas bort."

Lägg också till den här raden under "Det som försvinner":

"Frågetypen `series` tas bort helt."

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/*.test.mjs`
Väntat: alla gröna.

- [ ] **Steg 5: Commit**

```bash
git add index.html dev.html tests docs
git commit -m "E-seriernas Mästare och Stormästare utan värden, frågetypen series bort, dev.html och specen"
```

---

### Task 8: Kontroll i webbläsaren och publicering

**Filer:** inga ändringar om allt ser rätt ut.

- [ ] **Steg 1:** Starta en server och öppna `index.html?test` i Chromium i 412 × 780 px.
- [ ] **Steg 2:** Gå igenom grad 0–4 i E-serierna. Svara fel på varje sorts fråga och ta en skärmbild efter animeringen. Kontrollera:
  - att trappan, lappen, tallinjen och siffraderna får plats utan att klippas
  - att det vända motståndet vänds rätt innan ringen kommer
  - att mörkt läge fungerar
- [ ] **Steg 3:** Rätta det som syns fel, med ett test först där det går, och gör en commit.
- [ ] **Steg 4:** Publicera spelet och dev.html enligt minnet om artifacter med testläge (`index2.html` med `data-test="true"`, och dev.html med `files`).
