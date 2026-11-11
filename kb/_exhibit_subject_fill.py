#!/usr/bin/env python3
"""Fill the Common SUBJ of a credential that has none, from the evidence of what the learning is.

Sam, in session, 2026-11-11: "i notice that many of the exhibits don't have a subj, so add a check
into that in our common plan and procedure so we can get those fill as automatically as possible";
"a complete canonical ecosystem is a good canonical ecosystem--even if imperfect and needing later
fixes... better to ask forgiveness than permission"; and his ruling that ASE MIL7 "Heating,
Ventilation & Air Conditioning" is automotive, not HVAC, so title words alone can be wrong.

THE RULE, in plain words. A credential with no Common SUBJ takes one from, in order:
  (a) the courses colleges credit for it, when two or more colleges credit courses and one subject
      holds over half of them ("courses, several colleges");
  (b) the courses one college credits for it, the same majority ("courses, one college"): a
      college's own articulation is the best evidence of what the learning is;
  (c) its issuer family, when no credited course yields a subject (ASE is automotive; the table is
      kb/reference/issuer_family_subject.json) ("issuer family").
Title words and TOP or CIP never decide. A credited course's subject code maps to its discipline
through kb/reference/subject_discipline_map.json (or, for a code the map lacks, through the local
codes the Common Subjects Reference records under each discipline, when 80% of that code's uses sit
under one) and to that discipline's Common SUBJ through the Common Subjects Reference
(kb/discipline_canonical_subj4.json); a subject the reference does not
hold is skipped and listed. A title is held for a person only when its issuer family or a
certification link names a different subject than its courses. A subject already on the title,
whoever set it, always wins and is never overwritten.

WHAT "NO COMMON SUBJ" MEANS. What the Catalog and the Exhibits List both read: no articulation
whose code starts with a subject token (M-ID or C-ID), and no stored `subj_override` on
_CREDENTIAL_REVIEW::<title> in kb_curation.

RULE 10, ENFORCED HERE. A fresh live read of every subj_override and subj_source row at write time
(Range-paginated); INSERT-only with duplicates ignored (the key is course_id, field) under the
cohort exhibit-subject-s638@bot; the receipt is written under kb/exhibit_subject_out/saved/ BEFORE
the INSERT and names every row; `--undo` deletes the cohort's rows in one DELETE. Each title writes
two rows: subj_override (the Common SUBJ) and subj_source (the rung's words).

WHAT IS LEFT goes to kb/exhibit_subject_out/worklist.json: every credential still without a Common
SUBJ, why, and a SUGGESTED subject from its title words where one exists, for a person's later
accept-all batch. The Commons' Exhibit card counts it.

RUN IT ON A RUNNER (Supabase is egress-blocked from the agent sandbox): one step in
cer-procedures.yml, preview by default.

    python3 kb/_exhibit_subject_fill.py                  # the plan from the committed files, no network
    python3 kb/_exhibit_subject_fill.py --save preview   # the plan against a fresh read, nothing written
    python3 kb/_exhibit_subject_fill.py --save on        # write the rows
    python3 kb/_exhibit_subject_fill.py --undo           # take the cohort's rows back
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CREDREF = os.path.join(ROOT, "credential_reference_data.js")
ADOPTION = os.path.join(HERE, "exhibits_adoption.json")
SUBJ_MAP = os.path.join(HERE, "reference", "subject_discipline_map.json")
CSR = os.path.join(HERE, "discipline_canonical_subj4.json")
CERT_LINKS = os.path.join(HERE, "exhibit_cert_links.json")
FAMILIES = os.path.join(HERE, "reference", "issuer_family_subject.json")
OUT_DIR = os.path.join(HERE, "exhibit_subject_out")
WORKLIST = os.path.join(OUT_DIR, "worklist.json")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hvuwhnbuahrtptokpqfh.supabase.co").rstrip("/")

KEY_PREFIX = "_CREDENTIAL_REVIEW::"
FIELD_SUBJ = "subj_override"
FIELD_SOURCE = "subj_source"
COHORT = "exhibit-subject-s638@bot"
RUNGS = {"a": "courses, several colleges", "b": "courses, one college", "c": "issuer family"}
TOKEN_RE = re.compile(r"^[A-Za-z][A-Za-z-]{1,7}$")   # the Catalog's subjOf() token
PAGE = 1000
VARIANT_SHARE = 0.8      # a local code the map lacks resolves through the reference's variants at this share
ATTEMPTS = 5
TRANSIENT_HTTP = {429, 500, 502, 503, 504}
RULING = ("Sam, in session 2026-11-11: fill the exhibits' missing subject as automatically as possible; "
          "a complete canonical ecosystem is a good one, even if imperfect; ASE MIL7 is automotive, not HVAC. "
          "Rule decided by SkyTamarind (Session 638): courses at several colleges, then one college, then the "
          "issuer family; title words, TOP and CIP never decide")
RULE_WORDS = ("A credential with no Common SUBJ takes the subject of the courses colleges credit for it (over half of "
              "them, several colleges first, then one), else its issuer family's; title words, TOP and CIP never "
              "decide; a family or certification link that names another subject holds it for a person; a subject "
              "already on the title always wins.")
# Words too general to point at one discipline when a suggestion is drawn from a title.
GENERIC = {"technology", "technologies", "studies", "science", "sciences", "related", "general", "other",
           "education", "systems", "services", "management", "and", "applied", "industrial"}


# ── reading the committed files ─────────────────────────────────────────────

def _norm(s):
    return re.sub(r"[^A-Z0-9]", "", (s or "").upper())


def read_js_object(path):
    text = open(path, encoding="utf-8").read()
    start = text.index("{")
    end = text.rstrip().rstrip(";").rstrip()
    return json.loads(end[start:])


def load_inputs(root=ROOT):
    j = lambda rel: json.load(open(os.path.join(root, rel), encoding="utf-8"))   # noqa: E731
    return {
        "titles": read_js_object(os.path.join(root, "credential_reference_data.js"))["unified_titles"],
        "adoption": j("kb/exhibits_adoption.json").get("credentials") or {},
        "subj_map": j("kb/reference/subject_discipline_map.json").get("map") or {},
        "csr": j("kb/discipline_canonical_subj4.json").get("disciplines") or {},
        "cert_links": j("kb/exhibit_cert_links.json"),
        "families": j("kb/reference/issuer_family_subject.json").get("families") or {},
    }


def catalog_subject(title):
    """The Catalog's subjOf() over the baked articulations: the modal subject token, or None."""
    counts, best, best_n = {}, None, 0
    for a in title.get("articulations") or []:
        tok = str(a.get("cid") or "").split()[0] if a and a.get("cid") else ""
        if not TOKEN_RE.match(tok):
            continue
        counts[tok] = counts.get(tok, 0) + 1
        if counts[tok] > best_n:
            best, best_n = tok, counts[tok]
    return best


def course_code(course):
    """The subject code of a credited course: 'AUTO G160' -> AUTO, 'CIS101' -> CIS."""
    return re.split(r"[\s\d]", (course or "").strip(), maxsplit=1)[0]


class Reference:
    """Local subject code -> discipline -> the Common SUBJ the reference holds."""

    def __init__(self, subj_map, csr):
        self.subj_map = subj_map
        self.disc_subj = {d: (e or {}).get("canonical_subj4") for d, e in csr.items()}
        self.held = {s for s in self.disc_subj.values() if s}
        # The reference's own record of the local codes seen under each discipline: a code the map does not
        # carry resolves when VARIANT_SHARE of its uses sit under one discipline.
        seen = {}
        for d, e in csr.items():
            for code, n in ((e or {}).get("local_subject_variants") or {}).items():
                seen.setdefault(_norm(code), Counter())[d] += n
        self.variants = {}
        for code, c in seen.items():
            d, n = c.most_common(1)[0]
            if n >= VARIANT_SHARE * sum(c.values()):
                self.variants[code] = d

    def of_code(self, code):
        """(subject, discipline): subject None when unmapped or the discipline has no Common SUBJ."""
        c = _norm(code)
        d = self.subj_map.get(c) or self.variants.get(c)
        if not d:
            return None, None
        return self.disc_subj.get(d) or None, d


def family_subjects(title, cert_links, families):
    """{family: subject} named by the title's certification links and its issuer or MAP titles."""
    out = {}
    link = (cert_links.get("links") or {}).get(title["ut"]) or {}
    for c in link.get("certs") or []:
        fam = ((cert_links.get("certs") or {}).get(c) or {}).get("family")
        if fam in families:
            out[fam] = families[fam]["subject"]
    text = " ".join([title.get("issuer") or ""] + [str((v or {}).get("r") or "") for v in title.get("raw_variants") or []])
    for fam, f in families.items():
        if any(re.search(p, text, re.I) for p in f.get("issuer_patterns") or []):
            out[fam] = f["subject"]
    return out


def word_suggestion(title, ref):
    """A SUGGESTION from title words (never a decision): the Common SUBJ whose discipline name shares the most
    distinctive words with the title, or None on a tie or no hit."""
    text = (title["ut"] + " " + " ".join(str((v or {}).get("r") or "") for v in title.get("raw_variants") or [])).lower()
    hits = Counter()
    for d, s in ref.disc_subj.items():
        if not s:
            continue
        for tok in set(re.findall(r"[a-z]+", d.lower())):
            if len(tok) >= 5 and tok not in GENERIC and re.search(r"\b" + tok, text):
                hits[s] += 1
    if not hits:
        return None
    top = hits.most_common(2)
    if len(top) > 1 and top[0][1] == top[1][1]:
        return None
    return top[0][0]


# ── the plan ────────────────────────────────────────────────────────────────

def decide(title, inp, ref):
    """{'subject', 'rung'} for a fill, or {'reason', ...} for a title left to a person."""
    ad = inp["adoption"].get(title["ut"]) or {}
    votes, colleges, unheld, named = Counter(), set(), Counter(), 0
    for college, entry in (ad.get("a") or {}).items():
        for pair in (entry[1] if isinstance(entry, list) and len(entry) > 1 else []) or []:
            course = pair[0] if isinstance(pair, (list, tuple)) and pair else ""
            if not course:
                continue
            named += 1
            subj, disc = ref.of_code(course_code(course))
            if subj:
                votes[subj] += 1
                colleges.add(college)
            elif disc:
                unheld[disc] += 1
    fams = family_subjects(title, inp["cert_links"], inp["families"])
    fam_subjects = set(fams.values())
    info = {"courses_named": named, "families": sorted(fams)}
    if votes:
        (top, n), total = votes.most_common(1)[0], sum(votes.values())
        if n * 2 <= total:
            return dict(info, reason="courses split", votes=dict(votes))
        if fam_subjects and fam_subjects != {top}:
            return dict(info, reason="held: the issuer family or a certification link names another subject",
                        courses=top, family=sorted(fam_subjects), votes=dict(votes))
        rung = "a" if len(colleges) >= 2 else "b"
        return dict(info, subject=top, rung=rung, votes=dict(votes), colleges=len(colleges))
    if len(fam_subjects) == 1:
        subj = next(iter(fam_subjects))
        if subj not in ref.held:
            return dict(info, reason="subject not in the Common Subjects Reference", subject_not_held=subj)
        return dict(info, subject=subj, rung="c")
    if len(fam_subjects) > 1:
        return dict(info, reason="held: two issuer families name different subjects", family=sorted(fam_subjects))
    if unheld:
        return dict(info, reason="subject not in the Common Subjects Reference",
                    discipline_not_held=unheld.most_common(1)[0][0])
    if title.get("ge_credit"):
        return dict(info, reason="credited to a GE area")
    return dict(info, reason="no signal")


def plan(inp, live=None):
    """The rows to write, the titles left, and the counts. `live` is {title: {field: row}} or None (offline)."""
    ref = Reference(inp["subj_map"], inp["csr"])
    rows, fills, left = [], [], []
    already_live = 0
    blank_ids = set()
    by_rung = Counter()
    for t in sorted(inp["titles"], key=lambda r: r["ut"]):
        if catalog_subject(t):
            continue
        lv = (live or {}).get(t["ut"]) or {}
        if FIELD_SUBJ in lv:
            already_live += 1            # a subject already on the title, whoever set it, wins
            continue
        ids = [x[0] for x in ((inp["adoption"].get(t["ut"]) or {}).get("x") or [])]
        d = decide(t, inp, ref)
        if d.get("subject"):
            by_rung[d["rung"]] += 1
            fills.append({"title": t["ut"], "subject": d["subject"], "rung": d["rung"], "source": RUNGS[d["rung"]],
                          "exhibits": len(ids)})
            key = KEY_PREFIX + t["ut"]
            rows.append({"course_id": key, "field": FIELD_SUBJ, "value": d["subject"], "reviewer_email": COHORT})
            rows.append({"course_id": key, "field": FIELD_SOURCE, "value": RUNGS[d["rung"]], "reviewer_email": COHORT})
            continue
        blank_ids.update(ids)
        item = {"title": t["ut"], "why": d["reason"], "issuer": t.get("issuer") or "", "exhibits": ids}
        for k in ("courses", "family", "votes", "subject_not_held", "discipline_not_held"):
            if d.get(k):
                item[k] = d[k]
        sug = word_suggestion(t, ref)
        if sug:
            item["suggested"] = sug
            item["suggested_from"] = "title words (a suggestion, never a decision)"
        left.append(item)
    not_held = sorted({i.get("subject_not_held") or i.get("discipline_not_held") for i in left
                       if i["why"] == "subject not in the Common Subjects Reference"} - {None})
    return {"rows": rows, "fills": fills, "left": left, "by_rung": dict(by_rung), "already_live": already_live,
            "left_exhibits": len(blank_ids), "not_held": not_held}


# ── the store ───────────────────────────────────────────────────────────────

def _urlopen(req, timeout):
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    return json.loads(raw) if raw else []


def _write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=1, ensure_ascii=False)
        f.write("\n")


class Curation:
    """kb_curation's _CREDENTIAL_REVIEW:: subject rows through PostgREST with the runner's service key."""

    FIELDS = "in.(%s,%s)" % (FIELD_SUBJ, FIELD_SOURCE)

    def __init__(self, key, url=SUPABASE_URL, transport=_urlopen, sleep=time.sleep):
        self.base = url.rstrip("/") + "/rest/v1/kb_curation"
        self.key = key
        self.transport = transport
        self.sleep = sleep

    def _send(self, method, params, body=None, headers=None):
        qs = urllib.parse.urlencode(params, safe='(),."*:', quote_via=urllib.parse.quote)
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

    def subjects(self):
        """{title: {field: row}} for every live subject row, page by page (Rule 10b)."""
        out, start = {}, 0
        while True:
            rows = self._send("GET", {"select": "course_id,field,value,reviewer_email,reviewed_at",
                                      "course_id": "like." + KEY_PREFIX + "*", "field": self.FIELDS,
                                      "order": "course_id,field"},
                              headers={"Range-Unit": "items", "Range": "%d-%d" % (start, start + PAGE - 1)}) or []
            for r in rows:
                t = (r.get("course_id") or "")[len(KEY_PREFIX):]
                if t:
                    out.setdefault(t, {})[r.get("field")] = r
            if len(rows) < PAGE:
                return out
            start += PAGE

    def insert(self, rows):
        return self._send("POST", {"on_conflict": "course_id,field"}, rows,
                          headers={"Prefer": "resolution=ignore-duplicates,return=representation"}) or []

    def undo(self, cohort=COHORT):
        return self._send("DELETE", {"reviewer_email": "eq." + cohort, "course_id": "like." + KEY_PREFIX + "*",
                                     "field": self.FIELDS},
                          headers={"Prefer": "return=representation"}) or []


# ── the run ─────────────────────────────────────────────────────────────────

def _ts(now=None):
    return (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H-%M-%SZ")


def describe(p, mode, out=print):
    n = len(p["fills"])
    out("subject fill: %d credential(s) with no Common SUBJ take one tonight (%s), %d left for a person "
        "(%d exhibits); %d already carry a stored subject%s"
        % (n, ", ".join("%s %d" % (RUNGS[k], p["by_rung"].get(k, 0)) for k in "abc"), len(p["left"]),
           p["left_exhibits"], p["already_live"],
           {"on": "", "preview": " (preview: nothing written)"}.get(mode, " (offline plan, no live read)")))
    why = Counter(i["why"] for i in p["left"])
    for k, v in why.most_common():
        out("  left: %-70s %d" % (k, v))
    if p["not_held"]:
        out("  subjects the Common Subjects Reference does not hold (skipped): " + ", ".join(p["not_held"]))


def write_worklist(p, mode, inserted_titles=None, now=None, path=WORKLIST):
    """The remainder, committed, for a later accept-all batch; and the count the Commons card reads."""
    inserted_titles = inserted_titles if inserted_titles is not None else set()
    pending = [f for f in p["fills"] if f["title"] not in inserted_titles]
    doc = {
        "schema": 1,
        "_about": ("Credentials with no Common SUBJ after the subject fill (kb/_exhibit_subject_fill.py), each with why, "
                   "and a suggested subject from its title words where one exists. A suggestion is never a decision: "
                   "title words were wrong on ASE MIL7 (Sam, 2026-11-11). The Commons' Exhibit card counts `no_subject`."),
        "rule": RULE_WORDS,
        "written_at": (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "mode": mode or "offline",
        "live_read": mode in ("on", "preview"),
        "by_rung": {RUNGS[k]: p["by_rung"].get(k, 0) for k in "abc"},
        "written": len(p["fills"]) - len(pending) if mode == "on" else 0,
        "not_yet_written": len(pending) if mode != "on" else 0,
        "no_subject": len(p["left"]) + (len(pending) if mode != "on" else 0),
        "left": len(p["left"]),
        "left_exhibits": p["left_exhibits"],
        "suggested": sum(1 for i in p["left"] if i.get("suggested")),
        "not_held": p["not_held"],
        "items": p["left"],
    }
    _write_json(path, doc)
    return doc


def save(p, cur, run_id="", now=None, out_dir=OUT_DIR, out=print):
    """Write the receipt, then the rows; the receipt is updated with what landed."""
    rows = p["rows"]
    if not rows:
        out("saved: nothing to write")
        return {"inserted": 0, "skipped": 0, "receipt": None, "titles": set()}
    ts = _ts(now)
    path = os.path.join(out_dir, "saved", "saved_%s.json" % ts)
    receipt = {"table": "kb_curation", "mode": "save", "at": ts, "run_id": run_id, "ruling": RULING, "rule": RULE_WORDS,
               "cohort": COHORT, "undo": "python3 kb/_exhibit_subject_fill.py --undo (one DELETE by the cohort)",
               "fills": p["fills"], "rows": rows, "result": "pending"}
    _write_json(path, receipt)
    got = cur.insert(rows)
    keys = {(g.get("course_id"), g.get("field")) for g in got}
    receipt["inserted"] = [r for r in rows if (r["course_id"], r["field"]) in keys]
    receipt["skipped_as_duplicate"] = [r for r in rows if (r["course_id"], r["field"]) not in keys]
    receipt["result"] = "written"
    _write_json(path, receipt)
    titles = {r["course_id"][len(KEY_PREFIX):] for r in receipt["inserted"] if r["field"] == FIELD_SUBJ}
    out("saved: %d row(s) inserted as %s (%d credentials), %d skipped as duplicate; receipt %s"
        % (len(receipt["inserted"]), COHORT, len(titles), len(receipt["skipped_as_duplicate"]), os.path.relpath(path, ROOT)))
    return {"inserted": len(receipt["inserted"]), "skipped": len(receipt["skipped_as_duplicate"]), "receipt": path,
            "titles": titles}


def undo(cur, now=None, out_dir=OUT_DIR, out=print):
    removed = cur.undo(COHORT)
    ts = _ts(now)
    path = os.path.join(out_dir, "saved", "undo_%s.json" % ts)
    _write_json(path, {"table": "kb_curation", "mode": "undo", "at": ts, "cohort": COHORT, "removed": removed})
    out("undo: %d row(s) removed from kb_curation under %s; receipt %s" % (len(removed), COHORT, os.path.relpath(path, ROOT)))
    return {"removed": len(removed), "receipt": path}


def run(save_mode=None, key=None, cur=None, inp=None, run_id="", now=None, out_dir=OUT_DIR, worklist=WORKLIST,
        out=print):
    inp = inp or load_inputs()
    live = None
    if save_mode in ("on", "preview"):
        if cur is None:
            if not key:
                sys.exit("--save needs SUPABASE_SERVICE_KEY (the fresh read and the write go through it).")
            cur = Curation(key)
        live = cur.subjects()
    p = plan(inp, live)
    describe(p, save_mode, out)
    res = {"planned": len(p["fills"]), "left": len(p["left"]), "by_rung": p["by_rung"]}
    titles = None
    if save_mode == "on":
        s = save(p, cur, run_id=run_id, now=now, out_dir=out_dir, out=out)
        res.update(s)
        titles = s["titles"]
    if worklist:
        write_worklist(p, save_mode, titles, now=now, path=worklist)
    return res


def main(argv=None):
    ap = argparse.ArgumentParser(description="fill the Common SUBJ of credentials that have none")
    ap.add_argument("--save", choices=["on", "preview"], help="on writes the rows; preview reads live and writes nothing")
    ap.add_argument("--undo", action="store_true", help="take the cohort's rows back (one DELETE)")
    ap.add_argument("--no-worklist", action="store_true", help="do not rewrite kb/exhibit_subject_out/worklist.json")
    ap.add_argument("--run-id", default=os.environ.get("GITHUB_RUN_ID", ""))
    a = ap.parse_args(argv)
    key = (os.environ.get("SUPABASE_SERVICE_KEY") or "").strip()
    if a.undo:
        if not key:
            sys.exit("--undo needs SUPABASE_SERVICE_KEY.")
        undo(Curation(key))
        return 0
    run(a.save, key=key, run_id=a.run_id, worklist=None if a.no_worklist else WORKLIST)
    return 0


if __name__ == "__main__":
    sys.exit(main())
