import React, { useEffect, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  Cpu,
} from "lucide-react";
import api from "../api";

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const duration = (started, completed) => {
  if (!started || !completed) return "—";
  const ms = new Date(completed) - new Date(started);
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
};

// ── sub-components ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    success: {
      icon: CheckCircle2,
      cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
      label: "Success",
    },
    failed: {
      icon: XCircle,
      cls: "text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400",
      label: "Failed",
    },
    running: {
      icon: Clock,
      cls: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
      label: "Running",
    },
  };
  const { icon: Icon, cls, label } = map[status] ?? map.running;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cls}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};
StatusBadge.propTypes = { status: PropTypes.string.isRequired };

const ProviderBadge = ({ provider }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide
        ${
          provider === "azure"
            ? "text-blue-700 dark:text-blue-400"
            : provider === "btp"
            ? "text-orange-600 dark:text-orange-400"
            : "text-orange-700 dark:text-orange-400"
        }`}
  >
    {provider}
  </span>
);
ProviderBadge.propTypes = { provider: PropTypes.string.isRequired };

const TriggeredBy = ({ value }) => {
  const isSystem = value === "system";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
      {isSystem ? (
        <>
          <Cpu className="w-3 h-3 text-gray-400" /> System
        </>
      ) : (
        <>
          <User className="w-3 h-3 text-brand-500" /> {value}
        </>
      )}
    </span>
  );
};
TriggeredBy.propTypes = { value: PropTypes.string.isRequired };

// ── page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "success", label: "Success" },
  { key: "failed", label: "Failed" },
  { key: "running", label: "Running" },
  { key: "azure", label: "Azure" },
  { key: "aws", label: "AWS" },
];

const SyncLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(
    async (pg = page, flt = filter, silent = false) => {
      if (pg === 1 && !silent) setLoading(true);
      if (silent) setRefreshing(true);
      try {
        const res = await api.get(
          `/sync-logs?page=${pg}&pageSize=${PAGE_SIZE}&filter=${flt}`,
        );
        const newLogs = res.data.logs ?? [];
        if (pg === 1) {
          setLogs(newLogs);
        } else {
          setLogs((prev) => [...prev, ...newLogs]);
        }
        setTotal(res.data.total ?? 0);
      } catch {
        // errors handled globally by axios interceptor
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, filter],
  );

  useEffect(() => {
    fetchLogs(page, filter);
  }, [page, filter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const observerRef = useRef(null);

  useEffect(() => {
    if (loading || refreshing || page >= totalPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 1.0 },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, refreshing, page, totalPages]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300 pb-20">
      <div className="w-full px-4 sm:px-6 xl:px-8 2xl:px-10 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Sync Audit Logs
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Every cloud data fetch — scheduled and user-triggered
            </p>
          </div>
          <button
            onClick={() => fetchLogs(page, filter, true)}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                if (filter !== f.key) {
                  setFilter(f.key);
                  setPage(1);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f.key
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-card">
          {loading ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="skeleton w-24 h-4 rounded" />
                  <div className="skeleton w-14 h-5 rounded-full" />
                  <div className="skeleton w-32 h-4 rounded" />
                  <div className="skeleton w-28 h-4 rounded ml-auto" />
                  <div className="skeleton w-16 h-5 rounded-full" />
                  <div className="skeleton w-12 h-4 rounded" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                No sync logs yet
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Logs appear after the first scheduled or user-triggered sync
              </p>
            </div>
          ) : (
            <>
              {/* Table head */}
              <div className="hidden sm:grid grid-cols-[1fr_80px_160px_180px_90px_80px] gap-4 px-5 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                {[
                  "Account",
                  "Provider",
                  "Triggered By",
                  "Started",
                  "Status",
                  "Duration",
                ].map((h) => (
                  <span
                    key={h}
                    className="text-[10px] font-bold  tracking-widest text-gray-400"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_80px_160px_180px_90px_80px] gap-2 sm:gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {log.account_name}
                      </p>
                      {log.error_message && (
                        <p
                          className="text-xs text-red-500 truncate mt-0.5"
                          title={log.error_message}
                        >
                          {log.error_message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <ProviderBadge provider={log.provider} />
                    </div>
                    <div className="flex items-center">
                      <TriggeredBy value={log.triggered_by} />
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {fmt(log.started_at)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <StatusBadge status={log.status} />
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {duration(log.started_at, log.completed_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Infinite Scroll Sentinel */}
              {page < totalPages && (
                <div ref={observerRef} className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncLogsPage;
