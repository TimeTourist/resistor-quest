# Feedback, Vilken ska bort? och Resistansens trappa

Datum: 2026-10-05. Bygger på [ämnen och grader](2026-10-05-amnen-och-grader-design.md) (`0867e63`). Allt ligger i `index2.html`.

## Bakgrund

Speltest av första versionen av ämnen och grader:

- **Rätt svar känns platt.** Det ger bara en grön ram, ingen text och inget mer.
- **Hitta felet kändes som fel svar.** När man valde rätt blev ens val rött, eftersom rött betydde "det udda", och de tre andra blev gröna.
- **Resistansen hoppar för fort.** Efter några färgfrågor kommer "Hur många ohm är motståndet?" utan att någon har sagt vilka band som är resistansen. Kunskapen om bandens roller fanns i Motståndets Stormästare, alltså i fel ämne.

## A. Feedback: spänning, utfall och flöde

Varje svar går igenom tre faser.

### 1. Spänning (gemensam för rätt och fel), cirka 1 sekund

- En gnista eller ström vandrar längs anslutningstråden in i motståndet, och ditt val pulserar.
- Ljud: *kaaaah*, ett stigande svep.
- I frågor utan motstånd (till exempel E-seriernas namn eller serie och tolerans) går gnistan längs ditt valda alternativ.

### 2. Utfall

| | Rätt | Fel |
|---|---|---|
| Bild | Lysdioden tänds grönt, gnistor sprakar och ditt val studsar och blir grönt | Strömmen fräser, en liten rökpuff stiger och ditt val blir rött |
| Ljud | *priing*, en klockton | *boh-woh-uuh*, tre fallande toner som en sorgsen trombon |

### 3. Efteråt

- **Rätt:** ingen förklaring, ingen text och ingen etikett. **Nästa fråga kommer av sig själv** cirka 1 sekund efter utfallet. Nästa-knappen behövs inte.
- **Fel:** förklaringsanimeringen för frågetypen (se D), sedan raden med regeln. **Spelet väntar på Nästa.** "Allt om motståndet" finns under kortet som i dag.

### Specialfall

- **Upp en grad:** en större fest. Det spelas en fanfar och bandet på kartan fylls synligt. Därefter kommer nästa fråga av sig själv, eller ämneskortet om ett nytt ämne låstes upp.
- **Ner en grad:** inget extra ljud utöver felljudet.
- **Eldprovet:** samma spänningsfas, men utfallet är neutralt. Det låter som ett "registrerat"-klick och man ser inte om svaret var rätt. Nästa fråga kommer av sig själv.
- **Hoppa över:** ett tryck var som helst i kortet, eller Enter, hoppar till slutbilden. Vid rätt svar hoppar det direkt till nästa fråga.
- **`prefers-reduced-motion`:** ingen spänningsfas och inga rörelser, bara slutbilden. Ljudet spelas som vanligt om det är på.
- **Inmatning är låst** under spänning och utfall, så att man inte kan svara två gånger.

### Ljud

- **Ljuden skapas med Web Audio API**, så det behövs inga filer: *kaaaah*, *priing*, *boh-woh-uuh*, fanfar och "registrerat".
- Ljudet startar först efter ett tryck, eftersom webbläsare kräver en användarhandling.
- **Ljudknapp i headern** (högtalarikon) slår av och på. Valet sparas i `fargkoden2-sound`, och ljudet är på från början.
- Ljuden ligger bakom en funktion per ljud (`sfx.spark()`, `sfx.right()` och så vidare), så att de kan bytas mot uppladdade ljudfiler senare.

## B. Vilken ska bort?

"Hitta felet" byter namn och får nya färger och rörelser.

- **Rubrik:** *Vilken ska bort?* · Tre hör ihop, en ska bort. Ikonen är en ballong eller nål.
- **Rätt** (man valde det som ska bort):
  1. Kortet blåses upp och poppar med lite konfetti och *priing*.
  2. Platsen blir tom, så att de andra korten inte flyttar sig.
  3. De tre som är kvar blir gröna.
  4. Nästa fråga kommer av sig själv.
- **Fel** (man valde ett som hör hemma):
  1. Ens kort försöker poppa, studsar tillbaka och skakar. Det låter *boh-woh-uuh*, och kortet får en röd ram.
  2. Kortet som skulle bort pulserar, och felet pekas ut på det (se D).
  3. Sedan poppar det av sig självt.
  4. De tre som är kvar blir gröna, även ens eget kort, som har kvar sin röda ram.
  5. Raden med regeln visas, och spelet väntar på Nästa.
- **Bildspråk:** poppa betyder "ska bort" och grönt betyder "hör ihop". Rött finns bara som ramen på ett felaktigt val, aldrig på det rätta svaret.
- **Slutbilden** är densamma vid rätt och fel: tre gröna kort och en tom plats.

## C. Ändrade trappor

### Motståndet

Som i dag, med ett undantag: **Stormästare** ber bara om att *peka på första bandet*, och motståndet kan sitta vänt. Pekfrågorna om multiplikatorn och toleransen tas bort, eftersom bandens roller lärs ut i respektive ämne.

### Resistansen

Klammern: en hakparentes ovanför ohm-banden (siffror och multiplikator) med texten *Resistans*. Toleransbandet, och på sex band även temperaturbandet, är nedtonat.

| Grad | Fråga | Stöd | Raden vid fel |
|---|---|---|---|
| Nykomling | **Vilken ska bort?** Klammern är ritad på fyra motstånd (blandat 4, 5 och 6 band). På tre sitter den rätt, på ett tar den med toleransen eller missar ett band | Klammern är frågan | Ohm-banden är alla band utom det sista. På sex band alla utom de två sista |
| Lärling | Färg ↔ siffra, med ett band markerat, och omvänt: vilken färg betyder 7? (som dagens Lärling) | Färgskalan i facit | *Brun är 1.* |
| Gesäll | **Vad står siffrorna för?** Fyra band, svar som "47". Ibland i stället: *peka på bandet som säger hur många nollor* | Klammer med etiketterna *siffra, siffra, nollor* | *Siffrorna är 4 och 7: 47.* respektive *Bandet efter siffrorna säger antalet nollor.* |
| Mästare | Siffror och nollor → ohm, med k och M. Bara fyra band, multiplikator svart till blå, flerval | Bara klammern | *47 och två nollor = 4 700 Ω = 4,7 kΩ.* |
| Stormästare | Fem band, guld och silver som multiplikator, knappsats eller palett, vända motstånd (som dagens Stormästare) | Inget | Som i dag |

- Dagens Nykomling-fråga (färg = siffra, ett par fel) och dagens Gesäll (siffror och nollor utan prefix) utgår. De ersätts av frågorna ovan.
- Beroenderegeln gäller fortfarande. Toleransens Mästare-fråga ("vad får värdet vara?") använder fyra band med k och M, och det lär sig man i Resistansens Mästare.

### Övriga ämnen

Nykomling i varje ämne blir **Vilken ska bort?** med samma innehåll som i dag:

- **Motståndet:** fel antal band.
- **Toleransen:** fel band markerat.
- **Temperaturen:** fel band markerat.
- **E-serierna:** ett värde som inte finns i E12.

Motståndets Lärling (en färg som inte finns) är också Vilken ska bort?.

## D. Förklaringsanimeringar vid fel

Animeringen spelar upp facit steg för steg i stället för att visa allt på en gång. Den används bara vid fel och tar 2–3 sekunder. Ett tryck eller Enter hoppar till slutbilden.

| Frågetyp | Animering |
|---|---|
| Vilken ska bort?, antal band | Banden på det udda motståndet numreras ett i taget, och den sista siffran blir röd |
| Vilken ska bort?, fel färg | En ring pulserar runt den falska färgen |
| Vilken ska bort?, markerat band eller klammer | Markeringen glider från fel plats till rätt plats |
| Vilken ska bort?, E12 | Värdet letas upp i E12-rutnätet och hittas inte |
| Färg ↔ siffra, tolerans eller ppm | Färgskalan visas, och markeringen glider från ditt val till rätt färg |
| Vad står siffrorna för?, siffror och nollor, hela värdet | Banden tänds i läsordning och siffrorna flyger ut: 4 · 7 · ×100, sedan 4 700 Ω |
| Peka på band | En pil sveper från början och banden får etiketter i tur och ordning tills den når rätt band |
| Läsriktning | Ledtråden (det breda bandet eller mellanrummet) lyser, sedan vänder motståndet sig |
| Vad värdet får vara | En tallinje där ± växer ut från värdet till gränserna |
| Stabilast | Värdet i ppm/K dyker upp under varje motstånd, och det lägsta lyfts fram |
| Räkna banden | Banden numreras ett i taget |
| E-serie (vilken serie) | Toleransen pekar ut serien, sedan letas värdet upp i den |
| Svår variant (knappsats och palett) | Fälten och banden markeras som i dag. Fel fält eller band blinkar och rätt värde glider in |

## E. Byggordning

1. **Omgång 1:**
   - spänning, utfall, ljud och ljudknapp
   - auto-nästa vid rätt, och fest vid upp en grad
   - Vilken ska bort? med ballongen och fel-flödet (inklusive animeringarna i D för Vilken ska bort?)
   - Resistansens nya trappa med klammern
   - Motståndets Stormästare
2. **Omgång 2:** förklaringsanimeringarna i D för övriga frågetyper, med färgskalan och siffror och nollor först.

## F. Tester

- **Rätt svar:** nästa fråga kommer av sig själv utan klick, och inmatning är låst under animeringen. I tester finns ett läge utan väntan (`S.instant`), och testerna kör båda lägena.
- **Fel svar:** spelet väntar på Nästa och visar en rad.
- **Hoppa över:** ett tryck eller Enter under spänningen ger slutbilden.
- **Vilken ska bort?:**
  - Vid rätt finns det valda kortet inte kvar i bild, och tre kort är gröna, inga röda.
  - Vid fel har ens kort röd ram och är grönt, kortet som skulle bort är borta och tre kort är gröna.
- **Färger:** det rätta svaret får aldrig klassen för fel (`bad`).
- **Eldprovet:** inget grönt eller rött, och nästa fråga kommer av sig själv.
- **Ljud:**
  - Ljudknappen sparar sitt läge.
  - Med ljudet av anropas inga ljud. Testerna använder en attrapp av Web Audio.
- **Resistansen:**
  - Nykomling har exakt en felaktig klammer per fråga.
  - Gesäll har bara fyra band.
  - Mästare har bara fyra band och ingen guld eller silver.
  - Stormästare har fem band.
- **Motståndets Stormästare** frågar bara efter första bandet.
- **`prefers-reduced-motion`:** slutbilden direkt.
