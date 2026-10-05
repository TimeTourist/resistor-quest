# Nivåmodell, inmatning och facit i knapparna

Datum: 2026-10-05. Bygger på v1.0.0 (`a01abc3`). Allt ligger i `index.html`.

## Bakgrund

Två problem i v1.0.0:

1. **Facit är för långt.** Efter varje svar läggs uträkning, chips, multimeter, standardvärde, läsriktning och ibland en rättvänd bild i kortet, och sidan skrollar ner till det. Vid fel är det svårt att se vad man valde och vad som var rätt, och fokus hamnar inte på det frågan lär ut.
2. **Nivåerna går att klara på gamla kunskaper.** Upplåsning kräver 5 rätt i rad på vilka frågor som helst på nivån. Ju högre upp, desto fler frågor gäller tidigare nivåers färdigheter, så sviten kan byggas på det man redan kan. Dessutom är Stormästares inmatning (knappsats och tre chiprader staplade) större än en skärm.

## A. Nivåmodell

### Färdigheter

| Nyckel | Färdighet | Lärs ut på |
|---|---|---|
| `dir` | Läsriktning | Nykomling |
| `v` (inkl. `d`, `x`) | Resistans: värde, siffror, multiplikator | Lärling |
| `t` | Tolerans | Gesäll |
| `k` | Temperaturkoefficient | Mästare |
| `e` | E-serie | Stormästare |

### Format per nivå

Grundregel: nivåns nya färdighet kommer som **flerval** i ungefär 60 % av frågorna. Förra nivåns färdighet kommer som **flerval**. Färdigheter två eller fler nivåer gamla kommer i **svår variant**.

Svår variant betyder:

- Resistans: knappsats (läs) eller palett band för band (bygg).
- Tolerans och TK: hela värdelistan (läs) eller palett (bygg) i stället för 4 alternativ.
- Riktning: motståndet kan sitta vänt i läs- och byggfrågor, med standardens ledtrådar synliga (brett toleransband, mellanrum). Inga egna riktningsfrågor.

| Nivå | Nytt (flerval) | Förra nivån (flerval) | Äldre (svår variant) |
|---|---|---|---|
| Nykomling | `dir` med tydlig ledtråd | – | – |
| Lärling | `v` / `d` / `x` | `dir`-frågor med ledtråd | – |
| Gesäll | `t` | `v` | vända motstånd |
| Mästare | `k` | `t` | `v`, vända motstånd |
| Stormästare | se undantag | | |

**Undantag, Stormästare:** allt i svår variant (resistans, tolerans, TK, vända motstånd), även hela "läs allt"- och "bygg allt"-frågor. E-serien är flerval med värdet utskrivet. Eldprovet är E-seriens svåra variant (inget värde utskrivet), som i dag.

**Eldprovet** är oförändrat i innehåll: 20 frågor, allt svårt, de kluriga riktningsfallen.

### Svit och upplåsning

- Bara **rätt svar på en fråga om nivåns nya färdighet** räknar upp sviten.
- **Fel på vilken fråga som helst** nollställer sviten.
- Rätt med tips: sviten står still (som i dag).
- På Stormästare räknar E-seriefrågor och "läs/bygg allt"-frågor upp.
- 5 i svit låser upp nästa nivå (`UNLOCK_AT` oförändrad).
- Sparade framsteg (`fargkoden-stars`) behålls. Upplåsta nivåer förblir upplåsta.

### Följdändringar

- **Öva-läget:** delen man övar på får samma format som på den nivå man står på. Övning räknar inte mot upplåsning (som i dag).
- **Tips:** finns bara för nivåns nya färdighet (som i dag, `LEVEL_SKILL`).
- **"Om nivåerna"** och `LEARN`-texterna i upplåsningsdialogen skrivs om efter den nya modellen.
- **Eldprovets utlåtande** (`LADDER`, `verdict`) kontrolleras mot trappan så att nivånamn och färdigheter stämmer.

## B. Spelkortet

Uppifrån och ner: fråga, motstånd, (tips), inmatning, en rad om det frågan lär ut (efter svar), **huvudknapp**.

- Huvudknappen sitter alltid på samma plats i kortet.
- Frågor där klicket på ett alternativ är svaret: knappen heter **Nästa** och är grå tills man svarat.
- Frågor som behöver bekräftas (inmatning med flera rutor, fritext): knappen heter **Svara**, är grå tills allt som krävs är ifyllt, och byter till **Nästa** efter svar.
- Efter svar får Nästa fokus, så Enter eller mellanslag går vidare.
- Sidan skrollar aldrig av sig själv efter svar. Vid Nästa skrollas kortet tillbaka i bild om man skrollat ner.
- Upplåsningsdialogen visas efter att facit ritats i kortet. "Stanna kvar" ger fokus till Nästa.

## C. Inmatning, ett fält i taget

En gemensam komponent för alla frågor där man anger mer än ett val.

- **Rutor överst:** de delar frågan kräver, t.ex. `Siffror` `×` `±` och `TK` på sexband. Aktiv ruta är markerad, ifyllda visar sitt värde.
- **Ett fält under rutorna** som byter innehåll efter aktiv ruta:
  - enkel variant: 4 alternativ,
  - svår variant: knappsats (siffror) eller hela värdelistan (×, ±, TK).
- När man väljer ×, ± eller TK går fältet automatiskt vidare till nästa tomma ruta. Siffror kräver ett aktivt byte (tryck på nästa ruta, eller välj ett värde i nästa fält).
- Man kan när som helst trycka på en ruta för att ändra den.
- **Bygg** följer samma mönster: enkel variant väljer bland färdiga band eller motstånd, svår variant väljer ur paletten band för band (befintlig slot-modell, med samma huvudknapp).

Kortet blir ungefär lika högt som knappsatsen plus en rad rutor, oavsett antal band.

## D. Facit i knapparna

Efter svar, i kortet:

| Frågetyp | Facit |
|---|---|
| Flerval med värden | Valt fel → rött, rätt → grönt. Varje knapp visar färgen som ger värdet (prick + namn). |
| Flerval med band/färger | Som ovan, och varje färgknapp visar sitt värde (t.ex. brun "±1 %"). |
| Flerval med motståndsbilder | Rött/grönt, och värdet skrivs under varje bild. |
| Riktning | Rätt håll grönt, valt fel rött. Motståndet vänds rättvänt med kort animation (ingen animation vid `prefers-reduced-motion`). |
| E-serie | Rött/grönt, och en rad om vilka serier värdet finns i. |
| Inmatning (rutor) | Varje ruta grön eller röd. Röd ruta visar ditt svar överstruket och rätt värde bredvid. |
| Bygg med palett | Varje band får grön eller röd markering, och felaktiga band visar rätt färg bredvid. Vänt motstånd byggt åt fel håll får en rad om det. |

Under inmatningen: **en rad** om det frågan lär ut, t.ex. "Tredje bandet, röd = ×100". Fick man rätt med tips står det där kort.

### Allt om motståndet

Det som i dag visas i facit (uträkning, band som chips, multimeter, standardvärde, läsriktning, rättvänd bild, TK-fakta på Mästare) flyttas till en sektion **under kortet**, öppen och synlig efter svar. Den visas inte före svar. Man skrollar ner om man vill läsa.

## E. Eldprovet

- Inget facit i knapparna och ingen "Allt om motståndet".
- Efter varje svar: en poängskylt i kortet, t.ex. "2 av 3 delar · totalt 14/22 poäng". Riktnings- och seriefrågor är en del.
- Huvudknappen blir Nästa. Sista frågan: "Se resultatet".
- Resultat och utlåtande som i dag.

## Utanför det här arbetet

Nivåväljare, Spela/Öva-reglage, guiden, referenstabellerna och upplåsningsdialogens utseende.

## Test

- Spela igenom varje nivå i Spela och Öva och kontrollera format per tabellen i A.
- Svit: rätt på ny färdighet räknar upp, rätt på gammal står still, fel på något nollställer, 5 låser upp.
- Facit per frågetyp enligt D, i ljust och mörkt tema och i telefonbredd (360 px) utan horisontell skroll.
- Huvudknappen: grå före svar, Enter efter svar, ingen automatisk skroll.
- Eldprovet: poängskylt, inget facit, slutresultat oförändrat.
- `?test=true`-raden fungerar fortfarande för att låsa upp och låsa nivåer.
