// Every ../_shared/<file> an Edge Function imports is named in cpl-chat-deploy.yml's SHARED CODE comment.
//
// Why: the comment is where a person learns that a change to a shared file needs every function that imports it
// deployed. When program-requirements-extract began importing _shared/service_caller.mjs, the comment still said
// _shared held group_queue.mjs alone, so a change to the caller check read as touching nothing deployed. The deploy
// itself bundles whatever a function imports; this guards the reader's map of it.
//
// Run: node tests/shared_imports_named.test.js
const fs = require("fs");
const path = require("path");

const results = [];
function check(name, cond, why) { results.push([name, !!cond, why]); }

const FN_DIR = "chatbox/supabase/functions";
const DEPLOY = fs.readFileSync(".github/workflows/cpl-chat-deploy.yml", "utf8");

// The SHARED CODE block: from its heading to the first line that is not a comment.
function sharedComment(yml) {
  const lines = yml.split("\n");
  const start = lines.findIndex((l) => /^#\s*SHARED CODE/.test(l));
  if (start < 0) return "";
  const out = [];
  for (let i = start; i < lines.length && /^#/.test(lines[i]); i++) out.push(lines[i]);
  return out.join("\n");
}

// Every quoted "../_shared/<file>" in a function's own source (the shared folder itself is not a function).
function sharedImports(root) {
  const found = new Map();
  for (const fn of fs.readdirSync(root)) {
    if (fn.startsWith("_")) continue;
    const dir = path.join(root, fn);
    if (!fs.statSync(dir).isDirectory()) continue;
    (function walk(d) {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) { walk(p); continue; }
        if (!/\.(ts|mts|js|mjs)$/.test(f)) continue;
        const src = fs.readFileSync(p, "utf8");
        for (const m of src.matchAll(/["']\.\.\/_shared\/([A-Za-z0-9_.-]+)["']/g)) {
          if (!found.has(m[1])) found.set(m[1], new Set());
          found.get(m[1]).add(fn);
        }
      }
    })(dir);
  }
  return found;
}

const comment = sharedComment(DEPLOY);
check("cpl-chat-deploy.yml carries a SHARED CODE comment", comment.length > 0);

const imports = sharedImports(FN_DIR);
check("at least one function imports a _shared file (the scan reads the functions)", imports.size > 0);
for (const [file, fns] of imports) {
  check("the SHARED CODE comment names _shared/" + file, comment.includes(file),
    "imported by " + [...fns].join(", ") + "; name it, and its importers, in the comment");
  for (const fn of fns) {
    check("the SHARED CODE comment names " + fn + " as importing " + file, comment.includes(fn),
      "add " + fn + " to the comment");
  }
  check("_shared/" + file + " exists", fs.existsSync(path.join(FN_DIR, "_shared", file)));
}

// The scan catches an unnamed import: a planted function importing a file the comment does not name.
const os = require("os");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "shared-imports-"));
try {
  fs.mkdirSync(path.join(tmp, "planted-fn"));
  fs.writeFileSync(path.join(tmp, "planted-fn", "index.ts"), 'import { x } from "../_shared/planted_helper.mjs";\n');
  const got = sharedImports(tmp);
  check("a planted import of an unnamed _shared file is found and is not in the comment",
    got.has("planted_helper.mjs") && !comment.includes("planted_helper.mjs"));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

let failed = 0;
results.forEach(function (r) {
  if (!r[1]) failed++;
  console.log((r[1] ? "ok   " : "FAIL ") + r[0] + (r[1] || !r[2] ? "" : "\n       " + r[2]));
});
console.log("\nshared_imports_named.test.js: " + (results.length - failed) + "/" + results.length + " checks passed");
process.exit(failed ? 1 : 0);
