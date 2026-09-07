import React, { useEffect, useState } from "react";
import {
  ShieldOff,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Globe,
  Zap,
  Users,
  Cloud,
  BarChart3,
  Brain,
  FileText,
  ArrowRight,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const CONTACT = {
  company: "Maitsys Technologies",
  email: "support@maitsys.com",
  phone: "+1 (800) MAITSYS",
  website: "https://www.maitsys.com",
  contactUrl: "https://www.maitsys.com/contact-us",
  salesEmail: "sales@maitsys.com",
};

const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Azure & AWS monitoring to get started",
    color: "gray",
    border: "border-gray-200 dark:border-gray-700",
    badge: "",
    features: {
      users: "Up to 5 team members",
      clouds: "Azure & AWS",
      ai: false,
      invoices: true,
      alerts: true,
      maxAccounts: "1 account per provider",
    },
  },
  {
    id: "basic",
    name: "Professional",
    tagline: "For growing teams with deeper needs",
    color: "blue",
    border: "border-blue-400",
    badge: "Most Popular",
    features: {
      users: "Up to 25 team members",
      clouds: "Azure, AWS, GCP & SAP BTP",
      ai: true,
      invoices: true,
      alerts: true,
      maxAccounts: "5 accounts per provider",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Unlimited scale, dedicated support",
    color: "violet",
    border: "border-violet-400",
    badge: "Best Value",
    features: {
      users: "Unlimited team members",
      clouds: "All providers + custom",
      ai: true,
      invoices: true,
      alerts: true,
      maxAccounts: "Unlimited accounts",
    },
  },
];

const BtpIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32zM8 10v4h2v-4H8zm3 0v4h2v-4h-2zm3 0v4h2v-4h-2z" />
  </svg>
);

const FeatureRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2.5 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
    <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0">
      {label}
    </span>
    {typeof value === "boolean" ? (
      value ? (
        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
      )
    ) : (
      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">
        {value}
      </span>
    )}
  </div>
);

const PlanCard = ({ plan, isCurrent }) => {
  const colorMap = {
    gray: {
      ring: "ring-gray-300",
      btn: "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400",
      badge: "border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400",
    },
    blue: {
      ring: "ring-blue-400",
      btn: "border border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 hover:border-blue-500",
      badge: "border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400",
    },
    violet: {
      ring: "ring-violet-400",
      btn: "border border-violet-400 dark:border-violet-600 text-violet-600 dark:text-violet-400 hover:border-violet-500",
      badge: "border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400",
    },
  };
  const c = colorMap[plan.color];

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 bg-white dark:bg-gray-900 pt-8 pb-5 px-5 shadow-sm transition-shadow hover:shadow-md ${plan.border} ${isCurrent ? `ring-2 ${c.ring}` : ""}`}
    >
      {/* Top badges row */}
      <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2 px-4">
        {plan.badge && (
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full bg-white dark:bg-gray-900 border ${c.badge}`}>
            {plan.badge}
          </span>
        )}
        {isCurrent && (
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-white dark:bg-gray-900 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400">
            Current Plan
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-gray-900 dark:text-white">
        {plan.name}
      </h3>
      <p className="text-xs text-gray-400 mt-0.5 mb-4">{plan.tagline}</p>

      <div className="flex-1">
        <FeatureRow icon={Users} label="Team size" value={plan.features.users} />
        <FeatureRow icon={Cloud} label="Clouds" value={plan.features.clouds} />
        <FeatureRow icon={BarChart3} label="Accounts" value={plan.features.maxAccounts} />
        <FeatureRow icon={Brain} label="AI Insights" value={plan.features.ai} />
        <FeatureRow icon={FileText} label="Invoices" value={plan.features.invoices} />
        <FeatureRow icon={Zap} label="Smart alerts" value={plan.features.alerts} />
      </div>

      <a
        href={CONTACT.contactUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition ${c.btn}`}
      >
        Contact Sales <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};

const SubscriptionExpiredPage = () => {
  const { logout } = useAuth();
  const [sub, setSub] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('ccm_expired_sub');
    if (stored) {
      try { setSub(JSON.parse(stored)); } catch { /* ignore */ }
    }

    // Only check renewal if we have a token (logged-in user got kicked out)
    // No token = came from failed login; user must log in again to verify renewal
    if (!localStorage.getItem('token')) return;

    axios.get(`${import.meta.env.VITE_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    }).then(() => {
      sessionStorage.removeItem('ccm_expired_sub');
      window.location.href = '/';
    }).catch(() => { /* still expired — stay on page */ });
  }, []);

  const expiredOn = sub?.expires_at
    ? new Date(sub.expires_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const currentPlanId = sub?.plan_type ?? "basic";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top banner */}
      <div className="border-b border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 relative px-4">
        <AlertTriangle className="w-4 h-4" />
        Your subscription has expired. Access to the platform is restricted until renewed.
        {!localStorage.getItem('token') && (
          <a
            href="/login"
            className="absolute right-4 top-1/2 -translate-y-1/2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-bold px-3 py-1 rounded-lg transition"
          >
            Login Again
          </a>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto">
            <ShieldOff className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Subscription Expired
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Your organization&apos;s CCM subscription has ended. Renew to regain
            full access to cloud cost monitoring.
          </p>
          {expiredOn && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              Expired on {expiredOn}
            </div>
          )}
        </div>

        {/* Current subscription summary */}
        {sub && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-4">
              Your Last Subscription Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Plan",
                  value:
                    (sub.plan_type ?? "basic").charAt(0).toUpperCase() +
                    (sub.plan_type ?? "basic").slice(1),
                },
                { label: "Max Users", value: sub.max_users ?? "—" },
                {
                  label: "AI Insights",
                  value: sub.ai_enabled ? "Enabled" : "Disabled",
                },
                {
                  label: "Max Accounts",
                  value: `Azure ${sub.max_azure_accounts ?? "—"} · AWS ${sub.max_aws_accounts ?? "—"} · BTP ${sub.max_btp_accounts ?? "—"}`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-100 dark:border-gray-700 p-3"
                >
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">
                    {item.label.toUpperCase()}
                  </p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white mt-1">
                    {String(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans */}
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-1">
            Available Plans
          </h2>
          <p className="text-sm text-gray-400 mb-5">
            Select a plan to renew — our team will get in touch to complete the
            process.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={plan.id === currentPlanId}
              />
            ))}
          </div>
        </div>

        {/* Feature comparison note */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-4">
            What&apos;s Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            {[
              {
                icon: Cloud,
                title: "Multi-Cloud Monitoring",
                desc: "Azure, AWS, and SAP BTP cost tracking in one dashboard.",
              },
              {
                icon: Brain,
                title: "AI Executive Insights",
                desc: "GPT-powered summaries, anomaly detection, and recommendations.",
              },
              {
                icon: Zap,
                title: "Smart Alerts",
                desc: "IQR-based spike detection, budget breach alerts, new resource notifications.",
              },
              {
                icon: FileText,
                title: "Invoice Management",
                desc: "Upload and parse PDF/CSV invoices across all cloud providers.",
              },
              {
                icon: BarChart3,
                title: "Cost Analytics",
                desc: "Daily trends, service breakdowns, regional analysis, and forecasting.",
              },
              {
                icon: Users,
                title: "Team Management",
                desc: "Role-based access, per-member cloud permissions, invite system.",
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-xs">
                    {f.title}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 p-6 shadow-sm">
          <h2 className="text-base font-black text-gray-900 dark:text-white mb-1">Contact Us to Renew</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Our team is ready to help you get back up and running quickly.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href={`mailto:${CONTACT.salesEmail}`}
              className="flex items-center gap-3 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl px-4 py-3 transition"
            >
              <Mail className="w-4 h-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">SALES</p>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{CONTACT.salesEmail}</p>
              </div>
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-3 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl px-4 py-3 transition"
            >
              <Mail className="w-4 h-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">SUPPORT</p>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{CONTACT.email}</p>
              </div>
            </a>
            <a
              href={CONTACT.contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl px-4 py-3 transition"
            >
              <Globe className="w-4 h-4 shrink-0 text-blue-500" />
              <div>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">WEBSITE</p>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{CONTACT.company}</p>
              </div>
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center">
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline transition"
          >
            Sign out and use a different account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpiredPage;
