# Real price integration — current state, 9 November 2026

Application: https://dw911x8c8grll.cloudfront.net/

## What is actually connected

The production refresh completed successfully with **57 reviewed ingredient/SKU
observations from three sources**:

| Chain | Actual source context | Current reviewed observations |
|---|---|---:|
| Willys | Stockholm Sköndal, store 2295, published online campaign catalogue | 10 |
| Hemköp | Stockholm Torsplan, store 4190, published online campaign catalogue | 17 |
| Mathem | Mathem online, delivery area not selected/verified | 30 |

These counts describe the current reviewed mapping set, not complete retailer
catalogues. Sources can remove products or change packs; counts can fall at the
next refresh. No paid provider, account signup or subscription was added.
All thirteen chains remain selectable, but **ten are not price-connected**.
This does not fulfil the user's full request for automatic prices at every chain.

| Remaining chain | Current integration status |
|---|---|
| ICA | No verified per-store product connector installed |
| Coop | No verified per-store product connector installed |
| Lidl | Offers/structured source not yet verified for this app |
| City Gross | Public search response requires a different adapter; no reviewed feed installed |
| Tempo | Public offers exist; no reviewed local-store SKU feed installed |
| Handlar'n | No reviewed current local-store feed installed |
| Matöppet | Public offer PDFs exist; no verified parser/mapping installed |
| X:-tra | Public offer images exist; no verified parser/mapping installed |
| Eurocash | Public offers exist; no reviewed store/product connector installed |
| Matsmart | Public shop inspected; no verified product connector installed |

Do not treat chain-level minimum offer prices as prices in the user's own store.
Historical Matmoms data, old campaigns and Primat demo samples were researched
but are **not** production price sources. Additional source access and reviewed
product mappings are still needed for the remaining chains. Do not invent values
or use percentage multipliers to make their cards look complete.

## Price semantics and correctness

- The site uses actual published **ordinary online pack prices**. For Mathem,
  `undiscountedGrossPrice` is used when the product is on a conditional discount;
  otherwise its published `grossPrice` is used. For Axfood responses, `priceValue`
  is the ordinary price and promotion objects are kept as condition metadata.
- Member prices, bundle discounts, promotion purchase limits, delivery fees and
  travel are not deducted. The interface says so. Checkout may therefore be lower
  because of a valid discount, or differ because of availability/delivery.
- SKU mappings were manually reviewed. Search rank and fuzzy names do not choose
  substitute products automatically. Pack text must still match on refresh.
- Actual pack quantities override the old recipe-catalogue assumptions. For
  example eggs can use 10, 15 or 20 eggs per pack, depending on retailer/SKU.
- Canned chickpeas/beans/corn use documented **drained** quantities for recipe
  requirements while the shopper still sees the actual package label.
- Variable-weight Axfood SKUs are excluded. Pieces and grams are not converted
  using invented fruit weights. Several ingredients consequently remain unpriced.
- Recipe ingredient matching does not certify allergen safety. Users must check
  actual products and ingredient lists. The recipe filters are not medical advice.
- No model-provided prices are accepted. Budget arithmetic remains deterministic.
- The interface shows known partial costs explicitly as **not the total**, and
  hides total/remaining budget/cheapest basket when requirements are incomplete.
  A 'lowest' badge compares only complete price datasets, not unpriced retailers.

## Automatic operation

`scripts/sync-prices.py` performs bounded reads of the two Axfood campaign feeds
and exact reviewed Mathem searches. Mathem product identity and package text are
validated, including an extra drained-weight check for its reviewed chickpeas.
Responses are parsed as data; no third-party JavaScript is executed.

`matbudget-prices.timer` schedules four refreshes daily at approximately 00:30,
06:30, 12:30 and 18:30 Europe/Stockholm, with up to two minutes of jitter.
It is enabled on the existing EC2 instance. The initial server-side job exited
successfully. No new AWS resource was needed beyond the existing application.
Access-denied/quota responses stop a source rather than triggering circumvention.

The production file is `/var/lib/matbudget/price-book.json`, readable by the app.
The private service config selects it with PRICEBOOK_STATE_FILE. Updates replace
the data file atomically. The Node endpoint `/api/prices` serves the curated data;
ordinary page views do not call the retailers directly. It exposes no AWS keys or
AI access codes. Browser price state refreshes every ten minutes.

Observations older than 36 hours, future-dated observations, incompatible units,
invalid amounts/prices and unapproved source hosts are rejected. A failed source
does not result in a generated replacement price. Earlier Axfood observations
can be retained only with their original checkedAt; the same freshness check
still applies. Price history and storage are not an account-wide spending cap.

## Files and validation

- `web/price-book.mjs`: quote validation, source-host whitelist for all 13 chains,
  freshness and controlled application to the ingredient catalogue.
- `web/engine.mjs`: actual retailer pack sizes, unknown-price propagation and a
  display basket with the most known lines without inventing a complete total.
- `web/price-panel.mjs`: retailer coverage, source links, timestamps and real
  product prices; refresh and stale-data handling.
- `scripts/sync-prices.py`, `scripts/mathem-reviewed.json`: retailer readers and
  the reviewed Mathem ID/package mapping. `research_mathem.py` supplies a pure
  JSON/RSC data parser; its manual-research CLI is not run by the service.
- `deploy/matbudget-prices.service`, `.timer`, `publish-prices.py`: production
  publication and refresh. Deployment preserves AI secrets and its attempt quota.

27 Node tests passed, including true pack rounding, expired quotes, unknown
prices and isolation between retailers. Public HTTPS browser tests verified a
complete test basket against the actual feed with independent arithmetic,
shopping quantities, 13-chain coverage status, source links and mobile width.
An isolated outage check also verified that missing prices never become zero or
a fabricated total. No paid AI request was made during these price checks.

## Next work required for full coverage

Obtain usable, permitted current per-store product/price sources for the remaining
ten chains, then review their SKU, pack, condition and location mappings. National
offers, images, historical observations and unverified chain averages must not be
silently treated as complete local-store catalogues. Until that evidence exists,
keep the affected rows visibly missing. The all-thirteen request remains partial.
