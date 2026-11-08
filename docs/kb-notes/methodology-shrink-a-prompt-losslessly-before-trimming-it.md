---
title: Shrink a model's standing prompt losslessly before trimming it, and replay the saved answers to prove it
created: 2026-11-08
updated: 2026-11-08
tags: [methodology, classifier, prompts, cer, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/reference/lanes/cer-procedures]]"
artifacts:
  - kb/_cer_procedures.py
  - tests/cer_classifier_rules_size_test.py
---

# Shrink a model's standing prompt losslessly before trimming it

The CER classifier's standing rules grew past the Edge Function's limit (251,866 characters against 250,000) and every
call came back HTTP 413 for a day. The first fix trimmed by relevance: families sharing no word with the batch lost their
issuer lists. It fit, and the size test passed.

A reviewer asked whether the meaning survived. Replaying the rules the run would send against the 1,357 saved answers
showed it had not, entirely: every family line survived, but 156 of the 1,115 answers that joined a house family had their
issuer stripped. They were the cases word overlap cannot see, abbreviations and short codes
(*1st Receiver Ops & Decon* joining *First Receiver Operations and Decontamination*).

The size came from repetition, not content: 2,528 of 2,727 families have one issuer, written again on every line. Listing
the families under their issuer said the same thing in 165,600 characters, with nothing dropped.

**The practice.**

1. **Look for repetition before relevance.** A prompt over budget is often saying the same thing many times. Group,
   factor out or reference before cutting anything.
2. **Trim by relevance only as a last resort, and say so in the prompt** (here: how many families were left out).
3. **Test meaning, not size.** A size check passes on a prompt that has lost what the model needs. Replay the saved
   answers: for each, check that what the model relied on (the family it joined, under its issuer) is still in the text
   the run would now send. This costs no model calls and fails on the first lossy change.
4. **Never send a call you know will be refused.** Check the size before the post and stop with a plain message.
