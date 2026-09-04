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
var DESC_BASES = window.CPL_SKYVIEW_DESC_BASES ||
  ["ccr_desc", "https://hvuwhnbuahrtptokpqfh.supabase.co/storage/v1/object/public/ccr-desc"];
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
/* What a drag does (Sam, 2026-09-03: "need chips or icons to choose whether to
 * move an item or reposition the focus — when zoom, I couldn't see how to move
 * the screen to keep the subject in view"). "move" carries a course or a
 * subject; "pan" moves the view whatever is under the pointer. */
var mode="move";
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
var memberPts=[];            // the member squares drawn this frame — {x,y,m,nd,isl} — for hit-testing
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
 * neighbours he wants to drag from off the screen.
 *
 * So above RAD_KNEE the radius grows with the SQUARE ROOT of the zoom while
 * positions keep scaling linearly: the courses spread apart relative to their
 * own size, which is what "isolate one, keep the others visible around it"
 * means geometrically. Measured on KINE M1750 (30 members, 22 orbiting): at 40x
 * the edge-to-satellite gap goes 85px -> 374px while the radius falls
 * 318px -> 101px. */
var K_MIN=0.03, K_MAX=60, RAD_KNEE=4;
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

var SYS=[["#F1EAFC","#6D28D9","M-ID","our working label"],
         ["#E7EEF9","#0047AB","C-ID","official statewide"],
         ["#FBF1D8","#8B6800","CCN","official statewide"],
         ["#EFEFEC","#5C5C55","unified","synthetic course"]];
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
                  source:e.canonical_source||null, flag:e.authority_flag||null};
        });
        authority=out;
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
var creditFilter=CR_ALL;
function isNC(nd){ return nd.c===1 || nd.c===2; }
/* The word a reader sees. `Noncredit enhanced` is the CDCP distinction and is
 * kept — it is a different thing from plain noncredit, and the list has room. */
function creditWord(nd){
  return nd.c===0 ? "credit" : nd.c===1 ? "noncredit"
       : nd.c===2 ? "noncredit enhanced" : "credit status not recorded";
}
function isCR(nd){ return nd.c===0; }
function creditShown(nd){
  if(creditFilter===CR_ALL) return true;
  return creditFilter===CR_CREDIT ? isCR(nd) : isNC(nd);
}
/* Dash length tracks the radius so the break stays visible as you zoom: a fixed
 * pattern turns into a solid ring on a big circle and vanishes on a small one. */
function ncDash(rad){ var d=Math.max(2, Math.min(9, rad*0.55)); return [d, d*0.72]; }

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
  ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--surface-opaque")||"#fff";
  ctx.fillRect(0,0,W,H);

  var k=view.k;
  var showNodes = k>NODE_ZOOM, showLabels = k>0.55, showTethers = k>ID_ZOOM;
  var hitSet={}; searchHits.forEach(function(h){ hitSet[h.id]=1; });
  var labelQueue=[], nodeQueue=[], openList=[];
  memberPts=[];

  U.islands.forEach(function(isl){
    var c=w2s(isl.x+(isl.dx||0), isl.y+(isl.dy||0));
    var r=isl.r*k;
    if(c[0]+r<-60||c[0]-r>W+60||c[1]+r<-60||c[1]-r>H+60) return;   // cull

    ctx.beginPath(); ctx.arc(c[0],c[1],r,0,6.2832);
    ctx.fillStyle = isl===selIsl ? "#EDE7F8" : isl===hoverIsl ? "#F3F1EC" : "#F7F5F1";
    ctx.fill();
    ctx.lineWidth = isl===selIsl?2:1;
    ctx.strokeStyle = isl===selIsl ? "#6D28D9" : "rgba(28,28,26,.18)";
    ctx.stroke();

    if(showNodes){
      // Tethers first, under the points: a faint line from each orbiting course
      // to the identity it orbits, so the suggestion reads as a relationship and
      // never as membership.
      if(showTethers){
        ctx.save(); ctx.setLineDash([2,3]); ctx.lineWidth=1; ctx.strokeStyle="rgba(109,40,217,.28)";
        ctx.beginPath();
        isl.p.forEach(function(nd){
          if(!nd.a||!nd.o) return;
          var par=nodeById(nd.o); if(!par) return;
          var p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0));
          var q=w2s(par.nd.x+(par.isl.dx||0), par.nd.y+(par.isl.dy||0));
          ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]);
        });
        ctx.stroke(); ctx.restore();
      }
      isl.p.forEach(function(nd){
        if(!creditShown(nd)) return;              // the CR / NC filter (item 9)
        var p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0));
        var rad=nodeRad(nd);
        var s=SYS[nd.s]||SYS[3];
        ctx.beginPath(); ctx.arc(p[0],p[1],rad,0,6.2832);
        if(nd.a){
          // Stand-alone: one college, no equivalence asserted yet. Drawn HOLLOW so it
          // reads as "nothing claimed here", never as a weaker version of a claim.
          // Once its course has been moved it is an emptied shell: dotted and grey.
          var gone=emptied(nd);
          ctx.fillStyle="#fff"; ctx.fill();
          ctx.lineWidth=Math.max(1,rad*0.34);
          if(gone){ ctx.save(); ctx.setLineDash([2,2]); ctx.strokeStyle="#87877F"; ctx.stroke(); ctx.restore(); }
          else if(isNC(nd)){ ctx.save(); ctx.strokeStyle=s[1]; ctx.setLineDash(ncDash(rad)); ctx.stroke(); ctx.restore(); }
          else { ctx.strokeStyle=s[1]; ctx.stroke(); }
        } else {
          ctx.fillStyle=s[0]; ctx.fill();
          if(rad>2){
            ctx.lineWidth=Math.min(2,rad*0.42); ctx.strokeStyle=s[1];
            // ── item 3: noncredit reads as a BROKEN ring (Sam, 2026-09-04:
            // "rather than another color, perhaps a broken line or dotted
            // circle"). Stroke pattern is a free channel: colour already spends
            // itself on the identity SYSTEM (M-ID / C-ID / CCN / unified), so a
            // second colour scale would make the reader hold two at once. It
            // also satisfies "colour is never the only signal" for free.
            // Dashes, not dots: at low zoom a dotted 1px ring aliases into a
            // solid one and the distinction silently disappears.
            if(isNC(nd)){ ctx.save(); ctx.setLineDash(ncDash(rad)); ctx.stroke(); ctx.restore(); }
            else ctx.stroke();
          }
        }
        if(hitSet[nd.i]){                                  // search match ring
          ctx.beginPath(); ctx.arc(p[0],p[1],rad+4.5,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle="#920000"; ctx.stroke();
        }
        if(nd===selNode){
          ctx.beginPath(); ctx.arc(p[0],p[1],rad+7,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle="#0047AB"; ctx.stroke();
        }
        // Labels are QUEUED, not drawn here: a dense island stacks dozens of them
        // into an unreadable pile, which is the exact failure of a global graph
        // view. Stand-alones earn a label one band later than identities — they
        // are the small points, and their number alone reads as noise.
        var lab=labelLines(nd, k);
        if(lab && (nd.a ? k>TITLE_ZOOM : rad>3))
          nodeQueue.push({nd:nd, px:p[0], py:p[1], rad:rad, lines:lab.lines, band:lab.band,
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
  openList.forEach(function(o){ drawMembers(o.nd, o.isl, o.p, o.rad, k, nodeQueue, k<=MEMBER_ZOOM_ALL); });

  // Islands first: they are the navigational anchors, and a course name buried
  // under its own subject's name helps nobody. Course labels then fill the gaps
  // left over, and a label that cannot find one is dropped rather than stacked.
  titlesQueued=nodeQueue.length;
  placedBoxes=placeNodeLabels(nodeQueue, placeLabels(labelQueue, showLabels));

  if(drag && drag.kind==="course" && drag.px!=null){
    ctx.beginPath(); ctx.arc(drag.px,drag.py,7,0,6.2832);
    ctx.fillStyle="#0047AB"; ctx.fill();
    ctx.font="600 12px 'Source Sans 3',system-ui,sans-serif";
    ctx.textAlign="left"; ctx.lineWidth=3.5; ctx.strokeStyle="rgba(255,255,255,.92)";
    ctx.strokeText(drag.code,drag.px+12,drag.py+4);
    ctx.fillStyle="#0047AB"; ctx.fillText(drag.code,drag.px+12,drag.py+4);
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
  var sys=SYS[nd.s]||SYS[3];
  var rings=Math.ceil(n/perRing);
  if(focus){
    ctx.beginPath(); ctx.arc(p[0],p[1],R0+(rings-1)*15+10,0,6.2832);
    ctx.fillStyle="rgba(255,255,255,.8)"; ctx.fill();
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
    ctx.lineWidth=1; ctx.strokeStyle="rgba(28,28,26,.22)"; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-3.5,y-3.5); ctx.lineTo(x+3.5,y-3.5); ctx.lineTo(x+3.5,y+3.5);
    ctx.lineTo(x-3.5,y+3.5); ctx.lineTo(x-3.5,y-3.5);
    ctx.fillStyle=movedHere?"#EAF1E6":carried?"#E7EEF9":"#fff"; ctx.fill();
    ctx.lineWidth=1.4; ctx.strokeStyle=movedHere?"#2C601A":sys[1]; ctx.stroke();
    memberPts.push({x:x, y:y, m:m, nd:nd, isl:isl});
    if(k>MEMBER_ZOOM || focus)
      queue.push({mem:m, nd:nd, px:x, py:y, rad:4, lines:[m.n+" · "+trunc(m.c,26)], band:"member",
                  out:[Math.cos(a), Math.sin(a)],
                  force:!!focus || !!(memFilter && m.n===memFilter) || carried});
  }
  if(rest>0){
    var ry=p[1]+R0+(rings-1)*15+14;
    ctx.font="600 10px 'Source Sans 3',system-ui,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    var more="and "+num(rest)+" more college course"+(rest===1?"":"s")+" — see the details panel";
    ctx.lineWidth=3; ctx.strokeStyle="rgba(255,255,255,.92)"; ctx.strokeText(more,p[0],ry);
    ctx.fillStyle="#5C5C55"; ctx.fillText(more,p[0],ry);
  }
}

/* What a course label says at this zoom. Null below the first band.
 * The TITLE leads, with the units in Sam's short form, and the number waits for
 * the full band and the hover (Sam, 2026-09-03: "more important to see the
 * title than the course number on the initial course label, which would save
 * valuable real estate. Hover over to see the details, including the course
 * number" — "Course title and units (3u)"). Three bands: brief (a short title),
 * titled (the longer title), full (a second line with the number and system). */
function labelLines(nd, k){
  if(k<=ID_ZOOM) return null;
  var u=unitsShort(nd.u);
  var head=trunc(nd.t||nd.i, k>TITLE_ZOOM?44:28)+(u?" · "+u:"");
  if(k>FULL_ZOOM)
    return {band:"full", lines:[head, nd.i+" · "+sysWord(nd)+(nd.a?" · stand-alone":"")]};
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
    var size=Math.max(11,Math.min(19,q.r*0.17));
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
    ctx.lineWidth=3.5; ctx.strokeStyle="rgba(255,255,255,.94)";
    ctx.strokeText(lab,q.cx,q.cy);
    ctx.fillStyle=q.force?"#0047AB":"#1C1C1A";
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
    var mem=q.band==="member", lh=mem?11:12;
    ctx.font=(q.force?"600 ":"")+(mem?"10px":"11px")+" 'Source Sans 3',system-ui,sans-serif";
    var w=0; q.lines.forEach(function(t){ w=Math.max(w, ctx.measureText(t).width); });
    var h=q.lines.length*lh+2;
    /* The label sits AWAY from the circle and a thin line joins the two (Sam,
       2026-09-03: "have the course labels away from the course circle and have
       a thin line to connect to the circle so users can be clear on what they
       might drag and drop"). Four corners are tried, up-right first; the first
       that fits wins, and a label that fits nowhere is dropped, never stacked. */
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
     * neighbours, and it STOPPED IN SPACE at the label's corner, so the eye had
     * to guess which of several nearby lines belonged to which text.
     *
     * Three cheap changes, no new colour: a DOT where the leader meets its
     * circle, so ownership is stated at the circle end rather than inferred; an
     * ELBOW that carries the line horizontally INTO the first line of the label,
     * so it terminates on the text it names; and a little more weight. Still the
     * quietest mark in the frame — this is a tie, not a decoration. */
    var ex=q.px+at.sx*q.rad*0.71, ey=q.py+at.sy*q.rad*0.71;
    var midY=at.y0+lh-2-lh*0.28;                 // the first line's optical middle
    var stubX=at.sx>0 ? at.x0 : at.x0+w;         // the label edge nearest the circle
    ctx.strokeStyle=q.force?"rgba(146,0,0,.75)":"rgba(28,28,26,.55)";
    ctx.beginPath();
    ctx.moveTo(ex, ey); ctx.lineTo(at.ax, at.ay); ctx.lineTo(stubX, midY);
    ctx.lineWidth=1.1; ctx.stroke();
    // The dot says WHICH circle, at the end where the ambiguity is.
    ctx.beginPath(); ctx.arc(ex, ey, Math.min(2.2, Math.max(1.2, q.rad*0.16)), 0, 6.2832);
    ctx.fillStyle=q.force?"rgba(146,0,0,.85)":"rgba(28,28,26,.62)"; ctx.fill();
    labelStats.leaders++;
    q.lines.forEach(function(t,li){
      var y=at.y0+lh*(li+1)-2;
      ctx.lineWidth=3; ctx.strokeStyle="rgba(255,255,255,.92)";
      ctx.strokeText(t,at.x0,y);
      ctx.fillStyle=q.force?"#920000":(mem?"#3A3A36":(li?"#5C5C55":"#1C1C1A"));
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
    if(view.k>NODE_ZOOM){
      var found=null, fd=1e9, inside=false;
      for(var j=0;j<isl.p.length;j++){
        var nd=isl.p[j], p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0));
        var rad=Math.max(3.2,nodeRad(nd));
        var d=Math.hypot(px-p[0],py-p[1]);
        if(d<=rad+3 && d<fd){ found=nd; fd=d; inside=d<=rad; }
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
function pickMember(px,py){
  for(var mi=memberPts.length-1; mi>=0; mi--){
    var mp=memberPts[mi];
    if(Math.abs(px-mp.x)<=6 && Math.abs(py-mp.y)<=6) return {isl:mp.isl, nd:mp.nd, mem:mp.m};
  }
  return null;
}

/* ── the view ─────────────────────────────────────────────────────────────── */
window.__ccrUniverse = function(){
  var view_el=document.getElementById("view");
  U=window.CPL_CCR_UNIVERSE; A=window.CPL_ATLAS_DATA||null;
  nodeIdx=null; orbitIdx=null;
  if(!authority) loadAuthority();
  window.__crumbs([{label:"All disciplines", go:window.__ccrForest},{label:"SkyView"}]);
  // Full bleed: the map takes the whole width; the panes below keep the measure.
  var main=document.getElementById("main"); if(main) main.classList.add("u-fullbleed");
  var C=U.counts||{};

  view_el.innerHTML =
    '<section class="u-full" id="u-full" aria-label="SkyView — the Common Course Reference as a map">'+
      /* Controls ABOVE the canvas and the legend and hint BELOW it, all inside the
       * full-screen element, so nothing floats over the map (Sam, 2026-09-03:
       * "move the zoom and other buttons and popups outside the SkyView window so
       * users can work more freely") and the other views stay one click away in
       * full screen ("will need links on full screen to navigate to the other
       * views"). Every control is a word. */
      '<div class="u-top" id="u-top">'+
        '<nav class="u-nav" aria-label="Other views">'+
          '<button class="linkish" type="button" id="u-nav-forest">All disciplines</button>'+
          /* "Subjects as a list" until 2026-09-04, and the word was wrong: this
           * view maps U.islands and reads I.d, the DISCIPLINE name — so it listed
           * the same things "All disciplines" shows as cards, differing only in
           * form. Worse, COBI already has a "Common Subjects Reference" tab where
           * a subject is a SUBJ4 code (ENGL, WELD), which is a different grain
           * entirely. One word, and the two links stop looking like two grains. */
          '<button class="linkish" type="button" id="u-list">Disciplines as a list</button>'+
          '<button class="linkish" type="button" id="u-nav-esl">ESL packaging</button>'+
          /* Sam, 2026-09-04, item 2: a link to the CCR LIST VIEW. That view is not
           * in this prototype at all — it is COBI's Common Course Reference tab,
           * which is the page this map is embedded IN when it runs inside COBI.
           * So it is a link out, and it is removed when framed (below): offering
           * a door onto the page you are already standing on is the same mistake
           * as offering one onto nothing. */
          '<a class="linkish" id="u-ccr-list" href="../index.html#unified-courses" '+
            'target="_blank" rel="noopener">CCR list view \u2197</a>'+
        '</nav>'+
        '<div class="u-bar" id="u-bar" role="toolbar" aria-label="Map controls">'+
          '<span class="u-modes" role="group" aria-label="What a drag does">'+
            '<button class="btn mode" type="button" id="u-mode-pan" aria-pressed="false">Pan</button>'+
            '<button class="btn mode" type="button" id="u-mode-move" aria-pressed="true">Move</button>'+
          '</span>'+
          '<span class="u-zgroup" role="group" aria-label="Zoom">'+
            '<span class="u-zlbl">Zoom</span>'+
            '<button class="btn" type="button" id="u-out" title="Zoom out">Out</button>'+
          '<button class="btn" type="button" id="u-in" title="Zoom in">In</button>'+
            '<button class="btn" type="button" id="u-reset" title="Reset the view">Reset</button>'+
          '</span>'+
          '<span class="u-seg u-crnc" role="group" aria-label="Show credit or noncredit courses">'+
            '<button class="btn mode" type="button" id="u-cr-all" aria-pressed="true">All</button>'+
            '<button class="btn mode" type="button" id="u-cr-cr" aria-pressed="false">Credit</button>'+
            '<button class="btn mode" type="button" id="u-cr-nc" aria-pressed="false">Noncredit</button>'+
          '</span>'+          '<button class="btn" type="button" id="u-insp-toggle" aria-expanded="false" aria-controls="u-detail">Details</button>'+'<button class="btn" type="button" id="u-foot-toggle" aria-expanded="true" aria-controls="u-foot">Hide legend</button>'+
          '<button class="btn" type="button" id="u-fs" aria-pressed="false">Full screen</button>'+
          '<span class="u-z">zoom <b id="u-zoom">12%</b></span>'+
        '</div>'+
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
        '</div>'+
        '<aside class="u-inspector" id="u-inspector" aria-label="Details of what you selected">'+
          '<div class="u-insp-bar"><span class="u-insp-t">Details</span></div>'+
          '<div id="u-detail" class="u-insp-body"><h3>Nothing selected</h3>'+
            '<p class="empty">Hover a point for a quick look. Click a discipline or a course and its '+
            'details land here — the college courses underneath, their catalog descriptions, '+
            'and the stand-alone courses in orbit around it.</p></div>'+
        '</aside>'+
      '</div>'+
      '<div class="u-foot" id="u-foot">'+
        '<div class="u-legend" aria-label="How to read the map">'+
          '<span><i class="u-sw" style="background:#F1EAFC;border-color:#6D28D9"></i>M-ID, our working label</span>'+
          '<span><i class="u-sw" style="background:#E7EEF9;border-color:#0047AB"></i>C-ID, official</span>'+
          '<span><i class="u-sw" style="background:#FBF1D8;border-color:#8B6800"></i>CCN, official</span>'+
          '<span><i class="u-sw" style="background:#EFEFEC;border-color:#5C5C55"></i>unified</span>'+
          '<span><i class="u-sw hollow"></i>stand-alone course, in orbit around its closest match</span>'+'<span><i class="u-sw nc"></i>noncredit — a broken ring, whatever the identity system</span>'+
          '<span><i class="u-sw member"></i>college course under an identity — click or hover an identity to open it</span>'+
        '</div>'+
        '<div class="u-hint" id="u-hint">Hover for a quick look; click a discipline or a course for details. '+
          '<strong>Move</strong>: drag a hollow course or a college course onto the identity it belongs to, '+
          'drag a discipline to pull it next to another, drag the background to pan. <strong>Pan</strong>: drag '+
          'anywhere to move the view. Scroll to zoom; the buttons zoom on what you searched for or selected. '+
          'From the keyboard: <kbd>Tab</kbd> steps through disciplines, <kbd>Enter</kbd> goes into one, '+
          '<kbd>Esc</kbd> comes back out, arrows pan.</div>'+
      '</div>'+
    '</section>'+
    '<div class="wrap u-below" id="u-below">'+
      '<h1>The whole Common Course Reference</h1>'+
      '<p>'+num(C.identities)+' course identities and '+num(C.stand_alone)+' stand-alone courses across '+
        num(C.disciplines)+' disciplines. '+num(C.orbiting)+' of the stand-alones orbit the identity '+
        'they are most aligned to'+(C.orbiting_cross?' ('+num(C.orbiting_cross)+' of them in another discipline\u2019s island, drawn where their closest match is)':'')+
        '; '+num(C.rim)+' share nothing with any identity and sit on their discipline\u2019s rim. Search to fly to a discipline, an identity or a college course. '+
        '<strong>Drag a discipline</strong> to pull it next to another, then drag a course between them — '+
        'that is how a course filed under the wrong discipline gets moved to its real parent.</p>'+
      '<div class="stage">'+
        '<div class="panel"><h2>What this would write</h2><div id="u-writes">'+
        '<p class="empty">No moves yet.</p></div>'+
        '<p style="margin:.6em 0 0;font-size:.8rem;color:var(--text-muted)">'+
        'One row per move, in <code>kb_curation</code>. Reversible: delete the row.</p></div>'+
        '<div class="panel"><h2>How the map is arranged</h2>'+
        '<p>One island per discipline, biggest at the centre. Inside an island the identities '+
        'with the most courses sit at the centre. A hollow point is a stand-alone course — one '+
        'college, clustered with nothing yet — placed in orbit around the identity whose title '+
        'words and subject code it shares. The orbit is a suggestion, not a decision: the details '+
        'panel says what the two have in common, and nothing changes until you move the course. '+
        'A hollow point on the outer rim shares nothing with any identity in its discipline.</p>'+
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
  fitCanvas(); resetView(); wire(); draw();
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
function suggest(raw, limit){
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
    subs.push({kind:"subject", kindWord:"discipline", label:I.d, tier:t, n:(I.n||0), isl:I});
  });
  subs.sort(function(a,b){ return a.tier-b.tier || b.n-a.n || a.label.localeCompare(b.label); });
  // Subjects never take the whole list: a term that matches many subjects would
  // otherwise hide the course the curator was actually typing.
  out=subs.slice(0, Math.max(1, limit-4));
  var room=limit-out.length;
  // Course identities and stand-alones by title or number; identities first.
  var pts=[];
  for(var i=0;i<U.islands.length;i++){
    var I2=U.islands[i];
    for(var j=0;j<I2.p.length;j++){
      var nd=I2.p[j];
      var lt=(nd.t||"").toLowerCase(), li=nd.i.toLowerCase();
      var tier=(li===term||lt===term)?0:(li.indexOf(term)===0||lt.indexOf(term)===0)?1:
               (lt.indexOf(term)>=0||li.indexOf(term)>=0)?2:-1;
      if(tier<0) continue;
      pts.push({tier:tier+(nd.a?0.5:0), n:nd.n||0, isl:I2, nd:nd});
      if(pts.length>400) break;
    }
  }
  pts.sort(function(a,b){ return a.tier-b.tier || b.n-a.n; });
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
  var byCredit=[[],[],[]];
  pts.forEach(function(p){ byCredit[p.nd.c==null ? 2 : (p.nd.c===0 ? 0 : 1)].push(p); });
  pts=byCredit[0].concat(byCredit[1], byCredit[2]);
  var take=Math.min(room-1, pts.length, Math.max(1, room-2));
  pts.slice(0, Math.max(0,take)).forEach(function(p){
    out.push({kind:"course", kindWord:p.nd.a?"stand-alone course":"course identity", label:p.nd.t||p.nd.i,
              sub:p.nd.i+" · "+p.isl.d+" · "+creditWord(p.nd), credit:creditWord(p.nd),
              isl:p.isl, nd:p.nd});
  });
  room=limit-out.length;
  // College courses, by code (prefix wins) or by control number.
  if(room>0 && memIndex && memIndex.length){
    var digits=/^(ccc)?0*(\d{3,})$/.exec(term);
    var wanted=digits?String(parseInt(digits[2],10)):null;
    var pre=[], inn=[];
    for(var m=0;m<memIndex.length && (pre.length<room);m++){
      var r=memIndex[m];
      if(wanted){ if(r.d===wanted) pre.push(r); continue; }
      if(r.lc.indexOf(term)===0) pre.push(r);
      else if(inn.length<room && r.lc.indexOf(term)>=0) inn.push(r);
    }
    pre.concat(inn).slice(0,room).forEach(function(r){
      var h=nodeById(r.id); if(!h) return;
      out.push({kind:"member", kindWord:"college course", label:r.code+" · "+r.c,
                sub:"under "+(h.nd.t||h.nd.i)+" · "+h.isl.d, isl:h.isl, nd:h.nd, cn:r.cn, code:r.code});
    });
  }
  return out;
}
window.__ccrSuggest = suggest;
window.__ccrTipHtml = tipHtml;

function openInspector(){ if(!inspOpen) setInspector(true); }
function setInspector(open){
  inspOpen=!!open;
  var a=document.getElementById("u-inspector"), b=document.getElementById("u-insp-toggle");
  if(a) a.classList.toggle("closed", !inspOpen);
  if(b){ b.textContent=inspOpen?"Hide details":"Details"; b.setAttribute("aria-expanded", inspOpen?"true":"false"); }
  // The panel is docked beside the canvas, so showing or hiding it changes the
  // canvas's width: refit, or the map draws at the old size.
  if(cvs && document.getElementById("u-cvs")===cvs){ fitCanvas(); draw(); }
}

/* Act on a chosen suggestion. Flying is this module's job, so the header hands
 * back the object it was given rather than re-deriving anything from the label. */
window.__ccrGoSuggestion = function(s){
  if(!s || !U) return false;
  if(!document.getElementById("u-cvs")) window.__ccrUniverse();
  if(s.kind==="subject"){
    var I=s.isl;
    searchHits=[]; searchTerm="";
    flyTo(I.x+(I.dx||0), I.y+(I.dy||0), Math.min(3.2, 190/I.r));
    selIsl=I; selNode=null; showIsland(I);
    setHint("Subject <strong>"+esc(I.d)+"</strong> — "+num(I.n)+" identities, "+num(I.sa||0)+" stand-alone courses.");
    draw(); return true;
  }
  var isl=s.isl, nd=s.nd;
  searchHits=[{id:nd.i, x:nd.x+(isl.dx||0), y:nd.y+(isl.dy||0), isl:isl, nd:nd}];
  searchTerm=String(s.label||"").toLowerCase();
  // Well above NODE_ZOOM: a single identity flown to at a zoom that draws no
  // nodes is a ring nobody can see.
  flyTo(nd.x+(isl.dx||0), nd.y+(isl.dy||0), Math.max(NODE_ZOOM*3, 1.8));
  selNode=nd; selIsl=isl;
  memFilter = s.kind==="member" ? String(s.code||"") : "";
  showNode(nd, isl, s.kind==="member");
  setHint(s.kind==="member"
    ? "<strong>"+esc(s.code)+"</strong> sits under <strong>"+esc(nd.t||nd.i)+"</strong> ("+esc(nd.i)+") in "+esc(isl.d)+"."
    : "<strong>"+esc(nd.t)+"</strong> — "+esc(nd.i)+" in "+esc(isl.d)+".");
  draw(); return true;
};

/* ── the subject list ───────────────────────────────────────────────────────
 * Sam, 2026-08-25: "The Browse by Subjects button takes me unexpectedly to the
 * package view. Seems I'm already browsing by subject." So the button opens an
 * actual list of subjects — filterable, seeded with whatever was typed, and
 * every row flies the map to that subject. The packaging view keeps its own,
 * differently-named door at the bottom.
 */
window.__ccrSubjectList = function(seed){
  var host=document.getElementById("view");
  if(!host || !U) return;
  window.__crumbs([{label:"All disciplines", go:window.__ccrForest},
                   {label:"SkyView", go:function(){ window.__ccrUniverse(); }},
                   {label:"Disciplines"}]);
  var rows=U.islands.map(function(I){ return {name:I.d, n:(I.n||0), alone:(I.sa||0), isl:I}; })
    .sort(function(a,b){ return b.n-a.n || a.name.localeCompare(b.name); });

  host.innerHTML=
    '<h1>Every discipline</h1>'+
    '<p>'+num(rows.length)+' disciplines across '+num(U.counts.identities)+
    ' course identities. Filter, then pick one — the map opens on it.</p>'+
    '<div class="u-bar">'+
      '<label class="sr" for="sl-q">Filter disciplines</label>'+
      '<input id="sl-q" type="search" placeholder="Filter disciplines — e.g. english, welding, nursing" '+
        'style="flex:1 1 260px;min-width:0;padding:.45em .6em;font:inherit;'+
        'border:1px solid var(--border-strong,rgba(28,28,26,.30));border-radius:8px">'+
      '<button class="btn" type="button" id="sl-map">Back to the map</button>'+
    '</div>'+
    '<p class="tag" id="sl-count" aria-live="polite"></p>'+
    '<div class="panel" style="margin-top:10px"><ul class="sl-list" id="sl-rows"></ul></div>'+
    '<p style="margin:1.1em 0 0;font-size:.86rem;color:var(--text-muted,#5C5C55)">'+
      'Looking for the corpus split into sittings instead — which disciplines carry '+
      'how many decisions? <button class="btn" type="button" id="sl-pack">'+
      'See the work packaged by discipline</button></p>';

  var qEl=document.getElementById("sl-q"), rowsEl=document.getElementById("sl-rows"),
      cEl=document.getElementById("sl-count");
  function paint(){
    var q=String(qEl.value||"").trim().toLowerCase();
    var hit=rows.filter(function(r){ return !q || r.name.toLowerCase().indexOf(q)>=0; });
    cEl.textContent=q
      ? num(hit.length)+" of "+num(rows.length)+" disciplines match “"+q+"”"
      : num(rows.length)+" disciplines";
    if(!hit.length){
      rowsEl.innerHTML='<li class="empty">Nothing matches “'+esc(q)+'”. '+
        'The map still holds every discipline — clear the filter to see them all.</li>';
      return;
    }
    rowsEl.innerHTML=hit.slice(0,400).map(function(r,i){
      return '<li><button type="button" data-i="'+i+'"><span class="sl-n">'+esc(r.name)+
        '</span><span class="sl-c">'+num(r.n)+' identit'+(r.n===1?"y":"ies")+
        (r.alone? ' · '+num(r.alone)+' stand-alone':'')+'</span></button></li>';
    }).join("")+(hit.length>400
      ? '<li class="empty">Showing the first 400 of '+num(hit.length)+
        ' — narrow the filter to see the rest.</li>' : "");
    Array.prototype.forEach.call(rowsEl.querySelectorAll("button"), function(b){
      b.onclick=function(){
        var r=hit[+b.dataset.i];
        window.__ccrUniverse();
        window.__ccrGoSuggestion({kind:"subject", isl:r.isl});
      };
    });
  }
  qEl.value=String(seed==null?"":seed);
  qEl.oninput=paint;
  document.getElementById("sl-map").onclick=function(){ window.__ccrUniverse(); };
  document.getElementById("sl-pack").onclick=function(){ window.__ccrForest(); };
  paint();
  qEl.focus();
};

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
          orbiting:orbiting, rim:rim, crossOrbits:cross, inspectorOpen:inspOpen,
          carrying:(drag&&drag.kind==="course")?drag.code:null,
          descBases:DESC_BASES.slice(), descState:descState,
          placedBoxes:placedBoxes, titlesQueued:titlesQueued,
          // The zoom ceiling and the radius taper are here because a canvas
          // radius cannot be queried from the DOM, and the taper is the half of
          // "zoom past 900%" that actually makes one course pickable.
          kMax:K_MAX, radKnee:RAD_KNEE, radScaleAt:radScale,
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
    var m=hit.mem, info=courseInfo(hit.isl, m);
    return '<b>'+esc(m.n)+'</b> '+esc(m.c)+
      (info&&info.title?'<br>'+esc(info.title):'')+
      '<br><span class="sub">'+(info&&info.units!=null?esc(unitsWord(info.units))+' · ':'')+
      'college course under '+esc(hit.nd.i)+' '+esc(trunc(hit.nd.t||"",36))+'</span>';
  }
  if(hit.nd){
    var nd=hit.nd, isl=hit.isl;
    var carried=(roster&&roster[nd.i]||[]).length;
    var h='<b>'+esc(nd.i)+'</b> '+esc(nd.t||"")+
      '<br><span class="sub">'+esc(unitsWord(nd.u))+' · '+esc(sysWord(nd))+' · '+
      num(carried)+' college course'+(carried===1?'':'s')+' · '+esc(isl.d)+'</span>';
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
      : "<strong>Move</strong>: drag a hollow course or a college course onto the identity it belongs to; drag a discipline to pull it next to another; drag the background to pan.");
  }
  var mpan=document.getElementById("u-mode-pan"), mmove=document.getElementById("u-mode-move");
  if(mpan) mpan.onclick=function(){ setMode("pan"); };
  if(mmove) mmove.onclick=function(){ setMode("move"); };
  window.__ccrSetMode=setMode;
  var nf=document.getElementById("u-nav-forest");
  if(nf) nf.onclick=function(){ if(typeof window.__ccrForest==="function") window.__ccrForest(); };
  var ne=document.getElementById("u-nav-esl");
  if(ne){
    if(window.CPL_ATLAS_ESL && typeof window.__ccrEsl==="function") ne.onclick=function(){ window.__ccrEsl(); };
    else ne.remove();   // never offer a door that opens on nothing
  }
  var cl=document.getElementById("u-ccr-list");
  if(cl && window.top!==window.self) cl.remove();   // the list is already the page around this frame
  var lb=document.getElementById("u-list");
  // Seed from WHAT IS IN THE BOX, not from the last term that was submitted.
  if(lb) lb.onclick=function(){
    var box=document.getElementById("gq");
    window.__ccrSubjectList((box && box.value) || searchTerm);
  };
  /* ── item 9: the CR / NC filter ───────────────────────────────────────────
   * Sam, 2026-09-04: "Also need a CR NC toggle". Three positions, not two — a
   * two-way toggle would have to put the 73 identities with NO recorded credit
   * status somewhere, and either bucket is a lie. They appear under All, and the
   * count says how many are unrecorded so their absence is never silent. */
  function setCredit(v){
    creditFilter=v;
    [["u-cr-all",CR_ALL],["u-cr-cr",CR_CREDIT],["u-cr-nc",CR_NC]].forEach(function(pair){
      var b=document.getElementById(pair[0]);
      if(b) b.setAttribute("aria-pressed", creditFilter===pair[1] ? "true" : "false");
    });
    var n=0, hidden=0, unrec=0;
    if(U) U.islands.forEach(function(I){ I.p.forEach(function(nd){
      if(nd.c==null) unrec++;
      if(creditShown(nd)) n++; else hidden++;
    }); });
    setHint(v===CR_ALL
      ? "Showing every course. <strong>"+num(unrec)+"</strong> have no recorded credit status; "+
        "they appear here and nowhere else."
      : "Showing <strong>"+num(n)+"</strong> "+(v===CR_CREDIT?"credit":"noncredit")+
        " course"+(n===1?"":"s")+"; "+num(hidden)+" hidden. Noncredit is drawn with a broken ring.");
    draw();
  }
  [["u-cr-all",CR_ALL],["u-cr-cr",CR_CREDIT],["u-cr-nc",CR_NC]].forEach(function(pair){
    var b=document.getElementById(pair[0]);
    if(b) b.onclick=function(){ setCredit(pair[1]); };
  });
  window.__ccrSetCredit=setCredit;

  var tg=document.getElementById("u-insp-toggle");
  if(tg) tg.onclick=function(){ setInspector(!inspOpen); };
  /* ⚠️ PAINT THE STATE, NEVER HARDCODE IT IN THE MARKUP. `inspOpen` is module
   * memory and survives a re-render; the markup is rebuilt from scratch. Writing
   * `class="u-inspector closed"` into the template desynchronized the two the
   * moment you navigated away and came back with the panel open: the DOM said
   * closed, `inspOpen` said open, and openInspector() — which is a no-op when it
   * believes the panel is already open — could never reopen it again. Selecting a
   * course silently showed nothing. One call keeps them agreeing. */
  setInspector(inspOpen);

  /* ── ITEM 6: the legend strip folds away ──────────────────────────────────
   * Sam, 2026-09-04: "Make the footer hidable". It is a reference strip, not a
   * control, so it earns its space only while you are still learning the map. */
  var ft=document.getElementById("u-foot-toggle");
  if(ft) ft.onclick=function(){
    var f=document.getElementById("u-foot");
    if(!f) return;
    var hide=!f.classList.contains("u-foot-hidden");
    f.classList.toggle("u-foot-hidden", hide);
    ft.textContent=hide?"Legend":"Hide legend";
    ft.setAttribute("aria-expanded", hide?"false":"true");
    fitCanvas(); draw();          // the canvas grows into the space it vacated
  };

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

  /* Full screen is the browser's own, on the map section. Inside COBI the map is
   * an iframe, which needs `allow="fullscreen"` on the frame — unified_courses.js
   * sets it; a frame that refuses is reported, never left silent. */
  var fs=document.getElementById("u-fs");
  if(fs){
    fs.onclick=function(){
      var full=document.getElementById("u-full");
      if(document.fullscreenElement){ if(document.exitFullscreen) document.exitFullscreen(); return; }
      if(!full || !full.requestFullscreen){
        setHint("This browser does not offer full screen here. The map already fills the window; "+
                "scroll down for the panes."); return;
      }
      var p=full.requestFullscreen();
      if(p && p.catch) p.catch(function(){
        setHint("Full screen was not allowed in this frame — open SkyView in its own tab "+
                "(the link above the map) and try again.");
      });
    };
    document.addEventListener("fullscreenchange", function(){
      var on=!!document.fullscreenElement;
      fs.textContent=on?"Exit full screen":"Full screen";
      fs.setAttribute("aria-pressed", on?"true":"false");
      fitCanvas(); draw();
    });
  }

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
function doSearch(raw){
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
    var k=Math.min(3.2, 190/pick.r);
    flyTo(pick.x+(pick.dx||0), pick.y+(pick.dy||0), k);
    selIsl=pick; selNode=null; showIsland(pick);
    var others=bnames.filter(function(n){ return n!==pick.d; });
    /* The term is the subject's own name, so every course title carrying that
     * word is not a find — it is the subject. No rings: a Welding island with
     * 408 red rings and red names (measured 2026-09-03) reads as an alarm, and
     * the labels now lead with the title, which made every one of them red. */
    searchHits=[];
    setHint("Subject <strong>"+esc(pick.d)+"</strong> — "+num(pick.n)+" identities."+
      (others.length ? " Also matching: <strong>"+others.slice(0,3).map(esc).join("</strong> · <strong>")+
        "</strong>"+(others.length>3?" · …":"")+" — pick one from the search suggestions." : "")+
      " Click an identity to open it and see the college courses under it.");
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
    setHint(head+" Ringed in red.");
  } else {
    /* The hits do not fit in one view at any zoom that draws them. Go to the
     * densest subject rather than framing them all invisibly, and say which. */
    var top=searchHits.filter(function(h){return h.isl.d===names[0];});
    var tx=top.reduce(function(a,h){return a+h.x;},0)/top.length;
    var ty=top.reduce(function(a,h){return a+h.y;},0)/top.length;
    flyTo(tx,ty,Math.max(NODE_ZOOM*1.6, Math.min(3.2, 190/top[0].isl.r)));
    setHint(head+" They are too far apart to ring in one view — showing <strong>"+
      esc(names[0])+"</strong>. Search a discipline name to go straight to it.");
  }
  if(searchHits.length===1){
    selNode=searchHits[0].nd; selIsl=searchHits[0].isl;
    memFilter = mcode && mh.length===1 ? mcode : "";
    showNode(selNode, selIsl, !!memFilter);
    flyTo(selNode.x+(selIsl.dx||0), selNode.y+(selIsl.dy||0), Math.max(view.k, NODE_ZOOM*3));
  }
  draw();
}

/* ── panels ─────────────────────────────────────────────────────────────── */
function chipFor(nd){
  var s=SYS[nd.s]||SYS[3];
  return '<span class="chip '+(nd.s===0?"gen":nd.s===3?"mut":"cid")+'">'+esc(s[2])+' — '+esc(s[3])+'</span>';
}
function goNode(id){
  var h=nodeById(id); if(!h) return;
  selNode=h.nd; selIsl=h.isl; memFilter="";
  flyTo(h.nd.x+(h.isl.dx||0), h.nd.y+(h.isl.dy||0), Math.max(view.k, NODE_ZOOM*3, 1.8));
  showNode(h.nd, h.isl);
}
function showIsland(isl){
  openInspector();
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
        (nd.k?" · "+num(nd.k)+" in orbit":"")+(nd.u!=null?" · "+esc(unitsWord(nd.u)):"")+"</div></li>";
    }).join("")+"</ul>":'<p class="empty">No clustered identity in this discipline yet — every course here is a stand-alone.</p>')+
    workSurfaceOffer(isl)+
    '<p class="empty" style="margin-top:.5em">Drag this discipline on the map to bring it '+
    'beside another, then drag a course across.</p>';
  Array.prototype.forEach.call(el.querySelectorAll("[data-go]"), function(b){
    b.addEventListener("click", function(){ goNode(b.dataset.go); });
  });
  var b=document.getElementById("u-open-work");
  if(b) b.addEventListener("click", function(){ window.__ccrDiscipline(b.dataset.d); });
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
  renderNode();
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
    '<span class="co" title="'+esc(m.c)+'">'+esc(m.c)+"</span>"+
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
  var h="<h3>"+esc(nd.t||nd.i)+"</h3>"+
    "<p>"+chipFor(nd)+' <span class="sub">'+esc(nd.i)+"</span> · "+esc(isl.d)+" · "+
    esc(unitsWord(nd.u))+" · "+num(total)+" college course"+(total===1?"":"s")+" carried"+
    (nd.a?' · <span class="chip mut" title="A single college\'s course that has not been '+
      'clustered with anything yet. It asserts no equivalence, so it cannot be over-merged '+
      '— it can only be dragged onto the identity it belongs with.">stand-alone</span>':"")+
    (nd.n && nd.n!==total ? ' · <span class="sub" title="The count this row reports '+
      'elsewhere in COBI, from the field that minted it. The carried list is the forward '+
      'join onto the raw COCI course list, which cannot always place every seeded member.">'+
      "row count "+num(nd.n)+"</span>" : "")+"</p>";
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
          (m?'<span class="co" title="'+esc(m.c)+'">'+esc(m.c)+"</span>":"")+
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
  el.innerHTML=h;
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
  Array.prototype.forEach.call(el.querySelectorAll("[data-go]"), function(b){
    b.addEventListener("click", function(){ goNode(b.dataset.go); });
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
    b.addEventListener("click", function(){ if(!(drag&&drag.kind==="course")) { if(pickUp()) cvs.focus(); } });
    b.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); if(pickUp()) cvs.focus(); } });
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
})();
