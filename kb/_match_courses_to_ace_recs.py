#!/usr/bin/env python3
"""LATTC military-CPL course -> ACE credit-recommendation matcher.

TWO SIGNALS, REPORTED SEPARATELY, NEVER BLENDED
  A. THE CR EXISTS  - an ACE credit recommendation in this subject, with how many
                      ACE exhibits carry it and how many CA colleges' students
                      already hold it. This is what makes an articulation possible.
  B. PEER PRECEDENT - a named CA college has attached that CR to a named local
                      course. This is the evidence Jessica asked for.
A candidate with A and no B is still a proposal; it is labelled as one.

⚠️ Keyed on the CREDIT RECOMMENDATION, not on MOS/rate (Jessica, 2026-08-27):
a service member can hold several MOSs, so the CR printed on the JST is the
awardable unit. `exhibits` counts how many ACE exhibits carry the same CR - i.e.
how many different routes through the JST reach it.

⚠️ A PLAUSIBLE FALSE POSITIVE COSTS MORE THAN A MISS. A match must share a
STRONG token with the course TITLE. Generic nouns (maintenance, systems,
practices, planning) cannot carry a match on their own - that is what produced
"Street Maintenance (Applied Calculations)" -> "3 hours in mechanical
maintenance" and "Piping Principles And Practices" -> "1 hour in laboratory
practices" in the first cut. Courses with no strong match are reported as
NEEDS A HUMAN rather than given a weak one.
"""
import json, re, collections, difflib

# Same stopword list as public.cx_align_tokens() in Supabase - do not diverge.
STOP = {'introduction','intro','to','the','a','an','and','or','of','for','in','on',
        'with','from','into','i','ii','iii','iv','v','lab','laboratory','labs',
        'course','courses','class','hour','hours','unit','units','level','part',
        'study','studies','topics','special','selected','general','applied',
        'elective','electives'}

# WEAK: real words, but too generic to establish that two things are the same
# subject. They may CONTRIBUTE to a score; they may never be the only thing shared.
WEAK = {'practices','practice','principles','principle','techniques','technique',
        'fundamentals','fundamental','systems','system','operations','operation',
        'technology','technologies','maintenance','planning','methods','method',
        'materials','material','safety','basics','related','technical',
        'instruction','applications','application','service','services','repair',
        'control','controls','equipment','management','field','work','shop',
        'theory','skills','processes','process','design','analysis','testing',
        'reading','survey','use','using','care','support','activities','program'}

SYN = {}
for group in [                       # element 0 is the canonical form
    ['pipe','piping','pipefitting','pipefitter','plumbing','plumber'],
    ['weld','welding','welder','welds'],
    ['refrigeration','refrigerant','refrigerating'],
    ['electrical','electric','electricity'],
    ['electronic','electronics'],
    ['carpentry','carpenter'],
    ['construction','constructing'],
    ['hydraulic','hydraulics'],
    ['pneumatic','pneumatics'],
    ['mechanical','mechanics','mechanic'],
    ['architecture','architectural'],
    ['drafting','draft','drawing','drawings'],
    ['wastewater','sewage'],
    ['conditioning','hvac'],
    ['boiler','boilers'],
    ['motor','motors'],
    ['machine','machining','machinist','machinery','machines'],
    ['code','codes'],
    ['blueprint','blueprints'],
    ['surveying','surveys'],
    ['estimating','estimate','estimation','estimates'],
    ['insulation','insulating'],
    ['computer','computers','computing'],
    ['wiring','wire','wires'],
    ['mathematics','math','mathematic','maths'],
]:
    for w in group: SYN[w] = group[0]

def norm(s):
    s = (s or '').lower().replace('&amp;',' ').replace('/',' ')
    s = re.sub(r'[^a-z0-9 ]',' ', s)
    return re.sub(r'\s+',' ', s).strip()

def fold(t):
    if t in SYN: return SYN[t]
    if len(t) > 4 and t.endswith('es') and t[:-2] in SYN: return SYN[t[:-2]]
    if len(t) > 3 and t.endswith('s') and not t.endswith('ss'):
        b = t[:-1]
        return SYN.get(b, b)
    return t

def toks(s):
    return {fold(t) for t in norm(s).split()
            if t and t not in STOP and not t.isdigit() and len(t) > 1}

WEAK_F = {fold(w) for w in WEAK}

def rec_hours(rec):
    """Leading hour figure of an ACE recommendation ('3 hours in welding' -> 3.0).
    A range ('3-4 hours in ...') takes the LOW end: the conservative award."""
    m = re.match(r'^(\d+(?:\.\d+)?)(?:\s*-\s*\d+(?:\.\d+)?)?\s+hours?\s+in\s', rec)
    return float(m.group(1)) if m else None

# ── THE UNIT RULE (Jessica, 2026-08-27) ─────────────────────────────────────
# "Often credit recommendation hours match the units for the course. If the
#  credit recommendation hours vary by more than 1 unit, leave it off of the
#  list. If it varies by 1 unit, lower the confidence score but keep it on the
#  list. Hold off on the combinations mentioned previously. I think we were
#  overanalysing."
#
# A curator ruling replacing a modelled one. The earlier version scored the gap
# on a continuous curve, which kept a 3-hour recommendation at the top of a
# 1-unit lab because breadth outweighed the penalty — visibly wrong to the
# person who has to defend the articulation. A hard cut at >1 is simpler, and it
# is the reader who has to live with it who set it.
#
# ⚠️ The cut applies ONLY where COCI gave us units. On the 8 courses with no
# units nothing is dropped — an absent measurement must never read as a failed
# one, and silently shortening their list would be exactly that.
UNIT_GAP_DROP = 1.0        # strictly more than this many units apart -> not shown
UNIT_GAP_PENALTY = 0.5     # exactly one apart -> kept, scored lower

def unit_fit(h, u):
    """1.0 when the hours equal the units, UNIT_GAP_PENALTY at exactly one apart,
    None when either side is unknown. A gap larger than UNIT_GAP_DROP is not
    scored at all - unit_drop() removes it before scoring."""
    if h is None or u is None: return None
    d = abs(h - u)
    if d < 0.01: return 1.0
    return UNIT_GAP_PENALTY

def unit_drop(h, u):
    """True when the recommendation is further than one unit from the course and
    should not be offered. Unknown units never drop anything."""
    if h is None or u is None: return False
    return abs(h - u) > UNIT_GAP_DROP + 0.01

# Domain vocabulary per LATTC subject prefix. A course title is often too thin
# ("Materials Of Construction"); the subject says which trade it sits in.
SUBJ = {
 'ARC':     ('Architecture',                     {'architecture','drafting','blueprint','construction','building'}),
 'BLDGCTQ': ('Building Construction Technology', {'construction','building','energy','weatherization','carpentry'}),
 'CRPNTRY': ('Carpentry',                        {'carpentry','construction','framing','wood','concrete','building'}),
 'DRAFT':   ('Drafting',                         {'drafting','blueprint','mechanical','architecture'}),
 'ECONMT':  ('Electrical Construction & Maintenance', {'electric','electronic','wiring','circuit','motor','code','construction'}),
 'ENV':     ('Environmental Technology',         {'environmental','hazardous','regulations','pollution'}),
 'INT':     ('Interior Design',                  {'interior','architecture','building'}),
 'REF A/C': ('Refrigeration & Air Conditioning', {'refrigeration','air','conditioning','heating','ventilation','pipe'}),
 'ST MAIN': ('Stationary Engineering / Plant Maintenance', {'boiler','steam','mechanical','pump','machine','plant'}),
 'WASTE':   ('Wastewater Technology',            {'wastewater','water','treatment','pollution'}),
 'WATER':   ('Water Systems Technology',         {'water','treatment','distribution','pipeline','pipe'}),
 'WELDG/E': ('Welding',                          {'weld','arc','oxyacetylene','metal','fabrication','pipe','brazing'}),
}
TRADE_COMMON = {'blueprint','mathematics'}
for _k in SUBJ:
    SUBJ[_k][1].update(TRADE_COMMON)

# A few course-side words that name the same thing as the ACE wording.
TITLE_EXPAND = {'cad':{'computer','aided','drafting'}, 'cadd':{'computer','aided','drafting'},
                'calculation':{'mathematics'}, 'measurement':{'mathematics'}}

def subj_of(code):
    u = code.upper().replace(' ','')
    for k in sorted(SUBJ, key=len, reverse=True):
        if u.startswith(k.upper().replace(' ','')): return k
    m = re.match(r'^([A-Z /]+?)\d', code.upper())
    return (m.group(1).strip() if m else code)

def _norm_title(t): return re.sub(r'[^a-z0-9]', '', (t or '').lower())
def divergence(r):
    ct = r.get('_coci_title')
    if not ct: return None
    return round(difflib.SequenceMatcher(None, _norm_title(r['Course Title']), _norm_title(ct)).ratio(), 2)
def units_flag(r):
    if not r.get('_units'): return 'absent'          # not in our COCI extract
    d = divergence(r)
    if d is None or d == 1.0: return None
    return 'divergent' if d < 0.75 else 'spelling'   # 0.75 separates a renamed course from a typo

lattc = json.load(open('lattc_raw2.json'))
vocab = json.load(open('ace_vocab.json'))
peer  = json.load(open('peer_ace.json'))

GENERIC = re.compile(r'^cpl[- ]?\d+\b|elective course credits', re.I)
peer_by_rec = collections.defaultdict(list)
for r in peer:
    rec = norm(r['credit_rec'])
    for c in re.split(r'\),\s*', r['college_course']):
        c = c.strip().rstrip(',')
        if not c or GENERIC.search(c): continue    # "CPL-1 Elective Course Credits" is a placeholder
        if not c.endswith(')'): c += ')'
        peer_by_rec[rec].append({'college': r['college_name'], 'course': c,
                                 'exhibit_id': r['exhibit_id'], 'exhibit_title': r['exhibit_title']})

V = []
for v in vocab:
    body = re.sub(r'^\d+(\.\d+)?\s+hours?\s+in\s+', '', v['rec'])
    t = toks(body)
    if t: V.append((v, t))

def score(title_t, subj_t, rec_t):
    shared = title_t & rec_t
    strong = shared - WEAK_F
    if not strong:
        return None                       # generic-only overlap is not a match
    subj_hit = (subj_t & rec_t) - shared
    # ── DOMAIN GATE ──────────────────────────────────────────────────────
    # A strong shared word is not enough on its own: "Calculations and
    # Measurement for Woodworking Students" shares 'calculation' with
    # "1 hour in medication calculations" and 'student' with "3 hours in
    # student teaching". The recommendation must ALSO sit in this course's
    # trade - or two independent content words must agree, which is evidence
    # regardless of whether my domain list happens to name them.
    in_domain = bool(rec_t & subj_t) or bool(strong & subj_t)
    if not in_domain and len(strong) < 2:
        return None
    cov_rec    = len(shared | subj_hit) / len(rec_t)
    cov_title  = len(shared) / max(1, len(title_t))
    strength   = len(strong) / max(1, len(rec_t - WEAK_F) or 1)
    s = 0.45*cov_rec + 0.30*cov_title + 0.25*min(strength,1.0)
    return round(s,4), sorted(strong), sorted(shared-strong), sorted(subj_hit)

def pick_shown(ded, u, top=5, fits=5):
    """What the card offers: the best few by confidence, PLUS the best few whose
    HOURS EQUAL THE COURSE'S UNITS even when those rank below the cut.

    ⚠️ Truncating to the top 6 by confidence hid 22 exact-hour matches on a
    2-unit carpentry course, and hid one entirely on 12 courses (5 of them at
    ≤2 units) - precisely the small courses that are hardest to articulate and
    that Jessica asked to make easy. Confidence rewards breadth, and the broad
    recommendations are the 3-hour ones, so a small course's best-fitting option
    is systematically pushed down the list."""
    shown = list(ded[:top])
    if u is None: return shown
    have = {c['rec'] for c in shown}
    extra = [c for c in ded if c.get('unit_fit') == 1.0 and c['rec'] not in have]
    extra.sort(key=lambda c: -c['confidence'])
    for c in extra[:fits]:
        c['fits_units'] = True
    return shown + extra[:fits]

out = []
for r in lattc:
    code, title = str(r['Course Subject']), str(r['Course Title'])
    sk = subj_of(code); sname, sterms = SUBJ.get(sk,(sk,set()))
    sterms = {fold(t) for t in sterms}
    ct = toks(title)
    for _t in list(ct):
        ct |= TITLE_EXPAND.get(_t, set())
    cands = []
    for v, rt in V:
        res = score(ct, sterms, rt)
        if not res: continue
        sc, strong, weakish, subj_hit = res
        pr = peer_by_rec.get(norm(v['rec']), [])
        cands.append({'rec': v['rec'], 'score': sc, 'exhibits': v['ex'],
                      'colleges': v['col'], 'students': v['stu'],
                      'strong_match': strong, 'also_shared': weakish,
                      'subject_support': subj_hit,
                      'peers': pr[:8], 'peer_n': len(pr)})
    # Rank on HOW WELL THE CR FITS first, with peer precedent as the tiebreak
    # inside a 0.1 score band. Peer-first sorting demoted better matches:
    # "Water Distribution I" was answered with "3 hours in distribution
    # management" (business distribution) over "water storage and distribution",
    # and "Construction Wiring" with "introduction to construction" over the
    # wiring recs. Whether anyone has done it does not change what it IS.
    # ── CONFIDENCE ───────────────────────────────────────────────────────
    # A HEURISTIC, NOT A PROBABILITY, and its three inputs are shown on the
    # card so a reviewer can disagree with the arithmetic rather than the
    # number. Deliberately NOT trained on anything: nobody has labelled a
    # ground truth for "is this the right CR", so a fitted score would be a
    # borrowed authority. It ranks; faculty decide.
    # UNIT FIT — measured, not assumed: across 3,419 peer articulations carrying
    # both numbers, 81.1% pair a CR's hours with a course of EXACTLY those units.
    # Matching hours to units is what colleges actually do, so it earns a real
    # share of the score. When COCI has no units the term is dropped and the
    # remaining weights are renormalised, so an unmeasured course is never
    # penalised for something we failed to look up.
    course_units = None
    try: course_units = float(r['_units']) if r.get('_units') else None
    except (TypeError, ValueError): course_units = None
    cands = [c for c in cands if not unit_drop(rec_hours(c['rec']), course_units)]
    for c in cands:
        fit  = c['score']
        peer = 1.0 if c['peer_n'] else 0.0
        breadth = min(c['colleges'] / 40.0, 1.0)
        h = rec_hours(c['rec'])
        uf = unit_fit(h, course_units)
        if uf is None:
            conf = 0.55*fit + 0.25*peer + 0.20*breadth
        else:
            conf = 0.45*fit + 0.20*peer + 0.15*breadth + 0.20*uf
        c['confidence'] = round(conf, 3)
        c['confidence_band'] = ('High' if conf >= 0.70 else
                                'Medium' if conf >= 0.45 else 'Low')
        c['rec_hours'] = h
        c['unit_fit'] = None if uf is None else round(uf, 3)
        c['confidence_parts'] = {'fit': round(fit,3), 'peer': bool(c['peer_n']),
                                 'breadth': round(breadth,3),
                                 'units': None if uf is None else round(uf,3)}

    cands.sort(key=lambda c: (-round(c['score'],1), -min(c['peer_n'],1),
                              -c['colleges'], -c['exhibits'], -c['score']))
    # ⚠️ DO NOT COLLAPSE HOUR VARIANTS. An earlier cut folded "1 hour in welding"
    # into "3 hours in welding" and kept the better-evidenced one - which threw
    # away the only thing that distinguishes a 1-unit lab's recommendation from a
    # 3-unit lecture's. Jessica, 2026-08-27: "We wouldn't want to give a 3 hour
    # credit recommendation for a 1 unit course and then use the same credit
    # recommendation for a 3 unit course." The hour variants ARE the choice.
    # Only exact-duplicate strings collapse.
    seen, ded = set(), []
    for c in cands:
        if c['rec'] in seen: continue
        seen.add(c['rec']); ded.append(c)
    ded.sort(key=lambda c: -c['confidence'])
    out.append({'code': code, 'subject_key': sk, 'subject_name': sname,
                'number': r['Course Number'], 'title': title,
                'top_code': r['Top Code'], 'cb08': r['CB08'],
                # COCI, joined on (subject, course number) with leading zeros
                # stripped. 8 of 139 do not resolve - reported, never guessed.
                'units': r.get('_units'), 'coci_title': r.get('_coci_title'),
                'control_number': r.get('_control'), 'cid': r.get('_cid'),
                'credit_type': r.get('_credit_type'),
                'units_variants': r.get('_units_multi'),
                'course_units': course_units,
                # Does LATTC's course number name the same course COCI has? A
                # units join is also a course-identity check, and five of these
                # numbers point at a DIFFERENT course - flagged, never silently
                # carried, because a recommendation on the wrong course number
                # is worse than no recommendation.
                'units_flag': units_flag(r), 'divergence_ratio': divergence(r),
                'candidates': pick_shown(ded, course_units), 'n_cand': len(ded)})

json.dump(out, open('lattc_matches.json','w'), indent=1)

n_any    = sum(1 for o in out if o['candidates'])
n_peer   = sum(1 for o in out if any(c['peer_n'] for c in o['candidates']))
n_none   = sum(1 for o in out if not o['candidates'])
print(f"courses                            : {len(out)}")
print(f"  with a peer-backed CR (A + B)    : {n_peer}")
print(f"  CR exists, no peer yet (A only)  : {n_any-n_peer}")
print(f"  NO candidate -> needs a human    : {n_none}")
print()
tot=collections.Counter(); wA=collections.Counter(); wB=collections.Counter()
for o in out:
    tot[o['subject_name']]+=1
    if o['candidates']: wA[o['subject_name']]+=1
    if any(c['peer_n'] for c in o['candidates']): wB[o['subject_name']]+=1
print(f"{'subject':<44}{'courses':>8}{'CR':>5}{'peer':>6}")
for s,n in tot.most_common():
    print(f"{s:<44}{n:>8}{wA[s]:>5}{wB[s]:>6}")
