#!/usr/bin/env python3
"""slash_titles.py — a slash joining words in a canonical credential title is written "and".

SAM'S RULING, in session (S679), 2026-11-18 at about 01:10Z, verbatim:
    "I believe I replaced the / with and to avoid formatting issues and should be a general rule for other titles.
    UA Plumbers and Pipefitters"

The S679 conductor drew the line, which Sam can revise:
  (a) A slash joining words becomes " and ": "Carpenters Apprenticeship — Drywall/Lather" is "Carpenters
      Apprenticeship — Drywall and Lather". Three or more words in one chain take commas: "Pastry/Chocolate/Sugar"
      is "Pastry, Chocolate, and Sugar".
  (b) A CODE SLASH stays. A slash is a code slash when the token on each side of it is a code: it holds a digit
      (SP/2, MACS/609, B2.2/B2.2M, D1.1/D1.3, S-130/S-190, 3A/3B, H07/H47) or is written in capitals (FRA/FRO,
      CAD/CAM, TCP/IP, IBEW/NECA, HVAC/R). One side a code and the other a word is a word join: "OSHA 30/Extension
      Review" is "OSHA 30 and Extension Review".
  (c) An OFFICIAL-NAME SLASH stays (Sam's ruling of 2026-11-11, the certification's official name first;
      kb/cert_naming.py). A slash is an official-name slash when the words on its two sides are a pair an official
      name prints (each slash pair in cert_naming.ASE and cert_naming.MIL, such as "Electrical/Electronic") and the
      title names that issuer (ASE), or when the title holds a phrase in OFFICIAL_PHRASES below.

What this module owns: the rule (and_form, slashes), the plan that carries the rule through the reviewed rename route
(kb/cred_rename_plans/2026-11-18_slash_to_and.json; kb/ruled_renames.py reads it in the dry run and the apply,
cred-rename-apply.yml with only_plan=slash-to-and-2026-11-18), and the guard: `--check` fails when a canonical title in
kb/credentials.json holds a word-joining slash that no plan entry covers, so a new one is named at build time and
carried through the same route. Old titles stay search aliases (kb/credential_aliases.py reads the apply's receipt).

The S679 conductor's three rulings on COBIx's review of #3479 (comment 6966714099), 2026-11-18:
  (d) A SPACED SLASH BETWEEN TWO WHOLE NAMES is held for a person, never planned: " / " where either side already
      holds " and " or both sides are full titles (two or more words each). "DSST A History of the Vietnam War /
      Civil War and Reconstruction" names two DSST exams; written "and" it reads as one. A side runs from the slash
      to the title's edge, a dash, a colon or the next spaced slash; the right side stops at an opening parenthesis.
  (e) "Medical/Surgical" is the standard nursing term, an official phrase: "Acute Medical/Surgical ..." keeps it.
  (f) A COMBINE is found on the title's key (case-folded, whitespace squashed), against every credential and every
      search alias in kb/credential_aliases.py: "Drywall And Lather" or an alias "Drywall and Lather" holds a rename
      to "Drywall and Lather".

The plan is append-only for applied entries. A rebuild keeps every committed entry whose old title has left
kb/credentials.json (it reads as done in kb/ruled_renames.py) and every committed entry the rule still plans as
written; it drops an unapplied entry the rule now holds, and adds each new word-joining slash title. A rename whose
"and" title is already a credential or an alias is a combine: it is held, listed under `held`, and never planned (a
person or a new plan names the merge).

Usage, from the repo root:
    python3 kb/slash_titles.py            write the plan
    python3 kb/slash_titles.py --check    fail when a word-joining slash title is not planned or held
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cert_naming  # noqa: E402

CREDENTIALS = os.path.join(HERE, "credentials.json")
OUT = os.path.join(HERE, "cred_rename_plans", "2026-11-18_slash_to_and.json")
PLAN_ID = "slash-to-and-2026-11-18"
WORDS = ("I believe I replaced the / with and to avoid formatting issues and should be a general rule for other "
         "titles. UA Plumbers and Pipefitters")
RULING = "Sam Lee, in session (S679), 2026-11-18 about 01:10Z: \"%s\"" % WORDS
DECIDED_BY = "Sam Lee (in session, S679)"
DECIDED_AT = "2026-11-18T01:10:00Z"

# Official names that print a slash, outside cert_naming's ASE tables. Each is the issuer's own title, as the issuer
# prints it; a title holding the phrase keeps the slash in it.
OFFICIAL_PHRASES = {
    "Fire Apparatus Driver/Operator": "California State Fire Training's certification title (Fire Apparatus "
                                      "Driver/Operator 1A, 1B and Tiller)",
    "Division/Group Supervisor": "NWCG's position and course title for S-339",
    "Medical/Surgical": "the standard nursing term for the adult acute-care specialty (the S679 conductor on COBIx's "
                        "review of #3479, 2026-11-18)",
}

_SLASH = re.compile(r"\s*/\s*")
_TOKEN_EDGE = "()[]{},;:\"'"


def _official_pairs():
    pairs = set()
    for table in (cert_naming.ASE, cert_naming.MIL):
        for name in table.values():
            for m in re.finditer(r"([A-Za-z][\w-]*)/([A-Za-z][\w-]*)", name):
                pairs.add((m.group(1).lower(), m.group(2).lower()))
    return pairs


OFFICIAL_PAIRS = _official_pairs()
_ASE_MARK = re.compile(r"\bASE\b")


def is_code(token):
    """A token is a code when it holds a digit or is written in capitals (one capital letter counts: HVAC/R)."""
    t = (token or "").strip(_TOKEN_EDGE)
    if not t:
        return False
    if re.search(r"\d", t):
        return True
    letters = re.sub(r"[^A-Za-z]", "", t)
    return bool(letters) and letters.isupper()


def _neighbors(title, m):
    left = title[:m.start()].split()
    right = title[m.end():].split()
    return (left[-1] if left else ""), (right[0] if right else "")


def slashes(title):
    """Each slash in the title with its reading: [(match, kind)], kind "code", "official" or "word"."""
    out = []
    t = title or ""
    keep = [(t.find(p), t.find(p) + len(p)) for p in OFFICIAL_PHRASES if p in t]
    ase = bool(_ASE_MARK.search(t))
    for m in _SLASH.finditer(t):
        lt, rt = _neighbors(t, m)
        if any(a <= m.start() < b for a, b in keep):
            kind = "official"
        elif is_code(lt) and is_code(rt):
            kind = "code"
        elif ase and (lt.strip(_TOKEN_EDGE).lower(), rt.strip(_TOKEN_EDGE).lower()) in OFFICIAL_PAIRS:
            kind = "official"
        else:
            kind = "word"
        out.append((m, kind))
    return out


_SIDE_STOP_LEFT = re.compile(r".*(?:\s[—–-]\s|:\s|\s/\s)")
_SIDE_STOP_RIGHT = re.compile(r"\s[—–-]\s|:\s|\s/\s|\s\(")


def sides(title, m):
    """The two names a spaced slash stands between: from the slash to the title's edge, a dash, a colon or the next
    spaced slash; the right side also stops at an opening parenthesis."""
    left = title[:m.start()]
    cut = _SIDE_STOP_LEFT.match(left)
    if cut:
        left = left[cut.end():]
    right = title[m.end():]
    cut = _SIDE_STOP_RIGHT.search(right)
    if cut:
        right = right[:cut.start()]
    return left.strip(), right.strip()


def whole_names(title, m):
    """The reason a spaced word slash stands between two whole names, or None. Either side holds " and ", or both
    sides are full titles (two or more words each)."""
    if not (m.group(0).startswith(" ") and m.group(0).endswith(" ")):
        return None
    left, right = sides(title, m)
    if re.search(r"\band\b", left) or re.search(r"\band\b", right):
        return "a spaced slash between two names, one of which already holds \"and\" (%s | %s)" % (left, right)
    if len(left.split()) >= 2 and len(right.split()) >= 2:
        return "a spaced slash between two full titles (%s | %s)" % (left, right)
    return None


def title_key(title):
    """The comparison key for a combine: case-folded, whitespace squashed."""
    return re.sub(r"\s+", " ", (title or "")).strip().casefold()


def word_slash(title):
    """True when the title holds a slash that joins words (the rule rewrites it)."""
    return any(k == "word" for _, k in slashes(title))


def and_form(title):
    """The title with each word-joining slash written "and"; a chain of three or more words takes commas. A code
    slash and an official-name slash stay as printed."""
    t = title or ""
    marks = slashes(t)
    if not any(k == "word" for _, k in marks):
        return t
    out, i, n = [], 0, len(marks)
    while i < n:
        m, kind = marks[i]
        if kind != "word":
            i += 1
            continue
        # A chain: consecutive word slashes with one token between each.
        j = i
        while j + 1 < n and marks[j + 1][1] == "word" and not t[marks[j][0].end():marks[j + 1][0].start()].strip().count(" "):
            j += 1
        out.append((i, j))
        i = j + 1
    res, pos = [], 0
    for i, j in out:
        chain = marks[i:j + 1]
        res.append(t[pos:chain[0][0].start()])
        if len(chain) == 1:
            res.append(" and ")
        else:
            for k, (m, _) in enumerate(chain):
                if k:
                    res.append(t[chain[k - 1][0].end():m.start()])
                res.append(", and " if k == len(chain) - 1 else ", ")
        pos = chain[-1][0].end()
    res.append(t[pos:])
    return re.sub(r"\s{2,}", " ", "".join(res)).strip()


def read(title):
    """{"title", "kind": "word" | "code" | "official" | None, "new", "kept": [the slashes kept, with their reading]}."""
    marks = slashes(title)
    kinds = {k for _, k in marks}
    kept = ["%s (%s)" % (title[max(0, m.start() - 12):m.end() + 12].strip(), k) for m, k in marks if k != "word"]
    kind = "word" if "word" in kinds else ("official" if "official" in kinds else ("code" if kinds else None))
    return {"title": title, "kind": kind, "new": and_form(title) if kind == "word" else title, "kept": kept}


def build(credentials, committed=None, aliases=None):
    """The plan doc. `committed` is the plan on disk, whose applied entries stay (append-only). `aliases` is
    kb/credential_aliases.load(): current title -> [its search aliases]."""
    creds = credentials or {}
    aliases = aliases or {}
    held = []
    plan = {}       # old -> new, for each title the rule renames today
    news = {}       # key of the "and" title -> [old titles]
    for title in sorted(creds):
        r = read(title)
        if r["kind"] != "word":
            continue
        whole = [w for m, k in slashes(title) if k == "word" for w in [whole_names(title, m)] if w]
        if whole:
            held.append({"old": title, "new": r["new"], "why": "; ".join(whole) + ": whole names, held for a person "
                         "(the S679 conductor, 2026-11-18)"})
            continue
        news.setdefault(title_key(r["new"]), []).append(title)
    owner = {}      # key -> [(the existing title or alias, the credential it names)]
    for t in creds:
        owner.setdefault(title_key(t), []).append((t, t))
    for cur, names in aliases.items():
        for a in names or []:
            owner.setdefault(title_key(a), []).append((a, cur))
    for key in sorted(news):
        olds = news[key]
        hits = [(t, c) for t, c in owner.get(key, []) if c not in olds]
        if hits:
            names = "; ".join(t if t == c else "%s (an alias of %s)" % (t, c) for t, c in hits)
            for old in olds:
                held.append({"old": old, "new": and_form(old), "why": "the \"and\" title matches an existing "
                             "credential or alias, case and spacing aside (%s): a combine, held for a person or a plan "
                             "that names the merge" % names})
            continue
        if len(olds) > 1:
            for old in olds:
                held.append({"old": old, "new": and_form(old), "why": "%d slash titles read as one \"and\" title "
                             "(%s): a combine, held" % (len(olds), "; ".join(olds))})
            continue
        plan[olds[0]] = and_form(olds[0])
    entries = []
    for e in (committed or {}).get("entries") or []:
        if e["old"] not in creds or plan.get(e["old"]) == e["new"]:
            entries.append(e)
    have = {e["old"] for e in entries}
    for old in sorted(plan):
        if old in have:
            continue
        r = read(old)
        why = "a slash joining words is written \"and\" (Sam, 2026-11-18)"
        if r["kept"]:
            why += "; kept as printed: " + "; ".join(r["kept"])
        entries.append({"old": old, "new": plan[old], "kind": "rename", "why": why})
    held.sort(key=lambda h: h["old"])
    kept = [{"title": t, "kind": r["kind"], "kept": r["kept"]}
            for t in sorted(creds) for r in [read(t)] if r["kind"] in ("code", "official")]
    return {
        "_about": "A frozen plan of credential renames ruled by Sam in session (S679), read by kb/ruled_renames.py in "
                  "the rename dry run and the apply (cred-rename-apply.yml, only_plan=%s). Built by "
                  "kb/slash_titles.py from kb/credentials.json; append-only. `held` lists the combines the plan "
                  "leaves for a person; `kept` lists each title whose slash stays, with the rule that keeps it. "
                  "Nothing here writes kb_curation." % PLAN_ID,
        "plan_id": PLAN_ID,
        "ruling": RULING,
        "decided_by": DECIDED_BY,
        "decided_at": DECIDED_AT,
        "rule": {"word": "a slash joining words becomes \" and \"; a chain of three or more takes commas",
                 "code": "a slash with a code on each side stays: the token holds a digit or is written in capitals",
                 "official": "a slash inside an official name stays: an ASE or ASE MIL test name's slash pair in a "
                             "title that names ASE (kb/cert_naming.py), or a phrase in OFFICIAL_PHRASES",
                 "official_phrases": OFFICIAL_PHRASES,
                 "whole_names": "a spaced slash between two whole names is held for a person: either side holds "
                                "\"and\", or both sides are full titles (two or more words each)",
                 "combine": "a rename whose \"and\" title matches a credential or a search alias in "
                            "kb/credential_aliases.py, case-folded and whitespace squashed, is held as a combine"},
        "entries": entries,
        "held": held,
        "kept": kept,
    }


def uncovered(credentials, plan):
    """Word-joining slash titles in kb/credentials.json that the plan neither renames nor holds."""
    covered = {e["old"] for e in plan.get("entries") or []} | {h["old"] for h in plan.get("held") or []}
    return sorted(t for t in (credentials or {}) if word_slash(t) and t not in covered)


def _load(path, default):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="fail when a canonical title joins words with a slash and the plan does not cover it")
    a = ap.parse_args(argv)
    creds = _load(CREDENTIALS, {})
    committed = _load(OUT, None)
    if a.check:
        if committed is None:
            sys.exit("kb/cred_rename_plans/2026-11-18_slash_to_and.json is missing: run python3 kb/slash_titles.py")
        left = uncovered(creds, committed)
        if left:
            sys.exit("%d canonical title(s) join words with a slash (Sam, 2026-11-18: written \"and\"), not in the "
                     "plan: %s. Run python3 kb/slash_titles.py and commit the plan; the rename apply carries it."
                     % (len(left), "; ".join(left[:5])))
        print("slash-to-and plan covers every word-joining slash title")
        return
    import credential_aliases  # noqa: E402  (the search aliases: a rename onto one is a combine)
    doc = build(creds, committed, credential_aliases.load(os.path.dirname(HERE)))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    print("plan %s: %d renames, %d held, %d kept" % (PLAN_ID, len(doc["entries"]), len(doc["held"]), len(doc["kept"])))


if __name__ == "__main__":
    main()
