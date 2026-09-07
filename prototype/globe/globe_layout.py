#!/usr/bin/env python3
"""Layout for the SkyView globe prototype (prototype/globe/README.md): every point island-relative;
three island placements — committed (the flat map's), spread (eased apart, neighbors kept)
and BY KIND (CTE disciplines on one side of the sky, academic on the other,
the mixed and unread ones along the boundary, every island in the open).

⚠️ THE ARITHMETIC LIVES IN kb/_build_ccr_sky.py — the product's daily sky
placement — and is imported here, never copied (the alias-chain lesson: a
copied loop drifts under a comment promising lockstep). This script keeps only
the prototype's own output shape: island-relative points and the island rows
build_globe.py inlines. The CTE reading is the one sanctioned use of TOP: the
manual's CTE flag (kb/_join_cte_from_top.py), taken as a share of each
discipline's points. The prototype reads the FRESH class (no held side)."""
import json, math, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "kb"))
from _build_ccr_sky import Frame, cte_shares, fresh_class, kind_geometry, relax, clearance, load_universe, dot  # noqa: E402

d = json.load(open(os.path.join(HERE, "globe_data.json")))
isl = d["islands"]; n = len(isl)
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 0.6
OUTF = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "globe_data3.json")
fr = Frame(d["bounds"], SCALE)
SR = fr.SR

# ── 1. points → island-relative ──────────────────────────────────────────
pts_out = []
for p in d["points"]:
    x, y = p[0], p[1]; best = -1; bestq = 9e9
    for k, I in enumerate(isl):
        q = ((x - I[1])**2 + (y - I[2])**2) / (I[3] * I[3])
        if q <= 1.0001 and q < bestq: best, bestq = k, q
    pts_out.append([best, round(x - isl[best][1], 1), round(y - isl[best][2], 1)] + p[2:] if best >= 0 else [-1, round(x, 1), round(y, 1)] + p[2:])

# ── 2. the CTE share per discipline (TOP's one sanctioned use: the CTE flag) ─
shares = cte_shares(load_universe())
share = {name: s for name, (_k, _c, s) in shares.items()}
CLS = [fresh_class(share.get(I[0])) for I in isl]
TH = [I[3] * SR for I in isl]
f_c, THETA_C, tot = kind_geometry(TH, CLS)
print("classes:", {c: sum(1 for x in CLS if x == c) for c in ("cte", "academic", "mixed")}, "| cap area %.0f%% of the sphere | CTE side %.0f%% of it, boundary at %.0f° from the CTE pole"
      % (100 * tot / (4 * math.pi), 100 * f_c, math.degrees(THETA_C)))

# ── 3. relax: three placements ────────────────────────────────────────────
home = [fr.to_sphere(I[1], I[2]) for I in isl]
PS = relax(home, TH, CLS, THETA_C, "spread", 500)
PK = relax(home, TH, CLS, THETA_C, "kind", 1100)
for label, Q in (("committed", home), ("spread", PS), ("by kind", PK)):
    w, o = clearance(Q, TH); print("%-9s %3d overlapping pairs, worst clearance %5.1f°" % (label, o, math.degrees(w)))
# how well sorted is the by-kind sky?
wrong = sum(1 for i in range(n) if (CLS[i] == "cte" and math.acos(PK[i][0]) > THETA_C) or (CLS[i] == "academic" and math.acos(PK[i][0]) < THETA_C))
print("by kind: islands on the wrong side of the boundary:", wrong)
# spacing evenness: nearest-neighbor gap stats for by kind
gaps = []
for i in range(n):
    g = min(math.acos(max(-1.0, min(1.0, dot(PK[i], PK[j])))) - TH[i] - TH[j] for j in range(n) if j != i); gaps.append(math.degrees(g))
gaps.sort(); print("by kind nearest-neighbor gap: min %.1f° median %.1f° max %.1f°" % (gaps[0], gaps[n // 2], gaps[-1]))

out = dict(d); out["islands"] = []
for I, ps, pk, c, s in zip(isl, PS, PK, CLS, [share.get(I[0]) for I in isl]):
    sx, sy = fr.from_sphere(ps); kx, ky = fr.from_sphere(pk)
    out["islands"].append(I + [round(sx, 1), round(sy, 1), round(kx, 1), round(ky, 1), {"cte": 0, "academic": 1, "mixed": 2}[c], None if s is None else round(s, 2)])
out["points"] = pts_out; out["round_scale"] = SCALE
out["kind"] = {"boundary_deg": round(math.degrees(THETA_C), 1), "cte": sum(1 for c in CLS if c == "cte"), "academic": sum(1 for c in CLS if c == "academic"), "mixed": sum(1 for c in CLS if c == "mixed"),
               "source": "kb/reference/top_categories.json CTE flag via each identity's TOP code (unified_courses_data.js); a discipline is CTE at a share of 0.6 or more, academic at 0.4 or less, mixed between or with no TOP read"}
json.dump(out, open(OUTF, "w"), separators=(",", ":"), ensure_ascii=False)
print("wrote", OUTF, round(len(open(OUTF).read()) / 1024), "KB")
