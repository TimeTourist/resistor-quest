# Ackordkartan omgång 1 Implementation Plan

> **For agentic workers:** Körs inline (executing-plans), enligt användarens "kör igång". Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** En startsida med två spel. Färgkoden flyttas till `fargkoden.html`, och det nya spelet `ackord.html` får ramverket och ämnena Klaviaturen och Treklangerna. dev.html får en spelväljare.

**Architecture:** Fristående HTML-filer utan byggsteg, som Färgkoden. `ackord.html` innehåller en musikteorikärna med rena funktioner (testbara via `w.eval`), en klaviaturkomponent som ger SVG-sträng, ett pianoljud och ett ramverk som kopierar Färgkodens regler: grader, nycklar, omslag, svar och lås.

**Tech Stack:** Vanilla HTML/CSS/JS, Web Audio, `node --test` + jsdom.

**Spec:** `docs/superpowers/specs/2026-10-09-ackordkartan-design.md`

## Global Constraints

- localStorage-prefix `ackord1-`, alltid inom try/catch.
- Internationella tonnamn: B = tonen under C. Inga dubbelkors eller dubbelbe i frågorna.
- Varje frågetyp har en felanimering som låser via `S.lockUntil` och respekterar `S.instant` och `reduceMotion()`.
- Testläge: `?test=true` / `data-test="true"`, med `&topic=&grade=` som förhandsvisning som inte sparar något.
- Ett grepp som visas spelas en gång, och "Spela igen" finns bredvid.
- Ämnen som inte är byggda: *Kommer snart*, de går inte att öppna.

## Review Focus

- Svar i en annan oktav än den visade, när ackord byggs på klaviaturen: ska räknas som rätt (tonklasser).
- Dubbeltryck på en tangent i Peka-läget: ska ta bort markeringen, inte räkna tonen två gånger.
- Trasig data i localStorage: spelet startar ändå, på Nykomling.
- Ljud av: inga AudioContext-anrop.
- Ett tryck under felanimeringen ska inte gå vidare innan låset släpper.

---

### Task 1: Startsidan och flytten av Färgkoden
**Files:** `git mv index.html fargkoden.html`; ny `index.html`; `tests/harness.mjs`, `tests/dev.test.mjs` (läser `../fargkoden.html`, url:er `fargkoden.html?...`); `dev.html` (Visa-länken); ny `tests/launcher.test.mjs`.
- [ ] Test: startsidan har länkarna `ackord.html` och `fargkoden.html`. Färgkoden har länken `index.html` ("Alla spel").
- [ ] Implementera och kör `npm test` (alla gamla tester gröna), sedan commit.

### Task 2: Musikteorikärnan i ackord.html
**Produces:** `LETTERS`, `pc(name)` → 0–11, `noteName(letter, acc)`, `spell(rootName, intervals)` → stavade namn, `QUAL` (dur, moll, dim, aug, sus2, sus4 med intervall och suffix), `chordName(root, q)`, `chordNotes(root, q)` → midi-nummer inom C4–B5, `ROOTS_OK` (grundtoner utan dubbeltecken per kvalitet), `samePcs(a, b)`.
- [ ] Test `tests/ackord-theory.test.mjs`: F♯-dur = F♯ A♯ C♯, B♭m = B♭ D♭ F, Bdim = B D F, Caug = C E G♯. Inga `##` och `bb` i någon fråga som genereras. `samePcs` ignorerar oktav.
- [ ] Implementera, kör, commit.

### Task 3: Ramverket i ackord.html
Startrutnät (8 kort, *Kommer snart*), lås, nyckel, zoom, omslag med snabbkoll, gradstapel, trappan, blandat/guld, svarsflödet (gnista → reveal → lås → handen), testrad, förhandsvisning och ljudknapp. Harness `tests/ackord-harness.mjs` med `load()`, `atGrade()`, `answer(t, ok)` och `cont(t)`.
- [ ] Test `tests/ackord-frame.test.mjs`: tre rätt ger upp en grad, tre fel ner. Mästare ger nyckel till `tonart`. *Kommer snart* öppnas inte. Förhandsvisningen sparar inget. Trasig localStorage ger start på Nykomling.
- [ ] Implementera, kör, commit.

### Task 4: Klaviaturen (komponent) och pianoljudet
**Produces:** `kbd({lit, labels, tap, sel, marks, arcs, cheat})` → SVG-sträng. `piano.chord(midis)`, `piano.seq(midis, step)`. `playShown()` och knappen `#replay`.
- [ ] Test: 24 tangenter med aria-label. Tryck markerar och avmarkerar. Med ljudet av anropas inte AudioContext. "Spela igen" spelar greppet.
- [ ] Implementera, kör, commit.

### Task 5: Klaviaturens frågor och felanimeringar
Enligt spectabellen: `tangent` grad 0–4.
- [ ] Test: varje grad ger en fråga av rätt typ. Rätt och fel svar fungerar. Felanimeringen sätter `S.lockUntil` > reveal när den inte körs instant. Halvtons- och enharmonifrågorna har rätt facit.
- [ ] Implementera, kör, commit.

### Task 6: Treklangernas frågor och felanimeringar
Enligt spectabellen: `treklang` grad 0–4.
- [ ] Test: dur/moll-facit och namnfacit. Bygg ackord i en annan oktav räknas som rätt. Stavningsfrågan har exakt ett rätt alternativ. Flytta-ton-frågan ger rätt nytt ackord.
- [ ] Implementera, kör, commit.

### Task 7: dev.html med spelväljare
`GAMES = {fargkoden: {...}, ackord: {...}}`, med flikar, katalog, sparnyckel och fil per spel. Prompten nämner spelet och filen.
- [ ] Test: växla spel, Ackordkartans katalog täcker `tangent` och `treklang` grad 0–4, och Visa går till `ackord.html?test=true&topic=…&grade=…`. Färgkodens befintliga dev-tester ska vara gröna.
- [ ] Implementera, kör, commit.

### Task 8: Publicering och minne
- [ ] Testlägeskopior i scratchpad. Startsidan publiceras på spelets url med `fargkoden.html` och `ackord.html`, och dev.html på dev-url:en.
- [ ] Uppdatera minnet (artifact-testlage, dev-html-arbetssatt) och backloggen.
