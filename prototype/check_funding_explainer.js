/* ============================================================================
   Layout + accessibility check for prototype/funding_model_explainer.html — the
   "How this funding model works" artifact linked from the Implementation
   Funding tab.

   WHY A SECOND INSTRUMENT. jsdom has no layout engine, so it cannot see the
   defects that matter on a phone: a column clipped out of existence, an element
   pushed past the viewport, a scroll container nobody can reach with a keyboard.
   This runs a real Chromium over nine widths and asserts the things a reader
   would notice. It is deliberately NOT part of `npm test` — CI has jsdom only,
   and adding playwright there makes CI download browsers for a check it never
   runs (see the note in fact-sheet/check_mobile_layout.js).

   The page is served over http rather than opened as a file:// URL, because a
   file:// origin cannot read its own stylesheets and the reduced-motion check
   would then pass by failing to look.

   Usage:
     node prototype/check_funding_explainer.js            # exit 1 on a defect
     node prototype/check_funding_explainer.js --shots DIR

   Requires playwright + a Chromium; in the sandbox that is the newest
   `chromium-<build>` under /opt/pw-browsers (PLAYWRIGHT_CHROMIUM overrides).
   ========================================================================== */
const path=require("path"), fs=require("fs"), http=require("http");
const PAGE = path.join(__dirname, "funding_model_explainer.html");
let chromium;
try { ({ chromium } = require("playwright")); }
catch (e) {
  console.error("playwright is not installed — `npm install playwright` (this check is not part of `npm test`).");
  process.exit(2);
}
function chromiumPath(){
  if (process.env.PLAYWRIGHT_CHROMIUM) return process.env.PLAYWRIGHT_CHROMIUM;
  const root="/opt/pw-browsers";
  try {
    const dir=fs.readdirSync(root).filter(f=>/^chromium-\d+$/.test(f)).sort().pop();
    for (const p of [path.join(root,dir,"chrome-linux","chrome"), path.join(root,"chromium","chrome-linux","chrome")])
      if (fs.existsSync(p)) return p;
  } catch (e) { /* fall through to playwright's own download */ }
  return undefined;
}
// The artifact host wraps the file in a doctype/head/body skeleton; reproduce that.
const inner = fs.readFileSync(PAGE,"utf8");
const page_html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  + '<style>:root{color-scheme:light}body{margin:0;padding:0;font:14px -apple-system,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}</style>'
  + '</head><body>' + inner + '</body></html>';
const srv = http.createServer((req,res)=>{ res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}); res.end(page_html); });

const VIEWPORTS=[[320,700],[360,740],[390,844],[414,896],[560,900],[768,1024],[1024,900],[1280,900],[1440,900]];
let fails=0;
const check=(ok,msg)=>{ if(!ok){fails++; console.log("  FAIL  "+msg);} else console.log("  ok    "+msg); };

(async()=>{
  await new Promise(r=>srv.listen(0,r));
  const url="http://127.0.0.1:"+srv.address().port+"/";
  const browser=await chromium.launch({executablePath:chromiumPath()});
  const page=await browser.newPage();
  const shotsAt=process.argv.indexOf("--shots");
  const shotDir = shotsAt !== -1 ? process.argv[shotsAt+1] : null;
  if (shotDir) fs.mkdirSync(shotDir,{recursive:true});

  for (const [w,h] of VIEWPORTS){
    await page.setViewportSize({width:w,height:h});
    await page.goto(url,{waitUntil:"networkidle"});
    const over = await page.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(over<=0, `${w}px — no sideways page scroll (overflow ${over}px)`);
    // no element pokes past the viewport
    const spill = await page.evaluate((vw)=>{
      let worst=null;
      document.querySelectorAll("body *").forEach(el=>{
        const r=el.getBoundingClientRect();
        if (r.width===0||r.height===0) return;
        // an element inside its own horizontal scroller is allowed to be wider
        let p=el.parentElement, inScroller=false;
        while(p){ const cs=getComputedStyle(p); if(cs.overflowX==="auto"||cs.overflowX==="scroll"){inScroller=true;break;} p=p.parentElement; }
        if (inScroller) return;
        if (r.right > vw + 1 && (!worst || r.right>worst.right)) worst={tag:el.tagName+"."+(el.className||""), right:Math.round(r.right)};
      });
      return worst;
    }, w);
    check(!spill, `${w}px — nothing spills past the viewport` + (spill?` (${spill.tag} to ${spill.right}px)`:""));
    if (shotDir) await page.screenshot({ path: path.join(shotDir, `explainer-${w}.png`), fullPage:false });
  }

  // content + behavior at a phone width
  await page.setViewportSize({width:390,height:844});
  await page.goto(url,{waitUntil:"networkidle"});
  const rows = await page.locator("#tbody tr").count();
  check(rows===115, `all 115 colleges render (got ${rows})`);
  const flowRows = await page.locator("#flow .flow-row").count();
  check(flowRows===8, `money flow has 8 rows (got ${flowRows})`);
  const prios = await page.locator("#prios .prio").count();
  check(prios===3, `three priorities render (got ${prios})`);
  const firstPrio = (await page.locator("#prios .prio .name").first().textContent()).trim();
  check(/Priority 1 · Access/.test(firstPrio), `priority 1 is Access, matching the saved order (got "${firstPrio}")`);
  await page.fill("#q","delta");
  const filtered = await page.locator("#tbody tr").count();
  const cnt = (await page.locator("#count").textContent()).trim();
  check(filtered>0 && filtered<115 && /of 115 colleges/.test(cnt), `search filters and reports ("${cnt}", ${filtered} rows)`);
  await page.fill("#q","");
  check((await page.locator("#tbody tr").count())===115, "clearing the search restores every row");

  // headline figures came from the data, not the prose
  const pool = (await page.locator("#f-pool").textContent()).trim();
  check(pool==="$24,240,308", `headline pool is computed (${pool})`);

  // accessibility structure
  const a11y = await page.evaluate(()=>{
    const out={};
    out.skip = !!document.querySelector("a.skip[href='#start']") && !!document.getElementById("start");
    out.h1 = document.querySelectorAll("h1").length;
    const hs=[...document.querySelectorAll("h1,h2,h3")].map(h=>+h.tagName[1]);
    out.jump = hs.some((v,i)=> i>0 && v-hs[i-1] > 1);
    const heads=[...document.querySelectorAll("thead th")];
    out.thScope = heads.length>0 && heads.every(th=>th.getAttribute("scope")==="col");
    out.rowScope = [...document.querySelectorAll("tbody th")].every(th=>th.getAttribute("scope")==="row");
    const reg=document.querySelector("[role='region']");
    out.region = !!reg && !!reg.getAttribute("aria-label") && reg.getAttribute("tabindex")==="0";
    out.status = !!document.querySelector("#count[role='status'][aria-live]");
    out.label = !!document.querySelector("label[for='q']") && !!document.getElementById("q");
    out.title = (document.querySelector("title")||{}).textContent;
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    out.bodyPainted = bodyBg !== "rgba(0, 0, 0, 0)" && bodyBg !== "transparent";
    return out;
  });
  check(a11y.skip, "skip link points at a real target");
  check(a11y.h1===1, `exactly one h1 (got ${a11y.h1})`);
  check(!a11y.jump, "no skipped heading levels");
  check(a11y.thScope, "every column header carries scope=col");
  check(a11y.rowScope, "every row header carries scope=row");
  check(a11y.region, "the scrolling table is a focusable, labeled region");
  check(a11y.status, "the result count is announced (role=status, aria-live)");
  check(a11y.label, "the search input has a real label");
  check(a11y.bodyPainted, "body paints its own background (never borrows the host ground)");
  check(a11y.title==="How This Funding Model Works", `title is set (${a11y.title})`);

  // reduced motion + focus visibility
  // Cross-origin sheets (Google Fonts) always throw on .cssRules — skip those,
  // but require that at least one sheet WAS readable, or "not found" would be
  // indistinguishable from "could not look" (the Sky175 trap).
  const motion = await page.evaluate(()=>{
    let readable = 0, found = false;
    for (const s of document.styleSheets){
      let rules; try{ rules = s.cssRules; }catch(e){ continue; }
      if(!rules) continue;
      readable++;
      for (const r of rules) if (r.media && /prefers-reduced-motion/.test(r.conditionText||r.media.mediaText)) found = true;
    }
    return { readable, found };
  });
  check(motion.readable>0 && motion.found, `a prefers-reduced-motion block is present (${motion.readable} readable sheet(s), found=${motion.found})`);
  // Reload so focus starts at the document — the earlier fill() left the search
  // input focused, which made Tab land on whatever follows it.
  await page.goto(url,{waitUntil:"networkidle"});
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(()=>{
    const el=document.activeElement; const cs=getComputedStyle(el);
    return { tag:el.tagName, cls:el.className, outline:cs.outlineWidth, style:cs.outlineStyle };
  });
  check(focused.cls==="skip", `first tab stop is the skip link (got ${focused.tag}.${focused.cls})`);

  await browser.close(); srv.close();
  console.log(fails? `\n${fails} check(s) FAILED` : "\nAll checks passed");
  process.exit(fails?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
