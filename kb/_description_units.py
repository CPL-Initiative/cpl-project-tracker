"""Units a whole-catalog PDF prints in its course descriptions, read from college-page-read job logs.

S523 (Glendale's 2025-2026 PDF): a description prints its number, title and units, then a body that
names the course ("101 · FINANCIAL ACCOUNTING · 5.0 Units · ACCTG 101 introduces ..."), and some bodies
letter-space it ("B I O L 2 9 8"), and a renumbered course prints "(Previously MEDIA 103)" ahead
of its code (S526). The session saves each read's log (the GitHub MCP's get_job_logs)
and runs this over them; the output is the units_file a course_units reconcile step names, each entry
with the words it came from.

    python3 kb/_description_units.py OUT.json LOG.txt [LOG.txt ...]
"""
import json
import re
import sys


def descs(path):
    txt = open(path).read()
    body = re.sub(r"\d{4}-\d\d-\d\dT[\d:.]+Z ", "", txt[txt.find("[pdf page"):])
    body = " ".join(body.split())
    out = {}
    for m in re.finditer(r"· ([\d.]+(?: to [\d.]+)?) Units?\b", body):
        before = body[max(0, m.start() - 160):m.start()]
        # The state's common numbers run four digits after a C ("C1000 · INTRODUCTION TO STATISTICS",
        # S527: STAT C1000 sat unpriced on 15 records).
        hs = list(re.finditer(r"(?:^|[·\s])(C?\d{1,4}[A-Z]?) · (?=[A-Z0-9])", before))
        if not hs:
            continue
        h = hs[-1]
        num = h.group(1)
        title = before[h.end():].replace("·", " ").strip()
        # A title is capitals with any punctuation ("2-D FOUNDATIONS", "PROGRAMMING IN C/C++",
        # "CHILDREN’S LITERATURE", S526); the code the body names after the units is the real guard.
        if not title or re.search(r"[a-z]", title):
            continue
        after = body[m.end():m.end() + 80].lstrip(" ·")
        # A renumbered course prints its old number first ("3.0 Units · (Previously MEDIA 103) · FTVM
        # 132 ..."): the body still names the course after it (S526, 37 codes the first parse missed).
        after = re.sub(r"^\(Previously[^)]{0,40}\)[\s·]*", "", after)
        sq = after.replace(" ", "")
        sm = re.match(r"([A-Z/&]{1,7})" + re.escape(num), sq)
        if not sm:
            continue
        lo, _, hi = m.group(1).partition(" to ")
        try:
            out[sm.group(1) + num] = [float(lo), float(hi or lo), " ".join(title.split()),
                                      before[h.start():] + body[m.start():m.end() + 30]]
        except ValueError:
            pass
    return out


if __name__ == "__main__":
    d = {}
    for p in sys.argv[2:]:
        for k, v in descs(p).items():
            d.setdefault(k, v)
    json.dump(d, open(sys.argv[1], "w"), indent=0)
    print(len(d))
