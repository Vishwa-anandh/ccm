import React from "react";
import PropTypes from "prop-types";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { formatCurrency } from "../../../utils/formatters";

const DivergingBarChart = ({ items, currency }) => {
  const data = items.map((it) => ({ name: it.name, change: it.change }));
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
          <RechartsTooltip formatter={(v) => formatCurrency(v, currency)} />
          <Bar dataKey="change" radius={[4, 4, 4, 4]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.change >= 0 ? "#EA580C" : "#059669"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

DivergingBarChart.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string, change: PropTypes.number })).isRequired,
  currency: PropTypes.string,
};
export default DivergingBarChart;
