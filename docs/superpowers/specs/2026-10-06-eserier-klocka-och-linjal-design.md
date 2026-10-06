# E-serierna: klockan och linjalen

Datum: 2026-10-06. Skiss: https://claude.ai/artifact/Tt1mCtJVu5DhMBN725XT2U, kopia i [2026-10-06-eserier-skiss.html](2026-10-06-eserier-skiss.html). Allt ligger i `index.html`, och frågetyperna beskrivs i `dev.html`.

## Bakgrund

E-serierna är för svåra och för tråkiga.

- Nykomling börjar med det svåraste: "Tre av värdena finns i E12", där man måste kunna E12 utantill.
- Allt är text och tabeller. Inget visar vad en serie är.
- Varför E12 hör ihop med ±10 % förklaras aldrig. Man får bara en rad att plugga in: "E6 ±20 %, E12 ±10 % …".

Målet är att serierna introduceras lätt och visas med bilder, så att eleven får en känsla för dem i stället för att plugga tabeller.

## Idén: klockan som rullas ut till en linjal

- **Klockan.** Ett varv är värdena från 10 till 100. Prickarna sitter där värdena hamnar på en logaritmisk skala, så de står jämnt runt varvet. Efter 82 kommer 100, och då börjar ett nytt varv med en nolla till.
  - Serierna dubblas: E6 är varannan timme, E12 varje timme och E24 varje halvtimme. E6-värdena finns i E12, och E12-värdena finns i E24, så prickarna sitter verkligen på samma platser.
  - Urtavlan har 24 svaga streck (heltimmar längre, halvtimmar kortare) men inga siffror, så att den inte låser tanken vid 12.
- **Linjalen.** Klockan rullad ut: en sträcka från 10 till 100 med samma prickar och 100 sist i grått. Linjalen används när toleransen kommer in, eftersom staplar syns bäst på en rak linje.
- **Övergången.** Första gången eleven får en linjalfråga rullas klockan ut till linjalen. Det är en egen animering på ungefär 1,4 s.

## Graderna

| Grad | Fråga | Bild | I dag |
|---|---|---|---|
| Nykomling | Vad betyder 12 i E12? | Klockan | Lärling |
| Lärling | Vilken serie är det här? | Klockan | ny |
| Gesäll | Vilken tolerans är E12 gjord för? eller Serie ↔ tolerans | Linjalen med toleransstaplar | Serie ↔ tolerans som text |
| Mästare | Tre av värdena finns i E12 (Inte i E12) eller Vilken serie, med värdet utskrivet | Linjalen som facit | Nykomling och Mästare |
| Stormästare | Vilken serie, utan hjälp | Linjalen som facit | som i dag |

### Nykomling: Vad betyder 12 i E12?

- Frågan är som dagens Lärlingsfråga, men serien är alltid E12 på Nykomling. Svaren är "12 värden på varje varv", "±12 % tolerans", "Värden upp till 12 kΩ" och "12 färgband".
- En tom klocka med E12 i mitten visas ovanför svaren.
- **Efter svaret, rätt eller fel,** poppar de 12 prickarna in en i taget runt varvet. Varje prick är numrerad 1–12 i grönt innanför, och värdet står utanför. Över tolvslaget står "100 = nytt varv, ×10".
- **Raden vid fel:** "E12 har 12 värden på ett varv, från 10 till 82. Sedan kommer 100 och samma värden igen med en nolla till: 120, 150, 180 …"

### Lärling: Vilken serie är det här?

- En klocka med 6, 12 eller 24 prickar utan värden. I mitten står ett frågetecken.
- Svaren är E6, E12, E24 och E48.
- **Efter svaret** får prickarna sina värden, och för E6 och E12 numreras de. På E24 står bara värdena, eftersom 24 nummer blir för trångt.
- **Raden vid fel:** "12 prickar på varvet, alltså E12. En prick på varje timme." För E6 står "varannan timme" och för E24 "varje halvtimme".

### Gesäll: Vilken tolerans är E12 gjord för?

Gesäll blandar två varianter.

1. **Toleransen med staplar (ny).**
   - Frågan är "Vilken tolerans är E12 gjord för?" med serien E6, E12 eller E24.
   - Svaren är tre: en för stor tolerans, den rätta och en för liten. För E6 är den rätta ±20 %, för E12 ±10 % och för E24 ±5 %. För stor är nästa större (för E6 ±50 %), och för liten är ±1 %.
   - Ovanför svaren står linjalen med seriens prickar och värden.
   - **Efter svaret, rätt eller fel,** visas tre rader med linjalen och en toleransstapel runt varje värde, en rad per svar. Raden man valde har en ram. Varannan stapel ligger lite högre så att krock och glapp syns.
     - Krock, där två staplar överlappar, markeras rött på linjen.
     - Glapp, där staplarna inte når varandra, markeras gult.
     - Bara avvikelser över 3 % av linjalens längd markeras. Det betyder att den rätta toleransen ser ren ut, fast de avrundade värdena ger små glapp och överlapp.
   - Raderna har var sin text: "för stor: staplarna krockar, 10 Ω kan vara 12 Ω", "lagom: staplarna möts ungefär kant i kant" och "för liten: glapp mellan värdena". Exempeltexten i den första raden räknas fram ur seriens två första värden.
   - **Raden vid fel:** "E12 är gjord för ±10 %. Då når varje värde ungefär fram till grannen, och alla resistanser mellan 10 och 100 täcks. Röd är krock, gul är glapp."
2. **Serie ↔ tolerans (som i dag).** "Vilken tolerans hör till E24?" och "Vilken serie hör till ±5 %?" ligger kvar oförändrade, med raden "E6 ±20 %, E12 ±10 % …".

### Mästare

Mästare blandar två frågetyper.

1. **Inte i E12, som är dagens Nykomling.**
   - Frågan och svaren är som i dag: tre värden finns i E12 och ett finns inte ens i E24.
   - **Efter svaret, rätt eller fel,** visas linjalen med E12-prickarna i stället för dagens rutnät (`.egrid`). Varje värde faller ner på linjalen med en kort fördröjning. De tre som finns landar på en prick med en grön bock, och det udda hamnar mellan två prickar med ett rött kryss och streckad linje.
   - **Raden vid fel:** "Ta bort nollorna och prefixet: 6,4 hamnar mellan prickarna och finns inte i E12. De andra landar på en prick."
2. **Vilken serie, med värdet utskrivet.** Den är som dagens Mästare. Facit vid fel beskrivs under Stormästare.

### Stormästare: Vilken serie, utan hjälp

- Frågan är som i dag.
- **Facit vid fel** får linjalen för den serie toleransbandet pekar ut, med värdet markerat på samma sätt som i Mästare: grön bock på en prick, eller rött kryss mellan prickarna. Den befintliga raden från `seriesWhy()` står kvar under.
- För E48, E96 och E192 blir prickarna för många för värden. Där visas bara prickarna och värdet som markeras.

## Övergången från klocka till linjal

- Linjalen visas med animeringen första gången per sidladdning som en linjalfråga visas, oavsett grad. Därefter visas linjalen direkt.
- Varje punkt på varvet glider från sin plats på cirkeln till sin plats på linjen, med 1,4 s ease-in-out. Värdena tonas in medan det rullas ut.
- Med minskad rörelse och i testerna (`S.instant`) visas linjalen direkt.

## Det som inte ändras

- Snabbkollen på E-seriernas omslag ("Motstånd säljs i standardvärden …").
- Eldprovet, som tar frågorna från Stormästare.
- E-seriernas data (`E6`–`E96`, `SER_TOL`, `seriesOf`).

## Bilderna i koden

- **Två ritfunktioner som ger SVG som sträng,** i samma stil som `svg()` och `scaleHTML()`:
  - `dialSVG(n, {labels, count, mark})` ritar klockan med serien `n` (6, 12 eller 24).
  - `rulerSVG(n, {tol, marks})` ritar linjalen. `tol` ger toleransstaplar och `marks` är en lista med värden att släppa ner, `[{v, ok}]`.
- **Utrullningen** är en egen funktion som animerar på det befintliga elementet efter att kortet ritats, på samma sätt som de andra felanimeringarna, och respekterar `S.instant` och `reduceMotion()`.
- **Färgerna** tas från spelets tokens: accent för prickar, `--ok` och `--bad` för bock och kryss, och en gul token för glapp. Det fungerar i både ljust och mörkt läge.
- **Telefonbredd.** Klockan är högst cirka 330 px bred, och linjalen fyller kortets bredd. Värdena på linjalen är små men får plats på 360 px.

## dev.html

Raderna för `e` uppdateras så att de stämmer med graderna ovan:

- `e-namn` flyttas till 0 och `e-e12` till 3.
- `e-klocka` läggs till på 1.
- `e-tol-staplar` läggs till på 2, och de två serie ↔ tolerans-raderna står kvar.
- Animeringskolumnen beskriver bilderna. "behöver animering" tas bort för de rader som får klockan eller linjalen.

## Tester

- Graderna använder rätt frågor. Beroenderegeln i `model.test.mjs` fortsätter att gälla för `e`: choice, choice, choice, choice eller series, och series.
- Nykomling frågar alltid om E12. Efter svaret har klockan 12 prickar, och det gäller både rätt och fel svar.
- Lärling: antalet prickar stämmer med det rätta svaret.
- Gesäll:
  - Toleransfrågan har tre svar, och det rätta stämmer med `SER_TOL`.
  - Efter svaret finns tre stapelrader, och den valda har en ram.
  - Raden för för stor tolerans har krockmarkeringar, raden för för liten tolerans har glappmarkeringar och den rätta har inga.
- Mästare:
  - Inte i E12 ritar linjalen i stället för rutnätet.
  - Det udda värdet markeras som fel och de andra som rätt.
- Stormästare: facit vid fel har linjalen med värdet markerat.
- Utrullningen körs en gång per sidladdning, och inte alls med `S.instant`.
