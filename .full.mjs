import { chromium } from "playwright-core";
const [,, S, path, w, name] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args:["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: +w, height: 900 } });
await p.goto(`http://localhost:3111${path}`);
await p.waitForTimeout(1500);
const h = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(200); }
await p.waitForTimeout(1200);
await p.evaluate(() => window.scrollTo(0, 0));
await p.screenshot({ path: `${S}/${name}.png`, fullPage: true });
await b.close();
