import React from "react";
import { PiggyBank, AlertCircle } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";

const BudgetsCard = ({ budgets, loading }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-100 dark:border-slate-800 flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
        <PiggyBank className="w-5 h-5 mr-2 text-pink-500" />
        Budgets
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
        </div>
      ) : (
        <div className="space-y-6 flex-1 overflow-y-auto max-h-64 pr-2">
          {budgets.map((budget, idx) => {
            const percent =
              budget.BudgetLimit > 0
                ? (budget.ActualSpend / budget.BudgetLimit) * 100
                : 0;
            const isOver = percent > 100;
            const isWarning = percent > 80;
            const colorClass = isOver
              ? "bg-red-500"
              : isWarning
                ? "bg-amber-500"
                : "bg-green-500";
            const textClass = isOver
              ? "text-red-500"
              : isWarning
                ? "text-amber-500"
                : "text-green-500";

            return (
              <div key={idx} className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div className="max-w-[70%]">
                    <span className="text-xs font-semibold inline-block py-1 px-2  rounded-full text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 truncate block">
                      {budget.BudgetName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold inline-block ${textClass}`}
                    >
                      {percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-slate-200 dark:bg-slate-700">
                  <div
                    style={{ width: `${Math.min(percent, 100)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap justify-center ${colorClass} transition-all duration-500`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Spent: {formatCurrency(budget.ActualSpend)}</span>
                  <span>Limit: {formatCurrency(budget.BudgetLimit)}</span>
                </div>
                {budget.ForecastedSpend > budget.BudgetLimit && (
                  <div className="mt-1 flex items-center text-xs text-amber-500">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Forecasted to exceed:{" "}
                    {formatCurrency(budget.ForecastedSpend)}
                  </div>
                )}
              </div>
            );
          })}

          {budgets.length === 0 && (
            <div className="text-center py-6 text-slate-500">
              <p>No active budgets found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetsCard;
