/* SkyView — THE graph view (Sam, 2026-08-24: "SkyView" means the graph view,
   not the surrounding informational elements). Scoped force graph + move affordance.
 *
 * Scope is deliberate. The corpus is ~17k identities over ~135k local courses;
 * a graph of that is the hairball Obsidian becomes at a few hundred notes.
 * The unit drawn here is ONE decision component — 97% of them are <=12
 * identities — which is the size a force layout is actually good at.
 *
 * A move writes nothing. It records the exact kb_curation row the live tab
 * would write: `CN:<control number>` -> merge_into <target identity>, which is
 * the member re-home path already implemented in excel_to_dashboard.py and
 * covered by tests/uc_member_rehome.test.js.
 */
(function(){
"use strict";
var W=760, H=470, R_MIN=13, R_MAX=34;

function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

/* ── layout: plain spring/repulsion, run to rest before paint ──────────── */
function layout(nodes, edges, reduced){
  var n=nodes.length, i, j;
  var pos = nodes.map(function(_,k){
    var a = 2*Math.PI*k/n;                       // deterministic seed ring
    return {x:W/2 + Math.cos(a)*Math.min(W,H)*0.3,
            y:H/2 + Math.sin(a)*Math.min(W,H)*0.3, vx:0, vy:0};
  });
  var idx={}; nodes.forEach(function(nd,k){ idx[nd.id]=k; });
  var links = edges.map(function(e){ return [idx[e.a], idx[e.b]]; })
                   .filter(function(l){ return l[0]!=null && l[1]!=null; });
  var iters = reduced ? 260 : 380;
  var ideal = n<=3 ? 200 : n<=6 ? 170 : n<=10 ? 150 : n<=16 ? 132 : 118;
  for(var t=0;t<iters;t++){
    var damp = 0.86;
    for(i=0;i<n;i++){
      for(j=i+1;j<n;j++){
        var dx=pos[j].x-pos[i].x, dy=pos[j].y-pos[i].y;
        var d=Math.sqrt(dx*dx+dy*dy)||0.01;
        var rep = 13000/(d*d);
        var ux=dx/d, uy=dy/d;
        pos[i].vx-=ux*rep; pos[i].vy-=uy*rep;
        pos[j].vx+=ux*rep; pos[j].vy+=uy*rep;
      }
      pos[i].vx += (W/2-pos[i].x)*0.006;
      pos[i].vy += (H/2-pos[i].y)*0.006;
    }
    links.forEach(function(l){
      var a=pos[l[0]], b=pos[l[1]];
      var dx=b.x-a.x, dy=b.y-a.y, d=Math.sqrt(dx*dx+dy*dy)||0.01;
      var f=(d-ideal)*0.012, ux=dx/d, uy=dy/d;
      a.vx+=ux*f; a.vy+=uy*f; b.vx-=ux*f; b.vy-=uy*f;
    });
    for(i=0;i<n;i++){
      pos[i].vx*=damp; pos[i].vy*=damp;
      pos[i].x+=pos[i].vx; pos[i].y+=pos[i].vy;
      pos[i].x=Math.max(46,Math.min(W-46,pos[i].x));
      pos[i].y=Math.max(40,Math.min(H-40,pos[i].y));
    }
  }
  return pos;
}
function radius(n){
  var v = Math.sqrt(Math.max(1,n.n));
  return Math.max(R_MIN, Math.min(R_MAX, 9 + v*3.4));
}
/* ── two facts, two channels ──────────────────────────────────────────────
 * COLOR = which identity system owns the row. That is the structural fact and
 * the one that decides what you may do to it: a C-ID or CCN is an official
 * statewide identity nobody here may re-key, an M-ID is our own working label,
 * a Z-row is a synthetic unified course. Colour is never the only signal, so
 * each carries its own mark (First Light: every accent is glyph-paired).
 *
 * STATE — flagged / curator-reviewed — is a SEPARATE channel: a small dot on
 * the rim. Folding it into the fill would mean a flagged C-ID stopped looking
 * official, which is the one thing about it that must never be ambiguous.
 */
var SYSTEMS = {
  "C-ID":    {fill:"#E7EEF9", stroke:"#0047AB", glyph:"\u2605", word:"C-ID \u2014 official statewide"},
  "CCN-ID":  {fill:"#FBF1D8", stroke:"#8B6800", glyph:"\u25C6", word:"CCN \u2014 official statewide"},
  "M-ID":    {fill:"#F1EAFC", stroke:"#6D28D9", glyph:"\u273D", word:"M-ID \u2014 our working label"},
  "Unified": {fill:"#EFEFEC", stroke:"#5C5C55", glyph:"\u25CB", word:"unified \u2014 synthetic course"}
};
function paintOf(nd){
  return SYSTEMS[nd.sys] || SYSTEMS[nd.k] || SYSTEMS["Unified"];
}
function stateOf(nd){
  if (nd.rev)          return {fill:"#2C601A", glyph:"\u2713", word:"curator-reviewed"};
  if (nd.flags.length) return {fill:"#920000", glyph:"\u26A0", word:"flagged"};
  return null;
}

window.__ccrPreview = function(el, pack){
  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pos = layout(pack.nodes, pack.edges, reduced);
  var byId = {}; pack.nodes.forEach(function(nd,k){ byId[nd.id]={nd:nd,p:pos[k]}; });
  var s=[];
  s.push('<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+
         pack.nodes.length+' course identities that may be the same course. '+
         'Lines mean an evidence lane suggested they match.">');
  pack.edges.forEach(function(e){
    var a=byId[e.a], b=byId[e.b]; if(!a||!b) return;
    var strong = e.lanes.indexOf("subject")<0;
    s.push('<line x1="'+a.p.x.toFixed(1)+'" y1="'+a.p.y.toFixed(1)+
           '" x2="'+b.p.x.toFixed(1)+'" y2="'+b.p.y.toFixed(1)+
           '" stroke="'+(strong?"rgba(109,40,217,.45)":"rgba(28,28,26,.15)")+
           '" stroke-width="'+(strong?2:1)+'"'+(strong?"":' stroke-dasharray="3 3"')+"></line>");
  });
  pack.nodes.forEach(function(nd){
    var p=byId[nd.id].p, r=radius(nd), pt=paintOf(nd);
    s.push('<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+r.toFixed(1)+
           '" fill="'+pt.fill+'" stroke="'+pt.stroke+'" stroke-width="2"></circle>');
    s.push('<text x="'+p.x.toFixed(1)+'" y="'+(p.y+4).toFixed(1)+
           '" text-anchor="middle" font-size="'+(r>20?13:11)+
           '" fill="'+pt.stroke+'" class="node-g">'+pt.glyph+"</text>");
    var st = stateOf(nd);
    if (st) {
      var ang = -Math.PI/4;
      s.push('<circle cx="'+(p.x + Math.cos(ang)*r).toFixed(1)+'" cy="'+
             (p.y + Math.sin(ang)*r).toFixed(1)+'" r="4.5" fill="'+st.fill+
             '" stroke="var(--surface-opaque)" stroke-width="1.5"></circle>');
    }
    var lab=(nd.t||nd.id); if(lab.length>22) lab=lab.slice(0,21)+"\u2026";
    s.push('<text x="'+p.x.toFixed(1)+'" y="'+(p.y+r+13).toFixed(1)+
           '" text-anchor="middle" class="node-l" fill="var(--text-body)">'+esc(lab)+"</text>");
    s.push('<text x="'+p.x.toFixed(1)+'" y="'+(p.y+r+25).toFixed(1)+
           '" text-anchor="middle" class="node-l" fill="var(--text-muted)">'+
           esc(nd.id)+" \u00b7 "+nd.n+"</text>");
  });
  s.push("</svg>");
  el.innerHTML = s.join("");
};

window.__ccrDecision = function(discName, i){
  var DATA = JSON.parse(document.getElementById("atlas-data").textContent);
  var pack = DATA.detail[discName][i];
  var view = document.getElementById("view");
  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* local, reversible move log — nothing leaves the page */
  var moves = [];
  var home  = {};                       // cn -> target identity id
  /* Every course a control number names, WITHIN this decision's pack. The write
   * is `CN:<control number>` and nothing else, so a key naming several courses
   * cannot express which one to move and the receiving end picks the first it
   * finds. Same guard as prototype/ccr_universe.js — back-ported here rather
   * than left as a second, unguarded write path. */
  var cnCourses = {};
  pack.nodes.forEach(function(nd){ nd.m.forEach(function(m){
    home[m.cn]=nd.id;
    var l=cnCourses[m.cn]||(cnCourses[m.cn]=[]);
    for(var i=0;i<l.length;i++) if(l[i].n===m.n && l[i].c===m.c) return;
    l.push({n:m.n, c:m.c});
  }); });
  function coursesOn(cn){ return cnCourses[cn]||[]; }
  function sharedKeyReason(cn, code){
    var them=coursesOn(cn).filter(function(o){return o.n!==code;});
    return "Cannot re-home <strong>"+esc(code)+"</strong>: control number "+esc(cn)+
      " names "+coursesOn(cn).length+" courses — also "+
      esc(them.slice(0,3).map(function(o){return o.n+" ("+o.c+")";}).join(", "))+
      ". The write is <code>CN:"+esc(cn)+"</code>, which cannot say which one.";
  }

  window.__crumbs([
    {label:"All disciplines", go:window.__ccrForest},
    {label:discName, go:function(){ window.__ccrDiscipline(discName); }},
    {label:"Decision "+(i+1)}
  ]);

  var h=[];
  h.push("<h1>"+pack.nodes.length+" identit"+(pack.nodes.length===1?"y":"ies")+
         " that may be the same course</h1>");
  h.push('<p>'+esc(discName)+" · "+pack.members+
         " local courses sit underneath. Move any course to the identity it belongs to — "+
         "by dragging it onto a circle, or with the <strong>Move</strong> button if you'd rather not drag.</p>");
  h.push('<div class="stage">');
  h.push('<div><div class="canvas">'+
         '<div class="gbar"><button class="btn" type="button" id="g-out">\u2212</button>'+
         '<button class="btn" type="button" id="g-in">+</button>'+
         '<button class="btn" type="button" id="g-reset">Reset view</button>'+
         '<span class="sub" id="g-z">zoom 100%</span></div>'+
         '<div id="gfx"></div>'+
         '<div class="hint"><div id="hint">Drag a course from the list onto a circle. '+
         'Scroll to zoom, drag the background to pan. '+
         'Circle size = how many colleges teach it.</div>'+
         '<div class="glegend">'+
           '<span><b style="color:#0047AB">\u2605</b> C-ID \u2014 official</span>'+
           '<span><b style="color:#8B6800">\u25C6</b> CCN \u2014 official</span>'+
           '<span><b style="color:#6D28D9">\u273D</b> M-ID \u2014 ours</span>'+
           '<span><b style="color:#5C5C55">\u25CB</b> unified</span>'+
           '<span><i class="sdot" style="background:#920000"></i> \u26A0 flagged</span>'+
           '<span><i class="sdot" style="background:#2C601A"></i> \u2713 reviewed</span>'+
         '</div></div></div></div>');
  h.push('<div class="side">');
  h.push('<div class="panel"><h3>Courses underneath</h3><ul class="idlist" id="ids"></ul></div>');
  h.push('<div class="panel"><h3>What this would write</h3><div id="wr"></div>'+
         '<p style="margin:.6em 0 0;font-size:.8rem;color:var(--text-muted)">'+
         'One row per move, in <code>kb_curation</code>. Reversible: delete the row and the '+
         'course returns to where it was.</p></div>');
  h.push("</div></div>");
  view.innerHTML = h.join("");

  var pos = layout(pack.nodes, pack.edges, reduced);
  var byId = {}; pack.nodes.forEach(function(nd,k){ byId[nd.id]={nd:nd,p:pos[k]}; });

  function drawGraph(){
    var s=[];
    s.push('<svg viewBox="0 0 '+W+' '+H+'" role="group" aria-label="Course identities in this decision. '+
           'Each circle is one identity; lines mean an evidence lane suggested they match.">');
    s.push('<defs><marker id="none"></marker></defs>');
    pack.edges.forEach(function(e){
      var a=byId[e.a], b=byId[e.b]; if(!a||!b) return;
      var strong = e.lanes.indexOf("subject")<0;
      s.push('<line x1="'+a.p.x.toFixed(1)+'" y1="'+a.p.y.toFixed(1)+
             '" x2="'+b.p.x.toFixed(1)+'" y2="'+b.p.y.toFixed(1)+
             '" stroke="'+(strong?"rgba(109,40,217,.45)":"rgba(28,28,26,.15)")+
             '" stroke-width="'+(strong?2:1)+'"'+(strong?"":' stroke-dasharray="3 3"')+"></line>");
    });
    pack.nodes.forEach(function(nd){
      var p=byId[nd.id].p, r=radius(nd), pt=paintOf(nd);
      var mine = Object.keys(home).filter(function(cn){return home[cn]===nd.id;}).length;
      s.push('<g class="nodeg" data-id="'+esc(nd.id)+'" tabindex="0" role="button" '+
             'aria-label="'+esc(nd.t||nd.id)+", "+esc(nd.id)+", "+mine+
             ' courses, '+pt.word+(stateOf(nd)?', '+stateOf(nd).word:'')+
             '. Press Enter to send the selected course here.">');
      s.push('<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+r.toFixed(1)+
             '" fill="'+pt.fill+'" stroke="'+pt.stroke+'" stroke-width="2"></circle>');
      s.push('<text x="'+p.x.toFixed(1)+'" y="'+(p.y+4).toFixed(1)+
             '" text-anchor="middle" font-size="'+(r>20?13:11)+
             '" fill="'+pt.stroke+'" class="node-g">'+pt.glyph+"</text>");
      var st = stateOf(nd);
      if (st) {
        var a = -Math.PI/4;
        s.push('<circle cx="'+(p.x + Math.cos(a)*r).toFixed(1)+'" cy="'+
               (p.y + Math.sin(a)*r).toFixed(1)+'" r="4.5" fill="'+st.fill+
               '" stroke="var(--surface-opaque)" stroke-width="1.5"></circle>');
      }
      var lab=(nd.t||nd.id); if(lab.length>22) lab=lab.slice(0,21)+"…";
      s.push('<text x="'+p.x.toFixed(1)+'" y="'+(p.y+r+13).toFixed(1)+
             '" text-anchor="middle" class="node-l" fill="var(--text-body)">'+esc(lab)+"</text>");
      s.push('<text x="'+p.x.toFixed(1)+'" y="'+(p.y+r+25).toFixed(1)+
             '" text-anchor="middle" class="node-l" fill="var(--text-muted)">'+
             esc(nd.id)+" · "+mine+"</text>");
      s.push("</g>");
    });
    s.push("</svg>");
    document.getElementById("gfx").innerHTML=s.join("");
    applyGView();
    wireNodes();
    wireGraphView();
  }

  /* Sam: "I can use the mini graph view — doesn't seem drag and droppable or
   * zoomable." It was a fixed viewBox, so a crowded decision (this one carries
   * 13 identities and 89 courses) had no way to spread out and no way to read a
   * label that landed under another.
   *
   * Zoom and pan move the viewBox rather than re-laying out: the layout is
   * precomputed and stable on purpose — the same reason the universe view ships
   * coordinates instead of solving them — so nothing must move under the reader
   * except the frame they are looking through. */
  var gview={k:1, x:0, y:0};
  function applyGView(){
    var svg=view.querySelector("#gfx svg"); if(!svg) return;
    var w=W/gview.k, hh=H/gview.k;
    svg.setAttribute("viewBox", gview.x.toFixed(1)+" "+gview.y.toFixed(1)+" "+
                                w.toFixed(1)+" "+hh.toFixed(1));
    var z=document.getElementById("g-z");
    if(z) z.textContent="zoom "+Math.round(gview.k*100)+"%";
  }
  function gzoom(f, ax, ay){
    var k0=gview.k;
    gview.k=Math.max(0.4, Math.min(8, gview.k*f));
    // Keep the point under the cursor fixed, or zooming walks the graph away.
    if(ax!=null){
      gview.x += ax*(1/k0 - 1/gview.k);
      gview.y += ay*(1/k0 - 1/gview.k);
    }
    applyGView();
  }
  function wireGraphView(){
    var svg=view.querySelector("#gfx svg"); if(!svg || svg.dataset.wired) return;
    svg.dataset.wired="1";
    svg.addEventListener("wheel", function(e){
      e.preventDefault();
      var r=svg.getBoundingClientRect();
      gzoom(e.deltaY<0?1.18:1/1.18,
            (e.clientX-r.left)/r.width*W, (e.clientY-r.top)/r.height*H);
    }, {passive:false});
    var pan=null;
    svg.addEventListener("pointerdown", function(e){
      // Never steal a press aimed at a circle — that press selects, and a drop
      // target that also pans is a target you cannot hit.
      if(e.target.closest && e.target.closest(".nodeg")) return;
      var r=svg.getBoundingClientRect();
      pan={px:e.clientX, py:e.clientY, x:gview.x, y:gview.y, sx:W/r.width/gview.k,
           sy:H/r.height/gview.k};
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener("pointermove", function(e){
      if(!pan) return;
      gview.x=pan.x-(e.clientX-pan.px)*pan.sx;
      gview.y=pan.y-(e.clientY-pan.py)*pan.sy;
      applyGView();
    });
    svg.addEventListener("pointerup", function(e){
      pan=null;
      try{ svg.releasePointerCapture(e.pointerId); }catch(err){}
    });
  }

  var selected=null;                       // {cn, code, college, title, from}
  function setHint(t){ document.getElementById("hint").innerHTML=t; }

  function wireNodes(){
    Array.prototype.forEach.call(view.querySelectorAll(".nodeg"), function(g){
      var id=g.dataset.id;
      function drop(){
        if(!selected){ setHint("Pick a course first — press <strong>Move</strong> beside one in the list."); return; }
        if(selected.from===id){ setHint("That course is already here."); return; }
        applyMove(selected, id);
        selected=null;
      }
      g.addEventListener("click", drop);
      g.addEventListener("keydown", function(ev){
        if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); drop(); }
      });
      g.addEventListener("dragover", function(ev){ ev.preventDefault(); });
      g.addEventListener("drop", function(ev){
        ev.preventDefault();
        var cn=ev.dataTransfer.getData("text/plain");
        var m=findMember(cn); if(m){ selected=m; drop(); }
      });
    });
  }
  function findMember(cn){
    for(var k=0;k<pack.nodes.length;k++){
      var nd=pack.nodes[k];
      for(var j=0;j<nd.m.length;j++){
        if(nd.m[j].cn===cn) return {cn:cn, code:nd.m[j].n, college:nd.m[j].c,
                                    title:nd.m[j].t, from:home[cn]};
      }
    }
    return null;
  }
  function applyMove(sel, toId){
    if(coursesOn(sel.cn).length>1){ setHint(sharedKeyReason(sel.cn, sel.code)); return; }
    home[sel.cn]=toId;
    moves = moves.filter(function(m){ return m.cn!==sel.cn; });
    var origin = null;
    pack.nodes.forEach(function(nd){ nd.m.forEach(function(m){ if(m.cn===sel.cn) origin=nd.id; }); });
    if(toId!==origin) moves.push({cn:sel.cn, code:sel.code, college:sel.college, to:toId, from:origin});
    var tgt = pack.nodes.filter(function(n){return n.id===toId;})[0];
    setHint("Moved <strong>"+esc(sel.code)+"</strong> ("+esc(sel.college)+") to <strong>"+
            esc(tgt?tgt.t:toId)+"</strong>. ✓");
    drawGraph(); drawList(); drawWrites();
  }

  /* The courses each identity is currently carrying, and how many distinct
   * colleges are among them. Sorted on below. */
  function carried(nd){
    var mine=[];
    pack.nodes.forEach(function(src){
      src.m.forEach(function(m){ if(home[m.cn]===nd.id) mine.push(m); });
    });
    var cols={}; mine.forEach(function(m){ cols[m.c]=1; });
    return {mine:mine, colleges:Object.keys(cols).length};
  }
  function drawList(){
    var out=[];
    /* Sam: "sorted descending by the ones with the most colleges".
     *
     * NEITHER available figure can rank this on its own, so the key is the
     * larger of the two — a lower bound on the identity's real size, which is
     * the most that can honestly be claimed:
     *
     *   nd.n     the count the row reports. Uncapped, but it disagrees with
     *            what is actually carried on about a fifth of identities, and
     *            it can UNDERSTATE: FCSH M1020 reports 10 and carries 14.
     *   carried  what this pack embeds. Truthful about those, but capped at
     *            --max-members (14), so it saturates — a 54-member identity and
     *            a 10-member one would both read 14 and sort level, which ranks
     *            nothing precisely at the top of the list where ranking matters.
     *
     * Both are printed whenever they disagree, and a carried list shorter than
     * the reported count says it is a sample: a capped list must never read as
     * a census. Ties fall back to the title so the order is stable. */
    var order=pack.nodes.slice().map(function(nd){
      var c=carried(nd);
      return {nd:nd, mine:c.mine, colleges:c.colleges};
    }).sort(function(a,b){
      var sa=Math.max(a.nd.n, a.mine.length), sb=Math.max(b.nd.n, b.mine.length);
      if(sa!==sb) return sb-sa;
      return String(a.nd.t||a.nd.id).localeCompare(String(b.nd.t||b.nd.id));
    });
    order.forEach(function(row){
      var nd=row.nd, mine=row.mine;
      var pt=paintOf(nd);
      // data-id makes the whole card a drop target — see the wiring below.
      out.push('<li data-id="'+esc(nd.id)+'">');
      var st = stateOf(nd);
      out.push('<span class="ttl">'+esc(nd.t||nd.id)+"</span> "+
               '<span class="chip '+(nd.sys==="C-ID"||nd.sys==="CCN-ID"?"cid":
                 nd.sys==="M-ID"?"gen":"mut")+'">'+pt.glyph+" "+esc(pt.word)+"</span>"+
               (st?' <span class="chip '+(nd.rev?"ok":"flag")+'">'+st.glyph+" "+
                   esc(st.word)+"</span>":""));
      // "N member courses", not "N colleges": nd.n comes from whichever field
      // minted the row and is not a count of colleges — CLAUDE.md is explicit
      // about it, and the card was calling it one.
      out.push('<div class="sub">'+esc(nd.id)+" · "+nd.n+" member course"+
               (nd.n===1?"":"s")+" reported"+
               (mine.length!==nd.n?' <span title="What this view has embedded '+
                 'for the identity. It caps the satellites it carries, so a '+
                 'shorter list is a sample; a longer one means the reported '+
                 'count understates what the join finds.">\u00b7 '+mine.length+
                 " carried here"+(mine.length<nd.n?" (a sample)":"")+"</span>":"")+
               (row.colleges?" · "+row.colleges+" college"+
                 (row.colleges===1?"":"s")+" among them":"")+
               (nd.u!=null?" · "+nd.u+" units":"")+"</div>");
      if(!mine.length){
        out.push('<p class="empty" style="margin:.4em 0 0">No courses left here.</p>');
      } else {
        out.push('<ul class="mlist">');
        mine.forEach(function(m){
          var wasMoved = moves.some(function(x){return x.cn===m.cn;});
          var shared = coursesOn(m.cn).length>1;
          var cls=(wasMoved?"moved ":"")+(shared?"shared":"");
          out.push('<li'+(cls.trim()?' class="'+cls.trim()+'"':"")+
            (shared?"":' draggable="true"')+' data-cn="'+esc(m.cn)+'">'+
            (shared?'<span class="chip warn" title="Control number '+esc(m.cn)+
              ' names '+coursesOn(m.cn).length+' different courses, so the CN: '+
              'write key cannot say which one to move.">shared key</span> ':"")+
            '<span class="cd">'+esc(m.n)+"</span>"+
            '<span class="co" title="'+esc(m.c)+'">'+esc(m.c)+"</span>"+
            (wasMoved?' <span class="chip ok">✓ moved</span>':"")+
            '<button class="mv" type="button" data-cn="'+esc(m.cn)+'">Move…</button></li>');
        });
        out.push("</ul>");
      }
      out.push("</li>");
    });
    document.getElementById("ids").innerHTML=out.join("");
    Array.prototype.forEach.call(view.querySelectorAll(".mlist li"), function(li){
      li.addEventListener("dragstart", function(ev){
        ev.dataTransfer.setData("text/plain", li.dataset.cn);
        selected=findMember(li.dataset.cn);
      });
    });
    /* Sam: "Should be able to drag from one Course card to another (not be
     * limited to the Move… button)." The circles were the only drop target, so
     * a curator reading the cards had to go back up to the graph to act on what
     * they had just read. Every identity card is a drop target now; the circles
     * still are, and the button still is, because a drag is not reachable from
     * a keyboard and dropping that route would take the view backwards. */
    Array.prototype.forEach.call(view.querySelectorAll("#ids > li[data-id]"), function(card){
      card.addEventListener("dragover", function(ev){
        if(!selected) return;
        ev.preventDefault();                       // required, or no drop fires
        card.classList.add("drop-to");
      });
      card.addEventListener("dragleave", function(){ card.classList.remove("drop-to"); });
      card.addEventListener("drop", function(ev){
        ev.preventDefault(); card.classList.remove("drop-to");
        var cn=ev.dataTransfer.getData("text/plain");
        var m=cn?findMember(cn):selected;
        if(m) applyMove(m, card.dataset.id);
      });
    });
    Array.prototype.forEach.call(view.querySelectorAll(".mv"), function(b){
      b.addEventListener("click", function(){
        selected=findMember(b.dataset.cn);
        setHint("<strong>"+esc(selected.code)+"</strong> picked up. Now choose a circle — "+
                "click it, or Tab to it and press Enter.");
        var first=view.querySelector(".nodeg"); if(first) first.focus();
      });
    });
  }

  function drawWrites(){
    var el=document.getElementById("wr");
    if(!moves.length){ el.innerHTML='<p class="empty">No moves yet.</p>'; return; }
    el.innerHTML='<div class="writes">'+moves.map(function(m){
      return "<div>CN:"+esc(m.cn)+"  merge_into  "+esc(m.to)+"</div>";
    }).join("")+"</div>";
  }

  var gi=document.getElementById("g-in"), go2=document.getElementById("g-out"),
      gr=document.getElementById("g-reset");
  if(gi) gi.onclick=function(){ gzoom(1.35, W/2, H/2); };
  if(go2) go2.onclick=function(){ gzoom(1/1.35, W/2, H/2); };
  if(gr) gr.onclick=function(){ gview={k:1,x:0,y:0}; applyGView(); };

  drawGraph(); drawList(); drawWrites();
};

})();
