#!/usr/bin/env python3
"""Build a standalone preview of the Common CR Reference's List view for a Claude artifact.

The List is the Catalog Commons' shared engine (commons_list.js, S542) with the CR Reference's spec (cr_reference.js).
The page runs both against kb/cr_reference_worklist.json, with First Light's tokens copied from index.html, so the link
shows what ships. Saves stay in the page: a shim answers the tab's cr_reference_decisions calls in memory (an empty table
to start, each save echoed back) and says so in a banner, so nothing reaches Supabase from the preview. The helpers are
the Exhibits List preview's (scripts/build_exhibits_list_preview.py).

    python3 scripts/build_cr_list_preview.py OUT.html

The output belongs outside the repo (the session scratchpad); the artifact holds it.
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from build_exhibits_list_preview import script_safe, token_css  # noqa: E402

SHIM = r"""
(function () {
  var WORKLIST = JSON.parse(document.getElementById("cr-data").textContent);
  var saved = [];
  function ok(body, status) {
    return Promise.resolve({ ok: true, status: status || 200, headers: { get: function () { return null; } },
      json: function () { return Promise.resolve(JSON.parse(JSON.stringify(body))); },
      text: function () { return Promise.resolve(JSON.stringify(body)); } });
  }
  window.fetch = function (url, init) {
    url = String(url); init = init || {};
    if (url.split("?")[0] === "kb/cr_reference_worklist.json") return ok(WORKLIST);
    if (/\/rest\/v1\/(cr_reference_decisions|kb_curation)/.test(url)) {
      if ((init.method || "GET") === "GET") return ok([]);
      var rows = [];
      try { rows = JSON.parse(init.body); } catch (e) {}
      saved.push(rows);
      var n = document.getElementById("pv-saved");
      if (n) n.textContent = saved.length + " save" + (saved.length === 1 ? "" : "s") + " kept in this page";
      return ok(rows, 201);
    }
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  // The tab reads a team phrase as a sign-in; the preview holds a stand-in so edits can be tried.
  try { localStorage.setItem("cpl_team_pass", "preview"); } catch (e) {}
  // A stand-in reviewer for the flag, which only a reviewer's sign-in sets; its saves stay in the page too.
  window.CPL_SESSION = { ensureFresh: function () { return Promise.resolve({ access_token: "preview.preview.preview", email: "preview@this-page" }); } };
  window.CPL_TABS = { loadScript: function (src, name, cb) { setTimeout(cb, 0); } };
  try { history.replaceState(null, "", "#cr-reference/list"); } catch (e) { location.hash = "cr-reference/list"; }
})();
"""

PAGE = """<meta charset="utf-8">
<title>CR Reference List</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap">
<style>
{tokens}
  /* The page around COBI's view: First Light's ground and type, the side gutter, nothing else. */
  body {{ font-family: 'Source Sans 3', Arial, sans-serif; background-color: var(--bg-off-white); color: var(--text-gray);
    line-height: 1.6; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
    padding-block: 12px 32px; }}
  .pv-banner {{ display: flex; flex-wrap: wrap; gap: 4px 16px; align-items: baseline; border: 1px solid var(--border);
    border-radius: 6px; padding: 6px 10px; margin: 0 0 10px; font-size: .8125rem; color: var(--text-body); background: var(--surface-opaque); }}
  .pv-banner strong {{ color: var(--text-strong); }}
  #cr-reference-root {{ min-width: 0; }}
  :focus-visible {{ outline: 2px solid var(--cobalt, currentColor); outline-offset: 2px; }}
  @media (prefers-reduced-motion: reduce) {{ * {{ transition: none !important; animation: none !important; }} }}
</style>
<p class="pv-banner" role="note"><strong>Preview of COBI's Common CR Reference List.</strong>
<span>The wordings as of the daily build. Edits work here, but saves stay in this page and reach nothing; reload to start over.</span>
<span id="pv-saved" class="pv-saved"></span></p>
<div id="tab-cr-reference" class="cpl-tab-pane"><div id="cr-reference-root">Loading the wordings…</div></div>
<script type="application/json" id="cr-data">{worklist}</script>
<script>{shim}</script>
<script>{commons_list}</script>
<script>{cr_reference}</script>
<script>window.CPL_CR_REFERENCE && window.CPL_CR_REFERENCE.activate();</script>
"""


def main(out):
    worklist = json.loads((ROOT / "kb" / "cr_reference_worklist.json").read_text(encoding="utf-8"))
    page = PAGE.format(
        tokens=token_css(),
        worklist=script_safe(json.dumps(worklist, ensure_ascii=False, separators=(",", ":"))),
        shim=SHIM,
        commons_list=script_safe((ROOT / "commons_list.js").read_text(encoding="utf-8")),
        cr_reference=script_safe((ROOT / "cr_reference.js").read_text(encoding="utf-8")),
    )
    pathlib.Path(out).write_text(page, encoding="utf-8")
    print("wrote %s (%.1f MB)" % (out, len(page.encode("utf-8")) / 1e6))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
