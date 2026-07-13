# prommer.net brand-pulse pipeline

3-step agentic pipeline built for the We The Flywheel Sr Agentic Engineer assessment.

1. `1-scrape.mjs` — renders prommer.net with Playwright (it's a client-side Vite SPA,
   plain `fetch()` returns no content) and extracts press mentions, title, hero copy
   into `content.json`.
2. `2-generate.mjs` — feeds `content.json` to Claude (Anthropic Messages API) to produce
   a grounded competitive brand-pulse report → `report.md`.
3. `gh gist create --public report.md` — publishes the report.

Run: `node 1-scrape.mjs && node 2-generate.mjs && gh gist create --public report.md`
