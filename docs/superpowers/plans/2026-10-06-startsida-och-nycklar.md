# Startsida med ämneskort, omslag och nycklar – implementationsplan

> **För agenter:** OBLIGATORISK UNDERSKILL: använd superpowers:subagent-driven-development (rekommenderas) eller superpowers:executing-plans för att genomföra planen uppgift för uppgift. Stegen har kryssrutor (`- [ ]`) för att följa upp.

**Mål:** Spelet öppnar på en startsida med sex minikort (fem ämnen och Eldprovet) som zoomas upp till ett spelkort, med ett omslag och en snabbkoll första gången och nycklar som låser upp nästa ämne.

**Arkitektur:** Allt ligger kvar i `index.html`. Spelet får två skärmar, `S.screen = 'grid' | 'play'`. Startsidan ritas av `renderGrid()` i `#grid`. Spelkortet är `#spel`, som innehåller rubrikraden `#phead`, stapeln `#gbar` (samma komponent som i dag, nu fast i kortet) och de befintliga `#q` och `#more`. Frågelogiken (`next`, `render`, `finish`, `reveal`, `barFX`) rörs så lite som möjligt. Kartan, statusraden, nivåkortet och stapeln som glider ner tas bort.

**Teknik:** Ren HTML, CSS och JavaScript i en fil. Tester med `node --test` och jsdom (`tests/harness.mjs`, `tests/answer.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-06-startsida-och-nycklar-design.md`. Skissen `docs/superpowers/specs/2026-10-06-startsida-skiss.html` är referens för CSS, ikoner och animeringar. Läs båda innan du börjar.

## Globala krav

- Allt i `index.html`. Inga nya beroenden och inga externa resurser utöver Google Fonts.
- Nya localStorage-nycklar: `fargkoden2-keys` (nycklar som sitter i ett lås, JSON-lista med ämnen) och `fargkoden2-seen` (ämnen där snabbkollen är gjord). Andra nycklar ändras inte.
- Ordningen i rutnätet är fast: `body, ohm, tol, tc, e, ultra`.
- Tre kolumner från 720 px bredd, annars två (`@media (max-width:719px)`).
- Texter, ordagrant:
  - Knappen: **Byt ämne**
  - Omslagets etikett: **Snabbkoll**
  - Raden med nyckel: "**Tryck på {ämne}** för att vrida om nyckeln och låsa upp."
  - Raden annars: "Lär dig läsa motstånd. **Välj ett ämne.**"
  - Låsta kort, med eller utan nyckel, har ingen text om upplåsning. Ett tryck på ett låst kort utan nyckel skakar bara kortet.
  - Foten för ett öppet kort: "{Grad} · {n} av 3 rätt i rad · fortsätt", eller "Nytt · börja med en snabbkoll"
  - Foten för ett klart kort: "Klart ✓ · rekord {n} i rad" och etiketten "Spela blandat"
  - Eldprovets etikett: "Alltid öppet", eller "Pågår · fråga {i} av 20"
  - Nyckeln på spelkortet: "Mästare! Du fick nyckeln till {ämne}." och "Den flyger till låset."
- Med `prefers-reduced-motion` eller `S.instant` sker allt direkt och synkront: zoom, vändning, flygtur och upplåsning.
- Kommentarer och testnamn på svenska, i samma stil som koden runt omkring.
- Kör hela testsviten (`npm test`) innan varje commit. Alla tester ska vara gröna.

## Det som är svårast att få rätt

1. **Dubbeltryck under en animering.** Trycker man två gånger på ett kort med nyckel, eller på ett minikort medan det zoomar, ska bara ett tryck räknas. Tryck på `#grid` räknas bara när `S.screen === 'grid'`, och `unlockTile` gör inget om kortet redan vrids. Testas i uppgift 4.
2. **Byt ämne medan svaret animeras.** Minimerar man under gnistan eller förklaringen stoppas timern, och nästa öppning ger en ny fråga utan fel i konsolen. Testas i uppgift 2.
3. **Byt ämne precis efter Mästare eller guld, innan man tryckt vidare.** Nyckeln ska ändå hamna i låset och kortet bli guld. `closePlay` nollställer `S.unlockedNow` och `S.goldNow`, men nyckeln är redan utdelad i `finish`. Testas i uppgift 4.
4. **Eldprovet avbrutet för ett annat ämne.** Provet ska stå kvar på samma fråga när man kommer tillbaka. `goTopic` nollställer inte längre `S.exam`. Testas i uppgift 5.
5. **Trasig eller gammal data i localStorage.** Ogiltig JSON i `fargkoden2-keys` får inte krascha sidan, och en nyckel för ett ämne som inte är upplåsbart ignoreras. Testas i uppgift 1.

---

### Uppgift 1: Tillstånd för nycklar, snabbkoll och minikortens läge

**Filer:**
- Ändra: `index.html` (efter `const isMix = t => cleared(t);`, i `finish()` och i `applyExam()`)
- Test: `tests/keys.test.mjs` (ny)

**Gränssnitt:**
- Använder: `unlocked(t)`, `cleared(t)`, `save(k, v)`, `S.firstVisit`, `S.pin`, `TOPICS`
- Skapar:
  - `S.keys: string[]`, `S.seen: string[]`, `S.flying: string[]`, `S.arriving: string[]`, `S.streaks: {[topic]: {up, down}}`
  - `S.screen: 'grid' | 'play'`, `S.open: string | null`, `S.cover: string | null`, `S.fresh: string | null`, `S.keyWin: string | null`
  - `saveKeys(): void`, `grantKey(t: string): void`
  - `tileState(t): 'locked' | 'key' | 'open' | 'done' | 'exam'`

- [ ] **Steg 1: Skriv de nya testerna**

Skapa `tests/keys.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './harness.mjs';
import { answer } from './answer.mjs';

const ALL = ['body', 'ohm', 'tol', 'tc', 'e', 'ultra'];
const states = t => ALL.map(x => t.g(`tileState('${x}')`));

test('Första besöket: nyckeln sitter i Motståndets lås och ingen snabbkoll är gjord', () => {
  const t = load({ start: true });
  assert.deepEqual(Array.from(t.g('S.keys')), ['body']);
  assert.deepEqual(Array.from(t.g('S.seen')), []);
  assert.deepEqual(states(t), ['key', 'locked', 'locked', 'locked', 'locked', 'exam']);
});

test('Befintlig spelare: inga nycklar, och snabbkollen räknas som gjord där man har framsteg', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'ohm',
    'fargkoden2-done': JSON.stringify({ body: 5, ohm: 3 }), 'fargkoden2-grade': JSON.stringify({ ohm: 3 }) } });
  assert.deepEqual(Array.from(t.g('S.keys')), []);
  assert.deepEqual(Array.from(t.g('S.seen')).sort(), ['body', 'ohm']);
  assert.deepEqual(states(t), ['done', 'open', 'open', 'locked', 'locked', 'exam']);
});

test('Nycklar och snabbkoller sparas och läses tillbaka, och en nyckel till ett låst ämne ignoreras', () => {
  const t = load({ start: true });
  t.g("S.done.body = 3; grantKey('ohm'); S.seen.push('body'); saveKeys()");
  assert.deepEqual(Array.from(t.g('S.flying')), ['ohm'], 'nyckeln ska flyga till låset');
  const keys = t.g("localStorage.getItem('fargkoden2-keys')"), seen = t.g("localStorage.getItem('fargkoden2-seen')");
  assert.deepEqual(JSON.parse(keys), ['body', 'ohm']);
  const u = load({ start: true, storage: { 'fargkoden2-topic': 'body', 'fargkoden2-done': JSON.stringify({ body: 3 }),
    'fargkoden2-keys': JSON.stringify(['body', 'ohm', 'tc']), 'fargkoden2-seen': seen } });
  assert.deepEqual(Array.from(u.g('S.keys')), ['body', 'ohm'], 'Temperaturen är inte upplåsbar');
  assert.deepEqual(Array.from(u.g('S.seen')), ['body']);
  assert.deepEqual(Array.from(u.g('S.flying')), [], 'sparade nycklar sitter redan i låset');
});

test('grantKey: en nyckel per ämne, aldrig för Eldprovet', () => {
  const t = load({ start: true });
  t.g("grantKey('body'); grantKey('ultra'); grantKey(undefined)");
  assert.deepEqual(Array.from(t.g('S.keys')), ['body']);
  assert.deepEqual(Array.from(t.g('S.flying')), []);
});

test('Trasig data i fargkoden2-keys kraschar inte sidan', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'body', 'fargkoden2-keys': '{inte json' } });
  assert.deepEqual(t.errors.map(String), []);
  assert.deepEqual(Array.from(t.g('S.keys')), []);
});

test('Mästare i spelet delar ut nyckeln till nästa ämne och sparar den direkt', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }),
    'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  t.g('S.up = 2');
  answer(t, true);
  assert.deepEqual(Array.from(t.g('S.keys')), ['ohm']);
  assert.deepEqual(JSON.parse(t.g("localStorage.getItem('fargkoden2-keys')")), ['ohm']);
});

test('Eldprovet som låser upp två ämnen delar ut två nycklar', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'ohm', 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 1 }) } });
  t.g("S.exam = {queue: [], i: 20, done: true, score: {ohm: {ok: 3, n: 4}, tol: {ok: 4, n: 4}}}; applyExam()");
  assert.deepEqual(Array.from(t.g('S.keys')).sort(), ['tc', 'tol']);
});

test('Förhandsvisningen från dev.html har inga nycklar och ingen snabbkoll', () => {
  const t = load({ start: true, url: 'http://localhost/index.html?test=true&topic=ohm&grade=2' });
  assert.deepEqual(Array.from(t.g('S.keys')), []);
  assert.deepEqual(Array.from(t.g('S.seen')).sort(), ['body', 'e', 'ohm', 'tc', 'tol']);
});
```

- [ ] **Steg 2: Kör testerna och se dem misslyckas**

Kör: `node --test tests/keys.test.mjs`
Väntat: FAIL med `tileState is not defined` och `grantKey is not defined`. Testet med Mästare kan misslyckas med att `S.keys` är `undefined`.

- [ ] **Steg 3: Lägg till tillståndet**

Direkt efter raden `const isMix = t => cleared(t);` i `index.html`:

```js
// Nycklar som sitter i ett lås (ämnet är upplåsbart men inte öppnat) och ämnen där snabbkollen är gjord.
// En ny spelare har nyckeln i Motståndets lås. En spelare med framsteg från före nycklarna får inga nycklar,
// och snabbkollen räknas som gjord i ämnen där spelaren har framsteg.
S.keys = []; S.seen = []; S.flying = []; S.arriving = []; S.streaks = {};
S.screen = 'grid'; S.open = null; S.cover = null; S.fresh = null; S.keyWin = null;
(() => {
  if (S.pin) { S.seen = TOPICS.slice(); return; }
  try {
    const k = localStorage.getItem('fargkoden2-keys'), s = localStorage.getItem('fargkoden2-seen');
    S.keys = k != null ? JSON.parse(k).filter(t => TOPICS.includes(t) && unlocked(t)) : S.firstVisit ? ['body'] : [];
    S.seen = s != null ? JSON.parse(s).filter(t => TOPICS.includes(t)) : TOPICS.filter(t => S.done[t] > 0 || S.grade[t] > 0);
  } catch(e) { S.keys = []; S.seen = []; }
})();
const saveKeys = () => { save('fargkoden2-keys', JSON.stringify(S.keys)); save('fargkoden2-seen', JSON.stringify(S.seen)); };
// Ett ämne blir upplåsbart: nyckeln hamnar i låset och flyger dit nästa gång startsidan visas
function grantKey(t){
  if (!TOPICS.includes(t) || S.pin || S.keys.includes(t)) return;
  S.keys.push(t); S.flying.push(t); saveKeys();
}
// Minikortets läge på startsidan
const tileState = t => t === 'ultra' ? 'exam' : !unlocked(t) ? 'locked' : S.keys.includes(t) ? 'key' : cleared(t) ? 'done' : 'open';
```

Ändra raden i `finish()`:

```js
    if (nx && before < UNLOCK_AT && r.done >= UNLOCK_AT) S.unlockedNow = nx;
```

till:

```js
    if (nx && before < UNLOCK_AT && r.done >= UNLOCK_AT) { S.unlockedNow = nx; grantKey(nx); }
```

I `applyExam()`: lägg `const was = TOPICS.filter(unlocked);` direkt efter `S.exam.applied = true; S.exam.before = {...S.done};`. Lägg sedan `TOPICS.filter(t => unlocked(t) && !was.includes(t)).forEach(grantKey);` direkt före `saveProgress();` i samma funktion.

- [ ] **Steg 4: Kör testerna och se dem gå igenom**

Kör: `node --test tests/keys.test.mjs` och sedan `npm test`
Väntat: alla gröna. De gamla testerna rörs inte av den här uppgiften.

- [ ] **Steg 5: Commita**

```bash
git add index.html tests/keys.test.mjs
git commit -m "Nycklar och snabbkoll: tillstånd, sparande och minikortens läge"
```

---

### Uppgift 2: Startsidan och spelkortet

Det här är den stora omflyttningen. Kartan, statusraden, nivåkortet och stapeln som glider ner tas bort. Startsidan och spelkortet tar deras plats. Snabbkollen kommer i uppgift 3 och nycklarna i uppgift 4. I den här uppgiften gör ett tryck på ett kort med nyckel ingenting, och ett öppet ämne går direkt till spelsidan.

**Filer:**
- Ändra: `index.html` (markup i `<main>`, CSS, skriptet enligt stegen nedan)
- Ändra: `tests/harness.mjs`, `tests/model.test.mjs`, `tests/start.test.mjs`, `tests/kind.test.mjs`
- Test: `tests/screen.test.mjs` (ny)

**Gränssnitt:**
- Använder: allt från uppgift 1, `next()`, `render()`, `barDraw`, `barDrawMix`, `clearBar`, `gradeAsk`, `gradeJump`, `showExamCard`, `FIRE_SVG`, `DARE`
- Skapar:
  - `TOPIC_LOOK`, `TOPIC_ICON`, `topicIcon(t)`, `topicPattern(t, op)`, `lookVars(t)`, `CLOSE_ICON`, `PADLOCK_SVG`, `chainsSVG()`, `keySVG(color)`
  - `renderGrid()`, `renderLead()`, `tileHTML(t)`, `miniBar(t)`, `tileUp(t)`, `lockedTap(t)`
  - `showScreen()`, `updateHead()`, `openTopic(lv)`, `closePlay()`, `zoomIn(fromRect)`, `barIdle()`, `noPick(bar)`, `examIntroHTML()`
- Tar bort: `renderMap`, `MAP_BANDS`, `MAP_LOCK`, `MAP_FLAME`, `growAnim`, `updateScore`, `levelCardHTML`, `drawCard`, `cardBar`, `showLevelCard`, `kickHTML`, `kickPick` (uppgift 3 skriver en ny `kickPick`), kartans lyssnare och `S.view`

- [ ] **Steg 1: Ändra harnessen**

I `tests/harness.mjs`: byt kommentaren och raden

```js
  if (!start) w.eval("if (S.view && S.view !== 'ultra' && !S.firstVisit && S.kick) goTopic(S.view)");
```

mot:

```js
  // De flesta tester vill börja på en fråga: utan start öppnas spelkortet för ämnet man var på,
  // utan nycklar och med snabbkollen gjord. Med start står man på startsidan som en spelare gör.
  if (!start) w.eval("if (S.screen === 'grid' && S.topic !== 'ultra') { S.keys = []; S.seen = TOPICS.slice(); openTopic(S.topic) }");
```

och kommentaren ovanför `export function load` till:

```js
// Laddar spelet i jsdom. storage fylls i localStorage innan scriptet körs.
// start: sidan står kvar på startsidan. Utan start öppnas spelkortet direkt (se nedan).
```

- [ ] **Steg 2: Skriv testerna för startsidan och spelkortet**

Skapa `tests/screen.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, atGrade, golden, ALL_OPEN } from './harness.mjs';
import { answer, cont } from './answer.mjs';

const ORDER = ['body', 'ohm', 'tol', 'tc', 'e', 'ultra'];
const curGrade = t => t.$$('#gbar .gseg').indexOf(t.$('#gbar .gseg.cur'));
const open = (t, id) => t.$(`#grid [data-id="${id}"]`).click();
const SEEN = { 'fargkoden2-keys': '[]', 'fargkoden2-seen': JSON.stringify(['body', 'ohm', 'tol', 'tc', 'e']) };

test('Sidan öppnar på startsidan: sex minikort i fast ordning, spelkortet är dolt', () => {
  const t = load({ start: true });
  assert.equal(t.g('S.screen'), 'grid');
  assert.deepEqual(t.$$('#grid .tile').map(x => x.dataset.id), ORDER);
  assert.equal(t.$('#spel').hidden, true);
  assert.equal(t.$('#grid').hidden, false);
  assert.equal(t.$('#map'), null, 'ingen karta');
  assert.equal(t.$('#score'), null, 'ingen statusrad');
  assert.match(t.$('.brand').textContent, /Färgkoden/);
  assert.ok(t.$('#soundBtn'));
});

test('Minikorten: namn, rad om ämnet och läget i foten', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'ohm', 'fargkoden2-done': JSON.stringify({ body: 5, ohm: 2 }),
    'fargkoden2-grade': JSON.stringify({ ohm: 2 }), 'fargkoden2-best': JSON.stringify({ body: 7 }) } });
  const tile = id => t.$(`#grid [data-id="${id}"]`);
  assert.ok(tile('body').classList.contains('done'));
  assert.match(tile('body').textContent, /Klart ✓ · rekord 7 i rad/);
  assert.match(tile('body').textContent, /Spela blandat/);
  assert.ok(tile('ohm').classList.contains('open'));
  assert.match(tile('ohm').textContent, /Vad färgerna betyder i ohm/);
  assert.match(tile('ohm').textContent, /Gesäll · 0 av 3 rätt i rad · fortsätt/);
  assert.equal(tile('ohm').querySelectorAll('.gb .cells i.full').length, 6, 'två klarade grader i ministapeln');
  assert.ok(tile('tol').classList.contains('locked'));
  assert.ok(tile('tol').querySelector('.padlock .kh'), 'hänglås med nyckelhål');
  assert.ok(tile('tol').querySelector('.fog') && tile('tol').querySelector('.chains'));
  assert.match(tile('tol').textContent, /Toleransen/);
  assert.equal(tile('tol').querySelector('.tfoot'), null, 'ingen text om upplåsning');
  assert.match(tile('ultra').textContent, /Alltid öppet/);
  assert.ok(tile('ultra').querySelector('svg.fire'));
});

test('Ett låst kort skakar, utan text, och öppnar inget', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'ohm', 'fargkoden2-done': JSON.stringify({ body: 3 }), ...SEEN } });
  open(t, 'tol');
  const tile = t.$('#grid [data-id="tol"]');
  assert.ok(tile.classList.contains('nope'));
  assert.equal(tile.querySelector('.tfoot'), null);
  assert.equal(t.g('S.screen'), 'grid');
});

test('Ett tryck på ett öppet minikort öppnar spelkortet, Byt ämne går tillbaka', () => {
  const t = load({ start: true, storage: { ...ALL_OPEN, ...SEEN, 'fargkoden2-topic': 'tol', 'fargkoden2-grade': JSON.stringify({ tol: 1 }) } });
  open(t, 'tol');
  assert.equal(t.g('S.screen'), 'play');
  assert.equal(t.g('S.open'), 'tol');
  assert.equal(t.g('S.topic'), 'tol');
  assert.equal(t.$('#spel').hidden, false);
  assert.equal(t.$('#grid').hidden, true);
  assert.match(t.$('#phead').textContent, /Toleransen/);
  assert.ok(t.$('#spel #q').textContent.length > 0, 'en fråga');
  assert.ok(t.$('#spel #more'), 'Allt om motståndet ligger i kortet');
  const close = t.$('#closeBtn');
  assert.match(close.textContent, /Byt ämne/);
  close.click();
  assert.equal(t.g('S.screen'), 'grid');
  assert.equal(t.$('#spel').hidden, true);
  assert.equal(t.$('#grid').hidden, false);
});

test('Minimera och öppna samma ämne: samma fråga och samma antal rätt i rad', () => {
  const t = atGrade('ohm', 2);
  t.g('S.up = 2');
  const q = t.g('JSON.stringify(S.q)'), type = t.g('S.type');
  t.$('#closeBtn').click();
  open(t, 'ohm');
  assert.equal(t.g('JSON.stringify(S.q)'), q);
  assert.equal(t.g('S.type'), type);
  assert.equal(t.g('S.up'), 2);
});

test('Ett annat ämne emellan: ny fråga, men antalet i rad finns kvar per ämne', () => {
  const t = atGrade('ohm', 2);
  t.g('S.up = 2');
  t.$('#closeBtn').click(); open(t, 'tol');
  assert.equal(t.g('S.up'), 0, 'Toleransen har sitt eget');
  t.$('#closeBtn').click(); open(t, 'ohm');
  assert.equal(t.g('S.topic'), 'ohm');
  assert.equal(t.g('S.up'), 2);
  assert.equal(t.g('S.answered'), false);
});

test('Minimera efter ett svar: nästa gång kommer en ny fråga', () => {
  const t = atGrade('tol', 1);
  answer(t, false);
  t.$('#closeBtn').click(); open(t, 'tol');
  assert.equal(t.g('S.answered'), false);
});

test('Minimera medan svaret animeras: timern stoppas och nästa gång kommer en ny fråga', () => {
  const t = atGrade('tol', 1);
  t.g('S.instant = false');
  answer(t, true);
  assert.equal(t.g('S.busy'), true, 'gnistan går');
  t.$('#closeBtn').click();
  assert.equal(t.g('S.timer'), null);
  t.g('S.instant = true');
  open(t, 'tol');
  assert.equal(t.g('S.answered'), false);
  assert.deepEqual(t.errors.map(String), []);
});

test('Escape minimerar spelkortet', () => {
  const t = atGrade('tol', 1);
  t.doc.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(t.g('S.screen'), 'grid');
});

test('Stapeln sitter överst i spelkortet och visar ämnets läge', () => {
  const t = atGrade('ohm', 2);
  const bar = t.$('#spel #gbar');
  assert.ok(bar);
  assert.equal(bar.querySelectorAll('.gseg').length, 5);
  assert.equal(curGrade(t), 2);
  assert.equal(bar.querySelectorAll('.cells i.full').length, 6);
});

test('Stapeln i spelkortet: tryck på en nådd grad, Ja byter grad och ger en ny fråga där', () => {
  const t = atGrade('ohm', 2);
  t.g('S.up = 2; S.down = 1; barIdle()');
  t.g("S.played = []; ['wrong','fanfare'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  assert.deepEqual(t.$$('#gbar [data-gpick]').map(x => +x.dataset.gpick), [0, 1, 3, 4]);
  t.$('#gbar [data-gpick="1"]').click();
  assert.match(t.$('#gbar .gask').textContent, /Gå ner till Lärling\?/);
  assert.equal(t.g('S.grade.ohm'), 2, 'inget händer innan Ja');
  t.$('#gbar [data-gyes]').click();
  assert.equal(t.g('S.grade.ohm'), 1);
  assert.equal(t.g('S.up'), 0); assert.equal(t.g('S.down'), 0);
  assert.equal(t.g('S.done.ohm'), 4, 'nådda grader finns kvar');
  assert.equal(JSON.parse(t.g("localStorage.getItem('fargkoden2-grade')")).ohm, 1, 'sparas');
  assert.deepEqual(Array.from(t.g('S.played')), ['wrong']);
  assert.equal(t.g('S.answered'), false, 'en ny fråga på Lärling');
  assert.equal(curGrade(t), 1);
});

test('Stapeln i spelkortet: Nej stänger frågan, och efter ett svar går graderna inte att välja', () => {
  const t = atGrade('tol', 3);
  t.$('#gbar [data-gpick="0"]').click();
  t.$('#gbar [data-gno]').click();
  assert.equal(t.$('#gbar .gask'), null);
  assert.equal(t.g('S.grade.tol'), 3);
  answer(t, false);
  assert.equal(t.$$('#gbar [data-gpick]').length, 0);
});

test('Blandat: spelkortet säger Blandat, stapeln visar sviten och minikortet är guld', () => {
  const t = golden('tol');
  assert.match(t.$('#phead').textContent, /Blandat/);
  assert.ok(t.$('#gbar .mixrow'), 'sviten i stället för graderna');
  assert.equal(t.$$('#gbar [data-gpick]').length, 0, 'inga gradval på ett gyllene ämne');
  t.$('#closeBtn').click();
  const tile = t.$('#grid [data-id="tol"]');
  assert.ok(tile.classList.contains('done'));
  assert.match(tile.textContent, /Spela blandat/);
});

test('Eldprovets kort: tre tryck, sedan visar stapeln vilken fråga man är på', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')");
  assert.ok(t.$('#spel').classList.contains('examplay'));
  assert.ok(t.$('#dare'));
  for (let i = 0; i < 3; i++) t.$('#dare').click();
  assert.match(t.$('#gbar').textContent, /Fråga 1 av 20/);
});
```

- [ ] **Steg 3: Skriv om testerna som hänger på kartan, statusraden och nivåkortet**

Byt `goTopic('ultra')` mot `openTopic('ultra')` i alla tester:

```bash
sed -i "s/goTopic('ultra')/openTopic('ultra')/g" tests/*.test.mjs
```

I `tests/model.test.mjs`: ta bort `kick` ur importen från `./answer.mjs` och byt följande tester, hela testet från `test(` till och med `});`.

`'Spela: 3 rätt höjer graden och statusraden säger det'` blir:

```js
test('Spela: 3 rätt höjer graden och stapeln visar den nya graden', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body' } });
  for (let i = 0; i < 3; i++) { answer(t, true); cont(t); }
  assert.deepEqual(st(t, 'body'), {g: 1, done: 1});
  assert.equal(t.$$('#gbar .gseg').indexOf(t.$('#gbar .gseg.cur')), 1);
});
```

`'Från Gesäll till Mästare låser upp nästa ämne och visar dess kort'` blir:

```js
test('Från Gesäll till Mästare låser upp nästa ämne och går till startsidan', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  for (let i = 0; i < 3; i++) { answer(t, true); cont(t); }
  assert.equal(t.g("unlocked('ohm')"), true);
  assert.equal(t.g('S.screen'), 'grid');
});
```

`'Sparad progress: gamla nycklar läses inte'` blir:

```js
test('Sparad progress: gamla nycklar läses inte', () => {
  const t = load({ start: true, storage: { 'fargkoden-stars': JSON.stringify({ intro: 5, easy: 5, medium: 5, tc: 5, hard: 5 }), 'fargkoden-level': 'hard' } });
  assert.equal(t.g('S.topic'), 'body');
  assert.equal(t.g("unlocked('ohm')"), false);
  // Första besöket visar startsidan med nyckeln i Motståndet
  assert.equal(t.g('S.screen'), 'grid');
  assert.equal(t.g("tileState('body')"), 'key');
});
```

I `'Progress sparas under fargkoden2-'`: ta bort raden `kick(t);`.

`'Stapeln visas i slutet av svaret, med fack och sprickor, och glider bort'` blir:

```js
test('Stapeln i spelkortet: i slutet av svaret fylls facken, och vid fel blir graden under röd', async () => {
  const t = atGrade('ohm', 3);
  t.g('S.instant = false; S.grade.ohm = 3; S.up = 1; S.down = 0; next()');
  answer(t, true); t.g('reveal()');
  await new Promise(r => setTimeout(r, 1000));
  const bar = t.$('#spel #gbar');
  assert.equal(bar.querySelectorAll('.gseg').length, 5, 'hela skalan, fem grader');
  assert.equal(bar.querySelectorAll('.gseg.cur i.on').length, 2, 'två rätt i rad på aktuell grad');
  assert.equal(bar.querySelectorAll('.gseg.cur')[0], bar.querySelectorAll('.gseg')[3], 'Mästare är aktuell');
  assert.equal(bar.querySelectorAll('.gseg')[2].querySelectorAll('i.full').length, 3, 'Gesäll är klar, mörkgrön');
  await new Promise(r => setTimeout(r, 1500));
  assert.equal(t.g('S.answered'), false, 'nästa fråga');
  t.g('S.grade.ohm = 3; S.up = 0; S.down = 0; next()');
  answer(t, false); t.g('reveal()');
  const lock = t.g('S.lockUntil - S.revealAt');
  assert.ok(lock >= 1200, `låst i ${lock} ms`);
  await new Promise(r => setTimeout(r, lock - 200));
  assert.equal(bar.querySelectorAll('.gseg')[2].querySelectorAll('i.bad').length, 1, 'ett rött fack på graden under');
  assert.ok(bar.querySelectorAll('.gseg')[2].querySelectorAll('i')[2].classList.contains('bad'), 'rött från höger');
  assert.equal(bar.querySelectorAll('.gseg.cur i.bad').length, 0, 'aktuell grad har inga röda');
  t.g('stopTimer(); clearBar()');
});
```

`'Gyllene: tre rätt på Stormästare gör ämnet klart, och sedan visas ämnets kort'` blir:

```js
test('Gyllene: tre rätt på Stormästare gör ämnet klart, kortet minimeras och minikortet blir guld', () => {
  const t = atGrade('body', 4);
  t.g('S.grade.body = 4; S.up = 2; S.done.body = 4; next()');
  answer(t, true);
  assert.equal(t.g('S.done.body'), 5);
  assert.equal(t.g('S.barPlan.moved'), 'top');
  cont(t);
  assert.equal(t.g('S.screen'), 'grid');
  assert.ok(t.$('#grid [data-id="body"]').classList.contains('done'));
});
```

Ta bort följande tester helt. Testerna i `screen.test.mjs` ersätter dem:

- `'Blandat: statusraden, kartan och kortet'`
- `'Kartan: banden fylls efter klarade grader, låsta har lås, klara har ✓'`
- `'Nivåkortet: inga gradprickar, graden väljs i stapeln och spelet börjar där'`

`'Fel tre gånger i rad tar ner en grad och statusraden säger det'` blir:

```js
test('Fel tre gånger i rad tar ner en grad och stapeln visar det', () => {
  const t = atGrade('ohm', 2);
  for (let i = 0; i < 3; i++) { t.g('next()'); answer(t, false); }
  assert.equal(t.g('S.grade.ohm'), 1);
  t.g('next()');
  assert.equal(t.$$('#gbar .gseg').indexOf(t.$('#gbar .gseg.cur')), 1);
});
```

I `tests/kind.test.mjs`: ta bort testet `'Kortet: startkortet har ingen typfärg'`. Det kommer tillbaka för omslaget i uppgift 3.

`tests/start.test.mjs`: ersätt hela filen med:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, ALL_OPEN } from './harness.mjs';
import { answer, dare } from './answer.mjs';

test('Eldprovet: VÅGAR DU, KAN DU TILLRÄCKLIGT, sedan rasar kortet och provet börjar', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("S.played = []; ['glass','crack'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.g("openTopic('ultra')");
  assert.ok(t.$('#dare svg'), 'en bild');
  assert.match(t.$('#dare').textContent, /VÅGAR DU\?\?\?/);
  t.$('#dare').click();
  assert.match(t.$('#dare').textContent, /KAN DU TILLRÄCKLIGT\?/);
  assert.equal(t.g('S.exam'), null);
  t.$('#dare').click();
  assert.match(t.$('#dare').textContent, /INGEN NÅD/);
  t.$('#dare').click();
  assert.ok(t.g('S.exam && !S.exam.done'), 'provet har börjat');
  assert.notEqual(t.g('S.type'), 'exam');
  assert.deepEqual(Array.from(t.g('S.played')), ['crack', 'crack', 'glass']);
});

test('Eldprovet: mitt i ett prov fortsätter man utan ritual', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')"); dare(t);
  answer(t, true);
  const i = t.g('S.exam.i');
  t.$('#closeBtn').click();
  t.$('#grid [data-id="ultra"]').click();
  assert.equal(t.$('#dare'), null);
  assert.equal(t.g('S.exam.i'), i);
  assert.equal(t.g('S.answered'), false);
});

test('Förhandsvisningen från dev.html går direkt till spelkortet', () => {
  const t = load({ start: true, url: 'http://localhost/index.html?test=true&topic=ohm&grade=2' });
  assert.equal(t.g('S.screen'), 'play');
  assert.equal(t.g('S.open'), 'ohm');
  assert.ok(['point', 'order'].includes(t.g('S.type')));
  t.$('#closeBtn').click();
  assert.equal(t.g('S.screen'), 'grid');
});

test('Testraden: Dölj rätt svar tar bort pilarna, Visa rätt svar tar tillbaka dem, och valet sparas', () => {
  const t = load({ url: 'http://localhost/index.html?test=true&topic=tol&grade=3' });
  const btn = t.$('#tCheat');
  assert.ok(btn, 'knappen finns');
  assert.equal(btn.textContent, 'Dölj rätt svar');
  assert.ok(t.$('#q .cheat'), 'pilen syns från början');
  btn.click();
  assert.equal(t.$('#q .cheat'), null);
  assert.equal(btn.textContent, 'Visa rätt svar');
  t.g('next()');
  assert.equal(t.$('#q .cheat'), null, 'gäller nästa fråga också');
  btn.click();
  assert.ok(t.$('#q .cheat'));
  const u = load({ url: 'http://localhost/index.html?test=true', storage: { 'fargkoden2-cheat': 'off' } });
  assert.equal(u.$('#tCheat').textContent, 'Visa rätt svar');
  assert.equal(u.$('#q .cheat'), null);
});
```

- [ ] **Steg 4: Kör testerna och se dem misslyckas**

Kör: `npm test`
Väntat: FAIL i `screen.test.mjs` (`#grid` saknas, `openTopic is not defined`) och i de omskrivna testerna.

- [ ] **Steg 5: Byt markup i `<main>`**

Ersätt allt från `<header class="top">` till och med `<section class="more" id="more" aria-label="Allt om motståndet" hidden></section>`, och ta bort `<div class="gbar" id="gbar" aria-hidden="true"></div>` efter `</main>`:

```html
  <header class="top">
    <div class="toprow">
      <h1 class="brand"><span class="brandbands" aria-hidden="true"><b style="background:#7a4a21"></b><b style="background:#c62828"></b><b style="background:#ef7d1a"></b><b style="background:#f2d024"></b><b style="background:#2e8b3d"></b></span>Färgkoden</h1>
      <button class="soundbtn" id="soundBtn" aria-pressed="true" aria-label="Ljud på"></button>
    </div>
  </header>
  <p class="lead" id="lead"></p>
  <div class="grid" id="grid"></div>
  <!-- Spelkortet: ett minikort som zoomats upp. Rubrikraden, stapeln och frågan. -->
  <section class="play" id="spel" hidden>
    <span class="tpat" aria-hidden="true"></span>
    <div class="phead" id="phead"></div>
    <div class="gbar" id="gbar" aria-hidden="true"></div>
    <div class="pbody">
      <section class="card" id="q" aria-live="polite"></section>
      <section class="more" id="more" aria-label="Allt om motståndet" hidden></section>
    </div>
  </section>
```

- [ ] **Steg 6: CSS**

1. I `:root` lägger du till `--display:"Barlow Condensed","Arial Narrow",sans-serif;--text:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif;--fog:rgba(214,222,228,.92);--fresh:#8fe25f;--ripe:#2a9b48;`. I båda mörka blocken lägger du till `--fog:rgba(38,50,60,.92);`.
2. `main{max-width:720px;...}` blir `max-width:1000px`.
3. Ta bort reglerna för `.map`, `.map *`, `.score`, `.score>b`, `.pips`, `.lvcard`, `.lvbtns`, `.card.startcard`, `.startflag` (med `@keyframes flagin`), `.goldcard`, `.fresh`, `.fresh.gold`, `.kickwhy`, `.kickq`, `.kickopts` och `.kopt*`. `.kick*` och `.kopt*` kommer tillbaka i uppgift 3. Behåll `.firecard`, `.dare`, `.daretxt`, `.cracks`, `.fire .f1/.f2/.f3`, `.shatter` och `.card.bosscard`.
4. Byt `.gbar{position:fixed;...}` och `.gbar.show{...}` mot:

```css
/* Stapeln sitter överst i spelkortet */
.gbar{position:relative;max-width:720px;margin:0 auto;padding:12px 16px 4px;pointer-events:none}
#gbar .gname{display:none}
.examprog{font-family:var(--display);font-size:1.3rem;text-align:center}
```

   Byt `@keyframes bshake` och `@keyframes bquake` mot versioner utan `-50%`:

```css
  @keyframes bshake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}
  @keyframes bquake{0%,100%{transform:none}10%{transform:translate(-10px,3px) rotate(-2deg)}20%{transform:translate(9px,-3px) rotate(2deg)}30%{transform:translate(-8px,2px) rotate(-1.5deg)}40%{transform:translate(7px,-2px) rotate(1.5deg)}50%{transform:translate(-6px,2px) rotate(-1deg)}60%{transform:translate(5px,-1px)}70%{transform:translate(-4px,1px)}80%{transform:translate(3px,0)}90%{transform:translate(-2px,0)}}
```

5. Kopiera från `docs/superpowers/specs/2026-10-06-startsida-skiss.html` dessa block i sin helhet: `.lead` (inte `.m2 .lead`), `.grid`, blocket `/* Minikorten */` (`.tile` till `.chip`), blocket `/* Stapeln ... */` (bara `.gb`, `.gb .cells`, `.gb i`, `.gb i.on`, `.gb i.full`, `.gb .cur .cells`), blocket `/* Låst ... */` (utom `.tile.over`), blocket `/* Nytt ämne ... */`, blocket `/* Klarat: guld */` och blocket `/* Eldprovet */` till och med `.m1 .fire`. Gör sedan de här ändringarna i det du kopierat:
   - Byt namn på `.chip` till `.tchip` överallt i de kopierade reglerna. Spelet har redan en `.chip`.
   - Byt `.fire{position:absolute;...}` mot `.tile .fire{position:absolute;...}`. Kopiera inte `.fire .f1/.f2/.f3`, de finns redan.
   - Ta bort alla regler som börjar med `.m1 `. Samla alla regler som börjar med `.m2 ` i ett block `@media (max-width:719px){...}` där `.m2 ` är borttaget, plus `.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}`.
   - Lägg till `.gb .gs{display:block}` och `.gb .cells{display:grid}`, eftersom minikortet är en knapp och delarna är `span`.
6. Kopiera blocket `/* Spelkortet: ämnet förstorat */` (`.play` till `.min svg`) och gör tre ändringar: i `.play{container-type:inline-size;position:absolute;...}` byts `position:absolute;z-index:20;` mot `position:relative;margin-top:4px;` (behåll `container-type:inline-size`, omslagets storlekar räknas efter kortet), `.min` blir `.closebtn`, och `.min svg` blir `.closebtn svg`. Lägg till:

```css
.play .pbody{position:relative;max-width:720px;margin:0 auto;padding:12px 16px 20px}
.play.examplay{border:0;color:#ffe8d2;background:radial-gradient(120% 90% at 50% 110%,#ff9a3c,#d9381e 45%,#2a1712 85%)}
.examplay .phead{background:rgba(0,0,0,.3);color:#ffe8d2}
.play.goldplay{border-color:#b8860b}
.goldplay .phead{background:linear-gradient(120deg,#e8b923,#b8860b);color:#3a2a00}
@media (prefers-reduced-motion:no-preference){.tile.nope{animation:nope .4s ease-in-out}@keyframes nope{25%{transform:translateX(-7px)}50%{transform:translateX(6px)}75%{transform:translateX(-3px)}}}
```

- [ ] **Steg 7: Utseende, ikoner och mönster**

Ta bort `MAP_BANDS`, `MAP_LOCK`, `MAP_FLAME`, `growAnim` och `renderMap` (hela funktionen). Lägg till direkt efter `TOPIC_LINE`:

```js
// Ämnenas färger: ram och fält (c) och text på fältet (ci)
const TOPIC_LOOK = {
  body:{c:'#7a4a21', ci:'#fff'}, ohm:{c:'#c62828', ci:'#fff'}, tol:{c:'#ef7d1a', ci:'#2a1400'},
  tc:{c:'#f2d024', ci:'#2a2200'}, e:{c:'#2e8b3d', ci:'#fff'}, ultra:{c:'#d9381e', ci:'#fff'}
};
```

Byt värdena i `TOPIC_LINE` mot specens rader och lägg till Eldprovet:

```js
const TOPIC_LINE = {
  body:'Hur ett motstånd ser ut: hur många band, vilka färger och åt vilket håll man läser.',
  ohm:'Vad färgerna betyder i ohm: siffror, multiplikator och hela värdet.',
  tol:'Hur mycket värdet får avvika: guld, silver och de andra toleransfärgerna.',
  tc:'Det sjätte bandet: hur mycket värdet ändras när det blir varmt.',
  e:'Standardvärdena som motstånd säljs i: E6, E12, E24 och resten.',
  ultra:'20 frågor från alla ämnen. Gör det när du vill. Klarar du ett ämne här låses det upp.'
};
```

Kopiera från skissen och byt namn:

- objektet `I` blir `TOPIC_ICON`, där nyckeln `exam` blir `ultra` och nyckeln `min` tas bort.
- `icon(k)` blir `topicIcon(k)`.
- `pat(k, color, op)` blir `topicPattern(k, op = .13)`, och färgen hämtas från `TOPIC_LOOK[k].c`.
- `chains()` blir `chainsSVG()`.
- `PADLOCK` blir `PADLOCK_SVG`.
- `KEY(c)` blir `keySVG(c)`.

Lägg till:

```js
const lookVars = t => `--c:${TOPIC_LOOK[t].c};--ci:${TOPIC_LOOK[t].ci}` + (t === 'ultra' ? '' : `;--pat:${topicPattern(t)}`);
// Byt ämne: sex små rutor, som rutnätet man kommer tillbaka till
const CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="currentColor"><rect x="3" y="4" width="5" height="7" rx="1.2"/><rect x="9.5" y="4" width="5" height="7" rx="1.2"/><rect x="16" y="4" width="5" height="7" rx="1.2"/><rect x="3" y="13" width="5" height="7" rx="1.2"/><rect x="9.5" y="13" width="5" height="7" rx="1.2"/><rect x="16" y="13" width="5" height="7" rx="1.2"/></g></svg>';
```

- [ ] **Steg 8: Startsidan**

Ta bort `levelCardHTML`, `drawCard`, `cardBar`, `showLevelCard`, `kickHTML` och `kickPick`. `KICK`, `pic`, `CHICKEN`, `CAR`, `ANCHOR` och `animHTML` behålls för uppgift 3. Flytta Eldprovets del av `levelCardHTML` till en egen funktion:

```js
// Eldprovets första sida: elden och tre tryck
function examIntroHTML(){
  S.dare = 0;
  return `<div class="lvcard firecard"><button class="dare" id="dare" aria-label="Starta eldprovet: ${DARE[0]}">${FIRE_SVG}<svg class="cracks" aria-hidden="true"></svg><span class="daretxt">${DARE[0]}</span></button>
    <p class="rule">20 frågor, fyra från varje ämne, i svåraste varianten. 3 av 4 i ett ämne ger Mästare, 4 av 4 klarar ämnet. Provet kan bara höja.</p></div>`;
}
```

I `showExamCard()`: `h = levelCardHTML('ultra');` blir `h = examIntroHTML();`. Ta bort `updateScore();` och lägg till `barIdle();` sist i funktionen.

Lägg till efter `examIntroHTML`:

```js
// Startsidan: sex minikort i fast ordning och en rad om vad man ska göra
const tileUp = t => t === S.topic ? S.up : (S.streaks[t] || {up: 0}).up;
function miniBar(t){
  const g = S.grade[t], up = tileUp(t);
  return `<span class="gb" aria-hidden="true">${GRADE_NAME.map((_, i) => `<span class="gs${i === g ? ' cur' : ''}"><span class="cells">${[0, 1, 2].map(j =>
    `<i class="${i < g ? 'full' : i === g && j < up ? 'on' : ''}"></i>`).join('')}</span></span>`).join('')}</span>`;
}
function tileHTML(t){
  if (t === 'ultra') {
    const going = S.exam && !S.exam.done;
    return `<button class="tile exam${S.fresh === t ? ' fresh' : ''}" data-id="ultra" style="${lookVars(t)}">
      <span class="thead"><span class="ticon">${topicIcon('ultra')}</span><span class="tname">Eldprovet</span></span>
      <span class="tline">${TOPIC_LINE.ultra}</span>
      <span class="tfoot"><span class="tchip">${going ? `Pågår · fråga ${Math.min(S.exam.i + 1, EXAM_N)} av ${EXAM_N}` : 'Alltid öppet'}</span></span>${FIRE_SVG}</button>`;
  }
  const state = tileState(t), fresh = S.fresh === t ? ' fresh' : '';
  const head = `<span class="tpat"></span><span class="thead"><span class="ticon">${topicIcon(t)}</span><span class="tname">${topicName(t)}</span></span><span class="tline">${TOPIC_LINE[t]}</span>`;
  if (state === 'done') return `<button class="tile done${fresh}" data-id="${t}" style="${lookVars(t)}">${head}
    <span class="tfoot"><span class="tstate">Klart ✓ · rekord ${S.mix.best[t] || 0} i rad</span><span class="tchip">Spela blandat</span></span></button>`;
  if (state === 'open') return `<button class="tile open${fresh}" data-id="${t}" style="${lookVars(t)}">${head}
    <span class="tfoot">${miniBar(t)}<span class="tstate">${S.seen.includes(t) ? `${GRADE_NAME[S.grade[t]]} · ${tileUp(t)} av 3 rätt i rad · fortsätt` : 'Nytt · börja med en snabbkoll'}</span></span>
    ${fresh ? '<span class="newflag">Nytt!</span>' : ''}</button>`;
  // Låst, med eller utan nyckel i låset. Ingen text om upplåsning: låset och nyckeln säger det själva.
  const key = state === 'key', flying = S.flying.includes(t) || S.arriving.includes(t);
  return `<button class="tile locked${key ? ' haskey' : ''}" data-id="${t}" style="${lookVars(t)}" aria-label="${topicName(t)}: ${key ? 'tryck för att vrida om nyckeln' : 'låst'}">${head}
    <span class="fog"></span>${chainsSVG()}${PADLOCK_SVG}${key ? `<span class="inkey${flying ? ' arriving' : ''}">${keySVG(TOPIC_LOOK[t].c)}</span>` : ''}</button>`;
}
function renderLead(){
  const k = S.keys.find(t => !S.flying.includes(t) && !S.arriving.includes(t));
  document.getElementById('lead').innerHTML = k ? `<b>Tryck på ${topicName(k)}</b> för att vrida om nyckeln och låsa upp.`
    : 'Lär dig läsa motstånd. <b>Välj ett ämne.</b>';
}
function renderGrid(){
  document.getElementById('grid').innerHTML = ORDER.map(tileHTML).join('');
  renderLead();
}
// Låst ämne utan nyckel: kortet skakar
function lockedTap(t){
  const tile = document.querySelector(`#grid [data-id="${t}"]`);
  tile.classList.remove('nope'); void tile.offsetWidth; tile.classList.add('nope');
}
document.getElementById('grid').addEventListener('click', e => {
  const tile = e.target.closest('.tile');
  if (!tile || S.screen !== 'grid') return;
  const t = tile.dataset.id, state = tileState(t);
  if (state === 'locked') { lockedTap(t); return; }
  if (state === 'key') return;
  openTopic(t);
});
```

`ORDER` finns redan och är `[...TOPICS, 'ultra']`.

- [ ] **Steg 9: Spelkortet: öppna, minimera, rubrikraden och stapeln**

Lägg till efter grid-lyssnaren:

```js
// Spelkortet. Ett minikort zoomas upp hit och krymper tillbaka med Byt ämne.
function showScreen(){
  const play = S.screen === 'play', lv = S.open, el = document.getElementById('spel');
  document.getElementById('grid').hidden = play;
  document.getElementById('lead').hidden = play;
  el.hidden = !play;
  if (!play) return;
  el.className = 'play' + (lv === 'ultra' ? ' examplay' : cleared(lv) ? ' goldplay' : '') + (S.cover ? ' cover' : '');
  el.setAttribute('style', lookVars(lv));
  el.setAttribute('aria-label', topicName(lv));
  document.getElementById('phead').hidden = !!S.cover;
  document.getElementById('gbar').hidden = !!S.cover;
}
// Rubrikraden: ämnets ikon och namn, och Byt ämne
function updateHead(){
  const lv = S.open;
  if (!lv) return;
  const mode = lv !== 'ultra' && isMix(lv) ? '<span class="pmode">· Blandat</span>' : '';
  document.getElementById('phead').innerHTML = `<span class="ticon">${topicIcon(lv)}</span><span class="pname">${topicName(lv)}</span>${mode}
    <button class="closebtn" id="closeBtn" aria-label="Byt ämne">${CLOSE_ICON}<span>Byt ämne</span></button>`;
}
document.getElementById('phead').addEventListener('click', e => { if (e.target.closest('#closeBtn')) closePlay(); });
// Kortet växer från minikortets ruta till sin plats
function zoomIn(from){
  const el = document.getElementById('spel'), to = el.getBoundingClientRect();
  if (S.instant || reduceMotion() || !el.animate || !to.width) return;
  sfx.whoosh();
  el.animate([{transformOrigin: '0 0', transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height})`},
    {transformOrigin: '0 0', transform: 'none'}], {duration: 450, easing: 'cubic-bezier(.2,.8,.2,1)'});
  [...el.children].forEach(c => c.animate([{opacity: 0}, {opacity: 1}], {duration: 300, delay: 180, fill: 'backwards'}));
}
function openTopic(lv){
  if (S.screen === 'play' && S.open === lv) return;
  const tile = S.screen === 'grid' && document.querySelector(`#grid [data-id="${lv}"]`), from = tile ? tile.getBoundingClientRect() : null;
  if (S.fresh === lv) S.fresh = null;
  S.screen = 'play'; S.open = lv; S.keyWin = null;
  showScreen(); updateHead();
  goTopic(lv);
  if (from) zoomIn(from);
  document.getElementById('closeBtn')?.focus({preventScroll: true});
}
// Byt ämne: kortet krymper tillbaka till sin ruta. Ett besvarat svar räknas som klart, så nästa gång kommer en ny fråga.
// Eldprovets frågor räknas redan när man svarar, så provet fortsätter på nästa fråga.
function closePlay(){
  if (S.screen !== 'play') return;
  const lv = S.open, el = document.getElementById('spel'), from = el.getBoundingClientRect();
  stopTimer(); clearBar();
  if (S.answered && S.type !== 'exam') S.plan = null;
  S.keyWin = null; S.cover = null; S.busy = false; S.unlockedNow = null; S.goldNow = null;
  S.screen = 'grid'; S.open = null;
  renderGrid();
  const tile = document.querySelector(`#grid [data-id="${lv}"]`);
  const done = () => { showScreen(); tile?.focus({preventScroll: true}); };
  if (S.instant || reduceMotion() || !el.animate || !from.width || !tile) { done(); return; }
  document.getElementById('grid').hidden = false; document.getElementById('lead').hidden = false;
  Object.assign(el.style, {position: 'fixed', left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px', zIndex: 40, margin: 0});
  const to = tile.getBoundingClientRect();
  sfx.whoosh();
  [...el.children].forEach(c => c.animate([{opacity: 1}, {opacity: 0}], {duration: 160, fill: 'forwards'}));
  el.animate([{transformOrigin: '0 0', transform: 'none'},
    {transformOrigin: '0 0', transform: `translate(${to.left - from.left}px,${to.top - from.top}px) scale(${to.width / from.width},${to.height / from.height})`}],
    {duration: 420, easing: 'cubic-bezier(.5,0,.2,1)'}).onfinish = () => {
      el.getAnimations({subtree: true}).forEach(a => a.cancel());
      done();
    };
}
// Stapeln när ingen fråga är besvarad: ämnets läge, sviten i blandat, frågans nummer i Eldprovet.
// Nådda grader går att välja, utom den man står på.
const noPick = b => {
  b.classList.remove('pick'); b.querySelector('.gask')?.remove();
  b.querySelectorAll('[data-gpick]').forEach(x => { x.removeAttribute('data-gpick'); x.removeAttribute('role'); x.removeAttribute('tabindex'); x.removeAttribute('aria-label'); });
};
function barIdle(){
  const b = document.getElementById('gbar'), lv = S.open;
  clearBar();
  if (!lv) return;
  if (lv === 'ultra') { b.innerHTML = S.exam && !S.exam.done ? `<div class="examprog">Fråga <b>${Math.min(S.exam.i + 1, EXAM_N)}</b> av <b>${EXAM_N}</b></div>` : ''; return; }
  if (isMix(lv)) { barDrawMix(lv, S.mix.streak, S.mix.best[lv] || 0, false); b.className = 'gbar goldbar'; return; }
  barDraw({g: S.grade[lv], up: S.up, down: S.down, done: S.done[lv]}, lv);
  if (S.answered || S.pin || lv !== S.topic) return;
  b.classList.add('pick');
  const top = Math.min(S.done[lv], MAX);
  b.querySelectorAll('.gseg').forEach((el, g) => {
    if (g > top || g === S.grade[lv]) return;
    el.dataset.gpick = g; el.setAttribute('role', 'button'); el.tabIndex = 0;
    el.setAttribute('aria-label', `${g < S.grade[lv] ? 'Gå ner' : 'Gå upp'} till ${GRADE_NAME[g]}`);
  });
}
```

I `clearBar()` byter du raderna som tar bort `.gask` och `[data-gpick]` mot `noPick(b);`. Flytta `noPick` ovanför `clearBar` om det behövs, så att den är definierad när den används.

- [ ] **Steg 10: Koppla in resten**

1. **`goTopic(lv)`** ersätts helt med:

```js
function goTopic(lv){
  S.kick = null; clearBar();
  if (lv === S.topic && S.plan && S.type !== 'exam') { render(); return; }
  if (lv !== S.topic) {
    // Antalet rätt eller fel i rad sparas per ämne, så att man inte tappar dem när man byter
    S.streaks[S.topic] = {up: S.up, down: S.down};
    const s = S.streaks[lv] || {up: 0, down: 0};
    S.up = s.up; S.down = s.down; S.mix.streak = 0; S.lastMore = ''; S.topic = lv; save('fargkoden2-topic', lv);
  }
  S.moved = null;
  next();
}
```

2. **`advance()`**: `showLevelCard(lv, 'gold')` och `showLevelCard(lv, true)` ersätts så att funktionen blir:

```js
function advance(){
  stopTimer();
  if (S.goldNow) { S.goldNow = null; closePlay(); }
  else if (S.unlockedNow) { S.unlockedNow = null; closePlay(); }
  else next();
}
```

3. **`render()`**:
   - Ta bort `updateScore();` först i funktionen.
   - Lägg till sist i funktionen: `if (!S.answered) barIdle(); else noPick(document.getElementById('gbar'));`.
4. **`next()`**: ta bort `S.view = null;`.
5. **`finish()` och `reveal()`**: ta bort allt som har med `S.mapGrow` att göra.
6. **`updateScore`**: ta bort funktionen och alla anrop till den. De finns i `render`, `showExamCard`, `gradeJump` och `tGive`. I `tGive` blir anropet `renderGrid();`.
7. **Stapelns gradval**:
   - I `gradeAsk` byts `S.view` mot `S.open`.
   - I `gradeJump` byts `if (S.instant || reduceMotion()) { cardBar(lv); return; }` mot `if (S.instant || reduceMotion()) { next(); return; }`.
   - Sista raden i `gradeJump`, `later(..., () => { if (S.view === lv) cardBar(lv); });`, blir `later(.25 + steps * 1.15 * sc + .4, () => { if (S.open === lv) next(); });`.
   - `b.className = 'gbar show';` i `gradeJump` blir `b.className = 'gbar';`.
   - I `gbarEl.addEventListener('click', ...)` byts den första raden mot `if (S.screen !== 'play' || S.open !== S.topic || S.open === 'ultra' || S.answered || S.busy) return;`, och övriga `S.view` byts mot `S.open`.
8. **`#q`-lyssnaren**:
   - `if (S.answered && !S.view && S.type !== 'exam')` blir `if (S.answered && !S.cover && S.type !== 'exam')`. Ett svar från ett annat ämne får inte göra att ett tryck på omslaget hoppar vidare.
   - Ta bort grenarna för `btn.dataset.kick`, `btn.id === 'play' || btn.classList.contains('go')` och `btn.id === 'stay'`.
9. **Tangentlyssnaren på `document`**:
   - Lägg först i lyssnaren: `if (e.key === 'Escape' && S.screen === 'play') { closePlay(); return; }`.
   - `const typing = !S.view && ...` blir `const typing = S.screen === 'play' && !S.cover && ...`.
   - `if (S.view) return;` blir `if (S.screen !== 'play' || S.cover) return;`.
10. **Kartan**: ta bort `mapEl` och dess två lyssnare.
11. **`cheatBtn`-lyssnaren**: `if (S.view) drawCard(S.view, S.fresh); else if (S.plan && S.type !== 'exam') render();` blir `if (S.plan && S.type !== 'exam') render();`.
12. **`tReset`**: `next();` blir `if (S.screen === 'play') closePlay(); renderGrid();`.
13. **Sist i skriptet**: byt `next();` och raden med `showLevelCard` mot:

```js
renderGrid();
// Förhandsvisningen från dev.html går direkt till spelkortet
if (S.pin) openTopic(S.pin.topic);
```

14. Sök efter `S.view`, `showLevelCard`, `drawCard`, `cardBar`, `updateScore`, `renderMap` och `kickPick`. Inga träffar ska finnas kvar:
   `grep -n "S\.view\|showLevelCard\|drawCard\|cardBar\|updateScore\|renderMap\|kickPick" index.html`

- [ ] **Steg 11: Kör testerna och se dem gå igenom**

Kör: `npm test`
Väntat: alla gröna. Om ett test som inte nämns här misslyckas: titta efter `S.view`, `#score` eller `#map` i testet och skriv om det på samma sätt som ovan. Ändra aldrig själva frågelogiken för att få ett test grönt.

- [ ] **Steg 12: Titta på sidan**

Öppna `index.html` i en webbläsare (`python3 -m http.server` i repot, sedan http://localhost:8000/). Kontrollera:
- Rutnätet har 3×2 på datorbredd och 2×3 på 390 px.
- Ett minikort zoomar till spelkortet, och Byt ämne krymper tillbaka.
- Stapeln sitter i kortet och animeras efter svar.
- Ljust och mörkt tema fungerar båda.

- [ ] **Steg 13: Commita**

```bash
git add index.html tests/
git commit -m "Startsidan med minikort och spelkortet som zoomas upp, i stället för karta, statusrad och nivåkort"
```

---

### Uppgift 3: Omslaget och snabbkollen

**Filer:**
- Ändra: `index.html` (`openTopic`, nya `drawCover`, `coverHTML`, `kickPick`, `flipCard`, `#q`-lyssnaren, CSS)
- Test: `tests/cover.test.mjs` (ny)

**Gränssnitt:**
- Använder: `KICK`, `animHTML(lv)`, `S.seen`, `saveKeys()`, `showScreen()`, `updateHead()`, `goTopic()`, `closePlay()`
- Skapar: `drawCover(lv)`, `coverHTML(lv)`, `kickPick(btn)`, `flipCard(fn)`, `SPARK_ICON`. Omslagets stängknapp har `id="coverClose"`. Valen har `data-kick` som tidigare, så hjälpfunktionen `kick(t, correct)` i `tests/answer.mjs` fungerar som den är.

- [ ] **Steg 1: Skriv testerna**

Skapa `tests/cover.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load, ALL_OPEN } from './harness.mjs';
import { kick } from './answer.mjs';

// Allt öppet, inga nycklar och ingen snabbkoll gjord
const fresh = (extra = {}) => load({ start: true, storage: { ...ALL_OPEN, 'fargkoden2-topic': 'body', 'fargkoden2-keys': '[]', 'fargkoden2-seen': '[]', ...extra } });
const open = (t, id) => t.$(`#grid [data-id="${id}"]`).click();

test('Omslaget: första gången visas ämnets animering, namn, rad och Snabbkoll', () => {
  const t = fresh();
  open(t, 'ohm');
  assert.equal(t.g('S.cover'), 'ohm');
  assert.ok(t.$('#spel').classList.contains('cover'));
  assert.equal(t.$('#phead').hidden, true, 'ingen rubrikrad');
  assert.equal(t.$('#gbar').hidden, true, 'ingen stapel');
  assert.match(t.$('#q .eyebrow').textContent, /Ämne 2 av 5/);
  assert.ok(t.$('#q svg.anim'), 'ämnets animering');
  assert.match(t.$('#q .cname').textContent, /Resistansen/);
  assert.match(t.$('#q .cline').textContent, /Vad färgerna betyder i ohm/);
  assert.match(t.$('#q .ulab').textContent, /Snabbkoll/);
  assert.doesNotMatch(t.$('#q').textContent, /Lås upp/);
  assert.match(t.$('#q .kickq').textContent, /enhet/);
  assert.equal(t.$$('#q [data-kick]').length, 4);
  assert.equal([...t.$('#q').classList].filter(c => c.startsWith('kind-')).length, 0, 'ingen typfärg');
});

test('Snabbkoll: fel svar blir rött och går inte att välja igen, och inget räknas', () => {
  const t = fresh();
  open(t, 'ohm');
  const before = t.g('JSON.stringify([S.grade, S.done, S.up, S.down])');
  t.g("S.played = []; ['wrong','right'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  kick(t, false);
  const bad = t.$('#q [data-kick].bad');
  assert.ok(bad, 'valet blir rött');
  assert.equal(bad.getAttribute('aria-disabled'), 'true');
  assert.equal(t.g('S.cover'), 'ohm', 'omslaget står kvar');
  assert.equal(t.g('JSON.stringify([S.grade, S.done, S.up, S.down])'), before);
  kick(t, true);
  assert.equal(t.g('S.cover'), null);
  assert.deepEqual(Array.from(t.g('S.played')), ['wrong', 'right']);
  assert.equal(t.g('S.topic'), 'ohm');
  assert.equal(t.g('S.answered'), false, 'första riktiga frågan väntar');
  assert.equal(t.$('#phead').hidden, false);
  assert.ok(!t.$('#spel').classList.contains('cover'));
});

test('Snabbkoll: bara en gång, även efter omladdning', () => {
  const t = fresh();
  open(t, 'ohm'); kick(t, true);
  t.$('#closeBtn').click(); open(t, 'ohm');
  assert.equal(t.g('S.cover'), null);
  const u = fresh({ 'fargkoden2-seen': t.g("localStorage.getItem('fargkoden2-seen')") });
  open(u, 'ohm');
  assert.equal(u.g('S.cover'), null);
});

test('Omslaget: Byt ämne och Escape avbryter, och snabbkollen väntar kvar', () => {
  const t = fresh();
  open(t, 'tc');
  t.$('#coverClose').click();
  assert.equal(t.g('S.screen'), 'grid');
  assert.match(t.$('#grid [data-id="tc"]').textContent, /Nytt · börja med en snabbkoll/);
  open(t, 'tc');
  assert.equal(t.g('S.cover'), 'tc');
  t.doc.dispatchEvent(new t.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(t.g('S.screen'), 'grid');
});

test('Omslaget: ett klart ämne och Eldprovet har inget omslag', () => {
  const t = load({ start: true, storage: { 'fargkoden2-topic': 'body', 'fargkoden2-done': JSON.stringify({ body: 5 }), 'fargkoden2-keys': '[]', 'fargkoden2-seen': '[]' } });
  open(t, 'body');
  assert.equal(t.g('S.cover'), null);
  t.$('#closeBtn').click(); open(t, 'ultra');
  assert.equal(t.g('S.cover'), null);
  assert.ok(t.$('#dare'));
});

test('Motståndets snabbkoll: ett riktigt motstånd och tre bilder utan text', () => {
  const t = fresh();
  open(t, 'body');
  const opts = t.$$('#q [data-kick]');
  const right = opts.find(b => +b.dataset.kick === t.g('S.kick.right'));
  assert.ok(right.querySelector('svg:not(.pic)'), 'rätt val är ett riktigt motstånd');
  assert.equal(opts.filter(b => b.querySelector('svg.pic')).length, 3);
  assert.ok(opts.find(b => b.getAttribute('aria-label') === 'Kyckling'));
});

test('Snabbkoll i testläge: grön pil på rätt val', () => {
  const t = load({ start: true, url: 'http://localhost/?test=true', storage: { ...ALL_OPEN, 'fargkoden2-topic': 'body', 'fargkoden2-keys': '[]', 'fargkoden2-seen': '[]' } });
  open(t, 'tol');
  assert.equal(+t.$('#q [data-kick].cheat').dataset.kick, t.g('S.kick.right'));
});
```

- [ ] **Steg 2: Kör testerna och se dem misslyckas**

Kör: `node --test tests/cover.test.mjs`
Väntat: FAIL. `S.cover` är `null`, och `.eyebrow` saknas.

- [ ] **Steg 3: Omslaget**

I `openTopic(lv)` byts raden `showScreen(); updateHead();` och raden `goTopic(lv);` mot:

```js
  S.cover = lv !== 'ultra' && !cleared(lv) && !S.seen.includes(lv) ? lv : null;
  showScreen(); updateHead();
  if (S.cover) drawCover(lv); else goTopic(lv);
```

Byt `zoomIn(from)` så att omslaget vänds fram medan det växer. Funktionen blir:

```js
function zoomIn(from){
  const el = document.getElementById('spel'), to = el.getBoundingClientRect();
  if (S.instant || reduceMotion() || !el.animate || !to.width) return;
  sfx.whoosh();
  const turn = S.cover ? ' perspective(1400px) rotateY(-90deg)' : '';
  el.animate([{transformOrigin: '0 0', transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height})${turn}`},
    {transformOrigin: '0 0', transform: 'none'}], {duration: S.cover ? 700 : 450, easing: 'cubic-bezier(.2,.8,.2,1)'});
  [...el.children].forEach(c => c.animate([{opacity: 0}, {opacity: 1}], {duration: 300, delay: 180, fill: 'backwards'}));
}
```

Lägg till efter `openTopic`:

```js
// Omslaget: första gången man öppnar ett ämne. Ämnets animering, namnet, vad man lär sig och en snabbkoll.
// Rätt svar vänder kortet till spelsidan, och omslaget kommer aldrig tillbaka för det ämnet.
const SPARK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4z" fill="currentColor"/></svg>';
function drawCover(lv){
  if (!S.kick || S.kick.lv !== lv) {
    const K = KICK[lv], order = shuffle([0, 1, 2, 3]);
    S.kick = {lv, right: order.indexOf(0), bad: [], opts: order.map(i => { const o = K.opts[i]; return {html: typeof o.html === 'function' ? o.html() : o.html, label: o.label}; })};
  }
  const q = document.getElementById('q');
  q.classList.remove(...KINDS, 'bosscard');
  q.innerHTML = coverHTML(lv);
  document.getElementById('more').hidden = true;
}
function coverHTML(lv){
  const k = S.kick;
  return `<button class="xbtn" id="coverClose" aria-label="Byt ämne">${CLOSE_ICON}</button>
    <span class="eyebrow">Ämne ${TOPICS.indexOf(lv) + 1} av 5</span>${animHTML(lv)}
    <h2 class="cname"><span class="ticon">${topicIcon(lv)}</span>${topicName(lv)}</h2>
    <p class="cline">${TOPIC_LINE[lv]}</p>
    <div class="unlock"><div class="rule"></div><span class="ulab">${SPARK_ICON}Snabbkoll</span>
      <p class="kickq">${KICK[lv].q}</p>
      <div class="kickopts">${k.opts.map((o, i) => `<button class="kopt${k.bad.includes(i) ? ' bad' : ''}${showCheat() && i === k.right ? ' cheat' : ''}" data-kick="${i}"${o.label ? ` aria-label="${o.label}"` : ''}${k.bad.includes(i) ? ' aria-disabled="true"' : ''}>${o.html}</button>`).join('')}</div></div>`;
}
function flipCard(fn){
  const el = document.getElementById('spel');
  if (S.instant || reduceMotion() || !el.animate) { fn(); return; }
  el.animate([{transform: 'perspective(1400px) rotateY(0)'}, {transform: 'perspective(1400px) rotateY(90deg)'}], {duration: 230, easing: 'ease-in'}).onfinish = () => {
    fn();
    el.animate([{transform: 'perspective(1400px) rotateY(-90deg)'}, {transform: 'perspective(1400px) rotateY(0)'}], {duration: 260, easing: 'ease-out'});
  };
}
function kickPick(btn){
  const k = S.kick, i = +btn.dataset.kick, lv = S.cover;
  if (!k || !lv || k.busy || k.bad.includes(i)) return;
  if (i !== k.right) {
    k.bad.push(i);
    drawCover(lv);
    const box = document.querySelector('#q .kickopts');
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    sfx.wrong();
    return;
  }
  k.busy = true; btn.classList.add('ok'); sfx.right();
  const go = () => {
    if (S.cover !== lv) return;
    S.seen.push(lv); saveKeys();
    S.kick = null; S.cover = null;
    showScreen(); updateHead(); goTopic(lv);
  };
  if (S.instant || reduceMotion()) { go(); return; }
  setTimeout(() => flipCard(go), 550);
}
```

I `#q`-lyssnaren lägger du till, före grenen för `btn.dataset.ord`:

```js
  } else if (btn.id === 'coverClose') {
    closePlay();
  } else if (btn.dataset.kick != null) {
    kickPick(btn);
```

I `cheatBtn`-lyssnaren blir raden `if (S.cover) drawCover(S.cover); else if (S.plan && S.type !== 'exam') render();`.

- [ ] **Steg 4: CSS för omslaget**

Kopiera blocket `/* Omslaget: första gången ... */` från skissen, från `.play.cover` till och med `@media (max-width:600px){...}`. Gör sedan de här ändringarna:
- Ta bort `.coverwrap` (innehållet ligger direkt i `#q`).
- Byt `.cover .opts` mot `.cover .kickopts` och `.cover .opt` mot `.cover .kopt`, även inne i `@container (max-width:560px){...}`. Ta bort `.coverwrap` ur det blocket.
- Byt `.unlock .q` mot `.unlock .kickq`.
- `.cname` ska ha `font-size:clamp(2rem,10cqi,3.8rem)`, `min-width:0` och `overflow-wrap:anywhere` som i skissen. Storlekar i `vw` ger sidoscroll på mobil.

Lägg till:

```css
.play.cover #q{position:relative;background:transparent;border:0;padding:6px 4px 4px}
.kickq{font-weight:700;font-size:1.15rem;margin:6px 0 10px}
.kickopts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.kopt{min-width:0;overflow-wrap:anywhere;hyphens:auto;font:inherit;font-size:1rem;border:1.5px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);padding:12px 10px;min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;text-align:center}
.kopt:hover{border-color:var(--c)}
.kopt svg.pic{width:58px;height:58px;max-width:none}
.kopt svg{width:100%;max-width:150px;height:auto}
.kopt.bad{border-color:var(--bad);background:var(--bad-bg);cursor:default;opacity:.75}
.kopt.ok{border-color:var(--ok);background:var(--ok-bg)}
@media (prefers-reduced-motion:no-preference){.kickopts.shake{animation:shake .45s ease-in-out}}
```

Raderna för `.kopt` och `.kickq` är samma som de som togs bort i uppgift 2, nu med ämnets färg vid hover.

- [ ] **Steg 4b: Titta på omslaget på mobilbredd**

Kör `python3 -m http.server`. Öppna sidan i webbläsarens mobilvy på 360 och 390 px och öppna alla fem omslagen, Motståndet med bilderna och Temperaturen med det längsta namnet. Kontrollera:
- att ingenting ger sidoscroll, varken i kortet eller på sidan,
- att svaren bryts på två rader i stället för att sticka ut.

`document.documentElement.scrollWidth === document.documentElement.clientWidth` i konsolen ska ge `true`.

- [ ] **Steg 5: Lägg tillbaka typfärgstestet för omslaget**

Omslagstestet täcker redan `kind-`. Kontrollera att `tests/kind.test.mjs` inte innehåller `showLevelCard`:
`grep -n showLevelCard tests/*.mjs`. Inga träffar ska finnas.

- [ ] **Steg 6: Kör testerna och se dem gå igenom**

Kör: `npm test`
Väntat: alla gröna.

- [ ] **Steg 7: Commita**

```bash
git add index.html tests/cover.test.mjs
git commit -m "Omslaget med Snabbkoll första gången man öppnar ett ämne"
```

---

### Uppgift 4: Nycklarna

**Filer:**
- Ändra: `index.html` (`advance`, `closePlay`, grid-lyssnaren, `#q`-lyssnaren, `sfx`, CSS)
- Test: `tests/keys.test.mjs` (lägg till)

**Gränssnitt:**
- Använder: `grantKey`, `S.keys`, `S.flying`, `S.arriving`, `keySVG(c)`, `renderGrid()`, `openTopic()`, `closePlay()`
- Skapar: `showKeyWin(lv)`, `flyKeys(fromId)`, `flyOne(t, from)`, `unlockTile(tile)`, `sfx.clink()`, `sfx.turn()`, `sfx.chains()`

- [ ] **Steg 1: Skriv testerna**

Lägg till i slutet av `tests/keys.test.mjs`. Lägg också `cont` i importen från `./answer.mjs`.

```js
test('Första besöket: nyckeln sitter i Motståndets lås och raden säger vad man ska göra', () => {
  const t = load({ start: true });
  const tile = t.$('#grid [data-id="body"]');
  assert.ok(tile.classList.contains('haskey'));
  assert.ok(tile.querySelector('.inkey svg'), 'nyckeln sitter i låset');
  assert.ok(!tile.querySelector('.inkey').classList.contains('arriving'));
  assert.match(t.$('#lead').textContent, /Tryck på Motståndet för att vrida om nyckeln och låsa upp\./);
});

test('Ett tryck vrider om nyckeln: låset öppnas, nyckeln är förbrukad och omslaget visas', () => {
  const t = load({ start: true });
  t.g("S.played = []; ['turn','chains'].forEach(k => { sfx[k] = () => S.played.push(k); })");
  t.$('#grid [data-id="body"]').click();
  assert.deepEqual(Array.from(t.g('S.keys')), []);
  assert.deepEqual(JSON.parse(t.g("localStorage.getItem('fargkoden2-keys')")), []);
  assert.deepEqual(Array.from(t.g('S.played')), ['turn', 'chains']);
  assert.equal(t.g('S.screen'), 'play');
  assert.equal(t.g('S.cover'), 'body');
  t.$('#coverClose').click();
  assert.ok(t.$('#grid [data-id="body"]').classList.contains('open'));
  assert.match(t.$('#lead').textContent, /Välj ett ämne/);
});

test('Dubbeltryck på nyckeln låser upp en gång och ger inga fel', () => {
  const t = load({ start: true });
  const tile = t.$('#grid [data-id="body"]');
  tile.click(); tile.click();
  assert.equal(t.g('S.screen'), 'play');
  assert.equal(t.g('S.cover'), 'body');
  assert.deepEqual(t.errors.map(String), []);
});

test('Mästare: nyckeln visas på spelkortet, kortet minimeras och nyckeln sitter i nästa lås', async () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  t.g('S.up = 2');
  answer(t, true);
  t.g('S.instant = false; advance()');
  const win = t.$('#q .keywin');
  assert.match(win.textContent, /Mästare! Du fick nyckeln till Resistansen\./);
  assert.match(win.textContent, /Den flyger till låset\./);
  assert.ok(win.querySelector('svg'));
  await new Promise(r => setTimeout(r, 2400));
  t.g('S.instant = true');
  assert.equal(t.g('S.screen'), 'grid');
  assert.equal(t.g("tileState('ohm')"), 'key');
  const key = t.$('#grid [data-id="ohm"] .inkey');
  assert.ok(key && !key.classList.contains('arriving'), 'nyckeln har landat');
  assert.deepEqual(Array.from(t.g('S.flying')), []);
});

test('Mästare i instant-läge: ett tryck på kortet går direkt till startsidan med nyckeln i låset', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  t.g('S.up = 2');
  answer(t, true); cont(t);
  assert.equal(t.g('S.screen'), 'grid');
  assert.equal(t.g("tileState('ohm')"), 'key');
});

test('Byt ämne direkt efter Mästare: nyckeln hamnar ändå i låset', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'body', 'fargkoden2-grade': JSON.stringify({ body: 2 }), 'fargkoden2-done': JSON.stringify({ body: 2 }) } });
  t.g('S.up = 2');
  answer(t, true);
  t.$('#closeBtn').click();
  assert.equal(t.g("tileState('ohm')"), 'key');
  assert.ok(t.$('#grid [data-id="ohm"] .inkey'));
});

test('Eldprovet som låser upp två ämnen: två nycklar i låsen när man går tillbaka', () => {
  const t = load({ storage: { 'fargkoden2-topic': 'ohm', 'fargkoden2-done': JSON.stringify({ body: 4, ohm: 1 }), 'fargkoden2-grade': JSON.stringify({ ohm: 1 }) } });
  t.g("openTopic('ultra'); S.exam = {queue: [], i: 20, done: true, score: {ohm: {ok: 3, n: 4}, tol: {ok: 4, n: 4}}}; next()");
  assert.match(t.$('#q').textContent, /Eldprovet är klart/);
  t.$('#closeBtn').click();
  assert.equal(t.g("tileState('tol')"), 'key');
  assert.equal(t.g("tileState('tc')"), 'key');
  assert.equal(t.$$('#grid .inkey').length, 2);
});
```

- [ ] **Steg 2: Kör testerna och se dem misslyckas**

Kör: `node --test tests/keys.test.mjs`
Väntat: FAIL. Ett tryck på ett kort med nyckel gör ingenting, och `.keywin` saknas.

- [ ] **Steg 3: Ljuden**

Lägg till i objektet som `sfx` returnerar, efter `tick()`:

```js
    // Nyckeln landar i låset: ett metalliskt klirr
    clink(){ const a = ctx(); if (!a) return; tone(a, 2200, {d: .25, v: .08, at: .003}); tone(a, 3300, {t0: .03, d: .2, v: .05, at: .003}); noise(a, .06, {hp: 4000, v: .15}); },
    // Nyckeln vrids om: ett klick
    turn(){ const a = ctx(); if (!a) return; tone(a, 900, {f2: 500, d: .06, type: 'square', v: .08, at: .002}); noise(a, .05, {hp: 2500, v: .25, t0: .05}); },
    // Låset öppnas: kedjorna skramlar och faller
    chains(){ const a = ctx(); if (!a) return; for (let i = 0; i < 7; i++) { noise(a, .08, {hp: 3000, v: .12, t0: i * .07}); tone(a, 1600 + Math.random() * 1400, {t0: i * .07, d: .08, v: .03, at: .002}); } tone(a, 120, {f2: 60, t0: .5, d: .25, type: 'triangle', v: .2, at: .003}); }
```

Lägg till ett kommatecken efter `tick(){...}`.

- [ ] **Steg 4: Ceremonin, flygturen och upplåsningen**

`advance()` blir:

```js
function advance(){
  stopTimer();
  if (S.goldNow) { S.goldNow = null; closePlay(); }
  else if (S.unlockedNow) { const lv = S.unlockedNow; S.unlockedNow = null; showKeyWin(lv); }
  else next();
}
```

Lägg till efter `advance()`:

```js
// Mästare: nyckeln till nästa ämne visas på spelkortet, sedan minimeras kortet och nyckeln flyger till låset
function showKeyWin(lv){
  S.keyWin = lv;
  const q = document.getElementById('q');
  q.classList.remove(...KINDS);
  q.innerHTML = `<div class="keywin">${keySVG(TOPIC_LOOK[lv].c)}<h3>Mästare! Du fick nyckeln till ${topicName(lv)}.</h3><p>Den flyger till låset.</p></div>`;
  document.getElementById('more').hidden = true;
  if (S.instant) { closePlay(); return; }
  S.timer = setTimeout(closePlay, 2200);
}
// Nycklarna flyger en i taget i en båge från kortet man lämnade till sina nyckelhål, och blir sittande där
function flyKeys(fromId){
  const list = S.flying.splice(0);
  if (!list.length) return;
  const fromEl = fromId && document.querySelector(`#grid [data-id="${fromId}"]`);
  if (S.instant || reduceMotion() || !fromEl || !fromEl.animate) { renderGrid(); return; }
  S.arriving.push(...list);
  renderGrid();
  const from = fromEl.getBoundingClientRect();
  list.forEach((t, i) => setTimeout(() => flyOne(t, from), 250 + i * 1300));
}
function flyOne(t, from){
  const target = document.querySelector(`#grid [data-id="${t}"]`), slot = target && target.querySelector('.inkey');
  const land = () => { S.arriving = S.arriving.filter(x => x !== t); document.querySelector(`#grid [data-id="${t}"] .inkey`)?.classList.remove('arriving'); renderLead(); sfx.clink(); };
  if (!slot || S.screen !== 'grid') { land(); return; }
  target.scrollIntoView?.({block: 'nearest', behavior: 'smooth'});
  const to = slot.getBoundingClientRect(), g = document.createElement('div');
  g.className = 'ghost'; g.innerHTML = keySVG(TOPIC_LOOK[t].c); g.style.width = to.width + 'px';
  document.body.appendChild(g);
  g.animate([
    {left: from.left + from.width / 2 - to.width / 2 + 'px', top: from.top + from.height / 2 + 'px', transform: 'scale(2.2) rotate(-30deg)'},
    {left: (from.left + to.left) / 2 + 'px', top: Math.min(from.top, to.top) - 60 + 'px', transform: 'scale(1.6) rotate(200deg)', offset: .55},
    {left: to.left + 'px', top: to.top + 'px', transform: 'scale(1) rotate(360deg)'}
  ], {duration: 1100, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards'}).onfinish = () => { g.remove(); land(); };
}
// Ett tryck på ett kort med nyckel: nyckeln glider in i nyckelhålet och vrids om, låset och kedjorna faller, dimman lättar, och omslaget öppnas
function unlockTile(tile){
  const t = tile.dataset.id;
  if (tile.classList.contains('turning') || !S.keys.includes(t)) return;
  tile.classList.add('turning');
  sfx.turn();
  const open = () => {
    S.keys = S.keys.filter(x => x !== t); saveKeys();
    S.fresh = t; renderGrid();
    if (S.instant || reduceMotion()) { openTopic(t); return; }
    setTimeout(() => { if (S.screen === 'grid') openTopic(t); }, 700);
  };
  if (S.instant || reduceMotion()) { sfx.chains(); open(); return; }
  // Nyckeln glider in i nyckelhålet och vrids om (CSS-animeringen pushturn, 0,75 s), sedan öppnas låset
  setTimeout(() => { tile.classList.add('opening'); sfx.chains(); }, 760);
  setTimeout(open, 1850);
}
```

I `closePlay()` blir `done` så här:

```js
  const done = () => { showScreen(); tile?.focus({preventScroll: true}); flyKeys(lv); };
```

I grid-lyssnaren blir raden `if (state === 'key') return;` så här:

```js
  if (state === 'key') { unlockTile(tile); return; }
```

Först i `#q`-lyssnaren, före `if (S.busy)`, lägger du till:

```js
  // Nyckeln på spelkortet: ett tryck går direkt till startsidan
  if (S.keyWin) { closePlay(); return; }
```

- [ ] **Steg 5: CSS för nyckeln**

Kopiera från skissen blocket som börjar med `.ghost{position:fixed;...}` och fortsätter till och med `.tile.opening .inkey{...}` (det står under kommentaren `/* Nyckeln sitter i nyckelhålet ... */`). Kopiera också hela `.keywin`-blocket (`.keywin`, `.keywin svg`, `@media ... keyin`, `.keywin h3`, `.keywin p`). Byt `.m2 .inkey{...}` mot `@media (max-width:719px){.inkey{left:calc(50% - 50px);width:54px}}`. Ändra `.keywin h3` så att `font-family:var(--display)` gäller, vilket det gör om tokens från uppgift 2 finns.

- [ ] **Steg 6: Kör testerna och se dem gå igenom**

Kör: `npm test`
Väntat: alla gröna.

- [ ] **Steg 7: Titta på sidan**

Kör `python3 -m http.server`, öppna sidan i ett privat fönster och kontrollera:
- Nyckeln sitter och skakar i Motståndet, och ett tryck vrider om den. Kedjorna faller och omslaget öppnas.
- Testa Mästare med testradens "Lås upp nästa ämne" och sedan spel (eller gör ett ämne till Mästare): nyckeln flyger i en båge och landar i rätt nyckelhål på både dator och mobilbredd.
- Med "Minska rörelse" påslaget i operativsystemet sker allt direkt.

- [ ] **Steg 8: Commita**

```bash
git add index.html tests/keys.test.mjs
git commit -m "Nycklar: flyger till låset vid Mästare och i Eldprovet, och ett tryck vrider om och låser upp"
```

---

### Uppgift 5: Eldprovets minikort, guld, testraden och förhandsvisningen

**Filer:**
- Ändra: `index.html` (`advance`, `tGive`, `tReset`)
- Test: `tests/screen.test.mjs` (lägg till)

**Gränssnitt:**
- Använder: `tileHTML`, `closePlay`, `grantKey`, `saveKeys`, `renderGrid`, `openTopic`
- Skapar: inga nya namn

- [ ] **Steg 1: Skriv testerna**

Lägg till i slutet av `tests/screen.test.mjs`. Lägg också `dare` i importen från `./answer.mjs`.

```js
test('Eldprovets minikort: Pågår med frågans nummer, och provet står kvar om man spelar ett annat ämne emellan', () => {
  const t = load({ storage: ALL_OPEN });
  t.g("openTopic('ultra')"); dare(t);
  answer(t, true);
  t.$('#closeBtn').click();
  assert.match(t.$('#grid [data-id="ultra"]').textContent, /Pågår · fråga 2 av 20/);
  open(t, 'ohm');
  answer(t, true);
  t.$('#closeBtn').click();
  open(t, 'ultra');
  assert.equal(t.g('S.exam.i'), 1, 'provet står på fråga 2');
  assert.equal(t.g('S.answered'), false);
  assert.match(t.$('#gbar').textContent, /Fråga 2 av 20/);
});

test('Guld: minikortet tänds när ämnet blir klart', () => {
  const t = atGrade('body', 4);
  t.g('S.grade.body = 4; S.up = 2; S.done.body = 4; next()');
  answer(t, true); cont(t);
  const tile = t.$('#grid [data-id="body"]');
  assert.ok(tile.classList.contains('done'));
  assert.ok(tile.classList.contains('fresh'));
});

test('Testraden: Lås upp nästa ämne ger en nyckel, Börja om går tillbaka till första besöket', () => {
  const t = load({ start: true, url: 'http://localhost/?test=true', storage: { 'fargkoden2-topic': 'body', 'fargkoden2-keys': '[]', 'fargkoden2-seen': '["body"]' } });
  t.$('#tGive').click();
  assert.equal(t.g("tileState('ohm')"), 'key');
  assert.ok(t.$('#grid [data-id="ohm"] .inkey'));
  open(t, 'body');
  t.$('#tReset').click();
  assert.equal(t.g('S.screen'), 'grid');
  assert.deepEqual(Array.from(t.g('S.keys')), ['body']);
  assert.deepEqual(Array.from(t.g('S.seen')), []);
  assert.equal(t.g("tileState('ohm')"), 'locked');
});
```

- [ ] **Steg 2: Kör testerna och se dem misslyckas**

Kör: `node --test tests/screen.test.mjs`
Väntat: FAIL. Testet med guld saknar `fresh`, och testraden ger ingen nyckel.

- [ ] **Steg 3: Implementera**

Raden med guld i `advance()` blir:

```js
  if (S.goldNow) { const lv = S.goldNow; S.goldNow = null; S.fresh = lv; closePlay(); }
```

`tGive`-lyssnaren blir:

```js
document.getElementById('tGive').addEventListener('click', () => {
  const lv = TOPICS.find(l => !unlocked(l));
  if (lv) { const p = TOPICS[TOPICS.indexOf(lv) - 1]; S.done[p] = Math.max(S.done[p], UNLOCK_AT); S.grade[p] = Math.max(S.grade[p], UNLOCK_AT); saveProgress(); grantKey(lv); }
  if (S.screen === 'grid') flyKeys(null);
});
```

`flyKeys(null)` hittar inget kort att flyga från och ritar därför om rutnätet med nyckeln direkt i låset.

`tReset`-lyssnaren blir:

```js
document.getElementById('tReset').addEventListener('click', () => {
  if (S.screen === 'play') closePlay();
  TOPICS.forEach(t => { S.done[t] = 0; S.grade[t] = 0; });
  saveProgress();
  S.up = 0; S.down = 0; S.streaks = {}; S.exam = null; S.plan = null; S.topic = 'body'; save('fargkoden2-topic', 'body');
  S.keys = ['body']; S.seen = []; S.flying = []; S.arriving = []; saveKeys();
  renderGrid();
});
```

- [ ] **Steg 4: Kör testerna och se dem gå igenom**

Kör: `npm test`
Väntat: alla gröna.

- [ ] **Steg 5: Commita**

```bash
git add index.html tests/screen.test.mjs
git commit -m "Eldprovets minikort visar pågående prov, guld tänds, testraden ger nycklar och börjar om"
```

---

### Uppgift 6: Städning, dev.html och publicering

**Filer:**
- Ändra: `index.html` (rullgardinerna med info och koden som fyller dem)
- Ändra: `dev.html` (bara om testet för katalogen kräver det)
- Ändra: `docs/backlogg.md` (bocka av det som blev gjort, om något står där)

- [ ] **Steg 1: Ta bort rullgardinerna med info**

Ta bort i `index.html`:
- de fyra `<details ... hidden>`-blocken och kommentaren ovanför dem,
- skriptet som fyller dem: `document.getElementById('ref').innerHTML = ...`, `exStyle`, `eq`, `EX`, `document.querySelectorAll('[data-ex]')...`, `eSel`, `renderE` och lyssnaren på `#eSeg`,
- CSS som bara används där: `details`, `summary`, `details+details`, `details[hidden]`, `.guide*`, `.ex*`, `.tag*`, `.eseg*`, `.ehelp*`, `.enote`, `.tbl`, och `table`, `th`, `td`.

Behåll `E12`, `E48`, `E6`, `ESER`, `SER_OPTS`, `seriesOf`, `.egrid` (används i E-seriernas facit) och `TOL_SER`. Kontrollera innan du tar bort något:
`grep -n "egrid\|\.tbl\|<table" index.html`. `.egrid` ska finnas kvar, och `<table` ska inte ha några träffar.

- [ ] **Steg 2: Kör testerna**

Kör: `npm test`
Väntat: alla gröna. Om `dev.test.mjs` misslyckas på katalogen, kontrollera att `GRADES` är oförändrat. Katalogen ska inte behöva ändras eftersom inga frågor har ändrats.

- [ ] **Steg 3: Commita städningen**

```bash
git add index.html docs/backlogg.md
git commit -m "Tar bort rullgardinerna med info och koden som fyllde dem"
```

- [ ] **Steg 4: Publicera artifacterna med testläget på**

Gör som minnet "Artifact med testläge" säger:
1. Kopiera `index.html` till scratchpad som `index2.html` och sätt `<html lang="sv" data-test="true">`.
2. Publicera `index2.html` till https://claude.ai/artifact/S1iBdoZub6VVMShjaDCqm6.
3. Kopiera `dev.html` till scratchpad, byt `index.html?test` mot `index2.html?test` och publicera den med `index2.html` som fil `index2.html` till https://claude.ai/artifact/36JGJVPcWEHDwf2fUBdbUq.

Läs först den publicerade versionen om publiceringen nekas, och bygg vidare på den.

- [ ] **Steg 5: Speltesta i artifacten**

Kontrollera på mobil och dator:
- första besöket med nyckeln i Motståndet,
- omslaget och snabbkollen,
- Byt ämne,
- Mästare och nyckeln som flyger till låset,
- Eldprovet,
- guld.

---

## Självgranskning

- **Specen täcks:**
  - A Startsidan: uppgift 2 och 4 (raden med nyckel).
  - B Spelkortet: uppgift 2.
  - C Omslaget: uppgift 3.
  - D Nycklarna: uppgift 1 (regel och sparande) och uppgift 4 (flygtur och upplåsning).
  - E Eldprovet: uppgift 2 (kortet) och uppgift 5 (Pågår och fortsätta).
  - F Guld: uppgift 2 (minimeras) och uppgift 5 (tänds).
  - G Förhandsvisningen: uppgift 1 och 2.
  - Ljud: uppgift 4. Zoom-ljudet är `sfx.whoosh()` i uppgift 2.
  - Rörelse: `S.instant || reduceMotion()` i alla nya animeringar.
  - Det som tas bort: uppgift 2 och 6.
  - Tester: varje uppgift.
- **Namn stämmer mellan uppgifterna:** `openTopic`, `closePlay`, `showScreen`, `updateHead`, `barIdle`, `noPick`, `renderGrid`, `renderLead`, `tileHTML`, `tileState`, `grantKey`, `saveKeys`, `flyKeys`, `flyOne`, `unlockTile`, `showKeyWin`, `drawCover`, `coverHTML`, `kickPick`, `flipCard`, `examIntroHTML`, `lookVars`, `topicIcon`, `topicPattern`, `keySVG`, `chainsSVG`, `PADLOCK_SVG`, `CLOSE_ICON`, `SPARK_ICON`, `TOPIC_LOOK`, `TOPIC_ICON`, `TOPIC_LINE`.
- **Det som är svårast att få rätt** testas i: uppgift 4 (dubbeltryck, Byt ämne efter Mästare), uppgift 2 (minimera under animering), uppgift 5 (Eldprovet avbrutet) och uppgift 1 (trasig data).
