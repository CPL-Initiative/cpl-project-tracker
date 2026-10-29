#!/usr/bin/env node
// funding-model/faq.json: the CPL funding FAQ as the public page shows it, for Sierra.
//
// Sam, 2026-10-29: "can you ensure that sierra has access to the FAQs so she could
// answer consistently?" The FAQ lives in cpl_funding.js as FAQ_DEFAULT_PLAIN (the
// house text the page and the tab render) and, once a curator edits it on the page,
// as the published scenario's text.x_faq in cpl_funding_config. This files the house
// text, its groups and its questions; Sierra (cpl-chat's FUNDING FAQ BLOCK) reads this
// file from GitHub Pages and prefers a curator's saved edit when the config holds one.
//
//   node scripts/build_funding_faq.js          writes funding-model/faq.json
//   node scripts/build_funding_faq.js --check  exits 1 when the file is behind the source
//
// The parse is the page's own rule (faqPairs in cpl_funding.js): a paragraph opening
// "## " names a group, one opening "Q:" starts a question, and the paragraphs after it
// are its answer.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "funding-model", "faq.json");
const PAGE = "https://cpl-initiative.github.io/cpl-project-tracker/funding-model/#questions";

function housePlain() {
  const src = fs.readFileSync(path.join(ROOT, "cpl_funding.js"), "utf8");
  const a = src.indexOf("var FAQ_DEFAULT_PLAIN = [");
  const b = a < 0 ? -1 : src.indexOf('].join("\\n\\n");', a);
  if (a < 0 || b < 0) throw new Error("FAQ_DEFAULT_PLAIN not found in cpl_funding.js");
  const list = vm.runInNewContext(src.slice(a + "var FAQ_DEFAULT_PLAIN = ".length, b + 1));
  if (!Array.isArray(list) || !list.every((x) => typeof x === "string")) throw new Error("FAQ_DEFAULT_PLAIN is not a list of strings");
  return list.join("\n\n");
}

function parse(plain) {
  const groups = [];
  let grp = null, cur = null;
  for (const para of String(plain).split(/\n\n/).map((p) => p.trim()).filter(Boolean)) {
    if (/^##\s+/.test(para) && para.indexOf("\n") < 0) { grp = { name: para.replace(/^##\s+/, "").trim(), items: [] }; groups.push(grp); cur = null; }
    else if (/^Q:\s*/i.test(para)) {
      cur = { q: para.replace(/^Q:\s*/i, ""), a: [] };
      if (!grp) { grp = { name: "", items: [] }; groups.push(grp); }
      grp.items.push(cur);
    } else if (cur) cur.a.push(para);
  }
  return groups.filter((g) => g.items.length).map((g) => ({ name: g.name, items: g.items.map((it) => ({ q: it.q, a: it.a.join("\n\n") })) }));
}

function build() {
  const plain = housePlain();
  const groups = parse(plain);
  return JSON.stringify({
    about: "The CPL funding FAQ as the public CPL funding page shows it (the house text in cpl_funding.js). Built by scripts/build_funding_faq.js; Sierra reads it.",
    page: PAGE,
    questions: groups.reduce((n, g) => n + g.items.length, 0),
    plain,
    groups,
  }, null, 2) + "\n";
}

if (require.main === module) {
  const want = build();
  if (process.argv.includes("--check")) {
    const have = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
    if (have !== want) { console.error("funding-model/faq.json is behind cpl_funding.js: run node scripts/build_funding_faq.js"); process.exit(1); }
    console.log("funding-model/faq.json is current");
  } else {
    fs.writeFileSync(OUT, want);
    console.log("wrote funding-model/faq.json");
  }
}
module.exports = { build, parse, housePlain };
