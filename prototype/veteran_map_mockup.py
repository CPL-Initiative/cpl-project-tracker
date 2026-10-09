#!/usr/bin/env python3
"""
veteran_map_mockup.py: the veteran map on First Light, a mock-up for Sam (S349).

The public veteran map (veteran-sprint-map/ca_cpl_map_selfcontained.html) passes
AA, the 24px targets and the keyboard, and is not First Light: its own palette,
30 raw hex values outside :root, the system font stack, no dark mode (the S347 UI
pass). A public page's look changes through a mock-up Sam approves, then a port
into its builder, the order the Sierra redesign followed.

Real assets, not placeholders: the colleges, installations, pairings, boundary
and projection come from veteran-sprint-map/build_selfcontained.py itself, and
the counts of service members and veterans served are read from today's
live_metrics.json through extract_military.snapshot(), with the date printed on
the page. Behavior is the deliverable's: an installation ranks its six nearest
colleges, a college opens its CPL page, zoom, pan, regions, layers, directories.

What changes, and why:
  - First Light tokens in :root only, light and dark on the cpl_theme contract;
    Playfair Display and Source Sans 3 embedded, so the page still loads nothing.
  - Installations are ink stars, not crimson: crimson is First Light's alert.
  - Every control is a word (Zoom in, Zoom out, Reset); no glyph in the prose.
  - Controls sit beside the map, never over it, so a phone sees the whole state.
  - The headline figure is today's, with its date (the page showed 30 June's).
  - The Details pane said its instruction twice; it says it once.

Run: python3 prototype/veteran_map_mockup.py  ->  prototype/veteran_map_mockup.html
"""
import base64, json, os, sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
VSM = os.path.join(ROOT, "veteran-sprint-map")
sys.path.insert(0, VSM)

import build_selfcontained as B   # data only; it writes its page only when run
import extract_military as E

payload, missing = E.snapshot(os.path.join(ROOT, "live_metrics.json"))
fresh = payload["colleges"]
colleges = [dict(c, m=fresh.get(c["n"])) for c in B.colleges]
as_of = (payload.get("_as_of") or "")[:10]
as_of_words = datetime.strptime(as_of, "%Y-%m-%d").strftime("%B %-d, %Y") if as_of else ""

DATA_JS = json.dumps({"colleges": colleges, "bases": B.bases, "pairs": B.pairs,
                      "W": round(B.W, 2), "H": round(B.H, 2), "boundary": B.boundary_d,
                      "portal": B.PORTAL, "milTotal": payload["_statewide_military_total"],
                      "asOf": as_of_words}, ensure_ascii=False)


def font(name):
    with open(os.path.join(ROOT, "sierra", "fonts", name), "rb") as f:
        return "data:font/woff2;base64," + base64.b64encode(f.read()).decode("ascii")


FONTS = "\n".join(
    "@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:swap;src:url(%s) format('woff2')}"
    % (fam, w, font(fn)) for fam, w, fn in [
        ("Playfair Display", 600, "playfair-display-latin-600-normal.woff2"),
        ("Source Sans 3", 400, "source-sans-3-latin-400-normal.woff2"),
        ("Source Sans 3", 600, "source-sans-3-latin-600-normal.woff2"),
        ("Source Sans 3", 700, "source-sans-3-latin-700-normal.woff2")])

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Colleges and Installations</title>
<!-- The theme a reader chose in COBI (cpl_theme, same origin) holds here; with no
     choice the page follows the OS. Set before the first paint. -->
<script>try{var t=localStorage.getItem("cpl_theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}</script>
<style>
__FONTS__
/* First Light (prototype/first_light_theme_v1.html v1.6): every hex lives here. */
:root{
  --paper:#F4F2ED; --ink:#1C1C1A; --body:#3A3A36; --muted:#5C5C55;
  --surface:#FFFFFF; --subtle:#F7F5F1; --tint:#ECE9E2;
  --border:rgba(28,28,26,.14); --border-strong:rgba(28,28,26,.30);
  --cobalt:#0047AB; --on-cobalt:#FFFFFF; --seal:#002F6D; --on-seal:#FFFFFF;
  --mustard:#E3B341; --mustard-text:#8B6800;
  --land:#FFFFFF; --sea:#ECE9E2; --coast:#4A6A93;
  --mk-college:#002F6D; --mk-base:#1C1C1A; --mk-hot:#0047AB; --mk-ring:#FFFFFF; --pair:#8B6800;
  --shadow:0 6px 22px rgba(28,28,26,.14);
  --display:'Playfair Display',Georgia,'Times New Roman',serif;
  --font:'Source Sans 3','Segoe UI',system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --paper:#151514; --ink:#ECE9E2; --body:#D6D6D0; --muted:#ABABA3;
    --surface:#1E1E1C; --subtle:#262624; --tint:#30302E;
    --border:rgba(255,255,255,.14); --border-strong:rgba(255,255,255,.32);
    --cobalt:#7DA1D4; --on-cobalt:#151514; --seal:#7DA1D4; --on-seal:#151514;
    --mustard:#E3B341; --mustard-text:#E3B341;
    --land:#30302E; --sea:#1E1E1C; --coast:#6885AE;
    --mk-college:#7DA1D4; --mk-base:#D6D6D0; --mk-hot:#ECE9E2; --mk-ring:#151514; --pair:#E3B341;
    --shadow:0 6px 22px rgba(0,0,0,.45); color-scheme:dark;
  }
}
:root[data-theme="dark"]{
  --paper:#151514; --ink:#ECE9E2; --body:#D6D6D0; --muted:#ABABA3;
  --surface:#1E1E1C; --subtle:#262624; --tint:#30302E;
  --border:rgba(255,255,255,.14); --border-strong:rgba(255,255,255,.32);
  --cobalt:#7DA1D4; --on-cobalt:#151514; --seal:#7DA1D4; --on-seal:#151514;
  --mustard:#E3B341; --mustard-text:#E3B341;
  --land:#30302E; --sea:#1E1E1C; --coast:#6885AE;
  --mk-college:#7DA1D4; --mk-base:#D6D6D0; --mk-hot:#ECE9E2; --mk-ring:#151514; --pair:#E3B341;
  --shadow:0 6px 22px rgba(0,0,0,.45); color-scheme:dark;
}
*{box-sizing:border-box}
html,body{margin:0;background:var(--paper);color:var(--body);font-family:var(--font);font-size:16px;line-height:1.5}
a{color:var(--cobalt)}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.skip{position:absolute;left:16px;top:-80px;z-index:60;background:var(--surface);color:var(--cobalt);border:2px solid var(--cobalt);
  border-radius:8px;padding:9px 14px;font-weight:700;text-decoration:none}
.skip:focus{top:12px}
.wrap{max-width:1320px;margin:0 auto;padding:28px 16px 20px}
header h1{font-family:var(--display);font-weight:600;font-size:clamp(1.6rem,1.15rem + 1.6vw,2.45rem);line-height:1.15;color:var(--ink);margin:0 0 8px;letter-spacing:-.01em}
header .lede{margin:0;font-size:clamp(1rem,.95rem + .25vw,1.15rem);color:var(--body);max-width:var(--cpl-measure,none)}
.figures{list-style:none;margin:18px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:10px 40px}
.figures li{display:flex;flex-direction:column}
.figures .n{font-family:var(--display);font-weight:600;font-size:1.7rem;line-height:1.1;color:var(--seal)}
.figures .l{font-size:.92rem;color:var(--muted)}
.toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:12px 22px;margin:22px 0 12px}
.group{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.group-lab{font-size:.85rem;font-weight:600;color:var(--muted);margin-right:4px}
.btn{font:inherit;font-size:.9rem;font-weight:600;min-height:36px;padding:5px 14px;border-radius:999px;cursor:pointer;
  border:1px solid var(--border-strong);background:var(--surface);color:var(--ink)}
.btn:hover{border-color:var(--cobalt)}
.btn[aria-pressed="true"]{background:var(--seal);border-color:var(--seal);color:var(--on-seal)}
.zoom{margin-left:auto}
label.toggle{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:0 4px;font-size:.92rem;color:var(--body);cursor:pointer}
label.toggle input{width:18px;height:18px;accent-color:var(--cobalt);margin:0}
.grid{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:18px;align-items:start}
.stage{position:relative;height:clamp(440px,70vh,780px);background:var(--sea);border:1px solid var(--border);border-radius:14px;overflow:hidden}
svg{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none}
svg.grabbing{cursor:grabbing}
.ca-boundary{fill:var(--land);stroke:var(--coast);stroke-width:1.5;vector-effect:non-scaling-stroke}
.pair-line{stroke:var(--pair);stroke-width:3.5;vector-effect:non-scaling-stroke;stroke-linecap:round}
.pair-line.dim{opacity:.2}
.mk{cursor:pointer}
.mk .hit{fill:transparent}
.col-dot{fill:var(--mk-college);stroke:var(--mk-ring);stroke-width:1.4}
.col-dot.key{fill:var(--mustard);stroke:var(--ink);stroke-width:1.6}
.base-star{fill:var(--mk-base);stroke:var(--mk-ring);stroke-width:1}
.mk.hot .col-dot,.mk.hot .base-star{fill:var(--mk-hot)}
.mk.sel .col-dot,.mk.sel .base-star{fill:var(--mk-hot);stroke:var(--mk-ring);stroke-width:2}
.mk.sel{filter:drop-shadow(0 0 3px var(--mk-hot))}
.mk.dim{opacity:.22}
.key{display:flex;flex-wrap:wrap;gap:6px 22px;margin:10px 2px 0;padding:0;list-style:none;font-size:.9rem;color:var(--body)}
.key li{display:inline-flex;align-items:center;gap:8px}
.key svg{position:static;width:18px;height:18px;cursor:default}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;display:flex;flex-direction:column;
  height:clamp(440px,70vh,780px);min-height:0}
.tabs{display:flex;border-bottom:1px solid var(--border);flex:0 0 auto}
.tab{flex:1;font:inherit;font-size:.92rem;font-weight:600;min-height:44px;padding:8px 6px;cursor:pointer;color:var(--muted);
  background:transparent;border:0;border-bottom:3px solid transparent}
.tab[aria-pressed="true"]{color:var(--ink);border-bottom-color:var(--cobalt)}
.pbody{flex:1 1 auto;overflow:auto;padding:16px 18px}
.hint{margin:0;color:var(--body)}
.kicker{font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0}
.detail h2{font-family:var(--display);font-weight:600;font-size:1.45rem;line-height:1.2;color:var(--ink);margin:4px 0 8px}
.detail p{margin:0 0 10px}
.served{color:var(--ink)}
.served b{font-weight:700}
.cta{display:inline-flex;align-items:center;min-height:40px;padding:8px 16px;margin:4px 0 14px;border-radius:999px;
  background:var(--cobalt);color:var(--on-cobalt);font-weight:700;text-decoration:none}
.cta:hover{filter:brightness(1.08)}
.tag{display:inline-block;font-size:.78rem;font-weight:700;color:var(--mustard-text);border:1px solid currentColor;border-radius:999px;padding:0 8px;margin-left:6px;white-space:nowrap}
.sub{font-size:.95rem;font-weight:700;color:var(--ink);margin:14px 0 6px}
.near{list-style:none;margin:0;padding:0;counter-reset:near}
.near li{padding:9px 0;border-top:1px solid var(--border)}
.near li:first-child{border-top:0}
.near a,.linkbtn{font:inherit;font-weight:700;color:var(--cobalt);text-decoration:underline;text-underline-offset:2px}
.linkbtn{background:none;border:0;padding:0;cursor:pointer;text-align:left;min-height:24px}
.meta{font-size:.88rem;color:var(--muted);margin-top:2px}
.search{width:100%;font:inherit;font-size:.95rem;min-height:40px;padding:8px 12px;border:1px solid var(--border-strong);border-radius:10px;
  background:var(--surface);color:var(--ink);margin-bottom:10px}
.dir{list-style:none;margin:0;padding:0}
.dir li{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 6px;border-top:1px solid var(--border);cursor:pointer;min-height:44px}
.dir li:first-child{border-top:0}
.dir li:hover{background:var(--subtle)}
.dir .nm{color:var(--ink);font-weight:600}
.dir .ct{color:var(--muted);font-weight:400;font-size:.88rem}
.dir a{font-size:.88rem;font-weight:700;color:var(--cobalt);flex:0 0 auto}
.empty{color:var(--muted);padding:14px 4px}
footer{margin:18px 2px 0;font-size:.88rem;color:var(--muted);max-width:var(--cpl-measure,none)}
footer p{margin:0 0 6px}
#tip{position:fixed;z-index:50;pointer-events:none;display:none;max-width:260px;padding:8px 10px;border-radius:10px;
  background:var(--surface);color:var(--body);border:1px solid var(--border);box-shadow:var(--shadow);font-size:.88rem}
#tip .t{font-weight:700;color:var(--ink)}
.btn:focus-visible,.tab:focus-visible,.search:focus-visible,a:focus-visible,.linkbtn:focus-visible,
label.toggle:focus-within,.dir li:focus-visible,.mk:focus-visible{outline:3px solid var(--cobalt);outline-offset:2px;border-radius:8px}
.mk:focus-visible{outline-offset:0}
@media (max-width:980px){
  .grid{grid-template-columns:1fr}
  .panel{height:auto;max-height:none}
  .pbody{overflow:visible}
}
@media (max-width:560px){
  .wrap{padding-top:20px}
  .figures{gap:10px 24px}
  .figures .n{font-size:1.45rem}
  .toolbar{gap:10px}
  .zoom{margin-left:0}
  .stage{height:62vh;min-height:360px}
}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style>
</head>
<body>
<a class="skip" href="#panel">Skip to the details panel</a>
<div class="wrap">
  <header>
    <h1>California community colleges and military installations</h1>
    <p class="lede">Where a college and a nearby installation can partner to award Credit for Prior Learning to service members and veterans.</p>
    <ul class="figures">
      <li><span class="n" id="f-col"></span><span class="l">community colleges</span></li>
      <li><span class="n" id="f-base"></span><span class="l">military installations</span></li>
      <li id="f-mil-li"><span class="n" id="f-mil"></span><span class="l" id="f-mil-l"></span></li>
    </ul>
  </header>

  <div class="toolbar">
    <div class="group" role="group" aria-labelledby="reg-lab"><span class="group-lab" id="reg-lab">Region</span><span id="regions" class="group"></span></div>
    <div class="group" role="group" aria-label="Show on the map">
      <span class="group-lab">Show</span>
      <label class="toggle"><input type="checkbox" id="t-col" checked> Colleges</label>
      <label class="toggle"><input type="checkbox" id="t-base" checked> Installations</label>
      <label class="toggle"><input type="checkbox" id="t-pair" checked> Pairings</label>
    </div>
    <div class="group zoom" role="group" aria-label="Zoom the map">
      <button class="btn" id="zin" type="button">Zoom in</button>
      <button class="btn" id="zout" type="button">Zoom out</button>
      <button class="btn" id="zreset" type="button">Reset</button>
    </div>
  </div>

  <div class="grid">
    <div>
      <div class="stage">
        <svg id="map" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Map of California's community colleges and military installations">
          <g id="viewport">
            <path id="boundary" class="ca-boundary"></path>
            <g id="g-pairs"></g>
            <g id="g-colleges"></g>
            <g id="g-bases"></g>
          </g>
        </svg>
      </div>
      <ul class="key" aria-label="Map key">
        <li><svg viewBox="-9 -9 18 18" aria-hidden="true"><circle r="5" class="col-dot"/></svg>Community college</li>
        <li><svg viewBox="-9 -9 18 18" aria-hidden="true"><circle r="6.5" class="col-dot key"/></svg>Demonstration-project college</li>
        <li><svg viewBox="-9 -9 18 18" aria-hidden="true"><path class="base-star" d="M0,-7 L1.9,-2.3 L7,-2.3 L2.8,1 L4.3,6.6 L0,3.3 L-4.3,6.6 L-2.8,1 L-7,-2.3 L-1.9,-2.3 Z"/></svg>Military installation</li>
        <li><svg viewBox="0 0 18 18" aria-hidden="true"><line x1="1" y1="9" x2="17" y2="9" class="pair-line"/></svg>Demonstration pairing</li>
      </ul>
    </div>

    <aside class="panel" id="panel" tabindex="-1" aria-label="Details, colleges and installations">
      <div class="tabs" role="group" aria-label="Choose what the panel shows">
        <button class="tab" data-tab="detail" type="button" aria-pressed="true" aria-controls="panel-detail">Details</button>
        <button class="tab" data-tab="colleges" type="button" aria-pressed="false" aria-controls="panel-colleges">Colleges</button>
        <button class="tab" data-tab="bases" type="button" aria-pressed="false" aria-controls="panel-bases">Installations</button>
      </div>
      <div class="pbody" id="panel-detail"><div id="detail" aria-live="polite"></div></div>
      <div class="pbody" id="panel-colleges" hidden>
        <label class="sr" for="search-col">Search the colleges</label>
        <input class="search" id="search-col" type="search" placeholder="Search 115 colleges" autocomplete="off"/>
        <ul class="dir" id="list-col"></ul>
      </div>
      <div class="pbody" id="panel-bases" hidden>
        <label class="sr" for="search-base">Search the installations</label>
        <input class="search" id="search-base" type="search" placeholder="Search 44 installations" autocomplete="off"/>
        <ul class="dir" id="list-base"></ul>
      </div>
    </aside>
  </div>

  <footer>
    <p id="foot-pairs"></p>
    <p>Locations are at the campus or installation and approximate. Counts of service members and veterans served come from the MAP platform's CPL Insights dashboard<span id="foot-asof"></span>. Source: CPL Initiative, California Community Colleges Chancellor's Office. The page loads nothing from the internet.</p>
  </footer>
</div>
<div id="tip" role="presentation"></div>

<script>
const DATA = __DATA_JS__;
const NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("map");
svg.setAttribute("viewBox", "0 0 " + DATA.W + " " + DATA.H);
document.getElementById("boundary").setAttribute("d", DATA.boundary);

function haversine(a, b){
  const R=3958.8, toR=Math.PI/180;
  const dLa=(b.la-a.la)*toR, dLo=(b.lo-a.lo)*toR, la1=a.la*toR, la2=b.la*toR;
  const h=Math.sin(dLa/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLo/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function num(n){ return n==null ? null : n.toLocaleString("en-US"); }
function miles(d){ const m = d<10 ? d.toFixed(1) : String(Math.round(d)); return m + (m==="1" || m==="1.0" ? " mile" : " miles"); }
function servedWords(m){ return num(m) + " service member" + (m===1?"":"s") + " and veteran" + (m===1?"":"s") + " served"; }
const NEWTAB = '<span class="sr"> (opens in a new tab)</span>';

const colByName={}, baseByName={}, pairOf={};
DATA.colleges.forEach(c=>colByName[c.n]=c);
DATA.bases.forEach(b=>baseByName[b.n]=b);
DATA.pairs.forEach(([b,c])=>{ (pairOf[b]=pairOf[b]||[]).push(c); (pairOf[c]=pairOf[c]||[]).push(b); });

document.getElementById("f-col").textContent = DATA.colleges.length;
document.getElementById("f-base").textContent = DATA.bases.length;
if (DATA.milTotal != null) {
  document.getElementById("f-mil").textContent = num(DATA.milTotal);
  document.getElementById("f-mil-l").textContent = "service members and veterans served through CPL" + (DATA.asOf ? ", as of " + DATA.asOf : "");
  if (DATA.asOf) document.getElementById("foot-asof").textContent = ", as of " + DATA.asOf;
} else document.getElementById("f-mil-li").remove();
document.getElementById("foot-pairs").textContent = "The gold lines are the three demonstration projects: " +
  DATA.pairs.map(([b,c])=>b + " with " + c).join("; ") + ".";

const STAR = "M0,-7 L1.9,-2.3 L7,-2.3 L2.8,1 L4.3,6.6 L0,3.3 L-4.3,6.6 L-2.8,1 L-7,-2.3 L-1.9,-2.3 Z";
let scale = 1;
const gCol=document.getElementById("g-colleges"), gBase=document.getElementById("g-bases"), gPair=document.getElementById("g-pairs");
const colEls={}, baseEls={}, pairEls=[];
DATA.colleges.forEach((c,i)=>{
  const g=document.createElementNS(NS,"g"); g.setAttribute("class","mk"); g.dataset.i=i;
  const hit=document.createElementNS(NS,"circle"); hit.setAttribute("class","hit"); hit.setAttribute("r",12);
  const dot=document.createElementNS(NS,"circle"); dot.setAttribute("class","col-dot"+(c.k?" key":"")); dot.setAttribute("r",c.k?6.5:5);
  g.appendChild(hit); g.appendChild(dot); gCol.appendChild(g); colEls[c.n]=g;
});
DATA.bases.forEach((b,i)=>{
  const g=document.createElementNS(NS,"g"); g.setAttribute("class","mk"); g.dataset.i=i;
  const hit=document.createElementNS(NS,"circle"); hit.setAttribute("class","hit"); hit.setAttribute("r",12);
  const st=document.createElementNS(NS,"path"); st.setAttribute("class","base-star"); st.setAttribute("d",STAR);
  g.appendChild(hit); g.appendChild(st); gBase.appendChild(g); baseEls[b.n]=g;
});
DATA.pairs.forEach(([bn,cn])=>{
  const b=baseByName[bn], c=colByName[cn]; if(!b||!c) return;
  const ln=document.createElementNS(NS,"line"); ln.setAttribute("class","pair-line");
  ln.setAttribute("x1",b.x); ln.setAttribute("y1",b.y); ln.setAttribute("x2",c.x); ln.setAttribute("y2",c.y);
  ln.dataset.base=bn; gPair.appendChild(ln); pairEls.push(ln);
});
function rescaleMarkers(){
  const inv=1/scale;
  for(const k in colEls){ const c=colByName[k]; colEls[k].setAttribute("transform",`translate(${c.x},${c.y}) scale(${inv})`); }
  for(const k in baseEls){ const b=baseByName[k]; baseEls[k].setAttribute("transform",`translate(${b.x},${b.y}) scale(${inv})`); }
}

let vb={x:0,y:0,w:DATA.W,h:DATA.H};
function applyVB(){ svg.setAttribute("viewBox",`${vb.x} ${vb.y} ${vb.w} ${vb.h}`); scale=DATA.W/vb.w; rescaleMarkers(); }
function setView(cx,cy,w){ w=Math.max(DATA.W*0.06,Math.min(DATA.W*1.4,w)); const h=w*(DATA.H/DATA.W); vb={x:cx-w/2,y:cy-h/2,w,h}; applyVB(); }
function zoomBy(f,ax,ay){
  ax = ax==null ? vb.x+vb.w/2 : ax; ay = ay==null ? vb.y+vb.h/2 : ay;
  const nw=vb.w/f, nh=nw*(DATA.H/DATA.W), rx=(ax-vb.x)/vb.w, ry=(ay-vb.y)/vb.h;
  vb={w:nw,h:nh,x:ax-rx*nw,y:ay-ry*nh};
  if(vb.w>DATA.W*1.4){ setView(DATA.W/2,DATA.H/2,DATA.W*1.4); return; }
  if(vb.w<DATA.W*0.06){ vb.w=DATA.W*0.06; vb.h=vb.w*(DATA.H/DATA.W); }
  applyVB();
}
document.getElementById("zin").onclick=()=>zoomBy(1.5);
document.getElementById("zout").onclick=()=>zoomBy(1/1.5);
document.getElementById("zreset").onclick=()=>{ setView(DATA.W/2,DATA.H/2,DATA.W); pressRegion(0); clearSelection(); };
function clientToSvg(ev){ const r=svg.getBoundingClientRect(); return {x:vb.x+(ev.clientX-r.left)/r.width*vb.w, y:vb.y+(ev.clientY-r.top)/r.height*vb.h}; }
svg.addEventListener("wheel",ev=>{ ev.preventDefault(); const p=clientToSvg(ev); zoomBy(ev.deltaY<0?1.18:1/1.18,p.x,p.y); },{passive:false});
let drag=null;
svg.addEventListener("pointerdown",ev=>{ if(ev.target.closest(".mk")) return; drag={sx:ev.clientX,sy:ev.clientY,ox:vb.x,oy:vb.y}; svg.classList.add("grabbing"); svg.setPointerCapture(ev.pointerId); });
svg.addEventListener("pointermove",ev=>{ if(!drag) return; const r=svg.getBoundingClientRect(); vb.x=drag.ox-(ev.clientX-drag.sx)/r.width*vb.w; vb.y=drag.oy-(ev.clientY-drag.sy)/r.height*vb.h; applyVB(); });
svg.addEventListener("pointerup",()=>{ drag=null; svg.classList.remove("grabbing"); });
svg.addEventListener("pointerleave",()=>{ drag=null; svg.classList.remove("grabbing"); });

function bboxOf(list){ const xs=list.map(p=>p.x), ys=list.map(p=>p.y); return {x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)}; }
function inBox(p,a,b,c,d){ return p.la>=a&&p.la<=b&&p.lo>=c&&p.lo<=d; }
const REGIONS=[
  {label:"Statewide",all:true},
  {label:"Bay Area",box:[36.9,38.6,-123.3,-121.5]},
  {label:"Los Angeles",box:[33.6,34.5,-118.9,-117.5]},
  {label:"San Diego",box:[32.5,33.5,-117.4,-116.0]},
  {label:"Inland Empire",box:[33.7,34.3,-117.6,-116.2]},
  {label:"Central Valley",box:[35.0,38.7,-121.6,-118.7]},
];
const regBox=document.getElementById("regions");
function pressRegion(i){ [...regBox.children].forEach((x,j)=>x.setAttribute("aria-pressed", j===i ? "true" : "false")); }
REGIONS.forEach((rg,i)=>{
  const b=document.createElement("button"); b.className="btn"; b.type="button"; b.textContent=rg.label; b.setAttribute("aria-pressed","false");
  b.onclick=()=>{
    pressRegion(i);
    if(rg.all){ setView(DATA.W/2,DATA.H/2,DATA.W); return; }
    const mem=[...DATA.colleges,...DATA.bases].filter(p=>inBox(p,...rg.box));
    if(!mem.length){ setView(DATA.W/2,DATA.H/2,DATA.W); return; }
    const bb=bboxOf(mem); setView((bb.x0+bb.x1)/2,(bb.y0+bb.y1)/2,Math.max((bb.x1-bb.x0)*1.5,DATA.W*0.12));
  };
  regBox.appendChild(b);
});
pressRegion(0);

const tip=document.getElementById("tip");
function tipHtml(kind,o){
  if(kind==="col") return `<div class="t">${esc(o.n)}</div>` + (o.m==null ? "" : `<div>${servedWords(o.m)}</div>`) +
    (pairOf[o.n] ? `<div>Demonstration project with ${esc(pairOf[o.n].join(", "))}</div>` : "");
  return `<div class="t">${esc(o.n)}</div><div>Military installation</div>` +
    (pairOf[o.n] ? `<div>Demonstration project with ${esc(pairOf[o.n].join(", "))}</div>` : "");
}
function placeTip(x,y){ const w=tip.offsetWidth,h=tip.offsetHeight; let l=x+14,t=y+14; if(l+w>innerWidth) l=x-w-14; if(t+h>innerHeight) t=y-h-14; tip.style.left=Math.max(6,l)+"px"; tip.style.top=Math.max(6,t)+"px"; }
function showTip(x,y,kind,o){ tip.innerHTML=tipHtml(kind,o); tip.style.display="block"; placeTip(x,y); }
function hideTip(){ tip.style.display="none"; }

function clearHot(){ document.querySelectorAll(".mk.hot,.mk.dim,.mk.sel").forEach(e=>e.classList.remove("hot","dim","sel")); pairEls.forEach(l=>l.classList.remove("dim")); }
function clearSelection(){ clearHot(); renderDefault(); }
function focusOn(pts){ pressRegion(-1); const bb=bboxOf(pts); setView((bb.x0+bb.x1)/2,(bb.y0+bb.y1)/2,Math.max((bb.x1-bb.x0)*2.2,DATA.W*0.16)); }

function selectBase(name){
  const b=baseByName[name]; if(!b) return;
  clearHot(); baseEls[name].classList.add("sel");
  const ranked=DATA.colleges.map(c=>({c,d:haversine(b,c)})).sort((x,y)=>x.d-y.d);
  const top=ranked.slice(0,6);
  DATA.colleges.forEach(c=>colEls[c.n].classList.add("dim"));
  DATA.bases.forEach(x=>{ if(x.n!==name) baseEls[x.n].classList.add("dim"); });
  pairEls.forEach(l=>{ if(l.dataset.base!==name) l.classList.add("dim"); });
  top.forEach(({c})=>{ colEls[c.n].classList.remove("dim"); colEls[c.n].classList.add("hot"); });
  (pairOf[name]||[]).forEach(cn=>{ if(colEls[cn]){ colEls[cn].classList.remove("dim"); colEls[cn].classList.add("hot"); } });
  focusOn([b,...top.map(t=>t.c)]);
  renderBase(b,top,new Set(pairOf[name]||[]));
  switchTab("detail");
}
function selectCollege(name){
  const c=colByName[name]; if(!c) return;
  clearHot(); colEls[name].classList.add("sel");
  const ranked=DATA.bases.map(b=>({b,d:haversine(c,b)})).sort((x,y)=>x.d-y.d);
  const nearest=ranked[0];
  DATA.bases.forEach(b=>baseEls[b.n].classList.add("dim"));
  if(nearest){ baseEls[nearest.b.n].classList.remove("dim"); baseEls[nearest.b.n].classList.add("hot"); }
  (pairOf[name]||[]).forEach(bn=>{ if(baseEls[bn]){ baseEls[bn].classList.remove("dim"); baseEls[bn].classList.add("hot"); } });
  focusOn([c, nearest ? nearest.b : c]);
  renderCollege(c,nearest);
  switchTab("detail");
}

const detail=document.getElementById("detail");
function renderDefault(){
  detail.innerHTML = `<p class="hint">Choose an installation on the map or in the Installations list to see the six community colleges nearest it. Choose a college to open its Credit for Prior Learning page.</p>`;
}
function renderBase(b,top,demo){
  const lis = top.map(({c,d})=>`<li><a href="${esc(c.u)}" target="_blank" rel="noopener">${esc(c.n)}${NEWTAB}</a>${demo.has(c.n)?'<span class="tag">Demonstration project</span>':''}
    <div class="meta">${miles(d)} away${c.m==null?"":", "+servedWords(c.m)}</div></li>`).join("");
  detail.innerHTML = `<div class="detail"><p class="kicker">Military installation</p><h2>${esc(b.n)}</h2>
    <p>The six community colleges nearest this installation. Each could partner with it to award Credit for Prior Learning to service members and veterans.</p>
    <p class="sub">Nearest colleges</p><ol class="near">${lis}</ol></div>`;
}
function renderCollege(c,nearest){
  const partners=pairOf[c.n]||[];
  detail.innerHTML = `<div class="detail"><p class="kicker">Community college</p><h2>${esc(c.n)}</h2>
    ${c.m==null ? "" : `<p class="served"><b>${servedWords(c.m)}</b> through Credit for Prior Learning${DATA.asOf?", as of "+esc(DATA.asOf):""}.</p>`}
    <p>Credit for Prior Learning awards college credit for military training, industry certifications and work experience.</p>
    <a class="cta" href="${esc(c.u)}" target="_blank" rel="noopener">Open the college's CPL page${NEWTAB}</a>
    ${partners.length ? `<p>Demonstration project with ${esc(partners.join(", "))}.</p>` : ""}
    ${nearest ? `<p class="sub">Nearest installation</p><p><button type="button" class="linkbtn" data-base="${esc(nearest.b.n)}">${esc(nearest.b.n)}</button>
      <span class="meta">, ${miles(nearest.d)} away</span></p>` : ""}</div>`;
  const nb=detail.querySelector(".linkbtn[data-base]");
  if(nb) nb.onclick=()=>selectBase(nb.dataset.base);
}

function activate(kind,o){
  hideTip();
  if(kind==="col") selectCollege(o.n); else selectBase(o.n);
  if(window.matchMedia && window.matchMedia("(max-width:980px)").matches) document.getElementById("panel").scrollIntoView({block:"start"});
}
function bind(g,kind){
  const o = kind==="col" ? DATA.colleges[+g.dataset.i] : DATA.bases[+g.dataset.i];
  g.setAttribute("tabindex","0"); g.setAttribute("role","button");
  g.setAttribute("aria-label", kind==="col" ? o.n + ", community college. Show details and the CPL page." : o.n + ", military installation. Show the nearest colleges.");
  g.addEventListener("keydown",ev=>{ if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); ev.stopPropagation(); activate(kind,o); } });
  g.addEventListener("focus",()=>{ const r=g.getBoundingClientRect(); showTip(r.left+r.width/2,r.top,kind,o); });
  g.addEventListener("blur",hideTip);
  g.addEventListener("mouseenter",ev=>showTip(ev.clientX,ev.clientY,kind,o));
  g.addEventListener("mousemove",ev=>placeTip(ev.clientX,ev.clientY));
  g.addEventListener("mouseleave",hideTip);
  g.addEventListener("click",ev=>{ ev.stopPropagation(); activate(kind,o); });
}
Object.values(colEls).forEach(g=>bind(g,"col"));
Object.values(baseEls).forEach(g=>bind(g,"base"));
document.getElementById("t-col").onchange=e=>{ gCol.style.display=e.target.checked?"":"none"; };
document.getElementById("t-base").onchange=e=>{ gBase.style.display=e.target.checked?"":"none"; };
document.getElementById("t-pair").onchange=e=>{ gPair.style.display=e.target.checked?"":"none"; };

function switchTab(name){
  document.querySelectorAll(".tab").forEach(t=>t.setAttribute("aria-pressed", t.dataset.tab===name ? "true" : "false"));
  document.getElementById("panel-detail").hidden = name!=="detail";
  document.getElementById("panel-colleges").hidden = name!=="colleges";
  document.getElementById("panel-bases").hidden = name!=="bases";
}
document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));

const listCol=document.getElementById("list-col"), listBase=document.getElementById("list-base");
function rowKeys(li,fn){ li.tabIndex=0; li.setAttribute("role","button"); li.onclick=fn; li.onkeydown=ev=>{ if(ev.target===li && (ev.key==="Enter"||ev.key===" ")){ ev.preventDefault(); fn(); } }; }
function buildColList(f){
  f=(f||"").toLowerCase();
  const rows=DATA.colleges.filter(c=>c.n.toLowerCase().includes(f)).sort((a,b)=>a.n.localeCompare(b.n));
  listCol.innerHTML = rows.length ? rows.map(c=>`<li data-n="${esc(c.n)}"><span><span class="nm">${esc(c.n)}</span>${c.k?'<span class="tag">Demonstration project</span>':''}
    ${c.m==null?"":`<br><span class="ct">${num(c.m)} served</span>`}</span>
    <a href="${esc(c.u)}" target="_blank" rel="noopener">CPL page${NEWTAB}</a></li>`).join("") : '<li class="empty">No colleges match.</li>';
  listCol.querySelectorAll("li[data-n]").forEach(li=>{
    rowKeys(li,()=>selectCollege(li.dataset.n)); li.setAttribute("aria-label", li.dataset.n + ", show details");
    li.querySelector("a").addEventListener("click",ev=>ev.stopPropagation());
  });
}
function buildBaseList(f){
  f=(f||"").toLowerCase();
  const rows=DATA.bases.filter(b=>b.n.toLowerCase().includes(f)).sort((a,b)=>a.n.localeCompare(b.n));
  listBase.innerHTML = rows.length ? rows.map(b=>`<li data-n="${esc(b.n)}"><span class="nm">${esc(b.n)}</span><span class="ct">Nearest colleges</span></li>`).join("")
    : '<li class="empty">No installations match.</li>';
  listBase.querySelectorAll("li[data-n]").forEach(li=>{ rowKeys(li,()=>selectBase(li.dataset.n)); li.setAttribute("aria-label", li.dataset.n + ", show the nearest colleges"); });
}
document.getElementById("search-col").addEventListener("input",e=>buildColList(e.target.value));
document.getElementById("search-base").addEventListener("input",e=>buildBaseList(e.target.value));
svg.addEventListener("click",ev=>{ if(!ev.target.closest(".mk")) clearSelection(); });

buildColList(""); buildBaseList(""); renderDefault(); applyVB();
</script>
</body>
</html>
"""

page = HTML.replace("__FONTS__", FONTS).replace("__DATA_JS__", DATA_JS)
out = os.path.join(HERE, "veteran_map_mockup.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(page)
print("saved", out, "|", round(len(page) / 1024, 1), "KB | served total", payload["_statewide_military_total"],
      "as of", as_of, "| colleges without a count:", missing or "none")
