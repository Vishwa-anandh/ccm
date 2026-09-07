import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import api from "../api";
import {
  Users,
  UserCheck,
  UserMinus,
  Search,
  Shield,
  Filter,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sortMembers } from "../utils/formatters";

/* ── Toggle Checkbox ─────────────────────────────────────────────────────── */
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
    } ${checked ? "bg-gray-700 dark:bg-gray-400" : "bg-gray-200 dark:bg-gray-700"}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? "translate-x-4" : "translate-x-0"
      }`}
    />
  </button>
);

/* ── Status Badge ────────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) =>
  status === "active" ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Inactive
    </span>
  );

/* ── Section header inside table ─────────────────────────────────────────── */
const ColGroup = ({ color, label, icon }) => (
  <div
    className={`flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-wider ${color}`}
  >
    {icon}
    {label}
  </div>
);

const LABEL = "text-[9px] font-bold text-gray-400";

/* ── View Cell ───────────────────────────────────────────────────────────── */
const ViewCell = ({ isPrivileged, checked, onToggle }) => {
  let label = "Off";
  if (isPrivileged) label = "Always On";
  else if (checked) label = "On";
  return (
    <td className="px-5 py-4 text-center border-l border-gray-50 dark:border-gray-900">
      <div className="flex flex-col items-center gap-1">
        <Toggle
          checked={isPrivileged || checked}
          disabled={isPrivileged}
          onChange={onToggle}
        />
        <span className={LABEL}>{label}</span>
      </div>
    </td>
  );
};
ViewCell.propTypes = {
  isPrivileged: PropTypes.bool.isRequired,
  checked: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

/* ── Access Cell ─────────────────────────────────────────────────────────── */
const AccessCell = ({ isPrivileged, canView, readOnly, onToggle }) => {
  const isFullAccess = isPrivileged || !readOnly;
  const accessLabel = isFullAccess ? "Full" : "Read Only";
  if (!isPrivileged && !canView) {
    return (
      <td className="px-5 py-4 text-center border-l border-gray-50 dark:border-gray-900">
        <span className="text-gray-300 dark:text-gray-700 text-lg">—</span>
      </td>
    );
  }
  return (
    <td className="px-5 py-4 text-center border-l border-gray-50 dark:border-gray-900">
      <div className="flex flex-col items-center gap-1">
        <Toggle
          checked={isFullAccess}
          disabled={isPrivileged}
          onChange={onToggle}
        />
        <span className={LABEL}>{accessLabel}</span>
      </div>
    </td>
  );
};
AccessCell.propTypes = {
  isPrivileged: PropTypes.bool.isRequired,
  canView: PropTypes.bool.isRequired,
  readOnly: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

/* ── Main Component ──────────────────────────────────────────────────────── */
const UserManagement = () => {
  const { user: currentUser, cloudAccess, invoiceOnly } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 10;
  const observerRef = useRef(null);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchMembers = useCallback(
    async (pg = page) => {
      try {
        if (pg === 1) setLoading(true);
        else setLoadingMore(true);
        const res = await api.get(
          `/users/members?page=${pg}&pageSize=${PAGE_SIZE}`,
        );
        const newMembers = res.data.members ?? [];
        if (pg === 1) {
          setMembers(newMembers);
        } else {
          setMembers((prev) => {
            const ids = new Set(prev.map((m) => m.userId));
            return [...prev, ...newMembers.filter((m) => !ids.has(m.userId))];
          });
        }
        setTotal(res.data.total ?? 0);
        setError("");
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load members");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [page],
  );

  useEffect(() => {
    fetchMembers(page);
  }, [page]);

  useEffect(() => {
    if (loading || loadingMore || page >= totalPages) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setPage((p) => p + 1);
      },
      { threshold: 1.0 },
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages]);

  const updatePermissions = async (userId, updates) => {
    const prev = [...members];
    setMembers(
      members.map((m) => (m.userId === userId ? { ...m, ...updates } : m)),
    );
    try {
      await api.post("/users/update-permissions", { userId, ...updates });
    } catch {
      setMembers(prev);
      alert("Failed to update user permissions");
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const prev = [...members];
    setMembers(
      members.map((m) =>
        m.userId === userId ? { ...m, status: newStatus } : m,
      ),
    );
    try {
      await api.post("/users/toggle-status", { userId, status: newStatus });
    } catch {
      setMembers(prev);
      alert("Failed to update user status");
    }
  };

  // Derive visible columns from subscription cloudAccess array (source of truth)
  const hasCloudConfig = cloudAccess.length > 0;
  const showAzure = hasCloudConfig ? cloudAccess.includes("azure") : false;
  const showAws = hasCloudConfig ? cloudAccess.includes("aws") : false;
  const showBtp = hasCloudConfig ? cloudAccess.includes("btp") : false;
  const showGcp = hasCloudConfig ? cloudAccess.includes("gcp") : false;
  const showInvoice = invoiceOnly || false;
  // Label for the active-columns info banner
  const activeProviderLabels = [
    showAzure && "Azure",
    showAws && "AWS",
    showBtp && "SAP BTP",
    showGcp && "GCP",
    showInvoice && "Invoice",
  ].filter(Boolean);

  const sortedMembers = sortMembers(
    members.filter(
      (m) =>
        (m.fullName || "")
          .toLowerCase()
          .includes((searchTerm || "").toLowerCase()) ||
        (m.email || "")
          .toLowerCase()
          .includes((searchTerm || "").toLowerCase()),
    ),
    currentUser,
  );

  if (loading && page === 1 && members.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 xl:p-8 w-full animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl">
              <Users className="w-5 h-5 text-brand-600" />
            </div>
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
            Manage your organization&apos;s members and their access.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all w-60"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 text-sm font-semibold text-center">
          {error}
        </div>
      )}

      {activeProviderLabels.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl w-fit">
          <Filter className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
            Showing: {activeProviderLabels.join(" · ")}
          </span>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              {/* Cloud group header row */}
              <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-900">
                <th className="px-5 py-3" />
                {showAzure && (
                  <th
                    colSpan={2}
                    className="px-5 py-3 text-center border-l border-gray-100 dark:border-gray-900"
                  >
                    <ColGroup
                      label="Azure"
                      color="text-blue-600 dark:text-blue-400"
                      icon={
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      }
                    />
                  </th>
                )}
                {showAws && (
                  <th
                    colSpan={2}
                    className="px-5 py-3 text-center border-l border-gray-100 dark:border-gray-900"
                  >
                    <ColGroup
                      label="AWS"
                      color="text-orange-600 dark:text-orange-400"
                      icon={
                        <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                      }
                    />
                  </th>
                )}
                {showBtp && (
                  <th
                    colSpan={2}
                    className="px-5 py-3 text-center border-l border-gray-100 dark:border-gray-900"
                  >
                    <ColGroup
                      label="SAP BTP"
                      color="text-emerald-600 dark:text-emerald-400"
                      icon={
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      }
                    />
                  </th>
                )}
                {showGcp && (
                  <th
                    colSpan={2}
                    className="px-5 py-3 text-center border-l border-gray-100 dark:border-gray-900"
                  >
                    <ColGroup
                      label="GCP"
                      color="text-brand-600 dark:text-brand-400"
                      icon={
                        <span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />
                      }
                    />
                  </th>
                )}
                {showInvoice && (
                  <th
                    colSpan={1}
                    className="px-5 py-3 text-center border-l border-gray-100 dark:border-gray-900"
                  >
                    <ColGroup
                      label="Invoice"
                      color="text-violet-600 dark:text-violet-400"
                      icon={
                        <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                      }
                    />
                  </th>
                )}
                <th className="px-5 py-3 border-l border-gray-100 dark:border-gray-900" />
              </tr>

              {/* Column label row */}
              <tr className="bg-gray-50/80 dark:bg-gray-900/40 border-b border-gray-100 dark:border-gray-900 text-xs font-bold tracking-wider text-gray-400 dark:text-gray-500">
                <th className="px-5 py-2.5 text-left">User</th>
                {showAzure && (
                  <>
                    <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                      View
                    </th>
                    <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                      Full Access
                    </th>
                  </>
                )}
                {showAws && (
                  <>
                    <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                      View
                    </th>
                    <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                      Full Access
                    </th>
                  </>
                )}
                {showBtp && (
                  <>
                    <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                      View
                    </th>
                    <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                      Full Access
                    </th>
                  </>
                )}
                {showGcp && (
                  <>
                    <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                      View
                    </th>
                    <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                      Full Access
                    </th>
                  </>
                )}
                {showInvoice && (
                  <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                    View
                  </th>
                )}
                <th className="px-5 py-2.5 text-center border-l border-gray-100 dark:border-gray-900">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50 dark:divide-gray-900">
              {sortedMembers.map((member) => {
                const isPrivileged =
                  member.role === "admin" || member.role === "owner";
                const isSelf = member.userId === currentUser?.id;

                return (
                  <tr
                    key={member.userId}
                    className="hover:bg-gray-50/70 dark:hover:bg-gray-900/30 transition-colors group"
                  >
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm shrink-0">
                          {member.fullName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {member.fullName}
                            </p>
                            {isPrivileged && (
                              <Shield
                                className="w-3 h-3 text-brand-500 shrink-0"
                                title="Administrator"
                              />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {member.email}
                          </p>
                          <span
                            className={`mt-0.5 inline-block text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded  ${
                              isPrivileged
                                ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Azure View */}
                    {showAzure && (
                      <ViewCell
                        isPrivileged={isPrivileged}
                        checked={!!member.canViewAzure}
                        onToggle={(val) =>
                          updatePermissions(member.userId, {
                            canViewAzure: val,
                          })
                        }
                      />
                    )}

                    {/* Azure Full Access */}
                    {showAzure && (
                      <AccessCell
                        isPrivileged={isPrivileged}
                        canView={!!member.canViewAzure}
                        readOnly={!!member.azureReadOnly}
                        onToggle={(val) =>
                          updatePermissions(member.userId, {
                            azureReadOnly: !val,
                          })
                        }
                      />
                    )}

                    {/* AWS View */}
                    {showAws && (
                      <ViewCell
                        isPrivileged={isPrivileged}
                        checked={!!member.canViewAws}
                        onToggle={(val) =>
                          updatePermissions(member.userId, { canViewAws: val })
                        }
                      />
                    )}

                    {/* AWS Full Access */}
                    {showAws && (
                      <AccessCell
                        isPrivileged={isPrivileged}
                        canView={!!member.canViewAws}
                        readOnly={!!member.awsReadOnly}
                        onToggle={(val) =>
                          updatePermissions(member.userId, {
                            awsReadOnly: !val,
                          })
                        }
                      />
                    )}

                    {/* BTP View */}
                    {showBtp && (
                      <ViewCell
                        isPrivileged={isPrivileged}
                        checked={member.canViewBtp !== false}
                        onToggle={(val) =>
                          updatePermissions(member.userId, { canViewBtp: val })
                        }
                      />
                    )}

                    {/* BTP Full Access */}
                    {showBtp && (
                      <AccessCell
                        isPrivileged={isPrivileged}
                        canView={member.canViewBtp !== false}
                        readOnly={!!member.btpReadOnly}
                        onToggle={(val) =>
                          updatePermissions(member.userId, {
                            btpReadOnly: !val,
                          })
                        }
                      />
                    )}

                    {/* GCP View */}
                    {showGcp && (
                      <ViewCell
                        isPrivileged={isPrivileged}
                        checked={!!member.canViewGcp}
                        onToggle={(val) =>
                          updatePermissions(member.userId, { canViewGcp: val })
                        }
                      />
                    )}

                    {/* GCP Full Access */}
                    {showGcp && (
                      <AccessCell
                        isPrivileged={isPrivileged}
                        canView={!!member.canViewGcp}
                        readOnly={!!member.gcpReadOnly}
                        onToggle={(val) =>
                          updatePermissions(member.userId, {
                            gcpReadOnly: !val,
                          })
                        }
                      />
                    )}

                    {/* Invoice Access */}
                    {showInvoice && (
                      <ViewCell
                        isPrivileged={isPrivileged}
                        checked={true}
                        onToggle={() => {}}
                      />
                    )}

                    {/* Actions */}
                    <td className="px-5 py-4 border-l border-gray-50 dark:border-gray-900">
                      <div className="flex flex-col items-center gap-2">
                        <StatusBadge status={member.status} />
                        <button
                          onClick={() =>
                            toggleStatus(member.userId, member.status)
                          }
                          disabled={isSelf}
                          title={
                            isSelf
                              ? "Cannot deactivate yourself"
                              : member.status === "active"
                                ? "Deactivate user"
                                : "Activate user"
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            isSelf
                              ? "opacity-30 cursor-not-allowed border-gray-200 text-gray-400"
                              : member.status === "active"
                                ? "border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-900/30 dark:hover:bg-emerald-900/20"
                          }`}
                        >
                          {member.status === "active" ? (
                            <>
                              <UserMinus className="w-3 h-3" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" /> Activate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedMembers.length === 0 && !loading && (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-200 dark:text-gray-800 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              No members found matching your search.
            </p>
          </div>
        )}

        {page < totalPages && (
          <div
            ref={observerRef}
            className="flex justify-center py-5 border-t border-gray-100 dark:border-gray-900"
          >
            {loadingMore && (
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        )}
      </div>

      {/* Member count footer */}
      <p className="mt-3 text-xs text-gray-400 text-right">
        Showing {sortedMembers.length} of {total} member{total !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default UserManagement;
