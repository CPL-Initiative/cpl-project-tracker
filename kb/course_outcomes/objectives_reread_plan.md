# The objectives reread (S649)

Sam, 2026-11-13: *"add objectives to the collection list of data from cors. they should be collected when slos are
collected"*. The reader (`kb/_course_outcomes_read.py`) files SLOs and course objectives in the one pass on every read
path (`parse_page`), and each read's head names both (`collects`). Ten loaded colleges were read before it took
objectives (S584, 2026-11-05), so their reads carry none. A full read files no page text, so each is read again.
Runner minutes only, no model call. The plan, with each step's exact trigger lines:
[`objectives_reread_plan.json`](objectives_reread_plan.json).

**Order, one host at a time, most exhibit articulations first:**

1. `rccd`: Norco, Moreno Valley, Riverside City (533). 4 parts.
2. `sdccd`: Miramar, City, Mesa (319). 4 parts.
3. `sac`: Santa Ana (216). 4 parts.
4. `laspositas`: Las Positas (174). 3 parts.
5. `cccd`: Coastline (123). 2 parts.
6. `cccd`: Golden West (88), after Coastline is loaded (same host).

**The dispatch.** Both workflows start on a push, never `workflow_dispatch`. Branch `claude/slo-objectives-<host>` off
`main`; write `kb/course_outcomes/.run` with the step's `read` lines; push; open a draft PR. When every slice is filed
(`python3 kb/_course_outcomes_load.py --host <host> --slugs <slugs> --kind objective --dry` prints the step's parts
from the new run; `next_slo_colleges.py` says *done* for these colleges and cannot signal it), write
`kb/course_outcomes/.load` with the step's `load` lines (`host=`, `kind=objective`, `slugs=`) on the same branch and
push. In the PR that carries the receipt, move the step from `order` to `done`.

**The undo.** The load writes `kb/receipts/course_outcomes_<host>_<run>.json` with `kind: "objective"`, every inserted
id and the `delete ... where id in (...)` that removes exactly those rows. A receipt with an `error` (a batch whose
response was lost may have committed) also carries `rollback_by_key`, scoped by `kind` and the sent rows' college and
`read_run`. `course_outcomes_load()` is insert-only and
`kind` is part of its unique key, so an objective row never replaces an SLO row; with `kind=objective` the reread's
SLO rows are not posted at all (counted as `held_back`).

**Not reread.** Modesto Junior, Cabrillo, Columbia and Mission: their eLumen course pages print no objectives (0 of 12
trial pages each). Lake Tahoe and Contra Costa were read with the objectives reader (0 of 445; 11 of 520). Columbia's
and Contra Costa's templates hold Course Objectives inside an HTML comment that the page does not print; reading it
is a decision, not a reread. **Held:** De Anza and College of Marin (`queue.json`).
