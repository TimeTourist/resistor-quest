# Backlogg: idéer och sådant som inte är gjort

Sammanställt 2026-10-06 när sessionen avslutades. Spelet ligger i `index.html` och översikten i `dev.html`.

## Planerat men inte byggt

- **Felanimeringar för Toleransen, Temperaturen och E-serierna.**
  - Dessa ämnen visar fortfarande bara en textrad vid fel. De är markerade *behöver animering* i dev.html.
  - Idéerna från specen (`docs/superpowers/specs/2026-10-05-feedback-och-resistans-design.md`, avsnitt D):
    - Vad värdet får vara: en tallinje där ± växer ut från värdet till gränserna.
    - Stabilast: värdet i ppm/K dyker upp under varje motstånd, och det lägsta lyfts fram.
    - E12: värdet letas upp i rutnätet och hittas inte.
    - Vilken serie: toleransen pekar ut serien, sedan letas värdet upp i den.
    - Färgskalorna för tolerans och ppm/K: markeringen glider fram till rätt färg, som på Resistansens Lärling.
- **Knappa in under banden för Toleransens och Temperaturens Stormästare.**
  - Det är byggt för Resistansen: rutor under alla band, flikar och ingen ledtråd om läsriktningen.
  - Toleransen och Temperaturen har kvar de gamla fälten. De behöver egna flikar för tolerans och ppm/K.

## Erbjudet men inte bestämt

- **Ohm-flervalen som multimetern.** (Idé från användaren, 2026-10-06.) Visa alla flerval med ohm-värden som den gamla multimeterkomponenten (`meterLcd`: LCD-display med mätspetsar) i stället för vanliga knappar. Gäller bland annat Siffror och nollor på Resistansens Mästare.

- **Visa i dev.html ska öppna exakt den frågetypen på raden.**
  - I dag öppnar Visa bara rätt grad, och grader med flera frågetyper slumpar vilken typ som visas. Till exempel visar "Ordna värdena" ibland en peka-fråga.
  - Det kräver en koppling mellan raderna i dev.html och frågetyperna i spelet.
- **Statusraden under kartan.** Ska den bort nu när stapeln finns?
- **Fler startfrågor per ämne.** Flera uppsättningar så att det inte alltid är samma, till exempel inte alltid kycklingen.
- **Blandat över alla ämnen.** Uppskjutet.
- **Städa grenar.** `amnen-och-grader` (lokalt och på GitHub) och `nivamodell-och-facit` (på GitHub) är sammanslagna eller gamla och kan tas bort.

## Att kontrollera

- **Ljuden har aldrig provlyssnats.** De är skapade med Web Audio, men webbläsartesterna spelar inget ljud. Gäller:
  - krossat glas och knak på startkortet och Eldprovet
  - svep, stigande ton och dovt ljud i Ordna
  - fanfaren och felljudet när man byter grad i stapeln
- **Visa-panelen i claude.ai-artifacten.** Den fungerar lokalt men är inte provad i claude.ai.
- **Stapeln på startkortet täcker kartan.** Medan kortet är framme går det inte att trycka på kartan genom stapeln. Ändra om det är i vägen.

## Kända småsaker

- Testlägets knapp "Dölj/Visa rätt svar" ritar om frågan direkt. Mitt under Ordna kan det avbryta färger som flyger. Det gäller bara testläget.
- Specerna i `docs/superpowers/specs/` beskriver tidiga versioner. dev.html är den aktuella beskrivningen av frågetyperna.
