import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Server,
  RefreshCw,
  Settings,
  ArrowRight,
  Zap,
} from "lucide-react";
import PropTypes from "prop-types";
import { getGcpSummary, getGcpTopServices } from "../../api/gcpApi";
import { GcpAccountContext } from "../context/GcpAccountContext";
import { formatCurrency } from "../../utils/formatters";
import AccountsCostTrendChart from "../../components/AccountsCostTrendChart";

const GCP_PRIMARY = "#3b82f6";
const GCP_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#f97316",
  "#ec4899",
];

const CACHE_KEY = "ccm_gcp_summary";
const CACHE_TTL = 5 * 60 * 1000;

function readCache() {
  try {
    const d = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (d && Date.now() - d.ts < CACHE_TTL) return d;
  } catch {}
  return null;
}

function GcpIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        fill="#3b82f6"
        opacity="0.15"
      />
      <path
        d="M17.6 11.8c0-.1 0-.2-.1-.3l-2.1-3.6c-.1-.2-.3-.3-.5-.3H9.1c-.2 0-.4.1-.5.3L6.5 11.5c-.1.1-.1.2-.1.3s0 .2.1.3l2.1 3.6c.1.2.3.3.5.3h5.8c.2 0 .4-.1.5-.3l2.1-3.6c.1-.1.1-.2.1-.3z"
        fill="#3b82f6"
      />
      <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
  );
}
GcpIcon.propTypes = { size: PropTypes.number };

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <div className="text-[#94A3B8] mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="font-bold text-[#0F172A] dark:text-white">
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
CurrencyTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-3 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border"
          style={{ borderColor: `${color}60` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider ">
          {label}
        </p>
      </div>
      <p className="text-lg sm:text-2xl font-bold text-[#0F172A] dark:text-white">
        {value}
      </p>
      {sub && <p className="text-xs text-[#94A3B8] mt-1">{sub}</p>}
    </div>
  );
}
KpiCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  sub: PropTypes.string,
  icon: PropTypes.elementType,
  color: PropTypes.string,
};

function Sk({ w = "w-full", h = "h-4" }) {
  return <div className={`skeleton rounded-lg ${w} ${h}`} />;
}
Sk.propTypes = { w: PropTypes.string, h: PropTypes.string };

const GcpOverallDashboard = () => {
  const navigate = useNavigate();
  const { accounts } = useContext(GcpAccountContext);
  const [summary, setSummary] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setSummary({ totalCost: cached.total, accounts: cached.accounts ?? [] });
      setTopServices(cached.topServices ?? []);
      setLoading(false);
      return;
    }
    Promise.all([getGcpSummary(), getGcpTopServices()])
      .then(([sumRes, svcRes]) => {
        setSummary(sumRes.data);
        setTopServices(svcRes.data ?? []);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            total: sumRes.data.totalCost,
            accounts: sumRes.data.accounts,
            topServices: svcRes.data ?? [],
            ts: Date.now(),
          }),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalCost = summary?.totalCost ?? 0;
  const accountList = summary?.accounts ?? [];
  const topSvc = topServices[0]?.name ?? "—";

  const spendData = accountList.map((a) => ({
    name: a.name?.slice(0, 12),
    cost: a.totalCost ?? 0,
  }));

  const pieData = topServices.slice(0, 6).map((s, i) => ({
    name: s.name,
    value: s.cost,
    color: GCP_COLORS[i % GCP_COLORS.length],
  }));

  const topServiceTotal = pieData.reduce((s, d) => s + d.value, 0);

  if (accounts.length === 0 && !loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/40">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4z"
                    fill="#3b82f6"
                    opacity="0.12"
                  />
                  <path
                    d="M35.2 23.6c0-.2 0-.4-.2-.6l-4.2-7.2c-.2-.4-.6-.6-1-.6H18.2c-.4 0-.8.2-1 .6L13 23c-.2.2-.2.4-.2.6s0 .4.2.6l4.2 7.2c.2.4.6.6 1 .6h11.6c.4 0 .8-.2 1-.6l4.2-7.2c.2-.2.2-.4.2-.6z"
                    fill="#3b82f6"
                    opacity="0.8"
                  />
                  <circle cx="24" cy="24" r="4" fill="white" />
                  <circle cx="24" cy="24" r="2" fill="#3b82f6" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 border-2 border-blue-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-blue-500 text-[10px] font-bold">+</span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white mb-2">
              No GCP projects connected
            </h2>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              Connect a Google Cloud project using a service account to start
              monitoring your GCP costs, services, and forecasts in real time.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Cost Trends",
              "Service Breakdown",
              "Forecasting",
              "Multi-Project",
            ].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40"
              >
                {f}
              </span>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate("/gcp/accounts")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-blue-600 dark:text-blue-400 border border-blue-400 dark:border-blue-600 hover:border-blue-600 dark:hover:border-blue-400 transition-all hover:-translate-y-0.5"
          >
            <Settings className="w-4 h-4" />
            Connect GCP Project
          </button>

          <p className="text-xs text-[#94A3B8]">
            Requires a service account with{" "}
            <strong className="text-[#64748B] dark:text-[#94A3B8]">
              Billing Account Viewer
            </strong>{" "}
            role
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 lg:p-6 xl:p-8 space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
            <GcpIcon size={22} />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-[#0F172A] dark:text-white">
              GCP Overview
            </h1>
            <p className="text-xs text-[#94A3B8]">
              {accountList.length} project{accountList.length !== 1 ? "s" : ""}{" "}
              connected
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/gcp/accounts")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#475569] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#1a2744] transition-colors"
        >
          <Settings className="w-4 h-4" /> Manage
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-3 sm:p-5 space-y-3"
            >
              <Sk h="h-5" w="w-1/2" />
              <Sk h="h-8" />
            </div>
          ))
        ) : (
          <>
            <KpiCard
              label="Total Spend (MTD)"
              value={formatCurrency(totalCost)}
              icon={TrendingUp}
              color={GCP_PRIMARY}
            />
            <KpiCard
              label="Projects"
              value={String(accountList.length)}
              sub="connected"
              icon={Server}
              color="#6366f1"
            />
            <KpiCard
              label="Top Service"
              value={topSvc}
              icon={Zap}
              color="#8b5cf6"
            />
            <KpiCard
              label="Top Service Cost"
              value={topServices[0] ? formatCurrency(topServices[0].cost) : "—"}
              icon={RefreshCw}
              color="#06b6d4"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="lg:col-span-3 rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-3 sm:p-5">
          <h2 className="text-xs font-bold text-[#94A3B8] tracking-wider  mb-4">
            Spend by Project
          </h2>
          {loading ? (
            <Sk h="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart
                data={spendData}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gcpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={GCP_PRIMARY}
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor={GCP_PRIMARY}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cost"
                  stroke={GCP_PRIMARY}
                  strokeWidth={2}
                  fill="url(#gcpGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-3 sm:p-5">
          <h2 className="text-xs font-bold text-[#94A3B8] tracking-wider  mb-4">
            Top Services
          </h2>
          {loading ? (
            <Sk h="h-48" />
          ) : pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {pieData.slice(0, 4).map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: d.color }}
                      />
                      <span className="text-[#475569] dark:text-[#94A3B8] truncate max-w-[120px]">
                        {d.name}
                      </span>
                    </div>
                    <span className="font-semibold text-[#0F172A] dark:text-white">
                      {topServiceTotal > 0
                        ? `${Math.round((d.value / topServiceTotal) * 100)}%`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <div className="w-10 h-10 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xs text-[#94A3B8] text-center">
                Sync an account to see service data
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Account list */}
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
        <div className="px-3 py-2.5 sm:px-5 sm:py-4 border-b border-[#E2E8F0] dark:border-[#1a2744] flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#94A3B8] tracking-wider ">
            Projects
          </h2>
          <span className="text-xs text-[#94A3B8]">
            {accountList.length} total
          </span>
        </div>
        {loading ? (
          <div className="p-3 sm:p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Sk key={i} h="h-12" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#1a2744]">
            {accountList.map((acc) => (
              <button
                key={acc.id}
                onClick={() => navigate(`/gcp/account/${acc.id}`)}
                className="w-full flex items-center justify-between px-3 py-2.5 sm:px-5 sm:py-4 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
                    <GcpIcon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                      {acc.name}
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      {acc.snapshotTime
                        ? `Synced ${new Date(acc.snapshotTime).toLocaleString()}`
                        : "Not synced yet"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#0F172A] dark:text-white">
                      {formatCurrency(acc.totalCost ?? 0)}
                    </span>
                    <p className="text-[10px] text-[#94A3B8]">MTD</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Per-account spend trend — one line per GCP project */}
      {accountList.length > 0 && (
        <AccountsCostTrendChart provider="gcp" currency="USD" />
      )}
    </div>
  );
};

export default GcpOverallDashboard;
