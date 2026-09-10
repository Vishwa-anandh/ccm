# Azure Accounts Overview Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `AzureOverallDashboard.jsx` (the page shown right after
connecting an Azure account) into a 6-tab analytics page — Overview,
Applications, Services, Resource groups, Tags, Resources — aggregating
cost across every connected Azure account, modeled structurally on a
user-supplied reference tool but styled entirely with this app's own
design system.

**Architecture:** A new internal-only per-resource-per-day mock dataset
lives in `src/api/demoBackend.js`, exposed through nine new
`/azure/overview/*` GET endpoints that accept filter query params and
return pre-aggregated JSON (matching this app's existing
pre-aggregated-endpoint convention — never shipping raw records to the
browser). The frontend is a new `src/azure/overview/` module: a thin API
wrapper, one filter-state hook, a filter toolbar, six tab components, and
a handful of shared chart/stat components, all wired together by a new
`AzureOverviewPage.jsx`. `AzureOverallDashboard.jsx` becomes a 3-line
wrapper around it so `AzureRoot.jsx`'s existing `view`/`onSelectAccount`
contract never changes.

**Tech Stack:** React 19, `recharts` (already a dependency) for all
charts, Tailwind (existing `brand-*` tokens, `.card`/`.btn-primary`/
`.badge` utility classes), no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-10-azure-overview-redesign-design.md`

## Global Constraints

- No raw per-resource-per-day records are ever sent to the browser —
  every `/azure/overview/*` endpoint returns already-aggregated JSON.
  This is a hard rule from the spec, not a style preference.
- All visual styling (colors, cards, buttons, badges, chart palette) must
  match this app's existing conventions — never the reference tool's own
  "costlens" branding (no yellow tab bar, no serif headings, no purple/
  orange accent colors). Use `brand-*` Tailwind tokens and the shared
  `.card`/`.btn-primary`/`.btn-secondary`/`.badge`/`.skeleton` classes
  from `src/index.css`, and the blue chart palette already used in
  `src/components/AccountsCostTrendChart.jsx`'s `THEME.azure`.
- `AzureCostPage.jsx` and its Executive/Operations/Technical tabs are
  **not modified** by this plan at all.
- `AzureRoot.jsx`'s `view: 'dashboard' | 'accounts' | 'cost'` state
  machine and the props it passes to `AzureOverallDashboard`
  (`onSelectAccount`, `onManageAccounts`, `autoSelectId`,
  `autoSelectName`) must keep working unchanged — `AzureOverallDashboard`
  stays the component `AzureRoot` renders for `view === 'dashboard'`.
- No `Math.random()` anywhere in the new seed data — everything
  deterministic (sinusoidal variation keyed by day-index and resource-
  index), so repeated requests and any future test return the same
  numbers.
- Currency formatting always goes through `formatCurrency` from
  `src/utils/formatters.js` — never a re-implemented formatter.
- This app has no unit test runner (`package.json` has no `test` script);
  every task's verification step is running the dev server and driving
  the real UI with Playwright (matching this session's established
  practice), not writing Jest/Vitest tests.

---

## Task 1: Seed the Azure resource dataset + filter-options/kpis/trend endpoints

**Files:**
- Modify: `src/api/demoBackend.js`

**Interfaces:**
- Produces (used by every later task): the module-private `AZURE_RECORDS`
  array and a `filterAzureRecords(params)` helper — later tasks' endpoint
  handlers all call this same helper, never re-implement filtering.
- Produces the three endpoints below, callable immediately via
  `api.get('/azure/overview/filter-options')` etc.

Add this block near the other Azure-adjacent constants (after
`DASHBOARD_SUMMARY`, before the `RECOMMENDATIONS` array is a reasonable
spot — anywhere at module scope before `demoAdapter` is defined works).

- [ ] **Step 1: Add the seed dataset and record generator**

```js
/* ── Azure Overview: per-resource-per-day mock dataset ────────────
 * Internal only — never shipped raw to the browser. Every
 * /azure/overview/* endpoint aggregates this server-side and returns
 * pre-aggregated JSON, matching this file's existing convention for
 * AzureCostPage/AzureOverallDashboard's other endpoints. */

// id, service, resourceGroup, applicationName ('' = untagged),
// businessApplication (null = untagged), environment, subscriptionId,
// dailyBaseCost (USD)
const AZURE_RESOURCES = [
  ['vm-commerce-01', 'Virtual Machines', 'rg-commerce-prod', 'Commerce', 'Digital Experience', 'Production', 'az-1', 34],
  ['sql-commerce-01', 'SQL Database', 'rg-commerce-prod', 'Commerce', 'Digital Experience', 'Production', 'az-1', 27],
  ['aks-customer-01', 'Azure Kubernetes Service', 'rg-customer-prod', 'Customer Portal', 'Digital Experience', 'Production', 'az-1', 41],
  ['app-customer-api', 'App Service', 'rg-customer-prod', 'Customer Portal', 'Digital Experience', 'Production', 'az-1', 14],
  ['stanalytics001', 'Storage', 'rg-data-prod', 'Analytics', 'Enterprise Systems', 'Production', 'az-1', 13],
  ['syn-analytics-01', 'Azure Synapse Analytics', 'rg-data-prod', 'Analytics', 'Enterprise Systems', 'Production', 'az-1', 32],
  ['vm-erp-01', 'Virtual Machines', 'rg-erp-prod', 'ERP', 'Enterprise Systems', 'Production', 'az-1', 21],
  ['sql-erp-01', 'SQL Database', 'rg-erp-prod', 'ERP', 'Enterprise Systems', 'Production', 'az-1', 17],
  ['log-shared-01', 'Azure Monitor', 'rg-shared', '', null, 'Production', 'az-1', 10],
  ['vnet-shared-01', 'Virtual Network', 'rg-shared', '', null, 'Production', 'az-1', 6],
  ['vm-sandbox-01', 'Virtual Machines', 'rg-platform-dev', 'Platform', 'Enterprise Systems', 'Development', 'az-2', 7],
  ['stdev001', 'Storage', 'rg-platform-dev', 'Platform', 'Enterprise Systems', 'Development', 'az-2', 3],
  ['vm-sandbox-02', 'Virtual Machines', 'rg-platform-dev', 'Platform', 'Enterprise Systems', 'Development', 'az-2', 6],
  ['sql-dev-01', 'SQL Database', 'rg-platform-dev', 'Platform', 'Enterprise Systems', 'Development', 'az-2', 4],
];

// CostCenter is a fourth, independent tag dimension (not derived from
// applicationName at read-time — computed once here, matching how a
// real cost-management tool would store a separate tag key).
const AZURE_COST_CENTER_BY_APP = {
  Commerce: 'Digital',
  'Customer Portal': 'Digital',
  Analytics: 'Operations',
  ERP: 'Operations',
  Platform: 'IT',
  '': 'IT',
};

const AZURE_DAY_MS = 86400000;
const AZURE_DATA_START = '2026-06-01';
const AZURE_DATA_END = '2026-09-09'; // "today" for this demo build
const AZURE_RESERVATION_DATE = '2026-09-01';
const AZURE_RESERVATION_COST = 2400;
const AZURE_RESERVATION_AMORTIZED = round2(AZURE_RESERVATION_COST / 90); // illustrative ~90-day spread

function buildAzureRecords() {
  const records = [];
  const startT = Date.parse(AZURE_DATA_START + 'T00:00:00Z');
  const endT = Date.parse(AZURE_DATA_END + 'T00:00:00Z');
  let n = 0;
  for (let t = startT; t <= endT; t += AZURE_DAY_MS, n++) {
    const date = new Date(t).toISOString().slice(0, 10);
    AZURE_RESOURCES.forEach((r, i) => {
      const [resourceId, service, group, applicationName, businessApplication, environment, subscriptionId, dailyBase] = r;
      const cost = round2(dailyBase * (1 + 0.11 * Math.sin(n * 0.47 + i) + n * 0.0015));
      records.push({
        date,
        resourceId,
        resourceName: resourceId,
        service,
        group,
        applicationName,
        businessApplication,
        environment,
        costCenter: AZURE_COST_CENTER_BY_APP[applicationName] ?? 'IT',
        subscriptionId,
        actualCost: cost,
        amortizedCost: cost,
      });
    });
    if (date === AZURE_RESERVATION_DATE) {
      records.push({
        date,
        resourceId: null,
        resourceName: 'Reservation purchase / unused commitment',
        service: 'Reservations',
        group: null,
        applicationName: '',
        businessApplication: null,
        environment: 'Production',
        costCenter: 'IT',
        subscriptionId: 'az-1',
        actualCost: AZURE_RESERVATION_COST,
        amortizedCost: AZURE_RESERVATION_AMORTIZED,
      });
    }
  }
  return records;
}
const AZURE_RECORDS = buildAzureRecords();

// Every /azure/overview/* endpoint's shared filter step. `costBasis`
// picks which cost field aggregation reads; every other param narrows
// which records are included.
function filterAzureRecords(params = {}) {
  const from = params.from || AZURE_DATA_START;
  const to = params.to || AZURE_DATA_END;
  const costBasis = params.costBasis === 'amortized' ? 'amortizedCost' : 'actualCost';
  const search = (params.search || '').trim().toLowerCase();

  return AZURE_RECORDS.filter((rec) => {
    if (rec.date < from || rec.date > to) return false;
    if (params.subscriptionId && params.subscriptionId !== 'all' && rec.subscriptionId !== params.subscriptionId) return false;
    if (params.service && rec.service !== params.service) return false;
    if (params.group && rec.group !== params.group) return false;
    if (params.tagKey && params.tagValue) {
      const tagField = { ApplicationName: 'applicationName', BusinessApplication: 'businessApplication', Environment: 'environment', CostCenter: 'costCenter' }[params.tagKey];
      const val = tagField ? (rec[tagField] || '') : '';
      const wanted = params.tagValue === 'Untagged' ? '' : params.tagValue;
      if ((val || '') !== wanted) return false;
    }
    if (params.appKey && params.app) {
      const appField = params.appKey === 'BusinessApplication' ? 'businessApplication' : 'applicationName';
      const val = rec[appField] || '';
      const wanted = params.app === 'Untagged' ? '' : params.app;
      if (val !== wanted) return false;
    }
    if (search) {
      const haystack = `${rec.resourceName || ''} ${rec.group || ''}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  }).map((rec) => ({ ...rec, cost: rec[costBasis] }));
}

// Same-length window immediately preceding `from..to`, for period-over-
// period comparisons (KPI "Previous period", trend chart, app/service
// change columns).
function previousAzurePeriod(from, to) {
  const days = Math.round((Date.parse(to) - Date.parse(from)) / AZURE_DAY_MS) + 1;
  const prevTo = new Date(Date.parse(from) - AZURE_DAY_MS).toISOString().slice(0, 10);
  const prevFrom = new Date(Date.parse(from) - days * AZURE_DAY_MS).toISOString().slice(0, 10);
  return { from: prevFrom, to: prevTo };
}
```

- [ ] **Step 2: Add the three endpoints**

Add these branches in `demoAdapter`, alongside the existing `/billing/*`
branches (query params arrive as `config.params`, since a custom axios
adapter — unlike the default xhr/http adapters — never merges `params`
into `config.url` for you):

```js
if (method === "get" && path === "/azure/overview/filter-options") {
  // Include subscriptionId — AzureCostPage.jsx (reached via the Resource
  // Groups tab's "Open detailed dashboard" link) reads it directly off
  // the account object passed through onSelectAccount, same shape
  // AzureOverallDashboard used to construct.
  const subs = DASHBOARD_SUMMARY.accounts.azure.map((a) => ({ id: a.id, name: a.name, subscriptionId: a.subscriptionId }));
  const applications = Array.from(new Set(AZURE_RECORDS.map((r) => r.applicationName || 'Untagged')));
  const businessApplications = Array.from(new Set(AZURE_RECORDS.map((r) => r.businessApplication || 'Untagged')));
  const tagValuesByKey = {
    ApplicationName: applications,
    BusinessApplication: businessApplications,
    Environment: Array.from(new Set(AZURE_RECORDS.map((r) => r.environment))),
    CostCenter: Array.from(new Set(AZURE_RECORDS.map((r) => r.costCenter))),
  };
  const services = Array.from(new Set(AZURE_RESOURCES.map((r) => r[1]))).concat('Reservations');
  const groups = Array.from(new Set(AZURE_RESOURCES.map((r) => r[2])));
  return ok({ subscriptions: subs, applications, tagKeys: Object.keys(tagValuesByKey), tagValuesByKey, services, groups }, config);
}

if (method === "get" && path === "/azure/overview/kpis") {
  const params = config.params || {};
  const from = params.from || AZURE_DATA_START;
  const to = params.to || AZURE_DATA_END;
  const filtered = filterAzureRecords(params);
  const totalCost = round2(filtered.reduce((s, r) => s + r.cost, 0));
  const prevRange = previousAzurePeriod(from, to);
  const prevFiltered = filterAzureRecords({ ...params, from: prevRange.from, to: prevRange.to });
  const previousPeriodCost = round2(prevFiltered.reduce((s, r) => s + r.cost, 0));
  const dayCount = Math.round((Date.parse(to) - Date.parse(from)) / AZURE_DAY_MS) + 1;
  const untaggedCost = round2(filtered.filter((r) => !r.applicationName).reduce((s, r) => s + r.cost, 0));
  return ok({
    totalCost, previousPeriodCost,
    avgDailyCost: round2(totalCost / dayCount),
    untaggedCost,
    recordCount: filtered.length,
    currency: "USD",
    periodLabel: `${from} → ${to} · ${dayCount} days`,
    previousPeriodLabel: `${prevRange.from} → ${prevRange.to}`,
  }, config);
}

if (method === "get" && path === "/azure/overview/trend") {
  const params = config.params || {};
  const from = params.from || AZURE_DATA_START;
  const to = params.to || AZURE_DATA_END;
  const filtered = filterAzureRecords(params);
  const byDate = {};
  filtered.forEach((r) => { byDate[r.date] = (byDate[r.date] || 0) + r.cost; });
  const current = Object.keys(byDate).sort().map((date) => ({ date, cost: round2(byDate[date]) }));

  const prevRange = previousAzurePeriod(from, to);
  const prevFiltered = filterAzureRecords({ ...params, from: prevRange.from, to: prevRange.to });
  const byPrevDate = {};
  prevFiltered.forEach((r) => { byPrevDate[r.date] = (byPrevDate[r.date] || 0) + r.cost; });
  const prevDates = Object.keys(byPrevDate).sort();
  // Aligned by day-offset (previous[0] pairs with current[0], etc.), matching
  // the reference's "Previous period, aligned by day" behavior.
  const previous = prevDates.map((date, i) => ({ date: current[i]?.date ?? date, cost: round2(byPrevDate[date]) }));

  return ok({ current, previous }, config);
}
```

- [ ] **Step 3: Verify with the dev server**

Run: `npm run dev`, then in a scratch Node/Playwright script (or the
browser devtools console on any authenticated page), call:
```js
await fetch('/azure/overview/kpis').then(r => r.json())
```
This won't work via `fetch` since the mock intercepts axios, not
`fetch` — instead verify via a tiny throwaway Playwright script that logs
in, then runs `await page.evaluate(async () => { const api = (await import('/src/api/index.js')).default; return (await api.get('/azure/overview/kpis')).data; })` and prints the result. Confirm `totalCost` is a positive number roughly in the $200–260/day × ~9 days range for the MTD default window, and that `filter-options` returns the 4 tag keys, ~9 services, and 2 subscriptions.

- [ ] **Step 4: Commit**

```bash
git add src/api/demoBackend.js
git commit -m "feat(azure-overview): seed resource dataset + filter-options/kpis/trend endpoints"
```

---

## Task 2: Applications + Services endpoints

**Files:**
- Modify: `src/api/demoBackend.js`

**Interfaces:**
- Consumes: `filterAzureRecords(params)`, `previousAzurePeriod(from, to)`,
  `round2` from Task 1.
- Produces: `/azure/overview/applications`, `/azure/overview/services`.

- [ ] **Step 1: Add both endpoints**

```js
if (method === "get" && path === "/azure/overview/applications") {
  const params = config.params || {};
  const appKey = params.appKey === 'BusinessApplication' ? 'businessApplication' : 'applicationName';
  const from = params.from || AZURE_DATA_START;
  const to = params.to || AZURE_DATA_END;
  const filtered = filterAzureRecords(params);
  const prevRange = previousAzurePeriod(from, to);
  const prevFiltered = filterAzureRecords({ ...params, from: prevRange.from, to: prevRange.to });

  const groupCost = (records) => {
    const map = {};
    records.forEach((r) => {
      const key = r[appKey] || 'Untagged';
      map[key] = (map[key] || 0) + r.cost;
    });
    return map;
  };
  const current = groupCost(filtered);
  const previous = groupCost(prevFiltered);
  const resourceCounts = {};
  filtered.forEach((r) => {
    const key = r[appKey] || 'Untagged';
    resourceCounts[key] = resourceCounts[key] || new Set();
    resourceCounts[key].add(r.resourceId ?? r.resourceName);
  });
  const total = Object.values(current).reduce((s, v) => s + v, 0) || 1;
  const items = Object.keys(current)
    .map((name) => ({
      name,
      cost: round2(current[name]),
      previousCost: round2(previous[name] || 0),
      share: round2((current[name] / total) * 100),
      resourceCount: resourceCounts[name]?.size ?? 0,
    }))
    .sort((a, b) => b.cost - a.cost);
  return ok({ items }, config);
}

if (method === "get" && path === "/azure/overview/services") {
  const params = config.params || {};
  const from = params.from || AZURE_DATA_START;
  const to = params.to || AZURE_DATA_END;
  const filtered = filterAzureRecords(params);
  const prevRange = previousAzurePeriod(from, to);
  const prevFiltered = filterAzureRecords({ ...params, from: prevRange.from, to: prevRange.to });

  const groupCost = (records) => {
    const map = {};
    records.forEach((r) => { map[r.service] = (map[r.service] || 0) + r.cost; });
    return map;
  };
  const current = groupCost(filtered);
  const previous = groupCost(prevFiltered);
  const items = Object.keys(current)
    .map((name) => ({
      name,
      cost: round2(current[name]),
      previousCost: round2(previous[name] || 0),
      change: round2(current[name] - (previous[name] || 0)),
    }))
    .sort((a, b) => b.cost - a.cost);
  return ok({ items }, config);
}
```

- [ ] **Step 2: Verify**

Same throwaway-Playwright-script approach as Task 1 Step 3: call both
endpoints, confirm `applications` includes an `"Untagged"` entry (from
the shared/log/vnet resources) and `services` includes `"Reservations"`
with `change` equal to its full cost when the MTD default window is used
(since it has no previous-period occurrence).

- [ ] **Step 3: Commit**

```bash
git add src/api/demoBackend.js
git commit -m "feat(azure-overview): applications + services endpoints"
```

---

## Task 3: Resource groups + Tags + Resources + Daily endpoints

**Files:**
- Modify: `src/api/demoBackend.js`

**Interfaces:**
- Consumes: same helpers as Task 2.
- Produces: `/azure/overview/resource-groups`, `/azure/overview/tags`,
  `/azure/overview/resources`, `/azure/overview/daily`.

- [ ] **Step 1: Add all four endpoints**

```js
if (method === "get" && path === "/azure/overview/resource-groups") {
  const params = config.params || {};
  const filtered = filterAzureRecords(params);
  const map = {};
  filtered.forEach((r) => {
    if (!r.group) return; // the reservation pseudo-resource has no group
    const key = r.group;
    map[key] = map[key] || { name: key, cost: 0, subscriptionId: r.subscriptionId, resources: new Set() };
    map[key].cost += r.cost;
    map[key].resources.add(r.resourceId ?? r.resourceName);
  });
  const items = Object.values(map)
    .map((g) => ({ name: g.name, cost: round2(g.cost), resourceCount: g.resources.size, subscriptionId: g.subscriptionId }))
    .sort((a, b) => b.cost - a.cost);
  return ok({ items }, config);
}

if (method === "get" && path === "/azure/overview/tags") {
  const params = config.params || {};
  const tagKey = params.tagKey || 'ApplicationName';
  const tagField = { ApplicationName: 'applicationName', BusinessApplication: 'businessApplication', Environment: 'environment', CostCenter: 'costCenter' }[tagKey] || 'applicationName';
  const filtered = filterAzureRecords(params);
  const distinctIds = new Set(filtered.map((r) => r.resourceId ?? r.resourceName));
  const taggedIds = new Set(filtered.filter((r) => r[tagField]).map((r) => r.resourceId ?? r.resourceName));
  const totalRecordCount = distinctIds.size;
  const taggedRecordCount = taggedIds.size;
  const costWithoutTag = round2(filtered.filter((r) => !r[tagField]).reduce((s, r) => s + r.cost, 0));
  const map = {};
  filtered.forEach((r) => {
    const key = r[tagField] || 'Untagged';
    map[key] = (map[key] || 0) + r.cost;
  });
  const values = Object.keys(map)
    .map((value) => ({ value, cost: round2(map[value]) }))
    .sort((a, b) => b.cost - a.cost);
  return ok({
    coveragePct: totalRecordCount ? round2((taggedRecordCount / totalRecordCount) * 100) : 0,
    taggedRecordCount, totalRecordCount, costWithoutTag, values,
  }, config);
}

if (method === "get" && path === "/azure/overview/resources") {
  const params = config.params || {};
  const groupBy = params.groupBy || 'resource';
  const from = params.from || AZURE_DATA_START;
  const to = params.to || AZURE_DATA_END;
  const filtered = filterAzureRecords(params);
  const prevRange = previousAzurePeriod(from, to);
  const prevFiltered = filterAzureRecords({ ...params, from: prevRange.from, to: prevRange.to });

  const keyOf = (r) => (groupBy === 'service' ? r.service : groupBy === 'group' ? (r.group || 'Unassigned') : (r.resourceId ?? r.resourceName));
  const build = (records) => {
    const map = {};
    records.forEach((r) => {
      const key = keyOf(r);
      map[key] = map[key] || { key, name: groupBy === 'resource' ? r.resourceName : key, group: r.group, cost: 0 };
      map[key].cost += r.cost;
    });
    return map;
  };
  const current = build(filtered);
  const previous = build(prevFiltered);
  const total = Object.values(current).reduce((s, v) => s + v.cost, 0) || 1;
  const items = Object.values(current)
    .map((row) => ({
      id: row.key,
      name: row.name,
      resourceGroup: row.group || null,
      cost: round2(row.cost),
      share: round2((row.cost / total) * 100),
      previousCost: round2(previous[row.key]?.cost || 0),
      change: previous[row.key] ? round2(((row.cost - previous[row.key].cost) / previous[row.key].cost) * 100) : null, // null = "New cost"
    }))
    .sort((a, b) => b.cost - a.cost);
  return ok({ items, groupBy }, config);
}

if (method === "get" && path === "/azure/overview/daily") {
  const params = config.params || {};
  const filtered = filterAzureRecords(params);
  const byDate = {};
  filtered.forEach((r) => { byDate[r.date] = (byDate[r.date] || 0) + r.cost; });
  const days = Object.keys(byDate).sort().map((date) => ({ date, cost: round2(byDate[date]) }));
  const highestDay = days.reduce((max, d) => (d.cost > (max?.cost ?? -1) ? d : max), null);
  return ok({ days, highestDay }, config);
}
```

- [ ] **Step 2: Verify**

Same throwaway-script approach: confirm `/azure/overview/resources` with
`groupBy=service` sums to the same total as `/azure/overview/kpis`'
`totalCost` for the same filter params (internal consistency check from
the spec), and that the `Reservations` row's `change` is `null` ("New
cost") for the default MTD window.

- [ ] **Step 3: Commit**

```bash
git add src/api/demoBackend.js
git commit -m "feat(azure-overview): resource-groups + tags + resources + daily endpoints"
```

---

## Task 4: API wrapper + filter-state hook + filter toolbar

**Files:**
- Create: `src/azure/overview/azureOverviewApi.js`
- Create: `src/azure/overview/useAzureOverviewFilters.js`
- Create: `src/azure/overview/AzureOverviewFilters.jsx`

**Interfaces:**
- Consumes: the 9 endpoints from Tasks 1–3.
- Produces: `azureOverviewApi.getFilterOptions/getKpis/getTrend/
  getApplications/getServices/getResourceGroups/getTags/getResources/
  getDaily(params)` — every later tab task imports these, never calls
  `api.get` directly. Produces `useAzureOverviewFilters()` returning
  `{ filters, setFilter, queryParams, filterOptions }` — every tab and
  `AzureOverviewFilters` consumes this same shape.

- [ ] **Step 1: `azureOverviewApi.js`**

```js
import api from "../../api";

const get = async (path, params) => {
  const { data } = await api.get(`/azure/overview/${path}`, { params });
  return data;
};

export const getFilterOptions = () => get("filter-options");
export const getKpis = (params) => get("kpis", params);
export const getTrend = (params) => get("trend", params);
export const getApplications = (params) => get("applications", params);
export const getServices = (params) => get("services", params);
export const getResourceGroups = (params) => get("resource-groups", params);
export const getTags = (params) => get("tags", params);
export const getResources = (params) => get("resources", params);
export const getDaily = (params) => get("daily", params);
```

- [ ] **Step 2: `useAzureOverviewFilters.js`**

```js
import { useEffect, useMemo, useState } from "react";
import { getFilterOptions } from "./azureOverviewApi";

const todayIso = () => "2026-09-09"; // matches AZURE_DATA_END — this demo build's fixed "today"
const DEFAULT_FILTERS = {
  subscriptionId: "all",
  period: "mtd", // 'mtd' | 'last' | 'custom'
  from: "2026-09-01",
  to: todayIso(),
  costBasis: "actual", // 'actual' | 'amortized'
  appKey: "ApplicationName", // 'ApplicationName' | 'BusinessApplication'
  app: "",
  tagKey: "ApplicationName",
  tagValue: "",
  service: "",
  group: "",
  search: "",
};

const PERIOD_RANGES = {
  mtd: { from: "2026-09-01", to: "2026-09-09" },
  last: { from: "2026-08-01", to: "2026-08-31" },
};

/**
 * Single source of truth for every Azure Overview filter. Every tab reads
 * `queryParams` (already period-resolved, ready to spread into any
 * azureOverviewApi call) and every filter control reads/writes through
 * `filters`/`setFilter` — no tab keeps its own copy of filter state.
 */
export function useAzureOverviewFilters() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOptions, setFilterOptions] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getFilterOptions().then(setFilterOptions).catch(() => setFilterOptions({
      subscriptions: [], applications: [], tagKeys: [], tagValuesByKey: {}, services: [], groups: [],
    }));
  }, []);

  // Debounce the free-text search so every keystroke doesn't refetch
  // every tab.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const setFilter = (key, value) => {
    setFilters((f) => {
      const next = { ...f, [key]: value };
      if (key === "period" && value !== "custom" && PERIOD_RANGES[value]) {
        next.from = PERIOD_RANGES[value].from;
        next.to = PERIOD_RANGES[value].to;
      }
      return next;
    });
  };

  const reset = () => { setFilters(DEFAULT_FILTERS); setSearch(""); };

  const queryParams = useMemo(() => ({
    subscriptionId: filters.subscriptionId,
    from: filters.from,
    to: filters.to,
    costBasis: filters.costBasis,
    appKey: filters.appKey,
    app: filters.app || undefined,
    tagKey: filters.tagKey,
    tagValue: filters.tagValue || undefined,
    service: filters.service || undefined,
    group: filters.group || undefined,
    search: filters.search || undefined,
  }), [filters]);

  return { filters, setFilter, searchInput: search, setSearchInput: setSearch, reset, queryParams, filterOptions };
}
```

- [ ] **Step 3: `AzureOverviewFilters.jsx`**

Primary row (always visible) + a collapsible "More filters" drawer,
matching the reference's own primary/advanced split but using this app's
own controls styling (`bg-gray-50 dark:bg-gray-800 border border-gray-200
dark:border-gray-700 rounded-lg` inputs/selects, same as
`BuildInvoiceModal`/`GenerateInvoicePage`'s form fields elsewhere in this
codebase):

```jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

const selectCls = "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm";
const labelCls = "block text-xs font-semibold text-gray-500 mb-1";

const AzureOverviewFilters = ({ filters, setFilter, searchInput, setSearchInput, reset, filterOptions }) => {
  const [showMore, setShowMore] = useState(false);
  const opts = filterOptions || { subscriptions: [], applications: [], tagKeys: [], tagValuesByKey: {}, services: [], groups: [] };
  const tagValues = opts.tagValuesByKey[filters.tagKey] || [];
  const appValues = opts.tagValuesByKey[filters.appKey] || opts.applications;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className={labelCls}>Scope &middot; Subscription</label>
            <select className={selectCls} value={filters.subscriptionId} onChange={(e) => setFilter("subscriptionId", e.target.value)}>
              <option value="all">All</option>
              {opts.subscriptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date range</label>
            <select className={selectCls} value={filters.period} onChange={(e) => setFilter("period", e.target.value)}>
              <option value="mtd">Month to date</option>
              <option value="last">Last month</option>
              <option value="custom">Custom range</option>
            </select>
          </div>
          {filters.period === "custom" && (
            <>
              <div>
                <label className={labelCls}>From</label>
                <input type="date" className={selectCls} value={filters.from} onChange={(e) => setFilter("from", e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>To</label>
                <input type="date" className={selectCls} value={filters.to} onChange={(e) => setFilter("to", e.target.value)} />
              </div>
            </>
          )}
          <div>
            <label className={labelCls}>Cost basis</label>
            <select className={selectCls} value={filters.costBasis} onChange={(e) => setFilter("costBasis", e.target.value)}>
              <option value="actual">Actual cost</option>
              <option value="amortized">Amortized cost</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="btn-ghost"><RotateCcw className="w-3.5 h-3.5" /> Reset filters</button>
          <button onClick={() => setShowMore((s) => !s)} className="btn-secondary">
            <SlidersHorizontal className="w-3.5 h-3.5" /> More filters
          </button>
        </div>
      </div>

      {showMore && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-card">
          <div>
            <label className={labelCls}>Application tag</label>
            <select className={selectCls} value={filters.appKey} onChange={(e) => setFilter("appKey", e.target.value)}>
              <option value="ApplicationName">ApplicationName</option>
              <option value="BusinessApplication">BusinessApplication</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Application</label>
            <select className={selectCls} value={filters.app} onChange={(e) => setFilter("app", e.target.value)}>
              <option value="">All</option>
              {appValues.map((v) => <option key={v} value={v === "Untagged" ? "" : v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tag key</label>
            <select className={selectCls} value={filters.tagKey} onChange={(e) => setFilter("tagKey", e.target.value)}>
              {(opts.tagKeys.length ? opts.tagKeys : ["ApplicationName"]).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tag value</label>
            <select className={selectCls} value={filters.tagValue} onChange={(e) => setFilter("tagValue", e.target.value)}>
              <option value="">All</option>
              {tagValues.map((v) => <option key={v} value={v === "Untagged" ? "" : v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Service</label>
            <select className={selectCls} value={filters.service} onChange={(e) => setFilter("service", e.target.value)}>
              <option value="">All</option>
              {opts.services.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Resource group</label>
            <select className={selectCls} value={filters.group} onChange={(e) => setFilter("group", e.target.value)}>
              <option value="">All</option>
              {opts.groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Resource name / ID</label>
            <input type="search" placeholder="Search resources…" className={`${selectCls} w-full`} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
};

AzureOverviewFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilter: PropTypes.func.isRequired,
  searchInput: PropTypes.string.isRequired,
  setSearchInput: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  filterOptions: PropTypes.object,
};

export default AzureOverviewFilters;
```

- [ ] **Step 4: Verify**

No UI mounts this yet (that's Task 9) — verify by temporarily rendering
`<AzureOverviewFilters {...useAzureOverviewFilters()} />` inside
`AzureOverallDashboard.jsx` behind a throwaway `console.log`, confirming
in the browser that the dropdowns populate from `filter-options` and
`queryParams` updates (log it) as you change controls, then revert that
throwaway edit before committing — Task 9 is where this is wired for
real.

- [ ] **Step 5: Commit**

```bash
git add src/azure/overview/azureOverviewApi.js src/azure/overview/useAzureOverviewFilters.js src/azure/overview/AzureOverviewFilters.jsx
git commit -m "feat(azure-overview): API wrapper, filter-state hook, filter toolbar"
```

---

## Task 5: Shared components — KpiRow, SpendIntensityHeatmap, DivergingBarChart

**Files:**
- Create: `src/azure/overview/components/KpiRow.jsx`
- Create: `src/azure/overview/components/SpendIntensityHeatmap.jsx`
- Create: `src/azure/overview/components/DivergingBarChart.jsx`

**Interfaces:**
- Consumes: `formatCurrency` from `src/utils/formatters.js`.
- Produces: three presentational components consumed by `OverviewTab`
  (Task 6).

- [ ] **Step 1: `KpiRow.jsx`**

4-tile row, styled like `AzureOverallDashboard.jsx`'s existing stat tiles
(`rounded-2xl border ... shadow` pattern) rather than inventing a new
card style:

```jsx
import React from "react";
import PropTypes from "prop-types";
import { DollarSign, TrendingUp, Gauge, Tag } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";

const Tile = ({ icon: Icon, label, value, sub, loading }) => (
  <div className="card px-4 sm:px-5 py-3.5 flex items-center gap-3">
    <div className="p-2 rounded-xl border border-brand-200 dark:border-brand-800 shrink-0 hidden sm:flex">
      <Icon className="w-4 h-4 text-brand-500" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold text-gray-400 mb-0.5 truncate">{label}</p>
      {loading ? (
        <div className="w-24 h-6 skeleton rounded-lg" />
      ) : (
        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tabular-nums leading-none truncate">{value}</p>
      )}
      {sub && <p className="mt-1 text-[11px] text-gray-400 truncate">{sub}</p>}
    </div>
  </div>
);

const KpiRow = ({ kpis, loading }) => {
  const changePct = kpis?.previousPeriodCost
    ? Math.round(((kpis.totalCost - kpis.previousPeriodCost) / kpis.previousPeriodCost) * 1000) / 10
    : null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Tile icon={DollarSign} label="Total cost" loading={loading} value={kpis ? formatCurrency(kpis.totalCost, kpis.currency) : ""} sub={kpis?.periodLabel} />
      <Tile icon={TrendingUp} label="Previous period" loading={loading} value={kpis ? formatCurrency(kpis.previousPeriodCost, kpis.currency) : ""} sub={changePct !== null ? `${changePct > 0 ? "+" : ""}${changePct}% vs ${kpis.previousPeriodLabel}` : ""} />
      <Tile icon={Gauge} label="Average daily cost" loading={loading} value={kpis ? formatCurrency(kpis.avgDailyCost, kpis.currency) : ""} sub="Across every day in the selected range" />
      <Tile icon={Tag} label="Untagged application cost" loading={loading} value={kpis ? formatCurrency(kpis.untaggedCost, kpis.currency) : ""} sub={kpis?.totalCost ? `${Math.round((kpis.untaggedCost / kpis.totalCost) * 1000) / 10}% of net cost` : ""} />
    </div>
  );
};

KpiRow.propTypes = { kpis: PropTypes.object, loading: PropTypes.bool };
export default KpiRow;
```

- [ ] **Step 2: `SpendIntensityHeatmap.jsx`**

One tile per day, colored by relative intensity (matching the reference's
"Lower→Higher" day-tile row, restyled with `brand-*`):

```jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { formatCurrency } from "../../../utils/formatters";

const intensityClass = (ratio) => {
  if (ratio > 0.75) return "bg-brand-600 text-white";
  if (ratio > 0.5) return "bg-brand-400 text-white";
  if (ratio > 0.25) return "bg-brand-200 dark:bg-brand-900 text-gray-900 dark:text-white";
  return "bg-brand-50 dark:bg-brand-950/40 text-gray-700 dark:text-gray-300";
};

const SpendIntensityHeatmap = ({ days, highestDay, currency }) => {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...days.map((d) => d.cost), 0.01);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {days.map((d) => (
          <button
            key={d.date}
            onMouseEnter={() => setHovered(d)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(d)}
            className={`w-9 h-9 rounded-lg text-[11px] font-bold flex items-center justify-center transition-transform hover:scale-105 ${intensityClass(d.cost / max)}`}
            title={`${d.date}: ${formatCurrency(d.cost, currency)}`}
          >
            {Number(d.date.slice(-2))}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {hovered
          ? `${hovered.date}: ${formatCurrency(hovered.cost, currency)}`
          : highestDay
            ? `Highest day: ${highestDay.date} · ${formatCurrency(highestDay.cost, currency)} · ${days.length} days in view`
            : ""}
      </p>
    </div>
  );
};

SpendIntensityHeatmap.propTypes = {
  days: PropTypes.arrayOf(PropTypes.shape({ date: PropTypes.string, cost: PropTypes.number })).isRequired,
  highestDay: PropTypes.object,
  currency: PropTypes.string,
};
export default SpendIntensityHeatmap;
```

- [ ] **Step 3: `DivergingBarChart.jsx`**

Generic increase/decrease bar list, used by Overview's "What changed?"
section (recharts `BarChart` with two-tone bars, matching this app's
existing recharts styling conventions):

```jsx
import React from "react";
import PropTypes from "prop-types";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { formatCurrency } from "../../../utils/formatters";

const DivergingBarChart = ({ items, currency }) => {
  const data = items.map((it) => ({ name: it.name, change: it.change }));
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <RechartsTooltip formatter={(v) => formatCurrency(v, currency)} />
          <Bar dataKey="change" radius={[4, 4, 4, 4]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.change >= 0 ? "#EA580C" : "#059669"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

DivergingBarChart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, change: PropTypes.number })).isRequired,
  currency: PropTypes.string,
};
export default DivergingBarChart;
```

- [ ] **Step 4: Verify**

These are pure presentational components with no data fetching — verify
by temporarily rendering each with hand-written sample props in
`AzureOverallDashboard.jsx` (throwaway, reverted before commit) and
confirming no console errors / correct rendering via a quick Playwright
screenshot.

- [ ] **Step 5: Commit**

```bash
git add src/azure/overview/components/
git commit -m "feat(azure-overview): KpiRow, SpendIntensityHeatmap, DivergingBarChart"
```

---

## Task 6: OverviewTab.jsx

**Files:**
- Create: `src/azure/overview/tabs/OverviewTab.jsx`

**Interfaces:**
- Consumes: every `azureOverviewApi` function (Task 4), `KpiRow`/
  `SpendIntensityHeatmap`/`DivergingBarChart` (Task 5), `queryParams` from
  `useAzureOverviewFilters` (passed down as a prop from
  `AzureOverviewPage`, built in Task 9).
- Produces: the full Overview tab body — the richest of the 6 tabs,
  assembling KPIs, trend, application portfolio, cost comparison, spend
  movement, daily heatmap, service mix, resource groups, tag coverage,
  and a resource table, all reading from `queryParams`.

- [ ] **Step 1: Data fetching**

One `useEffect` keyed on `queryParams` (via `JSON.stringify` in the dep
array, matching how other pages in this app re-fetch on filter change)
that calls `getKpis`, `getTrend`, `getApplications`, `getServices`,
`getResourceGroups`, `getTags`, `getResources`, `getDaily` with
`Promise.all`, storing each result in its own `useState`. Show a
`skeleton` block per section while any of these are `null`/loading — no
new loading-state pattern, reuse `.skeleton` exactly as
`AzureOverallDashboard.jsx` already does.

- [ ] **Step 2: Layout, section by section**

```jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "../../../utils/formatters";
import KpiRow from "../components/KpiRow";
import SpendIntensityHeatmap from "../components/SpendIntensityHeatmap";
import DivergingBarChart from "../components/DivergingBarChart";
import { getKpis, getTrend, getApplications, getServices, getResourceGroups, getTags, getResources, getDaily } from "../azureOverviewApi";

const DONUT_COLORS = ["#2563EB", "#60A5FA", "#818CF8", "#0EA5E9", "#38BDF8", "#93C5FD"];

const SectionCard = ({ eyebrow, title, sub, children, accent = "brand" }) => (
  <div className={`card p-5 border-l-4 border-l-${accent}-500`}>
    <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-1">{eyebrow}</p>
    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
    {sub && <p className="text-xs text-gray-400 mt-0.5 mb-3">{sub}</p>}
    <div className={sub ? "" : "mt-3"}>{children}</div>
  </div>
);

const OverviewTab = ({ queryParams, onDrillFilter }) => {
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState(null);
  const [apps, setApps] = useState(null);
  const [services, setServices] = useState(null);
  const [groups, setGroups] = useState(null);
  const [tags, setTags] = useState(null);
  const [resources, setResources] = useState(null);
  const [daily, setDaily] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getKpis(queryParams), getTrend(queryParams), getApplications(queryParams),
      getServices(queryParams), getResourceGroups(queryParams), getTags(queryParams),
      getResources({ ...queryParams, groupBy: "resource" }), getDaily(queryParams),
    ]).then(([k, t, a, s, g, tg, r, d]) => {
      if (cancelled) return;
      setKpis(k); setTrend(t); setApps(a.items); setServices(s.items);
      setGroups(g.items); setTags(tg); setResources(r.items); setDaily(d);
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = !kpis;
  const currency = kpis?.currency ?? "USD";

  const trendData = trend
    ? trend.current.map((c, i) => ({ label: c.date.slice(5), current: c.cost, previous: trend.previous[i]?.cost ?? null }))
    : [];
  const appComparison = (apps ?? []).slice(0, 8).map((a) => ({ name: a.name, Current: a.cost, Previous: a.previousCost }));
  const untaggedAppEntry = (apps ?? []).find((a) => a.name === "Untagged");

  return (
    <div className="space-y-5">
      <KpiRow kpis={kpis} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard eyebrow="Trend" title="Accumulated costs" sub="Previous period aligned by day.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, "")} />
                <RechartsTooltip formatter={(v) => formatCurrency(v, currency)} />
                <Area type="monotone" dataKey="current" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} name="Selected period" />
                <Area type="monotone" dataKey="previous" stroke="#94A3B8" fill="none" strokeDasharray="4 4" strokeWidth={1.5} name="Previous period" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Application portfolio" title="Cost allocation" sub={`By ${queryParams.appKey}`} accent="indigo">
          <div className="h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={apps ?? []} dataKey="cost" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {(apps ?? []).map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(v) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
            {kpis && (
              <div className="absolute text-center pointer-events-none">
                <p className="text-[10px] font-bold text-gray-400">TOTAL COST</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(kpis.totalCost, currency)}</p>
              </div>
            )}
          </div>
          <div className="space-y-1 mt-2">
            {(apps ?? []).slice(0, 6).map((a, i) => (
              <button key={a.name} onClick={() => onDrillFilter({ appKey: queryParams.appKey, app: a.name === "Untagged" ? "" : a.name })} className="w-full flex items-center justify-between text-xs py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-1">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><span className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />{a.name}</span>
                <span className="font-bold text-gray-900 dark:text-white">{a.share}%</span>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard eyebrow="Application performance" title="Application cost comparison" sub="Current period vs. preceding equal-length period." accent="indigo">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appComparison} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <RechartsTooltip formatter={(v) => formatCurrency(v, currency)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Current" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Previous" fill="#C7D2FE" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Spend movement" title="What changed?" sub="Service cost increases and decreases vs. the prior period." accent="emerald">
          {services && <DivergingBarChart items={services} currency={currency} />}
        </SectionCard>
      </div>

      <SectionCard eyebrow="Daily activity" title="Daily spend intensity" sub="Each tile is one day. Hover to see its cost.">
        {daily && <SpendIntensityHeatmap days={daily.days} highestDay={daily.highestDay} currency={currency} />}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard eyebrow="Service mix" title="Cost by service" sub="Select a service to explore its resources.">
          <div className="space-y-2.5">
            {(services ?? []).map((s) => {
              const max = Math.max(...(services ?? []).map((x) => x.cost), 0.01);
              return (
                <button key={s.name} onClick={() => onDrillFilter({ service: s.name })} className="w-full text-left group">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-brand-600">{s.name}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(s.cost, currency)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(s.cost / max) * 100}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard eyebrow="Cost centers" title="Resource groups" sub="Select a group to inspect its resources.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(groups ?? []).map((g) => (
              <button key={g.name} onClick={() => onDrillFilter({ group: g.name })} className="text-left p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">{g.name}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(g.cost, currency)}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{g.resourceCount} resource{g.resourceCount === 1 ? "" : "s"}</p>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard eyebrow="Allocation health" title="Tag coverage & ownership" sub="Identify missing tags and understand cost allocation." accent="amber">
        {tags && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500">{queryParams.tagKey} coverage</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{tags.coveragePct}%</p>
              <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-2">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${tags.coveragePct}%` }} />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{tags.taggedRecordCount} of {tags.totalRecordCount} resources tagged</p>
              <div className="flex justify-between text-xs mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Cost without this tag</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(tags.costWithoutTag, currency)}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              {tags.values.map((v) => (
                <button key={v.value} onClick={() => onDrillFilter({ tagKey: queryParams.tagKey, tagValue: v.value === "Untagged" ? "" : v.value })} className="w-full flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="badge border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">{v.value}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(v.cost, currency)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard eyebrow="Resource cost details" title="Every cost, including untagged and unassigned charges." sub="">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-gray-400 border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-2">Resource</th>
                <th className="text-right py-2">Current cost</th>
                <th className="text-right py-2">Share</th>
                <th className="text-right py-2">Previous cost</th>
                <th className="text-right py-2">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {(resources ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5">
                    <p className="font-semibold text-gray-900 dark:text-white">{r.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{r.resourceGroup ? `${r.resourceGroup}` : "No resource ID"}</p>
                  </td>
                  <td className="text-right py-2.5 font-bold text-gray-900 dark:text-white tabular-nums">{formatCurrency(r.cost, currency)}</td>
                  <td className="text-right py-2.5 tabular-nums text-gray-500">{r.share}%</td>
                  <td className="text-right py-2.5 tabular-nums text-gray-500">{formatCurrency(r.previousCost, currency)}</td>
                  <td className="text-right py-2.5 tabular-nums">
                    {r.change === null ? <span className="text-amber-600 font-bold">New cost</span> : <span className={r.change >= 0 ? "text-orange-600" : "text-emerald-600"}>{r.change > 0 ? "+" : ""}{r.change}%</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

OverviewTab.propTypes = {
  queryParams: PropTypes.object.isRequired,
  onDrillFilter: PropTypes.func.isRequired,
};
export default OverviewTab;
```

- [ ] **Step 3: Verify**

Mount `OverviewTab` temporarily inside `AzureOverallDashboard.jsx` with a
hardcoded `queryParams` (the `DEFAULT_FILTERS`-shaped object) and
`onDrillFilter={() => {}}`, run the dev server, and screenshot via
Playwright: confirm every section renders real numbers (no
`NaN`/`undefined`), the donut chart and bar charts render, and there are
zero console errors. Revert the temporary mount before committing —
Task 9 wires this for real.

- [ ] **Step 4: Commit**

```bash
git add src/azure/overview/tabs/OverviewTab.jsx
git commit -m "feat(azure-overview): OverviewTab"
```

---

## Task 7: ApplicationsTab.jsx + ServicesTab.jsx

**Files:**
- Create: `src/azure/overview/tabs/ApplicationsTab.jsx`
- Create: `src/azure/overview/tabs/ServicesTab.jsx`

**Interfaces:**
- Consumes: `getApplications`/`getServices` from `azureOverviewApi.js`.
- Produces: two tab components with the same `{ queryParams,
  onDrillFilter }` prop contract as `OverviewTab`.

- [ ] **Step 1: `ApplicationsTab.jsx`** — full sortable table (name,
  cost, share, previous cost, resource count), reusing the exact table
  markup style from `OverviewTab`'s resource table (sticky-free, since
  this tab is short enough not to need it):

```jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { formatCurrency } from "../../../utils/formatters";
import { getApplications } from "../azureOverviewApi";

const ApplicationsTab = ({ queryParams, onDrillFilter }) => {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getApplications(queryParams).then((d) => { if (!cancelled) setItems(d.items); });
    return () => { cancelled = true; };
  }, [JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items) return <div className="skeleton rounded-2xl h-64 w-full" />;

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">Applications</h3>
      <p className="text-xs text-gray-400 mb-4">By {queryParams.appKey}. Click a row to filter the rest of the page.</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-bold text-gray-400 border-b border-gray-100 dark:border-gray-800">
            <th className="text-left py-2">Application</th>
            <th className="text-right py-2">Current cost</th>
            <th className="text-right py-2">Share</th>
            <th className="text-right py-2">Previous cost</th>
            <th className="text-right py-2">Resources</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {items.map((a) => (
            <tr key={a.name} onClick={() => onDrillFilter({ appKey: queryParams.appKey, app: a.name === "Untagged" ? "" : a.name })} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60">
              <td className="py-2.5 font-semibold text-gray-900 dark:text-white">{a.name}</td>
              <td className="text-right py-2.5 font-bold tabular-nums">{formatCurrency(a.cost)}</td>
              <td className="text-right py-2.5 tabular-nums text-gray-500">{a.share}%</td>
              <td className="text-right py-2.5 tabular-nums text-gray-500">{formatCurrency(a.previousCost)}</td>
              <td className="text-right py-2.5 tabular-nums text-gray-500">{a.resourceCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

ApplicationsTab.propTypes = { queryParams: PropTypes.object.isRequired, onDrillFilter: PropTypes.func.isRequired };
export default ApplicationsTab;
```

- [ ] **Step 2: `ServicesTab.jsx`** — same shape, one column set
  (name, cost, previous cost, change), plus the `DivergingBarChart` from
  Task 5 above the table for a visual summary:

```jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { formatCurrency } from "../../../utils/formatters";
import { getServices } from "../azureOverviewApi";
import DivergingBarChart from "../components/DivergingBarChart";

const ServicesTab = ({ queryParams, onDrillFilter }) => {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getServices(queryParams).then((d) => { if (!cancelled) setItems(d.items); });
    return () => { cancelled = true; };
  }, [JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items) return <div className="skeleton rounded-2xl h-64 w-full" />;

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">What changed, by service</h3>
        <DivergingBarChart items={items} currency="USD" />
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Services</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-bold text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th className="text-left py-2">Service</th>
              <th className="text-right py-2">Current cost</th>
              <th className="text-right py-2">Previous cost</th>
              <th className="text-right py-2">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {items.map((s) => (
              <tr key={s.name} onClick={() => onDrillFilter({ service: s.name })} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="py-2.5 font-semibold text-gray-900 dark:text-white">{s.name}</td>
                <td className="text-right py-2.5 font-bold tabular-nums">{formatCurrency(s.cost)}</td>
                <td className="text-right py-2.5 tabular-nums text-gray-500">{formatCurrency(s.previousCost)}</td>
                <td className={`text-right py-2.5 tabular-nums font-semibold ${s.change >= 0 ? "text-orange-600" : "text-emerald-600"}`}>{s.change > 0 ? "+" : ""}{formatCurrency(s.change)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

ServicesTab.propTypes = { queryParams: PropTypes.object.isRequired, onDrillFilter: PropTypes.func.isRequired };
export default ServicesTab;
```

- [ ] **Step 3: Verify**

Same throwaway-mount-and-screenshot approach as Task 6: mount each tab
with a hardcoded `queryParams`, confirm real data renders, zero console
errors, revert the throwaway mount.

- [ ] **Step 4: Commit**

```bash
git add src/azure/overview/tabs/ApplicationsTab.jsx src/azure/overview/tabs/ServicesTab.jsx
git commit -m "feat(azure-overview): ApplicationsTab + ServicesTab"
```

---

## Task 8: ResourceGroupsTab.jsx + TagsTab.jsx + ResourcesTab.jsx

**Files:**
- Create: `src/azure/overview/tabs/ResourceGroupsTab.jsx`
- Create: `src/azure/overview/tabs/TagsTab.jsx`
- Create: `src/azure/overview/tabs/ResourcesTab.jsx`

**Interfaces:**
- Consumes: `getResourceGroups`/`getTags`/`getResources` from
  `azureOverviewApi.js`.
- Consumes (new prop, only on `ResourceGroupsTab`): `onOpenAccount(id)` —
  passed down from `AzureOverviewPage` (Task 9), ultimately calling the
  existing `onSelectAccount` prop `AzureRoot.jsx` already gives
  `AzureOverallDashboard` — this is the "Open detailed dashboard →" link
  into the untouched `AzureCostPage.jsx`.
- Produces: three tab components.

- [ ] **Step 1: `ResourceGroupsTab.jsx`** — card grid (as in
  `OverviewTab`'s mini version) as the primary view, each card carrying
  the "Open detailed dashboard →" link:

```jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";
import { getResourceGroups } from "../azureOverviewApi";

const ResourceGroupsTab = ({ queryParams, onDrillFilter, onOpenAccount }) => {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getResourceGroups(queryParams).then((d) => { if (!cancelled) setItems(d.items); });
    return () => { cancelled = true; };
  }, [JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items) return <div className="skeleton rounded-2xl h-64 w-full" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((g) => (
        <div key={g.name} className="card p-4">
          <button onClick={() => onDrillFilter({ group: g.name })} className="w-full text-left">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">{g.name}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(g.cost)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{g.resourceCount} resource{g.resourceCount === 1 ? "" : "s"}</p>
          </button>
          <button
            onClick={() => onOpenAccount(g.subscriptionId)}
            className="mt-3 flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700"
          >
            Open detailed dashboard <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

ResourceGroupsTab.propTypes = {
  queryParams: PropTypes.object.isRequired,
  onDrillFilter: PropTypes.func.isRequired,
  onOpenAccount: PropTypes.func.isRequired,
};
export default ResourceGroupsTab;
```

- [ ] **Step 2: `TagsTab.jsx`** — the full tag explorer (coverage +
  tag-key switch + value breakdown), reusing exactly the layout already
  written once in `OverviewTab`'s "Allocation health" section, but as its
  own full-page version with a Tag key selector control:

```jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { formatCurrency } from "../../../utils/formatters";
import { getTags } from "../azureOverviewApi";

const TAG_KEYS = ["ApplicationName", "BusinessApplication", "Environment", "CostCenter"];

const TagsTab = ({ queryParams, setFilter, onDrillFilter }) => {
  const [tags, setTags] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getTags(queryParams).then((d) => { if (!cancelled) setTags(d); });
    return () => { cancelled = true; };
  }, [JSON.stringify(queryParams)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!tags) return <div className="skeleton rounded-2xl h-64 w-full" />;

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Tag coverage & ownership</h3>
          <p className="text-xs text-gray-400 mt-0.5">Identify missing tags and understand cost allocation.</p>
        </div>
        <select
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
          value={queryParams.tagKey}
          onChange={(e) => setFilter("tagKey", e.target.value)}
        >
          {TAG_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs font-semibold text-gray-500">{queryParams.tagKey} coverage</p>
          <p className="text-4xl font-bold text-amber-600 dark:text-amber-400 mt-1">{tags.coveragePct}%</p>
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mt-2">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${tags.coveragePct}%` }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{tags.taggedRecordCount} of {tags.totalRecordCount} charge records tagged</p>
          <div className="flex justify-between text-sm mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-500">Cost without this tag</span>
            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(tags.costWithoutTag)}</span>
          </div>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {tags.values.map((v) => (
            <button key={v.value} onClick={() => onDrillFilter({ tagKey: queryParams.tagKey, tagValue: v.value === "Untagged" ? "" : v.value })} className="w-full flex items-center justify-between py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 px-2 rounded-lg">
              <span className="badge border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">{v.value}</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(v.cost)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

TagsTab.propTypes = {
  queryParams: PropTypes.object.isRequired,
  setFilter: PropTypes.func.isRequired,
  onDrillFilter: PropTypes.func.isRequired,
};
export default TagsTab;
```

- [ ] **Step 3: `ResourcesTab.jsx`** — full resource cost-detail table
  with a "Group by" selector (resource / service / group):

```jsx
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { formatCurrency } from "../../../utils/formatters";
import { getResources } from "../azureOverviewApi";

const ResourcesTab = ({ queryParams }) => {
  const [groupBy, setGroupBy] = useState("resource");
  const [items, setItems] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getResources({ ...queryParams, groupBy }).then((d) => { if (!cancelled) setItems(d.items); });
    return () => { cancelled = true; };
  }, [JSON.stringify(queryParams), groupBy]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Resource cost details</h3>
          <p className="text-xs text-gray-400 mt-0.5">Every cost, including untagged and unassigned charges.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Group by</label>
          <select className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm" value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
            <option value="resource">Resource</option>
            <option value="service">Service</option>
            <option value="group">Resource group</option>
          </select>
        </div>
      </div>
      {!items ? (
        <div className="skeleton rounded-2xl h-64 w-full" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-bold text-gray-400 border-b border-gray-100 dark:border-gray-800">
              <th className="text-left py-2">Resource</th>
              <th className="text-right py-2">Current cost</th>
              <th className="text-right py-2">Share</th>
              <th className="text-right py-2">Previous cost</th>
              <th className="text-right py-2">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {items.map((r) => (
              <tr key={r.id}>
                <td className="py-2.5">
                  <p className="font-semibold text-gray-900 dark:text-white">{r.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{r.resourceGroup ?? "No resource ID"}</p>
                </td>
                <td className="text-right py-2.5 font-bold tabular-nums">{formatCurrency(r.cost)}</td>
                <td className="text-right py-2.5 tabular-nums text-gray-500">{r.share}%</td>
                <td className="text-right py-2.5 tabular-nums text-gray-500">{formatCurrency(r.previousCost)}</td>
                <td className="text-right py-2.5 tabular-nums">
                  {r.change === null ? <span className="text-amber-600 font-bold">New cost</span> : <span className={r.change >= 0 ? "text-orange-600" : "text-emerald-600"}>{r.change > 0 ? "+" : ""}{r.change}%</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

ResourcesTab.propTypes = { queryParams: PropTypes.object.isRequired };
export default ResourcesTab;
```

- [ ] **Step 4: Verify**

Same throwaway-mount approach: for `ResourceGroupsTab`, pass a stub
`onOpenAccount={(id) => console.log("open", id)}` and confirm clicking it
logs the right `subscriptionId` (`az-1`/`az-2`). Confirm `TagsTab`'s
dropdown switch (e.g. to `Environment`) changes the displayed values.
Confirm `ResourcesTab`'s Group-by switch changes row grouping. Zero
console errors throughout.

- [ ] **Step 5: Commit**

```bash
git add src/azure/overview/tabs/ResourceGroupsTab.jsx src/azure/overview/tabs/TagsTab.jsx src/azure/overview/tabs/ResourcesTab.jsx
git commit -m "feat(azure-overview): ResourceGroupsTab + TagsTab + ResourcesTab"
```

---

## Task 9: AzureOverviewPage.jsx — wire everything together

**Files:**
- Create: `src/azure/overview/AzureOverviewPage.jsx`
- Modify: `src/azure/pages/AzureOverallDashboard.jsx`

**Interfaces:**
- Consumes: `useAzureOverviewFilters` (Task 4), `AzureOverviewFilters`
  (Task 4), all 6 tab components (Tasks 6–8).
- Consumes (unchanged): the existing `onSelectAccount`/`onManageAccounts`
  props `AzureRoot.jsx` passes to `AzureOverallDashboard` — `
  AzureOverviewPage` takes the same two props plus `autoSelectId`/
  `autoSelectName` and re-exposes them exactly as `AzureOverallDashboard`
  does today, so `AzureRoot.jsx` needs **zero changes**.
- Produces: the page users land on for `view === 'dashboard'`.

- [ ] **Step 1: `AzureOverviewPage.jsx`**

Header (icon chip + eyebrow + title + subtitle, Refresh + Manage Accounts
buttons — same pattern as today's `AzureOverallDashboard.jsx` header, not
reinvented) + filter bar + pill tab nav (same pill convention as
`BillingPage.jsx`'s `TABS.map` block: `flex gap-1 bg-gray-100
dark:bg-gray-800 rounded-xl p-1 w-fit`) + the active tab:

```jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { Plus, RefreshCw, LayoutDashboard, Boxes, Server, Building2, Tags as TagsIcon, ListOrdered } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAzureOverviewFilters } from "./useAzureOverviewFilters";
import AzureOverviewFilters from "./AzureOverviewFilters";
import OverviewTab from "./tabs/OverviewTab";
import ApplicationsTab from "./tabs/ApplicationsTab";
import ServicesTab from "./tabs/ServicesTab";
import ResourceGroupsTab from "./tabs/ResourceGroupsTab";
import TagsTab from "./tabs/TagsTab";
import ResourcesTab from "./tabs/ResourcesTab";

const AzureIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M5.90011 21L13.7001 21L19.4001 6.79999L12.1001 6.79999L5.90011 21Z" fill="#0078D4" />
    <path d="M12.4001 21L12.4001 20.6L12.1001 21L12.4001 21ZM5.90011 21L0.100098 6.79999L6.8001 6.79999L9.9001 14.2L5.90011 21Z" fill="#0078D4" />
    <path d="M12.3001 20.6L19.5001 3.5L12.6001 3.5L9.9001 10L12.3001 20.6Z" fill="#5EA0EF" />
  </svg>
);

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "applications", label: "Applications", icon: Boxes },
  { id: "services", label: "Services", icon: Server },
  { id: "groups", label: "Resource groups", icon: Building2 },
  { id: "tags", label: "Tags", icon: TagsIcon },
  { id: "resources", label: "Resources", icon: ListOrdered },
];

const AzureOverviewPage = ({ onSelectAccount, onManageAccounts }) => {
  const { user } = useAuth();
  const isReadOnly = user?.role !== "admin" && user?.role !== "owner" && user?.azureReadOnly;
  const { filters, setFilter, searchInput, setSearchInput, reset, queryParams, filterOptions } = useAzureOverviewFilters();
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  const subscriptionCount = filterOptions?.subscriptions?.length ?? 0;

  const onDrillFilter = (patch) => {
    Object.entries(patch).forEach(([k, v]) => setFilter(k, v));
  };
  const onOpenAccount = (subscriptionId) => {
    const acc = filterOptions?.subscriptions?.find((s) => s.id === subscriptionId);
    if (acc) onSelectAccount(acc);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 bg-mesh-light dark:bg-mesh-dark transition-colors duration-300 pb-20">
      <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-6 sm:py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AzureIcon className="w-5 h-5" />
              <span className="section-title">Microsoft Azure</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Azure Accounts Overview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Aggregated insights across <span className="font-bold text-gray-700 dark:text-gray-300">{subscriptionCount}</span> Azure subscription{subscriptionCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => setRefreshKey((k) => k + 1)} className="btn-secondary">
              <RefreshCw className="w-4 h-4" /> Refresh Data
            </button>
            {!isReadOnly && (
              <button onClick={onManageAccounts} className="btn-primary">
                <Plus className="w-4 h-4" /> Manage Accounts
              </button>
            )}
          </div>
        </div>

        <AzureOverviewFilters filters={filters} setFilter={setFilter} searchInput={searchInput} setSearchInput={setSearchInput} reset={reset} filterOptions={filterOptions} />

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                activeTab === t.id ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && <OverviewTab key={`ov-${refreshKey}`} queryParams={queryParams} onDrillFilter={onDrillFilter} />}
        {activeTab === "applications" && <ApplicationsTab key={`ap-${refreshKey}`} queryParams={queryParams} onDrillFilter={onDrillFilter} />}
        {activeTab === "services" && <ServicesTab key={`sv-${refreshKey}`} queryParams={queryParams} onDrillFilter={onDrillFilter} />}
        {activeTab === "groups" && <ResourceGroupsTab key={`gr-${refreshKey}`} queryParams={queryParams} onDrillFilter={onDrillFilter} onOpenAccount={onOpenAccount} />}
        {activeTab === "tags" && <TagsTab key={`tg-${refreshKey}`} queryParams={queryParams} setFilter={setFilter} onDrillFilter={onDrillFilter} />}
        {activeTab === "resources" && <ResourcesTab key={`rs-${refreshKey}`} queryParams={queryParams} />}
      </div>
    </div>
  );
};

AzureOverviewPage.propTypes = {
  onSelectAccount: PropTypes.func.isRequired,
  onManageAccounts: PropTypes.func.isRequired,
};
export default AzureOverviewPage;
```

`onDrillFilter` also switches `activeTab` to `"overview"` implicitly by
virtue of most drill actions being clicked from `OverviewTab` itself
(already on that tab); clicking a drill control from `ApplicationsTab`/
`ServicesTab` intentionally stays on the current tab, narrowed by the new
filter, matching a real cost-explorer's behavior of "narrow don't
navigate."

- [ ] **Step 2: Rewrite `AzureOverallDashboard.jsx`**

Replace its entire body with a thin wrapper (this is the one file this
plan *replaces* rather than adds to):

```jsx
import React from "react";
import PropTypes from "prop-types";
import AzureOverviewPage from "../overview/AzureOverviewPage";

/**
 * AzureOverallDashboard — the page AzureRoot renders for `view ===
 * 'dashboard'` (i.e. what a user sees right after connecting an Azure
 * account). Thin wrapper around AzureOverviewPage so AzureRoot's
 * onSelectAccount/onManageAccounts/autoSelect* contract never changes.
 * autoSelectId/autoSelectName (used by the "Connect account" wizard's
 * auto-forward-into-AzureCostPage behavior) are intentionally unused
 * here now that the old per-account table (which drove that
 * auto-select) is gone — the wizard's own navigation still lands users
 * on this page correctly either way.
 */
const AzureOverallDashboard = ({ onSelectAccount, onManageAccounts }) => (
  <AzureOverviewPage onSelectAccount={onSelectAccount} onManageAccounts={onManageAccounts} />
);

AzureOverallDashboard.propTypes = {
  onSelectAccount: PropTypes.func.isRequired,
  onManageAccounts: PropTypes.func.isRequired,
  autoSelectId: PropTypes.string,
  autoSelectName: PropTypes.string,
};

export default AzureOverallDashboard;
```

- [ ] **Step 3: Verify end-to-end**

Run `npm run dev`, log in, navigate to `/azure`. Confirm: header renders
with the right subscription count; the filter bar populates; all 6 tabs
are clickable and each renders non-empty, non-error content; changing
"Date range" to "Last month" changes the KPI numbers; changing Scope ·
Subscription to one account shrinks every tab's totals; clicking a
service in the Overview tab's service-mix list narrows the page (check
the Applications/Services tabs reflect the new `service` filter next);
opening the Resource Groups tab and clicking "Open detailed dashboard →"
navigates to the existing `AzureCostPage` for the right account. Zero
console errors.

- [ ] **Step 4: Commit**

```bash
git add src/azure/overview/AzureOverviewPage.jsx src/azure/pages/AzureOverallDashboard.jsx
git commit -m "feat(azure-overview): wire AzureOverviewPage, replace AzureOverallDashboard body"
```

---

## Task 10: End-to-end Playwright verification + fixups

**Files:**
- No new source files — this task only fixes bugs surfaced by testing.

- [ ] **Step 1: Write and run a Playwright verification script**

In the scratchpad directory, write a script that: logs in, navigates to
`/azure`, and asserts (mirroring this session's established verification
style):
- All 6 tab labels are present and clickable.
- The Overview tab's KPI "Total cost" tile shows a real dollar figure
  (regex `\$[\d,]+\.\d{2}`), not `$0.00`/`NaN`.
- Switching "Date range" to "Last month" changes the displayed Total
  cost value.
- Switching "Scope · Subscription" to one account reduces Total cost
  (multi-account total > single-account total).
- Clicking a resource-group card's "Open detailed dashboard →" link
  navigates into `AzureCostPage` (assert on a heading/element unique to
  that page).
- Zero `console.error`/`pageerror` events across the whole flow.
- The internal-consistency check from the spec: at the default filters,
  the sum of the Services tab's costs equals the KPI row's Total cost
  (within a cent, given `round2` rounding) — fetch both via
  `page.evaluate` calling the app's own `api` module, same approach as
  Task 1's verification script.

- [ ] **Step 2: Fix anything the script surfaces, re-run until clean**

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "test(azure-overview): end-to-end verification pass"
```
