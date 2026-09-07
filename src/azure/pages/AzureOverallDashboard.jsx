import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  Activity,
  Plus,
  RefreshCw,
  LayoutGrid,
  Server,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatters";
import AccountsCostTrendChart from "../../components/AccountsCostTrendChart";
import MarqueeTitle from "../../components/MarqueeTitle";

const LS_KEY = "ccm_azure_summary";
const CACHE_TTL = 60 * 1000; // 1 min — kept short since Today's Spend changes intraday

function lsRead() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY));
  } catch {
    return null;
  }
}
function lsWrite(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}
const isFresh = (d) => d && Date.now() - d.ts < CACHE_TTL;

const AzureIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.90011 21L13.7001 21L19.4001 6.79999L12.1001 6.79999L5.90011 21Z"
      fill="#0078D4"
    />
    <path
      d="M12.4001 21L12.4001 20.6L12.1001 21L12.4001 21ZM5.90011 21L0.100098 6.79999L6.8001 6.79999L9.9001 14.2L5.90011 21Z"
      fill="#0078D4"
    />
    <path
      d="M12.3001 20.6L19.5001 3.5L12.6001 3.5L9.9001 10L12.3001 20.6Z"
      fill="#5EA0EF"
    />
  </svg>
);

/* Inline sparkline SVG */
const Sparkline = ({ data, color = "#3b82f6", gradId }) => {
  if (!data || data.length < 2)
    return <span className="text-xs text-gray-400">—</span>;
  const maxV = Math.max(...data, 0.01);
  const pts = data.length;
  const points = data
    .map(
      (v, i) =>
        `${Math.round((i / (pts - 1)) * 80)},${Math.round(22 - (v / maxV) * 20)}`,
    )
    .join(" ");
  const areaPoints = `${points} 80,24 0,24`;
  return (
    <svg
      width="80"
      height="24"
      viewBox="0 0 80 24"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const AzureOverallDashboard = ({
  onSelectAccount,
  onManageAccounts,
  autoSelectId,
  autoSelectName,
}) => {
  const { user } = useAuth();
  const isReadOnly =
    user?.role !== "admin" && user?.role !== "owner" && user?.azureReadOnly;

  const [accounts, setAccounts] = useState(() => lsRead()?.accounts ?? []);
  const [aggregatedCost, setAggregatedCost] = useState(
    () => lsRead()?.total ?? 0,
  );
  const [todaySpend, setTodaySpend] = useState(() => lsRead()?.todaySpend ?? null);
  const [accountCosts, setAccountCosts] = useState(() => lsRead()?.costs ?? {});
  const [accountMeta, setAccountMeta] = useState({}); // { [id]: { sparkline, budgetStatus } }
  const [loading, setLoading] = useState(() => !lsRead());
  const [refreshing, setRefreshing] = useState(false);
  const [topServices, setTopServices] = useState([]);
  const mountedRef = useRef(true);
  const autoSelectedRef = useRef(false);

  const fetchTopServices = async () => {
    try {
      const res = await api.get("/azure/top-services");
      if (!mountedRef.current) return;
      setTopServices(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silently ignore
    }
  };

  const fetchAccountsAndCosts = async (force = false) => {
    const cached = lsRead();
    if (!force && isFresh(cached)) {
      fetchTopServices();
      return;
    }
    if (cached) setRefreshing(true);
    else setLoading(true);

    try {
      const [res, svcRes] = await Promise.all([
        api.get("/azure/summary"),
        api.get("/azure/top-services").catch(() => ({ data: [] })),
      ]);
      const data = res.data;

      const costs = {};
      const meta = {};
      let total = 0;
      let todayTotal = null;
      data.forEach((acc) => {
        costs[acc.id] = acc.totalCost ?? 0;
        total += acc.totalCost ?? 0;
        if (acc.todayCost != null) {
          todayTotal = (todayTotal ?? 0) + acc.todayCost;
        }
        meta[acc.id] = {
          sparkline: acc.sparkline ?? [],
          budgetStatus: acc.budgetStatus ?? null,
        };
      });
      const shaped = data.map((a) => ({
        id: a.id,
        name: a.name,
        subscriptionId: a.subscriptionId,
      }));

      lsWrite({ accounts: shaped, costs, total, todaySpend: todayTotal, ts: Date.now() });
      if (!mountedRef.current) return;
      setAccounts(shaped);
      setAggregatedCost(total);
      setTodaySpend(todayTotal);
      setAccountCosts(costs);
      setAccountMeta(meta);
      setTopServices(Array.isArray(svcRes.data) ? svcRes.data : []);

      // Auto-navigate when arriving from the "Connect account" wizard
      if (autoSelectId && !autoSelectedRef.current) {
        const match =
          shaped.find((a) => a.id === autoSelectId) ??
          (autoSelectName ? { id: autoSelectId, name: autoSelectName } : null);
        if (match) {
          autoSelectedRef.current = true;
          onSelectAccount(match);
        }
      }
    } catch (err) {
      console.error("Error loading Azure dashboard:", err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchAccountsAndCosts();
    return () => {
      mountedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 bg-mesh-light dark:bg-mesh-dark transition-colors duration-300 pb-20">
      <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AzureIcon className="w-5 h-5" />
              <span className="section-title">Microsoft Azure</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Azure Accounts Overview
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Aggregated insights across{" "}
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {accounts.length}
              </span>{" "}
              Azure subscription{accounts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchAccountsAndCosts(true)}
              disabled={loading || refreshing}
              className="btn-secondary"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading || refreshing ? "animate-spin" : ""}`}
              />
              <span>{refreshing ? "Refreshing…" : "Refresh Data"}</span>
            </button>
            {!isReadOnly && (
              <button
                onClick={onManageAccounts}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 text-sm font-bold hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Manage Accounts</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Spend stat row — 4 columns ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in">
          {/* Col 1 — Month-to-Date Spend */}
          <div
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-5 py-3.5 flex items-center gap-3"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="p-2 rounded-xl border border-blue-200 dark:border-blue-800 shrink-0 hidden sm:flex">
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex mb-0.5">
                <MarqueeTitle
                  text="Total Spend · Month-to-Date"
                  className="text-xs font-bold text-gray-400"
                />
              </div>
              {loading ? (
                <div className="w-28 h-6 skeleton rounded-lg" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                  {formatCurrency(aggregatedCost)}
                </p>
              )}
              <p className="mt-1 text-[11px] text-gray-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Real-time from {accounts.length} source
                {accounts.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {/* Col 2 — Today's Spend */}
          <div
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-5 py-3.5 flex items-center gap-3"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="p-2 rounded-xl border border-blue-200 dark:border-blue-800 shrink-0 hidden sm:flex">
              <CalendarClock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 mb-0.5">
                Today&apos;s Spend
              </p>
              {loading ? (
                <div className="w-20 h-6 skeleton rounded-lg" />
              ) : todaySpend != null ? (
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums leading-none whitespace-nowrap overflow-hidden text-ellipsis">
                  {formatCurrency(todaySpend)}
                </p>
              ) : (
                <p className="text-sm font-semibold text-gray-400 leading-none">
                  Syncing…
                </p>
              )}
            </div>
          </div>

          {/* Col 3 — Active Subscriptions */}
          <div
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-5 py-3.5 flex items-center gap-3"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="p-2 rounded-xl border border-blue-200 dark:border-blue-800 shrink-0 hidden sm:flex">
              <Server className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 mb-0.5">
                Active Accounts
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-none">
                {accounts.length}
              </p>
            </div>
          </div>

          {/* Col 4 — Provider */}
          <div
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-5 py-3.5 flex items-center gap-3"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="p-2 rounded-xl border border-blue-200 dark:border-blue-800 shrink-0 hidden sm:flex">
              <AzureIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 mb-0.5">Provider</p>
              <div className="flex items-center gap-2">
                <p className="text-lg sm:text-xl font-bold text-blue-500 leading-none">
                  Azure
                </p>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Environments list ── */}
        {accounts.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <AzureIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No accounts connected
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Connect your first Azure subscription to start monitoring costs
            </p>
            {isReadOnly ? null : (
              <button
                onClick={onManageAccounts}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 text-sm font-bold hover:border-blue-500 transition-all duration-200 active:scale-95 mt-5 mx-auto"
              >
                <Plus className="w-4 h-4" /> Connect Account
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Environments
                </h2>
                <span className="px-2 py-0.5 rounded-full text-blue-600 dark:text-blue-400 text-xs font-bold">
                  {accounts.length}
                </span>
              </div>
              {accounts.length > 5 && (
                <span className="text-xs text-gray-400">Scroll to see all</span>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div
                className="overflow-y-auto"
                style={{ maxHeight: accounts.length > 5 ? "360px" : undefined }}
              >
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                      <th className="text-left px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                        Subscription
                      </th>
                      <th className="text-left px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                        Current Spend
                      </th>
                      <th className="text-left px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                        Budget Status
                      </th>
                      <th className="text-left px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                        Tag Coverage
                      </th>
                      <th className="text-left px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {accounts.map((acc) => {
                      const cost = accountCosts[acc.id];
                      const isReady = !loading && cost !== undefined;
                      const initials = (acc.name || "AZ")
                        .slice(0, 2)
                        .toUpperCase();
                      const meta = accountMeta[acc.id];
                      const sparkline = meta?.sparkline ?? [];
                      const budget = meta?.budgetStatus ?? null;
                      const pct = budget?.pct ?? null;
                      let pctColor = "";
                      if (pct !== null) {
                        if (pct >= 90)
                          pctColor =
                            "text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700";
                        else if (pct >= 70)
                          pctColor =
                            "text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700";
                        else
                          pctColor =
                            "text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700";
                      }
                      const pts = sparkline.length;
                      const maxV = Math.max(...sparkline, 0.01);
                      const svgPoints = sparkline
                        .map(
                          (v, i) =>
                            `${pts <= 1 ? 36 : Math.round((i / (pts - 1)) * 72)},${Math.round(20 - (v / maxV) * 18)}`,
                        )
                        .join(" ");

                      return (
                        <tr
                          key={acc.id}
                          onClick={() => onSelectAccount(acc)}
                          className="hover:bg-blue-50/60 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                        >
                          {/* Subscription ID */}
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg border border-blue-300 dark:border-blue-700 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                {initials}
                              </div>
                              <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                ···· {acc.subscriptionId?.slice(-4)}
                              </span>
                            </div>
                          </td>
                          {/* Name */}
                          <td className="px-5 py-2.5">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {acc.name}
                            </span>
                          </td>
                          {/* Current Spend */}
                          <td className="px-5 py-2.5">
                            {isReady ? (
                              <span className="font-bold text-gray-900 dark:text-white">
                                {formatCurrency(cost)}
                              </span>
                            ) : (
                              <div className="skeleton w-20 h-4 rounded" />
                            )}
                          </td>
                          {/* Budget Status */}
                          <td className="px-5 py-2.5">
                            <div className="flex flex-col gap-1.5 min-w-[90px]">
                              {pts >= 2 ? (
                                <svg
                                  width="72"
                                  height="22"
                                  viewBox="0 0 72 22"
                                  className="overflow-visible"
                                >
                                  <defs>
                                    <linearGradient
                                      id={`az-spark-grad-${acc.id}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#3b82f6"
                                        stopOpacity="0.35"
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#3b82f6"
                                        stopOpacity="0"
                                      />
                                    </linearGradient>
                                  </defs>
                                  <polygon
                                    points={`${svgPoints} ${pts <= 1 ? 36 : 72},22 0,22`}
                                    fill={`url(#az-spark-grad-${acc.id})`}
                                  />
                                  <polyline
                                    points={svgPoints}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No data
                                </span>
                              )}
                              {budget ? (
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${pctColor}`}
                                >
                                  {pct === null ? budget.name : `${pct}% used`}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400">
                                  No budget
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Tag Coverage */}
                          <td className="px-5 py-2.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
                              N/A
                            </span>
                          </td>
                          {/* Status */}
                          <td className="px-5 py-2.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              Active
                            </span>
                          </td>
                          {/* Action */}
                          <td className="px-5 py-2.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectAccount(acc);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 text-xs font-bold hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                            >
                              View <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Trend + Top Services share one row to save vertical space ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Per-account spend trend — one line per subscription */}
          {!loading && accounts.length > 0 && (
            <AccountsCostTrendChart provider="azure" currency="USD" />
          )}

          {/* Top Services — aggregated across all subscriptions */}
          {(topServices.length > 0 || loading) && (
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800"
              style={{
                boxShadow:
                  "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Top Services
                </h3>
                <span className="text-[11px] text-gray-400 font-medium ml-1">
                  — all subscriptions
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3 border border-gray-100 dark:border-gray-800 space-y-2"
                      >
                        <div className="skeleton w-7 h-7 rounded-lg" />
                        <div className="skeleton w-full h-3 rounded" />
                        <div className="skeleton w-2/3 h-3 rounded" />
                      </div>
                    ))
                  : topServices.map((svc, i) => {
                      const shortName = svc.name
                        .replace(/^Microsoft\./i, "")
                        .slice(0, 12);
                      const colorList = [
                        "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                        "text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
                        "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
                        "text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
                        "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
                        "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
                      ];
                      return (
                        <div
                          key={svc.name}
                          className="rounded-xl p-3 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all duration-200 flex flex-col gap-1.5"
                        >
                          <div
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold ${colorList[i % colorList.length]}`}
                          >
                            {shortName.slice(0, 2)}
                          </div>
                          <div>
                            <p
                              className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-2"
                              title={svc.name}
                            >
                              {shortName}
                            </p>
                            <p className="text-[11px] font-semibold text-blue-500 mt-0.5">
                              {formatCurrency(svc.value)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AzureOverallDashboard.propTypes = {
  onSelectAccount: PropTypes.func.isRequired,
  onManageAccounts: PropTypes.func.isRequired,
  autoSelectId: PropTypes.string,
  autoSelectName: PropTypes.string,
};

export default AzureOverallDashboard;
