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

Writes, and nothing else:
  kb/unclassified_preseed.json   the tab's pre-fills (the file it already reads)
  kb/cer_classified.json         the classifier's cache
  kb/cer_procedures_out/latest.json   per-procedure tallies and the Needs-you list

⚠️ NOTHING IS SAVED. Every proposal pre-fills the tab, ready to save (Rule 5e,
Sam 2026-07-07: "leave them ready to save but not yet saved"). Letting a sure
result save itself is Open Asks Sheet 93 card 2, unanswered at this writing.

Run from repo root:
  python3 kb/_cer_procedures.py                 # rules + cached classifier results
  python3 kb/_cer_procedures.py --classify 400  # also ask about up to 400 titles
                                                #   (runner, SUPABASE_SERVICE_KEY)
  python3 kb/_cer_procedures.py --dry-run       # print the tallies, write nothing
"""
import argparse
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
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
REPORT = os.path.join(HERE, "cer_procedures_out", "latest.json")
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
SCHOOL = re.compile(r"\bHS\b|\bHS-[A-Z]|\(HSA\)|high\s*school|\bROP\b|\bUSD\b|unified school|adult school"
                    r"|school district|county office of education|\b[A-Z]{1,3}COE\b|training cent(?:er|re)",
                    re.I)


# ── procedures ───────────────────────────────────────────────────────────────

def load_procedures(path=PROCEDURES):
    """The procedures in force, in order. A malformed one stops the run: a rule
    nobody can read must not settle anything."""
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
    return [p for p in procs if p["on"]]


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


# ── the run ──────────────────────────────────────────────────────────────────

def run(classify_n=0, dry_run=False, key=None, call=post, now=None, catalog=True):
    procs = load_procedures()
    owners = lane_owners(procs)
    phash = procedures_hash(procs)
    audit = json.load(open(pre.AUDIT_PATH, encoding="utf-8"))
    cards = {c["raw_title"]: c for c in audit.get("title_cards", [])
             if "unclassified_in_map" in (c.get("tags") or [])}
    queue = list(cards)
    assigned = pre.load_assigned()
    waiting = [r for r in queue if r not in assigned]
    lanes, _residual, raw_meta = pre.stage_lanes(queue, pre.load_families(), assigned)
    suggestions = (json.load(open(SUGGESTIONS, encoding="utf-8")).get("suggestions") or {}
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
        tally = by_proc["classifier"]
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
    # A hint lane's proposal never pre-fills, even one the gate passes: on
    # today's queue those that pass still read "Kaiser High School" for
    # "EMT-405 Kaiser High School". The classifier sees each as a hint.
    unasked = [r for r in waiting if r not in staged and r not in records and r not in held]

    gen = (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ")
    report = {
        "_about": "The CER procedures run (kb/_cer_procedures.py): what each procedure settled and held, "
                  "and the titles that need a person. Nothing here is saved; proposals pre-fill the tab.",
        "_generated_at": gen, "procedures_hash": phash,
        "queue": len(queue), "saved_not_folded": len(queue) - len(waiting), "waiting": len(waiting),
        "proposed": len(staged), "needs_you_count": len(needs_you), "not_yet_asked": len(unasked),
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
                   "classifier. NOT saved to Supabase: credential_reference.js pre-fills each row; "
                   "the curator reviews and clicks Save. Rows with a saved assignment are never here."),
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
    return report, stage


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--classify", type=int, default=0, help="ask the classifier about up to N titles")
    ap.add_argument("--dry-run", action="store_true", help="print the tallies; write nothing")
    args = ap.parse_args()
    run(classify_n=args.classify, dry_run=args.dry_run, key=os.environ.get("SUPABASE_SERVICE_KEY"))


if __name__ == "__main__":
    main()
