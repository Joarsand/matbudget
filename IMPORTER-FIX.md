# Produktimport — korrigering 2026-11-09

Publicerat på https://dw911x8c8grll.cloudfront.net/.

## Fel och ändring

Matmoms-importern använde en enda produkt per receptingrediens. Ett bortfall i just den produkten gav saknat pris trots att andra godkända förpackningar fanns i samma butik. Exempel: Oatly Original saknades medan Barista fanns; bröd, ost och naturell yoghurt hade ofullständiga kopplingar.

`scripts/matmoms-reviewed.json` innehåller nu 104 explicit granskade produkt-ID:n, förpackningar och ingrediensenheter. Alternativ väljs inom samma butik och kedja, först efter nyaste observationsdatum och därefter granskningsordning. Namn, mängd och enhet måste matcha den granskade definitionen. Yoghurt i gram matchas inte godtyckligt till liter. Konservernas nettovikt används inte som avrunnen vikt. Frukt i kilogram prissätts inte som ett påhittat antal stycken.

Resultat på samma officiella oktoberexport: nationella ingredienskopplingar 279 → 439; standardbutikerna i Stockholm 37 → 53. Antalet giltiga sökbara butiksvaror är fortsatt 3 319. En oförändrad testmeny fick 16 av 32 prissatta ingredienser mot tidigare 12 av 32. Användarens egen meny kan få annan täckning.

Importversion 3 och en kontrollsumma för matchningsregistret gör att ändrade regler bearbetas även om källans månadsexport är oförändrad. Tom import avvisas. Originaldatum och pris lagras oförändrade; penningvärden avrundas till öre med ROUND_HALF_UP. Rapporten separerar förpackningsfel, villkorade priser, otillgängliga varor och saknade kopplingar. Rapporten visas utfällbar vid Matmoms priskälla.

Mathem-importen behåller nu tidigare giltiga observationer vid en delvis misslyckad uppdatering. Observationens ursprungliga tid behålls och priser äldre än 36 timmar eller med framtida tidsstämpel behålls inte. En lyckad ny observation ersätter gammal för samma ingrediens och butik.

## Verifiering

Åtta Python-regressionstester täcker alternativa produkter, separation av butiker, senaste datum, felaktig packstorlek, villkorade priser, ändrad produktidentitet, tom import och färskhetskontroll vid delvis nätfel. Tio Node-kontroller av historiska/aktuella prisgränser, förpackningsavrundning och ofullständiga totalsummor passerar. Publicerat webbläsartest jämför exakt samma meny med verkliga före-/efterexporter och bekräftar importversion 3 och 439 kopplingar i produktions-API:t. Ingen AI-kvot används.

Kvarstående täckningsluckor är verkliga: exempelvis saknas en säker koppling för salt, avrunna konserver och vissa frukt-/styckkonverteringar. Dessa fylls inte med uppskattade priser och en fullständig totalsumma utlovas inte.
