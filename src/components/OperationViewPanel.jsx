import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { AlertTriangle, TrendingUp, Target, Calendar, Zap, BarChart3 } from "lucide-react";
import DayComparisonCard from "./DayComparisonCard";
import { formatCurrency } from "../utils/formatters";

const OperationViewPanel = ({ provider, accountId, currency, dailyTotals }) => {
  // Calculate operational metrics
  const metrics = useMemo(() => {
    if (!dailyTotals?.days || dailyTotals.days.length === 0) {
      return {
        todayCost: 0,
        yesterdayCost: 0,
        dayChange: 0,
        dayChangePercent: 0,
        avgDaily: 0,
        monthToDate: 0,
        trend: "stable",
        anomaly: false,
        forecastEOM: 0,
      };
    }

    const sorted = [...dailyTotals.days].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const today = Number(sorted[sorted.length - 1]?.cost || 0);
    const yesterday = Number(sorted[sorted.length - 2]?.cost || 0);
    const dayChange = today - yesterday;
    const dayChangePercent = yesterday > 0 ? (dayChange / yesterday) * 100 : 0;
    const avgDaily =
      sorted.reduce((sum, d) => sum + Number(d.cost || 0), 0) / sorted.length;
    const monthToDate = sorted.reduce((sum, d) => sum + Number(d.cost || 0), 0);

    // Simple anomaly: if today's cost is > 1.5x average
    const anomaly = today > avgDaily * 1.5;
    const trend =
      dayChangePercent > 10 ? "up" : dayChangePercent < -10 ? "down" : "stable";

    // Rough forecast: if this day's cost continues for full month (30 days)
    const daysInMonth = 30;
    const currentDay = sorted.length;
    const forecastEOM = monthToDate + (avgDaily * (daysInMonth - currentDay));

    return {
      todayCost: today,
      yesterdayCost: yesterday,
      dayChange,
      dayChangePercent,
      avgDaily,
      monthToDate,
      trend,
      anomaly,
      forecastEOM,
    };
  }, [dailyTotals]);

  return (
    <div className="space-y-6">
      {/* Alert Section */}
      {metrics.anomaly && (
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                ⚠️ Cost Anomaly Detected
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Today's cost ({formatCurrency(metrics.todayCost, currency)}) is{" "}
                <strong>
                  {((metrics.todayCost / metrics.avgDaily - 1) * 100).toFixed(0)}%
                </strong>{" "}
                above 30-day average. Investigate service changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Critical Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Spend */}
        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Today's Spend
            </p>
            <Zap className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A] dark:text-white">
            {formatCurrency(metrics.todayCost, currency)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Real-time</p>
        </div>

        {/* Month-to-Date */}
        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Month-to-Date
            </p>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A] dark:text-white">
            {formatCurrency(metrics.monthToDate, currency)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Cumulative</p>
        </div>

        {/* Forecasted EOM */}
        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Forecast EOM
            </p>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A] dark:text-white">
            {formatCurrency(metrics.forecastEOM, currency)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Projected</p>
        </div>

        {/* Daily Avg */}
        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Daily Average
            </p>
            <BarChart3 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-[#0F172A] dark:text-white">
            {formatCurrency(metrics.avgDaily, currency)}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">30-day avg</p>
        </div>
      </div>

      {/* Burn Rate & Trend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Day-over-Day Change */}
        <div
          className={`rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] p-4 shadow-sm ${
            metrics.dayChange > 0
              ? "bg-red-50 dark:bg-red-950/20"
              : "bg-green-50 dark:bg-green-950/20"
          }`}
        >
          <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
            📊 Day-over-Day Change
          </p>
          <div className="flex items-end gap-2">
            <p
              className={`text-2xl font-bold ${
                metrics.dayChange > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {metrics.dayChange > 0 ? "+" : ""}
              {formatCurrency(metrics.dayChange, currency)}
            </p>
            <p
              className={`text-sm font-semibold ${
                metrics.dayChange > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {metrics.dayChangePercent > 0 ? "+" : ""}
              {metrics.dayChangePercent.toFixed(1)}%
            </p>
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">vs. yesterday</p>
        </div>

        {/* Trend */}
        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
            📈 Spending Trend
          </p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold text-[#0F172A] dark:text-white">
              {metrics.trend === "up"
                ? "📈 Rising"
                : metrics.trend === "down"
                ? "📉 Falling"
                : "➡️ Stable"}
            </p>
          </div>
          <p className="text-xs text-[#94A3B8] mt-2">
            {metrics.trend === "up"
              ? "Cost increasing - review immediately"
              : metrics.trend === "down"
              ? "Cost decreasing - monitor"
              : "Cost stable - on track"}
          </p>
        </div>
      </div>

      {/* Service Attribution */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">
            Service Cost Attribution (Yesterday vs Today)
          </h3>
        </div>
        <DayComparisonCard
          provider={provider}
          accountId={accountId}
          currency={currency}
        />
      </div>
    </div>
  );
};

OperationViewPanel.propTypes = {
  provider: PropTypes.oneOf(["azure", "aws"]).isRequired,
  accountId: PropTypes.string.isRequired,
  currency: PropTypes.string,
  dailyTotals: PropTypes.object,
};

export default OperationViewPanel;
