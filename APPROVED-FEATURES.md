# Matbudget: godkända utvecklingspunkter 1, 2 och 3

Publicerade 10 november 2026 på https://dw911x8c8grll.cloudfront.net/.

- [x] **1. Matlådor och rester.** Välj lunch och middag och aktivera extra middagsportioner i quizet eller sidpanelen. Antalet matlådeluncher anges per sju dagar. Första dagens lunch lagas separat; sista middagen dubblas bara om det finns en följande lunch i planen. Nästa lunch följer middagens recept. Inköpet räknar dubbla middagsportioner en gång. Receptdialogen visar det verkliga portionsantalet att laga. Byte av en kopplad lunch ändrar ursprungsmiddagen.
- [x] **2. Ändra med AI.** Beskriv ändringen under AI-rutan. Befintlig åtkomstkod behövs; samma gemensamma gräns på 20 försök/dag gäller. Förslaget visar ändrade måltider och före-/efterkostnad. Inget tillämpas innan användaren väljer Använd förslaget. Avbryt, fel eller en ändrad plan under väntan bevarar användarens plan. Stöder receptbyten, billigare meny och matlådeplanering. AI kan inte skapa fria recept, ändra hårda matval eller hitta på priser.
- [x] **3. Billigare produktval.** Öppna Inköpslista. Alternativ från samma verkliga prisbutik visas endast om hela inköpet blir billigare efter förpackningsavrundning. Namn, förpackning, radkostnad, besparing, butik, tid och priskälla visas. Välj ett i taget; övriga förslag räknas om. Produktval kan återställas. Saknade eller för gamla val ger ingen påhittad totalsumma.

## Omfattning och begränsningar

Åtta alternativa Willys-produkter är explicit granskade genom produkt-id, namn, förpackning och enhet: havregryn, ris, två äggförpackningar, pasta, linser, tofu och salt. Alla alternativ behöver inte innebära en besparing för varje meny. Det är inte en jämförelse av butikens hela sortiment. Mathem och övriga kedjors standardpriser fungerar som tidigare; alternativa produktbyten är i denna version anslutna till Willys Sköndal.

Alternativ kan ha andra egenskaper, till exempel frigående inomhus jämfört med utomhus. Byten är frivilliga och namnen visas. De hårda kost- och ingrediensvalen bevaras, men faktiska förpackningar och allergen-/spårinformation måste kontrolleras. Prisunderlaget är högst 36 timmar gammalt. Ingen alternativ produkt återanvänder pris från en annan butik eller från historiska Matmoms-data.

Budgeten kan fortfarande överskridas. Billigare meny använder en begränsad lokal sökning, inte en garanti om matematiskt lägsta kostnad. AI föreslår ändringar inom den befintliga receptkatalogen. Ingen ny prenumeration eller AWS-resurs har skapats.

## Verifiering

44 Node-kontroller, 11 importer-kontroller, detaljerade Playwright-flöden för godkänn/avbryt/fel och produktbyten samt 69/69 återkommande kontroller i Chromium, Firefox och WebKit. Ett separat produktionsanrop till Bedrock verifierade tolkning av tre matlådeluncher. Hemliga koder visas och sparas inte av testerna.

Lokala regressionstester: `tests/plan-improvements.test.mjs`, `tests/plan_improvements_browser.py`, `tests/test_importers.py`. `tests/live_edit_check.py --live-ai` är ett uttryckligt, separat betalt test och körs inte i ordinarie QA.
