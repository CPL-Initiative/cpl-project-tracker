#!/usr/bin/env python3
"""Recommend a local title and a common subject code for the Subjects rows that have none (S700, #3655).

WHY. A local subject title comes only from the catalog's subject heading (Sam's rule on #3655). Where the catalog
gives a code no heading, a person settles the title, and Sam asked for a recommendation beside each such row with
a confidence level that was measured before it is shown. This script reads what the repo already holds and files
kb/status/local_subject_recommendations.json. It writes no title and no common code anywhere else: the Subjects
builder and the subject map do not read it.

THE SOURCES, each measured with the answer left out of its own vote:
  district        the same code, titled at another college of the same district (the Los Angeles district
                  shares its codes).
  other_colleges  the same code, titled at the other filed colleges: all agree (two or more), one college, mixed.
  sibling         a titled code at the same college whose letters are the same (A&P and AP) or that is this
                  code plus or minus its last letter (POL and POLS).
  course_joins    the code's courses in the state list that share an M-ID, a C-ID or a CCN with a course under
                  a titled code at another filed college; each course gives one vote.
  program_titles  a program at the same college whose required courses sit mostly under this code (Sam,
                  2026-11-21: program titles inform the recommendation and never set it; never High).
  web_search      a search a session ran and filed in kb/reference/subject_web_searches.json (Sam, 2026-11-21:
                  for every Not in catalog row). It lifts or lowers a level; by itself it reads Low. A department
                  or program label the search found is read the same way, as weaker evidence (Sam, 2026-11-21:
                  "Dept labels can be helpful for our edge case recommendations").

THE MEASURE. Every titled code is taken out and each source is asked for its title. A source's answer is right
when it equals the catalog's heading after folding case, "&" and punctuation, or when one names the other whole
(Welding and Welding Technology). Each source is split into the conditions it can be in (all agree, mixed, ...)
and each condition takes the level its measured share earns: High at 90% right or more, Medium at 60%, Low
below. A condition measured on fewer than 20 codes reads Low. Program titles are capped at Medium. A second
source that agrees lifts the level one step; one that disagrees is shown beside it and the row reads Low, and
among differing titles one the code's letters run through (COOP ED through Cooperative Education) is put first.

THE COMMON CODE. For a row with no common code the script recommends one from, in order: the title (the local
or recommended title, or a part of it set off by a slash or a comma, names an MQ discipline in
kb/discipline_canonical_subj4.json), the M-IDs its own courses
hold (the majority Common SUBJ, folded to the discipline's canonical code), and the M-IDs the same code holds at
other colleges. It is scored on Sam's 30 Cerritos decisions (kb/reference/subject_code_decisions_cerritos_
2026-11-21.json), which no source reads, and on the rows the subject map already settles. Where a recommendation
diverges from Sam's decision, his decision stands and the divergence is listed.

BANDS. Credit and noncredit are read apart (Sam, 2026-11-21: the MQs separate them); a row with both takes its
recommendation from its credit courses. The noncredit hold (r-noncredit-hold-sam-2026-11-21) lifted on Sam's go of
2026-11-22 (r-noncredit-title-list-go-sam-2026-11-22), so a row whose courses are all noncredit is lined up with the
standing noncredit subject title list (kb/status/noncredit_subject_titles.json) by its own dominant COCI noncredit
category: a list title under that category whose program prints the same code, else the one title under it the code's letters run through. Two more conditions are measured and not used, because
each was right less than half the time (shared course titles; letters that run through several titles). Nothing else is read, and a
category name alone gives no title. The noncredit_list source is measured the same way, on the noncredit-only codes
that hold a catalog heading, each left out of the list; a heading the list folds into one of its titles (ESL Classes
into English as a Second Language) counts as that title. Its common code is the category's noncredit MQ
discipline's code, measured on the noncredit-only rows the subject map settles; a category with no code yet says so
and recommends none.

Usage: python3 kb/_build_local_subject_recommendations.py            (write the file)
       python3 kb/_build_local_subject_recommendations.py --check    (fail if the committed file is stale)
"""
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from subject_title_case import title_case  # noqa: E402
from _build_noncredit_subject_titles import group_title  # noqa: E402

TITLES = os.path.join("kb", "status", "local_subject_titles.json")
STATE = "coci_lookup_data.js"
CANONICAL = os.path.join("kb", "discipline_canonical_subj4.json")
DECISIONS = os.path.join("kb", "reference", "subject_code_decisions_cerritos_2026-11-21.json")
SEARCHES = os.path.join("kb", "reference", "subject_web_searches.json")
PROGRAMS = os.path.join("kb", "program_requirements_college")
OUT = os.path.join("kb", "status", "local_subject_recommendations.json")
NCLIST = os.path.join("kb", "status", "noncredit_subject_titles.json")
NO_CATEGORY = "(no category in the export)"

HIGH, MEDIUM, FLOOR_N = 0.90, 0.60, 20
# A noncredit list condition right less often than wrong is a guess, and the brief rules guesses out (S701 review): it
# stays measured in the file, marked unused, and feeds no recommendation.
USE_FLOOR = 0.50
LEVELS = ["Low", "Medium", "High"]
AWARD_WORDS = re.compile(
    r"\b(a\.?a\.?-?t?|a\.?s\.?-?t?|associate (in|of) (arts|science)( for transfer)?|degree|certificate( of "
    r"(achievement|proficiency|competency|completion|accomplishment))?|for transfer|adt|noncredit|skills?)\b", re.I)


def norm(t):
    t = (t or "").lower().replace("&", " and ")
    t = re.sub(r"\(.*?\)", " ", t)
    return re.sub(r"[^a-z0-9]+", " ", t).strip()


def same(a, b):
    """Right: equal after folding, or one names the other whole."""
    a, b = norm(a), norm(b)
    if not a or not b:
        return False
    if a == b:
        return True
    ta, tb = set(a.split()) - {"and", "of", "the"}, set(b.split()) - {"and", "of", "the"}
    return bool(ta) and bool(tb) and (ta <= tb or tb <= ta)


def fits(code, title):
    """The code's letters run in order through the title (COOP ED through Cooperative Education)."""
    it = iter(re.sub(r"[^a-z]", "", (title or "").lower()))
    letters = re.sub(r"[^a-z]", "", code.lower())
    return bool(letters) and all(ch in it for ch in letters)


def college_key(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def district(slug):
    return "los_angeles" if "los_angeles" in slug else slug


def alnum(code):
    return re.sub(r"[^A-Z0-9]", "", code.upper())


def read_state(root):
    src = open(os.path.join(root, STATE), encoding="utf-8").read()
    return json.loads(src[src.index("{"):src.rindex("}") + 1])


def top(counter):
    """(answer, votes, all votes) with ties broken by the answer's own text, so a rebuild gives the same file."""
    if not counter:
        return None, 0, 0
    best = sorted(counter.items(), key=lambda kv: (-kv[1], kv[0]))[0]
    return best[0], best[1], sum(counter.values())


class Data:
    def __init__(self, root):
        doc = json.load(open(os.path.join(root, TITLES), encoding="utf-8"))
        col = {c: i for i, c in enumerate(doc["columns"])}
        self.rows = []          # dicts, one per college-and-code pair
        self.titled = defaultdict(list)   # code -> [(slug, title)]
        self.by_college = defaultdict(dict)
        names = {}
        for c in doc["colleges"]:
            names[college_key(c["college"])] = c["slug"]
            for r in c["rows"]:
                row = {k: r[i] for k, i in col.items()}
                row["slug"], row["college"] = c["slug"], c["college"]
                self.rows.append(row)
                self.by_college[c["slug"]][row["code"]] = row
                if row["printed_name"]:
                    self.titled[row["code"]].append((c["slug"], row["printed_name"]))
        state = read_state(root)
        idx = {i: names.get(college_key(n)) for i, n in enumerate(state["colleges"])}
        # joins: a key (M-ID, C-ID or CCN) -> [(slug, code)] at the filed colleges; and per pair its courses
        self.join = defaultdict(set)
        self.courses = defaultdict(list)      # (slug, code) -> [(band, keys, subj4)]
        self.mid_all = defaultdict(Counter)   # (code, band) -> Counter(subj4) at every college in the state list
        self.mid_own = defaultdict(Counter)   # (slug, code, band) -> Counter(subj4)
        self.course_names = defaultdict(set)  # (slug, code) -> {folded title} of its noncredit courses
        for r in state["rows"]:
            code, band = r[2].strip().upper(), r[6]
            subj4 = r[10].split(" ")[0] if r[10] else None
            if subj4:
                self.mid_all[(code, band)][subj4] += 1
            slug = idx.get(r[0])
            if not slug:
                continue
            keys = [k for k in ("M:" + r[10] if r[10] else None, "C:" + r[8] if r[8] else None,
                                "N:" + r[9] if r[9] else None) if k]
            self.courses[(slug, code)].append((band, keys))
            if band != "C" and norm(r[4]):
                self.course_names[(slug, code)].add(norm(r[4]))
            for k in keys:
                self.join[k].add((slug, code))
            if subj4:
                self.mid_own[(slug, code, band)][subj4] += 1
        canon = json.load(open(os.path.join(root, CANONICAL), encoding="utf-8"))["disciplines"]
        self.disc_by_name = {}
        self.code_title = {}
        fold = defaultdict(Counter)
        for name, v in canon.items():
            c4 = v.get("canonical_subj4")
            if not c4:
                continue
            self.code_title[c4] = name
            self.disc_by_name[norm(name)] = c4
            for part in re.split(r"[/:]", name):
                if len(norm(part)) > 3:
                    self.disc_by_name.setdefault(norm(part), c4)
            fold[c4][c4] += 10 ** 9
            for var, n in (v.get("variants_observed") or {}).items():
                fold[var][c4] += n
            if v.get("data_modal_is_4letter") and v.get("data_modal"):
                fold[v["data_modal"]][c4] += v.get("total_mids") or 1
        self.fold = {var: top(c)[0] for var, c in fold.items()}
        self.programs = self._programs(root)
        p = os.path.join(root, NCLIST)
        nl = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
        self.nc_titles, self.nc_mq = nl.get("titles") or [], nl.get("mq") or {}
        p = os.path.join(root, SEARCHES)
        self.searches = {}
        if os.path.exists(p):
            for s in json.load(open(p, encoding="utf-8")).get("searches", []):
                self.searches[(s["college"], s["local_code"])] = s

    def _programs(self, root):
        """(slug, code) -> [program title] where the program's required courses sit mostly under the code."""
        out = defaultdict(list)
        for slug in sorted(self.by_college):
            for f in sorted(glob.glob(os.path.join(root, PROGRAMS, slug, "records", "*.json"))):
                try:
                    d = json.load(open(f, encoding="utf-8"))
                except ValueError:
                    continue
                rec = d.get("record") or {}
                codes = Counter()
                for b in rec.get("blocks") or []:
                    if b.get("rule") != "all":
                        continue
                    for c in b.get("courses") or []:
                        m = re.match(r"^(.*?)\s+[0-9]", (c.get("code") or "").strip().upper())
                        if m:
                            codes[m.group(1).strip()] += 1
                code, n, total = top(codes)
                if total >= 3 and n / total >= 0.6:
                    t = AWARD_WORDS.sub(" ", re.sub(r"\(.*?\)", " ", d.get("title") or ""))
                    t = re.sub(r"\s+", " ", t).strip(" ,-:")
                    if t:
                        out[(slug, code)].append(t)
        return out


def vote(titles):
    """Fold spellings of one title together; the answer is printed as its most common spelling."""
    groups = defaultdict(Counter)
    for t in titles:
        groups[norm(t)][t] += 1
    count = Counter({k: sum(v.values()) for k, v in groups.items()})
    k, n, total = top(count)
    return (top(groups[k])[0] if k else None), n, total


def sources(data, slug, code, band_filter=None):
    """Each source's answer for one pair, its own title never read: {source: (title, condition, evidence)}."""
    out = {}
    others = [(s, t) for s, t in data.titled.get(code, []) if s != slug]
    here = [t for s, t in others if district(s) == district(slug)]
    if here:
        t, n, total = vote(here)
        cond = "all agree" if n == total and total >= 2 else ("one college" if total == 1 else "mixed")
        out["district"] = (t, cond, "%d of %d colleges in the district" % (n, total))
    away = [t for s, t in others if district(s) != district(slug)]
    if away:
        t, n, total = vote(away)
        cond = "all agree" if n == total and total >= 2 else ("one college" if total == 1 else "mixed")
        out["other_colleges"] = (t, cond, "%d of %d other colleges" % (n, total))
    sib = []
    for c2, row in data.by_college[slug].items():
        if c2 == code or not row["printed_name"]:
            continue
        a, b = alnum(code), alnum(c2)
        if a == b or (len(a) >= 3 and len(b) >= 3 and (a[:-1] == b or b[:-1] == a)):
            sib.append((c2, row["printed_name"]))
    if sib:
        sib.sort()
        out["sibling"] = (sib[0][1], "same letters" if alnum(sib[0][0]) == alnum(code) else "one letter apart",
                          "code %s at the same college" % sib[0][0])
    votes = []
    for band, keys in data.courses.get((slug, code), []):
        if band_filter and band != band_filter:
            continue
        per = []
        for k in keys:
            for s2, c2 in sorted(data.join[k]):
                r2 = data.by_college[s2].get(c2) if s2 != slug else None
                if r2 and r2["printed_name"]:
                    per.append(r2["printed_name"])
        if per:
            votes.append(vote(per)[0])
    if votes:
        t, n, total = vote(votes)
        cond = "most courses agree" if total >= 3 and n / total >= 0.6 else "few or mixed"
        out["course_joins"] = (t, cond, "%d of %d joined courses" % (n, total))
    progs = data.programs.get((slug, code))
    if progs:
        t, n, total = vote(progs)
        cond = "several agree" if n >= 2 else "one or mixed"
        out["program_titles"] = (t, cond, "%d of %d programs" % (n, total))
    return out


def measure(data):
    """Leave each titled pair out; count right and asked per source and condition."""
    tally = defaultdict(lambda: [0, 0])
    for row in data.rows:
        if not row["printed_name"]:
            continue
        for src, (t, cond, _) in sources(data, row["slug"], row["code"]).items():
            cell = tally[(src, cond)]
            cell[1] += 1
            cell[0] += 1 if same(t, row["printed_name"]) else 0
    table = {}
    for (src, cond), (right, asked) in sorted(tally.items()):
        share = right / asked
        level = "High" if share >= HIGH else ("Medium" if share >= MEDIUM else "Low")
        if asked < FLOOR_N:
            level = "Low"
        if src == "program_titles" and level == "High":
            level = "Medium"
        table.setdefault(src, {})[cond] = {"right": right, "asked": asked, "share": round(share, 3), "level": level}
    return table


def recommend_title(data, table, row):
    band = "C" if row["credit_courses"] else None
    got = sources(data, row["slug"], row["code"], band)
    ranked = []
    for src, (t, cond, ev) in got.items():
        m = table.get(src, {}).get(cond)
        if not m:
            m = {"level": "Low", "share": 0.0, "asked": 0}
        ranked.append((LEVELS.index(m["level"]), m["share"], src, t, cond, ev))
    search = data.searches.get((row["slug"], row["code"]))
    # What the search found: the subject title a page of the college gives, else a department or program label
    # (Sam, 2026-11-21: "Dept labels can be helpful for our edge case recommendations"). A label is weaker
    # evidence: it is shown and it can agree or differ, and by itself it reads Low and says it is a label.
    found = (search or {}).get("title") or (search or {}).get("label")
    is_label = bool(search) and not search.get("title") and bool(search.get("label"))
    brief = None
    if search:
        brief = {k: search.get(k) for k in ("query", "searched_on", "result_title", "result_url", "where")}
    if not ranked:
        if found and search.get("where") in ("college site", "catalog"):
            return {"title": title_case(found), "level": "Low", "from": "web_search",
                    "why": ("A web search found a department or program label on the college's own site; no other "
                            "source names a title." if is_label else
                            "A web search found it on the college's own site; no other source names a title."),
                    "also": [], "search": brief}
        return None
    ranked.sort(key=lambda x: (-x[0], -x[1], x[2]))
    if not all(same(r[3], ranked[0][3]) for r in ranked) and not fits(row["code"], ranked[0][3]):
        # The sources differ: one whose title the code's letters run through goes ahead of one they do not.
        ranked.sort(key=lambda x: (not fits(row["code"], x[3]), -x[0], -x[1], x[2]))
    lvl, _, src, t, cond, ev = ranked[0]
    agree = [r for r in ranked[1:] if same(r[3], t)]
    differ = [r for r in ranked[1:] if not same(r[3], t)]
    why = "%s: %s (%s)." % (src.replace("_", " "), ev, cond)
    if found:
        (agree if same(found, t) else differ).append((0, 0, "web_search", found, "", ""))
    if differ:
        lvl = 0
        why += " Another source reads differently."
    elif agree:
        lvl = min(2, lvl + 1)
        if src == "program_titles" and not any(a[2] != "web_search" for a in agree):
            lvl = min(lvl, 1)
        why += " %s agrees." % ", ".join(sorted(set(a[2].replace("_", " ") for a in agree)))
    out = {"title": title_case(t), "level": LEVELS[lvl], "from": src, "why": why,
           "also": [{"title": title_case(r[3]), "from": r[2]} for r in differ]}
    if brief:
        out["search"] = brief
    return out


def noncredit_only(row):
    return bool(row.get("noncredit_courses")) and not row.get("credit_courses")


def dominant(row):
    """(category, its noncredit courses, all noncredit courses with a category) for the row, most courses first."""
    parts = sorted([(n, k) for n, k in (row.get("categories") or []) if n != NO_CATEGORY], key=lambda p: (-p[1], p[0]))
    return (parts[0][0], parts[0][1], sum(k for _, k in parts)) if parts else (None, 0, 0)


def category_words(cat, n, total):
    return "its dominant COCI noncredit category, %s (%d of %d noncredit courses, %d%%)" % (cat, n, total, round(100 * n / total))


def noncredit_list(data, row):
    """(title, condition, category, n, total) from the standing noncredit title list, or None. The row's own place
    in the list is left out, so a heading never votes for itself."""
    cat, n, total = dominant(row)
    if not cat:
        return None
    me = (row["slug"], row["code"])
    cands = []
    for t in data.nc_titles:
        if t.get("category") != cat:
            continue
        members = [(m["college"], m["code"]) for m in t.get("members") or [] if (m["college"], m["code"]) != me]
        if members:
            cands.append((t, members))
    if not cands:
        return None
    order = lambda t: (-t.get("programs", 0), t["title"])  # noqa: E731
    same_code = sorted([t for t, ms in cands if any(c == row["code"] for _, c in ms)], key=order)
    if same_code:
        return same_code[0]["title"], "same code", cat, n, total
    mine = data.course_names.get(me) or set()
    best = []
    for t, ms in cands:
        theirs = set()
        for m in ms:
            theirs |= data.course_names.get(m, set())
        hit = len(mine & theirs)
        if hit:
            best.append((hit, t))
    if best:
        best.sort(key=lambda x: (-x[0],) + order(x[1]))
        hit, t = best[0]
        if hit >= 2 or hit / len(mine) >= 0.5:
            return t["title"], "courses match", cat, n, total
    fit = sorted([t for t, _ in cands if fits(row["code"], t["title"])], key=order)
    if fit:
        return fit[0]["title"], "letters, one title" if len(fit) == 1 else "letters, several titles", cat, n, total
    return None


def level_of(right, asked):
    share = right / asked if asked else 0.0
    level = "High" if share >= HIGH else ("Medium" if share >= MEDIUM else "Low")
    return ("Low" if asked < FLOOR_N else level), share


def measure_noncredit(data):
    """The noncredit_list source and the category's common code, each asked on the noncredit-only rows that already
    hold the answer (a catalog heading; a common code from the subject map), the row left out of its own vote."""
    titles, common = defaultdict(lambda: [0, 0]), [0, 0]
    for row in data.rows:
        if not noncredit_only(row):
            continue
        h = row["printed_name"]
        if h:
            got = noncredit_list(data, row)
            if got:
                cell = titles[got[1]]
                cell[1] += 1
                cell[0] += 1 if (same(got[0], h) or same(got[0], group_title(h)[1])) else 0
        if row["common"]:
            cat = dominant(row)[0]
            code = (data.nc_mq.get(cat) or {}).get("common_code") if cat else None
            if code:
                common[1] += 1
                common[0] += 1 if code == row["common"] else 0
    table = {}
    for cond, (right, asked) in sorted(titles.items()):
        level, share = level_of(right, asked)
        table[cond] = {"right": right, "wrong": asked - right, "asked": asked, "share": round(share, 3), "level": level,
                       "used": share >= USE_FLOOR}
    level, share = level_of(*common)
    return table, {"right": common[0], "wrong": common[1] - common[0], "asked": common[1], "share": round(share, 3), "level": level}


def recommend_common(data, slug, code, title, band="C"):
    """(code, source, evidence) or None. The subject map is not read."""
    for part in ([title] + re.split(r"[/,]", title) if title else []):
        c4 = data.disc_by_name.get(norm(part))
        if c4:
            return c4, "title", "the title names the discipline %s" % data.code_title[c4]
    own = Counter()
    for s4, n in data.mid_own.get((slug, code, band), {}).items():
        f = data.fold.get(s4)
        if f:
            own[f] += n
    c4, n, total = top(own)
    if c4 and total >= 2 and n / total >= 0.6:
        return c4, "own_courses", "%d of %d of its courses with an M-ID sit under %s" % (n, total, c4)
    away = Counter()
    for s4, n in data.mid_all.get((code, band), {}).items():
        f = data.fold.get(s4)
        if f:
            away[f] += n - data.mid_own.get((slug, code, band), {}).get(s4, 0)
    away = Counter({k: v for k, v in away.items() if v > 0})
    c4, n, total = top(away)
    if c4 and total >= 3 and n / total >= 0.6:
        return c4, "same_code_statewide", "%d of %d courses under this code statewide sit under %s" % (n, total, c4)
    return None


def build(root=ROOT):
    data = Data(root)
    table = measure(data)
    nc_table, nc_common = measure_noncredit(data)
    dec = json.load(open(os.path.join(root, DECISIONS), encoding="utf-8"))
    # the common code, scored
    score = {"sams_30": defaultdict(lambda: [0, 0]), "subject_map_rows": defaultdict(lambda: [0, 0])}
    diverges, agrees, silent = [], 0, []
    for x in dec["decisions"]:
        rec = recommend_common(data, x["college"], x["local_code"], x.get("local_title"))
        if not rec:
            silent.append(x["local_code"])
            continue
        cell = score["sams_30"][rec[1]]
        cell[1] += 1
        if rec[0] == x["common_code"]:
            cell[0] += 1
            agrees += 1
        else:
            diverges.append({"local_code": x["local_code"], "local_title": x.get("local_title"),
                             "sam": x["common_code"], "recommended": rec[0], "from": rec[1], "why": rec[2]})
    for row in data.rows:
        if not row["common"] or not row["credit_courses"]:
            continue
        rec = recommend_common(data, row["slug"], row["code"], row["printed_name"])
        if rec:
            cell = score["subject_map_rows"][rec[1]]
            cell[1] += 1
            cell[0] += 1 if rec[0] == row["common"] else 0
    common_level = {}
    for src in ("title", "own_courses", "same_code_statewide"):
        r = [score[k][src][0] for k in score]
        a = [score[k][src][1] for k in score]
        share = sum(r) / sum(a) if sum(a) else 0
        common_level[src] = "High" if share >= HIGH else ("Medium" if share >= MEDIUM else "Low")
        if sum(a) < FLOOR_N:
            common_level[src] = "Low"
    colleges, totals = [], Counter()
    for slug in sorted(data.by_college):
        out_rows = []
        for code in sorted(data.by_college[slug]):
            row = data.by_college[slug][code]
            entry = {"code": code}
            if noncredit_only(row):
                cat, n, total = dominant(row)
                if not row["printed_name"]:
                    totals["no_title"] += 1
                    totals["noncredit_no_title"] += 1
                    got = noncredit_list(data, row)
                    if got and not (nc_table.get(got[1]) or {}).get("used"):
                        totals["noncredit_title_unused_condition"] += 1
                        got = None
                    if got:
                        lvl = (nc_table.get(got[1]) or {"level": "Low"})["level"]
                        entry["title"] = {"title": got[0], "level": lvl, "from": "noncredit_list",
                                          "why": "noncredit list: the title under %s (%s)." % (category_words(cat, n, total), got[1]),
                                          "also": []}
                        totals["title_" + lvl.lower()] += 1
                        totals["noncredit_title"] += 1
                    else:
                        totals["title_none"] += 1
                if not row["common"]:
                    totals["no_common"] += 1
                    totals["noncredit_no_common"] += 1
                    m = data.nc_mq.get(cat) or {} if cat else {}
                    if cat and m.get("common_code"):
                        entry["common"] = {"code": m["common_code"], "discipline": m.get("mq_discipline"), "level": nc_common["level"],
                                           "from": "noncredit_category", "category": cat,
                                           "why": "The noncredit MQ discipline of %s." % category_words(cat, n, total)}
                        totals["common_" + nc_common["level"].lower()] += 1
                        totals["noncredit_common"] += 1
                    elif cat:
                        entry["common"] = {"code": None, "discipline": m.get("mq_discipline"), "level": None,
                                           "from": "noncredit_category", "category": cat,
                                           "why": "The category has no common subject code yet: %s." % category_words(cat, n, total)}
                        totals["common_no_code_yet"] += 1
                    else:
                        totals["common_none"] += 1
                if len(entry) > 1:
                    out_rows.append(entry)
                continue
            title = row["printed_name"]
            if not title:
                rec = recommend_title(data, table, row)
                totals["no_title"] += 1
                if rec:
                    entry["title"] = rec
                    title = rec["title"]
                    totals["title_" + rec["level"].lower()] += 1
                else:
                    totals["title_none"] += 1
            if not row["common"] and row["credit_courses"]:
                totals["no_common"] += 1
                rc = recommend_common(data, slug, code, title)
                if rc:
                    lvl = common_level[rc[1]]
                    if not row["printed_name"] and rc[1] == "title":
                        lvl = LEVELS[min(LEVELS.index(lvl), LEVELS.index(entry["title"]["level"]))]
                    entry["common"] = {"code": rc[0], "discipline": data.code_title[rc[0]], "level": lvl,
                                       "from": rc[1], "why": rc[2][0].upper() + rc[2][1:] + "."}
                    totals["common_" + lvl.lower()] += 1
                else:
                    totals["common_none"] += 1
            if len(entry) > 1:
                out_rows.append(entry)
        if out_rows:
            colleges.append({"slug": slug, "rows": out_rows})

    def cells(d):
        return {k: {"right": v[0], "asked": v[1]} for k, v in sorted(d.items())}

    return {
        "_what": ("A recommended local title for every Subjects row with no catalog heading, and a recommended "
                  "common subject code for every credit row with none, each with the level its source measured "
                  "(Sam on #3655, 2026-11-21). A recommendation is for a person to accept or change; nothing "
                  "reads it as a title or a mapping. A row whose courses are all noncredit is lined up with the "
                  "standing noncredit subject title list by its dominant COCI noncredit category. "
                  "Built by kb/_build_local_subject_recommendations.py; no clock is read."),
        "_levels": ("High: the source's condition gave the catalog's own heading for 90% or more of the titled "
                    "codes it was asked, each left out of its own vote. Medium: 60% or more. Low: below, or asked "
                    "fewer than 20. Program titles are capped at Medium. A second source that agrees lifts a "
                    "level one step; one that differs is listed under also and the row reads Low."),
        "measured_on_titled_codes": table,
        "noncredit": {"title_from_the_list": nc_table, "common_code_from_the_category": nc_common,
                      "note": ("Measured on the noncredit-only codes that hold a catalog heading (titles) or a common "
                               "code from the subject map (codes), each left out of its own vote. A title condition "
                               "right less than half the time is a guess: it stays measured here, used false, and "
                               "gives no recommendation. The common code's answer key is the subject map, which reads "
                               "a code without its credit or noncredit band (f-subject-map-ignores-credit-band-s698), "
                               "so its share is a floor, and it reads Low.")},
        "common_code": {
            "levels": common_level,
            "sams_30": {"decisions": len(dec["decisions"]), "agree": agrees, "diverge": len(diverges),
                        "no_recommendation": sorted(silent), "by_source": cells(score["sams_30"]),
                        "divergences": diverges,
                        "note": "Where a recommendation diverges, Sam's decision stands."},
            "rows_the_subject_map_settles": cells(score["subject_map_rows"]),
        },
        "web_searches_filed": len(data.searches),
        "totals": dict(sorted(totals.items())),
        "colleges": colleges,
    }


def dump(doc):
    return json.dumps(doc, indent=1, ensure_ascii=False, sort_keys=False) + "\n"


def main(argv):
    text = dump(build())
    path = os.path.join(ROOT, OUT)
    if "--check" in argv:
        if not os.path.exists(path) or open(path, encoding="utf-8").read() != text:
            print("STALE: %s. Run python3 kb/_build_local_subject_recommendations.py" % OUT)
            return 1
        print("ok: %s is current" % OUT)
        return 0
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    d = json.loads(text)
    print("wrote %s: %s" % (OUT, d["totals"]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
