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

MEMBERS SHIP SEPARATELY
-----------------------
The layout payload carries identities. The DRAG carries courses, so SkyView also
needs the member college courses — and there are 101,065 of them against 16,484
identities. They go to a SECOND file (--members-out) rather than into the island
points, for two reasons: ccr_universe.json stays the size it already is for every
other reader, and "the members cost 2.4 MB" stays a legible fact instead of a
silent doubling of a file nobody re-measures.

The member record is the minimum a drag needs: [control_number, course code,
college index]. Titles are NOT carried — the drag list renders code + college, so
a title would add 3.1 MB to show nothing. The control number is stored as an
INTEGER with the invariant "CCC" prefix stripped; a member whose control number
is absent or malformed is DROPPED and counted, never coerced to zero, because the
control number IS the write key (`CN:<control_number>`) and a course with no key
cannot be re-homed.
"""
import argparse, json, math, os, re, unicodedata
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLANK = "(no discipline yet)"


def load_js(fname):
    with open(os.path.join(ROOT, fname), encoding="utf-8") as fh:
        src = fh.read()
    i = src.index("window."); i = src.index("=", i) + 1
    return json.loads(src[i:].strip().rstrip(";"))


CN_RE = re.compile(r"^CCC(\d{9})$")


def slug(name):
    """Discipline -> a filename. Stable, lowercase, ASCII-safe, collision-checked by
    the caller — a shard whose name collides would silently serve another subject's
    descriptions, which is worse than having none."""
    out = []
    for ch in unicodedata.normalize("NFKD", name):
        if ch.isalnum() and ord(ch) < 128:
            out.append(ch.lower())
        elif out and out[-1] != "-":
            out.append("-")
    return ("".join(out).strip("-") or "x")[:60]


def write_desc_shards(islands, out_rel):
    """Course descriptions, ONE FILE PER DISCIPLINE, fetched when a curator opens an
    identity.

    WHY NOT INLINE. Measured 2026-08-24: descriptions are 34.8 MB at their stored
    500-char truncation and still 11.6 MB cut to 120 chars, against a built page already
    at 9.7 MB. There is no truncation that makes them inlinable and still worth reading,
    so they load on demand — Sam's call, taken knowing it means serving the page over
    http rather than opening the file directly:

        python3 -m http.server -d . 8000
        open http://localhost:8000/prototype/ccr_atlas_v1.built.html

    ⚠️ Under file:// fetch() is blocked by CORS and every shard will fail. That is not a
    bug to work around silently — the client says so and names the command, because a
    drill-down that shows nothing is indistinguishable from a course with no description.
    """
    src = load_js("unified_courses_member_desc.js").get("desc") or {}
    path = os.path.join(ROOT, out_rel)
    os.makedirs(path, exist_ok=True)
    for stale in os.listdir(path):          # a renamed discipline must not leave a ghost
        if stale.endswith(".json"):
            os.remove(os.path.join(path, stale))

    seen, total, n_desc = {}, 0, 0
    for isl in islands:
        name = isl["sh"]
        if name in seen and seen[name] != isl["d"]:
            raise SystemExit(f"shard name collision: {isl['d']!r} and {seen[name]!r} "
                             f"both slug to {name!r} — rename before shipping")
        seen[name] = isl["d"]
        shard = {}
        for pt in isl["p"]:
            ds = [d for d in (src.get(pt["i"]) or [])]
            if any(ds):
                shard[pt["i"]] = ds
                n_desc += sum(1 for d in ds if d)
        blob = json.dumps(shard, separators=(",", ":"), ensure_ascii=False)
        with open(os.path.join(path, name + ".json"), "w", encoding="utf-8") as fh:
            fh.write(blob)
        total += len(blob.encode("utf-8"))
    print(f"wrote {out_rel}/  ({len(islands)} shards, {total/1048576:.1f} MB, "
          f"{n_desc:,} course descriptions)")


def write_members(mem_payload, placed_ids, out_rel):
    """Emit the draggable member courses for the identities the universe places.

    Record: [control_number:int, course code, college index]. See the module
    docstring for why the title is left out and why a member with no usable
    control number is dropped rather than carried with a placeholder key.

    Two counts are reported because they mean different things and a reader who
    sees only one will misread the file:

      dropped_no_key            a member that cannot be dragged at all.
      cn_on_multiple_identities a control number surfacing under MORE THAN ONE
                                identity. That is the known forward-join
                                behavior for an over-merged identity, and it
                                matters here because the WRITE is one row per
                                control number: re-homing such a course is a
                                single global statement, so it must leave every
                                card it was showing on, not just the one the
                                curator was looking at. The consumer needs the
                                number to know that case is live.

    ⚠️ That counter answers ONE question and is routinely read as answering a
    second. It counts one course claimed by several identities. It does NOT
    count a control number that names several different COURSES — a separate
    fault, larger, and not bounded by this one, because the write key cannot
    tell those rows apart at all. Sized by kb/_audit_control_number_claims.py;
    guarded in the consumer by prototype/ccr_universe.js::canMove. No figure is
    quoted here on purpose: the last one sat in this docstring until it was
    wrong by 43.
    """
    mem = mem_payload["members"]
    out, dropped, owners = {}, 0, defaultdict(set)
    for ident in placed_ids:
        recs = []
        for m in mem.get(ident, ()):
            hit = CN_RE.match(str(m.get("cn") or "").strip().upper())
            if not hit:
                dropped += 1
                continue
            recs.append([int(hit.group(1)), m.get("n") or "", m.get("c")])
            owners[hit.group(1)].add(ident)
        if recs:
            out[ident] = recs

    payload = {
        "_about": "SkyView draggable members — identity id -> [[control_number, "
                  "course code, college index]]. Control numbers are the CCC prefix "
                  "stripped; re-add it to write CN:CCC<9 digits>. READ-ONLY extract.",
        "_generated_from": mem_payload.get("generated_at"),
        "colleges": mem_payload.get("colleges") or [],
        "counts": {
            "identities": len(out),
            "members": sum(len(v) for v in out.values()),
            "dropped_no_key": dropped,
            "cn_on_multiple_identities": sum(1 for v in owners.values() if len(v) > 1),
        },
        "m": out,
    }
    path = os.path.join(ROOT, out_rel)
    json.dump(payload, open(path, "w", encoding="utf-8"), separators=(",", ":"))
    c = payload["counts"]
    print(f"wrote {out_rel}  ({os.path.getsize(path)/1024:.0f} KB)")
    print(f"  {c['members']:,} members over {c['identities']:,} identities; "
          f"{c['dropped_no_key']} dropped for no control number; "
          f"{c['cn_on_multiple_identities']:,} control numbers on >1 identity")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="prototype/ccr_universe.json")
    ap.add_argument("--include-standalone", action="store_true", default=True,
                    help="place the single-college stand-alone rows too (default on — Sam, "
                         "2026-08-24: they must be reachable so he can drag them somewhere)")
    ap.add_argument("--no-standalone", dest="include_standalone", action="store_false",
                    help="omit them (the older, lighter payload)")
    ap.add_argument("--members-out", default="prototype/ccr_universe_members.json",
                    help="second payload: the draggable member courses per identity")
    ap.add_argument("--desc-dir", default="prototype/ccr_desc",
                    help="per-discipline description shards, fetched on demand")
    args = ap.parse_args()

    data = load_js("unified_courses_data.js")
    mem_payload = load_js("unified_courses_members.js")
    mem = mem_payload["members"]
    rows = list(data["rows"])
    # ── stand-alones ────────────────────────────────────────────────────────
    # Single-college courses nobody has clustered yet. Sam, 2026-08-24: "make sure
    # the stand alones are in a cluster in SkyView so I can drop them in the right
    # place." They are kept in their OWN island per discipline rather than mixed
    # into the clustered one, for two reasons: a stand-alone is a DIFFERENT KIND of
    # thing (it asserts no equivalence yet, so it cannot be over-merged or flagged),
    # and mixing 33k unclustered points into the clustered islands would bury the
    # 16k identities the merge queue is actually about. Naming the island keeps the
    # existing keyword fly-to working — searching a discipline finds both.
    n_sa = 0
    if args.include_standalone:
        sa = load_js("unified_courses_standalone.js")["rows"]
        for r in sa:
            r = dict(r)
            r["disc"] = f"{r.get('disc') or BLANK} · stand-alone"
            r["_sa"] = 1
            rows.append(r)
        n_sa = len(sa)

    # ── group into islands ──────────────────────────────────────────────────
    by_disc = defaultdict(list)
    for r in rows:
        by_disc[r.get("disc") or BLANK].append(r)

    order = sorted(by_disc.items(), key=lambda kv: -len(kv[1]))

    # spiral packing, biggest first — a Vogel/sunflower spiral keeps the center
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
        islands.append({"d": disc, "sh": slug(disc),
                        "x": round(cx, 1), "y": round(cy, 1),
                        "r": round(r_isl, 1), "n": n,
                        **({"a": 1} if disc.endswith(" · stand-alone") else {})})

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
                **({"a": 1} if row.get("_sa") else {}),
            })
        islands[-1]["p"] = pts

    xs = [p[0] for p in placed]; ys = [p[1] for p in placed]
    rs = [p[2] for p in placed]
    bounds = {"x0": round(min(x - r for x, r in zip(xs, rs)), 1),
              "x1": round(max(x + r for x, r in zip(xs, rs)), 1),
              "y0": round(min(y - r for y, r in zip(ys, rs)), 1),
              "y1": round(max(y + r for y, r in zip(ys, rs)), 1)}

    placed_ids = [p["i"] for isl in islands for p in isl["p"]]

    out = {
        "_about": "CCR Universe — precomputed island layout. READ-ONLY extract; "
                  "the browser draws these coordinates, it does not solve a layout.",
        "_generated_from": data.get("generated_at"),
        "counts": {"identities": sum(i["n"] for i in islands),
                   "disciplines": len(islands),
                   "stand_alone": n_sa,
                   # members CARRIED for the identities placed here — not the
                   # corpus figure, which counts stand-alone rows this payload
                   # does not place. The two differed by 33k and the smaller one
                   # is what a reader of this file can actually reach.
                   "member_rows": sum(len(mem.get(i, ())) for i in placed_ids),
                   "member_rows_all_identities": sum(len(v) for v in mem.values())},
        "bounds": bounds,
        "islands": islands,
    }
    path = os.path.join(ROOT, args.out)
    json.dump(out, open(path, "w", encoding="utf-8"), separators=(",", ":"))
    print(f"wrote {args.out}  ({os.path.getsize(path)/1024:.0f} KB)")

    write_members(mem_payload, placed_ids, args.members_out)
    write_desc_shards(islands, args.desc_dir)

    print(f"  {out['counts']['identities']:,} identities in {len(islands)} islands")
    print(f"  bounds {bounds}")
    print("  largest:", ", ".join(f"{i['d'][:22]} ({i['n']})" for i in islands[:5]))


if __name__ == "__main__":
    main()
