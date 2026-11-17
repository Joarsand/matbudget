# Matbudget

AI-assisted meal planning, grocery budgets and shopping lists. Coursework by Joar Sandholm.

- [Web application](https://dw911x8c8grll.cloudfront.net/)
- [Project documentation](PROJECT-DOCUMENTATION.md)
- [Current development and verification](docs/PROGRESS-2026-11-17.md)

## Run

Requires Node.js 22+ and Python 3 for restoring the unchanged illustration from the original source archive:

```sh
python scripts/restore-assets.py
node server.mjs
```

Open http://127.0.0.1:8787/.

```sh
node --test tests/*.test.mjs
python -m unittest discover -s tests -p 'test_*.py'
```

48 Node tests and 15 importer/store-session checks passed on 17 November. Chromium and WebKit passed the controlled local journey. Windows Firefox startup is blocked; the Linux CI run must be assessed separately. Browser QA uses controlled AI responses and does not consume Bedrock usage.

The source is now normal files under web/, server/, scripts/ and tests/. The older ZIP is retained for the unchanged image and the original submission snapshot. The restore script verifies the image checksum. GitHub Actions runs three browser workers with isolated profiles on Linux and saves results/screenshots.

## Prototype limits

The ordinary planner has 100 authored recipes. The separate ICA preview includes source links and migration review; the planner is not yet ICA-only. Full supermarket assortments are not available. The importer currently supports reviewed recipe-product mappings at Willys, Hemkop and Mathem; missing/stale prices must keep totals unknown. Historical Matmoms data is labelled separately.

Local AI is disabled without separately configured AWS permissions and a private access code. See .env.example; the server does not load .env files automatically. No credentials or private runtime state are included. Source changes published here are not automatically deployed to AWS. See the dated progress document for actual deployment status.

