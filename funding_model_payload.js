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

  // One row per college: name, district, credit FTES, two-year offer, and the two
  // flags the page marks — lifted to the minimum and held to the maximum. (Index 5
  // is a retired rural flag, kept as 0 so the row shape and the page's r[6] index
  // stay stable; drop both together if the rows are ever renumbered.)
  const rows = D.colleges.map(function (c) {
    const a = T._alloc(c.college);
    return [c.college, c.district || "", Math.round(c.credit_ftes || 0), Math.round(a.total),
            a.floored ? 1 : 0, 0, a.capped ? 1 : 0];
  }).sort(function (x, y) {
    // Six colleges now TIE at the ceiling, so the offer alone no longer orders
    // the table — fall back to size, which is what a reader expects to see and
    // what explains why those six are the ones held.
    return (y[3] - x[3]) || (y[2] - x[2]);
  });

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
            scaling: pool("scaling_projects_tech"), feeder: pool("feeder_carveout"),
            floor: pool("floor_window"),
            cap: pool("cap_window"), rate: pool("ftes_rate_2026_27") },
    net_main: Math.round(T._netCollege()),
    // The noncredit lane (2026-08-23). Emitted so the page can STATE it rather
    // than have a writer describe it: the "four noncredit campuses" sentence in
    // this document was true until the lane became 33 institutions, 30 of them
    // credit colleges running their own noncredit programs, and a hand-typed
    // count is exactly the thing that goes stale without anyone noticing.
    nc: (function () {
      const n = T._ncModel();
      return { pool: Math.round(n.pool), threshold: Math.round(n.threshold),
               floor: Math.round(n.floor), cap: Math.round(n.cap),
               count: n.rows.length,
               colleges: n.rows.filter(function (r) { return r.kind === "college"; }).length,
               standalone: n.rows.filter(function (r) { return r.kind === "standalone"; }).length,
               floorCount: n.floorCount, breakEven: Math.round(n.breakEven),
               // A minimum the carve-out cannot honor must travel INTO the
               // document. Without it the explainer states the dial's figure as
               // the amount each institution receives, which is the exact claim
               // #1302 stopped the tab from making — and it is worse here,
               // because this page is the thing a reader is sent to when they
               // want to check the arithmetic.
               floorInfeasible: !!n.floorInfeasible,
               floorDemanded: Math.round(n.floorDemanded || 0),
               perInstitution: n.rows.length ? Math.round(n.pool / n.rows.length) : 0 };
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
    cards: (function () {
      const bySize = D.colleges.slice().sort(function (a, b) { return (b.credit_ftes || 0) - (a.credit_ftes || 0); });
      const totFtes = D.colleges.reduce(function (s, c) { return s + (c.credit_ftes || 0); }, 0);
      const net = T._netCollege();
      return [bySize[0], bySize[bySize.length - 1]].map(function (c, i) {
        const a = T._alloc(c.college);
        return { name: c.college, role: i === 0 ? "The largest college" : "The smallest college",
                 ftes: Math.round(c.credit_ftes || 0),
                 pct: +((c.credit_ftes || 0) / totFtes * 100).toFixed(1),
                 share: Math.round((c.credit_ftes || 0) / totFtes * net),
                 offered: Math.round(a.total), floored: !!a.floored, capped: !!a.capped };
      });
    })(),
    effRate: Math.round(effRate),
    prios: prios,
    rows: rows,
  };
    return payload;
  }
  return { buildPayload: buildPayload };
}));
