#!/usr/bin/env python3
"""fold_issuer.py — which issuer a merged credential title keeps when a fold joins several titles.

The one rule set, read by both halves of the credential rename apply: the JSON fold
(kb/_cred_rename_apply.py fold_credentials) and the kb_curation override carry
(kb/_cred_rename_apply_supabase.py). Agreed on issue #3110 (COBIx 2026-11-11 16:18Z, Sky S637; narrowed by
the S638 conductor's rulings the same day), under Sam's ruling 1 (docs/reference/canonical_credential_model.md):
the canonical title carries the credential's issuer, and each local exhibit carries its own path and
assessor (kb/exhibit_paths.py).

A fold group is the target title plus every title folding into it in the same apply: titles renamed
onto it (the lead that creates it) and titles merged into it (confirmed siblings). In order:

  1   reviewer   A person's issuer set as part of the fold decision wins: a non-bot
                 issuing_agency_override whose own reviewed_at is at or after the group's earliest fold
                 save (unified_title_override or unified_title_merge_confirm). An older person-set issuer
                 is an ordinary record and goes through the rules below. Two people who disagree: the
                 newest wins, and the receipt lists both. A winner that differs from the target's own
                 override is a conflict, and the receipt keeps that override's before-value (Rule 10 a2).
  2   cert form  The target is in the certification format ("Brakes (ASE A5)", kb/cert_naming.py): the
                 target's issuer records stay and a folded college record is dropped. The college shows
                 on its exhibit's path now (credit by exam, assessed by the college).
  2b  standards  The target is a course taught to a certification's standard ("Brakes (ASE A5
                 standards)"): the college record stays and the certifying body's record is dropped,
                 since the credit is the college's own.
  3   additive   Otherwise each distinct (issuer, trainer) pair is kept.

The guard: when rule 1 puts the college system on a merged title, or rule 2b keeps it there, and the
title holds industry-certification exhibits (MAPIC*, assessed by the cert body), the receipt flags the
title for a person. It does not block the apply.

A record a person set (reviewed_by not ending in @bot) that rule 1 reissues or rule 2 or 2b drops is
named in the receipt with who set it and when, and kept whole in undo.json (CLAUDE.md Rule 8: a human
row is never superseded silently).

Issuer spellings of the college system read as one: "California Community Colleges", the reference's
form (1,485 records on 2026-11-11), so a reviewer's "California Community College Chancellor's Office"
lands spelled that way.
"""
import re

import cert_naming

SYSTEM_ISSUER = "California Community Colleges"
_SYSTEM_SPELLINGS = {
    "california community colleges",
    "california community college",
    "california community colleges chancellor's office",
    "california community college chancellor's office",
    "california community colleges chancellors office",
    "california community college chancellors office",
    "chancellor's office",
    "cccco",
    "ccc",
}
RULE_LABEL = {"reviewer": "rule 1, a person's issuer set with the fold",
              "cert-form": "rule 2, certification format",
              "standards": "rule 2b, taught to the standard",
              "additive": "rule 3, additive"}
FOLD_FIELDS = ("unified_title_override", "unified_title_merge_confirm")
_STANDARDS_WORDS = re.compile(r"\bstandards?\s*$", re.I)


def norm(s):
    return " ".join((s or "").replace("’", "'").split()).casefold()


def canonical_issuer(s):
    """The reference spelling of an issuer: the college system under any of its spellings, else as given."""
    s = " ".join((s or "").split())
    return SYSTEM_ISSUER if norm(s) in _SYSTEM_SPELLINGS else s


def is_system(s):
    return norm(s) in _SYSTEM_SPELLINGS


def is_bot(email):
    return (email or "").strip().lower().endswith("@bot")


def is_person(email):
    return bool((email or "").strip()) and not is_bot(email)


def is_cert_form(title):
    """True for a title in the certification format: "<Official name> (<SHORT> <code>)", nothing after
    the code. "Heating and Air Conditioning (ASE A7 standards)" is a course taught to the standard and is
    not in the format."""
    return bool(cert_naming.NEW_FORM.match((title or "").strip()))


def standards_body(title):
    """The certifying body's issuer when the title is a course taught to its standard, "<name> (ASE <code>
    standards)", else None. Only ASE has the form today (cert_naming.FAMILIES)."""
    m = cert_naming.PAREN_FORM.match((title or "").strip())
    if m and _STANDARDS_WORDS.search(m.group("words") or ""):
        return cert_naming.ASE_ISSUER
    return None


def _is_body(issuer, body):
    n = norm(issuer)
    return bool(body) and (n == norm(body) or n == "ase" or "automotive service excellence" in n)


def ts(s):
    """A sortable instant from a kb_curation or overlay stamp ("2026-11-11T15:26:54Z",
    "2026-11-11 15:26:55.029+00", "...+00:00"); "" sorts first. Strings with different offsets or a
    "Z" do not compare in order, so every rule-1 comparison goes through this."""
    from datetime import datetime, timezone
    s = (s or "").strip()
    if not s:
        return datetime.min.replace(tzinfo=timezone.utc)
    t = s.replace(" ", "T", 1).replace("Z", "+00:00")
    t = re.sub(r"([+-]\d\d)$", r"\1:00", t)
    try:
        d = datetime.fromisoformat(t)
    except ValueError:
        m = re.match(r"^(.*?\.\d{1,6})\d*([+-].*)?$", t)
        d = datetime.fromisoformat(m.group(1) + (m.group(2) or "")) if m else datetime.min
    d = d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    # Milliseconds, as JavaScript's Date holds them (issuer_resolution.js ts): a Postgres stamp carries
    # microseconds, and comparing them here alone made the two resolvers disagree inside one millisecond.
    return d.replace(microsecond=d.microsecond // 1000 * 1000)


def _stamp(entry, field):
    """(value, reviewer, reviewed_at) of one field row. The overlay carries each field row's own stamp
    (field_reviews) since this module; without it the entry's latest stands in for the reviewer, and the
    time is unknown (""). An entry the resolver already resolved keeps the raw rows in issuer_raw, and
    the fold decides on those."""
    entry = entry or {}
    raw = (entry.get("issuer_raw") or {}).get(field)
    if raw is not None:
        return ((raw.get("value") or "").strip(), raw.get("by") or "", raw.get("at") or "") \
            if (raw.get("value") or "").strip() else None
    value = (entry.get(field) or "").strip()
    if not value:
        return None
    st = (entry.get("field_reviews") or {}).get(field)
    if st:
        return value, st.get("by") or "", st.get("at") or ""
    return value, entry.get("reviewed_by") or "", ""


def _fold_at(entry, field):
    """A fold row's own time, falling back to the entry's (an older overlay)."""
    got = _stamp(entry, field)
    if not got:
        return ""
    return got[2] or (entry or {}).get("reviewed_at") or ""


def resolve(target, members, overlay, target_exists_before=True):
    """Decide one fold group's issuer rule.

    target    the title the group folds into
    members   [(title, role)] for every title folding in; role "lead" (renamed onto the target) or
              "merge" (a confirmed merge)
    overlay   {title: overlay entry} from kb/credential_review_overlay.json
    target_exists_before  False when a lead creates the target in this same run; the lead's override
              is then the target's own

    Returns {"target", "rule", "winner", "winner_from", "humans", "older_people", "fold_saved_at",
             "target_override_before", "conflict", "additional", "drop_body"}.
    """
    own = [target] if target_exists_before else []
    own += [t for t, role in members if role == "lead"]
    titles = list(dict.fromkeys([target] + [t for t, _ in members]))
    saves = [a for t, _ in members for f in FOLD_FIELDS
             for a in [_fold_at(overlay.get(t), f)] if a]
    fold_at = min(saves, key=ts) if saves else ""
    humans, older, additional = [], [], []
    for t in titles:
        got = _stamp(overlay.get(t), "issuing_agency_override")
        if got and is_person(got[1]):
            row = {"title": t, "issuer": got[0], "by": got[1], "at": got[2], "own": t in own}
            # Set with the fold: its own stamp at or after the group's earliest fold save.
            (humans if (got[2] and fold_at and ts(got[2]) >= ts(fold_at)) else older).append(row)
        extra = _stamp(overlay.get(t), "issuing_agency_additional_override")
        if extra and is_person(extra[1]) and extra[2] and fold_at and ts(extra[2]) >= ts(fold_at):
            additional += [x.strip() for x in extra[0].split("|") if x.strip()]
    before = None
    for t in own:
        got = _stamp(overlay.get(t), "issuing_agency_override")
        if got:
            before = {"title": t, "issuer": got[0], "by": got[1], "at": got[2]}
            break
    out = {"target": target, "rule": "additive", "winner": None, "winner_from": None,
           "humans": humans, "older_people": older, "fold_saved_at": fold_at,
           "target_override_before": before, "conflict": None, "additional": additional,
           "drop_body": None, "target_exists_before": bool(target_exists_before)}
    if humans:
        win = sorted(humans, key=lambda h: (ts(h["at"]), h["title"]))[-1]
        out["rule"] = "reviewer"
        out["winner"] = canonical_issuer(win["issuer"])
        out["winner_from"] = win
        if len({norm(canonical_issuer(h["issuer"])) for h in humans}) > 1:
            out["disagreement"] = True
        if before and norm(canonical_issuer(before["issuer"])) != norm(out["winner"]):
            out["conflict"] = {"target_override_before": before, "winner": out["winner"],
                               "winner_from": win}
    elif is_cert_form(target):
        out["rule"] = "cert-form"
    elif standards_body(target):
        out["rule"] = "standards"
        out["drop_body"] = standards_body(target)
    return out


def plan(renames, merges, overlay, credentials, tallies=None):
    """Every fold group of one apply, resolved. renames/merges: the alias map's two sections; credentials:
    kb/credentials.json BEFORE the apply. Returns {target: {"resolution", "exceptions", "members"}}, one
    entry per target that receives at least one merge. A rule that cannot apply to the group's records
    (rule 2 with nothing on the target, rule 2b with no college record) falls to rule 3 here, so the
    preview, the fold and the carry agree."""
    groups = {}
    for old, target in sorted((merges or {}).items()):
        groups.setdefault(target, []).append((old, "merge"))
    for old, new in sorted((renames or {}).items()):
        if new in groups:
            groups[new].insert(0, (old, "lead"))
    creds = credentials or {}
    out = {}
    for target, members in sorted(groups.items()):
        res = resolve(target, members, overlay or {}, target_exists_before=target in creds)
        own_pre = creds.get(target) or []
        folding = [r for t, _ in members for r in creds.get(t) or []]
        group_recs = own_pre + folding
        # Rule 2 keeps the target's own records and every folded record that is not the college's; with
        # none of either there is nothing to keep, whichever source happens to lead.
        if res["rule"] == "cert-form" and not own_pre and all(is_system(r.get("issuing_agency"))
                                                              for r in folding):
            res["rule"], res["fell_back"] = "additive", "no record on the group but the college's"
        if res["rule"] == "standards" and not any(is_system(r.get("issuing_agency")) for r in group_recs):
            res["rule"], res["fell_back"] = "additive", "no college record in the group to keep"
            res["drop_body"] = None
        titles = [target] + [t for t, _ in members]
        out[target] = {"resolution": res, "members": members,
                       "exceptions": exceptions(res, titles, tallies or {})}
    return out


def _person_note(src, rec, res=None):
    """The receipt's note for a record a person set, or None. A record's own reviewed_by names the
    person when the curation stamped it; when it does not (the override matched a machine record, so
    nothing was filled), a person's override in the group naming the same issuer does."""
    by, at = rec.get("reviewed_by"), rec.get("reviewed_at")
    if not is_person(by):
        hit = next((h for h in (res or {}).get("humans", []) + (res or {}).get("older_people", [])
                    if norm(canonical_issuer(h["issuer"])) == norm(canonical_issuer(rec.get("issuing_agency")))),
                   None)
        if not hit:
            return None
        by, at = hit["by"], hit["at"]
    return {"from_title": src, "issuing_agency": rec.get("issuing_agency"),
            "training_agency": rec.get("training_agency"), "by": by, "at": at, "before": rec}


def fold_records(res, existing, moving):
    """Apply a resolution to credential records. existing: the target's records after any lead rename
    (the target's own when it existed before the run, else the lead's); moving: [(source title,
    [records])] for the merges. Rules 2 and 2b never drop the target's own pre-existing records, and
    treat a same-run lead's like any folded title's. Returns (records, log)."""
    def key(r):
        return (norm(r.get("issuing_agency")), norm(r.get("training_agency")))

    own_pre = res.get("target_exists_before", True)

    log = {"kept": 0, "moved": 0, "deduped": 0, "dropped": [], "reissued": [], "people": []}
    rule = res["rule"]
    groups = [(res["target"], existing or [])] + list(moving)
    if rule == "reviewer":
        keep = {norm(res["winner"])} | {norm(canonical_issuer(a)) for a in res.get("additional") or []}
        out, have = [], set()
        for src, recs in groups:
            for rec in recs:
                rec = dict(rec)
                was = rec.get("issuing_agency")
                if norm(canonical_issuer(was)) not in keep:
                    log["reissued"].append({"from_title": src, "before": was, "after": res["winner"],
                                            "training_agency": rec.get("training_agency")})
                    note = _person_note(src, rec, res)
                    if note:
                        log["people"].append(dict(note, op="reissued", after=res["winner"]))
                    rec["issuing_agency"] = res["winner"]
                elif was and canonical_issuer(was) != was:
                    rec["issuing_agency"] = canonical_issuer(was)
                if key(rec) in have:
                    log["deduped"] += 1
                    continue
                have.add(key(rec))
                out.append(rec)
                log["kept" if src == res["target"] else "moved"] += 1
        if not out:
            out.append({"issuing_agency": res["winner"], "training_agency": None,
                        "confidence_issuer": 1.0, "classified_by": "curator (fold issuer precedence)",
                        "reviewed_by": res["winner_from"]["by"], "reviewed_at": res["winner_from"]["at"]})
        return out, log

    def drops(src, rec):
        if src == res["target"] and own_pre:
            return None  # the target's own records stay under rules 2 and 2b
        if rule == "cert-form" and is_system(rec.get("issuing_agency")):
            return "the target is the certification; the college shows on its exhibit's path"
        if rule == "standards" and _is_body(rec.get("issuing_agency"), res.get("drop_body")):
            return "the target is the college's course taught to the standard; the certifying body " \
                   "shows on its industry-certification exhibits' path"
        return None

    out, have = [], set()
    for src, recs in groups:
        for rec in recs:
            why = drops(src, rec)
            if why:
                log["dropped"].append({"from_title": src, "issuing_agency": rec.get("issuing_agency"),
                                       "training_agency": rec.get("training_agency"), "why": why})
                note = _person_note(src, rec, res)
                if note:
                    log["people"].append(dict(note, op="dropped"))
                continue
            if key(rec) in have:
                log["deduped"] += 1
                continue
            out.append(rec)
            have.add(key(rec))
            log["kept" if src == res["target"] else "moved"] += 1
    return out, log


def drop_issuer(res, issuer):
    """True when the resolution drops this issuer from the target (the kb_curation carry deletes an
    override naming it, so the next sync does not re-append it)."""
    if res.get("rule") == "cert-form":
        return is_system(issuer)
    if res.get("rule") == "standards":
        return _is_body(issuer, res.get("drop_body"))
    return False


def keep_part(res, issuer):
    """Whether one issuer named in an issuing_agency_additional_override survives the resolution on the
    target: under rule 1 only the winner and the additional issuers set with the fold; under rules 2 and
    2b everything but the dropped issuer."""
    if res.get("rule") == "reviewer":
        keep = {norm(res.get("winner"))} | {norm(canonical_issuer(a)) for a in res.get("additional") or []}
        return norm(canonical_issuer(issuer)) in keep
    return not drop_issuer(res, issuer)


def path_tallies(related_doc):
    """{title: {path: n}} from kb/exhibits_related.json's titles (the last element of a row)."""
    out = {}
    for row in (related_doc or {}).get("titles") or []:
        if len(row) >= 7 and isinstance(row[6], list):
            out[row[0]] = {k: n for k, n in row[6]}
    return out


def exceptions(res, titles, tallies):
    """The guard: the college system kept as issuer (rule 1 or rule 2b) on a merged title holding
    industry-certification exhibits. Returns a list of {"target", "issuer", "rule", "ic_exhibits",
    "from_titles", "why"} (empty or one)."""
    if res["rule"] == "reviewer" and is_system(res["winner"]):
        issuer = res["winner"]
    elif res["rule"] == "standards":
        issuer = SYSTEM_ISSUER
    else:
        return []
    ic = {t: (tallies.get(t) or {}).get("ic", 0) for t in titles}
    n = sum(ic.values())
    if not n:
        return []
    return [{"target": res["target"], "issuer": issuer, "rule": res["rule"], "ic_exhibits": n,
             "from_titles": sorted(t for t, k in ic.items() if k),
             "why": "the college system is the issuer, and the merged title holds industry-certification "
                    "exhibits, which the cert body assesses; look at whether those exhibits belong under "
                    "this title"}]


def receipt_lines(res, log=None, exc=None):
    """Plain lines for validation.md / report.md. Each group names the rule that decided it."""
    t = res["target"]
    label = RULE_LABEL[res["rule"]]
    lines = []
    if res["rule"] == "reviewer":
        w = res["winner_from"]
        lines.append(f"- `{t}` ({label}): **{res['winner']}**, set by {w['by']} at {w['at']} on "
                     f"`{w['title']}`, after the fold was saved at {res['fold_saved_at']}")
        if res.get("disagreement"):
            for h in res["humans"]:
                lines.append(f"  - a person's issuer on `{h['title']}`: {h['issuer']} ({h['by']}, {h['at']})")
        if res["conflict"]:
            b = res["conflict"]["target_override_before"]
            lines.append(f"  - CONFLICT: the target's override was {b['issuer']} ({b['by']}, {b['at']}, on "
                         f"`{b['title']}`); it becomes {res['winner']}. Before-value kept for the undo.")
    else:
        extra = f" ({res['fell_back']})" if res.get("fell_back") else ""
        lines.append(f"- `{t}` ({label}){extra}")
    for h in res.get("older_people") or []:
        lines.append(f"  - an older person-set issuer read as an ordinary record: {h['issuer']} on "
                     f"`{h['title']}` ({h['by']}, {h['at'] or 'time unknown'})")
    if log:
        for d in log.get("dropped") or []:
            lines.append(f"  - dropped record {d['issuing_agency']} from `{d['from_title']}`")
        for r in log.get("reissued") or []:
            lines.append(f"  - reissued a record from `{r['from_title']}`: {r['before']} to {r['after']}")
        for p in log.get("people") or []:
            lines.append(f"  - PERSON-SET record {p['op']}: {p['issuing_agency']} on `{p['from_title']}`, set by "
                         f"{p['by']} at {p['at']}; the record is kept whole in undo.json")
    for e in exc or []:
        lines.append(f"  - EXCEPTION for a person ({RULE_LABEL[e['rule']]}): {e['ic_exhibits']} industry-"
                     f"certification exhibit(s) under {', '.join('`%s`' % x for x in e['from_titles'])}; "
                     f"issuer {e['issuer']}")
    return lines


# ── The enforced resolution (#3116 redesign, S638 conductor, 2026-11-11) ────────────────────────────────
#
# The apply never updates or deletes an issuer row a person wrote. It writes ONE row per folded target,
# field issuer_resolution under the cohort below, whose value is resolution_value()'s JSON. Every reader
# resolves a title's issuer rows through effective_issuer(), the one definition: the JavaScript port is
# issuer_resolution.js, held to this one by tests/issuer_resolution_parity.test.js, and a second Python
# copy fails tests/fold_issuer_single_source_test.py. The nightly sync (kb/_apply_credential_review.py)
# applies it while it builds the overlay and enforces it on kb/credentials.json (enforce_records), so a
# partial state repairs itself the next night.
#
# The rule: an issuer row saved after the fold decided (decided_at, the time the apply read the rows it
# decided on) wins, because it is a newer decision. Otherwise the fold's winner stands, the issuers the
# fold dropped are struck, and the additional issuers the fold kept stay, all in the reference spelling,
# with no second copy of the winner under another spelling. "Saved after" is read from the row's stamp
# alone: the browser's anon key cannot read reviewer_email (kb/migrations/2026-11-09_kb_curation_hide_
# reviewer_email.sql), and the fold itself never writes an issuer row, so a later issuer row is a later
# decision either way.

RESOLUTION_FIELD = "issuer_resolution"
COHORT = "cred-fold-s638@bot"
PRIMARY = "issuing_agency_override"
ADDITIONAL = "issuing_agency_additional_override"


def parse_resolution(value):
    """The resolution dict from an issuer_resolution row's value (a JSON string or a dict), or None."""
    if not value:
        return None
    if isinstance(value, dict):
        return value if value.get("decided_at") else None
    import json
    try:
        got = json.loads(value)
    except (ValueError, TypeError):
        return None
    return got if isinstance(got, dict) and got.get("decided_at") else None


def resolution_value(group, records_before, records_after, decided_at, fold_id, priors=(), entries=()):
    """The issuer_resolution row's value for one fold group. records_before: every credential record in
    the group before the apply (target and every folded title); records_after: the target's records after.
    The dropped issuers are exactly the ones the fold removed, so a target's own record the fold kept is
    never struck by the nightly.

    priors: the resolutions already in force on the group's titles (an earlier fold onto the target, or
    onto a title folding in). The primary key holds one resolution per target, so this one replaces them,
    and it carries their decisions forward: an issuer an earlier fold dropped stays dropped, and its winner
    stands when this fold names none, unless this fold keeps that issuer, or a person saved an issuer row
    naming it after the earlier fold decided (entries: the group's overlay entries). The replaced row's
    value is the write's before_row in resolution_log.json."""
    res = group["resolution"]
    before = {canonical_issuer(r.get("issuing_agency")) for r in records_before if r.get("issuing_agency")}
    after = {norm(canonical_issuer(r.get("issuing_agency"))) for r in records_after if r.get("issuing_agency")}
    winner = canonical_issuer(res["winner"]) if res.get("winner") else None
    kept = sorted({canonical_issuer(a) for a in res.get("additional") or []})
    dropped = {i for i in before if norm(i) not in after}
    carried = []
    for prior in sorted([p for p in priors or () if p], key=lambda p: ts(p.get("decided_at"))):
        pdec = ts(prior.get("decided_at"))
        later, later_primary = set(), False
        for e in entries or ():
            for f in (PRIMARY, ADDITIONAL):
                r = _raw_row(e, f)
                if r["at"] and ts(r["at"]) > pdec:
                    later |= {norm(canonical_issuer(x)) for x in _split(r["value"])}
                    later_primary = later_primary or f == PRIMARY
        keep = {norm(winner)} | {norm(k) for k in kept} | after | later
        for d in prior.get("dropped") or []:
            if norm(canonical_issuer(d)) not in keep:
                dropped.add(canonical_issuer(d))
        pw = prior.get("winner")
        if not winner and pw and not later_primary and norm(canonical_issuer(pw)) not in {norm(x) for x in dropped}:
            winner = canonical_issuer(pw)
        if prior.get("fold_id"):
            carried.append(prior["fold_id"])
    out = {"v": 1, "target": res["target"], "rule": res["rule"], "winner": winner,
           "dropped": sorted(i for i in dropped if norm(i) != norm(winner)),
           "kept_additional": kept, "decided_at": decided_at, "fold_id": fold_id}
    if carried:
        out["carried_from"] = carried
    return out


def _split(v):
    return [p.strip() for p in (v or "").split("|") if p.strip()]


def _dedupe(parts, also_not=()):
    seen, out = {norm(x) for x in also_not if x}, []
    for p in parts:
        c = canonical_issuer(p)
        if norm(c) not in seen:
            seen.add(norm(c))
            out.append(c)
    return out


def _raw_row(entry, field):
    """One issuer field's stored row as {value, by, at}. A row stored with an empty value keeps its stamp:
    that is a person's clear, a decision the resolver honors like any other newer row. No row at all is
    {"value": "", "by": "", "at": ""}."""
    entry = entry or {}
    raw = (entry.get("issuer_raw") or {}).get(field)
    if raw is not None:
        return {"value": (raw.get("value") or "").strip(), "by": raw.get("by") or "", "at": raw.get("at") or ""}
    got = _stamp(entry, field)
    if got:
        return {"value": got[0], "by": got[1], "at": got[2]}
    st = (entry.get("field_reviews") or {}).get(field)
    if st:
        return {"value": "", "by": st.get("by") or "", "at": st.get("at") or ""}
    return {"value": "", "by": "", "at": ""}


def effective_issuer(entry, resolution):
    """A title's overlay entry with its issuer rows resolved against the newest fold resolution.

    entry      an overlay entry: issuing_agency_override, issuing_agency_additional_override, and their
               stamps in field_reviews (the shape kb/_apply_credential_review.py writes)
    resolution parse_resolution()'s dict, or None

    Returns a new entry. The issuer fields hold the resolved values; issuer_raw keeps the rows as stored
    (the fold decides on those); issuer_fold says what the fold set and which stored rows it superseded,
    for the editor's "Set by the fold on <date>" line. With no resolution the entry comes back as is."""
    e = dict(entry or {})
    if not resolution:
        return e
    dec = ts(resolution.get("decided_at"))
    winner = canonical_issuer(resolution.get("winner")) if resolution.get("winner") else None
    dropped = {norm(canonical_issuer(x)) for x in resolution.get("dropped") or []}
    raw, superseded = {}, []
    for f in (PRIMARY, ADDITIONAL):
        raw[f] = _raw_row(e, f)
    p = raw[PRIMARY]
    # The stamp alone decides: a row saved after the fold decided wins even when its value is empty (a
    # person cleared the issuer), so the fold's winner never comes back over a person's later clear.
    newer_p = bool(p["at"]) and ts(p["at"]) > dec
    if newer_p:
        primary = canonical_issuer(p["value"])
    elif winner:
        primary = winner
        if p["value"] and norm(canonical_issuer(p["value"])) != norm(winner):
            superseded.append(dict(p, field=PRIMARY))
    elif p["value"] and norm(canonical_issuer(p["value"])) in dropped:
        primary = ""
        superseded.append(dict(p, field=PRIMARY))
    else:
        primary = canonical_issuer(p["value"]) if p["value"] else ""
    a = raw[ADDITIONAL]
    if a["at"] and ts(a["at"]) > dec:
        parts = _dedupe(_split(a["value"]), [primary])
    else:
        kept = [x for x in _split(a["value"]) if norm(canonical_issuer(x)) not in dropped]
        if len(kept) != len(_split(a["value"])):
            superseded.append(dict(a, field=ADDITIONAL))
        parts = _dedupe(kept + list(resolution.get("kept_additional") or []), [primary])
    if primary:
        e[PRIMARY] = primary
    else:
        e.pop(PRIMARY, None)
    if parts:
        e[ADDITIONAL] = " | ".join(parts)
    else:
        e.pop(ADDITIONAL, None)
    e["issuer_raw"] = raw
    e["issuer_fold"] = {"fold_id": resolution.get("fold_id"), "decided_at": resolution.get("decided_at"),
                        "rule": resolution.get("rule"), "winner": winner,
                        "set_by_fold": bool(winner) and not newer_p, "superseded": superseded}
    return e


def enforce_records(records, resolution, entry=None):
    """Credential records with a resolution enforced: a record naming a dropped issuer goes (unless the
    resolved entry names that issuer again, a newer decision), every issuer is spelled the reference way
    and held once, and a fold winner still in force with no record gets one. Returns (records, changes)."""
    if not resolution:
        return list(records or []), []
    e = entry or {}
    named = {norm(canonical_issuer(x)) for x in [e.get(PRIMARY)] + _split(e.get(ADDITIONAL)) if x}
    fold = e.get("issuer_fold") or {}
    winner = canonical_issuer(resolution.get("winner")) if resolution.get("winner") else None
    if fold and not fold.get("set_by_fold"):
        winner = None  # a newer row decided the primary; the fold's winner no longer stands
    dropped = {norm(canonical_issuer(x)) for x in resolution.get("dropped") or []} - named
    out, seen, changes = [], set(), []
    for r in records or []:
        r = dict(r)
        iss = r.get("issuing_agency")
        c = canonical_issuer(iss) if iss else iss
        if iss and norm(c) in dropped:
            changes.append({"op": "removed", "issuing_agency": iss})
            continue
        if iss and c != iss:
            changes.append({"op": "respelled", "before": iss, "after": c})
            r["issuing_agency"] = c
        k = (norm(r.get("issuing_agency")), norm(r.get("training_agency")))
        if k in seen:
            changes.append({"op": "deduped", "issuing_agency": r.get("issuing_agency")})
            continue
        seen.add(k)
        out.append(r)
    if winner and not any(norm(r.get("issuing_agency")) == norm(winner) for r in out):
        out.insert(0, {"issuing_agency": winner, "training_agency": None, "confidence_issuer": 1.0,
                       "classified_by": "the fold's issuer resolution (kb/fold_issuer.py)",
                       "reviewed_by": COHORT, "reviewed_at": resolution.get("decided_at")})
        changes.append({"op": "added_winner", "issuing_agency": winner})
    return out, changes


def undone_fold_ids(out_root):
    """Folds an undo voided: {fold_id: titles whose group the undo skipped (still folded)}, read from
    kb/cred_rename_out/<dir>/undone.json. The nightly ignores those folds' resolution rows except on the
    skipped titles, so the JSON undo stands even before the cohort rows are deleted."""
    import glob
    import json
    import os
    out = {}
    for p in glob.glob(os.path.join(out_root, "*", "undone.json")):
        try:
            doc = json.load(open(p, encoding="utf-8"))
        except (OSError, ValueError):
            continue
        for fid in doc.get("fold_ids") or []:
            out.setdefault(fid, set()).update(doc.get("skipped_groups") or [])
    return out


def voided(resolution, title, undone):
    """True when an undo voided this resolution for this title."""
    fid = (resolution or {}).get("fold_id")
    return fid in undone and title not in undone[fid]


APPLY_FAILED = "apply_failed.json"


def applied_fold_ids(out_root):
    """The folds whose apply landed: the fold_id in each committed kb/cred_rename_out/<dir>/undo.json,
    leaving out a folder the workflow's failure step marked apply_failed.json (its receipt is committed so
    the undo can read it, but the kb files never changed). A resolution row whose fold is not here is
    inert: a failed or unpushed apply wrote it, and no reader enforces it on titles that never folded."""
    import glob
    import json
    import os
    out = set()
    for p in glob.glob(os.path.join(out_root, "*", "undo.json")):
        if os.path.exists(os.path.join(os.path.dirname(p), APPLY_FAILED)):
            continue
        try:
            fid = json.load(open(p, encoding="utf-8")).get("fold_id")
        except (OSError, ValueError):
            continue
        if fid:
            out.add(fid)
    return out


def in_force(resolution, title, applied, undone):
    """True when a resolution stands for this title: its fold landed (applied_fold_ids) and no undo voided
    it. The nightly, the trail crew and the next apply's carry-forward all read resolutions through this."""
    return bool(resolution) and resolution.get("fold_id") in applied and not voided(resolution, title, undone)


# ── Family titles (Sam's ruling C, 2026-11-11, relayed by the S638 conductor) ─────────────────────────────
# An ASE bundle stays its own title and gets a family field, so a saved fold whose target is a declared
# family title is not a merge: the dry-run and the apply hold it out of the plan, and another worker's
# converter turns those saved rows into family tags. The list lives in kb/reference/credential_families.json,
# owned by that worker; an absent file means no families.

FAMILY_HELD_LINE = "held: the target is a family title; these rows become family tags"


def family_titles(path):
    """The declared family titles from kb/reference/credential_families.json: a list of titles, or of
    {"title": ...}, or {"families": that list}. An absent or unreadable file is no families."""
    import json
    try:
        doc = json.load(open(path, encoding="utf-8"))
    except (OSError, ValueError):
        return set()
    items = doc.get("families", doc.get("titles", [])) if isinstance(doc, dict) else doc
    out = set()
    for x in items or []:
        t = x.get("title") if isinstance(x, dict) else x
        if isinstance(t, str) and t.strip():
            out.add(t.strip())
    return out


# ── Emptied titles (Sky and COBIx, 2026-11-11, #3110) ────────────────────────────────────────────────────
# A plan that moves a title's last exhibit away leaves the title empty: no kb/unified_titles.json raw maps to
# it, the fold's own test for "holds no exhibit" (kb/_fold_unclassified.py, the revise lane). A plan never
# retires a person's saved row on such a title; the readers ignore it instead. Here: a saved rename or merge
# whose SOURCE holds no exhibit is held out of the plan in the dry run and again in the apply, so it leads
# no group, joins no fold, and its issuer row never reaches rule 1. The same rows act again once a raw maps
# to the title.

EMPTIED_HELD_LINE = "held: the title holds no exhibit, so its saved rows stay in place and do nothing"
EMPTIED_LEAD_HELD_LINE = ("held: the rename that would create this target is held (its title holds no exhibit); "
                          "the next dry run plans the group again")


def titles_holding_exhibits(unified_titles):
    """Every unified title some kb/unified_titles.json raw maps to."""
    return {(v or {}).get("unified_title") for v in (unified_titles or {}).values()
            if isinstance(v, dict) and (v or {}).get("unified_title")}


def hold_emptied_folds(renames, merges, holding):
    """Split out every rename or merge whose source title holds no exhibit (not in `holding`, from
    titles_holding_exhibits). Returns (renames, merges, held), held a list of {"old", "target", "kind", "why"}."""
    held = []
    keep_r, keep_m = {}, {}
    for kind, src, keep in (("rename", renames, keep_r), ("merge", merges, keep_m)):
        for o, t in sorted((src or {}).items()):
            if o in holding:
                keep[o] = t
            else:
                held.append({"old": o, "target": t, "kind": kind, "why": EMPTIED_HELD_LINE})
    # A held rename that led its group creates no target, so a confirmed sibling folding into that target waits
    # with it: kept, it would fail the apply's merge-target check and stop the whole batch. A fresh dry run, which
    # holds the emptied title before it picks a lead, plans the group again.
    lost = {h["target"] for h in held if h["kind"] == "rename"} - set(keep_r.values())
    for o, t in sorted(keep_m.items()):
        if t in lost:
            del keep_m[o]
            held.append({"old": o, "target": t, "kind": "merge", "why": EMPTIED_LEAD_HELD_LINE})
    return keep_r, keep_m, held


def hold_family_folds(renames, merges, families):
    """Split out every rename or merge whose target is a family title. Returns (renames, merges, held),
    held a list of {"old", "target", "kind", "why"}."""
    held = []
    keep_r, keep_m = {}, {}
    for o, t in sorted((renames or {}).items()):
        if t in families:
            held.append({"old": o, "target": t, "kind": "rename", "why": FAMILY_HELD_LINE})
        else:
            keep_r[o] = t
    for o, t in sorted((merges or {}).items()):
        if t in families:
            held.append({"old": o, "target": t, "kind": "merge", "why": FAMILY_HELD_LINE})
        else:
            keep_m[o] = t
    return keep_r, keep_m, held
