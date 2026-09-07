import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Key,
  CheckCircle,
  Cloud,
} from "lucide-react";
import api from "../api";
import AuthCarousel from "../components/AuthCarousel";
import { PasswordInput, PasswordStrength } from "../components/PasswordInput";
import { fireToast } from "../components/ToastProvider";

// ─── Invoice-only option ──────────────────────────────────────────────────────
const INVOICE_OPTION = {
  id: "invoice",
  label: "Manual Invoice Upload",
  tagline: "PDF & CSV · AWS · Azure · SAP BTP",
  mspRate: "No live sync required",
  gradient: "from-violet-600 to-purple-400",
  color: "bg-violet-600",
  ringColor: "ring-violet-400",
  borderActive: "border-violet-500/60",
  borderIdle: "border-white/[0.08]",
  bgActive: "bg-violet-500/10",
  bgIdle: "bg-white/[0.03]",
  iconBg: "bg-violet-500/15",
  textActive: "text-violet-300",
  badgeBg: "bg-violet-500/15 text-violet-300",
  icon: (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7 text-violet-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  iconColor: "text-violet-400",
};

const FEATURE_MENU = {
  cloud: [
    { icon: "📊", label: "Cost Dashboard", available: true },
    { icon: "💰", label: "Savings & Recommendations", available: true },
    { icon: "📋", label: "Budget Management", available: true },
    { icon: "🔔", label: "Smart Alerts", available: true },
    { icon: "📄", label: "Invoice Upload", available: true },
    { icon: "🔄", label: "Sync Logs", available: true },
  ],
  invoice: [
    { icon: "📊", label: "Cost Dashboard (Invoice)", available: true },
    { icon: "📄", label: "Invoice Upload", available: true },
    { icon: "💰", label: "Savings & Recommendations", available: false },
    { icon: "📋", label: "Budget Management", available: false },
    { icon: "🔔", label: "Smart Alerts", available: false },
    { icon: "🔄", label: "Sync Logs", available: false },
  ],
  hybrid: [
    { icon: "📊", label: "Cost Dashboard", available: true },
    { icon: "📄", label: "Invoice Upload", available: true },
    { icon: "💰", label: "Savings & Recommendations", available: true },
    { icon: "📋", label: "Budget Management", available: true },
    { icon: "🔔", label: "Smart Alerts", available: true },
    { icon: "🔄", label: "Sync Logs", available: true },
  ],
};

function getSelectionMode(cloudPreference, invoiceSelected) {
  const hasCloud = cloudPreference.length > 0;
  if (hasCloud && invoiceSelected) return "hybrid";
  if (invoiceSelected) return "invoice";
  if (hasCloud) return "cloud";
  return null;
}

const CLOUD_PROVIDERS = [
  {
    id: "aws",
    label: "Amazon Web Services",
    tagline: "EC2 · S3 · RDS · Lambda · Cost Explorer",
    mspRate: "3.5% MSP discount",
    gradient: "from-orange-500 to-amber-400",
    color: "bg-orange-500",
    ringColor: "ring-orange-400/50",
    borderActive: "border-orange-400/50",
    borderIdle: "border-white/[0.08]",
    bgActive: "bg-orange-500/10",
    bgIdle: "bg-white/[0.03]",
    iconBg: "bg-orange-500/15",
    textActive: "text-orange-300",
    badgeBg: "bg-orange-500/15 text-orange-300",
    icon: (
      <svg
        viewBox="0 0 96 96"
        className="w-7 h-7 text-orange-400"
        fill="currentColor"
      >
        <path d="M85.54 64.67C75.52 71.98 60.95 75.84 48.4 75.84c-17.52 0-33.3-6.47-45.23-17.24-1-.84-.1-2 1.07-1.34 12.88 7.5 28.79 12.02 45.23 12.02 11.09 0 23.29-2.3 34.52-7.07 1.69-.73 3.11 1.11 1.55 2.46z" />
        <path d="M89.72 59.9c-1.33-1.72-8.83-.82-12.2-.41-1.02.12-1.18-.77-.26-1.42 5.97-4.2 15.76-2.99 16.9-1.58 1.15 1.42-.3 11.23-5.9 15.92-.87.73-1.69.34-1.3-.61 1.25-3.13 4.1-10.19 2.76-11.9z" />
      </svg>
    ),
  },
  {
    id: "azure",
    label: "Microsoft Azure",
    tagline: "VMs · App Services · Storage · AKS",
    mspRate: "7% MSP discount",
    gradient: "from-blue-600 to-sky-400",
    color: "bg-blue-600",
    ringColor: "ring-blue-400/50",
    borderActive: "border-blue-400/50",
    borderIdle: "border-white/[0.08]",
    bgActive: "bg-blue-500/10",
    bgIdle: "bg-white/[0.03]",
    iconBg: "bg-blue-500/15",
    textActive: "text-blue-300",
    badgeBg: "bg-blue-500/15 text-blue-300",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
        <path d="M5.9 21L13.7 21L19.4 6.8L12.1 6.8L5.9 21Z" fill="#0078D4" />
        <path
          d="M12.4 21L12.4 20.6L12.1 21L12.4 21ZM5.9 21L0.1 6.8L6.8 6.8L9.9 14.2L5.9 21Z"
          fill="#0078D4"
        />
        <path
          d="M12.3 20.6L19.5 3.5L12.6 3.5L9.9 10L12.3 20.6Z"
          fill="#5EA0EF"
        />
      </svg>
    ),
  },
  {
    id: "btp",
    label: "SAP BTP",
    tagline: "Subaccounts · Services · Usage · Costs",
    mspRate: "2% MSP discount",
    gradient: "from-emerald-600 to-teal-400",
    color: "bg-emerald-600",
    ringColor: "ring-emerald-400/50",
    borderActive: "border-emerald-400/50",
    borderIdle: "border-white/[0.08]",
    bgActive: "bg-emerald-500/10",
    bgIdle: "bg-white/[0.03]",
    iconBg: "bg-emerald-500/15",
    textActive: "text-emerald-300",
    badgeBg: "bg-emerald-500/15 text-emerald-300",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="w-7 h-7 text-emerald-400"
        fill="currentColor"
      >
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32zM8 10v4h2v-4H8zm3 0v4h2v-4h-2zm3 0v4h2v-4h-2z" />
      </svg>
    ),
  },
  {
    id: "gcp",
    label: "Google Cloud Platform",
    tagline: "Compute · BigQuery · Cloud Storage · Billing",
    mspRate: "2% MSP discount",
    gradient: "from-brand-600 to-brand-400",
    color: "bg-brand-600",
    ringColor: "ring-brand-400/50",
    borderActive: "border-brand-400/50",
    borderIdle: "border-white/[0.08]",
    bgActive: "bg-brand-500/10",
    bgIdle: "bg-white/[0.03]",
    iconBg: "bg-brand-500/15",
    textActive: "text-brand-300",
    badgeBg: "bg-brand-500/15 text-brand-300",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
        <path d="M12 5.4l2.6 2.6H9.4L12 5.4z" fill="#60a5fa" />
        <path d="M5.4 12l2.6-2.6v5.2L5.4 12z" fill="#93c5fd" />
        <path d="M12 18.6l-2.6-2.6h5.2L12 18.6z" fill="#3b82f6" />
        <path d="M18.6 12l-2.6 2.6V9.4l2.6 2.6z" fill="#2563EB" />
        <circle cx="12" cy="12" r="3" fill="#3b82f6" />
      </svg>
    ),
  },
];

// ── Shared input class ─────────────────────────────────────────────────────────
const inputCls =
  "block w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-white/[0.05] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all";
const labelCls =
  "block text-xs font-semibold text-slate-400  tracking-wider mb-2 ml-1";

const RegisterPage = () => {
  const { register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [orgInfo, setOrgInfo] = useState({ exists: false, name: "" });
  const [invoiceSelected, setInvoiceSelected] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    fullName: "",
    password: "",
    orgName: "",
    role: "member",
    inviteToken: "",
    cloudPreference: [],
  });
  const [fieldError, setFieldError] = useState({ field: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await api.post("/auth/send-otp", {
        email: formData.email,
      });
      setOrgInfo({ exists: result.data.orgExists, name: result.data.orgName });
      setFormData((p) => ({
        ...p,
        orgName: result.data.orgExists ? result.data.orgName : p.orgName,
        role: result.data.orgExists ? "member" : "admin",
      }));
      setStep(2);
    } catch (err) {
      fireToast(err.response?.data?.error || "Failed to send OTP", "error");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await verifyOtp(formData.email, formData.otp);
    if (result.success) setStep(3);
    else fireToast(result.error || "Invalid OTP. Please try again.", "error");
    setLoading(false);
  };

  const handleDetails = async (e) => {
    e.preventDefault();
    setFieldError({ field: "", message: "" });
    if (!orgInfo.exists && !formData.inviteToken.trim()) {
      setFieldError({
        field: "inviteToken",
        message: "Invitation token is required to register a new organization.",
      });
      return;
    }
    if (orgInfo.exists) await submitRegistration();
    else setStep(4);
  };

  const handleCloudContinue = async () => {
    await submitRegistration();
  };

  const submitRegistration = async () => {
    setLoading(true);
    const {
      email,
      password,
      fullName,
      orgName,
      role,
      otp,
      inviteToken,
      cloudPreference,
    } = formData;
    const result = await register({
      email,
      password,
      fullName,
      orgName,
      role,
      otp,
      inviteToken,
      cloudPreference: Array.isArray(cloudPreference)
        ? cloudPreference.join(",")
        : cloudPreference || "",
      invoiceOnly: invoiceSelected,
    });
    if (result.success) {
      setStep(5);
    } else {
      const msg = result.error || "Registration failed. Please try again.";
      if (
        msg.toLowerCase().includes("invitation token") ||
        msg.toLowerCase().includes("invalid or already used")
      ) {
        setStep(3);
        setFieldError({
          field: "inviteToken",
          message:
            "This invitation token is invalid or has already been used. Please request a new one from your Maitsys administrator.",
        });
      } else if (
        msg.toLowerCase().includes("slug") ||
        msg.toLowerCase().includes("unique constraint")
      ) {
        setStep(3);
        setFieldError({
          field: "orgName",
          message:
            "An organization with a similar name already exists. Please use a more specific company name.",
        });
      } else {
        fireToast(msg, "error");
      }
    }
    setLoading(false);
  };

  const handleNavigateToLogin = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const progressStep = step >= 4 ? 3 : step;

  // ── Cloud provider card renderer ─────────────────────────────────────────────
  const renderCard = (p, selected, onToggle) => (
    <button
      key={p.id}
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
        selected
          ? `${p.borderActive} ${p.bgActive} ring-1 ${p.ringColor}`
          : `${p.borderIdle} ${p.bgIdle} hover:border-white/[0.14] hover:bg-white/[0.05]`
      }`}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${p.iconBg}`}
      >
        {p.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`font-bold text-xs ${selected ? p.textActive : "text-slate-300"}`}
          >
            {p.label}
          </span>
          <span
            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${p.badgeBg}`}
          >
            {p.mspRate}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
          {p.tagline}
        </p>
      </div>
      <div
        className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
          selected
            ? `${p.color} border-transparent`
            : "border-white/20"
        }`}
      >
        {selected && (
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>
    </button>
  );

  return (
    <div className="h-[100dvh] bg-[#0a0f1e] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-5xl h-full max-h-[820px] rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_60px_rgba(0,0,0,0.5)] border border-white/[0.06] flex overflow-hidden relative z-10 bg-[#0d1424]">
        {/* ── Left Form ── */}
        <div className="w-full lg:w-1/2 px-6 sm:px-12 py-8 flex flex-col justify-start sm:justify-center relative overflow-y-auto bg-[#0d1424]">
          {/* Logo */}
          <div className={`text-center ${step === 4 ? "mb-2" : "mb-5"}`}>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl" />
                <img
                  src="/app-logo.png"
                  alt="Maitsys Logo"
                  className={`relative rounded-2xl object-contain shadow-[0_4px_24px_rgba(0,0,0,0.4)] ${step === 4 ? "w-12 h-12" : "w-20 h-20"}`}
                />
              </div>
              <p
                className={`text-slate-400 font-medium ${step === 4 ? "text-xs" : "text-sm"} tracking-wide`}
              >
                Cloud Cost Monitoring
              </p>
            </div>
          </div>

          {/* Progress dots */}
          {step !== 5 && (
            <div
              className={`flex justify-between items-center px-4 ${step === 4 ? "mb-3" : "mb-8"}`}
            >
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      progressStep >= s
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                        : "bg-white/[0.06] text-slate-500 border border-white/[0.08]"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-12 h-0.5 mx-2 rounded-full transition-all duration-300 ${progressStep > s ? "bg-blue-500/60" : "bg-white/[0.06]"}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <form className="space-y-5" onSubmit={handleSendOtp}>
              <div>
                <label className={labelCls}>Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="yourname@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Sending Code...
                  </>
                ) : (
                  <>
                    Get Verification Code <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <form className="space-y-5" onSubmit={handleVerifyOtp}>
              <div className="text-center mb-2">
                <p className="text-sm text-slate-400">
                  We sent a code to{" "}
                  <span className="text-white font-bold">{formData.email}</span>
                </p>
              </div>
              <div>
                <label className={`${labelCls} text-center block`}>
                  Enter 6-digit Code
                </label>
                <input
                  name="otp"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={formData.otp}
                  onChange={handleChange}
                  className="block w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-xl text-blue-400 placeholder-slate-700 bg-white/[0.05] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Change Email
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Details ── */}
          {step === 3 && (
            <form className="space-y-4" onSubmit={handleDetails}>
              {orgInfo.exists && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-1">
                  <p className="text-xs font-bold text-blue-400 mb-1">
                    You are joining
                  </p>
                  <p className="text-base font-bold text-white">
                    {orgInfo.name}
                  </p>
                  <p className="text-[10px] text-blue-400/70 font-bold mt-1 tracking-wider">
                    Account Role: Member
                  </p>
                </div>
              )}

              {/* Full name */}
              <div>
                <label className={labelCls}>Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    name="fullName"
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
              </div>

              {!orgInfo.exists && (
                <>
                  {/* Invite token */}
                  <div>
                    <label className={labelCls}>Invitation Token</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        name="inviteToken"
                        type="text"
                        required
                        placeholder="Enter token from Super Admin"
                        value={formData.inviteToken}
                        onChange={(e) => {
                          handleChange(e);
                          setFieldError({ field: "", message: "" });
                        }}
                        className={`block w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder-slate-500 bg-white/[0.05] border focus:outline-none focus:ring-2 transition-all font-mono font-bold text-violet-300 ${
                          fieldError.field === "inviteToken"
                            ? "border-red-500/50 focus:ring-red-500/30"
                            : "border-white/[0.08] focus:ring-violet-500/40 focus:border-violet-500/50"
                        }`}
                      />
                    </div>
                    {fieldError.field === "inviteToken" ? (
                      <div className="flex items-start gap-2 mt-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <p className="text-[11px] text-red-400 font-medium">
                          {fieldError.message}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-violet-400/60 mt-1 font-medium italic">
                        Required to register a new organization.
                      </p>
                    )}
                  </div>

                  {/* Company name */}
                  <div>
                    <label className={labelCls}>Company Name</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        name="orgName"
                        type="text"
                        required
                        placeholder="Maitsys Cloud"
                        value={formData.orgName}
                        onChange={(e) => {
                          handleChange(e);
                          setFieldError({ field: "", message: "" });
                        }}
                        className={`block w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-white/[0.05] border focus:outline-none focus:ring-2 transition-all ${
                          fieldError.field === "orgName"
                            ? "border-red-500/50 focus:ring-red-500/30"
                            : "border-white/[0.08] focus:ring-blue-500/40 focus:border-blue-500/50"
                        }`}
                      />
                    </div>
                    {fieldError.field === "orgName" && (
                      <div className="flex items-start gap-2 mt-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <p className="text-[11px] text-red-400 font-medium">
                          {fieldError.message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Role (disabled) */}
                  <div>
                    <label className={labelCls}>Your Role</label>
                    <div className="relative">
                      <select
                        name="role"
                        value={formData.role}
                        disabled
                        className="block w-full px-4 py-3 border border-white/[0.06] rounded-xl bg-white/[0.04] text-sm font-bold appearance-none cursor-not-allowed text-slate-500"
                      >
                        <option value="admin">
                          Administrator (Company Owner)
                        </option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1 font-medium italic">
                      You will be the primary administrator for this domain.
                    </p>
                  </div>
                </>
              )}

              {/* Password */}
              <div>
                <label className={labelCls}>Create Password</label>
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  required
                  className="py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-white/[0.05] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                />
                <PasswordStrength password={formData.password} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                    Processing...
                  </>
                ) : orgInfo.exists ? (
                  "Finish Registration"
                ) : (
                  "Next →"
                )}
              </button>
            </form>
          )}

          {/* ── Step 4: Cloud / Invoice selection ── */}
          {step === 4 &&
            (() => {
              const selMode = getSelectionMode(
                formData.cloudPreference,
                invoiceSelected,
              );
              const menuItems = selMode ? FEATURE_MENU[selMode] : null;
              const canContinue =
                formData.cloudPreference.length > 0 || invoiceSelected;

              return (
                <div className="space-y-2.5 animate-in fade-in slide-in-from-bottom-4">
                  <div className="text-center">
                    <h2 className="text-base font-bold text-white">
                      How will you track costs?
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose cloud providers, invoice upload, or both.
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold tracking-wider text-slate-500 mb-1.5 px-1">
                      Live Cloud Connection
                    </p>
                    <div className="space-y-1.5">
                      {CLOUD_PROVIDERS.map((p) => {
                        const selected = formData.cloudPreference.includes(
                          p.id,
                        );
                        return renderCard(p, selected, () =>
                          setFormData((prev) => ({
                            ...prev,
                            cloudPreference: selected
                              ? prev.cloudPreference.filter((x) => x !== p.id)
                              : [...prev.cloudPreference, p.id],
                          })),
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 py-0.5">
                    <div className="flex-1 h-px bg-white/[0.06]" />
                    <span className="text-[10px] font-semibold text-slate-600 tracking-wider">
                      or
                    </span>
                    <div className="flex-1 h-px bg-white/[0.06]" />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold tracking-wider text-slate-500 mb-1.5 px-1">
                      Manual Invoice Upload
                    </p>
                    {renderCard(INVOICE_OPTION, invoiceSelected, () =>
                      setInvoiceSelected((v) => !v),
                    )}
                  </div>

                  {menuItems && (
                    <div
                      className={`rounded-xl border p-3 transition-all duration-300 ${
                        selMode === "invoice"
                          ? "border-violet-500/20 bg-violet-500/5"
                          : "border-emerald-500/20 bg-emerald-500/5"
                      }`}
                    >
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 mb-2">
                        {selMode === "hybrid"
                          ? "✦ Full access — all features unlocked"
                          : selMode === "invoice"
                            ? "📄 Invoice-only mode — limited features"
                            : "☁ Cloud mode — all features available"}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {menuItems.map((item) => (
                          <div
                            key={item.label}
                            className={`flex items-center gap-1.5 text-[10px] font-medium ${item.available ? "text-slate-300" : "text-slate-600 line-through"}`}
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={loading || !canContinue}
                    onClick={handleCloudContinue}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                        Creating Account...
                      </>
                    ) : canContinue ? (
                      "Create My Account →"
                    ) : (
                      "Select at least one option"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-full text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors py-1"
                  >
                    ← Back
                  </button>
                </div>
              );
            })()}

          {/* ── Step 5: Success ── */}
          {step === 5 && (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-center">
                <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <CheckCircle className="w-14 h-14 text-emerald-400" />
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-medium">
                Signup successful! Your account has been securely created.
              </div>
              {(formData.cloudPreference.length > 0 || invoiceSelected) && (
                <p className="text-sm text-slate-400">
                  {invoiceSelected && formData.cloudPreference.length === 0 ? (
                    <>
                      <span className="font-bold text-violet-300">
                        Invoice-only mode
                      </span>{" "}
                      configured — upload PDFs &amp; CSVs to track costs.
                    </>
                  ) : (
                    <>
                      Access configured:{" "}
                      <span className="font-bold text-slate-200">
                        {[
                          ...formData.cloudPreference.map(
                            (id) =>
                              CLOUD_PROVIDERS.find((p) => p.id === id)?.label,
                          ),
                          ...(invoiceSelected ? ["Invoice Upload"] : []),
                        ].join(", ")}
                      </span>
                    </>
                  )}
                </p>
              )}
              <p className="text-sm text-slate-500">
                We&apos;ve also sent a welcome email to your inbox.
              </p>
              <Link
                to="/login"
                className="block w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white text-center bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
              >
                Proceed to Login
              </Link>
            </div>
          )}

          {step !== 5 && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <a
                href="/login"
                onClick={handleNavigateToLogin}
                className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign in
              </a>
            </p>
          )}

          {/* Footer */}
          <div className="mt-auto pt-5 border-t border-white/[0.06] flex flex-col items-center gap-1.5">
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-slate-600 font-medium">
              <span>Direct Contact:</span>
              <a
                href="mailto:contact@maitsys.com"
                className="hover:text-blue-400 transition-colors"
              >
                contact@maitsys.com
              </a>
              <span className="text-slate-700">&bull;</span>
              <a
                href="https://www.maitsys.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                www.maitsys.com
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[9px] text-slate-700">
              <a
                href="https://www.maitsys.com/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-400 transition-colors"
              >
                Privacy Policy
              </a>
              <span>&bull;</span>
              <a
                href="https://www.maitsys.com/terms-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-400 transition-colors"
              >
                Terms &amp; Conditions
              </a>
            </div>
            <p className="text-[9px] tracking-wider text-slate-700 mt-0.5">
              © 2026 MAITSYS. All Rights Reserved.
            </p>
          </div>
        </div>

        {/* ── Right Carousel ── */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <AuthCarousel />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
