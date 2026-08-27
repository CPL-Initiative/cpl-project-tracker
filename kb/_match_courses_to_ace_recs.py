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
import json, re, collections

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

lattc = json.load(open('lattc_raw.json'))
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
    cands.sort(key=lambda c: (-round(c['score'],1), -min(c['peer_n'],1),
                              -c['colleges'], -c['exhibits'], -c['score']))
    seen, ded = set(), []
    for c in cands:                      # collapse "2 hours in X"/"3 hours in X" to the best-evidenced
        key = re.sub(r'^\d+(\.\d+)?\s+hours?\s+in\s+','',c['rec'])
        if key in seen: continue
        seen.add(key); ded.append(c)
    out.append({'code': code, 'subject_key': sk, 'subject_name': sname,
                'number': r['Course Number'], 'title': title,
                'top_code': r['Top Code'], 'cb08': r['CB08'],
                'candidates': ded[:5], 'n_cand': len(ded)})

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
