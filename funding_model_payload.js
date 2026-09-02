/* ============================================================================
   The funding explainer's PAYLOAD — every figure the "How this funding model
   works" page prints, computed by cpl_funding.js's own engine.

   SHARED ON PURPOSE. Two things build this page: the Node script that publishes
   the snapshot artifact, and the live page served from GitHub Pages. If each
   built its own payload they would drift, and the drift would be invisible —
   the same failure that put a hand-typed "$5,060" and "four noncredit campuses"
   into an audience-facing document. One function, two callers.

   Takes the booted tab module (window.CPL_FUNDING_TAB) and its data
   (window.CPL_FUNDING). Pure: reads the engine, writes nothing.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CPL_FUNDING_EXPLAINER = factory();
}(typeof self !== "undefined" ? self : this, function () {
  function buildPayload(T, D) {
    const pool = function (k) { return Number(T._pool(k)); };
    const model = T._model();

  // One row per INSTITUTION under one pool (2026-08-31): name, district,
  // combined FTES, the one combined max award, and the two flags the page
  // marks — brought up to the base and held at the cap. (Index 5 is a retired
  // rural flag, kept as 0 so the row shape and the page's r[6] index stay
  // stable; drop both together if the rows are ever renumbered.)
  const trio = ["NOCE", "SD Cont. Ed", "Calbright"];
  const rows = D.colleges.map(function (c) {
    const a = T._alloc(c.college);
    // display cell: the roster's display alias when one exists (the college
    // KEY stays the lookup everywhere else)
    return [c.display || c.college, c.district || "",
            Math.round((c.credit_ftes || 0) + (c.noncredit_ftes || 0)), Math.round(a.total),
            a.floored ? 1 : 0, 0, a.capped ? 1 : 0];
  }).concat(trio.map(function (k) {
    const a = T._alloc(k);
    if (!a) return null;
    const f = (D.feeders || []).filter(function (x) { return x.short === k; })[0] || {};
    const ftes = Number(f.noncredit_ftes_placeholder || f.noncredit_ftes) || 0;
    return [k, "", Math.round(ftes), Math.round(a.total),
            a.floored ? 1 : 0, 0, a.capped ? 1 : 0];
  }).filter(Boolean)).sort(function (x, y) {
    // Six colleges now TIE at the ceiling, so the offer alone no longer orders
    // the table — fall back to size, which is what a reader expects to see and
    // what explains why those six are the ones held.
    return (y[3] - x[3]) || (y[2] - x[2]);
  });

  // The statewide allocation basis: the SAME per-institution figure the rows
  // carry (credit + noncredit, placeholder-aware for the trio), summed. Derived
  // from `rows` rather than recomputed, so the denominator and the numerators a
  // reader compares it against cannot drift apart.
  // ⚠ Summed UNROUNDED, then rounded once. Summing the rows' already-rounded
  // cells gave 1,151,175 against the tab's 1,151,171 — four FTES of accumulated
  // rounding, and a reader comparing the two surfaces has no way to know which
  // is right or that the gap is meaningless. Same source, same order of
  // operations as the tab.
  const basisTotal = Math.round(
    D.colleges.reduce(function (s, c) {
      return s + (Number(c.credit_ftes) || 0) + (Number(c.noncredit_ftes) || 0);
    }, 0) +
    trio.reduce(function (s, k) {
      const f = (D.feeders || []).filter(function (x) { return x.short === k; })[0] || {};
      return s + (Number(f.noncredit_ftes_placeholder || f.noncredit_ftes) || 0);
    }, 0));
  // Rows carry the DISPLAY alias; _alloc keys on the college. One map, so a
  // renamed college does not silently lose its allocation lookup.
  const nameToKey = {};
  D.colleges.forEach(function (c) { if (c.display) nameToKey[c.display] = c.college; });

  // The worked example must be a college whose offer is NOT bent by either bound
  // — the whole point of the walk-through is that the arithmetic on the page
  // produces the figure on the page. It used to be simply the largest college,
  // which was safe while the floor was the only bound (the floor never touches
  // the top). Sam's $400K MAXIMUM (2026-08-22) does, so the largest college is
  // now pinned to a round number its own share does not explain, and walking
  // through it would show a subtraction the reader cannot reproduce.
  const unbound = rows.filter(function (r) { return !r[4] && !r[6]; });
  const example = (unbound[0] || rows[0])[0];
  const prios = T._prios(example, "1").map(function (p) {
    return { label: p.label, title: p.title || "", metric: p.metric, share: p.share,
             factor: p.factor == null ? 1 : p.factor,
             cap: Math.round(p.cap), target: +p.target.toFixed(1) };
  });

  // The effective rate an UNBOUND college earns at, measured off the model rather
  // than derived by hand: its whole window offer over the sum of its window
  // targets. The page used to carry this as a typed $5,060 — a figure that was
  // correct when written and silently wrong after any dial moved.
  const effRate = (function () {
    const name = (unbound[0] || rows[0])[0];
    const a = T._alloc(name);
    let money = 0, target = 0;
    Object.keys(a).filter(function (k) { return /_heads$/.test(k); }).forEach(function (k) {
      money += a[k.replace(/_heads$/, "")] || 0;
      target += a[k] || 0;
    });
    return target > 0 ? money / target : 0;
  })();

  const totals = rows.map(function (r) { return r[3]; }).slice().sort(function (a, b) { return a - b; });
  // AVERAGE and MEDIAN are both emitted and both used, because they differ by
  // $43,614 here and the gap is the point: a handful of very large colleges pull
  // the average well above what a typical college actually sees. Labelling one
  // with the other's number would state a false figure.
  const avg = Math.round(totals.reduce(function (s, v) { return s + v; }, 0) / totals.length);
   const payload = {
    pool: { one_time: pool("one_time_2026_27"), admin: pool("admin_cost"),
            scaling: pool("scaling_projects_tech"),
            floor: pool("floor_window"),
            cap: pool("cap_window"), rate: pool("ftes_rate_2026_27") },
    net_main: Math.round(T._netCollege()),
    // The noncredit DECOMPOSITION under one pool (2026-08-31). Emitted so the
    // page can STATE it rather than have a writer describe it — a hand-typed
    // count is exactly the thing that goes stale without anyone noticing.
    nc: (function () {
      const e = T._effective();
      const trioAwards = trio.map(function (k) {
        const a = T._alloc(k);
        return { name: k, total: a ? Math.round(a.total) : 0 };
      });
      const ncColleges = D.colleges.filter(function (c) {
        return (Number(c.noncredit_ftes) || 0) > 0;
      }).length;
      return {
        collegeShares: Math.round(e.pool.nc_college_shares),
        trioHeld: Math.round(e.pool.nc_only_held_by_origination),
        face: Math.round(e.pool.nc_college_shares + e.pool.nc_only_held_by_origination),
        trio: trioAwards,
        ncColleges: ncColleges,
        institutions: e.pool.institutions
      };
    })(),
    model: { floor: model.floor, floorCount: model.floorCount, floorCost: Math.round(model.floorCost),
             cap: model.cap, cappedCount: model.cappedCount, capReleased: Math.round(model.capReleased) },
    median: totals[Math.floor(totals.length / 2)],
    avg: avg,
    min: totals[0],
    max: totals[totals.length - 1],
    maxName: rows[0][0],
    atMin: rows.filter(function (r) { return r[4]; }).length,
    atMax: rows.filter(function (r) { return r[6]; }).length,
    exampleName: example,
    // The two illustration cards. They used to be hand-typed HTML and TWO of their
    // four figures were already stale by 2026-08-22 (the largest college's share,
    // and the smallest college's, both computed against a retired pool). Every
    // number a reader can check must come from the engine, so they are emitted.
    // ⚠ SIZED ON THE COMBINED BASIS, over the WHOLE roster (2026-09-01). Until
    // now these two cards sorted and divided by `credit_ftes` across
    // `D.colleges` alone — the two-lane basis the one-pool model retired on
    // 2026-08-31. So a reader checking the walk-through got a percentage
    // computed against 1,069,182 credit FTES over 115 colleges while every
    // other figure on the page, and the model itself, divides by the combined
    // credit + noncredit basis over 118 institutions. The cards agreed with
    // nothing and looked arithmetically fine.
    //
    // They are built FROM `rows` now, which is the same array the every-college
    // table draws, so the size a reader sees in a card and the size in the table
    // are one number by construction rather than by two computations agreeing.
    //
    // ⚠ Colleges only, deliberately. Ranking the full roster would put a
    // noncredit-only campus at one end, and Calbright's is a stand-in figure
    // that never publishes (N3 a) — so the illustration stays on the 115 while
    // the BASIS it divides by stays the statewide combined total.
    cards: (function () {
      const collegeRows = rows.filter(function (r) { return r[1]; });   // districted = a college
      const bySize = collegeRows.slice().sort(function (a, b) { return b[2] - a[2]; });
      const net = T._netCollege();
      if (!bySize.length || !basisTotal) return [];
      return [bySize[0], bySize[bySize.length - 1]].map(function (r, i) {
        const a = T._alloc(r[0]) || T._alloc(nameToKey[r[0]] || r[0]) || {};
        return { name: r[0], role: i === 0 ? "The largest college" : "The smallest college",
                 ftes: r[2],
                 pct: +(r[2] / basisTotal * 100).toFixed(1),
                 share: Math.round(r[2] / basisTotal * net),
                 offered: r[3], floored: !!r[4], capped: !!r[6] };
      });
    })(),
    // The statewide denominator every proportional share on the page divides by,
    // and the roster it is summed over. Emitted because the page STATED both as
    // typed prose ("all 115 … 1,069,182") and neither moved when the basis did.
    basis: { total: basisTotal, institutions: rows.length,
             colleges: rows.filter(function (r) { return r[1]; }).length },
    effRate: Math.round(effRate),
    prios: prios,
    rows: rows,
  };
    return payload;
  }
  return { buildPayload: buildPayload };
}));
