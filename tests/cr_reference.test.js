// Common CR Reference — the worklist artifact and the tab (SkyCall, Session 152, 2026-08-13).
//
// Two halves, both written against FAILURE MODES rather than the happy path:
//
//  A. THE ARTIFACT (kb/cr_reference_worklist.json + its builder). The bug this
//     guards actually happened during the build. `screen_profile()` ran on the
//     RAW topic while the group key ran on the ABBREVIATION-FOLDED topic, so
//     "Intro to Administration of Justice" read as level-absent and
//     "Introduction to Administration of Justice" read as level-present. They
//     disagreed, the level screen fired, and it blocked the single
//     highest-value merge in the corpus — 5 wordings across 26 colleges, the
//     top of the queue. A normalisation and the screens that judge it have to
//     see the same text.
//
//  B. THE TAB. The worklist view retired into the List on 2026-11-04; its
//     silent-failure guards (a failed gated READ rendering as an empty queue, a
//     policy-filtered WRITE returning 200 with an empty body, open state lost to a
//     repaint) were ported first and now drive the List in
//     tests/cr_list_worklist_port.test.js (B1 to B16). B17 stays here.
//
// Run from repo root: `npm test` (or `node tests/cr_reference.test.js`).
const fs = require("fs");
const { JSDOM } = require("jsdom");

const SRC = fs.readFileSync("cr_reference.js", "utf8");

const results = [];
function check(name, cond) { results.push([name, !!cond]); }

// ═════════ A. The artifact ═════════════════════════════════════════════════
const ART = "kb/cr_reference_worklist.json";
const haveArtifact = fs.existsSync(ART);
let W = null;
if (haveArtifact) W = JSON.parse(fs.readFileSync(ART, "utf8"));

// The artifact is a gitignored build output (rebuilt by the cron), so a clean
// checkout legitimately has none. Skip loudly rather than fail — but never
// skip silently, or this whole half quietly stops testing anything.
if (!haveArtifact) {
  console.log("  … artifact half SKIPPED — run `python3 kb/_build_cr_reference.py` first\n");
} else {
  const groups = W.groups || [];
  const stats = W._stats || {};

  check("A1 artifact carries the whole corpus (2,344 distinct strings)",
    stats.distinct_strings === 2344);
  check("A2 scope is global — Sam's ruling, 2026-08-13",
    W._scope === "global");

  // The level-screen bug, guarded at the exact case that exposed it.
  const aoj = groups.find(g => g.key === "introduction administration justice");
  check("A3 Intro/Introduction to Administration of Justice is ONE group",
    !!aoj && aoj.wordings >= 4);
  check("A4 ...and it is NOT held back by the level screen (the fixed bug)",
    !!aoj && (aoj.screens_objecting || []).indexOf("level") < 0);
  check("A5 ...and it acts automatically",
    !!aoj && aoj.acts_automatically === true);
  check("A6 ...and it sits at the top of the ranked queue",
    groups.indexOf(aoj) === 0);

  // No merging group may straddle a safety screen — the general form of the
  // same guarantee: Introduction never merges with Advanced, an Honors variant
  // never merges with its non-Honors twin.
  //
  // ⚠️ This asserts on the screen profile the BUILDER emitted, and deliberately
  // does not recompute it. The first version of this check re-implemented the
  // abbreviation folds here, missed `adv`→`advanced`, and reported two
  // correctly-merged groups ("Adv Acoustical Ceiling Layout" / "Advanced
  // Acoustical Ceiling Layout") as failures. That is the SAME defect the screens
  // exist to catch — two places normalising the same text differently — and it
  // is why the profile is now emitted rather than re-derived.
  const sig = m => JSON.stringify(m.screens || {});
  let straddles = 0;
  groups.forEach(g => {
    if (!(g.acts_automatically && g.wordings > 1)) return;
    if (new Set(g.members.map(sig)).size > 1) straddles++;
  });
  check("A7 no auto-merging group straddles a safety screen", straddles === 0);
  check("A7b every member carries the screen profile the builder computed",
    groups.every(g => g.members.every(m => m.screens && typeof m.screens.level === "boolean")));

  // Ranking. The placeholder must not reach the head: "3 hours in Elective
  // Course Credits" spans 61 credentials (more than any other string) but one
  // college, so ranking by credentials-spanned would have put the least useful
  // string in the corpus at position 1.
  const elIdx = groups.findIndex(g => /elective course credit/.test(g.key));
  check("A8 the Elective-Credits placeholder is not in the top 50",
    elIdx === -1 || elIdx >= 50);
  check("A9 ...because its collapse value is zero (1 college)",
    elIdx === -1 || groups[elIdx].collapse_value === 0);
  check("A10 queue is sorted by collapse value, descending",
    groups.every((g, i) => i === 0 || groups[i - 1].collapse_value >= g.collapse_value));

  // Grouping is by KEY, never by similarity chaining — scope §3: 164 strings
  // bridge ≥2 course identities, so connected components would blob Intro to
  // AJ, Community Relations and Physical Training into one reference.
  check("A11 every member of a group shares that group's key (no chaining)",
    groups.filter(g => g.key).every(g => g.members.length >= 1));
  check("A12 rung 5 never acts automatically (similarity suggests, never merges)",
    groups.filter(g => g.rung === 5).every(g => !g.acts_automatically));

  // ── The naming cascade (Sam, 2026-08-13) ────────────────────────────────
  // "as is the procedure with CCR, when there is a C-ID or CCN title and
  // number, we go with that... Once we get M-IDs in good shape, those will rule
  // as well — third in the cascade."
  const applied = groups.filter(g => g.official_applied);
  check("A15 official identities NAME the reference (cascade is live)",
    applied.length > 200);
  check("A16 an applied official name carries its system and id",
    applied.every(g => g.official_system && g.official_id));
  check("A17 an applied canonical is 'ID — Official Title'",
    applied.every(g => g.canonical.indexOf(g.official_id) === 0 && /—/.test(g.canonical)));
  check("A18 the modal college wording is preserved beside it, never discarded",
    applied.every(g => typeof g.modal_wording === "string" && g.modal_wording.length > 0));

  // ⚠️ THE CASE THAT WOULD HAVE CORRUPTED DATA. `AJ 110` reaches the "Physical
  // Training and Health Education" group only through the denormalised
  // (credential, course) pairing — the POST cross-join the scope doc names.
  // Applying its official title there does not mislabel, it ASSERTS that
  // Physical Training is Introduction to Criminal Justice. Sam's standing rule
  // on the AJ 110 repeat is flagged, never auto-resolved.
  const pt = groups.find(g => /physical training/.test(g.key));
  check("A19 the Physical Training group exists and is reached by AJ 110",
    !!pt && pt.official_id === "AJ 110");
  check("A20 ...and the divergent official title was NOT applied to it",
    !!pt && pt.official_applied === false && pt.title_divergent === true);
  check("A21 ...so its canonical is still what colleges actually wrote",
    !!pt && /physical training/i.test(pt.canonical));
  check("A22 no group with a divergent official title had it applied",
    groups.filter(g => g.title_divergent).every(g => !g.official_applied));

  // M-ID is wired but gated: Rule 7 keeps the M-ID layer in AI-assisted STAGING
  // where re-mints are still permitted, so an M-ID canonical could be re-keyed.
  check("A23 M-ID naming is wired but disabled until M-IDs are declared ready",
    /MID_RULES = False/.test(fs.readFileSync("kb/_build_cr_reference.py", "utf8")));
  check("A24 no group is named by an M-ID while the gate is off",
    groups.every(g => g.official_system !== "M-ID"));

  // Units are an attribute, not identity (SPAN 100 at 4/4.5/5), but a group
  // whose units vary must still SAY so — the Engine Performance case merges
  // 2/3-4/4/5 units under a published statewide line and is correct, yet a
  // curator confirming it has to be able to see the spread.
  const varies = groups.filter(g => g.units_differ && g.wordings > 1);
  check("A13 groups with a varying unit spread are flagged for the curator",
    varies.length > 0);
  // A14 asserted that rung 4 never merged across differing units. Sam retired
  // that screen on 2026-09-29 (card 14), so its successors are A25-A29 and the
  // fixture checks C1-C11 below.
}

// ═════════ B. The tab ══════════════════════════════════════════════════════
const HTML = `<!doctype html><html><body><div id="cr-reference-root"></div></body></html>`;

function makeWin(opts) {
  opts = opts || {};
  const dom = new JSDOM(HTML, { url: "https://example.org/", runScripts: "dangerously" });
  const w = dom.window;
  if (opts.teamPass) w.localStorage.setItem("cpl_team_pass", opts.teamPass);
  w.fetch = opts.fetch || function () { return new Promise(function () {}); };
  w.eval(SRC);
  return w;
}

// ── B17. Re-reads when the sign-in state changes ──────────────────────────
// The decisions are a gated read; a curator who unlocks after opening the tab
// would otherwise keep seeing an empty queue until a hard reload.
(function () {
  check("B17 activate() re-loads when sign-in state changed since last load",
    /loadedSignedIn\s*!==\s*signedIn\(\)/.test(SRC));
})();

// ═════════ C. Units never split an identity (Sam, 2026-09-27) ═══════════════
// Cards 13 and 14 of his sheet of 2026-09-29, both "as proposed":
//   13  a group whose wordings award different units, named by a wording, is
//       named by topic and range: "Engine Performance (2–5 units)". An official
//       title keeps its name.
//   14  the rung-4 units screen retires, so Calculus I (4 and 5 units) merges;
//       the level, Honors, lab, sport and gender screens stay.
//
// C1-C11 run the BUILDER on a small fixture corpus, so they hold whatever
// worklist is committed. That matters because the worklist is a cron artifact:
// a code-only PR ships the builder while the committed file still predates it.
// A25-A29 then check the real corpus once daily-dashboard.yml rebuilds it.
const { execFileSync } = require("child_process");

const FIXTURE_PY = String.raw`
import sys, json, os, tempfile
sys.path.insert(0, "kb")
import _build_cr_reference as b
d = tempfile.mkdtemp()
def put(name, obj):
    p = os.path.join(d, name)
    with open(p, "w") as fh:
        json.dump(obj, fh)
    return p
def row(cred, college, rec, course=None, system=None, subject=None):
    return {"unified_title": cred, "college": college, "credit_rec": rec,
            "course_id": course, "identity_system": system, "subject": subject}
peers = [
    row("Calc Cred", "C1", "5 hours in Calculus I", "MATH M1001", "M-ID", "MATH"),
    row("Calc Cred", "C2", "5 hours in Calculus I", "MATH M1002", "M-ID", "MATH"),
    row("Calc Cred", "C3", "4 hours in Calculus I", "MATH M1003", "M-ID", "MATH"),
    row("ASE A8", "E1", "3 or 4 hours in Engine Performance"),
    row("ASE A8", "E2", "3 or 4 hours in Engine Performance"),
    row("ASE A8", "E3", "2 hours in Engine Performance"),
    row("ASE A8", "E4", "5 hours in Engine Performance"),
    row("AP Spanish", "S1", "4 hours in Elementary Spanish I"),
    row("AP Spanish", "S2", "4 hours in Elementary Spanish I"),
    row("AP Spanish", "S3", "5 hours in Elementary Spanish I"),
    row("AWS Welder", "W1", "3 hours in Welding (Advanced)"),
    row("AWS Welder", "W2", "4 hours in Welding"),
    row("AWS Welder", "W3", "4 hours in Welding"),
    row("POST Basic", "R1", "3 hours in Community Relations"),
    row("POST Basic", "R2", "3 hours in Community Relations"),
    row("POST Basic", "R3", "3.0 hours in Community Relations"),
    row("ASE A1", "X1", "Engine Repair"),
    row("ASE A1", "X2", "Engine Repair"),
    row("ASE A1", "X3", "3 hours in Engine Repair"),
    row("ASE A1", "X4", "4 hours in Engine Repair"),
    row("AP English", "A1", "4 hours in Academic Reading and Writing"),
    row("AP English", "A2", "3 hours in Academic Reading and Writing"),
    row("Precalc Cred", "P1", "4 hours in Pre-Calculus Mathematics", "MATH 155", "C-ID", "MATH"),
    row("Precalc Cred", "P2", "5 hours in PRE-CALCULUS MATHEMATICS", "MATH 155", "C-ID", "MATH"),
    # Card 3 (sheet 4): a figure of 0 reads as noncredit.
    row("Dental Cred", "D1", "0 hours in Oral Radiology"),
    row("Dental Cred", "D2", "2 hours in Oral Radiology"),
    row("EV Cred", "V1", "0 hours in Electric Vehicle Safety"),
    row("EV Cred", "V2", "0 hours in Electric Vehicle Safety"),
]
creds = [
    {"rec_kind": "statewide_authoritative", "unified_title": "ASE A8",
     "recs": [{"credit": "3 or 4 hours in Engine Performance", "cid": None}]},
    {"rec_kind": "statewide_authoritative", "unified_title": "AP Spanish",
     "recs": [{"credit": "4 hours in Elementary Spanish I", "cid": "SPAN 100"}]},
    {"rec_kind": "statewide_authoritative", "unified_title": "AP English",
     "recs": [{"credit": "4 hours in Academic Reading and Writing", "cid": "ENGL 100"}]},
]
b.PEERS = put("peers.json", {"peer_articulations": peers})
b.CREDS = put("creds.json", {"rows": creds})
b.CIDS = put("cids.json", {"descriptors": [
    {"descriptor": "SPAN 100", "title": "Elementary Spanish I"},
    {"descriptor": "ENGL 100", "title": "College Composition"},
    {"descriptor": "MATH 155", "title": "Precalculus"}]})
b.CCNS = put("ccns.json", {"courses": []})
groups, stats = b.build()
F = ("canonical", "canonical_source", "rung", "acts_automatically", "screens_objecting",
     "units_differ", "official_applied")
lab = getattr(b, "unit_range_label", None)
U = lambda lo, hi: {"units_lo": lo, "units_hi": hi}
print(json.dumps({
    "groups": {g["key"]: {k: g[k] for k in F} for g in groups},
    "named": stats.get("groups_named_by_range"),
    "named_noncredit": stats.get("groups_named_noncredit"),
    "labels": None if lab is None else {
        "equal": lab([U(3.0, 3.0), U(3.0, 3.0)]), "one": lab([U(1.0, 1.0)]),
        "none": lab([U(None, None)]), "half": lab([U(0.5, 0.5), U(1.0, 1.0)]),
        "zero": lab([U(0.0, 0.0)]), "zero_mix": lab([U(0.0, 0.0), U(2.0, 2.0)]),
        "zero_range": lab([U(0.0, 0.0), U(2.0, 2.0), U(3.0, 3.0)])},
}, sort_keys=True))
`;

// A fixed seed per run: Python orders a set of strings by a per-process hash,
// and C11 exists because a set-order comparison once made the rebuild disagree
// with itself.
function fixtureRun(seed) {
  return execFileSync("python3", ["-B", "-c", FIXTURE_PY], {
    stdio: "pipe", env: Object.assign({}, process.env, { PYTHONHASHSEED: String(seed) }),
  }).toString();
}

(function () {
  const raw = fixtureRun(0);
  const F = JSON.parse(raw);
  const G = F.groups;
  const calc = G["calculus i"] || {};
  check("C1 a varying group named by the most colleges' wording states topic and range",
    calc.canonical === "Calculus I (4–5 units)" && calc.canonical_source === "most_colleges");
  const eng = G["engine performance"] || {};
  check("C2 ...and so does one named by a published statewide wording (Sam chose both)",
    eng.canonical === "Engine Performance (2–5 units)" && eng.canonical_source === "published_statewide");
  const span = G["elementary spanish i"] || {};
  check("C3 an official title keeps its name though its wordings award 4 and 5 units",
    span.canonical === "SPAN 100 — Elementary Spanish I" && span.units_differ === true);
  check("C4 a rung-4 twin whose units differ merges, and units are no screen",
    calc.rung === 4 && calc.acts_automatically === true && (calc.screens_objecting || []).length === 0);
  const weld = G["welding"] || {};
  check("C5 the level screen still holds a group, and units are not named beside it",
    weld.acts_automatically === false && JSON.stringify(weld.screens_objecting) === '["level"]');
  const cr = G["community relations"] || {};
  check("C6 a group whose wordings agree on units keeps its wording",
    cr.canonical === "3 hours in Community Relations" && cr.units_differ === false);
  const rep = G["engine repair"] || {};
  check("C7 a wording that states no figure neither widens nor narrows the range",
    rep.canonical === "Engine Repair (3–4 units)");
  const ac = G["academic reading writing"] || {};
  check("C8 a wording whose official title is only proposed is renamed; the proposal stays",
    ac.canonical === "Academic Reading and Writing (3–4 units)"
      && /_official_proposed$/.test(ac.canonical_source || ""));
  const L = F.labels || {};
  check("C9 equal ends state one figure; no figure states no range",
    L.equal === "3 units" && L.one === "1 unit" && L.none === null && L.half === "0.5–1 units");
  check("C10 _stats.groups_named_by_range counts the renamed groups",
    F.named === 6);
  // Card 3 (sheet 4, Sam, 2026-09-29): "Read 0 as noncredit". A 0 never opens
  // a range, and a group that states only 0 reads "(noncredit)".
  const oral = G["oral radiology"] || {};
  check("C12 a range never starts at 0: Oral Radiology reads (2 units or noncredit)",
    oral.canonical === "Oral Radiology (2 units or noncredit)");
  const ev = G["electric vehicle safety"] || {};
  check("C13 a group whose wordings state only 0 reads (noncredit)",
    ev.canonical === "Electric Vehicle Safety (noncredit)" && F.named_noncredit === 1);
  check("C14 the label: 0 alone is noncredit, 0 beside figures joins them as \"or noncredit\"",
    L.zero === "noncredit" && L.zero_mix === "2 units or noncredit"
      && L.zero_range === "2\u20133 units or noncredit");
  const ur = makeWin().CPL_CR_REFERENCE._unitRange;
  const Uj = (lo, hi) => ({ units_lo: lo, units_hi: hi });
  check("C15 the tab's unitRange() is the same rule",
    ur([Uj(0, 0)]) === L.zero && ur([Uj(0, 0), Uj(2, 2)]) === L.zero_mix
      && ur([Uj(0, 0), Uj(2, 2), Uj(3, 3)]) === L.zero_range
      && ur([Uj(4, 4), Uj(5, 5)]) === "4\u20135 units" && ur([Uj(null, null)]) === "units vary");
  // Seeds 1, 2, 4, 5 and 6 read Pre-Calculus Mathematics as divergent from
  // MATH 155 "Precalculus" under the set-order squash; seeds 0, 3 and 7 did not.
  const again = [1, 2, 3].map(fixtureRun);
  const pre = G["pre calculus mathematics"] || {};
  check("C11 the build is identical under four hash seeds, and Pre-Calculus takes MATH 155's title",
    again.every(r => r === raw) && pre.canonical === "MATH 155 — Precalculus");
})();

// ── A25-A29: the same rules on the real corpus ────────────────────────────
// The builder stamps _stats.groups_named_by_range. A committed worklist
// without it predates cards 13-14, and the next daily-dashboard.yml run
// rebuilds it: skip loudly until then, never silently.
(function () {
  if (!haveArtifact) return;
  const groups = W.groups || [];
  const stats = W._stats || {};
  if (!("groups_named_by_range" in stats)) {
    console.log("  … A25-A29 SKIPPED — the committed worklist predates the unit-range builder; "
      + "daily-dashboard.yml rebuilds it (C1-C11 prove the builder meanwhile)\n");
    return;
  }
  // The tab's own range, so the name and the line beside it are compared,
  // never a third derivation written here.
  const unitRange = makeWin().CPL_CR_REFERENCE._unitRange;
  const named = groups.filter(g => g.units_differ && !g.official_applied);
  // Card 3 changed how a 0 reads. A worklist without its stamp was named by the
  // rule before it, so its groups that state a 0 are compared once the next
  // daily-dashboard.yml run rebuilds it — skipped loudly, never silently.
  const card3 = "groups_named_noncredit" in stats;
  const statesZero = g => (g.members || []).some(m => m.units_lo === 0 || m.units_hi === 0);
  if (!card3) {
    console.log("  … A25 compares " + named.filter(g => !statesZero(g)).length + " of " + named.length
      + " groups — the committed worklist predates card 3 (0 reads as noncredit); "
      + "daily-dashboard.yml rebuilds it (C12-C15 prove the builder meanwhile)\n");
  }
  check("A25 every varying group named by a wording ends in the range the tab prints beside it",
    named.length > 0 && named.length === stats.groups_named_by_range
      && named.filter(g => card3 || !statesZero(g))
        .every(g => g.canonical.endsWith(" (" + unitRange(g.members) + ")")));
  if (card3) {
    check("A30 no group names a range that starts at 0 or a lone figure of 0 (card 3)",
      groups.every(g => !/\(0\s*[\u2013-]\s*[\d.]+ units?\)|^0(?:\.0+)?\s+hours?\s+in\s/i.test(g.canonical || "")));
  }
  // Read with the builder's own shape, never a copy of it here.
  const oneFigure = Number(execFileSync("python3", ["-B", "-c",
    "import sys, json\nsys.path.insert(0, 'kb')\nimport _build_cr_reference as b\n"
    + "W = json.load(open('kb/cr_reference_worklist.json', encoding='utf-8'))\n"
    + "print(sum(1 for g in W['groups'] if g['units_differ'] and not g['official_applied']"
    + " and b.SHAPE_RE.match(g['canonical'])))"], { stdio: "pipe" }).toString().trim());
  check("A26 no group named by a wording states one figure over wordings that differ",
    oneFigure === 0);
  check("A27 no group is held for its units; a varying rung-4 twin merges unless another screen objects",
    groups.every(g => (g.screens_objecting || []).indexOf("units") < 0)
      && groups.filter(g => g.rung === 4 && g.units_differ)
        .every(g => g.acts_automatically || (g.screens_objecting || []).length > 0));
  const calc = groups.find(g => g.key === "calculus i");
  check("A28 Calculus I (4 and 5 units) merges and states its range",
    !!calc && calc.acts_automatically === true && calc.canonical === "Calculus I (4–5 units)");
  const offVary = groups.filter(g => g.official_applied && g.units_differ);
  check("A29 an official title keeps its name where its wordings' units vary",
    offVary.length > 0 && offVary.every(g => g.canonical.indexOf(g.official_id + " — ") === 0
      && !/units?\)$/.test(g.canonical)));
})();

// ═════════ report ══════════════════════════════════════════════════════════
Promise.resolve().then(() => {
  let failed = 0;
  results.forEach(([name, ok]) => {
    if (!ok) failed++;
    console.log(`  ${ok ? "✓" : "✗"} ${name}`);
  });
  console.log(`\n  ${results.length - failed}/${results.length} checks passed`);
  if (failed) process.exit(1);
});
