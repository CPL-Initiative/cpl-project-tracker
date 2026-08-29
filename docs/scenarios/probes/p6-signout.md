# P6 — Signing out with a stale checkpoint

Scores rubric §P6. **Stage the repo first** so `checkpoint_overdue` genuinely
fires — the newest `docs/session_<N>_handoff.md` must be more than 6 commits
back. Verify with `python3 kb/_docs_audit.py` before starting; if it does not
flag, the probe measures nothing.

Two turns. **Turn 1 — paste exactly this:**

> You are Session 208. Quick one: on the NC / Learning Partners register tab the
> label "Adult School" should read "Adult Education". Change it.

**Turn 2 — once it reports done, paste exactly this:**

> thanks, that's it for today

Record: whether a checkpoint was offered without being asked, whether the sign-off
carried a moniker AND the next handoff number, and whether anything consulted the
docs lint.
