# Identifier rules

A change to any rule in this file is a contract change that also needs Sam's decision, recorded in `decisions/`.

## The state's numbers

The California Community Colleges Chancellor's Office Curriculum Inventory (COCI) assigns every approved course and
program a control number. These are the stable keys in this exchange: a college may renumber a course or retitle a
program, and its control number stays.

| What | Number | Shape | Measured |
| --- | --- | --- | --- |
| A course | COCI course control number | `CCC` and nine digits: `CCC000425258` | 141,694 of 141,738 rows in COCI's course list of 2026-05-21; the other 44 read `NULL` |
| A program | COCI program control number | five digits, kept as text with leading zeros: `02964` | all 15,964 program records COBI held on 2026-10-20 |
| A college | its name as COCI spells it, and its CCCCO MIS college code | three characters: `621` | the MIS code list (Data Element Dictionary, Appendix A) has 121 colleges and sites |

A college's MIS code and MAP's college number are different namespaces: Antelope Valley is 621 in MIS and 19 in MAP.
This exchange uses the MIS code.

## Credential Engine's identifiers

- **CTID.** `ce-` and a lower-case UUID: `ce-0a1b2c3d-4e5f-6789-abcd-ef0123456789`. CTDL defines a CTID as *"the
  equivalent of a version identifier for the resource"*: one CTID names one version of one resource, and is never
  assigned to a second resource. The check refuses a drop in which one CTID names two resources.
- **External Identifier.** In a Credential Engine drop, the External Identifier of a course or program is its COCI
  control number wherever the review matched one, and otherwise the code the catalog prints. This lets a second export
  find the CTID the first one minted, and lets every row join the state's record when it is filed (decision 0002). A
  suffix that marks a repeat within one export (`ACCT 101-2`) is never an identifier.
- **Coded Notation** carries the course code exactly as the catalog prints it, always, whatever the External
  Identifier holds.

## Course codes

A partner sends a course code as the catalog prints it. COBI applies its own readings (slashed subjects, renumbered
courses, a code the catalog page masks) when it matches, and reports a code it cannot read as a finding. A partner
never normalizes a code before filing it, since the printed form is the evidence.

## COBI's identifiers

- **A harvested program record** is keyed by its program control number and catalog year: `02964 2026-2027`.
- **COBI's common course identifiers (M-IDs), credit recommendation groups and exhibit keys stay out of this
  exchange.** The CPL Initiative's common course layer is still in staging and its identifiers may be re-minted, and a
  CTID names one version for good. These identifiers enter the exchange once the CPL Initiative declares the layer
  faculty-published (decision 0001).

## Other schemes

- **C-ID** numbers are written as ASCCC prints them (`ENGL C1000`, `ACCT 110`).
- **A catalog web address** is the page a reader opens to see the course or program, written in full with `https://`.
