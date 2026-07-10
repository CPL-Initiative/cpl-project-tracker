#!/usr/bin/env python3
"""Verifier for the seeder's CSR wiring (Rule 7 / CSR0066, Sam 2026-07-10).

Checks that kb/_seed_coci_minted_mids.py keys new mints under the canonical
SUBJ4 with the umbrella carve-out — the wiring whose absence the 2026-07-10
CSR pass flagged (new mints could re-introduce Session-50-folded variants).

Run from repo root:  python3 kb/_verify_seeder_canonical.py
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import _seed_coci_minted_mids as seeder  # noqa: E402

PASS = 0


def check(name, ok, detail=""):
    global PASS
    print(("  ✓ " if ok else "  ✗ ") + name + (f" — {detail}" if detail and not ok else ""))
    if ok:
        PASS += 1
    else:
        sys.exit(f"FAIL: {name} {detail}")


def main():
    canon = seeder.load_canonical_map()

    # 1. the loaded map is CS1-valid everywhere
    bad = {d: c for d, c in canon.items() if not re.fullmatch(r"[A-Z]{4}", c)}
    check("every loaded canonical is ^[A-Z]{4}$", not bad, str(bad))

    # 2. umbrellas are excluded from the map (they mint per-subject)
    check("umbrella disciplines excluded",
          not (seeder.UMBRELLA_DISCIPLINES & set(canon)),
          str(seeder.UMBRELLA_DISCIPLINES & set(canon)))

    # 3. a mapped discipline canonicalizes the token
    disc = next(d for d, c in canon.items() if c)
    check("mapped discipline -> canonical token",
          seeder.canonical_subj_token(disc, "RAWX", canon) == canon[disc])

    # 4. umbrella keeps the modal token
    check("umbrella keeps modal token",
          seeder.canonical_subj_token("Foreign Languages", "SPAN", canon) == "SPAN")

    # 5. unmapped disciplines fall back to the modal token
    check("unmapped falls back to modal",
          seeder.canonical_subj_token("No Such Discipline", "XYZQ", canon) == "XYZQ")

    # 6. None discipline falls back to the modal token
    check("None discipline falls back to modal",
          seeder.canonical_subj_token(None, "MISC", canon) == "MISC")

    # 7. the live registry's Political Science pick reaches the seeder as POLS
    #    (the 2026-07-10 convergence — regression guard)
    check("Political Science mints under POLS",
          seeder.canonical_subj_token("Political Science", "POSC", canon) == "POLS",
          f"got {seeder.canonical_subj_token('Political Science', 'POSC', canon)}")

    print(f"\n{PASS}/7 checks pass")


if __name__ == "__main__":
    main()
