import { chromium } from "playwright-core";
const [,, url, out, w="1200", h="800", full] = process.argv;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args:["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto(url); await p.waitForTimeout(+(process.env.WAIT||500));
await p.screenshot({ path: out, fullPage: !!full });
await b.close();
