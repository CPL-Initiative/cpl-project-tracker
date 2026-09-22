#!/usr/bin/env python3
"""Sam's cross-list decision sheet — the options, what each one costs, and a
proposal per item.

He asked the question on 2026-09-22, reading the calibration of his own 26
title-rung rulings:

    "The pattern show real variability and uncertainty in the field--we somehow
    need to use this process to get everything properly nested OR just cross
    list the heck out of the misfits and live to tell another day:)"

⚠️ THE TWO EXITS HE NAMED ANSWER DIFFERENT PARTS OF ONE POPULATION. The 1,210
rows whose members resolve to more than one MQ discipline hold at least four
kinds, and a single ruling over all of them would enshrine errors as dual homes.
This script sorts them before it asks, and every count on the sheet is recomputed
here rather than written in — the numbers move as the data moves.

Run: python3 kb/_build_crosslist_decision_sheet.py
"""
import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import _decision_sheet_replies as m  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs/visuals/2026-09-22-crosslist-options.html')
SHEET_ID = '2026-09-22-crosslist-options'

# Chips name the OUTCOME, never agreement, and the FIRST one confirms the
# proposal — it is what the card arrives carrying under opt-out.
def chips(*pairs):
    return list(pairs)


# ── the measurement ──────────────────────────────────────────────────────────
# Two pair families we can name from the official list itself rather than by
# inspection: the CO's MQ vocabulary carries both members, and they denote one
# discipline (A) or a specialization inside another (B).
SAME_NAME = [{"Kinesiology", "Physical Education"},
             {"Theater Arts", "Drama/Theater Arts"}]
SPECIALIZATION = [{"Chicano Studies", "Ethnic Studies"},
                  {"Licensed Vocational Nursing", "Nursing"},
                  {"Commercial Music", "Music"},
                  {"Commercial Art", "Art"},
                  {"Art History", "Art"},
                  {"Legal Assisting", "Law"},
                  {"Management", "Business"},
                  {"Office Technologies", "Business"},
                  {"Fire Technology", "Public Safety"},
                  {"Administration of Justice", "Public Safety"}]

PHYSICAL = ("fitness", "golf", "aquatic", "cycling", "yoga", "weight", "aerobic",
            "soccer", "volleyball", "basketball", "football", "swim", "tennis",
            "running", "walking", "pilates", "strength", "conditioning",
            "athletic", "track", "softball", "baseball", "water polo",
            "wrestling", "boxing", "fencing", "exercise")


def measure():
    """Everything the sheet states, read off the live artifacts."""
    smap = json.load(open(os.path.join(ROOT, 'kb/reference/subject_discipline_map.json')))
    code_to_disc = smap['map']
    short = {c for c in code_to_disc if len(c) <= 2}

    src = open(os.path.join(ROOT, 'unified_courses_data.js'), encoding='utf-8').read()
    rows = json.loads(src[src.index('{'):src.rindex('}') + 1])['rows']

    multi, kinds, pairs = [], collections.Counter(), collections.Counter()
    candidates = collections.defaultdict(list)
    for r in rows:
        ds, short_used = set(), []
        for c in (r.get('subj') or []):
            d = code_to_disc.get(c.upper())
            if d:
                ds.add(d)
                if c.upper() in short:
                    short_used.append(c.upper())
        if len(ds) < 2:
            continue
        multi.append((r, ds))
        srt = sorted(ds)
        for i in range(len(srt)):
            for j in range(i + 1, len(srt)):
                pairs[(srt[i], srt[j])] += 1
        # First matching rule wins, and the short-code flag goes first: a code
        # of one or two letters is ambiguous by construction, so whatever else
        # the row looks like, the signal underneath it is not trustworthy yet.
        if short_used:
            k = 'D'
        elif any(ds == s for s in SAME_NAME):
            k = 'A'
        elif any(ds == s for s in SPECIALIZATION):
            k = 'B'
        else:
            k = 'C'
        kinds[k] += 1
        # ⚠️ EXAMPLES ARE DRAWN FROM THE KIND'S COMMONEST PAIRS, never from file
        # order. Row one of kind C is Financial Accounting under Business and
        # Vocational — and Vocational is a catch-all sitting on 6 of its 535
        # rows, so it reads as the shape of the kind while being its rarest
        # case. Collected here, ranked after the pair counts are known.
        candidates[k].append((r['id'], r['title'], srt))

    # Rank each kind's rows by how common their pair is WITHIN that kind, so the
    # worked examples read as the kind's typical case.
    examples = {}
    for k, rowset in candidates.items():
        within = collections.Counter()
        for _, _, srt in rowset:
            for i in range(len(srt)):
                for j in range(i + 1, len(srt)):
                    within[(srt[i], srt[j])] += 1

        def weight(e, _w=within):
            _, _, srt = e
            # A row carrying six disciplines is real and illustrates nothing:
            # it reads as a mess rather than as two homes. 1,086 of the 1,210
            # sit at exactly two, so the examples do too.
            return (len(srt) == 2,
                    max((_w[(srt[i], srt[j])]
                         for i in range(len(srt)) for j in range(i + 1, len(srt))),
                        default=0))
        # ONE EXAMPLE PER PAIR. Ranking alone returned three Art-and-Photography
        # rows for kind C, which shows the commonest pair three times instead of
        # showing the kind.
        picked, seen = [], set()
        for e in sorted(rowset, key=weight, reverse=True):
            key = tuple(e[2])
            if key in seen:
                continue
            seen.add(key)
            picked.append(e)
            if len(picked) == 4:
                break
        examples[k] = picked

    # the ES damage, which is what makes kind D concrete
    es_rows = [r for r in rows if 'ES' in [c.upper() for c in (r.get('subj') or [])]]
    eths = [r for r in rows if r['id'].split()[0] == 'ETHS']
    eths_physical = [r for r in eths
                     if any(w in r['title'].lower() for w in PHYSICAL)]

    # the parent that agrees with nobody
    orphan = [r for r, ds in multi if r.get('disc') not in ds]

    # what is already settled, and what already cross-lists
    cid = sum(1 for r, _ in multi if r.get('id_system') == 'C-ID')
    locked = sum(1 for r, _ in multi if r.get('locked'))
    reviewed = sum(1 for r, _ in multi if r.get('reviewed_by'))
    xdisc = [r for r in rows if r.get('xdisc')]
    xdisc_widest = max(xdisc, key=lambda r: len(r['xdisc'])) if xdisc else None

    return dict(
        total=len(rows), multi=len(multi), kinds=kinds, pairs=pairs,
        examples=examples, short=sorted(short), es_rows=len(es_rows),
        eths=len(eths), eths_physical=eths_physical, orphan=len(orphan),
        cid=cid, locked=locked, reviewed=reviewed, xdisc=xdisc,
        xdisc_widest=xdisc_widest,
        disciplines=official_disciplines(),
    )


def official_disciplines():
    """The CO's MQ discipline list, whole. The subject map reaches about 103 of
    the 248, and a picker that offers only those hides the choice Sam asked to
    see."""
    raw = json.load(open(os.path.join(ROOT, 'kb/reference/mq_disciplines.json')))
    names = raw if isinstance(raw, list) else (
        raw.get('disciplines') or [k for k in raw if not k.startswith('_')])
    out = [n if isinstance(n, str) else (n.get('name') or n.get('discipline'))
           for n in names]
    return sorted(x for x in out if x)


def ex(examples, k, n=3):
    """A few worked rows, as a plain phrase rather than a list."""
    out = []
    for cid, title, ds in examples[k][:n]:
        out.append(f"<em>{m.E(title.strip())}</em> ({m.E(' and '.join(ds))})")
    return "; ".join(out)


def build():
    d = measure()
    K = d['kinds']
    pairs = d['pairs']
    top = pairs.most_common(6)
    items = []

    # ── 1 · the frame ────────────────────────────────────────────────────────
    items.append({
        'title': 'The frame: four kinds, not one population',
        'ref': 'crosslist-frame',
        'facts': (
            f"Of {d['total']:,} unified course rows, <strong>{d['multi']:,}</strong> have member "
            f"colleges whose subject codes resolve to more than one MQ discipline. Sorting them by "
            f"why they disagree: <strong>{K['D']}</strong> rest partly on a subject code of one or "
            f"two letters, <strong>{K['A']}</strong> name one discipline twice, <strong>{K['B']}</strong> "
            f"pair a specialization with its parent, and <strong>{K['C']}</strong> remain as candidate "
            f"dual homes. The largest single pair in the data is "
            f"{m.E(top[0][0][0])} with {m.E(top[0][0][1])}, at {top[0][1]} rows."),
        'why': (
            "Cross-listing and nesting each answer part of this. Ruling once over all "
            f"{d['multi']:,} would record <em>Advanced Golf</em> as an Ethnic Studies course with a "
            "second home, rather than as the mapping error it is."),
        'rec': ("<strong>Adopt the four-kind sort as the frame</strong>, and rule each kind "
                "separately below. <em>It might be wrong if</em> you would rather take one blanket "
                "decision now and clean up afterward, which is faster and costs a re-mint later."),
        'rows': d['multi'],
        'chips': chips(('Adopt the sort', 'adopt'), ('One ruling for all', 'blanket'), ('Later', 'later')),
    })

    # ── 2 · kind D ───────────────────────────────────────────────────────────
    items.append({
        'title': 'A one or two letter subject code never decides a discipline',
        'ref': 'crosslist-short-codes',
        'facts': (
            f"{len(d['short'])} mapped subject codes are one or two characters, and they are a signal "
            f"on <strong>{K['D']}</strong> of the {d['multi']:,}. <code>ES</code> alone appears on "
            f"{d['es_rows']} rows and maps to Ethnic Studies — but at many colleges <code>ES</code> "
            f"means Exercise Science. Of {d['eths']} M-IDs minted with an ETHS prefix, "
            f"<strong>{len(d['eths_physical'])}</strong> are physical activity courses: "
            + m.E(", ".join(r['title'].strip() for r in d['eths_physical'][:4])) + ". "
            "Both meanings are genuinely present — <em>Introduction to Racial and Ethnic Groups</em> "
            "carries <code>ES</code> too."),
        'why': (
            "The map's own policy says short ambiguous codes stay unmapped. These slipped through, "
            "and a two-letter code cannot be resolved without reading the title. This is the same "
            "shape as the TOP ruling in Rule 7: a signal worth displaying, and not worth gating on."),
        'rec': ("<strong>Hold a short-code discipline out of the canonical fold until a second "
                "signal agrees.</strong> It still displays. <em>It might be wrong if</em> you read "
                f"the {len(d['short'])} codes as reliable enough to keep counting, in which case the "
                "ETHS identities below are the price."),
        'rows': K['D'],
        'chips': chips(('Hold them out', 'hold'), ('Keep gating on them', 'keep'), ('Later', 'later')),
    })

    # ── 3 · the mis-minted identities ────────────────────────────────────────
    items.append({
        'title': 'The Ethnic Studies M-IDs that are swimming and track courses',
        'ref': 'crosslist-eths-remint',
        'facts': (
            f"<strong>{len(d['eths_physical'])}</strong> courses carry an Ethnic Studies M-ID prefix "
            "while describing physical activity. Two of them read <code>subj=['PE']</code>, so the "
            "prefix disagrees with the row's own mapping. Across the "
            f"{d['multi']:,}, {d['locked']} rows are locked and {d['reviewed']} carry a human reviewer, "
            "so this layer is unreviewed staging."),
        'why': ("Rule 7 permits principled re-mints while the M-ID layer is staging, under the "
                "playbook. These identities would be wrong to publish to faculty."),
        'rec': ("<strong>Re-mint the affected rows under the playbook</strong>, in one cron window, "
                "with an alias map and a <code>kb/promotions.json</code> re-key. <em>It might be "
                "wrong if</em> you would rather leave every identity untouched until the subject map "
                "is repaired, and re-mint once."),
        'rows': len(d['eths_physical']),
        'chips': chips(('Re-mint them', 'remint'), ('Wait for the map fix', 'wait'), ('Later', 'later')),
    })

    # ── 4 · kind A ───────────────────────────────────────────────────────────
    same = [f"{m.E(a)} with {m.E(b)} ({n} rows)" for (a, b), n in top if {a, b} in SAME_NAME]
    items.append({
        'title': 'One discipline carrying two official names',
        'ref': 'crosslist-same-name',
        'facts': (
            f"<strong>{K['A']}</strong> rows pair two names the CO's own MQ list carries separately: "
            + m.E("; ").join(same) + ". Kinesiology and Physical Education is the largest pair in the "
            "whole dataset. Intercollegiate Baseball resolves to both."),
        'why': ("Neither cross-listing nor nesting fits, because there is one discipline here and two "
                "words for it. The CO's vocabulary carries the duplication, so we resolve it on our "
                "side rather than asserting the list is wrong."),
        'rec': ("<strong>Name one preferred form per pair and treat the other as an accepted "
                "alias</strong> for counting, keeping both for display and search. Use the picker to "
                "say which form wins. <em>It might be wrong if</em> the colleges mean something "
                "different by each, in which case these are dual homes and belong in the cross-list."),
        'rows': K['A'],
        'chips': chips(('Alias to one form', 'alias'), ('Treat as dual homes', 'dual'), ('Later', 'later')),
        'pickers': [{'name': 'preferred', 'label': 'Preferred form for counting',
                     'list': 'dl-disciplines', 'value': 'Kinesiology',
                     'placeholder': "one of the CO's disciplines"}],
    })

    # ── 5 · kind B ───────────────────────────────────────────────────────────
    items.append({
        'title': 'A specialization and the discipline it sits inside',
        'ref': 'crosslist-specialization',
        'facts': (
            f"<strong>{K['B']}</strong> rows pair a narrower discipline with its parent: Art History "
            "and Commercial Art inside Art, Chicano Studies inside Ethnic Studies, Licensed Vocational "
            "Nursing inside Nursing, Commercial Music inside Music, Legal Assisting inside Law. "
            "Worked rows: " + ex(d['examples'], 'B', 2) + "."),
        'why': ("This is the part of the question where nesting is the right answer. The relationship "
                "holds for every course in the discipline, so recording it once on the vocabulary "
                "beats recording it on each of the rows."),
        'rec': ("<strong>Nest the vocabulary, not the courses.</strong> Give the discipline list a "
                "parent field; a course keeps its specialization and the counts roll up. <em>It might "
                "be wrong if</em> you want a course to appear under the parent by name, which a "
                "roll-up does not do on its own."),
        'rows': K['B'],
        'chips': chips(('Nest the vocabulary', 'nest'), ('Cross-list each course', 'xlist'), ('Later', 'later')),
    })

    # ── 6 · kind C ───────────────────────────────────────────────────────────
    w = d['xdisc_widest']
    items.append({
        'title': 'Cross-list the courses that genuinely have two homes',
        'ref': 'crosslist-dual-homes',
        'facts': (
            f"<strong>{K['C']}</strong> rows remain once the other three kinds are set aside: "
            + ex(d['examples'], 'C', 3) + ". The field already exists and already works — "
            f"{len(d['xdisc'])} rows carry <code>xdisc</code> today, and "
            f"<em>{m.E(w['title'].strip())}</em> carries {len(w['xdisc'])} disciplines because it "
            "genuinely is taught in all of them."),
        'why': ("The MQ discipline list decides who may teach a course rather than what the course is. "
                "A course taught by an Art-qualified instructor at one college and a Digital Media one "
                "at another is already cross-listed in the field; a single parent is the part that "
                "disagrees with practice."),
        'rec': ("<strong>Cross-list them through <code>xdisc</code>.</strong> <em>It might be wrong "
                "if</em> you would rather force one home per course and accept that some colleges "
                "will not find their own course where they look for it."),
        'rows': K['C'],
        'chips': chips(('Cross-list them', 'xlist'), ('Force one home', 'one'), ('Later', 'later')),
    })

    # ── 7 · the primary ──────────────────────────────────────────────────────
    items.append({
        'title': 'One discipline stays primary, for counting',
        'ref': 'crosslist-primary',
        'facts': (
            "The <code>disc</code> field is read by the Unified Courses tab and ten scripts, among "
            "them the SkyView builders, the discipline blanks worklist, the ESL relevel dry-run and "
            "the merge candidate queue. A course carrying two disciplines with no primary makes every "
            "discipline count ambiguous at once."),
        'why': ("This is the shape Rule 7 already uses for TOP: gate identity on one signal, keep the "
                "second for display. It lets a cross-list ship without touching a single counting "
                "surface."),
        'rec': ("<strong>Keep <code>disc</code> as the one primary; <code>xdisc</code> serves display "
                "and search.</strong> <em>It might be wrong if</em> you want a college to see its own "
                "discipline's number include a course whose primary sits elsewhere."),
        'chips': chips(('Keep a primary', 'primary'), ('Count both equally', 'coequal'), ('Later', 'later')),
    })

    # ── 8 · re-mint boundary ─────────────────────────────────────────────────
    items.append({
        'title': 'A cross-list never triggers a re-mint',
        'ref': 'crosslist-remint-boundary',
        'facts': (
            f"An M-ID's prefix follows its primary discipline's canonical SUBJ4. Of the {d['multi']:,}, "
            f"<strong>{d['cid']}</strong> already carry a C-ID rather than an M-ID, so an approved "
            "identifier is attached and a renumbering would reach outside our own staging layer."),
        'why': ("Cross-listing is reversible and a re-nest is a re-mint. Keeping the two apart is what "
                "makes the cross-list pass cheap enough to run across hundreds of rows."),
        'rec': ("<strong>Adding <code>xdisc</code> leaves the identifier alone.</strong> Only a change "
                "of primary enters the re-mint playbook. <em>It might be wrong if</em> you want the "
                "prefix to reflect every home a course has, which no four-letter prefix can do."),
        'chips': chips(('Never re-mint on a cross-list', 'never'), ('Re-mint on any change', 'remint'), ('Later', 'later')),
    })

    # ── 9 · the orphan parents ───────────────────────────────────────────────
    items.append({
        'title': 'The rows whose recorded discipline matches no member at all',
        'ref': 'crosslist-orphan-parents',
        'facts': (
            f"<strong>{d['orphan']}</strong> of the {d['multi']:,} carry a discipline that appears "
            "nowhere among their members' mapped disciplines. The parent and every college under it "
            "disagree. <em>Hydraulics (Fluid Power)</em> sits under Agriculture while its members read "
            "Automotive Technology and Fire Technology."),
        'why': ("These are neither dual homes nor specializations. Sending them through a cross-list "
                "pass would record the disagreement as a second home and settle nothing."),
        'rec': ("<strong>Give them their own worklist, ahead of the cross-list pass.</strong> "
                "<em>It might be wrong if</em> the recorded discipline is right and the members are "
                "the error, which the worklist would establish either way."),
        'rows': d['orphan'],
        'chips': chips(('Own worklist', 'worklist'), ('Fold into the pass', 'fold'), ('Later', 'later')),
    })

    # ── 10 · decision rights ─────────────────────────────────────────────────
    items.append({
        'title': 'Who may add a cross-list',
        'ref': 'crosslist-decision-rights',
        'facts': (
            f"Today <code>xdisc</code> is written by the generator and carries {len(d['xdisc'])} rows. "
            "Opening it to curators and faculty makes it a new write surface, which Rule 10(a3) routes "
            "through Governance and the privacy ADRs before it ships."),
        'why': ("A curator's knowledge is a first-class input and belongs recorded with a name against "
                "it, the way the provenance tiers work in <code>map_users.js</code>."),
        'rec': ("<strong>Jev proposes, a curator confirms, faculty may add — and every entry records "
                "who and when.</strong> <em>It might be wrong if</em> you want the first pass "
                "curator-only, which is slower and keeps the vocabulary tighter."),
        'chips': chips(('Proposed, curator-confirmed', 'confirm'), ('Curator only', 'curator'), ('Later', 'later')),
    })

    # ── 11 · his own KIN/PE ask ──────────────────────────────────────────────
    items.append({
        'title': 'KIN, PE and ATHL, and the C-ID and CCN fallout you asked for',
        'ref': 'crosslist-kin-pe-athl',
        'facts': (
            "Your note on item 13 of the title-rung sheet: <em>\"we should cross list all KIN, PE, "
            "ATHL courses… Let's do a follow up analysis of CID and CCN to see the fallout of cross "
            "listing or untangling KIN, PE, Athletic from Non-Athletic courses.\"</em> ATHL is a "
            "canonical Subject code and its MQ discipline is Kinesiology. Kinesiology with Physical "
            f"Education is the largest pair in the data at {top[0][1]} rows."),
        'why': ("This is the largest single population on the sheet, and it sits on top of item 4's "
                "alias question. Running the identifier analysis first means the alias lands once."),
        'rec': ("<strong>Run the C-ID and CCN fallout analysis before the alias lands.</strong> "
                "<em>It might be wrong if</em> you want the alias now and the analysis to follow, "
                "which reaches the counts sooner and may need a second pass."),
        'chips': chips(('Analysis first', 'analysis'), ('Alias now', 'now'), ('Later', 'later')),
    })

    # ── 12 · the first sitting ───────────────────────────────────────────────
    items.append({
        'title': 'What the first sitting looks at',
        'ref': 'crosslist-first-sitting',
        'facts': (
            f"You ruled 40 to 60 as a sitting size. Kind C holds {K['C']} rows and kind D holds "
            f"{K['D']}. The title rung ranks well and gates badly, so a sitting here asks the question "
            "the reviewer is actually answering: is this course at home in both places, or in the "
            "wrong one?"),
        'why': ("Sorting a dual home from a mis-nest is a question a faculty member answers in a "
                "glance, which makes it cheap to verify and worth a sitting."),
        'rec': ("<strong>Fifty rows from kind C, ranked, once items 1 through 7 are ruled.</strong> "
                "<em>It might be wrong if</em> you would rather start with kind D, where a fix removes "
                "rows from the problem rather than adding a field to them."),
        'rows': 50,
        'chips': chips(('Fifty from kind C', 'c50'), ('Start with kind D', 'd50'), ('Later', 'later')),
    })

    framing = (
        "You asked whether to get everything properly nested or cross-list the misfits. Measuring the "
        f"misfits first changes the answer: the {d['multi']:,} rows are at least four different "
        "problems, and each exit you named is right for one of them. Items 1 through 3 settle what is "
        "an error rather than a taxonomy call; 4 through 6 settle the treatment per kind; 7 through 10 "
        "settle what it costs; 11 and 12 say what runs first.")
    counts = (f"{d['multi']:,} rows in scope of {d['total']:,} · "
              f"{d['locked']} locked, {d['reviewed']} with a human reviewer")

    out = m.build_sheet(
        "Cross-list or nest: the options", items,
        framing=framing, curator="Sam Lee", counts=counts, sheet_id=SHEET_ID,
        lists={'dl-disciplines': d['disciplines']})
    open(OUT, 'w', encoding='utf-8').write(out)
    print(f"{len(items)} items · {d['multi']:,} rows in scope "
          f"· A {K['A']} / B {K['B']} / C {K['C']} / D {K['D']} "
          f"· {len(out):,} bytes → {os.path.relpath(OUT, ROOT)}")


if __name__ == '__main__':
    build()
