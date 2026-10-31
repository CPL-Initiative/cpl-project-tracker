"""
The CER's nightly procedures run: settle what the procedures settle, ask the
classifier about the rest, and bring Sam only the exceptions.

Sam, 2026-10-18 ~02:55Z: "I want to be able to add more procedures to have you
classify and complete common exhibit titles and elements as we go. I don't
have enough time to curate the growing list and want to further automate so
curation is manageable." Lane: docs/reference/lanes/cer-procedures.md.

For each title waiting in the unclassified queue (kb/exhibit_audit/latest.json)
with no saved assignment, in order:

  1. The RULE procedures in kb/cer_procedures.json, each applied by code: the
     pre-seed lanes of kb/_preseed_unclassified.py (brand family, statewide
     catalog, NCCER, CSLB, apprenticeship trades, judgment singles) and the
     course-identity lookup (kb/unclassified_suggestions.json, Rule 5c).
  2. A quality gate on every proposal: a title left with a dangling word, a
     method word, a course code or a high school code is held, not proposed
     (the lanes written for July's 451 titles produce "for MUS 27" from
     "Portfolio for MUS 27" on today's queue).
  3. The CLASSIFIER, for every title no rule settles: the exhibit-
     canonicalization skill plus every guidance procedure plus the house
     families, through the cer-classify Edge Function (Sam's call 6, sheet 23:
     the model key stays in the function). A lane's proposal rides along as a
     hint. Results are cached in kb/cer_classified.json, so a title is asked
     about once, and again only when the procedures change.

Writes:
  kb/unclassified_preseed.json   the tab's pre-fills (the file it already reads)
  kb/cer_classified.json         the classifier's cache
  kb/cer_procedures_out/latest.json   per-procedure tallies and the Needs-you list
  kb/cer_procedures_out/saved/   a receipt for every save and every undo (--save)

SAVING (Sam, Open Asks Sheet 94 card 2, 2026-10-18: "save"; it revises his
2026-07-07 ruling that pre-seeds stay "ready to save but not yet saved"). With
--save on, every pre-fill no reason holds (a rule procedure settled it, or the
classifier is sure of it: confidence SURE or better, a clean title, no issuer
conflict) is written to kb_curation as the tab's own Save would write it, under
the cohort cer-procedure-<id>@bot of the procedure that decided it. Rule 10: a
fresh read at write time (a live row for the raw, whoever wrote it, holds the
save), INSERT-only with duplicates ignored, and the receipt is written before
the INSERT. One procedure, one cohort: `--undo <procedure>` takes its rows back
in one call. The daily sync then carries a saved row into the overlay and the
fold into the knowledge base, each under that cohort. A pre-fill a reason holds
comes to Needs you and waits for a person, as before.

The fold's own holds come here too: kb/_fold_unclassified.py holds a saved
assignment that conflicts with a human-reviewed classification by itself
(Sheet 94 card 1); its report's `held` joins the Needs-you list.

Run from repo root:
  python3 kb/_cer_procedures.py                 # rules + cached classifier results
  python3 kb/_cer_procedures.py --classify 400  # also ask about up to 400 titles
                                                #   (runner, SUPABASE_SERVICE_KEY)
  python3 kb/_cer_procedures.py --save on       # and save what no reason holds
  python3 kb/_cer_procedures.py --save preview  # list what would save, write no row
  python3 kb/_cer_procedures.py --undo brand-family   # take a procedure's rows back
  python3 kb/_cer_procedures.py --dry-run       # print the tallies, write nothing
"""
import argparse
import contextlib
import hashlib
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _preseed_unclassified as pre  # noqa: E402
from _preseed_null_issuers import restyle_title  # noqa: E402  (Rule 5g)

PROCEDURES = os.path.join(HERE, "cer_procedures.json")
SUGGESTIONS = os.path.join(HERE, "unclassified_suggestions.json")
CREDENTIALS = os.path.join(HERE, "credentials.json")
CLASSIFIED = os.path.join(HERE, "cer_classified.json")
# A rule asked for from the Exhibits tab (Sheet 149 card 2): the tab writes the request
# under this key; the routine builds the procedure off, naming the row in `request`.
REQUEST_PREFIX = "_CER_PROCEDURE_REQUEST::"
REPORT = os.path.join(HERE, "cer_procedures_out", "latest.json")
SAVED_DIR = os.path.join(HERE, "cer_procedures_out", "saved")
FOLD_DIR = os.path.join(HERE, "unclassified_fold")
UT_PATH = os.path.join(HERE, "unified_titles.json")
SKILL = os.path.join(ROOT, ".claude", "skills", "exhibit-canonicalization", "SKILL.md")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")
FUNCTION = "cer-classify"
CHUNK = 15          # titles per call: one call stays well inside the gateway's 150 s
WORKERS = 4
SURE = 0.85         # Rule 8: a confidence below this carries a note and comes to Sam
ISSUER_CCC = pre.ISSUER_CCC

# Lanes whose proposal is a hint for the classifier, never a settlement: their
# strip rules were written for July's queue and misread today's title shapes.
HINT_LANES = {"cx", "hs", "ic"}
IDENTITY_KINDS = ("ccn", "cid", "course")   # Rule 5c precedence; cos is a hint
# The high school and ROP rule (Sam, Open Asks Sheet 147 card 2, 2026-10-31): a high
# school, district, county office or ROP articulation, not an adult school or a
# training center, which stay with the classifier.
HS_ROP = re.compile(r"\bHS\b|\bHS-[A-Z]|\(HSA\)|high\s*school|\bROP\b|\bUSD\b|unified school|school district"
                    r"|county office of education|\b[A-Z]{1,3}COE\b", re.I)
EXAM_BRAND = re.compile(r"^\s*(?:AP|IB|CLEP|AICE|DSST)\b|\bAdvanced Placement\b", re.I)
_ISSUER_ACRONYM = re.compile(r"\s*\([A-Z][A-Za-z&.-]{1,9}\)\s*$")
SCHOOL = re.compile(r"\bHS\b|\bHS-[A-Z]|\(HSA\)|high\s*school|\bROP\b|\bUSD\b|unified school|adult school"
                    r"|school district|county office of education|\b[A-Z]{1,3}COE\b|training cent(?:er|re)",
                    re.I)


# ── procedures ───────────────────────────────────────────────────────────────

def read_procedures(path=PROCEDURES):
    """Every procedure in the store, on or off, checked. A malformed one stops the
    run: a rule nobody can read must not settle anything."""
    procs = json.load(open(path, encoding="utf-8"))["procedures"]
    seen = set()
    for p in procs:
        for k in ("id", "name", "kind", "on", "rule", "source"):
            if k not in p:
                raise ValueError("procedure %r lacks %r" % (p.get("id"), k))
        if p["id"] in seen:
            raise ValueError("procedure id %r appears twice" % p["id"])
        seen.add(p["id"])
        if p["kind"] not in ("rule", "guidance"):
            raise ValueError("procedure %r: kind must be rule or guidance" % p["id"])
        if p["kind"] == "rule" and not p.get("lanes"):
            raise ValueError("rule procedure %r names no lanes" % p["id"])
        if not (p["source"].get("who") and p["source"].get("date") and p["source"].get("words")):
            raise ValueError("procedure %r: its source needs who, date and words" % p["id"])
        if p.get("request") and not str(p["request"]).startswith(REQUEST_PREFIX):
            raise ValueError("procedure %r: its request must be a %s row" % (p["id"], REQUEST_PREFIX))
    return procs


def load_procedures(path=PROCEDURES, include=()):
    """The procedures in force, in order, plus any off procedure `include` names
    (the dry run of a rule built for the Exhibits tab's Turn on)."""
    procs = read_procedures(path)
    unknown = set(include) - {p["id"] for p in procs}
    if unknown:
        raise ValueError("no procedure %s in %s" % (", ".join(sorted(unknown)), os.path.basename(path)))
    return [p for p in procs if p["on"] or p["id"] in include]


def off_lanes(path=PROCEDURES, include=()):
    """Lanes only an off rule procedure names. Their proposals reach nobody, not
    even the classifier as a hint, until the procedure is turned on: a rule the
    routine built waits for Turn on before it changes a single answer."""
    procs = read_procedures(path)
    on = {lane for p in procs if p["kind"] == "rule" and (p["on"] or p["id"] in include)
          for lane in p["lanes"]}
    return {lane for p in procs if p["kind"] == "rule" and not (p["on"] or p["id"] in include)
            for lane in p["lanes"]} - on


def lane_owners(procs):
    """lane → the rule procedure that owns it."""
    out = {}
    for p in procs:
        if p["kind"] == "rule":
            for lane in p["lanes"]:
                out[lane] = p["id"]
    return out


def procedures_hash(procs):
    """Changes when a procedure is added, turned off or reworded: the classifier's
    unsure answers are asked again then."""
    body = json.dumps([[p["id"], p["rule"]] for p in procs], ensure_ascii=False)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()[:12]


# ── the quality gate ─────────────────────────────────────────────────────────

_CONN = r"(?:for|and|of|the|by|or|with|to|in|a|an|at)"
_CODE_LEFT = re.compile(r"\b[A-Z]{2,8}(?:\s[A-Z]{2,4})?[\s-]?\d{1,4}[A-Z]{0,2}\b")
_KEEPS_NUMBER = re.compile(r"\b(?:Level|Part|Period|Class|Grade|Unit|Module|Book|Year)\s", re.I)


def residue(title, issuer="", via=""):
    """Why a proposed title cannot stand as written, or [] when it can."""
    t = title or ""
    why = []
    if not t.strip():
        return ["empty title"]
    if pre.AP.is_official(t):
        return []   # College Board's own exam name stands as written ("AP Computer Science A" ends in A)
    if re.match(r"^%s\b" % _CONN, t, re.I) or re.search(r"\b%s$" % _CONN, t, re.I):
        why.append("a dangling word")
    if re.search(r"^[-–(,:;/&]|[-–(,:;/&]$", t.strip()):
        why.append("a dangling mark")
    if issuer == ISSUER_CCC and re.search(
            r"credit\s*by\s*exam|portfolio|\bCBE\b|\bexam\b|challenge|high\s*school\s*articulation"
            r"|\bnoncredit for\b", t, re.I):
        why.append("a method word left in")
    if (via in HINT_LANES or issuer == ISSUER_CCC) and _CODE_LEFT.search(t) and not _KEEPS_NUMBER.search(t):
        why.append("a course code left in")
    if "\xa0" in t or "  " in t or re.search(r"\(\s|\s\)|\(\)", t):
        why.append("stray spacing")
    if re.search(r"\bHS[- ]?[A-Z]{2,}\b|\([A-Z]{2,6}USD\)", t):
        why.append("a high school code left in")
    letters = [c for c in t if c.isalpha()]
    if len(letters) > 6 and sum(c.isupper() for c in letters) / len(letters) > 0.85 and issuer == ISSUER_CCC:
        why.append("all capitals")
    return why


def is_military_code(raw):
    """An ACE military course number (AR-1728-0188) is never a high school code."""
    return bool(re.match(r"^\s*[A-Z]{2}-\d{4}-\d{4}", raw or ""))


# ── the rule procedures ──────────────────────────────────────────────────────

def _title_case(t):
    letters = [c for c in t if c.isalpha()]
    if letters and sum(c.isupper() for c in letters) / len(letters) > 0.85:
        small = {"and", "of", "the", "for", "in", "to", "a", "an", "or", "with", "on", "at"}
        words = t.lower().split()
        return " ".join(w if (i and w in small) else w[:1].upper() + w[1:] for i, w in enumerate(words))
    return t


_STOP = {"the", "of", "and", "in", "for", "a", "an", "to", "with", "on", "or", "i", "ii", "iii",
         "introduction", "intro", "principles", "fundamentals", "elementary", "beginning",
         "intermediate", "advanced", "basic", "credit", "exam", "course"}


def _words(t):
    return {w for w in re.findall(r"[a-z]+", (t or "").lower()) if len(w) > 2 and w not in _STOP}


def shares_words(raw, title):
    """The (subject, number) join can land on another college's course: HIST 035
    History of African Americans joined Western Civilization II. A raw title
    that describes its course must share at least half the identity title's
    words; a raw title that is only a code has nothing to check."""
    mine = _words(re.sub(r"^[A-Z]{2,8}[\s-]?\d{1,4}[A-Z]{0,2}\s*:?", "", raw.strip()))
    theirs = _words(title)
    if len(mine) < 2 or not theirs:
        return True
    return len(mine & theirs) * 2 >= len(theirs)


def identity_proposal(raw, suggestions):
    """Rule 5c: the course's CCN title, then C-ID, then the college's own title,
    issuer California Community Colleges. None when the title names a school
    (Rule 5f: the school issues it, and the classifier names the school)."""
    sug = suggestions.get(raw) or []
    if not sug or SCHOOL.search(raw) or is_military_code(raw):
        return None
    for kind in IDENTITY_KINDS:
        for s in sug:
            if s.get("kind") == kind and s.get("title") and shares_words(raw, s["title"]):
                anchor = {"ccn": "CCN", "cid": "C-ID"}.get(kind)
                note = ("Rule 5c: title anchored to %s %s" % (anchor, s.get("id")) if anchor
                        else "Rule 5c: the college's own title for %s" % s.get("code"))
                return {"title": restyle_title(_title_case(s["title"].strip())), "issuer": ISSUER_CCC,
                        "via": "identity", "confidence": 0.85 if anchor else 0.8,
                        "note": note + "; issuer = CCC."}
    return None


def school_proposal(raw, aligned, record):
    """The high school and ROP rule (Sam, Open Asks Sheet 147 card 2, 2026-10-31): the
    aligned course names the title (CCN, then C-ID, then M-ID, then the college's own
    course title, kb/_suggest_unclassified.py), and the school, district or county
    office the classifier named issues it, its trailing acronym dropped so one
    district reads one way. None for an exam brand (it keeps its own name), a title
    with no aligned course or two in its best tier, or no issuer named."""
    a = aligned.get(raw)
    issuer = _ISSUER_ACRONYM.sub("", ((record or {}).get("issuing_agency") or "").strip())
    if not a or a.get("ambiguous") or not HS_ROP.search(raw) or not issuer or EXAM_BRAND.search(raw):
        return None
    kind = {"ccn": "CCN", "cid": "C-ID", "mid": "M-ID"}.get(a["kind"])
    anchor = "%s %s" % (kind, a["id"]) if kind else "the college's own title for %s" % a["code"]
    return {"title": restyle_title(a["title"].strip()), "issuer": issuer, "via": "school", "confidence": 1.0,
            "note": "Sheet 147 card 2: the aligned course (%s at %s) names it, %s; the school issues it."
                    % (a["code"], a["college"], anchor)}


def settle(waiting, lanes, suggestions, owners):
    """Apply the rule procedures to each waiting title.

    Returns (settled, hints, held): settled raw → proposal carrying `procedure`;
    hints raw → [proposals the classifier sees]; held raw → why, for a proposal
    the gate stopped or two procedures that disagree."""
    settled, hints, held = {}, {}, {}
    for raw in waiting:
        cands = []
        lane = lanes.get(raw)
        if lane and is_military_code(raw) and lane.get("via") == "hs":
            lane = None
        if lane:
            owner = owners.get(lane.get("via"))
            if owner and lane["via"] not in HINT_LANES:
                cands.append(dict(lane, procedure=owner))
            else:
                hints.setdefault(raw, []).append(dict(lane))
        if "identity" in owners:
            idp = identity_proposal(raw, suggestions)
            if idp:
                cands.append(dict(idp, procedure=owners["identity"]))
        for s in suggestions.get(raw) or []:
            if s.get("kind") == "cos":
                hints.setdefault(raw, []).append(
                    {"title": s.get("title"), "issuer": s.get("org") or "", "via": "cos",
                     "note": "CareerOneStop names a credential like this one (%s)." % s.get("id")})
        clean = []
        for c in cands:
            why = residue(c["title"], c.get("issuer", ""), c.get("via", ""))
            if why:
                hints.setdefault(raw, []).append(dict(c, held_for=why))
            else:
                clean.append(c)
        titles = {pre.normalize_key(c["title"]) for c in clean}
        if len(titles) > 1:
            held[raw] = {"why": "two procedures disagree",
                         "proposals": [{"procedure": c["procedure"], "title": c["title"],
                                        "issuer": c.get("issuer", "")} for c in clean]}
            hints.setdefault(raw, []).extend(clean)
        elif clean:
            settled[raw] = max(clean, key=lambda c: c.get("confidence") or 0)
    return settled, hints, held


def issuer_conflicts(proposals, cred_issuers):
    """raw → why, where a proposal's title is an existing credential issued by
    someone else: saving it would join two issuers under one title."""
    out = {}
    for raw, rec in proposals.items():
        have = cred_issuers.get(rec["title"])
        mine = (rec.get("issuer") or "").strip()
        if have and mine and mine not in have:
            out[raw] = "a merge would join two issuers (%s; the reference has %s)" % (
                mine, ", ".join(sorted(have)))
    return out


def load_cred_issuers(path=CREDENTIALS):
    try:
        creds = json.load(open(path, encoding="utf-8"))
    except (OSError, ValueError):
        return {}
    out = {}
    for title, recs in creds.items():
        names = {(r.get("issuing_agency") or "").strip() for r in recs if isinstance(r, dict)}
        names.discard("")
        out[title] = names
    return out


# ── the classifier ───────────────────────────────────────────────────────────

def rules_text(procs, skill_text, families):
    """The classifier's standing instructions: the skill, every guidance
    procedure in force, the rule procedures for context, and the house
    families it should join rather than re-name."""
    lines = [skill_text.rstrip(), "", "---", "", "# Procedures in force",
             "",
             "Sam adds procedures as the work goes. Apply every one below; when a "
             "procedure and a skill rule disagree, the procedure is newer and wins. Name "
             "in `procedures` the ids of the procedures (or the skill rules) your answer "
             "rests on.", ""]
    for p in procs:
        src = p["source"]
        lines.append("- `%s` (%s, %s %s): %s" % (p["id"], p["kind"], src["who"], src["date"], p["rule"]))
    lines += ["", "# House families", "",
              "Titles already in the reference, each with its issuer. Join one of these "
              "names exactly when the row names the same credential (Rule 5d, Rule 8c); "
              "otherwise give a new title.", ""]
    for title in sorted(families):
        iss = families[title]
        lines.append("- %s%s" % (title, (" | " + "; ".join(sorted(iss))) if iss else ""))
    return "\n".join(lines) + "\n"


# ── the college's own course, for a title that is only a code ──────────────
# Rule 5c: "a code-only title invokes the lookup" (Sam, 2026-07-07). The
# classifier cannot read the course catalog, so on the first pass it named
# "Discipline Exam - CS 119" "Computer Science (CS 119)"; the college's own
# course is Programming in Python. The run looks the code up in COCI at the
# college that entered the title and hands the title on as a hint.
_TRAIL_CODE = re.compile(r"(?:^|[\s:,(\-])(?:for\s+)?(?P<subj>[A-Za-z][A-Za-z&/.]{0,9}(?:\s[A-Za-z]{1,6})?)"
                         r"[\s.\-]+0*(?P<num>\d{1,4}[A-Za-z]{0,2})\s*\)?\s*$")
_NC_AT = re.compile(r"^NC\.(?P<subj>[A-Za-z]{2,8})-0*(?P<num>\d{1,4}[A-Za-z]{0,2})\s+at\s+", re.I)
_METHOD_WORDS = re.compile(r"\b(?:discipline|examination|exam|portfolio|review|for|noncredit|non-credit|"
                           r"industry|credit|by|cbe|challenge|test|completion)\b", re.I)
_NOT_A_SUBJECT = re.compile(r"^(?:score|area|level|part|period|type|grade|unit|for)$", re.I)
EXAM_BRANDS = {"AP", "IB", "CLEP", "AICE", "DSST"}


def code_only(raw):
    """(subject, number) when the title names a course by its code and little
    else, or None. An exam brand's parenthetical is its local target course,
    never its identity, so AP/IB/CLEP titles are never read this way."""
    t = " ".join((raw or "").replace("\xa0", " ").split())
    if not t or t.split()[0].strip('"').upper() in EXAM_BRANDS:
        return None
    m = _NC_AT.match(t)
    if m:
        return m.group("subj"), m.group("num")
    m = _TRAIL_CODE.search(t)
    if not m:
        return None
    subj = re.sub(r"^for\s+", "", m.group("subj"), flags=re.I)
    if _NOT_A_SUBJECT.match(subj.split()[0]):
        return None
    rest = _METHOD_WORDS.sub(" ", t[:m.start()])
    if len(re.findall(r"[A-Za-z]{3,}", rest)) >= 2:
        return None  # the title already describes its course
    return subj, m.group("num")


def catalog_hints(raws, cards, index=None):
    """raw → a hint naming the college's own course title, for each code-only
    title COCI resolves to one title at the colleges that entered it. `index`
    is _suggest_unclassified.build_coci_index()'s college-scoped index; it is
    built only when some title needs it, and a missing catalog adds no hint."""
    want = {r: code_only(r) for r in raws}
    want = {r: v for r, v in want.items() if v}
    if not want:
        return {}
    import _suggest_unclassified as sug
    if index is None:
        try:
            index = sug.build_coci_index()[1]
        except Exception as exc:  # openpyxl or the catalog file missing
            print("catalog hints: the course catalog did not load (%s)" % str(exc).splitlines()[0][:120])
            return {}
    out = {}
    for raw, (subj, num) in want.items():
        found = {}
        for college in (cards.get(raw) or {}).get("colleges") or []:
            e = index.get((sug.norm_college(college), sug.norm_subj(subj), sug.norm_num(num)))
            if e and e["titles"]:
                found[e["titles"].most_common(1)[0][0]] = college
        if len(found) == 1:
            title, college = next(iter(found.items()))
            out[raw] = {"title": _title_case(title.strip()), "issuer": ISSUER_CCC, "via": "catalog",
                        "note": "%s's own course %s %s is titled %s in COCI." % (college, subj, num, title.strip())}
    return out


def hints_key(hints):
    return hashlib.sha256(json.dumps([[h.get("title"), h.get("via")] for h in hints],
                                     ensure_ascii=False).encode("utf-8")).hexdigest()[:10]


def classifier_row(raw, colleges, meta, hints):
    return {"raw_title": raw,
            "cpl_types": [meta["cpl_type"]] if meta.get("cpl_type") else [],
            "articulating_colleges_sample": (colleges or [])[:3],
            "hints": [{"title": h.get("title"), "issuer": h.get("issuer") or None,
                       "from": h.get("procedure") or h.get("via"),
                       "held_for": h.get("held_for")} for h in hints]}


def post(body, key, timeout=200):
    req = urllib.request.Request(
        "%s/functions/v1/%s" % (SUPABASE_URL, FUNCTION), data=json.dumps(body).encode(),
        headers={"Authorization": "Bearer " + key, "apikey": key,
                 "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        return {"error": "HTTP %d: %s" % (exc.code, exc.read().decode()[:300])}
    except Exception as exc:  # network, timeout
        return {"error": str(exc).splitlines()[0][:300]}


def classify(rows, rules, key, chunk=CHUNK, workers=WORKERS, call=post):
    """Ask about rows in chunks; returns (records by raw, calls). A chunk that
    fails is retried once, then its titles stay unasked for the next night."""
    chunks = [rows[i:i + chunk] for i in range(0, len(rows), chunk)]

    def one(ch):
        got = {}
        for attempt in (1, 2):
            got = call({"rules": rules, "rows": ch}, key)
            if not got.get("error"):
                break
            time.sleep(5 * attempt)
        return ch, got

    out, calls = {}, []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for ch, got in pool.map(one, chunks):
            calls.append({"titles": len(ch), "error": got.get("error"),
                          "usage": got.get("usage"), "model": got.get("model"), "ms": got.get("ms")})
            # The model hands back a title with its non-breaking spaces as plain
            # ones (105 of 1,118 on the first pass), so an answer is matched on
            # the title's spacing-free form and keyed by the title as asked.
            asked = {_spacing_key(r["raw_title"]): r["raw_title"] for r in ch}
            for rec in got.get("records") or []:
                raw = asked.get(_spacing_key(rec.get("raw_title")))
                if raw is not None:
                    out[raw] = dict(rec, raw_title=raw)
    return out, calls


def _spacing_key(t):
    return " ".join((t or "").replace("\xa0", " ").split())


def cost_usd(calls):
    """Claude Opus 5.5 list prices: $4 in, $20 out, $5 cache write, $0.20 cache
    read, per million tokens."""
    total = 0.0
    for c in calls:
        u = c.get("usage") or {}
        total += (u.get("input_tokens", 0) * 4 + u.get("output_tokens", 0) * 20
                  + u.get("cache_creation_input_tokens", 0) * 5
                  + u.get("cache_read_input_tokens", 0) * 0.2) / 1e6
    return round(total, 2)


def as_proposal(rec, families=()):
    """A classifier record as a pre-fill. Its confidence is the lower of title
    and issuer; a new title is styled by Rule 5g, a house family kept as written."""
    conf = min(rec.get("confidence_title") or 0, rec.get("confidence_issuer") or 0
               if rec.get("issuing_agency") else (rec.get("confidence_title") or 0))
    title = (rec.get("unified_title") or "").strip()
    out = {"title": title if title in families else restyle_title(title),
           "issuer": (rec.get("issuing_agency") or "").strip(),
           "via": "classifier", "confidence": round(conf, 2),
           "note": rec.get("_notes") or "", "procedure": "classifier",
           "rests_on": rec.get("procedures") or []}
    if rec.get("training_agency"):
        out["trainer"] = rec["training_agency"].strip()
    return out


# ── what the fold held ───────────────────────────────────────────────────────

def fold_held(fold_dir=FOLD_DIR):
    """The saved assignments the last fold held, each with why. Since Sheet 94
    card 1 (2026-10-18) kb/_fold_unclassified.py holds a conflict with a
    human-reviewed classification, or a raw whose articulation rows carry another
    title, by itself and lists it in its report's `held`; an older report listed
    the conflicts as `conflict`. Each becomes a Needs-you entry."""
    try:
        days = sorted(d for d in os.listdir(fold_dir) if re.match(r"^\d{4}-\d{2}-\d{2}$", d))
    except OSError:
        return []
    for day in reversed(days):
        path = os.path.join(fold_dir, day, "report.json")
        if not os.path.exists(path):
            continue
        try:
            rep = json.load(open(path, encoding="utf-8"))
        except ValueError:
            continue
        held = rep.get("held")
        if held is None:
            held = [dict(c, kind="conflict") for c in rep.get("conflict") or []]
        out = []
        for h in held:
            who = (h.get("reviewed_by") or "").split("@")[0] or "a curator"
            standing = h.get("standing")
            if standing is None:  # an older report: read the titles out of the sentence
                standing = sorted(set(re.findall(r"-> '([^']+)'", h.get("why") or "")))
            out.append({"raw_title": h["raw"], "why": "the fold held the saved assignment: " + h["why"],
                        "proposal": {"title": h.get("assigned") or "", "issuer": h.get("issuer") or "",
                                     "procedure": "the assignment %s saved" % who},
                        "standing": standing, "kind": h.get("kind") or "conflict", "fold_report": day})
        return out
    return []


# ── saving under a procedure (Sheet 94 card 2) ───────────────────────────────

UNCLASS = "_UNCLASSIFIED::"
FIELD_TITLE = "unified_title_assignment"
FIELD_ISSUER = "issuing_agency_assignment"
PAGE = 1000          # Rule 10b: kb_curation reads are Range-paginated (#718)
ATTEMPTS = 5
TRANSIENT_HTTP = {429, 500, 502, 503, 504}
RULING = ("Open Asks Sheet 94 card 2 (Sam, 2026-10-18, 'save'): a result the classifier is sure of "
          "saves under its procedure, reversible by procedure")


def cohort_of(procedure_id):
    """The reviewer_email a procedure's saves carry: cer-procedure-<id>@bot. One
    procedure, one cohort, so a procedure is undone in one call."""
    slug = re.sub(r"[^a-z0-9]+", "-", (procedure_id or "classifier").lower()).strip("-")
    return "cer-procedure-%s@bot" % slug


def _urlopen(req, timeout):
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    return json.loads(raw) if raw else []


def _write_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
        f.write("\n")


class Curation:
    """kb_curation's _UNCLASSIFIED:: rows through PostgREST, with the service key
    the workflow holds. The read is Range-paginated; the one write is an INSERT
    that ignores duplicates, so a row already there, whoever wrote it, wins; the
    one delete is by a procedure's cohort."""

    def __init__(self, key, url=SUPABASE_URL, transport=_urlopen, sleep=time.sleep):
        self.base = url.rstrip("/") + "/rest/v1/kb_curation"
        self.key = key
        self.transport = transport
        self.sleep = sleep

    def _send(self, method, params, body=None, headers=None):
        qs = urllib.parse.urlencode(params, safe='(),."*', quote_via=urllib.parse.quote)
        h = {"apikey": self.key, "Authorization": "Bearer " + self.key, "Accept": "application/json"}
        if body is not None:
            h["Content-Type"] = "application/json"
        h.update(headers or {})
        req = urllib.request.Request(self.base + "?" + qs, method=method, headers=h,
                                     data=None if body is None else json.dumps(body).encode())
        for attempt in range(ATTEMPTS):
            try:
                return self.transport(req, 60)
            except urllib.error.HTTPError as exc:
                if exc.code not in TRANSIENT_HTTP or attempt == ATTEMPTS - 1:
                    raise
            except (urllib.error.URLError, OSError):
                if attempt == ATTEMPTS - 1:
                    raise
            self.sleep(2 ** attempt)

    def saved(self):
        """raw → its live title row, for every saved assignment, page by page."""
        out, start = {}, 0
        while True:
            rows = self._send("GET", {"select": "course_id,field,value,reviewer_email,reviewed_at",
                                      "course_id": "like." + UNCLASS + "*", "field": "eq." + FIELD_TITLE,
                                      "order": "course_id"},
                              headers={"Range-Unit": "items", "Range": "%d-%d" % (start, start + PAGE - 1)}) or []
            for r in rows:
                out[r["course_id"][len(UNCLASS):]] = r
            if len(rows) < PAGE:
                return out
            start += PAGE

    def insert(self, rows):
        return self._send("POST", {"on_conflict": "course_id,field"}, rows,
                          headers={"Prefer": "resolution=ignore-duplicates,return=representation"}) or []

    def undo(self, cohort):
        return self._send("DELETE", {"reviewer_email": "eq." + cohort, "course_id": "like." + UNCLASS + "*"},
                          headers={"Prefer": "return=representation"}) or []


def sure_rows(stage, report):
    """kb_curation rows for every pre-fill no reason holds: the title under its
    procedure's cohort, and the issuer when the proposal names one. A rule
    procedure's settlement is sure by the rule; the classifier's is sure at SURE
    or better, which is what keeps it out of needs_you."""
    held = {n["raw_title"] for n in report.get("needs_you") or []}
    rows = []
    for raw in sorted(stage.get("staged") or {}):
        p = stage["staged"][raw]
        title = (p.get("title") or "").strip()
        if raw in held or not title:
            continue
        proc = p.get("procedure") or "classifier"
        cohort = cohort_of(proc)
        rows.append({"course_id": UNCLASS + raw, "field": FIELD_TITLE, "value": title,
                     "reviewer_email": cohort, "procedure": proc})
        issuer = (p.get("issuer") or "").strip()
        if issuer:
            rows.append({"course_id": UNCLASS + raw, "field": FIELD_ISSUER, "value": issuer,
                         "reviewer_email": cohort, "procedure": proc})
    return rows


def save_sure(stage, report, cur, run_id="", preview=False, now=None, out=print):
    """Save every pre-fill no reason holds, under its procedure's cohort.

    Rule 10, enforced here: a fresh read at write time (a live row for the raw,
    whoever wrote it, holds the save: a curator's word, or last night's); the
    INSERT ignores duplicates; the receipt is written BEFORE the INSERT and names
    every row and its cohort, so --undo can take a procedure's rows back."""
    rows = sure_rows(stage, report)
    by_raw = {}
    for r in rows:
        by_raw.setdefault(r["course_id"][len(UNCLASS):], []).append(r)
    live = cur.saved()
    held = [{"raw_title": raw, "by": live[raw].get("reviewer_email"), "value": live[raw].get("value")}
            for raw in by_raw if raw in live]
    todo = [r for raw, rs in by_raw.items() if raw not in live for r in rs]
    tally = {}
    for r in todo:
        if r["field"] == FIELD_TITLE:
            tally[r["procedure"]] = tally.get(r["procedure"], 0) + 1
    out("save: %d title(s) to save under %d procedure(s); %d held by a live row%s"
        % (sum(tally.values()), len(tally), len(held), " (preview: nothing written)" if preview else ""))
    for proc, n in sorted(tally.items(), key=lambda kv: (-kv[1], kv[0])):
        out("  %-24s %4d  as %s" % (proc, n, cohort_of(proc)))
    summary = {"to_save": sum(tally.values()), "by_procedure": tally, "held_live": len(held)}
    if preview or not todo:
        return summary
    ts = (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H-%M-%SZ")
    os.makedirs(SAVED_DIR, exist_ok=True)
    path = os.path.join(SAVED_DIR, "saved_%s.json" % ts)
    receipt = {"table": "kb_curation", "mode": "save", "at": ts, "run_id": run_id, "ruling": RULING,
               "procedures_hash": report.get("procedures_hash"),
               "cohorts": sorted({r["reviewer_email"] for r in todo}),
               "held_live": held, "rows": todo, "result": "pending"}
    _write_json(path, receipt)
    got = cur.insert([{k: r[k] for k in ("course_id", "field", "value", "reviewer_email")} for r in todo])
    keys = {(g.get("course_id"), g.get("field")) for g in got}
    receipt["inserted"] = [r for r in todo if (r["course_id"], r["field"]) in keys]
    receipt["skipped_as_duplicate"] = [r for r in todo if (r["course_id"], r["field"]) not in keys]
    receipt["result"] = "written"
    _write_json(path, receipt)
    out("saved: %d row(s) inserted, %d skipped as duplicate; receipt %s"
        % (len(receipt["inserted"]), len(receipt["skipped_as_duplicate"]), os.path.relpath(path, ROOT)))
    summary.update(inserted=len(receipt["inserted"]), skipped=len(receipt["skipped_as_duplicate"]), receipt=path)
    return summary


def undo_procedure(procedure, cur, now=None, out=print):
    """Take back every row a procedure saved: one DELETE by its cohort. A curator's
    later save on the same raw carries the curator's email, so it stays. Rows the
    daily fold already carried into kb/unified_titles.json are counted, not
    changed: revert the fold commit that carries them."""
    cohort = cohort_of(procedure)
    removed = cur.undo(cohort)
    ts = (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H-%M-%SZ")
    folded = 0
    try:
        ut = json.load(open(UT_PATH, encoding="utf-8"))
        folded = sum(1 for e in ut.values() if isinstance(e, dict) and e.get("reviewed_by") == cohort)
    except (OSError, ValueError):
        pass
    os.makedirs(SAVED_DIR, exist_ok=True)
    path = os.path.join(SAVED_DIR, "undo_%s.json" % ts)
    _write_json(path, {"table": "kb_curation", "mode": "undo", "at": ts, "procedure": procedure,
                       "cohort": cohort, "removed": removed, "already_folded": folded})
    out("undo %s: %d row(s) removed from kb_curation; %d entries in kb/unified_titles.json carry this "
        "cohort (revert the fold commit that carried them); receipt %s"
        % (procedure, len(removed), folded, os.path.relpath(path, ROOT)))
    return {"removed": len(removed), "already_folded": folded, "receipt": path}


# ── the run ──────────────────────────────────────────────────────────────────

def run(classify_n=0, dry_run=False, key=None, call=post, now=None, catalog=True, save=None, cur=None,
        run_id="", include=()):
    if save in ("on", "preview") and cur is None and not key and not dry_run:
        # Before any file is written: a run that cannot save must not half-run.
        sys.exit("--save needs SUPABASE_SERVICE_KEY (the fresh read and the write go through it).")
    if include and not dry_run:
        sys.exit("an off procedure runs only in a dry run (--try); Turn on is the store's on flag.")
    procs = load_procedures(include=include)
    quiet = off_lanes(include=include)
    owners = lane_owners(procs)
    phash = procedures_hash(procs)
    audit = json.load(open(pre.AUDIT_PATH, encoding="utf-8"))
    cards = {c["raw_title"]: c for c in audit.get("title_cards", [])
             if "unclassified_in_map" in (c.get("tags") or [])}
    queue = list(cards)
    assigned = pre.load_assigned()
    waiting = [r for r in queue if r not in assigned]
    lanes, _residual, raw_meta = pre.stage_lanes(queue, pre.load_families(), assigned)
    lanes = {raw: lane for raw, lane in lanes.items() if lane.get("via") not in quiet}
    suggestions = (json.load(open(SUGGESTIONS, encoding="utf-8")).get("suggestions") or {}
                   if os.path.exists(SUGGESTIONS) else {})
    aligned = (json.load(open(SUGGESTIONS, encoding="utf-8")).get("aligned") or {}
               if os.path.exists(SUGGESTIONS) else {})
    cred_issuers = load_cred_issuers()

    settled, hints, held = settle(waiting, lanes, suggestions, owners)
    if catalog:
        for raw, h in catalog_hints([r for r in waiting if r not in settled], cards).items():
            hints.setdefault(raw, []).append(h)
    for raw, why in issuer_conflicts(settled, cred_issuers).items():
        held[raw] = {"why": why, "proposals": [{"procedure": settled[raw]["procedure"],
                                                "title": settled[raw]["title"],
                                                "issuer": settled[raw].get("issuer", "")}]}
        hints.setdefault(raw, []).append(settled.pop(raw))

    cache = json.load(open(CLASSIFIED, encoding="utf-8")) if os.path.exists(CLASSIFIED) else {}
    records = cache.get("records", {})
    # Asked once; asked again only while unsure, when the procedures or the
    # title's hints have changed since. A record from before hints were
    # fingerprinted (the 2026-10-18 first pass) had every hint but the catalog's.
    def asked_with(r):
        return records[r].get("hints") or hints_key([h for h in hints.get(r, []) if h.get("via") != "catalog"])
    need = [r for r in waiting if r not in settled and (
        r not in records or (as_proposal(records[r])["confidence"] < SURE and (
            records[r].get("rules") != phash or asked_with(r) != hints_key(hints.get(r, [])))))]
    calls = []
    if classify_n and need:
        if not key:
            sys.exit("--classify needs SUPABASE_SERVICE_KEY (the Edge Function takes only the service key).")
        families = {}
        for t, recs in json.load(open(CREDENTIALS, encoding="utf-8")).items():
            families[t] = {(r.get("issuing_agency") or "").strip() for r in recs if isinstance(r, dict)} - {""}
        rules = rules_text(procs, open(SKILL, encoding="utf-8").read(), families)
        ask = need[:classify_n]
        rows = [classifier_row(r, cards[r].get("colleges"), raw_meta.get(r) or {}, hints.get(r, []))
                for r in ask]
        got, calls = classify(rows, rules, key, call=call)
        stamp = (now or datetime.now(timezone.utc)).strftime("%Y-%m-%d")
        for raw, rec in got.items():
            records[raw] = dict(rec, rules=phash, hints=hints_key(hints.get(raw, [])), asked=stamp)
        print("classifier: asked %d of %d needing an answer; %d answered; %d calls; $%.2f"
              % (len(ask), len(need), len(got), len(calls), cost_usd(calls)))

    staged, by_proc = {}, {p["id"]: {"settled": 0, "held": 0, "sample": []} for p in procs}
    by_proc["classifier"] = {"settled": 0, "held": 0, "sample": []}
    needs_you = []
    for raw, rec in settled.items():
        staged[raw] = {k: v for k, v in rec.items() if k != "procedure"} | {"procedure": rec["procedure"]}
        t = by_proc[rec["procedure"]]
        t["settled"] += 1
        if len(t["sample"]) < 5:
            t["sample"].append([raw, rec["title"]])
    classified_proposals = {}
    for raw in waiting:
        if raw in settled or raw not in records:
            continue
        classified_proposals[raw] = as_proposal(records[raw], cred_issuers)
        if "school" in owners:
            sp = school_proposal(raw, aligned, records[raw])
            if sp:
                classified_proposals[raw] = dict(sp, procedure=owners["school"], rests_on=[owners["school"]])
    conflicts = issuer_conflicts(classified_proposals, cred_issuers)
    for raw, prop in classified_proposals.items():
        why = residue(prop["title"], prop["issuer"], "classifier")
        reason = None
        if why:
            reason = "the classifier's title has " + ", ".join(why)
        elif prop["confidence"] < SURE:
            reason = "the classifier is unsure (%.2f)" % prop["confidence"]
        elif raw in conflicts:
            reason = conflicts[raw]
        elif raw in held:
            reason = held[raw]["why"]
        if not why:
            staged[raw] = prop
        for pid in prop["rests_on"] or ["classifier"]:
            if pid in by_proc:
                by_proc[pid]["held" if reason else "settled"] += 1
        # A rule that replaced the classifier's answer (the high school and ROP rule)
        # counts under the rule alone; the classifier's tally is its own answers.
        own = prop.get("procedure") or "classifier"
        tally = by_proc[own]
        if own == "classifier":
            tally["held" if reason else "settled"] += 1
        if not reason and len(tally["sample"]) < 5:
            tally["sample"].append([raw, prop["title"]])
        if reason:
            needs_you.append({"raw_title": raw, "why": reason, "proposal": {
                "title": prop["title"], "issuer": prop["issuer"], "confidence": prop["confidence"],
                "note": prop["note"]}, "colleges": cards[raw].get("colleges") or []})
    for raw, h in held.items():
        if raw not in classified_proposals:
            needs_you.append({"raw_title": raw, "why": h["why"], "proposals": h["proposals"],
                              "colleges": cards[raw].get("colleges") or []})
    # A saved assignment the fold held (Sheet 94 card 1) needs a person too. It is
    # usually not in the queue: the reference already classifies the raw under a
    # human-reviewed entry, and the saved assignment disagrees.
    fold_holds = [dict(h, colleges=(cards.get(h["raw_title"]) or {}).get("colleges") or [])
                  for h in fold_held()]
    needs_you.extend(fold_holds)
    # A hint lane's proposal never pre-fills, even one the gate passes: on
    # today's queue those that pass still read "Kaiser High School" for
    # "EMT-405 Kaiser High School". The classifier sees each as a hint.
    unasked = [r for r in waiting if r not in staged and r not in records and r not in held]

    gen = (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ")
    report = {
        "_about": "The CER procedures run (kb/_cer_procedures.py): what each procedure settled and held, "
                  "and the titles that need a person. A pre-fill no reason holds saves under its procedure "
                  "(Open Asks Sheet 94 card 2); a held one pre-fills the tab and waits for a person.",
        "_generated_at": gen, "procedures_hash": phash,
        "queue": len(queue), "saved_not_folded": len(queue) - len(waiting), "waiting": len(waiting),
        "proposed": len(staged), "needs_you_count": len(needs_you), "not_yet_asked": len(unasked),
        "fold_held": len(fold_holds),
        "procedures": [dict(id=p["id"], name=p["name"], kind=p["kind"], rule=p["rule"],
                            source=p["source"], **by_proc[p["id"]]) for p in procs]
                      + [dict(id="classifier", name="The classifier decides the rest", kind="classifier",
                              rule="Every title no rule settles goes to the classifier, which reads the skill "
                                   "and every procedure above.", source={"who": "Sam", "date": "2026-10-18",
                                   "words": "have you classify and complete common exhibit titles"},
                              **by_proc["classifier"])],
        "classifier_run": {"calls": len(calls), "answered": sum(1 for c in calls if not c["error"]),
                           "errors": [c["error"] for c in calls if c["error"]][:5],
                           "cost_usd": cost_usd(calls)} if calls else None,
        "needs_you": sorted(needs_you, key=lambda n: (-len(n.get("colleges") or []), n["raw_title"])),
    }
    stage = {
        "_about": ("Pre-fills for the CER's unclassified titles, written each night by "
                   "kb/_cer_procedures.py from the procedures in kb/cer_procedures.json and the "
                   "classifier. credential_reference.js pre-fills each row. A pre-fill no reason "
                   "holds is also saved to kb_curation under its procedure's cohort (Open Asks Sheet "
                   "94 card 2, 2026-10-18); a held one waits for the curator's Save. Rows with a saved "
                   "assignment are never here."),
        "_generated_at": gen, "_queue_count": len(queue),
        "_counts": {"staged": len(staged), "needs_you": len(needs_you), "not_yet_asked": len(unasked)},
        "_residual": sorted(unasked),
        "staged": {raw: staged[raw] for raw in sorted(staged)},
    }
    print("queue %d | saved, not folded %d | waiting %d | proposed %d | needs you %d | not yet asked %d"
          % (len(queue), len(queue) - len(waiting), len(waiting), len(staged), len(needs_you), len(unasked)))
    for p in report["procedures"]:
        print("  %-24s settled %4d  held %4d" % (p["id"], p["settled"], p["held"]))
    if dry_run:
        return report, stage
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    for path, obj in ((REPORT, report), (pre.STAGE_PATH, stage)):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=1, ensure_ascii=False)
            f.write("\n")
    if calls:
        with open(CLASSIFIED, "w", encoding="utf-8") as f:
            json.dump({"_about": "The classifier's answers for the CER's unclassified titles "
                                 "(kb/_cer_procedures.py). `rules` is the procedures hash each was "
                                 "asked under.", "records": dict(sorted(records.items()))},
                      f, indent=1, ensure_ascii=False)
            f.write("\n")
    if save in ("on", "preview"):
        save_sure(stage, report, cur or Curation(key), run_id=run_id, preview=(save == "preview"), now=now)
    return report, stage


def try_procedure(pid, now=None, examples=10):
    """The dry run the routine writes back for the Exhibits tab's Turn on: what an
    off procedure would do, measured against tonight's run without it. Writes nothing.

    queue      the waiting titles it would settle (they save under its cohort the
               night after Turn on) and hold for a person;
    reference  for a rule, the titles already in the reference its lanes read
               differently from their canonical title (a fold to make, as the AP
               fold was; the rule itself only reads the queue);
    reasks     for guidance, the classifier's unsure answers on the queue, each
               asked again the night after Turn on (the procedures changed)."""
    proc = {p["id"]: p for p in read_procedures()}.get(pid)
    if not proc:
        raise ValueError("no procedure %r in %s" % (pid, os.path.basename(PROCEDURES)))
    buf = io.StringIO()
    with contextlib.redirect_stdout(buf):
        base_report, base = run(dry_run=True, catalog=False, now=now)
        report, trial = run(dry_run=True, catalog=False, now=now, include=(pid,))
    mine = {raw: rec for raw, rec in trial["staged"].items() if rec.get("procedure") == pid}
    changed = {raw: rec for raw, rec in mine.items()
               if (base["staged"].get(raw) or {}).get("title") != rec.get("title")}
    tally = next((p for p in report["procedures"] if p["id"] == pid), {})
    out = {"procedure": pid, "name": proc["name"], "kind": proc["kind"], "on": bool(proc["on"]),
           "request": proc.get("request") or "",
           "at": (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "queue": {"waiting": report["waiting"], "settled": tally.get("settled", 0),
                     "held": tally.get("held", 0), "changed": len(changed),
                     "examples": [[raw, mine[raw]["title"]] for raw in sorted(mine)[:examples]]}}
    if proc["kind"] == "rule":
        ut = json.load(open(pre.UT_PATH, encoding="utf-8"))
        titles = ut.get("titles") or ut
        raws = [r for r, e in titles.items() if isinstance(e, dict) and e.get("unified_title")]
        with contextlib.redirect_stdout(buf):
            lanes, _res, _meta = pre.stage_lanes(raws, pre.load_families(), set())
        mine_lanes = set(proc["lanes"]) - HINT_LANES
        read = {r: l for r, l in lanes.items() if l.get("via") in mine_lanes}
        differ = {r: l for r, l in read.items()
                  if pre.normalize_key(l["title"]) != pre.normalize_key(titles[r]["unified_title"])}
        out["reference"] = {"read": len(read), "differ": len(differ),
                            "examples": [[r, titles[r]["unified_title"], differ[r]["title"]]
                                         for r in sorted(differ)[:examples]]}
    else:
        cache = json.load(open(CLASSIFIED, encoding="utf-8")) if os.path.exists(CLASSIFIED) else {}
        records = cache.get("records", {})
        waiting = set(base["_residual"]) | set(base["staged"]) | {n["raw_title"] for n in base_report["needs_you"]}
        out["reasks"] = sum(1 for r in waiting if r in records
                            and as_proposal(records[r])["confidence"] < SURE)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--classify", type=int, default=0, help="ask the classifier about up to N titles")
    ap.add_argument("--save", choices=["on", "preview"],
                    help="save every pre-fill no reason holds under its procedure (on), "
                         "or list what would save and write no row (preview)")
    ap.add_argument("--undo", metavar="PROCEDURE", help="take back every kb_curation row this procedure saved")
    ap.add_argument("--dry-run", action="store_true", help="print the tallies; write nothing")
    ap.add_argument("--try", dest="trying", metavar="PROCEDURE",
                    help="the dry run of one procedure, on or off, as JSON for the Exhibits tab's Rules view; "
                         "writes nothing")
    args = ap.parse_args()
    if args.trying:
        print(json.dumps(try_procedure(args.trying), indent=1, ensure_ascii=False))
        return
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if args.undo:
        if not key:
            sys.exit("--undo needs SUPABASE_SERVICE_KEY (the workflow holds it).")
        undo_procedure(args.undo, Curation(key))
        return
    run(classify_n=args.classify, dry_run=args.dry_run, key=key, save=args.save,
        run_id=os.environ.get("GITHUB_RUN_ID", ""))


if __name__ == "__main__":
    main()
