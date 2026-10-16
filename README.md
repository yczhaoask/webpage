# Veteran Pay Guide

An English-language, responsive website for understanding VA disability compensation and exploring other Veteran benefits.

## Features

- A disability compensation calculator with rating and dependent inputs.
- Official 2026 rates and clearly labeled 2027 estimates based on a 3.6% COLA.
- Official VA and SSA resource links immediately below the calculator.
- A compact next-payment row with an expandable payment calendar and `.ics` download.
- Nine other benefit programs in a collapsible section with category filters.
- Curated policy updates and frequently asked questions.
- Responsive layouts, keyboard controls, and support for reduced motion.

## Run locally

No build step or package installation is required. With Python 3 installed:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in your browser.

## Files

```text
dist/
  index.html   Page content and structure
  style.css    Styles and responsive layouts
  app.js       Calculator, payment schedule, filters, and disclosures
  favicon.svg  Site icon
```

## Deploy

Publish the contents of `dist/` with any static web host. The site does not require a backend. Fonts load from Google Fonts; calculator inputs are processed locally in the browser.

### Vercel

Import this repository with the repository root as the **Root Directory** (leave it at the default; do not select `dist`). The included `vercel.json` selects **Other** as the framework, skips the build step, and publishes `dist/`.

If configuring the settings manually:

- Framework Preset: **Other**
- Root Directory: repository root (default)
- Build Command: override enabled, empty
- Output Directory: **dist**

After changing these settings, deploy the latest `main` commit. Deploying the repository root as the output instead of `dist/` can cause a 404 at `/`, because the homepage is at `dist/index.html`.


## Data maintenance

Benefit content was reviewed on October 15, 2026. Rate data and eligibility summaries are maintained manually. The 2027 dollar amounts are estimates until an official VA rate table is verified. Payment dates are calculated from the payment rule and federal holidays; bank availability can differ.

Official sources are linked next to the relevant information. Special Monthly Compensation, TDIU, offsets, and individual award adjustments are not included in the regular compensation calculator.

This is an independent educational resource, not affiliated with or endorsed by VA, SSA, or the U.S. government.
## SEO and content pages

The canonical production origin is `https://veteranpayguide.com`. Vercel project-domain settings permanently redirect `www.veteranpayguide.com` and the production `vapayguide.vercel.app` hostname to that origin with status 308. These are hosting settings, not DNS changes; preserve them when managing domains. `vercel.json` removes explicit `index.html` URLs and normalizes directory URLs with trailing slashes. Deployment preview hosts are unchanged.

The published HTML includes self-referencing canonicals, an XML sitemap, crawlable internal links, and rate/calendar tables that can be read without JavaScript. Guides cover 2027 rates, payment dates, other benefits, About/sources/corrections, and privacy. Ahrefs analytics is preserved on every page.

Each page also includes its own Open Graph and X card title, description, and canonical sharing URL. The shared `dist/social-preview.png` is a 1200 × 630 PNG using the website's branding. `scripts/build-content.cjs` refreshes these tags for the homepage and every generated page, without duplicating tags or inheriting the homepage's sharing URL on guides. Keep the preview image publicly accessible when deploying.

After reviewing data or changing guide copy, run:

```sh
node scripts/build-content.cjs
```

This reads the calculator data from `dist/app.js`, refreshes generated homepage blocks, and writes the five guide/information pages, `robots.txt`, and `sitemap.xml`. The checked-in output can still be hosted without a build step. Update the explicit source-review dates only after actually checking those sources. Do not mark estimated 2027 amounts as official until an official VA table has been verified.

The guide text lives in `scripts/build-content.cjs`; homepage layout lives in `dist/index.html`. Program cards in the homepage are reused in the full benefits guide. Calculator values and generated rate tables must stay consistent. Update the static next-payment fallback at a substantive review; the interactive next-payment row refreshes using the U.S. Eastern date.

Corrections go to the repository's public GitHub Issues tracker. Never ask visitors to include benefit records or other sensitive information in a public issue.
