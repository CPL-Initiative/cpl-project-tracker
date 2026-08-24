#!/usr/bin/env python3
"""Build the CCR Atlas prototype payload.

READ-ONLY. Reads the published CCR artifacts and emits a compact JSON payload
for prototype/ccr_atlas_v1.html:

  * `disciplines` — all 158 discipline aggregates (the "forest" view): identity
    count, member count, flagged count, reviewed count, open suggestion groups.
  * `detail` — full node/edge data for a handful of DEMO disciplines (the
    "neighborhood" view), small enough to inline in a prototype.

Edges are the WORK, not decoration: an edge means "an evidence lane already
suggests these two identities are the same course". Subject co-membership is a
weaker second edge kind so isolated nodes still have neighbours to drop onto.

Usage:  python3 kb/_build_ccr_atlas_extract.py [--out PATH] [--disc NAME ...]
"""
import argparse, json, os, re, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLANK = "(no discipline yet)"

def load_js(fname, marker="="):
    """Parse a `window.X = {...};` artifact into Python."""
    with open(os.path.join(ROOT, fname), encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("window.")
    i = src.index(marker, i) + len(marker)
    return json.loads(src[i:].strip().rstrip(";"))

# Demo disciplines: mid-sized, CTE-relevant, and the shape where over-merge bites.
DEFAULT_DEMO = [
    "Automotive Technology",
    "Fire Technology",
    "Administration of Justice",
    "Child Development/Early Childhood Education",
    "Welding",
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="prototype/ccr_atlas_data.json")
    ap.add_argument("--disc", action="append", default=None)
    ap.add_argument("--max-members", type=int, default=14,
                    help="cap member satellites embedded per identity (display only)")
    args = ap.parse_args()
    demo = args.disc or DEFAULT_DEMO

    data = load_js("unified_courses_data.js")
    rows = data["rows"]
    members = load_js("unified_courses_members.js")
    colleges = members["colleges"]
    mem = members["members"]
    sugg = load_js("unified_courses_suggestions.js")

    by_id = {r["id"]: r for r in rows}

    # ── decision components: the real unit of work ──────────────────────────
    # Every suggestion lane emits GROUPS; groups overlap, so the honest unit is
    # the connected COMPONENT over all suggestion edges. Measured 2026-08-23:
    # 6,056 components, 97.1% of them <=12 identities, modal size 2. That is what
    # makes this corpus drawable — and finishable.
    LANES = [("groups", "title-identity"), ("singleton_groups", "singleton"),
             ("family_groups", "family"), ("desc_groups", "description"),
             ("title_groups", "title"), ("evidence_groups", "evidence")]
    adj = defaultdict(set)
    pair_lane = defaultdict(set)
    pair_score = defaultdict(float)
    touched = set()
    for key, lane in LANES:
        for g in sugg.get(key) or []:
            ids = [m.get("id") for m in (g.get("members") or []) if m.get("id")]
            touched.update(ids)
            score = float(g.get("score") or 0)
            for a in range(len(ids)):
                for b in range(a + 1, len(ids)):
                    k = tuple(sorted((ids[a], ids[b])))
                    adj[ids[a]].add(ids[b]); adj[ids[b]].add(ids[a])
                    pair_lane[k].add(lane)
                    pair_score[k] = max(pair_score[k], score)
    seen, components = set(), []
    for n in touched:
        if n in seen:
            continue
        stack, comp = [n], []
        seen.add(n)
        while stack:
            x = stack.pop(); comp.append(x)
            for y in adj[x]:
                if y not in seen:
                    seen.add(y); stack.append(y)
        components.append(sorted(comp))

    # ── discipline aggregates (the forest) ──────────────────────────────────
    agg = defaultdict(lambda: {"ids": 0, "members": 0, "flagged": 0,
                               "reviewed": 0, "over_merged": 0, "decisions": 0})
    for r in rows:
        d = r.get("disc") or BLANK
        a = agg[d]
        a["ids"] += 1
        a["members"] += int(r.get("members") or 0)
        fl = r.get("flags") or {}
        if fl.get("reviewed"):
            a["reviewed"] += 1
        if any(v is True or (isinstance(v, str) and v)
               for k, v in fl.items() if k != "reviewed"):
            a["flagged"] += 1
        if fl.get("over_merged"):
            a["over_merged"] += 1
    # a component counts once against every named discipline it touches; a
    # component with NO named discipline lands in the triage pile, which is a
    # DIFFERENT job (assign a discipline) and must not be blended into the rest.
    comp_disc = []
    for comp in components:
        named = sorted({(by_id.get(i) or {}).get("disc") for i in comp
                        if (by_id.get(i) or {}).get("disc")})
        comp_disc.append(named)
        for d in (named or [BLANK]):
            agg[d]["decisions"] += 1
    disciplines = sorted(
        ({"name": d, **a} for d, a in agg.items()),
        key=lambda x: (x["name"] == BLANK, -x["decisions"], -x["ids"]))

    # ── neighbourhood detail for the demo disciplines ───────────────────────
    def node_of(i):
        r = by_id.get(i)
        if not r:
            return None
        fl = r.get("flags") or {}
        ms = (mem.get(i) or [])[: args.max_members]
        return {
            "id": i, "t": r.get("title") or "", "k": r.get("kind"),
            "sys": r.get("id_system"), "u": r.get("units"),
            "n": int(r.get("members") or 0), "disc": r.get("disc") or "",
            "subj": (r.get("subj") or [])[:3], "conf": r.get("conf"),
            "rev": bool(fl.get("reviewed")),
            "flags": [k for k, v in fl.items()
                      if k != "reviewed" and (v is True or (isinstance(v, str) and v))],
            "m": [{"c": colleges[p["c"]] if p.get("c") is not None
                        and p["c"] < len(colleges) else "?",
                   "n": p.get("n") or "", "t": p.get("t") or "",
                   "u": p.get("u"), "cn": p.get("cn") or ""} for p in ms],
        }

    detail = {}
    for d in demo:
        packs = []
        for comp, named in zip(components, comp_disc):
            if d not in named:
                continue
            nodes = [n for n in (node_of(i) for i in comp) if n]
            if not nodes:
                continue
            idset = {n["id"] for n in nodes}
            es = [{"a": k[0], "b": k[1], "lanes": sorted(v), "score": round(pair_score[k], 3)}
                  for k, v in pair_lane.items() if k[0] in idset and k[1] in idset]
            packs.append({"nodes": nodes, "edges": es,
                          "span": named,
                          "members": sum(n["n"] for n in nodes),
                          "flagged": sum(1 for n in nodes if n["flags"])})
        if not packs:
            print(f"  ! no decisions for discipline {d!r} — skipped", file=sys.stderr)
            continue
        packs.sort(key=lambda p: (-len(p["nodes"]), -p["members"]))
        detail[d] = packs

    out = {
        "_about": "CCR Atlas prototype payload — READ-ONLY extract of the published CCR artifacts.",
        "_generated_from": data.get("generated_at"),
        "totals": {
            "identities_inbrowser": data.get("count_inbrowser"),
            "identities_total": data.get("count_total"),
            "member_rows": sum(len(v) for v in mem.values()),
            "suggestion_groups": sum(len(sugg.get(k) or []) for k, _ in LANES),
            "decision_components": len(components),
            "identities_in_decisions": len(touched),
            "committed_curation": len(data.get("committed_curation") or {}),
        },
        "disciplines": disciplines,
        "detail": detail,
    }
    path = os.path.join(ROOT, args.out)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, separators=(",", ":"))
    kb = os.path.getsize(path) / 1024
    print(f"wrote {args.out}  ({kb:.0f} KB)")
    print(f"  disciplines: {len(disciplines)}   decisions: {len(components)}")
    for d, packs in detail.items():
        sizes = [len(p["nodes"]) for p in packs]
        print(f"    {d:46s} {len(packs):4d} decisions  largest {max(sizes)}  median {sorted(sizes)[len(sizes)//2]}")

if __name__ == "__main__":
    main()
