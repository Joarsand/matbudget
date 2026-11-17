# Bilder och personliga recept — 2026-11-09

Publicerat på https://dw911x8c8grll.cloudfront.net/.

- Receptkatalogen är utökad från 50 till 100 unika recept: 50 nya förskrivna recept med ingrediensmängder för två portioner och steg för tillagning. Nya livsmedel med okända priser införs inte i prisdatabasen.
- Ett lokalt AI-genererat fotoatlas med 12 matmotiv ersätter den upprepade SVG-skålen. Inspirationsbilderna är märkta och är inte exakta receptbilder eller bevis på allergeninnehåll. Originalbilden sparas i `web/food-atlas-v1.png`; bilder hämtas från samma webbplats och den versionsbundna bildfilen får lång cachetid.
- Receptbank med textsökning, måltidsfilter, favoritfilter, visa-fler och receptdialog. Urvalet respekterar användarens tid, kost och uteslutna ingredienser.
- Smakval: husmanskost, medelhav, asiatiskt inspirerat och texmex. Dessa är mjuka prioriteringar, aldrig undantag från hårda kost- och ingrediensfilter.
- Hjärtknappar sparar favoriter i planens lokala inställningar. Favoriter prioriteras vid nästa planering men skriver inte om den nuvarande menyn.
- Variation: fler olika rätter eller högst två återkommande recept per måltid. Repetitionsgränsen tillämpas deterministiskt även på AI-menyer.
- Quizet samlar smakval och variation. Bedrock får valen och favorit-ID, enbart godkända recept tillåts i svaren. Postnummer och åtkomstkod läggs inte i modellprompten. Åtkomstkod lagras inte i localStorage.
- Portionsmängder skalas; nya recepts angivna mängder vatten/kokvatten skalas också i receptdialogen. Kylning över natt anges uttryckligen utöver aktiv tid.

Verifiering: de tidigare 34 automatiska kontrollerna samt fyra nya kontroller för prioritering, hårda matfilter, variation och AI-svar. Publicerad webbläsarkontroll av fotoresurs, sökning, favoritmarkering och återställning, quiz, tema och mobilbredd. Ett riktigt Bedrock-anrop genom quizet verifierar att asiatiska smakval och repetitionsval förs över och ger giltiga recept. Inga nya AWS-resurser har skapats.
