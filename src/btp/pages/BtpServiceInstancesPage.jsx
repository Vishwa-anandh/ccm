import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  ArrowLeft, RefreshCw, Package, CheckCircle2, XCircle, Clock,
  AlertTriangle, Loader2, Layers, Server, Database, Calendar,
  Settings2,
} from "lucide-react";
import { getSmInstances, refreshSmInstances, getSmConfig } from "../../api/btpApi";
import BtpServiceManagerModal from "../components/BtpServiceManagerModal";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  "create succeeded": { label: "Active",      color: "emerald", Icon: CheckCircle2 },
  "update succeeded": { label: "Updated",     color: "emerald", Icon: CheckCircle2 },
  "delete succeeded": { label: "Deleted",     color: "red",     Icon: XCircle      },
  "create failed":    { label: "Failed",      color: "red",     Icon: XCircle      },
  "in progress":      { label: "In Progress", color: "amber",   Icon: Clock        },
  "true":             { label: "Active",      color: "emerald", Icon: CheckCircle2 },
  "false":            { label: "Inactive",    color: "gray",    Icon: XCircle      },
};

const colorClass = {
  emerald: "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700",
  red:     "text-red-600    dark:text-red-400     border-red-300    dark:border-red-700",
  amber:   "text-amber-600  dark:text-amber-400   border-amber-300  dark:border-amber-700",
  gray:    "text-gray-500   dark:text-gray-400    border-gray-200   dark:border-gray-700",
};

const StatusBadge = ({ status }) => {
  const key = status?.toLowerCase() ?? "";
  const def = STATUS_MAP[key] ?? STATUS_MAP[status] ?? { label: status ?? "Unknown", color: "gray", Icon: Clock };
  const { label, color, Icon } = def;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorClass[color]}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

StatusBadge.propTypes = { status: PropTypes.string };

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// ── Main component ─────────────────────────────────────────────────────────────

const BtpServiceInstancesPage = () => {
  const { accountId, subaccountId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Subaccount metadata passed via navigation state
  const subaccount = location.state?.subaccount ?? { id: subaccountId, displayName: subaccountId };
  const btpAccountName = location.state?.btpAccountName ?? "";

  const [instances, setInstances] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cfgRes, instRes] = await Promise.all([
        getSmConfig(accountId, subaccountId),
        getSmInstances(accountId, subaccountId),
      ]);
      setConfig(cfgRes.data);
      setInstances(instRes.data ?? []);
    } catch (err) {
      setError(err.response?.data?.error ?? "Failed to load service instances.");
    } finally {
      setLoading(false);
    }
  }, [accountId, subaccountId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    if (!config) { setShowConfigModal(true); return; }
    setRefreshing(true);
    setSyncMsg("");
    setError("");
    try {
      const res = await refreshSmInstances(accountId, subaccountId);
      setSyncMsg(`Synced ${res.data.count} instance(s).`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.error ?? "Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-[#94A3B8] hover:text-[#0070F2] rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl border border-[#0070F2]/30 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-[#0070F2]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0F172A] dark:text-white">
              Service Instances
            </h1>
            <p className="text-xs text-[#94A3B8]">
              {subaccount.displayName ?? subaccount.name ?? subaccountId}
              {btpAccountName && ` · ${btpAccountName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#475569] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#1a2744] hover:border-[#0070F2] hover:text-[#0070F2] rounded-xl transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            {config ? "Update Credentials" : "Configure SM"}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0070F2] border border-[#0070F2] hover:border-[#0057c2] hover:text-[#0057c2] disabled:opacity-60 rounded-xl transition-colors"
          >
            {refreshing
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing…</>
              : <><RefreshCw className="w-3.5 h-3.5" /> Refresh</>}
          </button>
        </div>
      </div>

      {/* Status / last sync */}
      {config && (
        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <Clock className="w-3.5 h-3.5" />
          {config.lastSyncedAt
            ? <>Last synced: {new Date(config.lastSyncedAt).toLocaleString()}</>
            : "Not yet synced — click Refresh to discover instances."}
          {config.syncStatus === "failed" && (
            <span className="ml-2 text-red-500 font-semibold">· Last sync failed: {config.syncError}</span>
          )}
        </div>
      )}

      {/* Messages */}
      {syncMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{syncMsg}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* No credentials configured */}
      {!loading && !config && (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-12 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] flex items-center justify-center">
            <Settings2 className="w-6 h-6 text-[#94A3B8]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-[#0F172A] dark:text-white">Service Manager not configured</p>
            <p className="text-xs text-[#94A3B8] mt-1">
              Add your Service Manager credentials to discover service instances in this subaccount.
            </p>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0070F2] border border-[#0070F2] hover:border-[#0057c2] hover:text-[#0057c2] rounded-xl transition-colors"
          >
            <Settings2 className="w-4 h-4" /> Configure Service Manager
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-[#0070F2] animate-spin" />
        </div>
      )}

      {/* Empty state after sync */}
      {!loading && config && instances.length === 0 && (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-12 flex flex-col items-center gap-3">
          <Package className="w-8 h-8 text-[#94A3B8]" />
          <p className="text-sm font-bold text-[#0F172A] dark:text-white">No service instances found</p>
          <p className="text-xs text-[#94A3B8]">
            {config.lastSyncedAt
              ? "No instances were discovered in the last sync."
              : "Click Refresh to discover service instances."}
          </p>
        </div>
      )}

      {/* Instance table */}
      {!loading && instances.length > 0 && (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#475569] dark:text-[#94A3B8]">
              {instances.length} Service Instance{instances.length !== 1 ? "s" : ""}
            </h2>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-[#1a2744] text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Instance Name</th>
                  <th className="px-5 py-3 text-left">Service Offering</th>
                  <th className="px-5 py-3 text-left">Service Plan</th>
                  <th className="px-5 py-3 text-left">Platform</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Created</th>
                  <th className="px-5 py-3 text-left">Last Synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1a2744]">
                {instances.map((inst) => (
                  <tr
                    key={inst.id}
                    className="hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg border border-[#0070F2]/20 flex items-center justify-center shrink-0">
                          <Database className="w-3.5 h-3.5 text-[#0070F2]" />
                        </div>
                        <span className="font-semibold text-[#0F172A] dark:text-white">{inst.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] dark:text-[#94A3B8]">
                      {inst.serviceOfferingName ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-[#475569] dark:text-[#94A3B8]">
                      {inst.servicePlanName ?? "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      {inst.platformType ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                          <Server className="w-3 h-3" />
                          {inst.platformType}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={inst.status} />
                    </td>
                    <td className="px-5 py-3.5 text-[#94A3B8] text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {fmt(inst.createdAtSm)}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#94A3B8] text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {fmt(inst.lastSyncedAt)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-[#E2E8F0] dark:divide-[#1a2744]">
            {instances.map((inst) => (
              <div key={inst.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg border border-[#0070F2]/20 flex items-center justify-center shrink-0">
                      <Database className="w-3.5 h-3.5 text-[#0070F2]" />
                    </div>
                    <span className="font-semibold text-sm text-[#0F172A] dark:text-white">{inst.name}</span>
                  </div>
                  <StatusBadge status={inst.status} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#94A3B8] pl-9">
                  <span><span className="font-semibold">Offering:</span> {inst.serviceOfferingName ?? "—"}</span>
                  <span><span className="font-semibold">Plan:</span> {inst.servicePlanName ?? "—"}</span>
                  <span><span className="font-semibold">Platform:</span> {inst.platformType ?? "—"}</span>
                  <span><span className="font-semibold">Created:</span> {fmt(inst.createdAtSm)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SM config modal */}
      {showConfigModal && (
        <BtpServiceManagerModal
          btpAccountId={accountId}
          subaccount={subaccount}
          onClose={() => setShowConfigModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
};

export default BtpServiceInstancesPage;
