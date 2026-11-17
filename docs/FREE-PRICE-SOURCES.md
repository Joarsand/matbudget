# Free price-source investigation — 9 November 2026

User decision: investigate free sources first. No signup, paid trial, subscription,
email to a provider or new AWS resource was created during this investigation.
The deployed application still uses explicitly marked demo prices. None of the
research samples below has been relabelled as a complete live shopping basket.

## Findings verified through actual read requests

### Willys retailer campaign source

Request tested successfully without credentials:

https://www.willys.se/search/campaigns?storeId=2295&size=5

Store context previously identified from the retailer offer page:
https://www.willys.se/erbjudanden/butik?StoreID=2295

The response returned five product records with native product code, package
text, standard price and individual promotion conditions/expiry. This proves a
working public read of a limited campaign selection, not complete ingredient
coverage or a contractual guarantee of an official supported integration.
Before production ingestion, review applicable retailer terms and cache/limit
requests rather than forwarding every visitor action to the retailer.

Observed example: Omega frozen salmon, product 101804336_ST, 4 × 125 g.
Standard price was 93.90 SEK. One general promotion was 79.90 SEK per pack;
a separate loyalty promotion required three packs for 179 SEK. Its approximately
59.67 SEK per pack must NOT be used for a one-pack purchase without meeting
membership and quantity conditions. Keep promotion start/end, purchase limits,
qualifying count and channel attached to each observation. This dated sample
must not be hardcoded as an indefinitely current price.

This feed is a useful next integration candidate for one named store. It cannot
price the entire application catalogue or every Swedish chain by itself.

### Matmoms open data

Provider license explicitly permits reuse/adaptation, including commercial use,
under CC BY 4.0 with attribution:
**Källa: Matmoms (matmoms.se) av Gabriel Linton**.

- License: https://github.com/Lingabton/matmoms-tracker/blob/main/LICENSE-DATA.md
- Monthly release inspected: data-2026-10, published 2 November 2026.
- Asset: https://github.com/Lingabton/matmoms-tracker/releases/download/data-2026-10/matmoms-snapshot-2026-10.zip
- Public current summary: https://matmoms.se/data/latest.json
- Public current product catalogue: https://matmoms.se/data/catalog.json

The live summary generatedAt was 2026-11-09T08:13:41.996554 and reported 33 stores,
three chains and 588 products. A recent export timestamp does not establish that
every underlying product price was checked that day. The provider's summary
explicitly marks Coop/Willys as under verification.

The ordinary catalogue has chain-level prices; the export implementation uses
averages across observations/stores. It does not provide the exact chosen-store
observation needed for this app's complete basket comparison. Do not substitute
these values for prices in an individually selected Stockholm store.

The monthly raw CSV exporter does include date, store, city, product/EAN,
purchase/unit price, campaign, member price, availability and category. It is
useful for historical import/testing with attribution. The October snapshot
must not be presented as current November checkout prices. Product/package
mapping still requires validation.

Export implementations inspected (read only; not executed or copied):
https://github.com/Lingabton/matmoms-tracker/blob/main/scripts/export_csv.py
https://github.com/Lingabton/matmoms-tracker/blob/main/scripts/export_site_data.py

### Primat public demo

One public read succeeded:
https://primat.nu/api/v3/demo/products?q=havregryn

It returned up to 25 results, including store/product IDs, GTIN, pack size,
regular/member/multibuy prices, observation confirmation time and source URLs.
The returned note states 250 requests/day/IP and requires attribution. This is
a bounded demo. Older cached search results claiming an ongoing free account
tier conflict with the current live API/data pages, which describe a one-hour
tryout followed by a paid App plan. Do not promise a lasting free production
feed based on an old search snippet or bypass quotas with multiple keys/IPs.

Current provider docs:
https://primat.nu/api
https://primat.nu/data
https://primat.nu/villkor

## Integration decision

Free, unrestricted, current, full-basket coverage for all thirteen listed chains
has NOT been established. A credible first implementation would scope the UI
to explicitly selected, supported stores and a verified set of concrete SKUs.
For every real observation record: retailer/native store ID, SKU/EAN, actual
package amount/unit, purchase price in integer ore, price/channel/condition type,
checkedAt, expiry and source URL. Retain exact package size by retailer/SKU;
do not reuse the prototype's single fictional pack size across different goods.

Fetch/cache bounded retailer data server-side; select compatible products using
reviewed ingredient mappings, never fuzzy name alone. Recalculate whole packs
after matching actual package sizes. Unknown or stale prices must yield an
incomplete basket, not zero, a demo fallback, an invented percentage multiplier
or a claim to be the cheapest. Clearly distinguish online prices from physical
store prices and general promotions from conditional member/multibuy offers.

Do not remove the demo label or claim real prices are deployed until the entire
displayed price path uses verified observations. This research has not changed
the production application's existing demo calculations.
