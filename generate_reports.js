/**
 * CPL Dashboard Report Generator
 * ================================
 * Generates Word (.docx) reports from CPL_Data.js:
 *   - Master report: comprehensive Workplan-style report (merged format)
 *   - Mini reports: one per project card
 *
 * Usage: node generate_reports.js
 * Called automatically by excel_to_dashboard.py pipeline.
 */

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle,
  WidthType, ShadingType, PageBreak, PageNumber, LevelFormat,
  ExternalHyperlink, TabStopType, TabStopPosition,
} = require("docx");

// ── Brand colors ──
const NAVY = "0A2240";
const NAVY2 = "163A5F";
const GOLD = "C9A84C";
const LIGHT_BLUE = "9BBCD8";
const GREEN = "2A7D4F";
const OFF_WHITE = "FAF8F4";
const GRAY = "666666";
const FONT = "Cambria";

// ── Page: US Letter, 0.5" margins ──
// 0.5 inches = 720 DXA
const MARGIN = 720;
const PAGE_W = 12240;
const PAGE_H = 15840;
const CONTENT_W = PAGE_W - MARGIN * 2; // 10800

// ── Load data ──
const SCRIPT_DIR = __dirname;
const dataPath = path.join(SCRIPT_DIR, "CPL_Data.js");

if (!fs.existsSync(dataPath)) {
  console.error("ERROR: CPL_Data.js not found. Run excel_to_dashboard.py first.");
  process.exit(1);
}

const dataRaw = fs.readFileSync(dataPath, "utf8");
const jsonStr = dataRaw.replace(/^[\s\S]*?window\.CPL_DATA\s*=\s*/, "").replace(/;\s*$/, "");
const DATA = JSON.parse(jsonStr);

// KPIs: flatten nested objects
const rawKpis = DATA.kpis || {};
const kpis = {};
for (const [k, v] of Object.entries(rawKpis)) {
  kpis[k] = typeof v === "object" && v !== null ? (v.value || v) : v;
}
const projects = DATA.projects || [];
const updateLog = DATA.update_log || {};
const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });

// ── Report output dirs ──
const REPORTS_DIR = path.join(SCRIPT_DIR, "reports");
const MINI_DIR = path.join(REPORTS_DIR, "projects");
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(MINI_DIR)) fs.mkdirSync(MINI_DIR, { recursive: true });

// ── Table helpers ──
const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };
const cellPad = { top: 60, bottom: 60, left: 100, right: 100 };

// ── Numbering config ──
const numberingConfig = [
  {
    reference: "bullets",
    levels: [{
      level: 0, format: LevelFormat.BULLET, text: "\u2022",
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 270 } } },
    }],
  },
  {
    reference: "bullets2",
    levels: [{
      level: 0, format: LevelFormat.BULLET, text: "\u2022",
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 540, hanging: 270 } } },
    }],
  },
];

// ── Styles ──
const docStyles = {
  default: { document: { run: { font: FONT, size: 22 } } },
  paragraphStyles: [
    {
      id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 32, bold: true, font: FONT, color: NAVY },
      paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 0 },
    },
    {
      id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, font: FONT, color: NAVY2 },
      paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
    },
    {
      id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 23, bold: true, font: FONT, color: NAVY2 },
      paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 },
    },
  ],
};

const pageProps = {
  page: {
    size: { width: PAGE_W, height: PAGE_H },
    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN },
  },
};

// ── Helpers ──
function headerFooter(title) {
  return {
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 4 } },
            children: [
              new TextRun({ text: "Credit for Prior Learning Workplan  ", font: FONT, size: 16, bold: true, color: NAVY }),
              new TextRun({ text: `|  ${title}`, font: FONT, size: 16, color: GRAY }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: "DDDDDD", space: 4 } },
            children: [
              new TextRun({ text: `Generated ${now}  |  California Community Colleges  |  MAP Initiative`, font: FONT, size: 14, color: GRAY }),
              new TextRun({ text: "\t", font: FONT }),
              new TextRun({ text: "Page ", font: FONT, size: 14, color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 14, color: GRAY }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          }),
        ],
      }),
    },
  };
}

function makeCell(text, opts = {}) {
  const { bold, color, fill, width, align, size, italic, colspan } = opts;
  const cell = new TableCell({
    borders: opts.noBorders ? noBorders : borders,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
    margins: cellPad,
    columnSpan: colspan || undefined,
    children: [
      new Paragraph({
        alignment: align || AlignmentType.LEFT,
        children: [new TextRun({
          text: String(text || ""),
          bold: !!bold, italic: !!italic,
          color: color || "333333",
          font: FONT, size: size || 20,
        })],
      }),
    ],
  });
  return cell;
}

function statusIcon(status) {
  const s = (status || "").toLowerCase();
  if (s === "stretch met") return "\u2714 Goal Met  \u2605 Stretch Met";
  if (s === "goal met") return "\u2714 Goal Met";
  if (s === "on track") return "\u2714 On Track";
  if (s === "in progress") return "\u2191 In Progress";
  if (s === "foundational year") return "\u25CE Foundational Year";
  if (s === "not started") return "\u25CB Not Started";
  // Fallback for any legacy values
  if (s.includes("exceeded") || s.includes("stretch")) return "\u2714 Goal Met  \u2605 Stretch Met";
  if (s.includes("complete") || s.includes("met")) return "\u2714 Goal Met";
  if (s.includes("on track") || s.includes("on-track")) return "\u2714 On Track";
  if (s.includes("in progress") || s.includes("active")) return "\u2191 In Progress";
  if (s.includes("foundational")) return "\u25CE Foundational Year";
  if (s.includes("not")) return "\u25CB Not Started";
  return status || "";
}

function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (s === "stretch met" || s === "goal met" || s === "on track") return GREEN;
  if (s === "in progress") return GOLD;
  if (s === "foundational year") return "4A90D9";
  if (s === "not started") return GRAY;
  // Fallback
  if (s.includes("met") || s.includes("track") || s.includes("exceeded")) return GREEN;
  if (s.includes("progress") || s.includes("active")) return GOLD;
  return GRAY;
}

// For dual-icon rendering in docx runs (Goal Met + Stretch Met as separate colored runs)
function statusRuns(status) {
  return statusRunsSized(status, 20);
}

function statusRunsSized(status, sz) {
  const s = (status || "").toLowerCase();
  if (s === "stretch met" || s.includes("exceeded") || s.includes("stretch")) {
    return [
      new TextRun({ text: "\u2714 Goal Met  ", font: FONT, size: sz, bold: true, color: GREEN }),
      new TextRun({ text: "\u2605 Stretch Met", font: FONT, size: sz, bold: true, color: GOLD }),
    ];
  }
  const icon = statusIcon(status);
  const color = statusColor(status);
  return [new TextRun({ text: icon, font: FONT, size: sz, bold: true, color })];
}

// Activity descriptions from CPL Workplan
const ACTIVITY_DESC = {
  "Activity 1": {
    title: "Activity 1: Build AI-Enhanced CPL Infrastructure",
    shortTitle: "Technology & MAP Platform",
    desc: "To accelerate and scale Credit for Prior Learning (CPL) across the California Community Colleges system, the Chancellor's Office will develop and deploy AI-enhanced infrastructure that simplifies and expands access to CPL for students, faculty, and colleges.",
  },
  "Activity 2": {
    title: "Activity 2: Faculty Workgroups & Credit Recommendations",
    shortTitle: "Credit Recommendations & Faculty",
    desc: "Faculty-led discipline workgroups develop and adopt statewide credit recommendations that translate industry certifications, military training, and professional experience into validated college credit, ensuring academic integrity and workforce alignment.",
  },
  "Activity 3": {
    title: "Activity 3: CPL Students & College Success",
    shortTitle: "CPL Students & College Success",
    desc: "Build the data infrastructure and student engagement pathways that track CPL offers, awards, transcription, and student outcomes, ensuring equitable access and measurable impact for all learners across the system.",
  },
  "Activity 4": {
    title: "Activity 4: Partnerships, Policy & Scale",
    shortTitle: "Partnerships, Policy & Scale",
    desc: "Launch targeted CPL sprints, demonstration projects, and cross-sector partnerships to accelerate adoption, advance sustainable policy and funding, and build professional capacity across all 116 colleges.",
  },
};

// ══════════════════════════════════════════════
//  MASTER REPORT
// ══════════════════════════════════════════════
async function generateMasterReport() {
  const children = [];

  // ── Title page ──
  children.push(
    new Paragraph({ spacing: { before: 2400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Credit for Prior Learning Workplan", font: FONT, size: 48, bold: true, color: NAVY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: reportDate, font: FONT, size: 36, color: GOLD })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 12 } },
      spacing: { before: 300, after: 400 },
      children: [new TextRun({ text: "California Community Colleges Chancellor's Office", font: FONT, size: 22, color: NAVY2 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Prepared by:", font: FONT, size: 20, color: GRAY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "James Todd and Samuel Lee", font: FONT, size: 22, bold: true, color: NAVY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Contributions from:", font: FONT, size: 20, color: GRAY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: "Mari Estrada and Michael \"Billy\" Wagner", font: FONT, size: 22, bold: true, color: NAVY })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ── Executive Summary ──
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Executive Summary")] }),
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({
        text: `As of ${now}, the CPL initiative is ahead of schedule, with most 2025\u20132026 targets met or exceeded and core infrastructure nearing completion. The work has expanded student access, increased transcripted units, and established the foundation for a permanent, statewide CPL service under Vision 2030.`,
        font: FONT, size: 22,
      })],
    }),
  );

  // Highlights
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Highlights")] }),
  );

  const highlights = [
    `${kpis.cumulative_students || "N/A"} cumulative students served with CPL awards, surpassing annual targets.`,
    `${kpis.eligible_units || "N/A"} CPL units transcripted across the system.`,
    `${kpis.active_colleges || "N/A"} colleges meeting active participation thresholds, exceeding the goal of 50.`,
    `${kpis.credit_recommendations || "N/A"} statewide credit recommendations, driven by faculty discipline workgroups spanning high-demand fields.`,
    `The Veteran Sprint has uploaded ${kpis.veteran_sprint || "N/A"} JSTs to MAP, with estimated student savings of ${kpis.estimated_savings || "N/A"} and projected 20-year economic impact of ${kpis.twenty_year_impact || "N/A"}.`,
    "Technology development has advanced significantly, including enhancements to the MAP platform, AI-assisted JST processing, and the CPL Student Portal nearing release.",
  ];

  for (const h of highlights) {
    children.push(new Paragraph({
      numbering: { reference: "bullets", level: 0 },
      spacing: { after: 80 },
      children: [new TextRun({ text: h, font: FONT, size: 21 })],
    }));
  }

  // ── Headline KPI Table ──
  children.push(
    new Paragraph({ spacing: { before: 200 } }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Key Performance Indicators")] }),
  );

  const kpiRows = [
    ["Cumulative Students Served", kpis.cumulative_students || "N/A"],
    ["CPL Units Transcripted", kpis.eligible_units || "N/A"],
    ["Statewide Credit Recommendations", kpis.credit_recommendations || "N/A"],
    ["Active Colleges", String(kpis.active_colleges || "N/A")],
    ["Veteran Sprint JSTs Uploaded", kpis.veteran_sprint || "N/A"],
    ["Estimated Student Savings", kpis.estimated_savings || "N/A"],
    ["Projected 20-Year Economic Impact", kpis.twenty_year_impact || "N/A"],
  ];

  children.push(
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [6800, 4000],
      rows: [
        new TableRow({
          children: [
            makeCell("Metric", { bold: true, color: "FFFFFF", fill: NAVY, width: 6800 }),
            makeCell("Current Value", { bold: true, color: "FFFFFF", fill: NAVY, width: 4000, align: AlignmentType.RIGHT }),
          ],
        }),
        ...kpiRows.map(([label, val], i) =>
          new TableRow({
            children: [
              makeCell(label, { width: 6800, fill: i % 2 === 0 ? "F5F5F5" : "FFFFFF" }),
              makeCell(val, { bold: true, width: 4000, align: AlignmentType.RIGHT, fill: i % 2 === 0 ? "F5F5F5" : "FFFFFF", color: NAVY }),
            ],
          })
        ),
      ],
    }),
  );

  // ── Activity Sections ──
  const activityGroups = {};
  for (const p of projects) {
    if (p.id && p.id.startsWith("D.")) continue;
    const act = p.activity || "Other";
    if (!activityGroups[act]) activityGroups[act] = [];
    activityGroups[act].push(p);
  }

  for (const [actName, actProjects] of Object.entries(activityGroups).sort()) {
    const actInfo = ACTIVITY_DESC[actName] || {};
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // Activity heading (big, colored, like the reference doc)
    children.push(
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 6 } },
        spacing: { after: 160 },
        children: [new TextRun({ text: (actInfo.title || actName).toUpperCase(), font: FONT, size: 26, bold: true, color: NAVY })],
      }),
    );

    // Activity description
    if (actInfo.desc) {
      children.push(new Paragraph({
        spacing: { after: 160 },
        children: [new TextRun({ text: actInfo.desc, font: FONT, size: 21, italic: true, color: "555555" })],
      }));
    }

    // Progress summary
    const avgPct = actProjects.length > 0
      ? Math.round(actProjects.reduce((s, p) => s + (p.pct || 0), 0) / actProjects.length)
      : 0;
    const completed = actProjects.filter(p => (p.pct || 0) >= 100).length;
    const metGoal = actProjects.filter(p => {
      const s = (p.status || "").toLowerCase();
      return s.includes("complete") || s.includes("exceeded") || s.includes("met") || s.includes("track") || s.includes("strong") || s.includes("ahead");
    }).length;

    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: `Progress: `, font: FONT, size: 21, bold: true }),
          new TextRun({ text: `${avgPct}% average  |  ${metGoal} of ${actProjects.length} on track or exceeding targets`, font: FONT, size: 21, color: GREEN }),
        ],
      }),
    );

    // ── Sub-activity cards (Workplan table format) ──
    for (const p of actProjects) {
      const icon = statusIcon(p.status);
      const sColor = statusColor(p.status);

      // Sub-activity header row (lighter navy with dual-status support)
      const headerRuns = [
        new TextRun({ text: `${p.id}  ${p.name}   `, font: FONT, size: 22, bold: true, color: NAVY }),
        ...statusRuns(p.status),
      ];
      children.push(
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [CONTENT_W],
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders,
                  width: { size: CONTENT_W, type: WidthType.DXA },
                  shading: { fill: "D6E4F0", type: ShadingType.CLEAR },
                  margins: { top: 80, bottom: 80, left: 120, right: 120 },
                  children: [new Paragraph({ children: headerRuns })],
                }),
              ],
            }),
          ],
        }),
      );

      // Description row
      if (p.desc) {
        children.push(
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [CONTENT_W],
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders,
                    width: { size: CONTENT_W, type: WidthType.DXA },
                    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
                    margins: cellPad,
                    children: [new Paragraph({
                      children: [new TextRun({ text: p.desc, font: FONT, size: 19, italic: true, color: "555555" })],
                    })],
                  }),
                ],
              }),
            ],
          }),
        );
      }

      // Goals row: 2030 Goal | 25-26 Goal | 25-26 Stretch | Actual
      const colW = Math.floor(CONTENT_W / 4);
      const lastColW = CONTENT_W - colW * 3;
      // 2030 Goal/Stretch + cumulative annual goals table
      const cur = p.kpi_metric || "\u2014";
      const g2930 = p.kpi_goal_2930 || p.kpi_target_2030 || "";
      const s2930 = p.kpi_stretch_2829 || "";
      const goalSubtitle = g2930 ? `2030 Goal: ${g2930}` + (s2930 ? `  Stretch: ${s2930}` : "") : "";
      if (goalSubtitle) {
        children.push(new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [new TextRun({ text: goalSubtitle, font: FONT, size: 18, color: "666666", italics: true })],
        }));
      }
      const yrColW = Math.floor(CONTENT_W / 6);
      const yrLastW = CONTENT_W - yrColW * 5;
      const yrHeaders = ["25-26", "26-27", "27-28", "28-29", "29-30", "Current"];
      const yrGoals = [
        p.kpi_goal_2526 || p.kpi_target_2026 || "\u2014",
        p.kpi_goal_2627 || "\u2014",
        p.kpi_goal_2728 || "\u2014",
        p.kpi_goal_2829 || "\u2014",
        g2930 || "\u2014",
        cur,
      ];
      children.push(
        new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [yrColW, yrColW, yrColW, yrColW, yrColW, yrLastW],
          rows: [
            new TableRow({
              children: yrHeaders.map((h, i) =>
                makeCell(h, { bold: true, color: "FFFFFF", fill: NAVY2, width: i < 5 ? yrColW : yrLastW, align: AlignmentType.CENTER, size: 16 })
              ),
            }),
            new TableRow({
              children: yrGoals.map((v, i) =>
                makeCell(i < 5 ? `${cur}/${v}` : cur, {
                  bold: true,
                  width: i < 5 ? yrColW : yrLastW,
                  align: AlignmentType.CENTER,
                  color: i === 5 ? sColor : NAVY,
                  size: 16,
                })
              ),
            }),
          ],
        }),
      );

      // Progress notes as bullets
      const noteItems = [];
      if (p.update) noteItems.push(p.update);
      if (p.workplan_notes && p.workplan_notes !== p.update) noteItems.push(p.workplan_notes);

      if (noteItems.length > 0) {
        // Wrap bullets in a table cell for visual grouping
        const bulletParas = noteItems.map(n => new Paragraph({
          numbering: { reference: "bullets2", level: 0 },
          spacing: { after: 60 },
          children: [new TextRun({ text: n, font: FONT, size: 20 })],
        }));

        children.push(
          new Table({
            width: { size: CONTENT_W, type: WidthType.DXA },
            columnWidths: [CONTENT_W],
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders,
                    width: { size: CONTENT_W, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 160, right: 120 },
                    children: bulletParas,
                  }),
                ],
              }),
            ],
          }),
        );
      }

      // Details: Lead, Budget, Progress bar text
      children.push(new Paragraph({
        spacing: { before: 60, after: 160 },
        children: [
          new TextRun({ text: `Lead: `, font: FONT, size: 18, bold: true, color: GRAY }),
          new TextRun({ text: `${p.lead || "N/A"}`, font: FONT, size: 18, color: GRAY }),
          new TextRun({ text: `    |    Budget: `, font: FONT, size: 18, bold: true, color: GRAY }),
          new TextRun({ text: `${p.budget || "N/A"} (${p.budget_source || ""})`, font: FONT, size: 18, color: GRAY }),
          new TextRun({ text: `    |    Progress: `, font: FONT, size: 18, bold: true, color: GRAY }),
          new TextRun({ text: `${p.pct || 0}%`, font: FONT, size: 18, bold: true, color: sColor }),
        ],
      }));
    }

    // Budget allocation statement for this activity
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun(`Budget Allocation: ${actInfo.shortTitle || actName}`)],
      }),
    );

    const totalBudget = actProjects.reduce((sum, p) => {
      const b = String(p.budget || "").replace(/[$,KMk]/g, "");
      const num = parseFloat(b);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const budgetLines = actProjects
      .filter(p => p.budget && p.budget !== "$0" && p.budget !== "N/A")
      .map(p => `${p.id} ${p.name}: ${p.budget} (${p.budget_source || "CPL"})`)
      .slice(0, 8);

    for (const line of budgetLines) {
      children.push(new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { after: 40 },
        children: [new TextRun({ text: line, font: FONT, size: 19, color: "444444" })],
      }));
    }

    // Vision 2030 alignment note
    children.push(new Paragraph({
      spacing: { before: 160, after: 200 },
      indent: { left: 360 },
      border: { left: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 8 } },
      children: [
        new TextRun({ text: "Outcome: ", font: FONT, size: 20, bold: true, color: NAVY }),
        new TextRun({
          text: "This activity drives Vision 2030 Actions 1a and 5, advancing equitable access to credit for prior learning for working adults, veterans, and apprentices across California.",
          font: FONT, size: 20, italic: true, color: "555555",
        }),
      ],
    }));
  }

  // ── Annual Goals Summary Table ──
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Annual Goals Summary")] }),
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({
        text: "The table below summarizes progress across all CPL Workplan activities and sub-activities against 2025\u201326 goals.",
        font: FONT, size: 21,
      })],
    }),
  );

  // Build summary table rows from all activities
  const summaryHeaderRow = new TableRow({
    children: [
      makeCell("Sub-Activity", { bold: true, color: "FFFFFF", fill: NAVY, width: 3600, size: 18 }),
      makeCell("Status", { bold: true, color: "FFFFFF", fill: NAVY, width: 1600, align: AlignmentType.CENTER, size: 18 }),
      makeCell("2030 Goal", { bold: true, color: "FFFFFF", fill: NAVY, width: 1400, align: AlignmentType.CENTER, size: 18 }),
      makeCell("25-26", { bold: true, color: "FFFFFF", fill: NAVY, width: 1800, align: AlignmentType.CENTER, size: 18 }),
      makeCell("Current", { bold: true, color: "FFFFFF", fill: NAVY, width: 1400, align: AlignmentType.CENTER, size: 18 }),
    ],
  });

  const summaryDataRows = [];
  let rowIdx = 0;
  for (const [actName, actProjects] of Object.entries(activityGroups).sort()) {
    // Activity group header row
    const actInfo = ACTIVITY_DESC[actName] || {};
    summaryDataRows.push(new TableRow({
      children: [
        makeCell(actInfo.shortTitle || actName, { bold: true, color: NAVY, fill: "E8EDF2", colspan: 5, size: 18 }),
      ],
    }));
    for (const p of actProjects) {
      const sColor = statusColor(p.status);
      const fill = rowIdx % 2 === 0 ? "F9F9F9" : "FFFFFF";
      summaryDataRows.push(new TableRow({
        children: [
          makeCell(`${p.id} ${p.name}`, { width: 3600, fill, size: 18 }),
          makeCell(statusIcon(p.status), { width: 1600, align: AlignmentType.CENTER, fill, color: sColor, size: 17, bold: true }),
          makeCell(p.kpi_goal_2930 || p.kpi_target_2030 || "\u2014", { width: 1400, align: AlignmentType.CENTER, fill, size: 18 }),
          makeCell(`${p.kpi_metric || "\u2014"}/${p.kpi_goal_2526 || p.kpi_target_2026 || "\u2014"}`, { width: 1800, align: AlignmentType.CENTER, fill, size: 18 }),
          makeCell(p.kpi_metric || "\u2014", { width: 1400, align: AlignmentType.CENTER, fill, color: sColor, bold: true, size: 18 }),
        ],
      }));
      rowIdx++;
    }
  }

  children.push(
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [3600, 1600, 1400, 1800, 1400],
      rows: [summaryHeaderRow, ...summaryDataRows],
    }),
  );

  // ── Conclusion ──
  children.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Conclusion")] }),
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({
        text: `The CPL Initiative has moved from pilot to scale, demonstrating measurable impact in student access, credit attainment, and system engagement. With ${kpis.cumulative_students || "43,000+"} students served, ${kpis.credit_recommendations || "280+"} statewide credit recommendations, and ${kpis.active_colleges || "80+"} actively participating colleges, the initiative has surpassed most 2025\u201326 benchmarks ahead of schedule.`,
        font: FONT, size: 22,
      })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({
        text: "AI-enhanced infrastructure\u2014including the MAP platform, Student Portal, and Credential Engine integration\u2014positions the system for sustained, scalable CPL delivery. Faculty-led workgroups continue to expand discipline coverage, while targeted sprints for veterans and other populations demonstrate the model\u2019s adaptability.",
        font: FONT, size: 22,
      })],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({
        text: "Looking ahead, the initiative will deepen college adoption, complete remaining technology components, and transition to a permanent statewide CPL service under Vision 2030\u2014ensuring equitable access to credit for prior learning for working adults, veterans, and apprentices across California.",
        font: FONT, size: 22,
      })],
    }),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({ text: `Data as of: `, font: FONT, size: 20, bold: true, color: GRAY }),
        new TextRun({ text: now, font: FONT, size: 20, color: GRAY }),
      ],
    }),
  );

  const doc = new Document({
    styles: docStyles,
    numbering: { config: numberingConfig },
    sections: [{
      properties: pageProps,
      ...headerFooter("Progress Report"),
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(REPORTS_DIR, "CPL_Master_Report.docx");
  try { fs.unlinkSync(outPath); } catch (_) {}
  // Write to temp then rename to handle locked files
  const tmpPath = outPath + ".tmp";
  fs.writeFileSync(tmpPath, buffer);
  try { fs.renameSync(tmpPath, outPath); } catch (_) { console.log("  (Using temp path for master report)"); }
  console.log(`  Generated master report: ${outPath}`);
}

// ══════════════════════════════════════════════
//  MINI REPORTS (per project)
// ══════════════════════════════════════════════
async function generateMiniReport(p) {
  const children = [];
  const sColor = statusColor(p.status);
  const icon = statusIcon(p.status);

  // Title
  children.push(
    new Paragraph({ spacing: { before: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: `${p.id}  ${p.name}`, font: FONT, size: 32, bold: true, color: NAVY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: statusRunsSized(p.status, 24),
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD, space: 8 } },
      spacing: { after: 300 },
      children: [
        new TextRun({ text: `${p.activity || ""}  |  ${p.goal || ""}  |  `, font: FONT, size: 19, color: GRAY }),
        new TextRun({ text: now, font: FONT, size: 19, color: GRAY }),
      ],
    }),
  );

  // Status table
  const statusRows = [
    ["Status", p.status || "N/A", sColor],
    ["Progress", `${p.pct || 0}%`, sColor],
    ["Lead", p.lead || "N/A", "333333"],
    ["Budget", `${p.budget || "N/A"} (${p.budget_source || ""})`, "333333"],
    ["KPI Current", p.kpi_metric ? `${p.kpi_metric} ${p.kpi_unit || ""}` : "N/A", NAVY],
    ["2030 Goal", p.kpi_goal_2930 || p.kpi_target_2030 || "N/A", NAVY],
    ["2030 Stretch", p.kpi_stretch_2829 || "N/A", GOLD],
    ["25-26", `${p.kpi_metric || "\u2014"}/${p.kpi_goal_2526 || p.kpi_target_2026 || "\u2014"}`, "333333"],
    ["26-27", `${p.kpi_metric || "\u2014"}/${p.kpi_goal_2627 || "\u2014"}`, "333333"],
    ["27-28", `${p.kpi_metric || "\u2014"}/${p.kpi_goal_2728 || "\u2014"}`, "333333"],
    ["28-29", `${p.kpi_metric || "\u2014"}/${p.kpi_goal_2829 || "\u2014"}`, "333333"],
    ["29-30", `${p.kpi_metric || "\u2014"}/${p.kpi_goal_2930 || p.kpi_target_2030 || "\u2014"}`, "333333"],
  ];

  children.push(
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: [3600, 7200],
      rows: statusRows.map(([label, val, c], i) =>
        new TableRow({
          children: [
            makeCell(label, { bold: true, width: 3600, fill: i % 2 === 0 ? "F0F0F0" : "FFFFFF", color: NAVY2 }),
            makeCell(val, { width: 7200, fill: i % 2 === 0 ? "F0F0F0" : "FFFFFF", color: c, bold: label === "Status" || label === "Progress" }),
          ],
        })
      ),
    }),
  );

  // Description
  if (p.desc) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Description")] }),
      new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: p.desc, font: FONT, size: 21, color: "444444" })] }),
    );
  }

  // Latest Update
  if (p.update) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Latest Update")] }),
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: `Date: ${p.update_date || "N/A"}`, font: FONT, size: 18, italic: true, color: GRAY })],
      }),
      new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: p.update, font: FONT, size: 21, color: "444444" })] }),
    );
  }

  // Workplan Notes
  if (p.workplan_notes) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Workplan Notes")] }),
      new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: p.workplan_notes, font: FONT, size: 21, color: "444444" })] }),
    );
  }

  // Milestones
  if (p.milestones) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Milestones")] }),
      new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: p.milestones, font: FONT, size: 21, color: "444444" })] }),
    );
  }

  // Update Log — full history of dated notes
  const logEntries = updateLog[p.id] || [];
  if (logEntries.length > 0) {
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Update Log")] }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({
          text: `${logEntries.length} logged update${logEntries.length === 1 ? "" : "s"} — newest first`,
          font: FONT, size: 18, italic: true, color: GRAY,
        })],
      }),
    );

    // Table with Date | Type | Note columns
    const logHeaderRow = new TableRow({
      children: [
        makeCell("Date", { bold: true, color: "FFFFFF", fill: NAVY2, width: 1800, size: 18 }),
        makeCell("Type", { bold: true, color: "FFFFFF", fill: NAVY2, width: 1600, align: AlignmentType.CENTER, size: 18 }),
        makeCell("Note", { bold: true, color: "FFFFFF", fill: NAVY2, width: 7400, size: 18 }),
      ],
    });

    const logDataRows = logEntries.map((entry, i) => {
      const fill = i % 2 === 0 ? "F9F9F9" : "FFFFFF";
      const typeLabel = (entry.type || "update") === "workplan" ? "Workplan" : "Progress Update";
      const typeColor = (entry.type || "update") === "workplan" ? GOLD : NAVY2;
      return new TableRow({
        children: [
          makeCell(entry.date || "", { width: 1800, fill, size: 18, color: GRAY }),
          makeCell(typeLabel, { width: 1600, fill, align: AlignmentType.CENTER, size: 17, bold: true, color: typeColor }),
          makeCell(entry.note || "", { width: 7400, fill, size: 18 }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [1800, 1600, 7400],
        rows: [logHeaderRow, ...logDataRows],
      }),
    );
  }

  const doc = new Document({
    styles: docStyles,
    numbering: { config: numberingConfig },
    sections: [{
      properties: pageProps,
      ...headerFooter(p.name || p.id),
      children,
    }],
  });

  const safeName = (p.id || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_");
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(MINI_DIR, `${safeName}_Report.docx`);
  try { fs.unlinkSync(outPath); } catch (_) {}
  const tmpPath = outPath + ".tmp";
  fs.writeFileSync(tmpPath, buffer);
  try { fs.renameSync(tmpPath, outPath); } catch (_) {}
  return safeName;
}

// ══════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════
async function main() {
  console.log("Generating CPL reports...");
  await generateMasterReport();

  let miniCount = 0;
  for (const p of projects) {
    if (p.id && p.id.startsWith("D.")) continue;
    await generateMiniReport(p);
    miniCount++;
  }
  console.log(`  Generated ${miniCount} mini reports in reports/projects/`);
  console.log("Reports complete.");
}

main().catch(err => { console.error("Report generation failed:", err); process.exit(1); });
