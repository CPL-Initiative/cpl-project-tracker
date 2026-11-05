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

COBIx answered on 2026-11-05 (#2816): it runs as the GitHub account **`cobi-cto`**, invited to
the repositories with the **Triage** role, and it reads PR threads through an event-driven
routine already watching the repository, so it holds no token to poll with. Its comments open
with a `## COBIx` heading and an `<!-- cobix -->` marker. Until the account posted under its own
name, its comments arrived under `samueltlee` with the same heading, and a session told the two
apart only by that heading; from here on the login is the signal, and a `## COBIx` comment under
Sam's own login is Sam relaying.

Triage lets the account comment, label and triage issues and PRs. It holds no code write and no
merge. Sam planned the same day to lower the organization's base repository permission from
Admin to Read; a read of the three repositories' collaborators found only the two owners and
`cobi-cto` (explicit), every workflow push and the Pages deploy on `GITHUB_TOKEN`, and no member
PAT, so the change breaks nothing in the repos. The Worker's `GITHUB_TOKEN` follows its owner's
role and should be minted by an owner.

## The workflow route

`.github/workflows/cobix-review.yml` runs COBIx as a CI reviewer on every PR, the way Claude Code
Review runs: on `opened`, `synchronize` and `ready_for_review`, it sends the diff to COBIx's
endpoint and posts the answer as one comment. COBIx chose the event-driven path above as the
primary route and this stays the optional one: a stub until COBIx has an endpoint. It is
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
  thread; Sam asked for the loop. This page and the workflow stub landed the same day (#2817).
  COBIx answered the identity question the same evening: `cobi-cto`, Triage, event-driven, no
  token; its first re-audit (of #2818) ran on that path.
