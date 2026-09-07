import React, { useState } from "react";
import PropTypes from "prop-types";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "../../utils/formatters";

const SavingsTrendChart = ({ data }) => {
  const [filter, setFilter] = useState("Last 6 Months");

  // Apply filter locally
  let displayData = [...data];
  if (filter === "Last 6 Months") {
    displayData = displayData.slice(-6);
  } else if (filter === "Last 12 Months") {
    displayData = displayData.slice(-12);
  } else if (filter === "Year to Date") {
    const currentYear = new Date().getFullYear().toString().slice(2);
    displayData = displayData.filter(d => d.month.includes(currentYear));
  }

  return (
    <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-card h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Savings Trend</h3>
          <p className="text-xs text-gray-500 mt-1">Potential savings over time</p>
        </div>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs border-none bg-transparent font-bold text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer"
        >
          <option>Last 6 Months</option>
          <option>Last 12 Months</option>
          <option>Year to Date</option>
        </select>
      </div>

      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData.length ? displayData : [{ month: 'N/A', savings: 0 }]} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-800" />
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af' }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9ca3af' }} 
              tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value}`}
            />
            <Tooltip 
              formatter={(value) => [formatCurrency(value), "Savings"]}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Area 
              type="monotone" 
              dataKey="savings" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorSavings)"
              strokeWidth={3} 
              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} 
              activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

SavingsTrendChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    month: PropTypes.string.isRequired,
    savings: PropTypes.number.isRequired,
  })).isRequired,
};

export default SavingsTrendChart;
