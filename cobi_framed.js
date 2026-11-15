/* cobi_framed.js — COBI inside a frame (S661, #3360).
 *
 * College Data Collection's side panel frames a college's CPL Pathways view (Sam, in session: the link on every
 * college row "brings it all into perspective, the vision made real"). A page opened with ?framed=1 hides COBI's
 * header, menu and the First Light welcome, so the frame shows the view alone; everything else runs as usual (the
 * same tab code, the same session in the same browser tab). Without ?framed=1 this file does nothing.
 * Tokens only; no storage. Guard: tests/commons_eta_clock.test.js (framed). */
(function () {
  "use strict";
  if (!/[?&]framed=1(&|$)/.test(String(location.search || ""))) return;
  document.documentElement.classList.add("cobi-framed");
  var s = document.createElement("style");
  s.id = "cobi-framed-css";
  s.textContent = [
    "html.cobi-framed .header, html.cobi-framed #cpl-hamburger, html.cobi-framed #cpl-sidebar, html.cobi-framed .cplfl-overlay { display:none !important; }",
    "html.cobi-framed .cpl-layout { display:block; }",
    "html.cobi-framed .cpl-main { margin:0 !important; padding:8px !important; max-width:none !important; }",
    "html.cobi-framed body { background:var(--surface, transparent); }"
  ].join("\n");
  (document.head || document.documentElement).appendChild(s);
})();
