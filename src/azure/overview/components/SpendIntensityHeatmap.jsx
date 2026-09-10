import React, { useState } from "react";
import PropTypes from "prop-types";
import { formatCurrency } from "../../../utils/formatters";

const intensityClass = (ratio) => {
  if (ratio > 0.75) return "bg-brand-600 text-white";
  if (ratio > 0.5) return "bg-brand-400 text-white";
  if (ratio > 0.25) return "bg-brand-200 dark:bg-brand-900 text-gray-900 dark:text-white";
  return "bg-brand-50 dark:bg-brand-950/40 text-gray-700 dark:text-gray-300";
};

const SpendIntensityHeatmap = ({ days, highestDay, currency }) => {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...days.map((d) => d.cost), 0.01);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {days.map((d) => (
          <button
            key={d.date}
            onMouseEnter={() => setHovered(d)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(d)}
            className={`w-9 h-9 rounded-lg text-[11px] font-bold flex items-center justify-center transition-transform hover:scale-105 ${intensityClass(d.cost / max)}`}
            title={`${d.date}: ${formatCurrency(d.cost, currency)}`}
          >
            {Number(d.date.slice(-2))}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {hovered
          ? `${hovered.date}: ${formatCurrency(hovered.cost, currency)}`
          : highestDay
            ? `Highest day: ${highestDay.date} · ${formatCurrency(highestDay.cost, currency)} · ${days.length} days in view`
            : ""}
      </p>
    </div>
  );
};

SpendIntensityHeatmap.propTypes = {
  days: PropTypes.arrayOf(PropTypes.shape({ date: PropTypes.string, cost: PropTypes.number })).isRequired,
  highestDay: PropTypes.object,
  currency: PropTypes.string,
};
export default SpendIntensityHeatmap;
