> Uppdatering: produktmatchningen är korrigerad, nu 439 nationella kopplingar och 53 för standardbutikerna. Se [IMPORTER-FIX.md](IMPORTER-FIX.md).

## Matmoms Tracker — publicerat 2026-11-09

Matmoms är anslutet på https://dw911x8c8grll.cloudfront.net/.
Välj **Matmoms – historiska referenspriser** som prisunderlag eller klicka **Skapa referensplan med Matmoms** vid priskällorna.

- Öppen export `data-2026-10`: 449 butiksspecifika senaste ordinarie prisobservationer för tre Stockholm-butiker (ICA, Coop, Willys), observerade 3–31 oktober 2026.
- 37 granskade kopplingar till receptingredienser. Ofullständiga varukorgar får ingen påhittad totalsumma.
- Detta är daterade historiska referenser, inte dagens butikspriser. Separat prisval hindrar att historik blandas med de aktuella butikskällorna.
- Källa: Matmoms (matmoms.se) av Gabriel Linton, CC BY 4.0. Exporten filtreras och bearbetas; källans verifieringsbegränsningar visas i appen.
- Daglig kontroll av nya exporter kl. 07:15 Stockholm, med upp till tre minuters fördröjning; oförändrad export återanvänds. Uppdateringsjobbet är verifierat aktivt och lyckat.
- Import: `scripts/import_matmoms.py`; sökbar källa: `web/matmoms-panel.mjs`; publicering: `deploy/publish-matmoms.py`.
- Verifiering: 30 Node-kontroller samt publicerat webbläsartest för källangivelse, sökning, referensbudget, daterad inköpslista, återställning, byte till aktuella priser och mobilbredd. Inga betalda AI-anrop i dessa tester.


### Butikskort och prisunderlag

Butikskorten visar både aktuella källor och Matmoms varukatalog per kedja i separata utfällbara listor, med produktnamn, förpackning, butik och datum. Priskällan kan bytas direkt för samma meny; beräkningen blandar aldrig källtyperna. Nya planer börjar med Matmoms valt, sparade planer behåller sin valda källa. Ofullständiga inköpslistor visar verklig delsumma och en lista över varorna utan pris; totalsumma och återstående budget förblir okända. `tests/partial_price_browser_check.py` verifierar butikskoppling, prisaritmetik, byte utan menyändring och mobilbredd både lokalt och på publicerad sida.

### AI och quiz — 2026-11-09

AI är förvalt om serverns AI-anslutning är aktiverad. Quizets sista steg har AI-val och kodfält; koden behålls bara i sidans minne. Saknad kod och AI-fel lämnar tidigare plan kvar. AI väljer bland tillåtna recept och får pristäckning per butik som underlag för prioritering; den skapar inga priser. Receptkort visar råvarornas kända delkostnad per portion samt en utfällbar lista över ingredienser utan pris. Delsumman är aldrig en komplett receptkostnad. Verifierat med 31 automatiska kontroller, kontrollerade webbläsarsvar samt ett riktigt Bedrock-anrop genom den publicerade sidans quiz.

### Postnummer och prisreferenser — 2026-11-09

Postnummer kan anges i quizets första steg eller vid butiksväljaren. `Hitta butiker nära mig` byter platsunderlag för samma meny utan AI-anrop. Postnummer sparas med användarens lokala inställningar men skickas inte till Bedrock. GeoNames svenska postnummerdata (18 887 poster, CC BY 4.0) används offline. Avstånd är ungefärlig fågelväg från postortens position; det är inte adressprecision eller resväg.

Hela Matmoms månadsarkiv importeras nu: 3 319 senaste användbara ordinarie observationer över 33 butiker, 279 granskade ingredienskopplingar. Datum och enhetskontroller bevaras. Kampanj-/medlemsuppgifter och felaktiga enhetskopplingar används inte som vanliga packpriser. Sökpanelen har ett val för hela exporten. Pristäckningen är fortfarande ofullständig för recept och andra kedjor.

Butikskatalogen har 488 poster från Willys/Hemköps offentliga butikskataloger och Matmoms metadata. Kedjornas verkliga koordinater/adresser prioriteras. Matmoms uppgifter utan verifierad butikspunkt märks som postområde; generiska nätbutiker är inte adressverifierade fysiska butiker. Visar högst 24 adressverifierade katalogposter inom 30 km. Närbutikslistan använder bara Willys/Hemköps faktiska butikskoordinater; Matmoms ungefärliga postområden rankas inte som fysiska närbutiker. Detta är närmast inom den tillgängliga katalogen, inte en fullständig sökning bland alla Sveriges butiker.

Prisuppgifter väljs för en konkret prisbutik per kedja, med verkligt storeId. Nära fysisk butik och butik som lämnar prisunderlag visas separat. Samma verifierade butik, annan närliggande prisbutik respektive annat nätunderlag skiljs åt. En annan orts/nätbutiks pris utges aldrig för att gälla den närmaste butiken. Aktuella och historiska prisunderlag hålls fortsatt isär.

`server/location.mjs` hanterar avstånd och val. `GET /api/prices/{postnummer}` fungerar genom CloudFront utan ändrad AWS-konfiguration. Butikskatalogen uppdateras dagligen 07:30 Stockholm plus upp till tre minuters fördröjning (`matbudget-locations.timer`). Uppdatering verifierad lyckad med noll källfel. GeoNames postnummerdump är en versionsbunden import från 2026-11-09.

Validering: 34 Node-kontroller. Publicerat webbläsartest `tests/location_browser_check.py` kontrollerar quiz, Göteborg/Stockholm, skilda pris- och närbutiker, felaktigt postnummer, återställning, nationell sökning och mobilbredd utan AI-anrop. OpenStreetMaps butikskatalog kunde inte hämtas på grund av tjänstens kapacitetsbrist; den används inte i produktionsfunktionen och täckning för övriga kedjors alla närbutiker är inte utlovad.
