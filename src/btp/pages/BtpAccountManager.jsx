import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
  Plus, Trash2, Server, Eye, EyeOff, AlertTriangle, CheckCircle,
  Database, Cloud, ChevronDown, ChevronUp, Settings2, RefreshCw,
  Package, ChevronRight, Loader2, Clock, Pencil, Check,
} from "lucide-react";
import { BtpAccountContext } from "../context/BtpAccountContext";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../components/ConfirmDialog";
import { getBtpCosts, getSmConfigs, refreshSmInstances } from "../../api/btpApi";
import BtpServiceManagerModal from "../components/BtpServiceManagerModal";

// ── Field definitions ─────────────────────────────────────────────────────────

const COST_API_FIELDS = [
  { name: "name",         label: "Account Name",          placeholder: "My BTP Global Account",                                    type: "text",     help: "A friendly display name for this BTP connection.", span: 2 },
  { name: "clientId",     label: "Client ID",             placeholder: "sb-ee941646-...!b634024|uas!b36585",                       type: "text",     help: "Service key → clientid",                           span: 1 },
  { name: "clientSecret", label: "Client Secret",         placeholder: "••••••••••••",                                             type: "password", help: "Service key → clientsecret. Encrypted at rest.",   span: 1 },
  { name: "tokenUrl",     label: "Token URL",             placeholder: "https://maitsys.authentication.eu10.hana.ondemand.com/oauth/token", type: "text", help: "Service key → uaa.url + /oauth/token",        span: 1, isTokenUrl: true },
  { name: "targetUrl",    label: "Reporting API Base URL", placeholder: "https://uas-reporting.cfapps.eu10.hana.ondemand.com",    type: "text",     help: "Service key → target_url",                         span: 1 },
];

const CIS_FIELDS = [
  { name: "cisClientId",     label: "CIS Client ID",        placeholder: "sb-0543b5e0-...!b634024|cis-central!b14",              type: "text",     help: "Service key → uaa.clientid",                         span: 1 },
  { name: "cisClientSecret", label: "CIS Client Secret",    placeholder: "••••••••••••",                                         type: "password", help: "Service key → uaa.clientsecret. Encrypted at rest.", span: 1 },
  { name: "cisTokenUrl",     label: "CIS Token URL",        placeholder: "https://maitsys.authentication.eu10.hana.ondemand.com/oauth/token", type: "text", help: "Service key → uaa.url + /oauth/token", span: 1, isTokenUrl: true },
  { name: "cisAccountsUrl",  label: "Accounts Service URL", placeholder: "https://accounts-service.cfapps.eu10.hana.ondemand.com", type: "text",   help: "Service key → endpoints.accounts_service_url",       span: 1 },
];

// ── Field renderer ────────────────────────────────────────────────────────────

const FormField = ({ field, value, onChange, onBlur, error, hint, showSecret, onToggleSecret }) => {
  const inputType = field.type === "password" ? (showSecret ? "text" : "password") : "text";
  return (
    <div className={field.span === 2 ? "md:col-span-2" : ""}>
      <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1.5">
        {field.label}
        {field.isTokenUrl && (
          <span className="ml-1.5 text-[10px] font-normal text-[#94A3B8]">
            — <code className="font-mono">/oauth/token</code> appended automatically
          </span>
        )}
      </label>
      {hint && <p className="mb-1 text-[11px] text-blue-500 dark:text-blue-400">{hint}</p>}
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          onBlur={onBlur}
          placeholder={field.placeholder}
          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#0070F2]/40 transition-colors ${error ? "border-red-400" : "border-[#E2E8F0] dark:border-[#1a2744]"}`}
        />
        {field.type === "password" && (
          <button type="button" onClick={onToggleSecret} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <p className="mt-1 text-[11px] text-[#94A3B8]">{field.help}</p>
    </div>
  );
};

FormField.propTypes = {
  field:          PropTypes.object.isRequired,
  value:          PropTypes.string.isRequired,
  onChange:       PropTypes.func.isRequired,
  onBlur:         PropTypes.func,
  error:          PropTypes.string,
  hint:           PropTypes.string,
  showSecret:     PropTypes.bool,
  onToggleSecret: PropTypes.func,
};

// ── Subaccount row (within an expanded account card) ──────────────────────────

const SubaccountRow = ({ btpAccountId, btpAccountName, subaccount, smConfig, isReadOnly, onConfigured }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal]       = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [refreshMsg, setRefreshMsg]     = useState("");

  const handleRefresh = async (e) => {
    e.stopPropagation();
    if (!smConfig) { setShowModal(true); return; }
    setRefreshing(true);
    setRefreshMsg("");
    try {
      const res = await refreshSmInstances(btpAccountId, subaccount.guid ?? subaccount.id);
      setRefreshMsg(`Synced ${res.data.count} instance(s)`);
      setTimeout(() => setRefreshMsg(""), 3500);
    } catch (err) {
      setRefreshMsg(err.response?.data?.error ?? "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const handleRowClick = () => {
    navigate(
      `/btp/account/${btpAccountId}/subaccount/${subaccount.guid ?? subaccount.id}/service-instances`,
      { state: { subaccount: { id: subaccount.guid ?? subaccount.id, displayName: subaccount.displayName ?? subaccount.name }, btpAccountName } }
    );
  };

  return (
    <>
      <div className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] transition-colors group">
        {/* Clickable name area */}
        <button
          type="button"
          onClick={handleRowClick}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left bg-transparent border-0 p-0"
        >
          <div className="w-7 h-7 rounded-lg border border-[#0070F2]/20 flex items-center justify-center shrink-0">
            <Package className="w-3.5 h-3.5 text-[#0070F2]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
              {subaccount.displayName ?? subaccount.name ?? subaccount.guid}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {subaccount.region && (
                <span className="text-[10px] text-[#94A3B8]">{subaccount.region}</span>
              )}
              {smConfig ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Settings2 className="w-2.5 h-2.5" /> SM Configured
                </span>
              ) : (
                <span className="text-[9px] text-[#94A3B8]">Service Manager not configured</span>
              )}
              {smConfig?.lastSyncedAt && (
                <span className="text-[9px] text-[#94A3B8] flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(smConfig.lastSyncedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#475569] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#1a2744] hover:border-[#0070F2] hover:text-[#0070F2] rounded-lg transition-colors"
              title="Configure Service Manager"
            >
              <Settings2 className="w-3 h-3" />
              Configure SM
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#0070F2] border border-[#0070F2] hover:border-[#0057c2] hover:text-[#0057c2] disabled:opacity-60 rounded-lg transition-colors"
              title="Refresh service instances"
            >
              {refreshing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Refresh
            </button>
          </div>
        )}
      </div>
      {refreshMsg && (
        <div className="px-5 pb-2">
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{refreshMsg}</p>
        </div>
      )}
      {showModal && (
        <BtpServiceManagerModal
          btpAccountId={btpAccountId}
          subaccount={{ id: subaccount.guid ?? subaccount.id, displayName: subaccount.displayName ?? subaccount.name, subdomain: subaccount.subdomain ?? null }}
          onClose={() => setShowModal(false)}
          onSaved={onConfigured}
        />
      )}
    </>
  );
};

SubaccountRow.propTypes = {
  btpAccountId:   PropTypes.string.isRequired,
  btpAccountName: PropTypes.string.isRequired,
  subaccount:     PropTypes.object.isRequired,
  smConfig:       PropTypes.object,
  isReadOnly:     PropTypes.bool,
  onConfigured:   PropTypes.func,
};

// ── Account row (in connected accounts list) ──────────────────────────────────

const AccountRow = ({ acc, isReadOnly, onDelete, onRename }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded]         = useState(false);
  const [editing, setEditing]           = useState(false);
  const [editName, setEditName]         = useState("");
  const editInputRef                    = useRef(null);
  const [subaccounts, setSubaccounts]   = useState([]);
  const [smConfigs, setSmConfigs]       = useState([]);
  const [loadingSubs, setLoadingSubs]   = useState(false);
  const [subsError, setSubsError]       = useState("");

  const loadSubaccountsAndConfigs = useCallback(async () => {
    setLoadingSubs(true);
    setSubsError("");
    try {
      const [costsRes, configsRes] = await Promise.all([
        getBtpCosts(acc.id),
        getSmConfigs(acc.id),
      ]);
      const hier = costsRes.data?.subaccountHierarchy ?? [];
      setSubaccounts(hier);
      setSmConfigs(configsRes.data ?? []);
    } catch {
      setSubsError("Failed to load subaccounts.");
    } finally {
      setLoadingSubs(false);
    }
  }, [acc.id]);

  const handleExpand = () => {
    if (!expanded) loadSubaccountsAndConfigs();
    setExpanded((v) => !v);
  };

  const startEdit = (e) => {
    e.stopPropagation();
    setEditName(acc.name);
    setEditing(true);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleRename = async () => {
    const trimmed = editName.trim();
    setEditing(false);
    if (!trimmed || trimmed === acc.name) return;
    await onRename(acc.id, trimmed);
  };

  const getSmConfig = (subId) => smConfigs.find((c) => c.subaccountId === subId) ?? null;

  return (
    <div>
      {/* Account header row */}
      <div className="flex items-center justify-between px-5 py-4 hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-[#0070F2]/30 flex items-center justify-center shrink-0"
            onClick={() => !editing && navigate(`/btp/account/${acc.id}`)}
          >
            <Server className="w-4 h-4 text-[#0070F2]" />
          </button>
          <div className="min-w-0 flex-1" onClick={() => !editing && navigate(`/btp/account/${acc.id}`)} style={{ cursor: editing ? "default" : "pointer" }}>
            {editing ? (
              <input
                ref={editInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setEditing(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-sm font-bold px-2 py-0.5 rounded-lg border border-[#0070F2] bg-white dark:bg-[#121A2F] text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0070F2]/30"
              />
            ) : (
              <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate">{acc.name}</p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-[#94A3B8] truncate">{acc.targetUrl ?? acc.region ?? "SAP BTP"}</p>
              {acc.hasCis && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400">
                  CIS
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRename(); }}
              className="p-2 text-emerald-500 hover:text-emerald-600 rounded-xl transition-colors"
              title="Save Name"
            >
              <Check className="w-4 h-4" />
            </button>
          ) : (
            !isReadOnly && (
              <button
                type="button"
                onClick={startEdit}
                className="p-2 text-[#94A3B8] hover:text-[#0070F2] rounded-xl transition-colors"
                title="Rename account"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )
          )}
          {acc.hasCis && (
            <button
              type="button"
              onClick={handleExpand}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#475569] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#1a2744] hover:border-[#0070F2] hover:text-[#0070F2] rounded-lg transition-colors"
              title="Show subaccounts"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Subaccounts
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={() => onDelete(acc.id, acc.name)}
              className="p-2 text-[#94A3B8] hover:text-red-500 rounded-xl transition-colors"
              title="Remove account"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Subaccounts panel */}
      {expanded && (
        <div className="border-t border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#080E1C]">
          {loadingSubs && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-[#0070F2] animate-spin" />
            </div>
          )}
          {subsError && (
            <div className="flex items-center gap-2 px-5 py-3 text-xs text-red-500">
              <AlertTriangle className="w-4 h-4" /> {subsError}
            </div>
          )}
          {!loadingSubs && !subsError && subaccounts.length === 0 && (
            <p className="px-8 py-4 text-xs text-[#94A3B8]">
              No subaccounts found. Cost data may not be synced yet.
            </p>
          )}
          {!loadingSubs && subaccounts.map((sub) => (
            <SubaccountRow
              key={sub.guid ?? sub.id}
              btpAccountId={acc.id}
              btpAccountName={acc.name}
              subaccount={sub}
              smConfig={getSmConfig(sub.guid ?? sub.id)}
              isReadOnly={isReadOnly}
              onConfigured={loadSubaccountsAndConfigs}
            />
          ))}
        </div>
      )}
    </div>
  );
};

AccountRow.propTypes = {
  acc:        PropTypes.object.isRequired,
  isReadOnly: PropTypes.bool,
  onDelete:   PropTypes.func.isRequired,
  onRename:   PropTypes.func.isRequired,
};

// ── Main component ────────────────────────────────────────────────────────────

const BtpAccountManager = () => {
  const { accounts, addAccount, removeAccount, renameAccount } = useContext(BtpAccountContext);
  const { user } = useAuth();
  const confirm = useConfirm();

  const isReadOnly =
    user?.role !== "admin" && user?.role !== "owner" && user?.btpReadOnly;

  const emptyForm = {
    name: "", clientId: "", clientSecret: "", tokenUrl: "", targetUrl: "",
    cisClientId: "", cisClientSecret: "", cisTokenUrl: "", cisAccountsUrl: "",
  };

  const [form, setForm]                 = useState(emptyForm);
  const [showSecretCost, setShowSecretCost] = useState(false);
  const [showSecretCis, setShowSecretCis]   = useState(false);
  const [showCis, setShowCis]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [errors, setErrors]                 = useState({});
  const [success, setSuccess]               = useState("");

  const handleChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  // Auto-append /oauth/token on blur for token URL fields
  const handleTokenUrlBlur = (fieldName) => {
    setForm((f) => {
      const raw = (f[fieldName] ?? "").trim();
      if (!raw || raw.endsWith("/oauth/token")) return f;
      return { ...f, [fieldName]: raw.replace(/\/$/, "") + "/oauth/token" };
    });
  };

  // Extract subdomain from a token URL (first hostname segment)
  const getSubdomain = (url) => {
    try { return new URL(url).hostname.split(".")[0]; }
    catch { return null; }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())         e.name         = "Account name is required";
    if (!form.clientId.trim())     e.clientId     = "Client ID is required";
    if (!form.clientSecret.trim()) e.clientSecret = "Client Secret is required";

    if (!form.tokenUrl.trim())     e.tokenUrl = "Token URL is required";
    else if (!form.tokenUrl.startsWith("https://")) e.tokenUrl = "Must start with https://";

    if (!form.targetUrl.trim())    e.targetUrl    = "Reporting API URL is required";
    else if (!form.targetUrl.startsWith("https://")) e.targetUrl = "Must start with https://";

    const cisAny = form.cisClientId || form.cisClientSecret || form.cisTokenUrl || form.cisAccountsUrl;
    if (cisAny) {
      if (!form.cisClientId.trim())     e.cisClientId     = "Required when CIS is configured";
      if (!form.cisClientSecret.trim()) e.cisClientSecret = "Required when CIS is configured";
      if (!form.cisTokenUrl.trim())     e.cisTokenUrl     = "Required when CIS is configured";
      else if (!form.cisTokenUrl.startsWith("https://")) e.cisTokenUrl = "Must start with https://";
      if (!form.cisAccountsUrl.trim())  e.cisAccountsUrl  = "Required when CIS is configured";
      else if (!form.cisAccountsUrl.startsWith("https://")) e.cisAccountsUrl = "Must start with https://";

      // Cross-validate: both token URLs must share the same subdomain (same auth tenant)
      if (!e.tokenUrl && !e.cisTokenUrl && form.tokenUrl && form.cisTokenUrl) {
        const sub1 = getSubdomain(form.tokenUrl);
        const sub2 = getSubdomain(form.cisTokenUrl);
        if (sub1 && sub2 && sub1 !== sub2) {
          e.cisTokenUrl = `Subdomain mismatch — COST_API uses "${sub1}" but CIS uses "${sub2}". Both must share the same authentication tenant.`;
        }
      }
    }
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setErrors({});
    try {
      await addAccount(form);
      setForm(emptyForm);
      setSuccess("BTP account added successfully.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setErrors({ general: err.response?.data?.error ?? "Failed to add account. Check your credentials." });
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
    <div className="p-4 sm:p-6 xl:p-8 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-[#0070F2]/30 flex items-center justify-center">
          <Server className="w-5 h-5 text-[#0070F2]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0F172A] dark:text-white">SAP BTP Account Manager</h1>
          <p className="text-xs text-[#94A3B8]">Connect your SAP BTP global accounts for cost monitoring</p>
        </div>
      </div>

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744]">
            <h2 className="text-sm font-bold text-[#475569] dark:text-[#94A3B8] tracking-wider">Connected Accounts</h2>
          </div>
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#1a2744]">
            {accounts.map((acc) => (
              <AccountRow
                key={acc.id}
                acc={acc}
                isReadOnly={isReadOnly}
                onDelete={handleDelete}
                onRename={renameAccount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add account form */}
      {!isReadOnly && (
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* COST_API */}
          <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744] flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg border border-orange-200 dark:border-orange-800 flex items-center justify-center shrink-0">
                <Database className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Service Instance 1 — COST_API</h2>
                <p className="text-[11px] text-[#94A3B8]">
                  Usage Data Management Service · Plan: reporting-ga-admin · <span className="text-emerald-500 font-semibold">Always Free</span>
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                <Cloud className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-bold">Path: </span>
                  BTP Cockpit → S4ONPREM subaccount → Cloud Foundry → Spaces → Instances → COST_API → Service Keys → CCM_API → View
                </p>
              </div>

              {errors.general && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COST_API_FIELDS.map((f) => (
                  <FormField
                    key={f.name}
                    field={f}
                    value={form[f.name]}
                    onChange={handleChange}
                    onBlur={f.isTokenUrl ? () => handleTokenUrlBlur(f.name) : undefined}
                    error={errors[f.name]}
                    showSecret={showSecretCost}
                    onToggleSecret={() => setShowSecretCost((v) => !v)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* CIS_Central (collapsible) */}
          <div className="rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCis((v) => !v)}
              className="w-full px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744] flex items-center gap-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-[#121A2F] transition-colors"
            >
              <div className="w-7 h-7 rounded-lg border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
                <Server className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#0F172A] dark:text-white">
                  Service Instance 2 — CIS_Central
                  <span className="ml-2 text-[10px] font-normal text-[#94A3B8]">(Optional)</span>
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  Cloud Management Service · Plan: central-viewer · Account hierarchy &amp; subaccounts · <span className="text-emerald-500 font-semibold">Always Free</span>
                </p>
              </div>
              {showCis ? <ChevronUp className="w-4 h-4 text-[#94A3B8] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0" />}
            </button>

            {showCis && (
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
                  <Cloud className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    <span className="font-bold">Path: </span>
                    BTP Cockpit → S4ONPREM subaccount → Cloud Foundry → Spaces → Instances → CIS_Central → Service Keys → View
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CIS_FIELDS.map((f) => {
                    // Show extracted subdomain from COST_API tokenUrl as a hint on the CIS token field
                    const hint = f.isTokenUrl && form.tokenUrl
                      ? (() => { try { return `Expected subdomain: ${new URL(form.tokenUrl).hostname.split(".")[0]}`; } catch { return null; } })()
                      : undefined;
                    return (
                      <FormField
                        key={f.name}
                        field={f}
                        value={form[f.name]}
                        onChange={handleChange}
                        onBlur={f.isTokenUrl ? () => handleTokenUrlBlur(f.name) : undefined}
                        error={errors[f.name]}
                        hint={hint}
                        showSecret={showSecretCis}
                        onToggleSecret={() => setShowSecretCis((v) => !v)}
                      />
                    );
                  })}
                </div>

                <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-[11px] text-[#94A3B8] space-y-1">
                  <p className="font-semibold text-gray-600 dark:text-gray-400">Enables 3 additional API calls:</p>
                  <p>• GET /accounts/v1/globalAccount?expand=true — full account hierarchy</p>
                  <p>• GET /accounts/v1/globalAccount — account metadata &amp; currency</p>
                  <p>• GET /accounts/v1/subaccounts — flat list of all subaccounts</p>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-[#0070F2] border border-[#0070F2] hover:border-[#0057c2] hover:text-[#0057c2] disabled:opacity-60 rounded-xl transition-colors"
            >
              {saving ? "Connecting…" : <><Plus className="w-4 h-4" /> Connect Account</>}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BtpAccountManager;
