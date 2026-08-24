/* CCR Atlas — the ESL packaging PROPOSAL view.
 *
 * Nothing here writes. It draws what an apply of the 2026-07-15 ESL packaging
 * plan would do to the shape of the discipline, joined to today's curation so
 * the figures are real rather than the plan's stale claims.
 *
 * The design point: confidence is not a footnote. 794 of the 1,110 rows landing
 * in Beginning got there by DEFAULT — no level word in the title — and Beginning
 * is simultaneously the biggest bucket and the least certain one. A preview that
 * showed only the collapse would be an argument for applying it; this one shows
 * the collapse AND where the doubt is concentrated.
 */
(function(){
"use strict";
var W=760, H=430;
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){
  return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function num(n){return (n==null?0:n).toLocaleString("en-US");}

var FOLD=["Beginning ESL","Intermediate ESL","Advanced ESL"];

window.__ccrEsl = function(){
  var D = window.CPL_ATLAS_ESL;
  var view = document.getElementById("view");
  window.__crumbs([{label:"All disciplines", go:window.__ccrForest},
                   {label:"ESL packaging proposal"}]);

  var t=D.totals, B=D.buckets;
  var foldTotal = FOLD.reduce(function(a,b){return a+B[b].would_fold;},0);
  var localTotal= FOLD.reduce(function(a,b){return a+B[b].local_courses;},0);
  var medTotal  = FOLD.reduce(function(a,b){return a+(B[b].confidence.medium||0);},0);

  var h=[];
  h.push("<h1>What packaging ESL would actually do</h1>");
  h.push('<div class="lede"><p><strong>'+num(foldTotal)+' course identities</strong> — carrying <strong>'+
    num(localTotal)+' local college courses</strong> — would fold into <strong>three</strong>. '+
    'That is the packaging move, and it is the only mechanism that reaches a 2,500-course catalog: '+
    'working the merge queue perfectly still lands at ~36,000.</p>'+
    '<p><strong>Nothing is written.</strong> This is the proposal drawn against today’s data.</p></div>');

  h.push('<div class="note"><p><strong>Two things block an apply, and both are yours.</strong></p><ul style="margin:.4em 0 0;padding-left:1.1em">'+
    D._blocked_on.map(function(b){return "<li>"+esc(b)+"</li>";}).join("")+"</ul></div>");

  h.push('<div class="stats">');
  h.push(stat(num(foldTotal),"identities fold","into three courses"));
  h.push(stat(num(localTotal),"local courses","ride on them"));
  h.push(stat(num(medTotal),"⚠ medium confidence",Math.round(100*medTotal/foldTotal)+"% of the fold"));
  h.push(stat(num(t.skipped_curated_by_a_human),"✓ your own decisions","skipped, never overwritten"));
  h.push("</div>");

  h.push('<div class="canvas"><div id="esl-gfx"></div>'+
         '<div class="hint">Circle area = local college courses landing there. '+
         'The wedge is the share that arrived on a <strong>medium-confidence</strong> signal.</div></div>');

  h.push('<h2 style="margin-top:24px">The three comprehensives</h2>');
  h.push('<div class="decks" id="esl-decks"></div>');

  h.push('<h2 style="margin-top:24px">The carve-outs — what escapes the fold</h2>');
  h.push('<p>These keep their own identity. The transfer-level bucket is the one to look at: '+
         'the plan flagged it for individual confirmation because it awards <em>real transferable '+
         'credit</em>, and most of it was folded by automation before anyone reviewed it.</p>');
  h.push('<div class="decks" id="esl-carve"></div>');
  view.innerHTML=h.join("");

  drawFold(B, foldTotal);

  document.getElementById("esl-decks").innerHTML = FOLD.map(function(b,i){
    var v=B[b], med=v.confidence.medium||0;
    return '<button class="deck" type="button" data-b="'+esc(b)+'">'+
      '<span class="hd"><span class="sz">'+esc(b)+"</span>"+
      (med? '<span class="chip flag">⚠ '+num(med)+" to check</span>"
          : '<span class="chip ok">✓ all high</span>')+"</span>"+
      '<span class="more">'+num(v.would_fold)+" identities · "+num(v.local_courses)+" local courses</span>"+
      '<span class="more">high '+num(v.confidence.high||0)+" · medium "+num(med)+"</span>"+
      "</button>";
  }).join("");

  document.getElementById("esl-carve").innerHTML = Object.keys(B).filter(function(b){
    return B[b].is_carveout;
  }).map(function(b){
    var v=B[b], risk = v.still_standing < v.planned;
    return '<button class="deck" type="button" data-b="'+esc(b)+'">'+
      '<span class="hd"><span class="sz">'+esc(b)+"</span>"+
      (risk? '<span class="chip flag">⚠ '+num(v.planned-v.still_standing)+" already gone</span>"
           : '<span class="chip ok">✓ intact</span>')+"</span>"+
      '<span class="more">'+num(v.still_standing)+" of "+num(v.planned)+" still their own row</span>"+
      '<span class="more">curated away '+num(v.already_curated)+" · vanished "+num(v.no_longer_a_row)+"</span>"+
      "</button>";
  }).join("");

  Array.prototype.forEach.call(view.querySelectorAll(".deck"), function(btn){
    btn.addEventListener("click", function(){ bucket(btn.dataset.b); });
  });
};

function stat(n,l,s){
  return '<div class="stat"><span class="n">'+esc(n)+'</span><span class="l">'+esc(l)+
         '</span><div class="s">'+esc(s)+"</div></div>";
}

/* before → after, drawn to scale */
function drawFold(B, foldTotal){
  var s=[], cx=[200,430,620], i;
  s.push('<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Three circles, one per '+
         'comprehensive course, sized by the number of local college courses folding into each. '+
         'A darker wedge shows the share assigned on a medium-confidence signal.">');
  var maxLocal = Math.max.apply(null, ["Beginning ESL","Intermediate ESL","Advanced ESL"]
                                       .map(function(b){return B[b].local_courses;}));
  ["Beginning ESL","Intermediate ESL","Advanced ESL"].forEach(function(b,k){
    var v=B[b];
    var r = 34 + 74*Math.sqrt(v.local_courses/maxLocal);
    var y = H/2 - 22;
    var med = v.confidence.medium||0, frac = v.would_fold ? med/v.would_fold : 0;
    // the medium-confidence share as a wedge from 12 o'clock
    s.push('<circle cx="'+cx[k]+'" cy="'+y+'" r="'+r.toFixed(1)+
           '" fill="#F1EAFC" stroke="#6D28D9" stroke-width="2"></circle>');
    if(frac>0.001){
      var a = 2*Math.PI*frac, large = frac>0.5?1:0;
      var x1=cx[k], y1=y-r;
      var x2=cx[k]+r*Math.sin(a), y2=y-r*Math.cos(a);
      s.push('<path d="M'+cx[k]+' '+y+' L'+x1+' '+y1.toFixed(1)+' A'+r.toFixed(1)+' '+r.toFixed(1)+
             ' 0 '+large+' 1 '+x2.toFixed(1)+' '+y2.toFixed(1)+' Z" fill="#920000" fill-opacity=".22" '+
             'stroke="#920000" stroke-width="1.5"></path>');
    }
    s.push('<text x="'+cx[k]+'" y="'+(y+5)+'" text-anchor="middle" class="node-l" '+
           'style="font-size:15px;font-weight:700" fill="#1C1C1A">'+num(v.local_courses)+"</text>");
    s.push('<text x="'+cx[k]+'" y="'+(y+r+18)+'" text-anchor="middle" class="node-l" '+
           'style="font-size:12.5px;font-weight:600" fill="var(--text-strong)">'+esc(b)+"</text>");
    s.push('<text x="'+cx[k]+'" y="'+(y+r+32)+'" text-anchor="middle" class="node-l" '+
           'fill="var(--text-muted)">'+num(v.would_fold)+" identities</text>");
    if(med) s.push('<text x="'+cx[k]+'" y="'+(y+r+45)+'" text-anchor="middle" class="node-l" '+
           'fill="#920000">⚠ '+num(med)+" medium</text>");
  });
  s.push("</svg>");
  document.getElementById("esl-gfx").innerHTML=s.join("");
}

/* one bucket — the spot-check list, medium confidence first */
function bucket(name){
  var D=window.CPL_ATLAS_ESL, v=D.buckets[name], view=document.getElementById("view");
  window.__crumbs([{label:"All disciplines", go:window.__ccrForest},
                   {label:"ESL packaging proposal", go:window.__ccrEsl},
                   {label:name}]);
  var med=v.confidence.medium||0;
  var h=["<h1>"+esc(name)+"</h1>"];
  if(v.is_carveout){
    h.push("<p><strong>"+num(v.still_standing)+" of "+num(v.planned)+
      "</strong> still stand as their own identity. "+num(v.already_curated)+
      " were merged away by curation and "+num(v.no_longer_a_row)+
      " vanished with no curation row explaining it.</p>");
  } else {
    h.push("<p><strong>"+num(v.would_fold)+" identities</strong> carrying <strong>"+
      num(v.local_courses)+" local college courses</strong> would fold here. "+
      (med? "<strong>"+num(med)+"</strong> of them arrived on a medium-confidence signal and are listed first — those are the spot-check."
          : "Every one arrived on a high-confidence signal.")+"</p>");
  }
  h.push('<div class="tblwrap" tabindex="0" role="region" aria-label="Identities in '+esc(name)+'">');
  h.push('<table class="uc-like"><thead><tr>'+
         '<th scope="col">Course title</th><th scope="col">Identity</th>'+
         '<th scope="col">Colleges</th><th scope="col">How it was decided</th>'+
         '<th scope="col">Confidence</th></tr></thead><tbody>');
  v.sample.forEach(function(r){
    h.push("<tr>"+
      "<td>"+esc(r.t)+"</td>"+
      '<td class="mono">'+esc(r.id)+"</td>"+
      "<td>"+num(r.n)+"</td>"+
      "<td>"+esc(sigWord(r.sig))+"</td>"+
      '<td><span class="chip '+(r.conf==="high"?"ok":"flag")+'">'+
        (r.conf==="high"?"✓ high":"⚠ "+esc(r.conf))+"</span></td></tr>");
  });
  h.push("</tbody></table></div>");
  var shown=v.sample.length, tot=v.is_carveout?v.still_standing:v.would_fold;
  h.push('<p class="empty">Showing '+num(shown)+" of "+num(tot)+
         " — medium confidence first. The full list is in the committed receipt.</p>");
  view.innerHTML=h.join("");
}
function sigWord(s){
  return ({"word":"a level word in the title",
           "default-beginning":"no level word — defaulted to Beginning",
           "numeric":"a numeric ladder mark",
           "combo":"a combination level",
           "carveout-transfer":"reads as transfer level",
           "carveout-vesl":"reads as vocational",
           "carveout-citizenship":"reads as citizenship"}[s]) || s;
}
})();
