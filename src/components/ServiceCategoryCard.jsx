import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Tag } from "lucide-react";
import { groupByCategory } from "../utils/categoryMappings";
import { formatCurrency } from "../utils/formatters";

const PROVIDER_ACCENT = {
  azure: { icon: "text-blue-500", bar: "bg-blue-500", header: "bg-blue-50 dark:bg-blue-900/20" },
  aws:   { icon: "text-orange-500", bar: "bg-orange-500", header: "bg-orange-50 dark:bg-orange-900/20" },
  btp:   { icon: "text-[#0070F2]", bar: "bg-[#0070F2]", header: "bg-blue-50 dark:bg-blue-900/20" },
};

const ServiceCategoryCard = ({ services, provider, currency }) => {
  const rows = useMemo(() => groupByCategory(services, provider), [services, provider]);
  const grandTotal = useMemo(() => rows.reduce((s, r) => s + r.total, 0), [rows]);
  const accent = PROVIDER_ACCENT[provider] ?? PROVIDER_ACCENT.azure;

  if (!services || services.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-5 py-4 border-b border-[#F1F5F9] dark:border-[#1a2744]`}>
        <div className="flex items-center justify-center">
          <Tag className={`w-4 h-4 ${accent.icon}`} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Service Category Summary</h2>
          <p className="text-[10px] text-[#94A3B8]">{rows.length} categories · {services.length} services</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-[#94A3B8]">Grand Total</p>
          <p className="text-sm font-bold text-[#0F172A] dark:text-white">{formatCurrency(grandTotal, currency)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F1F5F9] dark:border-[#1a2744]">
              <th className="text-left py-2.5 px-5 text-[10px] font-bold text-[#94A3B8] tracking-wider">Category</th>
              <th className="text-right py-2.5 px-5 text-[10px] font-bold text-[#94A3B8] tracking-wider">Total Cost</th>
              <th className="text-right py-2.5 px-5 text-[10px] font-bold text-[#94A3B8] tracking-wider w-32">Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ category, total }) => {
              const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
              return (
                <tr
                  key={category}
                  className="border-b border-[#F8FAFC] dark:border-[#0f1829] hover:bg-[#F8FAFC] dark:hover:bg-[#0f1829] transition-colors"
                >
                  <td className="py-2.5 px-5 font-medium text-[#0F172A] dark:text-white">{category}</td>
                  <td className="py-2.5 px-5 text-right font-semibold text-[#0F172A] dark:text-white tabular-nums">
                    {formatCurrency(total, currency)}
                  </td>
                  <td className="py-2.5 px-5">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-[#F1F5F9] dark:bg-[#1a2744] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${accent.bar}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8] w-12 text-right tabular-nums">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Grand total footer */}
          <tfoot>
            <tr className="border-t-2 border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#0f1829]">
              <td className="py-3 px-5 text-sm font-bold text-[#0F172A] dark:text-white">Grand Total</td>
              <td className="py-3 px-5 text-right text-sm font-bold text-[#0F172A] dark:text-white tabular-nums">
                {formatCurrency(grandTotal, currency)}
              </td>
              <td className="py-3 px-5 text-right text-xs font-bold text-[#94A3B8]">100.0%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

ServiceCategoryCard.propTypes = {
  services: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      ServiceName: PropTypes.string,
      cost: PropTypes.number,
      Cost: PropTypes.number,
    })
  ).isRequired,
  provider: PropTypes.oneOf(["azure", "aws", "btp"]).isRequired,
  currency: PropTypes.string,
};

ServiceCategoryCard.defaultProps = {
  currency: "USD",
};

export default ServiceCategoryCard;
