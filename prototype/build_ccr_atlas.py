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

json.loads(data)                     # fail loudly on a malformed payload
# </script> inside a JSON string would close the host tag
data = data.replace("</", "<\\/")
if any(k not in src for k in ("__DATA__", "__GRAPHJS__", "__ESLJS__", "__ESLDATA__", "__UNIVJS__", "__UNIVDATA__")):
    sys.exit("template has lost a placeholder — refusing to write a broken page")

html = (src.replace("__DATA__", data).replace("__GRAPHJS__", gjs)
        .replace("__ESLDATA__", edata).replace("__ESLJS__", ejs)
        .replace("__UNIVDATA__", udata).replace("__UNIVJS__", ujs))
open(out, "w", encoding="utf-8").write(html)
print(f"wrote {os.path.relpath(out, os.path.dirname(HERE))}  ({len(html)/1024:.0f} KB)")
