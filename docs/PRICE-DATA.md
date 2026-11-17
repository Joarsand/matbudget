# Current implementation

See [REAL-PRICE-INTEGRATION.md](REAL-PRICE-INTEGRATION.md): three live sources, 57 reviewed prices, ten chains still unconnected. The investigation below predates that implementation.

# Initial price-data research

## Expanded chain catalogue

The prototype lists thirteen chain/online choices: ICA, Coop, Willys, Lidl, Hemköp,
City Gross, Tempo, Handlar'n, Matöppet, X:-tra, Eurocash, Mathem and Matsmart.
This is a broad initial catalogue, not a claim to list every independent grocery
shop in Sweden. Entries are not connected retailer feeds and do not establish
that a particular store or delivery service covers the user's postcode.

Official references checked on 9 November 2026:

- Axfood organisation and chain links: https://www.axfood.se/om-axfood/organisation/
- Lidl store finder: https://www.lidl.se/c/hitta-din-butik/s10017809
- X:-tra store list: https://www.x-tra.se/butiker
- Mathem online shop: https://www.mathem.se/se/
- Matsmart ordering information: https://www.matsmart.se/info/handla-och-betala
- ICA formats: https://www.icafastigheter.se/icas-fyra-profiler/

ICA Maxi/Kvantum/Supermarket/Nära are grouped under ICA; Stora Coop under Coop
and Willys Hemma under Willys. Real comparisons must eventually use identified
individual stores rather than treating these formats as one real price list.
Matsmart has an intentionally incomplete example catalogue to exercise the
missing-price state; this does not assert its actual current assortment.

Researched 9 November 2026. These are retailer information sources, not verified
API integrations or permission to republish their complete product catalogues.

## Verified retailer information

- ICA online terms describe checkout prices, deposit additions, variable-weight
  products, store-dependent collection/delivery fees and loyalty pricing.
  Source: https://www.ica.se/handlaonline-kopvillkor/
- Coop says promotions may differ between physical stores and e-commerce, and
  membership prices require membership identification.
  Source: https://kundservice.coop.se/hc/sv/articles/360016692059-Aktuella-erbjudanden-kampanjpriser-och-medlemspriser
- Willys exposes store-specific promotion pages, for example a page explicitly
  identifying Willys Stockholm Skondal. This is evidence of store-specific offer
  context, not proof of a public reusable price API.
  Source: https://www.willys.se/erbjudanden/butik?StoreID=2295

## What remains unverified

An official, documented public price API suitable for this application has not
been verified for Willys, ICA or Coop. This does not establish that none exists.
Search results or visible shop pages alone do not establish a reliable integration.

Next: investigate provider access, retailer/partner feeds and small verified manual
imports before choosing an automatic ingestion method. Keep the application data
layer independent from any one source so a provider can be replaced.

## Minimum observation fields

Store ID and location; product/variant ID; description; pack quantity and unit;
purchase price in ore; optional unit price; normal/member/promotion classification;
membership condition; multipack conditions; quantity limit; observation timestamp;
offer start/end if known; source URL/provider; online/physical channel; availability
if verified; and an explicit data-kind flag (example, manual verified, or integrated).

Unknown fields must stay unknown. Never treat an old campaign as active simply
because no end date was captured. Display data freshness and basket completeness.
