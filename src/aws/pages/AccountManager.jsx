import React, { useState, useContext, useRef } from "react";
import ReactDOM from "react-dom";
import { AccountContext } from "../context/AccountContext";
import { Trash2, Plus, Key, Lock, Eye, X, Pencil, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../components/ConfirmDialog";
import { fireToast } from "../../components/ToastProvider";

const AccountManager = () => {
  const { user } = useAuth();
  const isReadOnly =
    user?.role !== "admin" && user?.role !== "owner" && user?.awsReadOnly;
  const { accounts, addAccount, removeAccount, renameAccount } = useContext(AccountContext);
  const [name, setName] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDetailsAccount, setSelectedDetailsAccount] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef(null);
  const confirm = useConfirm();

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
      await renameAccount(id, trimmed);
      fireToast("Account renamed.", "success");
    } catch {
      fireToast("Failed to rename account.", "error");
    } finally {
      setEditingId(null);
    }
  };

  const handleRemoveAccount = async (id) => {
    const ok = await confirm({
      title: "Delete Account?",
      message:
        "This will remove the AWS account and all its cost data. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "delete",
    });
    if (!ok) return;
    removeAccount(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Front-end validation
    if (!/^(AKIA|ASIA)[A-Z0-9]{16}$/.test(accessKey)) {
      setError(
        "Invalid Access Key ID format. It should start with AKIA or ASIA and be 20 characters long.",
      );
      return;
    }
    if (secretKey.length < 40) {
      setError(
        "Invalid Secret Access Key format. It should be at least 40 characters long.",
      );
      return;
    }

    if (name && accessKey && secretKey) {
      try {
        setLoading(true);
        await addAccount({ name, accessKey, secretKey });
        setName("");
        setAccessKey("");
        setSecretKey("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-orange-200 dark:border-orange-800 flex items-center justify-center">
            <Key className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">
              AWS Account Manager
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Connect your AWS accounts for cost monitoring
            </p>
          </div>
        </div>
        <Link
          to="/aws"
          className="text-xs font-semibold text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 dark:border-red-800">
          <X className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Active Credentials */}
      {accounts.length > 0 && (
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
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl border border-orange-200 dark:border-orange-800 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4 text-orange-500" />
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
                        className="w-full text-sm font-bold px-2 py-0.5 rounded-lg border border-orange-400 dark:border-orange-600 bg-white dark:bg-[#121A2F] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      />
                    ) : (
                      <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate">
                        {acc.name}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-[#94A3B8] font-mono">
                        {`${acc.accessKey.slice(0, 4)}••••••••••••${acc.accessKey.slice(-4)}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
                        className="p-2 text-[#94A3B8] hover:text-orange-500 rounded-xl transition-colors"
                        title="Rename Account"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedDetailsAccount(acc); }}
                    className="p-2 text-[#94A3B8] hover:text-[#475569] dark:hover:text-white transition-colors rounded-xl"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleRemoveAccount(acc.id)}
                      className="p-2 text-[#94A3B8] hover:text-red-500 rounded-xl transition-colors shrink-0"
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
      )}

      {/* Add Account Form */}
      {isReadOnly ? (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] p-8 text-center">
          <div className="w-12 h-12 border border-amber-200 dark:border-amber-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-[#0F172A] dark:text-white">
            Read-Only Mode
          </p>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-xs mx-auto">
            Contact your administrator to add or remove AWS connections.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744]">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" />
              <h2 className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] tracking-wider">
                Add New Account
              </h2>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-3 p-3 rounded-xl border border-orange-200 dark:border-orange-800">
              <svg
                className="w-4 h-4 text-orange-500 mt-0.5 shrink-0"
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
                <p className="text-xs font-bold text-orange-700 dark:text-orange-300">
                  AWS Cost Explorer data syncs on demand
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
                  Once saved, EC2, S3, RDS, and Lambda costs will be fetched
                  live from Cost Explorer. Ensure Cost Explorer is enabled in
                  your AWS account.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all text-sm"
                  placeholder="e.g. Production AWS"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="aws-access-key"
                  className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5"
                >
                  Access Key ID
                </label>
                <input
                  id="aws-access-key"
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all text-sm font-mono"
                  placeholder="AKIA..."
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="aws-secret-key"
                  className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5"
                >
                  Secret Access Key
                </label>
                <input
                  id="aws-secret-key"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all text-sm font-mono"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-orange-600 dark:text-orange-400 border border-orange-400 dark:border-orange-600 hover:border-orange-600 disabled:opacity-60 rounded-xl transition-colors"
              >
                {loading ? (
                  "Saving…"
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Save Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Details Modal */}
      {selectedDetailsAccount && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedDetailsAccount(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl p-8 relative"
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
                <Key className="w-6 h-6 text-brand-600" />
                Account Details
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {selectedDetailsAccount.name}
              </p>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-1">
                  Access Key ID
                </label>
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                  {selectedDetailsAccount.accessKey}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AccountManager;
