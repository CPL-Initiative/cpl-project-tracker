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
var moves=[], home={}, memberIndex=null;
var drag=null;               // {kind:'pan'|'island'|'course', ...}
var searchHits=[], searchTerm="";

var SYS=[["#F1EAFC","#6D28D9","✽","M-ID"],
         ["#E7EEF9","#0047AB","★","C-ID"],
         ["#FBF1D8","#8B6800","◆","CCN"],
         ["#EFEFEC","#5C5C55","○","unified"]];

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function num(n){return (n==null?0:n).toLocaleString("en-US");}
function w2s(x,y){return [(x+view.x)*view.k + cvs.clientWidth/2,
                          (y+view.y)*view.k + cvs.clientHeight/2];}
function s2w(px,py){return [(px-cvs.clientWidth/2)/view.k - view.x,
                            (py-cvs.clientHeight/2)/view.k - view.y];}

/* ── member lookup, built once from whatever detail the page carries ─────── */
function buildMemberIndex(){
  memberIndex={};
  if(!A||!A.detail) return;
  Object.keys(A.detail).forEach(function(dn){
    A.detail[dn].forEach(function(pack){
      pack.nodes.forEach(function(nd){
        if(!nd.m||!nd.m.length) return;
        memberIndex[nd.id]=nd.m;
        nd.m.forEach(function(m){ if(!(m.cn in home)) home[m.cn]=nd.id; });
      });
    });
  });
}
function membersOf(id){
  var out=[];
  Object.keys(home).forEach(function(cn){
    if(home[cn]!==id) return;
    var found=null;
    Object.keys(memberIndex).forEach(function(oid){
      memberIndex[oid].forEach(function(m){ if(m.cn===cn) found=m; });
    });
    if(found) out.push(found);
  });
  return out;
}
function nodeById(id){
  for(var i=0;i<U.islands.length;i++){
    var isl=U.islands[i];
    for(var j=0;j<isl.p.length;j++) if(isl.p[j].i===id) return {isl:isl,nd:isl.p[j]};
  }
  return null;
}

/* ── draw ───────────────────────────────────────────────────────────────── */
function draw(){
  var W=cvs.clientWidth, H=cvs.clientHeight;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=getComputedStyle(document.body).getPropertyValue("--surface-opaque")||"#fff";
  ctx.fillRect(0,0,W,H);

  var k=view.k;
  var showNodes = k>0.20, showLabels = k>0.55, showTitles = k>1.35;
  var hitSet={}; searchHits.forEach(function(h){ hitSet[h.id]=1; });
  var labelQueue=[];

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
        ctx.fillStyle=s[0]; ctx.fill();
        if(rad>2){ ctx.lineWidth=Math.min(2,rad*0.42); ctx.strokeStyle=s[1]; ctx.stroke(); }
        if(hitSet[nd.i]){                                  // search match ring
          ctx.beginPath(); ctx.arc(p[0],p[1],rad+4.5,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle="#920000"; ctx.stroke();
        }
        if(nd===selNode){
          ctx.beginPath(); ctx.arc(p[0],p[1],rad+7,0,6.2832);
          ctx.lineWidth=2.4; ctx.strokeStyle="#0047AB"; ctx.stroke();
        }
        if(showTitles && nd.n>1 && rad>5){
          ctx.font="11px 'Source Sans 3',system-ui,sans-serif";
          ctx.fillStyle="#3A3A36"; ctx.textAlign="center";
          var t=nd.t.length>26?nd.t.slice(0,25)+"…":nd.t;
          ctx.fillText(t,p[0],p[1]+rad+12);
        }
      });
    }
    // Labels are COLLECTED here and placed after every island is drawn, so a
    // big island's name is never buried under a small neighbour's — and so
    // overlapping labels can be rejected rather than stacked. An unreadable
    // pile of overlapping names is the exact failure of a global graph view.
    labelQueue.push({isl:isl, cx:c[0], cy:c[1]-r-6, r:r,
                     force:(isl===hoverIsl||isl===selIsl)});
  });

  placeLabels(labelQueue, showLabels);

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
  window.__crumbs([{label:"All disciplines", go:window.__ccrForest},{label:"Universe"}]);

  view_el.innerHTML =
    '<h1>The whole Common Course Reference</h1>'+
    '<p>'+num(U.counts.identities)+' course identities across '+U.counts.disciplines+
    ' subject areas. Search to fly to one. <strong>Drag a subject</strong> to pull it '+
    'next to another, then drag a course between them — that is how a course filed under '+
    'the wrong subject gets moved to its real parent.</p>'+
    '<div class="u-bar">'+
      '<input type="search" id="u-q" placeholder="Find a course or subject — e.g. welding, phlebotomy, MATH">'+
      '<button class="btn" type="button" id="u-find">Find</button>'+
      '<button class="btn" type="button" id="u-out">−</button>'+
      '<button class="btn" type="button" id="u-in">+</button>'+
      '<button class="btn" type="button" id="u-reset">Reset view</button>'+
      '<span class="u-z">zoom <b id="u-zoom">12%</b></span>'+
    '</div>'+
    '<div class="u-wrap"><canvas id="u-cvs" tabindex="0" role="img" aria-label="'+
      'A map of every course identity, grouped into one island per subject area. '+
      'Use the search box to jump to a subject; the panel below lists what you select."></canvas>'+
      '<div class="u-hint" id="u-hint">Drag the background to pan · scroll to zoom · '+
      'drag a subject to move it · click a course to open it</div></div>'+
    '<div class="stage" style="margin-top:14px">'+
      '<div class="panel" id="u-detail"><h3>Nothing selected</h3>'+
      '<p class="empty">Click a subject or a course on the map.</p></div>'+
      '<div class="panel"><h3>What this would write</h3><div id="u-writes">'+
      '<p class="empty">No moves yet.</p></div>'+
      '<p style="margin:.6em 0 0;font-size:.8rem;color:var(--text-muted)">'+
      'One row per move, in <code>kb_curation</code>. Reversible: delete the row.</p></div>'+
    '</div>';

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
window.__ccrUniverseState = function(){ return {view:view, moves:moves}; };

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
  document.getElementById("u-find").onclick=doSearch;
  document.getElementById("u-q").addEventListener("keydown",function(e){
    if(e.key==="Enter"){ e.preventDefault(); doSearch(); }
  });

  cvs.addEventListener("pointerdown", function(e){
    var r=cvs.getBoundingClientRect(), px=e.clientX-r.left, py=e.clientY-r.top;
    var hit=pick(px,py);
    cvs.setPointerCapture(e.pointerId);
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
  cvs.addEventListener("keydown", function(e){
    var step=40/view.k;
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
function doSearch(){
  var term=(document.getElementById("u-q").value||"").trim().toLowerCase();
  searchTerm=term; searchHits=[];
  if(term.length<2){ setHint("Type at least two characters."); draw(); return; }
  var isl=null;
  for(var i=0;i<U.islands.length;i++)
    if(U.islands[i].d.toLowerCase().indexOf(term)>=0){ isl=U.islands[i]; break; }
  U.islands.forEach(function(I){
    I.p.forEach(function(nd){
      if(nd.t.toLowerCase().indexOf(term)>=0 || nd.i.toLowerCase().indexOf(term)>=0)
        searchHits.push({id:nd.i, x:nd.x+(I.dx||0), y:nd.y+(I.dy||0), isl:I, nd:nd});
    });
  });
  if(isl && !searchHits.length){
    flyTo(isl.x+(isl.dx||0), isl.y+(isl.dy||0), Math.min(3.2, 190/isl.r));
    selIsl=isl; showIsland(isl);
    setHint("Subject <strong>"+esc(isl.d)+"</strong> — "+isl.n+" identities.");
    return;
  }
  if(!searchHits.length){ setHint("Nothing matches “"+esc(term)+"”."); draw(); return; }
  var xs=searchHits.map(function(h){return h.x;}), ys=searchHits.map(function(h){return h.y;});
  var cx=(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2;
  var cy=(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2;
  var spread=Math.max(90, Math.max(Math.max.apply(null,xs)-Math.min.apply(null,xs),
                                   Math.max.apply(null,ys)-Math.min.apply(null,ys)));
  flyTo(cx,cy, Math.min(3.2, (cvs.clientWidth*0.62)/spread));
  var subj={}; searchHits.forEach(function(h){ subj[h.isl.d]=(subj[h.isl.d]||0)+1; });
  var names=Object.keys(subj).sort(function(a,b){return subj[b]-subj[a];});
  setHint("<strong>"+num(searchHits.length)+"</strong> match“"+esc(term)+
    "” across <strong>"+names.length+"</strong> subject"+(names.length===1?"":"s")+
    ": "+names.slice(0,4).map(function(n){return esc(n)+" ("+subj[n]+")";}).join(" · ")+
    (names.length>4?" · …":"")+". Ringed in red.");
  if(searchHits.length===1){ selNode=searchHits[0].nd; selIsl=searchHits[0].isl;
                             showNode(selNode, selIsl); }
  draw();
}

/* ── panels ─────────────────────────────────────────────────────────────── */
function showIsland(isl){
  var el=document.getElementById("u-detail");
  var top=isl.p.slice().sort(function(a,b){return b.n-a.n;}).slice(0,14);
  el.innerHTML="<h3>"+esc(isl.d)+"</h3>"+
    "<p>"+num(isl.n)+" course identities. Biggest first:</p>"+
    '<ul class="idlist">'+top.map(function(nd){
      var s=SYS[nd.s]||SYS[3];
      return '<li><span class="ttl">'+esc(nd.t||nd.i)+"</span> "+
        '<span class="chip '+(nd.s===0?"gen":nd.s===3?"mut":"cid")+'">'+s[2]+" "+s[3]+"</span>"+
        '<div class="sub">'+esc(nd.i)+" · "+nd.n+" college"+(nd.n===1?"":"s")+"</div></li>";
    }).join("")+"</ul>"+
    '<p class="empty" style="margin-top:.5em">Drag this subject on the map to bring it '+
    'beside another, then drag a course across.</p>';
}
function showNode(nd, isl){
  var el=document.getElementById("u-detail");
  var s=SYS[nd.s]||SYS[3];
  var mine=membersOf(nd.i);
  var h="<h3>"+esc(nd.t||nd.i)+"</h3>"+
    '<p><span class="chip '+(nd.s===0?"gen":nd.s===3?"mut":"cid")+'">'+s[2]+" "+s[3]+"</span> "+
    '<span class="sub">'+esc(nd.i)+"</span> · "+esc(isl.d)+" · "+nd.n+
    " college"+(nd.n===1?"":"s")+"</p>";
  if(!memberIndex || !Object.keys(memberIndex).length){
    h+='<p class="empty">College courses load on demand — this prototype carries them '+
       'for a sample of subjects.</p>';
  } else if(!mine.length){
    h+='<p class="empty">No college courses carried for this identity in the prototype sample. '+
       'Try Welding, Automotive Technology, Nursing, Business or English.</p>';
  } else {
    h+='<ul class="mlist">'+mine.map(function(m){
      var moved=moves.some(function(x){return x.cn===m.cn;});
      return '<li'+(moved?' class="moved"':"")+'>'+
        '<span class="cd">'+esc(m.n)+"</span>"+
        '<span class="co" title="'+esc(m.c)+'">'+esc(m.c)+"</span>"+
        (moved?' <span class="chip ok">✓ moved</span>':"")+
        '<button class="mv" type="button" data-cn="'+esc(m.cn)+'" data-code="'+esc(m.n)+
        '" data-col="'+esc(m.c)+'">Drag\u2026</button></li>';
    }).join("")+"</ul>"+
    '<p class="empty" style="margin-top:.5em">Press <strong>Drag…</strong>, then click any '+
    'course anywhere on the map — including in another subject.</p>';
  }
  el.innerHTML=h;
  Array.prototype.forEach.call(el.querySelectorAll(".mv"), function(b){
    b.addEventListener("click", function(){
      drag={kind:"course", cn:b.dataset.cn, code:b.dataset.code, college:b.dataset.col,
            px:cvs.clientWidth/2, py:cvs.clientHeight/2};
      setHint("Carrying <strong>"+esc(b.dataset.code)+"</strong> — click the course it belongs to. "+
              "Drag a subject first if it is far away.");
      cvs.focus(); draw();
    });
  });
}
function applyMove(cn, code, college, toId){
  var from=home[cn];
  if(from===toId){ setHint("That course is already there."); return; }
  home[cn]=toId;
  moves=moves.filter(function(m){return m.cn!==cn;});
  moves.push({cn:cn, code:code, college:college, to:toId, from:from});
  var t=nodeById(toId);
  setHint("Moved <strong>"+esc(code)+"</strong> ("+esc(college)+") to <strong>"+
          esc(t?(t.nd.t||toId):toId)+"</strong>"+(t?" in "+esc(t.isl.d):"")+". ✓");
  drawWrites();
  if(selNode) showNode(selNode, selIsl);
}
function drawWrites(){
  var el=document.getElementById("u-writes");
  if(!moves.length){ el.innerHTML='<p class="empty">No moves yet.</p>'; return; }
  el.innerHTML='<div class="writes">'+moves.map(function(m){
    return "<div>CN:"+esc(m.cn)+"  merge_into  "+esc(m.to)+"</div>";
  }).join("")+"</div>";
}
})();
