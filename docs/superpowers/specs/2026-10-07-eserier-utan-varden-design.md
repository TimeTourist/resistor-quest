# E-serierna: förstå serierna utan att kunna värdena

Datum: 2026-10-07. Bygger på [2026-10-06-eserier-klocka-och-linjal-design.md](2026-10-06-eserier-klocka-och-linjal-design.md): klockan, linjalen och toleransstaplarna finns kvar. Allt ligger i `index.html`, och frågetyperna beskrivs i `dev.html`.

## Bakgrund

E-serierna är fortfarande för opedagogiska.

- Nykomling börjar med "Vad betyder 12 i E12?" och svaret "12 värden på varje varv". Ingen fråga säger vad en E-serie är eller varför den finns.
- Mästare och Stormästare kräver att man kan värdena utantill. "Inte i E12" och "Vilken serie?" med svaret "Inte standard" går bara att svara på om man vet att till exempel 4,3 finns i E24 men inte i E12. Det behöver en elev inte kunna, för värdena slår man upp i en tabell.

## Målet

Eleven ska förstå tre saker, och ingen grad kräver att man kan några värden utantill:

1. **Vad en E-serie är.** Motstånd säljs bara i vissa standardvärden. E12 delar 10–100 i 12 steg, där varje steg är ungefär lika stort i procent. Sedan upprepas samma siffror med en nolla till: 100, 120, 150 …
2. **Serie och tolerans hör ihop.** E6 är gjord för ±20 %, E12 för ±10 %, E24 för ±5 %, E48 för ±2 %, E96 för ±1 % och E192 för ±0,5 % och finare. Med den toleransen når varje värde fram till grannen, så alla resistanser täcks. Räcker ±10 % för ett bygge räcker E12.
3. **Toleransbandet visar serien.** Titta på motståndet: guld betyder E24, silver E12 och tre band (inget toleransband) E6.

E3 (±40 %) är inte med. Det finns inget toleransband för ±40 %, så serien går inte att läsa av på ett motstånd.

## Graderna

| Grad | Mål | Frågor |
|---|---|---|
| Nykomling | Vad en E-serie är | Vad betyder 12 i E12? (klockan) · Vad är E12? |
| Lärling | Serie och tolerans | Serie ↔ tolerans · Vilken serie räcker? · Vilken tolerans är E12 gjord för? (staplarna) · Vilken serie tillhör motståndet? med toleransen utskriven |
| Gesäll | Toleransbandet visar serien | Vilken serie tillhör motståndet? Guld, silver, brun, röd och tre band. |
| Mästare | Samma sak, svårare | Vilken serie tillhör motståndet? Också grön, blå och violett, sex band och vända motstånd · Samma siffror, annan multiplikator |
| Stormästare | Allt blandat | Slumpas bland Lärlings, Gesälls och Mästares frågor i de svåraste varianterna |

Eldprovet tar som förut frågorna från Stormästare.

### Nykomling

Graden blandar två frågor.

1. **Vad betyder 12 i E12?** Frågan, klockan och animeringen är som i dag, men svaren och raden ändras.
   - Svaren: "10–100 är uppdelat i 12 steg" (rätt), "±12 % tolerans", "Värden upp till 12 kΩ" och "12 färgband".
   - Raden vid fel: "E12 delar 10–100 i 12 steg. Varje steg är ungefär 20 % större än det förra. Sedan börjar det om med en nolla till: 100, 120, 150 …"
2. **Vad är E12? (ny)**
   - Svaren: "Standardvärden som motstånd säljs i" (rätt), "En färgkod för motstånd", "Ett motstånd på 12 Ω" och "En tolerans på ±12 %".
   - Klockan med E12 visas efter svaret, som i fråga 1.
   - Raden vid fel: "E12 är en lista med standardvärden. Motstånd tillverkas inte i alla värden, bara i de här 12 och samma siffror gånger 10, 100, 1000 …"

### Lärling

Graden blandar fyra frågor.

1. **Serie ↔ tolerans.** "Vilken tolerans hör till E24?" och "Vilken serie hör till ±5 %?" flyttas oförändrade från Gesäll.
2. **Vilken serie räcker? (ny)**
   - Frågan: "Ditt bygge tål ±10 %. Vilken serie räcker, med så få värden som möjligt?" Toleransen slumpas bland ±20 %, ±10 %, ±5 %, ±2 % och ±1 %.
   - Svaren är fyra serier: den rätta, den närmast grövre (räcker inte), den närmast finare (räcker men har fler värden än man behöver) och en till. För ±20 %, där det inte finns någon grövre, tas två finare.
   - Raden vid fel: "±10 % räcker, och E12 är gjord för ±10 %. E6 är för grov (±20 %). E24 och finare fungerar också, men har fler värden än du behöver."
3. **Vilken tolerans är E12 gjord för?** Frågan med toleransstaplarna flyttas oförändrad från Gesäll.
4. **Vilken serie tillhör motståndet? med toleransen utskriven (ny).** Samma fråga som på Gesäll, men toleransen står under motståndet, till exempel "±5 %". Man övar på att gå från tolerans till serie med motståndet framför sig, innan man själv måste läsa av bandet på Gesäll.

### Gesäll: Vilken serie tillhör motståndet?

- **Frågan (ny):** ett motstånd visas och frågan är "Vilken serie tillhör motståndet?". Svaren är E6, E12, E24, E48 och E96.
- **Motståndet:** ett standardvärde ur serien, med seriens toleransband. Fyra band för E12 och E24, tre band för E6 och fem band för E48 och E96. Motståndet sitter alltid rättvänt, och värdet står inte utskrivet.
- **Bara toleransbandet avgör.** Värdet finns alltid i serien, så svaret "Inte standard" finns inte.
- **Efter svaret, rätt eller fel,** får toleransbandet en ring.
- **Vid fel förklarar en animering varför bandet hör till serien,** i tre steg på ungefär 2 s:
  1. Ringen runt toleransbandet pulserar.
  2. En lapp med bandets färg och toleransen, "Guld ±5 %", glider ut från bandet och lägger sig under motståndet.
  3. En pil går från lappen till serien, "→ E24", och den rätta svarsknappen lyser upp.

  För tre band pulserar platsen där toleransbandet skulle ha suttit, och lappen säger "Inget band ±20 %".
- **Raden vid fel:** "Titta på toleransbandet längst till höger: guld är ±5 %, och ±5 % är E24."
- **Låset vid fel** väntar in animeringen, som vid de andra felanimeringarna. Med minskad rörelse och i testerna visas slutläget direkt: ringen, lappen och pilen.
- **Samma facit** används på Lärling, Mästare och Stormästare.

### Mästare

Graden blandar två frågor.

1. **Vilken serie tillhör motståndet, svårare.** Samma fråga som på Gesäll, med tre skillnader:
   - E192 kommer med: grönt (±0,5 %), blått (±0,25 %) och violett (±0,1 %) toleransband. Värdet tas ur E96, som ingår i E192. Svaren är E6, E12, E24, E48, E96 och E192.
   - Hälften av motstånden med fem band får ett sjätte band, temperaturbandet. Raden vid fel säger då att toleransbandet är det näst sista.
   - Hälften av motstånden sitter vända, som på Ohm och Toleransen. Man får hitta toleransbandet själv: det breda bandet med mellanrum.
2. **Samma siffror, annan multiplikator (ny).**
   - Frågan: "3,3 Ω finns i E6. Vilken av resistanserna finns inte i E6?" Det är en "Vilken ska bort?"-fråga.
   - Ledtråden är ett värde ur E6 eller E12 i ohm, som 3,3 Ω, 4,7 Ω eller 1,2 Ω. Den står i frågan, så man behöver inte kunna serien.
   - Tre svar har samma siffror med andra multiplikatorer, till exempel 33 Ω, 330 Ω och 3,3 kΩ. Det udda har siffror nära ledtråden, som 2,9 kΩ eller 3,6 kΩ, och finns inte i serien.
   - Efter svaret markeras det udda svaret som på de andra "Vilken ska bort?"-frågorna.
   - Raden vid fel: "Samma siffror, 3 och 3, med olika multiplikator: 33 Ω, 330 Ω och 3,3 kΩ finns alla i E6. 2,9 kΩ har siffrorna 2 och 9."

### Stormästare

- Slumpas bland serie ↔ tolerans, vilken serie räcker och Mästares två frågor.
- Facit vid fel är detsamma som på respektive grad.

## Det som försvinner

- **"Vilken serie är det här?" (räkna prickarna på klockan).** Klockan finns kvar i Nykomlings frågor.
- **"Inte i E12"** med värdena som faller ner på linjalen.
- **"Vilken serie?" med "Inte standard" som svar,** både med och utan utskrivet värde. Svarsknappen "Inte standard", genereringen av värden som inte är standard (`genSeriesRead` med `none` och `cross`) och linjalen med värdet markerat (`seriesRuler`) tas bort när inget längre använder dem.
- **`rulerSVG` med `marks`** tas bort om ingen fråga längre använder det. Linjalen och utrullningen finns kvar för toleransstaplarna.

## Det som inte ändras

- Snabbkollen på E-seriernas omslag.
- Klockan, linjalen, utrullningen och toleransstaplarna.
- E-seriernas data (`E6`–`E96`, `SER_TOL`, `TOL_SER`).

## dev.html

Raderna för `e` i `CATALOG` skrivs om så att de stämmer med graderna ovan:

| Rad | Grad |
|---|---|
| `e-namn` | 0 |
| `e-vad` (ny) | 0 |
| `e-serie-tol`, `e-tol-serie` | 1 |
| `e-racker` (ny) | 1 |
| `e-tol-staplar` | 1 |
| `e-band-tol` (ny) | 1 |
| `e-band` (ny) | 2 |
| `e-band-svar` (ny) | 3 |
| `e-multi` (ny) | 3 |
| `e-blandat` (ny) | 4 |

`e-klocka`, `e-e12`, `e-serie-hjalp` och `e-serie` tas bort.

## Tester

- **Beroenderegeln** i `model.test.mjs` för `e` blir: choice, choice eller series, series, choice eller series, choice eller series.
- **Inga värden behövs:** ingen fråga i E-serierna har "Inte standard" som svar, och ingen fråga kräver att man vet om ett värde finns i en serie utan att få det i frågan.
- **Nykomling:**
  - Båda frågorna förekommer.
  - "Vad betyder 12 i E12?" har rätt svar "10–100 är uppdelat i 12 steg".
  - Efter svaret har klockan 12 prickar.
- **Lärling, vilken serie räcker:**
  - Det rätta svaret är serien som är gjord för toleransen.
  - Svaren innehåller en grövre serie när det finns en, och alltid en finare.
- **Lärling, vilken serie tillhör motståndet:** toleransen står utskriven och stämmer med bandet.
- **Gesäll:**
  - Toleransen står inte utskriven.
  - Svaret följer bara toleransbandet (`TOL_SER`, och tre band ger E6).
  - Värdet finns alltid i serien.
  - Motståndet sitter rättvänt och har tre, fyra eller fem band.
  - Efter svaret har toleransbandet en ring.
  - Vid fel finns lappen med bandets färg och tolerans och pilen till serien, och låset väntar in animeringen.
- **Mästare:**
  - E192 förekommer, med grönt, blått eller violett band och ett värde ur E96.
  - Motstånd med sex band och vända motstånd förekommer.
  - I multiplikatorfrågan har de tre rätta svaren samma siffror som ledtråden, och det udda finns inte i serien.
- **Stormästare:** frågorna kommer från alla fyra frågetyperna ovan.
