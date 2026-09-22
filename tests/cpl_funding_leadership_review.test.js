// CPL Implementation Funding — the leadership-review pass (Sam, 2026-09-22).
//
// Sam's last content edits before he reviews the tab with CO leadership. Each
// check guards one of his asks against the edit that would quietly undo it:
//
//   1. The Summary leads with the total allocated and ends on local
//      confirmation; the reserve bullet folds into it; a base-and-cap bullet
//      states the equity lever. No bullet sets a claim against its opposite.
//   2. The statewide lines in the Funding Breakdown read in black ink, and the
//      word "deducted" is gone.
//   3. A designated project's register update folds under its title, closed.
//   4. The institution table's notes are one sources line.
//   5. The explainer page heads its folds with text, never "Step one".
//
// Run from repo root: `npm test` (or `node tests/cpl_funding_leadership_review.test.js`).
const fs = require("fs");
const path = require("path");
const { check, freshDom, boot, finish } = require("./lib/cpl_funding_harness.js");

const SRC = fs.readFileSync(path.join(__dirname, "..", "cpl_funding.js"), "utf8");

function registerStub() {
  return {
    projects: [
      { id: "1.4", name: "California Credential Registry", activity: "Activity 1: AI-Enhanced CPL Infrastructure",
        status: "Foundational Year", pct: 15, update: "Planning session with LWDA and WestEd.", update_date: "2026-06-29" },
      { id: "4.2", name: "Apprenticeship Sprint", activity: "Activity 4: Field Engagement",
        status: "In Progress", pct: 35, update: "", update_date: "" },
      { id: "3.5", name: "Student Stories", activity: "Activity 3: Outcomes",
        status: "On Track", pct: 64, update: "", update_date: "" },
    ],
  };
}

{
  const { window } = freshDom();
  window.CPL_DATA = registerStub();
  const doc = boot(window);

  // ── 1. the Summary ──────────────────────────────────────────────────────
  const sum = doc.querySelector(".cplfund-summary");
  const items = sum ? Array.from(sum.querySelectorAll("li")).map((li) => li.textContent.replace(/\s+/g, " ")) : [];
  const alloc = items.find((t) => /^\$[\d,]+ allocated to \d+ institutions\./.test(t));
  check("1a: a bullet opens on the total allocated", !!alloc);
  check("1b: ...and ends on local confirmation",
    !!alloc && /Each institution receives its demonstrated funding once it confirms local participation\.$/.test(alloc));
  check("1c: the reserve bullet is folded in, and the old 'demonstrated so far' lead is gone",
    !items.some((t) => /held in reserve|demonstrated so far|never redistributed/.test(t)));
  check("1d: the noncredit bullet names every noncredit program, the three standalone ones among them",
    items.some((t) => /supports noncredit CPL at every institution with a noncredit program/.test(t) &&
      /noncredit-only institutions/.test(t)));
  check("1e: a base-and-cap bullet states the equity lever with the model's own counts",
    items.some((t) => /base and a \$[\d,]+ cap extend the funding equitably/.test(t) &&
      /The base brings \d+ smaller institutions up to a sustainable award/.test(t) &&
      /the cap holds \d+ of the largest/.test(t)));

  // ── 2. the Funding Breakdown ────────────────────────────────────────────
  const pools = doc.querySelector('details.cplfund-sec[data-sec="pools"]');
  check("2a: no statewide line reads 'deducted'", !!pools && !/deducted/.test(pools.textContent));
  check("2b: the projects line says college partners carry the work",
    !!pools && /statewide projects, many carried out with college partners/.test(pools.textContent));
  check("2c: a statewide line's figure takes the strong text ink, never the alert red",
    /"\.cplfund-card \.v\.neg \{ color: var\(--text-strong\); \}"/.test(SRC) &&
    !/"\.cplfund-card \.v\.neg \{ color: var\(--red-alert\)/.test(SRC));

  // ── 3. project updates fold under the title ─────────────────────────────
  const folds = Array.from(doc.querySelectorAll(".cplfund-rprio-fold"));
  check("3a: a project with a register update folds it under the project title",
    folds.length > 0 && folds.every((d) => !!d.querySelector("summary .cplfund-rprio-nm") &&
      !!d.querySelector(".cplfund-rprio-upd")));
  check("3b: ...closed by default", folds.length > 0 && folds.every((d) => !d.open));
  check("3c: a project with no update carries no empty fold",
    Array.from(doc.querySelectorAll(".cplfund-rprio-p")).some((li) => !li.querySelector("details")));

  // ── 4. the sources line ─────────────────────────────────────────────────
  const foot = doc.querySelector('details.cplfund-sec[data-sec="college"] .cplfund-foot');
  check("4a: the table's notes are ONE sources line",
    !!foot && foot.children.length === 1 && /^Sources: /.test(foot.textContent.trim()));
  check("4b: ...its links take the page's link ink",
    /"\.cplfund-sec > summary a, \.cplfund-foot a \{ color: var\(--accent-link, var\(--cobalt\)\);/.test(SRC));
}

// ── 5. the explainer's fold headers ───────────────────────────────────────
{
  const html = fs.readFileSync(path.join(__dirname, "..", "funding-model", "index.html"), "utf8");
  check("5a: no fold on the explainer carries a 'Step' label",
    !/class="step-no"/.test(html) && !/>Step (one|two|three|four)</i.test(html));
  const folds = html.match(/<details class="fold">\s*<summary>\s*<h2>[^<]+<\/h2>/g) || [];
  check("5b: every fold opens on its text heading", folds.length >= 5);
}

finish();
