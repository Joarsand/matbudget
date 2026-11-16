# Matbudget — project documentation

Author: Joar Sandholm  
Submission prepared: 16 November 2026  
Recorded application URL: https://dw911x8c8grll.cloudfront.net/

## Scope and evidence

Matbudget is a Swedish meal-planning web application that combines household preferences, a food budget, recipes and a shopping list. Its intended users want to plan breakfast, lunch and dinner for a week or calendar month and compare the cost of ingredients at selected retailers.

This document describes the current local source and saved development records. The application was deployed and its Bedrock integration tested on 9 November. The public application was opened successfully in the browser on 16 November: menu, shopping calculations and retailer coverage were visible. A new paid Bedrock request was not made. Source snapshot and documentation: https://github.com/Joarsand/matbudget. The existing NationDev repository contains supplementary QA/security reports.

## 1. Research and planning

The initial requirements were agreed on 9 November 2026: start with Stockholm, allow independent meal selection, support dietary preferences and generate a budget and shopping list. The work expanded to include an onboarding quiz, saved preferences, recipe replacements, pantry items and light/dark themes.

The selected technologies are HTML, CSS and JavaScript modules for the frontend, a dependency-free Node.js server, Python data-import scripts, Amazon Bedrock for generative AI, and AWS EC2 with CloudFront for hosting. Node's test runner and Playwright support verification.

Real price coverage was a major research constraint. A chain name alone does not establish a local store's assortment or price. The solution separates reviewed current online observations from historical Matmoms Tracker observations and shows missing prices explicitly. It does not invent a total for a partially priced basket.

Research references and detailed records are included in `docs/PRICE-DATA.md`, `docs/FREE-PRICE-SOURCES.md`, `docs/AI-AWS.md` and `docs/PRODUCT-SPEC.md` in the source package. Some older records describe earlier prototypes and are historical; this submission overview and the dated ICA/catalogue status take precedence for present scope.

## 2. Implementation

The first implementation was a local planner with a fixed recipe catalogue and synthetic arithmetic fixtures. Runtime demonstration prices were subsequently removed. The current application contains 100 authored recipes; a separate preview links six real ICA recipes. The main planner has not yet been migrated to ICA-only recipes.

The onboarding quiz collects household size, budget, period, selected meals, dietary style, preparation time, exclusions, dislikes and retailer preferences. The planner aggregates shared ingredients, scales portions, subtracts pantry stock and calculates whole-pack purchase requirements when verified pack data is available. Recipe swaps must respect the same preferences.

The interface includes favourites, recipe browsing, a generated shopping list, local browser persistence, light/dark themes and postcode/store-location features. Nearest-store information does not prove that a quoted price applies at that store. Mathem is treated as an online retailer rather than a nearby physical branch.

### Generative AI

The server integrates Amazon Nova Micro through Amazon Bedrock. AI chooses or edits a plan within the known recipe catalogue and submitted constraints. Server-side validation rejects unknown recipes, invalid meal structures and excluded ingredients. Price arithmetic remains deterministic: the model does not invent product prices. Invalid model output does not replace the existing plan.

AI access uses a private test code configured outside source control. It has a persistent shared daily attempt allowance, a cooldown and an output limit. The recorded configuration allows 20 model attempts per day. This is a prototype usage limit, not a guaranteed account-wide AWS spending cap. Do not include the access code in a public repository, screenshots or a recording.

### Architecture and deployment

Browser → CloudFront HTTPS → nginx on EC2 → local Node.js service → Amazon Bedrock.

The recorded origin connection from CloudFront to EC2 uses HTTP; this is not end-to-end TLS. The origin is restricted to CloudFront traffic and checks a private origin header. The application runs under an unprivileged service account; Bedrock access uses a restricted instance role rather than personal AWS keys embedded in the frontend.

The recorded initial operating estimate was approximately SEK 160–280/month plus usage-dependent charges. It is not a current quotation or guaranteed bill. Actual charges must be checked in AWS Billing. Deployment records are in `docs/DEPLOYED.md`; later price/catalogue status supersedes its older price examples.

## 3. Verification and refinement

On 16 November 2026, the local command `node --test tests/*.test.mjs` completed with **47 passed, 0 failed**. These tests cover planning constraints, pack rounding, missing-price handling, pantry deductions, AI/API validation, quotas, recipe edits, retailer provenance and source integrity. They do not prove present production availability or live retailer price accuracy.

Saved records from 10 November report 14 Python importer/store-session tests and a separate Matbudget QA run with 78 successful browser executions across Chromium, Firefox and WebKit. Those browser and importer results are historical and were not repeated for this submission preparation. Earlier real Bedrock/browser deployment checks are likewise recorded separately from the current local test run.

## 4. Problems and solutions

| Problem | Implemented response | Remaining limitation |
| --- | --- | --- |
| Missing prices could make a basket appear cheapest | Keep incomplete totals unknown and validate retailer-specific quotes | Full live assortment coverage is unavailable |
| Product units and drained weights differ | Review SKU, pack quantity and usable/drained weight; test rounding | Weighted produce may still need explicitly labelled weight estimates |
| Prices could be associated with the wrong physical store | Confirm store selection in isolated anonymous importer sessions | Online/reference prices may differ from a visitor's nearest store |
| AI can return invalid choices | Validate output before applying it; preserve the previous plan on failure | Model failures still consume an attempt |
| Preferences can conflict | Enforce exclusions in generation and replacement and report impossible combinations | Exclusion filters are not certified allergy advice |
| ICA recipe/image attribution | Keep a separate source-linked preview without copied instructions or republished images | ICA-only planner migration is unfinished |

## Current price and recipe limits

The interface lists Willys, Coop, ICA, Lidl, Hemköp and Mathem. The latest saved coverage record, dated 10 November, reports reviewed mappings for 36/36 recipe ingredients at Willys, 36/36 at Mathem and 17 at Hemköp. It also records 2,530 observed searchable products across those three retailers. These are dated observations, not today's guaranteed prices or complete retailer catalogues. ICA, Coop and Lidl do not have complete current verified feeds. Historical Matmoms prices must remain labelled separately.

No claim is made that the application contains every product, guarantees the lowest possible basket, verifies allergy safety, or already uses ICA recipes throughout.

## Run and inspect

Requires Node.js 22 or newer. Extract the source archive and run:

```sh
node server.mjs
```

Open `http://127.0.0.1:8787/`. To run the local automated suite:

```sh
node --test tests/*.test.mjs
```

Local AI is disabled without explicit server configuration. `.env.example` documents configuration; the dependency-free server does not automatically load `.env` files. Live AI also needs AWS permissions and a private access code. The archive intentionally excludes private `var/` state, credentials, runtime caches and logs. Live imported data held outside source may need regeneration; a fresh local copy can therefore display missing prices.

## Supplementary QA and security work

Separate tools were developed for browser QA and authorised assessment of `dev.nation.dev`. QA supports Chromium, Firefox and WebKit, parallel workers, grouped reports, screenshots and manual triage. The security tooling uses official OWASP ZAP passive analysis plus limited single-account, read-only access comparisons. It is not a complete penetration test or a destructive scanner.

Existing report locations in the private NationDev repository:

- QA: https://github.com/NationDev-APL/aws-devops-level3-iteration5/tree/joar.sandholm/qa-reports/nation-dev
- Security: https://github.com/NationDev-APL/aws-devops-level3-iteration5/tree/joar.sandholm/pentest-reports/dev-nation-dev

These links require repository access and are supplementary evidence, not the Matbudget source link. Do not attach private security runtime data or session caches to the coursework.

## Conclusion and next steps

The work produced a meal-planning prototype with an implemented Bedrock integration, a recorded AWS deployment, deterministic shopping calculations and automated tests. The development records illustrate practical tradeoffs in price provenance, validation, deployment and verification. Joar should review this account and add his own reflection before submission.

Priority remaining work: verify live AI access privately, expand trustworthy price coverage, and complete the source-linked ICA migration. No video is included, following the user's updated submission instructions. The project should be submitted as a prototype with these limitations stated.

## Submission-day browser observation

On 16 November, the public interface displayed 87 reviewed price records across three connected chains: Willys 36, Hemköp 16 and Mathem 35. Mathem therefore did not currently provide a complete basket for the displayed plan. The product catalogue displayed 847 Willys, 391 Hemköp and 1,297 Mathem observations. These UI counts do not independently verify current checkout prices. Earlier complete-coverage figures above are historical, not a present coverage guarantee.

