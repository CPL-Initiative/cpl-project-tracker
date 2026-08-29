#!/usr/bin/env python3
"""Did the CLAUDE.md consolidation lose anything?

The 2026-08-28 consolidation moved ~93 KB out of an always-loaded file into
`docs/reference/**`. Every individual move was verified at the time, but "each
step was checked" is not the same claim as "nothing is missing" — and the whole
point of the exercise was that a relocation can drop something silently.

METHOD. Take the pre-consolidation `CLAUDE.md` from git, reduce it to word
SHINGLES (overlapping n-grams of prose), and check each against the union of
where the content now lives. Shingles rather than lines or sentences because
reflowing text changes every line and no sentence boundary survives a table
cell; a shingle survives reflow, so a missing run of them means content, not
formatting. Contiguous misses are reported as spans — one rewritten paragraph
should read as one span, not forty findings.

READ-ONLY. Run: python3 kb/_consolidation_loss_audit.py [--baseline <git-rev>]
"""
import argparse, os, re, subprocess, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_BASELINE = "cffe0e6^:CLAUDE.md"   # the commit that began the consolidation
SHINGLE = 8            # words; long enough to be distinctive, short enough to survive an edit
MIN_SPAN = 2           # a lone missing shingle is usually one reworded phrase


def norm(text):
    """Prose, flattened. Markdown structure is not content: a bullet that became
    a table row still says the same thing, so punctuation and case go, and only
    the word sequence is compared."""
    text = re.sub(r"```.*?```", " ", text, flags=re.S)      # fenced code
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)     # comments
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def shingles(words, n=SHINGLE):
    return [" ".join(words[i:i + n]) for i in range(max(0, len(words) - n + 1))]


def corpus_now(root):
    """Everywhere the consolidation could have put something."""
    paths = [os.path.join(root, "CLAUDE.md"),
             os.path.join(root, "docs", "roadmap_archive.md"),
             os.path.join(root, ".claude", "commands", "checkpoint.md")]
    paths += sorted(glob.glob(os.path.join(root, "docs", "reference", "**", "*.md"),
                              recursive=True))
    paths += sorted(glob.glob(os.path.join(root, "docs", "kb-notes", "*.md")))
    out, used = [], []
    for p in paths:
        if os.path.isfile(p):
            try:
                out.append(open(p, encoding="utf-8").read())
                used.append(os.path.relpath(p, root))
            except Exception:
                pass
    return " \n ".join(out), used


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--baseline", default=DEFAULT_BASELINE)
    ap.add_argument("--context", type=int, default=26, help="words shown per span")
    args = ap.parse_args()

    old = subprocess.run(["git", "show", args.baseline], cwd=ROOT,
                         capture_output=True, text=True, check=True).stdout
    new_text, used = corpus_now(ROOT)

    old_words = norm(old).split()
    have = set(shingles(norm(new_text).split()))
    old_sh = shingles(old_words)

    missing_idx = [i for i, s in enumerate(old_sh) if s not in have]

    spans, run = [], []
    for i in missing_idx:
        if run and i == run[-1] + 1:
            run.append(i)
        else:
            if len(run) >= MIN_SPAN:
                spans.append((run[0], run[-1]))
            run = [i]
    if len(run) >= MIN_SPAN:
        spans.append((run[0], run[-1]))

    # A span SHORTER than the shingle width is a SEAM, not a loss: when two
    # adjacent blocks move to different files, the shingles straddling the join
    # can no longer match anywhere, and there are exactly SHINGLE-1 of them.
    # Measured on the real consolidation: 65 of 87 spans were 6-7 wide. Calling
    # those findings would bury the ~19 that are worth reading.
    seams = [s for s in spans if s[1] - s[0] + 1 < SHINGLE]
    spans = [s for s in spans if s[1] - s[0] + 1 >= SHINGLE]

    covered = len(old_sh) - len(missing_idx)
    print(f"baseline            {args.baseline}")
    print(f"corpus now          {len(used)} file(s)")
    print(f"shingles in baseline {len(old_sh):,}")
    print(f"still present        {covered:,}  ({100*covered/max(1,len(old_sh)):.2f}%)")
    print(f"seams (join artifacts) {len(seams)}   <- expected, not losses")
    print(f"candidate losses     {len(spans)}")

    # ── ORDER ────────────────────────────────────────────────────────────────
    # Presence is not the whole question. The file is read top to bottom, so
    # WHERE a rule sits changes how likely it is to be acted on, and the
    # numbered Critical Rules are referred to by number from other files.
    def headings(text):
        return [re.sub(r"\s+", " ", m.group(1)).strip()
                for m in re.finditer(r"^#{2,3} (.+)$", text, re.M)]

    def rule_numbers(text):
        try:
            sec = text[text.index("## Critical Rules"):]
        except ValueError:
            return []
        sec = sec.split("\n## ", 1)[0]
        return [int(m.group(1)) for m in re.finditer(r"^(\d+)\. \*\*", sec, re.M)]

    cur = open(os.path.join(ROOT, "CLAUDE.md"), encoding="utf-8").read()
    o_rules, n_rules = rule_numbers(old), rule_numbers(cur)
    print(f"\ncritical rules       {o_rules} -> {n_rules}"
          f"   {'UNCHANGED' if o_rules == n_rules else 'REORDERED/CHANGED'}")

    o_h = [h.split(" (")[0].split(" —")[0].strip() for h in headings(old)]
    n_h = [h.split(" (")[0].split(" —")[0].strip() for h in headings(cur)]
    o_keep = [h for h in o_h if h in n_h]
    n_keep = [h for h in n_h if h in o_h]
    if o_keep == n_keep:
        print(f"section order        {len(o_keep)} shared heading(s), SAME relative order")
    else:
        print(f"section order        CHANGED")
        for i, (a, b) in enumerate(zip(o_keep, n_keep)):
            if a != b:
                print(f"    position {i}: was \"{a}\"  now \"{b}\"")
                break
    added = [h for h in n_h if h not in o_h]
    gone = [h for h in o_h if h not in n_h]
    if added:
        print(f"sections added       {added}")
    if gone:
        print(f"sections gone        {gone}")
    if not spans:
        print("\nNothing from the pre-consolidation file is unaccounted for.")
        return 0
    print()
    for a, b in sorted(spans, key=lambda s: s[0] - s[1]):
        words = old_words[a:b + SHINGLE]
        text = " ".join(words[:args.context])
        more = "…" if len(words) > args.context else ""
        print(f"  [{b - a + 1:>3} shingles] {text}{more}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
