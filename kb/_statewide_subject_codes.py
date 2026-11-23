#!/usr/bin/env python3
"""Every local subject code in the state course list, statewide, with the colleges that use it and a recommended common
subject code (S712, 2026-11-23).

WHY. Sam, 2026-11-23, on the Subjects card mock: "what's settled-3019 unique list with the colleges that uses (knowing
this will always to making changes as colleges adjust). I want to look at the 349 drafts and think through if we have
more easy wins locked in the data we have", "all colleges count", and of the codes used at one college only: "these
should be quick to eyeball and decide, especially if you can recommend based on similarity with other codes and course
titles". The Subjects page reads only the colleges whose catalog is filed (19 of 120); this file holds every college's
codes from the state course list, so a code is settled once, statewide, and each college's exceptions after.

WHAT A CODE IS. The state list's subject code in the subject map's key form (upper case, letters and digits only:
ESL-NC and ESLNC are one code). Its colleges are every college the state list files a course under it at.

THE EVIDENCE, each kept apart and named:
  draft     the subject map's discipline for the code and that discipline's common code (a draft; settles nothing).
  filing    a person's statewide filing of the code (the Local subjects List, _SUBJ_DISC::<CODE>), which settles it.
  peers     the disciplines of the M-IDs the code's courses joined, counted only for an M-ID that holds courses from
            three or more colleges and whose discipline does not rest on a TOP code alone (discipline_source top_code
            or top_division: the TOP rule, docs/kb-notes/methodology-top-is-a-last-in-line-signal.md). Each vote is the
            discipline's common code in the Common Subjects Reference, so an M-ID's older prefix (MUS, AJ) never votes.
  titles    the common code whose courses' titles read most like this code's titles: a word model built from the
            peers' courses, with this code's own courses taken out before it scores the code. Its accuracy is measured
            on the codes whose peers agree (self_recall below) and a title call is offered only above that floor.
  hint      the code itself spells a common code (ACCT) or begins with one (ACCTG); shown, never decides.

THE CLASS, one per code (recommend says what a person is asked to confirm):
  settled       a person filed the code statewide.
  noncredit     most of its courses are noncredit: the common code of its leading COCI noncredit category, at that
                category's share (Workforce Preparation and a course with no category take none).
  confirm       the draft, and the peers agree with it at 75% or more.
  draft_differs the draft, and the peers lean to another code at 75% or more.
  draft_broad   the draft, and the peers spread (under 75%, or fewer than 3 votes): a broad code; the draft stands.
  peers         no draft; the peers agree at 75% or more.
  peers_split   no draft; 3 or more peer votes that spread under 75%.
  named_code    no draft; its course titles are another code's ("AJ 359"), so that code's call stands.
  titles        no draft; fewer than 3 peer votes, so the title model gives the call.
  look          no draft, no votes and no title words: the call is a guess (a web search helps).

EVERY CODE GETS A CALL AND A CONFIDENCE (Sam, 2026-11-23: "always provide a recommendation based on your best available
data and always provide a confidence score, even if it's 5%"). The confidence is a probability over the common codes:
the draft's measured rate (how often a drafted code's peers lead to its draft), times the peers' smoothed vote where 3
or more votes stand, else the title model at the temperature that best fits the codes whose peers agree, times a light
lean to a code the code itself spells. recommend.next is the runner-up. self_recall reports how often a call in each
confidence band was right on the codes whose peers agree, with the peers withheld.

No clock is read, so the same inputs write the same bytes.

Usage: python3 kb/_statewide_subject_codes.py            (write kb/status/statewide_subject_codes.json)
       python3 kb/_statewide_subject_codes.py --check    (fail if the committed file is stale)
"""
import collections
import json
import math
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import _build_subject_courses as B  # noqa: E402
import _mid_readiness as R  # noqa: E402
import subject_decisions as sd  # noqa: E402

OUT = os.path.join("kb", "status", "statewide_subject_codes.json")
MINTED = os.path.join("kb", "coci_minted_courses.json")
TITLES = os.path.join("kb", "status", "local_subject_titles.json")
TOP_ONLY = {"top_code", "top_division"}
PEER_COLLEGES = 3      # an M-ID votes only when it holds courses from this many colleges
AGREE = 0.75           # the share the peers' leading code needs to count as agreement
MIN_VOTES = 3          # fewer peer votes than this decide nothing
TITLE_FLOOR = None     # set from the self-recall at build time (the lowest share band at 95% or better)
STOP = set("""a an and as at by for from in into of on or the to with i ii iii iv v vi vii viii ix x 1 2 3 4
introduction intro introductory beginning beginner intermediate advanced special topics topic studies study directed
independent course courses lab laboratory fundamentals principles survey seminar workshop selected part level
practicum internship work experience cooperative education skills basic general applied theory concepts""".split())


def words(title):
    return [w for w in re.findall(r"[a-z]+", str(title or "").lower()) if len(w) > 2 and w not in STOP]


def college_name(n):
    return re.sub(r"\s+Credit$", "", str(n or "").strip())


def load_minted(root):
    with open(os.path.join(root, MINTED), encoding="utf-8") as f:
        return json.load(f)["courses"]


def local_titles(root):
    """{code key: {printed name: [college, ...]}} from the filed catalogs (19 colleges today)."""
    path = os.path.join(root, TITLES)
    if not os.path.exists(path):
        return {}
    with open(path, encoding="utf-8") as f:
        doc = json.load(f)
    cols = doc.get("columns") or []
    ic, iname = cols.index("code"), cols.index("printed_name")
    out = collections.defaultdict(lambda: collections.defaultdict(list))
    for c in doc.get("colleges") or []:
        for r in c.get("rows") or []:
            if r[iname]:
                out[sd.map_key(r[ic])][r[iname]].append(c["college"])
    return out


def build(root=ROOT):
    state = B.read_state(root)
    # COCI lists North Orange and San Diego's continuing education colleges twice, once as "... Credit", and Calbright
    # only as "Calbright College Credit": one college each (Sam, 2026-11-23: "116 (including Calbright) + 2 nc colleges =
    # 118"). A course's college is its name less that suffix.
    names = [college_name(n) for n in state["colleges"]]
    cats = B.read_categories(root)          # {control number: COCI noncredit category}
    nc_codes = sd.nc_codes_table()          # {noncredit category: its common code, or None}
    comp = R._compare_module()
    members, members_at = comp.load_members(root)
    minted = load_minted(root)
    with open(os.path.join(root, sd.CANONICAL), encoding="utf-8") as f:
        _by_code, by_disc = sd.canonical_codes(json.load(f))
    disc_of = {v: k for k, v in by_disc.items()}
    draft_map = R.load_map(root)
    with open(os.path.join(root, R.SUBJECT_MAP), encoding="utf-8") as f:
        draft_disc = {sd.map_key(k): v for k, v in (json.load(f).get("map") or {}).items() if not k.startswith("_")}
    decisions = sd.load(root)
    titled = local_titles(root)

    # Each course's voting M-ID discipline, as a common code.
    vote_of, why_no = {}, collections.Counter()
    for mid, rows in members.items():
        cols = {college_name(R.sd_clean(x["college"])) for x in rows}
        m = minted.get(mid)
        if len(cols) < PEER_COLLEGES:
            why_no["fewer than %d colleges" % PEER_COLLEGES] += len(rows)
            continue
        if not m:
            why_no["not in the minted list"] += len(rows)
            continue
        if m.get("discipline_source") in TOP_ONLY:
            why_no["discipline from a TOP code only"] += len(rows)
            continue
        common = by_disc.get(m.get("discipline"))
        if not common:
            why_no["discipline has no common code"] += len(rows)
            continue
        # An M-ID's discipline came from its modal local subject; that subject's own courses never vote for it, or a
        # code would confirm itself (Cerritos AED gave ELEC M90xx their discipline, f-aed-electricity-gave-elec-m90-s707).
        modal = sd.map_key(m.get("subject") or "")
        for x in rows:
            s, n = R.split_code(x["code"])
            if sd.map_key(s) == modal:
                why_no["the M-ID's own modal subject"] += 1
                continue
            vote_of[(B.college_key(college_name(R.sd_clean(x["college"]))), sd.map_key(s), B.num_key(n))] = common

    codes = {}
    for r in state["rows"]:
        k = sd.map_key(r[2])
        if not k:
            continue
        e = codes.setdefault(k, {"spellings": collections.Counter(), "colleges": collections.Counter(), "courses": 0,
                                 "credit": 0, "noncredit": 0, "titles": collections.Counter(), "votes": collections.Counter(),
                                 "categories": collections.Counter()})
        if r[6] != "C":
            e["categories"][cats.get(str(r[1]).strip()) or B.NO_CAT] += 1
        e["spellings"][B.code_key(r[2])] += 1
        e["colleges"][names[r[0]]] += 1
        e["courses"] += 1
        e["credit" if r[6] == "C" else "noncredit"] += 1
        e["titles"][str(r[4]).strip()] += 1
        v = vote_of.get((B.college_key(names[r[0]]), k, B.num_key(r[3])))
        if v:
            e["votes"][v] += 1

    # The title model: word counts per common code from the voting courses' titles.
    prof, tot = collections.defaultdict(collections.Counter), collections.Counter()
    own = {k: collections.defaultdict(collections.Counter) for k in codes}   # each code's own words per common code
    for r in state["rows"]:
        k = sd.map_key(r[2])
        v = vote_of.get((B.college_key(names[r[0]]), k, B.num_key(r[3])))
        if not v:
            continue
        for w in words(r[4]):
            prof[v][w] += 1
            tot[v] += 1
            own[k][v][w] += 1
    vocab = len({w for c in prof.values() for w in c})
    classes = sorted(prof)

    def title_scores(k, e):
        """{common code: log-likelihood} of a code's titles, its own courses taken out of the profiles; None when no word."""
        # Each distinct word once: a code with many courses repeats its words, and counting each repeat as new evidence
        # makes the model sure of itself on a topic the profiles barely know.
        bag = collections.Counter({w: 1 for t in e["titles"] for w in words(t)})
        if not bag:
            return None
        scores = {}
        for c in classes:
            mine = own[k].get(c, {})
            denom = tot[c] - sum(mine.values()) + vocab
            if denom <= vocab:
                continue
            s = 0.0
            for w, n in bag.items():
                s += n * math.log((prof[c][w] - mine.get(w, 0) + 1.0) / denom)
            scores[c] = s
        return scores or None

    def soft(scores, temp):
        best = max(scores.values())
        ex = {c: math.exp((v - best) / temp) for c, v in scores.items()}
        z = sum(ex.values())
        return {c: v / z for c, v in ex.items()}

    def peers(e):
        votes = sum(e["votes"].values())
        if not votes:
            return {"votes": 0, "lead": None, "share": 0.0, "tally": []}
        lead, n = e["votes"].most_common(1)[0]
        return {"votes": votes, "lead": lead, "share": round(n / votes, 3), "tally": [[c, x] for c, x in e["votes"].most_common(3)]}

    # Calibration (Sam, 2026-11-23: "always provide a recommendation based on your best available data and always
    # provide a confidence score, even if it's 5%"). The labelled set is the codes whose peers agree (75% or more of 3
    # or more votes); the label is the peers' code.
    scores = {k: title_scores(k, e) for k, e in codes.items()}
    labelled = {k: peers(e)["lead"] for k, e in codes.items() if peers(e)["votes"] >= MIN_VOTES and peers(e)["share"] >= AGREE}
    # The title model's raw scores run far too sure of themselves (a call at 100% that is right 94% of the time), so its
    # temperature is the one that best fits the labelled set.
    temp, best_ll = 1.0, None
    for t in (1, 2, 3, 5, 8, 12, 20, 30, 50, 80, 120):
        ll = 0.0
        for k, lab in labelled.items():
            if scores[k] and lab in scores[k]:
                ll += math.log(max(soft(scores[k], t)[lab], 1e-12))
        if best_ll is None or ll > best_ll:
            temp, best_ll = t, ll
    # The draft is right as often as the peers' code matches it, on the drafted codes with 5 or more votes.
    dr = [(draft_map.get(k), peers(e)["lead"]) for k, e in codes.items() if draft_map.get(k) and peers(e)["votes"] >= 5]
    draft_rate = round(sum(1 for a, b in dr if a == b) / len(dr), 3) if dr else 0.5
    K = len(set(by_disc.values()))

    # A college that files its courses under titles that are only another code ("AJ 359" under LAWEN at Allan
    # Hancock) names the code those courses belong with: the named code's call stands for this one.
    CODE_TITLE = re.compile(r"^([A-Za-z&]{1,8})[ -]?\d")

    def named_code(k, e):
        n = sum(e["titles"].values())
        hits = collections.Counter()
        for t, c in e["titles"].items():
            m = CODE_TITLE.match(t.strip())
            if m and len(t.strip()) <= 14:
                hits[sd.map_key(m.group(1))] += c
        if not hits:
            return None
        ref, c = hits.most_common(1)[0]
        return ref if ref != k and ref in codes and c / n >= 0.5 else None

    def posterior(k, e, ref_post=None):
        """{common code: probability}: the content (the title model at its fitted temperature, times the peers' smoothed
        vote whenever any vote stands; or the named code's call), times the draft's measured rate, times a light lean
        to a code the code itself spells."""
        cands = sorted(set(by_disc.values()))
        p = peers(e)
        if ref_post is not None:
            content, source = dict(ref_post), "named code"
        else:
            if scores[k]:
                sm = soft(scores[k], temp)
                content = {c: sm.get(c, 1e-6) for c in cands}
                source = "titles"
            else:
                content, source = {c: 1.0 / K for c in cands}, "none"
            if p["votes"]:
                for c in cands:
                    content[c] *= (e["votes"].get(c, 0) + 0.5) / (p["votes"] + 0.5 * K)
                if p["votes"] >= MIN_VOTES:
                    source = "peers"
        d = draft_map.get(k)
        hint = k if k in cands else next((c for c in sorted(cands, key=len, reverse=True) if len(c) >= 3 and k.startswith(c)), None)
        post = {}
        for c in cands:
            v = content[c]
            if d:
                v *= draft_rate if c == d else (1 - draft_rate) / (K - 1)
            if hint:
                v *= 3.0 if c == hint else 1.0
            post[c] = v
        z = sum(post.values())
        return {c: v / z for c, v in post.items()}, source, hint

    # How well the confidence holds: on the labelled set, the title path alone (peers withheld, the draft kept), the
    # share of calls right in each confidence band.
    BANDS = [(0.9, 1.01), (0.75, 0.9), (0.5, 0.75), (0.25, 0.5), (0.0, 0.25)]
    rec = {b: [0, 0] for b in BANDS}
    for k, lab in labelled.items():
        e = dict(codes[k]); e["votes"] = collections.Counter()
        post, _src, _h = posterior(k, e)
        top = min(post, key=lambda c: (-post[c], c))
        for b in BANDS:
            if b[0] <= post[top] < b[1]:
                rec[b][1] += 1
                rec[b][0] += top == lab
    self_recall = [{"confidence_from": b[0], "confidence_to": min(b[1], 1.0), "tried": rec[b][1], "right": rec[b][0],
                    "accuracy": round(rec[b][0] / rec[b][1], 3) if rec[b][1] else None} for b in BANDS]
    floor = None

    canon = set(by_disc.values())
    first = {k: posterior(k, e) for k, e in codes.items()}
    named = {k: named_code(k, e) for k, e in codes.items()}
    final = {k: (posterior(k, e, first[named[k]][0]) if named[k] and not draft_map.get(k) else first[k]) for k, e in codes.items()}
    out_codes, tally = [], collections.Counter()
    for k, e in codes.items():
        p = peers(e)
        draft = draft_map.get(k)
        filing = decisions.statewide_for(k)
        post, source, hint = final[k]
        ranked = sorted(post.items(), key=lambda t: (-t[1], t[0]))
        rc, conf = ranked[0]
        second = ranked[1]
        tc = min(scores[k], key=lambda c: (-scores[k][c], c)) if scores[k] else None
        agree = p["votes"] >= MIN_VOTES and p["share"] >= AGREE
        nc_lead = next(((c, n) for c, n in e["categories"].most_common() if nc_codes.get(c)), None)
        if filing:
            cls, rc, conf = "settled", filing.get("common_code"), 1.0
            why = "a person filed it statewide"
        elif e["noncredit"] * 2 > e["courses"] and nc_lead and nc_codes.get(nc_lead[0]):
            # A noncredit code is settled by its COCI noncredit category (the four noncredit MQ codes, Sam, 2026-11-22);
            # the peers' M-IDs carry credit disciplines, so they do not vote here.
            cls, rc = "noncredit", nc_codes[nc_lead[0]]
            known = sum(n for c, n in e["categories"].items() if c != B.NO_CAT) or 1
            blank = e["categories"].get(B.NO_CAT, 0)
            conf = nc_lead[1] / known
            second = next(((nc_codes[c], n / known) for c, n in e["categories"].most_common()
                           if nc_codes.get(c) and nc_codes[c] != rc), (None, 0.0))
            why = "%d of its %d categorized noncredit courses are %s" % (nc_lead[1], known, nc_lead[0]) + (
                "; %d more have no category in the export" % blank if blank else "")
        else:
            if draft and agree and p["lead"] == draft:
                cls = "confirm"
            elif draft and agree:
                cls = "draft_differs"
            elif draft:
                cls = "draft_broad"
            elif agree:
                cls = "peers"
            elif source == "named code":
                cls = "named_code"
            elif source == "peers":
                cls = "peers_split"
            elif source == "titles":
                cls = "titles"
            else:
                cls = "look"
            bits = []
            if draft:
                bits.append("the draft says %s" % draft)
            if p["votes"]:
                bits.append("%d%% of %d peer votes say %s" % (round(p["share"] * 100), p["votes"], p["lead"]))
            if source == "named code":
                bits.append("its course titles are %s courses" % named[k])
            elif tc and scores[k]:
                bits.append("the course titles read most like %s" % tc)
            if hint:
                bits.append("the code spells %s" % hint)
            why = "; ".join(bits) or "nothing in the data points anywhere"
        tally[cls] += 1
        cols = sorted(e["colleges"].items(), key=lambda t: (-t[1], t[0]))
        out_codes.append({
            "code": k, "spellings": [s for s, _ in e["spellings"].most_common()], "colleges": [[c, n] for c, n in cols],
            "courses": e["courses"], "credit": e["credit"], "noncredit": e["noncredit"],
            "titles": [t for t, _ in e["titles"].most_common(6)],
            "local_titles": [[t, sorted(set(c))] for t, c in sorted(titled.get(k, {}).items())],
            "draft": {"common": draft, "discipline": draft_disc.get(k)} if draft else None,
            "filing": {"common": filing.get("common_code"), "discipline": filing.get("discipline"), "who": filing.get("who"),
                       "at": (filing.get("at") or "")[:10]} if filing else None,
            "peers": p, "title_call": tc, "hint": hint, "class": cls,
            "recommend": {"common": rc, "discipline": disc_of.get(rc), "confidence": round(conf, 3), "why": why,
                          "next": None if cls == "settled" or not second[0] else {"common": second[0], "confidence": round(second[1], 3)}},
            "noncredit_categories": [[c, n] for c, n in e["categories"].most_common(4)],
            # A noncredit code's credit courses take the evidence's own call, not the category's (S712: Santa Rosa's
            # EMLS holds credit courses under a code most colleges use for noncredit).
            "credit_call": {"common": ranked[0][0], "confidence": round(ranked[0][1], 3)} if cls == "noncredit" and e["credit"] else None,
        })
    out_codes.sort(key=lambda c: (-len(c["colleges"]), -c["courses"], c["code"]))
    by_cls = collections.defaultdict(lambda: {"codes": 0, "courses": 0, "one_college": 0})
    for c in out_codes:
        b = by_cls[c["class"]]
        b["codes"] += 1
        b["courses"] += c["courses"]
        b["one_college"] += len(c["colleges"]) == 1
    return {
        "_what": "Every local subject code in the state course list, statewide: the colleges that use it, the subject map's "
                 "draft, a person's statewide filing, the peers' vote and a title call, and the common code a person is "
                 "asked to confirm. Written by kb/_statewide_subject_codes.py; nothing here is a decision.",
        "_rule": "A code is the state list's subject code in the subject map's key form. Peers: the disciplines of the M-IDs "
                 "a code's courses joined, for M-IDs with courses from %d or more colleges whose discipline does not rest on "
                 "a TOP code alone, each as its common code in the Common Subjects Reference. Agreement is %d%% or more of %d "
                 "or more votes. The title model scores a code with its own courses taken out; its call is offered only at "
                 "or above the share where its self-recall holds 95%%. A TOP code is never read." % (PEER_COLLEGES, AGREE * 100, MIN_VOTES),
        "_sources": {"state_list": B.STATE, "state_list_built_at": state.get("_built_at"), "members": "unified_courses_members.js",
                     "members_at": members_at, "minted": MINTED, "subject_map": R.SUBJECT_MAP, "canonical_subj": sd.CANONICAL,
                     "subject_decisions": "kb/status/subject_decisions.json", "local_titles": TITLES},
        "totals": {"codes": len(out_codes), "colleges": len(set(names)), "pairs": sum(len(c["colleges"]) for c in out_codes),
                   "courses": sum(c["courses"] for c in out_codes), "one_college": sum(1 for c in out_codes if len(c["colleges"]) == 1),
                   "by_class": {k: by_cls[k] for k in ("settled", "noncredit", "confirm", "draft_differs", "draft_broad", "peers", "peers_split", "named_code", "titles", "look")},
                   "course_votes": len(vote_of), "no_vote": dict(why_no)},
        "common_codes": sorted([[c, d] for d, c in by_disc.items() if c], key=lambda t: t[1]),
        "calibration": {"title_temperature": temp, "draft_rate": draft_rate, "labelled_codes": len(labelled)},
        "self_recall": self_recall,
        "codes": out_codes,
    }


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n"


def main(argv):
    text = dump(build())
    path = os.path.join(ROOT, OUT)
    if "--check" in argv:
        if not os.path.exists(path) or open(path, encoding="utf-8").read() != text:
            print("STALE: %s. Run python3 kb/_statewide_subject_codes.py" % OUT)
            return 1
        print("ok: %s is current" % OUT)
        return 0
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    doc = json.loads(text)
    t = doc["totals"]
    print("wrote %s: %d codes at %d colleges (%d pairs, %d courses); %d used at one college" % (
        OUT, t["codes"], t["colleges"], t["pairs"], t["courses"], t["one_college"]))
    for k, v in t["by_class"].items():
        print("  %-14s %5d codes  %6d courses  %5d at one college" % (k, v["codes"], v["courses"], v["one_college"]))
    print("  calibration %s; self-recall %s" % (doc["calibration"], [(b["confidence_from"], b["tried"], b["accuracy"]) for b in doc["self_recall"]]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
