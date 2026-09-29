#!/usr/bin/env python3
"""Assemble the self-contained SkyView prototype (renamed from "CCR Atlas",
Sam 2026-08-24 — and "SkyView" names the GRAPH VIEW, not the informational panes).

Inlines prototype/ccr_atlas_data.json and prototype/ccr_atlas_graph.js into the
template so the result opens from file://, ships as an Artifact, and cannot
drift between the two. Regenerate the payload first:

    python3 kb/_build_ccr_atlas_extract.py
    python3 prototype/build_ccr_atlas.py
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
tpl  = os.path.join(HERE, "ccr_atlas_v1.html")
out  = os.path.join(HERE, "ccr_atlas_v1.built.html")
out_served = os.path.join(HERE, "skyview.html")

src = open(tpl, encoding="utf-8").read()
data = open(os.path.join(HERE, "ccr_atlas_data.json"), encoding="utf-8").read()
gjs  = open(os.path.join(HERE, "ccr_atlas_graph.js"), encoding="utf-8").read()
ejs  = open(os.path.join(HERE, "ccr_atlas_esl.js"), encoding="utf-8").read()
edata = open(os.path.join(HERE, "ccr_atlas_esl.json"), encoding="utf-8").read()
json.loads(edata)
edata = edata.replace("</", "<\\/")
ujs   = open(os.path.join(HERE, "ccr_universe.js"), encoding="utf-8").read()
udata = open(os.path.join(HERE, "ccr_universe.json"), encoding="utf-8").read()
json.loads(udata)
udata = udata.replace("</", "<\\/")
# The draggable member courses (2.5 MB). Inlined rather than fetched because the
# built page must open from file:// — a fetch() is blocked there, and a page that
# silently loses its members looks like a corpus with no courses in it.
umem = open(os.path.join(HERE, "ccr_universe_members.json"), encoding="utf-8").read()
json.loads(umem)
umem = umem.replace("</", "<\\/")

json.loads(data)                     # fail loudly on a malformed payload
# </script> inside a JSON string would close the host tag
data = data.replace("</", "<\\/")
if any(k not in src for k in ("__DATA__", "__GRAPHJS__", "__ESLJS__", "__ESLDATA__",
                              "__UNIVJS__", "__UNIVDATA__", "__UNIVMEM__")):
    sys.exit("template has lost a placeholder — refusing to write a broken page")

html = (src.replace("__DATA__", data).replace("__GRAPHJS__", gjs)
        .replace("__ESLDATA__", edata).replace("__ESLJS__", ejs)
        .replace("__UNIVDATA__", udata).replace("__UNIVMEM__", umem)
        .replace("__UNIVJS__", ujs))
open(out, "w", encoding="utf-8").write(html)
print(f"wrote {os.path.relpath(out, os.path.dirname(HERE))}  ({len(html)/1024:.0f} KB)")

# ── the SERVED entry point ───────────────────────────────────────────────────
# Same template, same CSS, same JS — payloads FETCHED instead of inlined, so the
# page is small enough to commit and therefore reachable on the deployed site.
# The built page above is 9.9 MB and gitignored; a button in COBI cannot link to
# something that is not deployed, which is the whole reason this second output
# exists. It opens straight on the graph, alone in the window, because that is
# what "SkyView" names (Sam, 2026-09-05); the hash can pick another view.
loader = """
<script>
(function(){
  // Tells the template's boot() to wait: the payloads are on their way and the
  // view is routed below once they land, so nothing paints twice.
  window.CPL_SKYVIEW_LOADING=true;
  var V=document.getElementById("view");
  function say(h){ if(V) V.innerHTML=h; }
  say('<p style="padding:2em 0;color:var(--text-muted)">Loading the reference \u2014 '+
      'about 9 MB of course identities and their member courses\u2026</p>');
  function get(u){ return fetch(u).then(function(r){
    if(!r.ok) throw new Error(u+" \u2192 HTTP "+r.status); return r.json(); }); }
  Promise.all([get("ccr_universe.json"), get("ccr_universe_members.json")])
    .then(function(a){
      window.CPL_CCR_UNIVERSE=a[0];
      window.CPL_CCR_UNIVERSE_MEMBERS=a[1];
      window.CPL_SKYVIEW_LOADING=false;
      // The hash picks the view (#skyview is the default and the map alone);
      // a page built before routing existed opened straight on the graph.
      if(window.__ccrRoute) window.__ccrRoute(); else window.__ccrUniverse();
    })
    .catch(function(e){
      // Never a blank canvas: a graph that fails to load and a corpus with nothing
      // in it look identical, and only one of them is a bug worth reporting.
      say('<h2>SkyView could not load its data</h2><p>'+String(e.message||e)+'</p>'+
          '<p style="color:var(--text-muted)">The payloads live beside this page '+
          '(<code>ccr_universe.json</code>, <code>ccr_universe_members.json</code>). '+
          'If you are opening this from a file rather than a served URL, fetch is '+
          'blocked \u2014 run <code>python3 -m http.server 8000</code> from the repo '+
          'root instead.</p>');
    });
})();
</script>
"""
# ⚠️ __DATA__ stays INLINE. Nulling it broke the template's own boot script, which
# then never defined window.__crumbs, and the universe view calls it on entry — so
# the page died before drawing anything. It is only 0.5 MB; the 8.9 MB that actually
# needed to leave the page are the universe and its members.
served = (src.replace("__DATA__", data).replace("__GRAPHJS__", gjs)
          .replace("__ESLDATA__", edata).replace("__ESLJS__", ejs)
          .replace("__UNIVDATA__", "null").replace("__UNIVMEM__", "null")
          .replace("__UNIVJS__", ujs)
          .replace("</body>", loader + "</body>"))
open(out_served, "w", encoding="utf-8").write(served)
print(f"wrote {os.path.relpath(out_served, os.path.dirname(HERE))}  "
      f"({len(served)/1024:.0f} KB \u2014 payloads fetched, so this one is committable)")
