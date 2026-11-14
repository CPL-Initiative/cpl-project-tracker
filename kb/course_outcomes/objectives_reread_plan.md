# The objectives reread (S649)

Sam, 2026-11-13: *"add objectives to the collection list of data from cors. they should be collected when slos are
collected"*. The reader (`kb/_course_outcomes_read.py`) files SLOs and course objectives in the one pass on every read
path (`parse_page`), and each read's head names both (`collects`). Ten loaded colleges were read before it took
objectives (S584, 2026-11-05), so their reads carry none. A full read files no page text, so each is read again.
Runner minutes only, no model call. The plan, with each step's exact trigger lines:
[`objectives_reread_plan.json`](objectives_reread_plan.json).

**Order, one host at a time, most exhibit articulations first:**

Done: `rccd` (Norco, Moreno Valley, Riverside City; 533): read 43532407553, load 43546799435, 2,536 objective rows
(640, 754, 1,142), receipt `kb/receipts/course_outcomes_rccd_43546799435.json`. `sdccd` (City, Mesa, Miramar; 319):
read 43566273142, load 43585473767, 2,532 objective rows (698, 1,151, 683), receipt
`kb/receipts/course_outcomes_sdccd_43585473767.json`.

1. `sac`: Santa Ana (216). 4 parts.
2. `laspositas`: Las Positas (174). 3 parts.
3. `cccd`: Coastline (123). 2 parts.
4. `cccd`: Golden West (88), after Coastline is loaded (same host).

**The dispatch.** Both workflows start on a push, never `workflow_dispatch`. Branch `claude/slo-objectives-<host>` off
`main`; write `kb/course_outcomes/.run` with the step's `read` lines; push; open a draft PR. When every slice is filed
(`python3 kb/_course_outcomes_load.py --host <host> --slugs <slugs> --kind objective --dry` prints the step's parts
from the new run; `next_slo_colleges.py` says *done* for these colleges and cannot signal it), write
`kb/course_outcomes/.load` with the step's `load` lines (`host=`, `kind=objective`, `slugs=`) on the same branch and
push. In the PR that carries the receipt, move the step from `order` to `done`.

**The undo.** The load writes `kb/receipts/course_outcomes_<host>_<run>.json` with `kind: "objective"`, every inserted
id and the `delete ... where id in (...)` that removes exactly those rows. Only a receipt with an `error` (a batch whose
response was lost may have committed) also carries `rollback_by_key_if_error`, scoped by `kind` and the sent rows'
college and `read_run`; it also removes rows an earlier load of the same read inserted. A `kind=` load refuses a read
whose newest run is not filed whole, so it never posts objectives for some parts only. `course_outcomes_load()` is insert-only and
`kind` is part of its unique key, so an objective row never replaces an SLO row; with `kind=objective` the reread's
SLO rows are not posted at all (counted as `held_back`).

**Not reread.** Modesto Junior, Cabrillo, Columbia and Mission: their eLumen course pages print no objectives (0 of 12
trial pages each). Lake Tahoe and Contra Costa were read with the objectives reader (0 of 445; 11 of 520). Columbia's
and Contra Costa's templates hold Course Objectives inside an HTML comment that the page does not print; reading it
is a decision, not a reread. **Held:** De Anza and College of Marin (`queue.json`).
