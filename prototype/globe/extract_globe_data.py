#!/usr/bin/env python3
"""Extract the globe's input from SkyView's committed layout: prototype/ccr_universe.json
→ prototype/globe/globe_data.json. Islands as [name, x, y, r, identities, standAlones];
points as [x, y, system, standAlone, articulations, title, members] — a stand-alone
course keeps no title (the page never names one). See prototype/globe/README.md."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
U = json.load(open(os.path.join(ROOT, "prototype", "ccr_universe.json"), encoding="utf-8"))
islands, points = [], []
for I in U["islands"]:
    islands.append([I["d"], I["x"], I["y"], I["r"], I["n"], I["sa"]])
    for p in I["p"]:
        ident = not p.get("a")          # `a` marks a stand-alone course orbiting an identity (or on the rim)
        points.append([p["x"], p["y"], p.get("s", 0), 0 if ident else 1, p.get("ar") or 0, p.get("t", "") if ident else "", p.get("n", 1)])
cpl = {}
try:
    cpl = json.load(open(os.path.join(ROOT, "prototype", "ccr_cpl.json"), encoding="utf-8")).get("counts", {})
except OSError:
    pass
out = {"bounds": U["bounds"], "counts": U.get("counts", {}), "cpl": cpl, "islands": islands, "points": points}
path = os.path.join(HERE, "globe_data.json")
json.dump(out, open(path, "w", encoding="utf-8"), separators=(",", ":"), ensure_ascii=False)
print("wrote", path, len(islands), "islands,", len(points), "points")
