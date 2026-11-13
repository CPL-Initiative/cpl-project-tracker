-- S647, read-only: build Draft 2 on the server from Draft 1 (0aeed57a-9855-4abe-84be-3afa59839fa3) and the pieces below, and say whether it is
-- byte for byte the committed scripts/library_drafts/how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1/draft.html (md5 087e2c7c08e4b653fc4d76332006b376, 49995 characters).
-- Writes nothing. Expect one row: matches = true.
select md5(convert_to(b.h, 'UTF8')) as md5, length(b.h) as chars,
       md5(convert_to(b.h, 'UTF8')) = '087e2c7c08e4b653fc4d76332006b376' and length(b.h) = 49995 as matches
from (with d as (select html as h from public.cpl_library_drafts where id = '0aeed57a-9855-4abe-84be-3afa59839fa3' and library_id = '4660a13b-984e-4030-a83b-762c507510a7'),
p as (select $M$<main id="main">
<div class="hero"><div class="hero-in">
<div class="eyebrow">California Community Colleges Chancellor&#x27;s Office &middot; Credit for Prior Learning Initiative</div>
<h1>How to Confirm and Qualify for CPL Funding</h1>
<p class="sub">Four minimum conditions, and a guide to each</p>
<div class="title-accent" aria-hidden="true"></div>
<p class="lede">A college qualifies for CPL Implementation Funding when it meets four minimum conditions, which the Chancellor&#x27;s Office publishes on the CPL Initiative Funding page. Two guides from the MAP team cover three of them, and the steps on this page cover local confirmation. Select a card to open a guide, or the steps, beside this page.</p>
</div></div>
<div class="body">

<section aria-labelledby="h-conditions">
<h2 id="h-conditions">The four minimum conditions</h2>
<ol class="cards four steps">
<li class="card"><h3>CPL Coordinator</h3><p>CPL Coordinator assigned on MAP and CPL Assistant email listed on the college CPL Landing Page.</p></li>
<li class="card"><h3>Local confirmation</h3><p>Local confirmation on file by December 31, 2026.</p></li>
<li class="card"><h3>Veterans&#x27; JSTs</h3><p>Minimum of 75% of enrolled veteran Joint Services Transcripts uploaded in MAP and processed for CPL.</p></li>
<li class="card"><h3>Noncredit CPL Lead</h3><p>For the noncredit CPL funding: Assign in MAP a Noncredit CPL Lead who meets regularly with the CPL Coordinator and attest to this on the CPL Funding Dashboard.</p></li>
</ol>
</section>

<section aria-labelledby="h-guides">
<h2 id="h-guides">The guides</h2>
<div class="cards">
<div class="card"><span class="kind">Conditions 1 and 4</span><h3><a class="open" href="https://cpl-initiative.github.io/cpl-project-tracker/library/adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5/">Add your CPL Coordinator and Noncredit Lead in MAP</a></h3><p>Name your college&#x27;s CPL Coordinator and Noncredit CPL Lead in MAP&#x27;s User Module, and add your CPL Assistant email.</p><p class="ex">Opens beside this page.</p></div>
<div class="card"><span class="kind">Condition 3</span><h3><a class="open" href="https://cpl-initiative.github.io/cpl-project-tracker/library/jst-how-to-obtain-and-upload-to-map-mwdq6m67/">Order and upload veterans&#x27; JSTs</a></h3><p>Obtain your enrolled veterans&#x27; Joint Services Transcripts in bulk, with the consent students give in CCCApply, and upload them to MAP.</p><p class="ex">Opens beside this page.</p></div>
<div class="card"><span class="kind">Condition 2</span><h3><a class="open" href="https://cpl-initiative.github.io/cpl-project-tracker/library/how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1/#how-to-confirm">How to confirm</a></h3><p>Confirm your college&#x27;s participation on the CPL Initiative Funding page, from a college or district email address.</p><p class="ex">Opens beside this page.</p></div>
</div>
</section>

<section id="how-to-confirm" aria-labelledby="h-confirm">
<h2 id="h-confirm">How to confirm</h2>
<ol class="cards four steps">
<li class="card"><h3>Find your college</h3><p>Open the <a href="https://cpl-initiative.github.io/cpl-project-tracker/funding-model/" target="_blank" rel="noopener">CPL Initiative Funding page</a> and find your college in its table of institutions.</p></li>
<li class="card"><h3>Select the Confirm button</h3><p>Select the Confirm button beside your college&#x27;s name. Its words carry the deadline, or read Confirm now once the deadline has passed. A short form opens.</p></li>
<li class="card"><h3>Give your email, name and title</h3><p>Start with your college or district email address, then give your name and title: vice president of academic affairs, vice president of student services, college president, or another senior administrator. Submitting attests that you are an administrator asking for your college to take part.</p></li>
<li class="card"><h3>Watch for the confirmation</h3><p>CPL Initiative staff review the request and email a confirmation. Until they approve it, your college&#x27;s row reads Awaiting CPL Initiative Confirmation. Then the condition shows as complete.</p></li>
</ol>
<p class="intro">Questions go to the MAP team at <a href="mailto:map@rccd.edu">map@rccd.edu</a>.</p>
</section>
</div>
</main>$M$::text as m,
  $P$<!-- The guide panel (S647; Ally Barker, 2026-11-12: links open "a side bar view of those visuals"). A card is a plain
     link; with this script it opens beside the page in a modal dialog. Source: scripts/library_drafts/ in the tracker. -->
<style>
.card a.open::after { content: ""; position: absolute; inset: 0; border-radius: 11px; }
.card:has(a.open:hover) { border-color: var(--line-strong); }
.card a.open { display: inline-block; min-height: 25px; }
.gp-scrim { position: fixed; inset: 0; z-index: 70; background: var(--shadow); }
.gp { position: fixed; z-index: 71; top: 0; right: 0; bottom: 0; width: min(46rem, 100%); display: flex; flex-direction: column; background: var(--surface); color: var(--ink); border-left: 1px solid var(--line); box-shadow: -8px 0 24px var(--shadow); }
.gp-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 18px; padding: 12px max(16px, env(safe-area-inset-right, 0px)) 12px 16px; border-bottom: 1px solid var(--line); }
.gp-bar h2 { flex: 1 1 14rem; font-size: 1.15rem; }
.gp-bar a, .gp-bar button { display: inline-flex; align-items: center; min-height: 25px; min-width: 25px; padding: 0 2px; font: inherit; font-weight: 600; color: var(--link); background: none; border: 0; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.gp-frame { flex: 1; width: 100%; border: 0; background: var(--page); }
.gp-copy { flex: 1; overflow: auto; padding: 18px 16px 32px; display: grid; gap: 14px; align-content: start; }
.gp-copy .cards, .gp-copy .cards.four { grid-template-columns: 1fr; }
.gp-copy > h2 { display: none; }
html.gp-on { overflow: hidden; }
html.gp-on .sbar-chip { display: none; }
</style>
<script>
(function () {
  var opener = null, scrim, panel, title, out, holder;
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function build() {
    scrim = el("div", "gp-scrim"); scrim.hidden = true;
    panel = el("div", "gp"); panel.hidden = true;
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-labelledby", "gp-h");
    var guardA = el("span"), guardB = el("span"); guardA.tabIndex = 0; guardB.tabIndex = 0;
    var bar = el("div", "gp-bar");
    title = el("h2"); title.id = "gp-h"; title.tabIndex = -1;
    out = el("a"); out.target = "_blank"; out.rel = "noopener"; out.textContent = "Open in a new tab";
    var shut = el("button"); shut.type = "button"; shut.textContent = "Close";
    bar.appendChild(title); bar.appendChild(out); bar.appendChild(shut);
    holder = el("div"); holder.style.display = "contents";
    panel.appendChild(guardA); panel.appendChild(bar); panel.appendChild(holder); panel.appendChild(guardB);
    document.body.appendChild(scrim); document.body.appendChild(panel);
    shut.addEventListener("click", close); scrim.addEventListener("click", close);
    guardA.addEventListener("focus", function () { shut.focus(); });
    guardB.addEventListener("focus", function () { title.focus(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) close(); });
  }
  function setInert(on) {
    Array.prototype.forEach.call(document.body.children, function (n) {
      if (n === panel || n === scrim || n.tagName === "SCRIPT") return;
      if (on) n.setAttribute("inert", ""); else n.removeAttribute("inert");
    });
  }
  function open(a) {
    if (!panel) build();
    opener = a; holder.innerHTML = "";
    // A link to a section of this page shows that section; the draft's preview has another address, so match the id.
    var sec = a.hash ? document.getElementById(a.hash.slice(1)) : null;
    title.textContent = a.textContent;
    if (sec) {
      var copy = el("div", "gp-copy"); copy.innerHTML = sec.innerHTML;
      Array.prototype.forEach.call(copy.querySelectorAll("[id]"), function (n) { n.removeAttribute("id"); });
      holder.appendChild(copy);
      var first = sec.querySelector('a[href^="https:"]');
      out.href = first ? first.href : a.href;
    } else {
      var f = el("iframe", "gp-frame"); f.title = a.textContent; f.src = a.href;
      f.addEventListener("load", function () {
        try { f.contentDocument.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); }); } catch (err) { /* another origin */ }
      });
      holder.appendChild(f); out.href = a.href;
    }
    setInert(true); scrim.hidden = false; panel.hidden = false;
    document.documentElement.classList.add("gp-on");
    title.focus();
    return true;
  }
  function close() {
    if (!panel || panel.hidden) return;
    panel.hidden = true; scrim.hidden = true; holder.innerHTML = "";
    setInert(false); document.documentElement.classList.remove("gp-on");
    if (opener) { try { opener.focus(); } catch (e) { /* best effort */ } }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("#main a.open");
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    if (open(a)) e.preventDefault();
  });
})();
</script>$P$::text as pn,
  $T$How to Confirm and Qualify for CPL Funding$T$::text as t, $X$The four minimum conditions a California community college meets to qualify for CPL Implementation Funding, with a guide to each.$X$::text as ds,
  $C$<!-- How to Confirm and Qualify for CPL Funding: Draft 2, built in session S647 from Ally Barker's brief and asks of
     2026-11-12 (cpl_library how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1, carried from ...-mwdv9pl5), in the starter page
     noncredit-to-credit-how-noncredit-learning-can-result-in-cre-mw53clp5's frame. Source: scripts/library_drafts/how-to-confirm-and-qualify-for-cpl-funding-mwdvs6l1/ (cpl-project-tracker). -->
$C$::text as c,
  $U$Published by the California Community Colleges Chancellor's Office, Credit for Prior Learning Initiative. Draft 2, November 13, 2026.$U$::text as pu),
s1 as (select left(h, strpos(h, '<main') - 1) || m || substr(h, length(h) - strpos(reverse(h), '>niam/<') + 2) as h from d, p),
s2 as (select left(h, strpos(h, '<title>') + 6) || t || substr(h, strpos(h, '</title>')) as h from s1, p),
s3 as (select left(h, i + 34 - 1) || ds || substr(h, i + strpos(substr(h, i), '">') - 1) as h
  from (select h, strpos(h, '<meta name="description" content="') as i from s2) x, p),
s4 as (select left(h, i - 1) || left(r, length(r) - length(ltrim(r, E' \n\t\r'))) || c || ltrim(substr(r, strpos(r, '-->') + 3), E' \n\t\r') as h
  from (select h, strpos(h, '<body>') + 6 as i, substr(h, strpos(h, '<body>') + 6) as r from s3) x, p),
s5 as (select left(h, f + strpos(substr(h, f), '<p>') + 1) || pu || substr(h, f + strpos(substr(h, f), '</p>') - 1) as h
  from (select h, strpos(h, '<footer class="foot"><div class="foot-in">') as f from s4) x, p),
s6 as (select left(h, a - 1) || pn || E'\n' || substr(h, a) as h from (select h, strpos(h, '<!-- Ask Sierra') as a from s5) x, p)
select h from s6) b;
