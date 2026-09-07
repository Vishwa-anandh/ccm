import React from "react";
import PropTypes from "prop-types";
import { formatCurrency } from "../../utils/formatters";

const impactClass = (impact) => {
  if (impact === "High") return "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400";
  if (impact === "Medium") return "border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400";
  return "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400";
};

const TopRecommendationsList = ({ recommendations }) => {
  return (
    <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-card h-full flex flex-col">
      <h3 className="font-bold text-gray-900 dark:text-white">Top Recommendations</h3>
      <p className="text-xs text-gray-500 mt-1 mb-6">High impact opportunities</p>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={`w-8 h-8 flex items-center justify-center shrink-0 mt-0.5 ${rec.iconColor}`}>
              {rec.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate" title={rec.title}>{rec.title}</h4>
              <p className="text-xs text-gray-500 mt-0.5">Save {formatCurrency(rec.savings)}/month</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${impactClass(rec.impact)}`}>
              {rec.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

TopRecommendationsList.propTypes = {
  recommendations: PropTypes.arrayOf(PropTypes.shape({
    icon: PropTypes.node.isRequired,
    iconBg: PropTypes.string.isRequired,
    iconColor: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    savings: PropTypes.number.isRequired,
    impact: PropTypes.oneOf(['High', 'Medium', 'Low']).isRequired,
  })).isRequired,
};

export default TopRecommendationsList;
