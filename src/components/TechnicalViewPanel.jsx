import React from "react";
import PropTypes from "prop-types";
import { Code, Layers, Database, Activity } from "lucide-react";
import DailyHistoryCharts from "./DailyHistoryCharts";

const TechnicalViewPanel = ({ provider, accountId, currency }) => {
  return (
    <div className="space-y-6">
      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              API Provider
            </p>
          </div>
          <p className="text-lg font-bold text-[#0F172A] dark:text-white">
            {provider === "azure" ? "Azure Cost Management" : "AWS Cost Explorer"}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Live API Calls</p>
        </div>

        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-purple-500" />
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Granularity
            </p>
          </div>
          <p className="text-lg font-bold text-[#0F172A] dark:text-white">
            Daily × Service
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Resource-level breakdown</p>
        </div>

        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Data Source
            </p>
          </div>
          <p className="text-lg font-bold text-[#0F172A] dark:text-white">
            {provider === "azure" ? "Cost Query API" : "CE API v2"}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">Real-time</p>
        </div>

        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">
              Cache TTL
            </p>
          </div>
          <p className="text-lg font-bold text-[#0F172A] dark:text-white">
            {provider === "azure" ? "24h" : "30m"}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            {provider === "azure"
              ? "Rate limit: 12 req/min"
              : "Rate limit: 60 req/min"}
          </p>
        </div>
      </div>

      {/* Chart Description */}
      <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4">
        <h3 className="font-semibold text-[#0F172A] dark:text-white mb-2">
          📊 Technical Dashboard
        </h3>
        <ul className="text-sm text-[#475569] dark:text-[#CBD5E1] space-y-1">
          <li>• <strong>Accumulated Cost Chart:</strong> Actual vs. Forecast month-end projection</li>
          <li>• <strong>Daily Total Area:</strong> Day-by-day cost trend (DB-backed, instant)</li>
          <li>• <strong>By Service Stacked Bar:</strong> Top 5 services + Other breakdown</li>
          <li>• <strong>Range Filter:</strong> 7d / 14d / 30d historical view</li>
        </ul>
      </div>

      {/* Full Technical Charts */}
      <div>
        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white mb-4">
          Detailed Cost Analysis
        </h3>
        <DailyHistoryCharts
          provider={provider}
          accountId={accountId}
          currency={currency}
        />
      </div>

      {/* Technical Notes */}
      <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-4">
        <h3 className="font-semibold text-[#0F172A] dark:text-white mb-3">
          🔧 Technical Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
              Service Attribution
            </p>
            <p className="text-[#475569] dark:text-[#CBD5E1]">
              Shows which services/resources consumed the most cost, per day.
              Helps identify cost drivers and resource optimization targets.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
              Forecast Model
            </p>
            <p className="text-[#475569] dark:text-[#CBD5E1]">
              Uses {provider === "azure" ? "Azure" : "AWS"} native forecast API.
              Accounts for seasonal trends and historical patterns.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
              Data Freshness
            </p>
            <p className="text-[#475569] dark:text-[#CBD5E1]">
              Live API calls cached for performance. Daily history from database
              for instant rendering.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[#64748B] dark:text-[#94A3B8] mb-2">
              Grouping Logic
            </p>
            <p className="text-[#475569] dark:text-[#CBD5E1]">
              Top 5 services displayed separately, remainder grouped as "Other"
              to prevent chart clutter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

TechnicalViewPanel.propTypes = {
  provider: PropTypes.oneOf(["azure", "aws"]).isRequired,
  accountId: PropTypes.string.isRequired,
  currency: PropTypes.string,
};

export default TechnicalViewPanel;
