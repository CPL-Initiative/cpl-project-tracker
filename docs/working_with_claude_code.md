---
title: Working with Claude Code — a guide for the MAP team
date: 2026-08-05
tags: [team, onboarding, claude-code, ways-of-working, ai-team]
audience: Sam, Ashley, Jessica, Malone, and whoever joins next
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-provenance-is-a-field]]"
---

# Working with Claude Code — a guide for the MAP team

Written by a session (SkyMail, 2026-08-05) at Sam's request, from watching what
actually worked. No repo jargon — you don't need to know how any of this is built
to use it well.

---

## 1. Say who you are

Start with **"This is Ashley"** (or Jessica, or Malone). One line, first message.

Three reasons it matters more than it sounds:

- **Several people share these sessions.** I can't tell you apart otherwise, and
  Sam may be in a different session at the same time.
- **What you tell me gets stored with your name on it.** When Jessica gave me two
  Gavilan counselor contacts, they were saved as *"from Jessica, 2026-08-05"* —
  so a year from now someone can ask *her* about them instead of guessing. That
  only works if I know who's talking.
- **It changes what I assume you know.** If you tell me you live in MAP daily,
  I'll stop explaining MAP and start asking you things.

Sessions get names too (SkyMail, SkyWalker) — that's how you and Sam refer to
"the one that did the occupations crosswalk" without confusion.

## 2. Tell me what you *noticed*, not just what you want

This is the highest-leverage habit on the list.

A request gets you the thing you asked for. **An observation gets you a better
thing.** The two most valuable prompts in the session that built the contact
worklist were not requests:

> *"MAP is set up to send requests to the Primary Contact using the PC email."*

> *"All the colleges are locally governed and we can't make determinations for
> them."*

The first told me which field actually mattered out of twelve. The second killed
a design I liked and replaced it with a better rule. Neither was a task — both
were things someone knew that I couldn't have known.

So: if something looks off, say so. If you know why a thing is the way it is,
tell me. If my plan smells wrong, **say that too** — you'll be right often
enough to be worth the interruption, and I'd much rather be corrected early.

## 3. Ask to see it

Sam's tip to Ashley, and it's right: **ask me to show you.** A visual, a table, a
mock-up. React to it, tell me what's wrong, and I'll change it while you watch.

Describing what you want in advance is hard. Reacting to something in front of
you is easy. Use the easy one.

## 4. Ask for a tool, not a document

The single best framing Sam gave Ashley: *don't think about producing a one-time
Excel sheet you have to come back and ask to update.*

**Ask for a COBI tab when:**

- you'd want this again next month, or next semester;
- **the numbers will change** — anything I hand you in chat is a photograph, and
  it starts going stale immediately. (The 71-college contact table from this
  session is accurate as of one sync and will drift. That's exactly the case for
  a tab.)
- more than one person needs to look at it;
- you can imagine someone asking "is this still true?"

**A document or export is fine when:**

- it's genuinely one-time, for one audience, and then done;
- it's going into a deck, a memo, or an email.

Rule of thumb: **if you'd ever have to ask me to "re-run it," it should be a
tab.** A tab re-runs itself.

Don't worry about whether it's "big enough to deserve a tab." It usually is, and
if it isn't I'll say so.

## 5. When I ask you to approve something

I'll ask permission before doing certain things. New users often either approve
everything reflexively or get nervous and approve nothing. Here's the actual
shape of it:

| | Examples | What to do |
|---|---|---|
| 🟢 **Routine** | reading files, searching, running tests, querying data to answer a question | Approve. None of it changes anything. |
| 🟡 **Worth a glance** | writing a file, pushing a branch, opening a pull request, running a workflow | Skim what I said I'm doing. Approve if it matches what you asked for. |
| 🔴 **Slow down** | writing to shared databases, anything touching the live site, anything that publishes externally, anything involving people's names or emails | Ask me *what this changes and who else sees it* before approving. |

**If you don't understand what I'm asking to do, ask me to explain it in plain
language before you approve.** That is always a reasonable move, it costs about
fifteen seconds, and I won't be even slightly put out. A confused yes is worse
for both of us than a question.

You can also just say **"don't do that"** or **"stop."** I'll stop.

## 6. Does this touch anyone else's work?

Most of what you'll ask for is self-contained. Some of it isn't, and the ones
that aren't are worth catching *before* rather than after. Ask me **"does this
affect anything else?"** whenever:

- it involves **people's names or email addresses** — some of our data is
  deliberately restricted and must never reach the public site;
- it changes something on the **public dashboard** (anyone on the internet can
  see that page);
- it touches the **shared database** other tabs read from;
- it would change something in **MAP itself** — worth knowing: **I can't write to
  MAP.** MAP is the system of record, we read from it, and if something's wrong
  there a human has to fix it in MAP. I can tell you exactly which colleges need
  fixing; I can't fix them;
- it might reach **colleges or the public** — emails, published pages, the public
  knowledge base.

And tell me if you know **someone else is working right now.** Sam often runs
several sessions at once. If two of us write to the same place, the later one
wins and the earlier work quietly vanishes. Thirty seconds of "Sam's in another
session on funding" saves that entirely.

## 7. Checkpoint before you leave

Type **`/checkpoint`** before you close a session that did anything substantial.

What it does: writes down what we figured out, what state things are in, and
what's next — into files the next session reads. Takes a couple of minutes and I
do the work.

Why it matters: **when a session ends, everything not written down is gone.** Not
archived, not recoverable — gone. The reasoning, the dead ends, the thing you
told me that changed the design. A checkpoint is the difference between the next
session starting where you left off and starting from scratch.

You don't have to remember this one — I'll offer. But you can always ask.

## 8. Things I can't do

Worth knowing up front so you don't wait on something that isn't coming:

- **I can't send Teams messages or email.** I can *draft* an email and open it in
  your mail app, but you press send. Nothing goes out without a human.
- **I can't write to MAP.** Read-only, by design.
- **I can't see a repository or system nobody has connected to the session.**
- **I can't see what happened in a different session** unless it was written down
  (see: checkpoint).
- **I get things wrong.** Especially when I'm inferring something you'd simply
  know. When I mark something as a guess, treat it as one.

## 9. How hard should I work on this?

There are two dials, and you can turn either up.

**Reasoning effort** — how hard I think about one thing before answering.

**Ultracode** — whether I split the work across many independent agents running at
once. Say *"ultracode"* or *"use a workflow"* in your message, or switch it on for
the whole session.

Cost is not really the deciding factor. The thing worth knowing is that **more
agents is not automatically better**, and there's a clean way to tell which you
want:

**Turn it up when the risk is that we MISS something.** Many files, many surfaces,
*"check every X"*, *"find everything wrong with Y"*, an audit nobody has had the
patience to finish. Fifteen agents genuinely beat one here — each is blind to what
the others found, and the union is the answer.

**Leave it down when the risk is that we get it WRONG.** A design decision, a
definition, a judgment call. Fan-out gives you five plausible opinions and somebody
still has to choose between them — except now there's a majority, and **a majority
among agents is not evidence.** Sam's version: *too many cooks in the kitchen can
lead to chasing our tails endlessly.*

A real example, from 2026-08-08. Sam proposed publishing student counts with small
cells hidden as `<10` while keeping the real totals — which is the *intuitive*
answer, and a panel of fresh agents would quite plausibly have agreed with it. What
actually got the right answer was reading a note this repo had written two days
earlier explaining why it fails: you can recover the hidden number by subtracting
the visible ones from the total. **No quantity of agents would have found that.
Reading what we'd already written did.**

That's the pattern worth keeping: this project has a large written memory, and
several of the best catches lately came from *re-reading the last thing we wrote*
rather than generating something new. One session discovered the bug it had been
sent to fix was already fixed — by its own previous pull request.

### You don't have to work this out

I'll call it at the top of a piece of work — one line, *"this is worth ultracode
because X"* or *"this one isn't."* If you disagree, say so; you know the stakes
better than I do. And you can always force it either way in your own message.

## 10. A short list of things worth saying to me

Steal these:

- *"This is Jessica."*
- *"Show me what that looks like."*
- *"That's not right — here's why."*
- *"Where did that number come from?"*
- *"Does this affect anything else?"*
- *"Make that a tab so we can keep using it."*
- *"Is this worth ultracode?"*
- *"What would you do?"*
- *"/checkpoint"*

That last-but-one is underused. If you ask what I'd recommend, you'll get an
actual opinion rather than a menu — including when I think the thing you asked
for is the wrong thing to build.

---

## For Sam — a note on agents

You floated *"maybe need some established agents who are mindful of these
things."* My recommendation is **not yet**, and here's the reasoning:

Most of what's on this page is an **always-on habit**, not a task. An agent has
to be *invoked* — which means it fails precisely when a new user forgets, and
forgetting is the exact failure mode you're trying to prevent. Putting these
behaviors in the project's standing instructions (which load automatically in
every session, every time) covers Ashley on her first day without her knowing
they exist.

The shape I'd use:

| Need | Right tool | Why |
|---|---|---|
| Always-on habits (ask who's driving, flag cross-impact, offer a tab) | **Standing project instructions** | Loads automatically; can't be forgotten |
| A ritual you run on purpose (`/checkpoint`) | **Slash command** | Deliberate, repeatable, one keystroke |
| A procedure for a specific kind of work | **Skill** | Loads only when relevant, doesn't tax every session |
| Genuinely parallel or adversarial work | **Agent** | Worth it when you want independent review, not habit enforcement |

The one agent I'd actually build, once you're on enterprise and more people are
working at once, is a **cross-impact reviewer** — given a change, it independently
answers "what else reads this, who else is mid-flight, does this touch restricted
data or the public site." That's a real second opinion, which is what agents are
genuinely good for. It's also the thing hardest for a single session to be honest
about, since the session is the one that wants to ship.

Start with the standing instructions. Add the agent when the collisions start.
