import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  CreditCard,
  ChevronRight,
  X,
  Lock,
  Eye,
  EyeOff,
  Pencil,
  Check,
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../components/ConfirmDialog";
import { fireToast } from "../../components/ToastProvider";

const AccountManager = ({ onSelectAccount, onBack }) => {
  const { user } = useAuth();
  const isReadOnly =
    user?.role !== "admin" && user?.role !== "owner" && user?.azureReadOnly;
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    tenantId: "",
    clientId: "",
    clientSecret: "",
    subscriptionId: "",
  });
  const [selectedDetailsAccount, setSelectedDetailsAccount] = useState(null);
  const [maxAccounts, setMaxAccounts] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef(null);
  const fetchAccounts = async (force = false) => {
    try {
      if (!force) {
        const cached = sessionStorage.getItem("azure_accounts");
        if (cached) {
          setAccounts(JSON.parse(cached));
          setLoading(false);
        }
      }

      setLoading(true);
      const response = await api.get("/azure/accounts");
      setAccounts(response.data);
      sessionStorage.setItem("azure_accounts", JSON.stringify(response.data));
    } catch (err) {
      console.error("Failed to fetch Azure accounts:", err);
      if (accounts.length === 0) {
        fireToast(
          "Failed to load accounts. Please check your connection.",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAccounts();
    api
      .get("/subscriptions/current")
      .then((r) => {
        setMaxAccounts(r.data?.max_azure_accounts ?? 3);
      })
      .catch(() => {});
  }, []);

  const handleAddAccount = async (e) => {
    e.preventDefault();

    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (!uuidRegex.test(newAccount.tenantId)) {
      fireToast(
        "Invalid Tenant ID — must be a valid UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).",
        "error",
      );
      return;
    }
    if (!uuidRegex.test(newAccount.clientId)) {
      fireToast("Invalid Client (App) ID — must be a valid UUID.", "error");
      return;
    }
    if (!uuidRegex.test(newAccount.subscriptionId)) {
      fireToast("Invalid Subscription ID — must be a valid UUID.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/azure/accounts", newAccount);
      localStorage.removeItem("ccm_azure_summary");
      setNewAccount({
        name: "",
        tenantId: "",
        clientId: "",
        clientSecret: "",
        subscriptionId: "",
      });
      fireToast("Azure account connected successfully.", "success");
      fetchAccounts();
    } catch (err) {
      const msg =
        err.response?.data?.error ?? err.message ?? "Failed to add account.";
      fireToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirm = useConfirm();
  const handleDeleteAccount = async (id, e) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete Account?",
      message:
        "This will remove the Azure account and all its cost data. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "delete",
    });
    if (!ok) return;
    try {
      await api.delete(`/azure/accounts/${id}`);
      localStorage.removeItem("ccm_azure_summary");
      fetchAccounts();
    } catch (err) {
      fireToast(
        err.response?.data?.error ?? "Failed to remove account.",
        "error",
      );
    }
  };

  const startEdit = (acc, e) => {
    e.stopPropagation();
    setEditingId(acc.id);
    setEditingName(acc.name);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleRename = async (id) => {
    const trimmed = editingName.trim();
    if (!trimmed) { setEditingId(null); return; }
    try {
      await api.patch(`/azure/accounts/${id}/name`, { name: trimmed });
      setAccounts(accounts.map(a => a.id === id ? { ...a, name: trimmed } : a));
      sessionStorage.removeItem("azure_accounts");
      fireToast("Account renamed.", "success");
    } catch {
      fireToast("Failed to rename account.", "error");
    } finally {
      setEditingId(null);
    }
  };

  const atLimit = maxAccounts > 0 && accounts.length >= maxAccounts;

  const renderFormSection = () => {
    if (isReadOnly) {
      return (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-8 text-center">
          <div className="w-12 h-12 border border-amber-200 dark:border-amber-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-[#0F172A] dark:text-white">
            Read-Only Mode
          </p>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-xs mx-auto">
            Contact your administrator to add or remove Azure subscriptions.
          </p>
        </div>
      );
    }
    if (atLimit) {
      return (
        <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 p-5 flex items-start gap-3">
          <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">
              Account limit reached
            </p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
              Your plan allows {maxAccounts} Azure account
              {maxAccounts !== 1 ? "s" : ""}. Upgrade your subscription to
              connect more.
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] tracking-wider">
                Add New Account
              </h2>
            </div>
            {maxAccounts > 0 && (
              <span className="text-[10px] text-[#94A3B8]">
                {accounts.length} of {maxAccounts} used
              </span>
            )}
          </div>
        </div>
        <form onSubmit={handleAddAccount} className="p-5 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
            <svg
              className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                Azure Cost data syncs automatically
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Once connected, subscription costs, resource groups, and service
                breakdown pull within a few minutes. Refreshes every hour.
              </p>
            </div>
          </div>
          <div>
            <label
              htmlFor="az-name"
              className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5"
            >
              Display Name
            </label>
            <input
              id="az-name"
              required
              type="text"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm"
              value={newAccount.name}
              onChange={(e) =>
                setNewAccount({ ...newAccount, name: e.target.value })
              }
              placeholder="e.g. Production Environment"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="az-sub"
                className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5"
              >
                Subscription ID
              </label>
              <input
                id="az-sub"
                required
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm font-mono placeholder:font-sans"
                value={newAccount.subscriptionId}
                onChange={(e) =>
                  setNewAccount({
                    ...newAccount,
                    subscriptionId: e.target.value,
                  })
                }
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
            <div>
              <label
                htmlFor="az-tenant"
                className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5"
              >
                Directory (Tenant) ID
              </label>
              <input
                id="az-tenant"
                required
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm font-mono placeholder:font-sans"
                value={newAccount.tenantId}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, tenantId: e.target.value })
                }
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="az-client"
                className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5"
              >
                Client (App) ID
              </label>
              <input
                id="az-client"
                required
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm font-mono placeholder:font-sans"
                value={newAccount.clientId}
                onChange={(e) =>
                  setNewAccount({ ...newAccount, clientId: e.target.value })
                }
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
            <div>
              <label
                htmlFor="az-secret"
                className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5"
              >
                Client Secret
              </label>
              <div className="relative">
                <input
                  id="az-secret"
                  required
                  type={showSecret ? "text" : "password"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all text-sm"
                  value={newAccount.clientSecret}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      clientSecret: e.target.value,
                    })
                  }
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                >
                  {showSecret ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 border border-blue-400 dark:border-blue-600 hover:border-blue-600 disabled:opacity-60 rounded-xl transition-colors"
            >
              {isSubmitting ? (
                "Connecting…"
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Connect Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744] transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        )}
        <div className="w-10 h-10 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">
            Azure Account Manager
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Connect your Azure subscriptions for cost monitoring
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {maxAccounts !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                accounts.length >= maxAccounts && maxAccounts > 0
                  ? "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400"
                  : "border-[#E2E8F0] dark:border-[#1a2744] text-[#475569] dark:text-[#94A3B8]"
              }`}
            >
              {accounts.length}/{maxAccounts === 0 ? "∞" : maxAccounts} accounts
            </div>
          )}
          {isReadOnly && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" /> Read-Only
            </div>
          )}
        </div>
      </div>

      {/* Connected accounts list */}
      {loading ? (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744]"
            >
              <div className="h-4 w-48 rounded-lg bg-[#F1F5F9] dark:bg-[#1a2744] animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        accounts.length > 0 && (
          <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744]">
              <h2 className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] tracking-wider">
                Connected Accounts
              </h2>
            </div>
            <div className="divide-y divide-[#E2E8F0] dark:divide-[#1a2744]">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] transition-colors"
                >
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={() => editingId !== acc.id && onSelectAccount(acc)}
                    style={{ cursor: editingId === acc.id ? "default" : "pointer" }}
                  >
                    <div className="w-9 h-9 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {editingId === acc.id ? (
                        <input
                          ref={editInputRef}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(acc.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-sm font-bold px-2 py-0.5 rounded-lg border border-blue-400 dark:border-blue-600 bg-white dark:bg-[#121A2F] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      ) : (
                        <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                          {acc.name}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-xs text-[#94A3B8] font-mono">
                          Sub: {acc.subscriptionId.slice(0, 8)}…
                          {acc.subscriptionId.slice(-4)}
                        </span>
                        <span className="text-[#CBD5E1]">·</span>
                        <span className="text-xs text-[#94A3B8] font-mono">
                          Tenant: {acc.tenantId.slice(0, 8)}…
                          {acc.tenantId.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    {editingId === acc.id ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRename(acc.id); }}
                        className="p-2 text-emerald-500 hover:text-emerald-600 rounded-xl transition-colors"
                        title="Save Name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      !isReadOnly && (
                        <button
                          onClick={(e) => startEdit(acc, e)}
                          className="p-2 text-[#94A3B8] hover:text-blue-500 rounded-xl transition-colors"
                          title="Rename Account"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetailsAccount(acc);
                      }}
                      className="p-2 text-[#94A3B8] hover:text-blue-500 rounded-xl transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!isReadOnly && (
                      <button
                        onClick={(e) => handleDeleteAccount(acc.id, e)}
                        className="p-2 text-[#94A3B8] hover:text-red-500 rounded-xl transition-colors"
                        title="Remove Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Add account form / empty state */}
      {renderFormSection()}

      {/* Details Modal */}
      {selectedDetailsAccount && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedDetailsAccount(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl p-8 relative animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedDetailsAccount(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-brand-600" />
                Account Details
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {selectedDetailsAccount.name}
              </p>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <label className="block text-[10px] font-bold text-gray-400tracking-wider mb-1">
                  Subscription ID
                </label>
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                  {selectedDetailsAccount.subscriptionId}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <label className="block text-[10px] font-bold text-gray-400tracking-wider mb-1">
                  Tenant ID
                </label>
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                  {selectedDetailsAccount.tenantId}
                </div>
              </div>
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <label className="block text-[10px] font-bold text-gray-400tracking-wider mb-1">
                  Client ID
                </label>
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                  {selectedDetailsAccount.clientId}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
