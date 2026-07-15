#!/usr/bin/env python3
"""Compose the simple CIP Code Reference prototype (self-contained HTML artifact).

Embeds the real 2,325-code CIP-2020 dataset (extracted from cip_crosswalk_data.js)
and a lightweight vanilla-JS UI: search + category pills + family select + a
scannable list that expands to a plain-language definition. No TOP codes, no
crosswalk, no suggest — the 'easy button' reframe from Jenni's feedback.
"""
import json, os

SCRATCH = os.path.dirname(os.path.abspath(__file__))
data = json.load(open(os.path.join(SCRATCH, "cip_proto_data.json"), encoding="utf-8"))
DATA_JSON = json.dumps(data, ensure_ascii=False, separators=(",", ":"))

CSS = r"""
:root{
  --bg:#f7f9fc; --surface:#ffffff; --surface-2:#eef3f9; --surface-sub:#f2f6fb;
  --text:#16283d; --text-soft:#3c526b; --muted:#6a7f96; --border:#dbe4ee; --border-strong:#c3d1e0;
  --accent:#00356B; --accent-soft:#e7eef6; --link:#0b5fa8; --focus:#1f7ae0;
  --cte-fg:#166534; --cte-bg:#dcfce7;
  --both-fg:#3730a3; --both-bg:#e0e7ff;
  --non-fg:#334155; --non-bg:#eaeef4;
  --nc-fg:#0e5e75; --nc-bg:#cff5fb;
  --ret-fg:#6b7280; --ret-bg:#eceff3;
  --new-fg:#1e40af; --new-bg:#dbeafe;
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#0e1a2b; --surface:#16263b; --surface-2:#1d3149; --surface-sub:#132338;
    --text:#e7eef6; --text-soft:#b8c7d8; --muted:#8397ab; --border:#274058; --border-strong:#33506e;
    --accent:#7db3ec; --accent-soft:#1b3652; --link:#8fc0f2; --focus:#7db3ec;
    --cte-fg:#8ef0b6; --cte-bg:#123524;
    --both-fg:#c3cafe; --both-bg:#232a5c;
    --non-fg:#c4d2e2; --non-bg:#25384f;
    --nc-fg:#8fe4f4; --nc-bg:#123c48;
    --ret-fg:#9aa7b6; --ret-bg:#212f41;
    --new-fg:#bcd3ff; --new-bg:#1c3157;
  }
}
:root[data-theme="light"]{
  --bg:#f7f9fc; --surface:#ffffff; --surface-2:#eef3f9; --surface-sub:#f2f6fb;
  --text:#16283d; --text-soft:#3c526b; --muted:#6a7f96; --border:#dbe4ee; --border-strong:#c3d1e0;
  --accent:#00356B; --accent-soft:#e7eef6; --link:#0b5fa8; --focus:#1f7ae0;
  --cte-fg:#166534; --cte-bg:#dcfce7; --both-fg:#3730a3; --both-bg:#e0e7ff;
  --non-fg:#334155; --non-bg:#eaeef4; --nc-fg:#0e5e75; --nc-bg:#cff5fb;
  --ret-fg:#6b7280; --ret-bg:#eceff3; --new-fg:#1e40af; --new-bg:#dbeafe;
}
:root[data-theme="dark"]{
  --bg:#0e1a2b; --surface:#16263b; --surface-2:#1d3149; --surface-sub:#132338;
  --text:#e7eef6; --text-soft:#b8c7d8; --muted:#8397ab; --border:#274058; --border-strong:#33506e;
  --accent:#7db3ec; --accent-soft:#1b3652; --link:#8fc0f2; --focus:#7db3ec;
  --cte-fg:#8ef0b6; --cte-bg:#123524; --both-fg:#c3cafe; --both-bg:#232a5c;
  --non-fg:#c4d2e2; --non-bg:#25384f; --nc-fg:#8fe4f4; --nc-bg:#123c48;
  --ret-fg:#9aa7b6; --ret-bg:#212f41; --new-fg:#bcd3ff; --new-bg:#1c3157;
}
*{box-sizing:border-box;}
body{margin:0;background:var(--bg);color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:16px;line-height:1.5;-webkit-font-smoothing:antialiased;}
.wrap{max-width:1000px;margin:0 auto;padding:0 18px 64px;}

/* ── header ── */
.head{padding:26px 0 6px;position:relative;}
.themetog{position:absolute;top:22px;right:0;font-family:inherit;font-size:.76rem;font-weight:600;
  color:var(--text-soft);background:var(--surface);border:1px solid var(--border-strong);
  border-radius:999px;padding:6px 13px;cursor:pointer;line-height:1;}
.themetog:hover{border-color:var(--accent);color:var(--accent);}
.themetog:focus-visible{outline:2px solid var(--focus);outline-offset:2px;}
.eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--accent);}
h1{margin:.28em 0 .1em;font-size:1.72rem;line-height:1.15;letter-spacing:-.01em;text-wrap:balance;color:var(--text);}
.sub{margin:.2em 0 0;color:var(--text-soft);max-width:64ch;font-size:.98rem;}
.hlinks{display:flex;gap:18px;flex-wrap:wrap;margin:12px 0 2px;font-size:.82rem;}
.hlinks a{color:var(--link);text-decoration:none;font-weight:600;}
.hlinks a:hover{text-decoration:underline;}

/* ── sticky control bar ── */
.bar{position:sticky;top:0;z-index:10;background:var(--bg);padding:12px 0 10px;
  border-bottom:1px solid var(--border);margin-bottom:6px;}
.search{position:relative;}
.search input{width:100%;padding:14px 16px 14px 44px;font-size:1.05rem;color:var(--text);
  background:var(--surface);border:1.5px solid var(--border-strong);border-radius:11px;font-family:inherit;}
.search input:focus{outline:2px solid var(--focus);outline-offset:1px;border-color:var(--focus);}
.search svg{position:absolute;left:15px;top:50%;transform:translateY(-50%);width:18px;height:18px;
  fill:none;stroke:var(--muted);stroke-width:2;}
.controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px;}
.pills{display:flex;gap:6px;flex-wrap:wrap;}
.pill{font-size:.82rem;font-weight:600;padding:6px 13px;border-radius:999px;cursor:pointer;
  border:1px solid var(--border-strong);background:var(--surface);color:var(--text-soft);
  font-family:inherit;transition:background .12s,color .12s,border-color .12s;}
.pill:hover{border-color:var(--accent);}
.pill[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff;}
.chipsep{width:1px;align-self:stretch;min-height:22px;background:var(--border-strong);margin:0 4px;}
.pill-xfer[aria-pressed="true"]{background:var(--both-fg);border-color:var(--both-fg);}
@media (prefers-color-scheme:dark){.pill[aria-pressed="true"]{color:#0e1a2b;}}
:root[data-theme="dark"] .pill[aria-pressed="true"]{color:#0e1a2b;}
:root[data-theme="light"] .pill[aria-pressed="true"]{color:#fff;}
select{font-family:inherit;font-size:.84rem;padding:6px 10px;border-radius:8px;
  border:1px solid var(--border-strong);background:var(--surface);color:var(--text);cursor:pointer;max-width:230px;}
.retiredtog{display:inline-flex;align-items:center;gap:6px;font-size:.78rem;color:var(--muted);cursor:pointer;margin-left:auto;}
.retiredtog input{accent-color:var(--accent);}
.count{font-size:.82rem;color:var(--muted);font-weight:600;margin:8px 2px 2px;font-variant-numeric:tabular-nums;
  display:flex;align-items:baseline;flex-wrap:wrap;gap:2px;}
.cfilters{color:var(--accent);font-weight:650;}
:root[data-theme="dark"] .cfilters{color:var(--accent);}
.clearbtn{margin-left:10px;font-size:.78rem;font-weight:600;color:var(--link);background:none;border:0;cursor:pointer;padding:0;font-family:inherit;}
.clearbtn:hover{text-decoration:underline;}

/* ── list ── */
.list{display:flex;flex-direction:column;}
.item{border-bottom:1px solid var(--border);}
.row{display:grid;grid-template-columns:16px 88px 1fr auto;gap:12px;align-items:center;
  padding:12px 8px;cursor:pointer;}
.row:hover{background:var(--surface-sub);}
.item.open .row{background:var(--surface-sub);}
.code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:600;font-size:.9rem;
  color:var(--accent);letter-spacing:-.01em;}
.ttl{font-weight:550;color:var(--text);min-width:0;}
.tags{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;}
.badge{font-size:.66rem;font-weight:700;letter-spacing:.03em;text-transform:uppercase;
  padding:3px 9px;border-radius:6px;white-space:nowrap;}
.b-CTE{background:var(--cte-bg);color:var(--cte-fg);}
.b-Both{background:var(--both-bg);color:var(--both-fg);}
.b-Non-CTE{background:var(--non-bg);color:var(--non-fg);}
.b-Noncredit{background:var(--nc-bg);color:var(--nc-fg);}
.b-Retired,.b-Reserved{background:var(--ret-bg);color:var(--ret-fg);}
.new{background:var(--new-bg);color:var(--new-fg);font-size:.6rem;font-weight:800;padding:2px 6px;border-radius:5px;letter-spacing:.05em;}
.caret{color:var(--muted);font-size:.8rem;width:14px;text-align:center;}

/* ── detail ── */
.detail{padding:4px 8px 20px 128px;}
.def{margin:2px 0 0;color:var(--text-soft);line-height:1.6;max-width:74ch;}
.dmeta{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;font-size:.82rem;color:var(--muted);align-items:baseline;}
.dmeta b{color:var(--text-soft);font-weight:650;}
.ex{margin-top:8px;font-size:.85rem;color:var(--muted);}
.ex b{color:var(--text-soft);}
.ncesbtn{display:inline-block;margin-top:12px;font-size:.82rem;font-weight:600;color:var(--link);text-decoration:none;
  border:1px solid var(--border-strong);border-radius:8px;padding:6px 12px;}
.ncesbtn:hover{border-color:var(--link);}
.more{text-align:center;margin:20px 0;}
.morebtn{font-size:.86rem;font-weight:650;color:var(--accent);background:var(--surface);
  border:1px solid var(--border-strong);border-radius:9px;padding:9px 20px;cursor:pointer;font-family:inherit;}
.empty{text-align:center;padding:48px 12px;color:var(--muted);}
mark{background:#ffe89c;color:inherit;border-radius:2px;padding:0 1px;}
@media (prefers-color-scheme:dark){mark{background:#5a4a1a;color:#ffe89c;}}
:root[data-theme="dark"] mark{background:#5a4a1a;color:#ffe89c;}
:root[data-theme="light"] mark{background:#ffe89c;color:inherit;}
.foot{margin-top:30px;font-size:.76rem;color:var(--muted);border-top:1px solid var(--border);padding-top:14px;line-height:1.6;}
/* ── plain-English finder ── */
.finder{background:var(--accent-soft);border:1px solid var(--border);border-radius:14px;padding:15px 18px 16px;margin:4px 0 20px;}
.fnd-h{font-weight:700;color:var(--text);font-size:1.04rem;}
.fnd-sub{color:var(--text-soft);font-size:.88rem;margin:3px 0 11px;}
.fnd-in{width:100%;box-sizing:border-box;padding:12px 14px;font-size:1rem;border:1.5px solid var(--border-strong);border-radius:10px;background:var(--surface);color:var(--text);font-family:inherit;}
.fnd-in:focus{outline:2px solid var(--focus);outline-offset:1px;border-color:var(--focus);}
.fnd-out{margin-top:2px;}
.fnd-lead{font-size:.82rem;color:var(--text-soft);font-weight:600;margin:13px 2px 6px;}
.fnd-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;margin:7px 0;}
.fnd-crow{display:grid;grid-template-columns:16px 88px 1fr auto;gap:12px;align-items:center;padding:11px 12px;cursor:pointer;}
.fnd-crow:hover{background:var(--surface-sub);}
.fnd-ct{font-weight:600;color:var(--text);min-width:0;}
.fnd-why{font-size:.74rem;color:var(--muted);padding:0 12px 9px 128px;}
.fnd-card .detail{padding:0 12px 16px 128px;}
.fnd-empty{font-size:.86rem;color:var(--muted);padding:10px 2px;}
.fnd-foot{font-size:.77rem;color:var(--muted);margin:11px 2px 2px;font-style:italic;line-height:1.5;}
@media (max-width:640px){
  .row,.fnd-crow{grid-template-columns:14px 56px 1fr auto;gap:8px;}
  .detail,.fnd-why,.fnd-card .detail{padding-left:14px;}
}
"""

JS = r"""
(function(){
  "use strict";
  var D = JSON.parse(document.getElementById("cipdata").textContent);
  var ROWS = D.rows, FAMS = D.fams;
  // list alphabetically by program title (Jenni: not CIP-code order), code as tiebreak
  ROWS.sort(function(a,b){var x=(a.t||"").toLowerCase(),y=(b.t||"").toLowerCase();
    return x<y?-1:x>y?1:(a.code<b.code?-1:1);});
  var PAGE = 200;
  var st = { q:"", cat:"all", fam:"", xfer:false, showRetired:false, limit:PAGE, open:{} };

  // theme toggle (prototype) — stamps data-theme on :root; our CSS keys off it.
  // Apply any saved choice immediately to avoid a flash.
  var THEMEKEY="cipx_theme";
  (function(){try{var t=localStorage.getItem(THEMEKEY);if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();
  function isDark(){var a=document.documentElement.getAttribute("data-theme");
    return a?a==="dark":!!(window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches);}

  var GOFORWARD = {CTE:1,"Both":1,"Non-CTE":1,"Noncredit":1};
  function el(t,a,k){var n=document.createElement(t);if(a)Object.keys(a).forEach(function(x){
    if(x==="class")n.className=a[x];else if(x==="text")n.textContent=a[x];
    else if(x.slice(0,2)==="on")n[x]=a[x];else if(a[x]!=null)n.setAttribute(x,a[x]);});
    (k||[]).forEach(function(c){if(c==null)return;n.appendChild(typeof c==="string"?document.createTextNode(c):c);});return n;}
  function clear(n){while(n&&n.firstChild)n.removeChild(n.firstChild);}

  function passes(r){
    if(!st.showRetired && !GOFORWARD[r.cat]) return false;
    if(st.cat!=="all" && r.cat!==st.cat) return false;
    if(st.fam && r.fam!==st.fam) return false;
    if(st.xfer && !r.x) return false;
    if(st.q){var toks=st.q.split(/\s+/);
      var hay=(r.code+" "+r.t+" "+r.def).toLowerCase();
      for(var i=0;i<toks.length;i++) if(toks[i]&&hay.indexOf(toks[i])<0) return false;}
    return true;
  }
  function filtered(){return ROWS.filter(passes);}

  var inputRef,pillsRef,famRef,cbRef,xferRef;
  function activeFilterLabels(){
    var out=[];
    if(st.cat!=="all") out.push(st.cat);
    if(st.xfer) out.push("C-ID/CCN");
    if(st.fam) out.push((FAMS[st.fam]||st.fam)+" family");
    if(st.showRetired) out.push("incl. retired/reserved");
    return out;
  }
  function resetAll(){
    st.q="";st.cat="all";st.fam="";st.xfer=false;st.showRetired=false;st.limit=PAGE;st.open={};
    if(inputRef)inputRef.value="";
    if(famRef)famRef.value="";
    if(cbRef)cbRef.checked=false;
    if(xferRef)xferRef.setAttribute("aria-pressed","false");
    if(pillsRef)Array.prototype.forEach.call(pillsRef.querySelectorAll(".pill"),function(x,i){x.setAttribute("aria-pressed",i===0?"true":"false");});
    render();
  }

  // highlight query tokens in a string → array of nodes
  function hl(s){
    if(!st.q) return [s];
    var toks=st.q.split(/\s+/).filter(Boolean).map(function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");});
    if(!toks.length) return [s];
    var re=new RegExp("("+toks.join("|")+")","ig");
    var out=[],last=0,m;
    while((m=re.exec(s))){if(m.index>last)out.push(s.slice(last,m.index));
      out.push(el("mark",{},[m[0]]));last=m.index+m[0].length;if(re.lastIndex===m.index)re.lastIndex++;}
    if(last<s.length)out.push(s.slice(last));return out;
  }

  var listHost, countHost, finderOut;

  // ── plain-English finder (Phase 0: NO backend — grounded client-side retrieval
  //    over the real CIP records, so it can never invent a code) ──
  var STOP={i:1,a:1,an:1,the:1,to:1,for:1,of:1,in:1,on:1,at:1,and:1,or:1,my:1,our:1,we:1,want:1,
    wanting:1,need:1,would:1,like:1,which:1,what:1,should:1,cip:1,code:1,codes:1,assign:1,use:1,
    using:1,program:1,programs:1,course:1,courses:1,degree:1,certificate:1,new:1,build:1,building:1,
    start:1,starting:1,launch:1,launching:1,offer:1,offering:1,is:1,are:1,me:1,help:1,find:1,about:1,
    with:1,that:1,this:1,it:1,do:1,how:1,best:1,fit:1};
  function esc(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
  function stem(w){return w.length<5?w:(w.replace(/(ings?|edly|ed|ations?|tions?|ers?|ors?|ies|es|s)$/,"")||w);}
  function tokenize(q){return (q||"").toLowerCase().split(/[^a-z0-9]+/).filter(function(w){return w&&w.length>1&&!STOP[w];});}
  function rankCIP(q){
    var toks=tokenize(q); if(!toks.length) return [];
    // word-boundary + stem = prefix-on-word-boundary: "weld"→welding/welder,
    // "assist"→assistant/assisting, but "gis" WON'T match "logistics"/"registered".
    var res=toks.map(function(w){return {tok:w,s:stem(w),re:new RegExp("\\b"+esc(stem(w)))};});
    var out=[];
    for(var i=0;i<ROWS.length;i++){
      var r=ROWS[i]; if(!GOFORWARD[r.cat]) continue;           // active codes only
      var t=(r.t||"").toLowerCase(), d=(r.def||"").toLowerCase(), e=(r.ex||"").toLowerCase();
      var score=0,hits=0,matched=[];
      for(var j=0;j<res.length;j++){
        var m=res[j],hit=0;
        if(m.re.test(t)){score+=(t.indexOf(m.s)===0?9:7);hit=1;}   // title word
        if(m.re.test(e)){score+=3;hit=1;}                          // examples
        if(m.re.test(d)){score+=1;hit=1;}                          // definition
        if(hit){hits++;matched.push(m.tok);}
      }
      if(hits){
        score+=hits*hits*2;                                    // reward covering more of the query
        if(t===(q||"").toLowerCase().trim()) score+=60;        // exact title
        out.push({r:r,score:score,matched:matched});
      }
    }
    out.sort(function(a,b){return b.score-a.score||(a.r.t<b.r.t?-1:1);});
    return out.slice(0,6);
  }
  function renderFinder(q){
    clear(finderOut);
    if(!tokenize(q).length) return;
    var hits=rankCIP(q);
    if(!hits.length){finderOut.appendChild(el("div",{class:"fnd-empty"},["No close matches yet — try a program name or a key skill (e.g. \"welding\", \"medical assisting\", \"GIS\")."]));return;}
    finderOut.appendChild(el("div",{class:"fnd-lead"},["Closest CIP codes for “"+q.trim()+"” — open each to confirm against its definition:"]));
    hits.forEach(function(h){
      var r=h.r;
      var crow=el("div",{class:"fnd-crow",role:"button",tabindex:"0"},[
        el("span",{class:"caret"},["▸"]),
        el("span",{class:"code"},[r.code]),
        el("span",{class:"fnd-ct"},[r.t]),
        r.cat?el("span",{class:"badge b-"+r.cat.replace(/\s/g,"-")},[r.cat]):null,
      ]);
      var card=el("div",{class:"fnd-card"},[crow]);
      if(h.matched.length) card.appendChild(el("div",{class:"fnd-why"},["matched: "+h.matched.join(", ")]));
      var open=false,det=null;
      function tog(){open=!open;crow.querySelector(".caret").textContent=open?"▾":"▸";
        if(open){det=detail(r);card.appendChild(det);}else if(det){card.removeChild(det);det=null;}}
      crow.onclick=tog;crow.onkeydown=function(ev){if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();tog();}};
      finderOut.appendChild(card);
    });
    finderOut.appendChild(el("div",{class:"fnd-foot"},["Suggestions to review — the CIP definition is the final word, and your college enters the chosen code in COCI. (An AI-assisted version is on the way.)"]));
  }
  function render(){
    var rows=filtered();
    clear(countHost);
    countHost.appendChild(el("span",{class:"cnum"},[rows.length.toLocaleString()+" CIP code"+(rows.length===1?"":"s")+
      (rows.length>st.limit?"  ·  showing "+st.limit.toLocaleString():"")]));
    var af=activeFilterLabels();
    if(af.length) countHost.appendChild(el("span",{class:"cfilters"},[" · "+af.join(" · ")]));
    if(af.length||st.q){
      var clr=el("button",{class:"clearbtn",type:"button"},["✕ Clear "+(af.length&&st.q?"search + filters":(st.q?"search":"filters"))]);
      clr.onclick=resetAll;
      countHost.appendChild(clr);
    }
    clear(listHost);
    if(!rows.length){listHost.appendChild(el("div",{class:"empty"},["No CIP codes match — try a different word or clear the filters."]));return;}
    var shown=rows.slice(0,st.limit);
    shown.forEach(function(r){
      var isOpen=!!st.open[r.code];
      var badges=el("div",{class:"tags"},[]);
      if(r.act==="New") badges.appendChild(el("span",{class:"new",title:"New in the 2020 CIP edition"},["NEW"]));
      if(r.cat) badges.appendChild(el("span",{class:"badge b-"+r.cat.replace(/\s/g,"-"),
        title:catTip(r.cat)},[r.cat]));
      var row=el("div",{class:"row",role:"button",tabindex:"0"},[
        el("span",{class:"caret"},[isOpen?"▾":"▸"]),
        el("span",{class:"code"},[r.code]),
        el("span",{class:"ttl"},hl(r.t)),
        badges,
      ]);
      var item=el("div",{class:"item"+(isOpen?" open":"")},[row]);
      row.onclick=function(){toggle(r.code);};
      row.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();toggle(r.code);}};
      if(isOpen) item.appendChild(detail(r));
      listHost.appendChild(item);
    });
    if(rows.length>st.limit){
      listHost.appendChild(el("div",{class:"more"},[
        el("button",{class:"morebtn",onclick:function(){st.limit+=PAGE;render();}},
          ["Show "+Math.min(PAGE,rows.length-st.limit).toLocaleString()+" more"])]));
    }
  }
  function catTip(c){return ({CTE:"Career Technical Education",Both:"Both CTE and non-CTE",
    "Non-CTE":"Not Career Technical Education",Noncredit:"Noncredit CIP",
    Retired:"Moved or deleted in the 2020 CIP edition",Reserved:"Reserved placeholder code"})[c]||c;}

  function detail(r){
    var box=el("div",{class:"detail"},[]);
    box.appendChild(el("p",{class:"def"},[r.def||"No published definition for this code."]));
    if(r.ex) box.appendChild(el("p",{class:"ex"},[el("b",{},["Examples: "]),r.ex]));
    var meta=el("div",{class:"dmeta"},[]);
    if(r.fam) meta.appendChild(el("span",{},[el("b",{},["CIP family "+r.fam+" · "]),FAMS[r.fam]||""]));
    box.appendChild(meta);
    box.appendChild(el("a",{class:"ncesbtn",target:"_blank",rel:"noopener",
      href:"https://nces.ed.gov/ipeds/cipcode/browse.aspx?y=56"},["Look up "+r.code+" in the NCES CIP-2020 list ↗"]));
    return box;
  }
  function toggle(code){if(st.open[code])delete st.open[code];else st.open[code]=true;render();}

  // ── build the shell ──
  var wrap=document.getElementById("app");
  var head=el("div",{class:"head"},[
    el("div",{class:"eyebrow"},["California Community Colleges · Chancellor's Office"]),
    el("h1",{},["CIP Code Taxonomy"]),
    el("p",{class:"sub"},["The successor to the CCC TOP Code Manual. Course & program coding is moving from TOP to CIP for fall 2026 — search the full federal CIP-2020 list below to find the right code, and see at a glance whether it's CTE, non-CTE, both, or noncredit."]),
    el("div",{class:"hlinks"},[
      el("a",{href:"https://datastudio.google.com/u/0/reporting/62925aaa-3c91-48ab-941b-2473c0e17cb7/page/iCRlF",target:"_blank",rel:"noopener"},["TOP ↔ CIP crosswalk (COE) ↗"]),
      el("a",{href:"https://nces.ed.gov/ipeds/cipcode/browse.aspx?y=56",target:"_blank",rel:"noopener"},["NCES CIP-2020 taxonomy ↗"]),
    ]),
  ]);
  // light/dark toggle (top-right of the header)
  var themeBtn=el("button",{class:"themetog",type:"button","aria-label":"Toggle light or dark theme"},[]);
  function paintThemeBtn(){themeBtn.textContent=isDark()?"☀ Light":"🌙 Dark";}
  themeBtn.onclick=function(){var next=isDark()?"light":"dark";
    document.documentElement.setAttribute("data-theme",next);
    try{localStorage.setItem(THEMEKEY,next);}catch(e){}
    paintThemeBtn();};
  paintThemeBtn();
  head.appendChild(themeBtn);
  wrap.appendChild(head);

  // plain-English finder — the "easy button": describe a program, get candidate codes
  var finder=el("div",{class:"finder"},[]);
  finder.appendChild(el("div",{class:"fnd-h"},["Not sure which code? Describe your program"]));
  finder.appendChild(el("div",{class:"fnd-sub"},["Type what you're building in plain English and I'll surface the closest CIP codes to review."]));
  var fin=el("input",{class:"fnd-in",type:"text","aria-label":"Describe your program",
    placeholder:"e.g. medical assisting · GIS mapping · wildland firefighting · HVAC technician"});
  var _ft;fin.oninput=function(){var v=fin.value;clearTimeout(_ft);_ft=setTimeout(function(){renderFinder(v);},180);};
  fin.onkeydown=function(ev){if(ev.key==="Enter"){ev.preventDefault();renderFinder(fin.value);}};
  finder.appendChild(fin);
  finderOut=el("div",{class:"fnd-out"},[]);
  finder.appendChild(finderOut);
  wrap.appendChild(finder);

  var bar=el("div",{class:"bar"},[]);
  var searchWrap=el("div",{class:"search"},[]);
  var svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("viewBox","0 0 24 24");
  var c1=document.createElementNS("http://www.w3.org/2000/svg","circle");
  c1.setAttribute("cx","11");c1.setAttribute("cy","11");c1.setAttribute("r","7");
  var l1=document.createElementNS("http://www.w3.org/2000/svg","line");
  l1.setAttribute("x1","21");l1.setAttribute("y1","21");l1.setAttribute("x2","16.5");l1.setAttribute("y2","16.5");
  svg.appendChild(c1);svg.appendChild(l1);
  var input=el("input",{type:"search",placeholder:"Search by code, program title, or keyword — e.g. nursing, welding, 51.3801",autocomplete:"off","aria-label":"Search CIP codes"});
  inputRef=input;
  var _t;input.oninput=function(){var v=input.value;clearTimeout(_t);_t=setTimeout(function(){st.q=v.toLowerCase().trim();st.limit=PAGE;render();},140);};
  searchWrap.appendChild(svg);searchWrap.appendChild(input);
  bar.appendChild(searchWrap);

  var controls=el("div",{class:"controls"},[]);
  var pills=el("div",{class:"pills"},[]);pillsRef=pills;
  [["all","All"],["CTE","CTE"],["Non-CTE","Non-CTE"],["Both","Both"],["Noncredit","Noncredit"]].forEach(function(p){
    var b=el("button",{class:"pill",type:"button","aria-pressed":st.cat===p[0]?"true":"false"},[p[1]]);
    b.onclick=function(){st.cat=p[0];st.limit=PAGE;
      pills.querySelectorAll(".pill").forEach(function(x){x.setAttribute("aria-pressed","false");});
      b.setAttribute("aria-pressed","true");render();};
    pills.appendChild(b);
  });
  controls.appendChild(pills);

  // C-ID/CCN — an INDEPENDENT toggle chip (ANDs with the category), sits with the pills
  controls.appendChild(el("span",{class:"chipsep"},[]));
  var xferChip=el("button",{class:"pill pill-xfer",type:"button","aria-pressed":st.xfer?"true":"false",
    title:"CIP codes whose courses carry a C-ID (transfer-model articulation) or CCN (common course number). A course-level floor — not a guarantee of full transferability."},["🎓 C-ID/CCN"]);
  xferRef=xferChip;
  xferChip.onclick=function(){st.xfer=!st.xfer;xferChip.setAttribute("aria-pressed",st.xfer?"true":"false");st.limit=PAGE;render();};
  controls.appendChild(xferChip);

  var fam=el("select",{"aria-label":"CIP family"},[el("option",{value:""},["All CIP families"])]);famRef=fam;
  Object.keys(FAMS).sort().forEach(function(f){fam.appendChild(el("option",{value:f},[f+" · "+FAMS[f]]));});
  fam.onchange=function(){st.fam=fam.value;st.limit=PAGE;render();};
  controls.appendChild(fam);

  var tog=el("label",{class:"retiredtog",title:"Retired = moved/deleted in 2020. Reserved = placeholder codes."},[]);
  var cb=el("input",{type:"checkbox"});cbRef=cb;
  cb.onchange=function(){st.showRetired=cb.checked;st.limit=PAGE;render();};
  tog.appendChild(cb);tog.appendChild(document.createTextNode("Include retired / reserved"));
  controls.appendChild(tog);

  bar.appendChild(controls);
  countHost=el("div",{class:"count"},[]);
  bar.appendChild(countHost);
  wrap.appendChild(bar);

  listHost=el("div",{class:"list"},[]);
  wrap.appendChild(listHost);

  wrap.appendChild(el("div",{class:"foot"},[
    "Prototype for review — CIP-2020 data from the Chancellor's Office CIP Searchable Workbook (2026-07-15 cut). "+
    ROWS.filter(function(r){return GOFORWARD[r.cat];}).length.toLocaleString()+" active CIP codes shown by default; "+
    "retired and reserved codes are hidden unless you tick the box above. "+
    "The CTE / non-CTE / both / noncredit label reflects the Chancellor's Office certified CIP CTE designations."
  ]));

  render();
})();
"""

HTML = (
    '<title>California Community Colleges CIP Code Taxonomy</title>\n'
    '<style>' + CSS + '</style>\n'
    '<div class="wrap"><div id="app"></div></div>\n'
    '<script type="application/json" id="cipdata">' + DATA_JSON + '</script>\n'
    '<script>' + JS + '</script>\n'
)

OUT = os.path.join(SCRATCH, "cip_reference_prototype.html")
open(OUT, "w", encoding="utf-8").write(HTML)
print("wrote", OUT, "(", round(len(HTML)/1024), "KB )")
