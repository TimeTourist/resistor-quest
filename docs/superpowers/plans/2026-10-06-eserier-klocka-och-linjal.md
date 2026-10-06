# E-serierna med klockan och linjalen – implementationsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Mål:** E-serierna introduceras lätt med två bilder: en klocka för de första graderna och en linjal med toleransstaplar när toleransen kommer in.

**Arkitektur:** Två ritfunktioner, `dialSVG` och `rulerSVG`, ger SVG som sträng, i samma stil som `svg()` och `scaleHTML()`. Frågorna i `PLANS.e` använder dem genom `res` (ovanför svaren) och ett nytt fält `after` (under svaren) i `choiceHTML`. Animeringarna är CSS-keyframes med `animation-delay`, inom `@media (prefers-reduced-motion:no-preference)`, som resten av spelet. Utrullningen styrs av en flagga `S.rolled` och visas en gång per sidladdning.

**Teknik:** Ett enda `index.html` (vanilla JS, CSS, SVG). Testerna körs med `node --test` och jsdom (`tests/harness.mjs`, `tests/answer.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-06-eserier-klocka-och-linjal-design.md` (skiss: `docs/superpowers/specs/2026-10-06-eserier-skiss.html`)

## Globala villkor

- All text i spelet är på svenska. Decimaltal skrivs med komma ("6,4"), och toleranser skrivs med `fmtTol` ("±10 %").
- Färger tas från spelets tokens (`--accent`, `--ok`, `--bad`, `--line`, `--muted`, `--ink`, `--tip-bg` och så vidare). Inga hårdkodade färger, så att det fungerar i både ljust och mörkt läge.
- Animeringar ligger inom `@media (prefers-reduced-motion:no-preference)`. Utrullningen hoppas över med `S.instant` eller `reduceMotion()`.
- Klockan är högst cirka 330 px bred. Linjalen fyller kortets bredd. Ingen sidoscroll på 360 px.
- Eldprovet visar inga klockor eller linjaler som facit (`inExam()`).
- Den nya koden placeras **efter** `const SER_OPTS = …` (cirka rad 3122), eftersom den använder `E6`, `E12`, `E24` och `ESER`, som är `const` och definieras där.
- Hela sviten körs med `npm test`, och utdata skickas till en fil i scratchpad.

## Granskningsfokus

1. **Rätt svar går vidare efter `NEXT_MS` (1,7 s).** Prickarna på klockan måste hinna poppa in innan dess: 12 × 0,09 s + 0,26 s ≈ 1,3 s.
2. **Linjalen med E24 på mobil.** 25 värden på 360 px blir små. De får inte överlappa så att de inte går att läsa (`.elab.sm`).
3. **Mörkt läge.** Gul glappmarkering och blå staplar ska synas på `--surface` i mörkt läge.
4. **Blandat läge (gyllene E-serierna)** ska slumpa bland de nya frågorna utan fel. Det testas i Task 4 genom att `golden('e')` kör 40 frågor.
5. **`S.rolled` sätts även när utrullningen hoppas över.** Annars rullar linjalen ut senare, mitt i ett facit.

---

### Task 1: Klockan och linjalen som ritfunktioner

**Filer:**
- Ändra: `index.html`. Ny kod efter `const SER_OPTS = …` och ny CSS efter `.egrid span{…}` (cirka rad 434).
- Test: `tests/eserier.test.mjs` (ny).

**Gränssnitt:**
- Använder: `E6`, `E12`, `E24`, `ESER` (`{E6:[E6,20], …, E96:[E96,1]}`, där E48 och E96 är tresiffriga, 100–976).
- Ger:
  - `ePos(v) → number`: 10 ger 0 och 100 ger 1 (log10(v/10)).
  - `eLab(v) → string`: 47 ger "47" och 47.5 ger "47,5".
  - `eVals(n) → number[]`: seriens värden på skalan 10–100, för n ∈ {6, 12, 24, 48, 96}.
  - `dialSVG(n, {dots = true, labels = true, count = false, pop = false}) → string`: `<svg class="edial">`. Klasser: `.ering`, `.etick` (24), `.emid` (text i mitten), `.esub` (bara med labels), `.edot` (en `<g>` per värde), `.elab` (värde), `.enum` (nummer).
  - `rulerSVG(n, {tol = null, marks = [], roll = false} = {}) → string`: `<svg class="eruler">`. Klasser: `.eline`, `.epdot` (en per värde plus 100 med `.next`), `.elab` (bara för n ≤ 24), `.ebar` (med tol), `.ecrash` och `.egap` (med tol, avvikelser över `ETOL_MIN`), `.emark.ok` och `.emark.bad` (med marks).
  - `ETOL_MIN = 0.03`.

- [ ] **Steg 1: Skriv de fallerande testerna**

Skapa `tests/eserier.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade } from './harness.mjs';

// Ritar en sträng från spelet i en div, så att man kan räkna element
const frag = (t, expr) => { const d = t.doc.createElement('div'); d.innerHTML = t.g(expr); return d; };
const n = (d, sel) => d.querySelectorAll(sel).length;

test('Klockan: E12 med nummer har 12 prickar, 12 värden, 12 nummer och 24 streck', () => {
  const t = atGrade('e', 0), d = frag(t, 'dialSVG(12, {count: true})');
  assert.equal(n(d, '.edot'), 12);
  assert.equal(n(d, '.elab'), 12);
  assert.equal(n(d, '.enum'), 12);
  assert.equal(n(d, '.etick'), 24);
  assert.equal(d.querySelector('.emid').textContent, 'E12');
  assert.match(d.querySelector('.esub').textContent, /100 = nytt varv/);
  assert.deepEqual([...d.querySelectorAll('.elab')].map(x => x.textContent), ['10','12','15','18','22','27','33','39','47','56','68','82']);
});

test('Klockan: utan värden står ett frågetecken i mitten, och tom klocka har inga prickar', () => {
  const t = atGrade('e', 0);
  const q = frag(t, 'dialSVG(24, {labels: false})');
  assert.equal(n(q, '.edot'), 24);
  assert.equal(n(q, '.elab'), 0);
  assert.equal(q.querySelector('.emid').textContent, '?');
  const e = frag(t, 'dialSVG(12, {dots: false})');
  assert.equal(n(e, '.edot'), 0);
  assert.equal(e.querySelector('.emid').textContent, 'E12');
});

test('Linjalen: seriens prickar plus 100, värden bara upp till E24', () => {
  const t = atGrade('e', 0);
  const d = frag(t, 'rulerSVG(12)');
  assert.equal(n(d, '.epdot'), 13);
  assert.equal(n(d, '.epdot.next'), 1);
  assert.equal(n(d, '.elab'), 13);
  assert.equal(n(d, '.ebar'), 0);
  const big = frag(t, 'rulerSVG(96)');
  assert.equal(n(big, '.epdot'), 97);
  assert.equal(n(big, '.elab'), 0);
});

test('Linjalen: för stor tolerans krockar, för liten glappar, den rätta är ren', () => {
  const t = atGrade('e', 0);
  for (const [s, big, right, small] of [[6, 50, 20, 1], [12, 20, 10, 1], [24, 10, 5, 1]]) {
    const b = frag(t, `rulerSVG(${s}, {tol: ${big}})`), r = frag(t, `rulerSVG(${s}, {tol: ${right}})`), l = frag(t, `rulerSVG(${s}, {tol: ${small}})`);
    assert.ok(n(b, '.ecrash') > 0 && n(b, '.egap') === 0, `E${s} ±${big} krockar`);
    assert.equal(n(r, '.ecrash') + n(r, '.egap'), 0, `E${s} ±${right} är ren`);
    assert.ok(n(l, '.egap') > 0 && n(l, '.ecrash') === 0, `E${s} ±${small} glappar`);
    assert.equal(n(r, '.ebar'), s + 1);
  }
});

test('Linjalen: värden släpps ner med bock eller kryss', () => {
  const t = atGrade('e', 0), d = frag(t, "rulerSVG(12, {marks: [{v: 47, ok: true}, {v: 64, ok: false}]})");
  assert.equal(n(d, '.emark.ok'), 1);
  assert.equal(n(d, '.emark.bad'), 1);
  assert.match(d.querySelector('.emark.bad').textContent, /✗ 64/);
  assert.match(d.querySelector('.emark.ok').textContent, /✓ 47/);
});
```

- [ ] **Steg 2: Kör testerna och se dem fallera**

Kör: `node --test tests/eserier.test.mjs`
Förväntat: FAIL. Alla fem fallerar med `ReferenceError: dialSVG is not defined` eller `rulerSVG is not defined`.

- [ ] **Steg 3: Skriv ritfunktionerna**

I `index.html`, direkt efter raden `const SER_OPTS = ['E6','E12','E24','E48','E96','none'];`:

```js
// E-serierna som bild. Klockan: ett varv är 10 till 100, och prickarna sitter där värdena hamnar på en logaritmisk skala.
// Linjalen är klockan utrullad. Serierna dubblas: E6 varannan timme, E12 varje timme, E24 varje halvtimme.
const ePos = v => Math.log10(v / 10);
const eLab = v => String(v).replace('.', ',');
const eVals = n => ESER['E' + n][0].map(x => x >= 100 ? x / 10 : x);
const f1 = x => x.toFixed(1);
function dialSVG(n, {dots = true, labels = true, count = false, pop = false} = {}){
  const R = 118, at = (s, r) => [150 + r * Math.sin(2 * Math.PI * s), 150 - r * Math.cos(2 * Math.PI * s)];
  let h = `<circle class="ering" cx="150" cy="150" r="${R}"/>`;
  for (let i = 0; i < 24; i++) {
    const [x1, y1] = at(i / 24, R - 16), [x2, y2] = at(i / 24, R - (i % 2 ? 22 : 26));
    h += `<line class="etick" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"/>`;
  }
  const named = labels || !dots;
  h += `<text class="emid" x="150" y="160">${named ? 'E' + n : '?'}</text>`;
  if (labels && dots) h += `<text class="esub" x="150" y="-22">100 = nytt varv, ×10</text>`;
  if (dots) eVals(n).forEach((v, i) => {
    const s = ePos(v), [x, y] = at(s, R), sm = n > 12;
    const d = pop ? ` style="animation-delay:${(i * (sm ? .05 : .09)).toFixed(2)}s"` : '';
    h += `<g class="edot${pop ? ' pop' : ''}"${d}><circle cx="${f1(x)}" cy="${f1(y)}" r="${sm ? 6 : 8}"/>`;
    if (labels) { const [lx, ly] = at(s, R + (sm ? 22 : 26)); h += `<text class="elab${sm ? ' sm' : ''}" x="${f1(lx)}" y="${f1(ly + 4)}">${eLab(v)}</text>`; }
    if (count) { const [cx, cy] = at(s, R - 38); h += `<text class="enum" x="${f1(cx)}" y="${f1(cy + 4)}">${i + 1}</text>`; }
    h += '</g>';
  });
  return `<svg class="edial" viewBox="-40 -40 380 380" role="img" aria-label="Klockan för E${n}">${h}</svg>`;
}
// Toleransstaplar: avvikelser mindre än så här (andel av ett varv) räknas som att staplarna möts
const ETOL_MIN = 0.03, RW = 600, RY = 70;
function rulerSVG(n, {tol = null, marks = [], roll = false} = {}){
  const vals = eVals(n).concat([100]), many = vals.length > 26, x = v => f1(RW * ePos(v));
  let h = `<line class="eline" x1="0" y1="${RY}" x2="${RW}" y2="${RY}"/>`;
  if (tol != null) {
    const bars = vals.map(v => [Math.max(0, ePos(v * (1 - tol / 100))), Math.min(1, ePos(v * (1 + tol / 100)))]);
    bars.forEach(([a, b], i) => { h += `<rect class="ebar${i % 2 ? ' alt' : ''}" x="${f1(RW * a)}" y="${i % 2 ? 44 : 54}" width="${f1(Math.max(2, RW * (b - a)))}" height="9" rx="3"/>`; });
    for (let i = 0; i < bars.length - 1; i++) {
      const over = bars[i][1] - bars[i + 1][0];
      if (Math.abs(over) < ETOL_MIN) continue;
      const lo = Math.min(bars[i][1], bars[i + 1][0]), hi = Math.max(bars[i][1], bars[i + 1][0]);
      h += `<rect class="${over > 0 ? 'ecrash' : 'egap'}" x="${f1(RW * lo)}" y="${RY - 4}" width="${f1(RW * (hi - lo))}" height="8" rx="2"/>`;
    }
  }
  vals.forEach((v, i) => {
    const last = i === vals.length - 1;
    h += `<circle class="epdot${last ? ' next' : ''}" cx="${x(v)}" cy="${RY}" r="${many ? 2.5 : 4.5}"/>`;
    if (!many) h += `<text class="elab${vals.length > 13 ? ' sm' : ''}" x="${x(v)}" y="${RY + 22}">${eLab(v)}</text>`;
  });
  marks.forEach(({v, ok}, i) => {
    h += `<g class="emark ${ok ? 'ok' : 'bad'}" style="animation-delay:${((roll ? 1.5 : .2) + i * .26).toFixed(2)}s"><line x1="${x(v)}" y1="20" x2="${x(v)}" y2="${RY - 8}"/><text x="${x(v)}" y="14">${ok ? '✓' : '✗'} ${eLab(v)}</text></g>`;
  });
  return `<svg class="eruler" viewBox="-30 0 660 100" role="img" aria-label="Linjalen för E${n}">${h}</svg>`;
}
```

CSS, direkt efter raden `.egrid span{…}`:

```css
.edial{display:block;width:100%;max-width:330px;height:auto;margin:0 auto;overflow:visible}
.eruler{display:block;width:100%;height:auto;overflow:visible}
.ering{fill:none;stroke:var(--line);stroke-width:10}
.etick{stroke:var(--line);stroke-width:2}
.emid{font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-weight:700;font-size:34px;text-anchor:middle;fill:var(--ink)}
.esub{font-size:11px;text-anchor:middle;fill:var(--muted)}
.edot circle,.epdot{fill:var(--accent)}
.epdot.next{fill:var(--muted)}
.edot{transform-box:fill-box;transform-origin:center}
.elab{font-size:14px;font-weight:600;text-anchor:middle;fill:var(--ink)}
.elab.sm{font-size:11px}
.eruler .elab{font-size:12px}
.eruler .elab.sm{font-size:9px}
.enum{font-size:12px;font-weight:700;text-anchor:middle;fill:var(--ok)}
.eline{stroke:var(--line);stroke-width:6;stroke-linecap:round}
.ebar{fill:var(--accent);opacity:.85}
.ebar.alt{opacity:.55}
.ecrash{fill:var(--bad)}
.egap{fill:#e0a526}
.emark line{stroke-width:2}
.emark.ok line{stroke:var(--ok)}
.emark.bad line{stroke:var(--bad);stroke-dasharray:4 3}
.emark text{font-size:12px;font-weight:700;text-anchor:middle}
.emark.ok text{fill:var(--ok)}
.emark.bad text{fill:var(--bad)}
@media (prefers-reduced-motion:no-preference){
  .edot.pop{animation:edot .26s cubic-bezier(.3,1.6,.5,1) backwards}
  .emark{animation:edrop .36s ease-out backwards}
  @keyframes edot{from{opacity:0;transform:scale(.4)}}
  @keyframes edrop{from{opacity:0;transform:translateY(-14px)}}
}
```

Den gula glappfärgen behöver en token. Lägg `--gap:#e0a526;` i ljusa `:root` (rad 12–14) och `--gap:#e7b04a;` i båda mörka blocken. Ändra sedan `.egap{fill:#e0a526}` till `.egap{fill:var(--gap)}`.

- [ ] **Steg 4: Kör testerna och se dem gå igenom**

Kör: `node --test tests/eserier.test.mjs`
Förväntat: PASS, 5/5. Om toleranstestet fallerar för en enskild serie, skriv ut avvikelserna (`bars[i][1] - bars[i+1][0]`) och jämför med `ETOL_MIN`. Specen säger 3 %. Ändra inte tröskeln utan en ruling.

- [ ] **Steg 5: Kör hela sviten och committa**

Kör: `npm test > $SCRATCH/t.log 2>&1; grep -E "^ℹ (pass|fail)" $SCRATCH/t.log`
Förväntat: `fail 0`.

```bash
git add index.html tests/eserier.test.mjs
git commit -m "E-serierna: klockan och linjalen som ritfunktioner"
```

---

### Task 2: Nykomling och Lärling med klockan

**Filer:**
- Ändra: `index.html`, `PLANS.e[0]` och `PLANS.e[1]` (cirka rad 1934–1955, `e: [`).
- Test: `tests/eserier.test.mjs`.

**Gränssnitt:**
- Använder: `dialSVG` från Task 1.
- Ger: plan-fältet `eq` på E-seriernas choice-planer (`'namn'`, `'klocka'`). Senare tasks använder `'staplar'`, `'serietol'` och `'e12'`. Det läses i testerna med `until(t, p => p.eq === …)`.

- [ ] **Steg 1: Skriv de fallerande testerna**

Lägg till i `tests/eserier.test.mjs`. Lägg också till `import { answer, until } from './answer.mjs';` överst.

```js
test('E-seriernas Nykomling: Vad betyder 12 i E12?, tom klocka före och 12 prickar efter, både rätt och fel', () => {
  for (const ok of [true, false]) {
    const t = atGrade('e', 0);
    for (let i = 0; i < 10; i++) {
      t.g('next()');
      assert.equal(t.g('S.plan.eq'), 'namn');
      assert.equal(t.$('#q .prompt').textContent.trim(), 'Vad betyder 12 i E12?');
    }
    assert.equal(t.$$('#q .edial').length, 1);
    assert.equal(t.$$('#q .edot').length, 0, 'tom före svaret');
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), '12 värden på varje varv');
    answer(t, ok);
    assert.equal(t.$$('#q .edot').length, 12);
    assert.equal(t.$$('#q .enum').length, 12);
  }
});

test('E-seriernas Lärling: Vilken serie är det här?, rätt svar stämmer med antalet prickar', () => {
  const t = atGrade('e', 1), seen = new Set();
  for (let i = 0; i < 30; i++) {
    t.g('next()');
    assert.equal(t.g('S.plan.eq'), 'klocka');
    const dots = t.$$('#q .edot').length;
    assert.ok([6, 12, 24].includes(dots));
    assert.equal(t.$$('#q .elab').length, 0, 'inga värden före svaret');
    assert.equal(t.$('#q .emid').textContent, '?');
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), 'E' + dots);
    seen.add(dots);
  }
  assert.equal(seen.size, 3, 'E6, E12 och E24 förekommer');
  answer(t, false);
  assert.ok(t.$$('#q .elab').length > 0, 'värdena visas efter svaret');
  assert.match(t.$('#q').textContent, /prickar på varvet/);
});
```

- [ ] **Steg 2: Kör testerna och se dem fallera**

Kör: `node --test --test-name-pattern="Nykomling|Lärling" tests/eserier.test.mjs`
Förväntat: FAIL. Nykomling fallerar på `S.plan.eq` (undefined) och Lärling likaså.

- [ ] **Steg 3: Byt ut de två första graderna**

I `index.html` ersätts allt från `  e: [` till och med Lärlingsplanen (den som slutar med `wrong: \`${s} har ${n} värden mellan 10 och 100, …\`};\n    }),`) med det här. Den gamla Nykomlingsplanen ("Tre av värdena finns i E12") sparas till Task 4, så kopiera den till en anteckning innan du tar bort den.

```js
  e: [
    // Nykomling: vad betyder 12 i E12? Klockan fylls efter svaret.
    () => choice(() => {
      const right = '12 värden på varje varv';
      const opts = shuffle([right, '±12 % tolerans', 'Värden upp till 12 kΩ', '12 färgband']);
      S.cq = {prompt:'Vad betyder 12 i E12?', layout:'txt', right: opts.indexOf(right), opts: opts.map(x => ({html: x})),
        res: () => S.answered ? dialSVG(12, {count: true, pop: true}) : dialSVG(12, {dots: false}),
        wrong: 'E12 har 12 värden på ett varv, från 10 till 82. Sedan kommer 100 och samma värden igen med en nolla till: 120, 150, 180 …'};
    }, {eq: 'namn'}),
    // Lärling: vilken serie är det här? Räkna prickarna på klockan.
    () => choice(() => {
      const n = rnd([6, 12, 24]), opts = ['E6','E12','E24','E48'];
      S.cq = {prompt:'Vilken serie är det här?', layout:'mc', right: opts.indexOf('E' + n), opts: opts.map(x => ({html: x})),
        res: () => S.answered ? dialSVG(n, {count: n <= 12, pop: true}) : dialSVG(n, {labels: false}),
        wrong: `${n} prickar på varvet, alltså E${n}. En prick ${n === 6 ? 'varannan timme' : n === 12 ? 'på varje timme' : 'på varje halvtimme'}.`};
    }, {eq: 'klocka'}),
```

Tills Task 4 är klar har Mästare inte Inte i E12. Det är avsiktligt, och sviten ska ändå vara grön.

- [ ] **Steg 4: Kör testerna och se dem gå igenom**

Kör: `node --test tests/eserier.test.mjs`
Förväntat: PASS, 7/7.

- [ ] **Steg 5: Kör hela sviten och committa**

Kör: `npm test > $SCRATCH/t.log 2>&1; grep -E "^ℹ (pass|fail)|^✖" $SCRATCH/t.log`
Förväntat: `fail 0`. Om ett äldre test letade efter "Tre av värdena" på Nykomling, flytta det till Mästare i Task 4 och notera en ruling.

```bash
git add index.html tests/eserier.test.mjs
git commit -m "E-serierna: Nykomling frågar vad E12 betyder och Lärling räknar prickar på klockan"
```

---

### Task 3: Gesäll – vilken tolerans är serien gjord för?

**Filer:**
- Ändra: `index.html`, `PLANS.e[2]` (Gesäll: serie och tolerans).
- Test: `tests/eserier.test.mjs`.

**Gränssnitt:**
- Använder: `rulerSVG(n, {tol})` från Task 1, `SER_TOL`, `fmtTol` och `S.pickC`.
- Ger: `ETOL_Q = {6:[50,20,1], 12:[20,10,1], 24:[10,5,1]}` och `etolRows(n, tols) → string` (`<div class="etrows">` med tre `.etrow`, den valda med `.pick`). Plan-fälten är `eq: 'staplar'` och `eq: 'serietol'`.

- [ ] **Steg 1: Skriv de fallerande testerna**

```js
test('E-seriernas Gesäll: Vilken tolerans är serien gjord för?, tre stapelrader efter svaret', () => {
  for (const ok of [false, true]) {
    const t = atGrade('e', 2);
    until(t, p => p.eq === 'staplar');
    const m = t.$('#q .prompt').textContent.match(/Vilken tolerans är E(6|12|24) gjord för\?/);
    assert.ok(m);
    assert.equal(t.$$('#q [data-c]').length, 3);
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), t.g(`fmtTol(SER_TOL.E${m[1]})`));
    assert.equal(t.$$('#q .eruler').length, 1, 'linjalen före svaret');
    assert.equal(t.$$('#q .etrow').length, 0);
    answer(t, ok);
    const rows = t.$$('#q .etrow');
    assert.equal(rows.length, 3);
    assert.equal(t.$$('#q .etrow.pick').length, 1);
    assert.equal(rows.indexOf(t.$('#q .etrow.pick')) === 1, ok, 'den valda raden har ramen');
    assert.ok(rows[0].querySelector('.ecrash'), 'för stor krockar');
    assert.equal(rows[1].querySelectorAll('.ecrash, .egap').length, 0, 'den rätta är ren');
    assert.ok(rows[2].querySelector('.egap'), 'för liten glappar');
    assert.match(rows[0].textContent, /10 Ω kan vara 1[125] Ω/);
  }
});

test('E-seriernas Gesäll blandar staplarna med serie ↔ tolerans', () => {
  const t = atGrade('e', 2), seen = new Set();
  for (let i = 0; i < 60; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['serietol', 'staplar']);
});
```

- [ ] **Steg 2: Kör testerna och se dem fallera**

Kör: `node --test --test-name-pattern="Gesäll" tests/eserier.test.mjs`
Förväntat: FAIL med "hittade ingen sådan fråga" och en mängd som är `[]` i stället för `['serietol','staplar']`.

- [ ] **Steg 3: Skriv frågan och raderna**

Lägg till efter `rulerSVG` (Task 1):

```js
// Gesäll: tre toleranser per serie, för stor, rätt och för liten
const ETOL_Q = {6: [50, 20, 1], 12: [20, 10, 1], 24: [10, 5, 1]};
function etolRows(n, [big, right, small]){
  const v = eVals(n), picked = S.cq.tols[S.pickC];
  const row = (t, txt) => `<div class="etrow${t === picked ? ' pick' : ''}"><p><b>${fmtTol(t)}</b> ${txt}</p>${rulerSVG(n, {tol: t})}</div>`;
  return `<div class="etrows">${row(big, `för stor: staplarna krockar, ${v[0]} Ω kan vara ${v[1]} Ω`)}${row(right, 'lagom: staplarna möts ungefär kant i kant')}${row(small, 'för liten: glapp mellan värdena')}</div>`;
}
```

Ersätt Gesällplanen (`    // Gesäll: serie och tolerans` till och med dess `}),`) med:

```js
    // Gesäll: vilken tolerans är serien gjord för (staplar på linjalen), eller serie ↔ tolerans som text
    () => rnd([() => choice(() => {
      const n = rnd([6, 12, 24]), tols = ETOL_Q[n], right = tols[1], opts = shuffle(tols.slice());
      S.cq = {prompt:`Vilken tolerans är E${n} gjord för?`, layout:'mc', right: opts.indexOf(right), tols: opts,
        opts: opts.map(v => ({html: fmtTol(v)})),
        res: () => S.answered && !inExam() ? etolRows(n, tols) : rulerSVG(n),
        wrong: `E${n} är gjord för ${fmtTol(right)}. Då når varje värde ungefär fram till grannen, och alla resistanser mellan 10 och 100 täcks. Röd är krock, gul är glapp.`};
    }, {eq: 'staplar'}), () => choice(() => {
      const s = rnd(Object.keys(SER_TOL)), t = SER_TOL[s], line = 'E6 ±20 %, E12 ±10 %, E24 ±5 %, E48 ±2 %, E96 ±1 %.';
      if (Math.random() < .5) {
        const vals = pick4(t, [], Object.values(SER_TOL));
        S.cq = {prompt:`Vilken tolerans hör till ${s}?`, layout:'mc', right: vals.indexOf(t), opts: vals.map(v => ({html: fmtTol(v)})), wrong: line};
      } else {
        const ss = pick4(s, [], Object.keys(SER_TOL));
        S.cq = {prompt:`Vilken serie hör till ${fmtTol(t)}?`, layout:'mc', right: ss.indexOf(s), opts: ss.map(x => ({html: x})), wrong: line};
      }
    }, {eq: 'serietol'})])(),
```

Observera att `etolRows` får `tols` i ordningen för stor, rätt, för liten, medan knapparna (`opts`) är blandade. `S.cq.tols` är knappordningen, så att `S.cq.tols[S.pickC]` blir den valda toleransen.

CSS efter Task 1:s CSS:

```css
.etrows{display:flex;flex-direction:column;gap:6px}
.etrow{border:2px solid transparent;border-radius:10px;padding:4px 6px 0}
.etrow.pick{border-color:var(--accent)}
.etrow p{margin:0;font-size:.9rem;color:var(--muted)}
.etrow p b{color:var(--ink)}
```

- [ ] **Steg 4: Kör testerna och se dem gå igenom**

Kör: `node --test tests/eserier.test.mjs`
Förväntat: PASS, 9/9.

- [ ] **Steg 5: Kör hela sviten och committa**

Kör: `npm test > $SCRATCH/t.log 2>&1; grep -E "^ℹ (pass|fail)|^✖" $SCRATCH/t.log`
Förväntat: `fail 0`. Testet "Text: rätt svar ger ingen text, fel svar ger exakt en rad" kör `['e', 2]` och ska fortfarande vara grönt.

```bash
git add index.html tests/eserier.test.mjs
git commit -m "E-seriernas Gesäll: vilken tolerans är serien gjord för, med staplar på linjalen"
```

---

### Task 4: Mästare – Inte i E12 med linjalen, och Vilken serie med värdet

**Filer:**
- Ändra: `index.html`:
  - `choiceHTML` får fältet `after`,
  - `PLANS.e[3]`,
  - CSS och kod för `.egrid` tas bort.
- Ändra: `tests/model.test.mjs`, beroenderegeln (`e: [...]`, cirka rad 730).
- Test: `tests/eserier.test.mjs`.

**Gränssnitt:**
- Använder: `rulerSVG(12, {marks})` från Task 1.
- Ger: `S.cq.after: () => string`, som ritas under svaren när frågan är besvarad och inte är Eldprovet. Plan-fältet är `eq: 'e12'`.

- [ ] **Steg 1: Skriv de fallerande testerna**

I `tests/eserier.test.mjs` (lägg till `golden` i importen från `./harness.mjs`):

```js
test('E-seriernas Mästare: Inte i E12, värdena faller ner på linjalen, både rätt och fel', () => {
  for (const ok of [false, true]) {
    const t = atGrade('e', 3);
    until(t, p => p.eq === 'e12');
    assert.equal(t.$$('#q .eruler').length, 0, 'ingen linjal före svaret');
    answer(t, ok);
    assert.equal(t.$$('#q .eruler').length, 1);
    assert.equal(t.$$('#q .emark').length, 4);
    assert.equal(t.$$('#q .emark.bad').length, 1);
    assert.equal(t.$$('#q .egrid').length, 0, 'rutnätet är borta');
  }
});

test('E-seriernas Mästare blandar Inte i E12 med Vilken serie', () => {
  const t = atGrade('e', 3), seen = new Set();
  for (let i = 0; i < 60; i++) { t.g('next()'); seen.add(t.g('S.plan.eq') || t.g('S.type')); }
  assert.deepEqual([...seen].sort(), ['e12', 'series']);
});

test('Gyllene E-serierna: blandat spelar alla nya frågor utan fel', () => {
  const t = golden('e');
  for (let i = 0; i < 40; i++) { t.g('next()'); answer(t, i % 2 === 0); }
  assert.deepEqual(t.errors, []);
});
```

I `tests/model.test.mjs`, beroenderegeln, ändra:

```js
    e: [['choice'], ['choice'], ['choice'], ['series'], ['series']]
```

till:

```js
    e: [['choice'], ['choice'], ['choice'], ['choice', 'series'], ['series']]
```

- [ ] **Steg 2: Kör testerna och se dem fallera**

Kör: `node --test --test-name-pattern="Mästare|Gyllene" tests/eserier.test.mjs`
Förväntat: FAIL. Mästare hittar ingen `eq === 'e12'`, och blandningen ger `['series']`. Gyllene kan gå igenom redan nu, och det är okej, för det är ett skyddsnät.

- [ ] **Steg 3: Lägg till `after` och bygg Mästare**

I `choiceHTML`, ersätt slutet:

```js
    <div class="${grid}">${opts}</div>${done && !S.ok && Q.facit ? Q.facit() : ''}`;
```

med:

```js
    <div class="${grid}">${opts}</div>${done && Q.after && !inExam() ? `<div class="res after">${Q.after()}</div>` : ''}${done && !S.ok && Q.facit ? Q.facit() : ''}`;
```

Ersätt Mästareplanen `    // Mästare: vilken serie, med värdet utskrivet\n    () => ({type:'series', fmt:'mc', showVal:true}),` med:

```js
    // Mästare: vilket värde finns inte i E12 (värdena faller ner på linjalen), eller vilken serie med värdet utskrivet
    () => rnd([() => choice(() => {
      const right = rnd4(), pool = shuffle(E12.slice()).slice(0, 4);
      let odd; do { odd = 11 + Math.floor(Math.random() * 89); } while (E24.includes(odd));
      const vals = [0,1,2,3].map(i => Math.round((i === right ? odd : pool[i]) / 10 * rnd([1, 10, 100, 1000, 10000]) * 100) / 100);
      const marks = [0,1,2,3].map(i => ({v: i === right ? odd : pool[i], ok: i !== right}));
      S.cq = {odd:true, prompt:'Tre av värdena finns i E12.', layout:'mc', right, opts: vals.map(v => ({html: fmtVal(v)})),
        after: () => rulerSVG(12, {marks}),
        wrong: `Titta på de två första siffrorna: ${odd} hamnar mellan prickarna och finns inte i E12. De andra landar på en prick.`};
    }, {eq: 'e12'}), () => ({type:'series', fmt:'mc', showVal:true})])(),
```

Felraden avviker medvetet från specens exempel ("Ta bort nollorna och prefixet: 6,4 …"). Linjalen visar värdena 10–100 med två siffror, så raden säger "64" och inte "6,4", och den säger "de två första siffrorna" eftersom "6,4 kΩ" utan prefix blir 6,4 och inte 64.

Ta bort de två CSS-raderna för `.egrid span.on` och `.q .egrid,#q .egrid` (cirka rad 294–295) och de två `.egrid`-raderna (cirka rad 433–434). Kör `grep -n egrid index.html`. Förväntat: inga träffar.

- [ ] **Steg 4: Kör testerna och se dem gå igenom**

Kör: `node --test tests/eserier.test.mjs tests/model.test.mjs`
Förväntat: PASS.

- [ ] **Steg 5: Kör hela sviten och committa**

Kör: `npm test > $SCRATCH/t.log 2>&1; grep -E "^ℹ (pass|fail)|^✖" $SCRATCH/t.log`
Förväntat: `fail 0`.

```bash
git add index.html tests/eserier.test.mjs tests/model.test.mjs
git commit -m "E-seriernas Mästare: Inte i E12 med värdena på linjalen, blandat med Vilken serie"
```

---

### Task 5: Vilken serie – linjalen som facit vid fel

**Filer:**
- Ändra: `index.html`, `render()`, grenen `if (S.type === 'series')` (cirka rad 2030).
- Test: `tests/eserier.test.mjs`.

**Gränssnitt:**
- Använder: `rulerSVG(n, {marks})`, `TOL_SER`, `bandsTol`, `seriesOf` och `S.sr` (`{v, m3, bands, answer}`).
- Ger: `seriesRuler() → string`.

- [ ] **Steg 1: Skriv de fallerande testerna**

```js
test('Vilken serie: fel svar visar linjalen för serien som toleransen pekar ut, med värdet markerat', () => {
  const t = atGrade('e', 4);
  for (let i = 0; i < 12; i++) {
    t.g('next()');
    assert.equal(t.$$('#q .eruler').length, 0, 'ingen linjal före svaret');
    answer(t, false);
    assert.equal(t.$$('#q .eruler').length, 1);
    assert.equal(t.$$('#q .emark').length, 1);
    const ser = t.g('TOL_SER[bandsTol(S.sr.bands)]'), inSer = t.g('seriesOf(S.sr.m3)').includes(ser);
    assert.equal(t.$$('#q .emark.ok').length, inSer ? 1 : 0, ser);
    assert.match(t.$('#q .eruler').getAttribute('aria-label'), new RegExp(ser + '$'));
  }
  t.g('next()'); answer(t, true);
  assert.equal(t.$$('#q .eruler').length, 0, 'rätt svar visar ingen linjal');
});
```

- [ ] **Steg 2: Kör testet och se det fallera**

Kör: `node --test --test-name-pattern="Vilken serie: fel" tests/eserier.test.mjs`
Förväntat: FAIL med `0 !== 1` på `.eruler` efter svaret.

- [ ] **Steg 3: Rita linjalen**

Efter `etolRows` (Task 3):

```js
// Vilken serie, fel svar: linjalen för serien som toleransen pekar ut, och var värdet hamnar
function seriesRuler(){
  const r = S.sr, ser = TOL_SER[bandsTol(r.bands)];
  return `<div class="res after">${rulerSVG(+ser.slice(1), {marks: [{v: r.m3 / 10, ok: seriesOf(r.m3).includes(ser)}]})}</div>`;
}
```

I `render()`, seriegrenen, ändra slutet av `h += …` från:

```js
${k === 'none' ? 'Inte standard' : k}</button>`).join('')}</div>`;
```

till:

```js
${k === 'none' ? 'Inte standard' : k}</button>`).join('')}</div>${S.answered && !S.ok && !inExam() ? seriesRuler() : ''}`;
```

- [ ] **Steg 4: Kör testet och se det gå igenom**

Kör: `node --test tests/eserier.test.mjs`
Förväntat: PASS.

- [ ] **Steg 5: Kör hela sviten och committa**

Kör: `npm test > $SCRATCH/t.log 2>&1; grep -E "^ℹ (pass|fail)|^✖" $SCRATCH/t.log`
Förväntat: `fail 0`.

```bash
git add index.html tests/eserier.test.mjs
git commit -m "Vilken serie: linjalen med värdet markerat som facit vid fel"
```

---

### Task 6: Klockan rullas ut till linjalen

**Filer:**
- Ändra: `index.html`:
  - `rulerSVG` får utrullningen,
  - ny `rollNow()`,
  - tre anrop till `rulerSVG` får `roll: rollNow()`,
  - ny CSS.
- Test: `tests/eserier.test.mjs`.

**Gränssnitt:**
- Använder: `S.instant`, `reduceMotion()`, och anropen från Tasks 3–5: Gesällfrågans `res` före svaret, Mästares `after` och `seriesRuler`.
- Ger: `rollNow() → boolean` och flaggan `S.rolled`.

- [ ] **Steg 1: Skriv de fallerande testerna**

Lägg till `load` och `ALL_OPEN` i importen från `./harness.mjs`.

```js
// Som atGrade, men med animeringar (S.instant är av)
const live = (topic, grade) => load({ instant: false, storage: { ...ALL_OPEN, 'fargkoden2-topic': topic,
  'fargkoden2-done': JSON.stringify({ body: 4, ohm: 4, tol: 4, tc: 4, e: 4 }), 'fargkoden2-grade': JSON.stringify({ [topic]: grade }) } });

test('Utrullningen: första linjalen rullas ut, nästa visas direkt', () => {
  const t = live('e', 2);
  until(t, p => p.eq === 'staplar');
  assert.equal(t.$$('#q .eruler.unroll').length, 1);
  assert.equal(t.$$('#q .eroll').length, 1, 'klockan som rullas ut');
  assert.ok(t.$('#q .eruler.unroll .epdot').getAttribute('style').includes('--fx'));
  t.g('stopTimer()'); t.g('next()');
  until(t, p => p.eq === 'staplar');
  assert.equal(t.$$('#q .eruler.unroll').length, 0);
  assert.equal(t.g('S.rolled'), true);
});

test('Utrullningen hoppas över med S.instant men räknas ändå', () => {
  const t = atGrade('e', 2);
  until(t, p => p.eq === 'staplar');
  assert.equal(t.$$('#q .eruler.unroll').length, 0);
  assert.equal(t.g('S.rolled'), true);
});
```

- [ ] **Steg 2: Kör testerna och se dem fallera**

Kör: `node --test --test-name-pattern="Utrullningen" tests/eserier.test.mjs`
Förväntat: FAIL. `.eruler.unroll` har 0 element, och `S.rolled` är `undefined`.

- [ ] **Steg 3: Skriv utrullningen**

Före `rulerSVG`:

```js
// Första linjalen per sidladdning rullas ut från klockan. Flaggan sätts även när animeringen hoppas över.
const rollNow = () => { if (S.rolled) return false; S.rolled = true; return !S.instant && !reduceMotion(); };
```

I `rulerSVG` gäller:
- **Klockan som rullas ut.** Ritas först i strängen, efter `let h = …eline…`:

```js
  if (roll) h = `<circle class="eroll" cx="300" cy="50" r="45"/>` + h;
```

- **Prickarna.** Varje prick får förskjutningen från klockan när `roll` är på. Byt prickraden mot:

```js
    const rs = roll ? (() => { const s = last ? 1 : ePos(v), cx = 300 + 45 * Math.sin(2 * Math.PI * s), cy = 50 - 45 * Math.cos(2 * Math.PI * s);
      return ` style="--fx:${f1(cx - RW * ePos(v))}px;--fy:${f1(cy - RY)}px"`; })() : '';
    h += `<circle class="epdot${last ? ' next' : ''}" cx="${x(v)}" cy="${RY}" r="${many ? 2.5 : 4.5}"${rs}/>`;
```

- **Svg-elementet.** Klassen `unroll` läggs på när `roll` är på:

```js
  return `<svg class="eruler${roll ? ' unroll' : ''}" viewBox="-30 0 660 100" role="img" aria-label="Linjalen för E${n}">${h}</svg>`;
```

CSS. Lägg `.eroll{fill:none;stroke:var(--line);stroke-width:6;opacity:0}` utanför media-blocket. Lägg det här inom `@media (prefers-reduced-motion:no-preference){…}` från Task 1:

```css
  .eruler.unroll .epdot{animation:eunroll 1.4s ease-in-out backwards}
  .eruler.unroll .eline{stroke-dasharray:600;animation:edraw 1.4s ease-in-out backwards}
  .eruler.unroll .elab{animation:efade .5s 1.1s backwards}
  .eruler.unroll .ebar{animation:efade .5s 1.2s backwards}
  .eruler.unroll .eroll{animation:eroll 1.4s ease-in-out}
  @keyframes eunroll{from{transform:translate(var(--fx),var(--fy))}}
  @keyframes edraw{from{stroke-dashoffset:600}}
  @keyframes efade{from{opacity:0}}
  @keyframes eroll{from{opacity:1}to{opacity:0}}
```

De tre anropen:
- Gesäll, `res`: `rulerSVG(n)` blir `rulerSVG(n, {roll: rollNow()})`.
- Mästare, `after`: `rulerSVG(12, {marks})` blir `rulerSVG(12, {marks, roll: rollNow()})`.
- `seriesRuler`: `{marks: […]}` blir `{marks: […], roll: rollNow()}`.

- [ ] **Steg 4: Kör testerna och se dem gå igenom**

Kör: `node --test tests/eserier.test.mjs`
Förväntat: PASS, alla.

- [ ] **Steg 5: Kör hela sviten och committa**

Kör: `npm test > $SCRATCH/t.log 2>&1; grep -E "^ℹ (pass|fail)|^✖" $SCRATCH/t.log`
Förväntat: `fail 0`.

```bash
git add index.html tests/eserier.test.mjs
git commit -m "E-serierna: klockan rullas ut till linjalen första gången"
```

---

### Task 7: dev.html, backloggen och publicering

**Filer:**
- Ändra: `dev.html`, `CATALOG.e` (cirka rad 198–210).
- Ändra: `docs/backlogg.md` (E-serierna under "Felanimeringar").

- [ ] **Steg 1: Uppdatera katalogen**

Ersätt hela `e: [ … ],` i `dev.html` med:

```js
  e: [
    r('e-namn', 0, 'Vad namnet betyder', 'Vad betyder 12 i E12? Alltid E12. En tom klocka ovanför svaren.', 'Flerval (text)', STD,
      'Klockan fylls: 12 prickar poppar in runt varvet, numrerade 1–12, med värdena utanför och "100 = nytt varv, ×10". Även vid rätt svar.'),
    r('e-klocka', 1, 'Vilken serie är det här?', 'En klocka med 6, 12 eller 24 prickar utan värden. Svaren E6, E12, E24 och E48.', 'Flerval', STD,
      'Prickarna får sina värden, och nummer på E6 och E12. Raden: 12 prickar på varvet, alltså E12.'),
    r('e-tol-staplar', 2, 'Vilken tolerans är serien gjord för?', 'Vilken tolerans är E12 (E6, E24) gjord för? För stor, rätt och för liten. Linjalen ovanför svaren, och klockan rullas ut första gången.', 'Flerval', STD,
      'Tre rader med toleransstaplar: krock i rött, kant i kant och glapp i gult. Den valda raden har en ram. Även vid rätt svar.'),
    r('e-serie-tol', 2, 'Serie → tolerans', 'Vilken tolerans hör till E24?', 'Flerval', STD,
      'Bara raden: E6 ±20 %, E12 ±10 % …', 'behöver animering'),
    r('e-tol-serie', 2, 'Tolerans → serie', 'Vilken serie hör till ±5 %?', 'Flerval', STD,
      'Bara raden: E6 ±20 %, E12 ±10 % …', 'behöver animering'),
    r('e-e12', 3, 'Inte i E12', 'Tre av fyra värden finns i E12.', VSB, POP,
      'Värdena faller ner på linjalen: tre landar på en prick med ✓, det udda hamnar mellan prickarna med ✗. Även vid rätt svar.'),
    r('e-serie-hjalp', 3, 'Vilken serie, med värde', 'Vilken serie hör motståndet till? Värdet står utskrivet.', 'Serieknappar', STD,
      'Linjalen för serien som toleransen pekar ut, med värdet markerat, och raden.'),
    r('e-serie', 4, 'Vilken serie, utan hjälp', 'Vilken serie hör motståndet till? Inget värde utskrivet.', 'Serieknappar', STD,
      'Linjalen för serien som toleransen pekar ut, med värdet markerat, och raden.')
  ],
```

- [ ] **Steg 2: Uppdatera backloggen**

I `docs/backlogg.md`, under "Felanimeringar för Toleransen, Temperaturen och E-serierna", ändra rubriken till "Felanimeringar för Toleransen och Temperaturen". Ta bort idépunkterna "E12: värdet letas upp i rutnätet och hittas inte" och "Vilken serie: toleransen pekar ut serien, sedan letas värdet upp i den", eftersom de är gjorda med linjalen. Lägg till en punkt: "E-seriernas Serie ↔ tolerans har bara raden."

- [ ] **Steg 3: Kör hela sviten och committa**

Kör: `npm test > $SCRATCH/t.log 2>&1; grep -E "^ℹ (pass|fail)" $SCRATCH/t.log`
Förväntat: `fail 0`.

```bash
git add dev.html docs/backlogg.md
git commit -m "dev.html och backloggen: E-serierna med klockan och linjalen"
```

- [ ] **Steg 4: Publicera spelet och dev-sidan med testläge**

Kör (`SP` är scratchpad):

```bash
sed 's/<html lang="sv">/<html lang="sv" data-test="true">/' index.html > $SP/index2.html
sed 's/index\.html?test/index2.html?test/g' dev.html > $SP/dev.html
```

Publicera `$SP/index2.html` till https://claude.ai/code/artifact/S1iBdoZub6VVMShjaDCqm6. Publicera `$SP/dev.html` med `files: {"index2.html": "$SP/index2.html"}` till https://claude.ai/code/artifact/36JGJVPcWEHDwf2fUBdbUq.
