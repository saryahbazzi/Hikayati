import { chromium } from "playwright-core";
const [,, S, loc, w, h, tag, wait] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args:["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(`http://localhost:3111/${loc}`);
await p.waitForTimeout(+wait);
await p.screenshot({ path: `${S}/${tag}.png` });
await b.close();
