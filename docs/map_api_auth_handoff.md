# MAP CustomReport API — auth coordination + pre-stage

**Context (2026-06-01):** MAP is adding user auth to the Custom Report Builder.
Our CPL dashboard's daily GitHub Actions automation pulls its data from that
API **unauthenticated today** (`fetch_custom_report.py`), so without a
non-interactive service credential the daily regen would be locked out
(401/403) once auth is enforced. This doc has (1) the message to send MAP and
(2) the pre-stage already in place on our side.

Related: `docs/kb-notes/reference-daily-dashboard-data-pipeline.md` (the 7 data
sources). Two MAP hosts are involved — see "Second host" below.

---

## 1. Message to send MAP (paste into Teams)

> **Re: CPL dashboard automation + the upcoming Custom Report Builder auth**
>
> Heads-up before user auth goes live: our CPL Initiative dashboard refreshes
> daily from the MAP Custom Report API via an automated (server-to-server) job,
> so it can't do an interactive/user login. To avoid the daily refresh getting
> locked out, could you provision a **non-interactive service credential** (an
> API key or OAuth client-credentials token) for this caller, and keep the
> endpoint reachable for it once auth is enforced?
>
> **What our automation calls:**
> - **Endpoint:** `POST https://mapwebapinew.azurewebsites.net/api/CustomReport/getReport`
> - **Headers today:** `Content-Type: application/json` (no auth)
> - **Body:** JSON array of 9 `{viewName, columnName[]}` dataset requests
>   (View_ArticulatedMAPExhibits, ArticulatedCollegeCourses, CollegeContacts,
>   CollegeCourses, CollegeUsersRoles, CreditDistributionByCollege,
>   PointInTime_StudentAggregatedValues, ProgramsofStudy,
>   StudentAggregatedValues — aggregate columns only, no student-identity fields).
> - **Response:** ~91 MB JSON array (the 9 datasets).
> - **Caller:** GitHub Actions cron, ~10:17 & ~14:14 UTC daily.
>
> **What we need to know:**
> 1. Which credential type you'll issue (API key vs. OAuth client-credentials),
>    and the **header** to send it in (e.g. `Authorization: Bearer …`,
>    `Ocp-Apim-Subscription-Key`, or `x-api-key`).
> 2. Whether the **same auth change affects the CPL Dashboard
>    `cpldashboardcccco.azurewebsites.net/api/potential-savings`** endpoint too —
>    we also read that (for the headline KPI metrics) via a Cloudflare Worker.
> 3. Roughly **when** auth gets enforced, so we can test the credential ahead of
>    the cutover.
>
> Our side is already wired to accept whatever you issue — once we have the
> credential we just store it as a secret; no further changes needed. Thanks!

---

## 2. Our side — already pre-staged (no action until MAP replies)

`fetch_custom_report.py` → `_build_headers()` reads three optional env vars and
attaches the credential automatically. **No-op until `MAP_API_KEY` is set**, so
the daily run is unchanged in the meantime.

| Env var | Purpose | Default |
|---|---|---|
| `MAP_API_KEY` | the credential (API key / Bearer token). **Activates auth when set.** | unset → no auth |
| `MAP_API_AUTH_HEADER` | header name to carry it | `Authorization` |
| `MAP_API_AUTH_SCHEME` | prefix before the key | `Bearer` (set `""` for a raw key) |

The daily workflow (`.github/workflows/daily-dashboard.yml`, Step 1) already
passes these from repo secrets (`secrets.MAP_API_KEY` etc. — they resolve to
empty until created).

### Activation when MAP issues the credential — pick the matching case
- **Bearer token:** set repo secret `MAP_API_KEY=<token>`. (Defaults send
  `Authorization: Bearer <token>`.) Nothing else.
- **Azure APIM subscription key:** set `MAP_API_KEY=<key>`,
  `MAP_API_AUTH_HEADER=Ocp-Apim-Subscription-Key`, `MAP_API_AUTH_SCHEME=` (empty).
- **`x-api-key` style:** set `MAP_API_KEY=<key>`, `MAP_API_AUTH_HEADER=x-api-key`,
  `MAP_API_AUTH_SCHEME=` (empty).

Then **`workflow_dispatch` the daily workflow once** to confirm the authenticated
fetch succeeds (`CUSTOM_REPORT_STATUS=success`) before the open path is removed.

### Second host (the KPI scrape)
The 6 headline KPI metrics come from a **different** MAP host —
`cpldashboardcccco.azurewebsites.net/api/potential-savings` — read via the
Cloudflare Worker (`cloudflare-worker-proxy.js`, gated by our own
`SCRAPE_SECRET`; the MAP endpoint itself is open today). If MAP's auth rollout
also covers that host, the Worker would need to carry a credential there too —
that's a Cloudflare-side change (add the credential as a Worker secret + send the
header in the `/scrape` fetch), separate from this repo.
