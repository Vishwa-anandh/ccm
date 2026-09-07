import React from "react";
import PropTypes from "prop-types";
import { ChevronRight } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

const SavingsCategoryCard = ({
  title,
  amount,
  percentage,
  subtitle,
  items,
  type,
  onItemClick,
}) => {
  return (
    <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-card flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-gray-50 dark:border-gray-800">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {type === "optimization" ? (
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                B
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                C
              </span>
            )}
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              {title}
            </h3>
          </div>
          <div className="text-right">
            <p className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">
              {formatCurrency(amount)}
            </p>
            <p className="text-[10px] font-medium text-gray-400">
              {percentage}% of annualised spend
            </p>
          </div>
        </div>
        {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onItemClick && onItemClick(item)}
            className="flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 flex items-center justify-center shrink-0 ${item.iconColor}`}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(item.amount)}
                </p>
                <p
                  className={`text-[10px] font-medium ${item.percentageColor || "text-emerald-500"}`}
                >
                  {item.percentage}%
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center">
        <button className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors inline-flex items-center gap-2">
          {type === "optimization"
            ? "View All Optimization Opportunities"
            : "View CSP Savings Details"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div> */}
    </div>
  );
};

SavingsCategoryCard.propTypes = {
  title: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  percentage: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node.isRequired,
      iconBg: PropTypes.string.isRequired,
      iconColor: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      percentage: PropTypes.string.isRequired,
      percentageColor: PropTypes.string,
    }),
  ).isRequired,
  type: PropTypes.oneOf(["optimization", "csp"]).isRequired,
  onItemClick: PropTypes.func,
};

export default SavingsCategoryCard;
