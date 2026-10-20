// Shared by the Common Exhibit Reference tests (not itself a test: run.js
// reads only *.test.js).
//
// Since S413 the tab's lanes sit under its views (Progress · Needs you ·
// Procedures · Reference since S436), and only the view in use paints its lanes. A test reaches a lane
// the way a person does: it opens the view that holds the lane, then finds it.
// A view with one lane (Procedures) is its own button.
function cerLane(doc, re) {
  const find = () => Array.from(doc.querySelectorAll(".cr-lane, .cr-view"))
    .find((b) => re.test(b.textContent));
  let b = find();
  if (b) return b;
  for (const v of Array.from(doc.querySelectorAll(".cr-view"))) {
    v.click();
    b = find();
    if (b) return b;
  }
  return undefined;
}

module.exports = { cerLane };
