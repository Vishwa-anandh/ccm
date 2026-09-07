import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import api from "../api";
import { formatCurrency } from "../utils/formatters";

// Locked to each provider's own hue family — never borrow another provider's color.
// Multiple accounts within one provider are told apart by shade, not by hue.
const THEME = {
  azure: {
    accentText: "text-blue-500",
    shades: ["#1D4ED8", "#3B82F6", "#60A5FA", "#0EA5E9", "#1E40AF", "#38BDF8", "#93C5FD", "#0369A1"],
  },
  aws: {
    accentText: "text-orange-500",
    shades: ["#C2410C", "#F97316", "#FB923C", "#9A3412", "#EA580C", "#FDBA74", "#B45309", "#D97706"],
  },
  btp: {
    accentText: "text-emerald-500",
    shades: ["#047857", "#10B981", "#34D399", "#059669", "#065F46", "#6EE7B7", "#0D9488", "#14B8A6"],
  },
  gcp: {
    accentText: "text-blue-600",
    shades: ["#1A73E8", "#4285F4", "#669DF6", "#174EA6", "#8AB4F8", "#1967D2", "#0B5FCC", "#AECBFA"],
  },
};

const formatDateLabel = (date) => {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Multi-line (gradient-filled) daily spend trend, one line per account in the org —
// lets a client with several Azure/AWS accounts see at a glance which account is
// driving cost up or down, without leaving the Accounts Overview page.
const AccountsCostTrendChart = ({ provider, currency }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(`/${provider}/accounts-trend`, { params: { days: 30 } })
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load trend");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider]);

  const accounts = useMemo(
    () => (data?.accounts ?? []).filter((a) => a.dailyCosts?.length > 0),
    [data],
  );
  const theme = THEME[provider] ?? THEME.azure;

  const chartData = useMemo(() => {
    const dateSet = new Set();
    accounts.forEach((a) => a.dailyCosts.forEach((d) => dateSet.add(d.date)));
    const dates = Array.from(dateSet).sort();
    return dates.map((date) => {
      const row = { date, label: formatDateLabel(date) };
      accounts.forEach((a) => {
        const found = a.dailyCosts.find((d) => d.date === date);
        row[`acc_${a.accountId}`] = found ? found.cost : null;
      });
      return row;
    });
  }, [accounts]);

  const ranked = useMemo(() => {
    return accounts
      .map((a) => {
        const total = a.dailyCosts.reduce((s, d) => s + d.cost, 0);
        const avg = a.dailyCosts.length > 0 ? total / a.dailyCosts.length : 0;
        return { ...a, avg };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [accounts]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 h-48 flex items-center justify-center">
        <span className="text-xs text-gray-400">Loading account trend…</span>
      </div>
    );
  }

  // Nothing to plot at all — skip rendering rather than show an empty chart.
  if (error || accounts.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className={`w-4 h-4 ${theme.accentText}`} />
            Account Spend Trend
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Last 30 days, by account</p>
        </div>
        {ranked.length > 1 && (
          <div className="flex flex-col items-end gap-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: theme.shades[0] }} />
              Highest: <strong className="text-gray-900 dark:text-white">{ranked[0].name}</strong>{" "}
              ({formatCurrency(ranked[0].avg, currency)}/day)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: theme.shades[1] ?? theme.shades[0] }} />
              Lowest: <strong className="text-gray-900 dark:text-white">{ranked[ranked.length - 1].name}</strong>{" "}
              ({formatCurrency(ranked[ranked.length - 1].avg, currency)}/day)
            </span>
          </div>
        )}
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {accounts.map((a, i) => (
                <linearGradient
                  key={a.accountId}
                  id={`acctGrad-${provider}-${a.accountId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={theme.shades[i % theme.shades.length]} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={theme.shades[i % theme.shades.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94A3B8" }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, "")}
            />
            <RechartsTooltip
              cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] shadow-lg px-3 py-2 text-xs min-w-[160px]">
                    <p className="font-bold text-[#0F172A] dark:text-white mb-1.5 pb-1.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                      {label}
                    </p>
                    {payload
                      .filter((p) => p.value != null)
                      .map((p) => {
                        const acc = accounts.find((a) => `acc_${a.accountId}` === p.dataKey);
                        return (
                          <div key={p.dataKey} className="flex items-center justify-between gap-3 py-0.5">
                            <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8] truncate">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                              {acc?.name ?? p.dataKey}
                            </span>
                            <span className="font-bold tabular-nums" style={{ color: p.color }}>
                              {formatCurrency(p.value, currency)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                );
              }}
            />
            {accounts.map((a, i) => (
              <Area
                key={a.accountId}
                type="monotone"
                dataKey={`acc_${a.accountId}`}
                name={`acc_${a.accountId}`}
                stroke={theme.shades[i % theme.shades.length]}
                strokeWidth={2}
                fill={`url(#acctGrad-${provider}-${a.accountId})`}
                dot={false}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {accounts.map((a, i) => (
          <span
            key={a.accountId}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400"
          >
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ background: theme.shades[i % theme.shades.length] }}
            />
            {a.name}
          </span>
        ))}
      </div>
    </div>
  );
};

AccountsCostTrendChart.propTypes = {
  provider: PropTypes.oneOf(["azure", "aws", "btp", "gcp"]).isRequired,
  currency: PropTypes.string,
};

AccountsCostTrendChart.defaultProps = {
  currency: "USD",
};

export default AccountsCostTrendChart;
