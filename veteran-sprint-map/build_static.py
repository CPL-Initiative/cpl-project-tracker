import json
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon as MplPolygon
from matplotlib.lines import Line2D
from matplotlib import font_manager
import data

NAVY = "#1F355E"; CObLUE = "#0066BA"; GOLD = "#D4A843"
CRIMSON = "#B22234"; LANDFILL = "#EAF0F6"; GRID = "#C9D4E2"

ca = json.load(open("california.geojson"))
geom = ca["geometry"]
rings = geom["coordinates"] if geom["type"] == "Polygon" else [r for poly in geom["coordinates"] for r in poly]

# per-college service-member/veteran counts (snapshot from live_metrics.json)
import os, math
MIL = {}; MIL_TOTAL = None; MIL_ASOF = None
if os.path.exists("military_by_college.json"):
    _m = json.load(open("military_by_college.json"))
    MIL = _m.get("colleges", {}); MIL_TOTAL = _m.get("_statewide_military_total")
    MIL_ASOF = (_m.get("_as_of") or "")[:10]

fig = plt.figure(figsize=(15, 17), dpi=200)
fig.patch.set_facecolor("white")
# map axis (left) + legend axis (right)
ax = fig.add_axes([0.02, 0.04, 0.66, 0.88])
lax = fig.add_axes([0.69, 0.04, 0.30, 0.88]); lax.axis("off")

# --- California land ---
for ring in rings:
    ax.add_patch(MplPolygon(ring, closed=True, facecolor=LANDFILL, edgecolor=NAVY, lw=1.6, zorder=1))

# --- colleges (navy circles, sized by veterans served via CPL) ---
cx = [lo for _, _, lo in data.COLLEGES]; cy = [la for _, la, _ in data.COLLEGES]
def _csize(name):
    v = MIL.get(name)
    if not isinstance(v, (int, float)):
        return 70
    return 55 + 11.0 * math.sqrt(v)   # area grows ~linearly with vet count
csz = [_csize(n) for n, _, _ in data.COLLEGES]
ax.scatter(cx, cy, s=csz, marker="o", facecolor=NAVY, edgecolor="white",
           linewidth=0.7, zorder=4, alpha=0.92, label="Community College")

# --- bases (crimson stars) + numbers ---
base_idx = {}
for i, (name, la, lo) in enumerate(data.BASES, 1):
    base_idx[name] = i
    ax.scatter([lo], [la], s=430, marker="*", facecolor=CRIMSON, edgecolor="black",
               linewidth=0.7, zorder=6)
    ax.annotate(str(i), (lo, la), fontsize=8.5, fontweight="bold", color="white",
                ha="center", va="center", zorder=7)

# --- key demonstration pairs: connectors + direct labels ---
cpos = {n: (lo, la) for n, la, lo in data.COLLEGES}
bpos = {n: (lo, la) for n, la, lo in data.BASES}
for b, c in data.KEY_PAIRS:
    (bx, by), (cxp, cyp) = bpos[b], cpos[c]
    ax.plot([bx, cxp], [by, cyp], color=GOLD, lw=2.0, zorder=3, alpha=0.9)
    ax.annotate(c, (cxp, cyp), fontsize=8, fontweight="bold", color=NAVY,
                xytext=(6, -10), textcoords="offset points", zorder=8,
                bbox=dict(boxstyle="round,pad=0.15", fc="white", ec=NAVY, lw=0.6, alpha=0.9))

ax.set_xlim(-124.6, -113.8); ax.set_ylim(32.3, 42.2)
ax.set_aspect(1.18)  # approx aspect for CA latitudes
ax.set_xticks([]); ax.set_yticks([])
for s in ax.spines.values(): s.set_visible(False)
ax.grid(True, color=GRID, lw=0.4, alpha=0.5)

# --- title ---
fig.text(0.02, 0.965, "California Community Colleges & Military Installations",
         fontsize=21, fontweight="bold", color=NAVY)
_sub = "115 Community Colleges  •  44 Military Bases  —  CPL Initiative / Veteran Sprint"
if MIL_TOTAL:
    _sub = (f"115 Community Colleges  •  44 Military Bases  •  {MIL_TOTAL:,} veterans & "
            f"service members served via CPL  —  CPL Initiative / Veteran Sprint")
fig.text(0.02, 0.945, _sub, fontsize=12, color=CObLUE)
if MIL_TOTAL:
    fig.text(0.02, 0.928, f"College circles are sized by veterans served through CPL"
             + (f" (live, {MIL_ASOF})" if MIL_ASOF else ""), fontsize=9, color="#666", style="italic")

# --- symbol legend ---
leg = ax.legend(handles=[
    Line2D([0],[0], marker="o", color="none", markerfacecolor=NAVY, markeredgecolor="white",
           markersize=10, label="Community College (115) — size = veterans served"),
    Line2D([0],[0], marker="*", color="none", markerfacecolor=CRIMSON, markeredgecolor="black",
           markersize=16, label="Military Base (44)"),
    Line2D([0],[0], color=GOLD, lw=2.5, label="Demonstration-project pairing"),
], loc="lower left", fontsize=10, frameon=True, framealpha=0.95, edgecolor=NAVY)
leg.set_zorder(20)

# --- base legend (right column) ---
lax.text(0.0, 1.0, "Military Bases", fontsize=12, fontweight="bold", color=CRIMSON, va="top")
n = len(data.BASES); half = (n + 1) // 2
col1 = list(enumerate(data.BASES, 1))[:half]
col2 = list(enumerate(data.BASES, 1))[half:]
def wrap(s, w=30): return s if len(s) <= w else s[:w-1] + "…"
y = 0.965; dy = 0.0205
for i, (name, _, _) in col1:
    lax.text(0.0, y, f"{i}.", fontsize=6.6, fontweight="bold", color=CRIMSON, va="top")
    lax.text(0.045, y, wrap(name), fontsize=6.6, color="#222", va="top")
    y -= dy
y = 0.965
for i, (name, _, _) in col2:
    lax.text(0.52, y, f"{i}.", fontsize=6.6, fontweight="bold", color=CRIMSON, va="top")
    lax.text(0.565, y, wrap(name), fontsize=6.6, color="#222", va="top")
    y -= dy

fig.text(0.02, 0.012,
         "Coordinates are campus/installation-level (illustrative). "
         "Source: CPL Initiative / MAP, California Community Colleges Chancellor's Office. "
         "See the interactive HTML map for every college name.",
         fontsize=7.5, color="#666")

fig.savefig("ca_cpl_military_map.png", dpi=200, facecolor="white", bbox_inches="tight")
print("saved ca_cpl_military_map.png")
