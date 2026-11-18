/* cobi_framed.js — COBI inside a frame (S661, #3360).
 *
 * College Data Collection's side panel frames a college's CPL Pathways view (Sam, in session: the link on every
 * college row "brings it all into perspective, the vision made real"). A page opened with ?framed=1 hides COBI's
 * header, menu and the First Light welcome, so the frame shows the view alone; everything else runs as usual (the
 * same tab code, the same session in the same browser tab). Without ?framed=1, or outside a same-origin frame, this
 * file does nothing. The page around the frame keeps the sign-in fresh; cpl_session.js only reads it here.
 * Tokens only; no storage. Guard: tests/commons_eta_clock.test.js (framed). */
(function () {
  "use strict";
  /* Only inside a same-origin frame (COBIx on #3373): ?framed=1 opened at the top, or by another site's frame, keeps
     COBI's header and menu, so a reader always has a way out. */
  var inFrame = false;
  try { inFrame = window.self !== window.top && window.top.location.origin === location.origin; } catch (e) { inFrame = false; }
  if (!inFrame || !/[?&]framed=1(&|$)/.test(String(location.search || ""))) return;
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
  /* A link to another tab opens in the page around the frame, so a second panel never nests inside this one; a link
     within the framed tab stays here (COBIx on #3373). */
  var own = String(location.hash || "").replace(/^#/, "").split("/")[0];
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || a.target === "_blank") return;
    var h = a.getAttribute("href") || "";
    if (h.charAt(0) !== "#" || h.slice(1).split("/")[0] === own) return;
    e.preventDefault();
    try { window.top.location.hash = h; } catch (er) { /* the frame keeps the click */ }
  }, true);
})();
