---
title: "A trigger file must differ from main's before its workflow runs"
type: methodology
kb-status: published
created: 2026-10-13
updated: 2026-10-13
tags: [ci, github-actions, workflows, program-requirements-harvest]
related: [program_requirements_harvest_lessons]
---

# A trigger file must differ from main's before its workflow runs

Several workflows here start when a push changes one small file: a `.run` or `.load` holding the job's
inputs. The pattern lets a session start a runner job by committing a line instead of dispatching it.

Its weakness is the merge. Once a branch's trigger file reaches main, every branch that later merges main
receives the same change, and its next push starts the job again on that branch. A check that skips a push
whose head commit is the merge covers only half of it: the push after the merge carries the same change in
its range. On 2026-10-13 (S376) a display push on a branch that had merged main re-ran an outline index that
had already landed. Once the course outcomes read lands, the same path would re-run hours of page loads on a
college host, or repeat a table load.

The guard is a first job that compares the pushed file with main's and runs the work only when they differ:

```yaml
  gate:
    steps:
      - uses: actions/checkout@v7
      - id: diff
        run: |
          git fetch -q --depth=1 origin main
          if git diff --quiet FETCH_HEAD -- kb/<area>/.run; then echo "go=0" >> "$GITHUB_OUTPUT"
          else echo "go=1" >> "$GITHUB_OUTPUT"; fi
  work:
    needs: gate
    if: needs.gate.outputs.go == '1'
```

To run the same inputs again, change a field in the file (a `run=` counter). `tests/course_outline_index_test.py`
checks every workflow a `kb/` dot-file starts. Four workflows outside `kb/` use the pattern without the gate
(`cpl-landing-pages`, `cpl-news`, `first-light-art`, `first-light-gallery-thumbs`).
