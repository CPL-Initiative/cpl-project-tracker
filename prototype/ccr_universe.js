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
/* ⭐ THE SUBJECT-DISCIPLINE EDGE IS READ, NOT VOTED ON (DR-25; Sam's rulings
 * of 2026-09-08, sheet items 1 and 3). Item 1: subject → discipline is the
 * PRIMARY edge and kb/reference/subject_discipline_map.json is its authority.
 * The CSR above answers the other question — which of a discipline's several
 * codes is canonical — and is keyed BY DISCIPLINE, which is what made the loop
 * Sam found: no discipline, so no Common SUBJ, so nothing to look the subject
 * up by. Read live, fail-soft: with no map the table falls back to the vote it
 * always used. */
var EDGE_URLS = window.CPL_SKYVIEW_EDGE_URLS ||
  ["../kb/reference/subject_discipline_map.json", "kb/reference/subject_discipline_map.json"];
var authority=null;          // {discipline: {cs, chips:[{system,code}], source, flag}}
var subjEdge=null;           // {SUBJ4: discipline} — the authority for the edge
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
var SHOW_KEYS=["cr","nc","nce","unrec","cte","aca","ctena","mid","cid","ccn","uni","ident","orbit","rim","members","arty","noart"];
var show={}; SHOW_KEYS.forEach(function(k){ show[k]=true; });
/* The word each switch shows in the menu, the hint and the row's tooltip. */
var SHOW_WORDS={cr:"CR \u2014 credit", nc:"NC \u2014 noncredit", nce:"NCE \u2014 noncredit enhanced", unrec:"Credit status not recorded",
  mid:"M-ID", cid:"C-ID", ccn:"CCN", uni:"Unified", ident:"Identities", orbit:"Orphans in orbit", rim:"Orphans on the rim", members:"College courses",
  arty:"Has articulations", noart:"No articulation recorded",
  /* ── CTE vs academic (Sam, 2026-09-09) ──────────────────────────────────────
   * "Need check boxes added to Show All drop down to show career technical ed
   * (CTE) vs. academic … I believe the TOP codes with an asterisk are all CTE."
   * He is right, and it is one of only TWO uses of TOP this repo trusts (the
   * CLAUDE.md caveat names the CTE flag and the CIP crosswalk by name). The
   * payload carries it as `e`, read from the manual's asterisk via
   * kb/reference/top_categories.json.
   *
   * ⚠️ THREE SWITCHES, NOT TWO — the same shape as `unrec` on credit. 15% of
   * points carry no resolvable TOP code, and folding them into "Academic" would
   * assert something about 7,569 courses that the data does not say. */
  cte:"CTE \u2014 career technical", aca:"Academic", ctena:"CTE status not recorded"};
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
/* ⭐ PARKED COURSES (Sam, 2026-09-09: "when I drag a course as if I am going to
 * merge it with another course ... it stays where I leave it. Currently it snaps
 * back if I don't merge it").
 *
 * A member has no position of its own — drawMembers puts it on a SPOKE of its
 * parent's ring, at an angle derived from its index. So "leave it there" cannot
 * be a screen coordinate: pan, zoom and the sky's turn would all walk away from
 * it. It is stored in the same WORLD frame islands use for their own dx/dy, and
 * projected back through w2s every frame — which is why a parked course holds
 * its place while the sky turns underneath it.
 *
 * Keyed by control number. `isl` is the island whose Jacobian the world point
 * belongs to (null on the flat map, where w2s needs no island). Cleared when the
 * course is actually staged somewhere (applyMove) or put back (unstageMove) —
 * parking is a resting place, never a record of anything. */
var parkedMem={};
function parkClear(cn){ if(cn in parkedMem){ delete parkedMem[cn]; return true; } return false; }
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
  sys2Fill:"#FBF1D8", sys2Stroke:"#8B6800", sys3Fill:"#EFEFEC", sys3Stroke:"#5C5C55",
  /* the articulations light (2026-09-07): the palette's mustard — a gold glow, a
   * thin ring, and a fill for the receiving college's star */
  lit:"#8B6800", litGlow:"rgba(227,179,65,.32)", litFill:"#FBF1D8",
  /* the day sky's rim on every dot (ruling 3): the seal blue, 7.2:1 on the day ground */
  dotRim:"#002F6D"};
var pal=PAL_LIGHT;

/* ══ THE CPL FACE AND THE ARTICULATIONS LIGHT (Sam's rulings 1-3, 2026-09-07) ══
 * "So the CPL exhibits and CRs are the focus more than the Courses." Two
 * controls in the top row, next to Show:
 *
 *   · Courses | CPL — what a point is NAMED BY. The map, the zoom and the
 *     selection do not move; the labels, the hover, the panel and the search
 *     switch to the credential that reaches the point: the curated name, then
 *     the issuing agency AND the training agency where they differ, then what
 *     it earns, then the colleges holding it. ⭐ A POINT NO EXHIBIT REACHES
 *     STAYS DRAWN AND UNLABELED — no gray, no hollow, no "none", each of which
 *     would read as a finding the data cannot support.
 *   · Articulations — a LIGHT, not a filter (the Show menu keeps the filter).
 *     It lights what has a number and leaves the rest drawn as it is. Only
 *     1,490 of 49,896 points carry an articulation count, so marking absence
 *     would claim something about the other 48,406.
 *
 * ⭐ THE CEILING IS THE RECEIVING COURSE, NOT THE MAP. A MAP exhibit reaches a
 * point only through the college course the credit is awarded against, and
 * the CPL face SAYS ITS OWN COVERAGE on the surface — one line under the top
 * row, computed from the payload's counts and never quoted, because a view
 * that quietly shows a fraction of the record looks like the record. ⚠️ Both
 * numbers in that line come from ONE universe (the articulation feed): the
 * sheet's draft paired an identity count with the credit funnel's exhibit
 * count, and the two universes share 570 exhibit ids (kb/_build_ccr_cpl.py).
 *
 * ⚠️ THE PAYLOAD IS FETCHED ON DEMAND. prototype/ccr_cpl.json (~0.5 MB) is
 * asked for the first time the face switches, the light comes on, or a panel
 * opens a course that carries an articulation — never on the first paint. The
 * light itself needs nothing: `ar` is already on every point, counted from the
 * same join, so the lit set and the CPL face never disagree. */
var face="courses";            // "courses" | "cpl" — what a point is named by
var lit=false;                 // the articulations light
var CPL=null, cplState="", cplWaiters=[], cplIslCache=null, cplIndexCache=null;
var CPL_URL = window.CPL_SKYVIEW_CPL_URL || "ccr_cpl.json";
function bindCpl(j){ CPL=j; cplState="ok"; cplIslCache=null; cplIndexCache=null; }

/* ══ THE SKY — WHERE THE READER STANDS (Sam's eight rulings, 2026-09-07) ═════
 * Sam asked whether the 2-D sky could become "a 3-d 360 globe that rotates",
 * saw three rounds of a prototype in one afternoon, and ruled it in: "Looks
 * great! Let's go with it in next session." The eight design calls the port
 * raised went on a sheet (docs/visuals/2026-09-07-eight-calls-before-the-sky-
 * goes-in.html) and he answered yes to all eight. What this block builds:
 *
 *   sky    the reader stands at the center and looks out — the night sky
 *          through a window (a stereographic projection, 4° to 240° across,
 *          so a round island stays round wherever it sits). THE VIEW THAT OPENS.
 *   globe  the sphere seen from outside, at a distance you choose (an
 *          orthographic view; the far half is behind the body).
 *   map    the flat map, exactly as before — the whole at once, and the view
 *          every other surface returns to.
 *
 * ⭐ THE SPHERE IS THE MAP THROUGH A PROJECTION, NOT A SECOND RENDERER. Each
 * discipline island is a locally flat disc on the sphere: its center is placed
 * by kb/_build_ccr_sky.py (prototype/ccr_sky.json — CTE disciplines one side of
 * the sky, academic the other, the mixed ones along the line between; TOP's one
 * sanctioned use, as a display arrangement never a classification), and every
 * point inside it keeps its flat-map offset, mapped through the projection's
 * Jacobian at the island's center (prepSphere). So the drop that lands on a
 * circle (S237), the label placer that drops rather than stacks, the member
 * rings, the keyboard path and the staged-to-move mark all run UNCHANGED on the
 * sphere — they are re-earned by construction, not re-derived — and the drop
 * test's fixture holds on the curve. The prototype's own numbers say why this
 * is enough: a 90-second relaxation put the islands where they are; inside one,
 * the curvature across a 10° cap is a cosine of 0.985.
 *
 * ⚠️ NO THREE.JS. A full Canvas 2D redraw of all 49,896 points measured 18–35 ms
 * in software rendering (S239), so the turn runs on the map's own canvas and
 * the public page gains no third-party script.
 *
 * ⚠️ THE PAYLOAD IS FETCHED ON DEMAND and the sky never waits for it: until
 * prototype/ccr_sky.json arrives (or when it cannot), the islands are placed by
 * the flat map wrapped — x to longitude across 360°, y to latitude across 162°
 * — which is the prototype's committed placement. By kind takes over the moment
 * the payload binds. */
var proj="map";                       // "sky" | "globe" | "map" — where the reader stands. The ROUTE opens the Sky
                                      // (#skyview → sky, ruling 1); a direct call keeps where the reader already stands.
/* What #skyview opens. The Sky, by Sam's ruling — and a harness that measures
 * the flat map says so (window.CPL_SKYVIEW_OPENS="map"), the way one names a
 * payload URL, rather than every flat-map suite running on the sphere. */
var OPENS = (window.CPL_SKYVIEW_OPENS==="map"||window.CPL_SKYVIEW_OPENS==="globe") ? window.CPL_SKYVIEW_OPENS : "sky";
var SKY=null, skyState="", skyWaiters=[];
var SKY_URL = window.CPL_SKYVIEW_SKY_URL || "ccr_sky.json";
/* ⭐ THE OPENING WINDOW IS THE WIDEST ONE THAT STILL SHOWS EVERY STAR (Sam,
 * 2026-09-08: "Default might look better a bit smaller...as long as the stars
 * show up"). The caveat is the binding constraint, not a nicety: `NODE_ZOOM`
 * (0.20) decides per island whether its courses draw at all, and the
 * stereographic scale falls as the window widens. Measured by stepping the real
 * zoom control, islands drawn / islands still showing their stars:
 *     150 across  70/70  (scale from 0.438)      188 across  99/99  (from 0.313)
 *     226 across 125/125 (from 0.224)            240 across 128/124 (from 0.195)
 * 226 keeps them today but sits a whisker above the threshold, and an island's
 * scale DRIFTS as the sky turns — the S240 flicker was exactly that band. 188
 * is a step wider with a real margin, so nothing winks out mid-turn. */
var sph={yaw:0, pitch:0.15, half:Math.PI*94/180, dist:3.0, spin:0};   // 188° across; where you look, how wide, how far, how far it has turned
var SKY_HALF_MIN=Math.PI*2/180, SKY_HALF_MAX=Math.PI*120/180;            // 4° to 240° across
var GLOBE_DIST_MIN=0.15, GLOBE_DIST_MAX=6;
// Radians per second. Sam, 2026-09-09: "Slow the rotation". 0.045 turned the
// sky in ~140 s, which reads as motion you watch rather than drift you stop
// noticing — and this is a canvas you stare at while curating. 0.018 is one
// turn in about 350 s (~5.8 min), still alive, no longer competing with the
// work. It is the ONE constant: the rate below scales it by zoom, so a slower
// SPIN slows every projection together.
var SPIN=0.018;
/* ⭐ THE TURN'S TIME STEP MUST CLAMP ABOVE THE REAL FRAME TIME, NEVER BELOW IT
 * (the flicker Sam reported on 2026-09-07). The clamp exists for ONE case: a
 * backgrounded tab, where rAF stops and `t` jumps seconds, which would spin the
 * sky a half turn in a single frame. It is not a frame-rate limiter.
 *
 * It was 0.1 s, and the draw at 240° across measures 133 ms a frame (83–267 ms,
 * 7.5 fps in software rendering) — so `dt` was pinned at the clamp on EVERY
 * frame. Measured live: `sph.spin` advanced exactly 7.20e-3 rad per frame while
 * the frame interval swung 192–319 ms. That is a FIXED angular step at an
 * IRREGULAR cadence — the sky lurches instead of gliding — and it also turns
 * slow, since only 0.1 s of each 0.27 s frame was ever applied.
 *
 * Above the real frame time the motion is time-true again: the step is
 * proportional to the time it stands for, so the pace holds however the frames
 * fall. 0.5 s is well clear of the slowest frame measured and still well under
 * the multi-second gap a backgrounded tab produces. */
var TURN_DT_MAX=0.5;
var reduceMotion=false;
try{ reduceMotion=!!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }catch(e){}
var rotating=false, turnRaf=null, turnT=0, twinkleT=0;
var namesOn=true;                     // discipline names on the sky (More → Show or hide)
var islSphere=null, skyRegions=null;  // per island: its place on the sphere; the two region names
function bindSky(j){ SKY=j; skyState="ok"; islSphere=null; }
function loadSky(then){
  if(skyState==="ok"||skyState==="missing"||skyState==="blocked") return then&&then();
  if(window.CPL_CCR_SKY){ bindSky(window.CPL_CCR_SKY); return then&&then(); }
  if(then) skyWaiters.push(then);
  if(skyState==="loading") return;
  var flush=function(){ var w=skyWaiters; skyWaiters=[]; w.forEach(function(f){ try{ f(); }catch(e){} }); };
  if(typeof fetch!=="function"){ skyState="missing"; flush(); return; }
  skyState="loading";
  fetch(SKY_URL).then(function(r){
    if(!r.ok) throw new Error("http "+r.status);
    return r.json();
  }).then(function(j){ bindSky(j); flush(); })
    .catch(function(){ skyState=(location.protocol==="file:")?"blocked":"missing"; flush(); });
}
function sphereOn(){ return proj!=="map"; }
function dayOn(){ return sphereOn() && !dark; }
function norm3(v){ var l=Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2])||1; return [v[0]/l, v[1]/l, v[2]/l]; }
function skyRpu(){
  if(SKY && SKY.radians_per_unit) return SKY.radians_per_unit;
  var b=U&&U.bounds; return b ? 0.62*2*Math.PI/((b.x1-b.x0)/SPREAD_ISLANDS) : 0.001;
}
function unitOf(lonDeg, latDeg){
  var lon=lonDeg*Math.PI/180, lat=latDeg*Math.PI/180, cl=Math.cos(lat);
  return [cl*Math.cos(lon), Math.sin(lat), cl*Math.sin(lon)];
}
/* The flat map wrapped by longitude and latitude — the committed placement. */
function wrapOf(x,y){
  var b=U.bounds, cx=(b.x0+b.x1)/2, cy=(b.y0+b.y1)/2, W=b.x1-b.x0, H=b.y1-b.y0;
  var lon=(x-cx)/W*2*Math.PI, lat=-(y-cy)/H*(Math.PI*0.9), cl=Math.cos(lat);
  return [cl*Math.cos(lon), Math.sin(lat), cl*Math.sin(lon)];
}
function frameAt(c){
  var lon=Math.atan2(c[2],c[0]), lat=Math.asin(Math.max(-1,Math.min(1,c[1])));
  return {E:[-Math.sin(lon), 0, Math.cos(lon)], N:[-Math.sin(lat)*Math.cos(lon), Math.cos(lat), -Math.sin(lat)*Math.sin(lon)]};
}
/* Walk `east` and `north` radians along the surface from an island's center. */
function expmap(S, east, north){
  var rho=Math.sqrt(east*east+north*north); if(rho<1e-9) return S.c.slice();
  var te=east/rho, tn=north/rho, cr=Math.cos(rho), sr=Math.sin(rho);
  return [cr*S.c[0]+sr*(te*S.E[0]+tn*S.N[0]), cr*S.c[1]+sr*(te*S.E[1]+tn*S.N[1]), cr*S.c[2]+sr*(te*S.E[2]+tn*S.N[2])];
}
function buildSphere(){
  if(!U) return null;
  var rows={}; if(SKY && SKY.islands) SKY.islands.forEach(function(r){ rows[r.d]=r; });
  var rpu=skyRpu(), out={}, sums={cte:[0,0,0,0], academic:[0,0,0,0]};
  U.islands.forEach(function(isl){
    var r=rows[isl.d], c = (r && r.kind) ? unitOf(r.kind[0], r.kind[1]) : wrapOf(isl.x, isl.y), f=frameAt(c);
    out[isl.d]={c:c, E:f.E, N:f.N, th:isl.r*rpu, cls:r?r.cls:"mixed"};
    if(r && sums[r.cls]){ var sm=sums[r.cls]; sm[0]+=c[0]; sm[1]+=c[1]; sm[2]+=c[2]; sm[3]++; }
  });
  /* The two region names ride the sky — without them the order is a secret. */
  skyRegions=[];
  [["cte","CTE disciplines"],["academic","Academic disciplines"]].forEach(function(q){
    var sm=sums[q[0]]; if(sm[3]) skyRegions.push({c:norm3([sm[0],sm[1],sm[2]]), text:q[1], p:null});
  });
  islSphere=out; return out;
}
function spun(c){ var a=sph.spin, ca=Math.cos(a), sa=Math.sin(a); return [c[0]*ca - c[2]*sa, c[1], c[0]*sa + c[2]*ca]; }
function viewBasis(){
  var f=[Math.cos(sph.pitch)*Math.sin(sph.yaw), Math.sin(sph.pitch), Math.cos(sph.pitch)*Math.cos(sph.yaw)];
  var r=[-f[2],0,f[0]], rl=Math.sqrt(r[0]*r[0]+r[2]*r[2])||1; r=[r[0]/rl,0,r[2]/rl];
  var u=[r[1]*f[2]-r[2]*f[1], r[2]*f[0]-r[0]*f[2], r[0]*f[1]-r[1]*f[0]];
  return {f:f, r:r, u:u};
}
function skyKpx(){ return (cw()/2)/(2*Math.tan(sph.half/2)); }        // pixels per unit of the window's plane
function globeRpx(){ return 0.42*Math.min(cw(),ch())*(3.0/sph.dist); } // the globe's radius on the screen
/* A spun direction → its place on the screen, or null when it is out of view
 * (behind the reader past 175°, or on the far side of the globe). */
function projectDir(d, B){
  var x=d[0]*B.r[0]+d[1]*B.r[1]+d[2]*B.r[2], y=d[0]*B.u[0]+d[1]*B.u[1]+d[2]*B.u[2], z=d[0]*B.f[0]+d[1]*B.f[1]+d[2]*B.f[2];
  if(proj==="globe"){ if(z<0.05) return null; var R=globeRpx(); return [cw()/2 - x*R, ch()/2 - y*R]; }   // outside, facing the center: the sky's left is the screen's right
  var ang=Math.acos(Math.max(-1,Math.min(1,z))); if(ang>3.05) return null;
  var rho=2*Math.tan(ang/2), l=Math.sqrt(x*x+y*y)||1, k=skyKpx();
  return [cw()/2 + (x/l)*rho*k, ch()/2 - (y/l)*rho*k];
}
/* A screen point → a spun direction (null off the globe's body). */
function unprojectDir(px,py,B){
  var X, Y, z;
  if(proj==="globe"){ var R=globeRpx(); X=-(px-cw()/2)/R; Y=-(py-ch()/2)/R; var q=X*X+Y*Y; if(q>1) return null; z=Math.sqrt(1-q);
    return [X*B.r[0]+Y*B.u[0]+z*B.f[0], X*B.r[1]+Y*B.u[1]+z*B.f[1], X*B.r[2]+Y*B.u[2]+z*B.f[2]]; }
  var k=skyKpx(); X=(px-cw()/2)/k; Y=-(py-ch()/2)/k;
  var rho=Math.sqrt(X*X+Y*Y), ang=2*Math.atan(rho/2), ca=Math.cos(ang), sa=Math.sin(ang), ux=rho?X/rho:0, uy=rho?Y/rho:0;
  return [ca*B.f[0]+sa*(ux*B.r[0]+uy*B.u[0]), ca*B.f[1]+sa*(ux*B.r[1]+uy*B.u[1]), ca*B.f[2]+sa*(ux*B.r[2]+uy*B.u[2])];
}
/* ⭐ THE FRAME'S PLACES. Each island's center on the screen and the projection's
 * Jacobian there (screen pixels per world unit east and down), so every point
 * inside it is placed by ONE multiply-add — the flat map's w2s with a per-island
 * origin, scale and orientation. Run at the top of draw(); pick() reads the same
 * cache, so hit-testing and painting cannot disagree about where a thing is. */
function prepSphere(){
  if(!islSphere) buildSphere();
  var B=viewBasis(), rpu=skyRpu(), EPS=1e-3;
  U.islands.forEach(function(isl){
    var S=islSphere[isl.d]; if(!S){ isl._s=null; return; }
    var c=spun(S.c), p=projectDir(c,B);
    if(!p){ isl._s=null; return; }
    /* ⭐ AN ISLAND BEHIND THE READER IS NOT A SMALL ISLAND, IT IS A HUGE ONE
     * (Sam, 2026-09-08: "an enlarged grouping that is crossing over all the
     * others — like a loose asteroid field spiraling around").
     *
     * The sky is stereographic: the scale at an angle `ang` off the view
     * direction is sec²(ang/2), which is 1.3x at 60 degrees, 4x at 120, and
     * 131x at 170. `projectDir` only refuses past 3.05 rad (174.8 degrees), so
     * an island almost directly BEHIND the reader still projects — at a
     * hundredfold scale. The screen cull downstream is a bounding box built
     * from `isl.r * k`, so that inflated radius covers the whole window and the
     * cull PASSES: the island is drawn as a giant sprawl of its courses across
     * everything else, sweeping as the sky turns. It was in S240's own
     * measurements (Music read k = 2.4 -> 71.5 -> culled) and read as a normal
     * cull.
     *
     * The window shows a finite cone, so the test is angular, not projected: if
     * the island's NEAREST edge (its centre less its own angular radius) lies
     * beyond the screen corner, no part of it is in view. Exact, so nothing
     * that belongs on screen is lost — a big island whose centre is off-view
     * still draws while its edge reaches in. */
    var cz0=c[0]*B.f[0]+c[1]*B.f[1]+c[2]*B.f[2];
    if(proj!=="globe"){
      var rhoMax=Math.sqrt(cw()*cw()+ch()*ch())/2/skyKpx();   // the screen's far corner
      var angMax=2*Math.atan(rhoMax/2);
      if(Math.acos(Math.max(-1,Math.min(1,cz0))) - (S.th||0) > angMax){ isl._s=null; return; }
    }
    var pe=projectDir(spun(norm3([S.c[0]+EPS*S.E[0], S.c[1]+EPS*S.E[1], S.c[2]+EPS*S.E[2]])),B);
    var pn=projectDir(spun(norm3([S.c[0]+EPS*S.N[0], S.c[1]+EPS*S.N[1], S.c[2]+EPS*S.N[2]])),B);
    if(!pe||!pn){ isl._s=null; return; }
    var ex=[(pe[0]-p[0])/EPS*rpu, (pe[1]-p[1])/EPS*rpu];     // per world unit east
    var ey=[-(pn[0]-p[0])/EPS*rpu, -(pn[1]-p[1])/EPS*rpu];   // per world unit down (north is up; world y grows down)
    var det=Math.abs(ex[0]*ey[1]-ex[1]*ey[0]);
    if(det<1e-12){ isl._s=null; return; }
    isl._s={px:p[0], py:p[1], ex:ex, ey:ey, k:Math.sqrt(det), cz:cz0};
  });
  if(skyRegions) skyRegions.forEach(function(rg){ rg.p=projectDir(spun(rg.c),B); });
}
function islandAt(x,y){
  if(!U) return null;
  for(var i=0;i<U.islands.length;i++){ var I=U.islands[i], ddx=x-I.x-(I.dx||0), ddy=y-I.y-(I.dy||0); if(ddx*ddx+ddy*ddy <= I.r*I.r*1.0001) return I; }
  return null;
}
function islCenter(isl){
  if(!sphereOn()) return w2sFlat(isl.x+(isl.dx||0), isl.y+(isl.dy||0));
  return isl._s ? [isl._s.px, isl._s.py] : null;
}
function islScale(isl){ return sphereOn() ? (isl._s ? isl._s.k : 0) : view.k; }
/* ⭐ ON THE SPHERE THE ZOOM BANDS NEED HYSTERESIS — A BARE THRESHOLD FLICKERS
 * (Sam, 2026-09-07: "note how the skyview flickers around").
 *
 * On the flat map `k` is view.k: ONE number for the whole map that moves only
 * when the reader zooms, so crossing NODE_ZOOM is a deliberate act and the
 * whole map crosses together. On the sphere `k` is PER ISLAND — the stereo-
 * graphic scale at that island's center, sec²(ang/2) times the center's — so it
 * changes continuously as the sky turns, and every island crosses on its own.
 *
 * Measured at 240° across (the zoom in Sam's recording): 18 of 159 islands sit
 * within ±3% of NODE_ZOOM (Dance 0.1998 against 0.2000), and 11 of them flipped
 * within 120 frames. Each flip switches that discipline's ENTIRE dot field —
 * hundreds of points — on or off at once while its disc and its name stay put.
 * That is the blink: whole constellations coming and going as the sky drifts.
 *
 * So the band remembers which side it is on: an island already drawing its
 * courses keeps drawing them until it falls a clear margin below, which no
 * amount of drift can cross and re-cross. ⚠️ `pick()` reads the SAME memory
 * rather than re-testing — what is not drawn cannot be picked, and a second
 * test would put the eye and the hand back into disagreement. */
var NODE_ZOOM_KEEP=0.86;
function nodesShown(isl,k){
  if(!sphereOn()){ isl._nodesOn=null; return k>NODE_ZOOM; }
  isl._nodesOn = isl._nodesOn ? k>NODE_ZOOM*NODE_ZOOM_KEEP : k>NODE_ZOOM;
  return isl._nodesOn;
}
/* What the last draw actually put on the screen, for the hit test. */
function nodesOnScreen(isl,k){ return isl._nodesOn==null ? k>NODE_ZOOM : isl._nodesOn; }
/* The screen's scale at the window's center, as the map's k: what the zoom
 * bands, the readout and the fly-to zoom mean on the sphere. */
function kCenter(){ return skyRpu()*(proj==="globe" ? globeRpx() : skyKpx()); }
function syncViewK(){ if(sphereOn()) view.k=kCenter(); }
/* ⭐ THE CAMERA SURVIVES A TRIP OFF THE MAP (Sam, 2026-09-07: a back button
 * "should go back to where my focus was"). __ccrUniverse rebuilds the map and
 * calls resetView(), so every return — from the Views menu, from a crumb, from
 * Back — used to land on the opening view. What the reader means by "where I
 * was" is the camera: which way they are facing, how wide the window is, and on
 * the flat map where they had panned. Parked on the way out, applied on the way
 * back in place of the reset. A FIRST open has nothing parked and resets, which
 * is why the two are written as one either/or rather than a reset plus a fix-up
 * that would visibly jump. */
var parkedCam=null;
function parkCamera(){
  if(!U) return;
  parkedCam={ view:{x:view.x, y:view.y, k:view.k},
              sph:{yaw:sph.yaw, pitch:sph.pitch, half:sph.half, dist:sph.dist, spin:sph.spin} };
}
function restoreCamera(){
  if(!parkedCam) return false;
  view.x=parkedCam.view.x; view.y=parkedCam.view.y; view.k=parkedCam.view.k;
  sph.yaw=parkedCam.sph.yaw; sph.pitch=parkedCam.sph.pitch;
  sph.half=parkedCam.sph.half; sph.dist=parkedCam.sph.dist; sph.spin=parkedCam.sph.spin;
  syncViewK();
  return true;
}
function setSphereZoom(k){
  k=clampK(k); var rpu=skyRpu();
  if(proj==="globe") sph.dist=Math.max(GLOBE_DIST_MIN, Math.min(GLOBE_DIST_MAX, rpu*0.42*Math.min(cw(),ch())*3.0/k));
  else sph.half=Math.max(SKY_HALF_MIN, Math.min(SKY_HALF_MAX, 2*Math.atan(rpu*cw()/(4*k))));
  syncViewK();
}
/* Face a world point: the direction of its island's center walked by its offset. */
function faceWorld(x,y){
  if(!islSphere) buildSphere();
  var isl=islandAt(x,y), S=isl&&islSphere[isl.d], d;
  if(S){ var rpu=skyRpu(); d=expmap(S, (x-isl.x-(isl.dx||0))*rpu, -(y-isl.y-(isl.dy||0))*rpu); } else d=wrapOf(x,y);
  d=spun(d);
  sph.pitch=Math.asin(Math.max(-1,Math.min(1,d[1]))); sph.yaw=Math.atan2(d[0], d[2]);
}
/* ── the turn (ruling 4): the sky turns when it opens and stops at the first
 * touch — a drag, a click, a key, a search, a carry — until Rotate is pressed
 * again; the stars twinkle only while it turns; none of it for a reader whose
 * system asks for reduced motion. The turn slows in proportion to the zoom, so
 * the sky drifts across the window at one pace. Left to right in both views:
 * the window's right is the globe's left, so the sign flips inside. */
function startTurn(){
  if(reduceMotion || !sphereOn()) return;
  rotating=true; paintTurn();
  if(!turnRaf && typeof requestAnimationFrame==="function"){ turnT=0; turnRaf=requestAnimationFrame(turnFrame); }
}
function stopTurn(){ if(!rotating) return; rotating=false; paintTurn(); }
function turnFrame(t){
  turnRaf=null;
  if(!rotating || !sphereOn() || !cvs || document.getElementById("u-cvs")!==cvs){ rotating=false; paintTurn(); return; }
  var dt = turnT ? Math.min(TURN_DT_MAX,(t-turnT)/1000) : 0; turnT=t; twinkleT=t/1000;
  var rate = proj==="globe" ? SPIN*(sph.dist/3.0) : -SPIN*(sph.half/(Math.PI*75/180));
  if(!(drag && drag.kind==="course")) sph.spin += rate*dt;   // never a moving target under a carried course
  draw();
  turnRaf=requestAnimationFrame(turnFrame);
}
function paintTurn(){
  var b=document.getElementById("u-rotate");
  if(b){ b.setAttribute("aria-pressed", rotating?"true":"false"); b.title = rotating ? "Stop the sky turning" : "Turn the sky slowly on its own; it stops at your first touch"; }
}
/* The day sky's clouds: value noise, drawn once, ghosted (Sam: "sky blue and
 * with ghosted very feint clouds if possible"). */
var cloudCvs=null;
function cloudTile(){
  if(cloudCvs) return cloudCvs;
  var W=256, H=128, c=document.createElement("canvas"); c.width=W; c.height=H;
  var g=c.getContext&&c.getContext("2d"); if(!g) return null;
  var img=g.createImageData ? g.createImageData(W,H) : null; if(!img) return null;
  function hash(i,j){ var n=Math.sin(i*127.1+j*311.7)*43758.5453; return n-Math.floor(n); }
  function noise(x,y,per){ var xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, sx=fx*fx*(3-2*fx), sy=fy*fy*(3-2*fy);
    var a=hash(xi%per,yi%per), b=hash((xi+1)%per,yi%per), cc=hash(xi%per,(yi+1)%per), d=hash((xi+1)%per,(yi+1)%per);
    return (a*(1-sx)+b*sx)*(1-sy)+(cc*(1-sx)+d*sx)*sy; }
  for(var y=0;y<H;y++) for(var x=0;x<W;x++){
    var v=0, amp=0.5, per=8;
    for(var o=0;o<4;o++){ v+=amp*noise(x/W*per, y/H*per, per); amp*=0.5; per*=2; }
    var a=Math.max(0, Math.min(1, (v-0.45)*2.2)), i=(y*W+x)*4;
    img.data[i]=255; img.data[i+1]=255; img.data[i+2]=255; img.data[i+3]=Math.round(a*70);
  }
  g.putImageData(img,0,0); cloudCvs=c; return c;
}
function drawClouds(W,H){
  var t=cloudTile(); if(!t || !ctx.drawImage) return;
  ctx.save(); ctx.globalAlpha=0.85;
  var s=Math.max(W/t.width, H/t.height);
  var off=((sph.spin*W/(2*Math.PI))%(t.width*s)+t.width*s)%(t.width*s);   // the clouds drift with the turn
  for(var x=-off; x<W; x+=t.width*s) ctx.drawImage(t, x, 0, t.width*s, t.height*s);
  ctx.restore();
}
/* The twinkle: slow, shallow, each star on its own phase, only while the sky turns. */
/* True only while a twinkle can actually vary; the draw hoists it so the
 * per-point call disappears entirely when the sky is still. */
function twinkleOn(){ return !!(rotating && sphereOn() && !(drag&&drag.kind)); }
function twinkleOf(nd){
  if(!rotating || !sphereOn() || (drag&&drag.kind)) return 1;
  if(nd._ph==null){ var h=0, sId=String(nd.i); for(var i=0;i<sId.length;i++) h=(h*31+sId.charCodeAt(i))>>>0; nd._ph=(h%628)/100; }
  return 1-0.25*(0.5+0.5*Math.sin(twinkleT*0.55+nd._ph));
}
function loadCpl(then){
  if(cplState==="ok"||cplState==="missing"||cplState==="blocked") return then&&then();
  if(window.CPL_CCR_CPL){ bindCpl(window.CPL_CCR_CPL); return then&&then(); }
  if(then) cplWaiters.push(then);
  if(cplState==="loading") return;
  var flush=function(){ var w=cplWaiters; cplWaiters=[]; w.forEach(function(f){ try{ f(); }catch(e){} }); };
  if(typeof fetch!=="function"){ cplState="missing"; flush(); return; }
  cplState="loading";
  fetch(CPL_URL).then(function(r){
    if(!r.ok) throw new Error("http "+r.status);
    return r.json();
  }).then(function(j){ bindCpl(j); flush(); })
    .catch(function(){ cplState=(location.protocol==="file:")?"blocked":"missing"; flush(); });
}
/* [[credIdx, [exhibit rows]] …] for a point, or null when no exhibit reaches it.
 * An exhibit row is [exhibitId, exhibitTitle, typeIdx, [recommendations],
 * [collegeIdx…], stale?]. */
function cplOf(nd){ return (CPL && nd && CPL.by && CPL.by[nd.i]) || null; }
function cplCred(k){ return (CPL && CPL.creds && CPL.creds[k]) || ["", null, null]; }
function cplType(i){ return (CPL && CPL.types && CPL.types[i]) || ""; }
function cplCollege(i){ return (CPL && CPL.colleges && CPL.colleges[i]) || ""; }
function cplCounts(){ return (CPL && CPL.counts) || {}; }
/* Distinct colleges across a credential's exhibit rows. */
function cplHeld(rows){ var s={}, n=0; rows.forEach(function(r){ (r[4]||[]).forEach(function(c){ if(!s[c]){ s[c]=1; n++; } }); }); return n; }
function cplExhibits(b){ var n=0; b.forEach(function(e){ n+=e[1].length; }); return n; }
/* {college name: [credential names]} — the colleges whose course under this
 * identity is the RECEIVING course of an articulation. Drawn on their stars. */
function cplCollegesOf(nd){
  var b=cplOf(nd); if(!b) return null;
  var out={}, any=false;
  b.forEach(function(e){
    var name=cplCred(e[0])[0];
    e[1].forEach(function(r){ (r[4]||[]).forEach(function(c){
      var cn=cplCollege(c); if(!cn) return;
      if(!out[cn]) out[cn]=[];
      if(out[cn].indexOf(name)<0) out[cn].push(name);
      any=true;
    }); });
  });
  return any?out:null;
}
/* Per discipline: how many credentials reach it, and how many of its points. */
function cplIslandCounts(){
  if(cplIslCache) return cplIslCache;
  var out={};
  if(CPL && CPL.by && U) U.islands.forEach(function(I){
    var creds={}, nc=0, pts=0;
    I.p.forEach(function(nd){
      var b=CPL.by[nd.i]; if(!b) return;
      pts++;
      b.forEach(function(e){ if(!creds[e[0]]){ creds[e[0]]=1; nc++; } });
    });
    if(pts) out[I.d]={creds:nc, points:pts};
  });
  cplIslCache=out;
  return out;
}
/* The coverage line, as words. Computed from the payload — never a literal. */
function cplLineText(){
  var c=cplCounts();
  if(cplState==="ok") return num(c.exhibits_on_map||0)+" of "+num(c.exhibits_articulated||0)+
    " articulated exhibits reach a course on this map. A point is named by the credential that reaches it; "+
    "a point no exhibit reaches stays drawn and unlabeled.";
  if(cplState==="loading"||cplState==="") return "Loading MAP\u2019s articulation record\u2026";
  if(cplState==="blocked") return "MAP\u2019s articulation record cannot be loaded from a file:// page \u2014 serve the page and the points take their credential names.";
  return "MAP\u2019s articulation record could not be loaded, so the points keep their course names.";
}
function cplLineHtml(){
  var c=cplCounts();
  if(cplState!=="ok") return esc(cplLineText());
  return "<strong>"+num(c.exhibits_on_map||0)+"</strong> of "+num(c.exhibits_articulated||0)+
    " articulated exhibits reach a course on this map. A point is named by the credential that reaches it; "+
    "a point no exhibit reaches stays drawn and unlabeled.";
}
/* Why an empty answer is not evidence of absence — the ceiling, in words, on
 * the reading surfaces only (never a mark on the map). */
function cplCeilingWords(){
  var c=cplCounts(), f=c.funnel||{};
  var pct = (f.rows && f.rows_naming_course!=null) ? Math.round(1000*f.rows_naming_course/f.rows)/10 : null;
  return "Absence here is not evidence that no credential applies: only "+num(c.exhibits_on_map||0)+" of "+
    num(c.exhibits_articulated||0)+" articulated exhibits reach any course on this map"+
    (pct!=null ? ", and MAP\u2019s credit funnel names a receiving college course on "+pct+"% of its rows" : "")+
    " \u2014 the missing receiving course is a MAP data item, not a finding about this course.";
}
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
/* ⭐ THE SAME LABEL STRINGS ARE RE-MEASURED EVERY FRAME. `measureText` was
 * 12.3% of the profile — the single largest JS entry — because the placer
 * measures every candidate name on every draw, and the names do not change.
 * Text metrics depend only on the font and the string, so a memo on that pair
 * is exact, not an approximation. The cap keeps a long pan from growing it
 * without bound; clearing wholesale is fine, since a miss costs one measure.
 *
 * ⚠️ AND ON THE SPHERE THAT MEMO NEVER HIT ONCE (S242). The key was
 * `ctx.font` + the string, and an island label's size is `q.r*0.17` — a float
 * that drifts every frame as the sky turns: `18.0263px`, `18.2506px`,
 * `18.1185px`. Every draw asked a question it had never asked, so the memo was
 * a cache that only ever grew, and — the expensive half — every call handed
 * Chromium a font size it had never built. Measured on the served page:
 * `measureText` 11.2% of the profile while `textW` itself was 0.5%, on
 * fifteen calls a frame. Half a millisecond each.
 *
 * A memo keyed on a continuously varying value is not a memo. Advance widths
 * scale with the size, so measure once at TW_REF px and multiply: one font for
 * the life of the page, and the key is the typeface and the string again.
 *
 * ⚠️ Not bit-exact — hinting moves a width by up to 0.14px at these sizes —
 * and it does not need to be: the width feeds a collision box that already
 * pads 3px a side, and `placeLabels` draws centered, so the width never
 * positions anything. ⚠️ Rounding the DRAWN size instead would have been exact
 * and wrong: it puts a threshold on a value that drifts, and a label flipping
 * 18→19px between frames is the blink this lane keeps relearning
 * (`NODE_ZOOM_KEEP`). The drawn size stays continuous. */
var _twCache=Object.create(null), _twN=0;
var TW_REF=100, TW_SPLIT=/^(.*?)(\d*\.?\d+)px(.*)$/;
function textW(t){
  var f=ctx.font, m=TW_SPLIT.exec(f);
  if(!m) return ctx.measureText(t).width;          // an unexpected shape: measure it as it stands
  var k=m[1]+"|"+m[3]+"\u0000"+t, v=_twCache[k];
  if(v===undefined){
    ctx.font=m[1]+TW_REF+"px"+m[3];
    v=ctx.measureText(t).width/TW_REF;             // width per px of size
    ctx.font=f;
    if(_twN>20000){ _twCache=Object.create(null); _twN=0; }
    _twCache[k]=v; _twN++;
  }
  return v*parseFloat(m[2]);
}
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
/* ⭐ ONE CONTROL, ONE MEMORY, TWO DEFAULTS (Sam's ruling 3, 2026-09-07). The
 * Sky opens at Night — the night sky IS its dark canvas — and the Map opens
 * light, as it always has; a reader who chooses is remembered everywhere
 * (localStorage "skyview:theme"), and until they choose, the default follows
 * where they stand. On the Sky and the Globe the control reads Night | Day; on
 * the Map it keeps its Dark canvas row. Day keeps the rim on every dot, because
 * measured against the day ground the silver stars are 1.24:1 and the light
 * 1.08:1 — by day a dot exists by its edge. */
var darkChoice=null;
try{ darkChoice = localStorage.getItem("skyview:theme"); }catch(e){}
if(darkChoice!=="dark" && darkChoice!=="light") darkChoice=null;
/* ⭐ AND THE COBI HEADER'S THEME IS THE LAYER BETWEEN (Sam, 2026-09-08: the one
 * control "sets all tabs and windows"). SkyView opens full-window from COBI's
 * side menu and shares its origin, so it reads the same key cpl_theme.js writes.
 *
 * ⚠️ IT IS A FALLBACK, NOT AN OVERRIDE, and the order is the whole point —
 * it composes with ruling 3 above instead of replacing it:
 *   1. this reader's own SkyView choice (skyview:theme)  — "one memory"
 *   2. an EXPLICIT global choice from the COBI header    — "one control"
 *   3. where the reader stands: Sky/Globe → Night, Map → light — "two defaults"
 * Step 3 still owns the DEFAULT, because the global key reads "system" until
 * someone actually picks, and "system" is not a choice — so the Sky still opens
 * at Night for every reader who has never touched either control. */
function globalChoice(){
  var v=null;
  try{ v = localStorage.getItem("cpl_theme"); }catch(e){}
  return (v==="dark"||v==="light") ? v : null;
}
var dark = darkChoice ? darkChoice==="dark" : globalChoice()==="dark";
if(dark && document.body) document.body.classList.add("u-dark");
function applyDark(){
  var g = globalChoice();
  dark = darkChoice ? darkChoice==="dark"
       : g ? g==="dark"
       : sphereOn();
  document.body.classList.toggle("u-dark", dark);
  document.body.classList.toggle("u-day", dayOn());
  paintDark();
}
/* The COBI window changed the theme while this one was open. `storage` fires
 * only in OTHER documents, which is exactly this case — a reader with SkyView
 * beside COBI sees both follow the one control without reloading either. */
window.addEventListener("storage", function(e){
  if(!e || e.key!=="cpl_theme") return;
  applyDark();
  if(cvs && document.getElementById("u-cvs")===cvs) draw();
});
function setDark(on){
  darkChoice = on ? "dark" : "light";
  try{ localStorage.setItem("skyview:theme", darkChoice); }catch(e){}
  applyDark();
  if(cvs && document.getElementById("u-cvs")===cvs) draw();
}
function paintDark(){
  var b=document.getElementById("u-dark");
  if(b){
    b.setAttribute("aria-pressed", dark?"true":"false"); b.title = dark ? "Back to the light canvas" : "Dark canvas";
    var sw=b.querySelector(".u-state"); if(sw) sw.textContent=dark?"on":"off";
    b.hidden = sphereOn();
  }
  var nd=document.getElementById("u-nd"); if(nd) nd.hidden = !sphereOn();
  var bn=document.getElementById("u-night"), bd=document.getElementById("u-day");
  if(bn) bn.setAttribute("aria-pressed", dark?"true":"false");
  if(bd) bd.setAttribute("aria-pressed", dark?"false":"true");
}
/* Where the reader stands — painted from every path that changes it. */
function paintProj(){
  ["sky","globe","map"].forEach(function(x){ var b=document.getElementById("u-proj-"+x); if(b) b.setAttribute("aria-pressed", x===proj?"true":"false"); });
  var tg=document.getElementById("u-turn-grp"); if(tg) tg.hidden = !sphereOn();
  paintTurn(); paintDark(); paintZoomRead();
  var nb=document.getElementById("u-names"); if(nb){ nb.setAttribute("aria-pressed", namesOn?"true":"false"); var sw=nb.querySelector(".u-state"); if(sw) sw.textContent=namesOn?"on":"off"; }
}
function paintZoomRead(){
  var z=document.getElementById("u-zoom"); if(!z) return;
  if(proj==="sky"){ z.textContent=Math.round(sph.half*2*180/Math.PI)+"\u00b0 across"; z.title="How much of the sky the window holds, across"; }
  else if(proj==="globe"){ z.textContent=(Math.round(sph.dist*10)/10).toFixed(1)+" R"; z.title="Your distance from the globe, in globe radii"; }
  else { z.textContent=Math.round(view.k*100)+"%"; z.title="The current magnification"; }
}
function setProj(p, quiet){
  p = (p==="globe"||p==="map") ? p : "sky";
  var was=proj; proj=p;
  if(sphereOn()){ if(!islSphere) buildSphere(); loadSky(function(){ if(sphereOn() && cvs && document.getElementById("u-cvs")===cvs){ buildSphere(); draw(); } }); syncViewK(); }
  applyDark(); paintProj();
  if(curView==="skyview"||curView==="comprehensive") syncHash(curArg||undefined);
  if(quiet) return;
  if(was!==proj){
    /* Keep the subject when the reader changes where they stand. */
    var a = selNode&&selIsl ? [selNode.x+(selIsl.dx||0), selNode.y+(selIsl.dy||0), Math.max(view.k, NODE_ZOOM*3)]
          : selIsl ? [selIsl.x+(selIsl.dx||0), selIsl.y+(selIsl.dy||0), SUBJECT_ZOOM]
          : anchor ? [anchor.x, anchor.y, Math.max(kCenter(), NODE_ZOOM*3)] : null;
    if(a) flyTo(a[0],a[1],a[2]); else { resetView(); if(cvs && document.getElementById("u-cvs")===cvs) draw(); }
  }
  if(typeof window.__ccrSetMode==="function") window.__ccrSetMode(mode);   // the hint says what a drag does here
  if(sphereOn()) startTurn(); else stopTurn();
}
window.__ccrSetProj=function(p){ setProj(p); };
/* For the harness: the projection by name, both ways. */
window.__ccrW2S=function(x,y,name){ var I=null; if(U&&name) U.islands.forEach(function(q){ if(q.d===name) I=q; }); return w2s(x,y,I||undefined); };
window.__ccrS2W=function(px,py,name){ var I=null; if(U&&name) U.islands.forEach(function(q){ if(q.d===name) I=q; }); return s2w(px,py,I||undefined); };
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
/* ⚠️ `clientWidth` IS A LAYOUT READ, AND w2s CALLS THESE ONCE PER POINT.
 * At 49,896 points that is ~100,000 style reads a frame; the profiler put cw()
 * and ch() at 2.7% of a 128 ms frame on their own. The canvas cannot change
 * size midway through a draw, so the frame caches them: draw() opens the frame
 * (dimFrame) and every read inside it is a plain number. Outside a frame they
 * read the DOM exactly as before, so pick() and the hit tests are unchanged. */
var _dimW=0, _dimH=0, _dimOn=false;
function dimFrame(on){
  if(on){ _dimW=(cvs&&cvs.clientWidth)||960; _dimH=(cvs&&cvs.clientHeight)||600; _dimOn=true; }
  else _dimOn=false;
}
function cw(){ return _dimOn ? _dimW : ((cvs&&cvs.clientWidth)||960); }
function ch(){ return _dimOn ? _dimH : ((cvs&&cvs.clientHeight)||600); }
function w2sFlat(x,y){return [(x+view.x)*view.k + cw()/2, (y+view.y)*view.k + ch()/2];}
/* World → screen. On the flat map exactly as always. On the sphere a point is
 * placed from ITS ISLAND's projected center by the island's Jacobian (see
 * prepSphere) — pass the island when you have it; without one it is looked up
 * by containment. Returns null when the island is out of view. */
function w2s(x,y,isl){
  if(!sphereOn()) return w2sFlat(x,y);
  isl = isl || islandAt(x,y); if(!isl || !isl._s) return null;
  var S=isl._s, dx=x-isl.x-(isl.dx||0), dy=y-isl.y-(isl.dy||0);
  return [S.px + dx*S.ex[0] + dy*S.ey[0], S.py + dx*S.ex[1] + dy*S.ey[1]];
}
/* Screen → world, on the flat map; on the sphere only INSIDE a named island
 * (the inverse of its Jacobian), which is what a test placing one circle under
 * another's star needs. */
function s2w(px,py,isl){
  if(!sphereOn()) return [(px-cw()/2)/view.k - view.x, (py-ch()/2)/view.k - view.y];
  if(!isl || !isl._s) return null;
  var S=isl._s, det=S.ex[0]*S.ey[1]-S.ex[1]*S.ey[0]; if(Math.abs(det)<1e-12) return null;
  var qx=px-S.px, qy=py-S.py;
  var dx=( qx*S.ey[1]-qy*S.ey[0])/det, dy=(-qx*S.ex[1]+qy*S.ex[0])/det;
  return [isl.x+(isl.dx||0)+dx, isl.y+(isl.dy||0)+dy];
}
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
var edgeLoading=false;
function loadSubjectEdge(){
  /* ⚠️ ONE LOAD, NOT ONE PER CALLER. Two views ask for the edge (the map and
   * the workspace) and neither knows about the other, so without this flag the
   * pair of URLs is walked twice — four fetches for one 12 KB file, and four
   * lines in a network panel someone is trying to read. */
  if(edgeLoading || subjEdge) return;
  edgeLoading=true;
  var urls=EDGE_URLS.slice();
  (function next(){
    var url=urls.shift(); if(!url) return;
    var p; try{ p=fetch(url); }catch(e){ p=Promise.reject(e); }
    p.then(function(r){ if(!r.ok) throw new Error(String(r.status)); return r.json(); })
     .then(function(doc){
        var raw=(doc&&(doc.subjects||doc.map))||doc||{}, out={};
        Object.keys(raw).forEach(function(k){
          if(typeof raw[k]==="string") out[String(k).toUpperCase()]=raw[k];
        });
        subjEdge=out; edgeLoading=false;
        subjIdx=null;                 // the homes were voted; re-derive them
        if(wsPaint) wsPaint();
     })
     .catch(function(){ if(!urls.length) edgeLoading=false; next(); });
  })();
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
/* `e` is 1 CTE, 0 academic, absent when the TOP code does not resolve. Absent
 * takes its own switch — never `aca`, which would file 7,569 unknowns as a
 * positive claim. Mirrors creditOK's handling of `unrec`. */
function cteOK(nd){ return nd.e===1 ? show.cte : nd.e===0 ? show.aca : show.ctena; }
/* ── Isolate (Sam, 2026-09-09) ───────────────────────────────────────────────
 * "Need an Isolate toggle in the header to show only the selected items
 * filtered. This will allow users to eliminate the noise of other groupings on
 * screen. Sometimes you need to keep the universe in view and other times not."
 *
 * A toggle, not a mode: the last sentence is the requirement. It rides on the
 * selection that already exists — the search tokens (searchHits), the clicked
 * point and the ties lit around it — rather than inventing a second idea of
 * "selected" for the reader to keep straight.
 *
 * ⚠️ IT NO-OPS WITH NOTHING SELECTED, deliberately. Isolating an empty selection
 * would empty the map, and a blank canvas is indistinguishable from a broken
 * control — the exact failure the Show switches were fixed for (see islandPass).
 * So the button says so and stays off instead. */
var isolate=false;
function isoActive(){ return isolate && (searchHits.length>0 || !!selNode || !!selIsl); }
function isoNodeOK(nd){
  if(!isoActive()) return true;
  for(var i=0;i<searchHits.length;i++) if(searchHits[i].id===nd.i) return true;
  if(nd===selNode) return true;
  if(lastFocus && lastFocus[nd.i]) return true;   // the ties the click lit
  return false;
}
function creditShown(nd){ return creditOK(nd) && systemOK(nd) && kindOK(nd) && artOK(nd) && cteOK(nd) && isoNodeOK(nd); }
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
/* ⚠️ THE SIGNATURE CARRIES THE ISOLATION TOO. islandPass memoizes its count on
 * this string; isolation changes which points pass without touching a single
 * switch, so a signature of the switches alone would serve a stale count for
 * every island until something else moved. The selection is folded in by its
 * size and its head — enough to change whenever the selection does, and cheap
 * on a frame. */
function showSig(){
  var t=""; for(var i=0;i<SHOW_KEYS.length;i++) t+=show[SHOW_KEYS[i]]?"1":"0";
  if(isoActive()) t+="|iso"+searchHits.length+":"+(searchHits[0]?searchHits[0].id:"")+
                    ":"+(selNode?selNode.i:"")+":"+(selIsl?selIsl.d:"");
  return t;
}
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
       : kind==="term" ? "SEARCH" : kind==="cpl" ? "CPL" : (nd&&nd.a) ? "STAND-ALONE CRSE" : "CRSE IDENTITY";
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
function nodeRad(nd, kk){
  var rs=radScale(kk==null?view.k:kk);   // tapered above RAD_KNEE — see the note by K_MAX
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
/* ⭐ AN ENTRY THAT IS NOT THE MAP STILL NEEDS THE CORPUS. `buildMemberIndex()`
 * ran only inside __ccrUniverse, so a reader who arrived on `#outline/<id>` —
 * a shared link, a reload, the thing the hash routing was built for — got an
 * outline with ZERO college courses under it: no description to quote, no
 * skills to impute, no member list. Every layer said "none", which is not a
 * rendering gap but a false statement about the data, and it is
 * indistinguishable from an identity that genuinely carries nothing. Measured
 * 2026-09-07: `members: 0, memberSource: ""` on a direct hit to
 * `#outline/WELD M1109`, an identity carrying 24 courses. */
function ensureCorpus(){
  if(!U){ U=window.CPL_CCR_UNIVERSE; A=window.CPL_ATLAS_DATA||null; if(U) spreadUniverse(U); }
  if(!U) return false;
  if(!roster) buildMemberIndex();
  if(!nodeIdx) indexNodes();
  return true;
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
/* ⚠️ ALLOCATION-FREE ON PURPOSE: the draw calls this once per point, ~50,000
 * times a frame, and the `||[]` it used to carry allocated a throwaway array on
 * every miss. It measured 6.7% of the profile at 240° across, most of a frame's
 * garbage with it. Same answer, no array. */
function emptied(nd){
  /* ⭐ NOTHING IS EMPTIED UNTIL SOMETHING IS STAGED. `moves` and `movedTo` are
   * filled and cleared together, so an empty `moves` is an EXACT answer, not a
   * heuristic — and it is the usual case. Without it this ran a roster lookup
   * per point, ~50,000 a frame, and measured 7.0% of the profile with nothing
   * staged at all. */
  if(!moves.length) return false;
  if(!nd.a) return false;
  var rs=roster&&roster[nd.i]; if(!rs||!rs.length) return false;
  var m=rs[0];
  return !!(m && (m.cn in movedTo) && movedTo[m.cn]!==nd.i);
}

/* ══ THE STAGED-TO-MOVE STATE — ON THE MODEL, NOT THE VIEW (v4 item 7) ═══════
 * Sam, 2026-09-06, after dragging a course onto another identity: "It didn't
 * really change over here, which I would expect it to change and to give me a
 * confirmation that it was moved and to change this outline to show it was
 * staged to move." The confirmation half shipped in S237 (the hint names where
 * the move went and that it is staged). THIS is the mark: the course itself,
 * wherever it is drawn or listed, says it is staged and not saved — at its
 * destination ("staged here") AND at the identity it left, where it used to
 * simply vanish, because membersOf() excludes it (a move is one global
 * statement) and nothing drew what had left.
 *
 * ⭐ ONE MODEL, EVERY VIEW. `moves` is the record; these helpers are the only
 * way a view asks about it, so the ring, the panel, the outline, the hover, the
 * label and the hint — and the sphere, when it comes — say the same thing in
 * the same words. A view that reads movedTo directly to decide what to SAY is
 * the drift this exists to prevent. `home` on a record is the course's original
 * identity, so a course moved twice still shows as gone from where it began. */
function stagedHere(cn, id){ return (cn in movedTo) && movedTo[cn]===id; }
function stagedMoveOf(cn){ for(var i=0;i<moves.length;i++) if(moves[i].cn===cn) return moves[i]; return null; }
function stagedAwayFrom(id){
  return moves.filter(function(m){ return m.from===id || m.home===id; });
}
function stagedCountHere(id){ var n=0; for(var i=0;i<moves.length;i++) if(moves[i].to===id) n++; return n; }
/* The phrase, written once. `at` is "here" (at the destination) or "away" (at
 * the identity the course left). */
function stagedWords(m, at){
  if(at==="here") return "staged here \u2014 not saved";
  var t=m?nodeById(m.to):null;
  return "staged to move to "+(t?(t.nd.t||m.to):(m?m.to:"another identity"))+" \u2014 not saved";
}
/* Put back: the staged move is dropped and the course is home again. */
function unstageMove(cn){
  /* Put back means BOTH halves: drop the staged move and return the course to
   * its spoke. Clearing only the move would leave it parked in open space with
   * nothing staged — visible, unexplained, and not what "put back" says. */
  parkClear(cn);
  if(!(cn in movedTo)) return false;
  var mv=stagedMoveOf(cn);
  delete movedTo[cn];
  moves=moves.filter(function(m){ return m.cn!==cn; });
  setHint("Put back <strong>"+esc(mv?mv.code:cn)+"</strong> \u2014 nothing is staged for it now."+
          (moves.length?" "+moves.length+" move"+(moves.length===1?"":"s")+" still staged.":""));
  drawWrites(); if(selNode) renderNode(); draw();
  return true;
}
/* What an identity's label and hover add when a move touches it. */
function stagedLabelSuffix(nd){
  var here=stagedCountHere(nd.i), away=stagedAwayFrom(nd.i).length;
  return (here?" \u00b7 "+here+" staged here":"")+(away?" \u00b7 "+away+" staged to move away":"");
}
function stagedTipLine(nd){
  var here=stagedCountHere(nd.i), away=stagedAwayFrom(nd.i).length;
  if(!here && !away) return "";
  return '<br><span class="sub">'+(here?here+' course'+(here===1?'':'s')+' staged here, not saved':'')+
         (here&&away?' \u00b7 ':'')+(away?away+' course'+(away===1?'':'s')+' staged to move away, not saved':'')+'</span>';
}
function stagedBandWords(nd){
  var here=stagedCountHere(nd.i), away=stagedAwayFrom(nd.i).length, ttl=' title="Staged in this browser only. Nothing is written from this page."';
  return (here?' \u00b7 <span class="chip ok"'+ttl+'>'+here+' staged here \u2014 not saved</span>':'')+
         (away?' \u00b7 <span class="chip staged"'+ttl+'>'+away+' staged to move away \u2014 not saved</span>':'');
}

/* ── draw ───────────────────────────────────────────────────────────────── */
function draw(){
  if(!ctx||!U) return;
  dimFrame(true);                 // the canvas cannot resize mid-draw: read it once
  try{ drawFrame(); } finally { dimFrame(false); }
}
function drawFrame(){
  var W=cw(), H=ch();
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,W,H);
  pal=readPal();
  ctx.fillStyle=pal.ground;
  ctx.fillRect(0,0,W,H);

  var kC=view.k;                 // the scale at the window's center — on the sphere each island has its own (islScale)
  var showLabels = kC>0.55;
  if(sphereOn()){
    prepSphere();
    if(proj==="globe"){
      var Rg=globeRpx();
      ctx.save();
      ctx.beginPath(); ctx.arc(W/2, H/2, Rg, 0, 6.2832);
      ctx.fillStyle=pal.island; ctx.globalAlpha=ctx.globalAlpha*0.35; ctx.fill(); ctx.globalAlpha=1;
      if(dayOn()){ ctx.clip(); drawClouds(W,H); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(W/2, H/2, Rg, 0, 6.2832); ctx.lineWidth=1; ctx.strokeStyle=pal.islandStroke; ctx.stroke();
    } else if(dayOn()) drawClouds(W,H);
  }
  var day=dayOn();
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
  paintIso();
  var labelQueue=[], nodeQueue=[], openList=[];
  memberPts=[]; discBoxes=[];
  /* ⭐ THE STAR PASS (S239). On the sphere at its opening width every one of
   * ~35,000 visible points is a star-sized dot, and drawing each with the flat
   * map's per-node path (an arc, a fill, a save/restore, four filter calls)
   * measured 117 ms a frame — a turn at 8 frames a second. A plain dot needs
   * none of that: it is batched into one path per color and alpha bucket and
   * filled once. Anything decorated — lit, ringed by a search or the selection,
   * halo-sized, a broken noncredit ring, an emptied shell, a label — keeps the
   * per-node path, so nothing the reader can see at that size changes. */
  var starBatches={}, starOrder=[], allShown=SHOW_KEYS.every(function(kk){ return show[kk]; });
  function starPush(color, alpha, x, y, r){
    var b=Math.round(alpha*8), key=color+"|"+b, B=starBatches[key];
    if(!B){ B=starBatches[key]={color:color, alpha:b/8, pts:[]}; starOrder.push(B); }
    B.pts.push(x, y, r);
  }
  function starFlush(){
    if(!starOrder.length) return;
    var ga=ctx.globalAlpha;
    starOrder.forEach(function(B){
      ctx.globalAlpha=ga*B.alpha; ctx.fillStyle=B.color; ctx.beginPath();
      var P=B.pts;
      for(var i=0;i<P.length;i+=3){ var r=P[i+2]; if(r<=1.8){ ctx.rect(P[i]-r, P[i+1]-r, 2*r, 2*r); } else { ctx.moveTo(P[i]+r, P[i+1]); ctx.arc(P[i], P[i+1], r, 0, 6.2832); } }
      ctx.fill();
      if(day){ ctx.lineWidth=0.8; ctx.strokeStyle=pal.dotRim; ctx.stroke(); }
    });
    ctx.globalAlpha=ga; starBatches={}; starOrder=[];
  }

  U.islands.forEach(function(isl){
    var c=islCenter(isl); if(!c) return;                            // out of view on the sphere
    var k=islScale(isl); if(!(k>0)) return;
    var showNodes = nodesShown(isl,k), showTethers = k>ID_ZOOM;
    var r=isl.r*k;
    if(c[0]+r<-60||c[0]-r>W+60||c[1]+r<-60||c[1]-r>H+60) return;   // cull
    // Every course in this discipline is switched off — so is the discipline.
    // This is the line that makes Show answer below NODE_ZOOM (see islandPass).
    if(!islandPass(isl)) return;

    ctx.beginPath(); ctx.arc(c[0],c[1],r,0,6.2832);
    /* ⭐ A TINT THAT FILLS THE WINDOW IS NOT A TINT — IT IS THE SKY (Sam,
     * 2026-09-07: "after filters applied the sky turns purple and should stay
     * the same as was selected (night) on opening screen").
     *
     * The selected island's fill says "this disc, not its neighbors" — it reads
     * against the ground AT ITS EDGE. Zoom past the point where that edge leaves
     * the window and there is no disc to distinguish any more: the fill is
     * simply what the reader is looking at. On the night sky that turned the
     * whole window #2E2A44, a blue-violet, and the sky read as having changed
     * color (measured off his recording, and reproduced at 6° across). The
     * selection is still said by the 2px stroke, by the name, and by the
     * inspector — none of which need the ground repainted.
     *
     * So the tint applies only while some part of the disc's edge is on screen.
     * The farthest window corner inside the circle means no edge is. */
    var farX=Math.max(c[0], W-c[0]), farY=Math.max(c[1], H-c[1]);
    var swallowsWindow = Math.sqrt(farX*farX+farY*farY) <= r;
    ctx.fillStyle = swallowsWindow ? pal.island
                  : isl===selIsl ? pal.islandSel
                  : isl===hoverIsl ? pal.islandHover : pal.island;
    ctx.fill();
    ctx.lineWidth = isl===selIsl?2:1;
    ctx.strokeStyle = isl===selIsl ? pal.sys0Stroke : pal.islandStroke;
    ctx.stroke();
    if(tokenIsl[isl.d]){                                   // a discipline in the selection
      ctx.beginPath(); ctx.arc(c[0],c[1],r+4,0,6.2832);
      ctx.lineWidth=2.4; ctx.strokeStyle=pal.ringToken; ctx.stroke();
    }
    if(lit && !showNodes && islandLit(isl)){
      /* Below NODE_ZOOM the map draws disciplines, not courses, and a light that
       * answers only past the zoom the map opens on is indistinguishable from a
       * broken control (the Show switches, 2026-09-05). So a discipline holding
       * a lit course carries the ring at that zoom, and the courses take it over
       * once they are drawn. Presence only: a discipline with none is untouched. */
      ctx.beginPath(); ctx.arc(c[0],c[1],r+2.5,0,6.2832);
      ctx.lineWidth=2; ctx.strokeStyle=pal.lit; ctx.stroke();
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
          var p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0), isl);
          var q=w2s(par.nd.x+(par.isl.dx||0), par.nd.y+(par.isl.dy||0), par.isl);
          if(!p||!q) return;
          ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]);
        });
        ctx.stroke(); ctx.restore();
        if(focus){
          ctx.save(); ctx.setLineDash([]); ctx.lineWidth=1.4; ctx.strokeStyle=pal.ringSel;
          ctx.beginPath();
          isl.p.forEach(function(nd){
            if(!nd.a||!nd.o||!(focus[nd.i]&&focus[nd.o])) return;
            var par=nodeById(nd.o); if(!par) return;
            var p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0), isl);
            var q=w2s(par.nd.x+(par.isl.dx||0), par.nd.y+(par.isl.dy||0), par.isl);
            if(!p||!q) return;
            ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]);
          });
          ctx.stroke(); ctx.restore();
        }
      }
      var fast = sphereOn() && k<ID_ZOOM && isl._s;     // star-sized dots, no labels, no rings: batch them
      var twOn = twinkleOn();                          // hoisted: cannot vary inside one frame
      var S=isl._s, ox=isl.x+(isl.dx||0), oy=isl.y+(isl.dy||0);
      isl.p.forEach(function(nd){
        if(!allShown && !creditShown(nd)) return;  // the CR / NC filter (item 9)
        var rad=nodeRad(nd, k), dr=dotRad(nd, rad);
        var dimmed = !!(focus && !focus[nd.i]);   // outside the clicked neighborhood
        var tw=twOn ? twinkleOf(nd) : 1;
        if(fast && !(lit && nd.ar>0) && !hitSet[nd.i] && nd!==selNode && !(isNC(nd) && dr>1.8) &&
           !(emitsLight(nd) && dr>=2.2 && !dimmed) && !(nd.a && emptied(nd))){
          var ddx=nd.x-ox, ddy=nd.y-oy;
          var sx=S.px+ddx*S.ex[0]+ddy*S.ey[0], sy=S.py+ddx*S.ex[1]+ddy*S.ey[1];
          /* ⭐ AN ISLAND ON SCREEN IS NOT AN ISLAND WHOSE POINTS ARE ON SCREEN
           * (S242). S241's angular cull settled which ISLANDS the window shows;
           * within one that passes, a discipline wider than the window keeps
           * spilling its courses past every edge. Measured at the opening
           * width: 5,755 of 27,931 batched dots a frame — 20.6% — lay wholly
           * outside the canvas, each paying a `starPush` (two string joins and
           * a bucket lookup) and a `rect` into a path that then rasterizes.
           *
           * ⚠️ The test belongs INSIDE this branch and nowhere earlier. Here
           * the node is a plain batched dot of radius `dr` that returns at
           * once: no halo, no articulations light, no search or selection ring,
           * no queued label, nothing in `openList`. So `dr` is the whole extent
           * and the test is exact. A point on the slow path can throw light up
           * to 22% of the canvas from off screen, and culling it by its own
           * center would put out a glow the reader can see. And `pick()` walks
           * the islands itself rather than reading anything the draw leaves
           * behind, so a dot skipped here is still a dot you can land on. */
          if(sx+dr<0||sx-dr>W||sy+dr<0||sy-dr>H) return;
          starPush(pal["sys"+((nd.s===0||nd.s===1||nd.s===2)?nd.s:3)+"Stroke"], (dimmed?DIM_ALPHA:1)*tw*(nd.a?ORPHAN_ALPHA:1),
                   sx, sy, dr);
          return;
        }
        var p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0), isl);
        if(dimmed || tw<1){ ctx.save(); ctx.globalAlpha=ctx.globalAlpha*(dimmed?DIM_ALPHA:1)*tw; }
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
        /* By day a dot exists by its edge (ruling 3): the seal-blue rim the
         * prototype drew, on every dot, because the silver star and the gold
         * light vanish on the day ground without it. */
        if(day){ ctx.lineWidth=Math.max(0.8, dr*0.34); ctx.strokeStyle=pal.dotRim; ctx.stroke(); }
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
        if(lit && nd.ar>0) lightAround(p[0], p[1], dr);   // the articulations light
        if(hitSet[nd.i]){                                  // search match ring
          ctx.beginPath(); ctx.arc(p[0],p[1],dr+4.5,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle=pal.ringSearch; ctx.stroke();
        }
        if(nd===selNode){
          ctx.beginPath(); ctx.arc(p[0],p[1],dr+7,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle=pal.ringSel; ctx.stroke();
        }
        if(dimmed || tw<1) ctx.restore();
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
          openList.push({nd:nd, isl:isl, p:p, rad:rad, k:k});
      });
    }
    starFlush();
    // Labels are COLLECTED here and placed after every island is drawn, so a
    // big island's name is never buried under a small neighbor's — and so
    // overlapping labels can be rejected rather than stacked.
    if(namesOn || isl===hoverIsl || isl===selIsl)
      labelQueue.push({isl:isl, cx:c[0], cy:c[1]-r-6, r:r,
                       force:(isl===hoverIsl||isl===selIsl)});
  });
  /* The two region names ride the sky when it is arranged by kind (ruling 6):
   * without them the order is a secret. They compete for space like any label. */
  if(sphereOn() && skyRegions && skyState==="ok") skyRegions.forEach(function(rg){
    if(rg.p) labelQueue.push({isl:null, text:rg.text, cx:rg.p[0], cy:rg.p[1], r:400, force:false, region:true});
  });

  // The open identities are drawn LAST, over their neighbors, with a halo that
  // lifts the ring out of a dense island: the faculty view has to be readable
  // exactly where the map is busiest. Their squares' labels are queued forced,
  // so they are placed before any neighbor's name can take the space.
  if(show.members) openList.forEach(function(o){ drawMembers(o.nd, o.isl, o.p, o.rad, o.k, nodeQueue, o.k<=MEMBER_ZOOM_ALL); });

  // Islands first: they are the navigational anchors, and a course name buried
  // under its own subject's name helps nobody. Course labels then fill the gaps
  // left over, and a label that cannot find one is dropped rather than stacked.
  titlesQueued=nodeQueue.length;
  /* ⚠️ The discs go in BEFORE the island names, so nothing lands on one. An open
   * identity's own label is exempt — it is placed at the disc's centre by the
   * `inside` branch, which runs before any box is consulted. */
  placedBoxes=placeNodeLabels(nodeQueue, placeLabels(labelQueue, showLabels).concat(discBoxes));

  if(drag && drag.kind==="course" && drag.px!=null){
    // The identity the release would write to, ringed on the map and named in
    // the label — so "nothing happened" can be seen coming rather than reported.
    if(drag.over && drag.overIsl){
      var dp=w2s(drag.over.x+(drag.overIsl.dx||0), drag.over.y+(drag.overIsl.dy||0), drag.overIsl);
      if(dp){
        ctx.beginPath(); ctx.arc(dp[0],dp[1],Math.max(9,nodeRad(drag.over, islScale(drag.overIsl))+6),0,6.2832);
        ctx.strokeStyle=pal.drag; ctx.lineWidth=2.5; ctx.stroke();
      }
    }
    ctx.beginPath(); ctx.arc(drag.px,drag.py,7,0,6.2832);
    ctx.fillStyle=pal.drag; ctx.fill();
    ctx.font="600 "+txPx(12)+"px 'Source Sans 3',system-ui,sans-serif";
    ctx.textAlign="left"; ctx.lineWidth=3.5; ctx.strokeStyle=pal.halo;
    var lbl=drag.code+(drag.over?" \u2192 "+trunc(drag.over.t||drag.over.i,42):"");
    ctx.strokeText(lbl,drag.px+12,drag.py+4);
    ctx.fillStyle=pal.drag; ctx.fillText(lbl,drag.px+12,drag.py+4);
  }
  paintZoomRead();
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

/* ── the articulations light (Sam's ruling 2, 2026-09-07) ──────────────────
 * "Light only what has a number." A gold glow and a thin ring on a point that
 * carries an articulation; nothing at all on one that does not. Capped like
 * haloAround so a lit point never becomes a lit canvas. The legend names the
 * glow in words, and the panel and the outline carry the count. */
function lightAround(cx, cy, r){
  var reach=Math.max(9, Math.min(r*3, Math.min(cw(), ch())*0.12));
  var g=null;
  try{ g = ctx.createRadialGradient(cx, cy, Math.max(0.5, r*0.8), cx, cy, reach); }catch(e){ g=null; }
  if(g){
    g.addColorStop(0, pal.litGlow); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath(); ctx.arc(cx, cy, reach, 0, 6.2832);
    ctx.fillStyle=g; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(cx, cy, r+3, 0, 6.2832);
  ctx.lineWidth=1.6; ctx.strokeStyle=pal.lit; ctx.stroke();
}
/* Memoized per island: does anything in it carry an articulation? */
function islandLit(isl){
  if(isl._lit==null){ var any=false; for(var i=0;i<isl.p.length;i++) if(isl.p[i].ar>0){ any=true; break; } isl._lit=any; }
  return isl._lit;
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
  /* With the light on or the CPL face up, the star of a college whose course
   * here is the RECEIVING course of an articulation takes the light's fill. */
  var artSet=(lit||face==="cpl") ? cplCollegesOf(nd) : null;
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
    /* Parked: drawn where the reader left it, not on its spoke. The spoke line
     * below still runs from the parent to (x,y), which is the point — it says
     * "this is still yours" while the course sits where it was put. */
    var park=parkedMem[m.cn];
    if(park){
      var pk=w2s(park.wx, park.wy, park.isl);
      if(pk){ x=pk[0]; y=pk[1]; }
    }
    var movedHere=(m.cn in movedTo) && movedTo[m.cn]===nd.i;
    var carried=drag && drag.kind==="course" && drag.cn===m.cn;
    ctx.beginPath(); ctx.moveTo(p[0]+rad*Math.cos(a), p[1]+rad*Math.sin(a)); ctx.lineTo(x,y);
    ctx.lineWidth=1; ctx.strokeStyle=pal.ringFaint; ctx.stroke();
    /* A college's own course is a small star on its spoke. Muted: it is evidence
     * for the identity at the centre, never a competitor for attention. */
    var artic=!!(artSet && artSet[m.c]);
    starPath(x, y, 5.2);
    ctx.fillStyle=movedHere?pal.sqMoved:carried?pal.sqCarried:artic?pal.litFill:pal.hollow; ctx.fill();
    ctx.lineWidth=artic?1.6:1.2; ctx.strokeStyle=movedHere?pal.sqMovedStroke:artic?pal.lit:sys[1]; ctx.stroke();
    memberPts.push({x:x, y:y, m:m, nd:nd, isl:isl});
    if(k>MEMBER_ZOOM || focus)
      // Short college names on the map (Sam, 2026-09-05: "Could use the short
      // names on the colleges throughout") — a ring of 24 spokes is where the
      // repeated word "College" costs the most and says the least.
      queue.push({mem:m, nd:nd, px:x, py:y, rad:4,
                  lines:[m.n+" · "+trunc(shortCollege(m.c),26)+(movedHere?" · staged here":"")], band:"member",
                  out:[Math.cos(a), Math.sin(a)],
                  force:!!focus || !!(memFilter && m.n===memFilter) || carried || movedHere});
  }
  /* ⭐ THE MARK AT THE ORIGIN (v4 item 7). A course staged to move away is still
   * DRAWN here — hollow, dashed, on a ring of its own outside the members, the
   * words on its label — so the identity it left says what left it and where it
   * went. membersOf() has already excluded it (one global statement), which is
   * exactly why the origin used to change nothing: the course simply vanished. */
  var away=stagedAwayFrom(nd.i);
  if(away.length){
    var RA=R0+rings*15, na=away.length;
    for(var gi=0;gi<na;gi++){
      var mv=away[gi], ga=-Math.PI/2+gi*2*Math.PI/Math.max(na,6)+0.2, gx=p[0]+RA*Math.cos(ga), gy=p[1]+RA*Math.sin(ga);
      ctx.save(); ctx.setLineDash([2,2]);
      ctx.beginPath(); ctx.moveTo(p[0]+rad*Math.cos(ga), p[1]+rad*Math.sin(ga)); ctx.lineTo(gx,gy);
      ctx.lineWidth=1; ctx.strokeStyle=pal.gone; ctx.stroke();
      starPath(gx, gy, 5.2); ctx.fillStyle=pal.hollow; ctx.fill(); ctx.lineWidth=1.2; ctx.strokeStyle=pal.gone; ctx.stroke();
      ctx.restore();
      memberPts.push({x:gx, y:gy, m:null, ghost:mv, nd:nd, isl:isl});
      if(k>MEMBER_ZOOM || focus)
        queue.push({mem:null, ghost:mv, nd:nd, px:gx, py:gy, rad:4,
                    lines:[mv.code+" · "+trunc(shortCollege(mv.college),26), stagedWords(mv,"away")], band:"member",
                    out:[Math.cos(ga), Math.sin(ga)], force:true});
    }
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
/* The outline of record's HTML for an identity — for tests that read its band
 * (the staged counts, the course count) without opening the view. */
window.__ccrOutlineHtml = function(id){ var t=nodeById(id); return t ? olHtml(t.nd, t.isl) : null; };

/* The CPL face's label: the credential that reaches the point leads, and a
 * point nothing reaches gets NO label (Sam's ruling 3, 2026-09-07). "+N" says
 * how many more credentials reach it; the full band adds the agencies. */
function cplLabelLines(nd, k){
  if(cplState!=="ok") return null;
  var b=cplOf(nd); if(!b) return null;
  var lead=cplCred(b[0][0]), n=b.length;
  var head=trunc(lead[0], k>TITLE_ZOOM?44:28)+(n>1?" +"+(n-1):"");
  if(k>FULL_ZOOM)
    return {band:"full", lines:[head, trunc((lead[1]||"issuing agency not recorded")+(lead[2]?" \u00b7 trained by "+lead[2]:""), 64)]};
  if(k>TITLE_ZOOM) return {band:"titled", lines:[head]};
  return {band:"brief", lines:[head]};
}
function labelLines(nd, k){
  if(k<=ID_ZOOM) return null;
  if(face==="cpl") return cplLabelLines(nd, k);
  var u=unitsShort(nd.u);
  var head=trunc(nd.t||nd.i, k>TITLE_ZOOM?44:28)+(u?" · "+u:"")+stagedLabelSuffix(nd);
  if(k>FULL_ZOOM){
    var col=loneCollege(nd);
    return {band:"full", lines:[head,
      nd.i+" · "+sysWord(nd)+(nd.a?" · stand-alone":"")+(col?" · "+col:"")]};
  }
  if(k>TITLE_ZOOM) return {band:"titled", lines:[head]};
  return {band:"brief", lines:[head]};
}

/* The island's name with its identity count — and on the CPL face, how many
 * credentials reach it. Presence only: a discipline nothing reaches keeps its
 * plain name rather than gaining a "0", which would claim a measurement the
 * join cannot make (95.7% of MAP's credit rows name no receiving course). */
function islandLabel(isl){
  var s=isl.d+" ("+num(isl.n)+")";
  if(face==="cpl" && cplState==="ok"){
    var c=cplIslandCounts()[isl.d];
    if(c) s+=" \u00b7 "+num(c.creds)+" credential"+(c.creds===1?"":"s");
  }
  return s;
}
/* ⭐ A FONT SIZE THAT DRIFTS IS RE-BUILT EVERY FRAME, AND IT SHIMMERS (S242).
 * An island label is sized off `q.r`, the drawn radius, so on the sphere it is
 * a float that moves a little every frame as the sky turns: 18.0263, 18.2506,
 * 18.1185. Two costs, and the second is the one Sam can see. Chromium builds a
 * font per novel size at its first USE — `measureText` was paying 11.2% for
 * that until the memo above stopped asking, whereupon `strokeText` picked up
 * the same bill at 9.6%. And the glyphs re-rasterize at a new size every
 * frame, which is a name that never quite settles.
 *
 * `txPx()` has rounded to whole pixels since it was written — "a fractional px
 * font measures fine and renders soft" — and the island labels were simply
 * never brought under that rule. They are now.
 *
 * ⚠️ WITH A DEAD BAND, because a bare round is a threshold on a drifting value
 * and this lane has paid for that twice (`NODE_ZOOM_KEEP`, and the tint that
 * became the sky). A raw size moving ~0.2px a frame would sit on 18.5 and flip
 * 18↔19 forever — a worse shimmer than the one being fixed. The remembered
 * size holds until the raw value is 0.6px away from it, so crossing costs a
 * deliberate zoom and coming back costs another. Region labels are a fixed
 * size already and never enter here. */
function labelSize(q, raw){
  var isl=q.isl; if(!isl) return Math.round(raw);
  var L=isl._ls;
  if(L===undefined || Math.abs(raw-L)>=0.6) L=isl._ls=Math.round(raw);
  return L;
}
/* Biggest first, reject anything that would overlap an already-placed label.
   Hover/selection always wins a slot — it is the one the reader asked for. */
function placeLabels(queue, showAll){
  var boxes=[];
  queue.sort(function(a,b){
    if(a.force!==b.force) return a.force?-1:1;
    return (b.isl?b.isl.n:9e9)-(a.isl?a.isl.n:9e9);
  });
  ctx.textAlign="center"; ctx.textBaseline="alphabetic";
  queue.forEach(function(q){
    if(!q.force && !showAll && q.r<26) return;          // too small to earn a name
    var size=labelSize(q, Math.max(11,Math.min(19,q.r*0.17))*tx()); if(q.region) size=Math.round(15*tx());
    ctx.font=(q.force||q.region?"700 ":"600 ")+size+"px 'Source Sans 3',system-ui,sans-serif";
    var lab=q.text || islandLabel(q.isl);
    var w=textW(lab), h=size*1.25;
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
    ctx.fillStyle=q.force?pal.inkForce:q.region?pal.inkMuted:pal.ink;
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
    var w=0; q.lines.forEach(function(t){ var tw=textW(t); if(tw>w) w=tw; });
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
/* `forDrop` — a CARRY resolves identity circles ONLY, never a member star.
 * ⭐ THE RULE BELOW IS RIGHT FOR READING AND WRONG FOR MOVING (Sam, 2026-09-07:
 * "courses no longer responsive after 2nd drag and drop … tried to drag a
 * selected [course] into to welding and processes and no go"). While an
 * identity is open its member ring SPREADS across its neighbors, so the
 * destination circle a curator aims at is routinely eclipsed by one of the
 * OPEN identity's own stars. The drop then resolved to the identity the course
 * is already in, applyMove() refused it as "That course is already there.",
 * and the refusal printed in a hint at the very bottom of the window — so the
 * gesture read as a dead map. Measured in Chromium 2026-09-07 with
 * Introduction to Welding open at 296%: six identity circles inside the
 * viewport sat under one of its stars, and a drop on each of the first three
 * moved nothing. The panel's own words are the contract — "Drag a course onto
 * a CIRCLE on the map" — so that is what a drop is allowed to land on. */
function pick(px,py,forDrop){
  var best=null;
  for(var i=U.islands.length-1;i>=0;i--){
    var isl=U.islands[i];
    var c=islCenter(isl); if(!c) continue;
    var kk=islScale(isl); if(!(kk>0)) continue;
    var r=isl.r*kk;
    if(Math.hypot(px-c[0],py-c[1])>r+12) continue;
    // What is not drawn cannot be picked. Without this, filtering to noncredit
    // and clicking where a credit course used to sit opened the inspector on an
    // invisible point — the filter would have been honored by the eye and not by
    // the hand, which is worse than no filter at all.
    if(!islandPass(isl)) continue;
    if(nodesOnScreen(isl,kk)){
      var found=null, fd=1e9, inside=false;
      for(var j=0;j<isl.p.length;j++){
        var nd=isl.p[j], p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0), isl);
        if(!creditShown(nd)) continue;
        var rad=Math.max(3.2,nodeRad(nd, kk));
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
      if(lastFocus && !forDrop){
        var fmem=pickMember(px,py,function(mp){ return !!lastFocus[mp.nd.i]; });
        if(fmem) return fmem;
      }
      // A pointer INSIDE the nearest identity's circle means that identity, even
      // where a neighbor's ring of squares crosses it; a square wins in the open.
      if(found && inside) return {isl:isl,nd:found};
      if(!forDrop){
        var mem=pickMember(px,py);
        if(mem) return mem;
      }
      if(found) return {isl:isl,nd:found};
    }
    best=best||{isl:isl,nd:null};
  }
  return (forDrop?null:pickMember(px,py))||best;
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
  return best?{isl:best.isl, nd:best.nd, mem:best.m, ghost:best.ghost||null}:null;
}

/* ── the view ─────────────────────────────────────────────────────────────── */
window.__ccrUniverse = function(opts){
  opts=opts||{};
  var wantSolo = opts.solo==null ? solo : !!opts.solo;
  var wantFace = opts.face ? (opts.face==="cpl"?"cpl":"courses") : face;
  /* Already on the map: switch the frame and keep the render. SkyView alone and
   * the comprehensive view are ONE canvas — the second merely shows the panes
   * below it — so switching between them keeps the zoom, the selection and the
   * moves. Re-rendering would have thrown all three away. */
  var wantProj = opts.proj ? ((opts.proj==="globe"||opts.proj==="map") ? opts.proj : "sky") : proj;
  if(cvs && document.getElementById("u-cvs")===cvs && U && U===window.CPL_CCR_UNIVERSE){
    if(wantFace!==face) setFace(wantFace, true);
    if(wantProj!==proj) setProj(wantProj);
    setSolo(wantSolo); return;
  }
  proj=wantProj;
  var view_el=document.getElementById("view");
  U=window.CPL_CCR_UNIVERSE; A=window.CPL_ATLAS_DATA||null;
  spreadUniverse(U);
  nodeIdx=null; orbitIdx=null; subjIdx=null; wsPaint=null;
  if(!authority) loadAuthority();
  if(!subjEdge) loadSubjectEdge();
  solo=wantSolo; face=wantFace;
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
            /* Ruling 3 (2026-09-07): on the Sky and the Globe the same control
             * reads Night | Day; one memory with the Map's Dark canvas row. */
            '<span class="u-nd" id="u-nd" role="group" aria-label="The sky" hidden>'+
              '<button class="u-more-t" type="button" id="u-night" aria-pressed="true" title="The night sky">Night</button>'+
              '<button class="u-more-t" type="button" id="u-day" aria-pressed="false" title="The day sky — CO blue with faint clouds">Day</button>'+
            '</span>'+
            /* Ruling 7: the prototype's Discipline names switch folds in here. */
            '<button class="u-more-t" type="button" id="u-names" aria-pressed="true" title="Discipline names on the map">Discipline names<span class="u-state">on</span></button>'+
            /* Ruling 3 (2026-09-06): label text sizes independently of the map's
               zoom. A word for the control and a word for its state, like the
               switches above it — never a pair of glyphs. */
            '<button class="u-more-t" type="button" id="u-textsize">Label text<span class="u-state">normal</span></button>'+
          '</div>'+
        '</details>'+
        '<h1 class="u-title" id="u-title">SkyView</h1>'+
        '<div class="u-search-slot" id="u-search-slot"></div>'+
        '<div class="u-bar" id="u-bar" role="toolbar" aria-label="Map controls">'+
          /* ── where the reader stands (Sam's rulings 1, 2 and 7, 2026-09-07):
           * three words. The Sky opens; the Globe and the Map are one click away. */
          '<span class="u-modes u-proj" role="group" aria-label="Where you stand">'+
            '<button class="btn mode" type="button" id="u-proj-sky" aria-pressed="true" title="Stand at the center and look out — the night sky through a window">Sky</button>'+
            '<button class="btn mode" type="button" id="u-proj-globe" aria-pressed="false" title="The sphere seen from outside">Globe</button>'+
            /* ⚠️ THE MAP BUTTON IS GONE FROM THE ROW, THE MAP IS NOT GONE FROM THE
             * CODE (Sam, 2026-09-08: "WE don't need the map view anymore, not with
             * this view showing so nicely"). This REVERSES his own sheet item 2 of
             * 2026-09-07 ("Sky · Globe · Map as three words, the Map stays"), and
             * the reversal is his — named here so it is not restored as a
             * regression. Only the control leaves: `proj==="map"` is still the flat
             * renderer the sphere is a projection OF, `#map` still routes, and
             * seven suites declare `CPL_SKYVIEW_OPENS="map"` to test on it. Putting
             * the word back is one line. */
          '</span>'+
          '<span class="u-modes u-turn" role="group" aria-label="Turning" id="u-turn-grp">'+
            '<button class="btn mode" type="button" id="u-rotate" aria-pressed="false" title="Turn the sky slowly on its own; it stops at your first touch">Rotate</button>'+
          '</span>'+
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
          /* ── the CPL face and the articulations light (Sam, 2026-09-07) ──
           * Next to Show, as the sheet drew them. Each is a word; the pressed
           * state is painted from module memory by paintFace/paintLit, never
           * written into the markup. */
          '<span class="u-modes u-face" role="group" aria-label="What a point is named by">'+
            '<button class="btn mode" type="button" id="u-face-courses" aria-pressed="true" '+
              'title="Name each point by its course">Courses</button>'+
            '<button class="btn mode" type="button" id="u-face-cpl" aria-pressed="false" '+
              'title="Name each point by the credential that reaches it">CPL</button>'+
          '</span>'+
          '<span class="u-modes u-litgrp" role="group" aria-label="Lights">'+
            '<button class="btn mode" type="button" id="u-lit" aria-pressed="false" '+
              'title="Light the courses that carry an articulation">Articulations</button>'+
          '</span>'+
          /* ── Isolate (Sam, 2026-09-09) — beside Show, because it is a filter,
           * not a light: it changes what is drawn, and the two next to each
           * other read as the pair they are. A word and its pressed state,
           * painted from module memory by paintIso like every other toggle
           * here — never written into the markup. */
          '<span class="u-modes u-isogrp" role="group" aria-label="Isolation">'+
            '<button class="btn mode" type="button" id="u-iso" aria-pressed="false" '+
              'title="Show only what is selected, and hide everything else">Isolate</button>'+
          '</span>'+
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
      /* The CPL face says its own coverage, in one line, where the reader is
       * looking. Inside #u-full so it exists in browser full screen. */
      '<p class="u-face-line" id="u-face-line" hidden></p>'+
      '<div class="u-stage" id="u-stage">'+
        '<div class="u-wrap" id="u-wrap">'+
          '<canvas id="u-cvs" tabindex="0" role="img" aria-label="'+
            'SkyView: the Common Course Reference as a sky you stand inside (Sky), a globe seen from outside (Globe), or a flat map (Map). '+
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
          '<span title="'+esc(SYSWHY[0])+'"><i class="u-sw s0"></i>M-ID, our working label</span>'+
          '<span title="'+esc(SYSWHY[1])+'"><i class="u-sw s1"></i>C-ID, official</span>'+
          '<span title="'+esc(SYSWHY[2])+'"><i class="u-sw s2"></i>CCN, official</span>'+
          /* v4 item 8 (Sam, 2026-09-06): "Maybe add a note to Unified and that
           * would be fine" — the note in the legend's own style, and the three
           * id systems carry their SYSWHY as the hover he asked for. */
          '<span title="'+esc(SYSWHY[3])+'"><i class="u-sw s3"></i>unified \u2014 a synthetic row standing in for a course identity; it carries no minted number of its own</span>'+
          '<span id="u-lg-lit" hidden><i class="u-sw lit"></i>lit \u2014 a gold glow on a course that carries an articulation; the rest are drawn as they are</span>'+
          '<span><i class="u-sw orphan"></i>stand-alone course — a smaller, lighter dot in orbit around its closest match</span>'+
          '<span><i class="u-sw nc"></i>noncredit — a broken ring around the dot, whatever the identity system</span>'+
          '<span><i class="u-sw member"></i>college course under an identity — a small star; click or hover an identity to open it</span>'+
        '</div>'+
        /* The footer hint takes the sky's words when the reader stands on the
         * sphere (ruling 7): a drag turns, the arrows turn, and the sky holds
         * still while a course is carried. */
        '<div class="u-hint" id="u-hint">Hover for a quick look; click a discipline or a course for details. '+
          (sphereOn()
            ? '<strong>Move</strong>: drag a stand-alone course or a college course onto the identity it belongs to '+
              '\u2014 the sky holds still while you carry one; drag the sky itself to turn it. <strong>Pan</strong>: drag '+
              'anywhere to turn the sky. Scroll to zoom; the buttons zoom on what you searched for or selected. '+
              'The sky turns on its own until you touch it; <strong>Rotate</strong> starts it again. '+
              'From the keyboard: <kbd>Tab</kbd> steps through disciplines, <kbd>Enter</kbd> goes into one, '+
              '<kbd>Esc</kbd> comes back out, arrows turn the sky.'
            : '<strong>Move</strong>: drag a stand-alone course or a college course onto the identity it belongs to, '+
              'drag a discipline to pull it next to another, drag the background to pan. <strong>Pan</strong>: drag '+
              'anywhere to move the view. Scroll to zoom; the buttons zoom on what you searched for or selected. '+
              'From the keyboard: <kbd>Tab</kbd> steps through disciplines, <kbd>Enter</kbd> goes into one, '+
              '<kbd>Esc</kbd> comes back out, arrows pan.')+'</div>'+
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
  roster=null; nodeIdx=null; ensureCorpus();   // the map re-binds after a payload swap
  islSphere=null; U.islands.forEach(function(I){ I._s=null; });
  viewsMenuInto(document.getElementById("u-views-slot"));
  setSolo(solo, true);          // the body class must be on before fitCanvas measures
  setProj(proj, true);          // where the reader stands, painted; the sky payload asked for
  fitCanvas();
  if(!restoreCamera()) resetView();   // a return keeps the reader's place; a first open opens
  wire(); draw();
  if(sphereOn()) startTurn();   // the sky turns when it opens (ruling 4)
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
  var lineEl=document.getElementById("u-face-line");
  var th=(topEl?topEl.offsetHeight:0)+((lineEl&&!lineEl.hidden)?lineEl.offsetHeight:0), fh=footEl?footEl.offsetHeight:0, h;
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
  if(sphereOn()){
    sph.yaw=0; sph.pitch=0.15;
    /* ⚠️ THE OPENING WINDOW IS SET IN TWO PLACES — `sph`'s initializer and here,
     * and resetView() is what actually runs on open, so changing only the
     * initializer changes nothing (measured: still 150° across). Both say 94°
     * half = 188° across; see the initializer for why that width. */
    if(proj==="globe") sph.dist=3.0; else sph.half=Math.PI*94/180;   // 188° across
    syncViewK(); return;
  }
  var b=U.bounds, W=cw(), H=ch();
  var pad=60;
  view.k=Math.max(K_MIN, Math.min((W-pad)/(b.x1-b.x0), (H-pad)/(b.y1-b.y0)));
  view.x=-(b.x0+b.x1)/2; view.y=-(b.y0+b.y1)/2;
}
function zoomAt(px,py,factor){
  if(sphereOn()){ setSphereZoom(kCenter()*factor); draw(); return; }   // about the window's center: the turn slows with it
  var before=s2w(px,py);
  view.k=clampK(view.k*factor);
  var after=s2w(px,py);
  view.x+=after[0]-before[0]; view.y+=after[1]-before[1];
  draw();
}
function flyTo(x,y,k){
  anchor={x:x, y:y};
  if(sphereOn()){ faceWorld(x,y); setSphereZoom(k); draw(); return; }
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
  if(!p||p[0]<0||p[0]>cw()||p[1]<0||p[1]>ch()){
    if(sphereOn()) faceWorld(a[0],a[1]); else { view.x=-a[0]; view.y=-a[1]; }
    p=[cw()/2, ch()/2];
  }
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
  /* ── the CPL face searches the credential vocabulary (Sam's ruling 3,
   * 2026-09-07: typing "welding" on the CPL face finds credentials and
   * recommendations rather than course titles). The course rows give way to
   * credential, agency, recommendation and exhibit rows; disciplines and
   * college-course codes keep their places, because both are still how a
   * reader says "take me there". */
  var cplRows = (face==="cpl" && cplState==="ok") ? cplSuggestRows(term, startsWord) : null;
  if(cplRows) pts=[];
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
  var have=[subs.length, cplRows?cplRows.length:pts.length, mems.length];
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
  if(cplRows){
    var cr = ord==="name" ? cplRows.slice().sort(function(a,b){ return a.label.toLowerCase()<b.label.toLowerCase()?-1:1; }) : cplRows;
    cr.slice(0, want[1]).forEach(function(s){ out.push(s); });
  }
  else shown.forEach(function(p){
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
  out.more = (subs.length-want[0]) + ((cplRows?cplRows.length:pts.length)-want[1]) + (mems.length-want[2]);
  return out;
}
/* ── the credential vocabulary as a search index ────────────────────────────
 * Built once per payload: every credential name, issuing agency, training
 * agency, credit recommendation and MAP exhibit title, each pointing at the
 * identities it reaches. The kind is a WORD on the row, never a color. */
function cplIndex(){
  if(cplIndexCache) return cplIndexCache;
  var m={}, out=[];
  function add(kind, label, id){
    if(!label) return;
    var key=kind+"\u0000"+String(label).toLowerCase();
    var e=m[key]; if(!e){ e=m[key]={kind:kind, label:String(label), lc:String(label).toLowerCase(), ids:[], seen:{}}; out.push(e); }
    if(!e.seen[id]){ e.seen[id]=1; e.ids.push(id); }
  }
  if(CPL && CPL.by) Object.keys(CPL.by).forEach(function(id){
    CPL.by[id].forEach(function(e){
      var c=cplCred(e[0]);
      add("credential", c[0], id); add("agency", c[1], id); add("agency", c[2], id);
      e[1].forEach(function(r){
        add("exhibit", r[1], id);
        (r[3]||[]).forEach(function(x){ add("recommendation", x, id); });
      });
    });
  });
  out.forEach(function(e){ delete e.seen; });
  cplIndexCache=out;
  return out;
}
function cplMatches(term, startsWord){
  var hits=[];
  cplIndex().forEach(function(e){
    var t = e.lc===term ? 0 : (e.lc.indexOf(term)===0 || (startsWord && startsWord(e.lc))) ? 1 : e.lc.indexOf(term)>=0 ? 2 : -1;
    if(t<0) return;
    hits.push({e:e, tier:t});
  });
  hits.sort(function(a,b){ return a.tier-b.tier || b.e.ids.length-a.e.ids.length || a.e.label.localeCompare(b.e.label); });
  return hits;
}
var CPL_KIND_WORD={credential:"credential", agency:"agency", recommendation:"credit recommendation", exhibit:"MAP exhibit"};
var CPL_KIND_SHORT={credential:"CREDENTIAL", agency:"AGENCY", recommendation:"CREDIT REC", exhibit:"EXHIBIT"};
function cplSuggestRows(term, startsWord){
  return cplMatches(term, startsWord).slice(0, 400).map(function(h){
    var e=h.e, first=nodeById(e.ids[0]);
    return {kind:"cpl", cplKind:e.kind, kindWord:CPL_KIND_WORD[e.kind], kindShort:CPL_KIND_SHORT[e.kind], label:e.label,
            sub:"reaches "+num(e.ids.length)+" course"+(e.ids.length===1?"":"s"), ids:e.ids.slice(),
            isl:first?first.isl:null, nd:first?first.nd:null};
  });
}
function idsToHits(ids){
  var out=[];
  (ids||[]).forEach(function(id){ var h=nodeById(id); if(h) out.push({id:id, x:h.nd.x+(h.isl.dx||0), y:h.nd.y+(h.isl.dy||0), isl:h.isl, nd:h.nd}); });
  return out;
}
/* Every identity reached by anything in the vocabulary matching the term. */
function cplHits(term){
  var seen={}, ids=[];
  var wordRe=null; try{ wordRe=new RegExp("\\b"+term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")); }catch(e){ wordRe=null; }
  cplMatches(term, function(t){ return !!(wordRe && wordRe.test(t)); }).forEach(function(h){
    h.e.ids.forEach(function(id){ if(!seen[id]){ seen[id]=1; ids.push(id); } });
  });
  return idsToHits(ids.slice(0, 300));
}
/* The drawn stars' screen positions. The hit test is the only way a reader
 * reaches a college course on the canvas, and it was silently handing back the
 * wrong card for most of them (2026-09-06); without the coordinates a harness
 * can only scan blindly and hope. ⚠️ Deliberately NOT part of
 * __ccrUniverseState(): prototype/check_ccr_atlas.js serializes that whole
 * object across the CDP bridge several times per run, and this array is one
 * entry per drawn star. */
window.__ccrMemberPoints = function(){
  return memberPts.map(function(mp){ return {x:mp.x, y:mp.y, id:mp.nd.i, code:mp.m?mp.m.n:mp.ghost.code, ghost:!!mp.ghost}; });
};
window.__ccrSuggest = suggest;
window.__ccrTipHtml = tipHtml;
/* The CPL face and the light, for the harness and for COBI's frame. */
window.__ccrSetFace = function(f, quiet){ setFace(f, quiet==null ? true : !!quiet); };
window.__ccrSetLit = function(on, quiet){ setLit(on, quiet==null ? true : !!quiet); };
window.__ccrLabelLines = labelLines;
window.__ccrIslandLabel = islandLabel;
window.__ccrCplOf = function(id){ var h=nodeById(id); return h ? cplOf(h.nd) : null; };
window.__ccrCplLine = cplLineText;
window.__ccrCplLoad = loadCpl;

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
/* ⭐ DRAGGING THE BORDER SHUT IS THE WAY TO SHUT IT (Sam, 2026-09-07: "Make the
 * Sidebar vert border able to close further (almost to nothing) so I don't have
 * to know that the hide/unhide selector is in the 3-dot menu").
 *
 * The grip clamped at 260px, so the panel could be made narrow and never
 * closed: closing lived only behind the ⋮ menu, which is exactly the thing a
 * reader has no way to guess. A border you can pull shut is self-evident, and
 * it is where a reader reaches first. Below the collapse point the panel simply
 * closes — and because the grip stays on the stage's edge when it is closed,
 * the same drag opens it again.
 *
 * 260 is still the narrowest USEFUL width — the panel's own rows stop fitting
 * below it — so the band between the collapse point and 260 is a dead zone that
 * snaps one way or the other rather than a size anyone can rest at. */
var INSP_COLLAPSE=150;
function setInspWidth(px){
  var b=inspBounds();
  if(px>0 && px<INSP_COLLAPSE){        // pulled shut
    inspHidden=true; setInspector(false);
    return;
  }
  if(px>0 && !inspOpen){               // pulled back out
    inspHidden=false; setInspector(true);
  }
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
    /* ⚠️ A CLOSED PANEL MEASURES ZERO, so stepping "wider" from it would land
     * under the collapse point and shut it again — the keyboard could close the
     * panel and never reopen it. From closed, one step out goes to the narrowest
     * useful width. */
    var cur = !inspOpen ? 0 : (inspW>0 ? inspW : (a.getBoundingClientRect().width||0));
    if(e.key==="ArrowLeft"){ e.preventDefault(); setInspWidth(cur ? cur+20 : inspBounds()[0]); }
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
  if(s.kind==="cpl"){
    /* A credential, an agency, a recommendation or an exhibit: ring every
     * course it reaches; one course opens as a course pick would. */
    var chits=idsToHits(s.ids);
    if(!chits.length){ setHint("Nothing on the map is reached by <strong>"+esc(s.label)+"</strong>."); return false; }
    healHits(chits);
    searchHits=chits; searchTerm=String(s.label||"").toLowerCase();
    var csubj={}; chits.forEach(function(h){ csubj[h.isl.d]=(csubj[h.isl.d]||0)+1; });
    var cnames=Object.keys(csubj).sort(function(a,b){ return csubj[b]-csubj[a]; });
    if(chits.length===1){
      selNode=chits[0].nd; selIsl=chits[0].isl; memFilter="";
      flyTo(selNode.x+(selIsl.dx||0), selNode.y+(selIsl.dy||0), COURSE_ZOOM);
      showNode(selNode, selIsl, false);
    } else {
      selNode=null; fitSelection(chits, []);
    }
    setHint("<strong>"+esc(s.label)+"</strong> ("+esc(s.kindWord||"CPL")+") reaches <strong>"+num(chits.length)+"</strong> course"+(chits.length===1?"":"s")+
      " across "+cnames.length+" discipline"+(cnames.length===1?"":"s")+": "+cnames.slice(0,4).map(function(n){ return esc(n)+" ("+csubj[n]+")"; }).join(" \u00b7 ")+
      (cnames.length>4?" \u00b7 \u2026":"")+". Ringed in red."+healWords());
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
          staged:{awayFrom:stagedAwayFrom, here:stagedHere, countHere:stagedCountHere, of:stagedMoveOf, words:stagedWords, unstage:unstageMove},
          proj:proj, sph:{yaw:sph.yaw, pitch:sph.pitch, half:sph.half, dist:sph.dist, spin:sph.spin}, rotating:rotating, reduceMotion:reduceMotion,
          dark:dark, day:dayOn(), darkChoice:darkChoice, namesOn:namesOn, skyState:skyState,
          /* Parked courses, so a test can assert a drop STAYED rather than
           * inferring it from a hint string — the hint is wording, this is the
           * state the drawing actually reads. */
          parked:Object.keys(parkedMem),
          parkedAt:function(cn){ var q=parkedMem[cn]; return q ? {wx:q.wx, wy:q.wy} : null; },
          regions:(skyRegions||[]).map(function(r){ return {text:r.text, on:!!r.p}; }),
          islandScreen:function(name){ var I=null; if(U) U.islands.forEach(function(x){ if(x.d===name) I=x; }); if(!I) return null; var c=islCenter(I); return c ? {x:c[0], y:c[1], k:islScale(I), r:I.r*islScale(I)} : null; },
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
          // Where the release would write. A ring painted on a canvas cannot be
          // asked about, and this is the thing that tells a curator a drop will
          // land at all — the state Sam had no reading of when he reported the
          // map dead ("no go", 2026-09-07).
          dropTarget:(drag&&drag.kind==="course"&&drag.over)?drag.over.i:null,
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
          mode:mode, anchor:anchor, memberZoom:MEMBER_ZOOM, memberZoomAll:MEMBER_ZOOM_ALL,
          memberPoints:memberPts.filter(function(mp){ return !!mp.m; }).length,
          ghostPoints:memberPts.filter(function(mp){ return !!mp.ghost; }).length,
          memberOwners:memberPts.reduce(function(o,mp){ o[mp.nd.i]=(o[mp.nd.i]||0)+1; return o; }, {}),
          hover:hoverNode?hoverNode.i:null,
          face:face, lit:lit, cpl:cplState, cplLine:(face==="cpl"?cplLineText():null),
          cplReached:(CPL&&CPL.by)?Object.keys(CPL.by).length:0};
};

/* ── tooltip ────────────────────────────────────────────────────────────────
 * The quick look (Sam: "see course and cluster details on click or hover"). A
 * tooltip follows the pointer; the inspector holds the full card on click. */
/* The hover on the CPL face: the credential leads, then the agencies, then
 * what it earns and who holds it; the course is the last line. */
function cplTipHtml(hit){
  var nd=hit.nd, b=cplOf(nd); if(!b) return null;
  var lead=cplCred(b[0][0]), rows=b[0][1], ex=rows[0], held=cplHeld(rows);
  var recs=ex[3]||[];
  return '<b>'+esc(lead[0])+'</b>'+(lead[1]?' \u00b7 '+esc(lead[1]):'')+
    (lead[2]?'<br><span class="sub">Training: '+esc(lead[2])+'</span>':'')+
    '<br><span class="sub">'+esc(cplType(ex[2]))+
      (recs.length?' \u00b7 earns '+esc(recs.slice(0,2).join("; "))+(recs.length>2?' \u2026':''):'')+
      ' \u00b7 held by '+num(held)+' college'+(held===1?'':'s')+'</span>'+
    '<br><span class="sub">'+(b.length>1?num(b.length)+' credentials reach ':'reaches ')+esc(nd.i)+' '+esc(trunc(nd.t||"",36))+
      (hit.isl?' \u00b7 '+esc(hit.isl.d):'')+'</span>';
}
function tipHtml(hit){
  if(face==="cpl" && hit.nd && !hit.mem && cplState==="ok"){ var ch=cplTipHtml(hit); if(ch) return ch; }
  if(hit.ghost){
    var g=hit.ghost, gt=nodeById(g.to);
    return '<b>'+esc(g.code)+'</b> '+esc(shortCollege(g.college))+
      '<br><span class="sub">'+esc(stagedWords(g,"away"))+(gt?' ('+esc(gt.isl.d)+')':'')+
      '. Was under '+esc(hit.nd.i)+'; Put back in the panel drops the staged move.</span>';
  }
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
    var artic=(lit||face==="cpl") ? ((cplCollegesOf(hit.nd)||{})[m.c]||null) : null;
    return '<b>'+esc(m.n)+'</b> '+esc(shortCollege(m.c))+
      (info&&info.title?'<br>'+esc(info.title):'')+
      '<br><span class="sub">'+(info&&info.units!=null?esc(unitsWord(info.units))+' · ':'')+
      'college course under '+esc(hit.nd.i)+' '+esc(trunc(hit.nd.t||"",36))+'</span>'+
      (body?'<br><span class="sub tip-desc">'+body+'</span>':'')+
      (artic?'<br><span class="sub">The receiving course for '+esc(artic.slice(0,3).join("; "))+(artic.length>3?' \u2026':'')+'</span>':'');
  }
  if(hit.nd){
    var nd=hit.nd, isl=hit.isl;
    var carried=(roster&&roster[nd.i]||[]).length;
    var h='<b>'+esc(nd.i)+'</b> '+esc(nd.t||"")+
      '<br><span class="sub">'+esc(unitsWord(nd.u))+' · '+esc(sysWord(nd))+' · '+
      num(carried)+' college course'+(carried===1?'':'s')+' · '+esc(isl.d)+
      // A loner's one college names it; the hover is where a reader asks "whose?"
      (loneCollege(nd)?' · '+esc(loneCollege(nd)):'')+'</span>';
    h+=stagedTipLine(nd);
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
  window.addEventListener("resize", function(){ if(document.getElementById("u-cvs")===cvs){ fitCanvas(); syncViewK(); draw(); } });
  cvs.addEventListener("wheel", function(e){
    e.preventDefault();
    var r=cvs.getBoundingClientRect();
    zoomAt(e.clientX-r.left, e.clientY-r.top, e.deltaY<0?1.16:1/1.16);
  }, {passive:false});
  document.getElementById("u-in").onclick=function(){ zoomStep(1.4); };
  document.getElementById("u-out").onclick=function(){ zoomStep(1/1.4); };
  document.getElementById("u-reset").onclick=function(){ searchHits=[]; resetView(); draw(); };
  ["sky","globe","map"].forEach(function(x){ var b=document.getElementById("u-proj-"+x); if(b) b.onclick=function(){ setProj(x); }; });
  var rb=document.getElementById("u-rotate"); if(rb) rb.onclick=function(){ if(rotating) stopTurn(); else startTurn(); };
  var bn=document.getElementById("u-night"), bd=document.getElementById("u-day");
  if(bn) bn.onclick=function(){ setDark(true); };
  if(bd) bd.onclick=function(){ setDark(false); };
  var nmb=document.getElementById("u-names"); if(nmb) nmb.onclick=function(){ namesOn=!namesOn; paintProj(); draw(); };
  function setMode(m){
    mode=m==="pan"?"pan":"move";
    ["pan","move"].forEach(function(x){
      var b=document.getElementById("u-mode-"+x); if(b) b.setAttribute("aria-pressed", x===mode?"true":"false");
    });
    cvs.style.cursor = mode==="pan"?"grab":"default";
    setHint(mode==="pan"
      ? (sphereOn()
          ? "<strong>Pan</strong>: drag to turn the sky; scroll to zoom; a click still selects. Switch to <strong>Move</strong> to carry a course."
          : "<strong>Pan</strong>: drag anywhere to move the view; a click still selects. Switch to <strong>Move</strong> to carry a course.")
      : (sphereOn()
          ? "<strong>Move</strong>: drag a stand-alone course or a college course onto the identity it belongs to \u2014 the sky holds still while you carry one; drag the sky itself to turn it."
          : "<strong>Move</strong>: drag a stand-alone course or a college course onto the identity it belongs to; drag a discipline to pull it next to another; drag the background to pan."));
  }
  var mpan=document.getElementById("u-mode-pan"), mmove=document.getElementById("u-mode-move");
  if(mpan) mpan.onclick=function(){ setMode("pan"); };
  if(mmove) mmove.onclick=function(){ setMode("move"); };
  window.__ccrSetMode=setMode;
  /* ── the CPL face and the light ───────────────────────────────────────── */
  var fc=document.getElementById("u-face-courses"), fp=document.getElementById("u-face-cpl"), lb=document.getElementById("u-lit");
  if(fc) fc.onclick=function(){ setFace("courses"); };
  if(fp) fp.onclick=function(){ setFace("cpl"); };
  if(lb) lb.onclick=function(){ setLit(!lit); };
  var ib=document.getElementById("u-iso");
  if(ib) ib.onclick=function(){ setIsolate(!isolate); };
  paintFace(); paintLit(); paintIso();
  if(face==="cpl" && cplState!=="ok")
    loadCpl(function(){ paintFace(); if(cvs && document.getElementById("u-cvs")===cvs){ fitCanvas(); draw(); } });
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
    hideTip(); stopTurn();                                  // the first touch stops the turn (ruling 4)
    // A course already picked up survives the press. Without this the pointerdown
    // replaced `drag` with a fresh node/island/pan grab before pointerup could
    // read it, so pressing "Drag…" and then clicking the destination — the only
    // route the hint text describes — selected the destination and moved nothing.
    if(drag && drag.kind==="course"){ drag.px=px; drag.py=py; return; }
    var hit=pick(px,py);
    // Pan mode: the drag moves the view whatever is under the pointer; the
    // click it started with still selects on release.
    var panGrab=function(){ return {kind:"pan", x0:px, y0:py, vx:view.x, vy:view.y, yaw0:sph.yaw, pitch0:sph.pitch, hit:hit, moved:false}; };
    if(mode==="pan"){ drag=panGrab(); return; }
    if(hit && hit.mem)     drag={kind:"member", isl:hit.isl, nd:hit.nd, mem:hit.mem, x0:px, y0:py, moved:false};
    else if(hit && hit.nd) drag={kind:"node", isl:hit.isl, nd:hit.nd, x0:px, y0:py, moved:false};
    /* On the sphere a discipline is placed by the daily build, not by a hand:
     * a drag on an island turns the sky (ruling 5), as the background does. */
    else if(hit && e.shiftKey===false && hit.isl && !sphereOn()) drag={kind:"island", isl:hit.isl, x0:px, y0:py,
                                                        ox:hit.isl.dx||0, oy:hit.isl.dy||0, moved:false};
    else drag=panGrab();
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
      if(sphereOn()){
        /* Drag to turn: the sky follows the hand. Pixels become radians at the
         * window's center scale, so a turn feels the same at every zoom. */
        var pr = proj==="globe" ? globeRpx() : skyKpx(), sg = proj==="globe" ? -1 : 1;
        sph.yaw = drag.yaw0 + sg*(px-drag.x0)/pr;
        sph.pitch = Math.max(-Math.PI*80/180, Math.min(Math.PI*80/180, drag.pitch0 + (py-drag.y0)/pr));
        draw(); return;
      }
      view.x=drag.vx+(px-drag.x0)/view.k; view.y=drag.vy+(py-drag.y0)/view.k; draw();
    } else if(drag.kind==="member"){
      /* Dragging a member square picks its course up — the same carry a hollow
       * point starts and the panel's Drag… button starts; the CN: row it would
       * write is the same one. */
      if(Math.abs(px-drag.x0)+Math.abs(py-drag.y0)>5){
        var mem=drag.mem, mgate=canMove(mem.cn);
        if(!mgate.ok){ setHint(sharedKeyReason(mem.cn, mem.n, mgate.others)); drag={kind:"pan", x0:px, y0:py, vx:view.x, vy:view.y, moved:true}; return; }
        drag={kind:"course", cn:mem.cn, d:mem.d, code:mem.n, college:mem.c, px:px, py:py, fromNode:drag.nd, fromIsl:drag.isl};
        setHint("Carrying <strong>"+esc(mem.n)+"</strong> ("+esc(mem.c)+") — drop it on the identity it belongs to.");
        draw();
      }
    } else if(drag.kind==="island"){
      drag.isl.dx=drag.ox+(px-drag.x0)/view.k;
      drag.isl.dy=drag.oy+(py-drag.y0)/view.k;
      if(Math.abs(px-drag.x0)+Math.abs(py-drag.y0)>3) drag.moved=true;
      draw();
    } else if(drag.kind==="course"){
      /* ⭐ THE DESTINATION IS NAMED WHILE THE COURSE IS STILL IN THE AIR. A drop
       * that lands on nothing and a drop that is refused looked identical from
       * the map, because both leave it exactly as it was; the only account of
       * either was a line in a hint bar at the foot of the window. Resolving the
       * target on the way (the same `forDrop` pick the release will use, so the
       * ring cannot promise a landing the drop will not make) puts the answer
       * under the pointer, where the hand already is. */
      drag.px=px; drag.py=py;
      var t=pick(px,py,true);
      drag.over=(t&&t.nd)?t.nd:null; drag.overIsl=(t&&t.nd)?t.isl:null;
      draw();
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
            drag={kind:"course", cn:m.cn, d:m.d, code:m.n, college:m.c, px:px, py:py, fromNode:drag.nd, fromIsl:drag.isl};
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
      var hit=pick(px,py,true);
      if(hit && hit.nd && drag.fromNode && hit.nd===drag.fromNode){
        // Released where it started: a click on the hollow point, not a move.
        selNode=hit.nd; selIsl=hit.isl; showNode(hit.nd, hit.isl); drag=null; draw(); return;
      }
      if(hit && hit.nd) applyMove(drag.cn, drag.code, drag.college, hit.nd.i, drag.d);
      else {
        /* ⭐ IT STAYS WHERE IT WAS LEFT. The old branch said "nothing moved" and
         * dropped the carry, so the course snapped back onto its spoke and the
         * reader's arrangement was lost every time a merge was not the point.
         *
         * The frame is the island dropped ON if there is one, else the island it
         * came FROM — a world point needs somebody's Jacobian on the sphere, and
         * those are the only two islands the gesture names. On the flat map s2w
         * needs none, so a null island is fine there and w2s takes the flat path.
         * If neither is available on the sphere, s2w returns null and the old
         * behavior stands rather than parking the course somewhere invented. */
        var pisl=(hit&&hit.isl)||drag.fromIsl||null;
        var w=s2w(px, py, pisl);
        if(w){
          parkedMem[drag.cn]={wx:w[0], wy:w[1], isl:pisl};
          setHint("<strong>"+esc(drag.code)+"</strong> left where you dropped it — nothing merged. "+
                  "Drag it onto an identity to merge it, or open it and press Put back.");
        } else {
          setHint("Dropped on empty space — nothing moved.");
        }
      }
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
    stopTurn();                                                   // a key is a touch (ruling 4)
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
    if(sphereOn()){                                               // the arrows turn the sky
      var turn=Math.PI*5/180, sg=proj==="globe"?-1:1;
      if(e.key==="ArrowLeft"){ sph.yaw+=sg*turn; draw(); e.preventDefault(); }
      if(e.key==="ArrowRight"){ sph.yaw-=sg*turn; draw(); e.preventDefault(); }
      if(e.key==="ArrowUp"){ sph.pitch=Math.min(Math.PI*80/180, sph.pitch+turn); draw(); e.preventDefault(); }
      if(e.key==="ArrowDown"){ sph.pitch=Math.max(-Math.PI*80/180, sph.pitch-turn); draw(); e.preventDefault(); }
    } else {
      if(e.key==="ArrowLeft"){ view.x+=step; draw(); e.preventDefault(); }
      if(e.key==="ArrowRight"){ view.x-=step; draw(); e.preventDefault(); }
      if(e.key==="ArrowUp"){ view.y+=step; draw(); e.preventDefault(); }
      if(e.key==="ArrowDown"){ view.y-=step; draw(); e.preventDefault(); }
    }
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
  if(face==="cpl" && cplState==="ok") searchHits=cplHits(term);   // the vocabulary, not the titles
  else U.islands.forEach(function(I){
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
  var head="<strong>"+num(searchHits.length)+"</strong>"+
    (face==="cpl" ? " course"+(searchHits.length===1?"":"s")+" reached by a credential, agency or credit recommendation matching “" : " match “")+esc(term)+
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
  stopTurn();                                                     // a search is a touch (ruling 4)
  var t=String(raw==null?"":raw).trim();
  if(t.length<2){ setHint("Type at least two characters."); draw(); return; }
  tokens=[]; addToken({kind:"term", key:"term:"+t.toLowerCase(), label:t, term:t});
}
function tokenFromSuggestion(s){
  if(s.kind==="subject") return {kind:"subject", key:"disc:"+s.isl.d, label:s.label, isl:s.isl, s:s};
  if(s.kind==="member") return {kind:"member", key:"mem:"+s.code+"@"+s.nd.i, label:s.code, isl:s.isl, nd:s.nd, code:s.code, s:s};
  if(s.kind==="cpl") return {kind:"cpl", key:"cpl:"+s.cplKind+":"+String(s.label).toLowerCase(), label:s.label, ids:s.ids, cplKind:s.cplKind, s:s};
  return {kind:"course", key:"crs:"+s.nd.i, label:s.nd.t||s.nd.i, isl:s.isl, nd:s.nd, s:s};
}
function tokenShort(t){ return t.kind==="cpl" ? (CPL_KIND_SHORT[t.cplKind]||"CPL") : kindShort(t.kind, t.nd); }
/* What a token contributes to the map: node hits to ring, islands to outline. */
function tokenHits(t){
  var out={hits:[], isls:[]};
  if(t.kind==="subject"){ out.isls.push(t.isl); return out; }
  if(t.kind==="cpl"){ out.hits=idsToHits(t.ids); return out; }
  if(t.kind==="course"||t.kind==="member"){
    out.hits.push({id:t.nd.i, x:t.nd.x+(t.isl.dx||0), y:t.nd.y+(t.isl.dy||0), isl:t.isl, nd:t.nd}); return out;
  }
  var term=String(t.term||"").toLowerCase();
  var named=U.islands.filter(function(I){ return I.d.toLowerCase().indexOf(term)>=0; });
  if(named.length){ out.isls=named; return out; }
  if(face==="cpl" && cplState==="ok"){ out.hits=cplHits(term); return out; }
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
    ["Career technical or academic", ["cte","aca","ctena"].map(W)],
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
    (face==="cpl" ? cplIslandHtml(isl) : "")+
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
    (moved?' <span class="chip ok">'+esc(stagedWords(stagedMoveOf(m.cn),"here"))+'</span>':"")+
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
/* ── the CPL block on the reading surfaces (the panel and the outline) ──────
 * Credential → issuing agency and, where it differs, the training agency →
 * what it earns → the colleges holding it (Sam's ruling 3 + his note,
 * 2026-09-07). The MAP exhibit's own title is the last line of each row, so a
 * college recognizes what it typed. */
function cplListHtml(b, cap){
  cap=cap||12;
  var items=b.slice(0, cap).map(function(e){
    var c=cplCred(e[0]), rows=e[1], held=cplHeld(rows);
    return '<li><div class="cpl-name">'+esc(c[0])+
        ' <span class="sub">\u00b7 held by '+num(held)+' college'+(held===1?'':'s')+'</span></div>'+
      '<div class="sub">'+(c[1]?'Issued by '+esc(c[1]):'Issuing agency not recorded')+
        (c[2]?' \u00b7 training by '+esc(c[2]):'')+'</div>'+
      rows.map(function(r){
        var recs=r[3]||[], cols=(r[4]||[]).map(function(i){ return shortCollege(cplCollege(i)); });
        return '<div class="cpl-ex"><span class="chip mut">'+esc(cplType(r[2]))+'</span> '+
          (recs.length?'<span class="cpl-earn">'+esc(recs.join("; "))+'</span>':'<span class="sub">no credit recommendation recorded</span>')+
          '<div class="sub">'+(cols.length?esc(cols.join(", ")):'no college named')+
            ' \u00b7 MAP exhibit: '+esc(r[1]||r[0])+
            (r[5]?' <span class="chip warn" title="In the articulation crosswalk, but not in today\u2019s MAP feed \u2014 kept and flagged rather than dropped.">not in today\u2019s feed</span>':'')+
          '</div></div>';
      }).join("")+'</li>';
  }).join("");
  return '<ul class="cpl-list">'+items+'</ul>'+
    (b.length>cap?'<p class="sub">Showing '+cap+' of '+num(b.length)+' credentials.</p>':'');
}
function cplPanelHtml(nd, isl){
  var b=(cplState==="ok")?cplOf(nd):null;
  var h='<h4 style="margin:.9em 0 .3em">Credit for prior learning reaching this course'+
    (b?' ('+num(b.length)+' credential'+(b.length===1?'':'s')+', '+num(cplExhibits(b))+' exhibit'+(cplExhibits(b)===1?'':'s')+')':'')+'</h4>';
  if(cplState==="loading"||cplState==="") return h+'<p class="empty">Loading MAP\u2019s articulation record\u2026</p>';
  if(cplState!=="ok") return h+'<p class="empty">'+esc(cplLineText())+'</p>';
  if(!b) return h+'<p class="empty">No MAP exhibit reaches this course through a receiving college course. '+esc(cplCeilingWords())+'</p>';
  return h+'<p class="sub">From MAP\u2019s articulation records, joined through the receiving college course \u2014 the only join there is. '+
    'The name is the curated credential; the agencies come from the credential reference.</p>'+cplListHtml(b, 12);
}
/* The discipline panel on the CPL face: what reaches this discipline. */
function cplIslandHtml(isl){
  if(cplState!=="ok") return '<p class="sub">'+esc(cplLineText())+'</p>';
  var c=cplIslandCounts()[isl.d];
  if(!c) return '<p class="sub">No MAP exhibit reaches a course in this discipline through a receiving college course. '+esc(cplCeilingWords())+'</p>';
  var by={}, list=[];
  isl.p.forEach(function(nd){
    var b=cplOf(nd); if(!b) return;
    b.forEach(function(e){
      var k=e[0], x=by[k]; if(!x){ x=by[k]={k:k, held:0, ids:[]}; list.push(x); }
      x.held+=cplHeld(e[1]); if(x.ids.indexOf(nd.i)<0) x.ids.push(nd.i);
    });
  });
  list.sort(function(a,b){ return b.held-a.held || cplCred(a.k)[0].localeCompare(cplCred(b.k)[0]); });
  var cap=10;
  return '<p><strong>'+num(c.creds)+'</strong> credential'+(c.creds===1?'':'s')+' reach'+(c.creds===1?'es':'')+' '+
      num(c.points)+' course'+(c.points===1?'':'s')+' in this discipline. The most-held first \u2014 pick one to open the course it reaches:</p>'+
    '<ul class="idlist cpl-isl">'+list.slice(0,cap).map(function(x){
      var cr=cplCred(x.k), first=x.ids[0], nd0=nodeById(first);
      return '<li><button type="button" class="ttl linkish" data-go="'+esc(first)+'">'+esc(cr[0])+'</button>'+
        '<div class="sub">'+(cr[1]?esc(cr[1]):'issuing agency not recorded')+(cr[2]?' \u00b7 training by '+esc(cr[2]):'')+
        ' \u00b7 reaches '+esc(nd0?(nd0.nd.t||first):first)+(x.ids.length>1?' and '+(x.ids.length-1)+' more':'')+'</div></li>';
    }).join("")+'</ul>'+(list.length>cap?'<p class="sub">Showing '+cap+' of '+num(list.length)+'.</p>':'');
}
function renderNode(){
  var nd=selNode, isl=selIsl;
  var el=document.getElementById("u-detail");
  /* The panel is the third thing that asks for the CPL payload (after the face
   * and the light): a course that carries an articulation lists what reaches
   * it on either face. Only while nothing has been asked yet — a terminal state
   * calls back at once and would re-render forever. */
  if((face==="cpl" || nd.ar>0) && (cplState===""||cplState==="loading"))
    loadCpl(function(){ if(selNode===nd && document.getElementById("u-detail")) renderNode(); });
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
  // On the CPL face the credentials LEAD; on the Courses face they follow the
  // college courses (below), and only for a course that carries an articulation.
  if(face==="cpl") h+=cplPanelHtml(nd, isl);
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
       (nd.a&&emptied(nd)?' Its one course is '+esc(stagedWords(stagedAwayFrom(nd.i)[0],"away"))+'.':'')+'</p>';
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
  /* ⭐ THE MARK AT THE ORIGIN, IN WORDS (v4 item 7): the courses staged to move
   * away from this identity, listed here until the move is written, each with
   * where it went and a Put back. Without this the origin's panel simply lost
   * a row, and Sam read that as nothing having happened. */
  var awayList=stagedAwayFrom(nd.i);
  if(awayList.length){
    h+='<h4 style="margin:.9em 0 .3em">Staged to move away ('+num(awayList.length)+')</h4>'+
      '<p class="sub">Listed here until the move is written, so what left this identity is never a silent absence. '+
      '<strong>Put back</strong> drops the staged move.</p>'+
      '<ul class="mlist">'+awayList.map(function(mv){
        /* ⭐ A STAGED MOVE MUST BE RE-TARGETABLE FROM WHERE IT IS SHOWN (Sam,
         * 2026-09-07, on a course staged to the wrong identity: "Note how I
         * can't move this course out of its previous move to a new one — the
         * correct intro course").
         *
         * This row offered Put back and nothing else, so correcting a
         * destination meant undoing the move, finding the course again in the
         * origin's member list, and re-dragging — or travelling to the identity
         * it had been staged INTO, which is the one place its Drag button
         * survived. Both are the reader saying "not there, THERE", and the row
         * naming the wrong destination is exactly where they say it. The
         * shared-key gate rides along, or a re-target could write a CN the
         * corpus cannot resolve to one course. */
        var shared=coursesOn(mv.cn).length>1;
        return '<li class="away" data-cn="'+esc(mv.cn)+'"><span class="cd">'+esc(mv.code)+'</span>'+
          '<span class="co" title="'+esc(mv.college)+'">'+esc(shortCollege(mv.college))+'</span>'+
          ' <span class="chip staged">'+esc(stagedWords(mv,"away"))+'</span>'+
          '<button class="mv" type="button" data-cn="'+esc(mv.cn)+'" data-d="'+esc(mv.d||"")+
            '" data-code="'+esc(mv.code)+'" data-col="'+esc(mv.college)+'"'+(shared?' data-shared="1"':"")+
            ' title="Pick it up again and drop it on the identity it really belongs to">Move instead…</button>'+
          '<button class="putback" type="button" data-putback="'+esc(mv.cn)+'" title="Drop the staged move; the course is home again">Put back</button></li>';
      }).join("")+'</ul>';
  }
  if(face!=="cpl" && nd.ar>0) h+=cplPanelHtml(nd, isl);
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
  /* Put back (v4 item 7): the staged move is dropped and the course is home again. */
  Array.prototype.forEach.call(el.querySelectorAll("[data-putback]"), function(b){
    b.addEventListener("click", function(){ unstageMove(b.dataset.putback); });
  });
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
      stopTurn();                                                 // a carry is a touch (ruling 4)
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
  moves.push({cn:cn, d:d||(byCn[cn]&&byCn[cn].d)||"", code:code, college:college, to:toId, from:from, home:originOf(cn)||from});
  /* ⭐ THE CARRY ENDS WHERE THE MOVE IS STAGED, BY WHATEVER ROUTE (Sam,
   * 2026-09-07: "Staged move seems to clear but I can't drag it to the new
   * home"). The canvas paths cleared `drag` themselves; the PANEL paths — a
   * click on a destination, Move here, Accept — went straight to applyMove and
   * left the reader invisibly carrying the course they had just put down.
   * Nothing on screen said so, and the pick-up handlers refuse to start a
   * second carry while one is live, so from then on EVERY Drag button in the
   * panel was a no-op: the course could be put back but never moved anywhere
   * again, for the rest of the session. Reproduced end to end and pinned by
   * `tests/ccr_skyview_carry_release.test.js`. applyMove is the one place all
   * the routes meet, so the release belongs here — after the gates, which
   * return with the carry intact so another destination can still be chosen. */
  if(drag && drag.kind==="course" && drag.cn===cn) drag=null;
  /* A staged move re-homes the course, so its resting place is spent. */
  parkClear(cn);
  var t=nodeById(toId);
  /* ⚠️ "Recorded below the map" NAMED A PLACE THE READER CANNOT SEE. `#u-writes`
   * lives in `#u-below`, and `body.u-solo` — SkyView, the default — hides that
   * whole pane. A curator who goes looking for the record and finds no pane at
   * all has been told their move went somewhere it did not. Say what is true
   * where they are standing. */
  var solo=document.body.classList.contains("u-solo");
  setHint("Staged to move <strong>"+esc(code)+"</strong> ("+esc(college)+") to <strong>"+
          esc(t?(t.nd.t||toId):toId)+"</strong>"+(t?" in "+esc(t.isl.d):"")+" \u2014 not saved. "+
          (solo ? moves.length+" move"+(moves.length===1?"":"s")+" staged in this browser, listed under the map in the comprehensive view."
                : "Recorded below the map."));
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
            work:"work", outline:"outline", globe:"globe", map:"map"};
/* `#skyview` is the Sky (the view that opens, ruling 1); `#globe` and `#map` name
 * the other two places to stand, each with the CPL face one `/cpl` away. */
function projKeyOf(p){ return p===OPENS ? "skyview" : p==="globe" ? "globe" : p==="map" ? "map" : "skyview"; }
function projOfKey(k){ return k==="globe" ? "globe" : k==="map" ? "map" : OPENS; }
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
    /* The way back to the rest of the work (Sam, 2026-09-07: "Need a COBI link
     * on the 3-dot menu"). Stand-alone, SkyView is a page on its own with no
     * route to COBI but the browser's history — and a reader who arrived on a
     * shared link has no history to go back through. Only when NOT framed:
     * inside COBI this would be a door onto the room you are standing in, the
     * same reason the CCR table view is a message rather than a link there. */
    items.push('<a class="linkish" id="u-cobi" href="../index.html" target="_blank" rel="noopener" '+
      'title="COBI — the dashboard SkyView belongs to">COBI ↗</a>');
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
  var key = curView==="skyview" ? projKeyOf(proj) : HASH_OF[curView];
  var h="#"+key+(arg ? "/"+encodeURIComponent(arg) : "");
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
  /* `#skyview/cpl` opens the map on the CPL face — a face is a lens, but a
   * lens the reader can send someone a link to. */
  if(k==="comprehensive") window.__ccrUniverse({solo:false, face:(arg==="cpl")?"cpl":"courses"});
  else if(k==="disciplines") window.__ccrWorkspace("discipline");
  else if(k==="subjects") window.__ccrWorkspace("subject");
  else if(k==="esl") window.__ccrWorkspace("esl");
  else if(k==="how") window.__ccrHow();
  /* A subject the payload cannot resolve falls back to the map rather than to a
   * blank view — a hand-typed or stale link is a normal thing to arrive with. */
  else if(k==="work" && arg && typeof window.__ccrDiscipline==="function") window.__ccrDiscipline(arg);
  else if(k==="outline" && arg && typeof window.__ccrOutline==="function") window.__ccrOutline(arg);
  else window.__ccrUniverse({solo:true, proj:projOfKey(k), face:((k==="skyview"||k==="globe"||k==="map") && arg==="cpl")?"cpl":"courses"});
};
/* Compare the SUBJECT too, not just the key: #work/Welding and #work/Art are
 * both key "work", so a Back between two work surfaces would otherwise leave
 * the screen on the one the reader just left. */
window.addEventListener("hashchange", function(){
  var k=routeKey(), v=(k==="globe"||k==="map")?"skyview":k;
  if(v!==curView || routeArg()!==curArg || (v==="skyview" && projOfKey(k)!==proj)) window.__ccrRoute();
});

/* ── the face and the light: state painted from every path that changes it ─
 * (a class toggle is not a re-render — 2026-09-05). */
function paintFace(){
  var a=document.getElementById("u-face-courses"), b=document.getElementById("u-face-cpl");
  if(a) a.setAttribute("aria-pressed", face==="courses"?"true":"false");
  if(b) b.setAttribute("aria-pressed", face==="cpl"?"true":"false");
  var full=document.getElementById("u-full"); if(full) full.classList.toggle("u-face-cpl", face==="cpl");
  var line=document.getElementById("u-face-line");
  if(line){ line.hidden = face!=="cpl"; if(face==="cpl") line.innerHTML=cplLineHtml(); }
  paintLegendLit();
}
function paintLit(){
  var b=document.getElementById("u-lit");
  if(b){ b.setAttribute("aria-pressed", lit?"true":"false"); b.title = lit ? "Put the light out" : "Light the courses that carry an articulation"; }
  paintLegendLit();
}
function paintLegendLit(){ var el=document.getElementById("u-lg-lit"); if(el) el.hidden=!lit; }
/* ⚠️ CALLED FROM draw(), SO IT IS MEMOIZED. The button's enabled state depends
 * on the SELECTION, which changes from half a dozen places — a search, a token,
 * a click on a point, a click on empty ground, Esc. Painting it from each of
 * them is a list to keep in step and a bug the first time somebody adds a
 * seventh; painting it from the one funnel every one of them already reaches
 * cannot go stale. draw() runs on every rotation frame, so the work is guarded
 * by a signature rather than done 60 times a second. */
var _isoSig=null;
function paintIso(force){
  var b=document.getElementById("u-iso");
  if(!b) return;
  var can = searchHits.length>0 || !!selNode || !!selIsl;
  var sig = (isolate?"1":"0")+(can?"1":"0");
  if(!force && sig===_isoSig) return;
  _isoSig=sig;
  b.setAttribute("aria-pressed", isolate?"true":"false");
  /* Disabled with nothing selected rather than silently doing nothing: a toggle
   * that can be pressed and changes not one pixel is the "inert control" the
   * Show switches were fixed for. The reason travels with it in the title. */
  b.disabled = !can && !isolate;
  b.title = b.disabled
    ? "Select a discipline or a course first \u2014 Isolate hides everything else"
    : isolate ? "Bring the rest of the universe back"
              : "Show only what is selected, and hide everything else";
}
function repaintSelection(){ if(selNode && selIsl) renderNode(); else if(selIsl) showIsland(selIsl); }
function cplFaceWords(){
  var c=cplCounts();
  return "<strong>CPL</strong>: each point is named by the credential that reaches it \u2014 "+
    num(c.exhibits_on_map||0)+" of "+num(c.exhibits_articulated||0)+" articulated exhibits reach a course on this map. "+
    "Search finds credentials, agencies and credit recommendations; a point no exhibit reaches stays drawn and unlabeled.";
}
function setFace(f, quiet){
  face = (f==="cpl") ? "cpl" : "courses";
  if(curView==="skyview"||curView==="comprehensive"){ curArg = face==="cpl" ? "cpl" : ""; syncHash(curArg||undefined); }
  var after=function(){
    paintFace(); repaintSelection();
    if(cvs && document.getElementById("u-cvs")===cvs){ fitCanvas(); draw(); }
  };
  if(face==="cpl" && cplState!=="ok"){
    if(!quiet) setHint("Loading MAP\u2019s articulation record\u2026");
    loadCpl(function(){ if(!quiet && face==="cpl") setHint(cplState==="ok" ? cplFaceWords() : esc(cplLineText())); after(); });
    after(); return;
  }
  if(!quiet) setHint(face==="cpl" ? cplFaceWords()
    : "<strong>Courses</strong>: each point is named by its course again. Switch to <strong>CPL</strong> to name it by the credential that reaches it.");
  after();
}
function setLit(on, quiet){
  lit=!!on; paintLit();
  if(lit && cplState==="") loadCpl(function(){ if(cvs && document.getElementById("u-cvs")===cvs) draw(); });
  if(!quiet){
    var n=0, recs=0; if(U) U.islands.forEach(function(I){ I.p.forEach(function(nd){ if(nd.ar>0){ n++; recs+=nd.ar; } }); });
    var wide = view.k<=NODE_ZOOM ? " At this magnification the map draws <strong>disciplines</strong>: a discipline holding a lit course carries the ring, and the courses take it over as you zoom in." : "";
    setHint(lit
      ? "Lighting <strong>"+num(n)+"</strong> courses that carry an articulation ("+num(recs)+" articulation records). The rest are drawn as they are: no mark says \u201cnone\u201d, because a course nobody has looked at and a course nobody has articulated are the same thing on this feed."+wide
      : "Light out. Every course is drawn as it was.");
  }
  if(cvs && document.getElementById("u-cvs")===cvs) draw();
}

/* Isolate on/off. It re-counts every island (the signature changed), so the one
 * draw() below is the whole update — and the hint says what happened, because a
 * map that suddenly holds three points needs to say why. */
function setIsolate(on){
  var can = searchHits.length>0 || !!selNode || !!selIsl;
  if(on && !can){
    setHint("Nothing is selected yet \u2014 search for a discipline or click a course, then press <strong>Isolate</strong>.");
    paintIso(true); return;
  }
  isolate=!!on;
  paintIso(true);
  setHint(isolate
    ? "<strong>Isolated</strong> \u2014 only what you selected is drawn. Press Isolate again to bring the rest back."
    : "The whole universe is back in view.");
  draw();
}
window.__ccrIsolate=function(on){ if(on==null) return isolate; setIsolate(on); return isolate; };
function setSolo(on, quiet){
  solo=!!on; curView=solo?"skyview":"comprehensive"; curArg=(face==="cpl")?"cpl":"";
  document.body.classList.toggle("u-solo", solo);
  syncHash(curArg||undefined);
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
  if(!ensureCorpus()){ if(typeof window.__ccrForest==="function") window.__ccrForest(); return; }
  mode = WS_MODES[mode] ? mode : "discipline";
  if(mode==="esl" && !eslAvailable()) mode="discipline";
  if(!authority) loadAuthority();
  if(!subjEdge) loadSubjectEdge();
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
    /* ⭐ THE EDGE ANSWERS; THE VOTE ONLY FILLS IN (DR-25, Sam's item 3 of
     * 2026-09-08). The home discipline used to be the MODAL discipline of the
     * identities carrying the subject — so when those were blank the vote
     * returned blank, and the table reported "no discipline yet", which reads
     * as a statement ABOUT THE SUBJECT rather than about the rows underneath
     * it. Measured 2026-09-08: 148 of 344 subjects on the map voted blank, and
     * this repo's own map file named a discipline for eleven of them
     * (AERO→Aviation, PHTO→Photography, STAT→Mathematics …). A derived blank
     * that looks like an asserted one is self-fulfilling.
     * `homeSrc` is what each row says answered it. */
    var edge = subjEdge && subjEdge[c];
    r.voted = names[0];
    if(edge){
      r.home = edge; r.homeSrc = "edge";
      r.others = names.filter(function(n){ return n!==edge; });
      r.homeIsl = (r.disc[edge] && r.disc[edge].isl) || (r.disc[names[0]] && r.disc[names[0]].isl);
    } else {
      r.home = names[0]; r.homeSrc = subjEdge ? "vote" : "vote-unloaded";
      r.homeIsl = r.disc[r.home].isl;
      r.others = names.slice(1);
    }
  });
  subjIdx=by;
  return by;
}
window.__ccrSubjectIndex = subjectIndex;
function subjectRows(){
  var by=subjectIndex();
  return Object.keys(by).map(function(c){
    var r=by[c];
    return {key:(c+" "+r.home).toLowerCase(), code:c, n:r.n, sa:r.sa, home:r.home, others:r.others,
            homeSrc:r.homeSrc, voted:r.voted, rec:r};
  }).sort(function(a,b){ return b.n-a.n || b.sa-a.sa || a.code.localeCompare(b.code); });
}
function standingHtml(r){
  /* Sam's item 3 (2026-09-08): "say on the row which of the two answered." A
   * home that came from the edge is the authority speaking; one that came from
   * the vote is an inference off the rows, and a reader is entitled to know
   * which they are looking at. */
  if(noDiscipline(r.home))
    return 'no discipline yet <span class="ws-note">(no entry in the subject map, and its identities carry none)</span>';
  if(!authority) return '<span class="ws-note">loading…</span>';
  /* ⚠️ AND WHEN THE EDGE OVERRULES A REAL VOTE, SAY SO — ON EVERY BRANCH.
   * Measured 2026-09-08 against ccr_universe.json and the map file the page
   * itself fetches, NINE subjects disagree, not the four first recorded here:
   * ATHL (Physical Education vs Kinesiology, 1,101 points), THTR (1,093 of
   * 1,109), ESCI (465 of 476), ELEC (342 of 353), MUSC (127 of 134), ETHN
   * (Ethnic Studies vs 34 under Chicano Studies), PHTO (3 of 12), ESLN (a
   * malformed discipline name) and ENVS.
   * ⚠️ AND NONE OF THE NINE PRINTED (S243). `via` was built here and then
   * appended to ONE of the three returns below — the branch for a subject that
   * IS its home's Common SUBJ. A subject whose identities sit somewhere else is
   * by construction usually NOT that, so it fell to the umbrella or the
   * not-its-code branch, both of which dropped the note; ATHL and THTR did not
   * reach them at all, returning at the `!a` guard above. A note computed and
   * discarded is the same as no note: it has to ride every exit. */
  var voted = r.rec ? r.rec.voted : r.voted;
  var via = r.homeSrc==="vote"
    ? ' <span class="ws-note">(discipline inferred from its identities — not in the subject map)</span>'
    : (voted && voted!==r.home && !noDiscipline(voted))
      ? ' <span class="ws-note">(the subject map says ' + esc(r.home) + '; its identities sit under ' +
        esc(voted) + ')</span>'
      : '';
  var a=authority[r.home];
  if(!a) return '<span class="ws-note">no seed entry for '+esc(r.home)+'</span>'+via;
  if(a.cs===r.code) return 'the Common SUBJ of '+esc(r.home)+' '+chipsHtml(a)+proposedHtml(a)+via;
  if(a.umbrella.indexOf(r.code)>=0)
    return 'an umbrella code under '+esc(r.home)+' <span class="ws-note">(Common SUBJ '+esc(a.cs)+')</span>'+via;
  return 'not '+esc(r.home)+'’s code <span class="ws-note">(its Common SUBJ is '+esc(a.cs)+')</span>'+via;
}
/* Exposed for tests: the standing line is pure string-building off one row, so
 * jsdom can assert every branch without a canvas or a layout. */
window.__ccrStandingHtml = standingHtml;
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
/* ⭐ ONE SKILL, ONE ROW — THE KEY IS FOLDED, THE WORDS STAY THE COLLEGES'.
 * Sam, 2026-09-07: "duplicated skills." WELD M1109 listed "flux cored arc
 * welding" AND "flux-cored arc welding", one skill written two ways, because
 * olWords() keeps a hyphen inside a token: the hyphenated spelling is a
 * three-token phrase and the spaced one a four-token phrase, so nothing
 * downstream could see they were the same name. Plurals do it too. Measured
 * 2026-09-07 over all 46,317 identities that carry a catalog description:
 * 209 shown rows differ from another row on the same card only by a hyphen and
 * 835 only by a plural; 762 identities (1.6%) show at least one such pair.
 * With the fold below, the same sweep finds NONE. ⚠️ `sses` is in the -es family
 * on purpose: without it "processes" stems to "processe" and leaves 19 pairs
 * standing — process, business, class and discuss are exactly the words a
 * course description reaches for.
 *
 * ⚠️ FOLD AT THE COUNTING STEP, NOT AFTERWARDS. The confidence chip counts
 * COLLEGES, so a college that writes it both ways must still count once and two
 * colleges spelling it differently must count twice — collapsing finished rows
 * would keep whichever count was already wrong. Folding the key first makes
 * both cases come out right by construction. */
function olSingular(w){
  if(w.length<=3 || w.charAt(w.length-1)!=="s") return w;
  if(/(?:ss|us|is)$/.test(w)) return w;                 // process, status, analysis
  if(/ies$/.test(w)) return w.slice(0,-3)+"y";          // strategies → strategy
  if(/(?:sses|ches|shes|xes|zes)$/.test(w)) return w.slice(0,-2);   // processes → process
  return w.slice(0,-1);
}
/* The grouping key. Hyphens and apostrophes become spaces (olWords keeps them
 * inside a token, and a trailing one is common — "welding-" at a line break),
 * then each word loses a simple plural. */
function olFold(p){
  return String(p||"").toLowerCase().replace(/[-'\u2018\u2019]+/g," ")
    .replace(/\s+/g," ").trim().split(" ").map(olSingular).join(" ");
}
window.__ccrSkillFold = olFold;
/* Recurring 2-4 word content phrases, counted by how many COLLEGES name them.
 * A phrase is credited once per college however often that college repeats it,
 * so the count is agreement between institutions rather than verbosity. */
function olPhrases(descs){
  var cnt={}, surf={};
  descs.forEach(function(d){
    var seen={}, seenS={};
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
        var p=seg.join(" "), key=olFold(p);
        if(key){
          if(!seen[key]){ seen[key]=1; cnt[key]=(cnt[key]||0)+1; }
          /* The surface forms are counted per college too, so the row shows the
           * spelling the most colleges published rather than the first one the
           * scan happened to reach. Nothing is rewritten into a spelling nobody
           * wrote. */
          var sf=surf[key]||(surf[key]={}), sk=key+"\u0000"+p;
          if(!seenS[sk]){ seenS[sk]=1; sf[p]=(sf[p]||0)+1; }
        }
        break;                       // this position is spoken for
      }
    }
    });
  });
  var items=Object.keys(cnt).map(function(key){
    var forms=surf[key]||{}, best=null, bn=-1;
    Object.keys(forms).sort().forEach(function(f){ if(forms[f]>bn){ bn=forms[f]; best=f; } });
    return {p:best||key, k:key, n:cnt[key]};
  });
  /* ⭐ THE LONGEST NAME WINS ITS FAMILY. "gas tungsten arc welding" and
   * "tungsten arc welding" are one skill and the shorter is the fragment, so
   * candidates are considered LONGEST first and a phrase contained in one
   * already kept is dropped. The ratio guard is the exception that keeps this
   * honest: a short phrase named by far more colleges than the long one is a
   * skill in its own right ("shop safety" inside "shop safety practices"), not
   * a fragment of it. */
  // ⚠️ Length and containment read the FOLDED key, not the surface form — the
  // hyphenated spelling is a word shorter than the spaced one and would have
  // been ranked as the smaller name it is not.
  items.sort(function(a,b){
    return (b.k.split(" ").length-a.k.split(" ").length) || (b.n-a.n);
  });
  var kept=[];
  items.forEach(function(it){
    for(var i=0;i<kept.length;i++)
      if(kept[i].k.indexOf(it.k)>=0 && it.n <= kept[i].n*1.6) return;
    kept.push(it);
  });
  kept.sort(function(a,b){ return (b.n-a.n) || (b.k.split(" ").length-a.k.split(" ").length); });
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

/* ── the course outline as a SHEET OVER THE MAP ─────────────────────────────
 * Sam, 2026-09-07: *"Need a back button from course outline view to the
 * previous skyview and it should go back to where my focus was. Maybe best way
 * to avoid this is to make the course outline a popup that can be closed and we
 * never have to exit skyview."*
 *
 * ⭐ THE SECOND SENTENCE IS THE BETTER FIX, AND IT IS WHY THERE IS NO BACK
 * BUTTON HERE. Opening the outline replaced `#view`; coming back called
 * `__ccrUniverse()`, which rebuilds the map and calls `resetView()` — so the
 * reader returned to the opening camera, not to the course they had been
 * looking at. A Back control could only have restored a snapshot of the camera;
 * a sheet never disturbs it, because SkyView is still mounted underneath. The
 * state that is never lost needs no restoring.
 *
 * The full-page outline stays for the case it was built for: a reader arriving
 * cold on `#outline/<id>`, with no map behind them to return to.
 *
 * ⚠️ The sheet mounts inside `#u-full` — browser full screen paints only that
 * element, and SkyView is usually in it. */
var outlineSheetReturn=null;
function outlineSheetOpen(){ var s=document.getElementById("u-outline-sheet"); return !!(s && !s.hidden); }
function closeOutlineSheet(){
  var s=document.getElementById("u-outline-sheet"); if(!s || s.hidden) return false;
  s.hidden=true; s.innerHTML="";
  document.body.classList.remove("u-sheet-open");
  /* Hand focus back to whatever opened it, or to the canvas — never to the top
   * of the document, which would lose a keyboard reader's place on the map. */
  var back=outlineSheetReturn; outlineSheetReturn=null;
  try{ if(back && back.isConnected && back.focus) back.focus(); else if(cvs && cvs.focus) cvs.focus(); }catch(e){}
  return true;
}
window.__ccrCloseOutlineSheet=closeOutlineSheet;
function openOutlineSheet(nd, isl){
  var host=document.getElementById("u-full"); if(!host) return false;
  var s=document.getElementById("u-outline-sheet");
  if(!s){
    s=document.createElement("div");
    s.id="u-outline-sheet"; s.className="u-sheet"; s.hidden=true;
    host.appendChild(s);
  }
  outlineSheetReturn = (document.activeElement && document.activeElement!==document.body) ? document.activeElement : null;
  var title=(nd.t||nd.i);
  s.innerHTML='<button class="u-sheet-back" type="button" id="u-sheet-back" tabindex="-1" aria-hidden="true"></button>'+
    '<div class="u-sheet-card" role="dialog" aria-modal="true" aria-labelledby="u-sheet-t">'+
      '<div class="u-sheet-bar">'+
        '<span class="u-sheet-t" id="u-sheet-t" title="'+esc(title)+'">Course outline — '+esc(title)+'</span>'+
        '<button class="btn small" type="button" id="u-sheet-close" '+
          'title="Close the outline and go back to the map, where you left it">Close</button>'+
      '</div>'+
      '<div class="u-sheet-body" id="u-sheet-body"></div>'+
    '</div>';
  var body=document.getElementById("u-sheet-body");
  body.innerHTML=olHtml(nd, isl);
  olWire(nd, isl);
  s.hidden=false;
  document.body.classList.add("u-sheet-open");
  document.getElementById("u-sheet-close").addEventListener("click", closeOutlineSheet);
  document.getElementById("u-sheet-back").addEventListener("click", closeOutlineSheet);
  s.addEventListener("keydown", function(e){ if(e.key==="Escape"){ e.stopPropagation(); closeOutlineSheet(); } });
  try{ document.getElementById("u-sheet-close").focus(); }catch(e){}
  /* Same two late payloads the full page waits for — repaint in place, and only
   * while this sheet is still the one on screen. */
  var still=function(){ return outlineSheetOpen() && document.getElementById("u-sheet-body")===body; };
  loadDesc(isl, function(){ if(still()){ body.innerHTML=olHtml(nd, isl); olWire(nd, isl); } });
  if(cplState!=="ok") loadCpl(function(){ if(still()){ body.innerHTML=olHtml(nd, isl); olWire(nd, isl); } });
  return true;
}
window.__ccrOutline=function(id){
  if(!ensureCorpus()){ if(typeof window.__ccrForest==="function") window.__ccrForest(); return; }
  var hit=nodeById(id);
  /* The map is on screen: open over it and leave the camera alone. The hash is
   * deliberately NOT changed — the reader has not left SkyView, and a hash that
   * said otherwise would make Back in the browser a trap. */
  if(hit && cvs && document.getElementById("u-cvs")===cvs && openOutlineSheet(hit.nd, hit.isl)) return;
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
  /* The CPL layer arrives the same way: render without it, again when it lands. */
  if(cplState!=="ok") loadCpl(function(){
    if(routeKey()!=="outline" || routeArg()!==id) return;
    var el2=document.getElementById("view"); if(!el2) return;
    el2.innerHTML=olHtml(hit.nd, hit.isl);
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
      num(total)+' college course'+(total===1?"":"s")+stagedBandWords(nd)+
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
  /* ⭐ A REVIEWER MAY ADD ONE AND TAKE ONE OUT (Sam, 2026-09-07: "need to be
   * able to add or delete a skill on curate"). Both STAGE, like the title and
   * the subject beside them — nothing is written from this page, which is the
   * lane invariant.
   *
   * ⚠️ A REMOVAL IS RECORDED, NEVER DERIVED. `skillDrop` names the keys the
   * reviewer struck out, rather than the surface holding a snapshot of what
   * survived: the imputation re-runs whenever a catalog description lands, so a
   * "what is left" list would silently delete every skill that arrived after it
   * was taken. That is the S236 lesson, one layer up —
   * `methodology-a-snapshot-cannot-be-the-authority-on-intent`. */
  var dropped=st.skillDrop||{}, addedRows=st.skillAdd||[];
  var sk=descs.length?olPhrases(descs):[];
  var live=sk.filter(function(x){ return !dropped[x.k]; });
  var strong=live.filter(function(x){ return x.n>=2; }).slice(0,12);
  var thin  =live.filter(function(x){ return x.n===1; }).slice(0,10);
  var goneNames=sk.filter(function(x){ return dropped[x.k]; });
  Object.keys(dropped).forEach(function(k){
    if(!goneNames.some(function(x){ return x.k===k; })) goneNames.push({p:k, k:k, n:0});
  });
  var sbody;
  if(loading) sbody='<p class="empty">Loading…</p>';
  else {
    function dropBtn(x){
      return ' <button class="btn small ol-sk-act" type="button" data-drop="'+esc(x.k)+'" '+
        'title="Take this skill off the outline. Staged in this browser — nothing is written.">Remove</button>';
    }
    function skillRow(x){
      var sl=olSkillLevel(x.p), cf=olConfWord(x.n, descs.length, total);
      return '<li><span class="ol-sk">'+esc(x.p)+'</span>'+
        '<span class="chip '+(sl?"cid":"mut")+'" title="'+
          (sl?'Read off this skill’s own words.':'This skill names no level of its own. It does NOT inherit the course’s level — they are separate axes (Sam’s ruling, 2026-09-05).')+
        '">'+esc(sl||"level not stated")+'</span>'+
        '<span class="chip '+cf.c+'" title="'+esc(cf.t)+'">'+esc(cf.w)+'</span>'+dropBtn(x)+'</li>';
    }
    /* A reviewer's own skills lead the list. They came from a person who knows
     * the trade rather than from a catalog scan, so they are named as such and
     * carry the day they were staged — a curator's knowledge is an input to
     * attribute, not one to launder into an anonymous row. */
    function addedRow(a){
      var sl=olSkillLevel(a.p);
      return '<li><span class="ol-sk">'+esc(a.p)+'</span>'+
        '<span class="chip '+(sl?"cid":"mut")+'" title="'+
          (sl?'Read off this skill’s own words.':'This skill names no level of its own.')+
        '">'+esc(sl||"level not stated")+'</span>'+
        '<span class="chip gen" title="Typed on this page'+(a.at?' on '+esc(a.at):"")+
        '. Staged in this browser — nothing is written, and no catalog names it.">added by a reviewer</span>'+
        ' <button class="btn small ol-sk-act" type="button" data-unadd="'+esc(a.k)+'" '+
        'title="Take this skill back off the outline.">Remove</button></li>';
    }
    var listed=(addedRows.length?addedRows.map(addedRow).join(""):"")+
               (strong.length?strong.map(skillRow).join(""):"");
    sbody=(listed?'<ul class="ol-skills">'+listed+'</ul>'
                 :'<p class="empty">'+(descs.length
                     ? 'No topic is named by two or more colleges, so nothing here is corroborated.'
                     : 'No catalog description to impute from.')+'</p>')+
      (thin.length?'<details class="ol-thin"><summary>Named by a single college ('+thin.length+')</summary>'+
        '<p class="ol-src">Kept rather than dropped, and chipped so the thinness is visible '+
        '(Sam’s ruling, 2026-09-05). One catalog is evidence; it is just not agreement.</p>'+
        '<ul class="ol-skills">'+thin.map(skillRow).join("")+'</ul></details>':"")+
      (goneNames.length?'<details class="ol-thin"><summary>Removed by a reviewer ('+goneNames.length+')</summary>'+
        '<p class="ol-src">Struck out on this page, and named here rather than simply absent — a skill '+
        'that vanishes without a trace cannot be argued with. Staged in this browser; nothing is written.</p>'+
        '<ul class="ol-skills">'+goneNames.map(function(x){
          return '<li><span class="ol-sk">'+esc(x.p)+'</span>'+
            ' <button class="btn small ol-sk-act" type="button" data-restore="'+esc(x.k)+'">Put back</button></li>';
        }).join("")+'</ul></details>':"")+
      '<p class="row" style="margin:.9em 0 0"><button class="btn small" type="button" id="ol-sk-add">Add a skill</button> '+
        '<span class="sub">A skill no catalog names — what a learner walks out able to do. Staged, not written.</span></p>';
  }
  h+=olLayer("skills","Skills a learner would carry out of this course",
    'Imputed from the words the colleges wrote, not supplied by an agency. '+
    'Faculty write outcomes; industry writes skills — this layer translates, so no faculty member has to rewrite a course '+
    '(Sam, 2026-09-05). <strong>We hold no agency skill statements at all</strong>: 57 published welding credit '+
    'recommendations carry agency, title and hours, and not one skill statement. '+
    'A reviewer may add one the catalogs miss, or take one out; both stage here and nothing is written.',
    sbody, {tag:"imputed", tagClass:"gen", empty:!addedRows.length && !strong.length && !thin.length});

  /* ── layer 3: credit for prior learning — BUILT (Sam's rulings, 2026-09-07) ─
   * "Will want all this included on the COR and credential Exhibit": the
   * credential, its issuing agency and, where it differs, its training agency,
   * what it earns and who holds it — the same block the map's panel shows,
   * uncapped here. The military layer is not separate: an ACE exhibit is a row
   * of the same record with its type named. */
  var cb=(cplState==="ok")?cplOf(nd):null;
  var cbody, ctag, ctagClass="mut", cempty=false;
  if(cplState===""||cplState==="loading"){ cbody='<p class="empty">Loading MAP\u2019s articulation record\u2026</p>'; ctag="loading"; }
  else if(cplState!=="ok"){ cbody='<p class="empty">'+esc(cplLineText())+'</p>'; ctag="not loaded"; cempty=true; }
  else if(!cb){ cbody='<p class="empty">No MAP exhibit reaches this course through a receiving college course. '+esc(cplCeilingWords())+'</p>'; ctag="none reaches it"; cempty=true; }
  else { cbody=cplListHtml(cb, 200); ctag=num(cb.length)+" credential"+(cb.length===1?"":"s"); ctagClass="cid"; }
  var cc=cplCounts(), cf=cc.funnel||{};
  h+=olLayer("cpl","Credit for prior learning against this course",
    'From MAP\u2019s articulation records, joined through the receiving college course \u2014 the only join from a MAP exhibit to a course identity. '+
    'The name is the curated credential; the issuing agency and, where it differs, the training agency come from the credential reference. '+
    (cplState==="ok" ? '<strong>'+num(cc.exhibits_on_map||0)+' of '+num(cc.exhibits_articulated||0)+'</strong> articulated exhibits reach a course on the map at all'+
      (cf.rows ? ', and MAP\u2019s credit funnel names a receiving course on '+(Math.round(1000*(cf.rows_naming_course||0)/cf.rows)/10)+'% of its rows' : '')+
      ' \u2014 so an empty layer is a gap in the record, not a finding about the course.' : ''),
    cbody, {tag:ctag, tagClass:ctagClass, empty:cempty});

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
    'change is <strong>verified</strong> and <strong>admin-released</strong>. The controls below stage a '+
    'proposal in this browser, as do <strong>Add a skill</strong> and <strong>Remove</strong> in the skills '+
    'layer above. Nothing is written from this page.',
    '<p class="row">'+
      '<button class="btn small" type="button" id="ol-rename">Propose a different title</button> '+
      '<button class="btn small" type="button" id="ol-resubject">Propose a different subject</button>'+
      (st.title||st.subject||(st.skillAdd&&st.skillAdd.length)||(st.skillDrop&&Object.keys(st.skillDrop).length)
        ?' <button class="btn small" type="button" id="ol-revert">Drop the proposals</button>':"")+
    '</p>'+
    (st.subject?'<p class="ol-attr">Proposed Common SUBJ: <strong>'+esc(st.subject)+'</strong> '+
      '(was '+esc(subject)+') — staged, not saved.</p>':"")+
    ((st.skillAdd&&st.skillAdd.length)?'<p class="ol-attr">Skills added by a reviewer: <strong>'+
      esc(st.skillAdd.map(function(a){ return a.p; }).join(", "))+'</strong> — staged, not saved.</p>':"")+
    ((st.skillDrop&&Object.keys(st.skillDrop).length)?'<p class="ol-attr">Skills removed by a reviewer: <strong>'+
      esc(Object.keys(st.skillDrop).join(", "))+'</strong> — staged, not saved.</p>':"")+
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
  if(rv) rv.onclick=function(){
    delete st.title; delete st.subject; delete st.skillAdd; delete st.skillDrop;
    window.__ccrOutline(nd.i);
  };
  /* ── the skills a reviewer adds and strikes out ──────────────────────────
   * ⚠️ Keyed by the FOLDED phrase, the same key the imputation counts by, so a
   * reviewer who strikes out "flux-cored arc welding" has struck out "flux
   * cored arc welding" as well — one skill, however it is spelled. A key taken
   * off the surface form would come back the next time a catalog landed with
   * the other spelling. */
  var sa=document.getElementById("ol-sk-add");
  if(sa) sa.onclick=function(){
    var v=window.prompt("Add a skill a learner would carry out of "+(nd.t||nd.i)+".\n\n"+
      "Name the thing they can do, in the words the trade uses. This stages the skill in this "+
      "browser; nothing is written.", "");
    if(v==null) return;
    v=String(v).replace(/\s+/g," ").trim();
    if(!v) return;
    var key=window.__ccrSkillFold(v);
    if(!key) return;
    st.skillAdd=(st.skillAdd||[]).filter(function(a){ return a.k!==key; });
    st.skillAdd.push({p:v, k:key, at:new Date().toISOString().slice(0,10)});
    if(st.skillDrop) delete st.skillDrop[key];
    window.__ccrOutline(nd.i);
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-drop]"), function(b){
    b.onclick=function(){
      (st.skillDrop||(st.skillDrop={}))[b.dataset.drop]=1;
      window.__ccrOutline(nd.i);
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-restore]"), function(b){
    b.onclick=function(){ if(st.skillDrop) delete st.skillDrop[b.dataset.restore]; window.__ccrOutline(nd.i); };
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-unadd]"), function(b){
    b.onclick=function(){
      st.skillAdd=(st.skillAdd||[]).filter(function(a){ return a.k!==b.dataset.unadd; });
      window.__ccrOutline(nd.i);
    };
  });
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
/* ── BACK — the way out of any view the reader switched to ──────────────────
 * Sam, 2026-09-07: *"Would be good to have a back button on any skyview screen
 * user switches to."*
 *
 * The crumbs named where you were in the hierarchy, which is not the same
 * question as how you got here: the workspace's row read "Disciplines and
 * subjects" and nothing else, so a reader who reached it from the map had no
 * way back but the Views menu — and the Views menu rebuilds SkyView, which
 * resets the camera. Back returns to the view you came from, one step, and when
 * that view is the map it returns to the PLACE you were looking at.
 *
 * ⚠️ One step deep on purpose. A full history stack would have to agree with
 * the hash router, the Views menu and the browser's own Back; one step is the
 * question a reader actually asks ("put me back where I was") and it cannot
 * disagree with anything. */
var viewBack=null;
function viewEntry(key){ for(var i=0;i<VIEWS.length;i++) if(VIEWS[i].key===key) return VIEWS[i]; return null; }
window.__ccrBackEntry=function(){
  var v=viewEntry(viewBack); if(!v) return null;
  return {label:v.label, go:v.go};
};
window.__ccrLeaveView = function(view){
  homeSearch();
  var was=curView;
  if(was && view && was!==view){
    if(was==="skyview"||was==="comprehensive") parkCamera();
    if(viewEntry(was)) viewBack=was;
  }
  curView = view || null;
};
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
