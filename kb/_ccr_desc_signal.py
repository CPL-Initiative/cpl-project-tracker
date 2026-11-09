#!/usr/bin/env python3
"""The course-description signal for the CCR's seed disciplines (S612; Sam on Open Asks Sheet 173, 2026-11-08 22:21Z:
"Can't we use course description and slos and objectives to confirm rather than top or alongside top").

A seed card's discipline came from a subject-code heuristic. The colleges' COCI descriptions are prose written
independently of the subject code, so they can confirm or question it. This module learns each discipline's
vocabulary (TF-IDF, stdlib only, deterministic) from records whose discipline is trusted, then names the discipline a
card's member descriptions fit best.

Trusted labels: a curator's discipline in kb/coci_curation.json, or a `subject_map` fill (the curator-authored
lexicon, the auditor's inferred-high). Seed cards are never training data, so a card is never confirmed by itself.

It is scored before it judges anything: `evaluate()` holds out every fifth trusted record, trains on the rest and
reports top-1 accuracy overall, on the curator-labelled records alone, and by margin band. kb/_ccr_seed_recheck_dryrun.py
reports the evaluation beside its verdicts, so a reader sees how often the signal is right before reading what it says.
Read-only.
"""
import glob
import json
import math
import os
import re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
WORD = re.compile(r"[a-z][a-z]{2,}")
STOP = set("""the and for with this that from are will students student course courses include includes including
topics topic study studies introduction introductory basic advanced use using used through their they them other
such which into also may can how what who when where be been being have has had not but all any each its it is an
as at by in of on or to a emphasis designed focus focuses provides provide skills skill knowledge understanding
principles concepts concept units unit hours hour lecture lab laboratory credit transfer prerequisite prerequisites
required requirement recommended preparation program programs college level semester repeat repeated times""".split())


def tokens(text):
    return [w for w in WORD.findall((text or "").lower().replace("_x000d_", " ")) if w not in STOP]


def load_descriptions(root=ROOT):
    """COCI descriptions by control number, from the coci_lookup_desc_*.js shards."""
    out = {}
    for f in sorted(glob.glob(os.path.join(root, "coci_lookup_desc_*.js"))):
        t = open(f, encoding="utf-8").read()
        i = t.index("= {") + 2
        out.update(json.loads(t[i:t.rindex("}") + 1]))
    return out


class Model:
    """Nearest discipline centroid over sublinear TF-IDF vectors."""

    def __init__(self, docs):
        """docs: [(discipline, token list)]."""
        df = Counter()
        for _d, toks in docs:
            df.update(set(toks))
        n = max(1, len(docs))
        self.idf = {w: math.log(n / c) for w, c in df.items() if c >= 2}
        cent = defaultdict(Counter)
        for d, toks in docs:
            for w, x in self.vec(toks).items():
                cent[d][w] += x
        self.cent = {d: self._norm(v) for d, v in cent.items()}
        self.index = defaultdict(list)
        for d, v in self.cent.items():
            for w, x in v.items():
                self.index[w].append((d, x))

    def vec(self, toks):
        tf = Counter(t for t in toks if t in self.idf)
        return self._norm({w: (1 + math.log(c)) * self.idf[w] for w, c in tf.items()})

    @staticmethod
    def _norm(v):
        s = math.sqrt(sum(x * x for x in v.values())) or 1.0
        return {w: x / s for w, x in v.items()}

    def rank(self, toks, k=3):
        """[(discipline, cosine)] best first, or [] for a text with no known word."""
        score = Counter()
        for w, x in self.vec(toks).items():
            for d, y in self.index.get(w, ()):
                score[d] += x * y
        return [(d, round(s, 4)) for d, s in score.most_common(k)]


def record_text(cid, rec, memberships, desc):
    """A record's member descriptions (a minted card's memberships, or a singleton's own control number)."""
    cns = [m.get("control_number") for m in (memberships.get(cid) or [])] or [rec.get("control_number")]
    return " ".join(desc.get(cn) or "" for cn in cns if cn)


def trusted(courses, singles, cur, memberships, desc):
    """[(cid, discipline, tokens, by)] for records whose discipline a curator or the subject map set."""
    out = []
    for d in (courses, singles):
        for cid, rec in d.items():
            if cid.startswith("_") or not isinstance(rec, dict):
                continue
            c = cur.get(cid) or {}
            if c.get("merge_into"):
                continue
            if c.get("discipline"):
                disc, by = c["discipline"], "curator"
            elif rec.get("discipline_source") == "subject_map" and rec.get("discipline"):
                disc, by = rec["discipline"], "subject_map"
            else:
                continue
            toks = tokens(record_text(cid, rec, memberships, desc))
            if len(toks) >= 5:
                out.append((cid, disc, toks, by))
    return out


def margin_band(r):
    if len(r) < 2:
        return "clear"
    m = r[0][1] - r[1][1]
    return "clear" if m >= 0.05 else "close" if m >= 0.02 else "thin"


def evaluate(train, folds=5):
    """Held-out top-1 accuracy: each record judged by a model that never saw it."""
    hit, tot = Counter(), Counter()
    for f in range(folds):
        model = Model([(d, t) for i, (_c, d, t, _b) in enumerate(train) if i % folds != f])
        for i, (_c, d, t, by) in enumerate(train):
            if i % folds != f:
                continue
            r = model.rank(t)
            ok = bool(r) and r[0][0] == d
            band = margin_band(r) if r else "none"
            for key in ("all", by, "band:" + band):
                tot[key] += 1
                hit[key] += ok
    return {k: {"n": tot[k], "right": hit[k], "rate": round(hit[k] / tot[k], 3)} for k in sorted(tot)}
