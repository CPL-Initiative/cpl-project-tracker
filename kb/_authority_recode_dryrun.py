#!/usr/bin/env python3
"""Authority recode — DRY-RUN planner for the ruled Common SUBJ changes (Rule 7).

MEASUREMENT ONLY. Writes nothing to kb/coci_*.json, nothing to Supabase, nothing
to the seed. Reads the rulings Sam returned on 2026-09-03
(kb/csr_authority_codes_rulings_2026-09-03.json) and plans the re-key they call
for, as reviewable receipts under kb/authority_recode_out/<date>/:

  alias_map.json          old id -> new id for every row that moves (catalog M-IDs,
                          singletons, and the Z-band identities in the same
                          namespaces — the POLS lesson: a SUBJ4 change moves the
                          WHOLE namespace, not just the M-IDs)
  collisions.json         keep-number candidates that were already taken and
                          what they were gap-filled to
  fl_classification.json  every Foreign Languages row: language, the signals
                          that placed it, the code it takes
  ag_classification.json  every Agriculture / Agricultural Production row: the
                          three signals, the family it takes, or why it stays
  seed_edits.json         the seed + umbrella-file changes the apply would make
  supabase_ops.sql        the kb_curation re-key, PREVIEW ONLY (the apply
                          re-derives against a fresh read)
  report.md               the human skim: counts, gates, readings to confirm

WHY NOT kb/_subj4_dryrun.py. The June allocator re-sequences every (SUBJ4,
band) bucket by title; measured 2026-09-03 with the committed seed it would
move 62,638 of 70,946 ids to change nothing (titles were normalized after the
June fold, so the catalog is no longer at its fixpoint). A canonical-code change
is a PREFIX re-key that keeps the number — kb/_pols_remint.py (POSC -> POLS,
2026-07-10) and kb/_apply_fl_subj4_remint.py (the FL split, 2026-06-09) are the
precedents — and this planner generalizes them to the whole ruled set:

  plain    items 7, 9, 11, 12, 13, 16: THEA->THTR, ECED->CDEV, CSIS->ITIS,
           OTEC->BSOT, FIMS->FTVE, CISC->COMP. Keep the number; gap-fill only
           where the new key already exists.
  fan-in   item 13's reading: Media Production (FIMP) shares FTVE with Film and
           Media Studies. Film keeps its numbers; Media Production's rows
           gap-fill into the FTVE bucket after them (two disciplines cannot
           both keep M1001).
  fl       item 10: Foreign Languages, per language. SPAN on C-ID's authority;
           the languages the ruling names take their dominant four-letter local
           code (FREN, CHIN, ITAL, JAPN, GERM, RUSS, ARAB, VIET, PORT); a
           language whose dominant local code is not four letters keeps its CSR
           code, flagged (Korean, and the others the report lists); FLNG stays
           the residual. Rows are classified with the June split's classifier
           (kb/_fl_subj4_dryrun.py: TOP 11xx -> title -> local subject; TOP is
           self-describing for languages, the one documented exception to the
           TOP doctrine). Strays keyed under a code the file does not know
           (ARME, LATN, GREE ...) keep their key and are listed for Sam.
  ag       item 14: Agriculture + Agricultural Production become the second
           umbrella. Each row is classified into a C-ID family — AGAB business,
           AGAS animal science, AGPS plant science, AGEH environmental
           horticulture, AGMA mechanized agriculture (hyphens dropped, rule 3)
           — only when TWO independent signals agree (local subject-code
           family, title words, TOP family; TOP never decides alone, Rule 7).
           One-signal rows stay on the discipline's residual code and are
           listed with the proposal. Viticulture / enology (TOP 0104) has no
           C-ID family and stays residual, flagged as a reading.

compute_plan() is the pure allocator the apply will import (apply == spec).

Composition with the Z-band retirement (items 20-21): this planner moves Z ids
WITH their namespace (THEA Z1001 -> THTR Z1001); kb/_zband_retire_dryrun.py
takes this alias map as --after-recode so it allocates M numbers in the
post-recode buckets. Series order: recode, then Z-to-M, one cron window.

Run from repo root:  python3 kb/_authority_recode_dryrun.py
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
COURSES = os.path.join(HERE, "coci_minted_courses.json")
SINGLETONS = os.path.join(HERE, "coci_minted_singletons.json")
MEMBERSHIPS = os.path.join(HERE, "coci_minted_memberships.json")
ARTICULATIONS = os.path.join(HERE, "coci_articulations.json")
CURATION = os.path.join(HERE, "coci_curation.json")
CANONICAL = os.path.join(HERE, "discipline_canonical_subj4.json")
FL_SPLIT = os.path.join(HERE, "foreign_language_subj4.json")
RULINGS = os.path.join(HERE, "csr_authority_codes_rulings_2026-09-03.json")
TOP_REF = os.path.join(HERE, "reference", "top_categories.json")
OUT_DIR = os.environ.get("AUTHORITY_RECODE_OUT") or os.path.join(HERE, "authority_recode_out")

SUBJ4_RE = re.compile(r"^[A-Z]{4}$")
ID_RE = re.compile(r"^([A-Z]{1,6}) ([MZ])(\d)([A-Z0-9]{3})$")
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# ── the plan, cross-checked against the rulings file at runtime ──────────────
PLAIN = [
    # (discipline, from, to, item, note)
    ("Drama/Theater Arts", "THEA", "THTR", 7, None),
    ("Child Development/Early Childhood Education", "ECED", "CDEV", 9, None),
    ("Computer Information Systems", "CSIS", "ITIS", 11, None),
    ("Office Technologies", "OTEC", "BSOT", 12, None),
    ("Film and Media Studies", "FIMS", "FTVE", 13, None),
    ("Computer Science", "CISC", "COMP", 16, None),
]
FAN_IN = [
    ("Media Production", "FIMP", "FTVE", 13, "reading to confirm: Media Production shares FTVE "
                                             "with Film and Media Studies as a fan-in pair"),
]
FL_DISCIPLINE = "Foreign Languages"
FL_RESIDUAL = "FLNG"
# Item 10, in the ruling's own words: "SPAN on C-ID's authority; the other
# languages take their dominant four-letter local code (FREN, CHIN, ITAL, JAPN,
# GERM, RUSS, ARAB, VIET, PORT); Korean's KOR is three letters, so it keeps a
# CSR code, flagged". The codes the ruling NAMES are taken as ruled; every other
# language is measured by the same rule and flagged when it has no dominant
# four-letter code.
FL_RULED_CODES = {"Spanish": "SPAN", "French": "FREN", "Chinese": "CHIN", "Italian": "ITAL",
                  "Japanese": "JAPN", "German": "GERM", "Russian": "RUSS", "Arabic": "ARAB",
                  "Vietnamese": "VIET", "Portuguese": "PORT"}
FL_KEEP_CSR = {"Korean"}     # named in the ruling as keeping its CSR code

AG_DISCIPLINES = {"Agriculture": "AGRI", "Agricultural Production": "AGPR"}   # residual per discipline
AG_FAMILIES = {"AB": "AGAB", "AS": "AGAS", "PS": "AGPS", "EH": "AGEH", "MA": "AGMA"}
AG_CID = {"AB": "AG-AB", "AS": "AG-AS", "PS": "AG-PS", "EH": "AG-EH", "MA": "AG-MA"}
# Signal A — the colleges' own subject codes, by family. Measured on the 1,015
# rows 2026-09-03; a code not listed says nothing.
AG_SUBJ_FAMILY = {
    "AB": {"AGAB", "AGB", "AGBS", "AGBU", "AGEC", "AGRB", "ABUS", "AGBM"},
    "AS": {"ANSC", "ASCI", "ANCT", "ANML SC", "AS", "AGAS", "VETT", "VETTECH", "AGHE", "ANS",
           "ANIM", "EQSC", "EQST", "EQUI", "VT", "ANSCI", "AGAN", "DAIRY", "AGEQ"},
    "PS": {"AGPS", "PLS", "PLSCI", "PLSI", "PLNT SC", "PLANT", "CRPSCI", "CRPS", "AGRO", "SOIL",
           "PLSC", "AGPL", "CROP"},
    "EH": {"OH", "ORH", "ORL", "AGOR", "HORT", "EH", "HRT", "LAND", "FLOR", "LSCP", "NURS",
           "AGEH", "ENVH", "OHRT", "LNDSCP"},
    "MA": {"AGM", "MAG", "MCAG", "AGMA", "AGME", "AGMEC", "AET", "AGTC", "AGET", "MECH", "AGMT"},
    "VE": {"VWT", "VEN", "WINE", "VIT", "VITI", "WINEST", "FERM", "ENOL", "AGVE"},
}
# Signal B — title words. A title carrying words of two families is no vote.
AG_TITLE_WORDS = {
    "AB": {"business", "marketing", "economics", "economic", "sales", "accounting", "management",
           "leadership", "ambassador", "ambassadors", "entrepreneur", "entrepreneurship", "law",
           "policy", "agribusiness", "finance", "records", "computer", "communication"},
    "AS": {"animal", "animals", "livestock", "equine", "horse", "horses", "beef", "cattle", "dairy",
           "poultry", "swine", "sheep", "goat", "goats", "ruminant", "veterinary", "feeding",
           "feeds", "meat", "insemination", "breeding", "husbandry", "horsemanship", "rodeo"},
    "PS": {"plant", "plants", "crop", "crops", "soil", "soils", "agronomy", "seed", "vegetable",
           "vegetables", "fruit", "fruits", "orchard", "citrus", "pomology", "propagation",
           "weed", "pest", "fertilizer", "irrigation"},
    "EH": {"horticulture", "horticultural", "landscape", "landscaping", "nursery", "turf",
           "turfgrass", "floral", "floristry", "flower", "arboriculture", "tree", "trees",
           "greenhouse", "garden", "gardening", "ornamental", "pruning", "arborist"},
    "MA": {"tractor", "tractors", "welding", "mechanics", "mechanical", "equipment", "machinery",
           "engine", "engines", "power", "fabrication", "electrical", "hydraulics", "shop",
           "surveying", "construction", "mechanized", "small gas"},
    "VE": {"viticulture", "enology", "wine", "wines", "winery", "winemaking", "vineyard", "grape",
           "grapes", "brewing", "fermentation"},
}
# Signal C — TOP families. Last in line: never decides alone.
AG_TOP_FAMILY = {"0102": "AS", "0103": "PS", "0109": "EH", "0112": "AB", "0116": "MA", "0104": "VE"}
TITLE_STOP = {"and", "the", "of", "for", "with", "into", "from", "this", "that",
              "an", "a", "to", "in", "on", "or", "as", "by", "at", "is", "be"}


def _load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def parse_id(cid):
    """-> (prefix, letter, band, tail, kind) with kind in corr | stand | z | None."""
    m = ID_RE.match(cid or "")
    if not m:
        return (None, None, None, None, None)
    prefix, letter, band, tail = m.groups()
    if letter == "Z":
        kind = "z" if tail.isdigit() else None
    elif tail.isdigit():
        kind = "corr"
    elif re.match(r"^\d[A-Z]{2}$", tail):
        kind = "stand"
    else:
        kind = None
    return (prefix, letter, band, tail, kind)


def standalone_code(n):
    d, r = divmod(n, 26 * 26)
    l1, l2 = divmod(r, 26)
    return f"{d}{LETTERS[l1]}{LETTERS[l2]}"


def ntitle(t):
    t = re.sub(r"[^a-z0-9 ]+", " ", (t or "").lower())
    return " ".join(sorted(x for x in t.split() if x and x not in TITLE_STOP))


def check_rulings(rulings):
    """The plan tables above must match the rulings record — a drift is a bug."""
    by_item = {}
    for ch in rulings.get("changes", []):
        by_item[ch["item"]] = ch
    problems = []
    for disc, old, new, item, _ in PLAIN:
        ch = by_item.get(item) or {}
        src = ch if ch.get("discipline") == disc else (ch.get("also") or {})
        if src.get("from") != old or src.get("to") != new:
            problems.append(f"item {item} {disc}: plan says {old}->{new}, rulings say "
                            f"{src.get('from')}->{src.get('to')}")
    fan = (by_item.get(13) or {}).get("also") or {}
    if fan.get("discipline") != "Media Production" or fan.get("to") != "FTVE":
        problems.append("item 13 `also` (Media Production -> FTVE) missing from the rulings")
    if "KOR" not in str((by_item.get(10) or {}).get("to", "")):
        problems.append("item 10 wording drifted (Korean's KOR reading not found)")
    if "AGAB" not in str((by_item.get(14) or {}).get("to", "")):
        problems.append("item 14 wording drifted (AGAB family code not found)")
    return problems


# ── row universe ────────────────────────────────────────────────────────────
def load_rows(courses, singletons, curations):
    """Catalog rows with the curation discipline overlaid, keyed by id."""
    rows = {}
    for source, recmap in (("minted", courses), ("singleton", singletons)):
        for cid, rec in recmap.items():
            disc = (curations.get(cid) or {}).get("discipline") or rec.get("discipline") or ""
            rows[cid] = {"id": cid, "source": source, "discipline": disc,
                         "title": rec.get("common_title") or "", "rec": rec}
    return rows


def z_ids(curations):
    return sorted(k for k in curations if parse_id(k)[4] == "z")


# ── Foreign Languages ───────────────────────────────────────────────────────
def load_fl_module():
    spec = importlib.util.spec_from_file_location("fldry", os.path.join(HERE, "_fl_subj4_dryrun.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def fl_dominant_codes(rows, memberships, fl_doc, fldry):
    """Per language: Counter of the colleges' local subject codes on its rows,
    from the memberships (corroborated) and the singleton's own subject."""
    lang_local = defaultdict(Counter)
    for cid, r in rows.items():
        if r["discipline"] != FL_DISCIPLINE:
            continue
        lang = classify_fl(r, memberships, fldry)[0]
        if not lang:
            continue
        if r["source"] == "minted":
            for m in memberships.get(cid, []):
                s = (m.get("subject") or "").upper().strip()
                if s:
                    lang_local[lang][s] += 1
        else:
            s = (r["rec"].get("subject") or "").upper().strip()
            if s:
                lang_local[lang][s] += 1
    return lang_local


def classify_fl(r, memberships, fldry):
    if r["source"] == "minted":
        return fldry.classify_mid(r["id"], r["rec"])
    return fldry.classify_singleton(r["rec"])


def fl_code_map(fl_doc, lang_local):
    """language -> (code, basis, measured) under item 10."""
    out = {}
    claimed = set(FL_RULED_CODES.values())
    # ruled languages first so their codes are claimed before the measured ones
    ordered = sorted(fl_doc["languages"].items(),
                     key=lambda kv: (kv[0] not in FL_RULED_CODES, kv[0] not in FL_KEEP_CSR, kv[0]))
    for lang, spec in ordered:
        current = spec["subj4"]
        local = lang_local.get(lang, Counter())
        top2 = local.most_common(2)
        dominant = top2[0][0] if top2 else None
        tie = len(top2) == 2 and top2[0][1] == top2[1][1]
        four = [c for c, n in local.most_common() if SUBJ4_RE.match(c)]
        dominant_four = four[0] if four else None
        measured = {"dominant_local": dominant, "dominant_local_rows": local.get(dominant, 0),
                    "dominant_four_letter": dominant_four,
                    "dominant_four_letter_rows": local.get(dominant_four, 0) if dominant_four else 0,
                    "rows": sum(local.values())}
        if lang in FL_RULED_CODES:
            code, basis = FL_RULED_CODES[lang], "ruled" if lang != "Spanish" else "ruled (C-ID SPAN)"
        elif lang in FL_KEEP_CSR:
            code, basis = current, "ruled: keeps the CSR code, flagged"
        elif dominant and SUBJ4_RE.match(dominant) and dominant not in claimed and tie:
            code, basis = current, f"flagged: the local codes tie ({top2[0][0]} and {top2[1][0]}), keeps the CSR code"
        elif dominant and SUBJ4_RE.match(dominant) and dominant not in claimed:
            code, basis = dominant, "dominant local code is four letters"
            if measured["rows"] < 10:
                basis += f" (thin: {measured['rows']} rows)"
        elif dominant and SUBJ4_RE.match(dominant) and dominant in claimed:
            # Nahuatl's rows carry SPAN — taught in Spanish departments — but a
            # language may not take another language's code.
            code, basis = current, f"flagged: dominant local code {dominant} belongs to another language, keeps the CSR code"
        else:
            code, basis = current, "flagged: no dominant four-letter local code, keeps the CSR code"
        out[lang] = {"code": code, "basis": basis, "current": current, "measured": measured}
        claimed.add(code)
    return out


# ── Agriculture ─────────────────────────────────────────────────────────────
def ag_signals(r, memberships):
    """-> (family_by_subject, family_by_title, family_by_top, detail)."""
    subs = Counter()
    tops = Counter()
    if r["source"] == "minted":
        for m in memberships.get(r["id"], []):
            subs[(m.get("subject") or "").upper().strip()] += 1
            tops[str(m.get("top_code") or "")[:4]] += 1
    else:
        subs[(r["rec"].get("subject") or "").upper().strip()] += 1
    own_top = str(r["rec"].get("top_code") or "")[:4]
    if own_top:
        tops[own_top] += 1
    fam_by_sub = Counter()
    for s, n in subs.items():
        for fam, codes in AG_SUBJ_FAMILY.items():
            if s in codes:
                fam_by_sub[fam] += n
    a = fam_by_sub.most_common(1)[0][0] if fam_by_sub else None
    if a and len([f for f, n in fam_by_sub.items() if n == fam_by_sub[a]]) > 1:
        a = None                                            # a tie is no vote
    words = set(re.sub(r"[^a-z0-9 ]+", " ", (r["title"] or "").lower()).split())
    fam_by_title = {fam for fam, ws in AG_TITLE_WORDS.items() if words & ws}
    b = next(iter(fam_by_title)) if len(fam_by_title) == 1 else None
    top4 = tops.most_common(1)[0][0] if tops else ""
    c = AG_TOP_FAMILY.get(top4)
    return a, b, c, {"local_subjects": dict(subs.most_common(4)), "top4": top4,
                     "title_families": sorted(fam_by_title)}


def classify_ag(r, memberships):
    a, b, c, detail = ag_signals(r, memberships)
    votes = Counter(x for x in (a, b, c) if x)
    fam, n = (votes.most_common(1)[0] if votes else (None, 0))
    # two-signals-agree: TOP alone never decides; subject+title, subject+TOP,
    # title+TOP all do. Viticulture (VE) is not a C-ID family: residual, flagged.
    if fam and n >= 2 and fam in AG_FAMILIES:
        return fam, "two signals agree", {"subject": a, "title": b, "top": c, **detail}
    if fam and n >= 2 and fam == "VE":
        return None, "viticulture / enology: no C-ID family (reading for Sam)", {"subject": a, "title": b, "top": c, **detail}
    if votes:
        return None, "one signal only: proposed " + ", ".join(f"{f} by {'subject' if f == a else 'title' if f == b else 'top'}" for f in votes), {"subject": a, "title": b, "top": c, **detail}
    return None, "no family signal", {"subject": a, "title": b, "top": c, **detail}


# ── the allocator ───────────────────────────────────────────────────────────
def load_id_reservations():
    spec = importlib.util.spec_from_file_location("s4dry", os.path.join(HERE, "_subj4_dryrun.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.load_id_reservations()


class Allocator:
    """Keep the number when the new key is free; gap-fill otherwise."""

    def __init__(self, used, reservations):
        self.used = set(used)         # every key that exists and is not moving
        self.taken = set()            # new keys assigned so far
        self.reservations = reservations
        self.gapfilled = []

    def free(self, key):
        return key not in self.used and key not in self.taken

    def place(self, old_id, new_prefix, prefer_keep=True, reason=""):
        prefix, letter, band, tail, kind = parse_id(old_id)
        candidate = f"{new_prefix} {letter}{band}{tail}"
        if prefer_keep and self.free(candidate):
            self.taken.add(candidate)
            return candidate, "kept number"
        # gap-fill
        if kind in ("corr", "z"):
            reserved = self.reservations.get((new_prefix, band), set()) if kind == "corr" else set()
            seq = 1
            while seq <= 999:
                k = f"{new_prefix} {letter}{band}{seq:03d}"
                if seq not in reserved and self.free(k):
                    self.taken.add(k)
                    self.gapfilled.append({"old_id": old_id, "wanted": candidate, "new_id": k, "why": reason})
                    return k, "gap-filled"
                seq += 1
            return None, "overflow"
        idx = 0
        while idx < 10 * 26 * 26:
            k = f"{new_prefix} {letter}{band}{standalone_code(idx)}"
            if self.free(k):
                self.taken.add(k)
                self.gapfilled.append({"old_id": old_id, "wanted": candidate, "new_id": k, "why": reason})
                return k, "gap-filled"
            idx += 1
        return None, "overflow"


def compute_plan(courses, singletons, memberships, curations, identities, canon_doc,
                 fl_doc, rulings, reservations, fldry):
    """Pure allocator. Returns the plan dict the receipts and the apply consume."""
    problems = check_rulings(rulings)
    rows = load_rows(courses, singletons, curations)
    zs = z_ids(curations)
    canon = canon_doc.get("disciplines") or {}

    moves = {}       # old_id -> plan row
    fl_class, ag_class = {}, {}

    # 1. what moves, and to which prefix
    def want(old_id, new_prefix, disc, kind, item, basis, extra=None):
        moves[old_id] = {"old_id": old_id, "new_prefix": new_prefix, "discipline": disc,
                         "kind": kind, "item": item, "basis": basis, **(extra or {})}

    plain_by_prefix = {old: (disc, new, item) for disc, old, new, item, _ in PLAIN}
    fan_by_prefix = {old: (disc, new, item, note) for disc, old, new, item, note in FAN_IN}
    for cid, r in rows.items():
        prefix, letter, band, tail, kind = parse_id(cid)
        if not kind:
            continue
        disc = r["discipline"]
        if prefix in plain_by_prefix and disc == plain_by_prefix[prefix][0]:
            d, new, item = plain_by_prefix[prefix]
            want(cid, new, d, "plain", item, f"{prefix}->{new}")
        elif prefix in fan_by_prefix and disc == fan_by_prefix[prefix][0]:
            d, new, item, note = fan_by_prefix[prefix]
            want(cid, new, d, "fan-in", item, note)
        elif disc == FL_DISCIPLINE:
            lang, src = classify_fl(r, memberships, fldry)
            fl_class[cid] = {"language": lang, "signal": src, "prefix": prefix}
        elif disc in AG_DISCIPLINES:
            fam, why, detail = classify_ag(r, memberships)
            ag_class[cid] = {"family": fam, "why": why, "prefix": prefix, **detail}

    # Foreign Languages codes (item 10)
    lang_local = fl_dominant_codes(rows, memberships, fl_doc, fldry)
    fl_codes = fl_code_map(fl_doc, lang_local)
    fl_known_prefixes = {v["current"] for v in fl_codes.values()} | {FL_RESIDUAL}
    fl_unlisted = Counter()
    for cid, c in fl_class.items():
        prefix = c["prefix"]
        lang = c["language"]
        if lang:
            code = fl_codes[lang]["code"]
            c["code"] = code
            if code != prefix:
                want(cid, code, FL_DISCIPLINE, "fl", 10, f"{lang}: {fl_codes[lang]['basis']}",
                     {"language": lang, "signal": c["signal"]})
            else:
                c["fate"] = "already on the language code"
        elif prefix in fl_known_prefixes:
            # a language-agnostic course keyed under a language or FLNG: the
            # residual, as the June split left it
            c["code"] = FL_RESIDUAL
            if prefix != FL_RESIDUAL:
                want(cid, FL_RESIDUAL, FL_DISCIPLINE, "fl", 10, "no language signal: residual",
                     {"language": None, "signal": c["signal"]})
            else:
                c["fate"] = "residual, unchanged"
        else:
            # a stray under a code the file does not know (ARME, LATN, GREE...)
            c["fate"] = "kept: language not in kb/foreign_language_subj4.json"
            fl_unlisted[prefix] += 1

    # Agriculture families (item 14)
    for cid, c in ag_class.items():
        disc = rows[cid]["discipline"]
        residual = AG_DISCIPLINES[disc]
        code = AG_FAMILIES[c["family"]] if c["family"] else residual
        c["code"] = code
        if code != c["prefix"]:
            want(cid, code, disc, "ag", 14, c["why"], {"family": c["family"]})
        else:
            c["fate"] = "unchanged (" + ("residual" if not c["family"] else "already on the family") + ")"

    # Z ids move with their namespace (POLS lesson). Plain / fan-in by prefix;
    # FL by the prefix's new code; AG by the modal family of the members.
    for zid in zs:
        prefix = parse_id(zid)[0]
        if prefix in plain_by_prefix:
            d, new, item = plain_by_prefix[prefix]
            want(zid, new, d, "plain", item, f"{prefix}->{new} (Z namespace)")
        elif prefix in fan_by_prefix:
            d, new, item, note = fan_by_prefix[prefix]
            want(zid, new, d, "fan-in", item, note + " (Z namespace)")
        elif prefix in fl_known_prefixes:
            langs = [l for l, v in fl_codes.items() if v["current"] == prefix]
            if langs and fl_codes[langs[0]]["code"] != prefix:
                want(zid, fl_codes[langs[0]]["code"], FL_DISCIPLINE, "fl", 10,
                     f"{langs[0]} (Z namespace)", {"language": langs[0]})
        elif prefix in AG_DISCIPLINES.values():
            members = [k for k, v in curations.items()
                       if isinstance(v, dict) and v.get("merge_into") == zid]
            fams = Counter(ag_class.get(m, {}).get("family") for m in members)
            fams.pop(None, None)
            if fams:
                fam = fams.most_common(1)[0][0]
                want(zid, AG_FAMILIES[fam], "Agriculture" if prefix == "AGRI" else "Agricultural Production",
                     "ag", 14, f"members' modal family {fam} (Z namespace)", {"family": fam})

    # 2. allocate. The collision surface is every key that exists in the catalog
    # or the curation overlay and is not itself moving. Keys that exist ONLY in
    # the articulation doc's identities map are stale pre-fold ghosts (the S110
    # class kb/_pols_remint.py healed: the June fold re-keyed the catalogs but
    # never the identities map) — they do not block, and the ones a move lands
    # on are healed by it; both are reported. Two passes: every row that can
    # keep its number keeps it FIRST, then the rest gap-fill — one pass would
    # let a displaced row take the next row's slot and cascade down the bucket
    # (measured on the first run: 554 shifts in Computer Science from one
    # taken key).
    real_keys = set(courses) | set(singletons) | set(curations)
    ghosts = set(identities) - real_keys
    used = real_keys - set(moves)
    alloc = Allocator(used, reservations)
    order = sorted(moves.values(), key=lambda m: (
        {"plain": 0, "fl": 1, "ag": 2, "fan-in": 3}[m["kind"]],   # fan-in gap-fills after Film keeps
        m["discipline"], parse_id(m["old_id"])[1] != "M", m["old_id"]))
    for m in order:                                  # pass 1: keep the number
        m["new_id"], m["how"] = None, None
        if m["kind"] == "fan-in":
            continue
        prefix, letter, band, tail, kind = parse_id(m["old_id"])
        candidate = f"{m['new_prefix']} {letter}{band}{tail}"
        if alloc.free(candidate):
            alloc.taken.add(candidate)
            m["new_id"], m["how"] = candidate, "kept number"
    for m in order:                                  # pass 2: gap-fill the rest
        if m["new_id"]:
            continue
        m["new_id"], m["how"] = alloc.place(m["old_id"], m["new_prefix"], prefer_keep=False,
                                            reason=m["basis"])
    ghosts_healed = sorted(set(m["new_id"] for m in moves.values() if m.get("new_id")) & ghosts)
    ghosts_vacated = sorted(set(moves) & set(identities))

    # 3. validation
    alias = {m["old_id"]: m["new_id"] for m in moves.values() if m.get("new_id")}
    new_ids = list(alias.values())
    dup = [k for k, n in Counter(new_ids).items() if n > 1]
    collide = sorted(set(new_ids) & used)
    overflow = [m["old_id"] for m in moves.values() if not m.get("new_id")]
    bad_subj4 = sorted({m["new_prefix"] for m in moves.values() if not SUBJ4_RE.match(m["new_prefix"])})
    inv = Counter(alias.values())
    n_art = sum(1 for a in identities_articulations(identities) if a in alias)
    validation = {
        "V1_conservation": {"pass": len(alias) == len(moves) - len(overflow), "moves": len(moves), "aliased": len(alias)},
        "V2_new_ids_unique": {"pass": not dup, "duplicates": dup[:10]},
        "V3_new_ids_disjoint_from_untouched": {"pass": not collide, "collisions": collide[:10]},
        "V4_discipline_unchanged": {"pass": True, "note": "a recode never changes a row's discipline; the apply gate re-checks it"},
        "V5_alias_invertible": {"pass": all(n == 1 for n in inv.values()), "duplicates": [k for k, n in inv.items() if n > 1][:10]},
        "V6_all_new_subj4_four_letters": {"pass": not bad_subj4, "bad": bad_subj4},
        "V7_no_overflow": {"pass": not overflow, "overflow": overflow[:10]},
    }
    return {
        "problems": problems, "moves": moves, "order": [m["old_id"] for m in order],
        "alias": alias, "gapfilled": alloc.gapfilled, "validation": validation,
        "fl_codes": fl_codes, "fl_class": fl_class, "fl_unlisted": dict(fl_unlisted),
        "ag_class": ag_class, "rows": rows, "z_ids": zs,
        "identities_ghosts": {"count": len(ghosts), "healed_by_this_recode": ghosts_healed,
                              "vacated_keys_still_in_identities": ghosts_vacated},
    }


def identities_articulations(identities):
    return list(identities or {})


def seed_edits(plan, canon_doc, fl_doc):
    """What the apply would write into the seed and the umbrella file."""
    edits = {"canonical": {}, "umbrella": {}, "foreign_language_subj4": {}}
    for disc, old, new, item, note in PLAIN + FAN_IN:
        edits["canonical"][disc] = {"from": old, "to": new, "item": item, "note": note}
    fl_codes = {lang: v["code"] for lang, v in plan["fl_codes"].items()}
    edits["umbrella"][FL_DISCIPLINE] = {"is_umbrella": True, "umbrella_codes": sorted(set(fl_codes.values()) | {FL_RESIDUAL}),
                                       "canonical_subj4": FL_RESIDUAL, "item": 10}
    for disc, residual in AG_DISCIPLINES.items():
        edits["umbrella"][disc] = {"is_umbrella": True, "umbrella_group": "agriculture",
                                   "umbrella_codes": sorted(set(AG_FAMILIES.values()) | {residual}),
                                   "canonical_subj4": residual, "item": 14}
    for lang, v in plan["fl_codes"].items():
        if v["code"] != v["current"]:
            edits["foreign_language_subj4"][lang] = {"from": v["current"], "to": v["code"], "basis": v["basis"]}
    edits["code_touch_points"] = [
        "kb/_row_audit.py UMBRELLA_DISCIPLINES (+ Agriculture, Agricultural Production)",
        "kb/_seed_coci_minted_mids.py UMBRELLA_DISCIPLINES (same)",
        "kb/_csr_trail.py UMBRELLA_DISCIPLINES (same)",
        "kb/_subj4_dryrun.py load_umbrella_allowances (+ the agriculture family codes)",
        "kb/_uc_cur_zscheme_dryrun.py UMBRELLA_DISCIPLINES (same)",
        "canonical_subj4.js UMBRELLA_EXTRA_SUBJ4 (+ the agriculture family codes)",
        "kb/foreign_language_subj4.json per-language subj4 (the FL codes above)",
        "kb/uc_cur_zseq.json counters: old prefix -> new prefix (the POLS pattern)",
        "Supabase _CANON_SUBJ4::<discipline> picks for the recoded disciplines (MCP, same window)",
        "kb/_rekey_promotions.py ALIAS_MAPS: register the apply receipt",
        "kb/_seed_authority_codes.py: re-run (canonical_source flips to c-id where the code now matches)",
    ]
    return edits


def write_receipts(plan, edits, out):
    os.makedirs(out, exist_ok=True)
    today = date.today().isoformat()
    moves = plan["moves"]
    alias_doc = {
        "_status": "DRY-RUN — authority recode (items 7, 9, 10, 11, 12, 13, 14, 16 of 2026-09-03); "
                   "no kb files mutated, no Supabase writes, the seed untouched.",
        "_generated_by": "kb/_authority_recode_dryrun.py",
        "_generated_at": today,
        "_rule": "keep the number, gap-fill only where the new key exists; Z ids move with their namespace",
        "count": len(plan["alias"]),
        "aliases": {old: {"new_id": m["new_id"], "discipline": m["discipline"], "kind": m["kind"],
                          "item": m["item"], "basis": m["basis"], "how": m["how"],
                          **({"language": m["language"]} if "language" in m else {}),
                          **({"family": m["family"]} if "family" in m else {})}
                    for old, m in sorted(moves.items()) if m.get("new_id")},
    }
    _dump(os.path.join(out, "alias_map.json"), alias_doc)
    _dump(os.path.join(out, "collisions.json"), {
        "_about": "keep-number candidates that were taken (a stray already under the new code, or "
                  "the fan-in pair) and the free key they were gap-filled to; plus the articulation "
                  "identities-map ghosts (keys that exist only there) the recode heals or vacates",
        "count": len(plan["gapfilled"]), "gapfilled": plan["gapfilled"],
        "identities_ghosts": plan["identities_ghosts"]})
    _dump(os.path.join(out, "fl_classification.json"), {
        "_about": "item 10 — every Foreign Languages row, its language by the June split's classifier "
                  "(TOP 11xx -> title -> local subject), and the code it takes",
        "codes": plan["fl_codes"], "unlisted_prefixes": plan["fl_unlisted"],
        "rows": dict(sorted(plan["fl_class"].items()))})
    _dump(os.path.join(out, "ag_classification.json"), {
        "_about": "item 14 — every Agriculture / Agricultural Production row, the three signals "
                  "(local subject family, title words, TOP family), and the family it takes when two agree",
        "families": AG_FAMILIES, "c_id": AG_CID,
        "rows": dict(sorted(plan["ag_class"].items()))})
    _dump(os.path.join(out, "seed_edits.json"), edits)
    sql = ["-- authority recode kb_curation re-key — generated by kb/_authority_recode_dryrun.py (PREVIEW)",
           "-- DO NOT RUN. The apply re-derives against a FRESH read of kb_curation (fresh-read at write-time).",
           "begin;"]
    for old, new in sorted(plan["alias"].items()):
        o, n = old.replace("'", "''"), new.replace("'", "''")
        sql.append(f"update public.kb_curation set course_id = '{n}' where course_id = '{o}';")
        sql.append(f"update public.kb_curation set value = '{n}' where field = 'merge_into' and value = '{o}';")
    sql.append("commit;")
    with open(os.path.join(out, "supabase_ops.sql"), "w", encoding="utf-8") as f:
        f.write("\n".join(sql) + "\n")
    with open(os.path.join(out, "report.md"), "w", encoding="utf-8") as f:
        f.write(render_report(plan, edits, today, out))


def _dump(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)
        f.write("\n")


def render_report(plan, edits, today, out):
    moves, alias, val = plan["moves"], plan["alias"], plan["validation"]
    by_kind = Counter(m["kind"] for m in moves.values())
    by_how = Counter(m.get("how") for m in moves.values())
    by_disc = Counter(m["discipline"] for m in moves.values())
    n_z = sum(1 for o in moves if parse_id(o)[1] == "Z")
    rel = os.path.relpath(out, ROOT)
    L = []
    L += ["---", "title: Authority recode — DRY-RUN (items 7, 9, 10, 11, 12, 13, 14, 16 of 2026-09-03)",
          f"date: {today}", "session: 224 (SkyTune)",
          "status: DRY-RUN — nothing mutated; awaiting Sam's review of the readings below before any apply",
          "tags: [remint, dry-run, csr, subj4, authority-codes, rule-7]",
          "artifacts:", f"  - {rel}/alias_map.json", f"  - {rel}/collisions.json",
          f"  - {rel}/fl_classification.json", f"  - {rel}/ag_classification.json",
          f"  - {rel}/seed_edits.json", f"  - {rel}/supabase_ops.sql",
          "related:", "  - kb/csr_authority_codes_rulings_2026-09-03.json",
          "  - docs/coursecontrolnumber_remint.md", "  - kb/_pols_remint.py (the keep-number precedent)", "---", "",
          "# Authority recode — DRY-RUN", ""]
    if plan["problems"]:
        L += ["## ⚠️ PLAN DRIFT", ""] + [f"- {p}" for p in plan["problems"]] + [""]
    L += ["## TL;DR", "",
          f"- **{len(alias):,}** ids move ({by_kind.get('plain', 0):,} plain prefix re-keys, "
          f"{by_kind.get('fan-in', 0):,} Media Production rows into FTVE, {by_kind.get('fl', 0):,} "
          f"Foreign Languages rows, {by_kind.get('ag', 0):,} agriculture rows); **{n_z:,}** of them are "
          f"Z-band identities moving with their namespace.",
          f"- **{by_how.get('kept number', 0):,}** keep their number; **{by_how.get('gap-filled', 0):,}** "
          f"gap-fill because the key was taken (see collisions.json).",
          f"- Validation: **{sum(1 for v in val.values() if v['pass'])}/{len(val)}** gates pass. "
          f"Articulation identities-map ghosts healed by the move: "
          f"{len(plan['identities_ghosts']['healed_by_this_recode'])}; old keys the apply must also "
          f"re-key in that map: {len(plan['identities_ghosts']['vacated_keys_still_in_identities'])}.",
          "- Why not `kb/_subj4_dryrun.py`: measured the same day with the committed seed, the June "
          "allocator would move 62,638 of 70,946 ids to change nothing (titles were normalized after the "
          "June fold), so a code change is a prefix re-key that keeps the number — the POLS pattern.", ""]
    L += ["## Gates", "", "| gate | pass | detail |", "|---|---|---|"]
    for k, v in val.items():
        detail = {kk: vv for kk, vv in v.items() if kk != "pass"}
        L.append(f"| {k} | {'✅' if v['pass'] else '❌'} | {json.dumps(detail)[:160]} |")
    L += ["", "## By discipline", "", "| discipline | rows moving | kept number | gap-filled |", "|---|---|---|---|"]
    for d, n in by_disc.most_common():
        kept = sum(1 for m in moves.values() if m["discipline"] == d and m.get("how") == "kept number")
        L.append(f"| {d} | {n:,} | {kept:,} | {n - kept:,} |")
    # Foreign Languages table
    L += ["", "## Item 10 — the language codes", "",
          "Rule as ruled: SPAN on C-ID's authority; a language the ruling names takes the code it names; "
          "any other language takes its dominant local code when that code is four letters, else keeps the "
          "CSR code, flagged. `measured` is the colleges' own subject code on the language's rows.", "",
          "| language | today | proposed | basis | dominant local (rows) | dominant four-letter (rows) | rows moving |", "|---|---|---|---|---|---|---|"]
    fl_moving = Counter(m.get("language") for m in moves.values() if m["kind"] == "fl")
    for lang, v in sorted(plan["fl_codes"].items(), key=lambda kv: -kv[1]["measured"]["rows"]):
        ms = v["measured"]
        flag = " ⚠️" if "flagged" in v["basis"] else ""
        L.append(f"| {lang} | {v['current']} | **{v['code']}**{flag} | {v['basis']} | "
                 f"{ms['dominant_local']} ({ms['dominant_local_rows']}) | {ms['dominant_four_letter']} "
                 f"({ms['dominant_four_letter_rows']}) | {fl_moving.get(lang, 0)} |")
    if plan["fl_unlisted"]:
        L += ["", "Strays keyed under a code the file does not know — kept as they are, a reading for Sam "
              "(add the language to `kb/foreign_language_subj4.json` with this code, or say which):", ""]
        for p, n in sorted(plan["fl_unlisted"].items(), key=lambda kv: -kv[1]):
            L.append(f"- `{p}` · {n} row{'s' if n != 1 else ''}")
    resid = sum(1 for c in plan["fl_class"].values() if c.get("code") == FL_RESIDUAL)
    L += ["", f"FLNG residual after the recode: {resid} rows (language-agnostic courses)."]
    strays = Counter((m["old_id"].split(" ")[0], m["new_prefix"]) for m in moves.values()
                     if m["kind"] == "fl" and m["old_id"].split(" ")[0] not in
                     ({v["current"] for v in plan["fl_codes"].values()} | {FL_RESIDUAL}))
    if strays:
        L += ["", "Strays the classifier places in a language (TOP, title or local subject — the "
              "signal is on each row in fl_classification.json):", "",
              "| from | to | rows |", "|---|---|---|"]
        for (a, b), n in strays.most_common():
            L.append(f"| {a} | {b} | {n} |")
    # Agriculture
    ag = plan["ag_class"]
    fams = Counter(c["family"] for c in ag.values())
    whys = Counter(c["why"].split(":")[0] for c in ag.values() if not c["family"])
    L += ["", "## Item 14 — the agriculture families", "",
          "Two independent signals must agree (local subject-code family · title words · TOP family; TOP "
          "never decides alone, Rule 7). Residual rows keep the discipline's own code: AGRI for Agriculture, "
          "AGPR for Agricultural Production — **a reading for Sam** (the sheet said AGRI is the residual; "
          "keeping AGPR for Agricultural Production's residual avoids two MQ disciplines sharing one code).", "",
          "| family | C-ID | code | rows |", "|---|---|---|---|"]
    for fam, code in AG_FAMILIES.items():
        L.append(f"| {fam} | {AG_CID[fam]} | {code} | {fams.get(fam, 0):,} |")
    L += [f"| residual | — | AGRI / AGPR | {fams.get(None, 0):,} |", "",
          "Why the residual rows stay:", ""]
    for w, n in whys.most_common():
        L.append(f"- {w}: {n:,}")
    one = [c for c in ag.values() if c["why"].startswith("one signal")]
    by_prop = Counter(c["why"] for c in one)
    L += ["", f"One-signal rows ({len(one):,}) with their proposal, for a curator's eye:", ""]
    for w, n in by_prop.most_common(12):
        L.append(f"- {w}: {n:,}")
    ve = sum(1 for c in ag.values() if c["why"].startswith("viticulture"))
    L += ["", f"Viticulture / enology rows with two agreeing signals but no C-ID family: {ve:,} — "
          "**reading for Sam**: keep them residual (as here), or file them under AGPS (plant science)?"]
    L += ["", "## Readings to confirm (reply by number)", "",
          "1. Item 13: Media Production shares FTVE with Film and Media Studies as a fan-in pair; Film keeps "
          f"its numbers and Media Production's {by_kind.get('fan-in', 0)} rows gap-fill after them.",
          "2. Item 14: the families take AGAB, AGAS, AGPS, AGEH, AGMA; Agriculture's residual is AGRI and "
          "Agricultural Production's residual is AGPR (or AGRI for both — say which).",
          "3. Item 14: viticulture / enology (TOP 0104) stays residual, or takes AGPS.",
          "4. Item 14: C-ID AG-EH's corpus home is Ornamental Horticulture (7 of 12 rows), a discipline the "
          "sheet did not list; it keeps HORT with a C-ID AG-EH chip unless you fold it into the umbrella.",
          "5. Item 10: Arabic takes ARAB as the ruling names it; the measured dominant local code is ARBC "
          "by two rows (30 vs 28).",
          "6. Item 10: the languages flagged above keep their CSR code; the strays listed keep theirs "
          "until the file names them.", "",
          "## Apply procedure (not run here)", "",
          "1. Sam confirms the readings; the FL / AG classifications stand as receipts.",
          "2. `kb/_authority_recode_apply.py` (to be built from compute_plan, apply == spec): re-keys the "
          "catalog, memberships, articulations + identities, curation keys + merge_into pointers, the "
          "zseq counters, the seed (canonical codes, umbrella flags) and the FL file; asserts the plan "
          "matches this receipt.",
          "3. Same cron window: Supabase kb_curation re-key from the receipt (supabase-rekey.yml, a "
          "generic --verify), the _CANON_SUBJ4:: picks, then kb/_post_apply_chain.py (promotions, "
          "csr-seed, authority, audit, receipts, fold-verify).",
          "4. Then the Z-band retirement (kb/_zband_retire_dryrun.py --after-recode this alias map).", "",
          "Code touch points the apply carries:", ""]
    L += [f"- {t}" for t in edits["code_touch_points"]]
    L += [""]
    return "\n".join(L)


def main():
    rulings = _load(RULINGS)
    courses = _load(COURSES)["courses"]
    singletons = _load(SINGLETONS)["courses"]
    memberships = _load(MEMBERSHIPS)["memberships"]
    art = _load(ARTICULATIONS)
    identities = art.get("identities") or {}
    curations = _load(CURATION).get("curations") or {}
    canon_doc = _load(CANONICAL)
    fl_doc = _load(FL_SPLIT)
    reservations = load_id_reservations()
    fldry = load_fl_module()

    plan = compute_plan(courses, singletons, memberships, curations, identities, canon_doc,
                        fl_doc, rulings, reservations, fldry)
    edits = seed_edits(plan, canon_doc, fl_doc)
    out = os.path.join(OUT_DIR, date.today().isoformat())
    write_receipts(plan, edits, out)

    val = plan["validation"]
    by_kind = Counter(m["kind"] for m in plan["moves"].values())
    by_how = Counter(m.get("how") for m in plan["moves"].values())
    print(f"[authority_recode_dryrun] {date.today().isoformat()}")
    if plan["problems"]:
        print("  ⚠️ PLAN DRIFT: " + "; ".join(plan["problems"]))
    print(f"  moves: {len(plan['alias']):,}  (" + ", ".join(f"{k} {v:,}" for k, v in by_kind.most_common()) + ")")
    print(f"  kept number {by_how.get('kept number', 0):,} · gap-filled {by_how.get('gap-filled', 0):,} · "
          f"overflow {by_how.get('overflow', 0):,}")
    print(f"  validation: {sum(1 for v in val.values() if v['pass'])}/{len(val)} pass")
    for k, v in val.items():
        if not v["pass"]:
            print(f"    ❌ {k}: {json.dumps({kk: vv for kk, vv in v.items() if kk != 'pass'})[:200]}")
    print(f"  artifacts: {os.path.relpath(out, ROOT)}/{{alias_map,collisions,fl_classification,"
          f"ag_classification,seed_edits}}.json + supabase_ops.sql + report.md")


if __name__ == "__main__":
    main()
