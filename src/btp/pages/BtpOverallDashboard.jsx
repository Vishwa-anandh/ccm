import React, { useContext, useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Activity,
  Plus,
  RefreshCw,
  LayoutGrid,
  ChevronRight,
  Server,
  Globe,
  Layers,
} from "lucide-react";
import { BtpAccountContext } from "../context/BtpAccountContext";
import { getBtpSummary, getBtpTopServices } from "../../api/btpApi";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatters";
import ServiceCategoryCard from "../../components/ServiceCategoryCard";
import AccountsCostTrendChart from "../../components/AccountsCostTrendChart";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const LS_KEY = "ccm_btp_summary";
const CACHE_TTL = 5 * 60 * 1000;
const lsRead = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY));
  } catch {
    return null;
  }
};
const lsWrite = (d) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(d));
  } catch {}
};
const isFresh = (d) => d && Date.now() - d.ts < CACHE_TTL;

const SAP_COLORS = [
  "#0070F2",
  "#5C96EB",
  "#F0AB00",
  "#107E3E",
  "#E9730C",
  "#6A6D70",
];

const BtpIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32zM8 10v4h2v-4H8zm3 0v4h2v-4h-2zm3 0v4h2v-4h-2z" />
  </svg>
);
BtpIcon.propTypes = { className: PropTypes.string };

const KpiCard = ({ title, value, subtitle, icon: Icon, color, loading }) => (
  <div
    className={`rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] px-4 py-3 flex flex-col gap-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-${color}-500/10`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-[#94A3B8] tracking-wider leading-tight">
        {title}
      </span>
      <div className="w-7 h-7 flex items-center justify-center">
        <Icon className={`w-4 h-4 text-${color}-500`} />
      </div>
    </div>
    {loading ? (
      <div className="h-6 w-28 rounded-lg bg-[#F1F5F9] dark:bg-[#1a2744] animate-pulse" />
    ) : (
      <p className="text-xl font-bold text-[#0F172A] dark:text-white leading-tight">
        {value}
      </p>
    )}
    {subtitle && <p className="text-[10px] text-[#94A3B8] leading-tight">{subtitle}</p>}
  </div>
);
KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
  loading: PropTypes.bool,
};

const BtpOverallDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isReadOnly =
    user?.role !== "admin" && user?.role !== "owner" && user?.btpReadOnly;
  const { accounts } = useContext(BtpAccountContext);

  const [totalCost, setTotalCost] = useState(() => lsRead()?.total ?? 0);
  const [accountCosts, setAccountCosts] = useState(() => lsRead()?.costs ?? {});
  const [accountMeta, setAccountMeta] = useState({});   // id → { currency, snapshotTime, region }
  const [topServices, setTopServices] = useState([]);
  const [costLoading, setCostLoading] = useState(() => !lsRead());
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Always fetch top services — not cached in localStorage
  const fetchTopServices = async () => {
    try {
      const svcRes = await getBtpTopServices();
      if (mountedRef.current)
        setTopServices(Array.isArray(svcRes.data) ? svcRes.data : []);
    } catch {
      // fail silently
    }
  };

  const fetchAll = async (force = false) => {
    const cached = lsRead();
    const costsCached = !force && isFresh(cached);

    // Top services are never cached — always fetch them
    fetchTopServices();

    if (costsCached) return;

    cached ? setRefreshing(true) : setCostLoading(true);
    try {
      const sumRes = await getBtpSummary();
      const data = sumRes.data;
      const costs = {};
      const meta = {};
      let total = 0;
      data.accounts?.forEach((a) => {
        costs[a.id] = a.totalCost ?? 0;
        total += a.totalCost ?? 0;
        meta[a.id] = {
          currency: a.currency ?? 'USD',
          snapshotTime: a.snapshotTime ?? null,
          region: a.region ?? null,
        };
      });
      lsWrite({ costs, total, ts: Date.now() });
      if (!mountedRef.current) return;
      setTotalCost(total);
      setAccountCosts(costs);
      setAccountMeta(meta);
    } catch (err) {
      console.error("BTP dashboard load error:", err);
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
      fetchAll();
    }
  }, [accounts]);

  const currency = "USD";
  const pieData = topServices.slice(0, 6).map((s, i) => ({
    name: s.name,
    value: s.cost,
    color: SAP_COLORS[i % SAP_COLORS.length],
  }));

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <BtpIcon className="w-6 h-6 text-[#0070F2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">
              SAP BTP Overview
            </h1>
            <p className="text-xs text-[#94A3B8]">
              {accounts.length} account{accounts.length !== 1 ? "s" : ""}{" "}
              monitored
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAll(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          {!isReadOnly && (
            <Link
              to="/btp/accounts"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#0070F2] border border-[#0070F2] rounded-xl hover:border-[#0057c2] hover:text-[#0057c2] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Account
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          title="Total Month-to-Date Spend"
          value={formatCurrency(totalCost, currency)}
          subtitle="Month-to-date"
          icon={Activity}
          color="blue"
          loading={costLoading}
        />
        <KpiCard
          title="BTP Accounts"
          value={String(accounts.length)}
          subtitle="Active global accounts"
          icon={Globe}
          color="indigo"
        />
        <KpiCard
          title="Top Service"
          value={topServices[0]?.name ?? "—"}
          subtitle={
            topServices[0]
              ? formatCurrency(topServices[0].cost, currency)
              : "No data"
          }
          icon={Server}
          color="amber"
          loading={costLoading}
        />
        <KpiCard
          title="Avg per Account"
          value={
            accounts.length
              ? formatCurrency(totalCost / accounts.length, currency)
              : "—"
          }
          subtitle="Mean account spend"
          icon={LayoutGrid}
          color="emerald"
          loading={costLoading}
        />
        <KpiCard
          title="Total Services"
          value={costLoading ? "—" : String(topServices.length)}
          subtitle={
            topServices.length > 0
              ? `${topServices.length} services tracked`
              : "No service data"
          }
          icon={Layers}
          color="blue"
          loading={costLoading}
        />
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account cards */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#475569] dark:text-[#94A3B8] tracking-wider ">
              BTP Accounts
            </h2>
            <Link
              to="/btp/accounts"
              className="text-xs text-[#2563EB] dark:text-[#3B82F6] hover:underline flex items-center gap-1"
            >
              Manage <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {accounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#1a2744] p-10 text-center">
              <BtpIcon className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#94A3B8]">
                No BTP accounts added yet
              </p>
              {!isReadOnly && (
                <Link
                  to="/btp/accounts"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-[#0070F2] hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add your first account
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((acc) => {
                const cost = accountCosts[acc.id] ?? 0;
                const meta = accountMeta[acc.id] ?? {};
                const region = meta.region ?? acc.region ?? null;
                const currency = meta.currency ?? 'USD';
                const syncedAt = meta.snapshotTime
                  ? new Date(meta.snapshotTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : null;
                const topSvc = topServices[0];
                return (
                  <div
                    key={acc.id}
                    onClick={() => navigate(`/btp/account/${acc.id}`)}
                    className="p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] cursor-pointer hover:border-[#0070F2]/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left — icon + name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                          <BtpIcon className="w-5 h-5 text-[#0070F2]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate" title={acc.name}>{acc.name}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            {region && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-[#E2E8F0] dark:border-[#1a2744] text-[#475569] dark:text-[#94A3B8]">
                                {region}
                              </span>
                            )}
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                              {currency}
                            </span>
                            {syncedAt && (
                              <span className="text-[10px] text-[#94A3B8]">Synced {syncedAt}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Right — cost + chevron */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          {costLoading ? (
                            <div className="h-5 w-20 rounded bg-[#F1F5F9] dark:bg-[#1a2744] animate-pulse" />
                          ) : (
                            <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatCurrency(cost, currency)}</p>
                          )}
                          <p className="text-[10px] text-[#94A3B8]">Month-to-Date Spend</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#CBD5E1] dark:text-[#475569]" />
                      </div>
                    </div>
                    {/* Bottom row — top service pill */}
                    {!costLoading && topSvc && (
                      <div className="mt-3 pt-3 border-t border-[#F1F5F9] dark:border-[#1a2744] flex items-center gap-2">
                        <span className="text-[10px] text-[#94A3B8] font-semibold">Top service:</span>
                        <span className="text-[10px] font-bold text-[#0070F2] dark:text-blue-400 truncate">{topSvc.name}</span>
                        <span className="ml-auto text-[10px] font-semibold text-[#475569] dark:text-[#94A3B8]">{formatCurrency(topSvc.cost, currency)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Service breakdown pie */}
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5">
          <h2 className="text-sm font-bold text-[#475569] dark:text-[#94A3B8] tracking-wider  mb-4">
            Top Services
          </h2>
          {costLoading ? (
            <div className="h-48 rounded-xl bg-[#F1F5F9] dark:bg-[#1a2744] animate-pulse" />
          ) : pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-[#94A3B8] text-sm">
              No data available
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v, "USD")} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pieData.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-[#475569] dark:text-[#94A3B8] truncate max-w-[120px]">
                        {entry.name}
                      </span>
                    </div>
                    <span className="font-semibold text-[#0F172A] dark:text-white">
                      {formatCurrency(entry.value, "USD")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Services Breakdown Table */}
      {!costLoading && topServices.length > 0 && (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 flex items-center justify-center rounded-lg border border-blue-200 dark:border-blue-800">
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
              <h2 className="text-sm font-bold text-[#475569] dark:text-[#94A3B8] tracking-wider">
                Services Breakdown
              </h2>
            </div>
            <span className="text-xs text-[#94A3B8]">{topServices.length} services</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F5F9] dark:border-[#1a2744]">
                  <th className="text-left py-2 px-3 text-[10px] font-bold text-[#94A3B8] tracking-wider w-8">#</th>
                  <th className="text-left py-2 px-3 text-[10px] font-bold text-[#94A3B8] tracking-wider">Service Name</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold text-[#94A3B8] tracking-wider">MTD Cost</th>
                  <th className="text-right py-2 px-3 text-[10px] font-bold text-[#94A3B8] tracking-wider">Share %</th>
                </tr>
              </thead>
              <tbody>
                {topServices.map((svc, i) => {
                  const share = totalCost > 0 ? ((svc.cost / totalCost) * 100).toFixed(1) : "0.0";
                  return (
                    <tr
                      key={svc.name}
                      className="border-b border-[#F8FAFC] dark:border-[#0f1829] hover:bg-[#F8FAFC] dark:hover:bg-[#0f1829] transition-colors"
                    >
                      <td className="py-2.5 px-3 text-xs text-[#94A3B8]">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: SAP_COLORS[i % SAP_COLORS.length] }}
                          />
                          <span className="font-medium text-[#0F172A] dark:text-white truncate max-w-[260px]" title={svc.name}>
                            {svc.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#0F172A] dark:text-white">
                        {formatCurrency(svc.cost, "USD")}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${Math.min(100, Number.parseFloat(share))}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] w-10 text-right">
                            {share}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-account spend trend — one line per BTP subaccount */}
      {accounts.length > 0 && (
        <AccountsCostTrendChart provider="btp" currency="USD" />
      )}

      {/* Service Category Summary */}
      {!costLoading && topServices.length > 0 && (
        <ServiceCategoryCard
          services={topServices}
          provider="btp"
          currency="USD"
        />
      )}
    </div>
  );
};

export default BtpOverallDashboard;
