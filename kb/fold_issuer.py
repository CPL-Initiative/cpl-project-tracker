#!/usr/bin/env python3
"""fold_issuer.py — which issuer a merged credential title keeps when a fold joins several titles.

The one rule set, read by both halves of the credential rename apply: the JSON fold
(kb/_cred_rename_apply.py fold_credentials) and the kb_curation override carry
(kb/_cred_rename_apply_supabase.py). Agreed on issue #3110 (COBIx 2026-11-11 16:18Z, Sky S637), under
Sam's ruling 1 (docs/reference/canonical_credential_model.md): the canonical title carries the
credential's issuer, and each local exhibit carries its own path and assessor (kb/exhibit_paths.py).

A fold group is the target title plus every title folding into it in the same apply: titles renamed
onto it (the lead that creates it) and titles merged into it (confirmed siblings). In order:

  1. reviewer  An explicit issuer that a person set (issuing_agency_override whose reviewer_email does
               not end in @bot) on any title in the group wins. Two people who disagree: the newest
               wins, and the receipt lists both. A winner that differs from the target's own override
               is a conflict, and the receipt keeps the target's before-value (Rule 10 a2).
  2. cert form When the target is in the certification format (kb/cert_naming.py, "Brakes (ASE A5)"),
               the target's issuer records stay and a folded college record is dropped. The college is
               read from its exhibit's path now (credit by exam, assessed by the college).
  3. additive  Otherwise each distinct (issuer, trainer) pair is kept, as before this module.

One guard: when rule 1 puts the college system on a merged title that holds industry-certification
exhibits (MAPIC*, assessed by the cert body), the receipt flags the title for a person. It does not
block the apply.

Issuer spellings of the college system read as one: "California Community Colleges", the reference's
form (1,485 records on 2026-11-11), so a reviewer's "California Community College Chancellor's Office"
lands spelled that way.
"""
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


def is_cert_form(title):
    """True for a title in the certification format: "<Official name> (<SHORT> <code>)", nothing after
    the code. "Heating and Air Conditioning (ASE A7 standards)" is a course taught to the standard and is
    not in the format."""
    return bool(cert_naming.NEW_FORM.match((title or "").strip()))


def _review(entry, field):
    """(value, reviewer, reviewed_at) of one override field on an overlay entry. The overlay carries a
    per-field stamp (field_reviews) since this module; an older overlay falls back to the entry's."""
    entry = entry or {}
    value = (entry.get(field) or "").strip()
    if not value:
        return None
    stamp = (entry.get("field_reviews") or {}).get(field) or {}
    return (value, stamp.get("by") or entry.get("reviewed_by") or "",
            stamp.get("at") or entry.get("reviewed_at") or "")


def resolve(target, members, overlay, target_exists_before=True):
    """Decide one fold group's issuer rule.

    target    the title the group folds into
    members   [(title, role)] for every title folding in; role "lead" (renamed onto the target) or
              "merge" (a confirmed merge)
    overlay   {title: overlay entry} from kb/credential_review_overlay.json
    target_exists_before  False when a lead creates the target in this same run; the lead's override
              is then the target's own

    Returns {"target", "rule", "winner", "winner_from", "humans", "target_override_before",
             "conflict", "additional"}.
    """
    own = [target] if target_exists_before else []
    own += [t for t, role in members if role == "lead"]
    titles = [target] + [t for t, _ in members]
    humans = []
    additional = []
    for t in dict.fromkeys(titles):
        got = _review(overlay.get(t), "issuing_agency_override")
        if got and not is_bot(got[1]):
            humans.append({"title": t, "issuer": got[0], "by": got[1], "at": got[2],
                           "own": t in own})
        extra = _review(overlay.get(t), "issuing_agency_additional_override")
        if extra and not is_bot(extra[1]):
            additional += [x.strip() for x in extra[0].split("|") if x.strip()]
    before = None
    for t in own:
        got = _review(overlay.get(t), "issuing_agency_override")
        if got:
            before = {"title": t, "issuer": got[0], "by": got[1], "at": got[2]}
            break
    out = {"target": target, "rule": "additive", "winner": None, "winner_from": None,
           "humans": humans, "target_override_before": before, "conflict": None,
           "additional": additional}
    if humans:
        win = sorted(humans, key=lambda h: (h["at"], h["title"]))[-1]
        out["rule"] = "reviewer"
        out["winner"] = canonical_issuer(win["issuer"])
        out["winner_from"] = win
        distinct = {norm(canonical_issuer(h["issuer"])) for h in humans}
        if len(distinct) > 1:
            out["disagreement"] = True
        if before and norm(canonical_issuer(before["issuer"])) != norm(out["winner"]):
            out["conflict"] = {"target_override_before": before, "winner": out["winner"],
                               "winner_from": win}
    elif is_cert_form(target):
        out["rule"] = "cert-form"
    return out


def plan(renames, merges, overlay, credentials, tallies=None):
    """Every fold group of one apply, resolved. renames/merges: the alias map's two sections; credentials:
    kb/credentials.json BEFORE the apply. Returns {target: {"resolution", "exceptions", "members"}}, one
    entry per target that receives at least one merge."""
    groups = {}
    for old, target in sorted((merges or {}).items()):
        groups.setdefault(target, []).append((old, "merge"))
    for old, new in sorted((renames or {}).items()):
        if new in groups:
            groups[new].insert(0, (old, "lead"))
    out = {}
    for target, members in sorted(groups.items()):
        res = resolve(target, members, overlay or {}, target_exists_before=target in (credentials or {}))
        titles = [target] + [t for t, _ in members]
        out[target] = {"resolution": res, "members": members,
                       "exceptions": exceptions(res, titles, tallies or {})}
    return out


def fold_records(res, existing, moving):
    """Apply a resolution to credential records. existing: the target's records (after any lead rename);
    moving: [(source title, [records])] for the merges. Returns (records, log)."""
    def key(r):
        return (norm(r.get("issuing_agency")), norm(r.get("training_agency")))

    log = {"kept": 0, "moved": 0, "deduped": 0, "dropped": [], "reissued": []}
    rule = res["rule"]
    if rule == "cert-form" and not existing:
        rule = "additive"  # nothing on the target to keep
    if rule == "reviewer":
        keep = {norm(res["winner"])} | {norm(canonical_issuer(a)) for a in res.get("additional") or []}
        out, have = [], set()
        for src, recs in [(res["target"], existing)] + list(moving):
            for rec in recs or []:
                rec = dict(rec)
                was = rec.get("issuing_agency")
                if norm(canonical_issuer(was)) not in keep:
                    log["reissued"].append({"from_title": src, "before": was, "after": res["winner"],
                                            "training_agency": rec.get("training_agency")})
                    rec["issuing_agency"] = res["winner"]
                elif was and canonical_issuer(was) != was:
                    rec["issuing_agency"] = canonical_issuer(was)
                if key(rec) in have:
                    log["deduped"] += 1
                    continue
                have.add(key(rec))
                out.append(rec)
                if src == res["target"]:
                    log["kept"] += 1
                else:
                    log["moved"] += 1
        if not out:
            out.append({"issuing_agency": res["winner"], "training_agency": None,
                        "confidence_issuer": 1.0, "classified_by": "curator (fold issuer precedence)",
                        "reviewed_by": res["winner_from"]["by"], "reviewed_at": res["winner_from"]["at"]})
        return out, log
    out = list(existing or [])
    have = {key(r) for r in out}
    log["kept"] = len(out)
    for src, recs in moving:
        for rec in recs or []:
            if rule == "cert-form" and is_system(rec.get("issuing_agency")):
                log["dropped"].append({"from_title": src, "issuing_agency": rec.get("issuing_agency"),
                                       "training_agency": rec.get("training_agency"),
                                       "why": "the target is the certification; the college shows on its "
                                              "exhibit's path"})
                continue
            if key(rec) in have:
                log["deduped"] += 1
                continue
            out.append(rec)
            have.add(key(rec))
            log["moved"] += 1
    return out, log


def path_tallies(related_doc):
    """{title: {path: n}} from kb/exhibits_related.json's titles (the last element of a row)."""
    out = {}
    for row in (related_doc or {}).get("titles") or []:
        if len(row) >= 7 and isinstance(row[6], list):
            out[row[0]] = {k: n for k, n in row[6]}
    return out


def exceptions(res, titles, tallies):
    """The guard: a college-system issuer put by rule 1 on a merged title holding industry-certification
    exhibits. Returns a list of {"target", "issuer", "ic_exhibits", "from_titles", "why"} (empty or one)."""
    if res["rule"] != "reviewer" or not is_system(res["winner"]):
        return []
    ic = {t: (tallies.get(t) or {}).get("ic", 0) for t in titles}
    n = sum(ic.values())
    if not n:
        return []
    return [{"target": res["target"], "issuer": res["winner"], "ic_exhibits": n,
             "from_titles": sorted(t for t, k in ic.items() if k),
             "why": "a person set the college system as issuer, and the merged title holds industry-"
                    "certification exhibits, which the cert body assesses; look at whether those exhibits "
                    "belong under this title"}]


def receipt_lines(res, log=None, exc=None):
    """Plain lines for validation.md / report.md."""
    t = res["target"]
    lines = []
    if res["rule"] == "reviewer":
        w = res["winner_from"]
        lines.append(f"- `{t}`: reviewer issuer **{res['winner']}** (set by {w['by']} at {w['at']} on "
                     f"`{w['title']}`)")
        if res.get("disagreement"):
            for h in res["humans"]:
                lines.append(f"  - reviewer issuer on `{h['title']}`: {h['issuer']} ({h['by']}, {h['at']})")
        if res["conflict"]:
            b = res["conflict"]["target_override_before"]
            lines.append(f"  - CONFLICT: the target's override was {b['issuer']} ({b['by']}, {b['at']}, on "
                         f"`{b['title']}`); it becomes {res['winner']}. Before-value kept here for the undo.")
    elif res["rule"] == "cert-form":
        lines.append(f"- `{t}`: certification format, the target's issuer records stay")
    else:
        lines.append(f"- `{t}`: additive")
    if log:
        for d in log.get("dropped") or []:
            lines.append(f"  - dropped folded record {d['issuing_agency']} from `{d['from_title']}`")
        for r in log.get("reissued") or []:
            lines.append(f"  - reissued a record from `{r['from_title']}`: {r['before']} to {r['after']}")
    for e in exc or []:
        lines.append(f"  - EXCEPTION for a person: {e['ic_exhibits']} industry-certification exhibit(s) under "
                     f"{', '.join('`%s`' % x for x in e['from_titles'])}; issuer set to {e['issuer']}")
    return lines
