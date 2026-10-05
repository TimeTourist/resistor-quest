# Ämnen och grader

Datum: 2026-10-05. Bygger på v2.1.0 (`f319a4f`). Allt ligger i `index.html`.

## Bakgrund

Speltester visar att spelet är för svårt och att man ska lära sig för mycket på en gång:

- **Stora kliv.** Lärling ber om hela resistansen direkt: siffror, multiplikator och prefix på en gång.
- **Text före förståelse.** Nivåkortet har 3–4 meningar, och efter varje svar kommer en lektionsrad.
- **Blandning från start.** Ungefär 40 % av frågorna gäller tidigare färdigheter, och fel på dem nollställer sviten.

Lösningen är att dela upp svårigheten i två axlar. **Ämnet** är vad man lär sig. **Graden** är hur svårt det är. Spelet lär ut i små steg, och texten kommer bara när man svarat fel.

## A. Ämnen och grader

### Ämnen (kartans band)

| Band | Nyckel | Ämne | Lär ut |
|---|---|---|---|
| 1 | `body` | Motståndet | Hur ett motstånd ser ut: antal band, vilka färger som finns, läsriktning, vilka band som är vad |
| 2 | `ohm` | Resistansen | Färgernas siffror, multiplikatorn, hela värdet med k och M |
| 3 | `tol` | Toleransen | Toleransbandets färger och vad de betyder |
| 4 | `tc` | Temperaturen | Det sjätte bandet, ppm/K |
| 5 | `e` | E-serierna | Standardvärdena |
| 🔥 | `ultra` | Eldprovet | Allt |

### Grader (inom varje ämne)

Varje ämne har exakt fem grader: **Nykomling, Lärling, Gesäll, Mästare, Stormästare** (index 0–4).

- En grad kan rymma flera frågetyper.
- Två grader får öva samma sak.
- Ämnen får överlappa varandra.

### Stegen

- **Upp:** 3 rätt i rad tar dig upp en grad. Att klara en grad betyder att få 3 rätt i rad på den.
- **Ner:** 3 fel i rad tar dig ner en grad. Ett rätt svar nollställer felräkningen, och ett fel nollställer rätträkningen.
- **Golv:** ämnets Nykomling. Man kan ramla ända dit men aldrig ut ur ämnet.
- **Tak:** 3 rätt i rad på Stormästare klarar ämnet (✓). Man spelar sedan vidare på Stormästare.
- **Byte av grad** nollställer båda räknarna. Statusraden visar en kort rad, till exempel *"Upp till Gesäll: nu med multiplikatorn"* eller *"Ner till Lärling"*.
- **Klarade grader** är den högsta grad man har klarat i ämnet (0–5). Den kan bara öka, även om man åker ner.

### Upplåsning

- Ämne 1 är alltid öppet.
- Ett ämne låses upp när man har klarat **Gesäll** i ämnet före, det vill säga **nått Mästare** (klarade grader ≥ 3).
- **Stormästare** är valfri polering och ger ✓. Inget kräver den.
- Eldprovet är alltid öppet.

### Beroenderegel

En fråga i ett ämne får bara kräva det tidigare ämnen lär ut **till och med Mästare**. Det som lärs ut på Stormästare i ett tidigare ämne (svår variant: knappsats, palett, vända motstånd) förekommer bara på Stormästare i senare ämnen.

## B. Frågor per grad

Alla flervalsfrågor har fyra alternativ.

### Motståndet

| Grad | Fråga | Raden vid fel |
|---|---|---|
| Nykomling | **Hitta felet:** fyra motstånd, ett har 3 eller 7 band | Ett motstånd har 4, 5 eller 6 band |
| Lärling | **Hitta felet:** fyra motstånd, ett har ett band i en färg som inte finns (turkos, limegrön och liknande, aldrig rosa) | Färgerna är svart, brun, röd, orange, gul, grön, blå, violett, grå, vit, guld och silver |
| Gesäll | Hur många band har motståndet? (4/5/6) | Banden numreras i bilden |
| Mästare | Vilken sida börjar man läsa från? (dagens `dir`-fråga) | Toleransbandet står för sig självt i slutet |
| Stormästare | **Peka:** peka ut siffrorna, multiplikatorn eller toleransen. Motståndet kan sitta vänt | Banden får etiketter |

### Resistansen

| Grad | Fråga | Facit vid fel |
|---|---|---|
| Nykomling | **Hitta felet:** fyra par av färg = siffra, ett är fel | Färgskalan 0–9, med det felaktiga paret markerat |
| Lärling | Ett band är markerat: vilken siffra är det? Och tvärtom: vilken färg betyder 7? | Färgskalan med rätt färg markerad |
| Gesäll | Siffrorna och antalet nollor ger ohm utan prefix: 47 + två nollor = 4700 Ω (4 band) | Banden markeras ett i taget: 4, 7, ×100 |
| Mästare | Hela värdet med k och M, 4 och 5 band, guld och silver som multiplikator (dagens läs- och byggfrågor, som flerval) | Som i dag, i kortform |
| Stormästare | Knappsats och palett, och motståndet kan sitta vänt (dagens svåra variant för `v`) | Som i dag |

### Toleransen

| Grad | Fråga | Facit vid fel |
|---|---|---|
| Nykomling | **Hitta felet:** toleransbandet är markerat, men på ett av motstånden är fel band markerat | Toleransbandet står en bit från de andra |
| Lärling | Guld eller silver: 5 % eller 10 % | Guld 5 %, silver 10 % |
| Gesäll | Alla toleransfärger (`TOL`), flerval i båda riktningarna | Toleransskalan med rätt färg markerad |
| Mästare | Vad får värdet vara? Motståndet visas och man läser värdet själv: 100 Ω ± 5 % → 95–105 Ω | Värdet ± procent, uträknat på en rad |
| Stormästare | Hela motståndet, värde och tolerans, med knappsats eller palett | Som i dag |

### Temperaturen

| Grad | Fråga | Facit vid fel |
|---|---|---|
| Nykomling | **Hitta felet:** temperaturbandet är markerat, ett av motstånden har fel band markerat | Temperaturbandet är det sjätte, efter toleransen |
| Lärling | Vilket av motstånden har ett temperaturband? (det med sex band) | Bara motstånd med sex band har ett |
| Gesäll | Färg → ppm/K och tvärtom (`TCS`) | Skalan för ppm/K med rätt färg markerad |
| Mästare | Vilket motstånd är stabilast? (lägst ppm/K) | Värdena för ppm/K skrivs ut under motstånden |
| Stormästare | Hela motståndet med sex band, knappsats eller palett | Som i dag |

### E-serierna

| Grad | Fråga | Facit vid fel |
|---|---|---|
| Nykomling | **Hitta felet:** fyra värden som text, ett finns inte i E12 | E12-raden med värdena markerade |
| Lärling | Vad betyder siffran i namnet? E12 betyder 12 värden per tiopotens | En rad om det |
| Gesäll | Vilken serie hör ihop med vilken tolerans? E12 10 %, E24 5 %, E96 1 % | Tabellen på en rad |
| Mästare | Närmaste standardvärde (dagens `series`-fråga, flerval) | Som i dag |
| Stormästare | E-seriefrågan i svår variant | Som i dag |

### Nya frågeformer

1. **Hitta felet.** Fast rubrik med egen ikon (förstoringsglas): *Hitta felet · Tre är rätt, ett är fel.* Därefter en rad om vad som gäller, till exempel *"Toleransbandet är markerat."* Fyra kort, motstånd eller värden, och man trycker på det som är fel.
   - **Facit:** de tre giltiga blir gröna och det felaktiga blir rött. Felet pekas ut på det felaktiga kortet, till exempel med en ring runt det extra bandet eller den felaktiga färgen. Ens val får en ram.
2. **Peka på band.** Man trycker direkt på ett band i motståndet. Banden är knappar med `aria-label`, och tangentbordet stöds.
   - **Facit:** rätt band blir grönt och ett felaktigt val rött.
3. **Ett markerat band.** Ett band får en ring, och frågan gäller bara det bandet.
4. **Färgskala som facit.** En liten remsa med färgerna och deras värden (siffror, multiplikator, tolerans eller ppm/K beroende på fråga), där rätt färg lyser.

Befintliga former återanvänds: läsriktning, läs, bygg, fälten ett i taget, knappsats, palett och E-serie.

## C. Text och hjälp

- **Rätt svar:** bara grönt, ingen text.
- **Fel svar:** facit visas i bilden (grönt och rött, skala, markerade band) plus **en** rad. Gäller felet något från ett tidigare ämne pekar raden dit, till exempel *"Värdet lär du dig i Resistansen."*
- **"Allt om motståndet"** finns kvar som en hopfälld sektion efter svaret, som i dag.
- **Glödlampan tas bort** helt: `bulbHTML`, `hintDlgHTML`, `openHint`, `closeHint`, `coverAnswers`, `S.usedHint`, `S.hintOpen` och CSS:en. Svårighetsstegen ersätter den.
- **Lektionsraden efter svar** (`lessonHTML`) ersätts av raden vid fel ovan.
- **`LEARN`** ersätts av en mening per ämne på nivåkortet.

## D. Lägen

- **Öva tas bort:** lägesväljaren i headern (`.modeseg`), `#partSeg`, `partActive`, `partsFor`, `S.mode` och `S.part`.
- **Spela en grad igen:** på nivåkortet för ett öppet ämne kan man välja vilken grad som helst upp till den högsta man nått. Stegen gäller som vanligt därifrån. Klarade grader minskar aldrig.

## E. Karta och nivåkort

### Kartan

- Banden har samma färger och platser som i dag.
- **Fyllnad:** varje band fylls nerifrån i fem lika delar efter klarade grader (0–5). Den ofyllda delen är dämpad.
- **Låst ämne:** grått med lås, som i dag.
- **Klart ämne:** helt fyllt med ✓.
- Den pulserande ramen visar ämnet som visas just nu, som i dag.

### Statusraden

`Resistansen · Gesäll`, tre prickar för rätt i rad, och vid behov raden om gradbyte.

### Nivåkortet

- Ämnets namn och en mening, till exempel *"Resistansen: vad färgerna betyder i ohm."*
- **Fem gradprickar:** nådda grader går att välja, och den aktuella är markerad.
- **En kort animering av begreppet**, utan motståndskropp, så att den inte upprepar kartan:
  - **Motståndet:** band dyker upp ett i taget, 4, 5 och 6, och läsriktningspilen visas.
  - **Resistansen:** brun, svart och röd lyfter och blir 1, 0 och ×100, sedan = 1 kΩ.
  - **Toleransen:** ett guldband och ± 5 %, och ett värde som pendlar mellan 95 och 105.
  - **Temperaturen:** ett sjätte band och en termometer som får värdet att röra sig lite.
  - **E-serierna:** en tallinje med E12-värdena som prickar.
- Animeringen respekterar `prefers-reduced-motion` och visas då som en stillbild.
- **Spela** finns kvar. Eldprovets kort är som i dag med ny text.

## F. Eldprovet

- **20 frågor:** 4 per ämne, alla i Stormästare-variant, utan tips, i blandad ordning.
- **Resultat per ämne:**
  - 4 av 4 rätt ger ämnet klart (klarade grader = 5, ✓).
  - 3 av 4 rätt ger klarade grader minst 3 (Mästare nådd), vilket låser upp nästa ämne.
- **Kan bara höja.** Ett sämre resultat ändrar ingenting.
- **Utlåtandet** listar per ämne *"X av 4"* och vad provet gav, till exempel *"Toleransen: upplåst till Mästare"* eller *"Temperaturen: klar ✓"*.
- **Låsta ämnen** kan låsas upp av provet. Det är meningen: provet fungerar som ett inträdesprov.
- **Poängskylten** (`examTotals`, `S.examLast`) finns kvar.

## G. Sparad progress

- **Nya nycklar i localStorage**, prefix `fargkoden2-`:
  - `fargkoden2-done`: JSON med klarade grader per ämne
  - `fargkoden2-grade`: JSON med aktuell grad per ämne
  - `fargkoden2-topic`: valt ämne
- **Gamla nycklar** (`fargkoden-level`, `fargkoden-stars`, `fargkoden-mode`, `fargkoden-part`, `fargkoden-best`) läses inte. Alla börjar om. Första besöket visar Motståndets nivåkort.

## H. Tester

- Befintliga tester skrivs om där modellen ändras: levels, flow, header och exam. Hints-testerna tas bort.
- **Nya tester:**
  - Stegen: 3 rätt upp, 3 fel ner, golv, tak, nollställning vid gradbyte, klarade grader minskar aldrig.
  - Upplåsning: Mästare nådd öppnar nästa ämne, och Stormästare klar ger ✓.
  - Hitta felet: exakt ett felaktigt kort per fråga, och facit med tre gröna och ett rött.
  - Hitta felet: den felaktiga färgen är aldrig en riktig motståndsfärg, och rosa används inte.
  - Peka på band: rätt band, och att det fungerar när motståndet sitter vänt.
  - Beroenderegeln: frågorna i varje ämne och grad använder bara färdigheter enligt tabellen.
  - Eldprovet: 4 per ämne, höjer bara, 3 av 4 låser upp och 4 av 4 klarar.
  - Text: rätt svar ger ingen text, och fel svar ger exakt en rad.
  - Progress: gamla nycklar ignoreras.
- Varje ämne och grad körs 60 gånger med växlande rätt och fel utan fel i sidan, som dagens flow-test.

## Utanför

- Färgschema, typsnitt och headerns layout utöver lägesväljaren.
- Ljud.
- Att dela upp `index.html` i flera filer.
