#!/usr/bin/env python3
"""Verify the 55050 tracked-changes .docx against the BOG-adopted baseline.

The one thing that must be true of a redline handed to the Chancellor's Office:
REJECT ALL CHANGES must reproduce the regulation exactly as adopted. If the
baseline is off by a word, every tracked change in the document is drawn against
a section that does not exist.

Checks
  1. reject-all view of 55050 == docs/reference/statute/t5_55050_clean_after_2026-08-12.txt
  2. accept-all view contains each amendment's operative language
  3. OOXML hygiene: every ins/del carries id+author+date; deletions use w:delText
"""
import re, sys, zipfile, pathlib, unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[1]
DOCX = ROOT / "exports/20260826_T5_55050_Article9_Conformity_TrackedChanges.docx"
CLEAN = ROOT / "docs/reference/statute/t5_55050_clean_after_2026-08-12.txt"

fails, checks = [], 0


def check(ok, label, detail=""):
    global checks
    checks += 1
    if not ok:
        fails.append(f"FAIL  {label}" + (f"\n      {detail}" if detail else ""))
    return ok


def norm(s):
    """Fold typography so a curly quote is not a diff."""
    s = unicodedata.normalize("NFKC", s)
    for a, b in [("\u201c", '"'), ("\u201d", '"'), ("\u2018", "'"), ("\u2019", "'"),
                 ("\u2013", "-"), ("\u2014", "-"), ("\u00a0", " ")]:
        s = s.replace(a, b)
    return re.sub(r"\s+", " ", s).strip()


def views(xml):
    """Return (original, final) plain text: reject-all and accept-all."""
    out = {"orig": [], "final": []}
    # paragraph by paragraph so paragraph breaks survive
    for pm in re.finditer(r"<w:p[ >].*?</w:p>", xml, re.S):
        p = pm.group(0)
        orig, final = [], []
        pos = 0
        for m in re.finditer(r"<w:(ins|del) [^>]*>(.*?)</w:\1>", p, re.S):
            plain = p[pos:m.start()]
            for t in re.findall(r"<w:t(?: [^>]*)?>(.*?)</w:t>", plain, re.S):
                orig.append(t); final.append(t)
            inner = m.group(2)
            if m.group(1) == "ins":
                final += re.findall(r"<w:t(?: [^>]*)?>(.*?)</w:t>", inner, re.S)
            else:
                orig += re.findall(r"<w:delText(?: [^>]*)?>(.*?)</w:delText>", inner, re.S)
            pos = m.end()
        for t in re.findall(r"<w:t(?: [^>]*)?>(.*?)</w:t>", p[pos:], re.S):
            orig.append(t); final.append(t)
        out["orig"].append("".join(orig))
        out["final"].append("".join(final))
    unesc = lambda ps: [x.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
                        .replace("&quot;", '"').replace("&#39;", "'") for x in ps]
    return unesc(out["orig"]), unesc(out["final"])


def subdivisions(paras):
    """Map '(a)' -> its text, for the 55050 body only."""
    d = {}
    for p in paras:
        m = re.match(r"\s*\(([a-z])\)\s+(.*)", p)
        if m and m.group(1) not in d:
            d[m.group(1)] = norm(m.group(0))
    return d


def main():
    if not DOCX.exists():
        sys.exit(f"missing {DOCX} -- run kb/_build_55050_redline_docx.py first")
    with zipfile.ZipFile(DOCX) as z:
        check(z.testzip() is None, "zip integrity")
        xml = z.read("word/document.xml").decode("utf-8")
        for part in ("[Content_Types].xml", "_rels/.rels", "word/document.xml"):
            check(part in z.namelist(), f"part present: {part}")

    orig, final = views(xml)

    # ---- 1. reject-all == the adopted text -------------------------------
    baseline = CLEAN.read_text(encoding="utf-8").split("-" * 76, 1)[1]
    want = subdivisions([p for p in baseline.split("\n\n")
                         if re.match(r"\(\w\)", p.strip())][:13])
    got = subdivisions(orig)
    for letter in "abcdefghijklm":
        w, g = want.get(letter), got.get(letter)
        if not check(w is not None, f"baseline has ({letter})"):
            continue
        if not check(g is not None, f"redline reject-all has ({letter})"):
            continue
        if not check(w == g, f"({letter}) reject-all matches the adopted text",
                     f"adopted: {w[:150]}\n      redline: {g[:150]}"):
            pass
    check(len(got) == 13, f"reject-all yields exactly (a)-(m), got {len(got)}",
          f"letters: {''.join(sorted(got))}")
    check("n" not in got, "(n) does not exist before the amendment")

    # deleted-in-2026 language must NOT be in the baseline we drew against
    joined_orig = norm(" ".join(orig))
    for gone, why in [
        ("California State University General Education Breadth", "old (d), struck by the BOG"),
        ("shall not be counted in determining the 12 semester hours", "old (h), struck"),
        ("if the student is a veteran or an active-duty member", "old (j), struck"),
        ("By December 31, 2020", "old (n), struck"),
        ("College Board Advanced Placement", "old (m), struck"),
    ]:
        check(norm(gone) not in joined_orig, f"struck language absent: {why}")

    # ---- 2. accept-all carries every amendment ---------------------------
    joined_final = norm(" ".join(final))
    for phrase, label in [
        ("public internet website", "(b) publication on the website"),
        ("Provide a means for the public to explore", "(b)(1) public exploration"),
        ("submit requests for timely review", "(b)(2) student request"),
        ("identify and notify students who may qualify", "(b)(3) identify + notify"),
        ("systemwide credit for prior learning infrastructure", "(b)(4) infrastructure"),
        ("at a minimum consider the credit recommendations", "(c) shall at a minimum consider"),
        ("faculty discipline review groups", "(c) FDRG recommendations"),
        ("local discipline faculty experts", "(c) local faculty experts"),
        ("all incoming students be evaluated", "(e) evaluate all incoming students"),
        ("Joint Services Transcripts for veterans", "(e) document list"),
        ("transcribed by another California Community College shall be accepted",
         "(n) reciprocity"),
        ("shall not require a student to repeat an assessment", "(n) no secondary review"),
        ("78093.2", "NOTE authority"),
        ("78093, 78093.1, 78093.2", "NOTE reference"),
    ]:
        check(norm(phrase) in joined_final, f"accept-all carries {label}")

    # the NOTE must still read as a sentence once accepted
    note = next((norm(p) for p in final if p.strip().startswith("NOTE:")), "")
    check("66700, 70901, and 78093.2" in note,
          "NOTE Authority reads correctly when accepted", f"got: {note[:160]}")
    check("70901, 70902, 78093, 78093.1, 78093.2, and 88782" in note,
          "NOTE Reference reads correctly when accepted", f"got: {note[-160:]}")

    # ---- 3. OOXML hygiene ------------------------------------------------
    ins = re.findall(r"<w:ins ([^>]*)>", xml)
    dels = re.findall(r"<w:del ([^>]*)>", xml)
    check(len(ins) > 0 and len(dels) > 0, "document carries both insertions and deletions")
    for tag, attrs in [("ins", ins), ("del", dels)]:
        check(all(all(k in a for k in ("w:id=", "w:author=", "w:date=")) for a in attrs),
              f"every w:{tag} carries id, author and date")
    del_blocks = re.findall(r"<w:del [^>]*>(.*?)</w:del>", xml, re.S)
    check(all("<w:delText" in b for b in del_blocks),
          "every deletion uses w:delText (Word silently drops a w:del holding w:t)")
    check(not re.search(r"<w:del [^>]*>(?:(?!</w:del>).)*<w:t[ >]", xml, re.S),
          "no deletion smuggles a w:t run")

    print(f"55050 redline verification — {checks} checks, {len(fails)} failed")
    print(f"  tracked changes: {len(ins)} insertions, {len(dels)} deletions")
    print(f"  baseline: {CLEAN.relative_to(ROOT)}")
    if fails:
        print()
        print("\n".join(fails))
        sys.exit(1)
    print("  OK — rejecting every change reproduces the regulation as adopted 2026-08-12")


if __name__ == "__main__":
    main()
