# Ackordkartan: ett spel om ackord, steg och lånade ackord

Datum: 2026-10-09. Status: godkänd i chatten. Omgång 1 är byggd, omgång 2 byggs.

## Syfte

Användaren gör egen musik vid pianot. I dag hittar hen ett ackord som låter bra, kanske ett till, och sedan blir det mycket provande. Målet *efter* spelet är att kunna leka med tangenterna, förstå vad det är man spelar när något låter bra och snabbt hitta intressanta riktningar att gå vidare åt.

Spelet är skolan dit. Det får vara teoretiskt, som Färgkoden: flerval, peka på en klaviatur på skärmen och bygga ackord. Ingen MIDI behövs. Spelet utgår från noll, så tonnamn, ackord, tonarter och steg ingår.

**Det här är framgång:** när användaren har klarat spelet kan hen se ett grepp och säga vad det heter och vilket steg det är i tonarten. Hen vet också vilka ackord som brukar fungera härnäst, lånade ackord inräknade.

## Två spel bakom en startsida

- `index.html` blir en **startsida** med två stora kort, *Ackordkartan* (musikteori) och *Färgkoden* (motstånd). Ett tryck öppnar spelet.
- Färgkoden flyttas oförändrad till `fargkoden.html`. Den får en länk tillbaka, "← Alla spel", överst. Testerna pekar om till den nya filen.
- Det nya spelet blir `ackord.html`. Det kopierar Färgkodens mönster men delar ingen kod med Färgkoden (vald väg A). Om fler spel delar mycket senare kan motorn brytas ut då.
- `dev.html` får en **spelväljare** överst (Färgkoden / Ackordkartan). Varje spel har en egen katalog, egna flikar och ett eget sparat läge. Prompten säger vilket spel och vilken fil den gäller. Visa öppnar rätt fil.
- Artifacten: startsidan publiceras som huvudsida på spelets fasta url. Testlägeskopior av båda spelen följer med som filer (`fargkoden.html`, `ackord.html`). Dev-sidan har kvar sin url, och Visa går till testlägeskopiorna.

## Ämnena

| # | id | Ämne | Innehåll | Omgång |
|---|---|---|---|---|
| 1 | `tangent` | Klaviaturen | Tonnamn, ♯/♭, halv- och heltonssteg, enharmoniska namn | 1 |
| 2 | `treklang` | Treklangerna | Dur, moll, dim, aug, sus; tersstaplar; namnge och bygga; flytta en ton och se vad det blir | 1 |
| 3 | `tonart` | Tonarterna | Durskalan, förtecken, kvintcirkeln, parallell moll | 2 |
| 4 | `steg` | Stegen | I ii iii IV V vi vii°, funktion (T/S/D), samma följd i alla tonarter | 2 |
| 5 | `fyrklang` | Fyrklangerna | maj7, 7, m7, m7♭5, sus/add9, omvändningar, närmaste grepp | 3 |
| 6 | `vag` | Vägarna | Kvintfall, ii–V–I, I–V–vi–IV, skenkadens, sekundärdominanter | 3 |
| 7 | `lan` | Lånade ackord | iv, ♭VI, ♭VII, ♭III från parallell moll, pikardisk ters | 4 |
| 🔥 | `ultra` | Eldprovet | Allt blandat i svåraste varianten | 4 |

Senare ämnen får en egen frågekatalog när de byggs. Idén "Vad är det här, och vilka tre ackord är rimliga härnäst?" ska vara med i Vägarna och Lånade ackord, eftersom den tränar precis den reflex användaren vill ha.

## Ramverket (samma regler som Färgkoden)

- **Grader:** Nykomling, Lärling, Gesäll, Mästare och Stormästare. Tre rätt i rad flyttar upp en grad och tre fel i rad flyttar ner en. `done` minskar aldrig. Mästare (tre klarade grader) ger nyckeln till nästa ämne. När Stormästare är klar blir ämnet gyllene och spelas blandat, med svit och rekord.
- **Startrutnätet:** åtta minikort med ministapel, lås, kedjor, dimma och nyckel. Nyckeln vrids om, och kortet zoomas upp till spelkortet.
- **Omslaget:** första gången ett ämne öppnas visas ämnets animering, namnet, en rad om ämnet och en *snabbkoll* (en lätt fråga). Rätt svar vänder kortet.
- **Svaret:** gnista, sedan utfall. Rätt svar går vidare av sig själv. Fel svar visar **felanimeringen**, och handen ▼ väntar tills animeringen och stapeln är klara (`S.lockUntil`). `S.instant` och `reduceMotion()` hoppar över animeringen.
- **Testläget:** `?test=true` eller `data-test="true"`. Det ger gröna pilar på rätt svar och testraden (Lås upp nästa ämne, Börja om, Dölj rätt svar). Med `&topic=…&grade=…` visas ämnet på en viss grad, ingenting sparas och graden står still.
- **Lagring:** `localStorage` med prefixet `ackord1-`, alltid inom try/catch.
- **Ämnen som inte är byggda** visas som låsta kort med etiketten *Kommer snart*. De går inte att öppna. En nyckel som har förtjänats sparas ändå och sitter i låset när ämnet byggs. Eldprovet visas också som *Kommer snart* tills omgång 4.

## Klaviaturen (komponent)

- En SVG-klaviatur med två oktaver, C4–B5: 14 vita och 10 svarta tangenter.
- Den kan **visa** tangenter: tända i accent, ok eller bad, med tonnamn på tangenten och en etikett ovanför.
- Den kan **ta emot** svar: varje tangent är en knapp, och valda tangenter markeras. Tangenterna fungerar med tangentbordet (Enter/mellanslag), och varje tangent har ett tonnamn som aria-label. En svarsknapp skickar svaret.
- **Felanimeringarna** ritas på samma klaviatur. Tangenter tänds i tur och ordning, bågar med siffror visar avstånd i halvtoner och namn dyker upp.
- Rättningen jämför **tonklasser** (C = 0 … B = 11), så alla oktaver räknas som rätt. Undantaget är frågor som uttryckligen gäller en bestämd tangent.

## Tonnamn

- Spelet använder internationella namn: **B är tonen mellan A♯ och C**, och B♭ är tonen under den (svenska H heter alltså B här). En rad på klaviaturens omslag säger det.
- Tonerna stavas efter bokstavsordningen. I ett ackord är tersen bokstaven två steg upp och kvinten bokstaven fyra steg upp. Därför heter tersen i F♯ A♯, inte B♭. Ackord som skulle kräva dubbelkors eller dubbelbe frågas inte.

## Ljud

- Ljudet är syntetiskt piano med Web Audio: ett anslag och en avklingning, inga ljudfiler.
- Ett grepp som visas i en fråga **spelas en gång** automatiskt. Knappen **"Spela igen"** finns bredvid greppet.
- Felanimeringen spelar upp det rätta svaret en gång. Ett ackord klingar som ett anslag, och en räkning tangent för tangent spelar tonerna en i taget.
- Ljudknappen överst stänger av allt ljud, och valet sparas.
- Spelljuden (gnista, priing, trombon, fanfar, nyckel) är samma sorts ljud som i Färgkoden.

## Omgång 1: frågekatalog

Varje rad har en felanimering, som alltid.

### Klaviaturen (`tangent`)

| Grad | Frågetyp | Fråga | Felanimering |
|---|---|---|---|
| Nykomling | Flerval | En vit tangent är markerad. Vad heter den? C-tangenterna har sina namn som stöd. | Räkna från närmaste C uppåt: tangenterna tänds en i taget med namn (C, D, E …) och tonen klingar, tills rätt tangent blir grön. |
| Lärling | Peka | Peka på F (vita tangenter, C-namnen som stöd). | Samma räkning från C. Din tangent är röd och den rätta grön. |
| Gesäll | Flerval | En svart tangent är markerad. Vad heter den? Varje alternativ är ett par, till exempel "C♯ / D♭". | Grannarna tänds: vit tangent till vänster + ♯ (pil åt höger, "+1 halvton"), vit tangent till höger + ♭ (pil åt vänster). Den svarta får båda namnen. |
| Gesäll | Flerval | Två tangenter är markerade. Är det ett halvtonssteg eller ett heltonssteg? | En båge för varje halvtonssteg mellan tangenterna, numrerade 1, 2. |
| Mästare | Peka | Peka på D♭ (alla tolv namn, inga namn på tangenterna). | Som Gesällens grannar, med båda namnen. |
| Mästare | Flerval | Ett halvtonssteg upp från E. Vad kommer du till? Svaren är ofta E–F och B–C. | Bågen från E tar ett steg till F. Raden: "Mellan E och F, och mellan B och C, finns ingen svart tangent." |
| Stormästare | Peka | Gå tre halvtonssteg upp från A. Peka. | Bågar 1, 2, 3 från starttangenten, och tonerna klingar. |
| Stormästare | Flerval | Vilken tangent är också E♯ (eller F♭, C♭, B♯)? | ♯ flyttar ett halvtonssteg upp från E, och det landar på F. |

Snabbkoll: "Hur sitter de svarta tangenterna?" Rätt svar: "I grupper om två och tre". De andra alternativen är "En mellan varje vit", "I grupper om fyra" och "Helt slumpat".

### Treklangerna (`treklang`)

| Grad | Frågetyp | Fråga | Felanimering |
|---|---|---|---|
| Nykomling | Flerval (Dur / Moll) | Ett ackord med vit grundton visas med namn på tangenterna och spelas. Är det dur eller moll? | Bågar från grundtonen till tersen räknar halvtonerna. 4 betyder stor ters (dur), 3 betyder liten ters (moll). Ackordet klingar. |
| Lärling | Flerval | Vilket ackord är det här? Vit grundton, dur eller moll, namn på tangenterna. | Grundtonen tänds med "grundton". Bågen till tersen visar 3 eller 4 halvtoner och därmed m eller inget m. Namnet byggs ihop. |
| Gesäll | Peka (flera tangenter) | Ta ackordet D. Alla tolv grundtoner, dur och moll, inga namn. | Tersstaplingen: grundtonen, +4 (eller +3) till tersen, +3 (eller +4) till kvinten. Tangenterna tänds en i taget med bågar, och sedan klingar ackordet. |
| Mästare | Flerval | Vilket ackord är det här? Alla kvaliteter: dur, moll, dim, aug, sus2, sus4. Inga namn. | Avstånden visas med bågar (grundton→ters, ters→kvint), och en tabellrad visar vilken kvalitet mönstret ger: 4+3 dur, 3+4 moll, 3+3 dim, 4+4 aug, 2+5 sus2, 5+2 sus4. |
| Mästare | Flerval | Vilka toner ingår i F♯m? Alternativen är stavade, och ett av de felaktiga är en felstavning (G♭ A D♭). | Bokstäverna räknas F – (G) – A – (B) – C: ters och kvint ligger två bokstäver upp, och sedan ger halvtonerna ♯. |
| Stormästare | Flerval | Du spelar C. Flytta tersen ett halvtonssteg ner. Vad spelar du nu? (Flytta ters eller kvint upp/ner, eller byt tersen mot sekund eller kvart.) | Tonen glider på klaviaturen från gammal till ny plats, båda ackorden klingar efter varandra och det nya namnet visas. |
| Stormästare | Peka (flera tangenter) | Ta ackordet B♭dim (alla kvaliteter, inga namn). | Tersstaplingen som på Gesäll, med kvalitetens avstånd. |

Snabbkoll: "Hur många toner har en treklang?" Svaren är 3 (rätt), 2, 4 och 7.

## Omgång 2: frågekatalog

Skalor tas på klaviaturen med sju tangenter och Svara, på samma sätt som ackord. Därför behövs ingen Ordna-frågetyp: tonhöjden ger ordningen. Kvintcirkeln ritas som en egen liten bild i förklaringsrutan. Durtonarterna går upp till fem förtecken (F♯ och G♭ bara i kvintcirkeln), och molltonarterna är naturlig moll.

### Tonarterna (`tonart`)

| Grad | Frågetyp | Fråga | Felanimering |
|---|---|---|---|
| Nykomling | Flerval | G-dur: G A B C D ? F♯. Vilken ton fattas? Skalan visas med namn (C, G, F, D, B♭). | Skalan går upp ton för ton med bågar märkta *hel* och *halv*, mönstret hel-hel-halv-hel-hel-hel-halv. Den saknade tonen blir grön. |
| Lärling | Peka (sju tangenter) | Ta G-durskalan (upp till fyra förtecken). | Samma skalvandring från grundtonen, och tonerna spelas en i taget. |
| Gesäll | Flerval | Hur många förtecken har D-dur? (2 ♯, 3 ♯, 1 ♯, 2 ♭) | Skalvandringen. Tangenterna som behöver ♯ eller ♭ blir gröna och listas: "D-dur har F♯ och C♯". |
| Mästare | Flerval | Vilken durtonart har tre ♭? | Kvintcirkeln: från C ett steg i taget medsols (♯) eller motsols (♭), med räkningen 1, 2, 3 tills rätt tonart lyser. |
| Mästare | Flerval | Vilken är parallell moll till F-dur? | Tre halvtonssteg ner från grundtonen (bågar 1, 2, 3), och mollackordet klingar. Raden: samma toner, samma förtecken. |
| Stormästare | Flerval | Hur många förtecken har F♯m? | Tre halvtonssteg upp till parallell dur, och sedan kvintcirkeln fram till den. |
| Stormästare | Peka (sju tangenter) | Ta skalan E-moll (naturlig moll). | Skalvandring med mollens mönster hel-halv-hel-hel-halv-hel-hel. |

Snabbkoll: "Hur många olika toner har en durskala?" Svaren är 7 (rätt), 8, 5 och 12.

### Stegen (`steg`)

Stegen i dur är I ii iii IV V vi vii°: dur, moll, moll, dur, dur, moll, förminskat. Funktionerna är tonika (I, iii, vi), subdominant (ii, IV) och dominant (V, vii°).

| Grad | Frågetyp | Fråga | Felanimering |
|---|---|---|---|
| Nykomling | Flerval | I C-dur: vilket steg är det här ackordet? Ackordet visas med namn och spelas. | Skalan tänds ton för ton med stegsiffror under, fram till ackordets grundton. Sedan staplas ackordet med skalans toner, varannan ton. |
| Lärling | Flerval | I G-dur: vilket ackord är vi? (C, G, F) | Stegräkningen, sedan staplingen med bågar: +3 och +4 ger moll. |
| Gesäll | Flerval | I D-dur: vilket ackord är V? Alla durtonarter. | Samma som Lärling. |
| Gesäll | Peka (flera tangenter) | I F-dur: ta IV. | Samma, och ackordet klingar. |
| Mästare | Flerval | Am i C-dur: vilket steg? Alla durtonarter. | Stegräkningen fram till ackordets grundton. |
| Mästare | Flerval | I C-dur: vilken funktion har Am? (Tonika, Subdominant, Dominant) | Huvudackordet för funktionen (C) tänds, och sedan Am. De gemensamma tonerna märks. En tabell visar grupperna, med rätt rad markerad. |
| Stormästare | Flerval | I–V–vi–IV i C-dur är C G Am F. Vad blir det i D-dur? | En tabell: stegen överst, C-dur under och sedan den nya tonarten, ackord för ackord. Följden spelas i den nya tonarten. |
| Stormästare | Flerval | Dm, G och C: vilken durtonart hör de hemma i? | Rätt tonart visas med steg under tangenterna, och varje ackord får sitt steg: Dm = ii, G = V, C = I. |

Snabbkoll: "Vilket steg är hemma, där en låt brukar sluta?" Svaren är I (rätt), V, IV och vi.

## Testning

- Tester i `node --test` med jsdom, som i dag, med en egen harness för `ackord.html` (`tests/ackord-harness.mjs`).
- Musikteori: stavning av treklanger i alla tolv tonarter och kvaliteter, och tonklassjämförelse. Inga dubbelkors eller dubbelbe i frågorna.
- Ramverk: trappan upp och ner, nyckeln vid Mästare, att *Kommer snart* inte går att öppna, förhandsvisningen sparar inget, testraden.
- Varje frågetyp: rätt och fel svar på varje grad, och att felanimeringen låser tills den är klar.
- Startsidan: två länkar till rätt filer. Färgkodens befintliga tester passerar mot `fargkoden.html`.
- dev.html: spelväljaren, att katalogen täcker varje byggt ämne och grad i Ackordkartan, och att prompten nämner rätt spel och fil.

## Utanför omgång 1

Ämnena 3–7, Eldprovet, Ordna-frågor (behövs för skalor i Tonarterna), MIDI och gehörsträning.
