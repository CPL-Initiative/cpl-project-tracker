#!/usr/bin/env python3
"""
build_selfcontained.py — California CPL x Military map, ZERO external dependencies.

Why this exists: the Folium build (build_web.py / ca_cpl_map_web.html) needs ~6
external CDN scripts + a live tile server. On locked-down gov networks, offline
laptops, and inside restrictive iframes those are blocked, so the map renders
blank. This build inlines EVERYTHING (the CA boundary, all colleges/bases, the
partnership connectors) as a single SVG + vanilla JS HTML file. It works offline,
in any iframe, and on any network.

Inputs (same as build_web.py):
  data.py             - COLLEGES (115), BASES (44), KEY_PAIRS (3)
  colleges_cpl.csv    - per-college CPL landing URLs (refreshable)
  california.geojson  - state boundary polygon

Output:
  ca_cpl_map_selfcontained.html
"""
import csv, os, json, math, html
import data

# ----- brand (MAP / CCCCO UI standards; from HANDOFF.md) -----
NAVY   = "#1F355E"   # doc/title navy
CO_BLUE= "#0066BA"   # CO primary blue
DK_BLUE= "#003B71"   # CO dark blue
CRIMSON= "#B22234"   # military crimson
GOLD   = "#D4A843"   # demo-pairing / highlight gold
PORTAL = "https://map.rccd.edu/cpllandingpages/"

HERE = os.path.dirname(os.path.abspath(__file__))

# ----- per-college CPL landing URLs (CSV overrides; default = portal) -----
cpl_url = {n: PORTAL for n, _, _ in data.COLLEGES}
csv_path = os.path.join(HERE, "colleges_cpl.csv")
if os.path.exists(csv_path):
    for row in csv.DictReader(open(csv_path)):
        if row.get("college") and row.get("cpl_url"):
            cpl_url[row["college"].strip()] = row["cpl_url"].strip()

# ----- per-college service-member/veteran CPL counts (snapshot from live_metrics.json) -----
mil_by_college = {}
mil_total = None
mil_asof = None
mil_path = os.path.join(HERE, "military_by_college.json")
if os.path.exists(mil_path):
    _m = json.load(open(mil_path, encoding="utf-8"))
    mil_by_college = _m.get("colleges", {})
    mil_total = _m.get("_statewide_military_total")
    mil_asof = _m.get("_as_of")

# ----- CA boundary -----
geo = json.load(open(os.path.join(HERE, "california.geojson")))
ring = geo["geometry"]["coordinates"][0]   # single-ring polygon, [lon,lat] pairs

# ----- equirectangular projection w/ latitude correction -----
LAT0 = 37.2
COSL = math.cos(math.radians(LAT0))
def proj(lon, lat):
    return lon * COSL, lat

# projected bounds from the boundary, then fit to a target width
pxs = [proj(lon, lat)[0] for lon, lat in ring]
pys = [proj(lon, lat)[1] for lon, lat in ring]
xmin, xmax = min(pxs), max(pxs)
ymin, ymax = min(pys), max(pys)
MARGIN = 0.04 * (xmax - xmin)
xmin -= MARGIN; xmax += MARGIN; ymin -= MARGIN; ymax += MARGIN

W = 1000.0
SX = W / (xmax - xmin)
H = (ymax - ymin) * SX

def to_screen(lon, lat):
    x, y = proj(lon, lat)
    return round((x - xmin) * SX, 2), round((ymax - y) * SX, 2)

# boundary svg path
pts = [to_screen(lon, lat) for lon, lat in ring]
boundary_d = "M" + " L".join(f"{x},{y}" for x, y in pts) + " Z"

# ----- marker datasets (carry lat/lon for haversine + screen x/y for drawing) -----
key_colleges = {c for _, c in data.KEY_PAIRS}
colleges = []
for n, la, lo in data.COLLEGES:
    x, y = to_screen(lo, la)
    mv = mil_by_college.get(n)
    colleges.append({"n": n, "la": la, "lo": lo, "x": x, "y": y,
                     "u": cpl_url.get(n, PORTAL), "k": 1 if n in key_colleges else 0,
                     "m": mv if isinstance(mv, (int, float)) else None})
bases = []
for n, la, lo in data.BASES:
    x, y = to_screen(lo, la)
    bases.append({"n": n, "la": la, "lo": lo, "x": x, "y": y})
pairs = [[b, c] for b, c in data.KEY_PAIRS]

DATA_JS = json.dumps({"colleges": colleges, "bases": bases, "pairs": pairs,
                      "W": round(W, 2), "H": round(H, 2), "boundary": boundary_d,
                      "portal": PORTAL, "milTotal": mil_total,
                      "asOf": (mil_asof or "")[:10]},
                     ensure_ascii=False)

HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>California Community Colleges &amp; Military Installations — Credit for Prior Learning</title>
<style>
  :root{
    --navy:%(NAVY)s; --co-blue:%(CO_BLUE)s; --dk-blue:%(DK_BLUE)s;
    --crimson:%(CRIMSON)s; --gold:%(GOLD)s;
    --ink:#1d2733; --muted:#5b6776; --line:#e2e8f0; --panel:#ffffff; --bg:#eef2f7;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%%;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:var(--ink);background:var(--bg)}
  #app{display:flex;flex-direction:column;height:100vh;width:100%%}
  header{padding:10px 16px;background:linear-gradient(90deg,var(--navy),var(--dk-blue));color:#fff;flex:0 0 auto}
  header h1{margin:0;font-size:18px;font-weight:800;letter-spacing:.2px}
  header .sub{font-size:12.5px;color:#cde0f5;margin-top:2px}
  header .sub b{color:#fff}
  #main{flex:1 1 auto;display:flex;min-height:0}
  #stage{position:relative;flex:1 1 auto;min-width:0;background:
      radial-gradient(circle at 30%% 20%%, #f6f9fc, #e7eef6)}
  svg{width:100%%;height:100%%;display:block;cursor:grab}
  svg.grabbing{cursor:grabbing}
  .ca-boundary{fill:#dfe9f4;stroke:var(--dk-blue);stroke-width:2;vector-effect:non-scaling-stroke}
  .pair-line{stroke:var(--gold);stroke-width:3.5;opacity:.92;vector-effect:non-scaling-stroke;stroke-linecap:round}
  .pair-line.dim{opacity:.18}
  .mk{cursor:pointer}
  .mk .hit{fill:transparent}
  .col-dot{fill:var(--navy);stroke:#fff;stroke-width:1.4}
  .col-dot.key{fill:var(--gold);stroke:var(--navy);stroke-width:1.6}
  .mk.sel .col-dot{fill:var(--co-blue);stroke:#fff;stroke-width:2.4}
  .mk.dim{opacity:.18}
  .mk.hot .col-dot{fill:var(--co-blue)}
  .base-star{fill:var(--crimson);stroke:#fff;stroke-width:1}
  .mk.sel .base-star{fill:#7d1018;stroke:var(--gold);stroke-width:1.8}
  .mk.hot .base-star{fill:#7d1018}
  /* controls */
  .ctl{position:absolute;display:flex;gap:6px;align-items:center;z-index:5}
  .ctl.tl{top:12px;left:12px;flex-direction:column;align-items:flex-start}
  .ctl.tr{top:12px;right:12px;flex-direction:column;align-items:flex-end}
  .ctl.bl{bottom:14px;left:12px}
  .card{background:rgba(255,255,255,.96);border:1px solid var(--line);border-radius:10px;
        box-shadow:0 2px 10px rgba(15,30,60,.12);padding:8px 10px}
  .btn{border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:7px;
       padding:5px 9px;font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap}
  .btn:hover{background:#f1f6fc;border-color:var(--co-blue)}
  .btn.on{background:var(--navy);color:#fff;border-color:var(--navy)}
  .zoombtns .btn{font-size:16px;font-weight:800;width:34px;height:34px;padding:0;line-height:1}
  .regions{display:flex;gap:6px;flex-wrap:wrap;max-width:60vw}
  .legend{font-size:12px;line-height:1.7}
  .legend .row{display:flex;align-items:center;gap:7px}
  .swatch{width:14px;height:14px;border-radius:50%%;display:inline-block;flex:0 0 auto}
  .star-swatch{color:var(--crimson);font-size:15px;line-height:1}
  .line-swatch{width:18px;height:0;border-top:3.5px solid var(--gold);display:inline-block}
  .toggle{display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;user-select:none}
  .toggle input{accent-color:var(--co-blue)}
  /* side panel */
  #side{flex:0 0 340px;max-width:42vw;background:var(--panel);border-left:1px solid var(--line);
        display:flex;flex-direction:column;min-height:0}
  #side .tabs{display:flex;border-bottom:1px solid var(--line);flex:0 0 auto}
  #side .tab{flex:1;padding:9px 6px;text-align:center;font-size:12.5px;font-weight:700;color:var(--muted);
             cursor:pointer;background:#f7fafd;border:none;border-bottom:3px solid transparent}
  #side .tab.on{color:var(--navy);background:#fff;border-bottom-color:var(--co-blue)}
  #side .body{flex:1 1 auto;overflow:auto;padding:12px 14px}
  .search{width:100%%;padding:7px 9px;border:1px solid var(--line);border-radius:8px;font-size:13px;margin-bottom:8px}
  .detail h2{margin:0 0 2px;font-size:16px;color:var(--navy)}
  .detail .kicker{font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:var(--co-blue)}
  .detail .blurb{font-size:12.5px;color:var(--muted);margin:8px 0}
  .detail .vet{font-size:13px;color:var(--navy);background:#fff4d6;border:1px solid #e8cf86;
        border-radius:8px;padding:6px 9px;margin:8px 0}
  #vet-stat b{color:#ffe2a6}
  .cta{display:inline-block;background:var(--navy);color:#fff;text-decoration:none;padding:8px 12px;
       border-radius:8px;font-weight:700;font-size:13px;margin:4px 0 10px}
  .cta:hover{background:var(--co-blue)}
  .pill{display:inline-block;background:#fff4d6;color:#7a5a06;border:1px solid #e8cf86;border-radius:999px;
        padding:1px 8px;font-size:11px;font-weight:700;margin-left:6px;vertical-align:middle}
  .nearlist{list-style:none;margin:8px 0 0;padding:0}
  .nearlist li{padding:7px 8px;border:1px solid var(--line);border-radius:8px;margin-bottom:6px;background:#fbfdff}
  .nearlist li a{color:var(--navy);font-weight:700;text-decoration:none;font-size:13px}
  .nearlist li a:hover{color:var(--co-blue);text-decoration:underline}
  .nearlist .meta{font-size:11.5px;color:var(--muted);margin-top:2px;display:flex;justify-content:space-between;gap:8px}
  .nearlist .demo{color:#7a5a06;font-weight:700}
  .dirlist{list-style:none;margin:0;padding:0}
  .dirlist li{padding:6px 6px;border-bottom:1px solid var(--line);font-size:13px;cursor:pointer;display:flex;
              justify-content:space-between;align-items:center;gap:8px}
  .dirlist li:hover{background:#f1f6fc}
  .dirlist li .nm{color:var(--navy);font-weight:600}
  .dirlist li .lnk{color:var(--co-blue);text-decoration:none;font-size:11.5px;font-weight:700;flex:0 0 auto}
  .hint{font-size:12px;color:var(--muted);margin:0 0 10px}
  .empty{color:var(--muted);font-size:13px;padding:14px 4px}
  footer{flex:0 0 auto;font-size:11px;color:var(--muted);padding:5px 14px;background:#fff;border-top:1px solid var(--line)}
  /* floating tooltip */
  #tip{position:fixed;z-index:50;pointer-events:none;background:#fff;border:1px solid var(--line);
       border-radius:8px;box-shadow:0 4px 14px rgba(15,30,60,.2);padding:7px 9px;max-width:240px;
       font-size:12px;display:none}
  #tip .t{font-weight:800;color:var(--navy)}
  #tip .c{color:var(--co-blue);font-weight:700;font-size:11px}
  #tip .b{color:var(--muted);margin-top:3px}
  @media (max-width:760px){
    #side{flex-basis:0;display:none}
    .regions{max-width:80vw}
  }
</style>
</head>
<body>
<div id="app">
  <header>
    <h1>California Community Colleges &amp; Military Installations</h1>
    <div class="sub"><b>Credit for Prior Learning</b> &mdash; turning military training into college credit &nbsp;•&nbsp;
      <b>115</b> colleges &nbsp;•&nbsp; <b>44</b> installations<span id="vet-stat"></span> &nbsp;•&nbsp; CPL Initiative / Veteran Sprint</div>
  </header>

  <div id="main">
    <div id="stage">
      <svg id="map" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <g id="viewport">
          <path id="boundary" class="ca-boundary"></path>
          <g id="g-pairs"></g>
          <g id="g-colleges"></g>
          <g id="g-bases"></g>
        </g>
      </svg>

      <div class="ctl tl">
        <div class="card legend">
          <div class="row"><span class="swatch" style="background:var(--navy)"></span> Community College</div>
          <div class="row"><span class="swatch" style="background:var(--gold);border:1.5px solid var(--navy)"></span> Demo-project college</div>
          <div class="row"><span class="star-swatch">&#9733;</span> Military installation</div>
          <div class="row"><span class="line-swatch"></span> Demonstration pairing</div>
        </div>
        <div class="card" style="display:flex;flex-direction:column;gap:5px">
          <label class="toggle"><input type="checkbox" id="t-col" checked> Colleges</label>
          <label class="toggle"><input type="checkbox" id="t-base" checked> Bases</label>
          <label class="toggle"><input type="checkbox" id="t-pair" checked> Pairings</label>
        </div>
      </div>

      <div class="ctl tr zoombtns">
        <button class="btn" id="zin" title="Zoom in">+</button>
        <button class="btn" id="zout" title="Zoom out">&minus;</button>
        <button class="btn" id="zreset" title="Reset view" style="font-size:12px;font-weight:700">Reset</button>
      </div>

      <div class="ctl bl card regions" id="regions"></div>
    </div>

    <aside id="side">
      <div class="tabs">
        <button class="tab on" data-tab="detail">Details</button>
        <button class="tab" data-tab="colleges">Colleges</button>
        <button class="tab" data-tab="bases">Bases</button>
      </div>
      <div class="body" id="panel-detail">
        <p class="hint">Click any <b>installation ★</b> to see the community colleges best positioned to partner
          with it on Credit for Prior Learning &mdash; or click a <b>college ●</b> to open its CPL landing page.</p>
        <div id="detail"></div>
      </div>
      <div class="body" id="panel-colleges" style="display:none">
        <input class="search" id="search-col" placeholder="Search 115 colleges…" autocomplete="off"/>
        <ul class="dirlist" id="list-col"></ul>
      </div>
      <div class="body" id="panel-bases" style="display:none">
        <input class="search" id="search-base" placeholder="Search 44 installations…" autocomplete="off"/>
        <ul class="dirlist" id="list-base"></ul>
      </div>
    </aside>
  </div>

  <footer>Coordinates are campus/installation-level (illustrative). Gold lines = the three demonstration-project pairings
    (Fort Irwin&ndash;Barstow, MCAGCC Twentynine Palms&ndash;Copper Mountain, Camp Pendleton&ndash;Palomar).
    Source: CPL Initiative / MAP, CCCCO. Self-contained — no internet required.</footer>
</div>

<div id="tip"></div>

<script>
const DATA = %(DATA_JS)s;
const NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("map");
const vp = document.getElementById("viewport");
svg.setAttribute("viewBox", "0 0 " + DATA.W + " " + DATA.H);
document.getElementById("boundary").setAttribute("d", DATA.boundary);

// ---------- geometry helpers ----------
function haversine(a, b){
  const R=3958.8, toR=Math.PI/180;
  const dLa=(b.la-a.la)*toR, dLo=(b.lo-a.lo)*toR;
  const la1=a.la*toR, la2=b.la*toR;
  const h=Math.sin(dLa/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLo/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function num(n){ return (n==null)? null : n.toLocaleString("en-US"); }
function vetLine(c){ return (c.m==null)? "" :
  `<div class="vet">&#127894; <b>${num(c.m)}</b> service member${c.m===1?'':'s'} &amp; veteran${c.m===1?'':'s'} served via CPL</div>`; }

// index by name for pair lookups
const colByName = {}; DATA.colleges.forEach(c=>colByName[c.n]=c);
const baseByName = {}; DATA.bases.forEach(b=>baseByName[b.n]=b);
const pairOf = {};   // base -> [collegeNames], college -> [baseNames]
DATA.pairs.forEach(([b,c])=>{ (pairOf[b]=pairOf[b]||[]).push(c); (pairOf[c]=pairOf[c]||[]).push(b); });

const STAR = "M0,-7 L1.9,-2.3 L7,-2.3 L2.8,1 L4.3,6.6 L0,3.3 L-4.3,6.6 L-2.8,1 L-7,-2.3 L-1.9,-2.3 Z";

// ---------- draw markers (counter-scaled so they stay constant screen size) ----------
let scale = 1;
const gCol = document.getElementById("g-colleges");
const gBase = document.getElementById("g-bases");
const gPair = document.getElementById("g-pairs");
const colEls = {}, baseEls = {};

DATA.colleges.forEach((c, i)=>{
  const g = document.createElementNS(NS,"g");
  g.setAttribute("class","mk col"+(c.k?" ":"")); g.dataset.i=i; g.dataset.kind="col";
  g.setAttribute("transform",`translate(${c.x},${c.y})`);
  const hit = document.createElementNS(NS,"circle"); hit.setAttribute("class","hit"); hit.setAttribute("r",11);
  const dot = document.createElementNS(NS,"circle"); dot.setAttribute("class","col-dot"+(c.k?" key":"")); dot.setAttribute("r",c.k?6.5:5);
  g.appendChild(hit); g.appendChild(dot);
  gCol.appendChild(g); colEls[c.n]=g;
});
DATA.bases.forEach((b, i)=>{
  const g = document.createElementNS(NS,"g");
  g.setAttribute("class","mk base"); g.dataset.i=i; g.dataset.kind="base";
  g.setAttribute("transform",`translate(${b.x},${b.y})`);
  const hit = document.createElementNS(NS,"circle"); hit.setAttribute("class","hit"); hit.setAttribute("r",12);
  const star = document.createElementNS(NS,"path"); star.setAttribute("class","base-star"); star.setAttribute("d",STAR);
  g.appendChild(hit); g.appendChild(star);
  gBase.appendChild(g); baseEls[b.n]=g;
});
const pairEls=[];
DATA.pairs.forEach(([bn,cn])=>{
  const b=baseByName[bn], c=colByName[cn]; if(!b||!c) return;
  const ln=document.createElementNS(NS,"line");
  ln.setAttribute("class","pair-line");
  ln.setAttribute("x1",b.x); ln.setAttribute("y1",b.y); ln.setAttribute("x2",c.x); ln.setAttribute("y2",c.y);
  ln.dataset.base=bn; ln.dataset.col=cn;
  gPair.appendChild(ln); pairEls.push(ln);
});

// keep marker glyphs a constant on-screen size regardless of zoom
function rescaleMarkers(){
  const inv = 1/scale;
  for(const k in colEls){ const c=colByName[k]; colEls[k].setAttribute("transform",`translate(${c.x},${c.y}) scale(${inv})`); }
  for(const k in baseEls){ const b=baseByName[k]; baseEls[k].setAttribute("transform",`translate(${b.x},${b.y}) scale(${inv})`); }
}

// ---------- zoom / pan via viewBox ----------
let vb = {x:0, y:0, w:DATA.W, h:DATA.H};
function applyVB(){
  svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
  scale = DATA.W / vb.w;
  rescaleMarkers();
}
function setView(cx, cy, w, h){
  // clamp
  w = Math.max(DATA.W*0.06, Math.min(DATA.W*1.4, w));
  h = w * (DATA.H/DATA.W);
  vb = {x: cx-w/2, y: cy-h/2, w, h};
  applyVB();
}
function zoomBy(f, ax, ay){
  // ax,ay = anchor in svg-units (default center)
  ax = ax==null? vb.x+vb.w/2 : ax;
  ay = ay==null? vb.y+vb.h/2 : ay;
  const nw = vb.w/f;
  const nh = nw*(DATA.H/DATA.W);
  // keep anchor stationary
  const rx = (ax-vb.x)/vb.w, ry=(ay-vb.y)/vb.h;
  vb = {w:nw, h:nh, x: ax-rx*nw, y: ay-ry*nh};
  // clamp width
  if(vb.w>DATA.W*1.4){ setView(DATA.W/2, DATA.H/2, DATA.W*1.4); return; }
  if(vb.w<DATA.W*0.06){ vb.w=DATA.W*0.06; vb.h=vb.w*(DATA.H/DATA.W); }
  applyVB();
}
document.getElementById("zin").onclick = ()=>zoomBy(1.5);
document.getElementById("zout").onclick = ()=>zoomBy(1/1.5);
document.getElementById("zreset").onclick = ()=>{ setView(DATA.W/2, DATA.H/2, DATA.W); clearSelection(); };

function clientToSvg(ev){
  const r=svg.getBoundingClientRect();
  return { x: vb.x + (ev.clientX-r.left)/r.width*vb.w,
           y: vb.y + (ev.clientY-r.top)/r.height*vb.h };
}
svg.addEventListener("wheel", ev=>{
  ev.preventDefault();
  const p=clientToSvg(ev);
  zoomBy(ev.deltaY<0?1.18:1/1.18, p.x, p.y);
}, {passive:false});

// drag to pan
let drag=null;
svg.addEventListener("pointerdown", ev=>{
  if(ev.target.closest(".mk")) return;     // let marker clicks through
  drag={sx:ev.clientX, sy:ev.clientY, ox:vb.x, oy:vb.y, moved:false};
  svg.classList.add("grabbing"); svg.setPointerCapture(ev.pointerId);
});
svg.addEventListener("pointermove", ev=>{
  if(!drag) return;
  const r=svg.getBoundingClientRect();
  const dx=(ev.clientX-drag.sx)/r.width*vb.w, dy=(ev.clientY-drag.sy)/r.height*vb.h;
  if(Math.abs(ev.clientX-drag.sx)+Math.abs(ev.clientY-drag.sy)>3) drag.moved=true;
  vb.x=drag.ox-dx; vb.y=drag.oy-dy; applyVB();
});
svg.addEventListener("pointerup", ev=>{ drag=null; svg.classList.remove("grabbing"); });
svg.addEventListener("pointerleave", ()=>{ drag=null; svg.classList.remove("grabbing"); });

// ---------- region presets (computed from member coords) ----------
function bboxOf(list){
  const xs=list.map(p=>p.x), ys=list.map(p=>p.y);
  return {x0:Math.min(...xs), x1:Math.max(...xs), y0:Math.min(...ys), y1:Math.max(...ys)};
}
function inBox(p, latMin,latMax,loMin,loMax){ return p.la>=latMin&&p.la<=latMax&&p.lo>=loMin&&p.lo<=loMax; }
const REGIONS = [
  {label:"Statewide", all:true},
  {label:"Bay Area",   latMin:36.9, latMax:38.6, loMin:-123.3, loMax:-121.5},
  {label:"Los Angeles",latMin:33.6, latMax:34.5, loMin:-118.9, loMax:-117.5},
  {label:"San Diego",  latMin:32.5, latMax:33.5, loMin:-117.4, loMax:-116.0},
  {label:"Inland Empire",latMin:33.7, latMax:34.3, loMin:-117.6, loMax:-116.2},
  {label:"Central Valley",latMin:35.0,latMax:38.7,loMin:-121.6,loMax:-118.7},
];
const regBox = document.getElementById("regions");
REGIONS.forEach((rg,idx)=>{
  const b=document.createElement("button"); b.className="btn"; b.textContent=rg.label;
  b.onclick=()=>{
    [...regBox.children].forEach(x=>x.classList.remove("on")); b.classList.add("on");
    if(rg.all){ setView(DATA.W/2, DATA.H/2, DATA.W); return; }
    const mem=[...DATA.colleges,...DATA.bases].filter(p=>inBox(p,rg.latMin,rg.latMax,rg.loMin,rg.loMax));
    if(!mem.length){ setView(DATA.W/2,DATA.H/2,DATA.W); return; }
    const bb=bboxOf(mem);
    const cx=(bb.x0+bb.x1)/2, cy=(bb.y0+bb.y1)/2;
    const w=Math.max((bb.x1-bb.x0)*1.5, DATA.W*0.12);
    setView(cx, cy, w);
  };
  if(idx===0) b.classList.add("on");
  regBox.appendChild(b);
});

// ---------- tooltip ----------
const tip=document.getElementById("tip");
function showTip(ev, htmlStr){ tip.innerHTML=htmlStr; tip.style.display="block"; moveTip(ev); }
function moveTip(ev){
  const pad=14, w=tip.offsetWidth, h=tip.offsetHeight;
  let x=ev.clientX+pad, y=ev.clientY+pad;
  if(x+w>innerWidth) x=ev.clientX-w-pad;
  if(y+h>innerHeight) y=ev.clientY-h-pad;
  tip.style.left=x+"px"; tip.style.top=y+"px";
}
function hideTip(){ tip.style.display="none"; }

// ---------- selection / highlight ----------
function clearHot(){ document.querySelectorAll(".mk.hot, .mk.dim, .mk.sel").forEach(e=>e.classList.remove("hot","dim","sel")); pairEls.forEach(l=>l.classList.remove("dim")); }
function clearSelection(){ clearHot(); renderDetailDefault(); }

function selectBase(name){
  const b=baseByName[name]; if(!b) return;
  clearHot();
  baseEls[name].classList.add("sel");
  // rank colleges by distance
  const ranked = DATA.colleges.map(c=>({c, d:haversine(b,c)})).sort((a,b)=>a.d-b.d);
  const demoSet = new Set(pairOf[name]||[]);
  const top = ranked.slice(0, 6);
  // dim everything, light up the near colleges
  DATA.colleges.forEach(c=>colEls[c.n].classList.add("dim"));
  DATA.bases.forEach(x=>{ if(x.n!==name) baseEls[x.n].classList.add("dim"); });
  pairEls.forEach(l=> l.dataset.base===name? null : l.classList.add("dim"));
  top.forEach(({c})=>{ colEls[c.n].classList.remove("dim"); colEls[c.n].classList.add("hot"); });
  (pairOf[name]||[]).forEach(cn=>{ if(colEls[cn]){ colEls[cn].classList.remove("dim"); colEls[cn].classList.add("hot"); } });
  // focus map near the base + its nearest college
  focusOn([b, ...top.map(t=>t.c)]);
  renderBaseDetail(b, ranked, demoSet);
  switchTab("detail");
}
function selectCollege(name){
  const c=colByName[name]; if(!c) return;
  clearHot();
  colEls[name].classList.add("sel");
  const ranked = DATA.bases.map(b=>({b, d:haversine(c,b)})).sort((a,b)=>a.d-b.d);
  const nearest = ranked[0];
  DATA.bases.forEach(b=>baseEls[b.n].classList.add("dim"));
  if(nearest){ baseEls[nearest.b.n].classList.remove("dim"); baseEls[nearest.b.n].classList.add("hot"); }
  (pairOf[name]||[]).forEach(bn=>{ if(baseEls[bn]){ baseEls[bn].classList.remove("dim"); baseEls[bn].classList.add("hot"); } });
  focusOn([c, nearest? nearest.b : c]);
  renderCollegeDetail(c, ranked);
  switchTab("detail");
}
function focusOn(pts){
  const bb=bboxOf(pts);
  const cx=(bb.x0+bb.x1)/2, cy=(bb.y0+bb.y1)/2;
  const w=Math.max((bb.x1-bb.x0)*2.2, DATA.W*0.16);
  setView(cx, cy, w);
}

// ---------- detail panel renderers ----------
const detail=document.getElementById("detail");
const CPL_BLURB="Credit for Prior Learning (CPL) turns military training (JST/CCAF), industry certifications, and work experience into college credit.";
function renderDetailDefault(){
  detail.innerHTML = `<p class="hint">Click any <b>installation &#9733;</b> to see the community colleges best
    positioned to partner with it on Credit for Prior Learning &mdash; or click a <b>college &#9679;</b> to open its CPL landing page.</p>
    <p class="hint" style="margin-top:14px">The three gold lines are the active <b>demonstration-project pairings</b>.</p>`;
}
function milesFmt(d){ return d<10? d.toFixed(1) : Math.round(d); }
function renderBaseDetail(b, ranked, demoSet){
  let lis="";
  ranked.slice(0,6).forEach(({c,d})=>{
    const demo = demoSet.has(c.n);
    const vet = c.m==null? "" : ` &middot; &#127894; ${num(c.m)} vets`;
    lis += `<li>
      <a href="${escapeHtml(c.u)}" target="_blank" rel="noopener" title="Open CPL landing page">${escapeHtml(c.n)} &#8599;</a>
      <div class="meta"><span>${milesFmt(d)} mi from base${vet}</span>${demo?'<span class="demo">&#9733; Demo project</span>':'<span>open CPL page</span>'}</div>
    </li>`;
  });
  detail.innerHTML = `<div class="detail">
    <div class="kicker">Military Installation</div>
    <h2>${escapeHtml(b.n)}</h2>
    <p class="blurb">Community colleges nearest to this installation &mdash; the strongest candidates to partner on
      CPL pathways for service members and veterans. Click a college to open its CPL landing page.</p>
    <div style="font-size:12px;font-weight:700;color:var(--navy);margin-bottom:4px">Partner colleges (nearest first)</div>
    <ul class="nearlist">${lis}</ul>
  </div>`;
}
function renderCollegeDetail(c, ranked){
  const nb = ranked[0];
  const partners = (pairOf[c.n]||[]);
  let pairHtml="";
  if(partners.length){
    pairHtml = `<div style="margin:8px 0"><span class="pill">&#9733; Demonstration project</span>
      <div class="blurb" style="margin-top:6px">Active pairing with <b>${escapeHtml(partners.join(', '))}</b>.</div></div>`;
  }
  let nearHtml="";
  if(nb){
    nearHtml = `<div style="font-size:12px;font-weight:700;color:var(--navy);margin:10px 0 4px">Nearest installation</div>
      <ul class="nearlist"><li>
        <a href="javascript:void(0)" onclick="selectBase('${escapeHtml(nb.b.n).replace(/'/g,"\\\\'")}')">${escapeHtml(nb.b.n)}</a>
        <div class="meta"><span>${milesFmt(nb.d)} mi away</span><span>view partner colleges</span></div>
      </li></ul>`;
  }
  detail.innerHTML = `<div class="detail">
    <div class="kicker">Community College</div>
    <h2>${escapeHtml(c.n)}</h2>
    ${vetLine(c)}
    <p class="blurb">${CPL_BLURB}</p>
    <a class="cta" href="${escapeHtml(c.u)}" target="_blank" rel="noopener">Open CPL Landing Page &#8594;</a>
    ${pairHtml}
    ${nearHtml}
  </div>`;
}

// ---------- marker events ----------
function bindEvents(g, kind){
  const i=+g.dataset.i;
  const obj = kind==="col"? DATA.colleges[i] : DATA.bases[i];
  g.addEventListener("mouseenter", ev=>{
    if(kind==="col"){
      const vet = obj.m==null? "" : `<div class="b" style="color:var(--navy)">&#127894; <b>${num(obj.m)}</b> veterans &amp; service members served via CPL</div>`;
      showTip(ev, `<div class="t">${escapeHtml(obj.n)}</div><div class="c">Credit for Prior Learning</div>
        ${vet}<div class="b" style="font-style:italic">Click for details &amp; CPL page &#8594;</div>`);
    } else {
      const demo = pairOf[obj.n]? ` &middot; demo with ${escapeHtml(pairOf[obj.n].join(', '))}`:'';
      showTip(ev, `<div class="t" style="color:var(--crimson)">${escapeHtml(obj.n)}</div>
        <div class="b">Military installation${demo}</div><div class="b" style="font-style:italic">Click for partner colleges &#8594;</div>`);
    }
  });
  g.addEventListener("mousemove", moveTip);
  g.addEventListener("mouseleave", hideTip);
  g.addEventListener("click", ev=>{
    ev.stopPropagation();
    hideTip();
    if(kind==="col") selectCollege(obj.n); else selectBase(obj.n);
  });
}
Object.values(colEls).forEach(g=>bindEvents(g,"col"));
Object.values(baseEls).forEach(g=>bindEvents(g,"base"));

// ---------- layer toggles ----------
document.getElementById("t-col").onchange=e=>{ gCol.style.display=e.target.checked?"":"none"; };
document.getElementById("t-base").onchange=e=>{ gBase.style.display=e.target.checked?"":"none"; };
document.getElementById("t-pair").onchange=e=>{ gPair.style.display=e.target.checked?"":"none"; };

// ---------- side tabs + directories ----------
function switchTab(name){
  document.querySelectorAll("#side .tab").forEach(t=>t.classList.toggle("on", t.dataset.tab===name));
  document.getElementById("panel-detail").style.display = name==="detail"?"":"none";
  document.getElementById("panel-colleges").style.display = name==="colleges"?"":"none";
  document.getElementById("panel-bases").style.display = name==="bases"?"":"none";
}
document.querySelectorAll("#side .tab").forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));

const listCol=document.getElementById("list-col");
const listBase=document.getElementById("list-base");
function buildColList(filter){
  const f=(filter||"").toLowerCase();
  const rows=DATA.colleges.filter(c=>c.n.toLowerCase().includes(f)).sort((a,b)=>a.n.localeCompare(b.n));
  listCol.innerHTML = rows.length? rows.map(c=>`<li data-n="${escapeHtml(c.n)}">
      <span class="nm">${escapeHtml(c.n)}${c.k?' <span class="pill">&#9733;</span>':''}${c.m!=null?` <span style="color:var(--muted);font-weight:400">&middot; &#127894; ${num(c.m)}</span>`:''}</span>
      <a class="lnk" href="${escapeHtml(c.u)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">CPL &#8599;</a>
    </li>`).join('') : '<div class="empty">No colleges match.</div>';
  listCol.querySelectorAll("li").forEach(li=>li.onclick=()=>selectCollege(li.dataset.n));
}
function buildBaseList(filter){
  const f=(filter||"").toLowerCase();
  const rows=DATA.bases.filter(b=>b.n.toLowerCase().includes(f)).sort((a,b)=>a.n.localeCompare(b.n));
  listBase.innerHTML = rows.length? rows.map(b=>`<li data-n="${escapeHtml(b.n)}">
      <span class="nm"><span class="star-swatch">&#9733;</span> ${escapeHtml(b.n)}</span>
      <span class="lnk">partners &#8594;</span></li>`).join('') : '<div class="empty">No installations match.</div>';
  listBase.querySelectorAll("li").forEach(li=>li.onclick=()=>selectBase(li.dataset.n));
}
document.getElementById("search-col").addEventListener("input",e=>buildColList(e.target.value));
document.getElementById("search-base").addEventListener("input",e=>buildBaseList(e.target.value));

// click empty map clears selection
svg.addEventListener("click", ev=>{ if(!ev.target.closest(".mk")) clearSelection(); });

// ---------- init ----------
if(DATA.milTotal!=null){
  document.getElementById("vet-stat").innerHTML =
    ` &nbsp;•&nbsp; <b>${num(DATA.milTotal)}</b> veterans &amp; service members served`;
}
buildColList(""); buildBaseList(""); renderDetailDefault();
applyVB();
</script>
</body>
</html>
""" % {
    "NAVY": NAVY, "CO_BLUE": CO_BLUE, "DK_BLUE": DK_BLUE, "CRIMSON": CRIMSON,
    "GOLD": GOLD, "DATA_JS": DATA_JS,
}

out = os.path.join(HERE, "ca_cpl_map_selfcontained.html")
with open(out, "w", encoding="utf-8") as f:
    f.write(HTML)
print("saved", out)
print("colleges:", len(colleges), "| bases:", len(bases), "| pairs:", len(pairs),
      "| size:", round(len(HTML)/1024, 1), "KB | external deps: 0")
