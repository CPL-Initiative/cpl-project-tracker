import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MplPolygon
from matplotlib.lines import Line2D
import data

NAVY = "#1F355E"; CObLUE = "#0066BA"; GOLD = "#D4A843"
CRIMSON = "#B22234"; LANDFILL = "#EAF0F6"; GRID = "#C9D4E2"

ca = json.load(open("california.geojson"))
geom = ca["geometry"]
rings = geom["coordinates"] if geom["type"] == "Polygon" else [r for poly in geom["coordinates"] for r in poly]

import os
MIL_TOTAL = None; MIL_ASOF = None
if os.path.exists("military_by_college.json"):
    _m = json.load(open("military_by_college.json"))
    MIL_TOTAL = _m.get("_statewide_military_total"); MIL_ASOF = (_m.get("_as_of") or "")[:10]

fig = plt.figure(figsize=(20, 18), dpi=200)
fig.patch.set_facecolor("white")
ax = fig.add_axes([0.01, 0.03, 0.49, 0.90])          # map (left half)
cax = fig.add_axes([0.505, 0.03, 0.30, 0.90]); cax.axis("off")   # college legend
bax = fig.add_axes([0.805, 0.03, 0.19, 0.90]); bax.axis("off")   # base legend

for ring in rings:
    ax.add_patch(MplPolygon(ring, closed=True, facecolor=LANDFILL, edgecolor=NAVY, lw=1.6, zorder=1))

# colleges: numbered navy circles
for i, (name, la, lo) in enumerate(data.COLLEGES, 1):
    ax.scatter([lo], [la], s=115, marker="o", facecolor=NAVY, edgecolor="white",
               linewidth=0.6, zorder=4)
    ax.annotate(str(i), (lo, la), fontsize=4.6, fontweight="bold", color="white",
                ha="center", va="center", zorder=5)

# bases: numbered crimson stars
for i, (name, la, lo) in enumerate(data.BASES, 1):
    ax.scatter([lo], [la], s=300, marker="*", facecolor=CRIMSON, edgecolor="black",
               linewidth=0.6, zorder=6)
    ax.annotate(str(i), (lo, la), fontsize=5.6, fontweight="bold", color="white",
                ha="center", va="center", zorder=7)

# key pairs: connectors + direct labels
cpos = {n: (lo, la) for n, la, lo in data.COLLEGES}
bpos = {n: (lo, la) for n, la, lo in data.BASES}
for b, c in data.KEY_PAIRS:
    (bx, by), (cxp, cyp) = bpos[b], cpos[c]
    ax.plot([bx, cxp], [by, cyp], color=GOLD, lw=2.0, zorder=3, alpha=0.9)

ax.set_xlim(-124.6, -113.8); ax.set_ylim(32.3, 42.2)
ax.set_aspect(1.18); ax.set_xticks([]); ax.set_yticks([])
for s in ax.spines.values(): s.set_visible(False)
ax.grid(True, color=GRID, lw=0.4, alpha=0.5)

leg = ax.legend(handles=[
    Line2D([0],[0], marker="o", color="none", markerfacecolor=NAVY, markeredgecolor="white",
           markersize=11, label="Community College (1–115)"),
    Line2D([0],[0], marker="*", color="none", markerfacecolor=CRIMSON, markeredgecolor="black",
           markersize=17, label="Military Base (1–44)"),
    Line2D([0],[0], color=GOLD, lw=2.5, label="Demonstration-project pairing"),
], loc="lower left", fontsize=10, frameon=True, framealpha=0.95, edgecolor=NAVY)
leg.set_zorder(20)

fig.text(0.01, 0.975, "California Community Colleges & Military Installations",
         fontsize=23, fontweight="bold", color=NAVY)
_sub = "115 Community Colleges  •  44 Military Bases  —  CPL Initiative / Veteran Sprint"
if MIL_TOTAL:
    _sub = (f"115 Community Colleges  •  44 Military Bases  •  {MIL_TOTAL:,} veterans & "
            f"service members served via CPL" + (f" (live, {MIL_ASOF})" if MIL_ASOF else "")
            + "  —  CPL Initiative / Veteran Sprint")
fig.text(0.01, 0.957, _sub, fontsize=12.5, color=CObLUE)

def wrap(s, w=30): return s if len(s) <= w else s[:w-1] + "…"

# college legend (3 columns)
cax.text(0.0, 1.0, "Community Colleges", fontsize=12.5, fontweight="bold", color=NAVY, va="top")
n = len(data.COLLEGES); per = (n + 2) // 3
cols = [list(enumerate(data.COLLEGES, 1))[i*per:(i+1)*per] for i in range(3)]
xpos = [0.0, 0.345, 0.69]; dy = 0.0242
for ci, colentries in enumerate(cols):
    y = 0.965
    for i, (name, _, _) in colentries:
        cax.text(xpos[ci], y, f"{i}.", fontsize=6.0, fontweight="bold", color=NAVY, va="top")
        cax.text(xpos[ci] + 0.035, y, wrap(name, 26), fontsize=6.0, color="#222", va="top")
        y -= dy

# base legend (2 columns)
bax.text(0.0, 1.0, "Military Bases", fontsize=12.5, fontweight="bold", color=CRIMSON, va="top")
half = (len(data.BASES) + 1) // 2
bcols = [list(enumerate(data.BASES, 1))[:half], list(enumerate(data.BASES, 1))[half:]]
bx = [0.0, 0.52]
for ci, colentries in enumerate(bcols):
    y = 0.965
    for i, (name, _, _) in colentries:
        bax.text(bx[ci], y, f"{i}.", fontsize=6.0, fontweight="bold", color=CRIMSON, va="top")
        bax.text(bx[ci] + 0.06, y, wrap(name, 22), fontsize=6.0, color="#222", va="top")
        y -= dy

fig.text(0.01, 0.008,
         "Numbers on the map correspond to the legends. Coordinates are campus/installation-level (illustrative). "
         "Dense clusters (San Diego, LA, Bay Area) are easier to read in the interactive HTML map. "
         "Source: CPL Initiative / MAP, CCCCO.",
         fontsize=7.5, color="#666")

fig.savefig("ca_cpl_military_map_reference.png", dpi=200, facecolor="white", bbox_inches="tight")
print("saved ca_cpl_military_map_reference.png")
