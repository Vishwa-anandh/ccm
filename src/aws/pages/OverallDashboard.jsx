import React, { useContext, useEffect, useState, useRef } from "react";
import { AccountContext } from "../context/AccountContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Plus,
  RefreshCw,
  LayoutGrid,
  Server,
  ChevronRight,
  TrendingUp,
  CalendarClock,
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatters";
import AccountsCostTrendChart from "../../components/AccountsCostTrendChart";

const LS_KEY = "ccm_aws_summary";
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

const AwsIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Amazon Web Services</title>
    <path
      d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.072.056.144.056.208 0 .096-.056.192-.176.288l-.584.392a.44.44 0 01-.24.08c-.096 0-.192-.048-.288-.136a2.964 2.964 0 01-.344-.448 7.52 7.52 0 01-.296-.576c-.744.88-1.68 1.32-2.808 1.32-.8 0-1.44-.228-1.912-.684-.472-.456-.712-1.064-.712-1.824 0-.808.284-1.464.856-1.96.572-.496 1.332-.744 2.296-.744.32 0 .648.028.992.08.344.052.696.132 1.064.22v-.676c0-.704-.148-1.196-.436-1.484-.296-.288-.8-.428-1.52-.428-.328 0-.664.04-1.008.128a7.39 7.39 0 00-1.008.34 2.672 2.672 0 01-.32.12.548.548 0 01-.144.024c-.128 0-.192-.092-.192-.284v-.448c0-.148.02-.26.068-.324a.717.717 0 01.272-.208 6.64 6.64 0 011.232-.436A5.98 5.98 0 014.5 4.536c1.04 0 1.8.236 2.296.708.488.472.74 1.188.74 2.148v2.644zm-3.876 1.452c.312 0 .632-.056.968-.168.336-.112.636-.316.888-.596.152-.18.264-.38.32-.604.056-.224.088-.492.088-.808v-.388a7.86 7.86 0 00-.86-.16 7.03 7.03 0 00-.876-.056c-.624 0-1.08.124-1.384.38-.304.256-.452.616-.452 1.088 0 .444.112.78.344 1.012.224.228.548.3.964.3zm7.456 1.004c-.164 0-.272-.028-.344-.088-.072-.052-.136-.176-.192-.344L7.648 5.876a1.553 1.553 0 01-.08-.352c0-.14.068-.216.204-.216h.832c.172 0 .284.028.348.088.072.052.128.176.184.344l1.56 6.156 1.448-6.156c.048-.176.104-.292.176-.344.072-.052.192-.088.356-.088h.68c.172 0 .284.028.356.088.072.052.136.176.176.344l1.464 6.228 1.608-6.228c.056-.176.12-.292.184-.344.072-.052.176-.088.344-.088h.792c.136 0 .208.068.208.216 0 .04-.008.08-.016.128-.008.048-.028.112-.064.2l-2.28 6.184c-.056.176-.12.292-.192.344-.072.052-.18.088-.344.088h-.732c-.172 0-.284-.028-.356-.088-.072-.06-.136-.176-.176-.352l-1.44-5.976-1.432 5.968c-.048.176-.104.292-.176.352-.072.06-.192.088-.356.088h-.732zm12.16.26c-.44 0-.88-.052-1.304-.156-.424-.104-.752-.216-.976-.344-.136-.076-.228-.16-.26-.236a.596.596 0 01-.048-.232v-.464c0-.192.072-.288.208-.288.056 0 .112.008.168.024.056.016.14.052.232.088.312.14.652.252 1.016.328.372.076.736.116 1.108.116.588 0 1.044-.104 1.36-.312.316-.208.48-.508.48-.892 0-.264-.084-.484-.252-.664-.168-.18-.488-.34-.952-.492l-1.368-.424c-.692-.216-1.204-.536-1.524-.956-.32-.412-.484-.872-.484-1.368 0-.396.084-.744.252-1.044.168-.3.396-.56.684-.772.288-.22.612-.38.988-.492A4.27 4.27 0 0119.14 4.5c.216 0 .44.012.656.04.224.02.428.056.632.1.196.048.38.1.552.16.172.06.308.12.404.18a.83.83 0 01.288.252.584.584 0 01.088.328v.428c0 .192-.072.296-.208.296a.95.95 0 01-.352-.112 4.236 4.236 0 00-1.776-.372c-.536 0-.956.088-1.248.272-.292.184-.44.46-.44.836 0 .264.092.488.28.672.188.184.536.368 1.036.528l1.34.424c.684.216 1.18.52 1.48.912.3.392.448.84.448 1.336 0 .404-.08.768-.24 1.084a2.46 2.46 0 01-.672.816 2.96 2.96 0 01-1.024.516 4.37 4.37 0 01-1.304.188z"
      fill="#FF9900"
    />
  </svg>
);

/* Inline sparkline SVG */
const Sparkline = ({ data, color = "#f97316", gradId }) => {
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

const OverallDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isReadOnly =
    user?.role !== "admin" && user?.role !== "owner" && user?.awsReadOnly;
  const { accounts } = useContext(AccountContext);

  const [aggregatedCost, setAggregatedCost] = useState(
    () => lsRead()?.total ?? 0,
  );
  const [todaySpend, setTodaySpend] = useState(() => lsRead()?.todaySpend ?? null);
  const [accountCosts, setAccountCosts] = useState(() => lsRead()?.costs ?? {});
  const [accountMeta, setAccountMeta] = useState(() => lsRead()?.meta ?? {});
  const [costLoading, setCostLoading] = useState(() => !lsRead());
  const [refreshing, setRefreshing] = useState(false);
  const [topServices, setTopServices] = useState([]);
  const mountedRef = useRef(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchTopServices = async () => {
    try {
      const svcRes = await api.get("/aws/top-services");
      if (!mountedRef.current) return;
      setTopServices(Array.isArray(svcRes.data) ? svcRes.data : []);
    } catch {
      // silently ignore — section hidden when empty
    }
  };

  const fetchAllCosts = async (force = false) => {
    const cached = lsRead();
    if (!force && isFresh(cached)) {
      if (cached.meta) setAccountMeta(cached.meta);
      fetchTopServices();
      return;
    }
    if (cached) setRefreshing(true);
    else setCostLoading(true);

    try {
      const [res, svcRes] = await Promise.all([
        api.get("/aws/summary"),
        api.get("/aws/top-services").catch(() => ({ data: [] })),
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
      lsWrite({ costs, total, todaySpend: todayTotal, meta, ts: Date.now() });
      if (!mountedRef.current) return;
      setAggregatedCost(total);
      setTodaySpend(todayTotal);
      setAccountCosts(costs);
      setAccountMeta(meta);
      setTopServices(Array.isArray(svcRes.data) ? svcRes.data : []);
    } catch (err) {
      console.error("Error loading AWS dashboard:", err);
    } finally {
      if (mountedRef.current) {
        setCostLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchAllCosts();
    }
  }, []);

  const colors = ["text-orange-500 dark:text-orange-400"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 bg-mesh-light dark:bg-mesh-dark transition-colors duration-300 pb-20">
      <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AwsIcon className="w-5 h-5" />
              <span className="section-title">Amazon Web Services</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              AWS Accounts Overview
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Aggregated insights across{" "}
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {accounts.length}
              </span>{" "}
              AWS environment{accounts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchAllCosts(true)}
              disabled={costLoading || refreshing}
              className="btn-secondary"
            >
              <RefreshCw
                className={`w-4 h-4 ${costLoading || refreshing ? "animate-spin" : ""}`}
              />
              <span>{refreshing ? "Refreshing…" : "Refresh Data"}</span>
            </button>
            {!isReadOnly && (
              <Link
                to="/aws/accounts"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 text-sm font-bold hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-200 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Manage Accounts</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Spend stat row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in">
          {/* Total Spend */}
          <div
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-5 py-3.5 flex items-center gap-3"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="p-2 rounded-xl border border-orange-200 dark:border-orange-800 shrink-0 hidden sm:flex">
              <Activity className="w-4 h-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 mb-0.5">
                Total Spend
                <span className="font-semibold text-gray-300 dark:text-gray-600">
                  {" "}
                  · Month-to-Date
                </span>
              </p>
              {costLoading ? (
                <div className="w-24 h-6 skeleton rounded-lg" />
              ) : (
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums leading-none">
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

          {/* Today's Spend */}
          <div
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-5 py-3.5 flex items-center gap-3"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="p-2 rounded-xl border border-orange-200 dark:border-orange-800 shrink-0 hidden sm:flex">
              <CalendarClock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 mb-0.5">
                Today&apos;s Spend
              </p>
              {costLoading ? (
                <div className="w-20 h-6 skeleton rounded-lg" />
              ) : todaySpend != null ? (
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight tabular-nums leading-none">
                  {formatCurrency(todaySpend)}
                </p>
              ) : (
                <p className="text-sm font-semibold text-gray-400 leading-none">
                  Syncing…
                </p>
              )}
            </div>
          </div>

          {/* Active Accounts */}
          <div
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-5 py-3.5 flex items-center gap-3"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="p-2 rounded-xl border border-orange-200 dark:border-orange-800 shrink-0 hidden sm:flex">
              <Server className="w-4 h-4 text-orange-500" />
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

          {/* Provider */}
          <div
            className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 sm:px-5 py-3.5 flex items-center gap-3"
            style={{
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div className="p-2 rounded-xl border border-orange-200 dark:border-orange-800 shrink-0 hidden sm:flex">
              <AwsIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 mb-0.5">Provider</p>
              <div className="flex items-center gap-2">
                <p className="text-lg sm:text-xl font-bold text-orange-500 leading-none">
                  AWS
                </p>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Environments list — FIRST ── */}
        {accounts.length === 0 ? (
          <div className="py-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <AwsIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No accounts connected
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Connect your first AWS account to start monitoring costs
            </p>
            {!isReadOnly && (
              <Link
                to="/aws/accounts"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 text-sm font-bold hover:border-orange-500 transition-all duration-200 active:scale-95 mt-5 mx-auto"
              >
                <Plus className="w-4 h-4" /> Connect Account
              </Link>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Environments
                </h2>
                <span className="px-2 py-0.5 rounded-full text-orange-600 dark:text-orange-400 text-xs font-bold">
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
                        Account ID
                      </th>
                      <th className="text-left px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-5 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                        Region
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
                      const isReady = !costLoading && cost !== undefined;
                      const meta = accountMeta[acc.id];
                      const sparkline = meta?.sparkline ?? [];
                      const budget = meta?.budgetStatus ?? null;
                      const pct = budget?.pct ?? null;
                      const initials = (acc.name || "AW")
                        .slice(0, 2)
                        .toUpperCase();
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
                          onClick={() => navigate(`/aws/account/${acc.id}`)}
                          className="hover:bg-orange-50/60 dark:hover:bg-orange-900/10 transition-colors cursor-pointer"
                        >
                          {/* Account ID */}
                          <td className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg border border-orange-300 dark:border-orange-700 flex items-center justify-center text-[10px] font-bold text-orange-600 dark:text-orange-400 shrink-0">
                                {initials}
                              </div>
                              <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                ···· {acc.id?.slice(-4)}
                              </span>
                            </div>
                          </td>
                          {/* Name */}
                          <td className="px-5 py-2.5">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {acc.name}
                            </span>
                          </td>
                          {/* Region */}
                          <td className="px-5 py-2.5">
                            <span className="text-gray-500 dark:text-gray-400">
                              {acc.region || "us-east-1"}
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
                                      id={`spark-grad-${acc.id}`}
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#f97316"
                                        stopOpacity="0.35"
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#f97316"
                                        stopOpacity="0"
                                      />
                                    </linearGradient>
                                  </defs>
                                  <polygon
                                    points={`${svgPoints} ${pts <= 1 ? 36 : 72},22 0,22`}
                                    fill={`url(#spark-grad-${acc.id})`}
                                  />
                                  <polyline
                                    points={svgPoints}
                                    fill="none"
                                    stroke="#f97316"
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
                                  {pct != null ? `${pct}% used` : budget.name}
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
                            <Link
                              to={`/aws/account/${acc.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 text-xs font-bold hover:border-orange-400 dark:hover:border-orange-500 transition-colors"
                            >
                              View <ChevronRight className="w-3 h-3" />
                            </Link>
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
          {/* Per-account spend trend — one line per account */}
          {accounts.length > 0 && (
            <AccountsCostTrendChart provider="aws" currency="USD" />
          )}

          {/* Top Services — aggregated across all accounts */}
          {(topServices.length > 0 || costLoading) && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Top Services
                </h3>
                <span className="text-[11px] text-gray-400 font-medium ml-1">
                  — all accounts
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {costLoading
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
                  : topServices.map((svc) => {
                      const shortName = svc.name
                        .replace(/^Amazon\s+|^AWS\s+/i, "")
                        .slice(0, 12);
                      return (
                        <div
                          key={svc.name}
                          className="rounded-xl p-3 border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-sm transition-all duration-200 flex flex-col gap-1.5"
                        >
                          <div className="w-7 h-7 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center justify-center text-[10px] font-bold text-orange-500 dark:text-orange-400">
                            {shortName.slice(0, 2)}
                          </div>
                          <div>
                            <p
                              className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-2"
                              title={svc.name}
                            >
                              {shortName}
                            </p>
                            <p className="text-[11px] font-semibold text-orange-500 mt-0.5">
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

export default OverallDashboard;
