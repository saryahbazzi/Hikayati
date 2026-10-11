import { chromium } from "playwright-core";
const O="http://localhost:3203";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",args:["--no-sandbox"]});
const out=[];const log=(n,ok,x="")=>{out.push(`${ok?"PASS":"FAIL"} ${n} ${x}`);};
async function as(key){const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();
 await p.goto(`${O}/en/login`);await p.getByTestId(`demo-${key}`).click();await p.waitForURL(u=>!u.pathname.endsWith("/login"),{timeout:30000});return p;}
const path=p=>new URL(p.url()).pathname;
// host
let p=await as("host");
await p.goto(`${O}/en/admin`);log("host /admin -> not-authorized",path(p)==="/en/not-authorized",path(p));
await p.goto(`${O}/en/admin/packages`);log("host /admin/packages blocked",path(p)==="/en/not-authorized",path(p));
let r=await p.request.get(`${O}/api/admin/reports`);log("host report csv 403",r.status()===403,String(r.status()));
// anonymous
const anon=await (await b.newContext()).newPage();await anon.goto(`${O}/en/admin`);log("anon -> login",path(anon)==="/en/login",path(anon));
// manager
p=await as("manager");
await p.goto(`${O}/en/admin/events`);
const rows=await p.locator("tbody tr").allInnerTexts();
log("manager sees assigned events only (2 of 3)",rows.length===2,JSON.stringify(rows.map(x=>x.split("\n")[0])));
const nav=await p.locator("#admin-menu nav a").allInnerTexts();log("manager nav",!nav.includes("Packages & pricing")&&!nav.includes("Team & permissions"),nav.join("|"));
for(const s of["packages","team","customers","audit","settings","reports","templates","messaging"]){await p.goto(`${O}/en/admin/${s}`);log(`manager /admin/${s} blocked`,path(p)==="/en/not-authorized",path(p));}
// find ids
await p.goto(`${O}/en/admin/events`);
const links=await p.locator("tbody a").evaluateAll(a=>a.map(x=>[x.textContent,x.getAttribute("href")]));
const dinner = null;
// door
p=await as("door");
await p.goto(`${O}/en/admin/checkin`);
const cards=await p.locator("ul[aria-label] li h2").allInnerTexts();log("door sees assigned check-in events only",cards.length===1,cards.join("|"));
const href=await p.locator("ul[aria-label] li a").first().getAttribute("href");
await p.goto(O+href);log("door opens scanner",path(p)===href&&await p.getByText("Manual entry").count()>0,path(p));
for(const s of["packages","team","events","guests","customers"]){await p.goto(`${O}/en/admin/${s}`);log(`door /admin/${s} blocked`,path(p)==="/en/not-authorized",path(p));}
// door cannot open other event scanner
const other=links.find(l=>!href.endsWith(l[1].split("/").pop()));
await p.goto(`${O}/en/admin/checkin/${other[1].split("/").pop()}`);const t404=await p.getByText(/isn.t part of the story/).count();log("door other event scanner not accessible",t404>0||path(p)==="/en/not-authorized",path(p));
// check-in flow: simulate
await p.goto(O+href);
const cnt=async()=>(await p.locator("section[aria-label='Checked in'] p").nth(1).innerText()).replace(/\s+/g," ");
const before=await cnt();
await p.locator("#simulate select").selectOption({index:1});
await p.getByRole("button",{name:"Simulate check-in"}).click();
await p.getByText("Checked in",{exact:true}).first().waitFor({timeout:15000});
await p.waitForTimeout(500);
const after=await cnt();log("counter increments after simulate",before!==after,`${before} -> ${after}`);
await p.screenshot({path:"/tmp/shots/door-after.png",fullPage:true});
// manual token: get a token via superAdmin? use already-checked guest second attempt via pass token fetch below
console.log(out.join("\n"));await b.close();
