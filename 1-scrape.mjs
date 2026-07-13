// Step 1: SCRAPE — render prommer.net (client-side Vite SPA) with a headless browser,
// extract press/publications/activity signal into content.json.
//
// FIX: an initial version used plain fetch() + regex on the raw HTML response.
// That failed — prommer.net is a Vite SPA with no SSR: the raw HTML has no
// "FEATURED PUBLICATIONS" / "RECENT ACTIVITY" text at all, it's rendered client-side
// after JS runs. Switched to Playwright to actually render the page before extracting.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const URL = "https://prommer.net";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(URL, { waitUntil: "networkidle" });

const content = await page.evaluate(() => {
  function textOf(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : null;
  }
  // FIX #2 (rev): "leaf element" filter assumed one element holds the full string,
  // but title/date are split across sibling spans inside the anchor — no true leaf
  // matched. Fixed by matching on ANY element's full textContent, then keeping only
  // the most specific match per pattern (drop an element if a descendant also matches
  // the same pattern — that descendant is the tighter match).
  function specificMatches(pattern) {
    const all = [...document.querySelectorAll("a,li,div,span")].filter((el) =>
      pattern.test(el.textContent.replace(/\s+/g, " ").trim())
    );
    const minimal = all.filter((el) => ![...el.querySelectorAll("*")].some((d) => all.includes(d)));
    return [...new Set(minimal.map((el) => el.textContent.replace(/\s+/g, " ").trim()))];
  }

  return {
    title: document.title,
    hero: textOf(document.querySelector("h1")),
    publications: specificMatches(/· (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) 20\d\d/),
    activity: specificMatches(/\d+ (hour|minute|day)s? ago$/),
    press: specificMatches(/names Thomas Prommer|World Changing Idea|Global CIO/i),
  };
});

await browser.close();

const out = { url: URL, fetchedAt: new Date().toISOString(), ...content };
writeFileSync("content.json", JSON.stringify(out, null, 2));
console.log("Wrote content.json:");
console.log(JSON.stringify(out, null, 2));
