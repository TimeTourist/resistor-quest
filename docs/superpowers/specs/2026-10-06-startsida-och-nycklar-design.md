# Startsida med ämneskort, omslag och nycklar

Datum: 2026-10-06. Skiss: https://claude.ai/artifact/CWLmDUTjvbGYzYzTMyLaBk, kopia i [2026-10-06-startsida-skiss.html](2026-10-06-startsida-skiss.html). Allt ligger i `index.html`.

## Bakgrund

Frågorna fungerar, men layouten gör det inte:

- **Kartan är svår att förstå.** Motståndet som meny är en bra idé, men man ser inte vad banden är eller vilka ämnen det finns.
- **Läget visas på flera ställen.** Statusraden, kartans band och stapeln som glider ner visar samma sak. Stapeln täcker dessutom kartan.
- **Sidan öppnar på en fråga.** Man får aldrig en överblick.
- **Startkortet har ingen egen identitet.** Det ser ut som vilket frågekort som helst.

Kraven:

- Det ska se rent ut.
- Man ska förstå vid första blicken vad man ska göra.
- Varje ämne ska tydligt visa vad det är.
- Det ska vara tydligt att man när som helst kan göra Eldprovet.
- Varje startkort behöver en tydlig identitet.
- Det ska vara kul att låsa upp nästa ämne.

## Översikt

Spelet får två lägen:

1. **Startsidan:** ett rutnät med sex minikort, ett för vart och ett av de fem ämnena och ett för Eldprovet.
2. **Spelkortet:** ett minikort som zoomats upp. Där spelar man. Man minimerar tillbaka till startsidan.

Sidan öppnar alltid på startsidan. Kartan, statusraden och stapeln som glider ner tas bort.

## A. Startsidan

### Layout

```
Dator (3×2)                         Mobil (2×3)
FÄRGKODEN                 [ljud]    FÄRGKODEN    [ljud]
Tryck på … / Välj ett ämne …        Tryck på … / Välj …
[Motståndet] [Resistansen] [Toleransen]     [Motst.] [Resist.]
[Temperaturen] [E-serierna] [Eldprovet]     [Toler.] [Temp.]
                                    [E-ser.] [Eldprov]
```

- Fast ordning: Motståndet, Resistansen, Toleransen, Temperaturen, E-serierna och sist Eldprovet. Ordningen ändras inte efter läge.
- Tre kolumner från 720 px bredd, annars två. Hela rutnätet syns utan att man skrollar på en vanlig mobil.
- Överst: spelets namn med de fem färgbanden och ljudknappen till höger.
- Under namnet en rad som ändras efter läget:
  - Med en nyckel i ett lås: "**Tryck på Motståndet** för att vrida om nyckeln och låsa upp."
  - Annars: "Lär dig läsa motstånd. **Välj ett ämne.**"
- Rullgardinerna med info finns inte med (de är redan gömda).
- I testläge ligger testraden under rutnätet som i dag.

### Minikortet

Alla minikort har samma delar på samma plats: ikonen i en färgad ruta, namnet, en rad om vad ämnet lär ut och en fot med läget. Bakgrunden är ämnets färg, svagt, med ämnets ikon som snett mönster.

| Ämne | Färg | Ikon och mönster | Raden |
|---|---|---|---|
| Motståndet | brun | ett motstånd med tre band | Hur ett motstånd ser ut: hur många band, vilka färger och åt vilket håll man läser. |
| Resistansen | röd | Ω | Vad färgerna betyder i ohm: siffror, multiplikator och hela värdet. |
| Toleransen | orange | ± | Hur mycket värdet får avvika: guld, silver och de andra toleransfärgerna. |
| Temperaturen | gul (mörk text) | termometer | Det sjätte bandet: hur mycket värdet ändras när det blir varmt. |
| E-serierna | grön | prickar på en logaritmisk skala | Standardvärdena som motstånd säljs i: E6, E12, E24 och resten. |

Kortet har fyra lägen, och ett femte för Eldprovet:

| Läge | Utseende | Foten | Ett tryck |
|---|---|---|---|
| **Låst** | Vit bakgrund, dimma som driver, två kedjor i kryss och ett hänglås med nyckelhål i mitten. Namn och rad syns svagt genom dimman. | Ingen text. Låset säger att det är låst, och att man får nycklar genom att spela är en känd trop. | Kortet skakar. |
| **Nyckel i låset** | Som låst, men nyckeln sitter i nyckelhålet och skakar till med jämna mellanrum. Nyckelhålet och ramen lyser i ämnets färg. | Ingen text. Raden under namnet säger vad man ska göra. | Nyckeln vrids om och låset öppnas (se D). |
| **Öppet** | Ämnets färger fullt ut. Stapeln i miniformat: fem grader, tre fack var, aktuell grad inramad. | "Gesäll · 1 av 3 rätt i rad · fortsätt", eller "Nytt · börja med en snabbkoll" innan man gjort snabbkollen | Zoomar till spelkortet: omslaget första gången, annars spelsidan. |
| **Klart** | Guld med ett glanssvep som går över kortet. | "Klart ✓ · rekord 7 i rad" och etiketten "Spela blandat" | Zoomar till spelkortet i blandat läge. |
| **Eldprovet** | Glödande bakgrund (som i dag) och en eld som flämtar. | Etiketten "Alltid öppet", eller "Pågår · fråga 7 av 20" | Zoomar till Eldprovets kort. |

Ett nyss upplåst kort tänds med en kort glöd och får etiketten "Nytt!" tills man öppnar det.

## B. Spelkortet

### Zooma in och minimera

- Spelkortet och omslaget räknar storlekar efter kortets bredd, inte skärmens, och får aldrig ge sidoscroll. Långa namn och svarsalternativ bryts i stället för att sticka ut.
- Ett tryck på ett minikort gör att kortet växer från sin ruta till att täcka hela rutnätet (cirka 0,45 s). Innehållet tonar in.
- Knappen **Byt ämne** uppe till höger (ikon: sex små rutor, som rutnätet), eller Escape, krymper kortet tillbaka till sin ruta.
- På datorn täcker spelkortet rutnätets yta, men innehållet är som mest 720 px brett och centrerat.

### Spelsidan

Spelkortets ram och rubrikrad har ämnets färg, och bakgrunden har ämnets mönster.

1. **Rubrikraden:** ikonen, ämnets namn och knappen Byt ämne.
2. **Stapeln:** fem grader med namn, alltid synlig överst. Det är dagens stapel, men den sitter fast i kortet i stället för att glida ner. Allt den gör i dag finns kvar:
   - dammet från lysdioden som sugs in i nästa fack,
   - skakningen när man går upp en grad,
   - de röda facken på graden under vid fel,
   - att man kan trycka på en grad för att byta.
   
   I blandat läge visar raden sviten och rekordet i stället. I Eldprovet visar den "Fråga 7 av 20".
3. **Frågan:** som i dag, med gnistan, lysdioden och förklaringsanimeringarna.
4. **Allt om motståndet:** visas efter svaret under frågan, inne i kortet. Kortet skrollar om det behövs.

Statusraden under kartan försvinner. Det enda som visar läget är stapeln, och den visas på minikortet och överst i spelkortet.

### Fortsätta där man var

- Graden och antalet rätt eller fel i rad sparas per ämne. Man förlorar inte två av tre rätt genom att minimera.
- Minimerar man mitt i en fråga och öppnar samma ämne igen står samma fråga kvar.
- Öppnar man ett annat ämne emellan börjar det ämnet med en ny fråga på den sparade graden. Bara det senast spelade ämnet behåller exakt sin fråga.
- Minimerar man medan ett fel svar visas räknas det som att man gått vidare. Nästa gång kommer en ny fråga.

## C. Omslaget och snabbkollen

Första gången man öppnar ett ämne visas ett omslag i stället för spelsidan. Det kommer en gång per ämne och aldrig mer.

- **Öppnas:** kortet vänds fram som ett samlarkort medan det växer (cirka 0,7 s).
- **Ramen:** tjockare (6 px) i ämnets färg och mönstret starkare. Kortet har ingen rubrikrad och ingen stapel.
- **Innehåll uppifrån och ned:**
  - "Ämne 2 av 5".
  - Ämnets animering från dagens nivåkort (till exempel 1 · 0 · ×100 = 1 kΩ för Resistansen).
  - Namnet stort med ikonen.
  - Raden om vad ämnet lär ut.
- **Längst ner:** en streckad linje i ämnets färg, etiketten **Snabbkoll** och dagens startfråga (`KICK`) med fyra val. På datorn står valen i en rad, på mobil två och två.
  - Fel svar gör valet rött och det går inte att välja igen. Man försöker igen och inget räknas.
  - Rätt svar gör valet grönt, och kortet vänds sedan till spelsidan med ämnets första fråga.
- **Avbryta:** en rund minimeraknapp uppe till höger. Snabbkollen räknas som gjord först när man svarat rätt.
- **Sparas:** att man gjort snabbkollen sparas per ämne i `fargkoden2-seen`.
- **Klart och Eldprovet:** ett klart ämne har inget omslag. Eldprovet har sitt eget kort.

## D. Nycklarna

### Regel

- Ett ämne blir upplåsbart i samma läge som i dag: när föregående ämne når Mästare (`done ≥ 3`). Det gäller både i vanligt spel och i Eldprovet.
- Motståndet är upplåsbart från början.
- Ett upplåsbart ämne är låst med en nyckel i låset tills man trycker på det.
- Nycklar som sitter i ett lås sparas i `fargkoden2-keys`, så att de sitter kvar om man laddar om sidan.

### När man når Mästare

1. Utfallet och stapelns animering går som i dag.
2. Spelkortet visar nyckeln i nästa ämnes färg (den snurrar in) med texten "Mästare! Du fick nyckeln till Toleransen." och "Den flyger till låset." (cirka 2 s).
3. Kortet minimeras av sig självt.
4. Nyckeln flyger i en båge från kortet man lämnade till nästa ämnes nyckelhål. Den snurrar ett varv och landar i hålet (cirka 1,1 s). Ett ljud hörs när den landar.
5. Nyckeln sitter kvar och skakar till med jämna mellanrum tills man trycker på kortet.

### När man trycker på kortet

1. Nyckeln glider in i nyckelhålet (cirka 0,3 s), stannar ett ögonblick och vrids om (cirka 0,35 s), och det klickar.
2. Bygeln lyfter, hänglåset och kedjorna faller, dimman lättar (cirka 1 s), och man hör kedjorna.
3. Kortet tänds i sina färger och får etiketten "Nytt!".
4. Efter 0,7 s zoomar kortet upp till omslaget. Från nyckeln till snabbkollen behövs bara ett tryck.

### Första besöket

Allt är låst och nyckeln sitter redan i Motståndets lås och skakar. Raden under namnet säger "Tryck på Motståndet för att vrida om nyckeln och låsa upp." Ett tryck låser upp och öppnar omslaget med snabbkollen.

### Eldprovet

Låser provet upp flera ämnen på en gång flyger en nyckel till varje nytt lås när man går tillbaka till startsidan, en i taget med en kort paus emellan.

### Befintliga spelare

Har man redan framsteg (`fargkoden2-topic` finns) räknas alla ämnen som i dag är upplåsta som öppnade, och alla ämnen med framsteg räknas som att snabbkollen är gjord. Man får alltså inga nycklar för ämnen man redan spelar.

## E. Eldprovet

- Ett tryck på Eldprovets kort zoomar upp ett eget kort med samma glöd. Där finns de tre trycken "VÅGAR DU???" som i dag.
- Provet spelas i kortet, och raden överst visar "Fråga 7 av 20".
- Resultatkortet visas i kortet. När man går tillbaka till startsidan flyger nycklarna till de ämnen provet låste upp.
- Minimerar man mitt i provet fortsätter man där man var. Minikortet säger då "Pågår · fråga 7 av 20".

## F. När ett ämne blir klart

När man klarar Stormästare spelas guldfesten i stapeln som i dag. Sedan minimeras kortet av sig självt, och minikortet förvandlas till guld med ett glanssvep.

## G. Förhandsvisningen från dev.html

`?test=true&topic=ohm&grade=2` öppnar spelkortet direkt på den graden, utan omslag och utan zoom. "Byt ämne" fungerar och går till startsidan. Inget sparas, precis som i dag.

## Ljud

Nya ljud, gjorda med Web Audio som de andra:

- **Nyckeln landar:** ett metalliskt klirr.
- **Vrida om:** ett klick.
- **Låset öppnas:** kedjor som skramlar och faller.
- **Zooma in och ut:** ett kort svep (samma som `whoosh`).

## Rörelse

Med `prefers-reduced-motion` sker allt direkt: ingen zoom, ingen vändning, nyckeln står direkt i låset och upplåsningen byter läge utan animering. Dimman och elden står stilla.

## Det som tas bort

- Kartan (`renderMap`, `MAP_BANDS`, kartans klick) och statusraden (`updateScore`).
- Nivåkortet (`levelCardHTML`, `showLevelCard`, `drawCard`, `cardBar` med gradval i en stapel som glider ner). `KICK` och `animHTML` flyttar till omslaget. Eldprovets tre tryck flyttar till Eldprovets kort.
- Stapeln som glider ner (`.gbar` som fast element). Komponenten och dess animeringar finns kvar men ritas i spelkortet.
- Rullgardinerna med info. De är redan gömda och tas bort helt tillsammans med koden som fyller dem (`#ref`, E-serietabellen, guidens exempel).

## Tester

- **Skrivs om:** testerna för nivåkortet, startfrågan, kartan och stapeln (främst `start.test.mjs`, delar av `model.test.mjs`).
- **Nya tester:**
  - Första besöket: allt låst, nyckel i Motståndet. Ett tryck öppnar Motståndet och visar omslaget.
  - Snabbkollen: fel svar låter en försöka igen, rätt svar vänder till spelsidan, och omslaget visas inte nästa gång (även efter omladdning).
  - Mästare ger en nyckel i nästa lås som sparas. Ett tryck på ett låst kort utan nyckel skakar kortet och öppnar inget.
  - Eldprovet som låser upp två ämnen ger två nycklar.
  - Minimera och öppna samma ämne: samma fråga och samma antal i rad. Ett annat ämne emellan: ny fråga på den sparade graden.
  - Rutnätet: sex kort i fast ordning med rätt läge och rätt fot.
  - Förhandsvisningen öppnar spelkortet direkt.
  - Befintliga spelare får inga nycklar för ämnen de redan spelar.

## Utanför den här specen

- Nya frågetyper eller ändrade frågor.
- Bilder eller illustrationer per ämne utöver ikon, mönster och den befintliga animeringen.
- Att dra nyckeln med fingret (vi valde att nyckeln flyger själv).
