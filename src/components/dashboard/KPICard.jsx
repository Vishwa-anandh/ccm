import React from "react";
import PropTypes from "prop-types";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

const KPICard = ({
  title,
  amount,
  subtitle,
  icon,
  isTotal,
  trend,
  trendValue,
  iconBg,
  iconColor,
}) => {
  const colorClass =
    "shadow-sm bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800";

  return (
    <div className={`px-4 py-3 rounded-xl border ${colorClass}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-end gap-2 mt-0.5">
            <h3
              className={`text-lg font-bold ${isTotal ? "text-gray-900 dark:text-white" : "text-gray-900 dark:text-gray-100"}`}
            >
              {title === "Total Savings (Potential)" ? (
                <span className="text-emerald-500">
                  {formatCurrency(amount)}
                </span>
              ) : (
                formatCurrency(amount)
              )}
            </h3>
            {trend && (
              <div
                className={`flex items-center text-xs font-bold ${trend === "up" ? "text-emerald-500" : "text-emerald-500"} mb-1`}
              >
                {trend === "up" ? (
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                )}
                {trendValue}
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>

        {icon && (
          <div
            className={`w-8 h-8 flex items-center justify-center shrink-0 ${iconColor || "text-gray-400"}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

KPICard.propTypes = {
  title: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  isTotal: PropTypes.bool,
  trend: PropTypes.oneOf(["up", "down"]),
  trendValue: PropTypes.string,
  iconBg: PropTypes.string,
  iconColor: PropTypes.string,
};

export default KPICard;
