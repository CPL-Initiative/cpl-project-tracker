// The page the Exhibits and Common Exhibit Reference tabs run in loads combine_guard.js before either tab's script
// (CPL_Dashboard.html, index.html). A jsdom harness does the same with install(w, types): it evaluates the module in
// the window and serves the CPL types file the guard reads. `types` is the file's body, or 404 to leave the harness's
// own fetch to answer it (a test about the guard passes its own file or a 404). Left out, the harness's own answer
// stands when it holds CPL types; otherwise the guard reads a file that types every title in the page's
// CPL_CREDENTIAL_REFERENCE data as one cert-based type, so a merge in a test that is not about the guard goes through
// (the guard holds a title with no type). Call it after the harness sets w.fetch.
const fs = require("fs");
const path = require("path");

const SRC = fs.readFileSync(path.join(__dirname, "..", "..", "combine_guard.js"), "utf8");
const URL = "kb/exhibit_left_map.json";

function answer(body) {
  const copy = JSON.stringify(body);
  return { ok: true, status: 200, json: function () { return Promise.resolve(JSON.parse(copy)); } };
}
// Every title the page's reference data holds, one cert-based type.
function oneGroup(w) {
  const canonicals = {};
  (((w.CPL_CREDENTIAL_REFERENCE || {}).unified_titles) || []).forEach(function (r) {
    canonicals[r.ut] = { type: "Industry Certification", group: "cert" };
  });
  return { schema: 1, titles: {}, canonicals: canonicals };
}

function install(w, types) {
  const inner = w.fetch;
  w.fetch = function (url, init) {
    if (String(url) !== URL || types === 404) return inner.apply(this, arguments);
    if (types) return Promise.resolve(answer(types));
    return Promise.resolve(inner ? inner.call(w, url, init) : null).then(function (r) {
      if (!r || !r.ok) return answer(oneGroup(w));
      return Promise.resolve(r.json()).then(function (j) { return answer(j && j.canonicals ? j : oneGroup(w)); },
        function () { return answer(oneGroup(w)); });
    });
  };
  const s = w.document.createElement("script");
  s.textContent = SRC;
  w.document.body.appendChild(s);
  return w.CPL_COMBINE_GUARD;
}

module.exports = { install: install, SRC: SRC, URL: URL };
