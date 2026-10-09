# Backlogg: idéer och sådant som inte är gjort

Sammanställt 2026-10-06 när sessionen avslutades. Spelet ligger i `index.html` och översikten i `dev.html`.

## Planerat men inte byggt

- **Felanimeringar för Toleransen och Temperaturen.**
  - Dessa ämnen visar fortfarande bara en textrad vid fel. De är markerade *behöver animering* i dev.html.
  - Idéerna från specen (`docs/superpowers/specs/2026-10-05-feedback-och-resistans-design.md`, avsnitt D):
    - Vad värdet får vara: en tallinje där ± växer ut från värdet till gränserna.
    - Stabilast: värdet i ppm/K dyker upp under varje motstånd, och det lägsta lyfts fram.
    - E-seriernas Serie ↔ tolerans har bara raden.
    - Färgskalorna för tolerans och ppm/K: markeringen glider fram till rätt färg, som på Resistansens Lärling.
- **Knappa in under banden för Toleransens och Temperaturens Stormästare.**
  - Det är byggt för Resistansen: rutor under alla band, flikar och ingen ledtråd om läsriktningen.
  - Toleransen och Temperaturen har kvar de gamla fälten. De behöver egna flikar för tolerans och ppm/K.

## Erbjudet men inte bestämt

- **Ohm-flervalen som multimetern.** (Idé från användaren, 2026-10-06.) Visa alla flerval med ohm-värden som den gamla multimeterkomponenten (`meterLcd`: LCD-display med mätspetsar) i stället för vanliga knappar. Gäller bland annat Siffror och nollor på Resistansens Mästare.

- **Kuggfrågor på Eldprovet.** (Idé från användaren, 2026-10-06.) Specialfallen som skoltabellerna hoppar över lärs ut på Eldprovet: orange ±0,05 %, gul ±0,02 % och grå ±0,01 % som tolerans, rosa (×0,001) och andra ovanliga färger. Svarar man fel kommer en dialog, "Kuggfråga", som förklarar specialfallet. Toleransämnet frågar sedan 2026-10-06 bara skoltabellens färger (`TOL` i index.html).

- **Visa i dev.html ska öppna exakt den frågetypen på raden.**
  - I dag öppnar Visa bara rätt grad, och grader med flera frågetyper slumpar vilken typ som visas. Till exempel visar "Ordna värdena" ibland en peka-fråga.
  - Det kräver en koppling mellan raderna i dev.html och frågetyperna i spelet.
- **Städa grenar.** `amnen-och-grader` (lokalt och på GitHub) och `nivamodell-och-facit` (på GitHub) är sammanslagna eller gamla och kan tas bort.

## Kända småsaker

- **Från granskningen av startsidan (2026-10-06), inte rättade:**
  - Byter man ämne innan guldet går vidare tänds inte minikortet (det blir guld, men utan glöden).
  - Trasig data i `fargkoden2-keys` nollställer också `fargkoden2-seen`, och tvärtom. De borde läsas var för sig.
  - Fokus tappas när omslaget öppnas (det ska till `#coverClose`), efter snabbkollen och när nycklar flyger.
  - Tryck på rutnätet under stängningsanimeringen (0,42 s) tas emot.
  - Ett avslutat Eldprov öppnar på resultatkortet i stället för de tre trycken, vilket avviker från specen.
  - Glöden på ett nytt minikort (`.tile.fresh`) följer inte inställningen för minskad rörelse, och `[data-level]` i tangentlyssnaren är död kod.
- **Allt om motståndet är dolt** (`S.showMore = false`). Koden finns kvar.

- Testlägets knapp "Dölj/Visa rätt svar" ritar om frågan direkt. Mitt under Ordna kan det avbryta färger som flyger. Det gäller bara testläget.
- Specerna i `docs/superpowers/specs/` beskriver tidiga versioner. dev.html är den aktuella beskrivningen av frågetyperna.

## Ackordkartan (tillagd 2026-10-09)

Spec: `docs/superpowers/specs/2026-10-09-ackordkartan-design.md`. Omgång 1 är byggd: startsidan, Klaviaturen och Treklangerna. Omgång 2 är byggd: Tonarterna och Stegen. Omgång 3 är byggd: Fyrklangerna och Vägarna.

- **Nästa omgång:** Lånade ackord och Eldprovet. Frågekatalogen ska skrivas i specen först. Med i den: "Vad är det här, och vilka tre ackord är rimliga härnäst?"
- **Förklara det felaktiga svaret i fler frågor:** förtecken och skalor gör det redan. Ackordnamn ("du valde Cm, det är C E♭ G") kan få samma sak.
- **Skalor utan Ordna:** skalor tas med sju tangenter och Svara, så det behövdes ingen Ordna-frågetyp i omgång 2.
- **Täta etiketter:** bågarnas siffror i skalvandringen ligger tätt där en svart och en vit tangent följer på varandra. De går att läsa men kan putsas.
- **Öppen fråga:** B eller H? Spelet använder internationellt B (tonen under C). Det var ett antagande och är inte bekräftat.
- **Länken "Alla spel"** i dev-sidans panel går till dev-sidan själv, eftersom startsidan inte är en fil där. Det är ofarligt men lite förvirrande.
- **Telefonbredd:** två oktaver ger små tangenter och liten text. Ett alternativ är en oktav på smala skärmar.
