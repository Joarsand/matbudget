# Komplett prisunderlag för receptkatalogen — 2026-11-09

Publicerat och verifierat på https://dw911x8c8grll.cloudfront.net/.

## Resultat och exakt omfattning

Alla 36 ingredienser i de nuvarande 100 recepten har ett kontrollerat prisunderlag från Willys Stockholm Sköndal (onlinebutik 2295). Detta är en komplett prissatt referensbutik för receptkatalogen; det är INTE hela Willys sortiment eller alla produkter/butiker i Sverige. Andra kedjors import och den historiska Matmoms-källan har fortfarande luckor.

Grundorsaken till det tidigare begränsade aktuella urvalet var import från `/search/campaigns`. Vanlig `/search` med butik och produktsökning ger basvaror utanför kampanjutbudet, exempelvis salt. Tomma och generella katalogfrågor gav inget fullständigt sortiment. Därför används exakta granskade produkter för alla receptingredienser, i stället för att hävda att hela butikens katalog hämtats.

## Import och prissemantik

- `scripts/complete-willys-reviewed.json`: 36 godkända SKU:er med namn, förpackning, mängd, ingrediensenhet och sökfråga.
- `scripts/reviewed_search.py`: butiksspecifik sökning med begränsad sidindelning; endast godkända SKU:er och exakt produkt-/packmatchning. Inga toppträffar väljs automatiskt. Avbryter vid 401/403/429.
- Befintligt `sync-prices.py` använder nu denna fullständiga ingrediensimport för Willys, med samma timer (fyra gånger dagligen). Serveruppdateringen slutförd med Result=success.
- För konserver används uttrycklig avrunnen mängd från butikens förpackningsfält (exempelvis 380/230 g). Salt, linser, bröd, frysta grönsaker och andra basvaror hämtas även när de inte ingår i kampanjer.
- Banan och äpple säljs med verkliga kilopriser. Råobservationen bevarar kilopriset i `priceOre`, tillsammans med `retailPriceBasis=kg`, `averageWeightKg` från butikens eget svar och `estimatedWeight=true`. Budgetmotorn härleder en uppskattad kostnad per frukt från detta, avrundad till öre. Detta är en viktuppskattning, aldrig ett påstått fast styckpris. Verklig vikt avgör slutpriset. Kilopris, ungefärlig vikt och förklaringen visas i inköpslistan och budgeten.
- Övriga produkter beräknas med hela, riktiga förpackningar. Kostnader som tidigare saknade pris får nu fullständiga summor för alla 100 recept i referensbutiken.

## Webbflöde

Nya planer använder aktuella priser. Sparade historiska planer kan byta via `Använd aktuella Willys-priser för hela menyn`; detta väljer den tydligt namngivna referensbutiken, behåller recept/matval och använder inget AI-anrop. Knappen visas endast när alla 36 färska ingrediensobservationer finns. Den närmaste fysiska butiken och prisreferensen skiljs fortsatt åt.

Budgetens lokala förbättringssökning begränsas till 200 receptförslag så att kompletta månadsplaner inte leder till obegränsad beräkning. Ingen garanti om globalt lägsta pris eller att en för låg budget kan uppfyllas lämnas.

## Verifiering

38 befintliga Node-kontroller passerade, plus ny kontroll av verkligt kilopris, butikens snittvikt och validering. Tio Python-kontroller täcker importerfel och produktidentitet. Det publicerade webbläsartestet `tests/complete_price_browser_check.py` verifierar 36/36 faktiska produktpriser från serveruppdateringen, 100/100 kompletta receptberäkningar, budget/restbelopp, lösviktsmärkning, byte från historik utan menyändring samt mobilbredd. Inga AI-anrop i verifieringen.
