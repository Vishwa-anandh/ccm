import React from "react";
import PropTypes from "prop-types";
import { DollarSign, TrendingUp, Gauge, Tag } from "lucide-react";
import { formatCurrency } from "../../../utils/formatters";

const Tile = ({ icon: Icon, label, value, sub, loading }) => (
  <div className="card px-4 sm:px-5 py-3.5 flex items-center gap-3">
    <div className="p-2 rounded-xl border border-brand-200 dark:border-brand-800 shrink-0 hidden sm:flex">
      <Icon className="w-4 h-4 text-brand-500" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold text-gray-400 mb-0.5 truncate">{label}</p>
      {loading ? (
        <div className="w-24 h-6 skeleton rounded-lg" />
      ) : (
        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tabular-nums leading-none truncate">{value}</p>
      )}
      {sub && <p className="mt-1 text-[11px] text-gray-400 truncate">{sub}</p>}
    </div>
  </div>
);

const KpiRow = ({ kpis, loading }) => {
  const changePct = kpis?.previousPeriodCost
    ? Math.round(((kpis.totalCost - kpis.previousPeriodCost) / kpis.previousPeriodCost) * 1000) / 10
    : null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Tile icon={DollarSign} label="Total cost" loading={loading} value={kpis ? formatCurrency(kpis.totalCost, kpis.currency) : ""} sub={kpis?.periodLabel} />
      <Tile icon={TrendingUp} label="Previous period" loading={loading} value={kpis ? formatCurrency(kpis.previousPeriodCost, kpis.currency) : ""} sub={changePct !== null ? `${changePct > 0 ? "+" : ""}${changePct}% vs ${kpis.previousPeriodLabel}` : ""} />
      <Tile icon={Gauge} label="Average daily cost" loading={loading} value={kpis ? formatCurrency(kpis.avgDailyCost, kpis.currency) : ""} sub="Across every day in the selected range" />
      <Tile icon={Tag} label="Untagged application cost" loading={loading} value={kpis ? formatCurrency(kpis.untaggedCost, kpis.currency) : ""} sub={kpis?.totalCost ? `${Math.round((kpis.untaggedCost / kpis.totalCost) * 1000) / 10}% of net cost` : ""} />
    </div>
  );
};

KpiRow.propTypes = { kpis: PropTypes.object, loading: PropTypes.bool };
export default KpiRow;
