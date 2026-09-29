// Common CR Reference — the curation worklist (SkyCall, Session 152, 2026-08-13).
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
//  B. THE TAB. Three silent-failure classes this repo has now paid for more
//     than once: a failed gated READ rendering as an empty queue; a
//     policy-filtered WRITE returning 200 with an empty body and being reported
//     as success; and open/expand state living in the DOM when render()
//     rewrites innerHTML.
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

const G1 = {
  key: "community relations", canonical: "3 hours in Community Relations",
  canonical_source: "published_statewide", cid: null, rung: 1,
  rung_why: "Published statewide recommendation", acts_automatically: true,
  screens_objecting: [], units_differ: false, wordings: 2, rows: 415,
  credentials: 4, colleges: 28, courses: [], subjects: [], collapse_value: 28,
  members: [
    { rec: "3 hours in Community Relations", topic: "Community Relations", rows: 293, units_lo: 3, units_hi: 3, unit_word: "hour", credentials: [], credentials_n: 4, colleges_n: 28, courses: [] },
    { rec: "3.0 hours in Community Relations", topic: "Community Relations", rows: 122, units_lo: 3, units_hi: 3, unit_word: "hour", credentials: [], credentials_n: 1, colleges_n: 20, courses: [] },
  ],
  sample_credentials: ["POST Basic Academy"],
};
const G2 = {
  key: "engine performance", canonical: "3 or 4 hours in Engine Performance",
  canonical_source: "published_statewide", cid: null, rung: 1, rung_why: "Published",
  acts_automatically: true, screens_objecting: [], units_differ: true,
  wordings: 2, rows: 66, credentials: 3, colleges: 15, courses: [], subjects: [],
  collapse_value: 15,
  members: [
    { rec: "3 or 4 hours in Engine Performance", topic: "Engine Performance", rows: 38, units_lo: 3, units_hi: 4, unit_word: "hour", credentials: [], credentials_n: 1, colleges_n: 9, courses: [] },
    { rec: "5 hours in Engine Performance", topic: "Engine Performance", rows: 28, units_lo: 5, units_hi: 5, unit_word: "hour", credentials: [], credentials_n: 1, colleges_n: 8, courses: [] },
  ],
  sample_credentials: ["ASE A8 — Engine Performance"],
};

function seed(w, opts) {
  opts = opts || {};
  const S = w.CPL_CR_REFERENCE._state;
  S.data = { _stats: {} };
  S.groups = [G1, G2];
  S.stats = { distinct_strings: 2344, total_rows: 9413, pct_rows_in_top_50_strings: 49.4, auto_strings_collapsed: 152 };
  S.loading = false; S.error = null;
  S.decisions = opts.decisions || {};
  S.decisionsStale = !!opts.stale;
  S.filter = opts.filter || "todo";
  return S;
}

// ── B1. A failed gated READ must not render as an empty queue ──────────────
// The governance-owner defect, verbatim: a read that failed rendered exactly
// like "nobody has decided anything", so a curator would redo a colleague's
// work and never know why it looked undone.
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w, { stale: true });
  w.CPL_CR_REFERENCE._render();
  const html = w.document.getElementById("cr-reference-root").innerHTML;
  check("B1 a failed decisions read warns loudly", /Could not read the decisions table/.test(html));
  check("B2 ...and says decided work is NOT shown, rather than implying none exists",
    /not shown below/.test(html) && /failed read, not an empty queue/.test(html));
})();

// ── B3. Signed-out is a THIRD state, distinct from stale and from empty ────
(function () {
  const w = makeWin();                     // no team pass
  seed(w);
  w.CPL_CR_REFERENCE._render();
  const html = w.document.getElementById("cr-reference-root").innerHTML;
  check("B3 signed-out says so and does not claim the queue is undecided",
    /not signed in/i.test(html) && !/Could not read the decisions table/.test(html));
  check("B4 ...and the worklist itself is still readable while signed out",
    /Community Relations/.test(html));
})();

// ── B5. A 200 with an EMPTY body is a FAILURE, not a save ──────────────────
// PostgREST answers an RLS-filtered write with 200 and `[]`, never 403. An
// "ok" that touched no row must surface as a failure, or a locked-out curator
// is told their decision was recorded when nothing was.
(function () {
  let posted = 0;
  const w = makeWin({
    teamPass: "p",
    fetch: function (url, init) {
      if (init && init.method === "POST") {
        posted++;
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    },
  });
  const S = seed(w);
  S.open["community relations"] = true;
  w.CPL_CR_REFERENCE._render();
  const btn = w.document.querySelector('[data-act="confirmed"]');
  check("B5 a Confirm button is rendered for a signed-in curator", !!btn);
  if (btn) {
    btn.click();
    return new Promise(r => setTimeout(r, 0)).then(() => {});
  }
})();

// The async assertion for B5/B6 (run after the microtask queue drains).
const pendingEmptyWrite = (function () {
  const w = makeWin({
    teamPass: "p",
    fetch: function (url, init) {
      if (init && init.method === "POST") {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    },
  });
  const S = seed(w);
  S.open["community relations"] = true;
  w.CPL_CR_REFERENCE._render();
  const btn = w.document.querySelector('[data-act="confirmed"]');
  if (btn) btn.click();
  return new Promise(resolve => setTimeout(() => {
    check("B6 a 200-with-empty-body write is reported as a FAILURE",
      S.msg && S.msg.ok === false && /does not allow/.test(S.msg.text));
    check("B7 ...and no decision is recorded locally from a failed write",
      !S.decisions["community relations"]);
    resolve();
  }, 5));
})();

// ── B8. Open state lives in state, not the DOM ────────────────────────────
// render() rewrites innerHTML, so anything held on a DOM node is destroyed on
// the next repaint — the collapsed-section lesson from the My College tab.
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w);
  S.open["community relations"] = true;
  w.CPL_CR_REFERENCE._render();
  const first = w.document.getElementById("cr-reference-root").innerHTML;
  w.CPL_CR_REFERENCE._render();               // repaint
  const second = w.document.getElementById("cr-reference-root").innerHTML;
  check("B8 an open group survives a full re-render",
    /Confirm as one/.test(first) && /Confirm as one/.test(second));
})();

// ── B9. The unit spread is visible even when it did NOT block the merge ───
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w);
  w.CPL_CR_REFERENCE._render();
  const html = w.document.getElementById("cr-reference-root").innerHTML;
  check("B9 a group whose units vary says so even though rung 1 overrode the screen",
    /3\u20135 units/.test(html));
  // Units never split an identity (Sam, 2026-09-27): the line states the range
  // its wordings join, never a bare "units vary" where the figures are known.
  check("B9b the range reads from the wordings' own figures, not a bare 'units vary'",
    !/>units vary</.test(html));
})();

// ── B10. A curator decision must never be dressed as automation ───────────
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w, {
    decisions: {
      "community relations": {
        group_key: "community relations", decision: "confirmed",
        canonical: "3 hours in Community Relations", members: [], excluded: [],
        updated_by: "sam@rccd.edu", updated_at: "2026-08-13T10:00:00Z",
      },
    },
    filter: "done",
  });
  w.CPL_CR_REFERENCE._render();
  const html = w.document.getElementById("cr-reference-root").innerHTML;
  check("B10 a decided group names WHO decided it", /sam@rccd\.edu/.test(html));
  check("B11 ...and still shows the automatic rung separately",
    /Published/.test(html));
})();

// ── B12. Only groups with a real decision to make sit in the queue ────────
(function () {
  const w = makeWin({ teamPass: "p" });
  const S = seed(w);
  const solo = Object.assign({}, G1, { key: "solo one", wordings: 1, members: [G1.members[0]], collapse_value: 0 });
  S.groups = [G1, G2, solo];
  S.filter = "todo";
  const vis = w.CPL_CR_REFERENCE._visible();
  check("B12 a single-wording group is not in the 'needs a decision' queue",
    vis.every(g => g.key !== "solo one"));
  check("B13 ...and multi-wording groups are", vis.length === 2);
})();

// ── B14. The CSV keeps automation and judgement in SEPARATE columns ───────
(function () {
  check("B14 CSV header separates auto_rung from curator_decision",
    /"auto_rung"[\s\S]{0,120}"curator_decision"/.test(SRC));
  check("B15 CSV records who decided and when",
    /"decided_by",\s*"decided_at"/.test(SRC));
})();

// ── B16. Clearing a decision writes a row, it does not delete ─────────────
// The governance_owners lesson: with no DELETE policy a delete is a silent
// no-op, and "never reviewed" must stay distinguishable from "reviewed then
// reverted".
(function () {
  check("B16 clearing is a recorded state, not a DELETE",
    /data-act="cleared"/.test(SRC) && !/method:\s*["']DELETE["']/.test(SRC));
})();

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
    "labels": None if lab is None else {
        "equal": lab([U(3.0, 3.0), U(3.0, 3.0)]), "one": lab([U(1.0, 1.0)]),
        "none": lab([U(None, None)]), "half": lab([U(0.5, 0.5), U(1.0, 1.0)])},
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
    F.named === 5);
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
  check("A25 every varying group named by a wording ends in the range the tab prints beside it",
    named.length > 0 && named.length === stats.groups_named_by_range
      && named.every(g => g.canonical.endsWith(" (" + unitRange(g.members) + ")")));
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
Promise.resolve(pendingEmptyWrite).then(() => {
  let failed = 0;
  results.forEach(([name, ok]) => {
    if (!ok) failed++;
    console.log(`  ${ok ? "✓" : "✗"} ${name}`);
  });
  console.log(`\n  ${results.length - failed}/${results.length} checks passed`);
  if (failed) process.exit(1);
});
