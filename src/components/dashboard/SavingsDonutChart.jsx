import React from "react";
import PropTypes from "prop-types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "../../utils/formatters";

const COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#10b981", "#6b7280"];

const SavingsDonutChart = ({ data, totalAmount }) => {
  return (
    <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-card h-full flex flex-col">
      <h3 className="font-bold text-gray-900 dark:text-white">
        Savings by Category
      </h3>
      <p className="text-xs text-gray-500 mt-1">
        Breakdown of optimization savings
      </p>

      <div className="flex-1 mt-6 flex items-center justify-between">
        <div className="w-1/2 h-40 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold text-gray-500">Total</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        <div className="w-1/2 pl-4 flex flex-col justify-center space-y-2.5">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span
                  className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate"
                  title={item.name}
                >
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white shrink-0">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

SavingsDonutChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      percentage: PropTypes.string.isRequired,
    }),
  ).isRequired,
  totalAmount: PropTypes.number.isRequired,
};

export default SavingsDonutChart;
