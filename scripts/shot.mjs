// Dev helper: screenshot a page, optionally signed in as a seeded demo account (needs demo access on the server).
//   node scripts/shot.mjs <url> <out.png> [--w 1440] [--h 900] [--as host|superAdmin|admin|manager|door|planner] [--full] [--wait 800] [--locale en|ar]
import { chromium } from "playwright-core";

const args = process.argv.slice(2);
const [url, out] = args;
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const origin = new URL(url).origin;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: +opt("w", 1440), height: +opt("h", 900) } });
const as = opt("as");
if (as) {
  await page.goto(`${origin}/${opt("locale", "en")}/login`);
  await page.getByTestId(`demo-${as}`).click();
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 30000 });
}
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(+opt("wait", 800));
if (args.includes("--full")) {
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(150); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}
await page.screenshot({ path: out, fullPage: args.includes("--full") });
console.log("saved", out);
await browser.close();
