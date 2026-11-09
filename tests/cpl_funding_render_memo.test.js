// tests/cpl_funding_render_memo.test.js
//
// priorities() and totalSize() remember their answer only while render() runs
// (S613, COBIx #2927 item 3). A render asked for the same priorities once per
// college: 69% of a funding test's time, measured (cpl_funding_cap 42s, then
// 15s). The failure this guards is a stale read: an edit, then a figure read
// before the next render, must see the edit. And a caller that alters its
// copy must not alter the next caller's.
const { check, freshDom, boot, D, consumerSrc, finish } = require("./lib/cpl_funding_harness.js");

// Static: where the memo is allowed to live, and where it must empty.
check("render() runs inside the memo scope", /function render\(\) \{ return withMemo\(renderNow\); \}/.test(consumerSrc));
check("persistActive() empties the memo before it saves or redraws",
  /function persistActive\(\) \{\s*resetMemo\(\);/.test(consumerSrc));
const body = consumerSrc.slice(consumerSrc.indexOf("function renderNow()"), consumerSrc.indexOf("function renderNow()") + 4000);
check("both of render's cache clears empty the memo too",
  (body.match(/_earnCache = null; resetMemo\(\);/g) || []).length === 2);

const dom = freshDom();
const w = dom.window;
boot(w);
const T = w.CPL_FUNDING_TAB;
check("no memo is active between renders", T._memoActive() === false);

// Inside one scope: copies, never the remembered objects.
const pr = T._memoProbe("1");
check("the memo is active inside its scope", pr.active === true);
check("a caller's change to its copy does not reach the next caller",
  pr.again[0].share === pr.fresh[0].share && pr.again[0].share !== -1);
check("nor does a change to its strategies list",
  JSON.stringify(pr.again[0].strategies) === JSON.stringify(pr.fresh[0].strategies));
check("the remembered answer equals the uncached one",
  JSON.stringify(pr.again) === JSON.stringify(pr.fresh));
check("the scope closes after the probe", T._memoActive() === false);

// An edit, then a read before any render: the read sees the edit.
const name = (D.colleges || []).map((c) => c.college).find((n) => { const a = T._alloc(n); return a && a.total > 0; });
check("a college with an award to measure", !!name);
const before = T._alloc(name).total;
const s0 = Number(D.year_priorities["1"][0].share) || 0;
T._setScenario({ yearPriorities: { "1": { 0: { share: s0 + 0.2 } } } });
const after = T._alloc(name).total;
check("an edit read before the next render moves the award", after !== before);
T.render();
check("the render agrees with the read before it", Math.abs(T._alloc(name).total - after) < 1e-6);
check("no memo is left behind by a render", T._memoActive() === false);

finish();
