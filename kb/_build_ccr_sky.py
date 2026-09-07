#!/usr/bin/env python3
"""Build SkyView's sky placement — prototype/ccr_sky.json.

Sam ruled the globe in (2026-09-07: "Looks great! Let's go with it in next
session"). The Sky view draws the same 49,896 points as the flat map, so what
it needs from a build is only WHERE EACH OF THE 159 DISCIPLINE ISLANDS SITS ON
THE SPHERE — three placements, and the reading behind the third:

  committed   the flat map's own layout, wrapped by longitude and latitude
              (x to longitude across 360°, y to latitude across 162°).
  spread      the islands eased apart into the empty sky, each keeping its
              neighbors (no overlapping caps at the round-island scale).
  by kind     CTE disciplines on one side of the sky, academic on the other,
              the mixed and unread ones along the line between, every island
              in the open. Sam, 2026-09-07: "Make proximity of groups based on
              CTE vs. Academic."

Every point is placed in the browser from its island's center and its offset
on the flat map (prototype/globe/build_globe.py `place()` is the pattern), so
this file stays small (~40 KB) and the island geometry is never duplicated.

WHAT IT READS, AND WHY EACH SOURCE
  prototype/ccr_universe.json      the islands (name, center, radius) and every
                                   point's identity id. Hand-built and committed;
                                   the daily run does not rebuild it (Sam's
                                   ruling of 2026-09-06: no nightly layout
                                   rebuild), so the placement changes only when
                                   a session rebuilds the map.
  unified_courses_data.js          the TOP code on each identity, regenerated
                                   daily.
  kb/reference/top_categories.json the manual's CTE flag per TOP code.

THE KIND IS TOP'S ONE SANCTIONED USE (Rule 7). The CTE flag is the one place
the manual makes TOP authoritative by definition, and it is used here as a
share per discipline — a DISPLAY ARRANGEMENT, never a classification: no
identity, membership or discipline is decided by it. The reading is thin
(measured 2026-09-07: 11,862 of 49,896 points carry a TOP code the manual
knows; the median island's reading rests on a quarter of its points), which
is why the payload carries each island's base beside its share.

A SIDE IS HELD ACROSS A THRESHOLD BY A MARGIN. Five disciplines sit within
0.05 of a threshold (2026-09-07: the no-discipline pile 0.58, Film and Media
Studies 0.63, Communication Studies 0.38, Geography 0.36, Library Science
0.39). Without a hold, two courses gaining a TOP code would move an island to
the other side of the sky on a daily rebuild. So a discipline keeps its
committed side unless its fresh share crosses the threshold by HOLD_MARGIN
(the sheet's item 6 proposes this; a ruling against it is one constant).

THE BUILD IS FINGERPRINTED. The relaxation is ~90 s of pure Python, so the
builder hashes its inputs (island geometry, the classes after the hold, the
scale) and rewrites the file only when that hash changes; --check compares
the hash and the payload's own invariants in ~5 s, which is what CI runs.
⚠️ The arithmetic here IS the prototype's: prototype/globe/globe_layout.py
imports relax() and clearance() from this module rather than carrying a copy
(the alias-chain lesson — a copied loop drifts), and the prototype page
rebuilds byte for byte from it.

Run from repo root:
    python3 kb/_build_ccr_sky.py            # rebuild if the inputs changed
    python3 kb/_build_ccr_sky.py --force    # rebuild regardless
    python3 kb/_build_ccr_sky.py --check    # exit 1 if the committed file is stale or broken
"""
import argparse
import datetime as dt
import hashlib
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UNIVERSE = os.path.join(ROOT, "prototype", "ccr_universe.json")
COURSES = os.path.join(ROOT, "unified_courses_data.js")
TOP_CATEGORIES = os.path.join(ROOT, "kb", "reference", "top_categories.json")
OUT = os.path.join(ROOT, "prototype", "ccr_sky.json")

ROUND_SCALE = 0.62            # the island scale on the sphere, as a share of the first round's (0.62 fits the round caps with room)
LAT_SPAN = math.pi * 0.9      # the flat map's wrap: 162° of latitude
CTE_T, ACADEMIC_T, HOLD_MARGIN = 0.6, 0.4, 0.05
SPREAD_ITERS, KIND_ITERS = 500, 1100
ALGO = "relax-v1"             # bump when the relaxation's arithmetic changes, so every committed file rebuilds once
CLASSES = ("cte", "academic", "mixed")


# ── vectors ──────────────────────────────────────────────────────────────────
def norm(v):
    l = math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) or 1.0
    return [v[0] / l, v[1] / l, v[2] / l]


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def toward(p, target):
    """unit tangent at p along the great circle toward target"""
    c = dot(p, target)
    t = [target[0] - c * p[0], target[1] - c * p[1], target[2] - c * p[2]]
    l = math.sqrt(dot(t, t))
    return [t[0] / l, t[1] / l, t[2] / l] if l > 1e-9 else [0.0, 0.0, 0.0]


def angle_deg(a, b):
    return math.degrees(math.acos(max(-1.0, min(1.0, dot(a, b)))))


# ── the flat map onto the sphere ─────────────────────────────────────────────
class Frame:
    """The flat map's bounds, and the two conversions the browser repeats."""

    def __init__(self, bounds, scale=ROUND_SCALE):
        self.cx = (bounds["x0"] + bounds["x1"]) / 2
        self.cy = (bounds["y0"] + bounds["y1"]) / 2
        self.W = bounds["x1"] - bounds["x0"]
        self.H = bounds["y1"] - bounds["y0"]
        self.S = 2 * math.pi / self.W          # radians along the equator per layout unit
        self.SR = scale * self.S               # the island scale on the sphere

    def to_sphere(self, x, y):
        lon = (x - self.cx) / self.W * 2 * math.pi
        lat = -(y - self.cy) / self.H * LAT_SPAN
        cl = math.cos(lat)
        return [cl * math.cos(lon), math.sin(lat), cl * math.sin(lon)]

    def from_sphere(self, v):
        lat = math.asin(max(-1.0, min(1.0, v[1])))
        lon = math.atan2(v[2], v[0])
        return (self.cx + lon / (2 * math.pi) * self.W, self.cy - lat / LAT_SPAN * self.H)


def lonlat_deg(v):
    """a unit vector as [longitude, latitude] in degrees, the browser's contract"""
    lat = math.asin(max(-1.0, min(1.0, v[1])))
    lon = math.atan2(v[2], v[0])
    return [round(math.degrees(lon), 3), round(math.degrees(lat), 3)]


# ── inputs ───────────────────────────────────────────────────────────────────
def load_js_object(path):
    src = open(path, encoding="utf-8").read()
    i = src.index("=") + 1
    return json.loads(src[i:].strip().rstrip(";"))


def load_universe(path=UNIVERSE):
    return json.load(open(path, encoding="utf-8"))


def cte_shares(universe, courses_path=COURSES, top_path=TOP_CATEGORIES):
    """{discipline: (base, cte, share)} — base is the points with a TOP code the
    manual knows, cte those the manual flags CTE, share cte/base (None when the
    discipline has no read at all). Every point counts, stand-alones included,
    exactly as the prototype counted it."""
    rows = load_js_object(courses_path)["rows"]
    top_of = {r["id"]: str(r["top"]).strip() for r in rows if r.get("top")}
    cte_map = {code: bool(rec.get("cte")) for code, rec in json.load(open(top_path, encoding="utf-8"))["codes"].items()}
    out = {}
    for I in universe["islands"]:
        k = c = 0
        for p in I["p"]:
            t = top_of.get(p["i"])
            if t and t in cte_map:
                k += 1
                c += 1 if cte_map[t] else 0
        out[I["d"]] = (k, c, (c / k) if k else None)
    return out


def fresh_class(share):
    if share is None:
        return "mixed"
    return "cte" if share >= CTE_T else ("academic" if share <= ACADEMIC_T else "mixed")


def classify(share, prev=None):
    """The class a discipline is placed by. With no prior side it is the fresh
    reading; with one, the prior side is HELD when the fresh share sits within
    HOLD_MARGIN of the threshold between the two — so an island crosses the sky
    only on a clear change, never on a hair. A jump across the whole mixed band
    (cte straight to academic) is never held."""
    fresh = fresh_class(share)
    if prev not in CLASSES or prev == fresh or share is None:
        return fresh
    pair = {prev, fresh}
    if pair == {"cte", "mixed"} and abs(share - CTE_T) < HOLD_MARGIN:
        return prev
    if pair == {"academic", "mixed"} and abs(share - ACADEMIC_T) < HOLD_MARGIN:
        return prev
    return fresh


# ── the geometry of the by-kind sky ──────────────────────────────────────────
def cap_area(th):
    return 2 * math.pi * (1 - math.cos(th))


def kind_geometry(TH, CLS):
    """The CTE side's share of the sky (by cap area, the mixed caps split) and
    the boundary circle's angle from the CTE pole."""
    A = {c: sum(cap_area(TH[i]) for i in range(len(TH)) if CLS[i] == c) for c in CLASSES}
    tot = A["cte"] + A["academic"] + A["mixed"]
    f_c = (A["cte"] + A["mixed"] / 2) / tot
    return f_c, math.acos(1 - 2 * f_c), tot


AX, AXN = [1.0, 0.0, 0.0], [-1.0, 0.0, 0.0]   # the CTE pole and the academic pole


def relax(home, TH, CLS, THETA_C, kind, iters):
    """Ease the island centers apart on the sphere. `home` are the committed
    centers (unit vectors), TH the cap radii in radians, CLS the class per
    island, THETA_C the by-kind boundary. kind == "kind" also sorts the sky:
    a CTE cap is pushed inside the boundary, an academic cap outside it, a
    mixed one onto it. ⚠️ THE ARITHMETIC AND ITS ORDER ARE THE PROTOTYPE'S
    (prototype/globe/globe_layout.py imports this) — change it and the
    prototype page changes with it, which is the point."""
    n = len(home)
    P = [p[:] for p in home]
    GLOBAL = 0.0012 if kind == "kind" else 0.00035
    HOME = 0.003 if kind == "kind" else 0.012
    STEP = 0.35
    for _ in range(iters):
        F = [[0.0, 0.0, 0.0] for _ in range(n)]
        for i in range(n):
            pi = P[i]
            for j in range(i + 1, n):
                pj = P[j]
                c = max(-1.0, min(1.0, dot(pi, pj)))
                dist = math.acos(c)
                want = 1.08 * (TH[i] + TH[j]) + 0.025
                f = GLOBAL / max(dist, 0.05) ** 2
                if dist < want:
                    f += (want - dist) * 0.5
                ti = norm([c * pi[0] - pj[0], c * pi[1] - pj[1], c * pi[2] - pj[2]])
                tj = norm([c * pj[0] - pi[0], c * pj[1] - pi[1], c * pj[2] - pi[2]])
                wi = TH[j] / (TH[i] + TH[j])
                wj = TH[i] / (TH[i] + TH[j])
                for a in range(3):
                    F[i][a] += f * ti[a] * wi * 2
                    F[j][a] += f * tj[a] * wj * 2
        for i in range(n):
            p = P[i]
            for a in range(3):
                p[a] += STEP * F[i][a] + HOME * (home[i][a] - p[a])
            p = norm(p)
            if kind == "kind":
                ang = math.acos(max(-1.0, min(1.0, p[0])))         # angle from the CTE pole
                if CLS[i] == "cte":
                    over = ang + TH[i] - (THETA_C - 0.02)
                    if over > 0:
                        t = toward(p, AX)
                        p = norm([p[a] + 0.6 * over * t[a] for a in range(3)])
                elif CLS[i] == "academic":
                    over = (THETA_C + 0.02) - (ang - TH[i])
                    if over > 0:
                        t = toward(p, AXN)
                        p = norm([p[a] + 0.6 * over * t[a] for a in range(3)])
                else:   # mixed: ride the boundary
                    off = ang - THETA_C
                    t = toward(p, AX if off > 0 else AXN)
                    p = norm([p[a] + 0.5 * abs(off) * t[a] for a in range(3)])
            else:
                lat = math.asin(max(-1.0, min(1.0, p[1])))
                over = abs(lat) + TH[i] - math.radians(80)
                if over > 0:
                    p[1] -= math.copysign(over * 0.6, lat)
                    p = norm(p)
            P[i] = p
    return P


def clearance(Q, TH):
    """(worst clearance between any two caps in radians, overlapping pairs)"""
    n = len(Q)
    worst = 9
    overl = 0
    for i in range(n):
        for j in range(i + 1, n):
            c = max(-1.0, min(1.0, dot(Q[i], Q[j])))
            d = math.acos(c) - TH[i] - TH[j]
            worst = min(worst, d)
            overl += d < 0
    return worst, overl


def nearest_gaps_deg(Q, TH):
    n = len(Q)
    gaps = []
    for i in range(n):
        g = min(math.acos(max(-1.0, min(1.0, dot(Q[i], Q[j])))) - TH[i] - TH[j] for j in range(n) if j != i)
        gaps.append(math.degrees(g))
    gaps.sort()
    return {"min": round(gaps[0], 1), "median": round(gaps[n // 2], 1), "max": round(gaps[-1], 1)}


def neighbors_kept(C, Q, CLS, k=5):
    """Of each island's k nearest committed neighbors, the share still among its
    k nearest in Q; and the ceiling — the share of those committed neighbor
    pairs that are on the same side to begin with (only those CAN survive a
    by-kind sort)."""
    n = len(C)

    def nn(P):
        return [set(j for _, j in sorted((angle_deg(P[i], P[j]), j) for j in range(n) if j != i)[:k]) for i in range(n)]
    nc, nq = nn(C), nn(Q)
    kept = sum(len(nc[i] & nq[i]) for i in range(n)) / (n * k)
    same = sum(1 for i in range(n) for j in nc[i] if CLS[i] == CLS[j]) / (n * k)
    return round(kept, 3), round(same, 3)


def wrong_side(PK, TH, CLS, THETA_C):
    return sum(1 for i in range(len(PK))
               if (CLS[i] == "cte" and math.acos(max(-1.0, min(1.0, PK[i][0]))) > THETA_C)
               or (CLS[i] == "academic" and math.acos(max(-1.0, min(1.0, PK[i][0]))) < THETA_C))


# ── the build ────────────────────────────────────────────────────────────────
def fingerprint(universe, CLS, scale=ROUND_SCALE):
    """What the placement depends on, and nothing else: the islands' geometry
    in order, the class each is placed by, the scale and the algorithm."""
    geo = [[I["d"], I["x"], I["y"], I["r"]] for I in universe["islands"]]
    doc = json.dumps({"islands": geo, "cls": list(CLS), "scale": scale, "lat_span": LAT_SPAN, "algo": ALGO,
                      "bounds": universe["bounds"]}, sort_keys=True, separators=(",", ":"))
    return "sha256:" + hashlib.sha256(doc.encode("utf-8")).hexdigest()


def read_previous(path=OUT):
    try:
        return json.load(open(path, encoding="utf-8"))
    except (OSError, ValueError):
        return None


def classes_for(universe, shares, prev):
    """The class per island, holding the committed side by the margin."""
    prev_cls = {I["d"]: I["cls"] for I in (prev or {}).get("islands", [])}
    return [classify(shares[I["d"]][2], prev_cls.get(I["d"])) for I in universe["islands"]]


def build(prev=None, force=False, universe=None, shares=None, scale=ROUND_SCALE):
    """Return (payload, rebuilt). When the fingerprint matches the previous
    payload and force is off, the previous payload is returned untouched."""
    universe = universe or load_universe()
    shares = shares or cte_shares(universe)
    CLS = classes_for(universe, shares, prev)
    fp = fingerprint(universe, CLS, scale)
    if prev and not force and prev.get("_inputs") == fp:
        return prev, False

    fr = Frame(universe["bounds"], scale)
    isl = universe["islands"]
    home = [fr.to_sphere(I["x"], I["y"]) for I in isl]
    TH = [I["r"] * fr.SR for I in isl]
    f_c, THETA_C, tot = kind_geometry(TH, CLS)
    PS = relax(home, TH, CLS, THETA_C, "spread", SPREAD_ITERS)
    PK = relax(home, TH, CLS, THETA_C, "kind", KIND_ITERS)

    quality = {}
    for label, Q in (("committed", home), ("spread", PS), ("kind", PK)):
        w, o = clearance(Q, TH)
        quality[label] = {"overlapping_pairs": o, "worst_clearance_deg": round(math.degrees(w), 1)}
    quality["kind"]["wrong_side"] = wrong_side(PK, TH, CLS, THETA_C)
    quality["kind"]["nearest_gap_deg"] = nearest_gaps_deg(PK, TH)
    ks, same = neighbors_kept(home, PS, CLS)
    kk, _ = neighbors_kept(home, PK, CLS)
    quality["neighbors_kept"] = {"k": 5, "spread": ks, "kind": kk, "same_side_ceiling": same}
    quality["cap_area_share_of_sphere"] = round(tot / (4 * math.pi), 3)

    prev_cls = {I["d"]: I["cls"] for I in (prev or {}).get("islands", [])}
    islands = []
    held = []
    for I, c, ps, pk in zip(isl, CLS, PS, PK):
        base, cte, share = shares[I["d"]]
        is_held = c != fresh_class(share)
        if is_held:
            held.append(I["d"])
        islands.append({
            "d": I["d"], "n": I["n"], "pts": len(I["p"]), "base": base, "cte": cte,
            "share": None if share is None else round(share, 3), "cls": c, "held": is_held,
            "committed": lonlat_deg(fr.to_sphere(I["x"], I["y"])), "spread": lonlat_deg(ps), "kind": lonlat_deg(pk),
        })
    by_class = {c: sum(1 for x in CLS if x == c) for c in CLASSES}
    pts_by_class = {c: sum(len(I["p"]) for I, x in zip(isl, CLS) if x == c) for c in CLASSES}
    payload = {
        "_about": ("SkyView's sky placement: where each discipline island sits on the sphere, three ways "
                   "(committed · spread · by kind) plus the CTE share behind the third. Points are placed in the "
                   "browser from their island's center and their offset on the flat map. Read-only; a display "
                   "arrangement, never a classification."),
        "_generated_by": "kb/_build_ccr_sky.py",
        "_generated_at": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "_inputs": fp,
        "_sources": {
            "islands": "prototype/ccr_universe.json (hand-built layout, committed; not rebuilt nightly)",
            "top": "unified_courses_data.js (the TOP code on each identity, daily)",
            "cte": "kb/reference/top_categories.json (the manual's CTE flag per TOP code — TOP's one sanctioned use)",
        },
        "radians_per_unit": fr.SR,
        "round_scale": scale,
        "lat_span_deg": round(math.degrees(LAT_SPAN), 3),
        "kind": {
            "boundary_deg": round(math.degrees(THETA_C), 1),
            "cte_side_share": round(f_c, 3),
            "cte": by_class["cte"], "academic": by_class["academic"], "mixed": by_class["mixed"],
            "thresholds": {"cte": CTE_T, "academic": ACADEMIC_T, "hold_margin": HOLD_MARGIN},
            "held": held,
            "source": ("kb/reference/top_categories.json CTE flag via each identity's TOP code (unified_courses_data.js); "
                       "a discipline is CTE at a share of 0.6 or more, academic at 0.4 or less, mixed between or with no "
                       "TOP read; a committed side is held unless the fresh share crosses the threshold by the margin"),
        },
        "counts": {
            "islands": len(isl),
            "points": sum(len(I["p"]) for I in isl),
            "points_with_top_read": sum(shares[I["d"]][0] for I in isl),
            "points_by_class": pts_by_class,
            "islands_by_class": by_class,
        },
        "quality": quality,
        "islands": islands,
    }
    return payload, True


def strip_volatile(p):
    q = dict(p)
    q.pop("_generated_at", None)
    return q


# ── the check ────────────────────────────────────────────────────────────────
def check(path=OUT, universe=None, shares=None):
    """(ok, problems): the committed payload is a build of today's inputs and
    keeps its own invariants. Cheap — no relaxation."""
    problems = []
    prev = read_previous(path)
    if not prev:
        return False, [f"{os.path.relpath(path, ROOT)} is missing or unreadable"]
    universe = universe or load_universe()
    shares = shares or cte_shares(universe)
    CLS = classes_for(universe, shares, prev)
    fp = fingerprint(universe, CLS)
    if prev.get("_inputs") != fp:
        problems.append("stale: the inputs changed since the committed build (island geometry, a class, or the scale)")
    names = [I["d"] for I in universe["islands"]]
    got = [I["d"] for I in prev.get("islands", [])]
    if names != got:
        problems.append(f"islands differ from the universe ({len(got)} vs {len(names)}, or a different order)")
    for I, c in zip(prev.get("islands", []), CLS):
        if I["cls"] != c:
            problems.append(f"{I['d']}: committed class {I['cls']} but today's reading (with the hold) says {c}")
            break
    q = prev.get("quality", {})
    if q.get("kind", {}).get("wrong_side", 1):
        problems.append("an island sits on the wrong side of the by-kind boundary")
    if q.get("spread", {}).get("overlapping_pairs", 1):
        problems.append("the spread placement overlaps")
    if q.get("kind", {}).get("worst_clearance_deg", -9) < -1.0:
        problems.append("the by-kind placement overlaps by more than a degree")
    for I in prev.get("islands", []):
        for key in ("committed", "spread", "kind"):
            lon, lat = I[key]
            if not (-180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0) or math.isnan(lon) or math.isnan(lat):
                problems.append(f"{I['d']}: {key} position out of range")
                break
    held = set(prev.get("kind", {}).get("held", []))
    for I in prev.get("islands", []):
        if bool(I.get("held")) != (I["d"] in held):
            problems.append(f"{I['d']}: held flag disagrees with the held list")
            break
    return not problems, problems


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=OUT)
    ap.add_argument("--check", action="store_true", help="exit 1 if the committed payload is stale or breaks an invariant")
    ap.add_argument("--force", action="store_true", help="relax again even when the inputs are unchanged")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    if args.check:
        ok, problems = check(args.out)
        if not args.quiet or not ok:
            print(("current" if ok else "STALE") + ": " + os.path.relpath(args.out, ROOT) + ("" if ok else "\n  - " + "\n  - ".join(problems)))
        sys.exit(0 if ok else 1)

    prev = read_previous(args.out)
    payload, rebuilt = build(prev, force=args.force)
    if rebuilt:
        json.dump(payload, open(args.out, "w", encoding="utf-8"), indent=0, separators=(",", ":"), ensure_ascii=False)
    if not args.quiet:
        k, q, c = payload["kind"], payload["quality"], payload["counts"]
        print(("rebuilt" if rebuilt else "current, untouched") + f": {os.path.relpath(args.out, ROOT)} — "
              f"{c['islands']} islands, {c['points']:,} points ({c['points_with_top_read']:,} with a TOP read) · "
              f"by kind {k['cte']} CTE · {k['academic']} academic · {k['mixed']} mixed, the CTE side {k['cte_side_share']:.0%} of the sky, "
              f"boundary {k['boundary_deg']}° · held {len(k['held'])} · "
              f"spread {q['spread']['overlapping_pairs']} overlaps, by kind {q['kind']['overlapping_pairs']} (worst {q['kind']['worst_clearance_deg']}°), "
              f"wrong side {q['kind']['wrong_side']} · neighbors kept: spread {q['neighbors_kept']['spread']:.0%}, kind {q['neighbors_kept']['kind']:.0%} "
              f"(ceiling {q['neighbors_kept']['same_side_ceiling']:.0%})")


if __name__ == "__main__":
    main()
