/* CCR Universe — the whole corpus on one canvas, with cross-area repair.
 *
 * Sam's brief: "seeing the whole universe initially with a keyword zoom might be
 * better. Sometimes courses are mismatched in the wrong subject area and may need
 * to be dragged to a course in another area. If users could pull an area over
 * closer to the clusters in another area, they could easily drag and drop the
 * misplaced course to the right parent course."
 *
 * Three things follow from that, and each is a design constraint:
 *
 *  1. CANVAS, NOT SVG. 17,321 nodes is ~70k DOM elements as SVG. Canvas draws it
 *     in one pass and stays smooth under pan/zoom.
 *  2. THE LAYOUT IS PRECOMPUTED AND STABLE. A layout that re-solves on load is
 *     unnavigable — you cannot learn where anything is. Coordinates ship from
 *     kb/_build_ccr_universe.py.
 *  3. ISLANDS MOVE. Dragging a discipline is not decoration: it is how a curator
 *     brings two distant subjects side by side to move a course between them.
 *     Positions are per-browser and never leave the page.
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
var moves=[], movedTo={}, roster=null, byCn=null, cnHome=null, nodeIdx=null, memberSource="";
var cnCourses=null;           // cn -> [{n:code, c:college}] — EVERY course the key names
var MEMBER_PAGE=200, memFilter="";
var descCache={}, descState={};      // island shard -> {cn/index: text} · shard -> "loading"|"ok"|"blocked"|"missing"
var DESC_DIR="ccr_desc";
var drag=null;               // {kind:'pan'|'island'|'course', ...}
var searchHits=[], searchTerm="";
var placedBoxes=[], titlesQueued=0;   // last frame's placed text, for the harness
/* Below this zoom draw() renders NO nodes — so no search ring can appear. It is
 * a module constant because doSearch has to honour it: a search that flies to
 * "fit all the hits" picks a zoom below it whenever the hits are spread out,
 * and then reports "Ringed in red" over a canvas drawing nothing but islands.
 * Reported from a browser by Sam, 2026-08-25: 19 hits across 9 subjects, zoom
 * 12%, no rings. One constant read by both is what stops them disagreeing. */
var NODE_ZOOM=0.20;

var SYS=[["#F1EAFC","#6D28D9","✽","M-ID"],
         ["#E7EEF9","#0047AB","★","C-ID"],
         ["#FBF1D8","#8B6800","◆","CCN"],
         ["#EFEFEC","#5C5C55","○","unified"]];

function ensureDescCss(){
  if(document.getElementById("u-desc-css")) return;
  var st=document.createElement("style"); st.id="u-desc-css";
  st.textContent=".mlist .mdesc{display:block;margin:.35em 0 .1em;font-size:.84rem;"+
    "line-height:1.45;color:var(--text-body,#3A3A36);max-width:var(--cpl-measure,none)}"+
    ".mlist .mdesc.none{color:var(--text-muted,#5C5C55);font-style:italic}"+
    // Glyph-free on purpose: the chip's own words carry the state, so the color
    // is reinforcement and greyscale loses nothing.
    ".mlist .chip.warn{background:var(--accent-warn-tint,#FBF1D8);"+
    "color:var(--accent-warn-ink,#6B4E00);border:1px solid var(--accent-warn,#8B6800)}"+
    ".mlist li.shared .cd{text-decoration:underline dotted}";
  document.head.appendChild(st);
}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function num(n){return (n==null?0:n).toLocaleString("en-US");}
function w2s(x,y){return [(x+view.x)*view.k + cvs.clientWidth/2,
                          (y+view.y)*view.k + cvs.clientHeight/2];}
function s2w(px,py){return [(px-cvs.clientWidth/2)/view.k - view.x,
                            (py-cvs.clientHeight/2)/view.k - view.y];}

/* ── member lookup ────────────────────────────────────────────────────────
 * roster[identity] = [{cn, n:course code, c:college name}] — every college
 * course the identity carries, which is what a curator drags.
 *
 * The full universe payload (ccr_universe_members.json) covers all 16,240
 * identities that carry members. The older per-discipline sample inside
 * ccr_atlas_data.json is kept as a FALLBACK so the page still does something
 * useful if the big payload is absent — and memberSource records which one is
 * live, because "no courses here" and "no courses shipped" look identical on
 * screen and mean opposite things.
 *
 * TWO different things make a control number non-unique here, and only the
 * first was ever handled:
 *
 *  1. A control number can appear under MORE THAN ONE IDENTITY (1,165 do — the
 *     forward join surfaces an over-merged course on every card that claims it).
 *     The write is one `CN:` row per control number, so a move is a single
 *     global statement: movedTo[cn] is the ONLY home that counts once a curator
 *     has moved a course, and the course leaves every other card it showed on.
 *
 *  2. A control number can name MORE THAN ONE COURSE. 1,761 in this payload do
 *     — 3,634 draggable rows. Measured by kb/_audit_control_number_claims.py:
 *     most are one course written two ways (a CCN alongside its local code, an
 *     institution entered under two roster names), but 73 are genuinely two
 *     different courses filed under one number, and the key cannot tell any of
 *     them apart.
 *
 * (2) is why cnCourses exists. byCn keeps the first record seen, which is fine
 * for reporting where a course came from and WRONG as the thing to render on a
 * destination: a curator who drags the second of two collided courses would
 * watch the first one arrive. A move whose key names several courses cannot be
 * expressed by `CN:<cn>` at all, so it is REFUSED rather than written wrong —
 * see canMove().
 */
function noteCourse(cn, rec){
  // Distinct (code, college) only: the same course legitimately appears on
  // several identities, and counting those would flag every over-merge as an
  // ambiguous KEY, which is a different fault with a different repair.
  var l=cnCourses[cn]||(cnCourses[cn]=[]);
  for(var i=0;i<l.length;i++) if(l[i].n===rec.n && l[i].c===rec.c) return;
  l.push({n:rec.n, c:rec.c});
}
function buildMemberIndex(){
  roster={}; byCn={}; cnHome={}; cnCourses={}; memberSource="";
  var MEM=window.CPL_CCR_UNIVERSE_MEMBERS||null;
  if(MEM && MEM.m){
    var cols=MEM.colleges||[];
    Object.keys(MEM.m).forEach(function(id){
      roster[id]=MEM.m[id].map(function(r){
        var cn="CCC"+String(r[0]).padStart(9,"0");
        var rec={cn:cn, n:r[1]||"", c:cols[r[2]]||"—"};
        noteCourse(cn, rec);
        if(!(cn in byCn)){ byCn[cn]=rec; cnHome[cn]=id; }
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
        roster[nd.id]=nd.m;
        nd.m.forEach(function(m){
          noteCourse(m.cn, m);
          if(!(m.cn in byCn)){ byCn[m.cn]=m; cnHome[m.cn]=nd.id; }
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
/* Every course the write key names. More than one means the key is ambiguous. */
function coursesOn(cn){ return (cnCourses&&cnCourses[cn])||[]; }
/* Can this course be re-homed at all?  `CN:<control number>` carries no way to
 * say WHICH course, and the receiving end picks the first one it finds — the
 * live generator through cn_rows[cn][0], this page through byCn[cn]. So for an
 * ambiguous key a move is not merely risky, it is INEXPRESSIBLE: whatever the
 * curator dragged, the number moves whichever course happens to be indexed
 * first, and takes the others out of their own cards on the way past.
 * Refusing is the honest answer. Widening the key is a schema decision. */
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
function canMove(cn){
  var l=coursesOn(cn);
  if(l.length<2) return {ok:true};
  return {ok:false, others:l};
}
/* ── course descriptions, fetched per discipline on demand ────────────────
 * Measured 2026-08-24: descriptions are 34.8 MB stored, 11.6 MB even cut to 120
 * characters, against a page already at 9.7 MB. There is no truncation that is
 * both inlinable and worth reading, so Sam chose on-demand loading knowing it
 * means serving the page rather than opening the file.
 *
 * ⚠️ Under file:// every fetch fails on CORS. That is REPORTED, never swallowed:
 * a drill-down that silently shows nothing is indistinguishable from a course
 * that genuinely has no description, and the second is a real and common state
 * (127,523 of the corpus have one, so plenty do not).
 */
function loadDesc(isl, then){
  var sh=isl&&isl.sh; if(!sh) return then&&then();
  if(descState[sh]==="ok"||descState[sh]==="blocked"||descState[sh]==="missing") return then&&then();
  if(descState[sh]==="loading") return;
  descState[sh]="loading";
  var url=DESC_DIR+"/"+encodeURIComponent(sh)+".json";
  fetch(url).then(function(r){
    if(!r.ok) throw new Error("http "+r.status);
    return r.json();
  }).then(function(j){
    descCache[sh]=j; descState[sh]="ok"; then&&then();
  }).catch(function(e){
    // file:// gives a TypeError with no status; a served page gives an http code.
    descState[sh]=(location.protocol==="file:")?"blocked":"missing";
    then&&then();
  });
}
function descFor(isl, id, idx){
  var sh=isl&&isl.sh; if(!sh) return null;
  var d=descCache[sh]&&descCache[sh][id];
  return (d&&d[idx])||null;
}
/* The record a curator actually picked up, for a course that has been moved.
 * byCn[cn] is the FIRST record indexed for that key, which is a different
 * course whenever the key names several — so a destination built from byCn
 * shows the wrong one. Moves are refused for ambiguous keys (canMove), so the
 * two agree today; reading the move is what keeps them agreeing if that ever
 * changes. */
function movedRecord(cn){
  for(var i=0;i<moves.length;i++)
    if(moves[i].cn===cn) return {cn:cn, n:moves[i].code, c:moves[i].college};
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
function nodeById(id){
  if(!nodeIdx){
    nodeIdx={};
    U.islands.forEach(function(isl){
      isl.p.forEach(function(nd){ nodeIdx[nd.i]={isl:isl,nd:nd}; });
    });
  }
  return nodeIdx[id]||null;
}

/* ── draw ───────────────────────────────────────────────────────────────── */
function draw(){
  var W=cvs.clientWidth, H=cvs.clientHeight;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--surface-opaque")||"#fff";
  ctx.fillRect(0,0,W,H);

  var k=view.k;
  var showNodes = k>NODE_ZOOM, showLabels = k>0.55, showTitles = k>1.35;
  var hitSet={}; searchHits.forEach(function(h){ hitSet[h.id]=1; });
  var labelQueue=[], titleQueue=[];

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
      isl.p.forEach(function(nd){
        var p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0));
        var rad=Math.max(1.4, (2.2+Math.sqrt(Math.max(1,nd.n))*1.05)*k);
        var s=SYS[nd.s]||SYS[3];
        ctx.beginPath(); ctx.arc(p[0],p[1],rad,0,6.2832);
        if(nd.a){
          // Stand-alone: one college, no equivalence asserted yet. Drawn HOLLOW so it
          // reads as "nothing claimed here", never as a weaker version of a claim.
          ctx.fillStyle="#fff"; ctx.fill();
          ctx.lineWidth=Math.max(1,rad*0.34); ctx.strokeStyle=s[1]; ctx.stroke();
        } else {
          ctx.fillStyle=s[0]; ctx.fill();
        }
        if(rad>2){ ctx.lineWidth=Math.min(2,rad*0.42); ctx.strokeStyle=s[1]; ctx.stroke(); }
        if(hitSet[nd.i]){                                  // search match ring
          ctx.beginPath(); ctx.arc(p[0],p[1],rad+4.5,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle="#920000"; ctx.stroke();
        }
        if(nd===selNode){
          ctx.beginPath(); ctx.arc(p[0],p[1],rad+7,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle="#0047AB"; ctx.stroke();
        }
        // Titles are QUEUED, not drawn here, for the same reason island names
        // are: a dense island stacks dozens of them into an unreadable pile.
        // The file already calls that "the exact failure of a global graph
        // view" for islands — it is no less true one grain down, and it shows
        // up the moment a search flies you into a crowded subject.
        if(showTitles && nd.n>1 && rad>5)
          titleQueue.push({nd:nd, cx:p[0], cy:p[1]+rad+12, rad:rad,
                           force:(nd===selNode||hitSet[nd.i])});
      });
    }
    // Labels are COLLECTED here and placed after every island is drawn, so a
    // big island's name is never buried under a small neighbor's — and so
    // overlapping labels can be rejected rather than stacked. An unreadable
    // pile of overlapping names is the exact failure of a global graph view.
    labelQueue.push({isl:isl, cx:c[0], cy:c[1]-r-6, r:r,
                     force:(isl===hoverIsl||isl===selIsl)});
  });

  // Islands first: they are the navigational anchors, and a course name buried
  // under its own subject's name helps nobody. Course titles then fill the gaps
  // left over, and a title that cannot find one is dropped rather than stacked.
  titlesQueued=titleQueue.length;
  placedBoxes=placeTitles(titleQueue, placeLabels(labelQueue, showLabels));

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
    var lab=q.isl.d+" ("+q.isl.n+")";
    var w=ctx.measureText(lab).width, h=size*1.25;
    var box=[q.cx-w/2-3, q.cy-h, q.cx+w/2+3, q.cy+4];
    if(box[2]<0||box[0]>cvs.clientWidth||box[3]<0||box[1]>cvs.clientHeight) return;
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
  return boxes;   // course titles are placed into the gaps these leave
}

/* Course titles, same rule one grain down: biggest first, search hits and the
   selection ahead of everything, and anything that will not fit is DROPPED.
   Strictly dropped, including a hit — two names on top of each other are worth
   less than one name and a bare ring, and the ring is still there to be
   followed. Sorting hits first is what gets them the slots. */
function placeTitles(queue, boxes){
  var placed=[];
  if(!queue.length) return placed;
  queue.sort(function(a,b){
    if(a.force!==b.force) return a.force?-1:1;
    return b.rad-a.rad;
  });
  ctx.textAlign="center"; ctx.textBaseline="alphabetic";
  var W=cvs.clientWidth, H=cvs.clientHeight;
  queue.forEach(function(q){
    ctx.font=(q.force?"600 ":"")+"11px 'Source Sans 3',system-ui,sans-serif";
    var t=q.nd.t.length>26?q.nd.t.slice(0,25)+"\u2026":q.nd.t;
    var w=ctx.measureText(t).width;
    var box=[q.cx-w/2-2, q.cy-11, q.cx+w/2+2, q.cy+3];
    if(box[2]<0||box[0]>W||box[3]<0||box[1]>H) return;
    for(var i=0;i<boxes.length;i++){
      var b=boxes[i];
      if(box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]) return;
    }
    boxes.push(box); placed.push(box);
    ctx.lineWidth=3; ctx.strokeStyle="rgba(255,255,255,.92)";
    ctx.strokeText(t,q.cx,q.cy);
    ctx.fillStyle=q.force?"#920000":"#3A3A36";
    ctx.fillText(t,q.cx,q.cy);
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
    if(view.k>0.20){
      for(var j=0;j<isl.p.length;j++){
        var nd=isl.p[j], p=w2s(nd.x+(isl.dx||0), nd.y+(isl.dy||0));
        var rad=Math.max(3.2,(2.2+Math.sqrt(Math.max(1,nd.n))*1.05)*view.k);
        if(Math.hypot(px-p[0],py-p[1])<=rad+3) return {isl:isl,nd:nd};
      }
    }
    best=best||{isl:isl,nd:null};
  }
  return best;
}
window.__ccrUniverse = function(){
  var view_el=document.getElementById("view");
  U=window.CPL_CCR_UNIVERSE; A=window.CPL_ATLAS_DATA||null;
  window.__crumbs([{label:"All disciplines", go:window.__ccrForest},{label:"SkyView"}]);

  view_el.innerHTML =
    '<h1>The whole Common Course Reference</h1>'+
    '<p>'+num(U.counts.identities)+' course identities across '+U.counts.disciplines+
    ' subject areas. Search to fly to one. <strong>Drag a subject</strong> to pull it '+
    'next to another, then drag a course between them — that is how a course filed under '+
    'the wrong subject gets moved to its real parent.</p>'+
    '<div class="u-bar">'+
      // No search box here. The page header already carries one, and two search
      // fields on one screen that behave differently is a question about which
      // one you are supposed to use — Sam hit exactly that. The header box
      // drives this map whenever the map is open; see __ccrUniverseSearch.
      '<button class="btn" type="button" id="u-out">−</button>'+
      '<button class="btn" type="button" id="u-in">+</button>'+
      '<button class="btn" type="button" id="u-reset">Reset view</button>'+
      // A real focusable control, not a gesture: this is the route to the
      // subject list now that the map is the landing view, and it is also the
      // route a keyboard reader takes to the parts of the tab the canvas does
      // not carry.
      '<button class="btn" type="button" id="u-list">Browse subjects as a list</button>'+
      '<span class="u-z">zoom <b id="u-zoom">12%</b></span>'+
    '</div>'+
    '<div class="u-wrap"><canvas id="u-cvs" tabindex="0" role="img" aria-label="'+
      'A map of every course identity, grouped into one island per subject area. '+
      'Use the search box at the top of the page to jump to a subject, or Tab to '+
      'step through them from the keyboard; the panel below lists what you '+
      'select."></canvas>'+
      '<div class="u-hint" id="u-hint">Drag the background to pan · scroll to zoom · '+
      'drag a subject to move it · click a course to open it. '+
      'From the keyboard: <kbd>Tab</kbd> steps through subjects, <kbd>Enter</kbd> '+
      'goes into one, <kbd>Esc</kbd> comes back out.</div></div>'+
    '<div class="stage" style="margin-top:14px">'+
      '<div class="panel" id="u-detail"><h3>Nothing selected</h3>'+
      '<p class="empty">Click a subject or a course on the map.</p></div>'+
      '<div class="panel"><h3>What this would write</h3><div id="u-writes">'+
      '<p class="empty">No moves yet.</p></div>'+
      '<p style="margin:.6em 0 0;font-size:.8rem;color:var(--text-muted)">'+
      'One row per move, in <code>kb_curation</code>. Reversible: delete the row.</p></div>'+
    '</div>';

  ensureDescCss();
  cvs=document.getElementById("u-cvs"); ctx=cvs.getContext("2d");
  buildMemberIndex();
  sizeCanvas(); resetView(); wire(); draw();
};

function sizeCanvas(){
  DPR=Math.min(2, window.devicePixelRatio||1);
  var w=cvs.clientWidth, h=Math.max(380, Math.round(window.innerHeight*0.58));
  cvs.style.height=h+"px";
  cvs.width=Math.round(w*DPR); cvs.height=Math.round(h*DPR);
}
function resetView(){
  var b=U.bounds, W=cvs.clientWidth, H=cvs.clientHeight;
  var pad=60;
  view.k=Math.min((W-pad)/(b.x1-b.x0), (H-pad)/(b.y1-b.y0));
  view.x=-(b.x0+b.x1)/2; view.y=-(b.y0+b.y1)/2;
}
function zoomAt(px,py,factor){
  var before=s2w(px,py);
  view.k=Math.max(0.03, Math.min(9, view.k*factor));
  var after=s2w(px,py);
  view.x+=after[0]-before[0]; view.y+=after[1]-before[1];
  draw();
}
function flyTo(x,y,k){
  view.k=Math.max(0.03,Math.min(9,k)); view.x=-x; view.y=-y; draw();
}
window.__ccrUniverseFly = flyTo;
/* The header's search box calls this when the map is on screen, so one field
 * serves both the map and the text views instead of the page carrying two. */
window.__ccrUniverseSearch = doSearch;
window.__ccrUniverseState = function(){
  // `sel` is here so a test that clicks the canvas can assert which identity it
  // actually landed on — a click check with no such assertion passes happily
  // against the previous selection.
  // sharedKeys is here so a test can assert the guard is live on real data
  // rather than on a fixture: a payload that stops carrying collided control
  // numbers would silently turn the check into a no-op.
  var shared=0;
  if(cnCourses) for(var k in cnCourses) if(cnCourses[k].length>1) shared++;
  return {view:view, moves:moves, sel:selNode?selNode.i:null,
          members:roster?Object.keys(roster).length:0, memberSource:memberSource,
          sharedKeys:shared, canMove:canMove,
          // Exported so a test asserts against the SAME threshold draw() uses.
          // Hard-coding 0.20 in the harness would pass happily the day the
          // renderer's threshold moved and the search stopped clearing it.
          nodeZoom:NODE_ZOOM, hits:searchHits.length,
          // Canvas text cannot be queried from the DOM, so the placed boxes are
          // published for the harness to check for overlap directly. Counting
          // drawn-vs-queued alone would pass a renderer that dropped every
          // second title at random.
          placedBoxes:placedBoxes, titlesQueued:titlesQueued};
};

function wire(){
  window.addEventListener("resize", function(){ sizeCanvas(); draw(); });
  cvs.addEventListener("wheel", function(e){
    e.preventDefault();
    var r=cvs.getBoundingClientRect();
    zoomAt(e.clientX-r.left, e.clientY-r.top, e.deltaY<0?1.16:1/1.16);
  }, {passive:false});
  document.getElementById("u-in").onclick=function(){ zoomAt(cvs.clientWidth/2,cvs.clientHeight/2,1.4); };
  document.getElementById("u-out").onclick=function(){ zoomAt(cvs.clientWidth/2,cvs.clientHeight/2,1/1.4); };
  document.getElementById("u-reset").onclick=function(){ searchHits=[]; resetView(); draw(); };
  var lb=document.getElementById("u-list");
  if(lb) lb.onclick=function(){ window.__ccrForest(); };

  cvs.addEventListener("pointerdown", function(e){
    var r=cvs.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
    cvs.setPointerCapture(e.pointerId);
    // A course already picked up survives the press. Without this the pointerdown
    // replaced `drag` with a fresh node/island/pan grab before pointerup could
    // read it, so pressing "Drag…" and then clicking the destination — the only
    // route the hint text describes — selected the destination and moved nothing.
    // The verb this whole view exists for could not be completed with a mouse.
    if(drag && drag.kind==="course"){ drag.px=px; drag.py=py; return; }
    var hit=pick(px,py);
    if(hit && hit.nd)      drag={kind:"node", isl:hit.isl, nd:hit.nd, x0:px, y0:py, moved:false};
    else if(hit && e.shiftKey===false && hit.isl) drag={kind:"island", isl:hit.isl, x0:px, y0:py,
                                                        ox:hit.isl.dx||0, oy:hit.isl.dy||0, moved:false};
    else drag={kind:"pan", x0:px, y0:py, vx:view.x, vy:view.y};
  });
  cvs.addEventListener("pointermove", function(e){
    var r=cvs.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
    if(!drag){
      var hit=pick(px,py);
      var ni=hit?hit.isl:null, nn=hit?hit.nd:null;
      if(ni!==hoverIsl||nn!==hoverNode){ hoverIsl=ni; hoverNode=nn; draw();
        cvs.style.cursor = nn?"pointer":ni?"grab":"default"; }
      return;
    }
    if(drag.kind==="pan"){
      view.x=drag.vx+(px-drag.x0)/view.k; view.y=drag.vy+(py-drag.y0)/view.k; draw();
    } else if(drag.kind==="island"){
      drag.isl.dx=drag.ox+(px-drag.x0)/view.k;
      drag.isl.dy=drag.oy+(py-drag.y0)/view.k;
      if(Math.abs(px-drag.x0)+Math.abs(py-drag.y0)>3) drag.moved=true;
      draw();
    } else if(drag.kind==="course"){
      drag.px=px; drag.py=py; draw();
    } else if(drag.kind==="node"){
      if(Math.abs(px-drag.x0)+Math.abs(py-drag.y0)>4) drag.moved=true;
    }
  });
  cvs.addEventListener("pointerup", function(e){
    var r=cvs.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
    if(drag && drag.kind==="course"){
      var hit=pick(px,py);
      if(hit && hit.nd) applyMove(drag.cn, drag.code, drag.college, hit.nd.i);
      else setHint("Dropped on empty space — nothing moved.");
      drag=null; draw(); return;
    }
    if(drag && drag.kind==="node" && !drag.moved){ selNode=drag.nd; selIsl=drag.isl; showNode(drag.nd, drag.isl); }
    else if(drag && drag.kind==="island" && !drag.moved){ selIsl=drag.isl; selNode=null; showIsland(drag.isl); }
    drag=null; draw();
  });
  /* The accelerator for the button in the panel. It follows the button rather
   * than replacing it: a double-click is undiscoverable, is not reachable from
   * a keyboard, and on 154 of the 159 subjects here there is nothing to open —
   * so on its own it would be a gesture that usually appears to do nothing. */
  cvs.addEventListener("dblclick", function(e){
    var r=cvs.getBoundingClientRect();
    var hit=pick(e.clientX-r.left, e.clientY-r.top);
    if(!hit) return;
    var d=hasWorkSurface(hit.isl);
    if(d){ window.__ccrDiscipline(d); return; }
    // Say so. Silence here is indistinguishable from a broken page.
    selIsl=hit.isl; selNode=null; showIsland(hit.isl);
    setHint("No work surface for <strong>"+esc(hit.isl.d)+"</strong> yet \u2014 the "+
            "grouped decision view covers "+
            (A&&A.detail?num(Object.keys(A.detail).length):"a few")+" subjects so far.");
    draw();
  });
  /* Keyboard operation of the map itself, not just the frame.
   *
   * Arrows panned and +/- zoomed, and there was NO key that reached a subject or
   * an identity — so everything the view exists for (select it, read its panel,
   * pick a course up) needed a mouse. That was survivable while the DOM list was
   * the way in; it is not survivable now the map is the landing view, because
   * the tab's front door would be the one surface a keyboard cannot operate.
   *
   * Tab/Shift-Tab step through subjects, Enter opens the selected one, and once
   * inside a subject Tab steps through its identities. Escape steps back out.
   * Arrows keep panning — a reader who wants the frame moved still can. */
  var kbIsl=-1, kbNode=-1, kbInside=false;
  function kbSubject(dir){
    kbIsl=(kbIsl+dir+U.islands.length)%U.islands.length;
    kbInside=false; kbNode=-1;
    var isl=U.islands[kbIsl];
    selIsl=isl; selNode=null;
    flyTo(isl.x+(isl.dx||0), isl.y+(isl.dy||0), Math.min(3.2, 190/isl.r));
    showIsland(isl);
    setHint("Subject <strong>"+esc(isl.d)+"</strong> \u2014 "+num(isl.n)+
            " identities. <kbd>Enter</kbd> to step into it, <kbd>Tab</kbd> for the next subject.");
  }
  function kbIdentity(dir){
    var isl=U.islands[kbIsl]; if(!isl || !isl.p.length) return;
    kbNode=(kbNode+dir+isl.p.length)%isl.p.length;
    var nd=isl.p[kbNode];
    // Zoom past the node threshold or the identity a reader has just selected
    // is not drawn at all — the same floor the search has to clear.
    flyTo(nd.x+(isl.dx||0), nd.y+(isl.dy||0), Math.max(view.k, NODE_ZOOM*3));
    showNode(nd, isl);
    setHint("<strong>"+esc(nd.t||nd.i)+"</strong> \u2014 "+esc(nd.i)+
            " ("+num(kbNode+1)+" of "+num(isl.p.length)+" in "+esc(isl.d)+
            "). <kbd>Esc</kbd> to leave this subject.");
  }
  /* Two levels, and which one Tab moves in is held EXPLICITLY. Deriving it from
     "have we got a node yet" made Enter unable to enter: at island level there
     is no node by definition, so the same test that meant "step between
     subjects" also swallowed the keypress meant to go inside one. */
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
      if(kbInside){
        kbInside=false; kbNode=-1; selNode=null;
        var isl=U.islands[kbIsl];
        if(isl){ showIsland(isl); setHint("Back to <strong>"+esc(isl.d)+
          "</strong>. <kbd>Tab</kbd> for the next subject."); }
        draw();
      }
      e.preventDefault(); return;
    }
    if(e.key==="ArrowLeft"){ view.x+=step; draw(); e.preventDefault(); }
    if(e.key==="ArrowRight"){ view.x-=step; draw(); e.preventDefault(); }
    if(e.key==="ArrowUp"){ view.y+=step; draw(); e.preventDefault(); }
    if(e.key==="ArrowDown"){ view.y-=step; draw(); e.preventDefault(); }
    if(e.key==="+"||e.key==="="){ zoomAt(cvs.clientWidth/2,cvs.clientHeight/2,1.4); e.preventDefault(); }
    if(e.key==="-"){ zoomAt(cvs.clientWidth/2,cvs.clientHeight/2,1/1.4); e.preventDefault(); }
  });
}
function setHint(t){ var el=document.getElementById("u-hint"); if(el) el.innerHTML=t; }

/* ── keyword zoom ────────────────────────────────────────────────────────── */
function doSearch(raw){
  var term=String(raw==null?"":raw).trim().toLowerCase();
  searchTerm=term; searchHits=[];
  if(term.length<2){ setHint("Type at least two characters."); draw(); return; }
  U.islands.forEach(function(I){
    I.p.forEach(function(nd){
      if(nd.t.toLowerCase().indexOf(term)>=0 || nd.i.toLowerCase().indexOf(term)>=0)
        searchHits.push({id:nd.i, x:nd.x+(I.dx||0), y:nd.y+(I.dy||0), isl:I, nd:nd});
    });
  });
  /* A SUBJECT NAME WINS. Typing "English as a Second Language" means "take me
   * there", and the old order only considered the subject when there were no
   * node hits at all — so a subject name that also appeared in a few course
   * titles scattered the view instead of going anywhere. Only when every
   * matching island is the SAME discipline though: "art" matches Art, Culinary
   * Arts and Theater Arts, and picking one of those for the curator would be a
   * guess dressed as an answer. */
  var named=U.islands.filter(function(I){ return I.d.toLowerCase().indexOf(term)>=0; });
  var base=function(I){ return I.d.replace(" \u00b7 stand-alone",""); };
  var bases={}; named.forEach(function(I){ bases[base(I)]=1; });
  /* An EXACT discipline name beats a substring match. It has to, because the
   * corpus carries near-identical discipline names that merely CONTAIN each
   * other: "English as a Second Language" is one discipline, and "English as a
   * Second Language (ESL)" and "English as a Second Language Noncredit 53412"
   * are two more. Without this, typing the real name of a subject scattered the
   * view because two other spellings of it also matched. */
  var exact=named.filter(function(I){ return base(I).toLowerCase()===term; });
  if(exact.length) named=exact;
  if(named.length && (exact.length || Object.keys(bases).length===1)){
    // Prefer the clustered island over its stand-alone twin: the stand-alone
    // side asserts no equivalence, so it is not where curation happens.
    var isl=named.filter(function(I){ return !I.a; })[0]||named[0];
    flyTo(isl.x+(isl.dx||0), isl.y+(isl.dy||0), Math.min(3.2, 190/isl.r));
    selIsl=isl; showIsland(isl);
    setHint("Subject <strong>"+esc(isl.d)+"</strong> — "+num(isl.n)+" identities."+
      (searchHits.length?" <strong>"+num(searchHits.length)+"</strong> course"+
        (searchHits.length===1?"":"s")+" also match “"+esc(term)+"” by name"+
        (named.length>1?", including its stand-alone side":"")+", ringed in red.":""));
    draw();
    return;
  }
  if(!searchHits.length){ setHint("Nothing matches “"+esc(term)+"”."); draw(); return; }
  var subj={}; searchHits.forEach(function(h){ subj[h.isl.d]=(subj[h.isl.d]||0)+1; });
  var names=Object.keys(subj).sort(function(a,b){return subj[b]-subj[a];});
  var head="<strong>"+num(searchHits.length)+"</strong> match “"+esc(term)+
    "” across <strong>"+names.length+"</strong> subject"+(names.length===1?"":"s")+
    ": "+names.slice(0,4).map(function(n){return esc(n)+" ("+subj[n]+")";}).join(" \u00b7 ")+
    (names.length>4?" \u00b7 …":"")+".";
  var xs=searchHits.map(function(h){return h.x;}), ys=searchHits.map(function(h){return h.y;});
  var cx=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2;
  var cy=(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2;
  var spread=Math.max(90, Math.max(Math.max.apply(null,xs)-Math.min.apply(null,xs),
                                   Math.max.apply(null,ys)-Math.min.apply(null,ys)));
  var fit=Math.min(3.2, (cvs.clientWidth*0.62)/spread);
  if(fit>NODE_ZOOM){
    flyTo(cx,cy,fit);
    setHint(head+" Ringed in red.");
  } else {
    /* The hits do not fit in one view at any zoom that draws them. Go to the
     * densest subject rather than framing them all invisibly, and say which —
     * "ringed in red" over a canvas with no nodes on it is the report that
     * sent Sam looking for a rendering bug. */
    var top=searchHits.filter(function(h){return h.isl.d===names[0];});
    var tx=top.reduce(function(a,h){return a+h.x;},0)/top.length;
    var ty=top.reduce(function(a,h){return a+h.y;},0)/top.length;
    flyTo(tx,ty,Math.max(NODE_ZOOM*1.6, Math.min(3.2, 190/top[0].isl.r)));
    setHint(head+" They are too far apart to ring in one view — showing <strong>"+
      esc(names[0])+"</strong>. Search a subject name to go straight to it.");
  }
  if(searchHits.length===1){ selNode=searchHits[0].nd; selIsl=searchHits[0].isl;
                             showNode(selNode, selIsl); }
  draw();
}

/* ── panels ─────────────────────────────────────────────────────────────── */
function showIsland(isl){
  var el=document.getElementById("u-detail");
  var top=isl.p.slice().sort(function(a,b){return b.n-a.n;}).slice(0,14);
  el.innerHTML="<h3>"+esc(isl.d)+"</h3>"+
    "<p>"+num(isl.n)+(isl.a?" stand-alone courses — one college each, clustered with nothing "+
      "yet. Drag one onto the identity it belongs with.":" course identities.")+
      " Biggest first:</p>"+
    '<ul class="idlist">'+top.map(function(nd){
      var s=SYS[nd.s]||SYS[3];
      return '<li><span class="ttl">'+esc(nd.t||nd.i)+"</span> "+
        '<span class="chip '+(nd.s===0?"gen":nd.s===3?"mut":"cid")+'">'+s[2]+" "+s[3]+"</span>"+
        '<div class="sub">'+esc(nd.i)+" · "+num(nd.n)+" member"+(nd.n===1?"":"s")+"</div></li>";
    }).join("")+"</ul>"+
    workSurfaceOffer(isl)+
    '<p class="empty" style="margin-top:.5em">Drag this subject on the map to bring it '+
    'beside another, then drag a course across.</p>';
  var b=document.getElementById("u-open-work");
  if(b) b.addEventListener("click", function(){
    window.__ccrDiscipline(b.dataset.d);
  });
}
/* Sam: "double-click on a cluster in graph view to open the work surface … could
 * also have a button on graph view that does the same."
 *
 * The button leads and the double-click follows it, because the work surface
 * exists for FIVE of the 159 subjects on this map — 593 identities of 49,907.
 * The decision packs in ccr_atlas_data.json were built as a demo sample while
 * the map was built over the whole corpus. A double-click that silently does
 * nothing on 97% of the map reads as a broken page; a button can say why there
 * is nothing to open, which is the only honest thing to render here.
 *
 * Building packs for all 159 is ~39 MB inline — but that is the same shape as
 * the course descriptions, which already ship one file per discipline fetched
 * on demand. The path is known; it just has not been walked.
 */
function hasWorkSurface(isl){
  var d=isl.d.replace(" \u00b7 stand-alone","");
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
  return '<p class="empty" style="margin-top:.6em">No work surface for this subject yet '+
    '\u2014 the grouped decision view is built for '+
    (A&&A.detail?num(Object.keys(A.detail).length):"a few")+' subjects so far, not all '+
    num(U.counts.disciplines)+'.</p>';
}
function showNode(nd, isl){
  selNode=nd; selIsl=isl; memFilter="";
  renderNode();
  loadDesc(isl, function(){ if(selNode===nd) renderNode(); });
}
/* The identity's own `n` is NOT a college count — it comes from whichever field
 * minted the row (corroboration members, a cluster's member_count, a C-ID
 * anchor's source college count), and it disagrees with the members actually
 * carried on 3,399 of 16,242 identities. Both are shown and neither is
 * silently preferred: `n` is what the rest of COBI reports for this row, and
 * the carried list is what a curator can actually pick up and move. */
function renderNode(){
  var nd=selNode, isl=selIsl;
  var el=document.getElementById("u-detail");
  var s=SYS[nd.s]||SYS[3];
  var mine=membersOf(nd.i), total=mine.length;
  var h="<h3>"+esc(nd.t||nd.i)+"</h3>"+
    '<p><span class="chip '+(nd.s===0?"gen":nd.s===3?"mut":"cid")+'">'+s[2]+" "+s[3]+"</span> "+
    '<span class="sub">'+esc(nd.i)+"</span> · "+esc(isl.d)+" · "+num(total)+
    " college course"+(total===1?"":"s")+" carried"+
    (nd.a?' · <span class="chip mut" title="A single college\'s course that has not been '+
      'clustered with anything yet. It asserts no equivalence, so it cannot be over-merged '+
      '— it can only be dragged onto the identity it belongs with.">stand-alone</span>':"")+
    (nd.n && nd.n!==total ? ' · <span class="sub" title="The count this row reports '+
      'elsewhere in COBI, from the field that minted it. The carried list is the forward '+
      'join onto the raw COCI course list, which cannot always place every seeded member.">'+
      "row count "+num(nd.n)+"</span>" : "")+"</p>";
  if(!roster || !Object.keys(roster).length){
    h+='<p class="empty">No member payload loaded — ccr_universe_members.json is missing, '+
       'so no course can be dragged. This is not the same as an identity having no courses.</p>';
  } else if(!total){
    h+='<p class="empty">No college courses are carried for this identity'+
       (memberSource==="sample"?' in the prototype sample. Try Welding, Automotive Technology, '+
        'Nursing, Business or English.':'.')+'</p>';
  } else {
    var q=memFilter.trim().toLowerCase();
    var shown=q ? mine.filter(function(m){
      return (m.n+" "+m.c).toLowerCase().indexOf(q)>=0; }) : mine;
    var capped=shown.slice(0, MEMBER_PAGE);
    h+='<p><input type="search" id="u-mfilter" placeholder="Filter these courses — code or college"'+
       ' value="'+esc(memFilter)+'" style="width:100%;max-width:22em"></p>';
    // A capped list must never read as a census — say what is off the end.
    if(capped.length<shown.length || shown.length<total){
      h+='<p class="sub">Showing '+num(capped.length)+' of '+num(shown.length)+
         (shown.length<total?' matching ('+num(total)+' carried)':'')+
         '. Filter to reach the rest.</p>';
    }
    var st=descState[isl&&isl.sh];
    h+='<ul class="mlist">'+capped.map(function(m){
      var moved=movedTo[m.cn]===nd.i;
      var d=descFor(isl, nd.i, mine.indexOf(m));
      // Say it BEFORE the click, not only after. A curator who picks a course
      // up, hunts for the destination and is refused on arrival has done the
      // hard part of the work for nothing.
      var shared=coursesOn(m.cn).length>1;
      var cls=(moved?"moved ":"")+(shared?"shared":"");
      return '<li'+(cls.trim()?' class="'+cls.trim()+'"':"")+'>'+
        '<span class="cd">'+esc(m.n)+"</span>"+
        '<span class="co" title="'+esc(m.c)+'">'+esc(m.c)+"</span>"+
        (moved?' <span class="chip ok">✓ moved here</span>':"")+
        (shared?' <span class="chip warn" title="Control number '+esc(m.cn)+
          ' names '+coursesOn(m.cn).length+' different courses, so the '+
          'CN: write key cannot say which one to move.">shared key</span>':"")+
        '<button class="mv" type="button" data-cn="'+esc(m.cn)+'" data-code="'+esc(m.n)+
        '" data-col="'+esc(m.c)+'"'+(shared?' data-shared="1"':"")+'>Drag\u2026</button>'+
        (d?'<div class="mdesc">'+esc(d)+"</div>"
          :st==="ok"?'<div class="mdesc none">No catalog description for this course.</div>':"")+
        "</li>";
    }).join("")+"</ul>"+
    (st==="loading"?'<p class="empty">Loading catalog descriptions…</p>':"")+
    (st==="blocked"?'<p class="empty">Catalog descriptions need the page SERVED, not opened '+
      'from a file — they are 45.7 MB and load per subject on demand. Run '+
      '<code>python3 -m http.server 8000</code> in the repo root and open '+
      '<code>http://localhost:8000/prototype/ccr_atlas_v1.built.html</code>.</p>':"")+
    (st==="missing"?'<p class="empty">Catalog descriptions for this subject did not load. '+
      'Re-run <code>python3 kb/_build_ccr_universe.py</code> to regenerate them.</p>':"")+
    '<p class="empty" style="margin-top:.5em">Press <strong>Drag…</strong>, then click any '+
    'course anywhere on the map — including in another subject.</p>';
  }
  el.innerHTML=h;
  var f=document.getElementById("u-mfilter");
  if(f) f.addEventListener("input", function(){
    memFilter=f.value; renderNode();
    var g=document.getElementById("u-mfilter");
    if(g){ g.focus(); g.setSelectionRange(g.value.length, g.value.length); }
  });
  Array.prototype.forEach.call(el.querySelectorAll(".mv"), function(b){
    b.addEventListener("click", function(){
      if(b.dataset.shared){
        setHint(sharedKeyReason(b.dataset.cn, b.dataset.code, coursesOn(b.dataset.cn)));
        return;
      }
      drag={kind:"course", cn:b.dataset.cn, code:b.dataset.code, college:b.dataset.col,
            px:cvs.clientWidth/2, py:cvs.clientHeight/2};
      setHint("Carrying <strong>"+esc(b.dataset.code)+"</strong> — click the course it belongs to. "+
              "Drag a subject first if it is far away.");
      cvs.focus(); draw();
    });
  });
}
function applyMove(cn, code, college, toId){
  var gate=canMove(cn);
  if(!gate.ok){ setHint(sharedKeyReason(cn, code, gate.others)); return; }
  var from=movedTo[cn]||originOf(cn);
  if(from===toId){ setHint("That course is already there."); return; }
  movedTo[cn]=toId;
  moves=moves.filter(function(m){return m.cn!==cn;});
  moves.push({cn:cn, code:code, college:college, to:toId, from:from});
  var t=nodeById(toId);
  setHint("Moved <strong>"+esc(code)+"</strong> ("+esc(college)+") to <strong>"+
          esc(t?(t.nd.t||toId):toId)+"</strong>"+(t?" in "+esc(t.isl.d):"")+". ✓");
  drawWrites();
  if(selNode) renderNode();
}
function drawWrites(){
  var el=document.getElementById("u-writes");
  if(!moves.length){ el.innerHTML='<p class="empty">No moves yet.</p>'; return; }
  el.innerHTML='<div class="writes">'+moves.map(function(m){
    return "<div>CN:"+esc(m.cn)+"  merge_into  "+esc(m.to)+"</div>";
  }).join("")+"</div>";
}
})();
