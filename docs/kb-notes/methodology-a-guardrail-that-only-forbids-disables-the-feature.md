---
title: A guardrail that only forbids disables the feature — restrain salesmanship, not facts
created: 2026-08-07
updated: 2026-08-07
tags: [methodology, prompt-engineering, product, governance, sierra, cpl-assistant]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-the-feedback-queue-already-knew]]"
  - "[[docs/kb-notes/methodology-a-governance-artifact-must-measure-itself]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_student_portal.test.js
---

# A guardrail that only forbids disables the feature

> **One-sentence summary** — when a tool serves two parties whose interests diverge, the rule that protects party
> B will, if written only as a prohibition, quietly destroy the value for party A; write the *permission* beside
> the prohibition, and test the permission, because only the prohibition will be obvious when it breaks.

## The setting

An assistant embedded on individual colleges' own web pages, built by the system office. Two legitimate interests:

- **The college** hosting the widget wants to serve its own students, and would resent a tool on its site telling
  its students to go elsewhere.
- **The learner** wants to know all their options, including at other colleges.

The program lead named it exactly: *"colleges will want to keep current and prospective students in their
wheelhouse, whereas we want them to also be able to see their options systemwide… speaking out of both sides of
my mouth."*

## What went wrong, in one line of prompt

The first guardrail shipped as prohibitions:

> *"…never **volunteer** a comparison of the form 'you would get more credit at &lt;other college&gt;'…"*

Read literally by a compliant model, that instructs the assistant to **withhold**. A learner asks about a
credential their college has not articulated and gets a polite dead end — to protect the host's feelings. That is
**worse than the behaviour it prevents**: it fails the learner, *and* it fails the college, which never learns
there was demand for something it doesn't offer.

The evidence arrived within the hour. A live end-to-end run showed the assistant opening with the host college,
naming its coordinator, citing peers only as precedent — textbook compliance — and **never telling the learner
where the credential is actually available today.** The restraint worked. That was the problem.

## The distinction that resolves it

**Restrain salesmanship, not facts.**

- **Never withheld:** anything that materially changes the person's outcome. What exists, where, and how to get
  it.
- **Never volunteered:** editorial comparison. No unprompted "you'd do better at X", no ranking the host against
  its neighbours, no framing the host as deficient.

The honest version usually serves both parties, because **the gap is the product**: a college that learns through
the tool that its students keep asking for something unarticulated has been handed a concrete build item and a
named precedent. Framed as an adoption opportunity rather than a deficiency, the same sentence is a service to
the learner *and* market intelligence for the host.

Where they genuinely cannot be reconciled, **pick the party the system exists to serve** and state the tie-break
out loud in the rule, so the model is not left to infer it.

## The generalisable pattern

Any rule of the form *"never do X"* aimed at protecting a stakeholder should ship as a **pair**:

| | |
|---|---|
| **Prohibition** | never volunteer a comparison, never disparage the host |
| **Permission** | if they *ask* to compare, or have no college yet — compare freely; that is the point |
| **Tie-break** | when they conflict, the learner's outcome wins, stated plainly rather than sold |

And **test the permission harder than the prohibition**, because the failure modes are asymmetric:

- A violated prohibition is *loud* — a college complains, and you hear about it.
- A violated permission is *silent* — the person just doesn't get helped, leaves, and no one files anything.

```js
// Both halves asserted. The second is the one that would have rotted unnoticed.
check("forbids an unprompted you-would-get-more-elsewhere", /never volunteer a comparison/i.test(RULE));
check("still allows comparison when the visitor ASKS",     /If the visitor explicitly ASKS to compare/i.test(RULE));
check("still allows comparison when they have no college", /says they have not chosen one, compare freely/i.test(RULE));
```

> A rule that only forbade would have quietly disabled the feature's whole purpose — and nothing would have
> caught it.

## Two smaller lessons from the same episode

- **Yes/And beats both/and.** An early draft split two routes by *function* — "compare over there, act over
  here" — which was factually wrong: the user could do both things in both places. Saying *yes* to the incumbent
  and *adding* is a different instruction from presenting a balanced menu, and produces different prose.
- **A behavioural rule needs a phrasing pattern, not just a policy.** "Mention both" still reads as a choice
  between them. Giving the model the shape of the sentence — *"Yes — you can do that at &lt;host&gt;, and you can
  also…"* — is what makes the intent survive generation.

## When a test goes red because policy changed

The same episode produced a related trap. An end-to-end assertion encoded the *previous* product intent ("route
to a nearby teaching college") and went red once the anti-poaching rule deliberately de-prioritised that.

**Do not green it by editing the assertion.** A red test after a deliberate policy change is a question — *which
behaviour do we actually want?* — and that question belongs to the product owner. Rewriting the check to match
the new code is how a test stops encoding the goal and starts merely encoding the implementation.

## Resolution — both halves shipped 2026-08-07 (Session 126, #1029)

The pattern above was written while the tie-break was still drafted. The program lead was asked both questions
directly rather than having either resolved in code, and answered both. Recording the outcome, because a note
that leaves a decision open is read as *still open* long after it isn't:

**The tie-break, as shipped.** *Restraint binds salesmanship, not facts.* Never withhold a fact that materially
changes what the visitor can do; never editorialise. If the host college has not articulated the credential:
say so, say where it **is** available today, and say the host can adopt it. When the two interests genuinely
cannot be reconciled, the visitor's outcome wins — *stated plainly, never sold*.

**The red assertion.** Both candidate behaviours were defensible, and he chose **both, in order** — which is the
outcome the "ask, don't edit" rule exists to make reachable. A single answer now has three parts:

1. **the host** — named, affirmed, invited to adopt;
2. **precedent** — who has already articulated it, framed as *evidence for the host's adoption*, not a redirect;
3. **the nearest real route** — the nearest colleges that *teach* it, **even where none has articulated it yet**.

Part 3 is the one the prohibition had silently removed, and the only part that gives a seeker somewhere to go
this month. The rule now names stopping early *a failure of the answer, not politeness*.

⭐ **The generalisable half of the resolution:** the two rules had been written in different places and were in
direct conflict, with nothing saying which governed. Encoding the tie-break was necessary but not sufficient —
the *downstream* rule had to cross-reference it explicitly (*"naming a nearer teaching college is NOT poaching;
it is the factual completion of the answer"*). **A tie-break stated only where the conflict is defined does not
reach the place where the conflict is resolved.** Put it in both, and point one at the other.
