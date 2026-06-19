// Public configuration for the KB team portal.
// SAFE to commit: only the Supabase *publishable* (anon) key belongs here, and
// it grants nothing on its own — sign-in is gated by Supabase Auth and the
// server-side allowlist (open signups are DISABLED; only the two provisioned
// users below can complete a magic-link sign-in).
//
// NOTE: this is a *branded team front door* over the PUBLIC knowledge base.
// The KB content it renders is already public on GitHub / via raw URLs, so the
// login personalizes the reading experience — it is not a content lock.
//
// Wired to the existing "cpl-budget-support" Supabase project (reused to avoid a
// second project and extra cost). The publishable (anon) key is safe to commit.
// One-time auth setup still has to be done in Supabase Studio (see README):
// disable signups, add the two allowlisted users, and add this portal's host
// URL to the project's Redirect URLs. Until then sign-in won't complete.
export const SUPABASE_URL  = "https://mdxutmbpoqjtdcwjscux.supabase.co";
export const SUPABASE_ANON = "sb_publishable_lPfS842rgq7Ru0IUy4KaOg_Q55SGLhQ";

// Source of the rendered content (public repo, main branch).
export const REPO_OWNER = "CPL-Initiative";
export const REPO_NAME  = "cpl-knowledge-base";
export const REPO_REF   = "main";
export const RAW_BASE   = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_REF}`;
export const TREE_API   = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${REPO_REF}?recursive=1`;

// Who may sign in (display/UX only — the real gate is enforced in Supabase:
// signups disabled + only these users provisioned). map@rccd.edu is intentionally
// NOT here, since that inbox has access to private CPLBrain content.
export const ALLOWLIST = ["slee@cccco.edu", "malone.dunlavy@rccd.edu"];

// Content folders surfaced in the portal nav, in display order. The nav is built
// live from the GitHub tree; this list controls which top-level folders appear
// and how they're labeled. Top-level files (e.g. glossary.md) are added below.
export const SECTIONS = [
  { dir: "overview",           label: "Overview" },
  { dir: "methodology",        label: "Methodology" },
  { dir: "policy-and-funding", label: "Policy & Funding" },
  { dir: "research",           label: "Research" },
  { dir: "playbooks",          label: "Playbooks" },
  { dir: "current-status",     label: "Current Status" },
];
export const TOP_LEVEL_DOCS = ["glossary.md", "using-with-ai-assistants.md"];

// Fallback nav if the GitHub tree API is unreachable (e.g. rate-limited). Kept
// deliberately small; the live tree is preferred and supersedes this.
export const FALLBACK_TREE = [
  "overview/overview.md", "overview/map-platform.md", "overview/ai-ready-california.md",
  "methodology/three-pillar-initiative-design.md", "methodology/infrastructure-first-scaling.md",
  "methodology/sprint-based-execution.md", "methodology/evidence-first-advocacy.md",
  "methodology/knowledge-consolidation.md", "methodology/pattern-scattered-to-systematic.md",
  "methodology/pattern-ai-as-accelerant-with-faculty-validation.md",
  "policy-and-funding/accjc-cpl-policy.md", "policy-and-funding/chancellor-cpl-call-to-action.md",
  "policy-and-funding/cpl-initiative-report-2026.md", "policy-and-funding/cpl-workplan-2025.md",
  "policy-and-funding/ess-25-82-funding-memo.md", "policy-and-funding/va-compliance-notification-docs.md",
  "policy-and-funding/veterans-sprint-cpl-policies-compliance.md",
  "research/ca-master-plan-career-education-2025.md", "research/economic-impact-2024.md",
  "research/map-platform-evolution-2026-04.md", "research/scaling-cpl-california-2024.md",
  "research/vision-2030-report-2025.md",
  "playbooks/ace-presentation.md", "playbooks/cpl-fact-sheet-2026-02-10.md",
  "playbooks/cpl-faculty-coordinator-sample.md", "playbooks/cpl-outreach-flyers.md",
  "playbooks/cpl-survey-questions-sample.md", "playbooks/map-counselors-page.md",
  "playbooks/map-cpl-implementation-guide.md", "playbooks/map-cpl-landing-pages.md",
  "playbooks/map-cpl-stories-page.md", "playbooks/map-exhibit-analysis.md",
  "playbooks/map-ui-brand-standards.md", "playbooks/no-cid-courses-crosswalk.md",
  "current-status/README.md",
  "glossary.md", "using-with-ai-assistants.md",
];
