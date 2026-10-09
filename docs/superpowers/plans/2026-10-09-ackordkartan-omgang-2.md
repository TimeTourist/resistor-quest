# Ackordkartan omgång 2 Implementation Plan

> **For agentic workers:** Körs inline (executing-plans), enligt användarens "kör omgång 2". Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ämnena Tonarterna och Stegen i `ackord.html`, med frågor och felanimeringar enligt specens katalog för omgång 2, och deras rader i dev.html.

**Architecture:** Samma fil och samma ramverk som omgång 1. Musikteorikärnan får skalor, förtecken och stegens ackord. Klaviaturen får lager, så att en tangent kan tändas flera gånger i en animering. Kvintcirkeln blir en egen SVG-funktion, och den visas i förklaringsrutan.

**Tech Stack:** Vanilla HTML/CSS/JS, Web Audio, `node --test` + jsdom.

**Spec:** `docs/superpowers/specs/2026-10-09-ackordkartan-design.md` (avsnittet "Omgång 2: frågekatalog")

## Global Constraints

- Samma som omgång 1: prefixet `ackord1-`, internationellt B, inga dubbelkors eller dubbelbe, en felanimering per frågetyp som låser via `S.lockUntil`.
- Durtonarter upp till fem förtecken i frågorna. F♯ och G♭ finns bara i kvintcirkeln. Moll är naturlig moll.
- Skalor tas med sju tangenter och Svara. Rättningen jämför tonklasser.

## Review Focus

- En skala tagen i två oktaver, eller med samma ton två gånger: samma ton två gånger ska vara fel (sex tonklasser), men en annan oktav ska vara rätt.
- Ett steg i en tonart där ackordet skulle hamna över B5: ackordet ska flyttas ner en oktav och inte ritas utanför klaviaturen.
- "Vilken durtonart hör de hemma i?" måste ha exakt en durtonart som rymmer alla tre ackorden.
- Kortet Tonarterna, som tidigare var *Kommer snart*, måste gå att låsa upp med en nyckel som redan sitter i låset.
- Förhandsvisningen (`&q=`) måste fungera för alla nya frågetyper.

---

### Task 1: Teorin
**Produces:** `MAJ`, `MIN` (halvtoner per skalsteg), `scale(tonic, mode)` → stavade toner, `scaleMidi(tonic, mode)`, `accCount(tonic, mode)` → antal med tecken (+♯/−♭), `MAJ_KEYS`, `MIN_KEYS`, `ROMAN`, `DQ`, `FUNC`, `diat(tonic, d)` → `{root, q, roman, ms, names}`, `CIRCLE`.
- [ ] Test: D-dur = D E F♯ G A B C♯, B♭m = B♭ C D♭ E♭ F G♭ A♭. Förtecknen följer kvintcirkeln. Stegen i C: C Dm Em F G Am Bdim. Inga dubbeltecken. Ackorden ryms på klaviaturen.

### Task 2: Klaviaturen med lager och kvintcirkeln
- [ ] `lit[m]` får vara en lista. `circleSvg({on, at})`.

### Task 3: Tonarternas frågor (7 typer) och Task 4: Stegens frågor (8 typer)
- [ ] Varje typ ger en fråga med ett rätt svar och en felanimering. Testerna för alla frågetyper körs över `BUILT`.

### Task 5: Ramverket och dev.html
- [ ] `BUILT` får `tonart` och `steg`, med omslag och snabbkoll. Ramtesterna uppdateras: nyckeln till Fyrklangerna väntar i låset. dev.html får flikar och rader.

### Task 6: Kontroll i webbläsaren, publicering och backlogg
