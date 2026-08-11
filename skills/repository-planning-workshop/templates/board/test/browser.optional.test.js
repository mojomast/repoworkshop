"use strict";
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

test("optional real-browser availability is reported honestly", (context) => {
  const candidates = [process.env.CHROME_BIN, "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean);
  const browser = candidates.find((candidate) => fs.existsSync(candidate));
  if (!browser) { context.skip("SKIP: no installed Chromium/Chrome; deterministic pure UI behavior tests still ran"); return; }
  const result = spawnSync(browser, ["--headless", "--no-sandbox", "--disable-gpu", "--dump-dom", "data:text/html,<title>repoworkshop-browser-check</title><main aria-label='board'>320px accessibility smoke</main>"], { encoding: "utf8", timeout: 15000 });
  if (result.status !== 0 || !result.stdout.includes("repoworkshop-browser-check")) throw new Error(`installed browser smoke failed: ${result.stderr.slice(0, 500)}`);
  console.log(`Optional browser smoke ran with ${browser}; full board interactions remain covered deterministically by pure helper tests.`);
});
