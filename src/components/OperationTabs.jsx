import React, { useState } from "react";
import PropTypes from "prop-types";
import { Calendar, BarChart3 } from "lucide-react";
import OperationViewPanel from "./OperationViewPanel";
import DailyCostHistoryTabs from "./DailyCostHistoryTabs";

const OperationTabs = ({ provider, accountId, currency, dailyTotals = null }) => {
  const [activeSubTab, setActiveSubTab] = useState("daily");

  const subTabs = [
    {
      id: "daily",
      label: "Day by Day",
      icon: Calendar,
      description: "Daily metrics and service attribution",
    },
    {
      id: "monthly",
      label: "Monthly",
      icon: BarChart3,
      description: "Monthly trends and historical data",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-3 px-0.5">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                isActive
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-[#0F172A] dark:text-white font-semibold"
                  : "border-transparent text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </button>
          );
        })}
        <div className="ml-auto text-xs text-[#94A3B8] italic">
          {subTabs.find((t) => t.id === activeSubTab)?.description}
        </div>
      </div>

      {/* Day by Day View */}
      {activeSubTab === "daily" && (
        <div className="space-y-6">
          {/* Operation Metrics & Alerts */}
          <OperationViewPanel
            provider={provider}
            accountId={accountId}
            currency={currency}
            dailyTotals={dailyTotals}
          />

          {/* Daily Cost History Charts */}
          <DailyCostHistoryTabs
            provider={provider}
            accountId={accountId}
            currency={currency}
          />
        </div>
      )}

      {/* Monthly View */}
      {activeSubTab === "monthly" && (
        <div className="rounded-lg border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-6">
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
              Monthly Trends
            </p>
            <p className="text-xs text-[#94A3B8]">
              Monthly spend by service chart will display here
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

OperationTabs.propTypes = {
  provider: PropTypes.oneOf(["azure", "aws"]).isRequired,
  accountId: PropTypes.string.isRequired,
  currency: PropTypes.string,
  dailyTotals: PropTypes.object,
};

export default OperationTabs;
