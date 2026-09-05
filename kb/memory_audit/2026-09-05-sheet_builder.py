#!/usr/bin/env python3
"""Build the plain-English decision sheet for the 2026-09-05 memory audit.
Reads sheet_items_plain.json (the auditors' 144 unsettled rows, rewritten in
plain English), plan.json (what was done and what is held), and the lint's
latest.json (the hygiene counts). Writes the First Light HTML."""
import json, os, html, re
from collections import defaultdict
SP = os.path.dirname(os.path.abspath(__file__))
REPO = '/home/user/cpl-project-tracker'
items = json.load(open(os.path.join(SP, 'sheet_items_plain.json')))
plan = json.load(open(os.path.join(SP, 'plan.json')))
rows = {r['id']: r for r in json.load(open(os.path.join(SP, 'cpl_memory_export.json')))}
lint = json.load(open(os.path.join(REPO, 'kb/memory_audit/latest.json')))
counts = lint['summary']['counts']
E = html.escape

def slug_words(s):
    return re.sub(r'[-_]+', ' ', s or '').strip()

# ── the 31 already retired, in plain words ────────────────────────────────
DONE_PLAIN = {
 'w1': 'The ESL packaging it asked for was applied on August 24; the milestone entry records it.',
 'college-district-identity-crosswalk-built': 'It said the college and district crosswalk was a dry run only; the district and MIS codes went live on August 21.',
 'ace-not-a-topic-class-is-6663-rows': 'You ruled on August 20 that this class of military recommendations gets proper credit recommendations and credit-by-exam offers, never a bulk close.',
 'ace-individualized-assessment-never-granted': 'The same August 20 ruling settles what happens to these recommendations.',
 'esl-ladder-table-has-no-l2-row': 'The ESL level table now has the two-step ladder row it said was missing, with your reasoning.',
 'esl-rollback-not-recommended-catalogs-disagree': 'Your decision the same day not to roll back the 32 ESL re-levels closed the question.',
 'the-remint-series-order-recode-then-z-band-one-cron-window': 'It was the plan for the September 3 re-mint; the re-mint happened that way and the milestone entry carries the method.',
 'kinesiology-credit-lands-at-996-of-999-after-the-z-band-retirement': 'The risk it raised was settled when you accepted continuing course numbers into the next band.',
 'authority-codes-attributed-12-ccn-14-c-id-120-csr-29-chips': 'The counts were re-cut after the recode: 13, 20, 114 and 23 now, not 12, 14, 120 and 29.',
 '137-materialized-records-sit-on-a-prefix-their-discipline-no-longer-owns': 'The fix landed: the September 4 prefix fold moved 278 records onto the code their discipline owns.',
 'the-prefix-fold-worklist-measured-278-moves-7-held-17-without-a-discipline': 'You said yes to all and the fold was applied the same day; the applied receipt is the record.',
 'register-reanalysis-sheet-built-awaiting-verdicts': 'No longer awaiting: you ruled all 22 items that night and the edits were made.',
 'cpl-apportionment-value-2026-07-31': 'A July measurement. The current figure is about 72,700 transcribed units, around $13.7 million, not 103,000 units and $19.4 million.',
 'funding-live-config-2026-08-04': 'An August 4 snapshot of the funding dials; the live settings changed on August 23 and again with the one-pool model.',
 'nc-split-ftes-floor-does-the-equity': 'The separate noncredit share it describes was retired with the one-pool model on August 31.',
 'funding-ceiling-400k-is-near-a-no-op-for-equity': 'Measured on the old model (115 colleges, a $175,000 floor, a separate noncredit lane); the one-pool model sizes one combined award.',
 'nc-threshold-cannot-go-below-400-at-the-50k-floor': 'The noncredit entry threshold and carve-out it studies were retired with the one-pool model.',
 'a-test-coupled-to-position-or-wording-breaks-on-correct-work': 'The page structure it warned about is gone, and a newer entry states the durable lesson.',
 'explainer-static-prose-stale-after-live-painting': 'Fixed on September 2: the explainer now paints its figures from the live model; a newer entry records the corrected lesson.',
 'two-funding-tab-consolidations-await-sams-verdict': 'You ruled both consolidations the same day and they shipped.',
 'what-sets-student-verified-vs-counselor-verified': 'You confirmed the same day that the counselor step alone is the funding attestation.',
 'contact-refresh-cadence-never-run': 'It said the contact-refresh reminder never ran; it has run for two colleges and has an owner now. The lesson survives in its knowledge note.',
 'no-dependency-map-from-dataset-to-consuming-tabs': 'You approved the fix on August 29 and the dependency map is built.',
 'fifteen-colleges-no-counseling-route': 'The count it rests on (71 colleges, 56 routed, 15 not) was replaced by the current list of 78 fallback contacts.',
 'map-student-credit-reloaded-tblsource': 'It describes an August 10 reload; the nightly run now replaces that table every night.',
 'two-average-applied-figures-differ': 'The Bakersfield figures it rests on no longer reproduce on the nightly-loaded data.',
 'moreno-valley-went-down-while-the-total-went-up': 'Its open question was answered the same evening: the catalog year rolls forward, so the axis moves.',
 'cpl-memory-scope-is-a-topic-tag-not-an-applicability-axis': 'You ruled the two-value scope on August 30 and it was migrated the same day.',
 'guidance-reaches-my-college-sierra': 'Two of its three claims changed: a guidance rule can now be limited to one screen, and the rule count is capped at 20.',
 'sierra-guidance-is-a-zero-sum-budget-at-ten-rows': 'The cap it describes (10 rules) was raised to 20 the same day; a newer entry records the current state.',
 'the-guidance-row-cap-is-a-fossil': 'The 10-rule cap it calls a fossil was raised to 20 the same day; a newer entry records the current state.',
}

def kind_word(k):
    return {'fact': 'A fact', 'pitfall': 'A lesson learned', 'decision': 'A decision', 'procedure': 'A procedure',
            'question': 'An open question', 'wishlist': 'A wish', 'opportunity': 'An opportunity', 'risk': 'A risk',
            'milestone': 'A milestone'}.get(k, k)

def age_words(d):
    if d >= 30: return f'written {d} days ago'
    return f'written {d} days ago'

# ── partition the 144 ─────────────────────────────────────────────────────
older = [i for i in items if i['age_days'] > 21]
recent = [i for i in items if i['age_days'] <= 21]
# group human-sourced superseded items by successor (two or more sharing one)
def grouped(lst):
    by = defaultdict(list)
    for i in lst:
        if i['verdict'] == 'superseded_by_row' and i.get('superseded_by'):
            by[i['superseded_by']].append(i)
    groups = {k: v for k, v in by.items() if len(v) >= 2}
    solo = [i for i in lst if not (i['verdict'] == 'superseded_by_row' and i.get('superseded_by') in groups)]
    return groups, solo
g_old, solo_old = grouped(older)
g_new, solo_new = grouped(recent)

n = [0]
def num():
    n[0] += 1; return n[0]

def card(i, number):
    who = f' · from {E(i["human_name"])}' if i.get('human_sourced') and i.get('human_name') else ''
    conf = '' if i.get('human_sourced') else f' · the auditor\'s confidence is {E(i.get("confidence") or "medium")}'
    return f'''<article class="card" id="i{number}">
  <header><span class="num">{number}</span> <h3 class="tname">{E(i['plain_title'])}</h3></header>
  <p class="meta">{E(kind_word(i['kind']))}, {E(age_words(i['age_days']))}{who}{conf}.</p>
  <dl>
    <dt>What the entry says</dt><dd>{E(i['plain'] or i['summary'] or '')}</dd>
    <dt>What the audit found</dt><dd>{E(i['plain_finding'])}</dd>
    <dt>The ask</dt><dd class="ask">{E(i['plain_ask'])}</dd>
  </dl>
  <p class="ref">reference: {E(i['slug'] or i['id'])}</p>
</article>'''

def group_card(succ, members, number):
    succ_row = next((r for r in rows.values() if r.get('slug') == succ), None)
    succ_title = (succ_row or {}).get('title') or slug_words(succ)
    lis = ''.join(f'<li><span class="gt">{E(m["plain_title"])}</span> — {E(m["plain_finding"])} <span class="ref">reference: {E(m["slug"] or m["id"])}</span></li>' for m in members)
    who = sorted({m.get('human_name') for m in members if m.get('human_name')})
    whos = f' Each records something {E(" or ".join(who))} said or ruled at the time.' if who else ''
    return f'''<article class="card" id="i{number}">
  <header><span class="num">{number}</span> <h3 class="tname">{len(members)} earlier entries replaced by one newer ruling</h3></header>
  <p class="meta">The newer entry is “{E(succ_title)}”.{whos}</p>
  <dl>
    <dt>The entries</dt><dd><ul class="glist">{lis}</ul></dd>
    <dt>The ask</dt><dd class="ask">Retire all {len(members)} in favor of the newer ruling? The recommendation is yes; they stay in the table's history and the newer entry becomes the one people read.</dd>
  </dl>
</article>'''

def section(title, lede, cards):
    return f'''<section class="group">
<h2>{E(title)}</h2>
<p class="lede-s">{E(lede)}</p>
{''.join(cards)}
</section>'''

parts = []
# ── item 1: the promotions ────────────────────────────────────────────────
held = [p for p in plan['plan'] if p['action'] == 'verify']
held_old = sum(1 for p in held if (lambda r: __import__('datetime').date(2026,9,5) - __import__('datetime').date.fromisoformat(r['created_at'][:10]))(rows[p['id']]).days > 21)
parts.append(f'''<section class="group">
<h2>The one large call</h2>
<article class="card lift" id="i1">
  <header><span class="num">1</span> <h3 class="tname">Mark the {len(held)} entries that passed with evidence as verified</h3></header>
  <dl>
    <dt>What it means</dt><dd>Each of these entries was checked against the current files, code and data, matched, and the place that confirms it was written down. Marking them verified records that check in the table so the next audit does not repeat it, and moves them into the list the team reads by default. {held_old} of them are older than three weeks.</dd>
    <dt>What changes if you say yes</dt><dd>The verified list grows from 303 entries to about 655. The Briefing reads a fixed-size sample of the verified entries, so each group's share of it gets thinner. Nothing is deleted, and the change can be undone from the receipt.</dd>
    <dt>The ask</dt><dd class="ask">Say yes to mark all {len(held)} verified, say older only to mark just the {held_old} older ones, or say no to leave them unverified for now. The recommendation is yes.</dd>
  </dl>
</article>
</section>''')

# ── older entries ─────────────────────────────────────────────────────────
n[0] = 1
cards = []
for succ, members in sorted(g_old.items(), key=lambda kv: -len(kv[1])):
    cards.append(group_card(succ, members, num()))
for i in solo_old:
    cards.append(card(i, num()))
parts.append(section('Older entries that are yours to rule on',
    f'{len(older)} entries older than three weeks that the audit could not settle on its own, oldest first. Most record something you or a teammate said or ruled at the time; a session never rewrites those, so each needs a word from you.', cards))

# ── class rulings ─────────────────────────────────────────────────────────
probe = [i for i in items if 'probe' in (i.get('slug') or '') or 'probe' in (i.get('reason') or '').lower()]
probe_refs = ', '.join(sorted(i['slug'] for i in probe if i.get('slug')))
cls = []
def cls_card(title, what, ask):
    k = num()
    return f'''<article class="card" id="i{k}">
  <header><span class="num">{k}</span> <h3 class="tname">{E(title)}</h3></header>
  <dl><dt>What it is</dt><dd>{what}</dd><dt>The ask</dt><dd class="ask">{E(ask)}</dd></dl>
</article>'''
cls.append(cls_card(f'{counts.get("proposed_with_human_verifier",0)} unverified entries already carry a person\'s name as the one who confirmed them',
    E('Sessions wrote these with your name, or Jenni\'s, in the confirmed-by field at the time, but never moved them out of the unverified list. Your check is the strongest confirmation the table has; the audit treated these as real attribution and did not touch them.'),
    'Mark these as verified, keeping the name already on them? The recommendation is yes.'))
cls.append(cls_card(f'{counts.get("unattributed_verified",0)} verified entries do not say who verified them',
    E('The verified list is the one people trust, and the confirmed-by field is how a reader knows why. These were marked verified by the sessions that wrote them, before the field was filled in as a habit.'),
    'Record the writing session as the verifier on each, as an attribution repair rather than a new claim? The recommendation is yes.'))
cls.append(cls_card('One out-of-date entry still carries a verification stamp, and two July entries marked out of date have no name',
    E('The entry about the live funding priorities being 50/30/20 was marked out of date in August but still shows as verified by a session; a stamp should not outlive the claim it describes. Two entries from August 5, both already marked out of date, were never given a name, so nothing can point at them.'),
    'Clear the stamp on the first, and retire the two nameless ones? The recommendation is yes.'))
cls.append(cls_card(f'Link hygiene: {counts.get("dead_path",0)} references to files that have moved and {counts.get("dangling_related",0)} pointers to entries that do not exist',
    E('The lint found entries that point at a file since renamed (for example the old public-page layout checker, now the accessibility engine) and cross-references that name no entry. Fixing them on session-written entries is mechanical and logged. Two successor pointers written on August 30 name no entry either; one names a vault lane in prose, so those wait for your word.'),
    'Fix the references on session-written entries, and leave the two August 30 pointers unless you say otherwise? The recommendation is yes.'))
cls.append(cls_card(f'{len(probe)} entries restate details from the doctrine-probe records you moved out of the vault',
    E('On August 30 you moved the doctrine-probe records out of the vault with an instruction not to look for or restate them. These memory entries carry details from those records. The audit judged them from tracker documents only, never the records, and confirmed their headlines.') + f'<p class="ref">references: {E(probe_refs)}</p>',
    'Does that instruction cover the memory table? If yes, these are retired to a pointer; if no, they stay. No recommendation; this is yours.'))
parts.append(section('Rulings that cover a whole class at once', 'One word from you settles each of these for every entry it names.', cls))

# ── recent entries, collapsed ─────────────────────────────────────────────
rc = []
for succ, members in sorted(g_new.items(), key=lambda kv: -len(kv[1])):
    rc.append(group_card(succ, members, num()))
for i in solo_new:
    rc.append(card(i, num()))
parts.append(f'''<section class="group">
<h2>Recent entries, lower priority</h2>
<p class="lede-s">{len(recent)} entries under three weeks old that also need a word. You said the recent ones are not the worry, so they are folded here; open the section when you have time.</p>
<details><summary>Show the {len(recent)} recent entries</summary>
{''.join(rc)}
</details>
</section>''')

# ── done, for veto ────────────────────────────────────────────────────────
done = [p for p in plan['plan'] if p['action'] in ('stale', 'supersede')]
dl = []
for k, p in enumerate(done, 1):
    r = rows[p['id']]
    what = 'marked out of date' if p['action'] == 'stale' else 'retired in favor of a newer entry'
    dl.append(f'<li id="d{k}"><span class="dnum">D{k}</span> <span class="gt">{E(r.get("title") or slug_words(r.get("slug")))}</span> — {what}. {E(DONE_PLAIN.get(r.get("slug") or "", p["note"]))} <span class="ref">reference: {E(r.get("slug") or r["id"])}</span></li>')
parts.append(f'''<section class="group">
<h2>Already done, for your veto</h2>
<p class="lede-s">These {len(done)} entries were retired today: 11 marked out of date, 20 retired in favor of a newer entry. None of them records something a person said or ruled. Every previous state is saved, so reply with the D-number and the word undo to restore one.</p>
<details><summary>Show the {len(done)} retired entries</summary>
<ol class="done">{''.join(dl)}</ol>
</details>
</section>''')

# ── not asked ─────────────────────────────────────────────────────────────
parts.append('''<section class="group">
<h2>Not asked, and why</h2>
<p class="lede-s">Thirty-three entries were judged probably still true, but the auditor's confidence was only medium, so they stay unverified for a second reading rather than taking your time. One hundred and eighteen entries carry a count or a figure with no date in the text; the lint lists them, and over time each should hold the ruling rather than the number. Nothing on this sheet touches the public knowledge base.</p>
</section>''')

total_items = n[0]
body = f'''<title>Memory Audit Verdicts</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;600;700&display=swap">
<style>
  /* First Light v1.6 tokens — a single-theme light identity by design. */
  :root {{
    --paper: #F4F2ED; --text-strong: #1C1C1A; --text-body: #3A3A36;
    --text-muted: #5C5C55; --surface-opaque: #FFFFFF; --surface-subtle: #F7F5F1;
    --border: rgba(28,28,26,.14); --border-strong: rgba(28,28,26,.30);
    --cobalt: #0047AB; --hunter: #2C601A; --seal-blue: #002F6D;
    --focus-ring: var(--cobalt); --radius: 14px;
  }}
  html {{ color-scheme: light; }}
  body {{ background: var(--paper); color: var(--text-body);
    font-family: 'Source Sans 3', Arial, sans-serif; font-size: 16px;
    line-height: 1.55; margin: 0; padding: 0 16px 64px; }}
  .wrap {{ max-width: 760px; margin: 0 auto; }}
  a {{ color: var(--cobalt); }}
  :focus-visible {{ outline: 3px solid var(--focus-ring); outline-offset: 2px; border-radius: 4px; }}
  .skip {{ position: absolute; left: -9999px; top: 0; background: var(--surface-opaque); color: var(--cobalt); padding: 8px 14px; z-index: 10; }}
  .skip:focus {{ left: 8px; }}
  @media (prefers-reduced-motion: reduce) {{ * {{ animation: none !important; transition: none !important; }} }}
  h1, h2, h3 {{ font-family: 'Playfair Display', Georgia, serif; color: var(--text-strong); text-wrap: balance; }}
  h1 {{ font-size: clamp(1.7rem, 5vw, 2.4rem); line-height: 1.15; margin: 40px 0 6px; }}
  h2 {{ font-size: 1.35rem; margin: 40px 0 4px; }}
  h3 {{ font-size: 1.05rem; margin: 0; font-family: 'Source Sans 3', Arial, sans-serif; font-weight: 700; }}
  .kicker {{ text-transform: uppercase; letter-spacing: .09em; font-size: .78rem; font-weight: 700; color: var(--text-muted); margin-top: 34px; }}
  .lede {{ font-size: 1.05rem; }}
  .lede-s {{ margin: 0 0 14px; color: var(--text-body); }}
  .howto {{ background: var(--surface-opaque); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px 20px; margin: 22px 0 8px; }}
  .howto p {{ margin: 6px 0; }}
  .howto code {{ background: var(--surface-subtle); border: 1px solid var(--border);
    border-radius: 5px; padding: 1px 6px; font-size: .92em; font-family: inherit; }}
  .tally {{ display: flex; flex-wrap: wrap; gap: 10px; margin: 18px 0 10px; padding: 0; list-style: none; }}
  .tally li {{ background: var(--surface-opaque); border: 1px solid var(--border);
    border-radius: 999px; padding: 5px 14px; font-size: .9rem; }}
  .tally b {{ color: var(--text-strong); font-variant-numeric: tabular-nums; }}
  .card {{ background: var(--surface-opaque); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px 20px 14px; margin: 14px 0; }}
  .card.lift {{ border-color: var(--border-strong); }}
  .card header {{ display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }}
  .num, .dnum {{ font-family: 'Playfair Display', Georgia, serif; font-weight: 700;
    font-size: 1.35rem; color: var(--text-strong); font-variant-numeric: tabular-nums; min-width: 1.6em; }}
  .dnum {{ font-size: 1rem; min-width: 2.4em; display: inline-block; }}
  .meta {{ margin: 0 0 4px; color: var(--text-muted); font-size: .92rem; }}
  .card dl {{ margin: 8px 0 0; }}
  .card dt {{ text-transform: uppercase; letter-spacing: .08em; font-size: .72rem;
    font-weight: 700; color: var(--text-muted); margin-top: 10px; }}
  .card dd {{ margin: 2px 0 0; }}
  .ask {{ color: var(--text-strong); font-weight: 600; }}
  .ref {{ color: var(--text-muted); font-size: .8rem; margin: 10px 0 0; word-break: break-all; }}
  .glist {{ margin: 4px 0 0; padding-left: 18px; }}
  .glist li {{ margin: 6px 0; }}
  .gt {{ font-weight: 600; color: var(--text-strong); }}
  details {{ margin: 8px 0; }}
  summary {{ cursor: pointer; font-weight: 600; color: var(--cobalt); padding: 6px 0; }}
  ol.done {{ list-style: none; padding: 0; margin: 8px 0 0; }}
  ol.done li {{ padding: 10px 0; border-top: 1px solid var(--border); }}
  @media (max-width: 560px) {{ .card {{ padding: 14px 14px 12px; }} .card header {{ gap: 8px; }} }}
</style>

<a class="skip" href="#sheet">Skip to the items</a>
<div class="wrap">
<main>
<p class="kicker">The shared memory, tested end to end · 2026-09-05</p>
<h1>Memory Audit Verdicts</h1>
<p class="lede">Every unverified entry in the team's memory, all 527 of them, was read against what the project currently holds to be true. This sheet holds what only you can settle, oldest first, in plain words. Thirty-one entries were already retired today; they are listed at the end so you can undo any of them.</p>

<div class="howto">
  <p><strong>How to reply:</strong> by number. <code>yes</code> takes the recommendation; or answer in your own words (<code>keep</code>, <code>retire</code>, <code>edit: …</code>, <code>later</code>).</p>
  <p>Example: <code>1 yes · 2 yes · 5 keep · 9 later</code></p>
  <p>The line under each item that begins with “reference” is for the session that carries out your answer; you can ignore it.</p>
</div>

<ul class="tally">
  <li><b>527</b> entries read</li>
  <li><b>{len(held)}</b> passed with evidence, waiting on item 1</li>
  <li><b>31</b> retired today, listed for your veto</li>
  <li><b>{total_items}</b> items to reply to</li>
</ul>

<div id="sheet">
{''.join(parts)}
</div>
</main>
</div>
'''
out = os.path.join(REPO, 'docs/visuals/2026-09-05-memory-audit-verdicts.html')
open(out, 'w', encoding='utf-8').write(body)
print('sheet written:', out, len(body.encode()), 'bytes |', total_items, 'numbered items |', len(older), 'older,', len(recent), 'recent |', len(done), 'done')
