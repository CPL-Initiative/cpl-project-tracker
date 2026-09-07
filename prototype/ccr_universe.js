/* CCR Universe — SkyView, the graph view: the whole corpus on one canvas, with
 * cross-area repair. (Sam, 2026-08-24: "SkyView" names THIS canvas, not the
 * informational panes around it.)
 *
 * Sam's brief (2026-08-24): "seeing the whole universe initially with a keyword
 * zoom might be better. Sometimes courses are mismatched in the wrong subject
 * area and may need to be dragged to a course in another area. If users could
 * pull an area over closer to the clusters in another area, they could easily
 * drag and drop the misplaced course to the right parent course."
 *
 * And the five goals of 2026-09-03: see the whole universe · keyword-jump to any
 * cluster, course or subject · details on hover/click, with the catalog
 * description on a course title, and the number · title · units · identity
 * system on a course as you zoom in · every unassigned course individually in
 * orbit around the identity it is most aligned to · the map full screen, with
 * the other panes reached by scrolling down.
 *
 * Design constraints that follow, each load-bearing:
 *
 *  1. CANVAS, NOT SVG. ~50,000 points is ~200k DOM elements as SVG. Canvas draws
 *     it in one pass and stays smooth under pan/zoom.
 *  2. THE LAYOUT IS PRECOMPUTED AND STABLE. A layout that re-solves on load is
 *     unnavigable — you cannot learn where anything is. Coordinates ship from
 *     kb/_build_ccr_universe.py, orbits included.
 *  3. ISLANDS MOVE. Dragging a discipline is not decoration: it is how a curator
 *     brings two distant subjects side by side to move a course between them.
 *     Positions are per-browser and never leave the page.
 *  4. AN ORBIT IS A SUGGESTION. A stand-alone course orbits the identity the
 *     builder found most aligned; it is drawn hollow, tethered, and the inspector
 *     says WHY. Nothing is curated until a person moves the course.
 *
 * A move writes nothing. It records the `CN:<control number>` curation row the
 * live tab would write — the member re-home path that already exists.
 */
(function(){
"use strict";

var U=null, A=null;          // universe payload, atlas detail payload
var cvs, ctx, DPR=1;
var view={x:0,y:0,k:0.12};   // world→screen: screen = (world+pan)*k
var hoverIsl=null, hoverNode=null, selIsl=null, selNode=null;
var moves=[], movedTo={}, roster=null, byCn=null, cnHome=null, nodeIdx=null, orbitIdx=null;
var memIndex=null, memberSource="";
var cnCourses=null;           // cn -> [{n:code, c:college}] — EVERY course the key names
var MEMBER_PAGE=200, memFilter="", openDesc={};
var descCache={}, descState={};      // shard -> {cn: [desc, title, units]} · shard -> "loading"|"ok"|"blocked"|"missing"
/* Where the per-discipline description shards live, tried in order. The relative
 * directory serves a local `python3 -m http.server`; the public Supabase Storage
 * bucket `ccr-desc` serves the deployed page (Sam, 2026-08-24: "I expect we'll
 * put the shards on supabase"). The shards are 50 MB of derived text and are
 * NOT committed, so a page on GitHub Pages has only the bucket. */
/* Named, and exposed on the debug state, so the per-host contract is testable
 * without standing up a second window just to change the URL. */
function descBasesFor(hostname){
  var local  = "ccr_desc";
  var bucket = "https://hvuwhnbuahrtptokpqfh.supabase.co/storage/v1/object/public/ccr-desc";
  /* ⚠️ ORDER BY WHERE THE PAGE IS SERVED FROM, or the first base can never win.
   * The shards are NOT committed, so on the deployed site ./ccr_desc cannot
   * exist and every discipline paid one guaranteed 404 — which downloads a 5 KB
   * GitHub 404 page — before the fetch that works. Measured 2026-09-06: three
   * disciplines, three 404s, ~350 ms of pure latency, and a network panel that
   * reads like a broken page to anyone debugging something else. A working tree
   * served by `python3 -m http.server` is the ONLY place the directory exists,
   * so try it there and nowhere else. file:// has no hostname and keeps the
   * local order — descriptions cannot cross-origin from there anyway. */
  var h = hostname || "";
  var isLocal = !h || h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
  return isLocal ? [local, bucket] : [bucket, local];
}
var DESC_BASES = window.CPL_SKYVIEW_DESC_BASES ||
  descBasesFor((window.location && window.location.hostname) || "");
/* The canonical seed (kb/discipline_canonical_subj4.json) carries, per
 * discipline, the Common SUBJ and the authority chips of item 19 (Sam,
 * 2026-09-03): the verbatim C-ID / CCN code where it differs from ours, and a
 * "proposed" flag where no authority names the discipline (item 18). Read live
 * so the map never lags the seed; fail-soft when the file is not reachable. */
var SEED_URLS = window.CPL_SKYVIEW_SEED_URLS ||
  ["../kb/discipline_canonical_subj4.json", "kb/discipline_canonical_subj4.json"];
var authority=null;          // {discipline: {cs, chips:[{system,code}], source, flag}}
var drag=null;               // {kind:'pan'|'island'|'course'|'node', ...}
var searchHits=[], searchTerm="";
var placedBoxes=[], titlesQueued=0, labelStats={ids:0,titles:0,full:0};
/* Starts CLOSED (Sam, 2026-09-04: "Open SkyView with the detail panel default
 * hidden") — the map gets the width until you actually select something.
 * openInspector() still opens it on the first click of a node, so selecting a
 * course shows its details exactly as before; only the INITIAL state changed. */
var inspOpen=false;
/* The keyboard model's cursor, assigned by wire(). ⚠️ EVERY selection path
 * routes through it — mouse, search, panel link, keyboard — so Escape backs out
 * of a selection however it was made. It used to be set ONLY by the Tab/Enter
 * path, which made two separate reports of the same defect: a mouse user who
 * pressed Escape (as the footer hint tells them to, unconditionally) got
 * nothing, because kbInside was still false; and an identity opened by clicking
 * a title in the discipline panel had no way back to that discipline at all.
 * Observed 2026-09-06. */
var kbSync=null;
/* ⚠️ ENTRY POINTS ONLY — never renderNode(). Opening an identity puts a
 * document the reader has never seen underneath a scroll offset they chose for
 * a different one: from 600 the panel landed below the new course's title,
 * code, units and articulation line (observed 2026-09-06, reproduced 2/2). But
 * renderNode() also fires on every filter keystroke, description toggle and
 * staged move, and resetting there would throw the reader to the top mid-task —
 * which is precisely the friction Sam reported in the search list on
 * 2026-09-05 (ruling 3a). Reset where the DOCUMENT changes, not where it
 * repaints. */
function resetPanelScroll(){
  var el=document.getElementById("u-detail");
  if(el) el.scrollTop=0;
}
/* What a drag does (Sam, 2026-09-03: "need chips or icons to choose whether to
 * move an item or reposition the focus — when zoom, I couldn't see how to move
 * the screen to keep the subject in view"). "move" carries a course or a
 * subject; "pan" moves the view whatever is under the pointer. */
var mode="move";
/* SkyView ALONE is the default (Sam, 2026-09-05: "The full screen SkyView …
 * I would like to henceforth refer to as SkyView"): body.u-solo paints the map
 * section and nothing else. `solo` is module memory so a bare __ccrUniverse()
 * — the list's row click, the suggestion jump — comes back to the frame you
 * were in. `curView` names the view on screen for the Views menu and the hash. */
var solo=true, curView="skyview";
/* ── Show: what the map draws (Sam, 2026-09-05: "drop down to multi-choose show
 * All, CR, NC, NCE, C-ID, CCN, M-ID, Orphans (and any other category you think
 * might help)"). One set of switches, every key on by default; a point is drawn
 * when its credit status, its identity system and its kind are all switched on.
 * The three-position CR/NC control this replaces kept "not recorded" as its own
 * state, and so does this: `unrec` is a switch of its own, never folded into
 * credit. `members` is the ring of college-course squares an identity opens
 * into; the map is quieter with it off. */
var SHOW_KEYS=["cr","nc","nce","unrec","mid","cid","ccn","uni","ident","orbit","rim","members","arty","noart"];
var show={}; SHOW_KEYS.forEach(function(k){ show[k]=true; });
/* The word each switch shows in the menu, the hint and the row's tooltip. */
var SHOW_WORDS={cr:"CR \u2014 credit", nc:"NC \u2014 noncredit", nce:"NCE \u2014 noncredit enhanced", unrec:"Credit status not recorded",
  mid:"M-ID", cid:"C-ID", ccn:"CCN", uni:"Unified", ident:"Identities", orbit:"Orphans in orbit", rim:"Orphans on the rim", members:"College courses",
  arty:"Has articulations", noart:"No articulation recorded"};
/* ── the search selection (Sam, 2026-09-05: "make it multi-select capable") ──
 * Each pick from the suggestion list becomes a TOKEN beside the search box; the
 * map rings every token and fits them all in view. One token behaves exactly as
 * a single pick always did (a discipline at 150%, a course at 1,000%). Typing a
 * term and pressing Enter is a fresh search: it replaces the selection with one
 * term token, so the keyword search keeps its old meaning. */
var tokens=[];
/* What the page around the frame says about the window (COBI, via postMessage):
 * whether it has docked the map back inside its own chrome, and whether its
 * side menu is open. Stand-alone both stay false and the page is the window. */
var hostDocked=false, hostMenu=false;
/* The legend strip under the map folds away; the fold survives a re-render. */
var legendOpen=true;
/* A subject's identities are ringed on the map only up to this many: 408 red
 * rings on one island read as an alarm (Sam, 2026-09-03), and past this the
 * count in the hint says more than the rings would. */
var RING_MAX=150;
var subjIdx=null;            // code -> {code, n, sa, disc:{name:{n,sa,isl}}, home, homeIsl, others}
var wsPaint=null;            // repaints the open workspace table when the seed arrives
/* The world point the zoom BUTTONS zoom about: the searched subject, the
 * selection, or the last fly (Sam, 2026-09-03: "when I use the keyword search
 * and then zoom, I lose focus on the searched subject"). The wheel still zooms
 * at the pointer, because that is what a wheel means. */
var anchor=null;
/* Past this zoom an identity OPENS: the college courses it carries ring it as
 * small squares, each named by its code and college (Sam, 2026-09-03: "I
 * envision being able to zoom in on a single CCR and see the local courses
 * that belong to it. That's the view faculty will need to be able to see so
 * they can feel confident that we associated their course with the correct
 * CCR course."). The selected identity opens one band earlier. */
var MEMBER_ZOOM=2.7;
/* Past THIS zoom every identity in view opens at once; below it only the one you
 * selected or are hovering does, because in a dense island a neighbor's ring
 * of squares would otherwise sit over the identity you meant to click. */
var MEMBER_ZOOM_ALL=4.2;
var memberPts=[];
/* The pale discs of the open identities — reserved ground for label placement. */
var discBoxes=[];            // the member squares drawn this frame — {x,y,m,nd,isl} — for hit-testing
/* Below this zoom draw() renders NO nodes — so no search ring can appear. It is
 * a module constant because doSearch has to honour it: a search that flies to
 * "fit all the hits" picks a zoom below it whenever the hits are spread out,
 * and then reports "Ringed in red" over a canvas drawing nothing but islands.
 * Reported from a browser by Sam, 2026-08-25: 19 hits across 9 subjects, zoom
 * 12%, no rings. One constant read by both is what stops them disagreeing. */
var NODE_ZOOM=0.20;
/* ── Zoom ceiling, and why the radius has to taper with it (Sam, 2026-09-04) ──
 * "it needs to go higher than 900% so I can isolate 1 CCR course while keeping
 * the other courses visible surrounding it, in case I need to drag one into the
 * CCR course."
 *
 * ⚠️ RAISING THE CAP ALONE MAKES THAT HARDER, NOT EASIER. nodeRad() scaled
 * radius LINEARLY with view.k, and orbit positions are world coordinates so
 * their screen separation scales linearly too — the ratio of a circle's SIZE to
 * the GAP between circles was therefore constant at every zoom, which is why
 * zooming in never helped pick one course out of a crowded orbit. Worse, a
 * 100-course identity at k=40 would draw at a 508px radius and push the very
 * neighbors he wants to drag from off the screen.
 *
 * So above RAD_KNEE the radius grows with the SQUARE ROOT of the zoom while
 * positions keep scaling linearly: the courses spread apart relative to their
 * own size, which is what "isolate one, keep the others visible around it"
 * means geometrically. Measured on KINE M1750 (30 members, 22 orbiting): at 40x
 * the edge-to-satellite gap goes 85px -> 374px while the radius falls
 * 318px -> 101px. */
/* 7,000%: Sam, 2026-09-05, at the end of the session — "need to be able to zoom
 * to 7k — needed when working on a single course". The taper below keeps a dot
 * a dot up there; the positions keep spreading. */
var K_MIN=0.03, K_MAX=70, RAD_KNEE=4;
/* What a search result flies to, read straight off the zoom readout
 * (view.k * 100 is the percentage the corner shows). Sam, 2026-09-04. */
var COURSE_ZOOM=10, SUBJECT_ZOOM=1.5;
function radScale(k){ return k<=RAD_KNEE ? k : RAD_KNEE*Math.sqrt(k/RAD_KNEE); }
function clampK(k){ return Math.max(K_MIN, Math.min(K_MAX, k)); }
/* Progressive labels (Sam, 2026-09-03: "the full number and title and units and
 * if it is a MID, CID, CCN showing on the course info as you zoom in"). Three
 * bands, each a constant so the harness can assert the order: the identity's
 * number first, then number and title, then the full line with units and the
 * identity system. Every label still competes for space — a name that would
 * land on another is dropped, never stacked. */
var ID_ZOOM=0.95, TITLE_ZOOM=1.7, FULL_ZOOM=2.7;
var SAT_R=2.6;               // a stand-alone's world radius — the builder's SAT_R

/* ── the map's palette is CSS tokens (--sky-*), read at draw time ──────────
 * First Light says var(--token), never a raw hex; the canvas cannot read CSS
 * by itself, so readPal() asks the body's computed style for each token and
 * falls back to these light values when a token is absent (jsdom answers ""
 * for every custom property). body.u-dark redefines the tokens — the DARK
 * CANVAS Sam asked for on 2026-09-05 ("Dark mode selector") — so one rule
 * set colors the chrome, the legend swatches and the canvas alike. */
var PAL_LIGHT={ground:"#FFFFFF", island:"#F7F5F1", islandHover:"#F3F1EC", islandSel:"#EDE7F8",
  islandStroke:"rgba(28,28,26,.18)", tether:"rgba(109,40,217,.28)", hollow:"#FFFFFF",
  halo:"rgba(255,255,255,.94)", haloFill:"rgba(255,255,255,.8)",
  ink:"#1C1C1A", inkBody:"#3A3A36", inkMuted:"#5C5C55", inkForce:"#0047AB", inkAlert:"#920000",
  ringSearch:"#920000", ringSel:"#0047AB", ringToken:"#0047AB",
  leader:"rgba(28,28,26,.55)", leaderDot:"rgba(28,28,26,.62)", leaderForce:"rgba(146,0,0,.75)", leaderDotForce:"rgba(146,0,0,.85)",
  ringFaint:"rgba(28,28,26,.22)", gone:"#87877F", sqMoved:"#EAF1E6", sqCarried:"#E7EEF9", sqMovedStroke:"#2C601A", drag:"#0047AB",
  sys0Fill:"#F1EAFC", sys0Stroke:"#6D28D9", sys1Fill:"#E7EEF9", sys1Stroke:"#0047AB",
  sys2Fill:"#FBF1D8", sys2Stroke:"#8B6800", sys3Fill:"#EFEFEC", sys3Stroke:"#5C5C55"};
var pal=PAL_LIGHT;
function cssName(k){ return "--sky-"+k.replace(/([A-Z])/g, function(m){ return "-"+m.toLowerCase(); }); }
function readPal(){
  var cs=null; try{ cs=getComputedStyle(document.body); }catch(e){}
  var out={};
  Object.keys(PAL_LIGHT).forEach(function(k){
    var v=cs ? String(cs.getPropertyValue(cssName(k))||"").trim() : "";
    out[k]=v||PAL_LIGHT[k];
  });
  return out;
}
/* ── the label wears its identity system's color (Sam, 2026-09-05) ─────────
 * *"The label color should correspond with the MID,CID,CCN color."* The dot
 * already carries the system; the name beside it did not, so at any zoom where
 * the dots are small the legend's one distinction was unreadable exactly where
 * the reader is looking. Only the FIRST line takes it — the title. The id line
 * below stays muted, or two colored lines start competing with each other.
 *
 * ⚠️ Verified in both themes before it shipped: the system strokes measure
 * 5.15–8.44:1 on white and 6.76–9.23:1 on the dark ground, all clear of AA. A
 * stand-alone keeps the muted ink — it is a moon, and coloring it would claim a
 * membership it does not have. */
function labelInk(nd){
  if(!nd || nd.a) return pal.ink;
  var i=(nd.s===0||nd.s===1||nd.s===2)?nd.s:3;
  return pal["sys"+i+"Stroke"] || pal.ink;
}
function sysPal(nd){
  var i=(nd.s===0||nd.s===1||nd.s===2)?nd.s:3, w=SYS[i];
  return [pal["sys"+i+"Fill"], pal["sys"+i+"Stroke"], w[2], w[3]];
}
/* ⭐ TEXT SIZE IS A SECOND AXIS, NOT A CHANGE TO ZOOM (Sam's ruling 3,
 * 2026-09-06). He asked for a control that sizes the map's labels up or down
 * and was explicit that it must not touch today's behavior, where text does NOT
 * grow with the map: "it's important to keep with all we have going on." Label
 * size is already independent of view.k, so this scales that, and the map's own
 * zoom is untouched.
 *
 * ⚠️ THREE NAMED STEPS, NOT A SLIDER, AND THE REASON IS THE LABEL PLACER.
 * placeLabels() drops any island label whose box clashes with one already
 * placed, and the course labels try four corners and are dropped if none fits.
 * So past a certain size the map does not crowd — it goes QUIET, and a reader
 * who asked for bigger text gets fewer labels with nothing to say why. Three
 * bounded steps stay inside what the placer can honor.
 *
 * ⚠️ THE COLLISION BOXES SCALE WITH THE TEXT. Scaling the font alone would
 * leave the placer measuring the old height, so labels would be accepted that
 * then overlap — the one failure worse than a dropped label. */
var TEXT_STEPS=[["Smaller",0.85],["Normal",1],["Larger",1.25]];
var textStep=1;                                   // index into TEXT_STEPS
try{
  var ts=parseInt(localStorage.getItem("skyview:text")||"1",10);
  if(ts>=0 && ts<TEXT_STEPS.length) textStep=ts;
}catch(e){}
function tx(){ return TEXT_STEPS[textStep][1]; }
/* Rounded, because a fractional px font measures fine and renders soft. */
function txPx(base){ return Math.round(base*tx()); }
function setTextStep(i){
  textStep=Math.max(0, Math.min(TEXT_STEPS.length-1, i|0));
  try{ localStorage.setItem("skyview:text", String(textStep)); }catch(e){}
  paintTextStep();
  if(cvs && document.getElementById("u-cvs")===cvs) draw();
}
function paintTextStep(){
  var b=document.getElementById("u-textsize");
  if(!b) return;
  var sw=b.querySelector(".u-state"); if(sw) sw.textContent=TEXT_STEPS[textStep][0].toLowerCase();
  b.title="Label text: "+TEXT_STEPS[textStep][0]+". Click for the next size.";
}
window.__ccrTextStep=function(i){ if(i==null) return textStep; setTextStep(i); };
var dark=false;
try{ dark = localStorage.getItem("skyview:theme")==="dark"; }catch(e){}
if(dark && document.body) document.body.classList.add("u-dark");
function setDark(on){
  dark=!!on;
  document.body.classList.toggle("u-dark", dark);
  try{ localStorage.setItem("skyview:theme", dark?"dark":"light"); }catch(e){}
  paintDark();
  if(cvs && document.getElementById("u-cvs")===cvs) draw();
}
function paintDark(){
  var b=document.getElementById("u-dark");
  if(b){
    b.setAttribute("aria-pressed", dark?"true":"false"); b.title = dark ? "Back to the light canvas" : "Dark canvas";
    var sw=b.querySelector(".u-state"); if(sw) sw.textContent=dark?"on":"off";
  }
}
var SYS=[["#F1EAFC","#6D28D9","M-ID","our working label"],
         ["#E7EEF9","#0047AB","C-ID","official statewide"],
         ["#FBF1D8","#8B6800","CCN","official statewide"],
         ["#EFEFEC","#5C5C55","unified","synthetic course"]];
/* ⚠️ THE MOST REPEATED CHIP ON THE SURFACE HAD THE LEAST TO SAY. The two chips
 * beside it — the authority code and "proposed" — cite the ruling and its date;
 * this one carried no title at all, on 13 of the 16 chips in a typical panel
 * (observed 2026-09-06). "M-ID — our working label" names the system without
 * saying what follows from it: who may re-key it, and whether it is a statewide
 * claim. That is the part a faculty reviewer needs. */
var SYSWHY=[
  "Our own working number, minted by the Common Course Reference. We may re-key it — it asserts no statewide equivalence.",
  "An ASCCC C-ID: an official statewide number. Nobody here may re-key it.",
  "A Common Course Numbering (CCN) number: an official statewide number. Nobody here may re-key it.",
  "A synthetic row standing in for a course identity. It carries no minted number of its own."];
/* why-bits on an orbiting point — mirrors kb/_build_ccr_universe.py */
var WHY=[[1,"the same local subject code"],[4,"words in common in the title"],
         [2,"the same SUBJ4"],[8,"the same TOP code"],[16,"the same units"],
         [32,"the same credit type"]];

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function num(n){return (n==null?0:n).toLocaleString("en-US");}
function cw(){ return (cvs&&cvs.clientWidth)||960; }
function ch(){ return (cvs&&cvs.clientHeight)||600; }
function w2s(x,y){return [(x+view.x)*view.k + cw()/2, (y+view.y)*view.k + ch()/2];}
function s2w(px,py){return [(px-cw()/2)/view.k - view.x, (py-ch()/2)/view.k - view.y];}
function trunc(s,n){ s=String(s==null?"":s); return s.length>n?s.slice(0,n-1)+"…":s; }
function unitsWord(u){
  if(u==null) return "units not given";
  if(u===0) return "0 units";
  return u+" unit"+(u===1?"":"s");
}
function sysWord(nd){ var s=SYS[nd.s]||SYS[3]; return s[2]; }
/* "3u" — the units the way Sam wrote them (2026-09-03: "Course title and units (3u)"). */
function unitsShort(u){
  if(u==null) return "";
  var n=Math.round(u*10)/10;
  return String(n)+"u";
}
function loadAuthority(){
  var urls=SEED_URLS.slice();
  (function next(){
    var url=urls.shift(); if(!url) return;
    var p; try{ p=fetch(url); }catch(e){ p=Promise.reject(e); }
    p.then(function(r){ if(!r.ok) throw new Error(String(r.status)); return r.json(); })
     .then(function(seed){
        var out={}, ds=(seed&&seed.disciplines)||{};
        Object.keys(ds).forEach(function(d){
          var e=ds[d]||{};
          if(!e.canonical_subj4) return;
          out[d]={cs:e.canonical_subj4, chips:(e.authority_chips||[]).slice(),
                  source:e.canonical_source||null, flag:e.authority_flag||null,
                  umbrella:(e.umbrella_codes||[]).slice(), fanIn:(e.fan_in_with||[]).slice()};
        });
        authority=out;
        if(wsPaint) wsPaint();
        // A subject card already open gets its line without a second click.
        if(selIsl && !selNode) showIsland(selIsl);
     })
     .catch(function(){ next(); });
  })();
}
/* One line on a subject card and its tooltip: the Common SUBJ, then the
 * authority's code as a word chip where it differs ("C-ID AJ" beside CRIM), or
 * the word "proposed" where the CSR minted the code itself. */
function authorityWords(isl){
  var a=authority&&authority[isl.d]; if(!a) return "";
  var h='Common SUBJ <strong>'+esc(a.cs)+'</strong>';
  if(a.chips.length) h+=' · '+a.chips.map(function(c){
    return '<span class="chip cid" title="The '+esc(c.system)+' subject code for these courses; the Common SUBJ stays four letters (rule 3, 2026-09-03)">'+esc(c.system+" "+c.code)+'</span>';
  }).join(' ');
  else if(a.source==="ccn") h+=' <span class="sub">(the CCN code)</span>';
  else if(a.source==="c-id") h+=' <span class="sub">(the C-ID code)</span>';
  if(a.flag==="proposed") h+=' <span class="chip mut" title="No C-ID or CCN code names this discipline yet; the CSR proposes this one (item 18, 2026-09-03)">proposed</span>';
  return h;
}
function whyWords(w){
  var out=[]; WHY.forEach(function(p){ if(w&p[0]) out.push(p[1]); });
  return out.length?out.join(", "):"no shared signal";
}
/* ── Credit status (payload field `c`) ────────────────────────────────────
 * 0 credit · 1 noncredit · 2 noncredit enhanced · ABSENT = not recorded.
 * ⚠️ Absent is its own state, not credit. 73 identities carry no value, and
 * folding them into "credit" would be the false zero this repo keeps relearning.
 * The filter therefore has three positions and "All" is the only one that shows
 * an unrecorded course — never silently dropped, and the chip says how many. */
var CR_ALL="all", CR_CREDIT="cr", CR_NC="nc";
/* `creditFilter` is DERIVED from the show switches now (see creditShown): "all",
 * "cr", "nc", or "custom" when the switches say something the three words
 * cannot. Kept as a name because the harness and the state export read it. */
var creditFilter=CR_ALL;
function syncCreditWord(){
  creditFilter = (show.cr&&show.nc&&show.nce&&show.unrec) ? CR_ALL
               : (show.cr&&!show.nc&&!show.nce&&!show.unrec) ? CR_CREDIT
               : (!show.cr&&(show.nc||show.nce)&&!show.unrec) ? CR_NC : "custom";
}
function isNC(nd){ return nd.c===1 || nd.c===2; }
/* The word a reader sees. `Noncredit enhanced` is the CDCP distinction and is
 * kept — it is a different thing from plain noncredit, and the list has room. */
function creditWord(nd){
  return nd.c===0 ? "credit" : nd.c===1 ? "noncredit"
       : nd.c===2 ? "noncredit enhanced" : "credit status not recorded";
}
function isCR(nd){ return nd.c===0; }
function creditOK(nd){ return nd.c===0 ? show.cr : nd.c===1 ? show.nc : nd.c===2 ? show.nce : show.unrec; }
function systemOK(nd){ var x=nd.s; return x===0 ? show.mid : x===1 ? show.cid : x===2 ? show.ccn : show.uni; }
function kindOK(nd){ return nd.a ? (nd.o ? show.orbit : show.rim) : show.ident; }
/* Drawn when every switch that describes the point is on. The name survives
 * from the three-position filter it grew out of; the tests read it. */
/* ── articulations as a category of their own (Sam's ruling 1, 2026-09-05) ───
 * TWO switches, not one, matching how every other group here works: a point
 * passes when its credit status AND its identity system AND its kind AND its
 * articulation state are all switched on. One switch called "has articulations"
 * could only ever mean "hide the rest", which is not what a box that starts
 * ticked says. Untick "No articulation recorded" and the map keeps only the
 * points somebody has actually articulated against.
 *
 * ⚠️ `ar` is ABSENT rather than 0 on a point with none — "no articulation
 * recorded" and "we did not look" are the same thing on this feed, so the
 * payload does not assert the first. */
function artOK(nd){ return (nd.ar > 0) ? !!show.arty : !!show.noart; }
function creditShown(nd){ return creditOK(nd) && systemOK(nd) && kindOK(nd) && artOK(nd); }
/* ── an island answers to the Show switches TOO (Sam, 2026-09-05: "Show:All box
 * does not respond when making changes") ─────────────────────────────────────
 *
 * ⚠️ THE SWITCHES WERE NEVER INERT — THE MAP WAS. Individual courses are only
 * drawn past NODE_ZOOM (0.20); SkyView opens at k = 0.100, three zoom steps
 * below it, because at 10% fifty thousand dots are a smear and the disciplines
 * are the thing worth reading. So every switch changed the label, changed the
 * count in the hint, and changed nothing whatever on the canvas — which is
 * indistinguishable from a control that is broken, and is what Sam reported.
 *
 * The fix is not to draw the dots (they would still be a smear); it is to let
 * the filter reach WHAT IS DRAWN. At every zoom, a discipline holding no course
 * that passes the switches is not drawn. Deselect all now empties the map at
 * 10%, "NC only" drops the disciplines that teach no noncredit, and the control
 * answers wherever the reader happens to be standing.
 *
 * Memoized on a signature of the switches: draw() runs on every pan and zoom
 * frame, and re-counting 49,896 courses per frame is exactly the kind of cost
 * that turns a filter into a stutter. */
function showSig(){ var t=""; for(var i=0;i<SHOW_KEYS.length;i++) t+=show[SHOW_KEYS[i]]?"1":"0"; return t; }
function islandPass(isl){
  var sig=showSig();
  if(isl._passSig!==sig){
    var n=0;
    for(var i=0;i<isl.p.length;i++) if(creditShown(isl.p[i])) n++;
    isl._pass=n; isl._passSig=sig;
  }
  return isl._pass;
}
/* ── a pick switches on what it needs to be seen (Sam, 2026-09-05, with
 * "Show: 1 of 12" in the row: "Courses are no longer visible when I filter for
 * welding subject"). A pick that lands on a hidden point is a ring around
 * nothing, so the switches the point needs — its credit status, its identity
 * system, its kind, and for an identity the college courses it opens into and
 * the stand-alones in orbit — come on, and the hint says which. Nothing else
 * changes: a switch the reader set stays set unless the pick needs it. */
var showHealed=[];
function showNeeds(nd){
  var need={};
  need[nd.c===0?"cr":nd.c===1?"nc":nd.c===2?"nce":"unrec"]=true;
  need[nd.s===0?"mid":nd.s===1?"cid":nd.s===2?"ccn":"uni"]=true;
  need[nd.a?(nd.o?"orbit":"rim"):"ident"]=true;
  if(!nd.a){ need.members=true; need.orbit=true; }
  return need;
}
function healShow(nd){
  var need=nd?showNeeds(nd):{ident:true}, patch={}, turned=[];
  SHOW_KEYS.forEach(function(k){ if(need[k] && !show[k]){ patch[k]=true; turned.push(k); } });
  showHealed=turned;
  if(turned.length && typeof window.__ccrSetShow==="function") window.__ccrSetShow(patch, true);
  return turned;
}
/* ── the same courtesy for a DISCIPLINE pick and for a set of search hits ────
 * healShow answers "the point you picked is switched off"; these answer "every
 * point behind what you picked is switched off", which had no answer at all:
 * the discipline branch called healShow(null), which turns on `ident` and
 * nothing else, so with the credit switches off the island the reader had just
 * chosen still held nothing they could see. Now that a discipline with nothing
 * switched on is not DRAWN, that gap became a pick that lands on empty ground.
 *
 * ⚠️ Heal only when NOTHING passes. A filter the reader set stands as long as it
 * still leaves them something to look at — healing a filter that is working is
 * how a control starts fighting the person holding it. */
function healUnion(nodes){
  showHealed=[];
  if(!nodes || !nodes.length) return [];
  var need={}, i, k;
  for(i=0;i<nodes.length;i++){ var n=showNeeds(nodes[i]); for(k in n) need[k]=true; }
  var patch={}, turned=[];
  SHOW_KEYS.forEach(function(key){ if(need[key] && !show[key]){ patch[key]=true; turned.push(key); } });
  showHealed=turned;
  if(turned.length && typeof window.__ccrSetShow==="function") window.__ccrSetShow(patch, true);
  return turned;
}
function healIsland(isl){
  showHealed=[];
  if(!isl || islandPass(isl)>0) return [];
  return healUnion(isl.p);
}
function healHits(hits){
  showHealed=[];
  if(!hits || !hits.length) return [];
  for(var i=0;i<hits.length;i++) if(creditShown(hits[i].nd)) return [];   // one is enough
  return healUnion(hits.map(function(h){ return h.nd; }));
}
function healWords(){
  if(!showHealed.length) return "";
  return " Switched on "+showHealed.map(function(k){ return "<strong>"+esc(SHOW_WORDS[k])+"</strong>"; }).join(", ")+" under Show so this is visible.";
}
/* The short words the search list shows (Sam, 2026-09-05: "abbreviate
 * Discipline to DISC; Course to CRSE; Credit to CR"). */
function creditShort(nd){ return nd.c===0 ? "CR" : nd.c===1 ? "NC" : nd.c===2 ? "NCE" : "CR status not recorded"; }
function kindShort(kind, nd){
  return kind==="subject" ? "DISC" : kind==="member" ? "COLLEGE CRSE"
       : kind==="term" ? "SEARCH" : (nd&&nd.a) ? "STAND-ALONE CRSE" : "CRSE IDENTITY";
}
/* Dash length tracks the radius so the break stays visible as you zoom: a fixed
 * pattern turns into a solid ring on a big circle and vanishes on a small one. */
function ncDash(rad){ var d=Math.max(2, Math.min(9, rad*0.55)); return [d, d*0.72]; }

/* Ring stroke: thin at every zoom (Sam, 2026-09-05: "Make the course circle
 * outlines thin for readability"). A width that grew with the radius put a
 * 6px band around every course at 1000%, which is where the map is read most
 * closely; the fill and the dash carry the meaning, the stroke only closes it. */
function ringWidth(rad){ return Math.max(0.9, Math.min(1.4, rad*0.18)); }
/* ── dots (Sam, 2026-09-05, with Obsidian's graph open: "See how obsidian uses
 * dots for item, which we could do since we don't put info in the course
 * circles, and see how it spreads more" · "color-coded dots to match our
 * legend"). The builder packs every point with a footprint (nodeRad); the mark
 * drawn is a DOT inside it, so the positions do not move and the air between
 * points comes from the difference. An identity is a solid dot in its system's
 * color, sized by its members; a stand-alone is a smaller, lighter dot; a
 * noncredit course keeps its broken ring, drawn just outside the dot. */
var DOT_IDENT=0.66, DOT_ORPHAN=0.62, ORPHAN_ALPHA=0.6;
var DIM_ALPHA=0.3, lastFocus=null;   // the click highlight: what fades when something is selected
function dotRad(nd, rad){ return nd.a ? Math.max(1.2, rad*DOT_ORPHAN) : Math.max(1.6, rad*DOT_IDENT); }
/* The islands themselves sit closer than a reader wants ("spread out the disc
 * and course circles more for readability"): their centers move apart once, at
 * load, about the map's center; their radii and everything inside keep their
 * shape, so the gap between neighbors is what grows. */
var SPREAD_ISLANDS=1.22;
function spreadUniverse(u){
  if(!u || !u.islands || u._spread) return; u._spread=true;
  var G=SPREAD_ISLANDS; if(G===1) return;
  var b=u.bounds||null, cx=b?(b.x0+b.x1)/2:0, cy=b?(b.y0+b.y1)/2:0;
  u.islands.forEach(function(I){
    var nx=cx+(I.x-cx)*G, ny=cy+(I.y-cy)*G, ddx=nx-I.x, ddy=ny-I.y;
    I.x=nx; I.y=ny;
    (I.p||[]).forEach(function(nd){ nd.x+=ddx; nd.y+=ddy; });
  });
  if(b) u.bounds={x0:cx+(b.x0-cx)*G, y0:cy+(b.y0-cy)*G, x1:cx+(b.x1-cx)*G, y1:cy+(b.y1-cy)*G};
}
function nodeRad(nd){
  var rs=radScale(view.k);   // tapered above RAD_KNEE — see the note by K_MAX
  return nd.a ? Math.max(1.3, SAT_R*rs)
              : Math.max(1.4, (2.2+Math.sqrt(Math.max(1,nd.n))*1.05)*rs);
}

/* ── member lookup ────────────────────────────────────────────────────────
 * roster[identity] = [{cn, n:course code, c:college name}] — every college
 * course the identity carries, which is what a curator drags.
 *
 * The full universe payload (ccr_universe_members.json) covers every identity
 * that carries members. The older per-discipline sample inside
 * ccr_atlas_data.json is kept as a FALLBACK so the page still does something
 * useful if the big payload is absent — and memberSource records which one is
 * live, because "no courses here" and "no courses shipped" look identical on
 * screen and mean opposite things.
 *
 * TWO different things make a control number non-unique here:
 *
 *  1. A control number can appear under MORE THAN ONE IDENTITY (the forward
 *     join surfaces an over-merged course on every card that claims it). The
 *     write is one `CN:` row per control number, so a move is a single global
 *     statement: movedTo[cn] is the ONLY home that counts once a curator has
 *     moved a course, and the course leaves every other card it showed on.
 *
 *  2. A control number can name MORE THAN ONE COURSE. Measured by
 *     kb/_audit_control_number_claims.py: most are one course written two ways,
 *     but 73 are genuinely two different courses filed under one number, and
 *     the key cannot tell any of them apart.
 *
 * (2) is why cnCourses exists. A move whose key names several courses cannot be
 * expressed by `CN:<cn>` at all, so it is REFUSED rather than written wrong —
 * see canMove().
 */
function noteCourse(cn, rec){
  var l=cnCourses[cn]||(cnCourses[cn]=[]);
  for(var i=0;i<l.length;i++) if(l[i].n===rec.n && l[i].c===rec.c) return;
  l.push({n:rec.n, c:rec.c});
}
function buildMemberIndex(){
  roster={}; byCn={}; cnHome={}; cnCourses={}; memberSource=""; memIndex=[];
  var MEM=window.CPL_CCR_UNIVERSE_MEMBERS||null;
  if(MEM && MEM.m){
    var cols=MEM.colleges||[];
    Object.keys(MEM.m).forEach(function(id){
      roster[id]=MEM.m[id].map(function(r){
        var digits=String(r[0]);
        var cn="CCC"+digits.padStart(9,"0");
        var rec={cn:cn, d:digits, n:r[1]||"", c:cols[r[2]]||"—"};
        noteCourse(cn, rec);
        if(!(cn in byCn)){ byCn[cn]=rec; cnHome[cn]=id; }
        // The search index: every college course by code and by control number.
        memIndex.push({id:id, cn:cn, d:digits, code:rec.n, lc:rec.n.toLowerCase(), c:rec.c});
        return rec;
      });
    });
    memberSource="universe";
    return;
  }
  if(!A||!A.detail) return;
  Object.keys(A.detail).forEach(function(dn){
    A.detail[dn].forEach(function(pack){
      pack.nodes.forEach(function(nd){
        if(!nd.m||!nd.m.length) return;
        roster[nd.id]=nd.m.map(function(m){
          var hit=/^CCC(\d{9})$/.exec(m.cn||"");
          return {cn:m.cn, d:hit?String(parseInt(hit[1],10)):"", n:m.n, c:m.c};
        });
        roster[nd.id].forEach(function(m){
          noteCourse(m.cn, m);
          if(!(m.cn in byCn)){ byCn[m.cn]=m; cnHome[m.cn]=nd.id; }
          memIndex.push({id:nd.id, cn:m.cn, d:m.d, code:m.n, lc:(m.n||"").toLowerCase(), c:m.c});
        });
      });
    });
  });
  memberSource="sample";
}
/* The identity a course started on. A course claimed by several identities has
 * several honest answers; the FIRST is recorded only so the move receipt can say
 * where it came from — the move itself is global and leaves all of them. */
function originOf(cn){ return (cnHome&&cnHome[cn])||null; }
function coursesOn(cn){ return (cnCourses&&cnCourses[cn])||[]; }
/* One sentence, used by the chip and by the refusal, so the warning a curator
 * reads before clicking and the message they get after cannot disagree. */
function sharedKeyReason(cn, code, others){
  var them=(others||coursesOn(cn)).filter(function(o){return o.n!==code;});
  var list=them.slice(0,3).map(function(o){return o.n+" ("+o.c+")";}).join(", ");
  return "Cannot re-home <strong>"+esc(code)+"</strong>: control number "+esc(cn)+
    " names "+((others||coursesOn(cn)).length)+" courses — also "+esc(list)+
    (them.length>3?" and "+(them.length-3)+" more":"")+
    ". The write is <code>CN:"+esc(cn)+"</code>, which cannot say which one, so "+
    "the move would land whichever course is indexed first. Fix the duplicate "+
    "control number upstream in COCI, or widen the write key.";
}
/* Can this course be re-homed at all? `CN:<control number>` carries no way to
 * say WHICH course, and the receiving end picks the first one it finds. So for
 * an ambiguous key a move is not merely risky, it is INEXPRESSIBLE. Refusing is
 * the honest answer. Widening the key is a schema decision. */
function canMove(cn){
  var l=coursesOn(cn);
  if(l.length<2) return {ok:true};
  return {ok:false, others:l};
}

/* ── course descriptions, fetched per discipline on demand ────────────────
 * Shard shape: { "<control number digits>": [description|null, title, units] }.
 * Keyed by control number, so the members payload can drop a keyless course
 * without shifting every later description onto the wrong row.
 *
 * ⚠️ Under file:// every fetch fails on CORS. That is REPORTED, never swallowed:
 * a drill-down that silently shows nothing is indistinguishable from a course
 * that genuinely has no description, and the second is a real and common state.
 */
function loadDesc(isl, then){
  var sh=isl&&isl.sh; if(!sh) return then&&then();
  var st=descState[sh];
  if(st==="ok"||st==="blocked"||st==="missing") return then&&then();
  if(st==="loading") return;
  if(typeof fetch!=="function"){ descState[sh]="missing"; return then&&then(); }
  descState[sh]="loading";
  var bases=DESC_BASES.slice();
  function tryNext(){
    var base=bases.shift();
    if(base==null){
      descState[sh]=(location.protocol==="file:")?"blocked":"missing";
      return then&&then();
    }
    var url=base.replace(/\/$/,"")+"/"+encodeURIComponent(sh)+".json";
    fetch(url).then(function(r){
      if(!r.ok) throw new Error("http "+r.status);
      return r.json();
    }).then(function(j){
      descCache[sh]=j; descState[sh]="ok"; then&&then();
    }).catch(function(){ tryNext(); });
  }
  tryNext();
}
function courseInfo(isl, m){
  var sh=isl&&isl.sh; if(!sh||!descCache[sh]) return null;
  var rec=descCache[sh][m.d]; if(!rec) return null;
  return {desc:rec[0]||null, title:rec[1]||"", units:rec[2]};
}
/* The record a curator actually picked up, for a course that has been moved. */
function movedRecord(cn){
  for(var i=0;i<moves.length;i++)
    if(moves[i].cn===cn) return {cn:cn, d:moves[i].d, n:moves[i].code, c:moves[i].college};
  return byCn&&byCn[cn]||null;
}
function membersOf(id){
  var out=(roster&&roster[id]||[]).filter(function(m){
    return !(m.cn in movedTo) || movedTo[m.cn]===id;
  });
  Object.keys(movedTo).forEach(function(cn){
    if(movedTo[cn]!==id) return;
    for(var i=0;i<out.length;i++) if(out[i].cn===cn) return;
    var rec=movedRecord(cn);
    if(rec) out.push(rec);
  });
  return out;
}
function indexNodes(){
  nodeIdx={}; orbitIdx={};
  U.islands.forEach(function(isl){
    isl.p.forEach(function(nd){
      nodeIdx[nd.i]={isl:isl,nd:nd};
      if(nd.a && nd.o) (orbitIdx[nd.o]||(orbitIdx[nd.o]=[])).push(nd);
    });
  });
  Object.keys(orbitIdx).forEach(function(k){
    orbitIdx[k].sort(function(a,b){ return (b.q||0)-(a.q||0) || String(a.i).localeCompare(String(b.i)); });
  });
}
function nodeById(id){ if(!nodeIdx) indexNodes(); return nodeIdx[id]||null; }
function orbitsOf(id){ if(!orbitIdx) indexNodes(); return orbitIdx[id]||[]; }
/* A stand-alone whose one course has been moved away is an emptied shell. */
function emptied(nd){
  if(!nd.a) return false;
  var m=(roster&&roster[nd.i]||[])[0];
  return !!(m && (m.cn in movedTo) && movedTo[m.cn]!==nd.i);
}

/* ── draw ───────────────────────────────────────────────────────────────── */
function draw(){
  if(!ctx||!U) return;
  var W=cw(), H=ch();
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,W,H);
  pal=readPal();
  ctx.fillStyle=pal.ground;
  ctx.fillRect(0,0,W,H);

  var k=view.k;
  var showNodes = k>NODE_ZOOM, showLabels = k>0.55, showTethers = k>ID_ZOOM;
  var hitSet={}; searchHits.forEach(function(h){ hitSet[h.id]=1; });
  var tokenIsl={}; tokens.forEach(function(t){ (t.isls||[]).forEach(function(I){ tokenIsl[I.d]=1; }); });
  /* ── the click highlight (Sam, 2026-09-05, with Obsidian's graph open: "when
   * you click on an entity, it shows the connections in contrast to unclicked").
   * Our edges are the orbit ties: a selected identity lights the stand-alones
   * tied to it, a selected stand-alone lights its identity. The lit ties draw
   * solid in the selection color and every other point fades, so the
   * neighborhood reads at a glance; the college courses under the identity
   * open as they did. */
  var focus=null;
  if(selNode){
    focus={}; focus[selNode.i]=1;
    if(selNode.a){ if(selNode.o) focus[selNode.o]=1; }
    else orbitsOf(selNode.i).forEach(function(o){ focus[o.i]=1; });
  }
  lastFocus=focus;
  var labelQueue=[], nodeQueue=[], openList=[];
  memberPts=[]; discBoxes=[];

  U.islands.forEach(function(isl){
    var c=w2s(isl.x+(isl.dx||0), isl.y+(isl.dy||0));
    var r=isl.r*k;
    if(c[0]+r<-60||c[0]-r>W+60||c[1]+r<-60||c[1]-r>H+60) return;   // cull
    // Every course in this discipline is switched off — so is the discipline.
    // This is the line that makes Show answer below NODE_ZOOM (see islandPass).
    if(!islandPass(isl)) return;

    ctx.beginPath(); ctx.arc(c[0],c[1],r,0,6.2832);
    ctx.fillStyle = isl===selIsl ? pal.islandSel : isl===hoverIsl ? pal.islandHover : pal.island;
    ctx.fill();
    ctx.lineWidth = isl===selIsl?2:1;
    ctx.strokeStyle = isl===selIsl ? pal.sys0Stroke : pal.islandStroke;
    ctx.stroke();
    if(tokenIsl[isl.d]){                                   // a discipline in the selection
      ctx.beginPath(); ctx.arc(c[0],c[1],r+4,0,6.2832);
      ctx.lineWidth=2.4; ctx.strokeStyle=pal.ringToken; ctx.stroke();
    }

    if(showNodes){
      // Tethers first, under the points: a faint line from each orbiting course
      // to the identity it orbits, so the suggestion reads as a relationship and
      // never as membership.
      if(showTethers){
        ctx.save(); ctx.setLineDash([2,3]); ctx.lineWidth=1; ctx.strokeStyle=pal.tether;
        if(focus) ctx.globalAlpha=ctx.globalAlpha*DIM_ALPHA;
        ctx.beginPath();
        isl.p.forEach(function(nd){
          if(!nd.a||!nd.o) return;
          if(focus && focus[nd.i] && focus[nd.o]) return;   // a lit tie, drawn below
          var par=nodeById(nd.o); if(!par) return;
          var p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0));
          var q=w2s(par.nd.x+(par.isl.dx||0), par.nd.y+(par.isl.dy||0));
          ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]);
        });
        ctx.stroke(); ctx.restore();
        if(focus){
          ctx.save(); ctx.setLineDash([]); ctx.lineWidth=1.4; ctx.strokeStyle=pal.ringSel;
          ctx.beginPath();
          isl.p.forEach(function(nd){
            if(!nd.a||!nd.o||!(focus[nd.i]&&focus[nd.o])) return;
            var par=nodeById(nd.o); if(!par) return;
            var p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0));
            var q=w2s(par.nd.x+(par.isl.dx||0), par.nd.y+(par.isl.dy||0));
            ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]);
          });
          ctx.stroke(); ctx.restore();
        }
      }
      isl.p.forEach(function(nd){
        if(!creditShown(nd)) return;              // the CR / NC filter (item 9)
        var p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0));
        var rad=nodeRad(nd), dr=dotRad(nd, rad);
        var dimmed = !!(focus && !focus[nd.i]);   // outside the clicked neighborhood
        if(dimmed){ ctx.save(); ctx.globalAlpha=ctx.globalAlpha*DIM_ALPHA; }
        var s=sysPal(nd);
        // Membership emits light; a loner reflects it (see emitsLight).
        if(emitsLight(nd) && !dimmed) haloAround(p[0], p[1], dr, s[1]);
        ctx.beginPath(); ctx.arc(p[0],p[1],dr,0,6.2832);
        if(nd.a){
          // Stand-alone: one college, no equivalence asserted yet — a smaller,
          // lighter dot, so it never reads as a weaker version of a claim. Once
          // its course has been moved it is an emptied shell: dotted and grey.
          var gone=emptied(nd);
          if(gone){
            ctx.fillStyle=pal.hollow; ctx.fill();
            ctx.save(); ctx.setLineDash([2,2]); ctx.lineWidth=ringWidth(dr); ctx.strokeStyle=pal.gone; ctx.stroke(); ctx.restore();
          } else {
            ctx.save(); ctx.globalAlpha=ctx.globalAlpha*ORPHAN_ALPHA; ctx.fillStyle=s[1]; ctx.fill(); ctx.restore();
          }
        } else {
          ctx.fillStyle=s[1]; ctx.fill();
        }
        // ── item 3 (2026-09-04): noncredit reads as a BROKEN ring (Sam: "rather
        // than another color, perhaps a broken line or dotted circle"), drawn
        // just outside the dot. Stroke pattern is a free channel: colour already
        // spends itself on the identity SYSTEM, and a pattern satisfies "colour
        // is never the only signal" for free. Dashes, not dots: at low zoom a
        // dotted 1px ring aliases into a solid one. Below ~2px it is skipped —
        // it would only smudge the dot.
        if(isNC(nd) && dr>1.8 && !(nd.a&&emptied(nd))){
          ctx.beginPath(); ctx.arc(p[0],p[1],dr+2.2,0,6.2832);
          ctx.save(); ctx.setLineDash(ncDash(dr+2.2)); ctx.lineWidth=1; ctx.strokeStyle=s[1]; ctx.stroke(); ctx.restore();
        }
        if(hitSet[nd.i]){                                  // search match ring
          ctx.beginPath(); ctx.arc(p[0],p[1],dr+4.5,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle=pal.ringSearch; ctx.stroke();
        }
        if(nd===selNode){
          ctx.beginPath(); ctx.arc(p[0],p[1],dr+7,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle=pal.ringSel; ctx.stroke();
        }
        if(dimmed) ctx.restore();
        // Labels are QUEUED, not drawn here: a dense island stacks dozens of them
        // into an unreadable pile, which is the exact failure of a global graph
        // view. Stand-alones earn a label one band later than identities — they
        // are the small points, and their number alone reads as noise.
        var lab=labelLines(nd, k);
        /* Is this identity about to OPEN — drawn with its college courses ringing
         * it behind a pale disc? The same condition openList uses below. An open
         * identity has a large empty middle, which is where its own name belongs
         * (Sam, 2026-09-05: "Is there a reason the parent course isn't in the
         * middle of the big circle?"). */
        var willOpen = !nd.a && (k>MEMBER_ZOOM_ALL || (k>MEMBER_ZOOM && nd===hoverNode) ||
                                 (nd===selNode && k>TITLE_ZOOM));
        if(lab && (nd.a ? k>TITLE_ZOOM : rad>3))
          nodeQueue.push({nd:nd, px:p[0], py:p[1], rad:rad, lines:lab.lines, band:lab.band,
                          open:willOpen && show.members,
                          force:(nd===selNode||!!hitSet[nd.i])});
        // An identity OPENS past MEMBER_ZOOM (the selected one a band earlier):
        // the college courses it carries ring it, each a square on a spoke.
        if(!nd.a && (k>MEMBER_ZOOM_ALL || (k>MEMBER_ZOOM && nd===hoverNode) || (nd===selNode && k>TITLE_ZOOM)))
          openList.push({nd:nd, isl:isl, p:p, rad:rad});
      });
    }
    // Labels are COLLECTED here and placed after every island is drawn, so a
    // big island's name is never buried under a small neighbor's — and so
    // overlapping labels can be rejected rather than stacked.
    labelQueue.push({isl:isl, cx:c[0], cy:c[1]-r-6, r:r,
                     force:(isl===hoverIsl||isl===selIsl)});
  });

  // The open identities are drawn LAST, over their neighbors, with a halo that
  // lifts the ring out of a dense island: the faculty view has to be readable
  // exactly where the map is busiest. Their squares' labels are queued forced,
  // so they are placed before any neighbor's name can take the space.
  if(show.members) openList.forEach(function(o){ drawMembers(o.nd, o.isl, o.p, o.rad, k, nodeQueue, k<=MEMBER_ZOOM_ALL); });

  // Islands first: they are the navigational anchors, and a course name buried
  // under its own subject's name helps nobody. Course labels then fill the gaps
  // left over, and a label that cannot find one is dropped rather than stacked.
  titlesQueued=nodeQueue.length;
  /* ⚠️ The discs go in BEFORE the island names, so nothing lands on one. An open
   * identity's own label is exempt — it is placed at the disc's centre by the
   * `inside` branch, which runs before any box is consulted. */
  placedBoxes=placeNodeLabels(nodeQueue, placeLabels(labelQueue, showLabels).concat(discBoxes));

  if(drag && drag.kind==="course" && drag.px!=null){
    ctx.beginPath(); ctx.arc(drag.px,drag.py,7,0,6.2832);
    ctx.fillStyle=pal.drag; ctx.fill();
    ctx.font="600 "+txPx(12)+"px 'Source Sans 3',system-ui,sans-serif";
    ctx.textAlign="left"; ctx.lineWidth=3.5; ctx.strokeStyle=pal.halo;
    ctx.strokeText(drag.code,drag.px+12,drag.py+4);
    ctx.fillStyle=pal.drag; ctx.fillText(drag.code,drag.px+12,drag.py+4);
  }
  var z=document.getElementById("u-zoom");
  if(z) z.textContent = Math.round(view.k*100)+"%";
}
/* The college courses under an identity, drawn around it when it is open. Each
 * is a small SQUARE on a spoke — a college course, not an identity (a filled
 * circle) and not a stand-alone (a hollow one) — so a faculty member zooming in
 * on one CCR course sees their own course sitting under it, named by its code
 * and college; the title, units and description are one hover or click away.
 * Rings of up to perRing squares, outward as the count grows. */
var MEMBER_CAP=48;           // squares drawn for one identity; the rest are a count and the panel's list
/* ── the sky metaphor, made literal (Sam, 2026-09-05) ─────────────────────
 * *"instead of a square we make each local member course a muted star--feel
 * good visual. Could add a gentle glow to all circles as if they were light
 * emitting stars"* and then the rule that gives it meaning: *"leave all the
 * loners and nonmembers without the halo effect--haven't earned their wings
 * yet and are still moons."*
 *
 * ⭐ THE GLOW IS NOT DECORATION, IT IS THE MEMBERSHIP SIGNAL. An identity that
 * colleges have joined emits light; a stand-alone that no college has joined to
 * reflects it. So the halo answers the map's central question — has anyone
 * agreed this is the same course? — without a word, and it agrees with the
 * legend rather than competing with it. A reader who never learns the rule
 * still sees the lit points as the settled ones.
 *
 * Kept quiet on purpose: one soft pass at low alpha, radius-proportional, and
 * skipped entirely below the zoom where a halo would smear neighbors together. */
function starPath(cx, cy, r, points){
  points = points || 5;
  var inner = r * 0.42, step = Math.PI / points;
  ctx.beginPath();
  for(var i=0;i<points*2;i++){
    var rad = (i % 2 === 0) ? r : inner, a = -Math.PI/2 + i*step;
    var x = cx + rad*Math.cos(a), y = cy + rad*Math.sin(a);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
}
/* A halo belongs to a point that COLLEGES HAVE JOINED. A stand-alone has one
 * college and no agreement, so it stays a moon however big it is drawn. */
function emitsLight(nd){ return !!nd && !nd.a && (nd.n||0) > 1; }
function haloAround(cx, cy, r, color){
  if(r < 2.2) return;                        // below this it is a smudge, not a glow
  /* ⚠️ A GLOW IS A GLOW UNTIL IT IS THE BACKGROUND. It reaches r*2.6, and r is
   * the drawn radius, which grows with the zoom — so opening a well-adopted
   * identity painted its system color across the entire viewport at 30% alpha
   * and the charcoal canvas simply turned violet. Sam, 2026-09-06: "the
   * background of SkyView changes to purple (which we recently made darker)
   * instead of staying the same charcoal as the opening view… changes when a
   * search item is selected."
   *
   * The signal is "colleges have joined this one" (his own rule — a loner has
   * not earned its wings), and that reads perfectly well from a glow around the
   * disc. It does not need the whole screen, and past a certain size the reader
   * stops seeing a glow at all and just sees a tinted page. Capped so the light
   * always falls off inside the canvas. */
  var reach=Math.max(24, Math.min(cw(), ch())*0.22);
  if(r*2.6 > reach) r = reach/2.6;
  var g;
  try{ g = ctx.createRadialGradient(cx, cy, r*0.6, cx, cy, r*2.6); }catch(e){ return; }
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = ctx.globalAlpha * 0.30;
  ctx.beginPath(); ctx.arc(cx, cy, r*2.6, 0, 6.2832);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
}

function drawMembers(nd, isl, p, rad, k, queue, focus){
  var all=membersOf(nd.i); if(!all.length) return;
  // A filtered or carried course is always among the drawn ones.
  var ms=all.slice(0, MEMBER_CAP), rest=all.length-ms.length;
  if(rest>0) all.slice(MEMBER_CAP).forEach(function(m){
    if((memFilter && m.n===memFilter) || (drag && drag.kind==="course" && drag.cn===m.cn)){ ms[ms.length-1]=m; }
  });
  var n=ms.length;
  // Open for reading (selected or hovered), the ring spreads so the names can
  // radiate from it; at the open-all zoom the identities are far apart already.
  var spread=focus?Math.min(70, n*1.7):0;
  var R0=rad+16+spread, perRing=Math.max(8, Math.round(2*Math.PI*R0/(focus?15:13)));
  var sys=sysPal(nd);
  var rings=Math.ceil(n/perRing);
  if(focus){
    /* Sam, 2026-09-05: "probably no labels should transect the CCR circle."
     * The disc is the one thing on screen the reader is studying, and a
     * neighbor's name laid across it is read as belonging to it. Recording the
     * disc as an OCCUPIED BOX before any label is placed makes the placer treat
     * it like another label — it will try its other corners, and drop rather
     * than stack, which is the behavior it already has for every real clash. */
    discBoxes.push([p[0]-(R0+(rings-1)*15+10), p[1]-(R0+(rings-1)*15+10),
                    p[0]+(R0+(rings-1)*15+10), p[1]+(R0+(rings-1)*15+10)]);
    /* Sam, 2026-09-05: "perhaps the circle should show the color of the CCR
     * (MID, CID, or CCN)". The disc behind the ring is the biggest thing on the
     * screen when an identity opens, and it was neutral — so the one moment the
     * reader is looking hardest at a single course said nothing about which
     * system names it. Tinted at low alpha: enough to read as M-ID violet,
     * C-ID blue or CCN mustard, never enough to fight the stars on top of it. */
    /* ⚠️ THE DISC IS A DISC, NOT A BACKGROUND. Its radius grows with the member
     * count (R0 carries `spread`, and every ring adds 15), so on a well-adopted
     * course at reading zoom it simply exceeded the viewport and the tint
     * stopped reading as "this identity is an M-ID" and started reading as "the
     * canvas is purple now" — Sam, 2026-09-06: "the background of SkyView
     * changes to purple instead of staying the same charcoal as the opening
     * view… changes when a search item is selected." Clamped so the canvas
     * always shows around it: a disc you can see the edge of is a disc, and the
     * charcoal stays the charcoal. The ring itself is unclamped — a member star
     * may sit outside the disc, which is honest about there being more of them
     * than the ground can hold. */
    var haloR=Math.min(R0+(rings-1)*15+10, Math.max(40, Math.min(cw(), ch())*0.42));
    ctx.beginPath(); ctx.arc(p[0],p[1],haloR,0,6.2832);
    ctx.fillStyle=pal.haloFill; ctx.fill();
    ctx.save(); ctx.globalAlpha=ctx.globalAlpha*0.13;
    ctx.fillStyle=sys[1]; ctx.fill(); ctx.restore();
    ctx.lineWidth=1; ctx.strokeStyle=sys[1]; ctx.globalAlpha=ctx.globalAlpha*0.5;
    ctx.stroke(); ctx.globalAlpha=ctx.globalAlpha/0.5;
    ctx.beginPath(); ctx.arc(p[0],p[1],rad,0,6.2832);
    ctx.fillStyle=sys[0]; ctx.fill(); ctx.lineWidth=2; ctx.strokeStyle=sys[1]; ctx.stroke();
  }
  for(var i=0;i<n;i++){
    var m=ms[i];
    var ring=Math.floor(i/perRing), inRing=Math.min(perRing, n-ring*perRing), j=i-ring*perRing;
    var R=R0+ring*15;
    var a=-Math.PI/2 + j*2*Math.PI/inRing + ring*0.35;
    var x=p[0]+R*Math.cos(a), y=p[1]+R*Math.sin(a);
    var movedHere=(m.cn in movedTo) && movedTo[m.cn]===nd.i;
    var carried=drag && drag.kind==="course" && drag.cn===m.cn;
    ctx.beginPath(); ctx.moveTo(p[0]+rad*Math.cos(a), p[1]+rad*Math.sin(a)); ctx.lineTo(x,y);
    ctx.lineWidth=1; ctx.strokeStyle=pal.ringFaint; ctx.stroke();
    /* A college's own course is a small star on its spoke. Muted: it is evidence
     * for the identity at the centre, never a competitor for attention. */
    starPath(x, y, 5.2);
    ctx.fillStyle=movedHere?pal.sqMoved:carried?pal.sqCarried:pal.hollow; ctx.fill();
    ctx.lineWidth=1.2; ctx.strokeStyle=movedHere?pal.sqMovedStroke:sys[1]; ctx.stroke();
    memberPts.push({x:x, y:y, m:m, nd:nd, isl:isl});
    if(k>MEMBER_ZOOM || focus)
      // Short college names on the map (Sam, 2026-09-05: "Could use the short
      // names on the colleges throughout") — a ring of 24 spokes is where the
      // repeated word "College" costs the most and says the least.
      queue.push({mem:m, nd:nd, px:x, py:y, rad:4, lines:[m.n+" · "+trunc(shortCollege(m.c),26)], band:"member",
                  out:[Math.cos(a), Math.sin(a)],
                  force:!!focus || !!(memFilter && m.n===memFilter) || carried});
  }
  if(rest>0){
    var ry=p[1]+R0+(rings-1)*15+14;
    ctx.font="600 "+txPx(10)+"px 'Source Sans 3',system-ui,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    var more="and "+num(rest)+" more college course"+(rest===1?"":"s")+" — see the details panel";
    ctx.lineWidth=3; ctx.strokeStyle=pal.halo; ctx.strokeText(more,p[0],ry);
    ctx.fillStyle=pal.inkMuted; ctx.fillText(more,p[0],ry);
  }
}

/* What a course label says at this zoom. Null below the first band.
 * The TITLE leads, with the units in Sam's short form, and the number waits for
 * the full band and the hover (Sam, 2026-09-03: "more important to see the
 * title than the course number on the initial course label, which would save
 * valuable real estate. Hover over to see the details, including the course
 * number" — "Course title and units (3u)"). Three bands: brief (a short title),
 * titled (the longer title), full (a second line with the number and system). */
/* ── the college on a loner (Sam, 2026-09-05) ─────────────────────────────
 * *"it would be helpful to have the short college on the loners."* A
 * stand-alone course IS one college's course — that is the whole definition —
 * so naming the college is what identifies it on a map where three neighbors
 * can read `Introduction to Welding & Safety`. A clustered identity has many
 * colleges and no single one to name, so this is a stand-alone affordance only.
 *
 * Short form, not canonical: `American River` rather than `American River
 * College`, because these are map labels competing for space with their
 * neighbors. The map falls back to trimming the suffix when the seed has no
 * entry, so a college missing from the lookup still reads short. */
function shortCollege(name){
  if(!name) return "";
  /* COBI's own resolver when the map is framed inside it (college_short_names.js
   * is generated from the curator-provided seed, MAP@rccd.edu). SkyView served
   * stand-alone does not load it, so the fallback has to be good on its own —
   * trimming the suffix gives `American River`, `Mt. San Antonio`, `Long Beach
   * City`, which is what the seed says anyway for all but a handful. */
  var f = window.cplCollegeShort;
  if(typeof f === "function"){ var r = f(name); if(r) return r; }
  return name.replace(/\s+(Community\s+)?College$/i,"")
             .replace(/\s+Center$/i,"").trim() || name;
}
/* The one college a stand-alone belongs to, or "" for anything else. */
function loneCollege(nd){
  if(!nd || !nd.a) return "";
  var m=(roster && roster[nd.i] || [])[0];
  return m ? shortCollege(m.c) : "";
}
window.__ccrLoneCollege = loneCollege;

function labelLines(nd, k){
  if(k<=ID_ZOOM) return null;
  var u=unitsShort(nd.u);
  var head=trunc(nd.t||nd.i, k>TITLE_ZOOM?44:28)+(u?" · "+u:"");
  if(k>FULL_ZOOM){
    var col=loneCollege(nd);
    return {band:"full", lines:[head,
      nd.i+" · "+sysWord(nd)+(nd.a?" · stand-alone":"")+(col?" · "+col:"")]};
  }
  if(k>TITLE_ZOOM) return {band:"titled", lines:[head]};
  return {band:"brief", lines:[head]};
}

/* Biggest first, reject anything that would overlap an already-placed label.
   Hover/selection always wins a slot — it is the one the reader asked for. */
function placeLabels(queue, showAll){
  var boxes=[];
  queue.sort(function(a,b){
    if(a.force!==b.force) return a.force?-1:1;
    return b.isl.n-a.isl.n;
  });
  ctx.textAlign="center"; ctx.textBaseline="alphabetic";
  queue.forEach(function(q){
    if(!q.force && !showAll && q.r<26) return;          // too small to earn a name
    var size=Math.max(11,Math.min(19,q.r*0.17))*tx();
    ctx.font=(q.force?"700 ":"600 ")+size+"px 'Source Sans 3',system-ui,sans-serif";
    var lab=q.isl.d+" ("+num(q.isl.n)+")";
    var w=ctx.measureText(lab).width, h=size*1.25;
    var box=[q.cx-w/2-3, q.cy-h, q.cx+w/2+3, q.cy+4];
    if(box[2]<0||box[0]>cw()||box[3]<0||box[1]>ch()) return;
    var clash=false;
    for(var i=0;i<boxes.length;i++){
      var b=boxes[i];
      if(box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]){ clash=true; break; }
    }
    if(clash && !q.force) return;
    boxes.push(box);
    ctx.lineWidth=3.5; ctx.strokeStyle=pal.halo;
    ctx.strokeText(lab,q.cx,q.cy);
    ctx.fillStyle=q.force?pal.inkForce:pal.ink;
    ctx.fillText(lab,q.cx,q.cy);
  });
  return boxes;   // course labels are placed into the gaps these leave
}

/* Course labels, same rule one grain down: biggest first, search hits and the
   selection ahead of everything, and anything that will not fit is DROPPED.
   Strictly dropped, including a hit — two names on top of each other are worth
   less than one name and a bare ring, and the ring is still there to be
   followed. A two-line label (the full band) is one box, so it is placed or
   dropped whole. */
function placeNodeLabels(queue, boxes){
  var placed=[]; labelStats={brief:0,titled:0,full:0,members:0,leaders:0};
  if(!queue.length) return placed;
  // The names around an OPEN identity come first — that ring is what the
  // reader is looking at — then everything else the reader asked for (a hit,
  // the selection), then the rest, biggest first.
  var rank=function(q){ return (q.nd===selNode&&!q.mem) ? 0 : (q.band==="member"&&q.force) ? 0 : q.force ? 1 : 2; };
  queue.sort(function(a,b){
    var ra=rank(a), rb=rank(b);
    if(ra!==rb) return ra-rb;
    return b.rad-a.rad;
  });
  ctx.textBaseline="alphabetic"; ctx.textAlign="left";
  var W=cw(), H=ch(), LEAD=12;
  queue.forEach(function(q){
    var mem=q.band==="member", lh=Math.round((mem?11:12)*tx());
    ctx.font=(q.force?"600 ":"")+txPx(mem?10:11)+"px 'Source Sans 3',system-ui,sans-serif";
    var w=0; q.lines.forEach(function(t){ w=Math.max(w, ctx.measureText(t).width); });
    var h=q.lines.length*lh+2;
    /* The label sits AWAY from the circle and a thin line joins the two (Sam,
       2026-09-03: "have the course labels away from the course circle and have
       a thin line to connect to the circle so users can be clear on what they
       might drag and drop"). Four corners are tried, up-right first; the first
       that fits wins, and a label that fits nowhere is dropped, never stacked. */
    /* ⭐ A CIRCLE BIG ENOUGH TO HOLD ITS OWN NAME KEEPS IT (Sam, 2026-09-05:
     * "Is there a reason the parent course isn't in the middle of the big
     * circle? Seems it should be").
     *
     * ⚠️ There WAS a reason, and it was Sam's own (2026-09-03): "have the course
     * labels away from the course circle and have a thin line to connect to the
     * circle so users can be clear on what they might drag and drop." That rule
     * is right for the small circles it was written about — a name inside a
     * 12px dot is unreadable and says nothing about which dot it belongs to.
     * It over-applies to an OPEN identity, which is drawn large, ringed by its
     * college courses, and is the one thing on screen the reader is looking at:
     * there the leader line points from the middle of the view to a corner,
     * and the circle it names sits empty.
     *
     * So the leader stays the default and the inside is the exception, taken
     * only when the text genuinely fits with room to breathe. No leader is
     * drawn in that case — the label IS the circle's label by position. */
    /* The room is either the circle itself (a big one) or the pale disc an OPEN
     * identity is drawn on — the ring of college stars is pushed out to its
     * edge, so the middle is the emptiest space on the screen. */
    var inside = !mem && (q.open || (q.rad >= 34 && h + 8 <= q.rad * 1.15))
                 && w + 10 <= (q.open ? 270 : q.rad * 1.55);
    if(inside){
      var ix=q.px-w/2, iy=q.py-h/2-2;
      var ibox=[ix-2, iy, ix+w+2, iy+h];
      boxes.push(ibox); placed.push(ibox);
      labelStats[q.band]++;
      // No leader: the label IS this circle's, by sitting in it.
      q.lines.forEach(function(t,li){
        var y=iy+lh*(li+1)-2;
        ctx.lineWidth=3; ctx.strokeStyle=pal.halo;
        ctx.strokeText(t,ix,y);
        ctx.fillStyle=q.force?pal.inkAlert:(li?pal.inkMuted:labelInk(q.nd));
        ctx.fillText(t,ix,y);
      });
      return;
    }
    var cands=[[1,-1],[-1,-1],[1,1],[-1,1]], box=null, at=null;
    if(q.out){   // a square's name radiates OUTWARD from its identity, so a ring reads as spokes
      var ox=q.out[0]>=0?1:-1, oy=q.out[1]>=0?1:-1;
      cands=[[ox,oy],[ox,-oy],[-ox,oy],[-ox,-oy]];
    }
    for(var ci=0; ci<cands.length && !box; ci++){
      var sx=cands[ci][0], sy=cands[ci][1];
      var ax=q.px+sx*(q.rad+LEAD), ay=q.py+sy*(q.rad+LEAD);
      var x0=sx>0?ax:ax-w, y0=sy>0?ay:ay-h;
      var cand=[x0-2, y0, x0+w+2, y0+h];
      if(cand[2]<0||cand[0]>W||cand[3]<0||cand[1]>H) continue;
      var clash=false;
      for(var i=0;i<boxes.length;i++){
        var b=boxes[i];
        if(cand[0]<b[2]&&cand[2]>b[0]&&cand[1]<b[3]&&cand[3]>b[1]){ clash=true; break; }
      }
      if(!clash){ box=cand; at={sx:sx, sy:sy, ax:ax, ay:ay, x0:x0, y0:y0}; }
    }
    if(!box) return;
    boxes.push(box); placed.push(box);
    labelStats[mem?"members":q.band]++;
    /* ── item 5 (Sam, 2026-09-04): "Try and make the labels show the circle they
     * connect to clearer. Now I need to click on the course circle to see which
     * is which."
     *
     * The leader line already existed (his 2026-09-03 ask) and was not doing the
     * job, for two reasons the drawing makes obvious once you look at a crowded
     * island: it was a faint 1px hairline at 35% that vanishes among its
     * neighbors, and it STOPPED IN SPACE at the label's corner, so the eye had
     * to guess which of several nearby lines belonged to which text.
     *
     * Three cheap changes, no new colour: a DOT where the leader meets its
     * circle, so ownership is stated at the circle end rather than inferred; an
     * ELBOW that carries the line horizontally INTO the first line of the label,
     * so it terminates on the text it names; and a little more weight. Still the
     * quietest mark in the frame — this is a tie, not a decoration. */
    /* Sam, 2026-09-05: "If the label doesn't fit, at least the pointer should go
     * to the circle." The leader ended at 0.71 of the radius — inside the fill,
     * which on a big circle reads as pointing at nothing in particular. It now
     * lands ON the edge, where the eye can see it meet something. */
    var ex=q.px+at.sx*q.rad*0.98, ey=q.py+at.sy*q.rad*0.98;
    var midY=at.y0+lh-2-lh*0.28;                 // the first line's optical middle
    var stubX=at.sx>0 ? at.x0 : at.x0+w;         // the label edge nearest the circle
    ctx.strokeStyle=q.force?pal.leaderForce:pal.leader;
    ctx.beginPath();
    ctx.moveTo(ex, ey); ctx.lineTo(at.ax, at.ay); ctx.lineTo(stubX, midY);
    ctx.lineWidth=1.1; ctx.stroke();
    // The dot says WHICH circle, at the end where the ambiguity is.
    ctx.beginPath(); ctx.arc(ex, ey, Math.min(2.2, Math.max(1.2, q.rad*0.16)), 0, 6.2832);
    ctx.fillStyle=q.force?pal.leaderDotForce:pal.leaderDot; ctx.fill();
    labelStats.leaders++;
    q.lines.forEach(function(t,li){
      var y=at.y0+lh*(li+1)-2;
      ctx.lineWidth=3; ctx.strokeStyle=pal.halo;
      ctx.strokeText(t,at.x0,y);
      ctx.fillStyle=q.force?pal.inkAlert:(mem?pal.inkBody:(li?pal.inkMuted:labelInk(q.nd)));
      ctx.fillText(t,at.x0,y);
    });
  });
  return placed;
}

/* ── hit testing ─────────────────────────────────────────────────────────── */
function pick(px,py){
  var best=null;
  for(var i=U.islands.length-1;i>=0;i--){
    var isl=U.islands[i];
    var c=w2s(isl.x+(isl.dx||0), isl.y+(isl.dy||0));
    var r=isl.r*view.k;
    if(Math.hypot(px-c[0],py-c[1])>r+12) continue;
    // What is not drawn cannot be picked. Without this, filtering to noncredit
    // and clicking where a credit course used to sit opened the inspector on an
    // invisible point — the filter would have been honored by the eye and not by
    // the hand, which is worse than no filter at all.
    if(!islandPass(isl)) continue;
    if(view.k>NODE_ZOOM){
      var found=null, fd=1e9, inside=false;
      for(var j=0;j<isl.p.length;j++){
        var nd=isl.p[j], p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0));
        if(!creditShown(nd)) continue;
        var rad=Math.max(3.2,nodeRad(nd));
        var d=Math.hypot(px-p[0],py-p[1]);
        if(d<=rad+3 && d<fd){ found=nd; fd=d; inside=d<=rad; }
      }
      /* ⚠️ THE OPEN IDENTITY'S MEMBERS WIN OVER A NEIGHBOR'S CIRCLE. The rule
       * below is right on the open map and wrong the moment an identity is
       * opened for reading: its ring SPREADS (drawMembers, `spread`) out over
       * its neighbors, so a member star routinely sits inside some other
       * identity's circle and resolved to that identity instead. Measured
       * 2026-09-06 with the pointer exactly on each drawn star: **110 of 120
       * returned an identity card, 10 the member card** — so a reader opening a
       * course to read its college courses got the same card on nearly every
       * one of them, which is what Sam reported ("all showed the same
       * descriptor for the welding discipline instead of course details").
       * Reading those courses is the entire purpose of the ring, so a focused
       * identity's own members outrank the circle they happen to overlap.
       * `lastFocus` is the set draw() just used, so hit-testing and painting
       * cannot disagree about what is open. */
      if(lastFocus){
        var fmem=pickMember(px,py,function(mp){ return !!lastFocus[mp.nd.i]; });
        if(fmem) return fmem;
      }
      // A pointer INSIDE the nearest identity's circle means that identity, even
      // where a neighbor's ring of squares crosses it; a square wins in the open.
      if(found && inside) return {isl:isl,nd:found};
      var mem=pickMember(px,py);
      if(mem) return mem;
      if(found) return {isl:isl,nd:found};
    }
    best=best||{isl:isl,nd:null};
  }
  return pickMember(px,py)||best;
}
/* NEAREST wins, not first-scanned. Rings overlap where a spread ring crosses a
 * neighbor's, and returning whichever star happened to be drawn last handed
 * the reader a course from the identity they were not pointing at. `only`
 * narrows the search — the open identity's own ring asks for itself, so a
 * neighbor's star cannot shadow the course the reader is reading. */
function pickMember(px,py,only){
  var best=null, bestD=1e9;
  for(var mi=memberPts.length-1; mi>=0; mi--){
    var mp=memberPts[mi];
    if(only && !only(mp)) continue;
    var dx=Math.abs(px-mp.x), dy=Math.abs(py-mp.y);
    if(dx<=6 && dy<=6 && dx+dy<bestD){ bestD=dx+dy; best=mp; }
  }
  return best?{isl:best.isl, nd:best.nd, mem:best.m}:null;
}

/* ── the view ─────────────────────────────────────────────────────────────── */
window.__ccrUniverse = function(opts){
  opts=opts||{};
  var wantSolo = opts.solo==null ? solo : !!opts.solo;
  /* Already on the map: switch the frame and keep the render. SkyView alone and
   * the comprehensive view are ONE canvas — the second merely shows the panes
   * below it — so switching between them keeps the zoom, the selection and the
   * moves. Re-rendering would have thrown all three away. */
  if(cvs && document.getElementById("u-cvs")===cvs && U && U===window.CPL_CCR_UNIVERSE){ setSolo(wantSolo); return; }
  var view_el=document.getElementById("view");
  U=window.CPL_CCR_UNIVERSE; A=window.CPL_ATLAS_DATA||null;
  spreadUniverse(U);
  nodeIdx=null; orbitIdx=null; subjIdx=null; wsPaint=null;
  if(!authority) loadAuthority();
  solo=wantSolo;
  window.__crumbs([{label:"Disciplines and subjects", go:window.__ccrForest},{label:"SkyView"}],
                  {menu:false, view: solo?"skyview":"comprehensive"});
  // Full bleed: the map takes the whole width; the panes below keep the measure.
  var main=document.getElementById("main"); if(main) main.classList.add("u-fullbleed");
  var C=U.counts||{};

  view_el.innerHTML =
    '<section class="u-full" id="u-full" aria-label="SkyView — the Common Course Reference as a map">'+
      /* ⭐ THE MAP IS THE FIRST STOP FOR ANYONE WHO WANTS IT (Sam, item 7,
       * 2026-09-06). The canvas already carries tabindex="0" and sits 39 tab
       * stops in — reachable, but a long way past the controls for the main
       * thing on the page. It lives INSIDE #u-full because browser full screen
       * paints that element and nothing else, so a link in the masthead would
       * not exist here at all. */
      '<a class="u-skip" href="#u-cvs">Skip to the map</a>'+
      /* Controls ABOVE the canvas and the legend and hint BELOW it, all inside the
       * full-screen element, so nothing floats over the map (Sam, 2026-09-03:
       * "move the zoom and other buttons and popups outside the SkyView window so
       * users can work more freely") and the other views stay one click away in
       * full screen ("will need links on full screen to navigate to the other
       * views"). Every control is a word. */
      '<div class="u-top" id="u-top">'+
        /* ── the 2026-09-05 row, second cut, in the style of Claude's own header
         * (Sam: "further simplify and complete SkyView header components by
         * incorporating features like your own header"): small ghosted icon
         * actions, a title field, ONE More menu for the secondary items, and
         * expand + close at the right. Left to right:
         *   menu (framed) · More · SkyView · search · Pan|Move · − % + ↺ ·
         *   Show · step down · step up · close
         * The icons here are his explicit asks (the OS window controls, the
         * menu, and now the header's own vocabulary), each named by words for a
         * screen reader and a tooltip; the text controls stay words in boxes.
         * The More panel holds Go to (every other view), Show or hide (the
         * sidebar, the legend, the dark canvas) and the doors out. */
        (framed()
          ? '<button class="u-ico u-menu" type="button" id="u-menu" aria-expanded="false" '+
              'aria-label="Open the COBI menu" title="Open the COBI menu">\u2630</button>'
          : '')+
        /* ⚠️ Not id="u-more": that is the forest's host under the map, and a
         * second element with the id put the whole forest INSIDE this menu. */
        '<details class="u-more" id="u-more-menu">'+
          '<summary class="u-ico" id="u-more-sum" aria-label="More" title="More: other views, show or hide, doors out">\u22EE</summary>'+
          '<div class="u-more-panel" id="u-more-panel" role="group" aria-label="More">'+
            '<div class="u-more-h">Go to</div>'+
            '<span class="u-views-slot" id="u-views-slot" data-flat="1"></span>'+
            '<div class="u-more-h">Show or hide</div>'+
            '<button class="u-more-t" type="button" id="u-insp-toggle" aria-pressed="false" aria-controls="u-detail">Sidebar<span class="u-state">off</span></button>'+
            '<button class="u-more-t" type="button" id="u-legend-menu" aria-pressed="true" aria-controls="u-foot">Legend<span class="u-state">on</span></button>'+
            '<button class="u-more-t" type="button" id="u-dark" aria-pressed="false" title="Dark canvas">Dark canvas<span class="u-state">off</span></button>'+
            /* Ruling 3 (2026-09-06): label text sizes independently of the map's
               zoom. A word for the control and a word for its state, like the
               switches above it — never a pair of glyphs. */
            '<button class="u-more-t" type="button" id="u-textsize">Label text<span class="u-state">normal</span></button>'+
          '</div>'+
        '</details>'+
        '<h1 class="u-title" id="u-title">SkyView</h1>'+
        '<div class="u-search-slot" id="u-search-slot"></div>'+
        '<div class="u-bar" id="u-bar" role="toolbar" aria-label="Map controls">'+
          '<span class="u-modes" role="group" aria-label="What a drag does">'+
            '<button class="btn mode" type="button" id="u-mode-pan" aria-pressed="false">Pan</button>'+
            '<button class="btn mode" type="button" id="u-mode-move" aria-pressed="true">Move</button>'+
          '</span>'+
          '<span class="u-zgroup" role="group" aria-label="Zoom">'+
            '<button class="u-ico" type="button" id="u-out" aria-label="Zoom out" title="Zoom out">\u2212</button>'+
            '<b class="u-zread" id="u-zoom" title="The current magnification">12%</b>'+
            '<button class="u-ico" type="button" id="u-in" aria-label="Zoom in" title="Zoom in">+</button>'+
            '<button class="u-ico" type="button" id="u-reset" aria-label="Reset the view" title="Reset the view">\u21BA</button>'+
          '</span>'+
          showMenuHtml()+
        '</div>'+
        '<span class="u-wins" role="group" aria-label="Window">'+
          '<button class="u-ico u-win" type="button" id="u-win-down" aria-label="Show the page around the map" '+
            'title="Show the page around the map">\u2014</button>'+
          '<button class="u-ico u-win" type="button" id="u-win-up" aria-label="Full screen" title="Full screen">\u2922</button>'+
          '<button class="u-ico u-win u-close" type="button" id="u-close" aria-label="Close SkyView" '+
            'title="Close SkyView \u2014 leaves full screen, or returns to the Common Course Reference">'+
            '\u2715</button>'+
        '</span>'+
      '</div>'+
      '<div class="u-stage" id="u-stage">'+
        '<div class="u-wrap" id="u-wrap">'+
          '<canvas id="u-cvs" tabindex="0" role="img" aria-label="'+
            'A map of every course identity, grouped into one island per discipline, with '+
            'each stand-alone course in orbit around the identity it is most aligned to. '+
            'Use the search box at the top of the page to jump to a discipline, an identity or a '+
            'college course, or Tab to step through disciplines from the keyboard; the details '+
            'panel describes what you select."></canvas>'+
          '<div class="u-tip" id="u-tip" role="tooltip" hidden></div>'+
          /* Item 5 (2026-09-05): the legend folds from its own corner — the word,
           * unbold, and a fold mark — instead of a "Hide legend" chip in the row. */
          '<button class="u-legend-toggle" type="button" id="u-legend-toggle" aria-expanded="true" '+
            'aria-controls="u-foot" title="Hide the legend">Legend <span class="u-fold" aria-hidden="true">\u25BE</span></button>'+
        '</div>'+
        '<aside class="u-inspector" id="u-inspector" aria-label="Details of what you selected">'+
          /* Item 2 (2026-09-05): "Details menu is not adjustable horizontally nor
           * hidable" — a grip on the panel's edge, dragged or nudged with the
           * arrow keys, and Hide as a word in its bar (the More menu's Sidebar
           * row still brings it back). */
          '<div class="u-insp-grip" id="u-insp-grip" role="separator" aria-orientation="vertical" tabindex="0" '+
            'aria-label="Resize the details panel" title="Drag to resize; arrow keys nudge, Home resets"></div>'+
          '<div class="u-insp-bar"><span class="u-insp-t">Details</span>'+
            '<button type="button" class="linkish u-insp-hide" id="u-insp-hide" title="Hide the details panel">Hide</button></div>'+
          '<div id="u-detail" class="u-insp-body"><h3>Nothing selected</h3>'+
            '<p class="empty">Hover a point for a quick look. Click a discipline or a course and its '+
            'details land here — the college courses underneath, their catalog descriptions, '+
            'and the stand-alone courses in orbit around it.</p></div>'+
        '</aside>'+
      '</div>'+
      '<div class="u-foot" id="u-foot">'+
        '<div class="u-legend" aria-label="How to read the map">'+
          '<span><i class="u-sw s0"></i>M-ID, our working label</span>'+
          '<span><i class="u-sw s1"></i>C-ID, official</span>'+
          '<span><i class="u-sw s2"></i>CCN, official</span>'+
          '<span><i class="u-sw s3"></i>unified</span>'+
          '<span><i class="u-sw orphan"></i>stand-alone course — a smaller, lighter dot in orbit around its closest match</span>'+
          '<span><i class="u-sw nc"></i>noncredit — a broken ring around the dot, whatever the identity system</span>'+
          '<span><i class="u-sw member"></i>college course under an identity — a small star; click or hover an identity to open it</span>'+
        '</div>'+
        '<div class="u-hint" id="u-hint">Hover for a quick look; click a discipline or a course for details. '+
          '<strong>Move</strong>: drag a stand-alone course or a college course onto the identity it belongs to, '+
          'drag a discipline to pull it next to another, drag the background to pan. <strong>Pan</strong>: drag '+
          'anywhere to move the view. Scroll to zoom; the buttons zoom on what you searched for or selected. '+
          'From the keyboard: <kbd>Tab</kbd> steps through disciplines, <kbd>Enter</kbd> goes into one, '+
          '<kbd>Esc</kbd> comes back out, arrows pan.</div>'+
      '</div>'+
    '</section>'+
    '<div class="wrap u-below" id="u-below">'+
      '<h2>The whole Common Course Reference</h2>'+
      '<p>'+num(C.identities)+' course identities and '+num(C.stand_alone)+' stand-alone courses across '+
        num(C.disciplines)+' disciplines. '+num(C.orbiting)+' of the stand-alones orbit the identity '+
        'they are most aligned to'+(C.orbiting_cross?' ('+num(C.orbiting_cross)+' of them in another discipline\u2019s island, drawn where their closest match is)':'')+
        '; '+num(C.rim)+' share nothing with any identity and sit on their discipline\u2019s rim. Search to fly to a discipline, an identity or a college course. '+
        '<strong>Drag a discipline</strong> to pull it next to another, then drag a course between them — '+
        'that is how a course filed under the wrong discipline gets moved to its real parent.</p>'+
      '<div class="stage">'+
        '<div class="panel"><h3>What this would write</h3><div id="u-writes">'+
        '<p class="empty">No moves yet.</p></div>'+
        '<p style="margin:.6em 0 0;font-size:.8rem;color:var(--text-muted)">'+
        'One row per move, in <code>kb_curation</code>. Reversible: delete the row.</p></div>'+
        '<div class="panel"><h3>How the map is arranged</h3>'+
        '<p>One island per discipline, biggest at the centre. Inside an island the identities '+
        'with the most courses sit at the centre. A smaller, lighter dot is a stand-alone course — one '+
        'college, clustered with nothing yet — placed in orbit around the identity whose title '+
        'words and subject code it shares. The orbit is a suggestion, not a decision: the details '+
        'panel says what the two have in common, and nothing changes until you move the course. '+
        'A lighter dot on the outer rim shares nothing with any identity in its discipline.</p>'+
        '<p>Colors name the identity system: an M-ID is our working label, a C-ID or CCN is an '+
        'official statewide number nobody here may re-key, a unified row is a synthetic course. '+
        'Zoom in and each course shows its title and units, then its number and system; zoom in '+
        'further and an identity opens to show the college courses under it, each named by its code '+
        'and college — the view a faculty member needs to see their own course under the right CCR course.</p>'+
        '</div>'+
      '</div>'+
      '<div id="u-more"></div>'+
    '</div>';

  cvs=document.getElementById("u-cvs");
  ctx=cvs.getContext?cvs.getContext("2d"):null;
  buildMemberIndex(); indexNodes();
  viewsMenuInto(document.getElementById("u-views-slot"));
  setSolo(solo, true);          // the body class must be on before fitCanvas measures
  fitCanvas(); resetView(); wire(); draw();
  restoreTokens();              // a selection parked by a trip off the map comes back
  tellParent("ready");          // the page around the frame answers with its state
  if(typeof window.__ccrForestInto==="function")
    window.__ccrForestInto(document.getElementById("u-more"));
};

/* The map fills the first screen (Sam, 2026-09-03: "open full screen so users
 * have more work space and allow scroll down to see the other info"). Height is
 * the viewport minus what sits above the canvas, so the panes below are one
 * scroll away rather than sharing the screen. Narrow screens keep the canvas to
 * 62% and dock the details panel underneath instead of over it. */
function fitCanvas(){
  var wrap=document.getElementById("u-wrap"), full=document.getElementById("u-full");
  if(!wrap||!full) return;
  var stage=document.getElementById("u-stage")||full;
  var topEl=document.getElementById("u-top"), footEl=document.getElementById("u-foot");
  var th=topEl?topEl.offsetHeight:0, fh=footEl?footEl.offsetHeight:0, h;
  if(document.fullscreenElement && document.fullscreenElement===full) h=window.innerHeight-th-fh;
  else if(window.innerWidth<700) h=Math.round(window.innerHeight*0.62);
  /* SkyView alone: nothing is painted above or below the section, so the canvas
   * takes the viewport minus the top row and the legend strip — the same
   * arithmetic as browser full screen, which is what it looks like. */
  else if(solo && document.body.classList.contains("u-solo")) h=Math.max(320, window.innerHeight-th-fh);
  else {
    // Whatever sits above the canvas (the masthead, the crumbs, the control
    // strip) is measured, not assumed, and the legend strip below it is left
    // its room, so the whole section fits the first screen exactly.
    var rect=stage.getBoundingClientRect();
    var top=rect.top+(window.scrollY||window.pageYOffset||0);
    h=Math.max(420, window.innerHeight-top-fh);
  }
  wrap.style.height=h+"px";
  if(stage!==full && window.innerWidth>=700) stage.style.height=h+"px"; else if(stage!==full) stage.style.height="";
  sizeCanvas();
}
function sizeCanvas(){
  DPR=Math.min(2, window.devicePixelRatio||1);
  var w=cw(), h=ch();
  cvs.width=Math.round(w*DPR); cvs.height=Math.round(h*DPR);
}
function resetView(){
  anchor=null;
  var b=U.bounds, W=cw(), H=ch();
  var pad=60;
  view.k=Math.max(K_MIN, Math.min((W-pad)/(b.x1-b.x0), (H-pad)/(b.y1-b.y0)));
  view.x=-(b.x0+b.x1)/2; view.y=-(b.y0+b.y1)/2;
}
function zoomAt(px,py,factor){
  var before=s2w(px,py);
  view.k=clampK(view.k*factor);
  var after=s2w(px,py);
  view.x+=after[0]-before[0]; view.y+=after[1]-before[1];
  draw();
}
function flyTo(x,y,k){
  anchor={x:x, y:y};
  view.x=-x; view.y=-y; view.k=clampK(k); draw();
}
/* Where the zoom buttons zoom ABOUT: the selection, else the last fly — and if
 * that point has drifted off the canvas it is brought back to the centre first,
 * so zooming never loses the subject the reader searched for. */
function anchorScreen(){
  var a = selNode&&selIsl ? [selNode.x+(selIsl.dx||0), selNode.y+(selIsl.dy||0)]
        : selIsl ? [selIsl.x+(selIsl.dx||0), selIsl.y+(selIsl.dy||0)]
        : anchor ? [anchor.x, anchor.y] : null;
  if(!a) return null;
  var p=w2s(a[0],a[1]);
  if(p[0]<0||p[0]>cw()||p[1]<0||p[1]>ch()){ view.x=-a[0]; view.y=-a[1]; p=[cw()/2, ch()/2]; }
  return p;
}
function zoomStep(factor){ var p=anchorScreen()||[cw()/2,ch()/2]; zoomAt(p[0],p[1],factor); }
window.__ccrUniverseFly = flyTo;
/* The header's search box calls this when the map is on screen, so one field
 * serves both the map and the text views instead of the page carrying two. */
window.__ccrUniverseSearch = doSearch;

/* ── suggestions ────────────────────────────────────────────────────────────
 * Sam, 2026-08-25: "The keyword search should start to show likely matches
 * based on key entries — like a Google search does." And 2026-09-03: "use
 * keyword to jump to any cluster or course or subject area."
 *
 * Three kinds, each labelled with a WORD so the reader knows where they are
 * about to be sent: a subject (an island), a course identity (a point — a
 * stand-alone says so), and a college course (a member, found by its code or
 * its control number, which flies to the identity carrying it and filters the
 * list down to it). Subjects first, because "take me to a subject" is the
 * dominant intent on a map. Returns plain objects, no DOM: the header owns the
 * dropdown and this owns the corpus.
 */
/* ── ordering (Sam, 2026-09-05) ───────────────────────────────────────────
 * Sam, looking at the live list for "weld": *"I probs would have spotted that
 * earlier if the dropdown in SkyView showed all the welding courses in
 * order--would have seen 2 named similarly or the same."*
 *
 * ⚠️ THE DEPTH WAS NOT THE PROBLEM; THE SORT WAS. After the relevance tier the
 * list orders by MEMBER COUNT DESCENDING, so a small identity is buried by
 * construction — and a duplicate of a well-adopted course is, almost by
 * definition, the less-adopted twin. Measured on the live corpus: "weld"
 * matches 591 points; `Introduction to Welding` (WELD M1109, 24 colleges)
 * ranks 1st and `Introduction to the Welding Processes` (WELD M1106, 3
 * colleges) ranks 132nd — outside any list a reader will scroll. Sorted by
 * NAME the two sit two rows apart, with `Intro-Welding Processes` (WELD M10VQ,
 * 1 college) beside them: three near-identical identities, visible at a glance.
 *
 * So the two orderings answer different questions and neither replaces the
 * other. Relevance is "take me to the course I mean" and stays the default.
 * By name is "show me what is near-identical", which is the curation question,
 * and popularity-ranking actively defeats it. */
var SUG_ORDER = "relevance";
window.__ccrSuggestOrder = function(mode){
  if(mode==="relevance" || mode==="name") SUG_ORDER = mode;
  return SUG_ORDER;
};

function suggest(raw, limit, order){
  var ord = (order==="name"||order==="relevance") ? order : SUG_ORDER;
  var term=String(raw==null?"":raw).trim().toLowerCase();
  var out=[];
  if(!U || term.length<2) return out;
  limit=limit||8;
  var subs=[];
  U.islands.forEach(function(I){
    var n=I.d.toLowerCase();
    var t=(n===term)?0:(n.indexOf(term)===0?1:(n.indexOf(term)>=0?2:-1));
    if(t<0) return;
    /* `kind` is the internal branch key (see the s.kind==="subject" reader below);
     * `kindWord` is what a reader SEES in a suggestion row and the details panel.
     * Only the second one changed — an island is a discipline, and COBI already
     * spends "subject" on SUBJ4 codes. */
    subs.push({kind:"subject", kindWord:"discipline", kindShort:"DISC", label:I.d, tier:t, n:(I.n||0), isl:I});
  });
  if(ord==="name") subs.sort(function(a,b){ return a.label.toLowerCase()<b.label.toLowerCase() ? -1 : 1; });
  else subs.sort(function(a,b){ return a.tier-b.tier || b.n-a.n || a.label.localeCompare(b.label); });
  /* ⚠️ TYPING MORE OF A WORD MUST NOT DELETE A MATCH THE SHORTER TERM FOUND.
   * Sam, 2026-09-06: 'Try "weldi" after you initially try "weld" and you'll see
   * that there is no intro course in the list.' Measured: "weld" returns
   * Introduction to Welding FIRST, "weldi" returns it nowhere.
   *
   * The cause is that the tiers were tested against the STRING start only. For
   * "weld" every Welding identity is a prefix match on its ID ("weld m1109"),
   * so all 549 sit in tier 1 and sort by adoption — the 24-college intro course
   * wins. One more character and the id stops matching: only the 109 titles
   * beginning "Weldi…" are tier 1, they fill all 60 slots, and the 299 titles
   * where the word "Welding" appears later — the intro courses among them —
   * never reach the list at all.
   *
   * So a term that begins a WORD ranks with one that begins the string. Both
   * mean "the reader typed this word"; which word of the title it happens to be
   * is not a relevance signal, and treating it as one made the ranking unstable
   * under a keystroke. Adoption still orders within the tier, so the answer for
   * "weld", "weldi" and "welding" is now the same course. A match inside a word
   * ("elding") stays tier 2, which is the distinction that was actually wanted. */
  var wordRe=null;
  try{ wordRe=new RegExp("\\b"+term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")); }catch(e){ wordRe=null; }
  var startsWord=function(t){ return !!(wordRe && wordRe.test(t)); };
  // Course identities and stand-alones by title or number; identities first.
  var pts=[];
  for(var i=0;i<U.islands.length;i++){
    var I2=U.islands[i];
    for(var j=0;j<I2.p.length;j++){
      var nd=I2.p[j];
      var lt=(nd.t||"").toLowerCase(), li=nd.i.toLowerCase();
      var tier=(li===term||lt===term)?0:
               (li.indexOf(term)===0||lt.indexOf(term)===0||startsWord(lt)||startsWord(li))?1:
               (lt.indexOf(term)>=0||li.indexOf(term)>=0)?2:-1;
      if(tier<0) continue;
      pts.push({tier:tier+(nd.a?0.5:0), n:nd.n||0, isl:I2, nd:nd});
      /* The pool the relevance sort below ranks. It was 400, which is fine for a
       * list of 8 and starves a list of 60: the cap truncates by ISLAND ORDER,
       * not by relevance, so anything past it never reaches the sort. Raising it
       * costs nothing in the common case — a term that matches little walks the
       * whole corpus either way, and the break only fires when matches are
       * plentiful, which is exactly when the ranking has to be trusted. */
      if(pts.length>3000) break;
    }
  }
  /* ⚠️ SORTING THE WHOLE MATCH SET BY NAME AND TAKING THE FIRST N GIVES YOU THE
   * COURSES BEGINNING WITH "A". That was the first attempt and the harness
   * caught it: for "weld" it returned neither intro course, because 591 matches
   * sorted alphabetically never reach the I's inside a budget of about thirty.
   *
   * What the reader wants is the alphabetical NEIGHBORHOOD of the thing they
   * meant — near-identical titles sit next to each other, so the window has to
   * be CENTERED ON THE BEST MATCH rather than taken from the start. Rank by
   * relevance first to find that anchor, then re-sort by name and slide a
   * window around it. */
  pts.sort(function(a,b){ return a.tier-b.tier || b.n-a.n; });
  var anchor = pts.length ? pts[0] : null;
  /* ── item 6 of Sam's first list (2026-09-04): "In the Keyword Search, keep CR
   * courses together separated from NC courses."
   *
   * A STABLE partition, applied AFTER the relevance sort, so credit courses come
   * first as a block, then noncredit, then the ones with no recorded status —
   * and inside each block the best match is still first. Sorting BY credit as a
   * primary key would have thrown away the relevance order the curator is
   * actually searching on; partitioning keeps both.
   *
   * ⚠️ The unrecorded are their own third block, never folded into credit. It is
   * the same reason the CR/NC filter has three positions: 73 identities carry no
   * value, and calling them credit would be inventing one.
   *
   * The blocks are not separated by a HEADER ROW on purpose — the suggestion
   * list is a listbox whose keyboard navigation indexes sugItems directly, so a
   * non-selectable <li> between groups would desync every arrow key after it.
   * Each row instead names its own status, which is what makes the block
   * boundary legible. */
  /* ⚠️ The credit partition is a RELEVANCE-mode device: it keeps credit courses
   * together at the top of a ranked list. Applied to a by-name list it would
   * split the alphabet into three, which is exactly the clustering the reader
   * asked for being taken away again. */
  if(ord!=="name"){
    var byCredit=[[],[],[]];
    pts.forEach(function(p){ byCredit[p.nd.c==null ? 2 : (p.nd.c===0 ? 0 : 1)].push(p); });
    pts=byCredit[0].concat(byCredit[1], byCredit[2]);
  }

  // College courses, by code (prefix wins) or by control number.
  var mems=[];
  if(memIndex && memIndex.length){
    var digits=/^(ccc)?0*(\d{3,})$/.exec(term);
    var wanted=digits?String(parseInt(digits[2],10)):null;
    var pre=[], inn=[];
    for(var m=0;m<memIndex.length && (pre.length<limit);m++){
      var r=memIndex[m];
      if(wanted){ if(r.d===wanted) pre.push(r); continue; }
      if(r.lc.indexOf(term)===0) pre.push(r);
      else if(inn.length<limit && r.lc.indexOf(term)>=0) inn.push(r);
    }
    pre.concat(inn).slice(0,limit).forEach(function(r){
      var h=nodeById(r.id); if(!h) return;
      mems.push({kind:"member", kindWord:"college course", kindShort:"COLLEGE CRSE", label:r.code+" · "+r.c,
                 sub:"under "+(h.nd.t||h.nd.i)+" · "+h.isl.d, isl:h.isl, nd:h.nd, cn:r.cn, code:r.code});
    });
  }

  /* ── the budget (Sam, 2026-09-05: the search box "only delivers a short set of
   * options and should show all or at least allow scroll to show others").
   *
   * The old split was written for a list of EIGHT — disciplines took all but
   * four, courses all but two of what was left, and college courses whatever
   * survived. Read at a larger limit it starves the tail: a term matching many
   * disciplines pushed every course off the end, and the reader had no way to
   * scroll to what was cut because it was never built.
   *
   * ⚠️ THE BUDGET'S JOB CHANGED. The list scrolls, so it is no longer there to
   * keep the dropdown short; it is there to stop any ONE kind from crowding the
   * other two out of the TOP of it, where the reader looks first. So each kind
   * gets a share with a floor, and — this is the part that makes "show all"
   * true — whatever a kind cannot fill FLOWS to the others rather than
   * shortening the list. A term with no college courses now returns 60
   * disciplines and courses, not 45 and a gap. */
  var have=[subs.length, pts.length, mems.length];
  var want=[Math.max(4, Math.round(limit*0.30)),      // disciplines
            Math.max(6, Math.round(limit*0.45)),      // course identities + stand-alones
            Math.max(4, Math.round(limit*0.25))];     // college courses
  // Trim to what each kind actually has, then hand the slack round-robin to the
  // kinds that still have more — two passes is enough for three buckets.
  for(var pass=0; pass<2; pass++){
    var spare=limit;
    for(var b=0;b<3;b++){ want[b]=Math.min(want[b], have[b]); spare-=want[b]; }
    if(spare<=0) break;
    for(var b2=0;b2<3 && spare>0;b2++){
      var add=Math.min(spare, have[b2]-want[b2]);
      if(add>0){ want[b2]+=add; spare-=add; }
    }
  }
  out=subs.slice(0, want[0]);
  var shown;
  if(ord==="name" && anchor){
    var byName=pts.slice().sort(function(a,b){
      var at=(a.nd.t||a.nd.i).toLowerCase(), bt=(b.nd.t||b.nd.i).toLowerCase();
      return at<bt ? -1 : at>bt ? 1 : (a.nd.i<b.nd.i ? -1 : 1);
    });
    var at=byName.indexOf(anchor);
    // A window that keeps the anchor a third of the way down, so most of what
    // the reader sees is what FOLLOWS it alphabetically — where a longer
    // variant of the same title lands ("… Processes" after "…").
    var before=Math.floor(want[1]/3);
    var start=Math.max(0, Math.min(at-before, byName.length-want[1]));
    shown=byName.slice(start, start+want[1]);
  } else {
    shown=pts.slice(0, want[1]);
  }
  shown.forEach(function(p){
    out.push({kind:"course", kindWord:p.nd.a?"stand-alone course":"course identity",
              kindShort:kindShort("course", p.nd), label:p.nd.t||p.nd.i,
              sub:p.nd.i+" · "+p.isl.d+" · "+creditShort(p.nd), credit:creditWord(p.nd),
              isl:p.isl, nd:p.nd});
  });
  var takeM = mems.slice(0, want[2]);
  if(ord==="name") takeM.sort(function(a,b){ return a.label.toLowerCase()<b.label.toLowerCase() ? -1 : 1; });
  takeM.forEach(function(o){ out.push(o); });
  /* What the dropdown's footer needs to say "there are more". `pts` and `mems`
   * are themselves capped, so this is a floor on the true count, never a
   * claim of exactness — the footer words it that way. */
  out.more = (subs.length-want[0]) + (pts.length-want[1]) + (mems.length-want[2]);
  return out;
}
/* The drawn stars' screen positions. The hit test is the only way a reader
 * reaches a college course on the canvas, and it was silently handing back the
 * wrong card for most of them (2026-09-06); without the coordinates a harness
 * can only scan blindly and hope. ⚠️ Deliberately NOT part of
 * __ccrUniverseState(): prototype/check_ccr_atlas.js serializes that whole
 * object across the CDP bridge several times per run, and this array is one
 * entry per drawn star. */
window.__ccrMemberPoints = function(){
  return memberPts.map(function(mp){ return {x:mp.x, y:mp.y, id:mp.nd.i, code:mp.m.n}; });
};
window.__ccrSuggest = suggest;
window.__ccrTipHtml = tipHtml;

/* ⚠️ A PANEL THE READER HID STAYS HIDDEN. openInspector() fires on every
 * selection, so pressing Hide and then picking anything put it straight back —
 * Sam, 2026-09-06: "the side bar unhid (and does so every time I add a course)."
 * Hide is an instruction about the workspace, not about one course. Cleared the
 * moment they open it again by any route, so the panel is never stuck shut. */
var inspHidden=false;
function openInspector(){ if(!inspOpen && !inspHidden) setInspector(true); }
/* The panel's width: remembered per browser, clamped to what the stage can
 * spare, applied as a custom property the CSS reads for the flex basis. */
var inspW=0; try{ inspW=parseInt(localStorage.getItem("skyview:sidebar-w")||"0",10)||0; }catch(e){}
function inspBounds(){
  var stage=document.getElementById("u-stage");
  var W=(stage&&stage.clientWidth)||window.innerWidth||1200;
  return [260, Math.max(260, Math.floor(W*0.6))];
}
function paintInspWidth(){
  var a=document.getElementById("u-inspector"); if(!a) return;
  if(inspW>0) a.style.setProperty("--u-insp-w", inspW+"px"); else a.style.removeProperty("--u-insp-w");
}
function setInspWidth(px){
  var b=inspBounds();
  inspW = px>0 ? Math.max(b[0], Math.min(b[1], Math.round(px))) : 0;
  try{ if(inspW>0) localStorage.setItem("skyview:sidebar-w", String(inspW)); else localStorage.removeItem("skyview:sidebar-w"); }catch(e){}
  paintInspWidth();
  if(cvs && document.getElementById("u-cvs")===cvs){ fitCanvas(); draw(); }
}
function wireInspGrip(){
  var g=document.getElementById("u-insp-grip"), a=document.getElementById("u-inspector"); if(!g||!a) return;
  g.addEventListener("pointerdown", function(e){
    if(e.button!==0 && e.button!==undefined) return;
    e.preventDefault();
    if(g.setPointerCapture){ try{ g.setPointerCapture(e.pointerId); }catch(x){} }
    g.classList.add("dragging");
    var move=function(ev){ var r=a.getBoundingClientRect(); setInspWidth(r.right-ev.clientX); };
    var up=function(){ g.classList.remove("dragging"); g.removeEventListener("pointermove", move); g.removeEventListener("pointerup", up); g.removeEventListener("pointercancel", up); };
    g.addEventListener("pointermove", move); g.addEventListener("pointerup", up); g.addEventListener("pointercancel", up);
  });
  g.addEventListener("keydown", function(e){
    var cur = inspW>0 ? inspW : (a.getBoundingClientRect().width||0);
    if(e.key==="ArrowLeft"){ e.preventDefault(); setInspWidth(cur+20); }
    else if(e.key==="ArrowRight"){ e.preventDefault(); setInspWidth(cur-20); }
    else if(e.key==="Home"){ e.preventDefault(); setInspWidth(0); }
  });
}
window.__ccrSetSidebarWidth=setInspWidth;
function setInspector(open){
  inspOpen=!!open;
  var a=document.getElementById("u-inspector"), b=document.getElementById("u-insp-toggle");
  if(a) a.classList.toggle("closed", !inspOpen);
  if(b){ b.setAttribute("aria-pressed", inspOpen?"true":"false"); var sw=b.querySelector(".u-state"); if(sw) sw.textContent=inspOpen?"on":"off"; }
  // The panel is docked beside the canvas, so showing or hiding it changes the
  // canvas's width: refit, or the map draws at the old size.
  if(cvs && document.getElementById("u-cvs")===cvs){ fitCanvas(); draw(); }
}

/* Act on a chosen suggestion. Flying is this module's job, so the header hands
 * back the object it was given rather than re-deriving anything from the label. */
function goSuggestionSingle(s){
  if(!s || !U) return false;
  if(!document.getElementById("u-cvs")) window.__ccrUniverse();
  if(s.kind==="subject"){
    var I=s.isl;
    searchHits=[]; searchTerm="";
    /* Item 10 (Sam, 2026-09-04): "When choosing a subject, zoom to 150% and
     * maintain focus on the subject in the centre." An exact figure, not a
     * fitted one — the previous `Math.min(3.2, 190/I.r)` sized the zoom to the
     * island, so the same gesture landed at a different magnification on every
     * discipline and the number in the corner never meant anything. flyTo
     * centres the point and sets the anchor, so the zoom buttons keep it there. */
    healIsland(I);
    flyTo(I.x+(I.dx||0), I.y+(I.dy||0), SUBJECT_ZOOM);
    selIsl=I; selNode=null; showIsland(I);
    setHint("Discipline <strong>"+esc(I.d)+"</strong> — "+num(I.n)+" identities, "+num(I.sa||0)+" stand-alone courses."+healWords());
    draw(); return true;
  }
  var isl=s.isl, nd=s.nd;
  searchHits=[{id:nd.i, x:nd.x+(isl.dx||0), y:nd.y+(isl.dy||0), isl:isl, nd:nd}];
  searchTerm=String(s.label||"").toLowerCase();
  /* Item 10: "When you do keyword search and select a Course, zoom to 1000% and
   * maintain focus on the course in the centre of the universe." That is the
   * magnification where one course stands clear of its neighbors while they
   * stay on screen to drag it between — the reason the zoom cap was raised past
   * 900% in the first place. Well above NODE_ZOOM either way: a single identity
   * flown to at a zoom that draws no nodes is a ring nobody can see. */
  healShow(nd);
  flyTo(nd.x+(isl.dx||0), nd.y+(isl.dy||0), COURSE_ZOOM);
  selNode=nd; selIsl=isl;
  memFilter = s.kind==="member" ? String(s.code||"") : "";
  showNode(nd, isl, s.kind==="member");
  setHint((s.kind==="member"
    ? "<strong>"+esc(s.code)+"</strong> sits under <strong>"+esc(nd.t||nd.i)+"</strong> ("+esc(nd.i)+") in "+esc(isl.d)+"."
    : "<strong>"+esc(nd.t)+"</strong> — "+esc(nd.i)+" in "+esc(isl.d)+".")+healWords());
  draw(); return true;
}
/* A pick from the list ADDS to the selection (Sam, 2026-09-05: "make it
 * multi-select capable"); one pick still behaves exactly as it always did. */
window.__ccrGoSuggestion = function(s){
  if(!s || !U) return false;
  if(!document.getElementById("u-cvs")) window.__ccrUniverse();
  var t=tokenFromSuggestion(s);
  // Already picked: focus it again rather than doubling it (the workspace and
  // the sidebar send a discipline here to open it, however often).
  var had=tokens.filter(function(x){ return x.key===t.key; })[0];
  if(had){ applyTokens(had); return true; }
  return addToken(t);
};
/* ⭐ THE WHOLE SELECTION, APPLIED ONCE (Sam, 2026-09-06: wait for Enter). The
 * dropdown collects ticks without touching the map and hands the finished set
 * here on Enter.
 *
 * ⚠️ ONE applyTokens() FOR THE WHOLE BATCH, NOT ONE PER ROW. addToken() applies
 * as it adds, so looping it over four picks flies the map four times — three of
 * them to places the reader never asked to see, each with its own zoom, and the
 * last one wins. The tokens go in silently and the view is fitted once, at the
 * end, to what the reader actually chose.
 *
 * Removals first: applyTokens() fits to whatever `tokens` holds when it runs,
 * so a reader who unticks A and ticks B must not be shown the union of both on
 * the way. Returns false when nothing changed, so Enter can fall through to a
 * plain term search. */
window.__ccrCommitSelection = function(add, dropKeys){
  if(!U) return false;
  if(!document.getElementById("u-cvs")) window.__ccrUniverse();
  add = add || []; dropKeys = dropKeys || [];
  if(!add.length && !dropKeys.length) return false;
  dropKeys.forEach(function(k){ tokens = tokens.filter(function(x){ return x.key !== k; }); });
  var last = null;
  add.forEach(function(s){
    var t = tokenFromSuggestion(s);
    if(tokens.some(function(x){ return x.key === t.key; })) return;
    tokens.push(t); last = t;
  });
  renderTokens();
  if(!tokens.length){ searchHits=[]; searchTerm=""; setHint("Selection cleared."); draw(); return true; }
  // `last` is the newest ADDITION, which applyTokens() focuses; a commit that
  // only removed things has none, and passing null is what asks it to fit the
  // remainder instead of flying to a row nobody just picked.
  applyTokens(last);
  return true;
};
/* The list's rows carry checkboxes (Sam, 2026-09-05: "should have checkboxes
 * to clarify" multi-select), so a pick from the LIST toggles: a ticked row
 * unticks. Only the list calls this; every other caller means "go there". */
window.__ccrToggleSuggestion = function(s){
  if(!s || !U) return false;
  if(!document.getElementById("u-cvs")) window.__ccrUniverse();
  var t=tokenFromSuggestion(s);
  if(tokens.some(function(x){ return x.key===t.key; })){ removeToken(t.key); return true; }
  return addToken(t);
};
window.__ccrTokenKey = function(s){ return s ? tokenFromSuggestion(s).key : ""; };
window.__ccrTokenKeys = function(){ return tokens.map(function(t){ return t.key; }); };

/* ── "Disciplines as a list" (Sam, 2026-08-25) is the workspace's By discipline
 * view since 2026-09-05: same rows, same filter seeded from the search box,
 * same fly to the map — beside the subject grain and ESL packaging. Kept as a
 * name so an older caller still lands somewhere. */
window.__ccrSubjectList = function(seed){ window.__ccrWorkspace("discipline", {q:seed}); };

window.__ccrUniverseState = function(){
  // `sel` is here so a test that clicks the canvas can assert which identity it
  // actually landed on. sharedKeys is here so a test can assert the guard is
  // live on real data rather than on a fixture. The zoom bands and label counts
  // are here because canvas text cannot be queried from the DOM.
  var shared=0;
  if(cnCourses) for(var k in cnCourses) if(cnCourses[k].length>1) shared++;
  var orbiting=0, rim=0, cross=0;
  if(U) U.islands.forEach(function(I){ I.p.forEach(function(p){ if(p.a){ if(p.o){ orbiting++; if(p.h) cross++; } else rim++; } }); });
  return {view:view, moves:moves, sel:selNode?selNode.i:null,
          members:roster?Object.keys(roster).length:0, memberSource:memberSource,
          memberIndex:memIndex?memIndex.length:0,
          sharedKeys:shared, canMove:canMove,
          nodeZoom:NODE_ZOOM, labelZooms:{id:ID_ZOOM, title:TITLE_ZOOM, full:FULL_ZOOM},
          labelStats:labelStats, hits:searchHits.length,
          orbiting:orbiting, rim:rim, crossOrbits:cross, inspectorOpen:inspOpen, inspectorWidth:inspW, showHealed:showHealed.slice(),
          spread:SPREAD_ISLANDS, dotRadAt:dotRad, focus:lastFocus?Object.keys(lastFocus).length:0,
          /* How many disciplines the Show switches leave standing, and how many
           * courses inside them. Canvas draws nothing the DOM can be asked
           * about, so this is the only way a test can see that a switch reached
           * the map — which is the failure Sam reported on 2026-09-05. */
          islandsShown:U?U.islands.filter(function(I){ return islandPass(I)>0; }).length:0,
          islandsTotal:U?U.islands.length:0,
          coursesShown:(function(){ var n=0; if(U) U.islands.forEach(function(I){ n+=islandPass(I); }); return n; })(),
          solo:solo, curView:curView, framed:framed(), ringMax:RING_MAX,
          tokens:tokens.map(function(t){ return t.label; }), show:JSON.parse(JSON.stringify(show)),
          winState:winState(), legendOpen:legendOpen, hostDocked:hostDocked, dark:dark,
          carrying:(drag&&drag.kind==="course")?drag.code:null,
          descBases:DESC_BASES.slice(), descBasesFor:descBasesFor, descState:descState,
          placedBoxes:placedBoxes, titlesQueued:titlesQueued,
          // The zoom ceiling and the radius taper are here because a canvas
          // radius cannot be queried from the DOM, and the taper is the half of
          // "zoom past 900%" that actually makes one course pickable.
          kMax:K_MAX, radKnee:RAD_KNEE, radScaleAt:radScale,
          courseZoom:COURSE_ZOOM, subjectZoom:SUBJECT_ZOOM,
          creditFilter:creditFilter, ncDashAt:ncDash,
          creditCounts:(function(){ var o={cr:0,nc:0,unrecorded:0,shown:0};
            if(U) U.islands.forEach(function(I){ I.p.forEach(function(nd){
              if(nd.c==null) o.unrecorded++; else if(nd.c===0) o.cr++; else o.nc++;
              if(creditShown(nd)) o.shown++; }); });
            return o; })(),
          mode:mode, anchor:anchor, memberZoom:MEMBER_ZOOM, memberZoomAll:MEMBER_ZOOM_ALL, memberPoints:memberPts.length,
          memberOwners:memberPts.reduce(function(o,mp){ o[mp.nd.i]=(o[mp.nd.i]||0)+1; return o; }, {}),
          hover:hoverNode?hoverNode.i:null};
};

/* ── tooltip ────────────────────────────────────────────────────────────────
 * The quick look (Sam: "see course and cluster details on click or hover"). A
 * tooltip follows the pointer; the inspector holds the full card on click. */
function tipHtml(hit){
  if(hit.mem){
    /* Sam, 2026-09-05: "The course title and description should show on the
     * explainer card for member local courses." The description is the whole
     * reason to hover a college's course — it is the evidence the identity was
     * built from, and reading it is how a reviewer decides whether the merge is
     * sound. Trimmed, because a hover card is not a reading surface: the panel
     * carries the full text on a click. */
    var m=hit.mem, info=courseInfo(hit.isl, m);
    var st=descState[hit.isl && hit.isl.sh];
    var body = info && info.desc ? esc(trunc(info.desc, 260))
             : st==="loading" ? "Loading the catalog description…"
             : st==="ok" ? "No catalog description for this course."
             : "";
    return '<b>'+esc(m.n)+'</b> '+esc(shortCollege(m.c))+
      (info&&info.title?'<br>'+esc(info.title):'')+
      '<br><span class="sub">'+(info&&info.units!=null?esc(unitsWord(info.units))+' · ':'')+
      'college course under '+esc(hit.nd.i)+' '+esc(trunc(hit.nd.t||"",36))+'</span>'+
      (body?'<br><span class="sub tip-desc">'+body+'</span>':'');
  }
  if(hit.nd){
    var nd=hit.nd, isl=hit.isl;
    var carried=(roster&&roster[nd.i]||[]).length;
    var h='<b>'+esc(nd.i)+'</b> '+esc(nd.t||"")+
      '<br><span class="sub">'+esc(unitsWord(nd.u))+' · '+esc(sysWord(nd))+' · '+
      num(carried)+' college course'+(carried===1?'':'s')+' · '+esc(isl.d)+
      // A loner's one college names it; the hover is where a reader asks "whose?"
      (loneCollege(nd)?' · '+esc(loneCollege(nd)):'')+'</span>';
    if(nd.a){
      var par=nd.o?nodeById(nd.o):null;
      h+='<br><span class="sub">Stand-alone'+(nd.h?' filed under '+esc(nd.h):'')+(par
        ? ' — orbits '+esc(par.nd.i)+' '+esc(trunc(par.nd.t,40))+': '+esc(whyWords(nd.w))
        : ' — nothing in this discipline shares a subject code or title words with it')+'</span>';
    } else if(nd.k){
      h+='<br><span class="sub">'+num(nd.k)+' stand-alone course'+(nd.k===1?'':'s')+' in orbit</span>';
    }
    return h;
  }
  var auth=authorityWords(hit.isl);
  return '<b>'+esc(hit.isl.d)+'</b><br><span class="sub">'+num(hit.isl.n)+' identities · '+
         num(hit.isl.sa||0)+' stand-alone courses</span>'+
         (auth?'<br><span class="sub">'+auth+'</span>':'');
}
function showTip(hit, px, py){
  var tip=document.getElementById("u-tip"); if(!tip) return;
  tip.innerHTML=tipHtml(hit); tip.hidden=false;
  var W=cw(), H=ch(), tw=tip.offsetWidth||220, th=tip.offsetHeight||40;
  var x=px+14, y=py+14;
  if(x+tw>W-8) x=Math.max(8, px-tw-14);
  if(y+th>H-8) y=Math.max(8, py-th-14);
  tip.style.left=x+"px"; tip.style.top=y+"px";
}
function hideTip(){ var tip=document.getElementById("u-tip"); if(tip) tip.hidden=true; }

function wire(){
  window.addEventListener("resize", function(){ if(document.getElementById("u-cvs")===cvs){ fitCanvas(); draw(); } });
  cvs.addEventListener("wheel", function(e){
    e.preventDefault();
    var r=cvs.getBoundingClientRect();
    zoomAt(e.clientX-r.left, e.clientY-r.top, e.deltaY<0?1.16:1/1.16);
  }, {passive:false});
  document.getElementById("u-in").onclick=function(){ zoomStep(1.4); };
  document.getElementById("u-out").onclick=function(){ zoomStep(1/1.4); };
  document.getElementById("u-reset").onclick=function(){ searchHits=[]; resetView(); draw(); };
  function setMode(m){
    mode=m==="pan"?"pan":"move";
    ["pan","move"].forEach(function(x){
      var b=document.getElementById("u-mode-"+x); if(b) b.setAttribute("aria-pressed", x===mode?"true":"false");
    });
    cvs.style.cursor = mode==="pan"?"grab":"default";
    setHint(mode==="pan"
      ? "<strong>Pan</strong>: drag anywhere to move the view; a click still selects. Switch to <strong>Move</strong> to carry a course."
      : "<strong>Move</strong>: drag a stand-alone course or a college course onto the identity it belongs to; drag a discipline to pull it next to another; drag the background to pan.");
  }
  var mpan=document.getElementById("u-mode-pan"), mmove=document.getElementById("u-mode-move");
  if(mpan) mpan.onclick=function(){ setMode("pan"); };
  if(mmove) mmove.onclick=function(){ setMode("move"); };
  window.__ccrSetMode=setMode;
  /* The Views menu is built and wired by viewsMenuInto() — one builder for
   * the map's row and for every other view's crumbs row (item 9). */

  /* ── item 3 + item 11: the search moves into this row ─────────────────────
   * MOVED, never copied — the page keeps exactly one search field. In browser
   * full screen only #u-full is painted, so a box living in the page masthead
   * is not merely hard to reach, it is absent; Sam: "The keyword search in full
   * SkyView has a bug and doesn't allow me to click into it."
   *
   * ⚠️ #u-top is REBUILT on every render of this view, so a form parked inside
   * it is destroyed with it. homeSearch() puts the form back in the masthead
   * and every other view calls it on entry — the same orphaning that made an
   * earlier attempt to lift #u-bar into the masthead produce two of everything.
   * The visible label is item 3's ("add 'Search' as a label"); the screen-reader
   * label the form already carried stays, so nothing is announced twice. */
  var slot=document.getElementById("u-search-slot"), ms=document.getElementById("msearch");
  if(slot && ms){
    slot.appendChild(ms);
    /* Item 9 (2026-09-05): "Move 'Search' label inside the search box so it
     * disappears when text is entered" — the placeholder is that label. The
     * form's screen-reader label stays as it was written (the accessible name
     * must still CONTAIN the visible word "Search", WCAG 2.5.3), and no visible
     * label is printed in the row any more. */
    var box=ms.querySelector("#gq");
    if(box) box.setAttribute("placeholder", "Search a course, code or discipline");
    ensureTokenHost();
    pendingRestore = tokens.length > 0;    // painted after the canvas is sized
    /* Item 7 (2026-09-05): "Search chip is not needed as users are accustomed
     * to using Enter" — the template no longer prints one; a page that still
     * does gets it hidden, and the one field submits on Enter by itself. */
    var go=ms.querySelector('button[type="submit"]');
    if(go){ go.classList.add("u-search-go"); go.hidden=true; }
  }

  /* ── item 5: close ───────────────────────────────────────────────────────
   * Walks down until something is true, so it is never a control that does
   * nothing: leave full screen · close a tab that another page opened · fall
   * back to the Common Course Reference. */
  var xb=document.getElementById("u-close");
  if(xb) xb.onclick=function(){
    if(document.fullscreenElement){ if(document.exitFullscreen) document.exitFullscreen(); return; }
    /* Inside COBI's Common Course Reference tab the page around this frame
     * owns the list; it listens for this and swaps the frame for the table. */
    if(framed()){ tellParent("close"); return; }
    if(window.opener && !window.opener.closed){ window.close(); return; }
    location.href="../index.html#unified-courses/list";
  };
  /* ── Show (2026-09-05): what the map draws, as switches ───────────────────
   * The 2026-09-04 CR / NC toggle had three positions because 73 identities
   * carry no credit status and either bucket would be a lie; that state is a
   * switch of its own here, and so are the identity systems and the kinds of
   * point. `__ccrSetCredit` survives as a shim for the harness and for any
   * caller that still thinks in the three words. */
  function paintShow(){
    var on=0; SHOW_KEYS.forEach(function(k){ if(show[k]) on++; });
    var w=document.getElementById("u-show-word"), sm=document.getElementById("u-show-sum");
    if(w) w.textContent = on===SHOW_KEYS.length ? "All" : (on+" of "+SHOW_KEYS.length);
    // The count alone says nothing about WHAT is off; the tooltip names it.
    var offWords=SHOW_KEYS.filter(function(k){ return !show[k]; }).map(function(k){ return SHOW_WORDS[k].replace(/ \u2014 .*$/, ""); });
    if(sm) sm.title = offWords.length ? "Hidden: "+offWords.join(", ") : "Everything is drawn";
    Array.prototype.forEach.call(document.querySelectorAll("#u-show-menu input[data-show]"), function(i){
      i.checked=!!show[i.getAttribute("data-show")];
    });
  }
  function applyShow(quiet){
    syncCreditWord(); paintShow();
    if(quiet){ draw(); return; }
    var n=0, hidden=0, unrec=0, unrecHidden=0;
    if(U) U.islands.forEach(function(I){ I.p.forEach(function(nd){
      if(nd.c==null){ unrec++; if(!creditShown(nd)) unrecHidden++; }
      if(creditShown(nd)) n++; else hidden++;
    }); });
    var off=SHOW_KEYS.filter(function(k){ return !show[k]; });
    /* Below NODE_ZOOM the canvas draws disciplines, not courses. Say so, in the
     * same breath as the count — otherwise a reader who filters at the zoom the
     * map OPENS on watches a number change beside a picture that does not, and
     * reasonably concludes the switch is broken. Islands do drop out when they
     * empty (islandPass), so the control is never silent; this sentence explains
     * why a partial filter moves so little. */
    var wide = view.k<=NODE_ZOOM ? " At this magnification the map draws <strong>disciplines</strong>, "+
                 "not individual courses \u2014 a discipline disappears when nothing in it is shown. "+
                 "Zoom in to see the courses themselves." : "";
    setHint(off.length===0
      ? "Showing every course. <strong>"+num(unrec)+"</strong> have no recorded credit status; "+
        "they appear here and nowhere else."+wide
      : "Showing <strong>"+num(n)+"</strong> of "+num(n+hidden)+" courses; "+num(hidden)+" hidden"+
        (unrecHidden?" ("+num(unrecHidden)+" with no recorded credit status)":"")+
        (show.members?"":"; the college courses under an identity are not drawn")+
        ". Noncredit is drawn with a broken ring."+wide);
    draw();
  }
  function setShow(patch, quiet){
    Object.keys(patch||{}).forEach(function(k){ if(SHOW_KEYS.indexOf(k)>=0) show[k]=!!patch[k]; });
    applyShow(quiet);
  }
  function setCredit(v){
    setShow({cr:v!==CR_NC, nc:v!==CR_CREDIT, nce:v!==CR_CREDIT, unrec:v===CR_ALL});
  }
  Array.prototype.forEach.call(document.querySelectorAll("#u-show-menu input[data-show]"), function(i){
    i.addEventListener("change", function(){ var p={}; p[i.getAttribute("data-show")]=i.checked; setShow(p); });
  });
  var every=document.getElementById("u-show-every");
  if(every) every.onclick=function(){ var p={}; SHOW_KEYS.forEach(function(k){ p[k]=true; }); setShow(p); };
  var none=document.getElementById("u-show-none");
  if(none) none.onclick=function(){ var p={}; SHOW_KEYS.forEach(function(k){ p[k]=false; }); setShow(p); };
  window.__ccrSetCredit=setCredit;
  window.__ccrSetShow=setShow;
  paintShow(); syncCreditWord();

  var tg=document.getElementById("u-insp-toggle");
  if(tg) tg.onclick=function(){ inspHidden=inspOpen; setInspector(!inspOpen); };
  var hb=document.getElementById("u-insp-hide");
  if(hb) hb.onclick=function(){ inspHidden=true; setInspector(false); };
  wireInspGrip(); paintInspWidth();
  /* ⚠️ PAINT THE STATE, NEVER HARDCODE IT IN THE MARKUP. `inspOpen` is module
   * memory and survives a re-render; the markup is rebuilt from scratch. Writing
   * `class="u-inspector closed"` into the template desynchronized the two the
   * moment you navigated away and came back with the panel open: the DOM said
   * closed, `inspOpen` said open, and openInspector() — which is a no-op when it
   * believes the panel is already open — could never reopen it again. Selecting a
   * course silently showed nothing. One call keeps them agreeing. */
  setInspector(inspOpen);

  /* ── the legend folds from the map's lower right (Sam, 2026-09-05, item 5:
   * "Rather than Hide Legend, save space by adding a expand/collapse glyph next
   * to the unbold text 'Legend' in the lower right corner of the main window
   * control"). The state is module memory, so a re-render keeps the fold. */
  var lt=document.getElementById("u-legend-toggle");
  function paintLegend(){
    var f=document.getElementById("u-foot");
    if(f) f.classList.toggle("u-foot-hidden", !legendOpen);
    if(lt){
      lt.setAttribute("aria-expanded", legendOpen?"true":"false");
      lt.title = legendOpen ? "Hide the legend" : "Show the legend";
      var m=lt.querySelector(".u-fold"); if(m) m.textContent = legendOpen ? "\u25BE" : "\u25B4";
    }
    var lm=document.getElementById("u-legend-menu");
    if(lm){ lm.setAttribute("aria-pressed", legendOpen?"true":"false"); var sw=lm.querySelector(".u-state"); if(sw) sw.textContent=legendOpen?"on":"off"; }
  }
  function toggleLegend(){ legendOpen=!legendOpen; paintLegend(); fitCanvas(); draw(); }
  if(lt) lt.onclick=toggleLegend;
  var lmb=document.getElementById("u-legend-menu"); if(lmb) lmb.onclick=toggleLegend;
  paintLegend();

  /* ── ITEM 8: the controls sit on the TITLE's row ──────────────────────────
   * Sam, 2026-09-04: "Try to consolidate the top of Sky view by moving the chips
   * up to the header and all on the same row as the title. I want all the real
   * estate for the universe view."
   *
   * ⚠️ THEY CANNOT SIMPLY LIVE THERE. Full screen paints ONE element — #u-full —
   * so a control parked in the page masthead vanishes the moment you enter it,
   * which is the failure Sam's own 2026-09-03 note asked us to avoid ("will need
   * links on full screen to navigate to the other views"). So the bar MOVES: up
   * to the masthead for the normal view, back inside #u-full while full screen
   * is on. One element, two homes, never a second copy that can drift.
   *
   * Embedded in COBI there is no masthead, so it stays where it was rendered. */
  /* ── ITEM 8: ONE ROW at the top, and the map gets the rest ────────────────
   * Sam, 2026-09-04: "Try to consolidate the top of Sky view by moving the chips
   * up to the header and all on the same row as the title. I want all the real
   * estate for the universe view."
   *
   * ⭐ #u-top was ALREADY one row — `justify-content:space-between` puts the view
   * links left and the controls right. What Sam saw was that row WRAPPING at his
   * zoom, because "Zoom out / Zoom in / Reset view / Hide details / Full screen"
   * do not fit beside the links. So the fix is to make it fit, not to move
   * anything: shorter words under a "Zoom" group label, and nowrap until a real
   * breakpoint. The map then starts a row higher at every zoom he works at.
   *
   * ⚠️ TWO THINGS THAT WERE TRIED AND ARE WRONG, recorded so they are not retried:
   *   · Lifting #u-bar into the page masthead. The masthead sits OUTSIDE #u-full,
   *     the only element the browser paints in full screen, so the controls
   *     vanish exactly where Sam asked for them on 2026-09-03 — and it outlives
   *     the view, so navigating away stranded them over a table and coming back
   *     put two #u-bar and two #u-fs under one id (Chromium: {bars:2, fsBtns:2}).
   *   · Adding a "SkyView" title to this row. The masthead already carries the
   *     name, and the title pushed the view links rightward INTO the search
   *     suggestion dropdown, which is absolutely positioned over whatever sits
   *     below the masthead. Chromium reported #u-list unclickable — and that is
   *     a route Sam asked for by name (type a term, then open the subject list
   *     seeded from the box). The links belong hard left, clear of the dropdown. */

  /* ── the window controls (Sam, 2026-09-05) ───────────────────────────────
   * Browser full screen is still the browser's own, on the map section; inside
   * COBI the frame carries allow="fullscreen" (unified_courses.js). The chip
   * that used to ask for it is gone: the middle control steps UP from the map
   * alone into full screen, the left one steps DOWN — into COBI's chrome when
   * framed (the page around the frame docks the map), into the comprehensive
   * view stand-alone. The menu control opens COBI's side bar, collapsed by
   * default on open (Sam: "should be default collapsed on open"). */
  function goFullscreen(){
    var full=document.getElementById("u-full");
    if(document.fullscreenElement){ if(document.exitFullscreen) document.exitFullscreen(); return; }
    if(!full || !full.requestFullscreen){
      setHint("This browser does not offer full screen here. The map already fills the window."); return;
    }
    var p=full.requestFullscreen();
    if(p && p.catch) p.catch(function(){
      setHint("Full screen was not allowed in this frame \u2014 open SkyView in its own tab "+
              "(Go To menu) and try again.");
    });
  }
  var wd=document.getElementById("u-win-down"), wu=document.getElementById("u-win-up"), wm=document.getElementById("u-menu");
  if(wd) wd.onclick=function(){ stepWindow(-1); };
  if(wu) wu.onclick=function(){ stepWindow(+1); };
  if(wm) wm.onclick=function(){ tellParent("menu"); };
  window.__ccrGoFullscreen=goFullscreen;
  paintWins();
  var dk=document.getElementById("u-dark");
  if(dk) dk.onclick=function(){ setDark(!dark); };
  window.__ccrSetDark=setDark;
  paintDark();
  var tsb=document.getElementById("u-textsize");
  if(tsb) tsb.onclick=function(){ setTextStep((textStep+1) % TEXT_STEPS.length); };
  paintTextStep();

  cvs.addEventListener("pointerdown", function(e){
    var r=cvs.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
    if(cvs.setPointerCapture && e.pointerId!=null){ try{ cvs.setPointerCapture(e.pointerId); }catch(err){} }
    hideTip();
    // A course already picked up survives the press. Without this the pointerdown
    // replaced `drag` with a fresh node/island/pan grab before pointerup could
    // read it, so pressing "Drag…" and then clicking the destination — the only
    // route the hint text describes — selected the destination and moved nothing.
    if(drag && drag.kind==="course"){ drag.px=px; drag.py=py; return; }
    var hit=pick(px,py);
    // Pan mode: the drag moves the view whatever is under the pointer; the
    // click it started with still selects on release.
    if(mode==="pan"){ drag={kind:"pan", x0:px, y0:py, vx:view.x, vy:view.y, hit:hit, moved:false}; return; }
    if(hit && hit.mem)     drag={kind:"member", isl:hit.isl, nd:hit.nd, mem:hit.mem, x0:px, y0:py, moved:false};
    else if(hit && hit.nd) drag={kind:"node", isl:hit.isl, nd:hit.nd, x0:px, y0:py, moved:false};
    else if(hit && e.shiftKey===false && hit.isl) drag={kind:"island", isl:hit.isl, x0:px, y0:py,
                                                        ox:hit.isl.dx||0, oy:hit.isl.dy||0, moved:false};
    else drag={kind:"pan", x0:px, y0:py, vx:view.x, vy:view.y, hit:hit, moved:false};
  });
  cvs.addEventListener("pointermove", function(e){
    var r=cvs.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
    if(!drag){
      var hit=pick(px,py);
      var ni=hit?hit.isl:null, nn=hit?hit.nd:null;
      if(ni!==hoverIsl||nn!==hoverNode){ hoverIsl=ni; hoverNode=nn; draw(); }
      cvs.style.cursor = mode==="pan" ? "grab" : (nn||(hit&&hit.mem)) ? "pointer" : ni ? "grab" : "default";
      if(hit) showTip(hit, px, py); else hideTip();
      return;
    }
    if(drag.kind==="pan"){
      if(Math.abs(px-drag.x0)+Math.abs(py-drag.y0)>3) drag.moved=true;
      view.x=drag.vx+(px-drag.x0)/view.k; view.y=drag.vy+(py-drag.y0)/view.k; draw();
    } else if(drag.kind==="member"){
      /* Dragging a member square picks its course up — the same carry a hollow
       * point starts and the panel's Drag… button starts; the CN: row it would
       * write is the same one. */
      if(Math.abs(px-drag.x0)+Math.abs(py-drag.y0)>5){
        var mem=drag.mem, mgate=canMove(mem.cn);
        if(!mgate.ok){ setHint(sharedKeyReason(mem.cn, mem.n, mgate.others)); drag={kind:"pan", x0:px, y0:py, vx:view.x, vy:view.y, moved:true}; return; }
        drag={kind:"course", cn:mem.cn, d:mem.d, code:mem.n, college:mem.c, px:px, py:py, fromNode:drag.nd};
        setHint("Carrying <strong>"+esc(mem.n)+"</strong> ("+esc(mem.c)+") — drop it on the identity it belongs to.");
        draw();
      }
    } else if(drag.kind==="island"){
      drag.isl.dx=drag.ox+(px-drag.x0)/view.k;
      drag.isl.dy=drag.oy+(py-drag.y0)/view.k;
      if(Math.abs(px-drag.x0)+Math.abs(py-drag.y0)>3) drag.moved=true;
      draw();
    } else if(drag.kind==="course"){
      drag.px=px; drag.py=py; draw();
    } else if(drag.kind==="node"){
      if(Math.abs(px-drag.x0)+Math.abs(py-drag.y0)>5){
        drag.moved=true;
        /* Dragging a hollow point IS picking its course up (Sam: "a visual drag
         * and drop interface"). A stand-alone carries exactly one course, so the
         * gesture is unambiguous; a clustered identity carries many, so its
         * courses are dragged from the details panel instead. */
        if(drag.nd.a){
          var m=(roster&&roster[drag.nd.i]||[])[0];
          if(m && !emptied(drag.nd)){
            var gate=canMove(m.cn);
            if(!gate.ok){ setHint(sharedKeyReason(m.cn, m.n, gate.others)); drag={kind:"pan", x0:px, y0:py, vx:view.x, vy:view.y}; return; }
            drag={kind:"course", cn:m.cn, d:m.d, code:m.n, college:m.c, px:px, py:py, fromNode:drag.nd};
            setHint("Carrying <strong>"+esc(m.n)+"</strong> ("+esc(m.c)+") — drop it on the identity it belongs to.");
            draw();
          }
        }
      }
    }
  });
  cvs.addEventListener("pointerup", function(e){
    var r=cvs.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
    if(drag && drag.kind==="course"){
      var hit=pick(px,py);
      if(hit && hit.nd && drag.fromNode && hit.nd===drag.fromNode){
        // Released where it started: a click on the hollow point, not a move.
        selNode=hit.nd; selIsl=hit.isl; showNode(hit.nd, hit.isl); drag=null; draw(); return;
      }
      if(hit && hit.nd) applyMove(drag.cn, drag.code, drag.college, hit.nd.i, drag.d);
      else setHint("Dropped on empty space — nothing moved.");
      drag=null; draw(); return;
    }
    if(drag && drag.kind==="pan" && !drag.moved && drag.hit){          // a click, in Pan mode
      var ph=drag.hit;
      if(ph.mem){ selNode=ph.nd; selIsl=ph.isl; memFilter=ph.mem.n; showNode(ph.nd, ph.isl, true); }
      else if(ph.nd){ selNode=ph.nd; selIsl=ph.isl; showNode(ph.nd, ph.isl); }
      else if(ph.isl){ selIsl=ph.isl; selNode=null; showIsland(ph.isl); }
    }
    else if(drag && drag.kind==="member" && !drag.moved){ selNode=drag.nd; selIsl=drag.isl; memFilter=drag.mem.n; showNode(drag.nd, drag.isl, true); }
    else if(drag && drag.kind==="node" && !drag.moved){ selNode=drag.nd; selIsl=drag.isl; showNode(drag.nd, drag.isl); }
    else if(drag && drag.kind==="island" && !drag.moved){ selIsl=drag.isl; selNode=null; showIsland(drag.isl); }
    /* A click on empty ground drops the selected point and with it the click
     * highlight (Obsidian does the same); the panel keeps what it was showing. */
    else if(drag && drag.kind==="pan" && !drag.moved && !drag.hit && selNode){ selNode=null; }
    drag=null; draw();
  });
  cvs.addEventListener("pointerleave", function(){ hideTip(); });
  /* The accelerator for the button in the panel. It follows the button rather
   * than replacing it: a double-click is undiscoverable and not reachable from a
   * keyboard, and on most subjects there is nothing to open yet. */
  cvs.addEventListener("dblclick", function(e){
    var r=cvs.getBoundingClientRect();
    var hit=pick(e.clientX-r.left, e.clientY-r.top);
    if(!hit) return;
    /* ⭐ A COURSE OPENS ITS OUTLINE; EMPTY ISLAND GROUND KEEPS THE OLD BEHAVIOUR
     * (Sam's ruling, 2026-09-06: "Double click should open the course outline of
     * record work surface we prototyped last session"). The gesture was already
     * taken — it was an accelerator for the discipline work surface — so it is
     * SPLIT by what is under the pointer rather than reassigned wholesale, which
     * would have cost the only fast way into the decision packs. What he
     * double-clicked was a course, and a course is what he expected to open. */
    if(hit.nd){ window.__ccrOutline(hit.nd.i); return; }
    var d=hasWorkSurface(hit.isl);
    if(d){ window.__ccrDiscipline(d); return; }
    selIsl=hit.isl; selNode=null; showIsland(hit.isl);
    setHint("No work surface for <strong>"+esc(hit.isl.d)+"</strong> yet — the "+
            "grouped decision view covers "+
            (A&&A.detail?num(Object.keys(A.detail).length):"a few")+" subjects so far.");
    draw();
  });
  /* Keyboard operation of the map itself, not just the frame. Tab/Shift-Tab step
   * through subjects, Enter opens the selected one, and once inside a subject Tab
   * steps through its identities. Escape steps back out (or drops a carried
   * course). Arrows pan, +/- zoom. */
  var kbIsl=-1, kbNode=-1, kbInside=false;
  function kbSubject(dir){
    kbIsl=(kbIsl+dir+U.islands.length)%U.islands.length;
    kbInside=false; kbNode=-1;
    var isl=U.islands[kbIsl];
    selIsl=isl; selNode=null;
    flyTo(isl.x+(isl.dx||0), isl.y+(isl.dy||0), Math.min(3.2, 190/isl.r));
    showIsland(isl);
    setHint("Subject <strong>"+esc(isl.d)+"</strong> — "+num(isl.n)+
            " identities. <kbd>Enter</kbd> to step into it, <kbd>Tab</kbd> for the next discipline.");
  }
  function kbIdentity(dir){
    var isl=U.islands[kbIsl]; if(!isl || !isl.p.length) return;
    kbNode=(kbNode+dir+isl.p.length)%isl.p.length;
    var nd=isl.p[kbNode];
    // Zoom past the node threshold or the identity a reader has just selected
    // is not drawn at all — the same floor the search has to clear.
    flyTo(nd.x+(isl.dx||0), nd.y+(isl.dy||0), Math.max(view.k, NODE_ZOOM*3));
    showNode(nd, isl);
    setHint("<strong>"+esc(nd.t||nd.i)+"</strong> — "+esc(nd.i)+
            " ("+num(kbNode+1)+" of "+num(isl.p.length)+" in "+esc(isl.d)+
            "). <kbd>Esc</kbd> to leave this discipline.");
  }
  /* Two levels, and which one Tab moves in is held EXPLICITLY. Deriving it from
     "have we got a node yet" made Enter unable to enter. */
  function kbStep(dir){
    if(kbIsl<0 || !kbInside) kbSubject(dir);
    else kbIdentity(dir);
  }
  /* Point the cursor at whatever was just selected, however it was selected.
   * Idempotent for the keyboard path itself: kbSubject/kbIdentity set these and
   * then call showIsland/showNode, which land back here with the same values. */
  kbSync=function(isl, nd){
    if(!U || !isl){ kbIsl=-1; kbNode=-1; kbInside=false; return; }
    var i=U.islands.indexOf(isl);
    if(i<0) return;
    kbIsl=i;
    if(nd){ kbInside=true; kbNode=isl.p.indexOf(nd); }
    else   { kbInside=false; kbNode=-1; }
  };
  cvs.addEventListener("keydown", function(e){
    var step=40/view.k;
    if(e.key==="Tab"){ kbStep(e.shiftKey?-1:1); e.preventDefault(); return; }
    if(e.key==="Enter"||e.key===" "){
      if(kbIsl>=0 && !kbInside){ kbInside=true; kbNode=-1; kbIdentity(1); e.preventDefault(); }
      return;
    }
    if(e.key==="Escape"){
      if(drag && drag.kind==="course"){ drag=null; setHint("Put the course back — nothing moved."); draw(); e.preventDefault(); return; }
      if(kbInside){
        kbInside=false; kbNode=-1; selNode=null;
        var isl=U.islands[kbIsl];
        if(isl){ showIsland(isl); setHint("Back to <strong>"+esc(isl.d)+
          "</strong>. <kbd>Tab</kbd> for the next discipline."); }
        draw();
      }
      e.preventDefault(); return;
    }
    if(e.key==="ArrowLeft"){ view.x+=step; draw(); e.preventDefault(); }
    if(e.key==="ArrowRight"){ view.x-=step; draw(); e.preventDefault(); }
    if(e.key==="ArrowUp"){ view.y+=step; draw(); e.preventDefault(); }
    if(e.key==="ArrowDown"){ view.y-=step; draw(); e.preventDefault(); }
    if(e.key==="+"||e.key==="="){ zoomStep(1.4); e.preventDefault(); }
    if(e.key==="-"){ zoomStep(1/1.4); e.preventDefault(); }
  });
}
function setHint(t){ var el=document.getElementById("u-hint"); if(el) el.innerHTML=t; }

/* ── keyword zoom ────────────────────────────────────────────────────────── */
function memberHits(term){
  if(!memIndex) return [];
  var digits=/^(ccc)?0*(\d{3,})$/.exec(term);
  var wanted=digits?String(parseInt(digits[2],10)):null;
  var out=[], seen={};
  for(var m=0;m<memIndex.length;m++){
    var r=memIndex[m];
    var ok = wanted ? r.d===wanted : (r.lc===term || r.lc.indexOf(term)===0 || (r.lc.indexOf(term)>=0 && term.length>=4));
    if(!ok) continue;
    var h=nodeById(r.id); if(!h || seen[r.id]) continue;
    seen[r.id]=1;
    out.push({id:r.id, x:h.nd.x+(h.isl.dx||0), y:h.nd.y+(h.isl.dy||0), isl:h.isl, nd:h.nd, code:r.code});
    if(out.length>=300) break;
  }
  return out;
}
function searchOne(raw){
  var term=String(raw==null?"":raw).trim().toLowerCase();
  searchTerm=term; searchHits=[];
  if(term.length<2){ setHint("Type at least two characters."); draw(); return; }
  U.islands.forEach(function(I){
    I.p.forEach(function(nd){
      if((nd.t||"").toLowerCase().indexOf(term)>=0 || nd.i.toLowerCase().indexOf(term)>=0)
        searchHits.push({id:nd.i, x:nd.x+(I.dx||0), y:nd.y+(I.dy||0), isl:I, nd:nd});
    });
  });
  /* A SUBJECT NAME WINS, AND IT WINS BEFORE COURSE TITLES DO. Typing part of a
   * subject's name means "take me there". Tiers decide: exact → prefix →
   * contains, best non-empty tier wins, and course titles choose the destination
   * only when no subject name matches at all. */
  var lcb=function(I){ return I.d.toLowerCase(); };
  var named=U.islands.filter(function(I){ return lcb(I).indexOf(term)>=0; });
  var tierOf=function(I){ var n=lcb(I); return n===term?0 : n.indexOf(term)===0?1 : 2; };
  if(named.length){
    var bestTier=named.reduce(function(m,I){ return Math.min(m,tierOf(I)); }, 9);
    named=named.filter(function(I){ return tierOf(I)===bestTier; });
    var bnames=named.map(function(I){ return I.d; });
    /* VARIANTS OF ONE SUBJECT ARE ONE SUBJECT. The corpus carries near-identical
     * spellings that EXTEND one another (three ESL names), and for a term
     * prefixing all of them the SHORTEST is the one the others qualify.
     * "Biology" vs "Biological Sciences" is NOT this — neither extends the other
     * — so that stays an honest ambiguity and takes the branch below. */
    var shortest=bnames.slice().sort(function(a,b){ return a.length-b.length; })[0];
    var family=bnames.every(function(n){ return n.toLowerCase().indexOf(shortest.toLowerCase())===0; });
    var pick;
    if(bnames.length===1 || family){
      pick=named.filter(function(I){ return I.d===shortest; })[0] || named[0];
    } else {
      /* GENUINELY SEVERAL SUBJECTS ("art" → Art, Culinary Arts, Theater Arts).
       * Go to the biggest and NAME the others, so the guess is visible and
       * correctable. The suggestion list is the real answer here. */
      pick=named.slice().sort(function(a,b){ return (b.n||0)-(a.n||0); })[0];
    }
    healIsland(pick);
    var k=Math.min(3.2, 190/pick.r);
    flyTo(pick.x+(pick.dx||0), pick.y+(pick.dy||0), k);
    selIsl=pick; selNode=null; showIsland(pick);
    var others=bnames.filter(function(n){ return n!==pick.d; });
    /* The term is the subject's own name, so every course title carrying that
     * word is not a find — it is the subject. No rings: a Welding island with
     * 408 red rings and red names (measured 2026-09-03) reads as an alarm, and
     * the labels now lead with the title, which made every one of them red. */
    searchHits=[];
    setHint("Discipline <strong>"+esc(pick.d)+"</strong> — "+num(pick.n)+" identities."+
      (others.length ? " Also matching: <strong>"+others.slice(0,3).map(esc).join("</strong> · <strong>")+
        "</strong>"+(others.length>3?" · …":"")+" — pick one from the search suggestions." : "")+
      " Click an identity to open it and see the college courses under it."+healWords());
    draw();
    return;
  }
  /* No subject named. A college course's code or control number is the other
   * thing a curator types — "MATH 110", "CCC000123456". Its hits ring the
   * identities that carry it. */
  var mh=memberHits(term), mcode=null;
  if(mh.length){
    var have={}; searchHits.forEach(function(h){ have[h.id]=1; });
    mh.forEach(function(h){ if(!have[h.id]){ searchHits.push(h); have[h.id]=1; } });
    mcode=mh[0].code;
  }
  if(!searchHits.length){ setHint("Nothing matches “"+esc(term)+"”."); draw(); return; }
  // Ringing courses the switches have hidden draws rings around nothing.
  healHits(searchHits);
  var subj={}; searchHits.forEach(function(h){ subj[h.isl.d]=(subj[h.isl.d]||0)+1; });
  var names=Object.keys(subj).sort(function(a,b){return subj[b]-subj[a];});
  var head="<strong>"+num(searchHits.length)+"</strong> match “"+esc(term)+
    "” across <strong>"+names.length+"</strong> discipline"+(names.length===1?"":"s")+
    ": "+names.slice(0,4).map(function(n){return esc(n)+" ("+subj[n]+")";}).join(" · ")+
    (names.length>4?" · …":"")+"."+
    (mh.length?" "+num(mh.length)+" of them carry a college course numbered like that.":"");
  var xs=searchHits.map(function(h){return h.x;}), ys=searchHits.map(function(h){return h.y;});
  var cx=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2;
  var cy=(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2;
  var spread=Math.max(90, Math.max(Math.max.apply(null,xs)-Math.min.apply(null,xs),
                                   Math.max.apply(null,ys)-Math.min.apply(null,ys)));
  var fit=Math.min(3.2, (cw()*0.62)/spread);
  if(fit>NODE_ZOOM){
    flyTo(cx,cy,fit);
    setHint(head+" Ringed in red."+healWords());
  } else {
    /* The hits do not fit in one view at any zoom that draws them. Go to the
     * densest subject rather than framing them all invisibly, and say which. */
    var top=searchHits.filter(function(h){return h.isl.d===names[0];});
    var tx=top.reduce(function(a,h){return a+h.x;},0)/top.length;
    var ty=top.reduce(function(a,h){return a+h.y;},0)/top.length;
    flyTo(tx,ty,Math.max(NODE_ZOOM*1.6, Math.min(3.2, 190/top[0].isl.r)));
    setHint(head+" They are too far apart to ring in one view — showing <strong>"+
      esc(names[0])+"</strong>. Search a discipline name to go straight to it."+healWords());
  }
  if(searchHits.length===1){
    selNode=searchHits[0].nd; selIsl=searchHits[0].isl;
    memFilter = mcode && mh.length===1 ? mcode : "";
    showNode(selNode, selIsl, !!memFilter);
    flyTo(selNode.x+(selIsl.dx||0), selNode.y+(selIsl.dy||0), Math.max(view.k, NODE_ZOOM*3));
  }
  draw();
}

/* ── the selection: tokens beside the search box (Sam, 2026-09-05) ─────────
 * Typing a term and pressing Enter REPLACES the selection with one term token
 * (a search means a search); a pick from the suggestion list ADDS a token.
 * With one token the map behaves exactly as a single pick or search always
 * did; with more it rings every token and fits them all in view. */
function doSearch(raw){
  var t=String(raw==null?"":raw).trim();
  if(t.length<2){ setHint("Type at least two characters."); draw(); return; }
  tokens=[]; addToken({kind:"term", key:"term:"+t.toLowerCase(), label:t, term:t});
}
function tokenFromSuggestion(s){
  if(s.kind==="subject") return {kind:"subject", key:"disc:"+s.isl.d, label:s.label, isl:s.isl, s:s};
  if(s.kind==="member") return {kind:"member", key:"mem:"+s.code+"@"+s.nd.i, label:s.code, isl:s.isl, nd:s.nd, code:s.code, s:s};
  return {kind:"course", key:"crs:"+s.nd.i, label:s.nd.t||s.nd.i, isl:s.isl, nd:s.nd, s:s};
}
function tokenShort(t){ return kindShort(t.kind, t.nd); }
/* What a token contributes to the map: node hits to ring, islands to outline. */
function tokenHits(t){
  var out={hits:[], isls:[]};
  if(t.kind==="subject"){ out.isls.push(t.isl); return out; }
  if(t.kind==="course"||t.kind==="member"){
    out.hits.push({id:t.nd.i, x:t.nd.x+(t.isl.dx||0), y:t.nd.y+(t.isl.dy||0), isl:t.isl, nd:t.nd}); return out;
  }
  var term=String(t.term||"").toLowerCase();
  var named=U.islands.filter(function(I){ return I.d.toLowerCase().indexOf(term)>=0; });
  if(named.length){ out.isls=named; return out; }
  U.islands.forEach(function(I){ I.p.forEach(function(nd){
    if((nd.t||"").toLowerCase().indexOf(term)>=0 || nd.i.toLowerCase().indexOf(term)>=0)
      out.hits.push({id:nd.i, x:nd.x+(I.dx||0), y:nd.y+(I.dy||0), isl:I, nd:nd});
  }); });
  memberHits(term).forEach(function(h){ out.hits.push(h); });
  return out;
}
function addToken(t){
  if(!t || !U) return false;
  if(!tokens.some(function(x){ return x.key===t.key; })) tokens.push(t);
  // The box keeps its term: the list stays open with the pick ticked, so the
  // next pick is one more click rather than a retype.
  renderTokens(); applyTokens(t); return true;
}
function removeToken(key){
  tokens=tokens.filter(function(x){ return x.key!==key; });
  renderTokens();
  if(!tokens.length){ searchHits=[]; searchTerm=""; setHint("Selection cleared."); draw(); return; }
  applyTokens(null);
}
/* Set when a render finds a parked selection; consumed once the canvas is sized.
 * applyTokens() flies and fits, and both read the canvas rectangle — called
 * before fitCanvas() they compute against a zero-sized canvas and land nowhere. */
var pendingRestore=false;
function restoreTokens(){
  if(!pendingRestore) return;
  pendingRestore=false;
  if(!tokens.length) return;
  renderTokens();
  applyTokens(tokens.length===1 ? tokens[0] : null);
  setHint(tokens.length===1
    ? "Back on <strong>"+esc(tokens[0].label)+"</strong>, where you left it."
    : "Your "+tokens.length+" picks are still selected.");
}
function clearTokens(quiet){
  tokens=[]; renderTokens();
  if(quiet) return;
  searchHits=[]; searchTerm=""; draw();
}
window.__ccrClearSelection=function(){ clearTokens(); };
window.__ccrTokenBack=function(){ if(tokens.length){ removeToken(tokens[tokens.length-1].key); return true; } return false; };
/* One token: the single behaviors. Several: the union, fitted. */
function applyTokens(last){
  if(!U) return;
  if(tokens.length===1){
    var t=tokens[0];
    if(t.kind==="term"){ searchOne(t.term); }
    else { goSuggestionSingle(t.s); }
    t.isls = (t.kind==="term") ? tokenHits(t).isls : (t.kind==="subject" ? [t.isl] : []);
    draw(); return;
  }
  var u=selectionUnion(), hits=u.hits, isls=u.isls;
  /* THE NEWEST PICK GETS THE FOCUS — it flies there at the single-pick zoom and
   * its details open — and every pick stays ringed. Fitting them all instead
   * landed at 26% with three picks in two disciplines, three unmarked circles
   * on a whole map (Sam, 2026-09-05: "When I filter for courses, the focus does
   * not go to them"). Fit all is a word beside Clear for when the whole
   * selection is the point; removing a chip fits what is left. With ONE pick
   * the same button reads Recenter and goes back to it — ↺ resets to the whole
   * universe, which is what ↺ is for (Sam's ruling 3, 2026-09-05). */
  if(last){
    if(last.kind==="term") searchOne(last.term); else goSuggestionSingle(last.s);
  } else {
    fitSelection(hits, isls);
  }
  searchHits=hits; searchTerm="";
  var words=tokens.map(function(t){ return "<strong>"+esc(t.label)+"</strong>"; });
  setHint((last ? "Focused on <strong>"+esc(last.label)+"</strong>. " : "")+
    "Showing "+tokens.length+" selections: "+words.join(" · ")+". "+
    (hits.length ? num(hits.length)+" course"+(hits.length===1?"":"s")+" ringed in red" : "")+
    (isls.length ? (hits.length?"; ":"")+num(isls.length)+" discipline"+(isls.length===1?"":"s")+" outlined in blue" : "")+
    (tokens.length>1
      ? ". <em>Fit all</em> beside the search box shows them together; remove a chip to narrow it."
      : ". <em>Recenter</em> beside the search box returns to it.")+healWords());
  draw();
}
function selectionUnion(){
  var hits=[], seen={}, isls=[], seenI={};
  tokens.forEach(function(t){
    var h=tokenHits(t); t.isls=h.isls;
    h.hits.forEach(function(x){ if(!seen[x.id]){ seen[x.id]=1; hits.push(x); } });
    h.isls.forEach(function(I){ if(!seenI[I.d]){ seenI[I.d]=1; isls.push(I); } });
  });
  return {hits:hits, isls:isls};
}
function fitSelection(hits, isls){
  var xs=[], ys=[];
  hits.forEach(function(h){ xs.push(h.x); ys.push(h.y); });
  isls.forEach(function(I){ var cx=I.x+(I.dx||0), cy=I.y+(I.dy||0); xs.push(cx-I.r, cx+I.r); ys.push(cy-I.r, cy+I.r); });
  if(!xs.length) return false;
  var x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs), y0=Math.min.apply(null,ys), y1=Math.max.apply(null,ys);
  var spanX=Math.max(60, x1-x0), spanY=Math.max(60, y1-y0);
  var fit=Math.min((cw()*0.78)/spanX, (ch()*0.78)/spanY);
  fit=clampK(Math.max(NODE_ZOOM*1.3, Math.min(COURSE_ZOOM, fit)));
  flyTo((x0+x1)/2, (y0+y1)/2, fit);
  return true;
}
window.__ccrFitSelection=function(){
  if(!U || !tokens.length) return false;
  var u=selectionUnion(), ok=fitSelection(u.hits, u.isls);
  if(ok) setHint(tokens.length===1 ? "Recentered on the selection."
                                  : "Fitted "+tokens.length+" selections into view.");
  draw(); return ok;
};
/* The chips live inside the search form's wrapper, before the box, so the
 * suggestion list still hangs under both. Only while the form is borrowed into
 * the map's row: homeSearch() clears them on the way out. */
function ensureTokenHost(){
  var wrap=document.querySelector("#u-search-slot .sugwrap"); if(!wrap) return null;
  var host=wrap.querySelector("#u-tokens");
  if(!host){ host=document.createElement("span"); host.id="u-tokens"; host.className="u-tokens"; wrap.insertBefore(host, wrap.firstChild); }
  return host;
}
function renderTokens(){
  var host=ensureTokenHost();
  if(!host){ var stray=document.getElementById("u-tokens"); if(stray) stray.innerHTML=""; return; }
  host.innerHTML=tokens.map(function(t){
    /* The title sits on the WHOLE chip (Sam's ruling 3, 2026-09-05: "full title
     * on hover"). `.u-tok-l` is `text-overflow:ellipsis`, so a long name is
     * clipped and the tooltip is the only way to read it — but the title used to
     * hang on that span alone, so hovering the kind, the padding or the × showed
     * nothing, which is most of the chip's surface. Kind included, because the
     * clipped word is often the half that says WHICH "Introduction to…" this is. */
    var full=tokenShort(t)+" · "+t.label;
    /* ⭐ THE LABEL IS A CONTROL (Sam, item 2, 2026-09-06). The chips sit where a
     * trail of breadcrumbs would sit and read as one, but the only working
     * control inside a chip was its ×, so the only way back to a pick you had
     * navigated away from was to search for it again. The label now re-centres
     * on that pick and opens its panel; the × keeps its own job. */
    return '<span class="u-tok" data-key="'+esc(t.key)+'" title="'+esc(full)+'">'+
      '<button type="button" class="u-tok-go" data-key="'+esc(t.key)+
        '" aria-label="Go back to '+esc(t.label)+'"><span class="u-tok-k">'+esc(tokenShort(t))+'</span>'+
        '<span class="u-tok-l">'+esc(t.label)+'</span></button>'+
      '<button type="button" class="u-tok-x" aria-label="Remove '+esc(t.label)+' from the selection" title="Remove">\u00d7</button></span>';
  }).join("")+(tokens.length
    /* ⚠️ ONE pick needs this button too (Sam's ruling 3). It used to render only
     * at tokens.length>1, so with a single selection the only view control was
     * ↺ — and ↺ resets to the whole universe, which is what it is FOR. You could
     * pick a course and have no way back to it. */
    /* ⭐ THE BUTTON NAMES ITS TARGET (Sam, item 5, 2026-09-06). It acts on the
     * CHIP, not on what the panel is showing, and "Recenter" alone is ambiguous
     * once the reader has drilled two levels past the pick — "this" is then not
     * what they are looking at. Naming the pick removes the ambiguity without
     * adding a control, which is the glyph rule doing its work. */
    ? '<button type="button" class="u-tok-act" id="u-tok-fit" title="'+
        (tokens.length>1 ? 'Fit every pick into view'
                         : (tokens[0].label ? 'Recenter the map on '+esc(tokens[0].label)
                                            : 'Recenter the map on this pick'))+'">'+
        (tokens.length>1 ? 'Fit all'
                         : (tokens[0].label ? 'Recenter on '+esc(trunc(tokens[0].label, 20))
                                            : 'Recenter'))+'</button>'+
      (tokens.length>1 ? '<button type="button" class="u-tok-act" id="u-tok-clear" title="Drop every pick">Clear</button>' : '')
    : '');
  Array.prototype.forEach.call(host.querySelectorAll(".u-tok-x"), function(b){
    b.addEventListener("click", function(){ removeToken(b.parentNode.getAttribute("data-key")); });
  });
  Array.prototype.forEach.call(host.querySelectorAll(".u-tok-go"), function(b){
    b.addEventListener("click", function(){
      var k=b.getAttribute("data-key");
      var t=tokens.filter(function(x){ return x.key===k; })[0];
      if(t){ applyTokens(t); setHint("Back on <strong>"+esc(t.label)+"</strong>."); }
    });
  });
  var cl=host.querySelector("#u-tok-clear"); if(cl) cl.addEventListener("click", function(){ clearTokens(); setHint("Selection cleared."); });
  var ft=host.querySelector("#u-tok-fit"); if(ft) ft.addEventListener("click", function(){ window.__ccrFitSelection(); });
}

/* ── the window: three states, two steps ─────────────────────────────────── */
function winState(){
  if(document.fullscreenElement) return 2;
  if(framed()) return hostDocked ? 0 : 1;
  return solo ? 1 : 0;
}
function stepWindow(dir){
  var st=winState();
  if(dir<0){
    if(st===2){ if(document.exitFullscreen) document.exitFullscreen(); return; }
    if(st===1){ if(framed()) tellParent("dock"); else window.__ccrUniverse({solo:false}); }
    return;
  }
  if(st===0){ if(framed()) tellParent("undock"); else window.__ccrUniverse({solo:true}); return; }
  if(st===1){ if(window.__ccrGoFullscreen) window.__ccrGoFullscreen(); return; }
  if(document.exitFullscreen) document.exitFullscreen();
}
function paintWins(){
  var st=winState();
  var d=document.getElementById("u-win-down"), u=document.getElementById("u-win-up"), m=document.getElementById("u-menu");
  if(d){
    d.hidden = st===0;               // nothing to step down to: not dimmed, not painted
    var dw = st===2 ? "Leave full screen" : framed() ? "Show COBI around the map" : "Show the page around the map";
    d.setAttribute("aria-label", dw); d.title=dw;
  }
  if(u){
    u.textContent = st===2 ? "\u2921" : "\u2922";
    var uw = st===0 ? "Fill the window" : st===1 ? "Full screen" : "Leave full screen";
    u.setAttribute("aria-label", uw); u.title=uw;
  }
  if(m){
    m.hidden = hostDocked;           // docked, COBI's own rail is on screen already
    m.setAttribute("aria-expanded", hostMenu?"true":"false");
    m.title = hostMenu ? "Close the COBI menu" : "Open the COBI menu"; m.setAttribute("aria-label", m.title);
  }
}
document.addEventListener("fullscreenchange", function(){
  paintWins();
  if(cvs && document.getElementById("u-cvs")===cvs){ fitCanvas(); draw(); }
});
/* The page around the frame reports its state (unified_courses.js): docked or
 * not, menu open or not. Only the parent window is believed. */
window.addEventListener("message", function(e){
  var m=e&&e.data; if(!m || m.type!=="skyview-host") return;
  if(!framed() || e.source!==window.parent) return;
  hostDocked=!!m.docked; hostMenu=!!m.menu;
  paintWins();
  if(cvs && document.getElementById("u-cvs")===cvs){ fitCanvas(); draw(); }
});

/* ── Show menu markup ─────────────────────────────────────────────────────── */
function showMenuHtml(){
  var W=function(k){ return [k, SHOW_WORDS[k]]; };
  var groups=[
    ["Credit status", ["cr","nc","nce","unrec"].map(W)],
    ["Identity system", ["mid","cid","ccn","uni"].map(W)],
    ["Kind of point", ["ident","orbit","rim"].map(W)],
    ["Articulations", ["arty","noart"].map(W)],
    ["Under an identity", ["members"].map(W)]
  ];
  return '<details class="u-show" id="u-show">'+
    '<summary class="btn u-show-sum" id="u-show-sum" aria-controls="u-show-menu">Show: <b id="u-show-word">All</b></summary>'+
    '<div class="u-show-menu" id="u-show-menu" role="group" aria-label="What the map shows">'+
      '<div class="u-show-all"><button class="linkish" type="button" id="u-show-every">Show everything</button>'+
        /* Sam, 2026-09-05: "need to add a Deselect All option on the Show:All
         * drop down" — clear every switch, then tick the one or two you want. */
        '<button class="linkish" type="button" id="u-show-none">Deselect all</button></div>'+
      groups.map(function(g){
        return '<fieldset><legend>'+esc(g[0])+'</legend>'+g[1].map(function(o){
          return '<label><input type="checkbox" data-show="'+o[0]+'"'+(show[o[0]]?' checked':'')+'> <span>'+esc(o[1])+'</span></label>';
        }).join('')+'</fieldset>';
      }).join('')+
    '</div></details>';
}

/* ── similar courses, and the level ladder ───────────────────────────────────
 * Sam, 2026-09-06: "Would be great if the side bar details could show courses
 * similar to the selected courses in order… all the beg intros followed by int
 * intros."
 *
 * ⚠️ THE LEVEL WORD IS THE LADDER, SO IT MUST NOT DRIVE THE SIMILARITY. If
 * "Beginning" and "Advanced" counted as title words, the two rungs of one
 * course would score as LESS alike than two unrelated beginning courses — and
 * the ladder is the whole point of the section. They are stripped before
 * scoring and read back afterwards.
 *
 * Levels are read from the title because that is the only place we hold them:
 * 44% of Welding's 512 titles carry one (109 beginning · 61 intermediate · 54
 * advanced, 288 unmarked). A course with no level word is listed last under a
 * plain heading rather than guessed at — course level and skill level are
 * different axes and neither is derived from the other. */
var LEVEL_ORDER=["Beginning","Intermediate","Advanced"];
/* Tested most-specific first: an "Advanced" course may still say "basic". */
var LEVEL_TESTS=[["Advanced",/\badvanced?\b/i],
                 ["Intermediate",/\bintermediate\b/i],
                 ["Beginning",/\b(?:beginning|beginner|basics?|elementary)\b/i]];
function courseLevel(t){
  var v=String(t==null?"":t);
  for(var i=0;i<LEVEL_TESTS.length;i++) if(LEVEL_TESTS[i][1].test(v)) return LEVEL_TESTS[i][0];
  return null;
}
var SIM_STOP={to:1,of:1,the:1,and:1,for:1,in:1,on:1,with:1,an:1,its:1,from:1};
var SIM_LEVEL=/^(?:advanced?|intermediate|beginning|beginner|basics?|elementary)$/;
function titleTokens(t){
  var out={}, n=0;
  String(t==null?"":t).toLowerCase().replace(/[^a-z0-9]+/g," ").split(" ").forEach(function(x){
    if(x.length<3 || SIM_STOP[x] || SIM_LEVEL.test(x)) return;
    var k=x.replace(/s$/,"");
    if(!out[k]){ out[k]=1; n++; }
  });
  out.__n=n;
  return out;
}
var simCache={};
/* Dice over the same lightly stemmed tokens the builder scores orbits with, so
 * "similar" means here what it means everywhere else on this surface. Cached by
 * id: renderNode() runs on every keystroke of the member filter, and a
 * discipline holds up to 1,176 identities. */
function similarTo(nd, isl){
  if(!nd || nd.a || !isl) return [];
  if(simCache[nd.i]) return simCache[nd.i];
  var mine=titleTokens(nd.t||nd.i), keys=Object.keys(mine), out=[];
  if(mine.__n){
    isl.p.forEach(function(o){
      if(o===nd || o.a || o.i===nd.i) return;
      var theirs=titleTokens(o.t||o.i);
      if(!theirs.__n) return;
      var hit=0;
      for(var i=0;i<keys.length;i++) if(keys[i]!=="__n" && theirs[keys[i]]) hit++;
      if(!hit) return;
      var score=(2*hit)/(mine.__n+theirs.__n);
      if(score<0.34) return;              // one shared word out of many is not a peer
      out.push({nd:o, score:score});
    });
  }
  simCache[nd.i]=out;
  return out;
}

/* ── panels ─────────────────────────────────────────────────────────────── */
function chipFor(nd){
  var s=SYS[nd.s]||SYS[3];
  return '<span class="chip '+(nd.s===0?"gen":nd.s===3?"mut":"cid")+
    '" title="'+esc(SYSWHY[nd.s]||SYSWHY[3])+'">'+esc(s[2])+' — '+esc(s[3])+'</span>';
}
/* ⭐ THE ROW IS THE TARGET (Sam, item 3, 2026-09-06). A course row carries a
 * title, a code, member counts and a chip, and only the title opened it — one
 * hit target in a bordered row whose area is mostly not it. The title stays the
 * accessible name and the keyboard path is unchanged; the rest of the row now
 * routes to the same button.
 * ⚠️ The identity-system chip keeps its own tooltip and stays inert, per the
 * caveat Sam ruled on: a whole-row click would otherwise swallow a hover a
 * reader may want. Buttons inside the row keep their own jobs. */
function wireRowClicks(ul){
  if(!ul) return;
  ul.addEventListener("click", function(e){
    var t=e.target;
    if(t.closest("button, a, input, .chip")) return;   // a real control, or the chip
    var li=t.closest("li"); if(!li || !ul.contains(li)) return;
    var go=li.querySelector("[data-go]");
    if(go) go.click();
  });
}
function goNode(id){
  var h=nodeById(id); if(!h) return;
  selNode=h.nd; selIsl=h.isl; memFilter="";
  healShow(h.nd);
  flyTo(h.nd.x+(h.isl.dx||0), h.nd.y+(h.isl.dy||0), Math.max(view.k, NODE_ZOOM*3, 1.8));
  showNode(h.nd, h.isl);
}
function showIsland(isl){
  openInspector();
  if(kbSync) kbSync(isl, null);
  var el=document.getElementById("u-detail");
  var idents=isl.p.filter(function(p){ return !p.a; });
  var top=idents.slice().sort(function(a,b){return b.n-a.n;}).slice(0,14);
  var authLine=authorityWords(isl);
  el.innerHTML="<h3>"+esc(isl.d)+"</h3>"+
    (authLine?'<p class="sub u-auth">'+authLine+"</p>":"")+
    "<p>"+num(isl.n)+" course identit"+(isl.n===1?"y":"ies")+" · "+num(isl.sa||0)+" stand-alone course"+
      ((isl.sa||0)===1?"":"s")+((isl.sa||0)?" ("+num(isl.al||0)+" in orbit around an identity, "+
      num((isl.sa||0)-(isl.al||0))+" on the rim"+(isl.xin?"; "+num(isl.xin)+" of those in orbit are filed under another discipline":"")+")":"")+".</p>"+
    (top.length?'<p class="sub">Biggest first — pick one to open it:</p><ul class="idlist">'+top.map(function(nd){
      return '<li><button type="button" class="ttl linkish" data-go="'+esc(nd.i)+'">'+esc(nd.t||nd.i)+"</button> "+
        chipFor(nd)+
        '<div class="sub">'+esc(nd.i)+" · "+num(nd.n)+" member"+(nd.n===1?"":"s")+
        (nd.k?" · "+num(nd.k)+" in orbit":"")+(nd.u!=null?" · "+esc(unitsWord(nd.u)):"")+
        (nd.ar?" · "+num(nd.ar)+" articulation"+(nd.ar===1?"":"s"):"")+"</div></li>";
    }).join("")+"</ul>":'<p class="empty">No clustered identity in this discipline yet — every course here is a stand-alone.</p>')+
    workSurfaceOffer(isl)+
    '<p class="empty" style="margin-top:.5em">Drag this discipline on the map to bring it '+
    'beside another, then drag a course across.</p>';
  Array.prototype.forEach.call(el.querySelectorAll("[data-go]"), function(b){
    b.addEventListener("click", function(){ goNode(b.dataset.go); });
  });
  wireRowClicks(el.querySelector("ul.idlist"));
  var b=document.getElementById("u-open-work");
  if(b) b.addEventListener("click", function(){ window.__ccrDiscipline(b.dataset.d); });
  resetPanelScroll();
}
/* The work surface (the grouped decision view) exists for a few subjects only.
 * The button says so rather than doing nothing. */
function hasWorkSurface(isl){
  var d=isl.d;
  var has = A && A.detail && A.detail[d] && A.detail[d].length &&
            typeof window.__ccrDiscipline === "function";
  return has ? d : null;
}
function workSurfaceOffer(isl){
  var d=hasWorkSurface(isl);
  if(d) return '<p style="margin-top:.6em"><button class="btn primary" type="button" '+
    'id="u-open-work" data-d="'+esc(d)+'">Open the work surface for '+esc(d)+'</button>'+
    ' <span class="sub">'+num(A.detail[d].length)+' decision'+
    (A.detail[d].length===1?"":"s")+' to work through.</span></p>';
  return '<p class="empty" style="margin-top:.6em">No work surface for this discipline yet '+
    '— the grouped decision view is built for '+
    (A&&A.detail?num(Object.keys(A.detail).length):"a few")+' disciplines so far, not all '+
    num(U.counts.disciplines)+'.</p>';
}
/* `keepFilter`: only a jump that SET the filter (a college-course search) keeps
 * it. A canvas click on another identity starts clean — the harness caught an
 * 850-course card reading as empty because the previous search's code was
 * still filtering it. */
function showNode(nd, isl, keepFilter){
  selNode=nd; selIsl=isl;
  if(!keepFilter) memFilter="";
  openInspector();
  if(kbSync) kbSync(isl, nd);
  renderNode();
  resetPanelScroll();
  loadDesc(isl, function(){ if(selNode===nd) renderNode(); });
}
function memberRow(m, isl, nd, moved){
  var info=courseInfo(isl, m);
  var st=descState[isl&&isl.sh];
  var shared=coursesOn(m.cn).length>1;
  var open=!!openDesc[m.cn];
  var cls=(moved?"moved ":"")+(shared?"shared":"");
  var h='<li'+(cls.trim()?' class="'+cls.trim()+'"':"")+' data-cn="'+esc(m.cn)+'">'+
    // The code is a button: click it for the catalog description (Sam: "course
    // descriptions on click of a course title").
    '<button type="button" class="cd" data-desc="'+esc(m.cn)+'" aria-expanded="'+(open?"true":"false")+
      '" title="Show the catalog description">'+esc(m.n)+"</button>"+
    (info&&info.title?'<span class="mt">'+esc(info.title)+"</span>":"")+
    '<span class="co" title="'+esc(m.c)+'">'+esc(shortCollege(m.c))+"</span>"+
    (info&&info.units!=null?'<span class="un">'+esc(unitsWord(info.units))+"</span>":"")+
    (moved?' <span class="chip ok">moved here</span>':"")+
    (shared?' <span class="chip warn" title="Control number '+esc(m.cn)+
      ' names '+coursesOn(m.cn).length+' different courses, so the '+
      'CN: write key cannot say which one to move.">shared key</span>':"")+
    '<button class="mv" type="button" data-cn="'+esc(m.cn)+'" data-d="'+esc(m.d||"")+'" data-code="'+esc(m.n)+
    '" data-col="'+esc(m.c)+'"'+(shared?' data-shared="1"':"")+' title="Pick this course up and drop it on the identity it belongs to">Drag…</button>';
  if(open){
    if(info && info.desc) h+='<div class="mdesc">'+esc(info.desc)+"</div>";
    else if(st==="ok") h+='<div class="mdesc none">No catalog description for this course.</div>';
    else if(st==="loading") h+='<div class="mdesc none">Loading the catalog description…</div>';
    else if(st==="blocked") h+='<div class="mdesc none">Catalog descriptions need the page SERVED, not opened '+
      'from a file. Run <code>python3 -m http.server 8000</code> in the repo root and open '+
      '<code>http://localhost:8000/prototype/skyview.html</code>.</div>';
    else h+='<div class="mdesc none">The descriptions for this discipline did not load from any of the '+
      'places they are published ('+esc(DESC_BASES.join(", "))+').</div>';
  }
  return h+"</li>";
}
/* The identity's own `n` is NOT a college count — it comes from whichever field
 * minted the row, and it disagrees with the members actually carried on a fifth
 * of identities. Both are shown and neither is silently preferred. */
function renderNode(){
  var nd=selNode, isl=selIsl;
  var el=document.getElementById("u-detail");
  var mine=membersOf(nd.i), total=mine.length;
  // A course a curator just moved here is the row they are looking for: it
  // leads the list, ahead of the page cap (MUS 180 carries 850 courses; a row
  // appended at the end of that would be on a page nobody opens).
  mine.sort(function(a,b){ return ((movedTo[a.cn]===nd.i)?0:1) - ((movedTo[b.cn]===nd.i)?0:1); });
  /* ⭐ THE CLICK PATH BACK. A reader who opened this identity from the
   * discipline panel had no way to return to it: the token chips look like
   * breadcrumbs but only their × is a control, and the ⋮ menu's "doors out" are
   * doors to other VIEWS, not a step up. Re-searching the discipline by name
   * was the only route (observed 2026-09-06). Escape does it too now that the
   * cursor is synced, but only while the canvas holds focus — and after a click
   * in the panel it does not. A word, not a glyph. */
  var h=(isl?'<p class="sub" style="margin:0 0 .4em"><button type="button" class="linkish" '+
    'id="u-back-isl">Back to '+esc(isl.d)+'</button></p>':"")+
    "<h3>"+esc(nd.t||nd.i)+"</h3>"+
    /* ⭐ THE OUTLINE HAS A BUTTON, NOT ONLY A DOUBLE-CLICK. Double-click opens
     * it (Sam's ruling, 2026-09-06), but this file's own dblclick handler says
     * why that cannot be the only route: "a double-click is undiscoverable and
     * not reachable from a keyboard". A word, per the glyph rule. */
    '<p class="row" style="margin:0 0 .5em"><button class="btn small primary" type="button" '+
      'id="u-open-outline">Open the course outline</button></p>'+
    "<p>"+chipFor(nd)+' <span class="sub">'+esc(nd.i)+"</span> · "+esc(isl.d)+" · "+
    esc(unitsWord(nd.u))+" · "+num(total)+" college course"+(total===1?"":"s")+" carried"+
    (nd.a?' · <span class="chip mut" title="A single college\'s course that has not been '+
      'clustered with anything yet. It asserts no equivalence, so it cannot be over-merged '+
      '— it can only be dragged onto the identity it belongs with.">stand-alone</span>':"")+
    (nd.n && nd.n!==total ? ' · <span class="sub" title="The count this row reports '+
      'elsewhere in COBI, from the field that minted it. The carried list is the forward '+
      'join onto the raw COCI course list, which cannot always place every seeded member.">'+
      "row count "+num(nd.n)+"</span>" : "")+
    /* ⭐ ARTICULATION IS ITS OWN SIGNAL, NOT A FUNCTION OF ADOPTION (Sam's
     * ruling 1, 2026-09-05). The map sizes a point by how many colleges teach
     * it, and the two run OPPOSITE: WELD M1061 is taught at 4 colleges and
     * carries 12 articulations; WELD M1109 is taught at 24 and carries 7. So
     * the most-articulated identities are routinely the map's smallest points,
     * and nothing on screen said so. A word, not a badge — the count is the
     * whole message. */
    (nd.ar ? " · "+num(nd.ar)+" articulation"+(nd.ar===1?"":"s") : "")+"</p>";
  // The orbit: where a stand-alone sits and WHY, with the accept verb beside it.
  if(nd.a){
    var par=nd.o?nodeById(nd.o):null;
    if(par){
      var m0=mine[0];
      h+='<div class="orbit"><p>In orbit around <strong>'+esc(par.nd.t||par.nd.i)+'</strong> '+
        '<span class="sub">('+esc(par.nd.i)+")</span> because the two share "+esc(whyWords(nd.w))+"."+
        (nd.h?(nd.h==="(no discipline yet)"
          ? " This course carries no discipline of its own; the closest match in the whole reference is here."
          : " This course is filed under <strong>"+esc(nd.h)+"</strong>; the closest match in the whole reference is here, in "+esc(isl.d)+".")
          :"")+
        ' A suggestion only — nothing is written until you move it.</p>'+
        '<p class="row">'+(m0 && !emptied(nd)
          ? '<button class="btn small primary" type="button" id="u-accept" data-cn="'+esc(m0.cn)+'" data-d="'+esc(m0.d||"")+
            '" data-code="'+esc(m0.n)+'" data-col="'+esc(m0.c)+'" data-to="'+esc(par.nd.i)+'">Move '+esc(m0.n)+' into '+esc(par.nd.i)+'</button> '
          : "")+
        '<button class="btn small" type="button" data-go="'+esc(par.nd.i)+'">Show '+esc(par.nd.i)+'</button></p></div>';
    } else {
      h+='<div class="orbit rim"><p>On the rim of <strong>'+esc(isl.d)+'</strong>: no identity in this '+
        'discipline shares a local subject code or title words with it. Drag it onto the identity it '+
        'belongs with — in this discipline or, after pulling another discipline alongside, in that one.</p></div>';
    }
  }
  if(!roster || !Object.keys(roster).length){
    h+='<p class="empty">No member payload loaded — ccr_universe_members.json is missing, '+
       'so no course can be dragged. This is not the same as an identity having no courses.</p>';
  } else if(!total){
    h+='<p class="empty">No college courses are carried for this identity'+
       (memberSource==="sample"?' in the prototype sample.':'.')+
       (nd.a&&emptied(nd)?' Its one course was moved — see the write below the map.':'')+'</p>';
  } else {
    var q=memFilter.trim().toLowerCase();
    var shown=q ? mine.filter(function(m){
      var info=courseInfo(isl,m);
      return (m.n+" "+m.c+" "+(info?info.title:"")).toLowerCase().indexOf(q)>=0; }) : mine;
    var capped=shown.slice(0, MEMBER_PAGE);
    if(total>6)
      h+='<p><input type="search" id="u-mfilter" placeholder="Filter these courses — code, title or college"'+
         ' value="'+esc(memFilter)+'" style="width:100%;max-width:22em"></p>';
    else if(q) h+='<p class="sub">Filtered to “'+esc(memFilter)+'”. '+
         '<button type="button" class="linkish" id="u-mclear">Show all '+num(total)+'</button></p>';
    // A capped list must never read as a census — say what is off the end.
    if(capped.length<shown.length || shown.length<total){
      h+='<p class="sub">Showing '+num(capped.length)+' of '+num(shown.length)+
         (shown.length<total?' matching ('+num(total)+' carried)':'')+
         '. Filter to reach the rest.</p>';
    }
    h+='<p class="sub">Click a course number for its catalog description. Drag a course onto '+
       'a circle on the map, or press <strong>Drag…</strong> and then click the destination.</p>';
    h+='<ul class="mlist">'+capped.map(function(m){ return memberRow(m, isl, nd, movedTo[m.cn]===nd.i); }).join("")+"</ul>";
    var st=descState[isl&&isl.sh];
    if(st==="loading") h+='<p class="empty">Loading course titles and descriptions…</p>';
  }
  // The stand-alone courses in orbit around this identity: the map's suggestions,
  // each with the verb that accepts it.
  var orbs=nd.a?[]:orbitsOf(nd.i);
  if(orbs.length){
    var cap=40;
    h+='<h4 style="margin:.9em 0 .3em">Stand-alone courses in orbit ('+num(orbs.length)+')</h4>'+
      '<p class="sub">Each shares something with this identity; none is a member yet. '+
      '<strong>Move here</strong> accepts the suggestion for that one course.</p>'+
      '<ul class="orbits">'+orbs.slice(0,cap).map(function(s){
        var m=(roster&&roster[s.i]||[])[0];
        var gone=emptied(s);
        var info=m?courseInfo(isl,m):null;
        var shared=m&&coursesOn(m.cn).length>1;
        return '<li'+(gone?' class="moved"':"")+'>'+
          '<button type="button" class="cd" data-go="'+esc(s.i)+'" title="Open this course">'+esc(m?m.n:s.i)+"</button>"+
          '<span class="mt">'+esc(s.t||(info&&info.title)||"")+"</span>"+
          (m?'<span class="co" title="'+esc(m.c)+'">'+esc(shortCollege(m.c))+"</span>":"")+
          '<span class="un">'+esc(unitsWord(s.u))+"</span>"+
          '<span class="why">'+esc(whyWords(s.w))+"</span>"+
          (gone?' <span class="chip ok">moved</span>':
           m?(shared?'<span class="chip warn" title="'+esc(sharedKeyReason(m.cn,m.n).replace(/<[^>]+>/g,""))+'">shared key</span>':
             '<button class="btn small accept" type="button" data-accept="1" data-cn="'+esc(m.cn)+'" data-d="'+esc(m.d||"")+
             '" data-code="'+esc(m.n)+'" data-col="'+esc(m.c)+'" data-to="'+esc(nd.i)+'">Move here</button>'):"")+
          "</li>";
      }).join("")+"</ul>"+
      (orbs.length>cap?'<p class="sub">Showing '+cap+' of '+num(orbs.length)+' — zoom in on the map for the rest.</p>':"");
  }
  /* The level ladder: the same course at beginning, intermediate and advanced,
   * in that order, with the unmarked last under their own heading. Adoption
   * orders within a rung, as it does everywhere else on this surface. */
  var sims=similarTo(nd, isl);
  if(sims.length){
    var SIM_CAP=24;
    var groups={}, order=LEVEL_ORDER.concat(["Level not stated"]);
    order.forEach(function(L){ groups[L]=[]; });
    sims.forEach(function(x){ groups[courseLevel(x.nd.t)||"Level not stated"].push(x); });
    /* ⚠️ EVERY RUNG GETS A SHARE, OR THE LADDER IS ONE RUNG. Filling the cap in
     * order gave the first level all 24 slots and the reader never saw that an
     * intermediate or advanced version existed — which is the one thing the
     * section is for. Same shape as the suggestion budget: a floor each, then
     * whatever a rung cannot fill flows to the others. */
    var present=order.filter(function(L){ return groups[L].length; });
    var quota={}, spare=SIM_CAP;
    present.forEach(function(L){
      quota[L]=Math.min(groups[L].length, Math.max(3, Math.floor(SIM_CAP/present.length)));
      spare-=quota[L];
    });
    for(var pass=0; pass<2 && spare>0; pass++)
      present.forEach(function(L){
        var add=Math.min(spare, groups[L].length-quota[L]);
        if(add>0){ quota[L]+=add; spare-=add; }
      });
    var shown=0, body="";
    order.forEach(function(L){
      var g=groups[L];
      if(!g.length) return;
      g.sort(function(a,b){ return (b.nd.n||0)-(a.nd.n||0) || b.score-a.score; });
      var take=g.slice(0, quota[L]||0); if(!take.length) return; shown+=take.length;
      body+='<li class="sim-h"><span class="sub">'+esc(L)+'</span></li>'+
        take.map(function(x){
          return '<li><button type="button" class="ttl linkish" data-go="'+esc(x.nd.i)+'">'+
            esc(x.nd.t||x.nd.i)+'</button> '+chipFor(x.nd)+
            '<div class="sub">'+esc(x.nd.i)+" · "+num(x.nd.n||0)+" member"+((x.nd.n||0)===1?"":"s")+
            (x.nd.u!=null?" · "+esc(unitsWord(x.nd.u)):"")+
            (x.nd.ar?" · "+num(x.nd.ar)+" articulation"+(x.nd.ar===1?"":"s"):"")+"</div></li>";
        }).join("");
    });
    var carrying = drag && drag.kind==="course";
    h+='<h4 style="margin:.9em 0 .3em">Similar courses in '+esc(isl.d)+" ("+num(sims.length)+')</h4>'+
      '<p class="sub">'+(carrying
        ? 'Carrying <strong>'+esc(drag.code)+'</strong> — click any course below to move it there. '+
          '<kbd>Esc</kbd> puts it back.'
        : 'Courses here whose titles share most of their words with this one, '+
          'beginning first. A level comes from the title; where the title does not say, it is not guessed.')+'</p>'+
      '<ul class="idlist sim">'+body+"</ul>"+
      (sims.length>shown?'<p class="sub">Showing '+num(shown)+' of '+num(sims.length)+'.</p>':"");
  }
  el.innerHTML=h;
  wireRowClicks(el.querySelector("ul.idlist.sim"));
  var bk=document.getElementById("u-back-isl");
  if(bk) bk.addEventListener("click", function(){
    selNode=null; showIsland(isl); draw();
  });
  var oo=document.getElementById("u-open-outline");
  if(oo) oo.addEventListener("click", function(){ window.__ccrOutline(nd.i); });
  var f=document.getElementById("u-mfilter");
  if(f) f.addEventListener("input", function(){
    memFilter=f.value; renderNode();
    var g=document.getElementById("u-mfilter");
    if(g){ g.focus(); g.setSelectionRange(g.value.length, g.value.length); }
  });
  var mc=document.getElementById("u-mclear");
  if(mc) mc.addEventListener("click", function(){ memFilter=""; renderNode(); });
  Array.prototype.forEach.call(el.querySelectorAll("[data-desc]"), function(b){
    b.addEventListener("click", function(){
      var cn=b.dataset.desc;
      openDesc[cn]=!openDesc[cn];
      if(openDesc[cn]) loadDesc(isl, function(){ if(selNode===nd) renderNode(); });
      renderNode();
    });
  });
  /* ⭐ A CARRIED COURSE CAN BE DROPPED HERE (Sam, item 4, 2026-09-06). The carry
   * hint has always said "drop it on the identity it belongs to, or click that
   * identity", and until the Similar courses list shipped the panel never held a
   * draggable course and a destination at once — so every move went across the
   * canvas. The destinations are here now; this is what makes them accept one.
   * Navigating away mid-carry was the old behavior and it silently abandoned the
   * move. */
  Array.prototype.forEach.call(el.querySelectorAll("[data-go]"), function(b){
    b.addEventListener("click", function(){
      if(drag && drag.kind==="course" && b.dataset.go!==nd.i){
        applyMove(drag.cn, drag.code, drag.college, b.dataset.go, drag.d);
        return;
      }
      goNode(b.dataset.go);
    });
  });
  Array.prototype.forEach.call(el.querySelectorAll("[data-accept], #u-accept"), function(b){
    b.addEventListener("click", function(){
      applyMove(b.dataset.cn, b.dataset.code, b.dataset.col, b.dataset.to, b.dataset.d);
    });
  });
  Array.prototype.forEach.call(el.querySelectorAll(".mv:not([data-accept])"), function(b){
    function pickUp(){
      if(b.dataset.shared){
        setHint(sharedKeyReason(b.dataset.cn, b.dataset.code, coursesOn(b.dataset.cn)));
        return false;
      }
      drag={kind:"course", cn:b.dataset.cn, d:b.dataset.d, code:b.dataset.code, college:b.dataset.col,
            px:cw()/2, py:ch()/2};
      setHint("Carrying <strong>"+esc(b.dataset.code)+"</strong> — drop it on the identity it "+
              "belongs to, or click that identity. <kbd>Esc</kbd> puts it back. Drag a discipline first if it is far away.");
      draw();
      return true;
    }
    /* A real drag from the panel onto the map: press, move across the canvas,
     * release on a circle. The pointer leaves the panel and the canvas's own
     * pointermove/pointerup take over. Keyboard users press the button (click)
     * and then choose the destination — the same carry, completed by a click. */
    b.addEventListener("pointerdown", function(e){
      if(e.button!==0) return;
      if(pickUp()) { e.preventDefault(); }
    });
    /* ⚠️ THE PANEL HAS TO REPAINT, OR THE DESTINATIONS NEVER SAY THEY ACCEPT ONE.
     * pickUp() sets `drag`, hints and redraws the CANVAS; the Similar courses
     * prose that offers the drop is rendered by renderNode(), so without this
     * the reader is carrying a course and the only list of places to put it
     * still reads as a list of things to go and look at. Caught by the suite.
     * ⚠️ Only on the click and keyboard paths: the pointerdown path is starting
     * a real drag across the canvas, and rebuilding the panel under the pressed
     * pointer would take the button out from under it. */
    b.addEventListener("click", function(){ if(!(drag&&drag.kind==="course")) { if(pickUp()){ renderNode(); cvs.focus(); } } });
    b.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); if(pickUp()){ renderNode(); cvs.focus(); } } });
  });
}
function applyMove(cn, code, college, toId, d){
  var gate=canMove(cn);
  if(!gate.ok){ setHint(sharedKeyReason(cn, code, gate.others)); return; }
  var from=movedTo[cn]||originOf(cn);
  if(from===toId){ setHint("That course is already there."); return; }
  movedTo[cn]=toId;
  moves=moves.filter(function(m){return m.cn!==cn;});
  moves.push({cn:cn, d:d||(byCn[cn]&&byCn[cn].d)||"", code:code, college:college, to:toId, from:from});
  var t=nodeById(toId);
  setHint("Moved <strong>"+esc(code)+"</strong> ("+esc(college)+") to <strong>"+
          esc(t?(t.nd.t||toId):toId)+"</strong>"+(t?" in "+esc(t.isl.d):"")+". Recorded below the map.");
  drawWrites();
  if(selNode) renderNode();
  draw();
}
function drawWrites(){
  var el=document.getElementById("u-writes"); if(!el) return;
  if(!moves.length){ el.innerHTML='<p class="empty">No moves yet.</p>'; return; }
  el.innerHTML='<div class="writes">'+moves.map(function(m){
    return "<div>CN:"+esc(m.cn)+"  merge_into  "+esc(m.to)+"</div>";
  }).join("")+"</div>";
}

/* ══ the views, one menu for all of them ═══════════════════════════════════
 * Sam, 2026-09-05: "The full screen SkyView (which I would like to henceforth
 * refer to as SkyView …). I'd like to have an option to navigate to the
 * comprehensive SkyView (the current one), but I don't want it to open by
 * default." And item 9 (2026-09-04): every view reachable from every other.
 *
 * Five views, ONE menu builder. SkyView is the map alone, filling the window
 * (body.u-solo); the comprehensive view is the same render with the panes
 * below it shown; the other three are the workspace's toggles. The map's top
 * row and every other view's crumbs row render the menu from this function, so
 * a view added here is reachable everywhere at once. The view you are on is
 * NAMED in the list rather than offered: a menu item that leads where you
 * already are is a control that appears to do nothing. */
var curArg="";
var HASH_OF={skyview:"skyview", comprehensive:"comprehensive", disciplines:"disciplines", subjects:"subjects", esl:"esl", how:"how",
            work:"work", outline:"outline"};
var VIEWS=[
  {key:"skyview", id:"u-nav-sky", label:"SkyView",
   title:"The map alone, filling the window",
   go:function(){ window.__ccrUniverse({solo:true}); }},
  {key:"comprehensive", id:"u-nav-comp", label:"Comprehensive view",
   title:"The map with the explanatory panes and the work grid below it",
   go:function(){ window.__ccrUniverse({solo:false}); }},
  {key:"disciplines", id:"u-nav-forest", label:"By discipline",
   title:"Every discipline as a list — identities, stand-alone courses, decisions",
   go:function(){ window.__ccrWorkspace("discipline", {q:boxValue()}); }},
  {key:"subjects", id:"u-nav-subject", label:"By subject",
   title:"Every four-letter Common SUBJ code, and the discipline it belongs to",
   go:function(){ window.__ccrWorkspace("subject", {q:boxValue()}); }},
  {key:"esl", id:"u-nav-esl", label:"ESL packaging",
   title:"The first packaging fold, drawn against today’s data",
   when:eslAvailable,
   go:function(){ window.__ccrWorkspace("esl"); }},
  /* Sam, 2026-09-05: "Add a 'How SkyView Works' item in Plain English with
   * visuals aimed at future faculty reviewers". */
  {key:"how", id:"u-nav-how", label:"How SkyView works",
   title:"A short guide for faculty reviewers: what the shapes mean, how to find your course, how to move one",
   go:function(){ window.__ccrHow(); }}
];
function eslAvailable(){ return !!window.CPL_ATLAS_ESL && typeof window.__ccrEslInto==="function"; }
function boxValue(){ var b=document.getElementById("gq"); return b ? b.value : ""; }
function framed(){ try{ return window.top!==window.self; }catch(e){ return true; } }
function ownUrl(){ return String(location.href).replace(/#.*$/,""); }
/* Framed inside COBI's Common Course Reference tab, the page around this frame
 * listens for these (unified_courses.js) and swaps the frame for the list. */
function tellParent(action){
  try{ window.parent.postMessage({type:"skyview", action:action}, "*"); }catch(e){}
}
function viewsMenuInto(host){
  if(!host) return;
  var items=VIEWS.filter(function(v){ return !v.when || v.when(); }).map(function(v){
    if(v.key===curView)
      return '<span class="u-views-here" aria-current="page" title="'+esc(v.title)+'">'+esc(v.label)+'</span>';
    return '<button class="linkish" type="button" id="'+v.id+'" data-view="'+v.key+'" title="'+esc(v.title)+'">'+esc(v.label)+'</button>';
  });
  /* The CCR TABLE VIEW is COBI's Common Course Reference tab, not a view of this
   * page (item 2, 2026-09-04). Stand-alone it is a link out to that tab's LIST —
   * the tab itself lands on this map, which would be a door onto the room you
   * are in. Framed inside that tab it is a message to the page around the
   * frame, which swaps the frame for the list; and a way to open this page in
   * its own tab, to keep it beside the list. */
  if(framed()){
    items.push('<button class="linkish" type="button" id="u-ccr-list" '+
      'title="Show the Common Course Reference table in this tab">CCR table view</button>');
    items.push('<a class="linkish" id="u-own-tab" href="'+esc(ownUrl())+'" target="_blank" rel="noopener" '+
      'title="Open SkyView in its own browser tab, to keep it beside the list">Open in its own tab ↗</a>');
  } else {
    items.push('<a class="linkish" id="u-ccr-list" href="../index.html#unified-courses/list" target="_blank" rel="noopener" '+
      'title="The Common Course Reference table in COBI — filters, quality flags and the Merge actions">CCR table view ↗</a>');
  }
  /* Inside the map's More panel (host[data-flat]) the list renders FLAT under
   * the panel's own "Go to" heading — a menu inside a menu is a door behind a
   * door. Every other view's crumbs row keeps the Go To details menu. */
  var flat = !!(host.dataset && host.dataset.flat);
  host.innerHTML = flat
    ? '<div class="u-views u-views-flat" id="u-views">'+
        '<div class="u-views-menu" id="u-views-menu" role="group" aria-label="Other views">'+items.join("")+'</div>'+
      '</div>'
    : '<details class="u-views" id="u-views">'+
        '<summary class="linkish" aria-controls="u-views-menu">Go To</summary>'+
        '<div class="u-views-menu" id="u-views-menu" role="group" aria-label="Other views">'+items.join("")+'</div>'+
      '</details>';
  var vw=host.querySelector("#u-views");
  var closeAll=function(){ vw.open=false; var mo=document.getElementById("u-more-menu"); if(mo) mo.open=false; };
  Array.prototype.forEach.call(vw.querySelectorAll("[data-view]"), function(b){
    var v=VIEWS.filter(function(x){ return x.key===b.getAttribute("data-view"); })[0];
    b.addEventListener("click", function(){ closeAll(); if(v) v.go(); });
  });
  var cl=vw.querySelector("#u-ccr-list");
  if(cl && cl.tagName==="BUTTON") cl.addEventListener("click", function(){ closeAll(); tellParent("list"); });
  Array.prototype.forEach.call(vw.querySelectorAll("a.linkish"), function(a){
    a.addEventListener("click", function(){ closeAll(); });
  });
}
window.__ccrViewsMenu = viewsMenuInto;
/* One listener closes ANY open Views menu on a click elsewhere — registered
 * once, because the menu is rebuilt on every render and a listener per build
 * would pile up. A menu left standing over the map is why menus feel broken. */
document.addEventListener("pointerdown", function(e){
  Array.prototype.forEach.call(document.querySelectorAll(".u-views[open], .u-more[open], .u-show[open]"), function(vw){
    if(!vw.contains(e.target)) vw.open=false;
  });
});

/* ── the hash names the view ───────────────────────────────────────────────
 * #skyview (the default) · #comprehensive · #disciplines · #subjects · #esl ·
 * #how, plus two that carry a SUBJECT after the key: #work/<discipline> is one
 * discipline's decision surface and #outline/<identity id> is a course outline
 * of record. A view can be linked to and a reload comes back to it.
 *
 * ⭐ A VIEW SWAP THAT DOES NOT MOVE THE HASH STRANDS THE USER (measured
 * 2026-09-06). discipline() painted over SkyView and never called this, so
 * location.hash still read #skyview with the Welding workspace on screen: Back
 * made no entry, hashchange could not fire, the Views menu disagreed with the
 * screen, and a refresh silently discarded the work. Sam: "there's no way for
 * me to get back now to sky view. I have lost sky view. I am stuck."
 *
 * ⚠️ replaceState FRAMED, pushState STAND-ALONE. An assignment or a push adds an
 * entry to the JOINT session history, which inside COBI's Common Course
 * Reference tab is an entry on COBI's own back button — the hazard the original
 * comment here named, and it still holds. Stand-alone there is no host to
 * confuse and Back is the control he reached for, so a view that carries a
 * subject pushes. Either way the hash tracks the screen, which is what the
 * Views menu, a refresh and a shared link actually read. The way back is a
 * CRUMB in both, because a crumb is visible and Back is not. */
function syncHash(arg){
  if(!curView || !HASH_OF[curView]) return;
  var h="#"+HASH_OF[curView]+(arg ? "/"+encodeURIComponent(arg) : "");
  if(String(location.hash||"")===h) return;
  try{
    if(!window.history) return;
    if(arg && !framed() && history.pushState) history.pushState(null, "", h);
    else if(history.replaceState) history.replaceState(null, "", h);
  }catch(e){}
}
/* The template's views live in another file; this is how they move the route. */
window.__ccrSyncHash=function(view, arg){ curView=view; curArg=arg||""; syncHash(arg); };
function routeKey(){
  var h=String(location.hash||"").replace(/^#/,"").toLowerCase().split(/[\/?]/)[0];
  return HASH_OF[h] ? h : "skyview";
}
/* Everything after the first "/" — the discipline name, or an identity id. */
function routeArg(){
  var m=String(location.hash||"").replace(/^#/,"").split("/").slice(1).join("/").split("?")[0];
  try{ return decodeURIComponent(m); }catch(e){ return m; }
}
window.__ccrRoute=function(){
  if(!window.CPL_CCR_UNIVERSE){ if(typeof window.__ccrForest==="function") window.__ccrForest(); return; }
  var k=routeKey(), arg=routeArg();
  if(k==="comprehensive") window.__ccrUniverse({solo:false});
  else if(k==="disciplines") window.__ccrWorkspace("discipline");
  else if(k==="subjects") window.__ccrWorkspace("subject");
  else if(k==="esl") window.__ccrWorkspace("esl");
  else if(k==="how") window.__ccrHow();
  /* A subject the payload cannot resolve falls back to the map rather than to a
   * blank view — a hand-typed or stale link is a normal thing to arrive with. */
  else if(k==="work" && arg && typeof window.__ccrDiscipline==="function") window.__ccrDiscipline(arg);
  else if(k==="outline" && arg && typeof window.__ccrOutline==="function") window.__ccrOutline(arg);
  else window.__ccrUniverse({solo:true});
};
/* Compare the SUBJECT too, not just the key: #work/Welding and #work/Art are
 * both key "work", so a Back between two work surfaces would otherwise leave
 * the screen on the one the reader just left. */
window.addEventListener("hashchange", function(){
  if(routeKey()!==curView || routeArg()!==curArg) window.__ccrRoute();
});

function setSolo(on, quiet){
  solo=!!on; curView=solo?"skyview":"comprehensive"; curArg="";
  document.body.classList.toggle("u-solo", solo);
  syncHash();
  var slot=document.getElementById("u-views-slot"); if(slot) viewsMenuInto(slot);
  paintWins();                   // the window controls read `solo` (a class toggle is not a re-render)
  if(quiet) return;
  // Entering the frame from halfway down the panes would leave the map scrolled
  // out of a window that no longer scrolls.
  if(solo && (window.scrollY||window.pageYOffset)){ try{ window.scrollTo(0,0); }catch(e){} }
  if(cvs && document.getElementById("u-cvs")===cvs){ fitCanvas(); draw(); }
}

/* ══ the workspace: disciplines, subjects and ESL packaging on ONE tab ═══════
 * Sam, items 6-9 (2026-09-04), restated 2026-09-05: "consolidate the all
 * discipline, subject, and ESL workspaces into one tab with toggles to switch
 * views and a link back to full screen skyview."
 *
 * ⚠️ HIS "SUBJECT" IS THE SUBJ4 GRAIN. "All disciplines" and "Disciplines as a
 * list" both listed disciplines and differed only in form, so consolidating
 * them was not the whole ask: "view by subject" is the four-letter Common SUBJ
 * code an identity is keyed by (KINE, ATHL, SPAN) — the grain of COBI's Common
 * Subjects Reference tab — which no view here carried. The subject rows are
 * read off the identity ids on the map, which after the 2026-09-03 recode ARE
 * the canonical codes, and joined to the seed for the umbrella codes and the
 * authority chips. TOP plays no part (Rule 7). */
var WS_MODES={discipline:"By discipline", subject:"By subject", esl:"ESL packaging"};
function wsKey(mode){ return mode==="subject"?"subjects":mode==="esl"?"esl":"disciplines"; }
function wsFilterValue(){ var q=document.getElementById("ws-q"); return q ? q.value : ""; }
window.__ccrWorkspace=function(mode, opts){
  opts=opts||{};
  if(!U){ U=window.CPL_CCR_UNIVERSE; A=window.CPL_ATLAS_DATA||null; spreadUniverse(U); }
  if(!U){ if(typeof window.__ccrForest==="function") window.__ccrForest(); return; }
  mode = WS_MODES[mode] ? mode : "discipline";
  if(mode==="esl" && !eslAvailable()) mode="discipline";
  if(!authority) loadAuthority();
  window.__crumbs([{label:"Disciplines and subjects"}], {view: wsKey(mode)});
  syncHash();
  var host=document.getElementById("view"); if(!host) return;
  host.innerHTML=
    '<div class="ws-head"><h1>Disciplines and subjects</h1>'+
      '<button class="btn primary" type="button" id="ws-sky" title="Back to the map, filling the window">Back to SkyView</button></div>'+
    /* Item 6: "a line explaining the difference." */
    '<p class="ws-lede">A <strong>discipline</strong> is the faculty area an island on the map is drawn for '+
      '— Kinesiology, Foreign Languages, Administration of Justice. A <strong>subject</strong> is the '+
      'four-letter Common SUBJ code that keys each course identity — KINE, SPAN, CRIM. Every subject '+
      'belongs to exactly one discipline; a discipline usually has one subject and may carry several.</p>'+
    '<div class="ws-bar"><span class="u-seg ws-seg" role="group" aria-label="Choose a view">'+
      Object.keys(WS_MODES).filter(function(m){ return m!=="esl" || eslAvailable(); }).map(function(m){
        return '<button class="btn mode" type="button" id="ws-'+m+'" data-mode="'+m+'" aria-pressed="'+
          (m===mode?"true":"false")+'">'+WS_MODES[m]+'</button>';
      }).join("")+'</span></div>'+
    '<div id="ws-body"></div>';
  document.getElementById("ws-sky").onclick=function(){ window.__ccrUniverse({solo:true}); };
  Array.prototype.forEach.call(host.querySelectorAll(".ws-seg [data-mode]"), function(b){
    b.onclick=function(){
      var m=b.getAttribute("data-mode");
      if(m!==mode) window.__ccrWorkspace(m, {q:wsFilterValue()});
    };
  });
  var body=document.getElementById("ws-body");
  wsPaint=null;
  if(mode==="esl") window.__ccrEslInto(body, {embedded:true});
  else wsTable(body, mode, opts.q);
};

function wsTable(body, mode, seed){
  var isS = mode==="subject";
  var rows = isS ? subjectRows() : disciplineRows();
  body.innerHTML=
    '<div class="ws-tools"><label for="ws-q">Filter</label>'+
      '<input id="ws-q" type="search" placeholder="'+(isS
        ? 'Filter subjects — e.g. KINE, span, weld'
        : 'Filter disciplines — e.g. english, welding, nursing')+'"></div>'+
    '<p class="tag" id="ws-count" aria-live="polite"></p>'+
    '<div class="tblwrap" tabindex="0" role="region" aria-label="'+(isS?'Subjects':'Disciplines')+'">'+
    '<table class="uc-like ws-table"><colgroup>'+(isS
      ? '<col style="width:11%"><col style="width:27%"><col style="width:9%"><col style="width:10%"><col style="width:26%"><col style="width:17%">'
      : '<col style="width:29%"><col style="width:22%"><col style="width:9%"><col style="width:10%"><col style="width:9%"><col style="width:21%">')+
    '</colgroup><thead><tr>'+(isS
      ? '<th scope="col">Subject</th><th scope="col">Discipline</th><th scope="col" class="n">Identities</th>'+
        '<th scope="col" class="n">Stand-alone</th><th scope="col">Code standing</th><th scope="col">Open</th>'
      : '<th scope="col">Discipline</th><th scope="col">Common SUBJ</th><th scope="col" class="n">Identities</th>'+
        '<th scope="col" class="n">Stand-alone</th><th scope="col" class="n">Decisions</th><th scope="col">Open</th>')+
    '</tr></thead><tbody id="ws-rows"></tbody></table></div>'+
    '<p class="ws-note">'+(isS
      ? 'Subjects are read off the identity ids on the map. A code under a discipline whose Common SUBJ is '+
        'another code is either an umbrella code (Foreign Languages carries one per language) or a row minted '+
        'under the wrong prefix; the standing column says which. COBI’s Common Subjects Reference tab is '+
        'the authority; this list is the map’s view of it.'
      : 'Identities and stand-alone courses are counted on the map; decisions are the grouped decision '+
        'view’s count, and that view is built for a few disciplines so far.')+'</p>';
  var qEl=document.getElementById("ws-q"), rowsEl=document.getElementById("ws-rows"),
      cEl=document.getElementById("ws-count"), CAP=400, noun=isS?"subject":"discipline";
  function paint(){
    var q=String(qEl.value||"").trim().toLowerCase();
    var hit=rows.filter(function(r){ return !q || r.key.indexOf(q)>=0; });
    cEl.textContent = q
      ? num(hit.length)+" of "+num(rows.length)+" "+noun+"s match “"+q+"”"
      : num(rows.length)+" "+noun+"s · "+num(U.counts.identities)+" identities · "+
        num(U.counts.stand_alone)+" stand-alone courses";
    if(!hit.length){
      rowsEl.innerHTML='<tr><td colspan="6" class="empty">Nothing matches “'+esc(q)+'”. The map still '+
        'holds every '+noun+' — clear the filter to see them all.</td></tr>';
      return;
    }
    rowsEl.innerHTML=hit.slice(0,CAP).map(isS?subjectRowHtml:disciplineRowHtml).join("")+
      (hit.length>CAP ? '<tr><td colspan="6" class="empty">Showing the first '+CAP+' of '+num(hit.length)+
        ' — narrow the filter to see the rest.</td></tr>' : "");
    Array.prototype.forEach.call(rowsEl.querySelectorAll("[data-map]"), function(b){
      b.onclick=function(){
        var I=U.islands[+b.getAttribute("data-map")]; if(!I) return;
        window.__ccrUniverse();
        window.__ccrGoSuggestion({kind:"subject", isl:I});
      };
    });
    Array.prototype.forEach.call(rowsEl.querySelectorAll("[data-work]"), function(b){
      b.onclick=function(){ window.__ccrDiscipline(b.getAttribute("data-work")); };
    });
    Array.prototype.forEach.call(rowsEl.querySelectorAll("[data-subj]"), function(b){
      b.onclick=function(){ window.__ccrShowSubject(b.getAttribute("data-subj")); };
    });
  }
  // The seed arrives after the first paint on a cold page; the standing and
  // Common SUBJ columns fill in when it does, if this table is still on screen.
  wsPaint=function(){ if(document.getElementById("ws-rows")===rowsEl) paint(); };
  qEl.value=String(seed==null?"":seed);
  qEl.oninput=paint;
  paint();
  qEl.focus();
}
function noDiscipline(name){ return /no discipline yet/i.test(String(name||"")); }
function chipsHtml(a){
  if(a.chips.length) return a.chips.map(function(c){
    return '<span class="chip cid" title="The '+esc(c.system)+' subject code for these courses; the Common SUBJ stays four letters (rule 3, 2026-09-03)">'+esc(c.system+" "+c.code)+'</span>';
  }).join(" ");
  if(a.source==="ccn") return '<span class="ws-note">the CCN code</span>';
  if(a.source==="c-id") return '<span class="ws-note">the C-ID code</span>';
  return "";
}
function proposedHtml(a){
  return a.flag==="proposed"
    ? ' <span class="chip mut" title="No C-ID or CCN code names this discipline yet; the CSR proposes this one (item 18, 2026-09-03)">proposed</span>' : "";
}
function disciplineRows(){
  var meta={}; if(A && A.disciplines) A.disciplines.forEach(function(d){ meta[d.name]=d; });
  return U.islands.map(function(I, i){
    var m=meta[I.d]||null, a=authority&&authority[I.d];
    return {key:(I.d+" "+(a?a.cs:"")).toLowerCase(), name:I.d, i:i, n:I.n||0, sa:I.sa||0,
            dec:m?m.decisions:null, work:hasWorkSurface(I)};
  }).sort(function(a,b){ return b.n-a.n || a.name.localeCompare(b.name); });
}
function disciplineRowHtml(r){
  var a=authority&&authority[r.name], cs;
  if(noDiscipline(r.name)) cs='<span class="ws-note">needs a discipline first</span>';
  else if(!authority) cs='<span class="ws-note">loading…</span>';
  else if(!a) cs='<span class="ws-note">no seed entry</span>';
  else cs='<strong>'+esc(a.cs)+'</strong> '+chipsHtml(a)+proposedHtml(a);
  return '<tr><td>'+esc(r.name)+'</td><td>'+cs+'</td>'+
    '<td class="n">'+num(r.n)+'</td><td class="n">'+num(r.sa)+'</td>'+
    '<td class="n">'+(r.dec==null?'':num(r.dec))+'</td>'+
    '<td><button class="btn small" type="button" data-map="'+r.i+'">On the map</button>'+
      (r.work ? ' <button class="btn small" type="button" data-work="'+esc(r.name)+'">Decisions</button>' : '')+
    '</td></tr>';
}
/* ── the subject grain ──────────────────────────────────────────────────────
 * An identity's id leads with its Common SUBJ ("KINE M1750", "ENGL C1000",
 * "AJ 120"); the three legacy anchors read "M-ID HOSP 102" and take the second
 * token. Every point on the map is counted, stand-alones under their own code. */
function subjCode(id){
  var t=String(id||"").trim().split(/\s+/), c=t[0]||"";
  if((c==="M-ID"||c==="C-ID"||c==="CCN") && t.length>1) c=t[1];
  return c.toUpperCase();
}
function subjectIndex(){
  if(subjIdx) return subjIdx;
  var by={};
  U.islands.forEach(function(I){
    I.p.forEach(function(p){
      var c=subjCode(p.i); if(!c) return;
      var r=by[c]||(by[c]={code:c, n:0, sa:0, disc:{}});
      var d=r.disc[I.d]||(r.disc[I.d]={n:0, sa:0, isl:I});
      if(p.a){ r.sa++; d.sa++; } else { r.n++; d.n++; }
    });
  });
  Object.keys(by).forEach(function(c){
    var r=by[c];
    var names=Object.keys(r.disc).sort(function(a,b){
      return (r.disc[b].n+r.disc[b].sa)-(r.disc[a].n+r.disc[a].sa) || a.localeCompare(b);
    });
    r.home=names[0]; r.homeIsl=r.disc[r.home].isl; r.others=names.slice(1);
  });
  subjIdx=by;
  return by;
}
window.__ccrSubjectIndex = subjectIndex;
function subjectRows(){
  var by=subjectIndex();
  return Object.keys(by).map(function(c){
    var r=by[c];
    return {key:(c+" "+r.home).toLowerCase(), code:c, n:r.n, sa:r.sa, home:r.home, others:r.others, rec:r};
  }).sort(function(a,b){ return b.n-a.n || b.sa-a.sa || a.code.localeCompare(b.code); });
}
function standingHtml(r){
  if(noDiscipline(r.home)) return 'no discipline yet';
  if(!authority) return '<span class="ws-note">loading…</span>';
  var a=authority[r.home];
  if(!a) return '<span class="ws-note">no seed entry for '+esc(r.home)+'</span>';
  if(a.cs===r.code) return 'the Common SUBJ of '+esc(r.home)+' '+chipsHtml(a)+proposedHtml(a);
  if(a.umbrella.indexOf(r.code)>=0)
    return 'an umbrella code under '+esc(r.home)+' <span class="ws-note">(Common SUBJ '+esc(a.cs)+')</span>';
  return 'not '+esc(r.home)+'’s code <span class="ws-note">(its Common SUBJ is '+esc(a.cs)+')</span>';
}
function subjectRowHtml(r){
  var others=r.others.length
    ? ' <span class="ws-note">also '+r.others.slice(0,3).map(function(n){
        return esc(n)+' ('+num(r.rec.disc[n].n+r.rec.disc[n].sa)+')';
      }).join(", ")+(r.others.length>3?' and '+(r.others.length-3)+' more':'')+'</span>'
    : '';
  return '<tr><td><strong>'+esc(r.code)+'</strong></td><td>'+esc(r.home)+others+'</td>'+
    '<td class="n">'+num(r.n)+'</td><td class="n">'+num(r.sa)+'</td>'+
    '<td>'+standingHtml(r)+'</td>'+
    '<td><button class="btn small" type="button" data-subj="'+esc(r.code)+'">On the map</button></td></tr>';
}
/* A subject on the map: fly to the discipline that carries most of it and ring
 * its identities — up to RING_MAX, past which the hint's count says more than
 * the rings would. The rings are the same searchHits a search draws. */
window.__ccrShowSubject=function(code){
  if(!U) return false;
  var r=subjectIndex()[String(code||"").trim().toUpperCase()]; if(!r) return false;
  window.__ccrUniverse();
  var home=r.homeIsl;
  searchHits=[]; searchTerm=r.code.toLowerCase();
  U.islands.forEach(function(I){ I.p.forEach(function(p){
    if(!p.a && subjCode(p.i)===r.code) searchHits.push({id:p.i, x:p.x+(I.dx||0), y:p.y+(I.dy||0), isl:I, nd:p});
  }); });
  var ringed=searchHits.length>0 && searchHits.length<=RING_MAX;
  if(!ringed) searchHits=[];
  flyTo(home.x+(home.dx||0), home.y+(home.dy||0), SUBJECT_ZOOM);
  selIsl=home; selNode=null; showIsland(home);
  var where=r.others.length
    ? ", most of them under <strong>"+esc(r.home)+"</strong>; also "+r.others.slice(0,3).map(function(n){
        return esc(n)+" ("+num(r.disc[n].n+r.disc[n].sa)+")"; }).join(", ")
    : " under <strong>"+esc(r.home)+"</strong>";
  setHint("Subject <strong>"+esc(r.code)+"</strong> — "+num(r.n)+" identit"+(r.n===1?"y":"ies")+
    " and "+num(r.sa)+" stand-alone course"+(r.sa===1?"":"s")+where+"."+
    (ringed ? " The identities are ringed in red." : r.n ? " Too many to ring; search a title or number to find one." : ""));
  draw();
  return true;
};

/* ── the search box goes home when the map does ─────────────────────────────
 * The map's top row BORROWS the page's one search form (item 3 / item 11).
 * Every other view replaces #view wholesale, which would take the borrowed form
 * down with it — and `innerHTML =` DETACHES rather than destroys, so a node
 * nobody still references is simply gone, listeners and all. Putting it back
 * before the replacement is therefore not tidiness; it is the difference
 * between a search box and no search box on four other views.
 *
 * ⚠️ Wrapped centrally rather than called from each view, and that is the whole
 * point: the five entry points live in three files, one of which is a separate
 * module, and the failure mode of a missed call site is invisible until someone
 * navigates. This file is the LAST script the page loads (see boot()), so every
 * global it wraps is already defined. */
function homeSearch(){
  var ms=document.getElementById("msearch");
  if(!ms) return;
  var wrap=document.querySelector(".mast .wrap");
  if(!wrap || ms.parentNode===wrap) return;
  wrap.appendChild(ms);
  /* ⭐ THE SELECTION SURVIVES THE TRIP (Sam, 2026-09-06). This line read
   * `clearTokens(true)` — "the selection belongs to the map" — and setCrumbs()
   * calls homeSearch() on EVERY view entry, so double-clicking through to a work
   * surface threw every pick away before he arrived: "when I go to sky view,
   * it's going to reset sky view… the welding choices I made… I have to start
   * all over." Measured 2026-09-06: three picks in, __ccrTokenKeys() reads []
   * on the Welding surface — the picks were gone on the way OUT, not on the way
   * back. Nothing needed clearing to take the chips off screen: off the map
   * ensureTokenHost() returns null and renderTokens() empties the stray host by
   * itself. So the MODEL is parked, and restoreTokens() paints and re-rings it
   * when the map comes back. */
  renderTokens();                          // host is null off the map: empties the strip
  var lab=ms.querySelector('label[for="gq"]'), box=ms.querySelector("#gq");
  if(lab){
    if(lab.dataset.longLabel) lab.textContent=lab.dataset.longLabel;
    lab.classList.add("sr");                // back to screen-reader-only in the masthead
  }
  if(box) box.removeAttribute("aria-label"); // the visible label is the name again
  var go=ms.querySelector('button[type="submit"]');
  if(go) go.classList.remove("u-search-go");
}
window.__ccrHomeSearch = homeSearch;

/* ══ How SkyView works — the explainer for faculty reviewers (Sam, 2026-09-05) ══
 * Plain words, active voice, no asides. The figures are drawn from the same
 * SYS colors the map uses, so a change to the palette changes the guide. */
function howFig(kind){
  var M=SYS[0], C=SYS[1], N=SYS[2], G=SYS[3];
  function circ(x,y,r,s,extra){ return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+s[1]+'"'+(extra||'')+'/>'; }
  function hollow(x,y,r,s,extra){ return '<circle cx="'+x+'" cy="'+y+'" r="'+(r*0.8)+'" fill="'+s[1]+'" fill-opacity="0.6"'+(extra||'')+'/>'; }
  function sq(x,y){ return '<rect x="'+(x-4)+'" y="'+(y-4)+'" width="8" height="8" fill="#fff" stroke="#0047AB" stroke-width="1.6"/>'; }
  function tether(x1,y1,x2,y2){ return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="rgba(109,40,217,.5)" stroke-width="1.2" stroke-dasharray="2 3"/>'; }
  function label(x,y,t){ return '<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="11" fill="#3A3A36" font-family="Source Sans 3, system-ui, sans-serif">'+esc(t)+'</text>'; }
  if(kind==="island"){
    return '<svg viewBox="0 0 360 200" role="img" aria-label="One island: a large light disc holding dots of several sizes and colours, smaller lighter dots tied to them by dotted lines, and one lighter dot alone at the edge.">'+
      '<circle cx="180" cy="100" r="88" fill="#F7F5F1" stroke="rgba(28,28,26,.18)"/>'+
      circ(180,100,22,M)+circ(140,72,12,C)+circ(220,68,10,M)+circ(150,130,14,N)+circ(224,128,9,G)+circ(210,150,6,M)+
      tether(180,100,120,104)+hollow(120,104,4,M)+tether(180,100,204,112)+hollow(204,112,4,M)+tether(140,72,124,52)+hollow(124,52,4,C)+
      hollow(256,160,4,M)+
      label(180,20,"an island is a discipline")+label(180,190,"the biggest circles carry the most college courses")+
      '</svg>';
  }
  if(kind==="marks"){
    return '<svg viewBox="0 0 640 96" role="img" aria-label="Six marks side by side: a purple dot, a blue dot, a gold dot, a smaller lighter dot on a dotted line, a dot inside a broken ring, and a small square.">'+
      circ(56,36,14,M)+label(56,74,"M-ID")+label(56,88,"our working label")+
      circ(160,36,14,C)+label(160,74,"C-ID")+label(160,88,"official")+
      circ(250,36,14,N)+label(250,74,"CCN")+label(250,88,"official")+
      tether(338,36,372,36)+hollow(338,36,8,M)+circ(378,36,8,M)+label(358,74,"stand-alone")+label(358,88,"in orbit")+
      circ(460,36,9,M)+'<circle cx="460" cy="36" r="14" fill="none" stroke="'+M[1]+'" stroke-width="1.5" stroke-dasharray="5 4"/>'+label(460,74,"noncredit")+label(460,88,"a broken ring")+
      sq(570,36)+label(570,74,"college course")+label(570,88,"under an identity")+
      '</svg>';
  }
  return '<svg viewBox="0 0 360 110" role="img" aria-label="A small dot with an arrow pointing to a large dot.">'+
    hollow(70,50,10,M)+'<path d="M92 50 H228" stroke="#0047AB" stroke-width="2" fill="none" marker-end="url(#arr)"/>'+
    '<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#0047AB"/></marker></defs>'+
    circ(270,50,20,M)+label(70,84,"the course")+label(270,92,"the identity it belongs to")+
    '</svg>';
}
function howHtml(){
  return '<section class="how" aria-labelledby="how-h1">'+
    '<div class="how-head"><h1 id="how-h1">How SkyView works</h1>'+
      '<button class="btn primary" type="button" id="how-open">Open SkyView</button></div>'+
    '<p class="how-lede">SkyView draws the whole Common Course Reference as one map. Each island is a discipline. '+
      'Each circle inside an island is a course identity: one course that several colleges teach under their own numbers. '+
      'Your course sits under one of those circles. SkyView exists so you can find it, see what sits beside it, and move it if it sits under the wrong one.</p>'+
    '<figure class="how-fig">'+howFig("island")+'</figure>'+
    '<h2>What the shapes mean</h2>'+
    '<figure class="how-fig">'+howFig("marks")+'</figure>'+
    '<ul class="how-list">'+
      '<li>A <strong>large dot</strong> is a course identity. Its color says who issued the number: purple for an M-ID, our working label; blue for a C-ID and gold for a CCN, both official statewide numbers; gray for a unified row. The biggest dots carry the most college courses.</li>'+
      '<li>A point that <strong>glows</strong> is a course more than one college teaches. The light is the agreement: colleges have joined it. A stand-alone course does not glow — nobody has joined it yet.</li>'+
    '<li>A <strong>smaller, lighter dot</strong> is a stand-alone course: one college teaches it and no identity claims it yet. It orbits the identity it most resembles, tied to it by a dotted line. The orbit is a suggestion. Nothing changes until someone moves the course.</li>'+
      '<li>A <strong>broken ring</strong> around a dot marks a noncredit course, whatever its color.</li>'+
      '<li>A <strong>small star</strong> is a college course under an identity. Stars appear when you zoom in past 270 percent, and the sidebar lists them at any zoom.</li>'+
    '</ul>'+
    '<h2>Find your course</h2>'+
    '<p>Type a course number, a title or a discipline in the search box. Pick a result and the map flies to it: a discipline lands at 150 percent, a course at 1,000 percent. '+
      'Pick more than one and the map fits them all in view, with each course ringed in red and each discipline outlined in blue. Each pick becomes a chip beside the box; remove a chip to narrow the selection.</p>'+
    '<h2>Read a course</h2>'+
    '<p>Hover a circle for a quick look. Click it and the sidebar opens with the identity\u2019s title, units and number, the college courses under it with their catalog descriptions, and the stand-alone courses in orbit around it. '+
      'The sidebar answers one question: does my course belong here?</p>'+
    '<h2>Move a course</h2>'+
    '<figure class="how-fig">'+howFig("move")+'</figure>'+
    '<p>Choose <strong>Move</strong> at the top, then drag a small dot or a square onto the identity it belongs to. Drag an island to pull it next to another when a course belongs across the border. '+
      'Drag the background to pan, or choose <strong>Pan</strong> to drag from anywhere. Each move becomes one line in the comprehensive view\u2019s <em>What this would write</em> panel; the map itself writes nothing to the shared record, and a curator can delete any line.</p>'+
    '<h2>Choose what you see</h2>'+
    '<p><strong>Show</strong> narrows the map by credit status, by identity system, by kind of point, and by whether the college courses under an identity are drawn. '+
      'Scroll to zoom, or use <strong>Out</strong> and <strong>In</strong>; the buttons zoom on what you searched for or selected. <strong>Reset</strong> returns to the whole map. '+
      '<strong>Sidebar</strong> shows or hides the details panel. <strong>Legend</strong>, at the lower right of the map, folds the key away.</p>'+
    '<h2>From the keyboard</h2>'+
    '<p><kbd>Tab</kbd> steps through disciplines, <kbd>Enter</kbd> opens one, <kbd>Esc</kbd> steps back out, the arrow keys pan, <kbd>+</kbd> and <kbd>-</kbd> zoom.</p>'+
    '<h2>What a reviewer checks</h2>'+
    '<ol class="how-steps">'+
      '<li>Find your course.</li>'+
      '<li>Read the identity it sits under and the other colleges\u2019 courses beside it.</li>'+
      '<li>If it belongs there, you are done.</li>'+
      '<li>If it does not, move it to the identity it matches, or note the course number for the curator.</li>'+
    '</ol>'+
  '</section>';
}
/* ══ THE COURSE OUTLINE OF RECORD ═══════════════════════════════════════════
 * Sam's ruling, 2026-09-06: "Double click should open the course outline of
 * record work surface we prototyped last session — not sure if we ever put it
 * into production." It was never put into production. Planned three times,
 * cleared three times, built zero times.
 *
 * WHAT IT IS FOR. The guiding question is Sam's (2026-09-05): "would I want
 * this person to have to take my class when they already know this stuff?" —
 * SUFFICIENCY, never equivalence. A faculty reviewer opens a course and needs
 * to see, in one place, what the course actually is across the colleges that
 * teach it, so they can judge a certification against it. Nothing here scores
 * that judgment; a percentage overlap answers nothing.
 *
 * ⭐ LAYERED FROM THE START (Sam's ruling, 2026-09-05). Every section names its
 * own source and its own gaps, and the layers we do not hold yet are PRESENT
 * and empty rather than absent — MAP exhibits and the military credit
 * recommendations are the next two, and a surface that omits them reads as
 * finished when it is not.
 *
 * ⭐ MAP-GENERATED, IN HIS WORDS. A synthetic description may show "as long as
 * it is clearly labeled MAP-Generated for faculty consideration and revision
 * before use". That sentence is printed verbatim on the page, not paraphrased.
 *
 * ⚠️ NOTHING IS WRITTEN FROM THIS PAGE — the lane invariant. A reviewer may
 * rename or re-subject; both STAGE, and a re-mint is queued behind verified +
 * admin-released (Sam's ruling, 2026-09-05), never fired from here.
 *
 * ⚠️ TWO LEVEL AXES, CARRIED, NEITHER DERIVED FROM THE OTHER (his ruling). The
 * COURSE level is read off the course title by courseLevel() — the existing
 * Beg/Int/Adv ladder, reused rather than re-derived. A SKILL's level is read off
 * the skill's OWN words by the same ladder, and where the skill says nothing
 * about level it reads "not stated". Copying the course's level onto its skills
 * would manufacture the second axis out of the first, which is the one thing he
 * ruled against. Most read "not stated" today, and that is the honest state
 * until agency skill statements arrive.
 *
 * ⚠️ WE HOLD ZERO AGENCY SKILL STATEMENTS (measured 2026-09-05: 64 welding
 * credentials, 57 published credit recommendations, not one skill statement).
 * So the skills below are IMPUTED from the catalog descriptions the colleges
 * wrote, and the surface says so in those words. Where they come from when the
 * three sources disagree — published standards, ACE exhibits, the MAP team, all
 * three per Sam — is ruling 9's open follow-up and the only thing blocking this
 * layer. */

/* Function words: a match containing one is a grammatical fragment, not the
 * name of a thing taught. Measured 2026-09-06 on Welding's Blueprint Reading,
 * where an ungated pass returned "applied to the welding" and "is placed on
 * reading" as skills — the kind of output that costs a faculty reader their
 * trust in the whole surface on the first screen. */
var OL_FUNC=(function(){
  var o={}, w=("the a an of in to for and or is are be been being with on at by from as "+
    "that this these those it its their they them there here will may can shall must not "+
    "applied place placed placing provide provides provided develop develops developed "+
    "teach teaches taught include includes included cover covers covered emphasis "+
    "emphasize emphasized associated associate use uses used using various "+
    "types kinds skills course courses student students study studies learn learns learned "+
    "such other others more most some required require requires designed prepare prepares "+
    "preparation continued continuation further additional related relating relates given "+
    "gives hold holds operate operates enter entering special multiple also well into out "+
    "over under between during through each per via upon about above below than then when "+
    "where while who whom whose what which how why all any both few many several one two "+
    "three four five first second third new old same different general common focus focuses "+
    "focused explore explores examine examines introduce introduces topics emphasizes "+
    /* Catalog boilerplate — the sentences every outline carries about
     * enrolment and completion, which are not things a learner can do. */
    "after before seek seeks seeking successful successfully completion completing "+
    "complete completes completed enrolled enrollment prerequisite corequisite "+
    "recommended advisory transfer transferable degree certificate program "+
    "designed offers offered presents present covers taken credit units hours lecture lab").split(" ");
  for(var i=0;i<w.length;i++) o[w[i]]=1;
  return o;
})();
function olWords(t){ return String(t||"").match(/[A-Za-z][A-Za-z\-']+/g)||[]; }
/* ⚠️ A NAME NEVER SPANS A COMMA. Catalog descriptions are full of enumerations —
 * "infection, thermoregulation, pain, tissue integrity, gas exchange" — and a
 * word-only tokenizer turns one into a continuous stream that a sliding n-gram
 * walks straight across. Measured in Chromium 2026-09-06: Fundamentals of
 * Nursing listed "pain tissue integrity gas" as a skill, and Blueprint Reading
 * listed three overlapping windows of one list of drawing types. Splitting on
 * punctuation first costs nothing and removes the whole class. */
function olSegments(t){
  return String(t||"").split(/[.,;:()\[\]\/"\u2013\u2014]|\s-\s/)
    .map(olWords).filter(function(w){ return w.length>=2; });
}
/* Every college course under this identity that carries a catalog description. */
function olDescs(nd, isl){
  var out=[];
  membersOf(nd.i).forEach(function(m){
    var info=courseInfo(isl, m);
    if(info && info.desc) out.push({college:m.c, code:m.n, desc:info.desc, title:info.title, units:info.units});
  });
  return out;
}
/* Dice over content-word sets — the same shape the orbit scorer uses, so the
 * page and the layout builder agree about what "similar" means. */
function olDice(a,b){
  if(!a.length||!b.length) return 0;
  var s={}, hit=0, i;
  for(i=0;i<a.length;i++) s[a[i]]=1;
  for(i=0;i<b.length;i++) if(s[b[i]]===1){ s[b[i]]=2; hit++; }
  return 2*hit/(a.length+b.length);
}
/* ⭐ THE REPRESENTATIVE DESCRIPTION IS CHOSEN, NOT WRITTEN. Every word a
 * faculty reader sees here was written by a college and is attributed to it.
 * The medoid — the description with the highest mean similarity to the others —
 * is the one that says what the rest say. Composing new prose out of several
 * catalogs would read as authoritative while belonging to nobody, which is a
 * worse answer than quoting the college that already said it. The MAP-Generated
 * label covers the ASSEMBLY: the choosing, and the shared-topic list below it. */
function olMedoid(descs){
  if(!descs.length) return null;
  if(descs.length===1) return {pick:descs[0], score:null};
  var sets=descs.map(function(d){
    var seen={}, out=[], w=olWords(d.desc.toLowerCase());
    for(var i=0;i<w.length;i++){ if(w[i].length<3||OL_FUNC[w[i]]||seen[w[i]]) continue; seen[w[i]]=1; out.push(w[i]); }
    return out;
  });
  var best=-1, at=0;
  for(var i=0;i<sets.length;i++){
    var tot=0;
    for(var j=0;j<sets.length;j++) if(i!==j) tot+=olDice(sets[i], sets[j]);
    var mean=tot/Math.max(1, sets.length-1);
    if(mean>best){ best=mean; at=i; }
  }
  return {pick:descs[at], score:best};
}
/* Recurring 2-4 word content phrases, counted by how many COLLEGES name them.
 * A phrase is credited once per college however often that college repeats it,
 * so the count is agreement between institutions rather than verbosity. */
function olPhrases(descs){
  var cnt={};
  descs.forEach(function(d){
    var seen={};
    olSegments(d.desc.toLowerCase()).forEach(function(w){
    for(var i=0;i<w.length;i++){
      /* ⚠️ LONGEST AT EACH POSITION, NOT EVERY LENGTH AT EACH POSITION. Counting
       * all of L=4,3,2 here makes every fragment score at least as high as the
       * phrase containing it, and a count-ordered list then puts the fragment
       * FIRST — measured in Chromium 2026-09-06 on WELD M1109, which listed
       * "shielded metal arc", "arc welding" and "shielded metal arc welding" as
       * three separate skills. Taking the longest valid n-gram and moving past
       * it keeps a name whole. */
      for(var L=4;L>=2;L--){
        if(i+L>w.length) continue;
        var ok=true, seg=[];
        for(var k=0;k<L;k++){
          var x=w[i+k];
          if(x.length<3 || OL_FUNC[x]){ ok=false; break; }
          seg.push(x);
        }
        if(!ok) continue;
        var p=seg.join(" ");
        if(!seen[p]){ seen[p]=1; cnt[p]=(cnt[p]||0)+1; }
        break;                       // this position is spoken for
      }
    }
    });
  });
  var items=Object.keys(cnt).map(function(p){ return {p:p, n:cnt[p]}; });
  /* ⭐ THE LONGEST NAME WINS ITS FAMILY. "gas tungsten arc welding" and
   * "tungsten arc welding" are one skill and the shorter is the fragment, so
   * candidates are considered LONGEST first and a phrase contained in one
   * already kept is dropped. The ratio guard is the exception that keeps this
   * honest: a short phrase named by far more colleges than the long one is a
   * skill in its own right ("shop safety" inside "shop safety practices"), not
   * a fragment of it. */
  items.sort(function(a,b){
    return (b.p.split(" ").length-a.p.split(" ").length) || (b.n-a.n);
  });
  var kept=[];
  items.forEach(function(it){
    for(var i=0;i<kept.length;i++)
      if(kept[i].p.indexOf(it.p)>=0 && it.n <= kept[i].n*1.6) return;
    kept.push(it);
  });
  kept.sort(function(a,b){ return (b.n-a.n) || (b.p.split(" ").length-a.p.split(" ").length); });
  return kept;
}
/* ⚠️ A SKILL'S LEVEL COMES FROM THE SKILL'S OWN WORDS. courseLevel() reads the
 * same Beg/Int/Adv ladder over a title; here it reads the phrase. It returns
 * null for most of them, and "not stated" is the correct answer — inheriting
 * the course's level would fabricate the second axis out of the first. */
function olSkillLevel(phrase){ return courseLevel(phrase) || null; }
/* ⭐ "ONE COLLEGE" MEANT TWO OPPOSITE THINGS (Sam's ruling 5, 2026-09-06).
 * On a course taught at twenty colleges, one naming a skill means it is poorly
 * corroborated. On a course taught at ONE, it means the evidence is complete.
 * Same two words, opposite readings, and a faculty reader had no way to tell
 * which they were looking at.
 *
 * ⚠️ `total` counts the colleges that PUBLISH A DESCRIPTION, not the colleges
 * that teach the course — so it cannot answer his condition on its own. A course
 * taught at five colleges where only one publishes a catalog would have read
 * "the only college teaching it", which is false. `taught` is the member count,
 * and the two cases are separated below because they are different facts:
 * complete evidence, versus the only catalog we can read. */
function olConfWord(n, total, taught){
  if(taught===1) return {w:"the only college teaching it", c:"cid",
    t:"This course is carried by one college, so its catalog is the whole of the evidence — not a thin result."};
  if(total<=1) return {w:"the only college with a description", c:"mut",
    t:"This course is taught at "+taught+" colleges, but only one publishes a catalog description, so nothing can corroborate the skill."};
  if(n>=Math.max(3, total*0.5)) return {w:"most colleges", c:"ok", t:n+" of the "+total+" catalog descriptions name it."};
  if(n>=2) return {w:"some colleges", c:"cid", t:n+" of the "+total+" catalog descriptions name it."};
  return {w:"one college", c:"mut", t:"Named in 1 of the "+total+" catalog descriptions. Kept rather than dropped (Sam's ruling, 2026-09-05: thin skills stay, with a confidence chip)."};
}

/* The thirteen slots a Course Outline of Record carries that no feed we hold
 * supplies. The list is kb/_row_audit.py's MC_NOT_YET_CAPTURED, not a new one
 * invented here: the auditor already scores every identity against exactly
 * these, so the surface renders the structure the repo already measures. They
 * are shown EMPTY rather than omitted — an outline that quietly drops the slots
 * it cannot fill reads as complete, and a reviewer cannot see what is missing.
 * `transferability` and `degree_applicability` are deliberately absent there
 * (TMC territory, not an M-ID's claim) and stay absent here. */
var OL_MC_SLOTS=[
  ["Student learning outcomes","slos"],
  ["Course objectives","course_objectives"],
  ["Content outline","content_outline"],
  ["Methods of evaluation","methods_of_evaluation"],
  ["Methods of instruction","methods_of_instruction"],
  ["Prerequisites","prerequisites"],
  ["Corequisites","corequisites"],
  ["Advisories","advisories"],
  ["Repeatability","repeatability"],
  ["Lecture hours","lecture_hours"],
  ["Lab hours","lab_hours"],
  ["Outside-of-class hours","outside_of_class_hours"],
  ["Sample textbooks","sample_textbooks"]
];
function olLayer(id, title, source, body, opts){
  opts=opts||{};
  return '<section class="ol-layer'+(opts.empty?" empty":"")+'" id="ol-'+id+'">'+
    '<div class="ol-lh"><h2>'+esc(title)+'</h2>'+
      (opts.tag?'<span class="chip '+esc(opts.tagClass||"mut")+'">'+esc(opts.tag)+'</span>':"")+
    '</div>'+
    '<p class="ol-src">'+source+'</p>'+
    body+'</section>';
}
/* The reviewer's own state, per identity, for this browser only. Nothing here
 * reaches kb_curation: a rename is a PROPOSAL until a curator lands it through
 * the curation path, and a re-mint waits on verified + admin-released. */
var olEdits={};
function olState(id){ return olEdits[id] || (olEdits[id]={}); }

window.__ccrOutline=function(id){
  if(!U){ U=window.CPL_CCR_UNIVERSE; A=window.CPL_ATLAS_DATA||null; if(U) spreadUniverse(U); }
  if(!U){ if(typeof window.__ccrForest==="function") window.__ccrForest(); return; }
  var hit=nodeById(id);
  if(!hit){
    /* A stale or hand-typed link is a normal thing to arrive with. Say what
     * happened and leave a way on, rather than painting an empty page. */
    window.__crumbs([{label:"SkyView", go:function(){ window.__ccrUniverse({solo:true}); }},
                     {label:"Course outline"}], {view:"outline"});
    var v0=document.getElementById("view");
    if(v0) v0.innerHTML='<div class="ol"><h1>No course with that id</h1>'+
      '<p class="note"><strong>'+esc(id)+'</strong> is not in the reference this page loaded. '+
      'It may have been re-keyed by a re-mint, or the link may predate the current build. '+
      'Search for the course by name from SkyView.</p></div>';
    window.__ccrSyncHash("outline", id);
    return;
  }
  window.__crumbs([{label:"SkyView", go:function(){ window.__ccrUniverse({solo:true}); }},
                   {label:hit.isl.d, go:function(){ window.__ccrDiscipline(hit.isl.d); }},
                   {label:hit.nd.t||hit.nd.i}], {view:"outline"});
  window.__ccrSyncHash("outline", id);
  var v=document.getElementById("view"); if(!v) return;
  v.innerHTML=olHtml(hit.nd, hit.isl);
  olWire(hit.nd, hit.isl);
  if(window.scrollY||window.pageYOffset){ try{ window.scrollTo(0,0); }catch(e){} }
  /* The descriptions are the whole evidence base for two of the layers, and
   * they arrive per discipline. Render once without them so the page is never
   * blank, then again when they land. */
  loadDesc(hit.isl, function(){
    if(routeKey()!=="outline" || routeArg()!==id) return;   // the reader moved on
    var el=document.getElementById("view"); if(!el) return;
    el.innerHTML=olHtml(hit.nd, hit.isl);
    olWire(hit.nd, hit.isl);
  });
};

function olHtml(nd, isl){
  var st=olState(nd.i);
  var title=st.title || nd.t || nd.i;
  var subject=String(nd.i).split(/\s+/)[0];
  var mine=membersOf(nd.i), total=mine.length;
  var descs=olDescs(nd, isl);
  var lvl=courseLevel(title);
  var loading=descState[isl.sh]==="loading";
  var h='<div class="ol">';

  /* ── the band ─────────────────────────────────────────────────────────── */
  h+='<div class="ol-head">'+
    '<div><h1 id="ol-title">'+esc(title)+'</h1>'+
      '<p class="ol-meta">'+chipFor(nd)+' <span class="sub">'+esc(nd.i)+'</span> · '+
      esc(isl.d)+' · Common SUBJ '+esc(subject)+' · '+esc(unitsWord(nd.u))+' · '+
      num(total)+' college course'+(total===1?"":"s")+
      (nd.ar?' · '+num(nd.ar)+' articulation'+(nd.ar===1?"":"s"):"")+
      (st.title?' · <span class="chip gen" title="A proposed title, staged in this browser only. Nothing is written from this page.">renamed — not saved</span>':"")+
      '</p></div>'+
    /* ⚠️ TWO AXES. This one is the COURSE's, read off the title. */
    '<div class="ol-lvl"><span class="ol-lvl-k">Course level</span>'+
      '<span class="chip '+(lvl?"cid":"mut")+'" title="'+
        (lvl ? 'Read off the course title by the same Beginning/Intermediate/Advanced ladder the map uses.'
             : 'The title names no level. A level is not inferred from the courses underneath — that would be a guess wearing a fact’s clothes.')+
      '">'+esc(lvl||"Level not stated")+'</span></div>'+
    '</div>';

  /* Sam's sentence, verbatim, above everything it governs. */
  h+='<p class="ol-gen"><strong>MAP-Generated</strong> — for faculty consideration '+
     'and revision before use. This outline is assembled from what the colleges '+
     'already publish. Nothing on this page is written back.</p>';

  /* ── layer 1: description ─────────────────────────────────────────────── */
  var med=olMedoid(descs), dbody;
  if(loading) dbody='<p class="empty">Loading the catalog descriptions for '+esc(isl.d)+'…</p>';
  else if(!descs.length) dbody='<p class="empty">None of the '+num(total)+' college course'+
    (total===1?"":"s")+' under this identity carries a catalog description, so there is nothing to draw a description from.</p>';
  else dbody='<blockquote class="ol-desc">'+esc(med.pick.desc)+'</blockquote>'+
    '<p class="ol-attr">'+esc(med.pick.college)+' · '+esc(med.pick.code)+
      (med.score!=null
        ? ' — the description most typical of the '+descs.length+' colleges that publish one'+
          ' <span class="sub" title="Mean Dice similarity of this description’s content words to the other '+
          (descs.length-1)+'. The description that says what the rest say.">('+med.score.toFixed(2)+')</span>'
        : ' — the only catalog description under this identity')+'</p>';
  h+=olLayer("desc","Description",
    (descs.length
      ? 'Quoted from a college catalog and attributed. MAP chose which one; it did not write it. '+
        '<strong>'+descs.length+' of '+num(total)+'</strong> college course'+(total===1?"":"s")+
        ' under this identity publish a description.'
      : 'Drawn from the catalog descriptions of the colleges carrying this course.'),
    dbody, {empty: !descs.length && !loading});

  /* ── layer 2: skills ──────────────────────────────────────────────────── */
  var sk=descs.length?olPhrases(descs):[];
  var strong=sk.filter(function(x){ return x.n>=2; }).slice(0,12);
  var thin  =sk.filter(function(x){ return x.n===1; }).slice(0,10);
  var sbody;
  if(loading) sbody='<p class="empty">Loading…</p>';
  else if(!descs.length) sbody='<p class="empty">No catalog description to impute from.</p>';
  else {
    function skillRow(x){
      var sl=olSkillLevel(x.p), cf=olConfWord(x.n, descs.length, total);
      return '<li><span class="ol-sk">'+esc(x.p)+'</span>'+
        '<span class="chip '+(sl?"cid":"mut")+'" title="'+
          (sl?'Read off this skill’s own words.':'This skill names no level of its own. It does NOT inherit the course’s level — they are separate axes (Sam’s ruling, 2026-09-05).')+
        '">'+esc(sl||"level not stated")+'</span>'+
        '<span class="chip '+cf.c+'" title="'+esc(cf.t)+'">'+esc(cf.w)+'</span></li>';
    }
    sbody=(strong.length?'<ul class="ol-skills">'+strong.map(skillRow).join("")+'</ul>'
                        :'<p class="empty">No topic is named by two or more colleges, so nothing here is corroborated.</p>')+
      (thin.length?'<details class="ol-thin"><summary>Named by a single college ('+thin.length+')</summary>'+
        '<p class="ol-src">Kept rather than dropped, and chipped so the thinness is visible '+
        '(Sam’s ruling, 2026-09-05). One catalog is evidence; it is just not agreement.</p>'+
        '<ul class="ol-skills">'+thin.map(skillRow).join("")+'</ul></details>':"");
  }
  h+=olLayer("skills","Skills a learner would carry out of this course",
    'Imputed from the words the colleges wrote, not supplied by an agency. '+
    'Faculty write outcomes; industry writes skills — this layer translates, so no faculty member has to rewrite a course '+
    '(Sam, 2026-09-05). <strong>We hold no agency skill statements at all</strong>: 57 published welding credit '+
    'recommendations carry agency, title and hours, and not one skill statement.',
    sbody, {tag:"imputed", tagClass:"gen", empty:!strong.length && !thin.length});

  /* ── layer 3: the next layers, present and empty ──────────────────────── */
  h+=olLayer("cpl","Credit for prior learning against this course",
    'The next two layers (Sam’s ruling, 2026-09-05: build it layered from the start). '+
    'They are shown empty rather than left out — an outline that omits the layers it cannot fill yet reads as finished.',
    '<ul class="ol-todo">'+
      '<li><strong>MAP exhibits</strong> — the credentials colleges have already articulated against this course. '+
        'Not wired to this surface yet.</li>'+
      '<li><strong>Military credit recommendations</strong> — the ACE-reviewed training that maps here. '+
        '98% of MAP’s credit-recommendation rows are ACE military; none is joined to an outline yet.</li>'+
    '</ul>'+
    '<p class="ol-src">⚠️ Blocked on one ruling: where an agency skill statement comes from when published '+
    'standards, ACE exhibits and the MAP team disagree. Sam’s answer to <em>which source</em> was '+
    '"All three", and he raised the reconciliation question himself. Nothing else in this outline waits on anything.</p>',
    {tag:"not built", empty:true});

  /* ── layer 4: the record's own slots ──────────────────────────────────── */
  h+=olLayer("mc","The rest of the outline of record",
    'The thirteen slots <code>kb/_row_audit.py</code> already scores every identity against. '+
    'No feed we hold supplies any of them, so every row below reads the same — and that is the '+
    'measurement, not a rendering gap.',
    '<ul class="ol-mc">'+OL_MC_SLOTS.map(function(s){
      return '<li><span class="ol-mc-k">'+esc(s[0])+'</span><span class="chip mut" title="'+
        esc(s[1])+' — state not_yet_captured in the row auditor.">no feed yet</span></li>';
    }).join("")+'</ul>', {tag:"0 of 13", empty:true});

  /* ── layer 5: what a reviewer may do ──────────────────────────────────── */
  h+=olLayer("review","What a reviewer may change",
    'Sam’s ruling, 2026-09-05: reviewers edit titles and re-subject; a re-mint waits until the '+
    'change is <strong>verified</strong> and <strong>admin-released</strong>. Both controls below stage a '+
    'proposal in this browser. Nothing is written from this page.',
    '<p class="row">'+
      '<button class="btn small" type="button" id="ol-rename">Propose a different title</button> '+
      '<button class="btn small" type="button" id="ol-resubject">Propose a different subject</button>'+
      (st.title||st.subject?' <button class="btn small" type="button" id="ol-revert">Drop the proposals</button>':"")+
    '</p>'+
    (st.subject?'<p class="ol-attr">Proposed Common SUBJ: <strong>'+esc(st.subject)+'</strong> '+
      '(was '+esc(subject)+') — staged, not saved.</p>':"")+
    '<p class="ol-src">A re-mint would change this identity’s id, which other files key by. '+
    'It is queued for an administrator, never fired from a reading surface '+
    '(<code>docs/coursecontrolnumber_remint.md</code> is the playbook).</p>');

  /* The colleges, last: the evidence the layers above were drawn from. */
  h+=olLayer("members","The college courses under this identity",
    'The rows every layer above was drawn from.',
    total
      ? '<ul class="ol-mem">'+mine.slice(0,40).map(function(m){
          var info=courseInfo(isl,m);
          return '<li><span class="ol-mem-c">'+esc(m.n)+'</span>'+
            '<span class="ol-mem-t">'+esc((info&&info.title)||"")+'</span>'+
            '<span class="ol-mem-g">'+esc(shortCollege(m.c))+'</span>'+
            (info&&info.desc?'':'<span class="chip mut" title="This college publishes no catalog description for the course.">no description</span>')+
          '</li>';
        }).join("")+'</ul>'+(total>40?'<p class="ol-src">Showing 40 of '+num(total)+'.</p>':"")
      : '<p class="empty">No college course is carried under this identity.</p>');

  return h+'</div>';
}

function olWire(nd, isl){
  var st=olState(nd.i);
  var rn=document.getElementById("ol-rename");
  if(rn) rn.onclick=function(){
    var v=window.prompt("Propose a different title for "+nd.i+".\n\nThis stages a proposal in this browser. Nothing is written.", st.title||nd.t||"");
    if(v==null) return;
    v=String(v).trim();
    if(!v){ delete st.title; } else { st.title=v; }
    window.__ccrOutline(nd.i);
  };
  var rs=document.getElementById("ol-resubject");
  if(rs) rs.onclick=function(){
    var cur=st.subject||String(nd.i).split(/\s+/)[0];
    var v=window.prompt("Propose a different Common SUBJ for "+nd.i+".\n\nFour letters, e.g. WELD. This stages a proposal; a real change is a re-mint, which waits for an administrator.", cur);
    if(v==null) return;
    v=String(v).trim().toUpperCase();
    if(!v){ delete st.subject; }
    else if(!/^[A-Z]{2,4}$/.test(v)){ window.alert("A Common SUBJ is two to four letters."); return; }
    else st.subject=v;
    window.__ccrOutline(nd.i);
  };
  var rv=document.getElementById("ol-revert");
  if(rv) rv.onclick=function(){ delete st.title; delete st.subject; window.__ccrOutline(nd.i); };
}

window.__ccrHow=function(){
  window.__crumbs([{label:"Disciplines and subjects", go:window.__ccrForest},{label:"How SkyView works"}], {view:"how"});
  var v=document.getElementById("view"); if(!v) return;
  v.innerHTML=howHtml();
  var b=document.getElementById("how-open"); if(b) b.onclick=function(){ window.__ccrUniverse({solo:true}); };
  syncHash();
  if(window.scrollY||window.pageYOffset){ try{ window.scrollTo(0,0); }catch(e){} }
};
/* Called by the template's setCrumbs() — the one place every view passes
 * through before it renders: the search box goes home, and the view being
 * entered is named (null for the sub-pages, so their menu offers all five). */
window.__ccrLeaveView = function(view){ homeSearch(); curView = view || null; };
/* Belt to setCrumbs()'s braces: an entry point that renders before it calls
 * __crumbs — or never calls it — still sends the box home here. __ccrDecision
 * is in the list because the comprehensive view embeds the forest, whose
 * "Open this one" reaches it straight from the map. */
["__ccrForest","__ccrDiscipline","__ccrSearch","__ccrEsl","__ccrSubjectList","__ccrDecision"].forEach(function(n){
  var f=window[n];
  if(typeof f!=="function" || f.__homesSearch) return;
  var g=function(){ homeSearch(); return f.apply(this, arguments); };
  g.__homesSearch=true;
  window[n]=g;
});
})();
