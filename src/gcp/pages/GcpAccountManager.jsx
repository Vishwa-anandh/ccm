import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Info,
  Shield,
} from "lucide-react";
import { GcpAccountContext } from "../context/GcpAccountContext";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../components/ConfirmDialog";
import PropTypes from "prop-types";

const GCP_PRIMARY = "#3b82f6";

function GcpIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M17.6 11.8c0-.1 0-.2-.1-.3l-2.1-3.6c-.1-.2-.3-.3-.5-.3H9.1c-.2 0-.4.1-.5.3L6.5 11.5c-.1.1-.1.2-.1.3s0 .2.1.3l2.1 3.6c.1.2.3.3.5.3h5.8c.2 0 .4-.1.5-.3l2.1-3.6c.1-.1.1-.2.1-.3z"
        fill={GCP_PRIMARY}
      />
      <circle cx="12" cy="12" r="2.2" fill="white" />
      <circle cx="12" cy="12" r="1" fill={GCP_PRIMARY} />
    </svg>
  );
}
GcpIcon.propTypes = { size: PropTypes.number };

const GcpAccountManager = () => {
  const { accounts, addAccount, removeAccount } = useContext(GcpAccountContext);
  const { user } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const isReadOnly =
    user?.role !== "admin" && user?.role !== "owner" && user?.gcpReadOnly;

  const emptyForm = { name: "", projectId: "", serviceAccountJson: "" };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Account name is required";
    if (!form.projectId.trim()) e.projectId = "Project ID is required";
    if (!form.serviceAccountJson.trim()) {
      e.serviceAccountJson = "Service Account JSON is required";
    } else {
      try {
        const parsed = JSON.parse(form.serviceAccountJson);
        if (!parsed.client_email || !parsed.private_key) {
          e.serviceAccountJson =
            "JSON must contain client_email and private_key";
        }
      } catch {
        e.serviceAccountJson = "Must be valid JSON";
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      await addAccount(form);
      setForm(emptyForm);
      setSuccess("GCP account added successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setErrors({
        general:
          err.response?.data?.error ??
          "Failed to add account. Check your credentials.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: "Remove account?",
      message: `"${name}" will be removed and its cost data deleted.`,
      confirmLabel: "Remove",
      variant: "danger",
    });
    if (ok) removeAccount(id);
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 xl:p-8 space-y-3 sm:space-y-5 lg:space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-2xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
          <GcpIcon size={20} />
        </div>
        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-[#0F172A] dark:text-white">
            GCP Account Manager
          </h1>
          <p className="text-xs text-[#94A3B8]">
            Connect your Google Cloud projects for cost monitoring
          </p>
        </div>
      </div>

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
          <div className="px-3 py-2.5 sm:px-5 sm:py-4 border-b border-[#E2E8F0] dark:border-[#1a2744] flex items-center justify-between">
            <h2 className="text-xs font-bold text-[#94A3B8] tracking-wider ">
              Connected Projects
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
              {accounts.length}
            </span>
          </div>
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#1a2744]">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between px-3 py-2.5 sm:px-5 sm:py-4 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-colors group"
              >
                <button
                  type="button"
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 text-left bg-transparent border-0 p-0"
                  onClick={() => navigate(`/gcp/account/${acc.id}`)}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50 shrink-0">
                    <GcpIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {acc.name}
                    </p>
                    <p className="text-xs text-[#94A3B8] truncate">
                      {acc.projectId ?? "Google Cloud Project"}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => navigate(`/gcp/account/${acc.id}`)}
                    className="p-1.5 rounded-lg text-[#CBD5E1] hover:text-blue-500 transition-colors"
                    title="View costs"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDelete(acc.id, acc.name)}
                      className="p-1.5 rounded-lg text-[#CBD5E1] hover:text-red-500 transition-colors"
                      title="Remove account"
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

      {/* Add account form */}
      {!isReadOnly && (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744] bg-gradient-to-r from-blue-50/40 to-transparent dark:from-blue-950/20">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">
                Connect New Project
              </h2>
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-3 sm:p-5 space-y-3 sm:space-y-4"
          >
            {/* Setup instructions */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-0.5">
                  Setup instructions
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  In GCP Console → IAM &amp; Admin → Service Accounts, create a
                  service account and grant it the{" "}
                  <strong>Billing Account Viewer</strong> role. Download the
                  JSON key and paste it below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Credentials are encrypted with AES-256 before storage
              </p>
            </div>

            {errors.general && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {errors.general}
                </p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {success}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldInput
                label="Display Name"
                placeholder="My GCP Project"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                error={errors.name}
                help="A friendly name for this project in the dashboard."
              />
              <FieldInput
                label="Project ID"
                placeholder="my-project-123456"
                value={form.projectId}
                onChange={(v) => setForm({ ...form, projectId: v })}
                error={errors.projectId}
                help="The GCP project ID (not the project number)."
              />
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5">
                  Service Account JSON Key
                </label>
                <textarea
                  rows={7}
                  value={form.serviceAccountJson}
                  onChange={(e) =>
                    setForm({ ...form, serviceAccountJson: e.target.value })
                  }
                  placeholder={
                    '{\n  "type": "service_account",\n  "project_id": "...",\n  "client_email": "...",\n  "private_key": "..."\n}'
                  }
                  className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 transition-colors resize-none ${errors.serviceAccountJson ? "border-red-400 focus:ring-red-300/40" : "border-[#E2E8F0] dark:border-[#1a2744] focus:ring-blue-500/30"}`}
                />
                {errors.serviceAccountJson && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.serviceAccountJson}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[#94A3B8]">
                  Paste the full downloaded JSON key file content.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 rounded-xl transition-all disabled:opacity-60 border border-blue-400 dark:border-blue-600 hover:border-blue-600 hover:-translate-y-0.5 disabled:translate-y-0"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Connecting…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Connect Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {isReadOnly && accounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
            <GcpIcon size={24} />
          </div>
          <p className="text-sm font-semibold text-[#0F172A] dark:text-white">
            No GCP projects connected
          </p>
          <p className="text-xs text-[#94A3B8] max-w-xs">
            Contact your administrator to connect a GCP project.
          </p>
        </div>
      )}
    </div>
  );
};

const FieldInput = ({ label, placeholder, value, onChange, error, help }) => (
  <div>
    <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors ${error ? "border-red-400" : "border-[#E2E8F0] dark:border-[#1a2744]"}`}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    {help && <p className="mt-1 text-[11px] text-[#94A3B8]">{help}</p>}
  </div>
);
FieldInput.propTypes = {
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  help: PropTypes.string,
};

export default GcpAccountManager;
