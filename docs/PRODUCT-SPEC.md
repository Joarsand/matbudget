# Product specification

Status: initial scope, 9 November 2026. Working name: Grocery Budget / Matbudget.

## Confirmed needs

- Initial area: Stockholm.
- Store chains of interest: Willys, Coop and ICA; extensible later.
- Compare food prices and show where a planned basket costs least.
- Plan for a week or a month, within the user's chosen budget.
- Breakfast, lunch and dinner can each be included or excluded.
- GenAI helps build a personalised meal plan and shopping list.
- The user wants a simple website.
- Recipes are a central part of the budget plan, tailored to the selected meals
  and preferences such as vegetarian food and easy preparation.

## Recipe requirements

Each proposed meal includes a recipe with a name, selected meal type, number of
portions, ingredient quantities and units, preparation/cooking time, difficulty,
and clear numbered cooking instructions. Include total purchase cost for required
packs separately from the estimated ingredient-consumption cost per portion.
Show which selected store prices support the estimate and any missing prices.

Users can choose dietary preferences (including vegetarian), a simplicity setting
such as easy/few ingredients, maximum cooking time, disliked ingredients and hard
allergen exclusions. Vegetarian and vegan are distinct choices. Difficulty, time,
number of ingredients and price are separate attributes, rather than assuming a
cheap recipe is easy or fast.

Generate only recipes for the selected breakfast/lunch/dinner coverage. Scale
quantities to household portions and merge shared ingredients into one shopping
list. Prefer reusing ingredients and planned leftovers when compatible with the
user's choices. The plan's total purchase cost must be calculated over the combined
shopping list, not by adding independently rounded per-recipe shopping baskets.

Replacing a recipe preserves the user's hard restrictions and recalculates the
remaining budget and all affected shopping quantities. If a preference combination
cannot fit the budget using available priced products, explain the shortfall and
ask the user to change a constraint; do not silently relax restrictions.

## First complete user flow

Start with a short optional onboarding quiz, shown on the first visit and editable
later. Five steps collect household and budget/period, meal coverage, dietary style
and cooking effort/time, exclusions/disliked ingredients, and selected retailers/
memberships/store count. Only completion applies the answers; cancel/skip preserves
the existing plan. Invalid or unsupported combinations must be explained without
silently relaxing preferences or destroying a previous valid plan.

1. Choose a Stockholm postcode or specific stores, household size, date range and
   budget in SEK.
2. Select meals to cover: breakfast, lunch, dinner; allow different selections per
   day in a later iteration. Excluded meals contribute no portions or ingredients.
3. Enter food preferences, exclusions, cooking-time limit, existing pantry items,
   eligible memberships and the maximum number of stores to visit.
4. Generate an AI meal proposal from the available ingredient/product catalogue.
5. Validate its structure and constraints. Price the required purchase quantities
   with deterministic code, not the model's estimated arithmetic.
6. Show the menu, shopping list, purchase cost, remaining budget and price-data
   coverage. Let the user replace a meal and recalculate.
7. Compare the complete basket at each selected store. Optionally show a split
   basket, with the number of stores and any entered travel/collection costs.

## Meal and budget rules

- Model portions per person per selected meal and day.
- A month means the actual selected calendar dates; it is not always four weeks.
- Distinguish the cost of ingredients consumed from the money spent on whole packs.
- Aggregate shared ingredients across meals before deciding how many packs to buy.
- Subtract compatible pantry quantities once, with consistent units.
- Represent currency in integer ore and convert to SEK only for display.
- Unknown price or missing product is not a zero-cost line.
- Do not declare a basket cheapest if its missing items make the comparison incomplete.
- If no priced plan fits the budget, explain the gap and offer editable options;
  do not silently exceed the budget or omit selected meals.
- “Cheapest” means cheapest among the selected stores and supported products using
  the recorded prices, not cheapest anywhere in Stockholm.

## Comparison integrity

- Exact product matches (such as a verified GTIN) and substitute products are distinct.
- Compare compatible units and pack sizes; show substitutions explicitly.
- Membership prices only apply to memberships the user says they have.
- Promotions need their date range, pack-count conditions and purchase limits.
- Show whether each observation is online or physical-store pricing.
- Include collection/delivery fees where known; unknown fees remain visible.
- Multi-store savings are compared with a single-store baseline using identical
  requirements and quantities. Include only entered/verified travel costs; do not
  imply travel time is free or that the split option is always worthwhile.

## Central GenAI feature

The model proposes recipes, ingredient quantities, substitutions and explanations
using the user's constraints and the supplied catalogue. It does not invent store
prices, stock availability or verified dietary suitability.

Generated output should reference known ingredient IDs and be schema-validated.
Check selected meal coverage, portions, excluded foods, available catalogue entries
and calculated budget before showing a plan as valid. Store/provider keys stay on
the server. Missing credentials must be shown as an unconfigured AI feature, not
disguised with fixed recipes presented as model output.

Allergen restrictions are hard exclusions, not trade-offs for a lower price.
Unknown allergen suitability must remain unknown or exclude that product from a
restricted plan. The app is not a medical nutrition advisor and must not claim that
an AI-generated plan guarantees nutritional completeness or allergen safety.

## Initial screens

1. Plan setup: budget, dates, meals, household, preferences and local stores.
2. Meal plan: breakfast/lunch/dinner cards, portions and edit/replace actions.
3. Basket comparison: store totals, completeness, fees and optional split basket.
4. Shopping list: quantities, packs, assigned store, source and observation date.

## Price-data delivery stages

1. Build the pricing/import flow using explicitly labelled example data or a small
   manually verified dataset. An example dataset must never be presented as current
   Willys/Coop/ICA prices.
2. Validate an authorised and sustainable source for each chain/store. No working
   public chain API has been established by the initial research.
3. Add automatic refresh only when the data source, access and update behaviour are
   understood. Do not build a promise of nationwide live coverage into the UI.

## Suggested acceptance checks

- Selecting dinner only produces no breakfast/lunch entries or shopping quantities.
- All three meals for seven days cover the exact requested person-meal count.
- A 31-day plan covers 31 days, not 28.
- Buying 750 g with 500 g packs requires two packs; show the leftover quantity.
- A missing price prevents a misleading complete/cheapest claim.
- A member-only promotion cannot lower the total for a non-member.
- Replacing a meal updates aggregated ingredient needs, pack counts and totals.
- Model-generated unknown products, excluded ingredients or invalid output are
  rejected or corrected without showing them as a valid priced plan.
- If the AI/API fails, retain the user's inputs and show a useful retry state.
- A vegetarian + easy + maximum-20-minute selection produces recipes respecting
  that diet and declared complexity/time, with no excluded ingredients.
- Every planned meal has a readable recipe, scaled ingredient amounts and cooking
  steps; recipe cost is clearly distinguished from whole-pack purchase cost.
- Recipes that share ingredients produce one aggregated shopping requirement,
  without charging the same reusable purchased pack multiple times.

## Decisions still needed

- Initial Stockholm postcode or the first exact stores.
- Interface language (the coursework documentation/video remain English).
- AI provider, credentials, usage budget and AWS deployment method.
- Source and permitted reuse of store price data.
- Exact dietary choices, operational definitions of difficulty, and whether to use
  generated recipes, a curated recipe catalogue, or a combination.
- Whether accounts and cloud-saved plans are needed in the first release.

## Coursework work log

9 November 2026: read both supplied coursework PDFs; clarified Stockholm and
independent breakfast/lunch/dinner selection; researched official retailer pricing
and promotion information; created this initial specification. No AI integration,
live price ingestion, UI implementation or AWS deployment has been completed.

9 November 2026, recipe clarification: the user explicitly wants budget-matched
recipes adapted to choices such as vegetarian and easy cooking. Added recipe
content, preference handling, pricing/aggregation rules and acceptance checks.

9 November 2026, implementation: built and checked the first local prototype
using authored recipes and clearly synthetic prices. User chose to postpone AI
provider selection until after the prototype. Added thirteen common chain/online
options at the user's request, select-all/clear controls, grouped format information
and honest partial-catalogue handling. See VALIDATION.md for observed checks and
remaining limitations. The first real API integration and AWS deployment are pending.

9 November 2026, onboarding: implemented the requested quick initial quiz and an
editable local preference profile. Specific disliked ingredients now affect recipe
generation and replacement. The quiz uses the current authored-recipe planner;
it is not itself a connected AI feature.

9 November 2026, catalogue/theme update: expanded the authored catalogue to 50
recipes, added persistent light/dark themes and made automatic shopping-list
generation explicit. The user confirmed that the plan should create a shopping
list automatically. Shared ingredients, whole-pack pricing and pantry deductions
continue to be calculated by the existing deterministic engine.
