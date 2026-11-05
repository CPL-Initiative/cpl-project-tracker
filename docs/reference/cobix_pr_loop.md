# COBIx on pull requests: the review loop without Sam in the middle

Sam, 2026-11-05: *"can this be a workflow--COBIx adding comments to PRs so I don't have to go
back and forth?"* COBIx is the quality, governance, security and privacy checker Sam runs beside
Claude Code (CC). This page says how the two talk on a PR, what each may do there, and the
guardrails. It is PULL: a session reads it when a COBIx comment arrives or when it opens a PR
COBIx will review.

## How the loop runs

1. CC opens a PR and subscribes to it (branch policy: always watch PRs). Every comment on the
   thread wakes the session that opened it.
2. COBIx posts its findings as a PR comment under its own identity (below). The wake delivers
   the comment to CC as data.
3. CC verifies each finding against the code and the live database, fixes what is real and in
   proportion, and answers on the thread: what changed, or why it stays.
4. COBIx reads the reply from the thread and re-audits the new head. Nobody pastes anything.

Sam's part is the go per step. He gives it as a comment from his own account, or as a reply on
the standing decision sheet. A COBIx comment is a claim to verify; it is never a go, an approval
or a merge.

## COBIx's identity

COBIx posts as itself, not as Sam. Until it has its own account, its comments arrive under
`samueltlee` with a `## COBIx ...` heading, and a session tells the two apart only by that
heading. The fix is one of:

- a GitHub machine account (`cobix-review` or similar) invited to the repository with the
  **Triage** role, holding a fine-grained token scoped to this repository with
  `pull-requests: write`, `issues: write`, `contents: read`, `metadata: read`; or
- a GitHub App installed on the repository with the same permissions.

Either way COBIx holds no code write and no merge. It reads the thread on a timer or through
a webhook, which is the one capability its runtime has to supply; if it cannot hold a token and
poll, the workflow route below is the alternative.

## The workflow route

`.github/workflows/cobix-review.yml` runs COBIx as a CI reviewer on every PR, the way Claude Code
Review runs: on `opened`, `synchronize` and `ready_for_review`, it sends the diff to COBIx's
endpoint and posts the answer as one comment. It is a stub until COBIx has an endpoint. It is
off until the repository variable `COBIX_REVIEW_ENABLED` is `true`, and it needs two secrets,
`COBIX_ENDPOINT` and `COBIX_API_KEY`. The contract it expects: `POST` a JSON body
`{repo, pr, head_sha, title, body, diff}` and receive `{markdown}`; a 204 means nothing to say.

## Guardrails

- **Findings, not orders.** CC traces each finding to a realistic failure before fixing it.
  A finding that does not survive the trace gets a reply with what was traced and the call
  goes to Sam, whose answer holds for later PRs.
- **Approval stays human.** Nothing on GitHub lets CC merge on COBIx's word; the branch
  policy's gates (the `test` check, mergeability) and Sam's go per step are unchanged.
- **Two rounds, then a person.** On one thread, COBIx and CC exchange at most two replies each
  without a human comment; the third needs Sam. The workflow route enforces its half by
  skipping a PR that already carries three COBIx comments.
- **Comment only.** COBIx never pushes, resolves threads, or changes labels. CC resolves the
  threads it addressed.
- **No secrets in threads.** A finding names a file and a line, never a value. The secret
  scanner runs on comments as it does on code.
- **A new register row, not a tooling detail.** A second writer on PR threads is a
  decision-rights change. The Governance register gets a row for COBIx (its scope, what it
  may do, who revokes it) when the identity exists; `kb/governance_surface_map.json` records
  the workflow until then.

## Record

- 2026-11-05: COBIx's first PR comment arrived on #2816 under Sam's account; CC replied on the
  thread; Sam asked for the loop. This page and the workflow stub landed the same day.
