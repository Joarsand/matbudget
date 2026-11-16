# Matbudget

AI-assisted meal planning, grocery budgets and shopping lists. Coursework by Joar Sandholm.

- **Application:** https://dw911x8c8grll.cloudfront.net/
- **Documentation:** [PROJECT-DOCUMENTATION.md](PROJECT-DOCUMENTATION.md)
- **Source:** [Matbudget-source-2026-11-16.zip](Matbudget-source-2026-11-16.zip) — download and extract the `matbudget` folder.

This repository distributes a dated source archive with 90 files, rather than an unpacked development tree. It includes frontend/backend source, importer scripts, tests and documentation. Private deployment state, credentials, machine-specific launchers and logs are excluded. Cloud account/deployment-IP identifiers in historical documents are redacted.

## Run

Requires Node.js 22 or newer. Inside the extracted folder:

```sh
node server.mjs
```

Open http://127.0.0.1:8787/. Local tests:

```sh
node --test tests/*.test.mjs
```

47 local tests passed on 16 November 2026. Local AI is disabled unless separately configured with AWS permissions and a private access code; see `.env.example`. The server does not automatically load `.env` files. Imported live price files may need regeneration in a fresh local copy.

## Implemented

Preference quiz, meal selection, household/budget planning, 100 authored recipes, pantry deductions, whole-pack shopping calculations, recipe replacements, favourites, theme switching and a Bedrock integration. A separate preview links ICA recipes; the main planner is not yet ICA-only.

## Limits

This is a prototype. There is no full assortment or current verified price feed for every listed chain. Historical prices are labelled separately. Incomplete baskets must not be presented as complete totals. The public application opened successfully on 16 November; a new paid AI request was not made during submission preparation. The documentation distinguishes historical checks from current observations.

No video is included in this submission, following the updated submission scope. Third-party data and source attribution remain in their associated files; this repository does not grant ownership of third-party material.
