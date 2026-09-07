#!/usr/bin/env python3
"""SkyView's sky placement (prototype/ccr_sky.json, kb/_build_ccr_sky.py) — the
contracts the Sky view stands on.

  · The committed file is a build of today's inputs (stale is a failure, like
    the dependency map and the CPL payload) — checked by fingerprint, so CI
    never pays the 90-second relaxation.
  · Every island of the map is placed, once, in the map's order, and every
    position is a longitude and latitude the browser can use.
  · No CTE island sits on the academic side of the by-kind boundary and no
    academic one on the CTE side; the spread placement never overlaps; the
    by-kind placement never overlaps by more than a degree.
  · A side is HELD across a threshold by the margin (a discipline crosses the
    sky on a clear change, never on a hair), and a jump across the whole
    mixed band is never held.
  · The relaxation is deterministic, and it has ONE source: the prototype's
    generator imports it rather than carrying a copy.
  · The payload is a display arrangement: it carries each discipline's base
    beside its share and never a per-identity class.

Pure stdlib, no network. Run from repo root:
    python3 tests/ccr_sky_payload_test.py
"""
import json
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "kb"))
import _build_ccr_sky as B  # noqa: E402

FAILS = []


def check(name, cond, why=""):
    print(("PASS  " if cond else "FAIL  ") + name + (("  — " + str(why)) if (not cond and why) else ""))
    if not cond:
        FAILS.append(name)


def main():
    universe = B.load_universe()
    shares = B.cte_shares(universe)
    ok, problems = B.check(B.OUT, universe=universe, shares=shares)
    check("the committed sky placement is a fresh build with its invariants intact", ok, "; ".join(problems))
    payload = B.read_previous(B.OUT) or {}
    isl = payload.get("islands", [])

    names = [I["d"] for I in universe["islands"]]
    check("every island is placed once, in the map's order", [I["d"] for I in isl] == names, f"{len(isl)} vs {len(names)}")
    check("the point count is the map's", payload.get("counts", {}).get("points") == sum(len(I["p"]) for I in universe["islands"]))

    def in_range(v):
        lon, lat = v
        return -180.0 <= lon <= 180.0 and -90.0 <= lat <= 90.0 and not (math.isnan(lon) or math.isnan(lat))
    check("every position is a longitude and latitude in degrees",
          all(in_range(I[k]) for I in isl for k in ("committed", "spread", "kind")))
    # the committed longitude/latitude is the flat map wrapped: x across 360°, y across 162°
    fr = B.Frame(universe["bounds"])
    first = universe["islands"][0]
    check("the committed position is the flat map wrapped by longitude and latitude",
          isl and isl[0]["committed"] == B.lonlat_deg(fr.to_sphere(first["x"], first["y"])))

    q = payload.get("quality", {})
    check("no island on the wrong side of the by-kind boundary", q.get("kind", {}).get("wrong_side") == 0, q.get("kind"))
    check("the spread placement never overlaps", q.get("spread", {}).get("overlapping_pairs") == 0, q.get("spread"))
    check("the by-kind placement never overlaps by more than a degree", q.get("kind", {}).get("worst_clearance_deg", -9) >= -1.0, q.get("kind"))
    check("the by-kind boundary is where the placement says it is (every CTE cap inside it, every academic cap outside)",
          all((I["cls"] != "cte" or B.angle_deg(B.norm([math.cos(math.radians(I["kind"][1])) * math.cos(math.radians(I["kind"][0])),
                                                          math.sin(math.radians(I["kind"][1])),
                                                          math.cos(math.radians(I["kind"][1])) * math.sin(math.radians(I["kind"][0]))]), B.AX)
                                  <= payload["kind"]["boundary_deg"] + 0.05) for I in isl))

    k = payload.get("kind", {})
    check("the class counts add up to the islands", k.get("cte", 0) + k.get("academic", 0) + k.get("mixed", 0) == len(isl))
    check("the CTE side's share of the sky is a proper fraction", 0.0 < k.get("cte_side_share", 0) < 1.0)
    check("each island carries its base beside its share (a thin reading is visible, never laundered)",
          all(("base" in I and "share" in I and (I["share"] is None) == (I["base"] == 0)) for I in isl))
    check("a share is cte/base", all(I["share"] is None or abs(I["share"] - round(I["cte"] / I["base"], 3)) < 1e-9 for I in isl))
    check("no per-identity class enters the payload (a display arrangement, not a classification)",
          not any(key in json.dumps(payload) for key in ('"identity_class"', '"cls_by_id"', '"per_identity"')))

    # ── the hold: a side crosses on a clear change, never on a hair ──────────
    C = B.classify
    check("no prior side: the fresh reading rules", C(0.57) == "mixed" and C(0.62) == "cte" and C(0.38) == "academic" and C(None) == "mixed")
    check("a CTE side is held at 0.57", C(0.57, "cte") == "cte")
    check("a mixed side is held at 0.62 (needs 0.65 to become CTE)", C(0.62, "mixed") == "mixed" and C(0.66, "mixed") == "cte")
    check("an academic side is held at 0.43", C(0.43, "academic") == "academic" and C(0.46, "academic") == "mixed")
    check("a mixed side is held at 0.38 (needs 0.35 to become academic)", C(0.38, "mixed") == "mixed" and C(0.34, "mixed") == "academic")
    check("a jump across the whole band is never held", C(0.3, "cte") == "academic" and C(0.7, "academic") == "cte")
    check("a discipline that loses its read goes mixed whatever it was", C(None, "cte") == "mixed")
    held = set(k.get("held", []))
    by_name = {I["d"]: I for I in isl}
    check("every held island sits within the margin of a threshold",
          all(abs(by_name[h]["share"] - B.CTE_T) < B.HOLD_MARGIN or abs(by_name[h]["share"] - B.ACADEMIC_T) < B.HOLD_MARGIN
              for h in held if h in by_name and by_name[h]["share"] is not None))
    # a rebuild against the committed file holds the sides the file holds: the
    # classes the check computes are exactly the committed ones
    check("today's classes, with the hold, are the committed classes",
          B.classes_for(universe, shares, payload) == [I["cls"] for I in isl])

    # ── the fingerprint: what changes the placement, and only that ───────────
    CLS = [I["cls"] for I in isl]
    fp = B.fingerprint(universe, CLS)
    check("the fingerprint is the committed one", payload.get("_inputs") == fp)
    moved = json.loads(json.dumps(universe))
    moved["islands"][0]["x"] += 1
    check("moving one island by one unit changes the fingerprint", B.fingerprint(moved, CLS) != fp)
    flipped = list(CLS)
    flipped[0] = "academic" if flipped[0] != "academic" else "cte"
    check("changing one class changes the fingerprint", B.fingerprint(universe, flipped) != fp)
    check("a rebuild with unchanged inputs returns the committed payload untouched",
          B.build(payload, universe=universe, shares=shares)[1] is False)

    # ── determinism, on a toy sky (three caps, a few iterations) ─────────────
    home = [B.norm([1.0, 0.1, 0.0]), B.norm([0.9, 0.2, 0.3]), B.norm([-0.8, 0.1, 0.4])]
    TH = [0.2, 0.15, 0.25]
    cls = ["cte", "cte", "academic"]
    f_c, theta, _ = B.kind_geometry(TH, cls)
    a = B.relax(home, TH, cls, theta, "kind", 40)
    b = B.relax(home, TH, cls, theta, "kind", 40)
    check("the relaxation is deterministic", a == b)
    check("the relaxation leaves the inputs alone", home == [B.norm([1.0, 0.1, 0.0]), B.norm([0.9, 0.2, 0.3]), B.norm([-0.8, 0.1, 0.4])])
    check("on the toy sky the caps end apart", B.clearance(a, TH)[1] == 0, B.clearance(a, TH))

    # ── one source: the prototype's generator imports the relaxation ─────────
    src = open(os.path.join(ROOT, "prototype", "globe", "globe_layout.py"), encoding="utf-8").read()
    check("the prototype's generator imports the relaxation from the builder",
          "from _build_ccr_sky import" in src and "relax" in src)
    check("the prototype's generator carries no copy of relax() or clearance()",
          not re.search(r"^\s*def\s+(relax|clearance|to_sphere|from_sphere)\s*\(", src, re.M))

    print(f"\n{len(FAILS)} failing" if FAILS else "\nall checks passed")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
