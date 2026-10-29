// The funding FAQ's groups (Sam, 2026-10-29: "categorize the FAQs to make them easier to
// locate a users question"; "go ahead with the FAQ categories and Sierra"). A paragraph
// opening "## " names a group; the page and the tab draw a heading over each group and a
// line of links to each above them, and a group link scrolls in place, since COBI routes
// on the address's #. The six groups follow the settled order, so no question moved; Sam's
// questions of 2026-10-29 add Reporting in NOVA and Apprenticeship CPL (S519).
const H = require("./lib/cpl_funding_harness.js");
const { check, freshDom, boot, finish } = H;

const GROUPS = ["Qualifying and confirming", "The funding and its figures", "Reporting in NOVA", "Counting outcomes in MAP",
  "Student records in MAP", "Building CPL at your college", "Apprenticeship CPL", "Credit recommendations and exhibits"];

const { window } = freshDom();
boot(window);
const T = window.CPL_FUNDING_TAB;
const d = window.document;

// The public page's FAQ: h3 groups under the page's h2, eight links, 45 questions in order.
const box = d.createElement("div");
box.innerHTML = T.publicFaqHtml();
d.body.appendChild(box);
const heads = Array.from(box.querySelectorAll(".cplfund-faq-group"));
check("the public FAQ draws eight group headings, h3 under the page's h2, in the settled order",
  heads.length === GROUPS.length && heads.every((h) => h.tagName === "H3") && heads.map((h) => h.textContent).join("|") === GROUPS.join("|"));
const links = Array.from(box.querySelectorAll("nav.cplfund-faq-jump[aria-label='Question groups'] a"));
check("a line of links names each group and points at its heading",
  links.length === GROUPS.length && links.every((a, i) => a.textContent === GROUPS[i] && a.getAttribute("href") === "#" + heads[i].id));
const items = Array.from(box.querySelectorAll(".cplfund-faq-item"));
check("all 45 questions, each under its group, the first group holding four",
  items.length === 45 && heads[1].previousElementSibling === items[3] && items[0].querySelector("summary").textContent === "What must an institution do to qualify for funding?");
check("no group heading leaks into an answer", !items.some((it) => /^##/.test(it.textContent) || /Qualifying and confirming|Student records in MAP/.test(it.textContent)));

// The tab's own FAQ (COBI): h4 groups under its h3 sections. Its group link scrolls to
// its group and moves focus there, leaving the address alone (COBI routes on the #).
const tabHeads = Array.from(d.querySelectorAll("#cplFundingMount .cplfund-faq-group"));
check("the tab's FAQ draws the eight groups as h4, under its h3 sections",
  tabHeads.length === GROUPS.length && tabHeads.every((h) => h.tagName === "H4"));
const tabLink = d.querySelectorAll("#cplFundingMount .cplfund-faq-jump a")[3];
const target = tabLink && d.getElementById(tabLink.getAttribute("href").slice(1));
let scrolled = false;
if (target) target.scrollIntoView = function () { scrolled = true; };
const before = window.location.hash;
const ev = new window.MouseEvent("click", { bubbles: true, cancelable: true });
if (tabLink) tabLink.dispatchEvent(ev);
check("a group link scrolls in place and focuses the group, and the address keeps its #",
  !!target && target.textContent === GROUPS[3] && ev.defaultPrevented && scrolled && d.activeElement === target && window.location.hash === before);

// A curator's FAQ with no groups draws as before: no headings and no line of links.
check("a FAQ with no ## lines draws no groups and no line of links",
  (function () { const b = d.createElement("div"); b.innerHTML = T._faqHtml ? T._faqHtml("Q: One?\n\nYes.\n\nQ: Two?\n\nNo.", 3) : ""; return !!T._faqHtml && !b.querySelector(".cplfund-faq-group, .cplfund-faq-jump") && b.querySelectorAll(".cplfund-faq-item").length === 2; })());

finish();
