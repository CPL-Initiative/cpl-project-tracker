#!/usr/bin/env python3
"""Normalize kb-note frontmatter to the canonical Obsidian dialect.

`kb/_docs_audit.py` reports `kb_note_dialect` for notes that are well-formed but
written in a non-canonical dialect. Two drifts exist in this corpus:

  * `date:`      → canonical `created:`
  * `type:` / `kb-type: <t>` → canonical: `<t>` as a tag inside `tags:`

Both matter to Obsidian specifically. Obsidian's **Properties** panel keys on the
property NAME, so `date` and `created` render as two separate typed properties
and a Base/Dataview query has to ask for both. Same for a type carried outside
`tags:` — it is invisible to a tag query and to the tag pane.

⚠ CONSTANTS ARE IMPORTED FROM THE LINTER, NEVER RE-DECLARED. A normalization and
the rule that judges it must read the same definition of "canonical"; re-typing
the type-tag set here is how the two silently disagree (the CCRR lane learned
this when `screen_profile()` ran on raw text while the key ran on folded text).

Conservative by construction — it only ever acts where the linter reports drift:
  * `date:` is renamed only when `created:` is absent.
  * a type key is folded only when its value is a canonical type tag AND `tags:`
    carries no type tag already. A `type:` holding something else, or
    disagreeing with an existing type tag, is REPORTED and left alone — that is
    a judgment call, not a mechanical one.

`updated:` is deliberately NOT bumped. This changes how a property is spelled,
not what the note says, and a touched `updated:` would tell every future reader
the note's content had been revised.

Usage:  python3 kb/_normalize_kb_note_frontmatter.py [--apply]
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _docs_audit import KB_TYPE_TAGS, KB_TYPE_KEYS, kb_type_of, parse_frontmatter  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOTES = os.path.join(ROOT, "docs", "kb-notes")
FM_RE = re.compile(r"\A---\n(.*?)\n---\n", re.S)


def note_paths():
    for fn in sorted(os.listdir(NOTES)):
        if not fn.endswith(".md") or fn.startswith("_") or fn == "README.md":
            continue
        yield fn, os.path.join(NOTES, fn)


def _clean_scalar(v):
    return str(v).strip().strip('"\'') if v is not None else None


def _tag_list(fm):
    tags = fm.get("tags") or []
    tags = tags if isinstance(tags, list) else [tags]
    return [_clean_scalar(t) for t in tags]


def _filename_type(stem):
    """The type this corpus's own naming convention claims for a note."""
    for t in KB_TYPE_TAGS:
        if stem.startswith(t + "-") or stem.endswith("-" + t):
            return t
    return None


def plan_one(text, stem):
    """Return (new_text, [changes], [skips]) for one note."""
    m = FM_RE.match(text)
    if not m:
        return text, [], ["no frontmatter block"]
    block = m.group(1)
    lines = block.split("\n")
    fm, _order = parse_frontmatter(lines)
    changes, skips = [], []

    # ── drift A: `date:` → `created:` ──────────────────────────────────────
    if "created" not in fm and "date" in fm:
        for i, ln in enumerate(lines):
            if re.match(r"^date:", ln):
                lines[i] = re.sub(r"^date:", "created:", ln)
                changes.append("`date:` → `created:`")
                break

    # ── drift B: type key → a type tag inside `tags:` ──────────────────────
    resolved, dialect = kb_type_of(fm)
    if dialect and dialect != "tags:":
        key = dialect.rstrip(":")
        if resolved not in KB_TYPE_TAGS:
            skips.append(f"`{key}: {resolved}` is not a canonical type tag")
        else:
            ti = next((i for i, ln in enumerate(lines)
                       if re.match(r"^tags:\s*\[", ln)), None)
            if ti is None:
                skips.append("`tags:` is not an inline list — not folding by hand")
            else:
                # Prepend so the type reads first, matching notes already canonical.
                lines[ti] = re.sub(r"^tags:\s*\[\s*", f"tags: [{resolved}, ",
                                   lines[ti], count=1)
                lines = [ln for i, ln in enumerate(lines)
                         if not re.match(rf"^{re.escape(key)}:", ln)]
                changes.append(f"`{key}: {resolved}` → tag `{resolved}`")

    # ── drift C: a REDUNDANT type key, which the linter cannot see ─────────
    # `kb_type_of` resolves via `tags:` first, so a `type:`/`kb-type:` sitting
    # beside a type tag is never reported — yet it still renders as a property
    # on this note and on no other, which is the Obsidian inconsistency this
    # pass exists to remove. 35 of them agree with their tag; 6 DISAGREE, and
    # the disagreement is invisible because the tag silently wins.
    #
    # The filename is an independent third signal (this corpus names notes
    # `<type>-…` or `…-<type>`), so a conflict is settled the way Rule 7
    # settles a discipline: two signals must agree, and where the filename
    # corroborates neither the note is left alone and reported.
    for k in KB_TYPE_KEYS:
        if k not in fm or not any(re.match(rf"^{re.escape(k)}:", ln) for ln in lines):
            continue
        kv = _clean_scalar(fm[k])
        tagtypes = [t for t in _tag_list(fm) if t in KB_TYPE_TAGS]
        if not tagtypes or kv not in KB_TYPE_TAGS:
            continue                      # handled above, or not canonical
        if kv in tagtypes:                # redundant and agreeing — just drop it
            lines = [ln for ln in lines if not re.match(rf"^{re.escape(k)}:", ln)]
            changes.append(f"dropped redundant `{k}: {kv}` (already tagged)")
            continue
        claimed = _filename_type(stem)
        if claimed == kv:                 # filename backs the KEY — promote it
            ti = next((i for i, ln in enumerate(lines)
                       if re.match(r"^tags:\s*\[", ln)), None)
            if ti is None:
                skips.append(f"`{k}: {kv}` conflicts with tag `{tagtypes[0]}`, "
                             "and `tags:` is not inline")
                continue
            lines[ti] = re.sub(r"^tags:\s*\[\s*", f"tags: [{kv}, ", lines[ti], count=1)
            lines = [ln for ln in lines if not re.match(rf"^{re.escape(k)}:", ln)]
            changes.append(f"`{k}: {kv}` conflicted with tag `{tagtypes[0]}`; "
                           f"filename agrees with `{kv}` → promoted to first tag")
        elif claimed in tagtypes:         # filename backs the TAG — key is stale
            lines = [ln for ln in lines if not re.match(rf"^{re.escape(k)}:", ln)]
            changes.append(f"dropped stale `{k}: {kv}` (filename and tag both "
                           f"say `{claimed}`)")
        else:
            skips.append(f"`{k}: {kv}` conflicts with tag `{tagtypes[0]}` and the "
                         "filename corroborates neither — needs a human")

    if not changes:
        return text, [], skips
    return text[:m.start(1)] + "\n".join(lines) + text[m.end(1):], changes, skips


def main():
    apply = "--apply" in sys.argv
    touched = skipped = 0
    for fn, path in note_paths():
        text = open(path, encoding="utf-8").read()
        new, changes, skips = plan_one(text, fn[:-3])
        for s in skips:
            print(f"  SKIP  {fn}: {s}")
            skipped += 1
        if not changes:
            continue
        touched += 1
        print(f"  {'FIX ' if apply else 'PLAN'}  {fn}: {'; '.join(changes)}")
        if apply and new != text:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new)
    print(f"\n{'applied' if apply else 'planned'}: {touched} note(s); skipped: {skipped}")
    if not apply and touched:
        print("re-run with --apply to write")


if __name__ == "__main__":
    main()
