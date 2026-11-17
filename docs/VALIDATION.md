# Prototype validation — 9 November 2026

## Recipe expansion, themes and automatic shopping list

- Expanded from 17 to 50 unique authored recipes: 15 breakfast, 15 lunch, 20 dinner.
  Added nine demo ingredients, including fish with an explicit exclusion choice.
- 16 engine checks passed, including all recipe references/quantities/instructions
  and vegetarian/fish-exclusion behaviour.
- Theme/recipe browser checks passed: quiz/planner toggles, saved theme, OS fallback,
  new recipe replacement/instructions, automatic list visibility, unchanged plan
  and checklist during theme changes, and both mobile themes without overflow.
- Existing quiz and full-prototype integration checks passed with the larger catalogue.
- Dark desktop/mobile previews were inspected; unselected chain-label opacity was
  removed so those labels remain readable. This is not a full accessibility audit.
- Neither real AI nor current retailer prices were introduced by this update.

## Preference quiz extension

- 14 engine checks passed, including disliked-ingredient exclusion from generation
  and rejection of incompatible recipe replacements.
- Chromium quiz integration passed: first-visit display, five-step navigation,
  retained back/next answers, meal/store validation, full application of answers to
  the planner, excluded onion, saved profile/reload, skip without overwriting the
  plan, incompatible-combination recovery, actual February month length and 390px
  layout without overflow. No JavaScript errors were recorded.
- The existing full prototype browser check passed after the onboarding addition.
- Desktop/mobile quiz screenshots were rendered and inspected in test-artifacts/.

## Scope and result

Implemented a local prototype with fixed recipes and synthetic retailer prices.
No AI API, retailer ingestion, GitHub publication or AWS resource was created.

- 13 Node.js engine checks passed: selected meals, household quantities, calendar
  month lengths, dietary/time/difficulty exclusions, aggregated whole-pack costs,
  pantry subtraction, membership eligibility, missing-price handling, replacement
  validation, split-store limits, over-budget preservation and expanded chain support.
- Chromium integration checks passed: recipe dialogs and replacement, dinner-only
  selection, vegan/15-minute filtering, January's 31 days and final partial week,
  explicit over-budget state, split shopping, persisted list checkmarks, empty-meal
  validation, 13 chain options, select all/clear, incomplete basket display, and
  390px layout without horizontal overflow.
- Browser checks recorded no JavaScript errors or external network requests.
- Desktop and mobile screenshots were inspected in `test-artifacts/` (ignored).
- The user-facing local browser displayed the updated thirteen-chain selector.

## Problems and actual fixes

1. The initial local preview process listened on port 8787 but was unreachable
   from the user-facing browser. Restarted that owned process with the required
   local-network execution permissions; HTTP returned 200 and the actual browser
   then displayed Matbudget. Kept the server bound to 127.0.0.1.
2. Pack rounding returned JavaScript negative zero when pantry stock covered an
   entire ingredient. Clamped pack count to zero; the test now passes.
3. Custom checkbox labels cover the visually hidden native inputs. Integration
   checks now click the actual visible label and assert the input state, matching
   how the user operates these controls.

## Remaining limitations

- AI is visibly unconnected; recipes are from a small authored catalogue.
- Prices, allergens, packages and store availability are demonstration data.
- Chain presence does not verify local Stockholm availability or delivery coverage.
- Matsmart's deliberately partial example catalogue must not win with missing lines.
- Recipe planning uses a bounded heuristic, not proof of the globally cheapest menu.
- Per-portion ingredient estimates and full-pack shopping outlay are separate.
- No real authentication, account storage or cloud deployment is implemented yet.
