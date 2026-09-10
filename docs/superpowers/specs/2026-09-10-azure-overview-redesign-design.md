# Azure Accounts Overview Redesign — Design Spec

## Context

Today, `AzureOverallDashboard.jsx` — the page a user lands on right after
connecting an Azure account (`/azure`, internal `view: 'dashboard'` in
`AzureRoot.jsx`) — is a simple multi-account landing page: 4 stat tiles,
a per-account "Environments" table (with a hardcoded "N/A" Tag Coverage
column) with a "View →" button per row into `AzureCostPage.jsx`, a 30-day
trend chart, and a "Top Services" tile grid. Its own mock data endpoints
(`/azure/summary`, `/azure/top-services`) don't actually exist in
`demoBackend.js` today — every Azure page-data call falls through to the
adapter's generic `ok({})` fallback, so the page currently renders its
empty state.

The user supplied a reference tool (a local static mockup, "costlens" —
an Azure Cost Management–style analysis UI) showing a rich 6-tab
structure: **Overview, Applications, Services, Resource groups, Tags,
Resources**. This spec redesigns `AzureOverallDashboard.jsx` into that
6-tab structure, aggregating cost across all of a user's connected Azure
accounts, with the reference used purely as a **structural/functional**
guide — which sections, charts, and filters to build — not a visual one.
All styling follows this app's own established design system (`brand-*`
color tokens, `.btn-primary`/`.card`/`.badge`/`shadow-card` utilities,
existing `recharts` chart conventions), not the reference's own "costlens"
branding (yellow tab bar, serif headings, purple/orange accents).

## Decisions from brainstorming (binding)

- **Target page**: `AzureOverallDashboard.jsx` is rebuilt into the 6-tab
  design. `AzureCostPage.jsx` (the single-account Executive/Operations/
  Technical detail page) is left completely untouched, but must stay
  reachable — see "Preserving AzureCostPage" below.
- **Scope**: all 6 tabs are built now (not just Overview), each with real
  content — not placeholders.
- **Account list**: the old dedicated "Environments" accounts table is
  dropped. A connected account is instead browsable via the Scope ·
  Subscription filter (which lists each connected account's subscription)
  and the Resource Groups / Resources tabs. "Manage Accounts" remains a
  header action (unchanged destination: `AccountManager.jsx`).
- **Preserving AzureCostPage**: each Resource Groups tab card gets a small
  "Open detailed dashboard →" affordance, scoped to that card's
  subscription, that still calls the existing `onSelectAccount` callback
  into `AzureCostPage.jsx` — so its forecasts/reservations/AI-insights/
  budgets/invoices functionality isn't orphaned by removing the old table.
- **Fidelity**: fully interactive. Every filter (date range, subscription,
  cost basis, tag key/value, application, service, resource group, free-
  text search) actually re-queries and re-renders every affected tab —
  not a static mockup.
- **Aggregation architecture**: server-side, matching this app's existing
  convention (`AzureCostPage.jsx` already fetches pre-aggregated shapes
  from `/azure/full`, `/azure/yearly`, etc.). `demoBackend.js` gets an
  **internal-only** per-resource-per-day seed dataset (never shipped raw
  to the browser) plus new endpoints that accept the active filters as
  query params and return already-aggregated JSON. The frontend gets a
  thin API-wrapper module with no aggregation logic of its own — the same
  shape as `src/api/billingApi.js`.
- **Data volume**: ~12–16 synthetic resources across the 2 existing seeded
  Azure accounts (`az-1` Contoso Production, `az-2` Contoso Dev/Test),
  spanning ~3 months of daily records — enough for MTD / last-month /
  custom-range filters and a believable trend.

## Data model (server-side only, inside `demoBackend.js`)

A new module-private array, shaped after the reference's own generator but
scoped to this app's existing accounts:

```js
// Each entry is a synthetic Azure resource, seeded once at module load.
const AZURE_RESOURCES = [
  // id, service, resourceGroup, applicationName, businessApplication, environment, subscriptionId, baseCost
  ['vm-commerce-01', 'Virtual Machines', 'rg-commerce-prod', 'Commerce', 'Digital Experience', 'Production', 'az-1', 15300],
  ['sql-commerce-01', 'SQL Database', 'rg-commerce-prod', 'Commerce', 'Digital Experience', 'Production', 'az-1', 12100],
  ['aks-customer-01', 'Azure Kubernetes Service', 'rg-customer-prod', 'Customer Portal', 'Digital Experience', 'Production', 'az-1', 18400],
  // ... ~12-16 total, spread across az-1 and az-2, mirroring the
  // reference's own resource list (Storage, Synapse, App Service, Azure
  // Monitor, Virtual Network) plus a couple more so both accounts have
  // meaningful, distinct data.
];

// Daily records generated at module load for the last ~100 days, one row
// per resource per day: { date, resourceId, resourceName, service, group,
// applicationName, businessApplication, environment, costCenter,
// subscriptionId, actualCost, amortizedCost }. costCenter is derived
// (e.g. by service or app index) the same way the reference derives it.
// Deterministic (no Math.random) so repeated requests/tests are stable —
// use a seeded sinusoidal variation like the reference's
// `1 + 0.11*sin(...)` formula, not real randomness.
```

Untagged/unassigned cost is represented the same way the reference does:
some resources deliberately have an empty `applicationName` (renders as
"Untagged" in the Applications/Tags views) — matching the doc's
established "zero/blank is an explicit, real state" principle used
elsewhere in this codebase (e.g. Billing's 0%-discount pricing rules).

## New API surface

All under `/azure/overview/*`, added as new `if (method === "get" && path
=== ...)` branches in `demoAdapter` (per the existing pattern in
`demoBackend.js`). Every endpoint accepts the same filter query params
(all optional): `from`, `to`, `subscriptionId` ("all" or one account id),
`costBasis` (`actual`|`amortized`), `appKey` (which tag key the
"application" filter reads — `ApplicationName` or `BusinessApplication`,
matching the reference's own toggle), `app`, `tagKey`, `tagValue`,
`service`, `group`, `search` (matches against resource name/id and
resource-group name only — not cost values). Each computes its aggregate
fresh from `AZURE_RESOURCES`/the daily records, filtered by those params —
no caching needed given the in-memory dataset is small.

`costBasis` only visibly differs for resources tagged with the
`Reservations` service: `amortized` cost spreads a seeded upfront
reservation purchase evenly across the period instead of showing it as a
lump sum on its purchase day (`actual`) — mirroring the reference's own
`amortized = actual - (lump, only on purchase day)` treatment. Every
other resource's actual/amortized costs are equal.

- `GET /azure/overview/filter-options` → `{ subscriptions: [{id,name}],
  applications: [string], tagKeys: [string], tagValuesByKey: {key:
  [string]}, services: [string], groups: [string] }` — populates every
  filter dropdown; independent of the current filter selection (always
  the full universe) so users can always broaden back out.
- `GET /azure/overview/kpis` → `{ totalCost, previousPeriodCost,
  avgDailyCost, untaggedCost, recordCount, currency, periodLabel,
  previousPeriodLabel }`.
- `GET /azure/overview/trend` → `{ current: [{date, cost}], previous:
  [{date, cost}] }` (previous = same-length prior period, aligned by
  day-offset like the reference's "Previous period, aligned by day").
- `GET /azure/overview/applications` → `{ items: [{name, cost, previousCost,
  share, resourceCount}] }`, sorted desc by cost. Used by both the
  Overview tab's portfolio donut + comparison bars, and the full
  Applications tab table.
- `GET /azure/overview/services` → `{ items: [{name, cost, previousCost,
  change}] }` — powers Overview's service-mix bars + "what changed"
  diverging chart, and the full Services tab.
- `GET /azure/overview/resource-groups` → `{ items: [{name, cost,
  resourceCount, subscriptionId}] }`.
- `GET /azure/overview/tags` → `{ coveragePct, taggedRecordCount,
  totalRecordCount, costWithoutTag, values: [{value, cost}] }` for the
  selected `tagKey`. The Tags tab's "Tag key" dropdown offers all four
  seeded tag keys — `ApplicationName`, `BusinessApplication`,
  `Environment`, `CostCenter` — defaulting to `ApplicationName` (matching
  the reference's default coverage metric); `CostCenter` is derived per
  resource at seed time (e.g. `"Digital"` for the Commerce/Customer-Portal
  resources, `"Operations"`/`"IT"` for the rest), giving the dropdown a
  fourth real option instead of only three.
- `GET /azure/overview/resources` → `{ items: [{id, name, resourceGroup,
  service, cost, previousCost, share, change}] }` — full Resources tab
  table, respects a `groupBy` param (`resource`|`service`|`group`) like
  the reference's "Group by" selector.
- `GET /azure/overview/daily` → `{ days: [{date, cost}], highestDay: {date,
  cost} }` — powers the spend-intensity heatmap.

## Frontend structure

```
src/azure/overview/
  AzureOverviewPage.jsx        — replaces AzureOverallDashboard's body;
                                  header (icon, title, subtitle, Refresh +
                                  Manage Accounts buttons), filter bar,
                                  tab nav, renders the active tab
  AzureOverviewFilters.jsx     — Scope/Date range/Cost basis row + "More
                                  filters" drawer (tag key/value, app,
                                  service, group, search) — collapsible,
                                  matching the reference's toggle behavior
  useAzureOverviewFilters.js   — one hook: filter state + the debounced
                                  search value + a `queryParams` memo
                                  every tab/endpoint call reads from
  azureOverviewApi.js          — thin GET wrappers, one per endpoint above
                                  (same shape as billingApi.js)
  tabs/OverviewTab.jsx
  tabs/ApplicationsTab.jsx
  tabs/ServicesTab.jsx
  tabs/ResourceGroupsTab.jsx
  tabs/TagsTab.jsx
  tabs/ResourcesTab.jsx
  components/KpiRow.jsx        — the 4-tile KPI row (reused as-is by
                                  Overview only)
  components/SpendIntensityHeatmap.jsx
  components/DivergingBarChart.jsx   — "what changed" style chart, generic
                                  enough to reuse if needed elsewhere
```

`AzureOverallDashboard.jsx` itself becomes a thin wrapper that renders
`AzureOverviewPage`, keeping `AzureRoot.jsx`'s `view`/`onSelectAccount`/
`onManageAccounts` contract unchanged so the rest of the Azure routing
(`view: 'accounts' | 'dashboard' | 'cost'`) doesn't need to change.

## Visual language (must match, not the reference's)

- Page header: icon chip + eyebrow + `text-2xl font-bold` title + subtitle
  — the pattern already used by `BillingPage.jsx`/`AzureCostPage.jsx`.
- KPI tiles / cards: `.card` + `shadow-card`, `brand-*` accent color, not
  the reference's cream/purple/orange tints.
- Buttons: `.btn-primary`/`.btn-secondary`/`.btn-ghost`.
- Status/coverage pills: `.badge` base class.
- Charts: `recharts` (`AreaChart`, `BarChart`, `PieChart`), colored from
  the app's existing chart palette conventions (see `AzureCostPage.jsx`'s
  `AZURE_COLORS`/`AZ_SVC_COLORS`), not the reference's palette.
- Tables: plain `<table>` with sticky header + row-hover, matching
  `AzureOverallDashboard.jsx`'s existing Environments table convention.
- Tab nav: matches the pill/underline tab convention already used
  elsewhere in the app (e.g. `BillingPage.jsx`'s Invoices/Customers/
  Pricing Rules tabs), not the reference's yellow full-width bar.

## Testing / verification

- Playwright, driven end-to-end: load the page, confirm all 6 tabs render
  real (non-empty) data; change the date range and confirm KPI numbers
  change; switch the Subscription filter to one account and confirm every
  tab's totals shrink to that subset; click a service/application row and
  confirm it narrows the filter and other tabs reflect it; open the
  Resource Groups tab and confirm "Open detailed dashboard →" still lands
  on `AzureCostPage.jsx` for the right account.
- A lightweight internal consistency check: for a given filter set, the
  sum of the Services tab's costs equals the Applications tab's total
  equals the KPI row's Total cost (all three endpoints must agree, since
  they aggregate the same underlying filtered record set).
- Zero console errors across the above, per this session's established
  verification standard.

## Out of scope (for this pass)

- Any change to `AzureCostPage.jsx` or its Executive/Operations/Technical
  tabs.
- Any change to AWS/GCP/BTP's equivalent pages.
- Real Azure API integration (this app has no live backend; everything
  here is demo-mode mock data, consistent with the rest of the project).
- Persisting filter selections across page reloads (resets to defaults
  each visit, matching the reference's own behavior).
