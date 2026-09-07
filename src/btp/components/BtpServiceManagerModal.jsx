import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { X, Eye, EyeOff, Settings2, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { saveSmConfig, getSmConfig } from "../../api/btpApi";

const FIELDS = [
  {
    name: "clientid",
    label: "Client ID",
    placeholder: "sb-12345...!b634|service-manager!b123",
    type: "text",
    help: "Service key → clientid",
  },
  {
    name: "clientsecret",
    label: "Client Secret",
    placeholder: "••••••••••••",
    type: "password",
    help: "Service key → clientsecret. Encrypted at rest.",
  },
  {
    name: "url",
    label: "Token URL",
    placeholder: "https://<subdomain>.authentication.eu10.hana.ondemand.com/oauth/token",
    type: "text",
    help: "Service key → uaa.url + /oauth/token",
  },
  {
    name: "sm_url",
    label: "Service Manager URL",
    placeholder: "https://service-manager.cfapps.eu10.hana.ondemand.com",
    type: "text",
    help: "Service key → sm_url",
  },
];

const BtpServiceManagerModal = ({ btpAccountId, subaccount, onClose, onSaved }) => {
  const [form, setForm] = useState({ clientid: "", clientsecret: "", url: "", sm_url: "" });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [hasExisting, setHasExisting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSmConfig(btpAccountId, subaccount.id)
      .then((res) => {
        if (res.data) setHasExisting(true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [btpAccountId, subaccount.id]);

  const handleChange = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  // Auto-append /oauth/token when the url field loses focus
  const handleUrlBlur = () => {
    const raw = form.url.trim();
    if (!raw) return;
    if (!raw.endsWith("/oauth/token")) {
      setForm((f) => ({ ...f, url: raw.replace(/\/$/, "") + "/oauth/token" }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.clientid.trim())     e.clientid     = "Required";
    if (!form.clientsecret.trim()) e.clientsecret = "Required";

    if (!form.url.trim()) {
      e.url = "Required";
    } else if (!form.url.startsWith("https://")) {
      e.url = "Must start with https://";
    } else {
      // Subdomain check — only if the subaccount has a known subdomain
      const expectedSubdomain = subaccount.subdomain;
      if (expectedSubdomain) {
        try {
          const hostname = new URL(form.url).hostname; // e.g. s4onprem-06epp7bb.authentication.us10.hana.ondemand.com
          const urlSubdomain = hostname.split(".")[0];  // e.g. s4onprem-06epp7bb
          if (urlSubdomain.toLowerCase() !== expectedSubdomain.toLowerCase()) {
            e.url = `Subdomain mismatch — URL contains "${urlSubdomain}" but this subaccount's subdomain is "${expectedSubdomain}".`;
          }
        } catch {
          e.url = "Invalid URL format.";
        }
      }
    }

    if (!form.sm_url.trim())       e.sm_url = "Required";
    else if (!form.sm_url.startsWith("https://")) e.sm_url = "Must start with https://";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure /oauth/token is appended before final validation
    const finalUrl = form.url.trim().replace(/\/$/, "");
    if (finalUrl && !finalUrl.endsWith("/oauth/token")) {
      setForm((f) => ({ ...f, url: finalUrl + "/oauth/token" }));
      // Re-run after state update on next tick
      setTimeout(() => document.getElementById("sm-form")?.requestSubmit(), 0);
      return;
    }
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setErrors({});
    try {
      await saveSmConfig({
        btpAccountId,
        subaccountId:   subaccount.id,
        subaccountName: subaccount.displayName ?? subaccount.name ?? subaccount.id,
        ...form,
      });
      setSuccess("Credentials saved successfully.");
      setHasExisting(true);
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 1200);
    } catch (err) {
      setErrors({ general: err.response?.data?.error ?? "Failed to save credentials." });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg flex flex-col rounded-2xl border border-[#E2E8F0] dark:border-[#1a2744] bg-white dark:bg-[#0B1023] shadow-2xl max-h-[calc(100vh-2rem)]">
        {/* Header — fixed at top */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#1a2744]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl border border-[#0070F2]/30 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-[#0070F2]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A] dark:text-white">Configure Service Manager</p>
              <p className="text-[11px] text-[#94A3B8] truncate max-w-[260px]">
                {subaccount.displayName ?? subaccount.name ?? subaccount.id}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form id="sm-form" onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-[#0070F2] animate-spin" />
            </div>
          ) : (
            <>
              {hasExisting && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Credentials already configured. Enter new values to update them.
                  </p>
                </div>
              )}

              {errors.general && (
                <div className="flex items-start gap-2 p-3 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">{success}</p>
                </div>
              )}

              <div className="space-y-3">
                {FIELDS.map((f) => {
                  const inputType = f.type === "password" ? (showSecret ? "text" : "password") : "text";
                  const isTokenUrl = f.name === "url";
                  return (
                    <div key={f.name}>
                      <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] mb-1">
                        {f.label}
                        {isTokenUrl && (
                          <span className="ml-1.5 text-[10px] font-normal text-[#94A3B8]">
                            — <code className="font-mono">/oauth/token</code> appended automatically
                          </span>
                        )}
                      </label>
                      {isTokenUrl && subaccount.subdomain && (
                        <p className="mb-1 text-[11px] text-blue-500 dark:text-blue-400">
                          Expected subdomain: <span className="font-mono font-bold">{subaccount.subdomain}</span>
                        </p>
                      )}
                      <div className="relative">
                        <input
                          type={inputType}
                          value={form[f.name]}
                          onChange={(e) => handleChange(f.name, e.target.value)}
                          onBlur={isTokenUrl ? handleUrlBlur : undefined}
                          placeholder={f.placeholder}
                          className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-[#F8FAFC] dark:bg-[#121A2F] text-[#0F172A] dark:text-white placeholder-[#CBD5E1] dark:placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#0070F2]/40 transition-colors ${errors[f.name] ? "border-red-400" : "border-[#E2E8F0] dark:border-[#1a2744]"}`}
                        />
                        {f.type === "password" && (
                          <button
                            type="button"
                            onClick={() => setShowSecret((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                          >
                            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      {errors[f.name] && <p className="mt-1 text-[11px] text-red-500">{errors[f.name]}</p>}
                      <p className="mt-0.5 text-[11px] text-[#94A3B8]">{f.help}</p>
                    </div>
                  );
                })}
              </div>

            </>
          )}
          </div>

          {/* Footer — fixed at bottom, only shown when not loading */}
          {!loading && (
            <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-[#E2E8F0] dark:border-[#1a2744]">
              <p className="text-[11px] text-[#94A3B8]">
                BTP Cockpit → Subaccount → Service Marketplace → Service Manager → Service Keys
              </p>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#0070F2] border border-[#0070F2] hover:border-[#0057c2] hover:text-[#0057c2] disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap"
              >
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Save Credentials"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
};

BtpServiceManagerModal.propTypes = {
  btpAccountId: PropTypes.string.isRequired,
  subaccount: PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    name: PropTypes.string,
    subdomain: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
};

export default BtpServiceManagerModal;
