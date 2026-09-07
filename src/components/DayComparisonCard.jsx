import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import api from "../api";
import { formatCurrency } from "../utils/formatters";

const PROVIDER_ACCENT = {
  azure: { icon: "text-blue-500", bar: "bg-blue-500" },
  aws: { icon: "text-orange-500", bar: "bg-orange-500" },
};

// AWS uses x-account-id header; Azure uses accountId query param
const getApiConfig = (provider, accountId, params = {}) => {
  if (provider === "aws") {
    return { headers: { "x-account-id": accountId }, params };
  }
  return { params: { accountId, ...params } };
};

// Answers "yesterday I saw $150, today $400 — what increased and which service?"
// by calling GET /{provider}/day-comparison and rendering the per-service delta.
const DayComparisonCard = ({ provider, accountId, currency }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .get(`/${provider}/day-comparison`, getApiConfig(provider, accountId))
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load comparison");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provider, accountId]);

  const accent = PROVIDER_ACCENT[provider] ?? PROVIDER_ACCENT.azure;

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5 min-h-[140px] flex items-center justify-center">
        <span className="text-xs text-[#94A3B8]">Loading day comparison…</span>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-5 min-h-[140px] flex items-center justify-center">
        <span className="text-xs text-[#94A3B8]">{error || "No comparison data"}</span>
      </div>
    );
  }

  const { date1, date2, totalBefore, totalAfter, totalDelta, services } = data;
  const pct = totalBefore > 0 ? (totalDelta / totalBefore) * 100 : 0;
  const topMovers = (services ?? []).filter((s) => Math.abs(s.delta) > 0.01).slice(0, 8);
  const maxAbs = Math.max(...topMovers.map((s) => Math.abs(s.delta)), 1);

  const TrendIcon = totalDelta > 0 ? TrendingUp : totalDelta < 0 ? TrendingDown : Minus;
  const trendColor =
    totalDelta > 0 ? "text-red-500" : totalDelta < 0 ? "text-emerald-500" : "text-[#94A3B8]";

  return (
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F1F5F9] dark:border-[#1a2744]">
        <Calendar className={`w-4 h-4 ${accent.icon}`} />
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Day-over-Day Cost Change</h2>
          <p className="text-[10px] text-[#94A3B8]">
            {date1} → {date2}
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className={`flex items-center justify-end gap-1 ${trendColor}`}>
            <TrendIcon className="w-3.5 h-3.5" />
            <span className="text-sm font-bold tabular-nums">
              {totalDelta >= 0 ? "+" : ""}
              {formatCurrency(totalDelta, currency)}
            </span>
          </div>
          <p className="text-[10px] text-[#94A3B8]">
            {formatCurrency(totalBefore, currency)} → {formatCurrency(totalAfter, currency)} (
            {pct >= 0 ? "+" : ""}
            {pct.toFixed(1)}%)
          </p>
        </div>
      </div>

      {topMovers.length === 0 ? (
        <div className="px-5 py-6 text-center text-xs text-[#94A3B8]">
          No meaningful service-level change between these two days.
        </div>
      ) : (
        <div className="px-5 py-4 space-y-2.5">
          {topMovers.map((s) => {
            const up = s.delta > 0;
            const width = (Math.abs(s.delta) / maxAbs) * 100;
            return (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs font-medium text-[#0F172A] dark:text-white w-40 truncate" title={s.name}>
                  {s.name}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${up ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.max(4, width)}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-semibold tabular-nums w-20 text-right ${
                    up ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {up ? "+" : ""}
                  {formatCurrency(s.delta, currency)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

DayComparisonCard.propTypes = {
  provider: PropTypes.oneOf(["azure", "aws"]).isRequired,
  accountId: PropTypes.string,
  currency: PropTypes.string,
};

DayComparisonCard.defaultProps = {
  currency: "USD",
};

export default DayComparisonCard;
