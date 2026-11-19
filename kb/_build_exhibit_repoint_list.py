#!/usr/bin/env python3
"""_build_exhibit_repoint_list.py — the one reviewed re-point list, keyed by (MAP exhibit id + local title).

COBIx's item 6 on issue #3464 (S678, 2026-11-17), ranked: one reviewed list, then the rule batches on it. Each row
changes only that pair's canonical title; kb/exhibit_repoint.py holds what a row may and may not do, and
kb/_cred_rename_apply.py --pairs applies the list through the reviewed path, later.

The batches, each COBIx's rule as written on the issue:
  ctcnc           cert-course-title-rule-2026-11-17.md: the American River CTCNC modules (MAPICA-CTCC10-1-001)
                  move, by their own local title, under "Carpenters Apprenticeship — {trade}"; the trade comes from
                  the CARP series table, overridden by a trade the module title names; a disagreement goes to a person.
  apprenticeship  person-piles-rules-2026-11-17.md section 3: an unclassified cert-based title that names a known
                  apprenticeship issuer and a Year, Level or Journeyperson rung lands on the one existing family for
                  issuer + trade + rung, or a minted "{Issuer} {Trade} Apprenticeship — {rung}"; a similarly named
                  family, a career certificate, or no rung skips.
  low_confidence  person-piles section 5: of the titles below 0.80, a typographic or course-title match confirms
                  as-is (confidence only), and a course-code-only title whose official course and CR agree with each
                  other and not with the canonical re-points (graded, never Sam-curated).
  split           ask-sky-left-map-actions.md, "Split" and "Naming new graded canonicals": a canonical that mixes
                  GRADED (Credit By Exam, Portfolio Review) with CERT-BASED exhibits splits in two. The cert-based
                  side keeps a cert-form title, the graded side moves to the C-ID, then CCN, then M-ID title of its
                  articulated course (else the cleaned local course title), with " ({issuer} {cert} Standards)"
                  only on a clear cert link. Sam-curated canonicals are tap-only.

Actions on a row: repoint / assign / confirm (the apply takes these), tap_only (Sam's tap, never applied), person
(a person decides; listed so the pile is visible), skip (out of the rule, with the reason).

Inputs: kb/unified_titles.json, kb/credentials.json, kb/coci_articulations.json, kb/credential_review_overlay.json,
kb/exhibit_audit/latest.json, kb/exhibits_review.json, the C-ID descriptors, and, with --map, the runner's
CustomReport_latest.json (it carries the exhibit ids that 2,784 local titles lack in the committed record).

Run from the repo root:  python3 kb/_build_exhibit_repoint_list.py [--map CustomReport_latest.json] [--check]
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import cert_naming  # noqa: E402
import exhibit_repoint as xr  # noqa: E402
import slash_titles  # noqa: E402

OUT = xr.LIST_PATH
P = lambda *a: os.path.join(HERE, *a)  # noqa: E731

CTCNC_ID = "MAPICA-CTCC10-1-001"
CTCNC_SERIES = [((4, 20), "Carpenter"), ((100, 199), "Drywall/Lather"), ((200, 299), "Pile Driver"),
                ((300, 399), "Scaffold Erector"), ((400, 499), "Hardwood Floor Layer"), ((500, 599), "Insulator"),
                ((600, 699), "Shingler"), ((700, 799), "Acoustical Installer"), ((800, 899), "Millwright"),
                ((900, 999), "Cabinetmaker"), ((1200, 1299), "Modular Installer")]
# A trade the module title names (COBIx's list); "scaffold" as equipment does not override the series.
CTCNC_TITLE_TRADES = [(r"pile\s*driv|wharfage|marine structures", "Pile Driver"),
                      (r"\blath|drywall", "Drywall/Lather"), (r"acoustical", "Acoustical Installer"),
                      (r"for scaffold erectors|scaffold erector", "Scaffold Erector"),
                      (r"mill cabinet|cabinet", "Cabinetmaker"), (r"millwright", "Millwright"),
                      (r"insulat", "Insulator"), (r"hardwood floor", "Hardwood Floor Layer"),
                      (r"shingl", "Shingler"), (r"modular", "Modular Installer")]
# A canonical that already names a certification (COBIx's step 4: P.C. 832 ..., OSHA 10-hour, CAL-OSHA 30-Hour,
# Swiftwater Rescue Technician 1). A module title that only ends in "Certification" (CARP 294, Welding 6: FCAW 4G
# Certification) is a course name and still moves.
CERT_FORM = re.compile(r"\bOSHA\b|^P\.C\. \d+|Rescue Technician")
# A canonical that already names the CTCNC apprenticeship (the per-code keys CARP 707, 710, 713, Work Experience, the
# introduction-to-apprenticeship courses) is outside cause 1: COBIx's 199 hold none of them.
CTCNC_NAMED = re.compile(r"Carpenters Training Committee|Apprenticeship", re.I)


def ctcnc_series(n):
    for (lo, hi), trade in CTCNC_SERIES:
        if lo <= n <= hi:
            return trade
    return ""


def ctcnc_title_trade(title):
    hits = []
    for pat, trade in CTCNC_TITLE_TRADES:
        if re.search(pat, title or "", re.I) and trade not in hits:
            hits.append(trade)
    return hits


def _row(batch, eid, local, action, frm, to, reason, idx, **kw):
    r = {"batch": batch, "exhibit_id": eid, "local_title": local, "action": action, "from": frm, "to": to,
         "reason": reason}
    if to:
        r["target_exists"] = to in idx.creds
        r["target_sam_curated"] = bool(to in idx.creds and idx.sam_curated(to))
    r.update(kw)
    return r


# ── batch: the CTCNC modules ───────────────────────────────────────────────────────────────────────────────────────

def batch_ctcnc(idx):
    rows = []
    for key, rec in sorted(idx.ut.items()):
        if "CTCNC" not in key or (rec.get("confidence_title") or 0) >= 0.8:
            continue
        canon = rec.get("unified_title")
        if canon.startswith("Carpenters Apprenticeship"):
            continue
        for eid in sorted(idx.ids_of.get(key, ())):
            ty, src = idx.type_of(eid)
            if xr.group_of(ty) != "cert":
                continue
            path = xr.PATH_GROUP.get(xr.exhibit_paths.path_of(eid), "")
            mk = lambda action, to, why, **kw: rows.append(  # noqa: E731
                _row("ctcnc", eid, key, action, canon, to, why, idx, **kw))
            if path == "graded":
                mk("skip", None, "official type is cert-based and the id path is graded: a person or a type "
                                 "correction decides")
                continue
            if CERT_FORM.search(canon):
                mk("skip", None, "the current canonical already names a certification")
                continue
            if CTCNC_NAMED.search(canon):
                mk("skip", None, "the current canonical already names the CTCNC apprenticeship (outside cause 1)")
                continue
            m = re.search(r"CTCNC\s+CARP\s*(\d{3,4})", key)
            if not m:
                mk("person", None, "no CARP number, and the module names no official issuer or certificate")
                continue
            n = int(m.group(1))
            series = ctcnc_series(n)
            named = ctcnc_title_trade(canon)
            if len(named) > 1:
                mk("person", None, "the module title names more than one trade: %s" % ", ".join(named))
                continue
            if named and series and named[0] != series:
                mk("person", None, "the title names %s and CARP %03d's series is %s" % (named[0], n, series))
                continue
            trade = named[0] if named else series
            if not trade:
                mk("person", None, "CARP %03d has no series entry and the title names no trade" % n)
                continue
            to = "Carpenters Apprenticeship — " + trade
            if to not in idx.creds and _and_form(to) in idx.creds:
                to = _and_form(to)  # the family after the slash-to-and rename (Sam, 2026-11-18): Drywall and Lather
            evidence = ("title names %s" % trade) if named else ("CARP series %03d" % n)
            if to not in idx.creds:
                mk("person", None, "no existing family %r" % to)
            elif idx.sam_curated(canon):
                mk("tap_only", to, "the current canonical is Sam-curated: shown on a tap, never applied",
                   evidence=evidence)
            elif idx.sam_curated(to):
                mk("person", None, "the family %r is Sam-curated" % to)
            else:
                mk("repoint", to, "CTCNC module under its trade family; the local title stays as an alias",
                   evidence=evidence, target_issuer=None)
    return rows


# ── batch: the apprenticeship family rule on the unclassified titles ──────────────────────────────────────────────

APPR_ISSUERS = [  # (pattern on the local title, family prefix)
    (r"^IBEW\b(?:\s+Local\s+\d+)?", "IBEW"),
    (r"^Sacramento Electrical Training Center", "IBEW"),
    (r"^UA\b(?:\s+Local\s+\d+)?", "UA"),
    (r"^Pipe Trades Training Center", "UA"),
    (r"^Sheet Metal\b(?:\s+Local\s+\d+)?", "Sheet Metal"),
    (r"^American Aerospace Technical Academy", "AATA"),
    (r"^Goodwill\b", "Goodwill"),
]
# Documented trade aliases already in use on settled titles (COBIx, person-piles section 3, step 2).
APPR_TRADE_ALIAS = {("IBEW", "inside wireman"): "Electrician",
                    ("UA", "plumbing and pipefitting"): "Plumbers/Pipefitters",
                    ("UA", "plumbers pipefitters"): "Plumbers/Pipefitters",
                    ("Sheet Metal", "sheet metal building trades"): ""}
GENERIC = {"technology", "technician", "apprenticeship", "specialist", "mechanic", "installer", "and", "the", "of"}
MODIFIERS = re.compile(r"\b(Residential|Welder|Power Lineman)\b")
FAMILY = re.compile(r"^(?P<head>.+?) Apprenticeship — (?P<rung>Journeyperson|(?:Year|Level) \d)$")


def _stems(text):
    return {w[:5] for w in re.findall(r"[a-z]+", (text or "").lower()) if w not in GENERIC}


def _and_form(head):
    """A family head as the slash-to-and rule writes it (Sam, 2026-11-18): "UA Plumbers/Pipefitters" is "UA Plumbers
    and Pipefitters". The rule is kb/slash_titles.py's, never a copy: a code slash (HVAC/R, A/C) and an official
    name's slash stay, and a spaced slash between two whole names stays as printed (held for a person)."""
    return slash_titles.ruled_form(head or "")


def _new_key(name, idx):
    """(key, None) for the canonical key a re-point creates, or (None, why) when the slash rule holds the name for a
    person. A new key is written kb/slash_titles.ruled_form (the S679 conductor on #3472, 2026-11-18): a slash joining
    words reads "and" ("Fire Service in-Service Training/EMS" is "Fire Service in-Service Training and EMS", the
    source's capitalization kept), and a code slash or an official name's slash stays, a C-ID descriptor title among
    them ("Algebra/Trigonometry-Based Physics A", C-ID PHYS 105). A spaced slash between two whole names is held for a
    person by the rule (d), so no key is minted for it. An existing key passes as it is: the slash-to-and rename
    carries it, and kb/exhibit_repoint.slash_wait holds the row until then. The apply writes this string and
    `kb/slash_titles.py --check` reads it with the same slashes(), so the key never fails the guard."""
    if not name or name in idx.creds:
        return name, None
    key = slash_titles.ruled_form(name)
    if slash_titles.word_slash(key):
        return None, ("the new name %r joins two whole names with a slash, which the slash-to-and rule holds for a "
                      "person (rule d, S679): a person names it" % name)
    return key, None


def _trade_key(text):
    """The trade's grouping key: the rule's spelling, lowercased, whitespace squashed."""
    return re.sub(r"\s+", " ", _and_form(text).lower()).strip()


def batch_apprenticeship(idx, audit, review):
    held = {h["raw"]: h for h in (review.get("held") or [])}
    unclassified = [c["raw_title"] for c in audit.get("title_cards") or [] if "unclassified_in_map" in c["tags"]]
    families = defaultdict(dict)  # issuer prefix -> {(trade key, rung n or J): title}
    for t in idx.creds:
        m = FAMILY.match(t)
        if not m:
            continue
        for prefix in ("IBEW", "UA", "Sheet Metal", "AATA", "Goodwill"):
            head = m.group("head")
            if head == prefix or head.startswith(prefix + " "):
                trade = head[len(prefix):].strip()
                rung = m.group("rung")
                rk = "J" if rung == "Journeyperson" else rung.split()[1]
                families[prefix][(_trade_key(trade), rk)] = t
    # One family, one spelling (COBIx on #3472, S679), and that spelling joins words with "and" (Sam, 2026-11-18, in
    # session: "I believe I replaced the / with and to avoid formatting issues and should be a general rule for other
    # titles. UA Plumbers and Pipefitters"). The UA plumbing family's Level 1 key reads "UA Plumbers and Pipefitters"
    # and Levels 2 to 4 and Journeyperson read "UA Plumbers/Pipefitters": one family under Sam's rule, spelled the
    # "and" way. Each rung assigns to its existing key, and the slash-to-and rename (S679, its own PR) re-keys the
    # slash rungs to the "and" spelling, carrying every exhibit under them. Heads that still differ once the rule is
    # applied are two spellings: the one most rungs carry is the family's, a rung keyed under the other goes to a
    # person (merge the key, then rebuild), and a tie sends every rung to a person.
    spelling = {}  # (prefix, trade key) -> the family's head ("and" form), or None on a tie
    for prefix, fam in families.items():
        heads = defaultdict(Counter)
        for (tk, _), t in fam.items():
            heads[tk][_and_form(FAMILY.match(t).group("head"))] += 1
        for tk, c in heads.items():
            top = c.most_common()
            spelling[(prefix, tk)] = top[0][0] if len(top) == 1 or top[0][1] > top[1][1] else None
    rows = []
    for raw in sorted(unclassified):
        h = held.get(raw) or {}
        ids = list(h.get("ids") or []) or sorted(idx.ids_of.get(raw.strip(), ()))
        for a in idx.arts:
            if xr.norm(a.get("exhibit_title")) == xr.norm(raw) and a["exhibit_id"] not in ids:
                ids.append(a["exhibit_id"])

        def mk(action, to, why, **kw):
            for eid in ids or [None]:
                rows.append(_row("apprenticeship", eid, raw, action if eid or action != "assign" else "person",
                                 None, to, why if eid else why + "; no MAP exhibit id in the committed record "
                                 "(the runner's CustomReport carries it: rebuild with --map)", idx, **kw))
        if re.match(r"^JOURN\b", raw):
            mk("skip", None, "a college course title used as the exhibit")
            continue
        if raw.startswith("High School Articulation"):
            mk("skip", None, "High School Articulation (another rule)")
            continue
        if re.search(r"Career Certificate|Certificate of Achievement", raw):
            mk("skip", None, "a career or completion certificate, never collapsed into Journeyperson")
            continue
        rung_m = re.search(r"\b(?:Year|Level)\s+(\d)\b|\bJourneyperson\b", raw)
        prefix = next((p for pat, p in APPR_ISSUERS if re.match(pat, raw)), "")
        if not prefix:
            if re.search(r"Apprenticeship", raw) and not rung_m:
                mk("skip", None, "an apprenticeship title with no Year, Level or Journeyperson rung")
            elif re.search(r"Apprenticeship", raw):
                fam_like = [t for t in idx.creds if "Sound and Communication" in t] if "Sound and Communication" in raw else []
                mk("skip", None, ("a similarly named family exists (%s)" % fam_like[0]) if fam_like
                   else "the issuer is not a known apprenticeship issuer")
            else:
                mk("skip", None, "not an apprenticeship family title")
            continue
        if not rung_m:
            mk("skip", None, "an apprenticeship title with no Year, Level or Journeyperson rung")
            continue
        rk = rung_m.group(1) or "J"
        issuer_m = next(re.match(pat, raw) for pat, p in APPR_ISSUERS if re.match(pat, raw))
        trade = raw[issuer_m.end():]
        trade = re.sub(r"\bApprenticeship\b.*$", "", trade).strip(" -—")
        trade = re.sub(r"\bNon Destructive\b", "Nondestructive", trade)  # the trade's own spelling
        if prefix == "UA" and raw.startswith("Pipe Trades"):
            trade = trade.strip()
        alias = APPR_TRADE_ALIAS.get((prefix, _trade_key(trade)))
        tkey = _trade_key(alias if alias is not None else trade)
        fam = families.get(prefix, {})
        hit = fam.get((tkey, rk))
        if hit:
            head, fam_head = FAMILY.match(hit).group("head"), spelling.get((prefix, tkey))
            if _and_form(head) != fam_head:
                to = (hit.replace(head + " Apprenticeship", fam_head + " Apprenticeship", 1) if fam_head else None)
                mk("person", to, ("the rung key %r spells the family differently from its other rungs (%s): merge "
                                  "the key into the family's spelling, then rebuild, so the series lands under one "
                                  "family name%s" % (hit, fam_head + " Apprenticeship" if fam_head
                                                     else "a tie between spellings",
                                                     "; the key is Sam-curated, so the merge is his tap"
                                                     if idx.sam_curated(hit) else "")))
                continue
            mk("assign", hit, "the one existing family for %s + trade + rung%s" % (
                prefix, "" if head == fam_head else "; the key spells the family %r, and the slash-to-and rename "
                "(Sam, 2026-11-18) re-keys it to %r with this exhibit under it" % (head, fam_head)),
               allow_sam_target=True, target_issuer=None, confidence=0.85)
            continue
        rivals = sorted({t for (k, _), t in fam.items() if k != tkey and _stems(k) & _stems(tkey)},
                        key=lambda t: (-len(_stems(t) & _stems(tkey)), t))
        if rivals and not MODIFIERS.search(trade):
            mk("skip", None, "a similarly named family exists (%s): no second family, no auto-alias" % rivals[0])
            continue
        rung = "Journeyperson" if rk == "J" else "Year " + rk
        to = "%s %s Apprenticeship — %s" % (prefix, alias if alias else trade, rung)
        to = re.sub(r"^Sheet Metal Sheet Metal ", "Sheet Metal ", to)
        to, slash_why = _new_key(to, idx)
        if slash_why:
            mk("person", None, slash_why)
            continue
        issuer = h.get("issuer") or next((r.get("issuing_agency") for t in fam.values()
                                          for r in idx.creds.get(t) or [] if r.get("issuing_agency")), None)
        mk("assign", to, "no family and no similarly named rival: minted {Issuer} {Trade} Apprenticeship — {rung}",
           target_issuer=issuer, confidence=0.85, minted=True)
    return rows


# ── naming a new graded canonical (Sam, 2026-11-17, 10:17–10:25 AM PT) ───────────────────────────────────────────

ABBREV = [(r"\bIntro\.?(?=\s|$)", "Introduction"), (r"\bMgmt\b|\bMgt\b", "Management"), (r"\bTech\.?(?=\s|$)", "Technology"),
          (r"\bFund\.", "Fundamentals"), (r"\bAdmin\b", "Administration"), (r"\bPrep\b", "Preparation"),
          (r"\bPrinc?\.?(?=\s)", "Principles"), (r"\bOrg\.", "Organization"), (r"\bMktg\b", "Marketing"),
          (r"\bAcctg?\b", "Accounting"), (r"\bElem\b", "Elementary"), (r"\bInterm\b", "Intermediate"),
          (r"\bAdv\.", "Advanced"), (r"\bBeg\b", "Beginning"), (r"\bSvcs\b", "Services"), (r"\bSvc\b", "Service"),
          (r"\bMaint\b", "Maintenance"), (r"\bTrng\b", "Training"), (r"\bMfg\b", "Manufacturing"),
          (r"\bGovt\b|\bGov\.", "Government"), (r"\bDept\b", "Department"), (r"\bAmer\.", "American"),
          (r"\bHist\.", "History"), (r"\bPsych\.", "Psychology"), (r"\bEcon\.", "Economics"), (r"\bBio\.", "Biology"),
          (r"\bChem\.", "Chemistry"), (r"\bLit\.", "Literature"), (r"\bLang\.", "Language"),
          (r"\bInfo\.", "Information"), (r"\bComm\.", "Communication"), (r"\bAssoc\.", "Associate")]
SMALL = {"a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"}
KEEP_UPPER = {"CNA", "EMT", "ASE", "A+", "AP", "IT", "CPR", "AED", "EMR", "HVAC", "CAD", "CNC", "GIS", "PC", "II", "III",
              "IV", "VI", "VII", "VIII", "IX", "XI", "XII"}
CODE = re.compile(r"\(?\b[A-Z]{2,8}\s?-?\d{1,4}[A-Z]{0,3}\b\)?")


def clean_local_title(t):
    """Sam's example: "Intro to Human Resources Management -- (BUS 178)" becomes
    "Introduction to Human Resources Management"."""
    s = CODE.sub(" ", t or "")
    s = re.sub(r"\s*[-–—]{1,2}\s*$", "", re.sub(r"\(\s*\)", " ", s))
    s = re.sub(r"^\s*[-–—:]+\s*|\s*[-–—:]+\s*$", "", " ".join(s.split()))
    for pat, rep in ABBREV:
        s = re.sub(pat, rep, s)
    words = s.split()
    out = []
    for i, w in enumerate(words):
        core = w.strip(",:;()")
        if core.upper() in KEEP_UPPER or core == "CompTIA":
            out.append(w.replace(core, core.upper() if core != "CompTIA" else core))
        elif core.lower() in SMALL and 0 < i < len(words) - 1:
            out.append(w.lower())
        elif w.isupper() or w.islower():
            out.append(w[:1].upper() + w[1:].lower())
        else:
            out.append(w)
    s = " ".join(out)
    return s if len(re.sub(r"[^A-Za-z]", "", s)) >= 3 else ""


def cert_link(texts, issuers):
    """The " ({issuer} {cert} Standards)" suffix, only on a clear link: ASE plus a test code, a named CompTIA
    product, or CEH with EC-Council on the title or the record. AP, CLEP, IB, DSST and state licenses never."""
    for t in texts:
        r = cert_naming.ase_read(t or "", "")
        if r and r.get("codes") and r["kind"] != "missing-code":
            return "ASE %s Standards" % " + ".join(r["codes"])
    for t in texts:
        m = re.search(r"\bCompTIA\s+(A\+|Network\+|Security\+|Server\+|Cloud\+|Linux\+|CySA\+|PenTest\+|ITF\+|Data\+|Project\+)",
                      t or "")
        if m:
            return "CompTIA %s Standards" % m.group(1)
    for t in texts:
        if re.search(r"Certified Ethical Hacker|\bCEH\b", t or "") and any("EC-Council" in (x or "") for x in
                                                                          list(texts) + list(issuers)):
            return "EC-Council CEH Standards"
    return ""


def graded_name(idx, eid, cid_titles):
    """(name, source, course id) for one graded exhibit: C-ID, then CCN, then M-ID title of an articulated course
    that carries the id; else the cleaned local course title; else ("", "", "")."""
    arts = idx.arts_of.get(eid) or []
    rank = {"C-ID": 0, "CCN-ID": 1, "CCN": 1, "M-ID": 2}
    best = None
    for a in arts:
        sysm = a.get("identity_system")
        cid = a.get("course_id")
        if sysm == "C-ID":
            title = cid_titles.get(cid)
        else:
            title = ((idx.identities.get(cid) or {}).get("title"))
        if title and sysm in rank:
            cand = (rank[sysm], cid, title, sysm)
            best = min(best, cand) if best else cand
    if best:
        return best[2], best[3], best[1]
    for a in arts:
        for lc in a.get("local_courses") or []:
            c = clean_local_title(lc.get("title"))
            if c:
                return c, "cleaned local", ""
    return "", "", ""


# ── batch: Split graded from cert-based ───────────────────────────────────────────────────────────────────────────

GRADED_TITLE = re.compile(r"standards\)|Credit by Exam|Portfolio", re.I)


def batch_split(idx, cid_titles):
    rows, canon_report = [], {}
    by_canon = defaultdict(list)
    for key, rec in idx.ut.items():
        for eid in sorted(idx.ids_of.get(key, ())):
            ty, _ = idx.type_of(eid)
            by_canon[idx.pair_canonical(key, eid)].append((key, eid, xr.group_of(ty)))
    for canon, pairs in sorted(by_canon.items()):
        groups = {g for _, _, g in pairs if g}
        if groups != {"graded", "cert"}:
            continue
        sam = idx.sam_curated(canon)
        per_title = defaultdict(set)
        for key, eid, g in pairs:
            per_title[key].add(g)
        keep_graded = bool(GRADED_TITLE.search(canon))
        move_group = "cert" if keep_graded else "graded"
        grain = "title"
        issuers = [r.get("issuing_agency") for r in idx.creds.get(canon) or []]
        texts_all = [canon] + [k for k, _, g in pairs if g == "graded"]
        suffix = cert_link(texts_all, issuers)
        names, person_why = set(), ""
        for key, eid, g in pairs:
            if g != move_group:
                continue
            title_mixed = len(per_title[key] - {""}) > 1
            grain = "exhibit" if title_mixed else grain
            if move_group == "graded":
                name, src, cid = graded_name(idx, eid, cid_titles)
                if name and suffix:
                    name = "%s (%s)" % (name, suffix)
                name, slash_why = _new_key(name, idx)
                if name and xr.norm(name).casefold() == xr.norm(canon).casefold():
                    name, why = "", "the graded name would be the current canonical: a person picks a distinct title"
                else:
                    why = "" if name else (slash_why or "no articulated college course on the graded exhibit to "
                                                        "name it from")
                to, issuer = name or None, "California Community Colleges"
            else:
                to, src, cid, issuer = None, "", "", None
                why = "the current title is graded; the cert-based side has no named home yet"
            if sam:
                action, reason = "tap_only", "Sam-curated mixed canonical: Split on his tap only"
            elif not to:
                action, reason = "person", why
                person_why = person_why or why
            else:
                action = "repoint"
                reason = "Split: %s side to its own canonical (%s)" % (move_group, src)
                names.add(to)
            rows.append(_row("split", eid, key, action, canon, to, reason, idx, split_grain=(
                "exhibit" if title_mixed else "title"), name_source=src, course_id=cid,
                target_issuer=issuer if to else None))
        state = "sam" if sam else ("person" if person_why and not names else "auto")
        canon_report[canon] = {"state": state, "grain": grain, "names": sorted(names)}
    return rows, canon_report


# ── batch: the low-confidence second pass (the 710) ───────────────────────────────────────────────────────────────

FIRST_PASS = None  # the first typographic pass is folded into the same normalizer below


def _fold(t):
    s = re.sub(r"\b[A-Z]{2,8}\s?-?\d{1,4}[A-Z]?\b", " ", t or "").lower()  # course codes (capitals only)
    for pat, rep in ABBREV:
        s = re.sub(pat.lower().replace(r"\b", r"\b"), rep.lower(), s)
    s = re.sub(r"\b(credit by exam|cbe|cx|portfolio( review)?|industry certification|high school( articulation)?)\b",
               " ", s)
    s = s.replace("&", " and ")
    s = re.sub(r"\bii\b", "2", re.sub(r"\biii\b", "3", re.sub(r"\bi\b", "1", s)))
    return [w for w in re.findall(r"[a-z0-9+]+", s) if w not in SMALL]


def _overlap(a, b):
    A, B = set(_fold(a)), set(_fold(b))
    if not A or not B:
        return 0.0
    return len(A & B) / max(len(A), len(B))


def batch_low_confidence(idx, cid_titles, claimed):
    rows = []
    for key, rec in sorted(idx.ut.items()):
        if (rec.get("confidence_title") or 0) >= 0.8 or rec.get("reviewed_by"):
            continue
        canon = rec.get("unified_title")
        ids = sorted(idx.ids_of.get(key, ()))
        if not ids or any((e, key) in claimed for e in ids):
            continue
        groups = {xr.group_of(idx.type_of(e)[0]) for e in ids} - {""}
        canon_groups = {xr.group_of(idx.type_of(e)[0]) for k in idx.titles_of_canon.get(canon, [])
                        for e in idx.ids_of.get(k, ())} - {""}
        if len(canon_groups) > 1:
            continue  # the Split covers a mixed canonical
        course_titles, id_titles = set(), set()
        crs = []
        for e in ids:
            for a in idx.arts_of.get(e) or []:
                t = cid_titles.get(a["course_id"]) if a.get("identity_system") == "C-ID" else \
                    (idx.identities.get(a.get("course_id")) or {}).get("title")
                if t:
                    course_titles.add(t)
                    id_titles.add(t)
                for lc in a.get("local_courses") or []:
                    if lc.get("title"):
                        course_titles.add(lc["title"])
                crs += a.get("credit_recommendations") or []
        local_is_code = bool(re.fullmatch(r"\s*[A-Za-z ]{2,12}\s?-?\d{1,4}[A-Za-z]?\s*", key))
        if "cert" in groups and course_titles and any(_overlap(canon, t) >= 0.99 for t in course_titles):
            # Cause 1 outside CTCNC (a cert exhibit under a college course title): no official cert is on file,
            # so a person names it (COBIx's step 10). Those piles are not re-points and stay off this list.
            continue
        mk = lambda action, to, why: rows.append(_row("low_confidence", ids[0] if len(ids) == 1 else ids[0], key,  # noqa: E731
                                                      action, canon, to, why, idx, exhibit_ids=ids))
        if local_is_code and groups == {"graded"} and course_titles:
            official = sorted(t for t in course_titles if _overlap(t, canon) < 0.99
                              and any(_overlap(t, re.sub(r"^[\d.]+\s+hours?\s+in\s+", "", c, flags=re.I)) >= 0.99
                                      for c in crs))
            if official and not idx.sam_curated(canon) and not any(_overlap(t, canon) >= 0.99 for t in course_titles):
                to = ([t for t in official if t in id_titles] or official)[0]  # the C-ID or M-ID title first
                to, slash_why = _new_key(to, idx)
                if slash_why:
                    rows.append(_row("low_confidence", ids[0], key, "person", canon, None, slash_why, idx,
                                     exhibit_ids=ids))
                    continue
                for e in ids:
                    rows.append(_row("low_confidence", e, key, "repoint", canon, to,
                                     "the course code's official course and its CR agree with each other and not "
                                     "with the canonical", idx, target_issuer="California Community Colleges"))
                continue
        if _overlap(key, canon) >= 0.8 or any(_overlap(canon, t) >= 0.99 for t in course_titles
                                               if groups <= {"graded"}):
            for e in ids:
                rows.append(_row("low_confidence", e, key, "confirm", canon, canon,
                                 "the local title and the canonical are the same credential once typography, codes "
                                 "and abbreviations are read", idx))
    return rows


# ── assemble ──────────────────────────────────────────────────────────────────────────────────────────────────────

def build(map_path=None):
    ut = xr.load_json(P("unified_titles.json"), {})
    creds = xr.load_json(P("credentials.json"), {})
    art_doc = xr.load_json(P("coci_articulations.json"), {})
    overlay = (xr.load_json(P("credential_review_overlay.json"), {}) or {}).get("overrides") or {}
    audit = xr.load_json(P("exhibit_audit", "latest.json"), {})
    review = xr.load_json(P("exhibits_review.json"), {})
    cid = xr.load_json(P("reference", "cid_descriptors.json"), {})
    cid_titles = {d["descriptor"]: d["title"] for d in (cid.get("descriptors") or []) if d.get("title")}
    idx = xr.Index(ut, creds, art_doc.get("articulations") or [], overlay, xr.map_exhibits(map_path))
    idx.identities = art_doc.get("identities") or {}
    ctc = batch_ctcnc(idx)
    appr = batch_apprenticeship(idx, audit, review)
    split, split_canon = batch_split(idx, cid_titles)
    claimed = {(r["exhibit_id"], r["local_title"]) for r in ctc + split}
    low = batch_low_confidence(idx, cid_titles, claimed)
    rows = ctc + appr + low + split
    counts = {b: dict(Counter(r["action"] for r in rows if r["batch"] == b))
              for b in ("ctcnc", "apprenticeship", "low_confidence", "split")}
    sc = Counter((v["state"], v["grain"]) for v in split_canon.values())
    doc = {
        "schema": "exhibit-repoint-list/1",
        "_about": "One reviewed re-point list keyed by (MAP exhibit id + local title). Each repoint, assign or "
                  "confirm row changes only that pair's canonical (kb/exhibit_repoint.py); tap_only waits on "
                  "Sam's tap and is never applied; person and skip rows are listed so the pile stays visible. "
                  "Applied later by python3 kb/_cred_rename_apply.py --pairs kb/exhibit_repoint_list.json.",
        "generated_by": "kb/_build_exhibit_repoint_list.py",
        "source": "issue #3464 (COBIx, 2026-11-17): cert-course-title-rule, person-piles-rules sections 3 and 5, "
                  "ask-sky-left-map-actions (Split, Naming new graded canonicals, Re-point list key)",
        "map_snapshot": bool(map_path and os.path.exists(map_path)),
        "counts": {"rows": len(rows), "by_batch": counts,
                   "split_canonicals": {"mixed": len(split_canon),
                                        "auto_title_grain": sc[("auto", "title")],
                                        "auto_exhibit_grain": sc[("auto", "exhibit")],
                                        "sam_tap_only": sum(v for (s, _), v in sc.items() if s == "sam"),
                                        "person": sum(v for (s, _), v in sc.items() if s == "person")},
                   "pairs_missing_an_exhibit_id": sum(1 for r in rows if not r["exhibit_id"])},
        "split_canonicals": split_canon,
        "rows": rows,
    }
    return doc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--map", default=None, help="CustomReport_latest.json (the runner's MAP snapshot)")
    ap.add_argument("--check", action="store_true", help="fail when the committed list differs from a rebuild")
    a = ap.parse_args()
    doc = build(a.map)
    text = json.dumps(doc, indent=1, ensure_ascii=False, sort_keys=False) + "\n"
    if a.check:
        old = open(OUT, encoding="utf-8").read() if os.path.exists(OUT) else ""
        if old != text:
            sys.exit("kb/exhibit_repoint_list.json is stale: run python3 kb/_build_exhibit_repoint_list.py")
        print("exhibit_repoint_list.json is current")
        return
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(text)
    print(json.dumps(doc["counts"], indent=1))


if __name__ == "__main__":
    main()
