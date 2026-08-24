/* CCR Atlas — decision view: the scoped force graph + the move affordance.
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
/* colour is never the only signal — every state also carries a glyph + a word */
function paintOf(nd){
  if(nd.rev)            return {fill:"#EAF1E6", stroke:"#2C601A", glyph:"✓", word:"reviewed"};
  if(nd.flags.length)   return {fill:"#FCEDED", stroke:"#920000", glyph:"⚠", word:"flagged"};
  if(nd.sys==="C-ID"||nd.sys==="CCN-ID")
                        return {fill:"#E7EEF9", stroke:"#0047AB", glyph:"★", word:"official identity"};
  return {fill:"#F1EAFC", stroke:"#6D28D9", glyph:"✨", word:"generated"};
}

window.__ccrDecision = function(discName, i){
  var DATA = JSON.parse(document.getElementById("atlas-data").textContent);
  var pack = DATA.detail[discName][i];
  var view = document.getElementById("view");
  var reduced = window.matchMedia &&
                window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* local, reversible move log — nothing leaves the page */
  var moves = [];
  var home  = {};                       // cn -> target identity id
  pack.nodes.forEach(function(nd){ nd.m.forEach(function(m){ home[m.cn]=nd.id; }); });

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
  h.push('<div><div class="canvas"><div id="gfx"></div>'+
         '<p class="hint" id="hint">Drag a course from the list onto a circle. '+
         'Circle size = how many colleges teach it.</p></div></div>');
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
             ' courses, '+pt.word+'. Press Enter to send the selected course here.">');
      s.push('<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+r.toFixed(1)+
             '" fill="'+pt.fill+'" stroke="'+pt.stroke+'" stroke-width="2"></circle>');
      s.push('<text x="'+p.x.toFixed(1)+'" y="'+(p.y+4).toFixed(1)+
             '" text-anchor="middle" font-size="'+(r>20?13:11)+
             '" fill="'+pt.stroke+'" class="node-g">'+pt.glyph+"</text>");
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
    wireNodes();
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

  function drawList(){
    var out=[];
    pack.nodes.forEach(function(nd){
      var mine=[];
      pack.nodes.forEach(function(src){
        src.m.forEach(function(m){ if(home[m.cn]===nd.id) mine.push(m); });
      });
      var pt=paintOf(nd);
      out.push("<li>");
      out.push('<span class="ttl">'+esc(nd.t||nd.id)+"</span> "+
               '<span class="chip '+(nd.rev?"ok":nd.flags.length?"flag":"gen")+'">'+
               pt.glyph+" "+esc(pt.word)+"</span>");
      out.push('<div class="sub">'+esc(nd.id)+" · "+nd.n+" college"+(nd.n===1?"":"s")+
               (nd.u!=null?" · "+nd.u+" units":"")+"</div>");
      if(!mine.length){
        out.push('<p class="empty" style="margin:.4em 0 0">No courses left here.</p>');
      } else {
        out.push('<ul class="mlist">');
        mine.forEach(function(m){
          var wasMoved = moves.some(function(x){return x.cn===m.cn;});
          out.push('<li'+(wasMoved?' class="moved"':"")+' draggable="true" data-cn="'+esc(m.cn)+'">'+
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

  drawGraph(); drawList(); drawWrites();
};

})();
