# 0002 COCI control numbers as Credential Engine's External Identifiers

- **Proposed:** 2026-10-20, by the CPL Initiative (COBI)
- **Decided for the CPL Initiative:** Sam, 2026-10-20 (decision 0001, item 2: records keyed on COCI control numbers)
- **Status:** proposed to Credential Engine; in force once Credential Engine's lead agrees here

## The question

What should a Credential Engine export use as a course's or program's External Identifier?

## What happens today

xTRA keys a course on its printed code and suffixes a repeat within one export (`ACCT 101-2`); it gives a credential a
fresh random UUID on every export; and a program's identifier defaults to its name. Credential Engine's review step
then adds CTIDs. So a second export of a college shares no credential keys with the first, and nothing in a file joins
it to the state's record of the course or program.

## The proposal

Where Credential Engine's review matches a course or program to COCI, its External Identifier is the COCI control
number: `CCC` and nine digits for a course, five digits for a program. Elsewhere it stays the printed code. The
printed code always goes in `Coded Notation`.

## Why

Every row then joins the state's record the moment it is filed. A second export finds the CTID the first one minted,
because the key does not change between exports. A CTID that appears on two resources stands out at once. COBI
supplies the match: the identifier crosswalk in `outbound/cobi/` maps each college's course codes to control numbers,
so Credential Engine's review can copy the number rather than search for it.

## What it asks of Credential Engine

One column filled from COBI's crosswalk during review, and one question answered here: does a re-upload to the
Registry match an existing resource on its External Identifier?
