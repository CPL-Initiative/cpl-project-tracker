"""
Match the credential KB against the CareerOneStop certification authority.

The join ladder (graded provenance — the c-id.net #642 pattern, adapted):
  T1 exact     — normalized unified_title == normalized COS name
  T2 acronym   — the title's parenthetical/embedded acronym == COS acronym AND
                 the remaining tokens overlap the COS name (≥0.5 Jaccard)
  T3 contains  — one normalized name fully contains the other, length ratio ≥0.6
  T4 org-fuzzy — token-set Jaccard ≥0.8 AND our credential's issuing_agency
                 shares a significant token with the COS organization
A title with >1 candidate at its winning tier is AMBIGUOUS (skipped + reported)
— never guess between two authorities.

Outputs:
  kb/cos_matches.json            (--apply) the consumable overlay the CER badge
                                 reads: unified_title → {id, name, org, tier, …}.
                                 DERIVED data (never mutates the curated KB) —
                                 safe for the sync workflow to auto-write.
  kb/cos_match_out/<date>/report.json   receipts every run (counts + samples +
                                 ambiguous + divergence worklist).

  --apply-issuers  additionally fills issuing_agency on credentials.json records
                   that are NULL-issuer AND unreviewed-machine, from T1/T2
                   matches only. V-gates: never overwrites a non-null issuer,
                   never touches a reviewed/curator record. Deliberate manual
                   step — NOT in the cron.

Run from repo root:
  python3 kb/_match_cos_authority.py                # dry-run (report only)
  python3 kb/_match_cos_authority.py --apply        # + write kb/cos_matches.json
  python3 kb/_match_cos_authority.py --apply --apply-issuers
Test overrides: --authority PATH  --out PATH  (fixture harness).
"""
import json
import os
import re
import sys
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
AUTHORITY = os.path.join(HERE, "reference", "cos_certifications.json")
UT_PATH = os.path.join(HERE, "unified_titles.json")
CR_PATH = os.path.join(HERE, "credentials.json")
OUT = os.path.join(HERE, "cos_matches.json")
OUTDIR = os.path.join(HERE, "cos_match_out", date.today().isoformat())

CLASSIFIED_BY = "cos-authority-match (kb/_match_cos_authority.py)"

STOP = {"the", "of", "and", "in", "for", "a", "an", "to", "with", "on", "or"}


def norm(s):
    s = (s or "").lower()
    s = re.sub(r"[‐-―−]", "-", s)   # unicode dashes
    s = s.replace("&", " and ")
    s = re.sub(r"\([^)]*\)", " ", s)                # parentheticals out
    # '+' is load-bearing in cert names (A+ vs Network+ vs Security+) — fold it
    # INTO the token ('a+' → 'aplus') so it survives the punctuation strip and
    # 'A+' never degenerates to the stopword 'a'.
    s = s.replace("+", "plus")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " ".join(s.split())


def tokens(s):
    return {t for t in norm(s).split() if t not in STOP}


def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def acronyms_of(title):
    """Parenthetical ALL-CAPS chunks (e.g. 'Residential Building Inspector (RBI)')."""
    return {m.group(1) for m in re.finditer(r"\(([A-Z][A-Z0-9+\-\./]{1,11})\)", title or "")}


# Level/sequence tokens — 'Firefighter I' vs 'Firefighter II' are DIFFERENT
# credentials (the CCR's level-collapsing over-merge lesson). Containment and
# fuzzy tiers must never bridge two names whose level tokens disagree.
_LEVELS = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5",
           "1": "1", "2": "2", "3": "3", "4": "4", "5": "5",
           "1a": "1a", "1b": "1b", "1c": "1c", "1d": "1d",
           "2a": "2a", "2b": "2b", "2c": "2c", "2d": "2d"}


def level_sig(toks):
    return frozenset(_LEVELS[t] for t in toks if t in _LEVELS)


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_index(certs):
    """Precompute per-cert normalized forms once — the T3/T4 scans run per
    title, and re-normalizing ~thousands of certs per title is minutes of
    wasted runner time."""
    prepared, by_norm, by_acr = [], {}, {}
    for c in certs:
        cn = norm(c["name"])
        prepared.append((c, cn, tokens(c["name"]), tokens(c.get("org", ""))))
        by_norm.setdefault(cn, []).append(c)
        acr = (c.get("acronym") or "").strip()
        if acr:
            by_acr.setdefault(acr.upper(), []).append(c)
    return prepared, by_norm, by_acr


def match_title(title, issuer, prepared, by_norm, by_acr):
    """Return (tier, candidates) for the best tier that fires."""
    n = norm(title)
    if not n:
        return None, []
    t1 = by_norm.get(n) or []
    if t1:
        return "exact", t1
    tt = tokens(title)
    t2 = []
    for acr in acronyms_of(title):
        for c in by_acr.get(acr.upper(), []):
            if jaccard(tt, tokens(c["name"])) >= 0.5:
                t2.append(c)
    if t2:
        return "acronym", t2
    tl = level_sig(tt)
    t3 = []
    for c, cn, ctoks, _otoks in prepared:
        if not cn or cn == n or not ctoks:
            continue
        # TOKEN-subset containment, never substring ('firefighter i' is a
        # substring of 'firefighter ii' — a wrong match), plus the level guard,
        # plus a ≥2-token floor on the contained side (a 1-token subset like
        # {comptia} ⊆ {comptia, network} carries no signal).
        contained = ctoks if ctoks <= tt else (tt if tt <= ctoks else None)
        if (contained is not None and len(contained) >= 2
                and level_sig(ctoks) == tl
                and min(len(cn), len(n)) / max(len(cn), len(n)) >= 0.6):
            t3.append(c)
    if t3:
        return "contains", t3
    if issuer:
        it = tokens(issuer)
        t4 = [c for c, _cn, ctoks, otoks in prepared
              if jaccard(tt, ctoks) >= 0.8 and level_sig(ctoks) == tl
              and (it & otoks)]
        if t4:
            return "org-fuzzy", t4
    return None, []


def main():
    argv = sys.argv[1:]
    apply_matches = "--apply" in argv
    apply_issuers = "--apply-issuers" in argv
    def opt(name, default):
        return argv[argv.index(name) + 1] if name in argv else default
    authority_path = opt("--authority", AUTHORITY)
    out_path = opt("--out", OUT)

    try:
        auth = load(authority_path)
    except FileNotFoundError:
        print(f"No authority file at {authority_path} — run the cos-authority-sync "
              f"workflow first. Nothing to do.")
        return
    certs = auth.get("certifications", [])
    ut = load(UT_PATH)
    cr = load(CR_PATH)

    titles = sorted({(e.get("unified_title") or "").strip()
                     for e in ut.values() if e.get("unified_title")})
    issuer_of = {t: (cr.get(t) or [{}])[0].get("issuing_agency") for t in titles}

    prepared, by_norm, by_acr = build_index(certs)
    matches, ambiguous = {}, []
    for t in titles:
        tier, cands = match_title(t, issuer_of.get(t), prepared, by_norm, by_acr)
        if not tier:
            continue
        # De-dupe candidates that are the same cert name+org under two ids.
        uniq = {(norm(c["name"]), norm(c.get("org", ""))): c for c in cands}
        if len(uniq) > 1:
            ambiguous.append({"title": t, "tier": tier,
                              "candidates": [{"name": c["name"], "org": c.get("org")}
                                             for c in list(uniq.values())[:5]]})
            continue
        c = list(uniq.values())[0]
        m = {"name": c["name"], "org": c.get("org") or None, "tier": tier}
        for f in ("id", "acronym", "type", "in_demand"):
            if c.get(f) is not None:
                m[f] = c[f]
        matches[t] = m

    # Divergence worklist: matched but our spelling differs from the authority's.
    divergent = [{"ours": t, "authority": m["name"], "tier": m["tier"]}
                 for t, m in matches.items() if norm(t) != norm(m["name"])]
    # Issuer-fill plan: null-issuer, unreviewed-machine records with a T1/T2 match.
    fill_plan = []
    for t, m in matches.items():
        recs = cr.get(t)
        if (m["tier"] in ("exact", "acronym") and m.get("org") and recs
                and not recs[0].get("issuing_agency")
                and not (recs[0].get("reviewed_by") or "")):
            fill_plan.append({"title": t, "issuer": m["org"]})

    print(f"authority: {len(certs)} certifications ({auth.get('_lane')} lane, "
          f"{auth.get('_synced_at')})")
    print(f"unified titles scanned: {len(titles)}")
    by_tier = {}
    for m in matches.values():
        by_tier[m["tier"]] = by_tier.get(m["tier"], 0) + 1
    print(f"matches: {len(matches)} {by_tier} | ambiguous: {len(ambiguous)} "
          f"| divergent spellings: {len(divergent)} | issuer fills possible: {len(fill_plan)}")
    for t, m in list(matches.items())[:10]:
        print(f"  ✓ [{m['tier']}] {t!r} → {m['name']!r} ({m.get('org')})")
    for a in ambiguous[:5]:
        print(f"  ? {a['title']!r}: {len(a['candidates'])} candidates at {a['tier']}")

    os.makedirs(OUTDIR, exist_ok=True)
    report = {
        "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": ("apply" if apply_matches else "dry-run")
                + ("+issuers" if apply_issuers else ""),
        "authority_count": len(certs), "titles_scanned": len(titles),
        "match_count": len(matches), "by_tier": by_tier,
        "ambiguous": ambiguous, "divergent": divergent, "issuer_fill_plan": fill_plan,
    }
    with open(os.path.join(OUTDIR, "report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"receipt: {os.path.relpath(OUTDIR, os.path.dirname(HERE))}/report.json")

    if apply_matches:
        prior = None
        try:
            prior = load(out_path).get("matches")
        except (FileNotFoundError, ValueError):
            pass
        if prior == matches:
            print("no change: matches identical — overlay left untouched")
        else:
            out = {
                "_about": ("CareerOneStop authority matches for CER unified titles "
                           "(kb/_match_cos_authority.py). DERIVED overlay — the CER "
                           "renders these as ✓ COS badges; display requires the "
                           "attribution below."),
                "_attribution": auth.get("_attribution"),
                "_authority_synced_at": auth.get("_synced_at"),
                "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "count": len(matches),
                "matches": matches,
            }
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(out, f, indent=1, ensure_ascii=False)
                f.write("\n")
            print(f"wrote {out_path}: {len(matches)} matches")

    if apply_issuers:
        today = date.today().isoformat()
        filled = []
        for p in fill_plan:
            rec0 = cr[p["title"]][0]
            # V-gates re-checked at write time: null issuer + unreviewed only.
            if rec0.get("issuing_agency") or (rec0.get("reviewed_by") or ""):
                continue
            rec0["issuing_agency"] = p["issuer"]
            rec0["confidence_issuer"] = 0.9
            rec0["classified_by"] = CLASSIFIED_BY
            rec0["classified_at"] = today
            filled.append(p)
        if filled:
            with open(CR_PATH, "w", encoding="utf-8") as f:
                json.dump(cr, f, indent=2, ensure_ascii=False)
                f.write("\n")
        with open(os.path.join(OUTDIR, "issuers_applied.json"), "w", encoding="utf-8") as f:
            json.dump(filled, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"issuer fills applied: {len(filled)} (machine-classified, unreviewed — "
              f"curator supersede rules still apply)")


if __name__ == "__main__":
    main()
