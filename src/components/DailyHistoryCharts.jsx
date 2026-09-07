import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Layers, CalendarRange } from "lucide-react";
import api from "../api";
import { formatCurrency } from "../utils/formatters";

const PROVIDER_ACCENT = {
  azure: {
    icon: "text-blue-500",
    stroke: "#3b82f6",
    gradientFrom: "#3b82f6",
    gradientTo: "#3b82f6",
  },
  aws: {
    icon: "text-orange-500",
    stroke: "#f97316",
    gradientFrom: "#f97316",
    gradientTo: "#f97316",
  },
};

// Distinct stacked-bar palette per provider accent — brightest = top service, fading to "Other"
const STACK_PALETTES = {
  azure: ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#e0e7ff"],
  aws: ["#c2410c", "#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"],
};

const RANGE_OPTIONS = [7, 14, 30];

const formatDateLabel = (date) => {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// AWS uses x-account-id header; Azure uses accountId query param
const getApiConfig = (provider, accountId, params = {}) => {
  if (provider === "aws") {
    return { headers: { "x-account-id": accountId }, params };
  }
  return { params: { accountId, ...params } };
};

// Past-N-days history near the day-comparison card: an area trend chart of daily
// totals, plus a stacked bar chart showing which services made up each day's cost.
// Builds the same {date, accumulated, forecastAccumulated} shape the backend
// returns, from a raw {cost, date, status} daily series that's already been
// fetched elsewhere on the page (e.g. Azure's MonthToDate forecast query) —
// avoids a second live call to an already-throttled provider API.
const buildCumulativeSeries = (rawDays) => {
  // Azure's live forecast API can return two rows for "today" — an "Actual" row for
  // the partial day so far, and a "Forecast" row projecting the rest of the day.
  // Merge same-date rows into one before building the cumulative series, otherwise
  // today ends up rendered as two separate day-slots on the chart.
  const byDate = new Map();
  for (const r of rawDays) {
    const cost = Number(r.cost) || 0;
    const existing = byDate.get(r.date);
    if (existing) {
      existing.cost += cost;
      if (r.status !== "Forecast") existing.status = r.status;
    } else {
      byDate.set(r.date, { date: r.date, cost, status: r.status });
    }
  }
  const rows = Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  let cumulative = 0;
  const cumByIndex = rows.map((r) => (cumulative += Number(r.cost) || 0));
  const lastActualIdx = rows.reduce(
    (last, r, i) => (r.status !== "Forecast" ? i : last),
    -1,
  );
  return rows.map((r, i) => ({
    date: r.date,
    accumulated: i <= lastActualIdx ? cumByIndex[i] : null,
    forecastAccumulated: i >= lastActualIdx ? cumByIndex[i] : null,
  }));
};

const DailyHistoryCharts = ({ provider, accountId, currency, rawForecastSeries }) => {
  const [days, setDays] = useState(7);

  // "Daily Total" area: reads the DB-backed /daily endpoint (already-stored
  // MonthlyCostHistory.daily_costs) — zero extra provider API calls, so it
  // renders instantly and never risks a 429.
  const [totals, setTotals] = useState(null);
  const [totalsLoading, setTotalsLoading] = useState(true);
  const [totalsError, setTotalsError] = useState(null);

  // "By Service" stacked bar: needs a live per-day×service breakdown that
  // isn't persisted anywhere, so this one call still hits the provider API
  // (cached server-side for 30-60 min to stay well under rate limits).
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [forecastSeries, setForecastSeries] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    setTotalsLoading(true);
    setTotalsError(null);
    api
      .get(`/${provider}/daily`, getApiConfig(provider, accountId, { days }))
      .then((res) => {
        if (!cancelled) setTotals(res.data);
      })
      .catch((err) => {
        if (!cancelled)
          setTotalsError(err.response?.data?.error || "Failed to load history");
      })
      .finally(() => {
        if (!cancelled) setTotalsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, accountId, days]);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(`/${provider}/daily-breakdown`, getApiConfig(provider, accountId, { days }))
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.error || "Failed to load history");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, accountId, days]);

  // Independent of the 7/14/30 filter — always the current calendar month,
  // actual-to-date (solid) then projected-to-month-end (light), like the
  // Azure Portal "Accumulated cost / Forecast cost" chart.
  //
  // When the parent page has already fetched a raw {cost,date,status} forecast
  // series (Azure's page-load call already includes this), reuse it instead of
  // making a second live call to an already-throttled provider API.
  const hasRawForecast = Array.isArray(rawForecastSeries);

  useEffect(() => {
    if (!accountId || hasRawForecast) return;
    let cancelled = false;
    setForecastLoading(true);
    setForecastError(null);
    api
      .get(`/${provider}/month-forecast`, getApiConfig(provider, accountId))
      .then((res) => {
        if (!cancelled) setForecastSeries(res.data);
      })
      .catch((err) => {
        if (!cancelled)
          setForecastError(err.response?.data?.error || "Failed to load forecast");
      })
      .finally(() => {
        if (!cancelled) setForecastLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, accountId, hasRawForecast]);

  const accent = PROVIDER_ACCENT[provider] ?? PROVIDER_ACCENT.azure;
  const palette = STACK_PALETTES[provider] ?? STACK_PALETTES.azure;
  const gradientId = `dailyHistoryGradient-${provider}`;

  const areaData = useMemo(
    () =>
      (totals?.days ?? []).map((d) => ({
        date: d.date,
        label: formatDateLabel(d.date),
        total: d.cost,
      })),
    [totals],
  );

  const barData = useMemo(
    () =>
      (data?.daily ?? []).map((d) => {
        const row = { date: d.date, label: formatDateLabel(d.date) };
        for (const s of d.services) row[s.name] = s.cost;
        row.Other = d.other;
        row.total = d.total;
        return row;
      }),
    [data],
  );

  const stackKeys = useMemo(
    () => [...(data?.topServices ?? []), "Other"],
    [data],
  );

  const forecastDays = useMemo(() => {
    if (hasRawForecast) return buildCumulativeSeries(rawForecastSeries);
    return forecastSeries?.days ?? [];
  }, [hasRawForecast, rawForecastSeries, forecastSeries]);

  // Convert the backend's cumulative accumulated/forecastAccumulated series into
  // per-day (non-cumulative) actual vs. forecast bars — de-accumulate by diffing
  // consecutive cumulative values, tracking the running total across whichever of
  // the two fields is populated for that day.
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const forecastChartData = useMemo(() => {
    const rows = [];
    let prevCumulative = 0;
    for (const d of forecastDays) {
      const cumulative = d.accumulated ?? d.forecastAccumulated ?? prevCumulative;
      const dayValue = Math.max(0, cumulative - prevCumulative);
      const isForecast = d.accumulated == null && d.forecastAccumulated != null;
      rows.push({
        date: d.date,
        label: formatDateLabel(d.date),
        actual: isForecast ? null : dayValue,
        forecast: isForecast ? dayValue : null,
        isToday: d.date === todayStr,
      });
      prevCumulative = cumulative;
    }
    return rows;
  }, [forecastDays, todayStr]);
  const isForecastLoading = hasRawForecast ? false : forecastLoading;
  const isForecastError = hasRawForecast ? null : forecastError;
  const todayLabel = forecastChartData.find((r) => r.isToday)?.label ?? null;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F1F5F9] dark:border-[#1a2744]">
        <TrendingUp className={`w-4 h-4 ${accent.icon}`} />
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">
            Daily Cost History
          </h2>
          <p className="text-[10px] text-[#94A3B8]">
            Actual spend per day, by service
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-lg bg-[#F1F5F9] dark:bg-[#1a2744] p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setDays(opt)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                days === opt
                  ? "bg-white dark:bg-[#0B1023] text-[#0F172A] dark:text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-[#475569] dark:hover:text-[#CBD5E1]"
              }`}
            >
              {opt}d
            </button>
          ))}
        </div>
      </div>

      {/* Actual daily cost vs. projected forecast for the rest of the current month */}
      <div className="px-5 pt-4 border-b border-[#F1F5F9] dark:border-[#1a2744]">
        <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider mb-2 flex items-center gap-1.5">
          <CalendarRange className="w-3 h-3" /> Daily Cost — This Month
        </p>
        {isForecastLoading ? (
          <div className="h-56 flex items-center justify-center">
            <span className="text-xs text-[#94A3B8]">Loading forecast…</span>
          </div>
        ) : isForecastError || forecastChartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center">
            <span className="text-xs text-[#94A3B8]">
              {isForecastError || "No forecast available"}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#475569] dark:text-[#CBD5E1]">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: accent.stroke }}
                />
                Actual cost
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94A3B8]">
                <span
                  className="w-2.5 h-2.5 rounded-sm opacity-30 blur-[0.5px]"
                  style={{ backgroundColor: accent.stroke }}
                />
                Projected forecast
              </span>
            </div>
            <div className="h-56 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={forecastChartData}
                  margin={{ top: 20, right: 8, left: 0, bottom: 0 }}
                >
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
                    cursor={{ fill: "#94A3B8", fillOpacity: 0.08 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload.find((p) => p.value != null) ?? payload[0];
                      const isToday = point?.payload?.isToday;
                      const isForecast = point?.dataKey === "forecast";
                      return (
                        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] shadow-lg px-3 py-2 text-xs min-w-[150px]">
                          <div className="flex items-center justify-between gap-3 mb-1.5 pb-1.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                            <span className="font-bold text-[#0F172A] dark:text-white">{label}</span>
                            {isToday && (
                              <span className="text-[9px] font-bold uppercase tracking-wide text-amber-500">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: isToday ? "#F59E0B" : accent.stroke,
                                  opacity: isForecast ? 0.5 : 1,
                                }}
                              />
                              {isForecast ? "Projected forecast" : "Actual cost"}
                            </span>
                            <span className="font-bold text-[#0F172A] dark:text-white tabular-nums">
                              {point?.value == null ? "—" : formatCurrency(point.value, currency)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {todayLabel && (
                    <ReferenceLine
                      x={todayLabel}
                      stroke="#F59E0B"
                      strokeDasharray="4 3"
                      label={{
                        value: "Today",
                        position: "top",
                        fill: "#F59E0B",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  <Bar dataKey="actual" radius={[3, 3, 0, 0]}>
                    {forecastChartData.map((row) => (
                      <Cell
                        key={row.date}
                        fill={row.isToday ? "#F59E0B" : accent.stroke}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="forecast" fillOpacity={0.3} radius={[3, 3, 0, 0]}>
                    {forecastChartData.map((row) => (
                      <Cell
                        key={row.date}
                        fill={row.isToday ? "#F59E0B" : accent.stroke}
                        fillOpacity={row.isToday ? 0.55 : 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
        {/* Area chart — daily total trend (DB-backed, no live API call) */}
        <div>
          <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider mb-2">
            Daily Total
          </p>
          {totalsLoading ? (
            <div className="h-56 flex items-center justify-center">
              <span className="text-xs text-[#94A3B8]">Loading history…</span>
            </div>
          ) : totalsError || areaData.length === 0 ? (
            <div className="h-56 flex items-center justify-center">
              <span className="text-xs text-[#94A3B8]">
                {totalsError || "No history available for this range"}
              </span>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={areaData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={accent.gradientFrom}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor={accent.gradientTo}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
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
                    tickFormatter={(v) =>
                      formatCurrency(v, currency).replace(/\.00$/, "")
                    }
                  />
                  <RechartsTooltip
                    cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const value = payload[0]?.value;
                      return (
                        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] shadow-lg px-3 py-2 text-xs min-w-[130px]">
                          <p className="font-bold text-[#0F172A] dark:text-white mb-1.5 pb-1.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                            {label}
                          </p>
                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: accent.stroke }}
                              />
                              Cost
                            </span>
                            <span className="font-bold text-[#0F172A] dark:text-white tabular-nums">
                              {value == null ? "—" : formatCurrency(value, currency)}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={accent.stroke}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Stacked bar chart — per-day service breakdown (live, server-cached) */}
        <div>
          <p className="text-[10px] font-bold text-[#94A3B8] tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3 h-3" /> By Service
          </p>
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <span className="text-xs text-[#94A3B8]">Loading history…</span>
            </div>
          ) : error || !data || barData.length === 0 ? (
            <div className="h-56 flex items-center justify-center">
              <span className="text-xs text-[#94A3B8]">
                {error || "No history available for this range"}
              </span>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#F1F5F9"
                  />
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
                    tickFormatter={(v) =>
                      formatCurrency(v, currency).replace(/\.00$/, "")
                    }
                  />
                  <RechartsTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const total = payload[0]?.payload?.total;
                      return (
                        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] shadow-lg px-3 py-2 text-xs">
                          <div className="flex items-center justify-between gap-3 mb-1.5 pb-1.5 border-b border-[#F1F5F9] dark:border-[#1a2744]">
                            <span className="font-bold text-[#0F172A] dark:text-white">{label}</span>
                            {total !== undefined && (
                              <span className="font-bold text-[#0F172A] dark:text-white">
                                {formatCurrency(total, currency)}
                              </span>
                            )}
                          </div>
                          {payload.map((p) => (
                            <div key={p.dataKey} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8]">
                                <span
                                  className="w-2 h-2 rounded-sm shrink-0"
                                  style={{ backgroundColor: p.color }}
                                />
                                {p.dataKey}
                              </span>
                              <span className="font-semibold text-[#0F172A] dark:text-white">
                                {formatCurrency(p.value, currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  {stackKeys.map((key, i) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      stackId="services"
                      fill={palette[i % palette.length]}
                      radius={i === stackKeys.length - 1 ? [3, 3, 0, 0] : 0}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

DailyHistoryCharts.propTypes = {
  provider: PropTypes.oneOf(["azure", "aws"]).isRequired,
  accountId: PropTypes.string,
  currency: PropTypes.string,
  rawForecastSeries: PropTypes.arrayOf(
    PropTypes.shape({
      cost: PropTypes.number,
      date: PropTypes.string,
      status: PropTypes.string,
    }),
  ),
};

DailyHistoryCharts.defaultProps = {
  currency: "USD",
  rawForecastSeries: null,
};

export default DailyHistoryCharts;
