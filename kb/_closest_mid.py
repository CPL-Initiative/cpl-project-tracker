#!/usr/bin/env python3
"""The closest M-ID for each course that needs one, with a confidence measured on courses whose M-ID is known.

Sam, 2026-11-20, working the Courses List's Needs an M-ID pile: "maybe a new column with your recommended closest mid
based on any available new data we have (course descriptions, slos, objectives if available) to get a confidence
score with the recommended mid with a link to open a sidebar to curate". His priority the same day: the M-IDs first,
"so i can then finish the exhibit titles for course-based exhibits that rely on cid/ccn/mid (ccrs)".

WHAT IT DOES. For every local course with no M-ID, no C-ID and no CCN (the pile), it ranks the common courses of
today's identity file by how close they are and files the first three. It reads committed files only and writes
kb/coci_closest_mid.json. It writes no table and decides nothing: a person curates from the course's panel.

THE SCORE, 0 to 1, from what the two sides print:
  title    the course's title against the titles of the common course's local courses (TF-IDF cosine), and whether
           one of them is the same title word for word;
  subject  how often courses under this local subject code sit under the common course's four-letter prefix;
  units    the course's units against the common course's middle value;
  catalog  the course's catalog description against the descriptions of up to 12 of the common course's local
           courses (word overlap), read for the first eight candidates only.
The TOP code is not read (CLAUDE.md Rule 7: TOP decides nothing).

THE CONFIDENCE IS MEASURED, NOT CHOSEN (the self-recall gate for a new matcher). A seeded sample of courses that
hold an M-ID is scored with each course taken out of its own common course first. The first recommendation is right
when it is the course's own M-ID. A course that was its common course's only local course has no right answer among
the others, so any recommendation for it counts wrong: that is the pile's real case of a course that needs a new
M-ID. The confidence filed beside a recommendation is the share right in its score band, and the bands are filed
with their counts so a reader can check them.

THE EXHIBIT LINKS (COBIx, relayed by Sam, 2026-11-20: "sort the pile by how many exhibits each M-ID would unlock, so
Group Communication, with 67 links, comes first"). A link is one record in kb/coci_articulations.json's articulations
whose course_id is the M-ID. The file writes `links`, the count for each M-ID a row recommends; the Courses List sorts
the pile by the links of each row's first recommendation. The file's ids pass through kb/alias_chain.py before they
are counted (CLAUDE.md Rule 7). It carries its applied re-key markers and is re-keyed at every apply, so the newest map
is its baseline: no map is pending and no id moves (kb/_build_inactive_cards.py measured what resolving it again does:
1,291 of 2,144 M-ID links moved onto unrelated cards). The builder refuses a file without the markers. A resolved id
then counts on the row that displays it today, through the daily build's folds (Folds); what reaches no row is filed
as links_unreached with the reason.

THE DAILY RUN (scripts/daily_build.sh, after the course flags). The file stores a fingerprint of the content it
reads (the members' courses, the course list and its descriptions, the not-applicable courses, the links' ids, the
folds and merges) and of its code, never the files' bytes, which the daily pipeline restamps. With --if-changed a
run whose fingerprint matches the file's leaves the file untouched. The sample is seeded, so a run on the same inputs writes the same bytes.

Usage: python3 kb/_closest_mid.py            (writes kb/coci_closest_mid.json and prints the bands)
       python3 kb/_closest_mid.py --if-changed   (the daily run: nothing happens when no input changed)
       python3 kb/_closest_mid.py --sample 6000 --seed 20261120
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import math
import os
import random
import re
import statistics
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "kb", "coci_closest_mid.json")
STOP = {"and", "of", "the", "to", "in", "for", "a", "an", "with", "on", "at", "or", "by", "as"}
ROMAN = {"i": "1", "ii": "2", "iii": "3", "iv": "4", "v": "5", "vi": "6"}
W = {"title": 0.50, "exact": 0.22, "subject": 0.12, "units": 0.06, "catalog": 0.10}
BANDS = [0.0, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 1.01]
KEEP = 3
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import alias_chain  # noqa: E402  (CLAUDE.md Rule 7: imported, never copied)


def load_js(path: str, var: str):
    s = open(path, encoding="utf-8").read()
    s = s[s.index("=", s.index(var)) + 1:].strip()
    return json.loads(s[:-1] if s.endswith(";") else s)


def tokens(text: str) -> list[str]:
    out = []
    for t in re.findall(r"[a-z0-9]+", (text or "").lower()):
        t = ROMAN.get(t, t)
        if t not in STOP:
            out.append(t)
    return out


def norm_title(text: str) -> str:
    return " ".join(tokens(text))


class Index:
    """The common courses as the identity file holds them, with one course optionally taken out."""

    def __init__(self, members: dict, descs: dict):
        self.members = members
        self.descs = descs
        self.n = len(members)
        df = Counter()
        self.tf = {}
        self.exact = defaultdict(Counter)
        self.units = {}
        self.subj_prefix = defaultdict(Counter)
        for mid, rows in members.items():
            c = Counter()
            for r in rows:
                toks = tokens(r.get("t") or "")
                c.update(toks)
                self.exact[" ".join(toks)][mid] += 1
                subj = str(r.get("n") or "").split(" ")[0].upper()
                if subj:
                    self.subj_prefix[subj][mid.split(" ")[0]] += 1
            self.tf[mid] = c
            df.update(c.keys())
            us = [float(r["u"]) for r in rows if isinstance(r.get("u"), (int, float))]
            self.units[mid] = statistics.median(us) if us else None
        self.idf = {t: math.log(1 + self.n / d) for t, d in df.items()}
        self.post = defaultdict(list)
        self.norm = {}
        for mid, c in self.tf.items():
            size = max(len(members[mid]), 1)
            sq = 0.0
            for t, k in c.items():
                w = (k / size) * self.idf[t]
                self.post[t].append((mid, w))
                sq += w * w
            self.norm[mid] = math.sqrt(sq) or 1.0

    def rank(self, course: dict, skip_cn: str | None = None, own: str | None = None) -> list[dict]:
        """The closest common courses for one course. With skip_cn and own, the course is first taken out of its
        own common course (the self-recall measure), so its own title and description cannot vote for it."""
        toks = tokens(course["title"])
        if not toks:
            return []
        cw = Counter(toks)
        cnorm = math.sqrt(sum((k * self.idf.get(t, 0.0)) ** 2 for t, k in cw.items())) or 1.0
        acc = defaultdict(float)
        for t, k in cw.items():
            w = k * self.idf.get(t, 0.0)
            for mid, mw in self.post.get(t, ()):
                acc[mid] += w * mw
        own_rows = None
        if own and skip_cn:
            own_rows = [r for r in self.members.get(own, []) if r.get("cn") != skip_cn]
            if not own_rows:
                acc.pop(own, None)  # the course was its common course's only local course: no right answer remains
        title_key = " ".join(toks)
        subj = course["subj"].upper()
        prefs = self.subj_prefix.get(subj, {})
        ptotal = sum(prefs.values()) or 1
        cand = sorted(acc.items(), key=lambda kv: -kv[1] / self.norm[kv[0]])[:40]
        scored = []
        for mid, dot in cand:
            rows = own_rows if (own_rows is not None and mid == own) else self.members[mid]
            if not rows:
                continue
            if own_rows is not None and mid == own:
                # the profile without the course itself
                c = Counter()
                for r in rows:
                    c.update(tokens(r.get("t") or ""))
                size = len(rows)
                d = sum(k * self.idf.get(t, 0.0) * (c.get(t, 0) / size) * self.idf.get(t, 0.0) for t, k in cw.items())
                nrm = math.sqrt(sum(((k / size) * self.idf.get(t, 0.0)) ** 2 for t, k in c.items())) or 1.0
                cos = d / (cnorm * nrm)
                same = sum(1 for r in rows if norm_title(r.get("t") or "") == title_key)
            else:
                cos = dot / (cnorm * self.norm[mid])
                same = self.exact.get(title_key, {}).get(mid, 0)
            exact = min(1.0, same / max(len(rows), 1) * 2) if same else 0.0
            sp = prefs.get(mid.split(" ")[0], 0) / ptotal
            mu = self.units.get(mid)
            cu = course.get("units")
            un = 0.5 if (mu is None or cu is None) else max(0.0, 1.0 - abs(float(cu) - mu) / 2.0)
            scored.append({"mid": mid, "title": cos, "exact": exact, "subject": sp, "units": un, "same": same, "n": len(rows)})
        scored.sort(key=lambda x: -(W["title"] * x["title"] + W["exact"] * x["exact"] + W["subject"] * x["subject"] + W["units"] * x["units"]))
        top = scored[:8]
        cdesc = set(tokens(self.descs.get(course["ctrl"], "")))
        for x in top:
            x["catalog"] = None
            if cdesc:
                rows = [r for r in self.members[x["mid"]] if r.get("cn") != skip_cn][:12]
                best = 0.0
                for r in rows:
                    d = set(tokens(self.descs.get(r.get("cn") or "", "")))
                    if d:
                        best = max(best, len(cdesc & d) / math.sqrt(len(cdesc) * len(d)))
                x["catalog"] = best if rows else None
            cat = x["catalog"] if x["catalog"] is not None else 0.3  # no description on either side: neither for nor against
            x["score"] = round(W["title"] * x["title"] + W["exact"] * x["exact"] + W["subject"] * x["subject"]
                               + W["units"] * x["units"] + W["catalog"] * cat, 4)
        top.sort(key=lambda x: -x["score"])
        return top[:KEEP]


# The files that say where a stored id displays today (the daily build's folds), read only. Optional: a tree without
# one folds nothing through it.
FOLD_VARS = {"unified_courses_data.js": "window.CPL_UNIFIED_COURSES", "unified_courses_standalone.js": "window.CPL_UC_STANDALONE"}
# The code the output depends on, fingerprinted as bytes.
CODE = ["kb/_closest_mid.py", "kb/alias_chain.py", "kb/_build_remint_blast_radius.py"]


def read_inputs(root: str) -> dict:
    """Everything the build reads, parsed once: the fingerprint and the build both take it from here."""
    def js(rel, var):
        return load_js(os.path.join(root, rel), var)

    def jf(rel, default=None):
        path = os.path.join(root, rel)
        if not os.path.exists(path):
            return default
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    descs = {}
    for f in sorted(glob.glob(os.path.join(root, "coci_lookup_desc_*.js"))):
        t = open(f, encoding="utf-8").read()
        descs.update(json.loads(t[t.index("=", t.index('window.CPL_COCI_DESC["')) + 1:].strip().rstrip(";")))
    fold_rows = []
    for rel, var in FOLD_VARS.items():
        if os.path.exists(os.path.join(root, rel)):
            fold_rows += (js(rel, var) or {}).get("rows") or []
    return {"L": js("coci_lookup_data.js", "window.CPL_COCI_LOOKUP"), "M": js("unified_courses_members.js", "window.CPL_UC_MEMBERS"),
            "descs": descs, "na": (jf("kb/coci_not_applicable.json", {}) or {}).get("courses") or {},
            "arts": jf("kb/coci_articulations.json", {}), "fold_rows": fold_rows,
            "curation": (jf("kb/coci_curation.json", {}) or {}).get("curations") or {}}


def fingerprint(root: str, inp: dict, sample: int, seed: int) -> str:
    """sha256 over the content the build reads, in a stable order, never the files' bytes: the daily pipeline
    restamps the identity file, moves counts in the fold files and rewrites kb/coci_not_applicable.json's _inputs
    hashes every run, and none of that changes a recommendation."""
    from _build_remint_blast_radius import APPLIED_MARKERS
    L, M, arts = inp["L"], inp["M"], inp["arts"] or {}
    colleges = [str(c or "").strip() for c in L.get("colleges") or []]
    part = {
        "settings": [sample, seed],
        "course_list": [L.get("_built_at"), [[colleges[r[0]], r[1], r[2], r[3], r[4], r[5], r[8], r[9]] for r in L.get("rows") or []]],
        "members": [[mid, [[r.get("cn"), r.get("t"), r.get("n"), r.get("u")] for r in rows]] for mid, rows in sorted((M.get("members") or {}).items())],
        "descriptions": sorted(inp["descs"].items()),
        "not_applicable": sorted(inp["na"]),
        "links": [[k, bool(arts.get(k))] for k in APPLIED_MARKERS] + [(a or {}).get("course_id") for a in arts.get("articulations") or []],
        "folds": sorted([r.get("id"), r.get("consolidated_from") or [], r.get("routed_from") or []] for r in inp["fold_rows"] if r and r.get("id")),
        "merges": sorted([k, v.get("merge_into")] for k, v in inp["curation"].items() if isinstance(v, dict) and v.get("merge_into")),
    }
    h = hashlib.sha256()
    for k in sorted(part):
        h.update(k.encode() + b"\0" + hashlib.sha256(json.dumps(part[k], ensure_ascii=False, separators=(",", ":")).encode()).hexdigest().encode() + b"\n")
    for rel in CODE:
        with open(os.path.join(root, rel), "rb") as f:
            h.update(rel.encode() + b"\0" + hashlib.sha256(f.read()).hexdigest().encode() + b"\n")
    return h.hexdigest()


def link_maps(articulations: dict) -> list:
    """The alias maps still pending for kb/coci_articulations.json's ids: none, by its applied markers (the file is
    current-era). A file without them may be from an older era, so the build stops rather than guess."""
    from _build_remint_blast_radius import APPLIED_MARKERS
    missing = [k for k in APPLIED_MARKERS if not (articulations or {}).get(k)]
    if missing:
        raise SystemExit("ABORT: kb/coci_articulations.json lacks applied markers %s; its ids may be from an older era. "
                         "Re-key it (kb/_remint_apply_articulations.py) before building." % ", ".join(missing))
    pending, _ = alias_chain.pending_maps(None, baseline_through=alias_chain.ALIAS_MAPS[-1])
    return alias_chain.load_maps(pending)


def exhibit_links(articulations: dict, maps: list) -> tuple[Counter, int]:
    """Links per identity: one per articulation record, on its course_id resolved through the alias chain. Returns the
    counts and how many records the chain moved."""
    n, moved = Counter(), 0
    for a in (articulations or {}).get("articulations") or []:
        cid = (a or {}).get("course_id")
        if not cid:
            continue
        cur = alias_chain.resolve_id(cid, maps)
        moved += cur != cid
        n[cur] += 1
    return n, moved


class Folds:
    """Where a stored id displays today, as the daily build folds it (the export's exhibit rollup counts a row's
    exhibits over [its id] + consolidated_from + merge_members, and articulations stay keyed on the original ids):
      1. the id itself, when the identity file holds it or a data file carries its row;
      2. else the row whose consolidated_from or routed_from lists it (unified_courses_data.js, the stand-alone file);
      3. else the curation overlay's merge_into pointers (kb/coci_curation.json) to the end of the chain, cycle-safe,
         and then 1 and 2 on where the chain ends.
    A read: nothing here re-keys kb/coci_articulations.json. The build's Honors hold (honors_of) is not applied."""

    def __init__(self, live, rows=(), curation=None):
        # displayed: an id the identity file holds, or one the data files carry a row for
        self.live = set(live) | {(r or {}).get("id") for r in rows if (r or {}).get("id")}
        self.folded = {}
        for r in rows:
            for k in ("consolidated_from", "routed_from"):
                for src in (r or {}).get(k) or []:
                    self.folded.setdefault(src, (r.get("id"), k))
        self.merge = {k: v.get("merge_into") for k, v in (curation or {}).items() if isinstance(v, dict) and v.get("merge_into")}

    def _direct(self, cid):
        if cid in self.live:
            return cid, None
        f = self.folded.get(cid)
        if f and f[0] in self.live:
            return f[0], f[1]
        return None, None

    def land(self, cid):
        """(the displayed row, the route) or (None, why it reaches none)."""
        row, via = self._direct(cid)
        if row:
            return row, via or "itself"
        seen, cur = {cid}, cid
        while cur in self.merge:
            cur = self.merge[cur]
            if cur in seen:
                return None, "its merge_into chain loops"
            seen.add(cur)
        if cur == cid:
            return None, "not in the identity file, and no fold or merge names it"
        row, via = self._direct(cur)
        if row:
            return row, "merge_into" + ("" if via is None else " then " + via)
        return None, "its merge_into chain ends at %s, which no row displays" % cur


def fold_links(counts, folds):
    """Links per displayed row, summed over every stored id that lands on it, and the ids that land on none as
    [[id, records, why]], most records first."""
    out, lost, routes = Counter(), [], Counter()
    for cid, n in counts.items():
        row, how = folds.land(cid)
        if row:
            out[row] += n
            routes[how.split(" then ")[0] if how.startswith("merge_into") else how] += n
        else:
            lost.append([cid, n, how])
    lost.sort(key=lambda x: (-x[1], x[0]))
    return out, lost, routes


def band_of(score: float) -> int:
    for i in range(len(BANDS) - 1):
        if BANDS[i] <= score < BANDS[i + 1]:
            return i
    return len(BANDS) - 2


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--sample", type=int, default=6000)
    ap.add_argument("--seed", type=int, default=20261120)
    ap.add_argument("--out", default=None, help="default kb/coci_closest_mid.json")
    ap.add_argument("--root", default=ROOT, help=argparse.SUPPRESS)  # a test's fixture tree
    ap.add_argument("--if-changed", action="store_true", help="leave the file untouched when no input changed")
    a = ap.parse_args(argv)
    root = a.root
    a.out = a.out or os.path.join(root, "kb", "coci_closest_mid.json")
    inp = read_inputs(root)
    fp = fingerprint(root, inp, a.sample, a.seed)
    if a.if_changed and os.path.exists(a.out):
        try:
            with open(a.out, encoding="utf-8") as f:
                was = json.load(f).get("fingerprint")
        except (OSError, ValueError):
            was = None
        if was == fp:
            print("inputs unchanged (fingerprint %s); %s left as built" % (fp[:12], os.path.relpath(a.out, root)))
            return 0

    L, M, arts, descs = inp["L"], inp["M"], inp["arts"], inp["descs"]
    links_ids, links_moved = exhibit_links(arts, link_maps(arts))
    links_all, links_lost, links_routes = fold_links(links_ids, Folds(M["members"], inp["fold_rows"], inp["curation"]))
    members = M["members"]
    by_cn = defaultdict(list)
    for mid, rows in members.items():
        for r in rows:
            if r.get("cn"):
                by_cn[r["cn"]].append(mid)
    colleges = [str(c or "").strip() for c in L["colleges"]]
    courses = [{"college": colleges[r[0]], "ctrl": str(r[1] or ""), "subj": str(r[2] or ""), "num": str(r[3] or ""), "title": str(r[4] or ""),
                "units": r[5] if isinstance(r[5], (int, float)) else None, "cid": r[8], "ccn": r[9]} for r in L["rows"]]
    ix = Index(members, descs)

    # The self-recall measure.
    known = [c for c in courses if c["ctrl"] in by_cn]
    rng = random.Random(a.seed)
    sample = rng.sample(known, min(a.sample, len(known)))
    bands = [{"from": BANDS[i], "to": min(BANDS[i + 1], 1.0), "n": 0, "right": 0, "right_in_3": 0, "only_course": 0} for i in range(len(BANDS) - 1)]
    none = 0
    for c in sample:
        own = sorted(by_cn[c["ctrl"]], key=lambda m: -len(members[m]))[0]
        alone = len([r for r in members[own] if r.get("cn") != c["ctrl"]]) == 0
        top = ix.rank(c, skip_cn=c["ctrl"], own=own)
        if not top:
            none += 1
            continue
        b = bands[band_of(top[0]["score"])]
        b["n"] += 1
        b["only_course"] += 1 if alone else 0
        if not alone and top[0]["mid"] in by_cn[c["ctrl"]]:
            b["right"] += 1
        if not alone and any(x["mid"] in by_cn[c["ctrl"]] for x in top):
            b["right_in_3"] += 1
    for b in bands:
        b["confidence"] = round(b["right"] / b["n"], 3) if b["n"] else None
    # Three levels, in words, in place of a raw score (COBIx's note, relayed by Sam, 2026-11-20: "use your 3-level
    # confidence instead of a raw score" and offer "Propose new M-ID" when a course has no strong match). Each level
    # is a run of score bands, and its share right is measured the same way.
    levels = []
    for key, label, idx in (("strong", "Strong match", [5, 6]), ("possible", "Possible match", [3, 4]), ("none", "No strong match", [0, 1, 2])):
        n = sum(bands[i]["n"] for i in idx)
        right = sum(bands[i]["right"] for i in idx)
        levels.append({"key": key, "label": label, "bands": idx, "from": bands[idx[0]]["from"], "n": n, "right": right,
                       "share": round(right / n, 3) if n else None})

    # The pile.
    # The pile is the Courses List's Needs an M-ID: no M-ID, no C-ID, no CCN, and not kept out of the counts
    # (kb/coci_not_applicable.json: independent study, internships, a bare number; Sam, 2026-11-17).
    na = inp["na"]
    pile = [c for c in courses if c["ctrl"] not in by_cn and not c["cid"] and not c["ccn"] and (c["college"] + "|" + c["ctrl"]) not in na]
    rows = {}
    for c in pile:
        top = ix.rank(c)
        if not top:
            continue
        b = bands[band_of(top[0]["score"])]
        # One row per course, kept small for the page: [confidence, band, [[M-ID, score, courses with the same
        # title, the common course's local courses, catalog overlap or null], ...]].
        rows[c["ctrl"]] = [b["confidence"], band_of(top[0]["score"]),
                           [[x["mid"], round(x["score"], 2), x["same"], x["n"], None if x["catalog"] is None else round(x["catalog"], 2)] for x in top]]
    named = sorted({x[0] for r in rows.values() for x in r[2]})
    links = {m: links_all[m] for m in named if links_all.get(m)}
    for lv in levels:  # a pile course with no candidate at all sits at the last level
        lv["pile"] = sum(1 for r in rows.values() if r[1] in lv["bands"]) + (len(pile) - len(rows) if lv["key"] == "none" else 0)
    out = {
        "_what": "The closest common course (M-ID) for each local course that needs one, with a measured confidence, and the exhibit links each recommended M-ID carries (links). Built by kb/_closest_mid.py from committed files, daily when an input changed (fingerprint); display only. A person curates from the course's panel.",
        "identity_file": M.get("generated_at"), "course_list": L.get("_built_at"),
        "weights": W, "seed": a.seed,
        "measure": {"sampled": len(sample), "no_candidate": none, "bands": bands, "levels": levels,
                    "how": "Each sampled course is taken out of its own common course, then ranked. Right means the first recommendation is its own M-ID. A course that was its common course's only local course counts wrong whatever is recommended (only_course)."},
        "pile": len(pile), "recommended": len(rows),
        "row_shape": "control number: [confidence, band, [[M-ID, score, courses with the same title, the common course's local courses, catalog overlap or null], up to three]]; links: M-ID: exhibit links",
        "rows": rows,
        "links_what": "Exhibit links per recommended M-ID: the records in kb/coci_articulations.json whose course_id, "
                      "resolved through kb/alias_chain.py, displays as that row today: the id itself, else the row whose "
                      "consolidated_from or routed_from lists it, else where its merge_into chain ends (Folds). Only "
                      "M-IDs some row recommends, and only those with a link; an M-ID absent here has none. The Courses "
                      "List sorts the pile by the links of each row's first recommendation at a strong or possible match.",
        "links_moved_by_alias_chain": links_moved,
        "links_by_route": dict(sorted(links_routes.items())),
        "links_unreached": {"records": sum(x[1] for x in links_lost), "ids": len(links_lost),
                            "why": dict(sorted(Counter(x[2] if not x[2].startswith("its merge_into chain ends") else "its merge_into chain ends at an id no row displays" for x in links_lost).items())),
                            "first": links_lost[:10]},
        "links": links,
        "fingerprint": fp,
    }
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")
    print("pile %d, recommended %d; sample %d (no candidate %d)" % (len(pile), len(rows), len(sample), none))
    print("  exhibit links: %d recommended M-IDs carry one; the alias chain moved %d records; by route %s; %d records "
          "(%d ids) reach no displayed row" % (len(links), links_moved, dict(links_routes), sum(x[1] for x in links_lost), len(links_lost)))
    for b in bands:
        print("  score %.2f to %.2f: n %5d  right %5d  in top 3 %5d  only course %4d  confidence %s"
              % (b["from"], b["to"], b["n"], b["right"], b["right_in_3"], b["only_course"], b["confidence"]))
    for lv in levels:
        print("  %-16s right %5d of %5d (%s); on the pile %d" % (lv["label"], lv["right"], lv["n"], lv["share"], lv["pile"]))
    dist = Counter(r[1] for r in rows.values())
    print("  the pile by band:", [dist.get(i, 0) for i in range(len(bands))])
    return 0


if __name__ == "__main__":
    sys.exit(main())
