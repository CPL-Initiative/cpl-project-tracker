#!/usr/bin/env python3
"""Build a standalone preview of the Exhibits tab's List view for a Claude artifact.

Sam, 2026-11-01: "can you publish the view as you're working on it so I can respond?" The page runs the real
exhibits.js against the data the tab reads (credential_reference_data.js, the kb/ files, college_lookup.js), with
First Light's light and dark tokens copied from index.html, so the link shows exactly what ships. Saves stay in the
page: a small shim answers the view's Supabase calls in memory and says so in a banner, so nothing reaches
kb_curation from the preview.

    python3 scripts/build_exhibits_list_preview.py OUT.html

The output is about 6 MB and belongs outside the repo (the session scratchpad); the artifact holds it. Publish it to
https://claude.ai/artifact/Qqcfxd9xkzdg91rkw6275A, the List mock's link.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
KB_FILES = [
    "kb/exhibits_review.json", "kb/exhibits_review_courses.json", "kb/exhibits_adoption.json",
    "kb/cred_rename_dryrun/collisions.json", "kb/exhibits_sweep.json", "kb/cer_procedures.json",
    "kb/cer_procedures_out/latest.json", "kb/exhibits_ai_sort.json",
]


def token_css():
    """index.html's :root token blocks: light, the prefers-color-scheme dark block, and data-theme dark."""
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    start = html.index("        :root {")
    end = html.index("        body {", start)
    return html[start:end]


def script_safe(text):
    return text.replace("</script", "<\\/script")


SHIM = r"""
(function () {
  var KB = JSON.parse(document.getElementById("kb-data").textContent);
  var saved = [];
  function ok(body, status) {
    return Promise.resolve({ ok: true, status: status || 200, headers: { get: function () { return null; } },
      json: function () { return Promise.resolve(JSON.parse(JSON.stringify(body))); },
      text: function () { return Promise.resolve(JSON.stringify(body)); } });
  }
  window.fetch = function (url, init) {
    url = String(url); init = init || {};
    var path = url.split("?")[0];
    if (Object.prototype.hasOwnProperty.call(KB, path)) return ok(KB[path]);
    if (/\/rest\/v1\//.test(url)) {
      if ((init.method || "GET") === "GET") return ok([]);
      try { saved.push(JSON.parse(init.body)); } catch (e) {}
      var n = document.getElementById("pv-saved");
      if (n) n.textContent = saved.length + " save" + (saved.length === 1 ? "" : "s") + " kept in this page";
      return ok(null, 201);
    }
    return Promise.resolve({ ok: false, status: 404, json: function () { return Promise.resolve({}); } });
  };
  var sess = { access_token: "preview.preview.preview", email: "preview@this-page" };
  window.CPL_SESSION = { ensureFresh: function () { return Promise.resolve(sess); },
    authHeaders: function () { return { apikey: "preview", Authorization: "Bearer preview" }; } };
  window.CPL_TABS = { loadScript: function (src, name, cb) { setTimeout(cb, 0); } };
  if (!location.hash || location.hash.indexOf("#exhibits") !== 0) {
    try { history.replaceState(null, "", "#exhibits/list"); } catch (e) { location.hash = "exhibits/list"; }
  }
})();
"""

PAGE = """<meta charset="utf-8">
<title>Exhibits List</title>
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
  #exhibits-root {{ min-width: 0; }}
  :focus-visible {{ outline: 2px solid var(--cobalt, currentColor); outline-offset: 2px; }}
  @media (prefers-reduced-motion: reduce) {{ * {{ transition: none !important; animation: none !important; }} }}
</style>
<p class="pv-banner" role="note"><strong>Preview of COBI's Exhibits List.</strong>
<span>The credentials as of the daily run of {generated}. Edits and find and replace work here, but saves stay in this page and reach nothing; reload to start over.</span>
<span id="pv-saved" class="pv-saved"></span></p>
<div id="exhibits-root">Loading the credentials…</div>
<script type="application/json" id="kb-data">{kb}</script>
<script>{lookup}</script>
<script>{credref}</script>
<script>{shim}</script>
<script>{exhibits}</script>
<script>window.CPL_EXHIBITS && window.CPL_EXHIBITS.boot && window.CPL_EXHIBITS.boot();</script>
"""


def main(out):
    kb = {}
    for rel in KB_FILES:
        p = ROOT / rel
        if p.exists():
            kb[rel] = json.loads(p.read_text(encoding="utf-8"))
    credref = (ROOT / "credential_reference_data.js").read_text(encoding="utf-8")
    m = re.search(r'"_generated_at"\s*:\s*"([^"]+)"', credref)
    generated = m.group(1)[:16].replace("T", " ") + " UTC" if m else "the last daily run"
    page = PAGE.format(
        tokens=token_css(),
        generated=generated,
        kb=script_safe(json.dumps(kb, ensure_ascii=False, separators=(",", ":"))),
        lookup=script_safe((ROOT / "college_lookup.js").read_text(encoding="utf-8")),
        credref=script_safe(credref),
        shim=SHIM,
        exhibits=script_safe((ROOT / "exhibits.js").read_text(encoding="utf-8")),
    )
    pathlib.Path(out).write_text(page, encoding="utf-8")
    print(f"wrote {out} ({len(page.encode('utf-8')) / 1e6:.1f} MB)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
