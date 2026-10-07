# E-serierna: skalan förklarad med linjaler i stället för klockan

Datum: 2026-10-07. Skiss: https://claude.ai/artifact/VPdNWtoTG2nv5wmWgQXLeK, kopia i [2026-10-07-eserier-linjal-skiss.html](2026-10-07-eserier-linjal-skiss.html). Bygger på [2026-10-07-eserier-utan-varden-design.md](2026-10-07-eserier-utan-varden-design.md). Allt ligger i `index.html`, och frågetyperna beskrivs i `dev.html`.

## Bakgrund

- **Klockan förklarar inte skalan.** Den är logaritmisk, så prickarna står jämnt, och då syns aldrig varför värdena ser ut som de gör.
- **"10–100 är uppdelat i 12 steg" är abstrakt.** Användaren frågade varför det inte är 0–100.
- **E12 är för många värden att börja med.** E6 har bara sex värden.
- **Serie ↔ tolerans visas bara som procent.** Ett motstånd med rätt band markerat säger mer.

## Målet

De lägre graderna ska visa skalan på två sätt:

1. **Logaritmiskt** ligger E6-värdena på lika avstånd. Varje steg är ungefär ×1,5: 10 → 15 → 22 → 33 → 47 → 68 → 100.
2. **I ohm, på en rak skala,** ligger de tätt i början och glest i slutet. Toleransen är i procent: ±20 % av 10 är ±2 Ω, men av 68 är det ±13,6 Ω. Därför kan stegen bli längre och ändå täcka allt.

De lägre graderna börjar med E6. Ingen grad kräver att man kan värdena utantill, eftersom värdena alltid står i frågan.

**E6 är ovanlig, och det ska spelet säga.** E6 (±20 %) används nästan aldrig i dag. De vanligaste serierna är E24 (±5 %) och E96 (±1 %), och E12 (±10 %) finns i många sortiment. Vi börjar med E6 för att den har minst värden och är lättast att se.
- Alla E6-frågor på Nykomling och Lärling har en liten rad under frågan: "E6 är ovanlig i dag, men har bara sex värden och är lätt att börja med. Vanligast är E24 och E96."
- "Vad är E6?" säger samma sak i raden vid fel.
- På Eldprovet visas raden inte, eftersom provet inte har några förklaringar.

## Graderna

| Grad | Frågor |
|---|---|
| Nykomling | Vad är E6? · Placera på skalan (logaritmisk) · Placera i lådorna (rak skala) · Varför ligger värdena glesare högre upp? |
| Lärling | Vilken tolerans är E6 gjord för? (rak linjal) · Vilken serie hör till motståndet? (bandet inringat) · Vilken serie räcker? |
| Gesäll | Vilken serie tillhör motståndet? (som i dag: bara toleransbandet avgör) |
| Mästare | Vilken serie tillhör motståndet? med E192, sex band och vända motstånd · Samma siffror, annan multiplikator · Vilken serie räcker säkert? ("Du behöver 3,4 kΩ ±10 % …", med tabell och tallinje) (alla som i dag) |
| Stormästare | Vilken serie hör till motståndet? · Vilken serie räcker? · Mästares tre frågor |

### Nykomling

#### 0. Vad är E6?

- Det är dagens "Vad är E12?" med E6.
- **Svaren:**
  - "Standardvärden som motstånd säljs i" (rätt)
  - "En färgkod för motstånd"
  - "Ett motstånd på 6 Ω"
  - "En tolerans på ±6 %"
- **Bild efter svaret:** den raka linjalen med de sex E6-värdena som faller ner, i stället för klockan.
- **Felanimeringen:** sedan tänds 4,7 Ω, 47 Ω och 4,7 kΩ, ett i taget: samma standardvärde med olika nollor.
- **Raden vid fel:** "E6 är en lista med standardvärden: 10, 15, 22, 33, 47 och 68. Motstånd tillverkas inte i alla värden, bara i de här och samma siffror gånger 10, 100, 1000 … E6 är ovanlig i dag, och vanligast är E24 och E96, men den har minst värden och är lättast att börja med."

#### 1. Placera på skalan (logaritmisk)

- **Frågan:** "Placera E6-värdena på skalan. Börja med det minsta."
- **Skalan** är en tiopotens med logaritmiska streck vid 1, 2 … 10 gånger multiplikatorn. Strecken ligger tätare åt höger. Etiketter står vid 1–6, 8 och 10. Under skalan står "logaritmisk skala, Ω".
- **Platserna:** sex tomma platser på värdenas logaritmiska positioner, alltså på ungefär lika avstånd. Den tomma platsen 100 längst till höger är streckad.
- **Varianterna** slumpas mellan 10, 15, 22, 33, 47 och 68 Ω, 1,0–6,8 Ω och 1–6,8 kΩ. Strecken får samma enhet.
- **Mekaniken är Ordnas:** man trycker på värdet som hör hemma i nästa plats, med det minsta först.
  - Rätt: värdet flyger upp och lyser grönt.
  - Fel: värdet flyger till sin rätta plats, skakar med röd bakgrund och hoppar tillbaka.
  - Rätt och fel räknas som i Ordna. Ett fel ger ett sista försök, och fel igen räknas som fel svar.
- **Felanimeringen:** bågar tänds mellan grannarna, en i taget, med kvoten: ×1,5, ×1,5, ×1,5, ×1,4, ×1,4 och ×1,5 fram till "→ 100, nästa varv".
- **Raden vid fel:** "Varje värde är ungefär ×1,5 av det förra. På en logaritmisk skala ligger de därför på lika avstånd, och efter 68 kommer 100 och samma värden igen."

#### 2. Placera i lådorna (rak skala)

- **Frågan:** "Placera E6-värdena i lådorna. Börja med det minsta."
- **Skalan** är rak, från 0 till 100 Ω (eller 0–10 Ω, eller 0–10 kΩ), med ett streck per tiondel. Under skalan står "rak skala, Ω".
- **Lådorna** står på värdenas riktiga platser, med en nål ner till skalan. Varannan låda sitter högre upp, så att de täta lådorna inte krockar.
- **Varianterna och mekaniken** är som i fråga 1.
- **Felanimeringen:** toleransstaplarna på ±20 % växer ut under skalan, en i taget och bredare och bredare, och når precis fram till varandra. Sist står "±20 % runt varje värde: stegen blir längre, men staplarna når ändå fram".
- **Raden vid fel:** "På en rak skala ligger E6-värdena tätt i början och glest i slutet. Toleransen är i procent, så stora värden täcker fler ohm."

#### 3. Varför ligger värdena glesare högre upp?

- **Bild:** den raka linjalen, 10–100 Ω, med E6-värdena utan staplar.
- **Svaren:**
  - "Toleransen är i procent, så stora värden täcker fler ohm" (rätt)
  - "Stora motstånd är dyrare att tillverka"
  - "Färgkoden har inte plats för fler värden"
  - "Det är bara bestämt så"
- **Felanimeringen** är linjalens från skissen:
  1. Värdena faller ner.
  2. Staplarna på ±20 % växer ut.
  3. Hela sträckan lyser grön.
  4. "100 → nästa varv: 100, 150, 220 …"

  Under linjalen står en kort tabell: "10 Ω ±2 Ω · 22 Ω ±4,4 Ω · 47 Ω ±9,4 Ω · 68 Ω ±13,6 Ω".
- **Raden vid fel:** "±20 % av 10 är ±2 Ω, men ±20 % av 68 är ±13,6 Ω. Därför kan stegen bli längre högre upp, och ändå når varje värde fram till grannen."

### Lärling

#### 1. Vilken tolerans är E6 gjord för? (rak linjal)

- Det är dagens staplarfråga, men på den raka linjalen i ohm, 10–100 Ω.
- Serien är E6 i hälften av frågorna och annars E12 eller E24. Svaren är för stor, rätt och för liten: E6 ±40 / ±20 / ±10 %, E12 ±20 / ±10 / ±5 % och E24 ±10 / ±5 / ±2 %.
- **Felanimeringen:** tre rader på den raka linjalen, en per svar. För liten ger gula glapp, för stor röda krockar och den rätta kant i kant. Raden man valde har en ram, som i dag.

#### 2. Vilken serie hör till motståndet? (bandet inringat)

- **Ersätter serie ↔ tolerans som text.** Ett motstånd visas med toleransbandet inringat redan före svaret, och under det står bandets färg, till exempel "Guld". Svaren är fyra serier.
- Motståndet tas ur `bandResistor` med E6–E96. För E6 är toleransbandets plats streckad och märkt "Inget band".
- **Felanimeringen** är trappan med ett litet motstånd per serie: E6 utan band, E12 silver, E24 guld, E48 rött, E96 brunt och E192 grönt. Varje motstånd har toleransbandet inringat, och den rätta serien lyser.

#### 3. Vilken serie räcker?

- Frågan är som i dag.
- Trappan i felanimeringen får samma små motstånd som ovan.

### Gesäll, Mästare och Stormästare

- Gesäll och Mästare är oförändrade.
- På Stormästare ersätts `eSerieTol` (serie ↔ tolerans som text) av Lärlings "Vilken serie hör till motståndet?". Inga frågor visar längre serie och tolerans som bara procent.

## Det som försvinner

- **Klockan** (`dialSVG`) och frågan "Vad betyder 12 i E12?". "Vad är E12?" blir "Vad är E6?" med den raka linjalen.
- **Den logaritmiska linjalen** (`rulerSVG` med `ePos`), **utrullningen** (`rollNow`, `S.rolled` och `.eroll`) och deras CSS.
- **Serie ↔ tolerans som text** (`eSerieTol`).

## Det som inte ändras

- Snabbkollen på E-seriernas omslag.
- Gesälls och Mästares frågor.
- Eldprovet, som tar frågorna från Stormästare.

## Tekniskt

- **Placeringsfrågorna byggs på Ordna** (frågetypen `order`). De får två nya uppsättningar i `ORDER_SETS`, med E6-värdena som nycklar och var sin egen ritning av platserna: logaritmisk skala eller rak skala med lådor. Lapparna visar värden i stället för färger. Flygningen, skakningen, ledtråden och det sista försöket kommer från Ordna.
- **Den raka linjalen** blir en ny ritfunktion som ersätter `rulerSVG`. Den har parametrar för serie, tolerans (staplar, krock och glapp), om värdena faller ner och om staplarna växer ut.
- **Trappans små motstånd** ritas med `svg()` i liten storlek, med ring runt toleransbandet.
- Felanimeringarna följer spelets mönster:
  - Låset väntar in dem (`S.cq.anim.total`, och för Ordna den befintliga logiken).
  - Med `S.instant` och `reduceMotion()` visas slutläget direkt.
  - På Eldprovet visas ingen animering och inget facit.

## dev.html

Raderna för `e` i `CATALOG` uppdateras:

| Rad | Grad | Status |
|---|---|---|
| `e-vad` | 0 | E6 och den raka linjalen |
| `e-placera-log` | 0 | ny |
| `e-placera-lador` | 0 | ny |
| `e-glesare` | 0 | ny |
| `e-tol-staplar` | 1 | rak linjal |
| `e-band-ring` | 1 | ny, ersätter `e-serie-tol` och `e-tol-serie` |
| `e-racker` | 1 | trappan med motstånd |

`e-namn`, `e-serie-tol`, `e-tol-serie` och `e-band-tol` tas bort.

## Tester

- **Beroenderegeln** i `model.test.mjs` för `e` blir: Nykomling choice eller order, sedan choice på resten.
- **Placera på skalan:**
  - platserna ligger på logaritmiska positioner
  - de sex avstånden skiljer sig högst 15 % från varandra
  - rätt värde i ordning placeras
  - fel värde räknas som miss och placeras inte
  - alla tre varianterna förekommer
- **Placera i lådorna:**
  - lådorna står på raka positioner, med ökande avstånd mellan grannarna
  - felanimeringen har sex staplar
- **Varför glesare:**
  - rätt svar är "Toleransen är i procent …"
  - vid fel faller sex värden, sex staplar växer och tabellen visas
- **Vilken tolerans är E6 gjord för?:**
  - linjalen är rak, det vill säga staplarna blir bredare med värdet
  - för stor ger krock, för liten glapp och den rätta är ren
- **Vilken serie hör till motståndet?:**
  - toleransbandet är inringat före svaret
  - rätt svar stämmer med `serOfBands`
  - vid fel visas trappan med sex små motstånd
- **Borttaget:** `dialSVG`, `rollNow` och `eSerieTol` finns inte. Ingen E-fråga visar en klocka.
- **Eldprovet:** ingen facit eller animering på de nya frågorna.
- **E6 är ovanlig:** E6-frågorna på Nykomling och Lärling har raden "E6 är ovanlig i dag …", och den syns inte på Eldprovet.
