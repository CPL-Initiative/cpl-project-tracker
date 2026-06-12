// First Light — the once-a-day plein air greeting for the CPL Project Tracker.
//
// STATIC asset (like kpi_reorder.js / college_short_names.js): NOT regenerated
// by excel_to_dashboard.py. It injects its own CSS and DOM at runtime, so the
// daily regen can't disturb it and there is no Rule-4 <style> mirror to keep —
// only the <script src="first_light.js"> tag lives in both HTMLs.
//
// Behavior:
//   - Greets each browser ONCE per day (localStorage) with today's painting,
//     revealed grayscale → full color. Everyone sees the same painting on the
//     same day (date-seeded pick).
//   - Opt-out checkbox ("Don't greet me with paintings") honored forever;
//     a small "Today's painting" chip appended to the .header reopens it
//     on demand (runtime injection = survives the daily regen).
//   - Accessibility: role="dialog" + focus trap + ESC + focus return,
//     prefers-reduced-motion disables the reveal animation, hand-written
//     alt text per painting, 🔊 read-aloud via the browser's own
//     speechSynthesis (no cloud calls; hides itself where unsupported).
//   - Paintings are PUBLIC DOMAIN, hotlinked from Wikimedia Commons
//     (Special:FilePath is the stable redirect). If the image can't load
//     (offline / blocked CDN), a painterly gradient panel keeps the story.
//
// Manifest notes: every entry needs verified PD/CC0 status, OUR OWN prose
// (museum wall text is copyrighted even when the image is not), and alt text.
// Growing this list is curation work — keep entries in this shape.
(function () {
  "use strict";

  var PAINTINGS = [
    {
      title: "California Poppy Field",
      artist: "Granville Redmond", year: "c. 1926",
      museum: "Los Angeles County Museum of Art",
      img: "https://commons.wikimedia.org/wiki/Special:FilePath/WLA%20lacma%20Granville%20Redmond%20California%20Poppy%20Field.jpg?width=1600",
      alt: "A sunlit California meadow blanketed in orange poppies, with dark trees and soft hills in the distance.",
      blurb: "Redmond lost his hearing to scarlet fever at age two and trained at the California School for the Deaf in Berkeley before studying painting in Paris. Back in Los Angeles he became one of the state's most beloved painters — and a close friend of Charlie Chaplin, who learned sign language from him and gave him roles in his films. Collectors clamored for his blazing poppy hillsides; he privately preferred quiet, tonalist nocturnes.",
      setting: "The golden poppy — California's state flower — carpets the coastal ranges each spring; Redmond returned to these hillsides his whole career.",
      lic: "Public domain · LACMA · via Wikimedia Commons"
    },
    {
      title: "The Rendezvous, Santa Cruz Island",
      artist: "Edgar Payne", year: "c. 1920s",
      museum: "Private collection",
      img: "https://commons.wikimedia.org/wiki/Special:FilePath/Edgar%20Payne%20The%20Rendezvous%2C%20Santa%20Cruz%20Island.jpg?width=1600",
      alt: "Fishing boats with weathered sails gathered in the lee of steep island headlands.",
      blurb: "Largely self-taught, Payne became the first president of the Laguna Beach Art Association and wrote the plein air bible 'Composition of Outdoor Painting.' He sailed to the Channel Islands to paint fishing fleets at anchor, and packed mules into the High Sierra for the granite peaks that made his name.",
      setting: "Santa Cruz Island is the largest of California's Channel Islands, a day's sail from the harbors Payne worked from.",
      lic: "Public domain · via Wikimedia Commons"
    },
    {
      title: "Laguna Seascape",
      artist: "Edgar Payne", year: "c. 1918",
      museum: "Private collection",
      img: "https://commons.wikimedia.org/wiki/Special:FilePath/Edgar%20Payne%20Laguna%20Seascape%202.jpg?width=1600",
      alt: "Surf breaking against rocky coves along the Laguna coast, cliffs warm in afternoon light.",
      blurb: "Payne and his wife, the painter Elsie Palmer Payne, helped turn Laguna Beach into California's plein air colony. He painted its coves in every light, laying on paint with a loaded brush that kept the energy of work done outdoors, on the spot.",
      setting: "Laguna Beach, where the Art Association Payne led grew into today's Laguna Art Museum.",
      lic: "Public domain · via Wikimedia Commons"
    }
  ];

  var KEY_SEEN = "cplFirstLight.seen.v1";
  var KEY_OPTOUT = "cplFirstLight.optOut.v1";
  var KEY_REFLECTED = "cplFirstLight.reflected.v1";
  var GREET_DELAY_MS = 650;

  // Reflections post to an ANONYMOUS, WRITE-ONLY Supabase table
  // (public.cpl_reflections: anon INSERT with a length check, no SELECT —
  // the chat_interactions pattern). Same public anon key the dashboard
  // already ships in cpl_chat.js / unified_courses.js.
  var SUPABASE_URL = "https://hvuwhnbuahrtptokpqfh.supabase.co";
  var SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  var REFLECT_ENDPOINT = SUPABASE_URL + "/rest/v1/cpl_reflections";

  function todayKey() { return new Date().toDateString(); }
  function pickToday() {
    return PAINTINGS[Math.floor(Date.now() / 86400000) % PAINTINGS.length];
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ── one-time CSS (uses the dashboard's :root tokens; the only raw
        values are alpha scrims/dims, which have no token) ───────────── */
  function ensureCss() {
    if (document.getElementById("cplfl-css")) return;
    var s = document.createElement("style");
    s.id = "cplfl-css";
    s.textContent =
      ".cplfl-overlay{position:fixed;inset:0;z-index:12000;display:none;align-items:center;justify-content:center;" +
      "background:rgba(10,20,35,.55);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);padding:1.2rem}" +
      ".cplfl-overlay.open{display:flex}" +
      ".cplfl-dialog{background:var(--surface-opaque,#fff);border-radius:16px;overflow:hidden auto;max-width:min(1180px,94vw);width:100%;" +
      "max-height:94vh;box-shadow:0 30px 80px rgba(10,10,20,.4);font-family:'Source Sans 3',Arial,sans-serif}" +
      ".cplfl-head{display:flex;align-items:center;gap:.6rem;padding:.85rem 1.25rem;border-bottom:1px solid var(--border,rgba(28,28,26,.14))}" +
      ".cplfl-head .cplfl-sun{width:12px;height:12px;border-radius:50%;background:var(--gold-accent,#E3B341);flex:none}" +
      ".cplfl-head h2{font-family:'Playfair Display',Georgia,serif;font-size:1.02rem;margin:0;color:var(--text-strong,#1C1C1A)}" +
      ".cplfl-head .cplfl-day{font-size:.76rem;color:var(--text-muted,#5C5C55);margin-left:auto;padding-right:.5rem}" +
      ".cplfl-close{background:none;border:1.5px solid var(--border-strong,rgba(28,28,26,.30));border-radius:8px;width:32px;height:32px;" +
      "font-size:1rem;cursor:pointer;color:var(--text-body,#3A3A36);flex:none}" +
      ".cplfl-close:hover{background:var(--surface-muted,#ECE9E2)}" +
      ".cplfl-art{background:#22221F;text-align:center}" +
      ".cplfl-art img{max-width:100%;max-height:66vh;display:block;margin:0 auto;filter:grayscale(1);transition:filter 1.8s ease .35s}" +
      ".cplfl-overlay.open .cplfl-art img.cplfl-revealed{filter:grayscale(0)}" +
      ".cplfl-imgfallback{display:none;padding:3rem 1rem;color:rgba(255,255,255,.88);font-size:.85rem;" +
      "background:linear-gradient(160deg,#8a6d2e 0%,#a8842f 30%,#6e7d52 65%,#43523f 100%)}" +
      ".cplfl-body{padding:1rem 1.3rem 1.2rem}" +
      ".cplfl-title{font-family:'Playfair Display',Georgia,serif;font-size:1.25rem;font-weight:700;color:var(--text-strong,#1C1C1A)}" +
      ".cplfl-byline{font-size:.86rem;color:var(--text-muted,#5C5C55);margin-bottom:.6rem}" +
      ".cplfl-blurb{font-size:.92rem;color:var(--text-body,#3A3A36);margin:0 0 .55rem;line-height:1.5}" +
      ".cplfl-setting{font-size:.85rem;color:var(--text-muted,#5C5C55);margin:0 0 .75rem;line-height:1.45}" +
      ".cplfl-reflect{margin:.3rem 0 .2rem}" +
      ".cplfl-reflect label{display:block;font-weight:600;font-size:.85rem;color:var(--text-strong,#1C1C1A);margin-bottom:.3rem}" +
      ".cplfl-reflect label span{font-weight:400;color:var(--text-muted,#5C5C55)}" +
      ".cplfl-reflect textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:60px;font-family:inherit;font-size:.9rem;" +
      "color:var(--text-body,#3A3A36);background:var(--surface-subtle,#F7F5F1);border:1px solid var(--border-strong,rgba(28,28,26,.30));border-radius:9px;padding:.5rem .7rem}" +
      ".cplfl-reflect-note{font-size:.73rem;color:var(--text-muted,#5C5C55);display:block;margin-top:.3rem;max-width:75ch}" +
      ".cplfl-reflect-msg{font-size:.78rem;color:var(--text-muted,#5C5C55)}" +
      ".cplfl-actions{display:flex;flex-wrap:wrap;gap:.55rem;align-items:center;margin:.4rem 0 .6rem}" +
      ".cplfl-btn{display:inline-flex;align-items:center;gap:.4rem;cursor:pointer;font-family:inherit;font-size:.85rem;" +
      "font-weight:600;background:var(--cobalt,#0047AB);color:#fff;border:none;border-radius:9px;padding:.5rem 1rem;min-height:32px}" +
      ".cplfl-btn:hover{background:#003B8E}" +
      ".cplfl-btn.cplfl-ghost{background:transparent;color:var(--accent-link,#0047AB);border:1.5px solid var(--accent-link,#0047AB)}" +
      ".cplfl-optout{font-size:.78rem;color:var(--text-muted,#5C5C55);display:flex;align-items:center;gap:.4rem}" +
      ".cplfl-optout input{width:15px;height:15px}" +
      ".cplfl-lic{font-size:.73rem;color:var(--text-muted,#5C5C55);border-top:1px solid var(--border,rgba(28,28,26,.14));padding-top:.6rem}" +
      ".cplfl-chip{display:inline-flex;align-items:center;gap:.45rem;font-size:.78rem;font-weight:600;cursor:pointer;" +
      "font-family:inherit;color:var(--mustard-text,#8B6800);background:rgba(255,255,255,.5);border:1px solid var(--border-strong,rgba(28,28,26,.30));" +
      "border-radius:8px;padding:.25rem .75rem;min-height:26px;white-space:nowrap}" +
      ".cplfl-chip:hover{background:var(--surface-subtle,#F7F5F1)}" +
      ".cplfl-chip .cplfl-sun{width:9px;height:9px;border-radius:50%;background:var(--gold-accent,#E3B341);flex:none}" +
      ".cplfl-overlay :focus-visible{outline:3px solid var(--accent-link,#0047AB);outline-offset:2px;border-radius:6px}" +
      ".cplfl-bg{position:fixed;inset:0;z-index:-1;background-position:center;background-size:cover;" +
      "background-repeat:no-repeat;filter:grayscale(1) contrast(.95);opacity:.10;pointer-events:none}" +
      ".cplfl-bg.cplfl-bg-fallback{background:" +
      "radial-gradient(120% 70% at 15% 85%,#6b6b66 0%,transparent 60%)," +
      "radial-gradient(90% 60% at 80% 20%,#8d8d86 0%,transparent 55%)," +
      "linear-gradient(165deg,#c9c7c0 0%,#93938c 55%,#5c5c55 100%);filter:none}" +
      "@media (prefers-reduced-transparency: reduce){.cplfl-bg{display:none}}" +
      "@media (prefers-contrast: more){.cplfl-bg{display:none}}" +
      "@media (prefers-reduced-motion: reduce){.cplfl-art img{transition:none}}" +
      "@media (prefers-reduced-transparency: reduce){.cplfl-overlay{background:rgba(10,20,35,.8);backdrop-filter:none;-webkit-backdrop-filter:none}}";
    document.head.appendChild(s);
  }

  /* ── DOM (built once, lazily) ──────────────────────────────────────── */
  var overlay = null, openerEl = null, keysBound = false;

  function buildDom() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "cplfl-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "cplfl-title");
    overlay.innerHTML =
      '<div class="cplfl-dialog">' +
      '<div class="cplfl-head"><span class="cplfl-sun" aria-hidden="true"></span>' +
      '<h2 id="cplfl-title">First Light — today’s painting</h2>' +
      '<span class="cplfl-day" id="cplfl-day"></span>' +
      '<button class="cplfl-close" id="cplfl-close" type="button" aria-label="Close">✕</button></div>' +
      '<div class="cplfl-art"><img id="cplfl-img" src="" alt="">' +
      '<div class="cplfl-imgfallback" id="cplfl-imgfallback">The painting image loads from Wikimedia Commons — it will appear when the network allows.</div></div>' +
      '<div class="cplfl-body">' +
      '<div class="cplfl-title" id="cplfl-ptitle"></div>' +
      '<div class="cplfl-byline" id="cplfl-byline"></div>' +
      '<p class="cplfl-blurb" id="cplfl-blurb"></p>' +
      '<p class="cplfl-setting" id="cplfl-setting"></p>' +
      '<div class="cplfl-reflect">' +
      '<label for="cplfl-reflect">A thought for the day <span>(optional)</span></label>' +
      '<textarea id="cplfl-reflect" maxlength="2000" rows="3" placeholder="About the painting, your priorities — anything."></textarea>' +
      '<span class="cplfl-reflect-note">Don’t worry — reflections are anonymous, and we’ll only use them to look for uplifting themes and opportunities for growth and innovation for our colleagues and communities.</span>' +
      '</div>' +
      '<div class="cplfl-actions">' +
      '<button class="cplfl-btn" id="cplfl-done" type="button">Begin the day</button>' +
      '<button class="cplfl-btn cplfl-ghost" id="cplfl-reflect-send" type="button">Share reflection</button>' +
      '<button class="cplfl-btn cplfl-ghost" id="cplfl-speak" type="button" aria-pressed="false">🔊 Read aloud</button>' +
      '<label class="cplfl-optout"><input type="checkbox" id="cplfl-optout"> Don’t greet me with paintings</label>' +
      '<span class="cplfl-reflect-msg" id="cplfl-reflect-msg" role="status"></span>' +
      '</div><div class="cplfl-lic" id="cplfl-lic"></div></div></div>';
    document.body.appendChild(overlay);

    byId("cplfl-close").addEventListener("click", close);
    byId("cplfl-done").addEventListener("click", close);
    overlay.addEventListener("mousedown", function (e) { if (e.target === overlay) close(); });
    byId("cplfl-optout").addEventListener("change", function (e) {
      lsSet(KEY_OPTOUT, e.target.checked ? "1" : "0");
      ensureBgArt();   // opting out also lifts the painting off the page
    });
    wireReflect();
    wireSpeak();
  }

  function byId(id) { return document.getElementById(id); }

  function fill() {
    var p = pickToday();
    byId("cplfl-day").textContent = new Date().toLocaleDateString(undefined,
      { weekday: "long", month: "long", day: "numeric" });
    byId("cplfl-ptitle").textContent = p.title;
    byId("cplfl-byline").textContent = p.artist + ", " + p.year + " · " + p.museum;
    byId("cplfl-blurb").textContent = p.blurb;
    byId("cplfl-setting").textContent = p.setting;
    byId("cplfl-lic").textContent = p.lic;
    byId("cplfl-optout").checked = lsGet(KEY_OPTOUT) === "1";
    var img = byId("cplfl-img");
    img.alt = p.alt;
    img.style.display = "";
    byId("cplfl-imgfallback").style.display = "none";
    img.onerror = function () {
      img.style.display = "none";
      byId("cplfl-imgfallback").style.display = "block";
    };
    img.src = p.img;
  }

  function open() {
    ensureCss();
    buildDom();
    openerEl = document.activeElement;
    fill();
    syncReflectState();
    overlay.classList.add("open");
    var img = byId("cplfl-img");
    img.classList.remove("cplfl-revealed");
    var raf = window.requestAnimationFrame || function (f) { f(); };
    raf(function () { raf(function () { img.classList.add("cplfl-revealed"); }); });
    byId("cplfl-close").focus();
    if (!keysBound) { document.addEventListener("keydown", onKeys); keysBound = true; }
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("open");
    if (keysBound) { document.removeEventListener("keydown", onKeys); keysBound = false; }
    stopSpeaking();
    lsSet(KEY_SEEN, todayKey());
    if (openerEl && openerEl.focus) openerEl.focus();
  }

  function onKeys(e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab") return;
    var items = overlay.querySelectorAll("button, a[href], input");
    var list = Array.prototype.filter.call(items, function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }

  /* ── reflection: anonymous, write-only, once a day per browser ─────── */
  function syncReflectState() {
    var ta = byId("cplfl-reflect"), btn = byId("cplfl-reflect-send");
    if (!ta || !btn) return;
    if (lsGet(KEY_REFLECTED) === todayKey()) {
      ta.disabled = true;
      btn.disabled = true;
      btn.textContent = "✓ Shared — thank you";
    } else {
      ta.disabled = false;
      btn.disabled = false;
      btn.textContent = "Share reflection";
    }
  }
  function wireReflect() {
    var ta = byId("cplfl-reflect"), btn = byId("cplfl-reflect-send"), msg = byId("cplfl-reflect-msg");
    btn.addEventListener("click", function () {
      if (lsGet(KEY_REFLECTED) === todayKey()) return;
      var text = (ta.value || "").trim();
      if (!text) { ta.focus(); return; }
      if (typeof window.fetch !== "function") {
        msg.textContent = "Sharing isn’t available in this browser.";
        return;
      }
      btn.disabled = true;
      btn.textContent = "Sharing…";
      msg.textContent = "";
      window.fetch(REFLECT_ENDPOINT, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": "Bearer " + SUPABASE_ANON,
          "Content-Type": "application/json",
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          painting: pickToday().title,
          reflection: text.slice(0, 2000)
        })
      }).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        lsSet(KEY_REFLECTED, todayKey());
        syncReflectState();
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = "Share reflection";
        msg.textContent = "Couldn’t send just now — your words are still here, try again in a moment.";
      });
    });
  }

  /* ── read-aloud: the browser's own voices, nothing cloned ──────────── */
  function stopSpeaking() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    var b = overlay && byId("cplfl-speak");
    if (b) { b.setAttribute("aria-pressed", "false"); b.textContent = "🔊 Read aloud"; }
  }
  function wireSpeak() {
    var b = byId("cplfl-speak");
    if (!("speechSynthesis" in window)) { b.style.display = "none"; return; }
    b.addEventListener("click", function () {
      if (window.speechSynthesis.speaking) { stopSpeaking(); return; }
      var p = pickToday();
      var u = new SpeechSynthesisUtterance(
        p.title + ". " + p.artist + ", " + p.year + ". " + p.blurb + " " + p.setting);
      u.rate = 0.95;
      var voices = window.speechSynthesis.getVoices() || [];
      var pref = voices.find(function (v) { return /en[-_]US/i.test(v.lang) && /natural|samantha|allison|ava/i.test(v.name); }) ||
                 voices.find(function (v) { return /en[-_]US/i.test(v.lang); });
      if (pref) u.voice = pref;
      u.onend = stopSpeaking;
      u.onerror = stopSpeaking;
      b.setAttribute("aria-pressed", "true");
      b.textContent = "⏹ Stop";
      window.speechSynthesis.speak(u);
    });
  }

  /* ── the ghosted painting behind the page (First Light retheme PR-2):
        today's pick, grayscaled by CSS at 10% opacity. Injected at runtime
        so the daily regen can't strand it; honors the greeting opt-out and
        the reduced-transparency / contrast preferences (CSS). ─────────── */
  function ensureBgArt() {
    var existing = document.getElementById("cplfl-bg");
    if (lsGet(KEY_OPTOUT) === "1") {
      if (existing) existing.parentNode.removeChild(existing);
      return;
    }
    if (existing) return;
    var bg = document.createElement("div");
    bg.id = "cplfl-bg";
    bg.className = "cplfl-bg";
    bg.setAttribute("aria-hidden", "true");
    document.body.appendChild(bg);
    var pick = pickToday();
    var probe = new Image();
    probe.onload = function () {
      bg.style.backgroundImage = "url('" + pick.img + "')";
      bg.classList.remove("cplfl-bg-fallback");
    };
    probe.onerror = function () { bg.classList.add("cplfl-bg-fallback"); };
    probe.src = pick.img;
    setTimeout(function () {           /* slow networks: paint the fallback meanwhile */
      if (!bg.style.backgroundImage) bg.classList.add("cplfl-bg-fallback");
    }, 2500);
  }

  /* ── reopen affordance, injected into the header at runtime (so the
        daily regen of header contents can never strand it in git) ────── */
  function injectChip() {
    if (document.getElementById("cplfl-chip")) return;
    var header = document.querySelector(".header");
    if (!header) return;
    var chip = document.createElement("button");
    chip.id = "cplfl-chip";
    chip.className = "cplfl-chip";
    chip.type = "button";
    chip.title = "First Light — today’s painting";
    chip.innerHTML = '<span class="cplfl-sun" aria-hidden="true"></span>Today’s painting';
    chip.addEventListener("click", open);
    header.appendChild(chip);
  }

  function maybeGreet() {
    if (lsGet(KEY_OPTOUT) === "1") return;
    if (lsGet(KEY_SEEN) === todayKey()) return;
    setTimeout(function () {
      // re-check at fire time — another tab may have greeted meanwhile
      if (lsGet(KEY_SEEN) !== todayKey()) open();
    }, GREET_DELAY_MS);
  }

  var inited = false;
  function init() {
    if (inited) return;
    inited = true;
    ensureCss();
    ensureBgArt();
    injectChip();
    maybeGreet();
  }

  window.CPL_FIRST_LIGHT = { init: init, open: open, close: close, paintings: PAINTINGS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
