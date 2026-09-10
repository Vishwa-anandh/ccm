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
