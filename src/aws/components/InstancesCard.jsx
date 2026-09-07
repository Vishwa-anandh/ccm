import React from "react";
import { Server, CheckCircle, XCircle, Power } from "lucide-react";

const InstancesCard = ({ instances, loading }) => {
  // Group instances by state
  const runningCount = instances.filter((i) => i.State === "running").length;
  const stoppedCount = instances.filter((i) => i.State === "stopped").length;
  const total = instances.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 border border-slate-100 dark:border-slate-800 flex flex-col">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center">
        <Server className="w-5 h-5 mr-2 text-orange-500" />
        EC2 Instances
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="py-1.5 px-2 rounded-lg text-center border border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-green-600 dark:text-green-400 font-bold">Running</p>
              <p className="text-sm font-bold text-green-700 dark:text-green-300">{runningCount}</p>
            </div>
            <div className="py-1.5 px-2 rounded-lg text-center border border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Stopped</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{stoppedCount}</p>
            </div>
            <div className="py-1.5 px-2 rounded-lg text-center border border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">Total</p>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-300">{total}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-96 pr-1 custom-scrollbar">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-3 py-1 text-left text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800">
                    ID
                  </th>
                  <th className="px-3 py-1 text-left text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800">
                    Type
                  </th>
                  <th className="px-3 py-1 text-right text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800">
                    State
                  </th>
                  <th className="px-3 py-1 text-right text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800">
                    Region
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {instances.map((inst, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td
                      className="px-3 py-1 text-slate-700 dark:text-slate-300 font-mono text-xs truncate max-w-[100px]"
                      title={inst.InstanceId}
                    >
                      {inst.InstanceId}
                    </td>
                    <td className="px-3 py-1 text-slate-600 dark:text-slate-400 text-xs">
                      {inst.InstanceType}
                    </td>
                    <td className="px-3 py-1 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          inst.State === "running"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {inst.State === "running" ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Power className="w-3 h-3 mr-1" />
                        )}
                        {inst.State}
                      </span>
                    </td>
                    <td className="px-3 py-1 text-right text-xs text-slate-500 dark:text-slate-400">
                      {inst.Region}
                    </td>
                  </tr>
                ))}
                {instances.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="text-center py-4 text-slate-500 text-xs"
                    >
                      No instances found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default InstancesCard;
