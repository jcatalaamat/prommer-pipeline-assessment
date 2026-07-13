// Step 2: GENERATE — feed content.json into Claude, produce a competitive
// brand-pulse report grounded in what step 1 actually scraped.
import { readFileSync, writeFileSync } from "node:fs";

// Source the key from the shared secrets file — never inline a key in source.
const secrets = readFileSync(process.env.HOME + "/.config/astral/secrets.env", "utf8");
const key = secrets.match(/^ANTHROPIC_API_KEY=(.+)$/m)?.[1]?.trim();
if (!key) throw new Error("ANTHROPIC_API_KEY not found in secrets.env");

const content = JSON.parse(readFileSync("content.json", "utf8"));

const prompt = `You are a sharp brand strategist. Below is structured signal scraped live from
prommer.net (Thomas Prommer's personal site — tech executive + hybrid athlete, founder of
We The Flywheel):

${JSON.stringify(content, null, 2)}

Known additional context (observed directly, not in the scrape): the site runs a dual-vertical
structure (Tech & AI / Training), a live "recent activity" feed showing tool-tagged dev commits
(badges: Claude Code, Droid, Codex, Copilot, Resolve.ai), and an "Ask AI Tom" RAG chatbot grounded
over 700+ published pages with citations.

Its genre peers are other indie/operator personal sites: danabra.mov, daniel.bz, swyx.io,
simonwillison.net — same shape (personal domain, published writing, tool-forward), different
positioning.

Write a short "competitive brand-pulse" report in markdown with:
1. A one-paragraph read on prommer.net's current positioning and content cadence based on the
   actual scraped signal above (cite specifics — press wins, hero framing, tool badges).
2. How it differs from the genre peers in one paragraph (general knowledge of that space is fine).
3. Exactly 3 concrete, specific recommendations grounded in what was scraped — not generic
   "post more content" advice. Each one sentence, each actionable this week.

Keep it under 250 words total. Output raw markdown only, no preamble.`;

const res = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
  },
  body: JSON.stringify({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  }),
});

if (!res.ok) {
  const errText = await res.text();
  throw new Error(`Anthropic API error: ${res.status} ${errText}`);
}

const data = await res.json();
const report = data.content.map((b) => b.text).join("");
writeFileSync("report.md", report);
console.log("Wrote report.md:\n");
console.log(report);
