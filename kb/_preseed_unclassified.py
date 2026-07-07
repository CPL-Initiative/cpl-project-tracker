"""
CER unclassified-triage PRE-SEED — brand-family assignments for the obvious rows.

Sam (2026-07-07, looking at the 451-row triage queue): "it would be helpful to
have a procedure that pre-seeds the common exhibit titles and issuing agencies
-- all the APs should be an easy win, right?" Measured: the queue is 38 AP +
125 CLEP = 163 rows (36%) of College Board exams whose HOUSE FAMILIES already
exist in kb/unified_titles.json (49 AP + 42 CLEP unified titles). This script
maps each raw queue title to its existing family by DETERMINISTIC normalization
and emits worklist assignments — exactly what a curator would type, in bulk.

Doctrine honored (Session 101 triage QA): when a house family exists, retarget
to it VERBATIM — consistency with the house family outranks authority-verbatim
naming. This script therefore NEVER invents a unified title: a raw that doesn't
resolve to an EXISTING family is reported (`no_match` / `ambiguous`), never
seeded. Zero new credentials are minted; the fold (kb/_fold_unclassified.py)
sees only clean assignments into existing families.

Pipeline position:
  kb/exhibit_audit/latest.json  (the unclassified queue)
    -> THIS SCRIPT (dry-run default)  -> kb/preseed_out/<date>/plan.json receipt
    -> --apply: upsert Supabase kb_curation _UNCLASSIFIED::<raw> rows
       (unified_title_assignment + issuing_agency_assignment,
        reviewer_email 'preseed-v1@bot' — the automerge-v1@bot cohort pattern:
        queryable provenance, reviewable/clearable in the worklist)
    -> the daily cron's _apply_unclassified_triage.py sync + _fold_unclassified.py
       fold them like any curator assignment (V-gates still apply).

The worklist shows pre-seeds immediately (it reads Supabase live) with the ✕
un-assign affordance, so Sam has a review window before the next cron folds.

Apply lanes:
  - runner / local with the service key:
      SUPABASE_SERVICE_KEY=... python3 kb/_preseed_unclassified.py --apply
  - agent sandbox (egress-blocked from *.supabase.co): generate the plan here,
    then upsert via the Supabase MCP from plan.json (same rows).

Run from repo root:
  python3 kb/_preseed_unclassified.py            # dry-run: table + receipt
  python3 kb/_preseed_unclassified.py --apply    # write assignments to Supabase
"""
import json
import os
import re
import sys
from datetime import date, datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIT_PATH = os.path.join(HERE, "exhibit_audit", "latest.json")
UT_PATH = os.path.join(HERE, "unified_titles.json")
OVERLAY_PATH = os.path.join(HERE, "unclassified_assignments.json")
OUTDIR = os.path.join(HERE, "preseed_out", date.today().isoformat())

REVIEWER = "preseed-v1@bot"
KEY_PREFIX = "_UNCLASSIFIED::"
FIELD_TITLE = "unified_title_assignment"
FIELD_ISSUER = "issuing_agency_assignment"

# v1 scope: the College Board exam brands. Each family = (detector on the
# CLEANED title, issuer). Extend the table for future brands (IB, DSST, ...).
FAMILIES = {
    "AP": {"detect": re.compile(r"^AP\b", re.I), "issuer": "College Board"},
    "CLEP": {"detect": re.compile(r"^CLEP\b", re.I), "issuer": "College Board"},
}

# ── cleanup: strip the decoration colleges wrap around the exam name ─────────

# Parentheticals that are decoration, not identity. Groups:
#   score bands  — "(Score 3-5)", "(Score of 3, 4 or 5)", "(Score of 50)"
#   policy notes — "(F09 or prior)", "(only if taken before F11)",
#                  "(max of 10 units awarded)", "(IGETC)", CSU admission notes
#   local course — "(BIOSCI 101)", "(MATH-100)" — the target-course trap
#                  _suggest_unclassified.py documented: NEVER treat the
#                  parenthetical course code as the credential's identity.
_PAREN_SCORE = re.compile(r"^scores?\b|^score of\b", re.I)
_PAREN_POLICY = re.compile(
    r"^(?:only\s+if|if\s+taken|prior|before|after|until|(?:fa|sp|f|s)\d{2}\b"
    r"|max(?:imum)?\s+of|igetc|csu\b|taken)", re.I)
_PAREN_COURSE = re.compile(r"^[A-Z]{2,10}[-\s]?\d{1,4}[A-Z]?$")
# A parenthetical that names MULTIPLE levels makes the row ambiguous (which
# exam level earned the credit?) — report, never guess.
_PAREN_MULTILEVEL = re.compile(r"^levels?\s+\d+\s+and\s+\d+", re.I)

_FOOTNOTE_BRACKET = re.compile(r"\[\d+\]")
_DASHES = dict.fromkeys(map(ord, "‐‑‒–—―−"), "-")


def cleanup(raw):
    """Normalize whitespace/punctuation decoration and strip non-identity
    parentheticals. Returns (clean_title, notes, ambiguous_reason)."""
    notes, ambiguous = [], None
    t = (raw or "").translate(_DASHES).replace(" ", " ")
    if _FOOTNOTE_BRACKET.search(t):
        t = _FOOTNOTE_BRACKET.sub(" ", t)
        notes.append("footnote-bracket")
    # trailing footnote stars/daggers on any token ("French**", "II*")
    if re.search(r"[*†]", t):
        t = re.sub(r"[*†]+", "", t)
        notes.append("footnote-mark")
    # parentheticals
    def _paren(m):
        nonlocal ambiguous
        inner = m.group(1).strip()
        if _PAREN_MULTILEVEL.match(inner):
            ambiguous = f"multi-level parenthetical ({inner!r})"
            return " "
        if _PAREN_SCORE.match(inner):
            notes.append(f"score-band ({inner})")
            return " "
        if _PAREN_POLICY.match(inner):
            notes.append(f"policy-note ({inner})")
            return " "
        if _PAREN_COURSE.match(inner):
            notes.append(f"local-course ({inner})")
            return " "
        notes.append(f"kept-parenthetical ({inner})")
        return m.group(0)
    t = re.sub(r"\(([^()]*)\)", _paren, t)
    # bare trailing score clauses without parens ("Score of 4 or 5")
    t2 = re.sub(r"[,\s-]*\bScore of [\d,\s\w]+$", " ", t, flags=re.I)
    if t2 != t:
        notes.append("bare-score-clause")
        t = t2
    # "Complete both" riders make the row span two exams → ambiguous
    if re.search(r"\bcomplete both\b", t, re.I):
        ambiguous = ambiguous or "spans multiple exams ('Complete both')"
    t = re.sub(r"\s+", " ", t).strip(" -–,;:")
    return t, notes, ambiguous


# ── normalized match key ─────────────────────────────────────────────────────

_ABBREV = {
    "lit": "literature",
    "interp": "interpreting",
    "trig": "trigonometry",
    "civ": "civilization",
    "devel": "development",
    "princ": "principles",
    "intro": "intro", "introduction": "intro", "introductory": "intro",
    "macroecon": "macroeconomics", "microecon": "microeconomics",
    "&": "and",
    "exam": "", "exams": "",
}
# Dropped from keys entirely — colleges include/omit them freely ("History of
# the United States I" / "History, U.S. I" / "Intro to Sociology").
_STOPWORDS = {"of", "the", "to"}
# 'll' / 'lll' = the lowercase-L typo for roman II/III seen in MAP data.
_LEVEL_TOKENS = {"1": "i", "2": "ii", "3": "iii", "one": "i", "two": "ii",
                 "three": "iii", "i": "i", "ii": "ii", "iii": "iii",
                 "ll": "ii", "lll": "iii"}
_CLEP_LANGS = ("french", "spanish", "german")


def normalize_key(title):
    """Reduce a cleaned title to a comparison key: lowercase, punctuation to
    spaces, abbreviations expanded, US spellings folded, 2-D/3-D unified,
    'Level 2'→'level ii'. Deterministic — the same key from either side of the
    raw↔family comparison means the same exam."""
    t = title.lower()
    t = re.sub(r"\b([23])[\s-]?d\b", r"\1d", t)          # 2-D / 2 D / 2D → 2d
    t = re.sub(r"\bunited states\b", "us", t)
    t = t.replace("u.s.", "us")
    # a digit glued to a CLEP language word is a footnote artifact ("German1")
    t = re.sub(rf"\b({'|'.join(_CLEP_LANGS)})\d\b", r"\1", t)
    t = re.sub(r"[:,/\-–—]+", " ", t)
    toks = []
    for tok in t.split():
        tok = _ABBREV.get(tok.rstrip("."), tok.rstrip("."))
        if tok and tok not in _STOPWORDS:
            toks.append(tok)
    # fold "level <n>" (and a bare trailing level token after a CLEP language);
    # join split econ compounds ("Micro Economics")
    out = []
    i = 0
    while i < len(toks):
        tok = toks[i]
        if tok in ("level", "levels") and i + 1 < len(toks) and toks[i + 1] in _LEVEL_TOKENS:
            out.append("level")
            out.append(_LEVEL_TOKENS[toks[i + 1]])
            i += 2
            continue
        if tok in ("micro", "macro") and i + 1 < len(toks) and toks[i + 1] == "economics":
            out.append(tok + "economics")
            i += 2
            continue
        if tok == "pre" and i + 1 < len(toks) and toks[i + 1] == "calculus":
            out.append("precalculus")
            i += 2
            continue
        out.append(tok)
        i += 1
    # bare trailing numeral = a level in the CLEP language families
    # ("CLEP French Language: 2" → level ii)
    if (len(out) >= 2 and out[-1] in _LEVEL_TOKENS and out[-1] not in ("i",)
            and any(l in out for l in _CLEP_LANGS) and "level" not in out):
        out = out[:-1] + ["level", _LEVEL_TOKENS[out[-1]]]
    key = " ".join(out)
    key = re.sub(r"\b(\w+)( \1\b)+", r"\1", key)          # collapse word repeats
    return key


# Irreducible raw-key → family-key aliases (authored; receipted per row).
# These bridge gaps normalization can't close: short exam names colleges use
# for the College Board's longer official name, retired names (the Session-101
# AP art fold canonicals), and word-order flips.
ALIASES = {
    "ap english language": "ap english language and composition",
    "ap english literature": "ap english literature and composition",
    "ap government and political us": "ap us government and politics",
    "ap government and politics us": "ap us government and politics",
    "ap us government and political": "ap us government and politics",
    "ap government and politics comparative": "ap comparative government and politics",
    "ap studio art 2d design": "ap 2d art and design",
    "ap studio art 3d design": "ap 3d art and design",
    "ap studio art drawing": "ap drawing",
    # "CLEP United States I/II" = the History of the United States exams
    "clep us i": "clep history us i",
    "clep us ii": "clep history us ii",
    # "Spanish AND Writing" = the "Spanish with Writing" exam
    "clep spanish and writing level ii": "clep spanish with writing level ii",
    "clep spanish and writing level i": "clep spanish with writing level i",
}


def _with_language(key):
    """CLEP colleges often drop the word 'Language' ('CLEP French Level II');
    retry the key with it inserted after the language word."""
    for lang in _CLEP_LANGS:
        pat = rf"^clep {lang}\b(?! language)"
        if re.match(pat, key):
            return re.sub(rf"^clep {lang}", f"clep {lang} language", key, count=1)
    return None


def _truncate_after_roman(key):
    """Colleges append the exam's era subtitle after the roman numeral
    ('History of the United States I: Early Colonization to 1877', 'Western
    Civilization II: 1648 to Present') — the family name ends at the numeral.
    Returns the truncated key, or None if there is nothing to truncate."""
    m = re.match(r"^(.*?\b(?:i|ii|iii))\s+\S.*$", key)
    return m.group(1) if m else None


# ── planning ─────────────────────────────────────────────────────────────────

def load_families():
    """Existing unified titles + their raw-variant counts (the twin-pick
    weight) from kb/unified_titles.json."""
    ut = json.load(open(UT_PATH, encoding="utf-8"))
    titles = ut.get("titles") or ut
    weight = {}
    for _raw, entry in titles.items():
        if isinstance(entry, dict) and entry.get("unified_title"):
            u = entry["unified_title"]
            weight[u] = weight.get(u, 0) + 1
    return weight


def index_families(weight, family_detectors=None):
    """key -> [family titles]. Only titles belonging to a FAMILIES brand are
    indexed (we never retarget across brands)."""
    detectors = family_detectors or FAMILIES
    idx = {}
    for title in weight:
        if not any(f["detect"].match(title) for f in detectors.values()):
            continue
        idx.setdefault(normalize_key(title), []).append(title)
    return idx


def pick_target(cands, weight, exact_hits):
    """Deterministic twin resolution: most raw variants (boosted by this run's
    exact-tier hits, so key-tier rows converge on the same twin the verbatim
    raws anchor), then shortest title, then alphabetical."""
    ranked = sorted(cands, key=lambda t: (
        -(weight.get(t, 0) + exact_hits.get(t, 0)), len(t), t))
    return ranked[0], (ranked[1:] if len(ranked) > 1 else [])


def build_plan(queue, weight, assigned_raws, family_detectors=None):
    detectors = family_detectors or FAMILIES
    idx = index_families(weight, detectors)
    exact = {t: t for t in weight
             if any(f["detect"].match(t) for f in detectors.values())}
    plan = {"seeded": [], "ambiguous": [], "no_match": [], "skipped_assigned": []}

    # Pass 1 — classify every row; exact-tier seeds resolve immediately and
    # their targets feed the twin-pick boost for pass 2.
    exact_hits, key_rows = {}, []
    for raw in queue:
        clean, notes, ambiguous = cleanup(raw)
        fam = next((name for name, f in detectors.items() if f["detect"].match(clean)), None)
        if not fam:
            continue  # not a brand this pass covers
        if raw in assigned_raws:
            plan["skipped_assigned"].append({"raw": raw, "family": fam})
            continue
        if ambiguous:
            plan["ambiguous"].append({"raw": raw, "family": fam, "reason": ambiguous})
            continue
        rec = {"raw": raw, "family": fam, "issuer": detectors[fam]["issuer"],
               "stripped": notes}
        if clean in exact:
            rec.update(target=clean, via="exact")
            plan["seeded"].append(rec)
            exact_hits[clean] = exact_hits.get(clean, 0) + 1
            continue
        key_rows.append((rec, clean))

    # Pass 2 — key-tier resolution through the alias/language/subtitle ladder.
    for rec, clean in key_rows:
        key = normalize_key(clean)
        key = ALIASES.get(key, key)
        cands = idx.get(key)
        if not cands:
            lk = _with_language(key)
            if lk:
                cands = idx.get(ALIASES.get(lk, lk))
        if not cands:
            tk = _truncate_after_roman(key)
            if tk:
                tk = ALIASES.get(tk, tk)
                lk = _with_language(tk)
                cands = idx.get(tk) or (idx.get(ALIASES.get(lk, lk)) if lk else None)
        if cands:
            target, twins = pick_target(cands, weight, exact_hits)
            rec.update(target=target, via="key")
            if twins:
                rec["twins_passed_over"] = twins
            plan["seeded"].append(rec)
        else:
            plan["no_match"].append({"raw": rec["raw"], "family": rec["family"],
                                     "clean": clean, "key": key})
    return plan


def load_queue():
    audit = json.load(open(AUDIT_PATH, encoding="utf-8"))
    return [c["raw_title"] for c in audit.get("title_cards", [])
            if "unclassified_in_map" in (c.get("tags") or [])]


def load_assigned():
    try:
        overlay = json.load(open(OVERLAY_PATH, encoding="utf-8"))
        return set(overlay.get("assignments", {}))
    except (FileNotFoundError, ValueError):
        return set()


# ── apply lane (service key; the sandbox uses the Supabase MCP instead) ──────

def apply_plan(seeded):
    import urllib.request
    url = os.environ.get("SUPABASE_URL",
                         "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not key:
        sys.exit("Set SUPABASE_SERVICE_KEY to apply (or upsert plan.json via the "
                 "Supabase MCP from an agent session).")
    # Fresh-read at write time (the Rule-7 lesson): skip raws that gained a live
    # assignment since the plan was generated — a curator pick always wins.
    req = urllib.request.Request(
        f"{url}/rest/v1/kb_curation?select=course_id"
        f"&course_id=like.{KEY_PREFIX}%25&field=eq.{FIELD_TITLE}",
        headers={"apikey": key, "Authorization": f"Bearer {key}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        live = {row["course_id"][len(KEY_PREFIX):] for row in json.load(r)}
    rows = []
    skipped = 0
    for rec in seeded:
        if rec["raw"] in live:
            skipped += 1
            continue
        for field, value in ((FIELD_TITLE, rec["target"]), (FIELD_ISSUER, rec["issuer"])):
            rows.append({"course_id": KEY_PREFIX + rec["raw"], "field": field,
                         "value": value, "reviewer_email": REVIEWER})
    for i in range(0, len(rows), 100):
        chunk = rows[i:i + 100]
        req = urllib.request.Request(
            f"{url}/rest/v1/kb_curation", method="POST",
            data=json.dumps(chunk).encode(),
            headers={"apikey": key, "Authorization": f"Bearer {key}",
                     "Content-Type": "application/json",
                     "Prefer": "resolution=merge-duplicates,return=minimal"})
        urllib.request.urlopen(req, timeout=60).read()
    print(f"applied {len(rows)} kb_curation rows "
          f"({len(rows) // 2} assignments; {skipped} skipped — already live)")


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    apply = "--apply" in sys.argv
    queue = load_queue()
    weight = load_families()
    plan = build_plan(queue, weight, load_assigned())

    print(f"queue: {len(queue)} unclassified | seeded: {len(plan['seeded'])} | "
          f"ambiguous: {len(plan['ambiguous'])} | no-match: {len(plan['no_match'])} | "
          f"already-assigned: {len(plan['skipped_assigned'])}")
    for rec in plan["seeded"]:
        twin = f"  (twins passed over: {rec['twins_passed_over']})" if rec.get(
            "twins_passed_over") else ""
        print(f"  SEED [{rec['via']:5}] {rec['raw']!r}\n"
              f"        → {rec['target']!r} · {rec['issuer']}{twin}")
    for rec in plan["ambiguous"]:
        print(f"  AMBIG {rec['raw']!r} — {rec['reason']}")
    for rec in plan["no_match"]:
        print(f"  NOMATCH {rec['raw']!r} (clean={rec['clean']!r} key={rec['key']!r})")

    os.makedirs(OUTDIR, exist_ok=True)
    receipt = os.path.join(OUTDIR, "plan.json")
    with open(receipt, "w", encoding="utf-8") as f:
        json.dump({
            "_about": ("Pre-seed plan for the CER unclassified-triage worklist: "
                       "brand-family raws mapped to EXISTING house families by "
                       "deterministic normalization (kb/_preseed_unclassified.py). "
                       "Applied rows carry reviewer_email 'preseed-v1@bot' in "
                       "kb_curation's _UNCLASSIFIED:: namespace."),
            "_generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "queue_count": len(queue),
            "counts": {k: len(v) for k, v in plan.items()},
            **plan,
        }, f, indent=1, ensure_ascii=False)
        f.write("\n")
    print(f"receipt: {receipt}")

    if apply:
        apply_plan(plan["seeded"])
    else:
        print("dry-run — review the receipt, then --apply (or upsert via MCP).")


if __name__ == "__main__":
    main()
