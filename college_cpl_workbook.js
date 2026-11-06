/* The CPL opportunity analysis: one college's workbook ("Download CPL Extract")
 * and its shareable visual ("View CPL Visual", library/cpl-opportunity/?college=<name>; the old
 * cpl-opportunity/ address forwards there since 2026-10-26).
 *
 * WHY. Ashley (MAP team, 2026-10-20) asked for one college's CPL opportunity
 * analysis as an Excel workbook: its COCI programs and courses, its MAP
 * exhibits without AP and IB (CLEP stays in), the courses where CPL could be
 * added, and the statewide credit recommendations it could adopt, each with a
 * "Request Adopt" link. Sam routed it into COBI: My College and the
 * CPL Pathways college picker both offer it, for any college. The first run
 * (American River College) and its method are in
 * CPLBrain/04-projects/cpl-initiative/american-river-cpl-analysis/.
 *
 * WHAT IT READS — files COBI already publishes, loaded on first use:
 *   coci_lookup_data.js        every college's COCI course list (title, units, TOP, C-ID)
 *   unified_courses_members.js the CURRENT course identity (M-ID / C-ID) of each control
 *                              number. ⚠ Never the identity column of coci_lookup_data.js:
 *                              it is built 2026-07-09 and predates later re-mints (measured
 *                              2026-10-20: 741 of American River's 2,461 courses differ).
 *   unified_courses_aligned.js the Commons' inverse view: per identity, the exhibits peer
 *                              colleges articulate to it (the identities the Commons curates)
 *   statewide_data.js          MAP exhibits, adopters, credit-recommendation lines, IDs
 *   coci_programs_data.js      the COCI program inventory
 *   kb/reference/map_cpl_opportunities_verified.json
 *                              which statewide exhibit IDs MAP's public CPL Opportunities
 *                              page lists (kb/_verify_map_exhibit_links.py). MAP has no URL
 *                              for one exhibit card, so a link goes only to that page, and
 *                              only for a listed ID.
 * plus the catalog harvest's program_requirement_records (the Program
 * Requirements tab's records, anon read) for which courses each program lists.
 *
 * It WRITES NOTHING, to Supabase or to MAP. Every opportunity is a candidate:
 * faculty compare the course outline of record with the credential's
 * competencies before a college acts.
 *
 * The .xlsx is written here (a stored, uncompressed zip of SpreadsheetML): COBI
 * loads no spreadsheet library, and this gives filters, frozen headers, styled
 * header rows and working hyperlinks in about 150 lines.
 */
(function () {
  "use strict";

  // AP and IB are left out; CLEP stays in (Ashley, 2026-10-20: "excluding AP and IB. Include CLEP exhibits").
  var EXAM_RE = /^\s*(AP|IB)\b/i;
  /* MAP's CPL Opportunities page opens already searched for whatever ?Exhibit= carries (Malone, live
   * 2026-10-26), on the exhibit's Non-Military card (Pedro, 2026-10-28), so the link lands on its
   * Request Quick Adopt with nothing to paste. The address is map_links.js's (CPL_MAP_LINKS.url), one
   * for every public surface; the page loads it first, and without it no row gets a link. */
  function mapLinks() { var ml = typeof window !== "undefined" && window.CPL_MAP_LINKS; return ml && typeof ml.url === "function" ? ml : null; }
  function mapLink(id) { var ml = mapLinks(); return ml ? ml.url(id) : ""; }
  var STATEWIDE_TYPES = { "CCC Collaborative": 1, "Apprenticeship": 1, "Industry": 1,
    "Industry|Apprenticeship": 1, "Private Institution": 1, "CSU": 1 };
  var CATALOG_STOP = /work experience|topics in|special (studies|topics)|independent study|internship|seminar/i;

  /* TOP family (first four digits) -> documented prior-learning sources a faculty
   * reviewer would check. A pointer for research, never a claim that a course qualifies. */
  var TOP_SOURCES = [
    ["0101", "Agriculture", "Industry certification (e.g., Certified Crop Adviser); pesticide applicator license; work experience (portfolio)"],
    ["0109", "Horticulture", "CA Certified Nursery Professional; Landscape Industry Certified; Qualified Applicator License; work experience (portfolio)"],
    ["0115", "Natural resources", "CAL FIRE or federal wildland and forestry training; work experience (portfolio)"],
    ["0201", "Architecture", "Autodesk certifications (AutoCAD, Revit); professional portfolio"],
    ["0203", "Interior design", "NKBA or NCIDQ coursework; professional portfolio"],
    ["0430", "Biotechnology", "Industry lab experience (portfolio); BACE certification"],
    ["0502", "Accounting", "QuickBooks Certified User; IRS VITA certification; Enrolled Agent; work experience (portfolio)"],
    ["0504", "Banking and finance", "ABA Bankers or FINRA SIE; work experience (portfolio)"],
    ["0505", "Business administration", "Military leadership training (JST); small-business experience (portfolio)"],
    ["0506", "Business management", "Military leadership and NCO courses (JST); supervisory experience (portfolio); SHRM or PMI CAPM"],
    ["0509", "Marketing", "Google Ads or HubSpot certifications; professional portfolio"],
    ["0511", "Real estate", "CA DRE salesperson or broker license"],
    ["0514", "Office technology", "Microsoft Office Specialist (MOS); military administrative training (JST)"],
    ["0602", "Journalism", "Published work (portfolio); military public affairs training (JST)"],
    ["0604", "Radio and television", "Broadcast work (portfolio); military broadcast training (JST)"],
    ["0614", "Digital media", "Adobe Certified Professional; professional portfolio"],
    ["0701", "Information technology", "CompTIA (A+, Network+, Security+); Microsoft and AWS certifications; military IT training (JST)"],
    ["0702", "Computer information systems", "CompTIA (A+, Network+, Security+, Linux+, Server+); Microsoft; AWS; Cisco CCNA; military IT training (JST)"],
    ["0707", "Software development", "Vendor programming certifications (Oracle Java, Microsoft); portfolio of code"],
    ["0708", "Computer infrastructure and support", "CompTIA A+ or Network+; Cisco CCNA; military network training (JST)"],
    ["0709", "Networking and cybersecurity", "CompTIA Security+ or CySA+; Cisco CCNA; (ISC)2 CC; military cyber training (JST)"],
    ["0835", "Physical education", "Military basic training (JST/ACE); NASM or ACE personal trainer certification; coaching certification"],
    ["0850", "Sign language and interpreting", "RID or NIC interpreter certification; EIPA score; ASLPI proficiency"],
    ["0925", "Engineering technology", "ETA or SME certifications; military technical training (JST)"],
    ["0934", "Electronics", "ETA International certifications; IPC J-STD-001; military electronics training (JST)"],
    ["0935", "Electrical", "CA General Electrician certification; IBEW/NECA JATC apprenticeship; military electrician training (JST)"],
    ["0946", "Environmental control (HVAC)", "EPA Section 608; NATE; HVAC apprenticeship (journey-level card)"],
    ["0947", "Diesel technology", "ASE Medium/Heavy Truck certifications; military mechanic training (JST)"],
    ["0948", "Automotive technology", "ASE certifications; manufacturer training; military wheeled-vehicle mechanic training (JST)"],
    ["0949", "Automotive collision", "I-CAR; ASE collision certifications"],
    ["0952", "Construction crafts", "Registered apprenticeship (journey-level card, JATC training records); OSHA 10/30"],
    ["0953", "Drafting", "Autodesk AutoCAD or Revit certification; professional portfolio"],
    ["0956", "Manufacturing and welding", "AWS Certified Welder; NIMS; military welding training (JST)"],
    ["0957", "Civil and construction management", "OSHA 30; ICC certifications; construction-management experience (portfolio)"],
    ["1005", "Commercial music", "Avid Pro Tools certification; professional portfolio"],
    ["1006", "Technical theater", "IATSE or ETCP certification; production portfolio"],
    ["1012", "Applied photography", "Professional portfolio"],
    ["1013", "Commercial art", "Adobe Certified Professional; professional portfolio"],
    ["1203", "Nursing", "LVN license; CNA; military medic training (JST)"],
    ["1208", "Medical assisting", "CCMA or CMA certification; military medical training (JST)"],
    ["1210", "Respiratory care", "NBRC CRT or RRT credential; military respiratory therapy (JST)"],
    ["1221", "Pharmacy technology", "PTCB or ExCPT certification; military pharmacy technician (JST)"],
    ["1223", "Health information", "AHIMA RHIT or CCA certification"],
    ["1230", "Nursing", "LVN license; CNA; military medic training (JST)"],
    ["1250", "Emergency medical services", "NREMT EMT or Paramedic certification; military medic training (JST)"],
    ["1251", "Paramedic", "NREMT Paramedic; military medic training (JST)"],
    ["1260", "Health professions", "Industry certification; military medical training (JST)"],
    ["1299", "Health, other", "Industry certification; military medical training (JST)"],
    ["1303", "Fashion", "Professional portfolio"],
    ["1305", "Child development", "Child Development Permit; CDA credential; work experience (portfolio)"],
    ["1306", "Nutrition, foods and culinary arts", "ServSafe Manager; ACF certification; military culinary specialist (JST)"],
    ["1307", "Hospitality", "ServSafe; AHLEI certifications; military food service (JST)"],
    ["2104", "Human services", "CCAPP or CADC certification; work experience (portfolio)"],
    ["2105", "Administration of justice", "POST Basic or Regular academy; corrections training (CDCR, STC); military police training (JST)"],
    ["2133", "Fire technology", "CA State Fire Training (Firefighter I/II, Fire Officer); CAL FIRE academy; military firefighter (JST)"],
    ["1401", "Law and paralegal", "NALA Certified Paralegal; military paralegal (JST)"],
    ["3007", "Cosmetology", "CA Board of Barbering and Cosmetology license"]
  ];

  function fixName(s) {
    // Some exports carry UTF-8 read as Latin-1 ("CaÃ±ada").
    s = String(s || "");
    if (!/Ã|Â/.test(s)) return s;
    try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
  }
  function codeKey(subj, num) {
    return (String(subj || "") + " " + String(num || "")).replace(/\s+/g, " ").trim().toUpperCase();
  }
  function topSource(top) {
    var t = String(top || "").replace(/\./g, "");
    for (var i = 0; i < TOP_SOURCES.length; i++) {
      if (t.indexOf(TOP_SOURCES[i][0]) === 0) return { family: TOP_SOURCES[i][1], src: TOP_SOURCES[i][2] };
    }
    return null;
  }
  function shortCollege(s) {
    var t = fixName(s);
    if (t.normalize) t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return t.toUpperCase().replace(/[^A-Z ]/g, " ").replace(/\bTECHNICAL\b/g, "TECH").replace(/\bLOS ANGELES\b/g, "LA")
      .replace(/\b(COMMUNITY|JUNIOR|COLLEGE|OF|THE|NON|CREDIT|NONCREDIT)\b/g, " ").replace(/\s+/g, "");
  }

  /* Title-only matching, gated (the 2026-09-18 three-college run's guards): a
   * module (1A, 2B) or a welding process named on both sides must agree, generic
   * words never count, and a course with a generic title never matches. */
  var STOP = {};
  ("a an and the of in for to with i ii iii iv hours hour units unit semester credit elective " +
   "introduction intro fundamentals basic principles general course courses or").split(" ")
    .forEach(function (w) { STOP[w] = 1; });
  var GENERIC = {};
  ("information systems technology management education advanced experience work skills practices " +
   "applications science studies theory methods certification preparation review lab laboratory").split(" ")
    .forEach(function (w) { GENERIC[w] = 1; });
  var PROCESS = [["smaw", /shielded metal|smaw/], ["gmaw", /gas metal|gmaw|\bmig\b/],
                 ["fcaw", /flux.cored|fcaw/], ["gtaw", /gas tungsten|gtaw|\btig\b/]];
  function toks(s) {
    var out = {};
    (String(s || "").toLowerCase().match(/[a-z0-9+]+/g) || []).forEach(function (w) {
      if (!STOP[w] && !/^\d+$/.test(w)) out[w] = 1;
    });
    return out;
  }
  function marks(s) {
    var t = String(s || "").toLowerCase(), mods = {}, procs = {};
    (t.match(/\b[1-4][a-f]\b/g) || []).forEach(function (m) { mods[m] = 1; });
    PROCESS.forEach(function (p) { if (p[1].test(t)) procs[p[0]] = 1; });
    return { mods: Object.keys(mods).sort().join(","), procs: Object.keys(procs) };
  }
  function guardsAgree(a, b) {
    var ma = marks(a), mb = marks(b);
    if (ma.mods && mb.mods && ma.mods !== mb.mods) return false;
    if (ma.procs.length !== 0 || mb.procs.length !== 0) {
      if (!ma.procs.length || !mb.procs.length) return false;
      if (!ma.procs.some(function (p) { return mb.procs.indexOf(p) >= 0; })) return false;
    }
    return true;
  }
  function titleMatches(topic, title) {
    if (!guardsAgree(topic, title)) return null;
    var a = toks(topic), b = toks(title), shared = [], union = {};
    Object.keys(a).forEach(function (w) { union[w] = 1; if (b[w]) shared.push(w); });
    Object.keys(b).forEach(function (w) { union[w] = 1; });
    var ka = Object.keys(a), kb = Object.keys(b);
    if (!ka.length) return null;
    var same = ka.length === kb.length && shared.length === ka.length;
    var distinctive = shared.filter(function (w) { return !GENERIC[w]; }).length;
    if (same || (distinctive >= 2 && shared.length / Object.keys(union).length >= 0.5)) return shared;
    return null;
  }

  /* PURE. Everything the workbook and the summary need, from explicit inputs:
   *   { college, lookup, members, aligned, statewide, programs, catalog, today } */
  // Names a normalized match cannot reach: the COCI program inventory words them differently.
  var ALIASES = { "City College of San Francisco": "SAN FRANCISCO CITY", "San Bernardino Valley College": "SAN BERNARDINO",
    "North Orange Continuing Education": "NORTH ORANGE ADULT", "San Diego College of Continuing Education": "SAN DIEGO ADULT" };
  function findName(list, name) {
    var fixed = (list || []).map(fixName);
    if (fixed.indexOf(name) >= 0) return name;
    var keys = [shortCollege(name)];
    if (ALIASES[name]) keys.push(shortCollege(ALIASES[name]));
    for (var i = 0; i < fixed.length; i++) if (keys.indexOf(shortCollege(fixed[i])) >= 0) return fixed[i];
    return null;
  }

  function build(input) {
    var asked = input.college, lookup = input.lookup, members = input.members;
    // Each source spells some colleges its own way; resolve the name per source.
    var college = findName(lookup.colleges, asked) || asked;
    var alignedMap = (input.aligned && input.aligned.aligned) || {};
    var sw = input.statewide || { exhibits: [] };
    var notes = [];

    // ── courses (COCI) with their CURRENT identity ──────────────────────
    var li = (lookup.colleges || []).map(fixName).indexOf(college);
    var mi = (members.colleges || []).map(fixName).indexOf(findName(members.colleges, asked));
    if (li < 0) notes.push("No COCI course list rows matched this college's name.");
    var ident = {};
    if (mi >= 0) {
      Object.keys(members.members || {}).forEach(function (id) {
        members.members[id].forEach(function (r) { if (r.c === mi && r.cn) ident[r.cn] = id; });
      });
    }
    var courses = (lookup.rows || []).filter(function (r) { return r[0] === li; }).map(function (r) {
      var top = String(r[7] || ""), k = top.indexOf(":");
      return { cn: r[1], subj: r[2], num: String(r[3]), id: codeKey(r[2], r[3]), title: r[4], units: r[5],
               credit: r[6] === "N" ? "Noncredit" : r[6] === "C" ? "Credit" : (r[6] || ""),
               top: k >= 0 ? top.slice(0, k).trim() : top.trim(), topTitle: k >= 0 ? top.slice(k + 1).trim() : "",
               cid: r[8] || "", ident: ident[r[1]] || "" };
    });
    var byId = {};
    courses.forEach(function (c) { byId[c.id] = c; });

    // ── catalog harvest: which courses each program lists ───────────────
    var catalog = input.catalog || [];
    var progCourses = {}, inCatalog = {};
    // Some catalogs write a code without its space (Bakersfield: "AUTOB30" for
    // AUTO B30, 1,415 of 2,492 codes on 2026-10-21); resolve one to the COCI
    // course whose subject and number join to the same string.
    // Foothill's COCI numbers carry leading zeros ("ACTG 001A" for the catalog's
    // "ACTG 1A", 1,077 of 2,370 codes on 2026-10-21), so the key drops those too.
    function joinKey(subj, num) {
      return (String(subj) + String(num).replace(/^0+(?=[0-9A-Z])/i, "")).replace(/ /g, "").toUpperCase();
    }
    var joined = {};
    courses.forEach(function (c) { joined[joinKey(c.subj, c.num)] = c.id; });
    function catKey(s) {
      // Moreno Valley's catalog writes "ACC-1A" for ACC 1A.
      var k = codeKey(String(s || "").replace(/^([A-Za-z]+)-(?=[0-9])/, "$1 "), ""), m = /^(.*?) ?(\S+)$/.exec(k);
      return byId[k] || !k ? k : (joined[m ? joinKey(m[1], m[2]) : k.replace(/ /g, "")] || k);
    }
    catalog.forEach(function (p) {
      var set = {};
      (p.blocks || []).forEach(function (b) {
        (b.courses || []).forEach(function (c) {
          var code = catKey(c.code);
          set[code] = 1; inCatalog[code] = 1;
          (c.alternatives || []).forEach(function (alt) {
            var a2 = catKey(typeof alt === "string" ? alt : alt && alt.code);
            if (a2) { set[a2] = 1; inCatalog[a2] = 1; }
          });
        });
      });
      progCourses[p.control_number] = Object.keys(set);
    });
    var coursePrograms = {};
    catalog.forEach(function (p) {
      (progCourses[p.control_number] || []).forEach(function (code) {
        (coursePrograms[code] = coursePrograms[code] || []).push(p);
      });
    });
    if (!catalog.length) notes.push("No program record has been read from this college's catalog yet, so program-to-course links are not shown.");

    // ── MAP exhibits for this college (non-exam) ─────────────────────────
    var swNames = {};
    sw.exhibits.forEach(function (e) {
      (e.adopter_names || []).concat(e.potential_names || []).forEach(function (n2) { swNames[n2] = 1; });
    });
    var swCollege = findName(Object.keys(swNames), asked) || asked;
    var existing = [], existingBy = {}, adoptedTitles = {};
    sw.exhibits.forEach(function (e) {
      if ((e.adopter_names || []).indexOf(swCollege) < 0) return;
      adoptedTitles[e.unified_title] = 1;
      if (EXAM_RE.test(e.unified_title)) return;
      ((e.adopter_rec_idx || {})[swCollege] || []).forEach(function (i) {
        var rec = (e.credit_recs || [])[i] || {};
        var cid = codeKey(rec.course, "");
        var c = byId[cid];
        existing.push({ ids: (e.exhibit_ids || []).join(", "), title: e.unified_title, type: e.cpl_type,
          credit: rec.credit || "", disc: e.discipline || "", course: cid, courseTitle: c ? c.title : "(not in COCI list)",
          units: (e.adopter_units || {})[swCollege], issuer: e.issuing_agency || "",
          origin: e.collaborative_type === "CCC Collaborative" ? "Adopted statewide credit recommendation"
            : e.collaborative_type === "Local" ? "College-created (local) exhibit" : e.collaborative_type + " exhibit" });
        (existingBy[cid] = existingBy[cid] || []).push(e.unified_title);
      });
    });

    // ── statewide candidates and peer evidence per course ───────────────
    var swByTitle = {};
    var candidates = sw.exhibits.filter(function (e) {
      return STATEWIDE_TYPES[e.collaborative_type] && !EXAM_RE.test(e.unified_title) && !adoptedTitles[e.unified_title];
    });
    candidates.forEach(function (e) { swByTitle[e.unified_title] = e; });
    /* "Request Adopt": the link opens MAP's CPL Opportunities page searched
     * for the exhibit ID, given only for an ID the page's own API listed when
     * kb/_verify_map_exhibit_links.py last ran. */
    var ver = input.verified || { found: {} }, verDate = String(ver.checked_at || "").slice(0, 10);
    /* One credential joins every exhibit MAP holds under its name, often built by different
     * colleges (Sam, 2026-10-26: a chip per ID naming the college that built it, each opening
     * MAP searched for its own ID). The builder is MAP's owner field, recorded by the verify script. */
    var shortName = input.shortName || (typeof window !== "undefined" && window.cplCollegeShort) || function (n2) { return n2; };
    function linkFor(e) {
      var ids = (e.exhibit_ids || []).filter(function (i) { return ver.found && ver.found[String(i).toUpperCase()]; });
      if (ids.length && !mapLinks()) return { link: "", ids: [], chips: [], status: "Not linked: the MAP address (map_links.js) did not load" };
      if (ids.length) {
        var chips = ids.map(function (i) {
          var college = ver.found[String(i).toUpperCase()].college || "";
          return { id: i, college: college, short: college ? shortName(college) || college : "", link: mapLink(i) };
        });
        return { link: mapLink(ids[0]), ids: ids, chips: chips, status: "Verified " + verDate + ": "
          + chips.map(function (c) { return c.id + (c.college ? " (built by " + c.college + ")" : ""); }).join(", ")
          + " listed on MAP's CPL Opportunities page. The link opens it searched for " + ids[0] + "; Request Quick Adopt there needs no MAP sign-in and asks a college initiator to adopt; Quick Adopt needs one and starts the approval queue." };
      }
      return { link: "", ids: [], chips: [], status: input.verified
        ? "Not listed on MAP's CPL Opportunities page when checked " + verDate + "; no link given"
        : "Not verified: the MAP link check could not be read" };
    }
    courses.forEach(function (c) {
      c.existing = existingBy[c.id] || [];
      c.inCatalog = !!inCatalog[c.id];
      c.programs = coursePrograms[c.id] || [];
      c.sw = []; c.peer = []; c.swTitle = [];
      (alignedMap[c.ident] || []).forEach(function (ent) {
        if (EXAM_RE.test(ent.c) || adoptedTitles[ent.c]) return;
        var peers = (ent.g || []).map(fixName).filter(function (g) { return g !== college && g !== swCollege && g !== asked; });
        if (!peers.length) return;
        var e = swByTitle[ent.c];
        if (e) { if (!c.sw.some(function (x) { return x.e === e; })) c.sw.push({ e: e, ent: ent, peers: peers }); }
        else c.peer.push({ ent: ent, peers: peers });
      });
      var ts = topSource(c.top);
      c.family = ts ? ts.family : ""; c.src = ts ? ts.src : "";
      c.apprentice = /apprentic/i.test(c.title) || c.top.replace(/\./g, "").indexOf("0952") === 0;
    });
    var reached = {};
    courses.forEach(function (c) { c.sw.forEach(function (x) { reached[x.e.unified_title] = 1; }); });
    var titleRows = {};
    candidates.forEach(function (e) {
      if (reached[e.unified_title]) return;
      var topics = {};
      (e.credit_recs || []).forEach(function (r) {
        topics[String(r.credit || "").replace(/^\s*[\d.\-–\s]*(or\s+[\d.]+\s*)?(semester\s*)?(hours?|units?)\s*(in|of)?\s*/i, "").trim()] = 1;
      });
      var hits = [];
      courses.forEach(function (c) {
        if (hits.length >= 6 || CATALOG_STOP.test(c.title) || /^(29[4-9]|49[4-9])$/.test(c.num)) return;
        var keys = Object.keys(topics);
        for (var i = 0; i < keys.length; i++) {
          var shared = titleMatches(keys[i], c.title);
          if (shared) { hits.push({ c: c, topic: keys[i], shared: shared }); c.swTitle.push({ e: e, topic: keys[i] }); break; }
        }
      });
      titleRows[e.unified_title] = hits;
    });

    // ── tiers and priority ───────────────────────────────────────────────
    function maxPeers(list) { return list.reduce(function (m, x) { return Math.max(m, x.peers.length); }, 0); }
    courses.forEach(function (c) {
      c.tier = c.existing.length ? "Confirmed: existing MAP exhibit"
        : (c.sw.length || c.peer.length) ? "Needs validation: peer articulation"
        : c.swTitle.length ? "Needs validation: title match only" : "None identified";
      var p = null;
      if ((c.sw.length && maxPeers(c.sw) >= 2) || maxPeers(c.peer) >= 3) p = "High";
      else if (c.sw.length || c.peer.length || c.swTitle.length || c.apprentice) p = "Medium";
      else if (c.family) p = "Low";
      c.priority = c.existing.length ? null : p;
    });

    // ── programs ─────────────────────────────────────────────────────────
    var progs = input.programs || { colleges: [], rows: [], awards: [], statuses: [] };
    var pi = (progs.colleges || []).map(fixName).indexOf(findName(progs.colleges, asked));
    if (pi < 0) notes.push("No COCI program inventory rows matched this college's name.");
    var catByCtrl = {};
    catalog.forEach(function (p) { catByCtrl[p.control_number] = p; });
    var programs = (progs.rows || []).filter(function (r) { return r[0] === pi; }).map(function (r) {
      var cat = catByCtrl[r[1]];
      var cs = cat ? (progCourses[r[1]] || []).map(function (k) { return byId[k]; }).filter(Boolean) : [];
      var fam = {};
      cs.forEach(function (c) { if (c.family) fam[c.src] = (fam[c.src] || 0) + 1; });
      var swNames = {};
      cs.forEach(function (c) { c.sw.forEach(function (x) { swNames[x.e.unified_title] = 1; }); });
      var nEx = cs.filter(function (c) { return c.existing.length; }).length;
      var nOpp = cs.filter(function (c) { return c.sw.length || c.peer.length || c.swTitle.length; }).length;
      var exp = [];
      var swList = Object.keys(swNames);
      if (swList.length) exp.push("Statewide CRs to review: " + swList.slice(0, 4).join("; "));
      if (nOpp) exp.push(nOpp + " course(s) with aligned evidence (see the opportunities sheet)");
      var srcs = Object.keys(fam).sort(function (a, b) { return fam[b] - fam[a]; }).slice(0, 2);
      if (srcs.length) exp.push("Prior-learning sources to research: " + srcs.join(" | "));
      if (!exp.length) exp.push(cat ? "Credit by exam or portfolio review; no aligned exhibit evidence found"
        : "No program record read from the catalog; its courses are not linked here");
      return { ctrl: r[1], title: r[2], top: r[3], cip: r[4], award: (progs.awards || [])[r[5]] || "",
        status: (progs.statuses || [])[r[6]] || "", units: r[7], cte: r[9] ? "CTE" : "", nCourses: cat ? cs.length : "",
        nExisting: cat ? nEx : "", nOpp: cat ? nOpp : "",
        coverage: !cat ? "No program record" : nEx ? "Some coverage" : nOpp ? "None: opportunities identified" : "None: no aligned evidence found",
        expansion: exp.join("\n"), page: cat ? cat.source_url || "" : "" };
    });
    programs.sort(function (a, b) { return (a.status !== "Active") - (b.status !== "Active") || String(a.title).localeCompare(String(b.title)); });

    // ── statewide rows ────────────────────────────────────────────────────
    var swRows = [];
    var pathRows = {};
    courses.forEach(function (c) {
      c.sw.forEach(function (x) { (pathRows[x.e.unified_title] = pathRows[x.e.unified_title] || []).push({ c: c, x: x }); });
    });
    candidates.slice().sort(function (a, b) {
      return String(a.discipline || "").localeCompare(String(b.discipline || "")) || a.unified_title.localeCompare(b.unified_title);
    }).forEach(function (e) {
      var related = e.cpl_type === "Military" ? "Military training: " + (e.issuing_agency || "military")
        : /Apprenticeship/.test(e.collaborative_type) ? "Apprenticeship: " + (e.issuing_agency || "")
        : e.cpl_type + ": " + (e.issuing_agency || "issuer not recorded");
      var lk = linkFor(e);
      var base = { title: e.unified_title, ids: (e.exhibit_ids || []).join(", "), crId: lk.ids.length ? lk.ids.join(", ") : (e.exhibit_ids || [])[0] || "",
        ctype: e.collaborative_type, type: e.cpl_type, disc: e.discipline || "", related: related, adopters: e.adopters,
        median: e.peer_units_median, link: lk.link, chips: lk.chips, linkStatus: lk.status };
      var paths = pathRows[e.unified_title] || [], titles = titleRows[e.unified_title] || [];
      paths.forEach(function (p) {
        swRows.push(Object.assign({}, base, { course: p.c.id + " " + p.c.title, courseId: p.c.id, units: p.c.units, cn: p.c.cn,
          tier: "Needs validation: aligned via peer articulation", couldAdopt: "Yes",
          priority: p.x.peers.length >= 2 ? "High" : "Medium",
          why: p.x.peers.length + " peer college(s) (" + p.x.peers.slice(0, 4).join(", ") + (p.x.peers.length > 4 ? ", …" : "")
            + ") articulate this CR to common course " + p.c.ident + ", which includes " + p.c.id + ". Peer credit: "
            + (p.x.ent.r || []).slice(0, 2).join("; "),
          action: "Faculty compare the course outline of record with the CR; if aligned, adopt the CR in MAP and articulate it to this course" }));
      });
      titles.forEach(function (t) {
        swRows.push(Object.assign({}, base, { course: t.c.id + " " + t.c.title, courseId: t.c.id, units: t.c.units, cn: t.c.cn,
          tier: "Possible: title match only", couldAdopt: "Yes", priority: "Low",
          why: "The CR's credit topic '" + t.topic + "' shares terms (" + t.shared.join(", ") + ") with the course title only.",
          action: "Faculty review whether the course content matches before any adoption" }));
      });
      if (!paths.length && !titles.length) {
        swRows.push(Object.assign({}, base, { course: "None identified", courseId: "", units: "", cn: "", tier: "None identified",
          couldAdopt: "No", priority: "Low",
          why: "No course found through a peer articulation or a title match.",
          action: "Faculty confirm whether a course carries these competencies; none may exist (a curriculum gap)" }));
      }
    });

    // ── opportunities ─────────────────────────────────────────────────────
    var order = { High: 0, Medium: 1, Low: 2 };
    var opps = courses.filter(function (c) { return c.priority; }).sort(function (a, b) {
      return order[a.priority] - order[b.priority] || a.id.localeCompare(b.id);
    }).map(function (c) {
      var sources = [], proposals = [], swcr = [], steps = [];
      c.sw.forEach(function (x) {
        swcr.push(x.e.unified_title + " [" + (x.e.exhibit_ids || []).slice(0, 2).join(", ") + "]: " + x.peers.length + " peer college(s)");
        sources.push(x.e.cpl_type + ": " + x.e.unified_title + " (" + (x.e.issuing_agency || x.e.collaborative_type) + ")");
      });
      c.swTitle.forEach(function (x) {
        swcr.push(x.e.unified_title + " [" + (x.e.exhibit_ids || []).slice(0, 2).join(", ") + "]: title match only");
        sources.push(x.e.cpl_type + ": " + x.e.unified_title);
      });
      if (swcr.length) {
        proposals.push("Adopt an existing statewide credit recommendation in MAP");
        steps.push("Faculty compare the CR's competencies with the course outline of record; if aligned, adopt the CR in MAP and articulate it to this course");
      }
      var peers = c.peer.slice().sort(function (a, b) { return b.peers.length - a.peers.length; });
      peers.slice(0, 4).forEach(function (x) {
        sources.push((x.ent.p || "") + ": " + x.ent.c + " (" + (x.ent.i || "issuer not recorded") + "): " + x.peers.length
          + " college(s): " + x.peers.slice(0, 3).join(", ") + (x.peers.length > 3 ? ", …" : ""));
      });
      if (peers.length) {
        proposals.push("Build a new local exhibit modeled on peer colleges' articulations to the same common course");
        steps.push("Ask the peer colleges for their exhibits in MAP, confirm the credential's competencies against the course outline, then build the exhibit in MAP");
      }
      if (!sources.length) {
        if (c.apprentice) {
          sources.push("Registered apprenticeship: journey-level card, JATC related-instruction records");
          proposals.push("New exhibit for journey-level workers or other programs' completers");
          steps.push("Confirm with the apprenticeship coordinator which training records evidence the course outcomes");
        } else {
          sources.push(c.src);
          proposals.push("Possible new exhibit: research a documented prior-learning source");
          steps.push("Faculty review the course outline against the listed sources; build an exhibit only where a credential's documented competencies match");
        }
      }
      var lead = c.sw.length ? c.sw.slice().sort(function (a, b) { return b.peers.length - a.peers.length; })[0].e
        : c.swTitle.length ? c.swTitle[0].e : null;
      var lk = lead ? linkFor(lead) : { link: "", ids: [], status: "" };
      var why = [];
      c.sw.slice(0, 2).forEach(function (x) {
        why.push(x.peers.length + " peer college(s) articulate " + x.e.unified_title + " to common course " + c.ident + ", which includes " + c.id);
      });
      peers.slice(0, 2).forEach(function (x) {
        why.push(x.peers.length + " peer college(s) articulate " + x.ent.c + " to common course " + c.ident);
      });
      c.swTitle.slice(0, 1).forEach(function (x) { why.push("Title match only: the CR's topic '" + x.topic + "'"); });
      if (!why.length) why.push(c.apprentice ? "Apprenticeship course: journey-level training may evidence its outcomes"
        : "TOP area " + (c.family || c.topTitle) + " has documented prior-learning sources; no peer articulation yet");
      return { couldAdopt: lead ? "Yes" : "No", crId: lead ? (lk.ids.length ? lk.ids.join(", ") : (lead.exhibit_ids || [])[0] || "") : "",
        crTitle: lead ? lead.unified_title : "", crDisc: lead ? lead.discipline || "" : "",
        exhibitIds: lead ? (lead.exhibit_ids || []).join(", ") : "", why: why.join("\n"),
        link: lk.link, linkStatus: lead ? lk.status : "No statewide CR for this course",
        programs: c.programs.slice(0, 3).map(function (p) { return p.program_title + " (" + p.award + ")"; }).join("; ")
                 + (c.programs.length > 3 ? "; +" + (c.programs.length - 3) + " more" : ""),
        area: c.topTitle, id: c.id, title: c.title, units: c.units, top: c.top + " " + c.topTitle,
        sources: sources.join("\n"), proposals: proposals.join("\n"), swcr: swcr.join("\n") || "None",
        steps: steps.join("\n"), priority: c.priority, tier: c.tier, cn: c.cn, ident: c.ident };
    });

    // ── era check: identity and alignment must be one build ──────────────
    var eraA = Date.parse(String(members.generated_at || "").replace(" ", "T"));
    var eraB = Date.parse(String((input.aligned || {}).generated_at || "").replace(" ", "T"));
    if (!isNaN(eraA) && !isNaN(eraB) && Math.abs(eraA - eraB) > 15 * 60 * 1000) {
      notes.push("The course identity file and the alignment file come from different builds (" + members.generated_at
        + " and " + input.aligned.generated_at + "). Reload the page and build again before relying on the alignments.");
    }

    function count(list, key) {
      var o = {};
      list.forEach(function (x) { o[x[key]] = (o[x[key]] || 0) + 1; });
      return o;
    }
    var areas = {};
    opps.forEach(function (o) {
      var a = areas[o.area || "(no TOP title)"] = areas[o.area || "(no TOP title)"] || { High: 0, Medium: 0, Low: 0 };
      a[o.priority]++;
    });
    return {
      college: asked, today: input.today,
      shareUrl: input.shareBase ? input.shareBase + "?college=" + encodeURIComponent(asked) : "", courses: courses, programs: programs, existing: existing,
      opps: opps, swRows: swRows, notes: notes,
      summary: {
        nCourses: courses.length, nPrograms: programs.length,
        nActivePrograms: programs.filter(function (p) { return p.status === "Active"; }).length,
        tiers: count(courses, "tier"), priority: count(opps, "priority"),
        coverage: count(programs.filter(function (p) { return p.status === "Active"; }), "coverage"),
        nCandidates: candidates.length,
        nCandidatesReached: candidates.filter(function (e) { return (pathRows[e.unified_title] || []).length || (titleRows[e.unified_title] || []).length; }).length,
        areas: Object.keys(areas).map(function (k) { return [k, areas[k].High, areas[k].Medium, areas[k].Low]; })
          .sort(function (a, b) { return (b[1] * 100 + b[2] * 10 + b[3]) - (a[1] * 100 + a[2] * 10 + a[3]); }).slice(0, 14),
        verifiedAt: verDate, nVerified: candidates.filter(function (e) { return linkFor(e).ids.length; }).length,
        topStatewide: candidates.filter(function (e) { return (pathRows[e.unified_title] || []).length; })
          .sort(function (a, b) { return b.adopters - a.adopters; }).slice(0, 15)
          .map(function (e) { return [e.unified_title, e.discipline || "", e.adopters, e.peer_units_median, pathRows[e.unified_title].length]; }),
        statewideGenerated: sw.generated_at || ""
      }
    };
  }

  /* PURE. The workbook's sheets: [{ name, headers, rows, widths }]. A cell may be
   * { link, text }: the writer makes it a working Excel hyperlink. */
  function L(url, text) { return url ? { link: url, text: text } : ""; }
  var ADOPT_TEXT = "Request Adopt";
  function sheets(b) {
    var out = [];
    out.push({ name: "1 Active Programs (COCI)", widths: [12, 34, 18, 26, 12, 12, 7, 8, 11, 13, 13, 24, 60, 22],
      headers: ["Program Control Number", "Program Title", "Award Type", "TOP Code", "CIP Code", "Program Status (COCI)", "CTE",
        "Units", "Courses Listed (Catalog)", "Courses with MAP Exhibit (non-AP/IB)", "Courses with Aligned Evidence",
        "CPL Coverage", "Possible CPL Expansion Areas", "Catalog Program Page"],
      rows: b.programs.map(function (p) {
        return [p.ctrl, p.title, p.award, p.top, p.cip, p.status, p.cte, p.units, p.nCourses, p.nExisting, p.nOpp,
          p.coverage, p.expansion, L(p.page, "Open catalog page")];
      }) });
    out.push({ name: "2 Active Courses (COCI)", widths: [12, 36, 15, 7, 10, 9, 26, 12, 16, 11, 10, 12, 30, 10, 10, 30],
      headers: ["Course ID", "Course Title", "CB00 Control Number", "Units", "Credit Type", "TOP Code", "Discipline Area (TOP)", "C-ID",
        "Common Course Identity (M-ID / C-ID)", "In Catalog Program Requirements", "Programs Listing It",
        "Existing CPL Coverage (MAP, non-AP/IB)", "Existing Exhibit(s)", "Statewide CR Candidates", "Peer-College CPL Exhibits",
        "Alignment Tier"],
      rows: b.courses.slice().sort(function (x2, y) { return x2.id.localeCompare(y.id); }).map(function (c) {
        return [c.id, c.title, c.cn, c.units, c.credit, c.top, c.topTitle, c.cid, c.ident, c.inCatalog ? "Yes" : "No",
          c.programs.length, c.existing.length ? "Yes" : "No", c.existing.join("; "), c.sw.length + c.swTitle.length,
          c.peer.length, c.tier];
      }) });
    out.push({ name: "3 Existing MAP Exhibits", widths: [30, 28, 18, 32, 20, 12, 30, 7, 30, 20],
      headers: ["Exhibit ID(s)", "Exhibit Title", "CPL Type", "Credit Recommendation", "Discipline", "Aligned Course ID",
        "Course Title", "Units", "College-Created or Adopted Statewide", "Issuing Agency"],
      rows: b.existing.map(function (x2) {
        return [x2.ids, x2.title, x2.type, x2.credit, x2.disc, x2.course, x2.courseTitle, x2.units, x2.origin, x2.issuer];
      }) });
    out.push({ name: "4 CPL Expansion Opportunities", widths: [30, 20, 11, 30, 7, 22, 9, 9, 22, 30, 24, 44, 34, 44, 24, 40, 9, 24, 44, 15],
      headers: ["Program Name(s)", "Discipline", "Course ID", "Course Title", "Units", "TOP Code", "Existing MAP Exhibit",
        "Could Adopt (Yes/No)", "Statewide Credit Recommendation ID", "Statewide Credit Recommendation Title", "MAP Exhibit ID",
        "Potential Prior Learning Source", "Proposed CPL Opportunity", "Alignment Rationale", ADOPT_TEXT,
        "Link Verification Status", "Priority Level", "Alignment Tier", "Recommended Next Step", "CB00 Control Number"],
      rows: b.opps.map(function (o) {
        return [o.programs || "(not listed in a catalog program)", o.crDisc || o.area, o.id, o.title, o.units, o.top, "No",
          o.couldAdopt, o.crId, o.crTitle, o.exhibitIds, o.sources, o.proposals, o.why, L(o.link, ADOPT_TEXT), o.linkStatus,
          o.priority, o.tier, o.steps, o.cn];
      }) });
    out.push({ name: "5 Statewide CR Opportunities", widths: [9, 22, 30, 20, 16, 16, 30, 10, 9, 32, 11, 7, 15, 30, 26, 60, 24, 40, 9, 40],
      headers: ["Could Adopt (Yes/No)", "Statewide Credit Recommendation ID", "Statewide Credit Recommendation Title", "Discipline",
        "Collaborative Type", "CPL Type", "Potential Prior Learning Source (Industry, Apprenticeship or Military)", "Colleges Adopted",
        "Peer Median Units", "Matching College Course", "Course ID", "Units", "CB00 Control Number", "MAP Exhibit ID",
        "Alignment Tier", "Alignment Rationale", ADOPT_TEXT, "Link Verification Status", "Priority Level", "Recommended Next Step"],
      rows: b.swRows.map(function (r) {
        return [r.couldAdopt, r.crId, r.title, r.disc, r.ctype, r.type, r.related, r.adopters, r.median == null ? "" : r.median,
          r.course, r.courseId, r.units, r.cn, r.ids, r.tier, r.why, L(r.link, ADOPT_TEXT), r.linkStatus, r.priority, r.action];
      }) });
    var s = b.summary;
    out.push({ name: "About & Sources", widths: [36, 120], headers: ["Item", "Detail"], rows: [
      [b.college + ": CPL opportunity analysis", "Built " + b.today + " from COBI's published data. A snapshot: MAP and COCI data change daily."],
      ["Shareable visual", L(b.shareUrl, b.shareUrl)],
      ["Scope", "AP and IB exhibits are excluded from every sheet; CLEP is included. Statewide credit recommendations are MAP exhibits whose collaborative type is CCC Collaborative, Apprenticeship, Industry, Private Institution or CSU; exhibits other colleges built locally appear as peer-college evidence."],
      ["Request Adopt", "Each link opens MAP's CPL Opportunities page already searched for the Statewide Credit Recommendation ID (" + ((mapLinks() || {}).MAP_PAGE || "MAP") + "?Exhibit= and the ID, with View=Non-Military), so the exhibit's card comes up on the Non-Military Credit tab with Request Quick Adopt, which needs no MAP sign-in and asks a college initiator to adopt, and Quick Adopt, which needs a sign-in and starts the approval queue. A link is given only where MAP's own data listed the ID on that page when last checked (" + (s.verifiedAt || "not checked") + "): " + s.nVerified + " of " + s.nCandidates + " recommendations. Nothing is submitted to MAP from here."],
      ["IDs", "Statewide Credit Recommendation ID: the exhibit ID MAP lists on the CPL Opportunities page. MAP Exhibit ID: every exhibit ID MAP holds under that credential's name."],
      ["Alignment tiers", "Confirmed: an exhibit exists in MAP. Needs validation: peer colleges articulate the same credential to the same common course (the Commons' M-ID or C-ID) that includes this college's course. Possible: title match only. No row says a course qualifies for CPL; discipline faculty compare the course outline of record with the credential's documented competencies first."],
      ["Priority", "High: a statewide CR reached through 2+ peer colleges, or a credential 3+ peer colleges articulate to the same common course. Medium: one peer college, a title-only match, or an apprenticeship course. Low: a TOP family with known prior-learning sources and no peer evidence."],
      ["Units", "Peer Median Units is what adopting colleges awarded, not the recommendation's maximum."],
      ["Counts", s.nCourses + " COCI courses; " + s.nPrograms + " COCI programs (" + s.nActivePrograms + " active); "
        + b.existing.length + " MAP articulation lines (non-AP/IB); " + s.nCandidates + " statewide CRs not adopted, " + s.nCandidatesReached + " reaching a course."],
      ["Pathway links", "Program links go to each program's page in the college catalog, as its program record read it. MyPath pathway links are not in the data this analysis reads, so none are given."],
      ["Source: COCI courses", "coci_lookup_data.js (COCI course list via MAP); course identity from unified_courses_members.js."],
      ["Source: COCI programs", "coci_programs_data.js (COCI program export)."],
      ["Source: catalog", "program_requirement_records, the program records behind the Program Requirements tab."],
      ["Source: MAP exhibits and statewide CRs", "statewide_data.js, generated " + s.statewideGenerated + " from MAP."],
      ["Source: peer articulations", "unified_courses_aligned.js, the Commons' inverse view (exhibits by common course)."],
      ["Needs college verification", "Course status (the COCI course list carries none); every alignment; programs COCI marks other than Active; exhibits the college's public landing page shows that MAP's articulation records do not, or the reverse."]
    ].concat(b.notes.map(function (n) { return ["Note", n]; })) });
    return out;
  }

  /* ── .xlsx writer: stored zip of SpreadsheetML ───────────────────────── */
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function utf8(s) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(s);
    var b = unescape(encodeURIComponent(s)), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  function zip(files) {
    var parts = [], central = [], offset = 0;
    function u16(v) { return [v & 0xFF, (v >>> 8) & 0xFF]; }
    function u32(v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; }
    files.forEach(function (f) {
      var name = utf8(f.name), data = utf8(f.text), crc = crc32(data);
      var head = [].concat([0x50, 0x4B, 0x03, 0x04], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(head), name, data);
      central.push(new Uint8Array([].concat([0x50, 0x4B, 0x01, 0x02], u16(20), u16(20), u16(0x0800), u16(0), u16(0),
        u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset))), name);
      offset += head.length + name.length + data.length;
    });
    var cdSize = central.reduce(function (n, p) { return n + p.length; }, 0);
    var end = new Uint8Array([].concat([0x50, 0x4B, 0x05, 0x06], u16(0), u16(0), u16(files.length), u16(files.length),
      u32(cdSize), u32(offset), u16(0)));
    var all = parts.concat(central, [end]);
    var total = all.reduce(function (n, p) { return n + p.length; }, 0), out = new Uint8Array(total), at = 0;
    all.forEach(function (p) { out.set(p, at); at += p.length; });
    return out;
  }
  function x(s) {
    return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function colName(i) {
    var s = "";
    for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s;
    return s;
  }
  function sheetXml(sh) {
    var lastCol = colName(Math.max(sh.headers.length - 1, 0)), lastRow = sh.rows.length + 1;
    var cols = sh.headers.map(function (_, i) {
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (sh.widths[i] || 18) + '" customWidth="1"/>';
    }).join("");
    function cell(v, r, c, style) {
      var ref = colName(c) + r;
      if (v === null || v === undefined || v === "") return "";
      if (typeof v === "number" && isFinite(v)) return '<c r="' + ref + '" s="' + style + '"><v>' + v + "</v></c>";
      if (typeof v === "object" && v.link) {
        var q = function (t) { return x(String(t).replace(/"/g, '""')); };
        return '<c r="' + ref + '" s="3" t="str"><f>HYPERLINK("' + q(v.link) + '","' + q(v.text) + '")</f><v>' + x(v.text) + "</v></c>";
      }
      if (typeof v === "object") return "";
      return '<c r="' + ref + '" s="' + style + '" t="inlineStr"><is><t xml:space="preserve">' + x(v) + "</t></is></c>";
    }
    var rows = ['<row r="1" ht="42" customHeight="1">' + sh.headers.map(function (h, c) { return cell(h, 1, c, 1); }).join("") + "</row>"];
    sh.rows.forEach(function (row, i) {
      rows.push('<row r="' + (i + 2) + '">' + row.map(function (v, c) { return cell(v, i + 2, c, 2); }).join("") + "</row>");
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<dimension ref="A1:' + lastCol + lastRow + '"/>'
      + '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>'
      + '<selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>'
      + '<sheetFormatPr defaultRowHeight="15"/><cols>' + cols + "</cols><sheetData>" + rows.join("") + "</sheetData>"
      + '<autoFilter ref="A1:' + lastCol + lastRow + '"/></worksheet>';
  }
  function toXlsx(list) {
    var files = [];
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      + '<Default Extension="xml" ContentType="application/xml"/>'
      + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
      + '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
      + list.map(function (_, i) {
        return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      }).join("") + "</Types>";
    files.push({ name: "[Content_Types].xml", text: ct });
    files.push({ name: "_rels/.rels", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' });
    var defs = list.map(function (sh, i) {
      return '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + x(sh.name.slice(0, 31).replace(/'/g, "''"))
        + "'!$A$1:$" + colName(Math.max(sh.headers.length - 1, 0)) + "$" + (sh.rows.length + 1) + "</definedName>";
    }).join("");
    files.push({ name: "xl/workbook.xml", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
      + list.map(function (sh, i) { return '<sheet name="' + x(sh.name.slice(0, 31)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join("")
      + "</sheets><definedNames>" + defs + "</definedNames></workbook>" });
    files.push({ name: "xl/_rels/workbook.xml.rels", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + list.map(function (_, i) {
        return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
      }).join("")
      + '<Relationship Id="rId' + (list.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' });
    // Styles: 0 default · 1 header (bold white on CO seal blue, wrapped) · 2 body (wrapped, top) · 3 link.
    files.push({ name: "xl/styles.xml", text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
      + '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
      + '<font><b/><u/><sz val="11"/><color rgb="FF0047AB"/><name val="Calibri"/></font></fonts>'
      + '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>'
      + '<fill><patternFill patternType="solid"><fgColor rgb="FF002F6D"/><bgColor indexed="64"/></patternFill></fill></fills>'
      + '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
      + '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
      + '<cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
      + '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>'
      + '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>'
      + '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs>'
      + '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' });
    list.forEach(function (sh, i) { files.push({ name: "xl/worksheets/sheet" + (i + 1) + ".xml", text: sheetXml(sh) }); });
    return zip(files);
  }

  /* PURE. The college's visual: the markup the shareable page shows. Filters are
   * wired by wirePage(); everything readable is in the markup at rest. */
  // ── The MAP team's notes on one college's visual (Sam, 2026-10-26, S490) ──
  // The page is one template computed from published data, so a note about one college
  // had nowhere to go. A session writes what a note or a document asks for to
  // library/cpl-opportunity/notes/<slug>.json (the Library tab's Regenerate on that college's
  // record), and the page shows it under At a glance while the figures keep refreshing.
  // A draft waiting on Replace the public copy is <slug>.draft.json, shown at ?draft=1.
  // {college, updated (YYYY-MM-DD), heading?, sections: [{heading, paragraphs[], items[]}],
  //  contacts: [{name, role, organization, email}]}. The slug is the Library's.
  function notesSlug(name) {
    return String(name || "").toLowerCase().replace(/\s+college$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "college";
  }
  var NOTE_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function notesHtml(nt, college) {
    var e = x;
    if (!nt || typeof nt !== "object") return "";
    if (college && nt.college && String(nt.college).toLowerCase() !== String(college).toLowerCase()) return "";
    var arr = function (v) { return Array.isArray(v) ? v.filter(function (t) { return typeof t === "string" && t.trim(); }) : []; };
    var secs = Array.isArray(nt.sections) ? nt.sections.filter(function (sc) { return sc && (sc.heading || arr(sc.paragraphs).length || arr(sc.items).length); }) : [];
    var people = Array.isArray(nt.contacts) ? nt.contacts.filter(function (c) { return c && c.name; }) : [];
    if (!secs.length && !people.length) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nt.updated || "");
    var when = m ? (+m[3]) + " " + NOTE_MONTHS[+m[2] - 1] + " " + m[1] : "";
    var html = '<section aria-labelledby="cpo-h-notes" class="cpo-notes"><h2 id="cpo-h-notes">' + e(nt.heading || "Notes from the MAP team") + "</h2>"
      + (nt.draft ? '<p class="cpo-note"><b>Draft.</b> These notes are not on the public page yet.</p>' : "")
      + (when ? '<p class="cpo-note">Written ' + e(when) + ". The figures on this page refresh with MAP's data; these notes change when the MAP team revises them.</p>" : "");
    secs.forEach(function (sc) {
      if (sc.heading) html += "<h3>" + e(sc.heading) + "</h3>";
      arr(sc.paragraphs).forEach(function (t) { html += "<p>" + e(t) + "</p>"; });
      var items = arr(sc.items);
      if (items.length) html += "<ul>" + items.map(function (t) { return "<li>" + e(t) + "</li>"; }).join("") + "</ul>";
    });
    if (people.length) {
      html += "<h3>Who to talk to</h3><ul class=\"cpo-people\">" + people.map(function (c) {
        var mail = /^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(c.email || "") ? ', <a href="mailto:' + e(c.email) + '">' + e(c.email) + "</a>" : "";
        return "<li><b>" + e(c.name) + "</b>" + [c.role, c.organization].filter(Boolean).map(function (t) { return ", " + e(t); }).join("") + mail + "</li>";
      }).join("") + "</ul>";
    }
    return html + "</section>";
  }

  /* ── The college's visual in the Commons format (Sam, 2026-11-06: "port it to the generator") ──
   * Figure cards over one course List, a side panel for the course a reader presses, and a
   * Programs view (mockup https://claude.ai/artifact/ESN3ZD6pk64ARJtj4kfty7, advised by Fable).
   * The list is course-grained because the build is: a course carries its MAP exhibits, the
   * statewide recommendations it could adopt (swRows, couldAdopt "Yes") and its peer evidence.
   * A course's CPL status is the first of Could adopt, Has an exhibit, Peers credit it, None found;
   * the Could adopt and Has an exhibit filters each take every course that has one, so a course
   * with an exhibit and an unadopted match sits under both. Exhibit lines whose course is not in COCI's list still get a row, so the
   * list holds every line. The address carries the view, filters and open course, so a shared
   * link opens where the sender was; nothing is stored. Read-only: no edit, flag or sign-in. */
  var STATUS = [["could-adopt", "Could adopt"], ["has-exhibit", "Has an exhibit"], ["peers", "Peers credit it"], ["none", "None found"]];
  var STATUS_NAME = {}; STATUS.forEach(function (p) { STATUS_NAME[p[0]] = p[1]; });
  var PRIO = [["high", "High"], ["medium", "Medium"], ["low", "Low"]];
  var LIMIT = 50;
  function pageDefaults() { return { view: "courses", status: "could-adopt", prio: "", q: "", course: "", limit: LIMIT, plimit: LIMIT }; }
  /* The state a query string names (?college=…&view=programs&status=all&priority=high&q=…&course=…). */
  function pageState(search) {
    var st = pageDefaults(), q = String(search || "").replace(/^\?/, "");
    // A pair that will not decode (a mangled link: "%E0%A4%A") is skipped, so the page still paints.
    function dec(t) { try { return decodeURIComponent(t.replace(/\+/g, " ")); } catch (err) { return null; } }
    q.split("&").forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf("="), k = dec(i < 0 ? kv : kv.slice(0, i)), v = i < 0 ? "" : dec(kv.slice(i + 1));
      if (k == null || v == null) return;
      if (k === "view" && v === "programs") st.view = "programs";
      else if (k === "status") st.status = v === "all" ? "" : (STATUS_NAME[v] ? v : st.status);
      else if (k === "priority") st.prio = /^(high|medium|low)$/.test(v) ? v : "";
      else if (k === "q") st.q = v.slice(0, 120);
      else if (k === "course") st.course = v.slice(0, 40);
    });
    return st;
  }
  function pageQuery(college, st) {
    var p = ["college=" + encodeURIComponent(college)];
    if (st.view === "programs") p.push("view=programs");
    if (st.status !== "could-adopt") p.push("status=" + (st.status || "all"));
    if (st.prio) p.push("priority=" + st.prio);
    if (st.q) p.push("q=" + encodeURIComponent(st.q));
    if (st.course && st.view !== "programs") p.push("course=" + encodeURIComponent(st.course));
    return "?" + p.join("&");
  }
  /* One row per course, plus one per course an exhibit line names that COCI's list lacks. */
  function courseRows(b) {
    if (b._rows) return b._rows;
    var opp = {}, ex = {}, sw = {}, seen = {}, rows = [];
    (b.opps || []).forEach(function (o) { opp[o.id] = o; });
    (b.existing || []).forEach(function (e2) { (ex[e2.course] = ex[e2.course] || []).push(e2); });
    (b.swRows || []).forEach(function (r) { if (r.couldAdopt === "Yes" && r.courseId) (sw[r.courseId] = sw[r.courseId] || []).push(r); });
    function row(id, title, units, disc, tier, prio, notCoci) {
      var o = opp[id] || {}, lines = ex[id] || [], recs = sw[id] || [];
      var s = recs.length ? "could-adopt" : lines.length ? "has-exhibit" : /^Needs validation/.test(tier || o.tier || "") ? "peers" : "none";
      var best = null;
      recs.forEach(function (r) { if (r.link && (!best || (r.adopters || 0) > (best.adopters || 0))) best = r; });
      return { id: id, t: title || "", u: units == null ? "" : units, d: disc || "", s: s, p: o.priority || prio || "", ex: lines, sw: recs,
        why: s === "could-adopt" || s === "peers" ? (o.why || "") : "", steps: s === "could-adopt" || s === "peers" ? (o.steps || "") : "",
        best: best, notCoci: !!notCoci };
    }
    (b.courses || []).forEach(function (c) { seen[c.id] = 1; rows.push(row(c.id, c.title, c.units, c.topTitle, c.tier, c.priority, false)); });
    (b.existing || []).forEach(function (e2) {
      if (!e2.course || seen[e2.course]) return;
      seen[e2.course] = 1;
      rows.push(row(e2.course, e2.courseTitle, e2.units, e2.disc, "", "", true));
    });
    var SO = { "could-adopt": 0, "has-exhibit": 1, "peers": 2, "none": 3 }, PO = { High: 0, Medium: 1, Low: 2 };
    rows.sort(function (a, c) {
      return SO[a.s] - SO[c.s] || (a.p in PO ? PO[a.p] : 3) - (c.p in PO ? PO[c.p] : 3) || a.id.localeCompare(c.id);
    });
    rows.forEach(function (r) {
      r.hay = [r.id, r.t, r.d].concat(r.sw.map(function (w) { return w.title; }), r.ex.map(function (e2) { return e2.title; })).join(" ").toLowerCase();
    });
    b._rows = rows;
    return rows;
  }
  function inStatus(r, k) { return k === "could-adopt" ? r.sw.length > 0 : k === "has-exhibit" ? r.ex.length > 0 : r.s === k; }
  function pageFilter(rows, st) {
    var q = String(st.q || "").trim().toLowerCase(), words = q ? q.split(/\s+/) : [];
    return rows.filter(function (r) {
      if (st.status && !inStatus(r, st.status)) return false;
      if (st.prio && String(r.p).toLowerCase() !== st.prio) return false;
      for (var i = 0; i < words.length; i++) if (r.hay.indexOf(words[i]) < 0) return false;
      return true;
    });
  }

  function pageHtml(b, stIn) {
    var st = Object.assign(pageDefaults(), stIn || {}), s = b.summary, e = x;
    function n(v) { return Number(v || 0).toLocaleString("en-US"); }
    var rows = courseRows(b), count = { "": rows.length }, pc = { high: 0, medium: 0, low: 0 };
    STATUS.forEach(function (p) { count[p[0]] = 0; });
    rows.forEach(function (r) {
      STATUS.forEach(function (p) { if (inStatus(r, p[0])) count[p[0]]++; });
      var k = String(r.p).toLowerCase(); if (k in pc) pc[k]++;
    });
    var matches = rows.reduce(function (t, r) { return t + r.sw.length; }, 0);
    var progs = (b.programs || []).filter(function (p) { return p.status === "Active"; });
    function pressed(on) { return ' aria-pressed="' + (on ? "true" : "false") + '"'; }
    function card(fig, label, sub, act, v, on) {
      return '<button type="button" class="cpo-card" data-act="' + act + '" data-v="' + e(v) + '"' + pressed(on) + '><span class="cpo-fig">' + e(fig)
        + '</span><span class="cpo-clabel">' + e(label) + '</span><span class="cpo-csub">' + e(sub) + "</span></button>";
    }
    var courses = st.view !== "programs";
    var cards = '<section aria-labelledby="cpo-h-glance"><h2 id="cpo-h-glance" class="cpo-vh">At a glance</h2><div class="cpo-cards">'
      + card(n(rows.length), "Courses", "Every course in COCI's list" + (rows.length > (b.courses || []).length ? ", and the courses its MAP exhibits name" : ""), "card", "all", courses && !st.status && !st.prio)
      + card(n(count["could-adopt"]), "Could adopt", n(matches) + " statewide credit recommendations match these courses", "card", "could-adopt", courses && st.status === "could-adopt" && !st.prio)
      + card(n(pc.high), "High priority", "Courses ranked first to take to faculty", "card", "high", courses && !st.status && st.prio === "high")
      + card(n(count["has-exhibit"]), "Carry CPL now", n((b.existing || []).length) + " MAP exhibit lines, AP and IB left out", "card", "has-exhibit", courses && st.status === "has-exhibit" && !st.prio)
      + card(n(progs.length), "Active programs", "Opens the Programs view", "card", "programs", !courses)
      + "</div></section>";
    var views = '<div class="cpo-views" role="group" aria-label="View">'
      + '<button type="button" class="cpo-word" data-act="view" data-v="courses"' + pressed(courses) + ">Courses</button>"
      + '<button type="button" class="cpo-word" data-act="view" data-v="programs"' + pressed(!courses) + ">Programs</button></div>";
    var hero = '<div class="cpo-hero"><div class="cpo-hero-in"><span class="cpo-eyebrow">CPL Opportunity Analysis · ' + e(b.today) + "</span><h1>" + e(b.college) + "</h1>"
      + '<div class="cpo-rule" aria-hidden="true"></div>'
      + '<p class="cpo-lede">Where ' + e(b.college) + "'s courses already carry credit for prior learning, where a statewide credit recommendation could be adopted, and where peer colleges award credit it does not yet. Each figure below opens its courses; a course opens its detail beside the list.</p>"
      + '<div class="cpo-acts"><button type="button" class="cpo-act" id="cpo-download">Download CPL Extract</button>'
      + (b.shareUrl ? '<span class="cpo-share">Shareable link: <a href="' + e(b.shareUrl) + '">' + e(b.shareUrl) + '</a> <button type="button" class="cpo-act" id="cpo-copy">Copy link to this view</button></span>' : "")
      + "</div></div></div>";
    var body = courses ? listHtml() : programsHtml();
    function wordGroup(label, list, cur, act, counts) {
      return '<div class="cpo-wg" role="group" aria-label="' + e(label) + '"><span class="cpo-wl">' + e(label) + "</span>"
        + list.map(function (p) {
          return '<button type="button" class="cpo-word" data-act="' + act + '" data-v="' + e(p[0] || "all") + '"' + pressed(cur === p[0]) + ">" + e(p[1])
            + (counts && counts[p[0]] != null ? " " + n(counts[p[0]]) : "") + "</button>";
        }).join("") + "</div>";
    }
    function listHtml() {
      var hit = pageFilter(rows, st), shown = hit.slice(0, st.limit);
      var sel = st.course ? rows.filter(function (r) { return r.id === st.course; })[0] : null;
      var html = '<section aria-labelledby="cpo-h-list" class="cpo-list"><h2 id="cpo-h-list" class="cpo-vh">Courses</h2>'
        + '<div class="cpo-tools"><div class="cpo-find"><label for="cpo-q">Find a course</label><input type="search" id="cpo-q" value="' + e(st.q) + '" placeholder="Course, title, discipline or credential" autocomplete="off"></div>'
        + wordGroup("CPL status", [["", "All"]].concat(STATUS), st.status, "status", count)
        + wordGroup("Priority", [["", "Any"]].concat(PRIO), st.prio, "prio", { high: pc.high, medium: pc.medium, low: pc.low }) + "</div>"
        + '<p class="cpo-count" id="cpo-count" role="status">Showing ' + n(shown.length) + " of " + n(hit.length) + " courses in this view.</p>"
        + '<div class="cpo-split"><div class="cpo-listcol">';
      if (!hit.length) html += '<p class="cpo-note">No course matches. The finder and the words above narrow together.</p>';
      else {
        html += '<div class="cpo-tbl" role="region" aria-label="' + e(b.college) + ' courses" tabindex="0"><table id="cpo-list-t"><colgroup><col style="width:13%"><col style="width:37%"><col style="width:7%"><col style="width:19%"><col style="width:14%"><col style="width:10%"></colgroup>'
          + '<thead><tr><th scope="col">Course</th><th scope="col">Title</th><th scope="col" class="cpo-num">Units</th><th scope="col">Discipline</th><th scope="col">CPL status</th><th scope="col">Priority</th></tr></thead><tbody>'
          + shown.map(function (r) {
            var on = sel && sel.id === r.id;
            return "<tr" + (on ? ' class="cpo-sel"' : "") + '><td><button type="button" class="cpo-rowbtn" data-act="row" data-v="' + e(r.id) + '" aria-expanded="' + (on ? "true" : "false") + '">' + e(r.id) + "</button></td>"
              + "<td>" + e(r.t) + (r.notCoci ? ' <span class="cpo-muted">(not in COCI\'s list)</span>' : "") + '</td><td class="cpo-num">' + e(r.u) + "</td><td>" + e(r.d) + "</td>"
              + '<td class="cpo-st-' + r.s + '"><span class="cpo-stw">' + e(STATUS_NAME[r.s]) + "</span>"
              + (r.s === "could-adopt" && r.ex.length ? '<span class="cpo-stw cpo-muted">Also has an exhibit</span>' : "")
              + (r.best ? '<a class="cpo-adopt" href="' + e(r.best.link) + '" target="_blank" rel="noopener">Request Adopt<span class="cpo-sr"> (' + e(r.best.title) + ", opens MAP searched for " + e(String(r.best.crId).split(",")[0].trim()) + ")</span></a>" : "")
              + '</td><td class="' + (r.p === "High" ? "cpo-hi" : "cpo-muted") + '">' + e(r.p) + "</td></tr>";
          }).join("") + "</tbody></table></div>";
        if (hit.length > shown.length) html += '<button type="button" class="cpo-word cpo-more" data-act="more">Show ' + n(Math.min(LIMIT, hit.length - shown.length)) + " more</button>";
      }
      html += "</div>" + panelHtml(sel) + "</div></section>" + areasHtml();
      return html;
    }
    function chip(c) {
      return '<a class="cpo-chip" href="' + e(c.link) + '" target="_blank" rel="noopener">' + e(c.short || "View in MAP")
        + '<span class="cpo-sr"> (' + (c.college ? "built by " + e(c.college) + "; " : "") + "opens MAP searched for " + e(c.id) + ")</span></a>";
    }
    function panelHtml(r) {
      var h = '<aside class="cpo-panel" aria-labelledby="cpo-ph">';
      if (!r) return h + '<h2 id="cpo-ph" class="cpo-vh">Course detail</h2><p class="cpo-note">Press a course to see its MAP exhibits, the statewide recommendations it could adopt with the MAP link to request each, why it matches and the next step.</p></aside>';
      h += '<div class="cpo-ptop"><span class="cpo-eyebrow">' + e(STATUS_NAME[r.s]) + '</span><button type="button" class="cpo-word" data-act="close">Close</button></div>'
        + '<h2 id="cpo-ph" tabindex="-1">' + e(r.id) + " " + e(r.t) + "</h2>"
        + '<p class="cpo-note">' + e([r.u !== "" ? r.u + " units" : "", r.d, r.p ? "Priority " + r.p : ""].filter(Boolean).join(" · ")) + "</p>";
      if (r.best) h += '<p class="cpo-pra"><a href="' + e(r.best.link) + '" target="_blank" rel="noopener">Request Adopt in MAP</a> <span class="cpo-muted">' + e(r.best.title) + ", the match the most colleges have adopted</span></p>";
      if (r.sw.length) {
        h += '<section><h3>Statewide recommendations it could adopt</h3><p class="cpo-note">Each link names the college that built the exhibit in MAP and opens MAP searched for that ID, where Request Quick Adopt needs no MAP sign-in. MAP\'s table lists the colleges that articulated it.</p>'
          + r.sw.map(function (w) {
            return '<div class="cpo-pitem"><b>' + e(w.title) + "</b><span class=\"cpo-muted\">" + e([w.type, w.adopters ? "adopted by " + n(w.adopters) + (w.adopters === 1 ? " college" : " colleges") : ""].filter(Boolean).join(" · ")) + "</span>"
              + (w.chips && w.chips.length ? '<div class="cpo-chips">' + w.chips.map(chip).join("") + "</div>" : '<span class="cpo-muted">' + e(w.linkStatus || "MAP lists no exhibit page for this recommendation yet.") + "</span>") + "</div>";
          }).join("") + "</section>";
      }
      if (r.ex.length) {
        h += "<section><h3>Its exhibits in MAP</h3>" + r.ex.map(function (l) {
          return '<div class="cpo-pitem"><b>' + e(l.title) + "</b>" + (l.credit ? "<span>" + e(l.credit) + "</span>" : "")
            + '<span class="cpo-muted">' + e([l.type, l.issuer, l.origin].filter(Boolean).join(" · ")) + "</span>" + (l.ids ? '<span class="cpo-muted">' + e(l.ids) + "</span>" : "") + "</div>";
        }).join("") + "</section>";
      }
      if (r.why) h += '<section><h3>Why it matches</h3><p class="cpo-pre">' + e(r.why) + "</p></section>";
      if (r.steps) h += "<section><h3>Next step</h3><p>" + e(r.steps) + "</p></section>";
      if (r.s === "none") h += "<p>No MAP exhibit, statewide recommendation or peer articulation was found for this course. Faculty may know of an industry credential or exam that covers it.</p>";
      return h + "</aside>";
    }
    function areasHtml() {
      if (!s.areas || !s.areas.length) return "";
      var mx = Math.max.apply(null, s.areas.map(function (a) { return a[1] + a[2] + a[3]; }).concat([1]));
      return '<section aria-labelledby="cpo-h-areas"><h2 id="cpo-h-areas">Where the opportunities sit</h2><p class="cpo-note">Courses with a match, by TOP area and priority. An area opens its courses.</p>'
        + '<div class="cpo-legend" aria-hidden="true"><span><i class="hi"></i>High</span><span><i class="me"></i>Medium</span><span><i class="lo"></i>Low</span></div>'
        + s.areas.map(function (a) {
          function seg(v, cls) { return v ? '<span class="cpo-seg ' + cls + '" style="width:' + (v / mx * 100).toFixed(2) + '%"></span>' : ""; }
          return '<div class="cpo-bar-row"><button type="button" class="cpo-word" data-act="area" data-v="' + e(a[0]) + '">' + e(a[0]) + '</button><span class="cpo-bar" aria-hidden="true">'
            + seg(a[1], "hi") + seg(a[2], "me") + seg(a[3], "lo") + '</span><span class="cpo-bar-n">' + a[1] + " high · " + a[2] + " medium · " + a[3] + " low</span></div>";
        }).join("") + "</section>";
    }
    function programsHtml() {
      var shown = progs.slice(0, st.plimit);
      return '<section aria-labelledby="cpo-h-prog"><h2 id="cpo-h-prog">Active programs</h2><p class="cpo-note">Each program\'s CPL coverage, read from the courses its catalog page lists. The link opens that page.</p>'
        + '<div class="cpo-tbl" role="region" aria-label="Active programs" tabindex="0"><table id="cpo-prog-t"><colgroup><col style="width:32%"><col style="width:26%"><col style="width:11%"><col style="width:9%"><col style="width:12%"><col style="width:10%"></colgroup>'
        + '<thead><tr><th scope="col">Program</th><th scope="col">Award</th><th scope="col">Control number</th><th scope="col">TOP</th><th scope="col">CPL coverage</th><th scope="col">Catalog</th></tr></thead><tbody>'
        + shown.map(function (p) {
          return "<tr><td><b>" + e(p.title) + "</b></td><td>" + e(String(p.award || "").split(" requiring")[0]) + "</td><td>" + e(p.ctrl) + "</td><td>" + e(p.top) + "</td><td>" + e(p.coverage) + "</td><td>"
            + (p.page ? '<a href="' + e(p.page) + '" target="_blank" rel="noopener">Catalog page</a>' : '<span class="cpo-muted">No program record</span>') + "</td></tr>";
        }).join("") + "</tbody></table></div>"
        + (progs.length > shown.length ? '<button type="button" class="cpo-word cpo-more" data-act="pmore">Show ' + n(Math.min(LIMIT, progs.length - shown.length)) + " more programs</button>" : "")
        + "</section>";
    }
    return hero + '<div class="cpo-body">' + cards + notesHtml(b.teamNotes, b.college) + views + body
      + '<p class="cpo-note">The CPL Extract holds every course, every match and every column; printing this page prints the rows in view, without the side panel. Built from COBI\'s published data: COCI\'s course list and program export, the program records read from college catalogs, MAP exhibits (' + e(s.statewideGenerated)
      + ") and the Commons' peer alignments. " + (s.verifiedAt ? "MAP links appear only for IDs MAP listed when checked " + e(s.verifiedAt) + "." : "The check of which IDs MAP lists could not be read, so no MAP links are shown.") + "</p>"
      + (b.notes || []).map(function (t) { return '<p class="cpo-note">' + e(t) + "</p>"; }).join("") + "</div>";
  }

  /* One delegated click and one input listener on the page root; every change redraws the root
   * from the state and reports it (opts.onState), so the page can write the address. */
  function wirePage(root, b, opts) {
    opts = opts || {};
    var st = Object.assign(pageDefaults(), opts.state || {}), timer = null;
    function redraw(focus) {
      if (!("innerHTML" in root)) return;
      root.innerHTML = pageHtml(b, st);
      if (opts.onState) opts.onState(st);
      if (focus) { var el = root.querySelector(focus); if (el && el.focus) { el.focus(); if (focus === "#cpo-q" && el.setSelectionRange) el.setSelectionRange(el.value.length, el.value.length); } }
    }
    if (root._cpoOff) root._cpoOff();   // a second college on the same page: one set of listeners
    function onClick(ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest("[data-act], #cpo-download, #cpo-copy") : null;
      if (!t || !t.getAttribute) return;
      var id = t.getAttribute("id");
      if (id === "cpo-download") { downloadWorkbook(b); t.textContent = "Downloaded"; setTimeout(function () { t.textContent = "Download CPL Extract"; }, 2600); return; }
      if (id === "cpo-copy") {
        var url = (opts.shareUrl ? opts.shareUrl(st) : "") || b.shareUrl;
        try { navigator.clipboard.writeText(url).then(function () { t.textContent = "Copied"; setTimeout(function () { t.textContent = "Copy link to this view"; }, 2000); }, function () {}); } catch (err) { /* the link stays selectable */ }
        return;
      }
      var act = t.getAttribute("data-act"), v = t.getAttribute("data-v") || "";
      if (!act) return;
      if (act === "card") {
        st.view = v === "programs" ? "programs" : "courses"; st.limit = LIMIT; st.course = "";
        st.status = v === "could-adopt" || v === "has-exhibit" ? v : ""; st.prio = v === "high" ? "high" : "";
        redraw('.cpo-card[data-v="' + v + '"]'); return;
      }
      if (act === "view") { st.view = v === "programs" ? "programs" : "courses"; redraw('.cpo-word[data-act="view"][data-v="' + v + '"]'); return; }
      if (act === "status") { st.status = v === "all" ? "" : v; st.limit = LIMIT; redraw('.cpo-word[data-act="status"][data-v="' + v + '"]'); return; }
      if (act === "prio") { st.prio = v === "all" ? "" : v; st.limit = LIMIT; redraw('.cpo-word[data-act="prio"][data-v="' + v + '"]'); return; }
      if (act === "more") { st.limit += LIMIT; redraw(null); return; }
      if (act === "pmore") { st.plimit += LIMIT; redraw(null); return; }
      if (act === "area") { st.view = "courses"; st.status = ""; st.prio = ""; st.q = v; st.limit = LIMIT; st.course = ""; redraw("#cpo-q"); return; }
      if (act === "close") { var was = st.course; st.course = ""; redraw('.cpo-rowbtn[data-v="' + was.replace(/"/g, "") + '"]'); return; }
      if (act === "row") {
        st.course = st.course === v ? "" : v;
        redraw(st.course ? "#cpo-ph" : '.cpo-rowbtn[data-v="' + v.replace(/"/g, "") + '"]');
        var ph = st.course && root.querySelector ? root.querySelector("#cpo-ph") : null;
        if (ph && ph.scrollIntoView && typeof window !== "undefined" && window.innerWidth < 900) ph.scrollIntoView({ block: "start" });
      }
    }
    function onInput(ev) {
      if (!ev.target || ev.target.id !== "cpo-q") return;
      var val = ev.target.value;
      clearTimeout(timer);
      timer = setTimeout(function () { st.q = val; st.limit = LIMIT; st.course = ""; redraw("#cpo-q"); }, 160);
    }
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    root._cpoOff = function () {
      clearTimeout(timer);
      if (root.removeEventListener) { root.removeEventListener("click", onClick); root.removeEventListener("input", onInput); }
    };
    return { state: function () { return st; }, redraw: redraw };
  }

  function fileStem(college, today) {
    return String(today).replace(/-/g, "") + "_" + String(college).replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  /* The catalog harvest's program records for one college (anon read, as the
   * Program Requirements tab reads them): the registry names the college the
   * harvest's way, so the name resolves through it first. */
  var REST = "https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1";
  var ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dXdobmJ1YWhydHB0b2twcWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzI0ODEsImV4cCI6MjA5MTE0ODQ4MX0.p0q-93iTM0GkF2z8_q7Vvl1tsX9SFGMM-W7Wdx7WfmM";
  function catalogFor(college) {
    var h = { apikey: ANON, Authorization: "Bearer " + ANON };
    function get(url, range) {
      var hh = Object.assign({}, h);
      if (range) { hh["Range-Unit"] = "items"; hh.Range = range; }
      return fetch(url, { headers: hh }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
    }
    return get(REST + "/program_source_registry?select=college").then(function (rows) {
      var name = findName((rows || []).map(function (r) { return r.college; }), college);
      if (!name) return [];
      var out = [];
      function page(i) {
        return get(REST + "/program_requirement_records?college=eq." + encodeURIComponent(name)
          + "&select=control_number,program_title,award,catalog_year,source_url,blocks:record->blocks&order=control_number",
          (i * 1000) + "-" + (i * 1000 + 999)).then(function (r) {
          out = out.concat(r || []);
          return (r || []).length < 1000 ? out : page(i + 1);
        });
      }
      return page(0);
    }).catch(function () { return []; });
  }

  /* Load what the build reads, then hand the result to cb. opts:
   *   { college, loadScript(src, global, cb), base: "" | "../", shareBase } */
  var NEED = [["coci_lookup_data.js", "CPL_COCI_LOOKUP"], ["unified_courses_members.js", "CPL_UC_MEMBERS"],
    ["unified_courses_aligned.js", "CPL_UC_ALIGNED"], ["statewide_data.js", "CPL_STATEWIDE"],
    ["coci_programs_data.js", "CPL_COCI_PROGRAMS"]];
  /* Load the five data files (each once); cb(err). */
  function load(opts, cb) {
    var base = opts.base || "", left = NEED.length;
    NEED.forEach(function (p) {
      opts.loadScript(base + p[0], p[1], function () {
        if (--left) return;
        var missing = NEED.filter(function (q) { return !window[q[1]]; }).map(function (q) { return q[0]; });
        cb(missing.length ? new Error("Could not load " + missing.join(", ")) : null);
      });
    });
  }
  function prepare(opts, cb) {
    var base = opts.base || "";
    load(opts, function (err) {
      if (err) { cb(err); return; }
      var verified = fetch(base + "kb/reference/map_cpl_opportunities_verified.json")
        .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
      Promise.all([catalogFor(opts.college), verified]).then(function (got) {
        try {
          cb(null, build({ college: opts.college, today: new Date().toISOString().slice(0, 10),
            lookup: window.CPL_COCI_LOOKUP, members: window.CPL_UC_MEMBERS, aligned: window.CPL_UC_ALIGNED,
            statewide: window.CPL_STATEWIDE, programs: window.CPL_COCI_PROGRAMS, catalog: got[0] || [],
            verified: got[1], shareBase: opts.shareBase || SHARE_BASE }));
        } catch (err2) { cb(err2); }
      });
    });
  }
  var SHARE_BASE = "https://cpl-initiative.github.io/cpl-project-tracker/library/cpl-opportunity/";
  function shareUrl(college) { return SHARE_BASE + "?college=" + encodeURIComponent(college); }
  function colleges() {
    // The college list a picker offers: every name MAP's exhibit data uses.
    var o = {};
    ((window.CPL_STATEWIDE || {}).exhibits || []).forEach(function (e) {
      (e.adopter_names || []).concat(e.potential_names || []).forEach(function (n2) { o[n2] = 1; });
    });
    return Object.keys(o).sort();
  }
  function save(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  function downloadWorkbook(b) {
    save(new Blob([toXlsx(sheets(b))], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      fileStem(b.college, b.today) + "_CPL_Extract.xlsx");
  }

  window.CPL_COLLEGE_WORKBOOK = {
    build: build, sheets: sheets, toXlsx: toXlsx, pageHtml: pageHtml, wirePage: wirePage, load: load, prepare: prepare, resolve: findName,
    downloadWorkbook: downloadWorkbook, catalogFor: catalogFor, shareUrl: shareUrl, colleges: colleges,
    notesSlug: notesSlug, notesHtml: notesHtml,
    courseRows: courseRows, pageState: pageState, pageQuery: pageQuery, pageFilter: pageFilter,
    _titleMatches: titleMatches, _crc32: crc32
  };
})();
