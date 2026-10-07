# E-serierna med linjaler: implementationsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Mål:** E-seriernas Nykomling och Lärling förklarar skalan med två linjaler i stället för klockan: en logaritmisk, där E6-värdena ligger på lika avstånd, och en rak i ohm, där de glesnar. Serie och tolerans visas med motstånd i stället för procent, och det sägs att E6 är ovanlig.

**Arkitektur:**
- **Den raka linjalen** blir `linSVG()` och ersätter klockan (`dialSVG`) och den logaritmiska linjalen (`rulerSVG`, utrullningen).
- **Placeringsfrågorna** byggs på Ordna (frågetypen `order`). `ORDER_SETS` får valfria krokar för lapparnas text (`chip`), egen ritning av platserna (`layout`), variant (`init`), felanimering (`anim` och `after`) och E6-raden (`e6`). De befintliga uppsättningarna `d`, `m` och `t` påverkas inte.
- **Trappan** får små motstånd med toleransbandet inringat.
- **`bandQ`** får läget `ring`, där bandet är inringat redan före svaret och trappan är felanimeringen.

**Teknik:** `index.html` med vanilla JS och CSS. Testerna körs med `node --test` och jsdom (`tests/harness.mjs`, `tests/answer.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-07-eserier-linjal-design.md` (skiss i `2026-10-07-eserier-linjal-skiss.html`)

## Globala krav

- **Nykomling:** Vad är E6? · Placera på skalan (logaritmisk) · Placera i lådorna (rak skala) · Varför ligger värdena glesare högre upp?
- **Lärling:** Vilken tolerans är E6 gjord för? (rak linjal) · Vilken serie hör till motståndet? (bandet inringat) · Vilken serie räcker?
- **Gesäll och Mästare** är oförändrade.
- **Stormästare:** Vilken serie hör till motståndet? · Vilken serie räcker? · Mästares tre frågor.
- **E6-raden:** "E6 är ovanlig i dag, men har bara sex värden och är lätt att börja med. Vanligast är E24 och E96." Den står på alla E6-frågor på Nykomling och Lärling, men inte på Eldprovet.
- **Varianterna i placeringsfrågorna:** 10–68 Ω, 1,0–6,8 Ω och 1–6,8 kΩ.
- **Ordna-mekaniken:** rätt värde flyger upp och lyser grönt. Fel värde flyger till sin rätta plats, skakar med röd bakgrund och hoppar tillbaka. Ett fel ger ett sista försök.
- **Felanimeringarna:** varje fråga har en, och låset väntar in den. Med `S.instant` och `reduceMotion()` visas slutläget direkt. På Eldprovet visas ingen animering och inget facit.
- **Efter varje task** är hela sviten grön: `node --test tests/*.test.mjs`.

## Det som granskningen ska titta på särskilt

1. **Ordna med värden:** den flygande lappen vid fel (`ofloat`) ska visa värdets text och inte en färg. `aria-label` på lapparna ska vara värdet. Testas i Task 3.
2. **Placeringarna på telefon (412 px):** lådorna på den raka skalan får inte överlappa varandra. 1,0 och 1,5 ligger bara 5 % från varandra och måste stå i olika rader. Testas i Task 5 genom att kontrollera raderna, och visuellt i Task 7.
3. **Ordnas befintliga uppsättningar** (`d`, `m` och `t`) ska fungera exakt som förut. De befintliga Ordna-testerna ska gå igenom utan ändringar.
4. **E6-raden** ska inte synas på Eldprovet och inte på Gesäll eller högre. Testas i Task 2.
5. **Krock och glapp på den raka linjalen** ska avgöras relativt till värdet, inte till linjalens längd. Annars syns falska glapp vid höga värden. Testas i Task 1.

---

### Task 1: Den raka linjalen `linSVG` ersätter `rulerSVG` i staplarfrågan

**Filer:**
- Ändra: `index.html` (ny `linSVG` efter `eVals`, `ETOL_Q`, `etolRows`, `eStaplar` och CSS)
- Ändra: `tests/eserier.test.mjs` (testerna för linjalen och utrullningen)
- Test: `tests/elinjal.test.mjs` (ny)

**Gränssnitt:**
- Skapar: `linSVG(n, {tol = null, drop = false, grow = false, cover = false, at = .2} = {}) → string`. Rak skala 10–100 Ω, viewBox `0 0 440 H`.
  - Klasser:
    - `.elin` (svg)
    - `.ltick`
    - `.lval`: grupp med prick och värde
    - `.lbar` och `.lbar.alt`: staplar
    - `.ecrash` och `.egap`
    - `.lcover`: grön linje när allt täcks
    - `.lnext`: "100 → nästa varv"
- Skapar: `linEnd(n, at = .2) → sekunder`, alltså när animeringen med `drop`, `grow` och `cover` är klar.

- [ ] **Steg 1: Skriv testerna som ska fallera**

`tests/elinjal.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atGrade, golden, load, ALL_OPEN } from './harness.mjs';
import { answer, until, cont } from './answer.mjs';

export const frag = (t, expr) => { const d = t.doc.createElement('div'); d.innerHTML = t.g(expr); return d; };

test('Raka linjalen: E6-värdena på rak skala, avstånden växer med värdet', () => {
  const t = load();
  const d = frag(t, 'linSVG(6)');
  assert.ok(d.querySelector('svg.elin'));
  const xs = [...d.querySelectorAll('.lval circle')].map(c => +c.getAttribute('cx'));
  assert.equal(xs.length, 6);
  const steps = xs.slice(1).map((x, i) => x - xs[i]);
  steps.slice(1).forEach((s, i) => assert.ok(s > steps[i], 'varje steg längre än det förra'));
  assert.deepEqual([...d.querySelectorAll('.lval text')].map(e => e.textContent), ['10','15','22','33','47','68']);
  assert.equal(d.querySelectorAll('.ltick').length, 10, 'streck vid 10, 20 … 100');
});

test('Raka linjalen: staplarna blir bredare med värdet, och krock och glapp avgörs relativt värdet', () => {
  const t = load();
  const w = d => [...d.querySelectorAll('.lbar')].map(b => +b.getAttribute('width'));
  const ws = w(frag(t, 'linSVG(6, {tol: 20})'));
  ws.slice(1).forEach((x, i) => assert.ok(x > ws[i]));
  const n = (expr, sel) => frag(t, expr).querySelectorAll(sel).length;
  assert.equal(n('linSVG(6, {tol: 20})', '.ecrash, .egap'), 0, 'E6 ±20 % är ren');
  assert.equal(n('linSVG(12, {tol: 10})', '.ecrash, .egap'), 0, 'E12 ±10 % är ren');
  assert.equal(n('linSVG(24, {tol: 5})', '.ecrash, .egap'), 0, 'E24 ±5 % är ren');
  assert.ok(n('linSVG(6, {tol: 40})', '.ecrash') > 0);
  assert.ok(n('linSVG(6, {tol: 10})', '.egap') > 0);
  assert.equal(n('linSVG(6, {tol: 20, cover: true})', '.lcover'), 1);
  assert.equal(n('linSVG(6, {tol: 10, cover: true})', '.lcover'), 0, 'ingen grön linje när det finns glapp');
});

test('Staplarfrågan: E6 i hälften av frågorna, rak linjal och E6 ±40 / ±20 / ±10', () => {
  const t = atGrade('e', 1), seen = {};
  for (let i = 0; i < 80; i++) {
    until(t, p => p.eq === 'staplar');
    const n = +t.$('#q .prompt').textContent.match(/E(\d+)/)[1];
    seen[n] = (seen[n] || 0) + 1;
    assert.ok(t.$('#q svg.elin'), 'rak linjal före svaret');
    assert.equal(t.$('#q .eruler'), null);
    if (n === 6) assert.deepEqual(t.$$('#q [data-c]').map(b => b.textContent.trim()).sort(), ['±10 %', '±20 %', '±40 %']);
  }
  assert.ok(seen[6] > 25 && seen[12] && seen[24]);
  until(t, p => p.eq === 'staplar');
  answer(t, false);
  assert.equal(t.$$('#q .etrow svg.elin').length, 3);
});
```

I `tests/eserier.test.mjs`:
- Ta bort testerna `'Linjalen: seriens prickar plus 100, värden bara upp till E24'`, `'Linjalen: för stor tolerans krockar, …'`, `'Utrullningen: första linjalen rullas ut, nästa visas direkt'`, `'Utrullningen hoppas över med S.instant men räknas ändå'` och `'Linjalen går att läsa på telefon: …'`. De ersätts av testerna ovan.
- I `'E-seriernas Lärling: Vilken tolerans är serien gjord för?, …'`: byt `.eruler` mot `svg.elin`.
- Testerna för klockan ligger kvar till Task 6.

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/elinjal.test.mjs`
Väntat: FAIL, `linSVG is not defined`.

- [ ] **Steg 3: Skriv koden**

Efter `const f1 = …`:

```js
// Den raka linjalen: 10–100 Ω med jämna steg. Värdena glesnar, och toleransstaplarna (i procent) blir bredare med värdet.
// drop: värdena faller ner, grow: staplarna växer ut, cover: grön linje när allt täcks. at: när animeringen börjar.
const LX = v => 20 + (v - 10) / 90 * 400, LAY = 92;
const linStep = n => n > 12 ? .08 : .22;
const linEnd = (n, at = .2) => at + eVals(n).length * linStep(n) + .9;
function linSVG(n, {tol = null, drop = false, grow = false, cover = false, at = .2} = {}){
  const vals = eVals(n), many = vals.length > 12, st = linStep(n), tb = at + vals.length * st + .1, tc = tb + .5;
  const d = t => drop || grow || cover ? ` style="animation-delay:${t.toFixed(2)}s"` : '';
  let h = `<line class="eline" x1="${LX(10)}" y1="${LAY}" x2="${LX(100)}" y2="${LAY}"/>`;
  for (let v = 10; v <= 100; v += 10) h += `<line class="ltick" x1="${f1(LX(v))}" y1="${LAY}" x2="${f1(LX(v))}" y2="${LAY + 7}"/><text class="ltl" x="${f1(LX(v))}" y="${LAY + 22}">${v}</text>`;
  let bad = 0;
  if (tol != null) {
    const bars = vals.concat([100]).map(v => [v * (1 - tol / 100), v * (1 + tol / 100)]);
    vals.forEach((v, i) => {
      const [a, b] = bars[i], x0 = LX(Math.max(10, a)), x1 = LX(Math.min(100, b));
      h += `<rect class="lbar${i % 2 ? ' alt' : ''}${grow ? ' grow' : ''}"${grow ? d(tb + i * .04) : ''} x="${f1(x0)}" y="${i % 2 ? 54 : 64}" width="${f1(Math.max(2, x1 - x0))}" height="9" rx="3"/>`;
      // Krock eller glapp mot grannen, relativt grannens värde
      const nx = vals[i + 1] ?? 100, rel = (b - bars[i + 1][0]) / nx;
      if (Math.abs(rel) < ETOL_MIN) return;
      bad++;
      const lo = Math.min(b, bars[i + 1][0]), hi = Math.max(b, bars[i + 1][0]);
      h += `<rect class="${rel > 0 ? 'ecrash' : 'egap'}${grow ? ' mk' : ''}"${grow ? d(tc) : ''} x="${f1(LX(Math.max(10, lo)))}" y="${LAY - 4}" width="${f1(Math.max(3, LX(Math.min(100, hi)) - LX(Math.max(10, lo))))}" height="8" rx="2"/>`;
    });
    if (cover && !bad) h += `<rect class="lcover${grow ? ' sweep' : ''}"${grow ? d(tc) : ''} x="${LX(10)}" y="${LAY - 3}" width="400" height="6" rx="3"/>`;
  }
  vals.forEach((v, i) => {
    h += `<g class="lval${drop ? ' drop' : ''}"${drop ? d(at + i * st) : ''}><circle cx="${f1(LX(v))}" cy="${LAY}" r="${many ? 3.5 : 5}"/>` +
      `<text x="${f1(LX(v))}" y="${many && i % 2 ? 22 : 40}"${many ? ' class="sm"' : ''}>${eLab(v)}</text></g>`;
  });
  h += `<g class="lnext${cover ? ' mk' : ''}"${cover ? d(tc) : ''}><circle cx="${LX(100)}" cy="${LAY}" r="5"/><text x="${LX(100)}" y="${LAY - 14}">100 → nästa varv</text></g>`;
  return `<svg class="elin" viewBox="0 0 440 ${LAY + 34}" role="img" aria-label="Rak linjal 10–100 Ω med E${n}-värdena">${h}</svg>`;
}
```

Ändra `ETOL_Q` till `{6: [40, 20, 10], 12: [20, 10, 5], 24: [10, 5, 2]}`.

I `etolRows`: byt `rulerSVG(n, {tol: t})` mot `linSVG(n, {tol: t})`.

I `eStaplar`:
- `const n = rnd([6, 6, 12, 24])`
- `res: () => S.answered && !inExam() ? etolRows(n, tols) : linSVG(n)`

CSS efter `.res .eruler{…}`:

```css
.res .elin{display:block;width:100%;max-width:520px;margin:0 auto}
.elin .eline{stroke:var(--ink);stroke-width:2}
.elin .ltick{stroke:var(--muted)}
.elin .ltl{fill:var(--muted);font-size:13px;text-anchor:middle}
.elin .lval circle{fill:var(--accent)}
.elin .lval text{fill:var(--ink);font-size:15px;font-weight:700;text-anchor:middle}
.elin .lval text.sm{font-size:11px}
.elin .lbar{fill:var(--accent);opacity:.55}.elin .lbar.alt{opacity:.35}
.elin .ecrash{fill:var(--bad)}.elin .egap{fill:var(--gap)}
.elin .lcover{fill:var(--ok)}
.elin .lnext circle{fill:none;stroke:var(--muted);stroke-width:2;stroke-dasharray:3 2}
.elin .lnext text{fill:var(--muted);font-size:12px;font-weight:600;text-anchor:end}
@media (prefers-reduced-motion:no-preference){
  .elin .drop{animation:ldrop .4s ease-out both}
  @keyframes ldrop{from{transform:translateY(-30px);opacity:0}}
  .elin .grow{transform-box:fill-box;transform-origin:center;animation:lgrow .5s ease-out both}
  @keyframes lgrow{from{transform:scaleX(0)}}
  .elin .sweep{transform-box:fill-box;transform-origin:left;animation:lgrow .8s ease-in-out both}
}
```

`.lnext` står längst till höger och ankras på `text-anchor:end` vid x=420. Sätt `x="${LX(100) + 8}"` på texten om den klipps. Kontrollera det i Task 7.

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/elinjal.test.mjs tests/eserier.test.mjs`
Väntat: PASS.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: gröna.

```bash
git add index.html tests/elinjal.test.mjs tests/eserier.test.mjs
git commit -m "E-serierna: den raka linjalen i ohm, och staplarfrågan på den med E6"
```

---

### Task 2: E6-raden, Vad är E6? och Varför ligger värdena glesare högre upp?

**Filer:**
- Ändra: `index.html` (`E6_NOTE`, `choiceHTML`, `eVad` och `eGlesare` efter `eStaplar`, och `GRADES.e[0]`)
- Ändra: `tests/eutan.test.mjs` (Nykomling-testerna med `namn` och `vad`)
- Test: `tests/elinjal.test.mjs`

**Gränssnitt:**
- Skapar:
  - `E6_NOTE`, en sträng
  - `S.cq.e6`, en flagga som visar E6-raden i `choiceHTML`
  - `eVad()` (eq `'vad'`) och `eGlesare()` (eq `'glesare'`)
- Använder: `linSVG` och `linEnd`.

- [ ] **Steg 1: Skriv testerna som ska fallera**

Lägg till i `tests/elinjal.test.mjs`:

```js
test('Vad är E6?: standardvärden, raka linjalen efter svaret, och vid fel tänds samma värde med olika nollor', () => {
  for (const ok of [true, false]) {
    const t = atGrade('e', 0);
    until(t, p => p.eq === 'vad');
    assert.equal(t.$('#q .prompt').textContent.trim(), 'Vad är E6?');
    assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), 'Standardvärden som motstånd säljs i');
    assert.ok(t.$('#q .e6note'));
    answer(t, ok);
    assert.equal(t.$$('#q svg.elin .lval').length, 6);
    assert.equal(t.$$('#q .eex .mk').length, ok ? 0 : 3);
  }
  const t = atGrade('e', 0);
  until(t, p => p.eq === 'vad');
  assert.match(t.g('S.cq.wrong'), /ovanlig.*E24 och E96/);
});

test('Varför glesare: rätt svar är procent, och vid fel faller värdena, staplarna växer och tabellen visas', () => {
  const t = atGrade('e', 0);
  until(t, p => p.eq === 'glesare');
  assert.equal(t.$('#q .prompt').textContent.trim(), 'Varför ligger värdena glesare högre upp?');
  assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), 'Toleransen är i procent, så stora värden täcker fler ohm');
  assert.equal(t.$$('#q svg.elin .lbar').length, 0, 'inga staplar före svaret');
  assert.ok(t.$('#q .e6note'));
  answer(t, false);
  assert.equal(t.$$('#q svg.elin .lbar').length, 6);
  assert.ok(t.$('#q svg.elin .lcover'));
  assert.match(t.$('#q .eptab').textContent, /68 Ω ±13,6 Ω/);
  assert.ok(t.g('S.cq.anim.total') >= t.g('linEnd(6)'));
});

test('E6-raden syns inte på Gesäll, och inte på Eldprovet', () => {
  const t = atGrade('e', 2);
  for (let i = 0; i < 10; i++) { t.g('next()'); assert.equal(t.$('#q .e6note'), null); }
  const u = load({ storage: ALL_OPEN });
  u.g("openTopic('ultra'); beginExam(); GRADES.e[4] = eGlesare; S.exam.queue[S.exam.i] = {topic: 'e'}; next()");
  assert.equal(u.$('#q .e6note'), null);
});
```

I `tests/eutan.test.mjs`:
- Ta bort testerna `'Nykomling: Vad betyder 12 i E12? och Vad är E12?, båda förekommer'`, `'Nykomling: 12 i E12 betyder …'`, `'Nykomling: Vad är E12? Standardvärden, …'` och `'Nykomling: Vad är E12? vid fel låser …'`. De ersätts av testerna ovan.

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/elinjal.test.mjs`
Väntat: FAIL, eftersom eq `glesare` inte finns och prompten är "Vad är E12?".

- [ ] **Steg 3: Skriv koden**

Efter `eStaplar`:

```js
// E6 är ovanlig i dag, men har minst värden och är lättast att börja med
const E6_NOTE = 'E6 är ovanlig i dag, men har bara sex värden och är lätt att börja med. Vanligast är E24 och E96.';
function eVad(){
  return choice(() => {
    const right = 'Standardvärden som motstånd säljs i';
    const opts = shuffle([right, 'En färgkod för motstånd', 'Ett motstånd på 6 Ω', 'En tolerans på ±6 %']);
    const ex = ['4,7 Ω', '47 Ω', '4,7 kΩ'], at = linEnd(6) - .6;
    S.cq = {e6: true, prompt:'Vad är E6?', layout:'txt', right: opts.indexOf(right), opts: opts.map(x => ({html: x})),
      anim: {total: at + ex.length * .4 + .6},
      res: () => !S.answered ? '' : linSVG(6, {drop: !inExam()}) + (S.ok || inExam() ? ''
        : `<p class="eex">Samma värde: ${ex.map((x, i) => `<span class="mk" style="animation-delay:${(at + i * .4).toFixed(2)}s">${x}</span>`).join(' · ')}</p>`),
      wrong: 'E6 är en lista med standardvärden: 10, 15, 22, 33, 47 och 68. Motstånd tillverkas inte i alla värden, bara i de här och samma siffror gånger 10, 100, 1000 … E6 är ovanlig i dag, och vanligast är E24 och E96, men den har minst värden och är lättast att börja med.'};
  }, {eq: 'vad'});
}
function eGlesare(){
  return choice(() => {
    const right = 'Toleransen är i procent, så stora värden täcker fler ohm';
    const opts = shuffle([right, 'Stora motstånd är dyrare att tillverka', 'Färgkoden har inte plats för fler värden', 'Det är bara bestämt så']);
    const tab = [10, 22, 47, 68].map(v => `${v} Ω ±${num(v * .2)} Ω`).join(' · ');
    S.cq = {e6: true, prompt:'Varför ligger värdena glesare högre upp?', layout:'txt', right: opts.indexOf(right), opts: opts.map(x => ({html: x})),
      anim: {total: linEnd(6) + .4},
      res: () => S.answered && !S.ok && !inExam() ? linSVG(6, {tol: 20, drop: true, grow: true, cover: true}) + `<p class="eptab mk" style="animation-delay:${linEnd(6).toFixed(2)}s">${tab}</p>` : linSVG(6),
      wrong: '±20 % av 10 är ±2 Ω, men ±20 % av 68 är ±13,6 Ω. Därför kan stegen bli längre högre upp, och ändå når varje värde fram till grannen.'};
  }, {eq: 'glesare'});
}
```

I `choiceHTML`, direkt efter `${topHTML(Q.prompt)}`, lägg till `${Q.e6 && !inExam() ? `<p class="e6note">${E6_NOTE}</p>` : ''}`.

Byt `GRADES.e[0]` mot:

```js
    // Nykomling: vad E6 är, placera värdena på två skalor, och varför de glesnar
    () => rnd([eVad, eGlesare])(),
```

Placeringsfrågorna läggs till i Task 4 och 5.

CSS:

```css
.e6note{font-size:.85rem;color:var(--muted);margin:-4px 0 8px}
.eptab{text-align:center;font-size:.9rem;font-weight:600;font-variant-numeric:tabular-nums;margin:4px 0 0}
```

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/elinjal.test.mjs tests/eutan.test.mjs tests/eserier.test.mjs`
Väntat: PASS. Testet `'Klockan: E12 med nummer …'` i `eserier.test.mjs` testar `dialSVG` direkt och går fortfarande igenom.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: gröna.

```bash
git add index.html tests
git commit -m "E-seriernas Nykomling: Vad är E6? och Varför glesare? på den raka linjalen, och att E6 är ovanlig"
```

---

### Task 3: Ordna kan visa värden, med egen ritning, variant och felanimering

**Filer:**
- Ändra: `index.html` (`orderPlan`, Ordna-grenen i `render()`, `orderPick`, `orderMiss`, `qAnim`, `lessonHTML` och CSS)
- Test: `tests/elinjal.test.mjs`

**Gränssnitt:**
- Skapar valfria fält i `ORDER_SETS[set]`:
  - `init() → object`: slås ihop med `S.ord`, till exempel `{v: '10'}`.
  - `chip(k, o) → string`: lappens text. Utan `chip` visas färgen som förut.
  - `boxLab(k, o) → string`: texten i lådan när värdet har landat. Utan `boxLab` används `chip`.
  - `layout(o) → html`: platserna. Varje plats har `class="obox…" data-oslot="k"`.
  - `prompt` och `wrong`: sträng, eller funktion av `o`.
  - `anim(o) → {total}` och `after(o) → html`: felanimeringen, som visas när frågan är besvarad och fel och inte på Eldprovet.
  - `e6: true`: visar E6-raden.
- Skapar: `oswHTML(k)`, innehållet i en låda (färg eller värde).

- [ ] **Steg 1: Skriv testerna som ska fallera**

```js
test('Ordna med värden: lapparna visar text, fel flyger som text, och rätt fyller lådorna i ordning', () => {
  const t = atGrade('e', 0);
  t.g(`ORDER_SETS.test = {keys: ['a','b','c'], init: () => ({v: 'x'}), chip: (k, o) => k.toUpperCase() + o.v,
    prompt: o => 'Testa ' + o.v, wrong: 'fel', anim: () => ({total: 1.5}), after: () => '<p class="tafter">efter</p>',
    layout: o => '<div class="tlay">' + o.keys.map(k => '<i class="obox' + (o.placed[k] ? ' ok' : '') + '" data-oslot="' + k + '">' + (o.placed[k] ? oswHTML(k) : '') + '</i>').join('') + '</div>'};
    GRADES.e[0] = orderPlan('test'); next()`);
  assert.equal(t.g('S.type'), 'order');
  assert.equal(t.$('#q .prompt').textContent.trim(), 'Testa x');
  assert.ok(t.$('#q .tlay'));
  assert.deepEqual(t.$$('#q [data-ord]').map(b => b.textContent.trim()).sort(), ['AX', 'BX', 'CX']);
  assert.equal(t.$('#q [data-ord="a"]').getAttribute('aria-label'), 'AX');
  t.$('#q [data-ord="b"]').click();
  assert.equal(t.g('S.ord.missed'), true);
  for (const k of ['a', 'b', 'c']) t.$(`#q [data-ord="${k}"]`).click();
  // Ett fel ger ett sista försök
  assert.equal(t.g('S.ord.round'), 2);
  t.$('#q [data-ord="c"]').click();
  for (const k of ['a', 'b', 'c']) t.$(`#q [data-ord="${k}"]`).click();
  assert.equal(t.g('S.answered'), true);
  assert.equal(t.g('S.ok'), false);
  assert.ok(t.$('#q .tafter'), 'felanimeringen');
  assert.match(t.$('#q .obox[data-oslot="a"]').textContent, /AX/);
});

test('Ordna med färger fungerar som förut: färgrutor, inga textlappar', () => {
  const t = atGrade('ohm', 1);
  until(t, p => p.type === 'order');
  const chip = t.$('#q [data-ord]');
  assert.equal(chip.textContent.trim(), '');
  assert.match(chip.getAttribute('style'), /background/);
});
```

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/elinjal.test.mjs`
Väntat: FAIL, `oswHTML is not defined`.

- [ ] **Steg 3: Skriv koden**

`orderPlan`:

```js
const orderPlan = set => () => ({type:'order', fmt:'mc', setup(){ const O = ORDER_SETS[set]; S.ord = {set, keys: O.keys, pool: shuffle(O.keys.slice()), placed: {}, landed: new Set(), away: new Set(), inflight: 0, round: 1, missed: false, ...(O.init ? O.init() : {})}; }});
// Innehållet i en låda: färgen, eller värdet när uppsättningen har text på lapparna
const oswHTML = k => { const O = ORDER_SETS[S.ord.set]; return O.chip ? `<b class="osw val">${(O.boxLab || O.chip)(k, S.ord)}</b>` : `<b class="osw" style="${swStyle(k)}"></b>`; };
const oval = (O, v, o) => typeof v === 'function' ? v(o) : v;
```

Ordna-grenen i `render()` blir:

```js
  if (S.type === 'order') {
    const o = S.ord, O = ORDER_SETS[o.set], P = o.placed, want = o.keys.find(k => !P[k]);
    const slots = O.layout ? O.layout(o) : `<div class="ordrow ord-${o.set}" style="--n:${O.keys.length}">${O.keys.map(k =>
      `<div class="oslot"><span>${O.lab(k)}</span><i class="obox${P[k] ? (o.landed.has(k) ? ' ok' : ' fly') : ''}" data-oslot="${k}">${P[k] ? oswHTML(k) : ''}</i></div>`).join('')}</div>`;
    const chip = k => O.chip ? `aria-label="${O.chip(k, o)}">${O.chip(k, o)}` : `aria-label="${C[k].n}" style="${swStyle(k)}">`;
    h += `${topHTML(oval(O, O.prompt, o))}${O.e6 && !inExam() ? `<p class="e6note">${E6_NOTE}</p>` : ''}${o.round === 2 ? '<p class="ordnote">Nästan! Du får ett sista försök – utan hjälp.</p>' : ''}${slots}
      <div class="opool">${o.pool.map(k => `<button class="ochip${O.chip ? ' val' : ''}${P[k] || o.away.has(k) ? ' gone' : ''}${o.hint === k ? ' hint' : ''}${cheat(k === want)}" data-ord="${k}"${P[k] || S.answered ? ' disabled' : ''} ${chip(k)}</button>`).join('')}</div>
      ${S.answered && !S.ok && !inExam() && O.after ? `<div class="res after">${O.after(o)}</div>` : ''}`;
```

`chip(k)` slutar med `>` för färgvarianten och med `>text` för värdena. Knappens `>` sätts alltså av `chip`. Kontrollera den genererade HTML:en i testet för färger.

I `orderPick`: byt `box.innerHTML = \`<b class="osw" style="${swStyle(k)}"></b>\`` mot `box.innerHTML = oswHTML(k)`. Kontrollera sedan att `box.classList.add('fly')` fungerar på lådor från `layout`, eftersom de också har `obox`.

I `orderMiss`: byt raden med `f.style.cssText = …${swStyle(k)}` mot:

```js
  const O = ORDER_SETS[o.set];
  f.style.cssText = `left:${from.left + scrollX}px;top:${from.top + scrollY}px;width:${from.width}px;height:${from.height}px;${O.chip ? '' : swStyle(k)}`;
  if (O.chip) { f.classList.add('val'); f.textContent = O.chip(k, o); }
```

I `qAnim`: lägg till först i kedjan:

```js
const qAnim = () => S.cq ? S.cq.anim : S.type === 'order' && ORDER_SETS[S.ord.set].anim ? ORDER_SETS[S.ord.set].anim(S.ord) : S.type === 'dir' ? …
```

I funktionen som bygger felraden, alltså raden `const line = S.cq ? S.cq.wrong : … ORDER_SETS[S.ord.set].wrong …` (sök på `ORDER_SETS[S.ord.set].wrong`), byt `ORDER_SETS[S.ord.set].wrong` mot `oval(ORDER_SETS[S.ord.set], ORDER_SETS[S.ord.set].wrong, S.ord)`.

CSS:

```css
.ochip.val{width:auto;min-width:46px;padding:0 10px;background:var(--surface);color:var(--ink);font:700 1rem var(--text);font-variant-numeric:tabular-nums}
.ofloat.val{display:grid;place-items:center;background:var(--bad);border-color:var(--bad);color:var(--surface);font:700 1rem var(--text)}
.osw.val{display:grid;place-items:center;background:var(--ok);color:var(--surface);font:700 .8rem var(--text);white-space:nowrap}
```

`ofloat.val` får röd bakgrund under hela flygningen, enligt skissen. Om det ser fel ut kan bakgrunden i stället sättas när lappen skakar, alltså när `boxEl.classList.add('bad')` körs. Kontrollera det visuellt i Task 7.

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/elinjal.test.mjs tests/order.test.mjs`
Väntat: PASS. Ordna-testerna för färger är oförändrade.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: gröna.

```bash
git add index.html tests/elinjal.test.mjs
git commit -m "Ordna kan visa värden i stället för färger, med egen ritning, variant och felanimering"
```

---

### Task 4: Placera på skalan (logaritmisk)

**Filer:**
- Ändra: `index.html` (`E6M`, `E6VAR`, `e6Lab`, `escaleHTML`, `ORDER_SETS.e6log`, `GRADES.e[0]` och CSS)
- Test: `tests/elinjal.test.mjs`

**Gränssnitt:**
- Skapar:
  - `E6M = ['1.0','1.5','2.2','3.3','4.7','6.8']`: nycklarna
  - `E6VAR = {'10': {k: 10, u: 'Ω'}, '1': {k: 1, u: 'Ω'}, 'k': {k: 1, u: 'kΩ'}}`
  - `e6Lab(key, v) → '15 Ω' | '1,5 Ω' | '1,5 kΩ'`
  - `escaleHTML(o, kind)`, där `kind` är `'log'` eller `'lin'`
  - `ORDER_SETS.e6log`

- [ ] **Steg 1: Skriv testerna som ska fallera**

```js
const placeAll = (t, ok) => {
  if (!ok) t.$(`#q [data-ord="${t.g('S.ord.keys[1]')}"]`).click();
  for (let r = 0; r < 2 && !t.g('S.answered'); r++) for (const k of t.g('S.ord.keys.slice()')) t.$(`#q [data-ord="${k}"]`).click();
  if (!ok && !t.g('S.answered')) { t.$(`#q [data-ord="${t.g('S.ord.keys[1]')}"]`).click(); for (const k of t.g('S.ord.keys.slice()')) t.$(`#q [data-ord="${k}"]`).click(); }
};

test('Placera på skalan: logaritmiska platser på nästan lika avstånd, tre varianter och E6-raden', () => {
  const t = atGrade('e', 0), vs = new Set();
  for (let i = 0; i < 30; i++) {
    until(t, p => p.type === 'order' && t.g("S.ord.set") === 'e6log');
    vs.add(t.g('S.ord.v'));
  }
  assert.deepEqual([...vs].sort(), ['1', '10', 'k']);
  const left = k => parseFloat(t.$(`#q .escale [data-oslot="${k}"]`).style.left);
  const xs = t.g('S.ord.keys.slice()').map(left), steps = xs.slice(1).map((x, i) => x - xs[i]);
  const avg = steps.reduce((a, b) => a + b) / steps.length;
  steps.forEach(s => assert.ok(Math.abs(s - avg) / avg < .15, 'lika avstånd'));
  assert.ok(t.$('#q .escale.log'));
  assert.ok(t.$('#q .e6note'));
  assert.match(t.$('#q .escale').textContent, /logaritmisk skala/);
});

test('Placera på skalan: lapparna har värden med enhet, och vid fel tänds bågarna ×1,5', () => {
  const t = atGrade('e', 0);
  until(t, p => p.type === 'order' && t.g("S.ord.set") === 'e6log');
  t.g("S.ord.v = '10'; render()");
  assert.deepEqual(t.$$('#q [data-ord]').map(b => b.textContent.trim()).sort(), ['10 Ω','15 Ω','22 Ω','33 Ω','47 Ω','68 Ω'].sort());
  placeAll(t, false);
  assert.equal(t.g('S.ok'), false);
  assert.equal(t.$$('#q .earc').length, 6);
  assert.match(t.$('#q .after').textContent, /×1,5/);
});
```

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/elinjal.test.mjs`
Väntat: FAIL. `until` hittar ingen `e6log` och kastar "hittade ingen sådan fråga".

- [ ] **Steg 3: Skriv koden**

Efter `eGlesare`:

```js
// Placera E6-värdena: nycklarna är siffrorna, varianten ger multiplikator och enhet
const E6M = ['1.0','1.5','2.2','3.3','4.7','6.8'];
const E6VAR = {'10': {k: 10, u: 'Ω'}, '1': {k: 1, u: 'Ω'}, 'k': {k: 1, u: 'kΩ'}};
const e6Lab = (key, v) => `${num(+key * E6VAR[v].k)} ${E6VAR[v].u}`;
// I lådan står bara siffran: enheten står under skalan, och lådorna är smala
const e6Box = (key, o) => num(+key * E6VAR[o.v].k);
const e6Tick = (d, v) => `${num(d * E6VAR[v].k)}`;
// Skalan: logaritmisk (lika avstånd) eller rak från 0 (tätt i början). Lådorna är Ordnas, placerade i procent.
const ePosLog = m => 3 + Math.log10(m) * 94, ePosLin = m => 3 + m / 10 * 94;
function escaleHTML(o, kind){
  const P = o.placed, pos = kind === 'log' ? ePosLog : ePosLin, v = o.v;
  const ticks = kind === 'log' ? [1,2,3,4,5,6,7,8,9,10] : [0,1,2,3,4,5,6,7,8,9,10];
  const lab = d => kind === 'log' && (d === 7 || d === 9) ? '' : e6Tick(d, v);
  const t = ticks.map(d => `<i class="etk" style="left:${f1(pos(d || .0001))}%"><b>${lab(d)}</b></i>`).join('');
  const boxes = o.keys.map((k, i) => {
    const row = kind === 'lin' && i % 2 ? ' up' : '';
    return `<i class="obox ebox${row}${P[k] ? (o.landed.has(k) ? ' ok' : ' fly') : ''}" data-oslot="${k}" style="left:${f1(pos(+k))}%">${P[k] ? oswHTML(k) : ''}</i>`;
  }).join('');
  const next = kind === 'log' ? `<i class="enext" style="left:${f1(pos(10))}%"></i>` : '';
  return `<div class="escale ${kind}"><div class="eaxis"></div>${t}${boxes}${next}<p class="escap">${kind === 'log' ? 'logaritmisk skala' : 'rak skala'}, ${E6VAR[v].u}</p></div>`;
}
const e6arcs = o => `<div class="escale log arcs">${E6M.concat(['10']).map((k, i, a) => i === a.length - 1 ? '' :
  `<i class="earc mk" style="left:${f1(ePosLog(+k))}%;width:${f1(ePosLog(+a[i + 1]) - ePosLog(+k))}%;animation-delay:${(.3 + i * .35).toFixed(2)}s"><b>×${num(Math.round(+a[i + 1] / +k * 10) / 10)}</b></i>`).join('')}</div>`;
```

I `ORDER_SETS`:

```js
  e6log: {keys: E6M, e6: true, init: () => ({v: rnd(['10', '1', 'k'])}), chip: (k, o) => e6Lab(k, o.v), boxLab: e6Box, layout: o => escaleHTML(o, 'log'),
    prompt: 'Placera E6-värdena på skalan. Börja med det minsta.',
    anim: () => ({total: .3 + 6 * .35 + .4}), after: e6arcs,
    wrong: 'Varje värde är ungefär ×1,5 av det förra. På en logaritmisk skala ligger de därför på lika avstånd, och efter 68 kommer 100 och samma värden igen.'},
```

`ORDER_SETS` definieras före `E6M` i filen. Flytta därför `E6M`, `E6VAR`, `e6Lab`, `e6Tick`, `ePosLog`, `ePosLin`, `escaleHTML` och `e6arcs` till direkt före `const ORDER_SETS = {`. Krokarna anropas först vid körning, men `keys: E6M` läses när `ORDER_SETS` skapas.

`GRADES.e[0]`: `() => rnd([eVad, eGlesare, orderPlan('e6log')])(),`

CSS:

```css
.escale{position:relative;height:96px;margin:28px 6px 8px}
.escale .eaxis{position:absolute;left:3%;right:3%;top:52px;height:2px;background:var(--ink)}
.escale .etk{position:absolute;top:52px;width:1px;height:8px;background:var(--muted)}
.escale .etk b{position:absolute;top:10px;left:50%;transform:translateX(-50%);font:400 .75rem var(--text);color:var(--muted);white-space:nowrap}
.escale .ebox{position:absolute;top:30px;width:36px;height:22px;max-width:none;aspect-ratio:auto;transform:translateX(-50%);border-radius:6px}
.escale.lin .ebox.up{top:2px}
.escale.lin .ebox::after{content:"";position:absolute;left:50%;top:100%;width:2px;height:22px;background:var(--accent)}
.escale.lin .ebox.up::after{height:50px}
.escale .enext{position:absolute;top:44px;width:16px;height:16px;transform:translateX(-50%);border:2px dashed var(--muted);border-radius:50%}
.escale .escap{position:absolute;right:3%;top:76px;margin:0;font-size:.75rem;color:var(--muted)}
.escale.arcs{height:44px;margin-top:4px}
.earc{position:absolute;top:18px;height:22px;border:2px solid var(--ok);border-bottom:0;border-radius:50% 50% 0 0/100% 100% 0 0}
.earc b{position:absolute;top:-18px;left:50%;transform:translateX(-50%);color:var(--ok);font:700 .8rem var(--text)}
```

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/elinjal.test.mjs`
Väntat: PASS.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: gröna. Beroenderegeln i `model.test.mjs` för `e` på grad 0 måste bli `['choice', 'order']` i den här tasken: `e: [['choice', 'order'], ['choice'], ['choice'], ['choice'], ['choice']]`.

```bash
git add index.html tests
git commit -m "E-seriernas Nykomling: Placera på skalan, logaritmisk med bågarna ×1,5 vid fel"
```

---

### Task 5: Placera i lådorna (rak skala)

**Filer:**
- Ändra: `index.html` (`ORDER_SETS.e6lin`, `e6bars` och `GRADES.e[0]`)
- Test: `tests/elinjal.test.mjs`

- [ ] **Steg 1: Skriv testerna som ska fallera**

```js
test('Placera i lådorna: rak skala från 0, avstånden växer, varannan låda högre upp, och vid fel sex staplar', () => {
  const t = atGrade('e', 0);
  until(t, p => p.type === 'order' && t.g("S.ord.set") === 'e6lin');
  assert.ok(t.$('#q .escale.lin'));
  const keys = t.g('S.ord.keys.slice()'), left = k => parseFloat(t.$(`#q [data-oslot="${k}"]`).style.left);
  const steps = keys.slice(1).map((k, i) => left(k) - left(keys[i]));
  steps.slice(1).forEach((s, i) => assert.ok(s > steps[i] - .01, 'avstånden växer'));
  keys.forEach((k, i) => assert.equal(t.$(`#q [data-oslot="${k}"]`).classList.contains('up'), i % 2 === 1, 'varannan rad'));
  assert.match(t.$('#q .escale').textContent, /rak skala/);
  assert.ok(t.$('#q .e6note'));
  placeAll(t, false);
  assert.equal(t.$$('#q .ebarl').length, 6);
});

test('Nykomling blandar alla fyra frågorna', () => {
  const t = atGrade('e', 0), seen = new Set();
  for (let i = 0; i < 120; i++) { t.g('next()'); seen.add(t.g('S.plan.eq') || t.g('S.ord.set')); }
  assert.deepEqual([...seen].sort(), ['e6lin', 'e6log', 'glesare', 'vad']);
});
```

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/elinjal.test.mjs`
Väntat: FAIL, eftersom `e6lin` saknas.

- [ ] **Steg 3: Skriv koden**

Före `const ORDER_SETS = {`:

```js
const e6bars = () => `<div class="escale lin bars">${E6M.map((k, i) => {
  const a = ePosLin(+k * .8), b = ePosLin(Math.min(+k * 1.2, 10));
  return `<i class="ebarl${i % 2 ? ' alt' : ''} grow" style="left:${f1(a)}%;width:${f1(b - a)}%;animation-delay:${(.3 + i * .3).toFixed(2)}s"></i>`;
}).join('')}<p class="escap mk" style="animation-delay:2.2s">±20 % runt varje värde: stegen blir längre, men staplarna når ändå fram</p></div>`;
```

I `ORDER_SETS`:

```js
  e6lin: {keys: E6M, e6: true, init: () => ({v: rnd(['10', '1', 'k'])}), chip: (k, o) => e6Lab(k, o.v), boxLab: e6Box, layout: o => escaleHTML(o, 'lin'),
    prompt: 'Placera E6-värdena i lådorna. Börja med det minsta.',
    anim: () => ({total: 2.8}), after: e6bars,
    wrong: 'På en rak skala ligger E6-värdena tätt i början och glest i slutet. Toleransen är i procent, så stora värden täcker fler ohm.'},
```

`GRADES.e[0]`: `() => rnd([eVad, eGlesare, orderPlan('e6log'), orderPlan('e6lin')])(),`

CSS:

```css
.escale.bars{height:60px;margin-top:0}
.ebarl{position:absolute;top:8px;height:9px;border-radius:3px;background:var(--accent);opacity:.55}
.ebarl.alt{top:20px;opacity:.35}
.escale.bars .escap{top:36px;left:3%;right:auto}
@media (prefers-reduced-motion:no-preference){.ebarl.grow{transform-origin:center;animation:lgrow .5s ease-out both}}
```

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/elinjal.test.mjs`
Väntat: PASS.

- [ ] **Steg 5: Hela sviten och commit**

Kör: `node --test tests/*.test.mjs`
Väntat: gröna.

```bash
git add index.html tests/elinjal.test.mjs
git commit -m "E-seriernas Nykomling: Placera i lådorna på rak skala, med toleransstaplarna vid fel"
```

---

### Task 6: Lärling och Stormästare, trappan med motstånd, och bort med klockan

**Filer:**
- Ändra: `index.html` (`miniRes`, `stairHTML`, `bandQ` med `ring`, `GRADES.e[1]` och `GRADES.e[4]`. Bort med `eSerieTol`, `dialSVG`, `rollNow`, `rulerSVG`, `ePos`, `RW`, `RY`, `RC` och deras CSS.)
- Ändra: `tests/eutan.test.mjs`, `tests/eserier.test.mjs`, `tests/model.test.mjs` och `dev.html`
- Test: `tests/elinjal.test.mjs`

**Gränssnitt:**
- Skapar:
  - `miniRes(ser) → svg-sträng`: ett litet motstånd med toleransbandet inringat
  - `stairHTML({…, minis = false})`
  - `bandQ({…, ring = false})`, som ger eq `'bandring'` när `ring` är satt

- [ ] **Steg 1: Skriv testerna som ska fallera**

```js
test('Vilken serie hör till motståndet?: bandet inringat före svaret, färgen under, och trappan med motstånd vid fel', () => {
  const t = atGrade('e', 1);
  until(t, p => p.eq === 'bandring');
  const r = JSON.parse(t.g('JSON.stringify(S.cq.r)'));
  assert.equal(t.$$('#q .res .ring').length, 1, 'inringat före svaret');
  assert.equal(t.$$('#q [data-c]')[t.g('S.cq.right')].textContent.trim(), t.g(`serOfBands(${JSON.stringify(r.bands)})`));
  assert.ok(t.$('#q .etol'));
  answer(t, false);
  assert.equal(t.$$('#q .estep .emini').length, 6, 'sex små motstånd');
  assert.equal(t.$$('#q .estep.hl').length, 1);
});

test('Lärling: staplarna, motståndet med bandet och räcker', () => {
  const t = atGrade('e', 1), seen = new Set();
  for (let i = 0; i < 90; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['bandring', 'racker', 'staplar']);
});

test('Stormästare: motståndet med bandet, räcker och Mästares tre, ingen serie ↔ tolerans som text', () => {
  const t = atGrade('e', 4), seen = new Set();
  for (let i = 0; i < 200; i++) { t.g('next()'); seen.add(t.g('S.plan.eq')); }
  assert.deepEqual([...seen].sort(), ['band', 'bandring', 'multi', 'racker', 'sakert']);
});

test('Klockan och den logaritmiska linjalen är borta', () => {
  const t = load();
  for (const f of ['dialSVG', 'rollNow', 'rulerSVG', 'eSerieTol']) assert.equal(t.g(`typeof ${f}`), 'undefined', f);
});
```

I `tests/eutan.test.mjs`:
- Ta bort `'Lärling: serie ↔ tolerans, vilken serie räcker, staplarna och motståndet med toleransen utskriven'`, `'Lärling: motståndet har toleransen utskriven, …'`, `'Lärling: serie ↔ tolerans visar trappan …'` och `'Stormästare: blandar serie ↔ tolerans, …'`. De ersätts ovan.
- I `'Trappan: sex steg, …'` ingår inte `minis`. Det testet behålls.

I `tests/eserier.test.mjs`: ta bort klocktesterna (`'Klockan: …'`, tre stycken).

I `tests/model.test.mjs`: beroenderegeln för `e` är redan `[['choice','order'], ['choice'], ['choice'], ['choice'], ['choice']]` sedan Task 4.

- [ ] **Steg 2: Kör och se dem fallera**

Kör: `node --test tests/elinjal.test.mjs`
Väntat: FAIL, eftersom eq `bandring` saknas.

- [ ] **Steg 3: Skriv koden**

Före `stairHTML`:

```js
// Trappans små motstånd: ett exempel per serie med toleransbandet inringat. E6 har ett streckat tomt band.
const MINI = {E6: ['yellow','violet','red',null], E12: ['yellow','violet','red','silver'], E24: ['yellow','violet','red','gold'],
  E48: ['red','orange','orange','brown','red'], E96: ['red','orange','orange','brown','brown'], E192: ['red','orange','orange','brown','green']};
const miniRes = s => { const b = MINI[s]; return `<span class="emini">${svg(b, {style: stdStyle(b.length), ring: [[b.length - 1, 'ok']], label: `Motstånd i ${s}`})}</span>`; };
```

I `stairHTML`: lägg till parametern `minis = false`, och sätt `${minis ? miniRes(s) : ''}` först i varje `.estep`. Ändra CSS för `.estep` så att den har en extra kolumn när det finns ett motstånd: `.estep:has(.emini){grid-template-columns:52px 3.4em 4.2em 1fr}`, och lägg till `.emini svg{width:52px;height:auto;display:block}`.

I `bandQ`: lägg till `ring = false` bland parametrarna. När `ring` är satt:
- eq är `'bandring'`
- `res` visar motståndet med `ring: [[ti, 'accent']]` före svaret (för E6 med `[...r.bands, null]` och `stdStyle(4)`), och `<p class="etol">${n === 3 ? 'Inget band' : C[r.bands[ti]].n}</p>`
- `anim` blir `{total: stairEnd()}`
- `after: () => S.ok ? '' : stairHTML({hl: r.ser, minis: true})`
- ingen `land` och ingen lapp

Byt:
- `GRADES.e[1]`: `() => rnd([eStaplar, () => bandQ({sers: SERS.slice(0, 5), ring: true}), eRacker])(),`
- `GRADES.e[4]`: `() => rnd([() => bandQ({sers: SERS.slice(0, 5), ring: true}), eRacker, () => bandQ({sers: SERS, six: true, flip: true}), multiQ, safeQ])()`

I `eRacker`: `after: () => S.ok ? '' : stairHTML({need, minis: true})`.

Ta bort `eSerieTol`, `dialSVG`, `rollNow`, `rulerSVG`, `ePos`, `RW`, `RY` och `RC`, och CSS-reglerna `.edial`, `.ering`, `.etick`, `.emid`, `.esub`, `.edot`, `.enum`, `.eruler`, `.eroll`, `.epdot`, `.ebar` och `.elab`, med deras keyframes (`edot`, `eunroll`, `edraw`, `efade` och `eroll`). Kontrollera med `grep -n "dialSVG\|rollNow\|rulerSVG\|ePos\b\|eroll\|edial\|eruler" index.html` att inget finns kvar. Behåll `eVals`, `eLab` och `f1`, som `linSVG` använder, och `ETOL_MIN`.

`dev.html`, byt `CATALOG.e` mot:

```js
  e: [
    r('e-vad', 0, 'Vad är E6?', 'Standardvärden som motstånd säljs i. Raden: E6 är ovanlig.', 'Flerval (text)', STD,
      'Raka linjalen: E6-värdena faller ner. Vid fel tänds 4,7 Ω, 47 Ω och 4,7 kΩ.'),
    r('e-placera-log', 0, 'Placera på skalan', 'Logaritmisk skala, sex platser på lika avstånd. 10–68 Ω, 1,0–6,8 Ω eller 1–6,8 kΩ.', 'Ordna (värden)', STD,
      'Bågar ×1,5 mellan grannarna, sedan → 100, nästa varv.'),
    r('e-placera-lador', 0, 'Placera i lådorna', 'Rak skala från 0, lådorna på värdenas riktiga platser.', 'Ordna (värden)', STD,
      'Toleransstaplarna ±20 % växer ut och når fram till varandra.'),
    r('e-glesare', 0, 'Varför glesare?', 'Varför ligger värdena glesare högre upp?', 'Flerval (text)', STD,
      'Raka linjalen: värdena faller, staplarna ±20 % växer, allt täcks. Tabell med ±2 Ω till ±13,6 Ω.'),
    r('e-tol-staplar', 1, 'Vilken tolerans är serien gjord för?', 'E6 i hälften av frågorna: ±40, ±20 eller ±10 %. Rak linjal.', 'Flerval', STD,
      'Tre rader på raka linjalen: krock i rött, kant i kant och glapp i gult. Den valda raden har en ram.'),
    r('e-band-ring', 1, 'Vilken serie hör till motståndet?', 'Toleransbandet är inringat, färgen står under.', 'Flerval', STD,
      'Trappan med ett litet motstånd per serie, och den rätta lyser.'),
    r('e-racker', 1, 'Vilken serie räcker?', 'Motstånden får avvika högst ±10 % från sitt märkta värde. Vilken serie räcker, med så få värden som möjligt?', 'Flerval', STD,
      'Trappan med motstånd och kravlinjen: för grov i rött, räcker i grönt, onödigt fin i grått.'),
    r('e-band', 2, 'Vilken serie tillhör motståndet?', 'Bara toleransbandet avgör: guld, silver, brun, röd eller tre band.', 'Flerval', STD,
      'Ringen runt toleransbandet, lappen "Guld ±5 %" och pilen till serien. Rätt knapp lyser upp.'),
    r('e-band-svar', 3, 'Vilken serie, svårare', 'Också grön, blå och violett (E192), sex band och vända motstånd.', 'Flerval', STD,
      'Vänt motstånd vänds rätt, sedan ringen, lappen och pilen. På sex band: temperaturbandet är inte tolerans.'),
    r('e-multi', 3, 'Samma siffror', '3,3 Ω finns i E6. Vilken finns inte i E6?', VSB, POP,
      'Svaren delas upp i siffror och multiplikator: tre har samma siffror (✓), det udda andra (✗).'),
    r('e-sakert', 3, 'Räcker säkert?', 'Du behöver 3,4 kΩ ±10 %. Vilken är den grövsta serien som säkert räcker? Tabell med värden.', 'Flerval', STD,
      'Tallinjen: fönstret i grönt, seriernas staplar glider in, rött där de sticker ut, den första som ryms är grön.'),
    r('e-blandat', 4, 'Allt blandat', 'Motståndet med bandet, räcker, svåra motstånd, samma siffror och räcker säkert.', 'Flerval', STD,
      'Som på respektive grad.')
  ],
```

- [ ] **Steg 4: Kör och se dem gå igenom**

Kör: `node --test tests/*.test.mjs`
Väntat: alla gröna.

- [ ] **Steg 5: Commit**

```bash
git add index.html dev.html tests
git commit -m "E-seriernas Lärling och Stormästare: motståndet med bandet inringat och trappan med motstånd. Klockan och den logaritmiska linjalen bort."
```

---

### Task 7: Kontroll i webbläsaren och publicering

- [ ] **Steg 1:** Öppna `index.html?test` i Chromium i 412 × 780 px.
- [ ] **Steg 2:** Svara fel på varje ny fråga och ta en skärmbild efter animeringen:
  - Vad är E6?
  - Placera på skalan, i alla tre varianterna
  - Placera i lådorna
  - Varför glesare?
  - Staplarfrågan med E6
  - Motståndet med bandet inringat
  - Räcker

  Kontrollera:
  - att lådorna inte överlappar
  - att etiketterna på strecken går att läsa
  - att lappen flyger röd till rätt plats och tillbaka
  - att trappan med motstånd får plats
  - att mörkt läge fungerar
- [ ] **Steg 3:** Rätta det som syns fel, med ett test först där det går, och gör en commit.
- [ ] **Steg 4:** Publicera spelet och dev.html enligt minnet om artifacter med testläge.
