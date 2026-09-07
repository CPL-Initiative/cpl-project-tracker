#!/usr/bin/env python3
"""Layout for the SkyView globe prototype (prototype/globe/README.md): every point island-relative; three island
placements — committed (the flat map's), spread (eased apart, neighbors kept)
and BY KIND (CTE disciplines on one side of the sky, academic on the other,
the mixed and unread ones along the boundary, every island in the open).
The CTE reading is the one sanctioned use of TOP: the manual's CTE flag
(kb/_join_cte_from_top.py), taken as a share of each discipline's identities."""
import json, math, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
d = json.load(open(os.path.join(HERE, "globe_data.json")))
b = d["bounds"]; cx = (b["x0"] + b["x1"]) / 2; cy = (b["y0"] + b["y1"]) / 2; W = b["x1"] - b["x0"]; H = b["y1"] - b["y0"]
LAT_SPAN = math.pi * 0.9
S = 2 * math.pi / W
isl = d["islands"]; n = len(isl)
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 0.6
OUTF = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "globe_data3.json")
SR = SCALE * S

def to_sphere(x, y):
    lon = (x - cx) / W * 2 * math.pi; lat = -(y - cy) / H * LAT_SPAN; cl = math.cos(lat)
    return [cl * math.cos(lon), math.sin(lat), cl * math.sin(lon)]
def from_sphere(v):
    lat = math.asin(max(-1.0, min(1.0, v[1]))); lon = math.atan2(v[2], v[0])
    return (cx + lon / (2 * math.pi) * W, cy - lat / LAT_SPAN * H)
def norm(v):
    l = math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]) or 1.0; return [v[0]/l, v[1]/l, v[2]/l]
def dot(a, b): return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]
def toward(p, target):
    """unit tangent at p along the great circle toward target"""
    c = dot(p, target); t = [target[0] - c * p[0], target[1] - c * p[1], target[2] - c * p[2]]
    l = math.sqrt(dot(t, t))
    return [t[0]/l, t[1]/l, t[2]/l] if l > 1e-9 else [0.0, 0.0, 0.0]

# ── 1. points → island-relative ──────────────────────────────────────────
pts_out = []
for p in d["points"]:
    x, y = p[0], p[1]; best = -1; bestq = 9e9
    for k, I in enumerate(isl):
        q = ((x - I[1])**2 + (y - I[2])**2) / (I[3] * I[3])
        if q <= 1.0001 and q < bestq: best, bestq = k, q
    pts_out.append([best, round(x - isl[best][1], 1), round(y - isl[best][2], 1)] + p[2:] if best >= 0 else [-1, round(x, 1), round(y, 1)] + p[2:])

# ── 2. the CTE share per discipline (TOP's one sanctioned use: the CTE flag) ─
def load_js(fname):
    src = open(os.path.join(ROOT, fname), encoding="utf-8").read(); i = src.index("=") + 1
    return json.loads(src[i:].strip().rstrip(";"))
rows = load_js("unified_courses_data.js")["rows"]
top_of = {r["id"]: str(r["top"]).strip() for r in rows if r.get("top")}
cte_map = {code: rec["cte"] for code, rec in json.load(open(os.path.join(ROOT, "kb/reference/top_categories.json")))["codes"].items()}
U = json.load(open(os.path.join(ROOT, "prototype/ccr_universe.json")))
share = {}
for I in U["islands"]:
    k = c = 0
    for p in I["p"]:
        t = top_of.get(p["i"])
        if t and t in cte_map: k += 1; c += 1 if cte_map[t] else 0
    share[I["d"]] = (c / k) if k else None
def cls_of(s): return "mixed" if s is None else ("cte" if s >= 0.6 else ("academic" if s <= 0.4 else "mixed"))
CLS = [cls_of(share.get(I[0])) for I in isl]
TH = [I[3] * SR for I in isl]
area = lambda th: 2 * math.pi * (1 - math.cos(th))
A = {c: sum(area(TH[i]) for i in range(n) if CLS[i] == c) for c in ("cte", "academic", "mixed")}
tot = A["cte"] + A["academic"] + A["mixed"]
f_c = (A["cte"] + A["mixed"] / 2) / tot                 # the CTE side's share of the sky
THETA_C = math.acos(1 - 2 * f_c)                         # the boundary circle's angle from the CTE pole
AX = [1.0, 0.0, 0.0]; AXN = [-1.0, 0.0, 0.0]
print("classes:", {c: sum(1 for x in CLS if x == c) for c in ("cte", "academic", "mixed")}, "| cap area %.0f%% of the sphere | CTE side %.0f%% of it, boundary at %.0f° from the CTE pole"
      % (100 * tot / (4 * math.pi), 100 * f_c, math.degrees(THETA_C)))

# ── 3. relax: three placements ────────────────────────────────────────────
def relax(kind, iters):
    P = [to_sphere(I[1], I[2]) for I in isl]; home = [p[:] for p in P]
    GLOBAL = 0.0012 if kind == "kind" else 0.00035; HOME = 0.003 if kind == "kind" else 0.012; STEP = 0.35
    for it in range(iters):
        F = [[0.0, 0.0, 0.0] for _ in range(n)]
        for i in range(n):
            pi = P[i]
            for j in range(i + 1, n):
                pj = P[j]; c = max(-1.0, min(1.0, dot(pi, pj))); dist = math.acos(c)
                want = 1.08 * (TH[i] + TH[j]) + 0.025
                f = GLOBAL / max(dist, 0.05) ** 2
                if dist < want: f += (want - dist) * 0.5
                ti = norm([c * pi[0] - pj[0], c * pi[1] - pj[1], c * pi[2] - pj[2]])
                tj = norm([c * pj[0] - pi[0], c * pj[1] - pi[1], c * pj[2] - pi[2]])
                wi = TH[j] / (TH[i] + TH[j]); wj = TH[i] / (TH[i] + TH[j])
                for a in range(3): F[i][a] += f * ti[a] * wi * 2; F[j][a] += f * tj[a] * wj * 2
        for i in range(n):
            p = P[i]
            for a in range(3): p[a] += STEP * F[i][a] + HOME * (home[i][a] - p[a])
            p = norm(p)
            if kind == "kind":
                ang = math.acos(max(-1.0, min(1.0, p[0])))         # angle from the CTE pole
                if CLS[i] == "cte":
                    over = ang + TH[i] - (THETA_C - 0.02)
                    if over > 0:
                        t = toward(p, AX); p = norm([p[a] + 0.6 * over * t[a] for a in range(3)])
                elif CLS[i] == "academic":
                    over = (THETA_C + 0.02) - (ang - TH[i])
                    if over > 0:
                        t = toward(p, AXN); p = norm([p[a] + 0.6 * over * t[a] for a in range(3)])
                else:   # mixed: ride the boundary
                    off = ang - THETA_C
                    t = toward(p, AX if off > 0 else AXN); p = norm([p[a] + 0.5 * abs(off) * t[a] for a in range(3)])
            else:
                lat = math.asin(max(-1.0, min(1.0, p[1]))); over = abs(lat) + TH[i] - math.radians(80)
                if over > 0: p[1] -= math.copysign(over * 0.6, lat); p = norm(p)
            P[i] = p
    return P, home
def clearance(Q):
    worst = 9; overl = 0
    for i in range(n):
        for j in range(i + 1, n):
            c = max(-1.0, min(1.0, dot(Q[i], Q[j]))); dist = math.acos(c) - TH[i] - TH[j]
            worst = min(worst, dist); overl += dist < 0
    return worst, overl
PS, home = relax("spread", 500)
PK, _ = relax("kind", 1100)
for label, Q in (("committed", home), ("spread", PS), ("by kind", PK)):
    w, o = clearance(Q); print("%-9s %3d overlapping pairs, worst clearance %5.1f°" % (label, o, math.degrees(w)))
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
    sx, sy = from_sphere(ps); kx, ky = from_sphere(pk)
    out["islands"].append(I + [round(sx, 1), round(sy, 1), round(kx, 1), round(ky, 1), {"cte": 0, "academic": 1, "mixed": 2}[c], None if s is None else round(s, 2)])
out["points"] = pts_out; out["round_scale"] = SCALE
out["kind"] = {"boundary_deg": round(math.degrees(THETA_C), 1), "cte": sum(1 for c in CLS if c == "cte"), "academic": sum(1 for c in CLS if c == "academic"), "mixed": sum(1 for c in CLS if c == "mixed"),
               "source": "kb/reference/top_categories.json CTE flag via each identity's TOP code (unified_courses_data.js); a discipline is CTE at a share of 0.6 or more, academic at 0.4 or less, mixed between or with no TOP read"}
json.dump(out, open(OUTF, "w"), separators=(",", ":"), ensure_ascii=False)
print("wrote", OUTF, round(len(open(OUTF).read()) / 1024), "KB")
