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
