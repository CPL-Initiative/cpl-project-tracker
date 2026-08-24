#!/usr/bin/env python3
"""CCR Universe — precomputed layout for every course identity.

READ-ONLY. Emits prototype/ccr_universe.json.

WHY PRECOMPUTED
---------------
17,321 identities cannot be force-laid-out in a browser on every load, and a
live force graph at that size is an unreadable hairball besides. So the layout
is computed ONCE here and shipped as coordinates: the browser only draws, which
makes pan/zoom/search instant and the result stable between sessions (a layout
that reshuffles every load is unnavigable — you cannot learn where anything is).

The arrangement is ISLANDS: one per discipline, packed on a spiral biggest-first,
each island a disc of its identities. Disciplines are the thing a curator
navigates by, and keeping them spatially separate is what makes "this course is
in the wrong subject entirely" visible at a glance — and what lets a curator
drag one island next to another to move a course across areas.

Positions are in an abstract world space; the client maps to screen.
"""
import argparse, json, math, os
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLANK = "(no discipline yet)"


def load_js(fname):
    with open(os.path.join(ROOT, fname), encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("window."); i = src.index("=", i) + 1
    return json.loads(src[i:].strip().rstrip(";"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="prototype/ccr_universe.json")
    ap.add_argument("--include-standalone", action="store_true",
                    help="also place the 34,840 single-college rows (heavier payload)")
    args = ap.parse_args()

    data = load_js("unified_courses_data.js")
    mem = load_js("unified_courses_members.js")["members"]
    rows = list(data["rows"])
    if args.include_standalone:
        rows += load_js("unified_courses_standalone.js")["rows"]

    # ── group into islands ──────────────────────────────────────────────────
    by_disc = defaultdict(list)
    for r in rows:
        by_disc[r.get("disc") or BLANK].append(r)

    order = sorted(by_disc.items(), key=lambda kv: -len(kv[1]))

    # spiral packing, biggest first — a Vogel/sunflower spiral keeps the centre
    # dense and the tail readable without any overlap test
    GAP = 34.0
    islands, placed = [], []
    theta = 0.0
    for k, (disc, members) in enumerate(order):
        n = len(members)
        r_isl = max(26.0, 12.5 * math.sqrt(n))          # island radius ~ sqrt(count)
        # walk outward until this disc clears every island already placed
        step = 0.0
        while True:
            theta_k = 2.399963 * k + step               # golden angle
            dist = 46.0 * math.sqrt(k + 1) + step * 26.0
            cx, cy = dist * math.cos(theta_k), dist * math.sin(theta_k)
            if all(math.hypot(cx - p[0], cy - p[1]) > (r_isl + p[2] + GAP) for p in placed):
                break
            step += 0.28
            if step > 300:                              # give up rather than hang
                break
        placed.append((cx, cy, r_isl))
        islands.append({"d": disc, "x": round(cx, 1), "y": round(cy, 1),
                        "r": round(r_isl, 1), "n": n})

        # ── identities inside the island, sunflower-packed ──────────────────
        pts = []
        for i, row in enumerate(sorted(members, key=lambda r: -(r.get("members") or 0))):
            a = 2.399963 * i
            rad = r_isl * 0.88 * math.sqrt((i + 0.5) / n)
            fl = row.get("flags") or {}
            pts.append({
                "i": row["id"],
                "x": round(cx + rad * math.cos(a), 1),
                "y": round(cy + rad * math.sin(a), 1),
                "t": row.get("title") or "",
                "n": int(row.get("members") or 0),
                "s": {"C-ID": 1, "CCN-ID": 2, "M-ID": 0}.get(row.get("id_system"), 3),
                "f": 1 if any(v is True or (isinstance(v, str) and v)
                              for kk, v in fl.items() if kk != "reviewed") else 0,
                "r": 1 if fl.get("reviewed") else 0,
            })
        islands[-1]["p"] = pts

    xs = [p[0] for p in placed]; ys = [p[1] for p in placed]
    rs = [p[2] for p in placed]
    bounds = {"x0": round(min(x - r for x, r in zip(xs, rs)), 1),
              "x1": round(max(x + r for x, r in zip(xs, rs)), 1),
              "y0": round(min(y - r for y, r in zip(ys, rs)), 1),
              "y1": round(max(y + r for y, r in zip(ys, rs)), 1)}

    out = {
        "_about": "CCR Universe — precomputed island layout. READ-ONLY extract; "
                  "the browser draws these coordinates, it does not solve a layout.",
        "_generated_from": data.get("generated_at"),
        "counts": {"identities": sum(i["n"] for i in islands),
                   "disciplines": len(islands),
                   "member_rows": sum(len(v) for v in mem.values())},
        "bounds": bounds,
        "islands": islands,
    }
    path = os.path.join(ROOT, args.out)
    json.dump(out, open(path, "w", encoding="utf-8"), separators=(",", ":"))
    print(f"wrote {args.out}  ({os.path.getsize(path)/1024:.0f} KB)")
    print(f"  {out['counts']['identities']:,} identities in {len(islands)} islands")
    print(f"  bounds {bounds}")
    print("  largest:", ", ".join(f"{i['d'][:22]} ({i['n']})" for i in islands[:5]))


if __name__ == "__main__":
    main()
