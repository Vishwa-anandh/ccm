import React, { useState, useEffect, useRef } from "react";
import {
  TrendingDown,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Server,
  Network,
  HardDrive,
  Settings,
  Tag,
  ShoppingBag,
  CreditCard,
  Zap,
  Wallet,
  FileBarChart,
  Sparkles,
  ChevronDown,
  Lightbulb,
  Cloud,
  X,
  ChevronRight,
  Info,
  ShieldOff,
} from "lucide-react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { GetStartedWizard } from "./HomePage";
import { useMspRates } from "../hooks/useMspRates";

import KPICard from "../components/dashboard/KPICard";
import SavingsCategoryCard from "../components/dashboard/SavingsCategoryCard";
import SavingsTrendChart from "../components/dashboard/SavingsTrendChart";
import SavingsDonutChart from "../components/dashboard/SavingsDonutChart";
import TopRecommendationsList from "../components/dashboard/TopRecommendationsList";
import { formatCurrency } from "../utils/formatters";

// Simple custom dropdown to allow icons
const ProviderDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const { user, cloudAccess } = useAuth();

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  // Must have both user-level permission AND subscription-level cloud access
  const subHasAzure = !cloudAccess.length || cloudAccess.includes("azure");
  const subHasAws   = !cloudAccess.length || cloudAccess.includes("aws");
  const subHasBtp   = !cloudAccess.length || cloudAccess.includes("btp");
  const subHasGcp   = !cloudAccess.length || cloudAccess.includes("gcp");
  const hasAzure = (isAdmin || user?.canViewAzure) && subHasAzure;
  const hasAws   = (isAdmin || user?.canViewAws)   && subHasAws;
  const hasBtp   = (isAdmin || user?.canViewBtp)   && subHasBtp;
  const hasGcp   = (isAdmin || user?.canViewGcp)   && subHasGcp;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const baseOptions = [];

  const activeProviderCount = [hasAzure, hasAws, hasBtp, hasGcp].filter(Boolean).length;
  if (activeProviderCount > 1) {
    baseOptions.push({
      id: "",
      label: "All Providers",
      icon: <Cloud className="w-4 h-4 text-gray-500" />,
    });
  }

  if (hasAzure) {
    baseOptions.push({
      id: "azure",
      label: "Microsoft Azure",
      icon: (
        <div className="w-4 h-4 flex">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.90011 21L13.7001 21L19.4001 6.79999L12.1001 6.79999L5.90011 21Z"
              fill="#0078D4"
            />
            <path
              d="M12.4001 21L12.4001 20.6L12.1001 21L12.4001 21ZM5.90011 21L0.100098 6.79999L6.8001 6.79999L9.9001 14.2L5.90011 21Z"
              fill="#0078D4"
            />
            <path
              d="M12.3001 20.6L19.5001 3.5L12.6001 3.5L9.9001 10L12.3001 20.6Z"
              fill="#5EA0EF"
            />
          </svg>
        </div>
      ),
    });
  }
  if (hasAws) {
    baseOptions.push({
      id: "aws",
      label: "Amazon AWS",
      icon: (
        <div className="w-5 h-5 flex items-center justify-center -ml-0.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M16.94 18.068c-1.792 1.637-4.464 1.868-6.19.539-.333-.256-.412.338-.08.594 2.094 1.611 5.253 1.33 7.398-.63.228-.208.729-.714.542-.92-.187-.208-.57.247-1.67.417zm-1.897-1.668c.556-.379 1.488-.06 2.072.71.583.771.517 1.697-.04 2.076-.556.378-1.488.06-2.071-.71-.583-.77-.517-1.697.04-2.076z"
              fill="#FF9900"
            />
            <text
              x="50%"
              y="15"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              fontSize="10"
              fill="currentColor"
              className="text-[#232F3E] dark:text-white"
            >
              AWS
            </text>
          </svg>
        </div>
      ),
    });
  }
  if (hasBtp) {
    baseOptions.push({
      id: "btp",
      label: "SAP BTP",
      icon: (
        <div className="w-4 h-4 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600" fill="currentColor">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32zM8 10v4h2v-4H8zm3 0v4h2v-4h-2zm3 0v4h2v-4h-2z" />
          </svg>
        </div>
      ),
    });
  }
  if (hasGcp) {
    baseOptions.push({
      id: "gcp",
      label: "Google Cloud",
      icon: (
        <div className="w-4 h-4 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
            <path d="M17.6 11.8c0-.1 0-.2-.1-.3l-2.1-3.6c-.1-.2-.3-.3-.5-.3H9.1c-.2 0-.4.1-.5.3L6.5 11.5c-.1.1-.1.2-.1.3s0 .2.1.3l2.1 3.6c.1.2.3.3.5.3h5.8c.2 0 .4-.1.5-.3l2.1-3.6c.1-.1.1-.2.1-.3z" fill="#3b82f6"/>
            <circle cx="12" cy="12" r="2" fill="white"/>
            <circle cx="12" cy="12" r="1" fill="#3b82f6"/>
          </svg>
        </div>
      ),
    });
  }

  const selected = baseOptions.find((o) => o.id === value) || baseOptions[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
      >
        {selected.icon}
        {selected.label}
        <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-50 overflow-hidden">
          {baseOptions.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors ${value === o.id ? "border-l-2 border-indigo-400 text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"}`}
            >
              {o.icon}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Modal to show elaborative optimization hints
const CategoryModal = ({ isOpen, onClose, category }) => {
  if (!isOpen || !category) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl border ${category.iconBg} ${category.iconColor} flex items-center justify-center`}
            >
              {category.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {category.label}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {category.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Strategy / Hints section */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Optimization
              Strategy & Hints
            </h3>
            <div className="border border-blue-200 dark:border-blue-800 rounded-2xl p-5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {category.hint ? (
                <p>{category.hint}</p>
              ) : (
                <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                  <li>
                    Review your historical usage before making any commitments.
                  </li>
                  <li>
                    Ensure resources mapped to these recommendations are
                    actually safe to modify or delete.
                  </li>
                  <li>
                    Consult with the engineering team before shutting down
                    instances to avoid downtime.
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Actual Recommendations List */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-gray-400" /> Affected Resources
                ({category.recs?.length || 0})
              </h3>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold mb-1">
                  Maitsys Savings
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(category.amount)}
                </p>
              </div>
            </div>

            {category.recs && category.recs.length > 0 ? (
              <div className="space-y-3">
                {category.recs.map((rec, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {rec.action || "Optimize"}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {rec.description}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 px-2 py-1 rounded-lg">
                          +{formatCurrency(Number(rec.estimated_savings || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <Info className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  No specific resources found
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This is a passive or estimated saving category based on your
                  total spend.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RecommendationsPage = () => {
  const { user, cloudAccess } = useAuth();
  const [data, setData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [btpDetail, setBtpDetail] = useState(null); // full BTP cost data for savings analysis
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const subHasAzure = !cloudAccess.length || cloudAccess.includes("azure");
  const subHasAws   = !cloudAccess.length || cloudAccess.includes("aws");
  const subHasBtp   = !cloudAccess.length || cloudAccess.includes("btp");
  const subHasGcp   = !cloudAccess.length || cloudAccess.includes("gcp");
  const hasAzureAccess = (isAdmin || user?.canViewAzure) && subHasAzure;
  const hasAwsAccess   = (isAdmin || user?.canViewAws)   && subHasAws;
  const hasBtpAccess   = (isAdmin || user?.canViewBtp)   && subHasBtp;
  const hasGcpAccess   = (isAdmin || user?.canViewGcp)   && subHasGcp;
  const activeCount = [hasAzureAccess, hasAwsAccess, hasBtpAccess, hasGcpAccess].filter(Boolean).length;
  const defaultProvider =
    activeCount > 1
      ? ""
      : hasAzureAccess
        ? "azure"
        : hasAwsAccess
          ? "aws"
          : hasBtpAccess
            ? "btp"
            : hasGcpAccess
              ? "gcp"
              : "";

  const [providerFilter, setProviderFilter] = useState(defaultProvider);
  const [selectedCategory, setSelectedCategory] = useState(null); // For modal

  const hasAccounts = user?.canViewAzure || user?.canViewAws || user?.canViewBtp || user?.canViewGcp;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = providerFilter
        ? `/recommendations?provider=${providerFilter}`
        : "/recommendations";
      const [recRes, sumRes] = await Promise.all([
        api.get(endpoint),
        api.get("/summary/home"),
      ]);
      setData(recRes.data);
      const sData = sumRes.data;
      setSummaryData(sData);

      // Fetch history data for all accounts of the selected provider(s)
      const fetchHistory = async () => {
        let accountsToFetch = [];
        if (
          hasAzureAccess &&
          (providerFilter === "" || providerFilter === "azure")
        ) {
          (sData.azure?.accounts || []).forEach((acc) =>
            accountsToFetch.push({ platform: "azure", id: acc.id }),
          );
        }
        if (
          hasAwsAccess &&
          (providerFilter === "" || providerFilter === "aws")
        ) {
          (sData.aws?.accounts || []).forEach((acc) =>
            accountsToFetch.push({ platform: "aws", id: acc.id }),
          );
        }
        if (
          hasGcpAccess &&
          (providerFilter === "" || providerFilter === "gcp")
        ) {
          (sData.gcp?.accounts || []).forEach((acc) =>
            accountsToFetch.push({ platform: "gcp", id: acc.id }),
          );
        }

        const historyPromises = accountsToFetch.map((acc) =>
          api
            .get(`/${acc.platform}/yearly?accountId=${acc.id}`)
            .catch(() => ({ data: [] })),
        );
        const results = await Promise.all(historyPromises);

        // Aggregate by month (e.g. "2024-05")
        const aggregated = {};
        results.forEach((res) => {
          (res.data || []).forEach((item) => {
            const key = `${item.year}-${String(item.month).padStart(2, "0")}`;
            if (!aggregated[key]) aggregated[key] = 0;
            aggregated[key] += Number(item.totalCost || 0);
          });
        });

        const sortedKeys = Object.keys(aggregated).sort();
        const mappedHistory = sortedKeys.map((k) => {
          const [y, m] = k.split("-");
          const date = new Date(y, Number(m) - 1);
          const monthStr =
            date.toLocaleString("default", { month: "short" }) +
            " " +
            date.getFullYear().toString().slice(2);
          return { month: monthStr, totalCost: aggregated[k] };
        });
        setHistoryData(mappedHistory);
      };

      await fetchHistory();

      // Fetch BTP detail for savings analysis when BTP is selected
      if (hasBtpAccess && (providerFilter === "btp" || providerFilter === "")) {
        const btpAccounts = sData?.btp?.accounts || [];
        if (btpAccounts.length > 0) {
          const btpRes = await api.get(`/btp/costs?accountId=${btpAccounts[0].id}`).catch(() => ({ data: null }));
          setBtpDetail(btpRes.data);
        }
      }
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccounts) {
      load();
    } else {
      setLoading(false);
    }
  }, [hasAccounts, providerFilter]);

  const recs = data?.data || [];

  const { rates: MSP_RATES } = useMspRates();

  // Per-provider spend from summary API
  const azureSpend = summaryData ? Number(summaryData.azure?.totalCost || 0) : 0;
  const awsSpend   = summaryData ? Number(summaryData.aws?.totalCost   || 0) : 0;
  const btpSpend   = summaryData ? Number(summaryData.btp?.totalCost   || 0) : 0;
  const gcpSpend   = summaryData ? Number(summaryData.gcp?.totalCost   || 0) : 0;

  // Effective spend for the selected provider filter
  const effectiveAzureSpend = (providerFilter === "aws" || providerFilter === "btp" || providerFilter === "gcp") ? 0 : azureSpend;
  const effectiveAwsSpend   = (providerFilter === "azure" || providerFilter === "btp" || providerFilter === "gcp") ? 0 : awsSpend;
  const effectiveBtpSpend   = (providerFilter === "azure" || providerFilter === "aws" || providerFilter === "gcp") ? 0 : btpSpend;
  const effectiveGcpSpend   = (providerFilter === "azure" || providerFilter === "aws" || providerFilter === "btp") ? 0 : gcpSpend;

  // Always use the global summary API to get the true total spend of the cloud accounts
  let totalCurrent = 0;
  if (summaryData) {
    if (providerFilter === "azure") {
      totalCurrent = azureSpend;
    } else if (providerFilter === "aws") {
      totalCurrent = awsSpend;
    } else if (providerFilter === "btp") {
      totalCurrent = btpSpend;
    } else if (providerFilter === "gcp") {
      totalCurrent = gcpSpend;
    } else {
      totalCurrent = azureSpend + awsSpend + btpSpend + gcpSpend;
    }
  }

  // Maitsys optimization saving rates — applied to current spend
  const OPT_RATES = {
    ri:       0.15,  // 15% — Reserved Instances & Savings Plans
    unused:   0.08,  // 8%  — Unused / right-sized resources
    orphaned: 0.02,  // 2%  — Orphaned disks & snapshots
    idle:     0.01,  // 1%  — Idle public IPs
    others:   0.04,  // 4%  — Other (lifecycle, tiering, scaling)
  };

  // Categorise recs into arrays for the modal affected-resources list only
  const riRecs = [],
    unusedRecs = [],
    orphanedRecs = [],
    idleIpsRecs = [],
    othersRecs = [];
  const cspAzureRecs = [],
    cspMarketplaceRecs = [],
    cspBillingRecs = [];

  recs.forEach((r) => {
    const text = ((r.action || "") + " " + (r.description || "")).toLowerCase();
    if (text.includes("reserved instance") || text.includes("reservation") || text.includes("savings plan") || text.includes("purchase")) {
      riRecs.push(r);
    } else if (text.includes("rightsize") || text.includes("right-size") || text.includes("right size") || text.includes("shut down") || text.includes("stop") || text.includes("unused") || text.includes("underutilized")) {
      unusedRecs.push(r);
    } else if ((text.includes("disk") || text.includes("snapshot")) && (text.includes("delete") || text.includes("remove") || text.includes("unattached") || text.includes("orphaned"))) {
      orphanedRecs.push(r);
    } else if (text.includes("ip") && (text.includes("idle") || text.includes("unassociated"))) {
      idleIpsRecs.push(r);
    } else if (text.includes("csp") || text.includes("discount")) {
      cspAzureRecs.push(r);
    } else if (text.includes("marketplace")) {
      cspMarketplaceRecs.push(r);
    } else if (text.includes("commitment") || text.includes("billing")) {
      cspBillingRecs.push(r);
    } else {
      othersRecs.push(r);
    }
  });

  // BTP-only view: optimization categories (RI, Idle IPs, Orphaned Disks) don't apply to SAP BTP
  const isBtpOnly = providerFilter === "btp";
  // Non-infra providers don't use the standard optimization model
  const useOptModel = providerFilter !== "btp";

  // Optimization savings — Maitsys rates applied to actual spend (zero for BTP-only)
  const riSavings       = useOptModel ? totalCurrent * OPT_RATES.ri       : 0;
  const unusedRes       = useOptModel ? totalCurrent * OPT_RATES.unused    : 0;
  const orphanedDisks   = useOptModel ? totalCurrent * OPT_RATES.orphaned  : 0;
  const idleIps         = useOptModel ? totalCurrent * OPT_RATES.idle      : 0;
  const others          = useOptModel ? totalCurrent * OPT_RATES.others    : 0;

  // CSP/MSP savings — Maitsys contracted rates per provider (live from DB)
  const cspAzure       = effectiveAzureSpend * (MSP_RATES.azure ?? 0.07);
  const cspMarketplace = effectiveAwsSpend   * (MSP_RATES.aws   ?? 0.035);
  const cspBilling     = effectiveBtpSpend   * (MSP_RATES.btp   ?? 0.02);
  const cspGcp         = effectiveGcpSpend   * (MSP_RATES.gcp   ?? 0.02);

  // ── BTP-specific savings (data-driven from snapshot) ──────────────────────
  // 1. CPEA Commitment Model: switching from PAYG to CPEA saves ~10% on BTP consumption
  const btpCpeaSavings = isBtpOnly ? effectiveBtpSpend * 0.10 : 0;

  // 2. Service Plan Optimisation: identify services with enterprise/standard plans
  //    that have free-tier or lower-cost plan alternatives (~5% of BTP spend)
  const btpSvcsBySubaccount = btpDetail?.servicesBySubaccount ?? [];
  const allBtpServices = btpSvcsBySubaccount.flatMap((s) => s.services ?? []);
  const PAID_PLAN_KEYWORDS = ["enterprise", "standard", "application", "service", "default"];
  const FREE_ELIGIBLE_SERVICES = ["alert notification", "application autoscaler", "feature flags", "connectivity", "destination", "html5 application repository", "document management", "workflow management"];
  const downgradableCost = allBtpServices
    .filter((svc) => {
      const planLower = (svc.planName ?? "").toLowerCase();
      const nameLower = (svc.name ?? "").toLowerCase();
      return PAID_PLAN_KEYWORDS.some((k) => planLower.includes(k)) &&
             FREE_ELIGIBLE_SERVICES.some((s) => nameLower.includes(s));
    })
    .reduce((sum, svc) => sum + (svc.cost ?? 0), 0);
  const btpPlanSavings = isBtpOnly
    ? (downgradableCost > 0 ? downgradableCost * 0.6 : effectiveBtpSpend * 0.04)
    : 0;

  // 3. Unused/Low-usage instances: services with usage > 0 but cost > 0 and usage < 1 unit
  const unusedBtpCost = allBtpServices
    .filter((svc) => svc.cost > 0 && Number(svc.usage ?? 0) < 0.5)
    .reduce((sum, svc) => sum + (svc.cost ?? 0), 0);
  const btpUnusedSavings = isBtpOnly
    ? (unusedBtpCost > 0 ? unusedBtpCost * 0.8 : effectiveBtpSpend * 0.03)
    : 0;

  // 4. Subaccount consolidation: subaccounts spending < 5% of total are candidates
  const btpSubaccounts = btpDetail?.subaccounts ?? [];
  const fragSubs = btpSubaccounts.filter((s) => s.cost > 0 && effectiveBtpSpend > 0 && (s.cost / effectiveBtpSpend) < 0.05);
  const btpConsolidationSavings = isBtpOnly
    ? (fragSubs.length > 1 ? fragSubs.reduce((sum, s) => sum + s.cost, 0) * 0.15 : 0)
    : 0;

  const btpOptTotal = btpCpeaSavings + btpPlanSavings + btpUnusedSavings + btpConsolidationSavings;

  const optTotal = riSavings + unusedRes + orphanedDisks + idleIps + others;
  const cspTotal = cspAzure + cspMarketplace + cspBilling + cspGcp;

  // Total Savings is the sum of dynamic recommendations + the suggested passive CSP savings
  const totalSavings = isBtpOnly
    ? btpOptTotal + cspBilling
    : optTotal + cspTotal;

  // Pre-tax / Sales Tax only meaningful for Azure/AWS (invoice-based billing)
  const showTaxCards = !isBtpOnly && providerFilter !== "gcp";
  const preTax = showTaxCards ? totalCurrent * 0.977 : null;
  const salesTax = showTaxCards ? totalCurrent * 0.023 : null;
  // Compare savings against annualised spend (recommendations are annual estimates;
  // comparing against MTD-only spend inflates the percentage wildly mid-month).
  const annualisedCost = totalCurrent * 12;
  const savingsPctValue =
    annualisedCost > 0 ? (totalSavings / annualisedCost) * 100 : 0;
  const savingsPct = Math.min(savingsPctValue, 100).toFixed(2);

  const pct = (val, total) =>
    total > 0 ? ((val / total) * 100).toFixed(2) : "0.00";
  const getPctOfTotal = (val) =>
    annualisedCost > 0 ? Math.min((val / annualisedCost) * 100, 100).toFixed(2) : "0.00";

  const optimizationItems = [
    {
      icon: <TrendingDown className="w-5 h-5" />,
      iconBg: "border-purple-200 dark:border-purple-800",
      iconColor: "text-purple-600",
      label: "RI & Savings Plan Opportunities (15%)",
      description: "Convert eligible resources to RI / Savings Plans",
      hint: `Maitsys estimates 15% of your spend (${formatCurrency(totalCurrent)}) can be saved by committing steady-state workloads to Reserved Instances or Savings Plans. Typical RI discounts range from 30–72% on eligible compute — on your current run-rate this translates to ${formatCurrency(riSavings)} per month.`,
      amount: riSavings,
      percentage: getPctOfTotal(riSavings),
      recs: riRecs,
    },
    {
      icon: <Server className="w-5 h-5" />,
      iconBg: "border-orange-200 dark:border-orange-800",
      iconColor: "text-orange-600",
      label: "Unused / Underutilized Resources (8%)",
      description: "Right-size or remove over-provisioned resources",
      hint: `Maitsys benchmarks show ~8% of cloud spend is wasted on idle or oversized instances. On your current spend that is ${formatCurrency(unusedRes)} per month. Look for CPU utilisation below 5% or network throughput below 10% as candidates to downsize or stop during off-hours.`,
      amount: unusedRes,
      percentage: getPctOfTotal(unusedRes),
      recs: unusedRecs,
    },
    {
      icon: <Network className="w-5 h-5" />,
      iconBg: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600",
      label: "Idle Public IP Addresses (1%)",
      description: "Remove unassociated public IPs",
      hint: `Unattached public IPs accrue charges every hour regardless of use. Maitsys estimates ~1% of spend (${formatCurrency(idleIps)}/month) can be recovered by auditing and releasing idle elastic/static IP allocations.`,
      amount: idleIps,
      percentage: getPctOfTotal(idleIps),
      recs: idleIpsRecs,
    },
    {
      icon: <HardDrive className="w-5 h-5" />,
      iconBg: "border-purple-200 dark:border-purple-800",
      iconColor: "text-purple-600",
      label: "Orphaned Disks & Snapshots (2%)",
      description: "Remove unattached disks and stale snapshots",
      hint: `Managed disks and snapshots left behind after VM deletion silently accumulate costs. Maitsys estimates ~2% of spend (${formatCurrency(orphanedDisks)}/month) is recoverable by deleting unattached disks and snapshots older than 30 days.`,
      amount: orphanedDisks,
      percentage: getPctOfTotal(orphanedDisks),
      recs: orphanedRecs,
    },
    {
      icon: <Settings className="w-5 h-5" />,
      iconBg: "border-gray-200 dark:border-gray-700",
      iconColor: "text-gray-500",
      label: "Other Optimization Opportunities (4%)",
      description: "Storage tiering, auto-scaling, lifecycle policies",
      hint: `Maitsys estimates an additional ~4% (${formatCurrency(others)}/month) is achievable through storage lifecycle policies, Spot/preemptible instance use for non-critical workloads, and auto-scaling to match actual demand.`,
      amount: others,
      percentage: getPctOfTotal(others),
      recs: othersRecs,
    },
  ];

  const azureRatePct  = ((MSP_RATES.azure ?? 0.07)  * 100).toFixed(1);
  const awsRatePct    = ((MSP_RATES.aws   ?? 0.035) * 100).toFixed(1);
  const btpRatePct    = ((MSP_RATES.btp   ?? 0.02)  * 100).toFixed(1);
  const gcpRatePct    = ((MSP_RATES.gcp   ?? 0.02)  * 100).toFixed(1);

  const allCspItems = [
    {
      id: "azure",
      icon: <Tag className="w-5 h-5" />,
      iconBg: "border-emerald-200 dark:border-emerald-800",
      iconColor: "text-emerald-600",
      label: `Azure Maitsys MSP Discount (${azureRatePct}%)`,
      description: `${azureRatePct}% pricing advantage on Azure spend via Maitsys CSP`,
      hint: `Maitsys holds a direct Microsoft CSP partnership that provides a contracted ${azureRatePct}% discount on all Azure consumption versus standard Pay-As-You-Go pricing. On your current Azure spend of ${formatCurrency(effectiveAzureSpend)}, this saves you ${formatCurrency(cspAzure)} this month.`,
      amount: cspAzure,
      percentage: getPctOfTotal(cspAzure),
      recs: cspAzureRecs,
    },
    {
      id: "aws",
      icon: <ShoppingBag className="w-5 h-5" />,
      iconBg: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600",
      label: `AWS Maitsys Partner Discount (${awsRatePct}%)`,
      description: `${awsRatePct}% pricing advantage on AWS spend via Maitsys`,
      hint: `Maitsys's AWS Partner Network status delivers a ${awsRatePct}% discount on your AWS usage versus standard public pricing. On your current AWS spend of ${formatCurrency(effectiveAwsSpend)}, this saves you ${formatCurrency(cspMarketplace)} this month.`,
      amount: cspMarketplace,
      percentage: getPctOfTotal(cspMarketplace),
      recs: cspMarketplaceRecs,
    },
    {
      id: "btp",
      icon: <CreditCard className="w-5 h-5" />,
      iconBg: "border-orange-200 dark:border-orange-800",
      iconColor: "text-orange-600",
      label: `SAP BTP / Commitment Benefit (${btpRatePct}%)`,
      description: `${btpRatePct}% advantage on BTP & commitment-based billing`,
      hint: `Maitsys's SAP partnership provides a ${btpRatePct}% reduction on SAP BTP consumption. Additionally, multi-year commitment agreements across providers unlock further volume-based benefits beyond the per-provider MSP rate.`,
      amount: cspBilling,
      percentage: getPctOfTotal(cspBilling),
      recs: cspBillingRecs,
    },
    {
      id: "gcp",
      icon: <Cloud className="w-5 h-5" />,
      iconBg: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-500",
      label: `Google Cloud Partner Discount (${gcpRatePct}%)`,
      description: `${gcpRatePct}% pricing advantage on GCP spend via Maitsys`,
      hint: `Maitsys's Google Cloud Partner status delivers a ${gcpRatePct}% discount on your GCP usage versus standard public pricing. On your current GCP spend of ${formatCurrency(effectiveGcpSpend)}, this saves you ${formatCurrency(cspGcp)} this month.`,
      amount: cspGcp,
      percentage: getPctOfTotal(cspGcp),
      recs: [],
    },
  ];

  // Filter CSP items to only show relevant providers
  const cspItems = providerFilter
    ? allCspItems.filter((i) => i.id === providerFilter)
    : allCspItems.filter((i) => i.amount > 0 || (providerFilter === ""));

  // BTP-specific optimization items (data-driven)
  const btpOptItems = [
    {
      icon: <Zap className="w-5 h-5" />,
      iconBg: "border-blue-200 dark:border-blue-800",
      iconColor: "text-blue-600",
      label: "CPEA Commitment Model (10%)",
      description: "Switch from PAYG to CPEA for ~10% lower consumption cost",
      hint: `SAP BTP Cloud Platform Enterprise Agreement (CPEA) provides a ~10% cost reduction vs Pay-As-You-Go billing by pre-committing to an annual cloud credit pool. On your current BTP spend of ${formatCurrency(effectiveBtpSpend)}, this saves approximately ${formatCurrency(btpCpeaSavings)} per month.`,
      amount: btpCpeaSavings,
      percentage: getPctOfTotal(btpCpeaSavings),
      recs: [],
    },
    {
      icon: <Server className="w-5 h-5" />,
      iconBg: "border-amber-200 dark:border-amber-800",
      iconColor: "text-amber-600",
      label: "Service Plan Optimisation",
      description: "Downgrade eligible services to free-tier or lower-cost plans",
      hint: downgradableCost > 0
        ? `${allBtpServices.filter((s) => FREE_ELIGIBLE_SERVICES.some((f) => (s.name ?? "").toLowerCase().includes(f))).length} services detected using paid plans that have free-tier or community plan alternatives. Switching them saves an estimated ${formatCurrency(btpPlanSavings)} per month.`
        : `Maitsys estimates ~4% of BTP spend (${formatCurrency(btpPlanSavings)}) can be saved by reviewing service plans. Services like Alert Notification, App Autoscaler, Connectivity, and Destination have free-tier plans.`,
      amount: btpPlanSavings,
      percentage: getPctOfTotal(btpPlanSavings),
      recs: [],
    },
    {
      icon: <HardDrive className="w-5 h-5" />,
      iconBg: "border-red-200 dark:border-red-800",
      iconColor: "text-red-600",
      label: "Unused Service Instances",
      description: "Remove provisioned instances with zero or near-zero usage",
      hint: unusedBtpCost > 0
        ? `${allBtpServices.filter((s) => s.cost > 0 && Number(s.usage ?? 0) < 0.5).length} service instances are incurring cost with minimal usage (< 0.5 units). Deleting or deprovisioning them saves ${formatCurrency(btpUnusedSavings)} per month.`
        : `Review your BTP service instances for any that were provisioned for testing and never cleaned up. Estimated saving: ${formatCurrency(btpUnusedSavings)} per month.`,
      amount: btpUnusedSavings,
      percentage: getPctOfTotal(btpUnusedSavings),
      recs: [],
    },
    ...(btpConsolidationSavings > 0 ? [{
      icon: <Network className="w-5 h-5" />,
      iconBg: "border-purple-200 dark:border-purple-800",
      iconColor: "text-purple-600",
      label: `Subaccount Consolidation (${fragSubs.length} small accounts)`,
      description: `${fragSubs.length} subaccounts each under 5% of total spend — consider merging`,
      hint: `Subaccounts ${fragSubs.map((s) => s.name).join(", ")} each represent less than 5% of your total BTP spend. Consolidating them reduces administrative overhead, duplicate service provisioning, and per-subaccount fixed costs — saving an estimated ${formatCurrency(btpConsolidationSavings)} per month.`,
      amount: btpConsolidationSavings,
      percentage: getPctOfTotal(btpConsolidationSavings),
      recs: [],
    }] : []),
  ].filter((item) => item.amount > 0);

  const donutData = isBtpOnly
    ? [
        { name: "CPEA Commitment",         value: btpCpeaSavings,           percentage: pct(btpCpeaSavings, totalSavings) },
        { name: "Plan Optimisation",        value: btpPlanSavings,           percentage: pct(btpPlanSavings, totalSavings) },
        { name: "Unused Instances",         value: btpUnusedSavings,         percentage: pct(btpUnusedSavings, totalSavings) },
        { name: "Subaccount Consolidation", value: btpConsolidationSavings,  percentage: pct(btpConsolidationSavings, totalSavings) },
        { name: "Maitsys MSP (2%)",         value: cspBilling,               percentage: pct(cspBilling, totalSavings) },
      ].filter((d) => d.value > 0)
    : [
        {
          name: "RI & Savings Plan",
          value: riSavings,
          percentage: pct(riSavings, totalSavings),
        },
        {
          name: "Unused Resources",
          value: unusedRes,
          percentage: pct(unusedRes, totalSavings),
        },
        {
          name: "Orphaned Disks",
          value: orphanedDisks,
          percentage: pct(orphanedDisks, totalSavings),
        },
        {
          name: "Idle IPs",
          value: idleIps,
          percentage: pct(idleIps, totalSavings),
        },
        {
          name: "Others",
          value: others + cspTotal,
          percentage: pct(others + cspTotal, totalSavings),
        },
      ].filter((d) => d.value > 0);

  // Use the history data to project the savings trend (apply current savings percentage to historical costs)
  const savingsRatio = totalCurrent > 0 ? totalSavings / totalCurrent : 0.05;
  const trendData =
    historyData.length > 0
      ? historyData.map((h) => ({
          month: h.month,
          savings: h.totalCost * savingsRatio,
        }))
      : [
          { month: "Dec 23", savings: totalSavings * 0.4 },
          { month: "Jan 24", savings: totalSavings * 0.5 },
          { month: "Feb 24", savings: totalSavings * 0.65 },
          { month: "Mar 24", savings: totalSavings * 0.75 },
          { month: "Apr 24", savings: totalSavings * 0.9 },
          { month: "May 24", savings: totalSavings },
        ];

  // For BTP-only, generate top recommendations from btpOptItems (no server-side BTP recs exist)
  const btpTopRecs = isBtpOnly
    ? [
        { icon: <Zap className="w-4 h-4" />,       iconBg: "border-blue-200 dark:border-blue-800",   iconColor: "text-blue-600",   title: "Switch to CPEA Commitment Model",                         savings: btpCpeaSavings,          impact: btpCpeaSavings > 50 ? "High" : "Medium" },
        { icon: <Server className="w-4 h-4" />,    iconBg: "border-amber-200 dark:border-amber-800", iconColor: "text-amber-600",  title: "Downgrade eligible services to free-tier plans",          savings: btpPlanSavings,          impact: "Medium" },
        { icon: <HardDrive className="w-4 h-4" />, iconBg: "border-red-200 dark:border-red-800",     iconColor: "text-red-600",    title: "Remove unused/zero-usage service instances",              savings: btpUnusedSavings,        impact: unusedBtpCost > 0 ? "High" : "Low" },
        { icon: <CreditCard className="w-4 h-4" />,iconBg: "border-orange-200 dark:border-orange-800",iconColor: "text-orange-600",title: "Maitsys SAP BTP MSP Discount (2%) — applied automatically", savings: cspBilling,              impact: "Low" },
        ...(btpConsolidationSavings > 0 ? [{ icon: <Network className="w-4 h-4" />, iconBg: "border-purple-200 dark:border-purple-800", iconColor: "text-purple-600", title: `Consolidate ${fragSubs.length} low-spend subaccounts`, savings: btpConsolidationSavings, impact: "Medium" }] : []),
      ].filter((r) => r.savings > 0).slice(0, 4)
    : [];

  const topRecommendations = isBtpOnly
    ? btpTopRecs
    : recs.slice(0, 4).map((r) => ({
        icon: <Zap className="w-4 h-4" />,
        iconBg:
          r.estimated_savings > 1000
            ? "border-purple-200 dark:border-purple-800"
            : "border-orange-200 dark:border-orange-800",
        iconColor:
          r.estimated_savings > 1000 ? "text-purple-600" : "text-orange-600",
        title: r.description || r.action || "Optimize Resource",
        savings: Number(r.estimated_savings),
        impact: Number(r.estimated_savings) > 1000 ? "High" : "Medium",
      }));

  /* ── No cloud access at all → show restricted screen ── */
  if (!hasAccounts) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f111a] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto">
            <ShieldOff className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Access Restricted
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
              You don&apos;t have permission to view the Savings Overview. This
              page requires access to at least one cloud provider (Azure, AWS, or SAP BTP).
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-left space-y-3">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">
              What you need
            </p>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cloud className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Cloud Account Access
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ask your administrator to grant you Azure, AWS, SAP BTP, or GCP view permissions in User Management.
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Contact your organization admin to update your access rights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f111a] transition-colors p-4 sm:p-6 xl:p-8">
      {showWizard && (
        <GetStartedWizard
          onComplete={load}
          onClose={() => setShowWizard(false)}
        />
      )}

      <CategoryModal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Savings Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Optimization opportunities + Maitsys MSP savings (Azure {azureRatePct}% · AWS {awsRatePct}% · BTP {btpRatePct}% · GCP {gcpRatePct}%).
          </p>
        </div>

        <div className="mt-4 md:mt-0 z-50">
          <ProviderDropdown
            value={providerFilter}
            onChange={setProviderFilter}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top KPIs */}
          <div className={`grid grid-cols-1 gap-3 ${showTaxCards ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            <KPICard
              title="Total Amount"
              amount={totalCurrent}
              subtitle="USD"
              icon={<Wallet className="w-5 h-5" />}
              iconBg="border-blue-200 dark:border-blue-800"
              iconColor="text-blue-600"
              isTotal={true}
            />
            {showTaxCards && (
              <KPICard
                title="Pre-tax Charges"
                amount={preTax}
                icon={<FileBarChart className="w-5 h-5" />}
                iconBg="border-emerald-200 dark:border-emerald-800"
                iconColor="text-emerald-600"
              />
            )}
            {showTaxCards && (
              <KPICard
                title="Sales Tax (7%)"
                amount={salesTax}
                icon={<Lightbulb className="w-5 h-5" />}
                iconBg="border-red-200 dark:border-red-800"
                iconColor="text-red-600"
              />
            )}
            {!showTaxCards && isBtpOnly && (
              <KPICard
                title="BTP Optimization Potential"
                amount={btpOptTotal}
                subtitle={`CPEA · Plan downgrade · Unused instances${btpConsolidationSavings > 0 ? " · Consolidation" : ""}`}
                icon={<Zap className="w-5 h-5" />}
                iconBg="border-blue-200 dark:border-blue-800"
                iconColor="text-blue-600"
              />
            )}
            {!showTaxCards && !isBtpOnly && (
              <KPICard
                title="Optimization Potential"
                amount={optTotal}
                subtitle="RI · Right-sizing · Orphaned disks · Idle IPs · Other"
                icon={<Zap className="w-5 h-5" />}
                iconBg="border-purple-200 dark:border-purple-800"
                iconColor="text-purple-600"
              />
            )}
            <KPICard
              title="Total Savings (Potential)"
              amount={totalSavings}
              subtitle={`${savingsPct}% of annualised spend · ${isBtpOnly ? `Maitsys MSP ${btpRatePct}%` : "Optimization + Maitsys MSP"}`}
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg="border-emerald-200 dark:border-emerald-800"
              iconColor="text-emerald-600"
              trend="up"
            />
          </div>

          {/* Top Grid: Trend, Donut, Recommendations */}
          <div className={`grid grid-cols-1 gap-6 ${isBtpOnly ? "lg:grid-cols-2" : "lg:grid-cols-3"}`}>
            {!isBtpOnly && historyData.length > 0 && <SavingsTrendChart data={trendData} />}
            <SavingsDonutChart
              data={
                donutData.length
                  ? donutData
                  : [{ name: "No Savings", value: 1, percentage: "0" }]
              }
              totalAmount={totalSavings}
            />
            <TopRecommendationsList recommendations={topRecommendations} />
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isBtpOnly ? (
              <SavingsCategoryCard
                title="BTP Optimization Opportunities"
                amount={btpOptTotal}
                percentage={getPctOfTotal(btpOptTotal)}
                subtitle="CPEA commitment model · service plan downgrades · unused instances · subaccount consolidation"
                items={btpOptItems}
                type="optimization"
                onItemClick={(item) => setSelectedCategory(item)}
              />
            ) : (
              <SavingsCategoryCard
                title="Savings by Optimization (You Can Control)"
                amount={optTotal}
                percentage={getPctOfTotal(optTotal)}
                subtitle={`Maitsys rates: RI 15% · Right-sizing 8% · Orphaned disks 2% · Idle IPs 1% · Other 4% of your ${providerFilter ? providerFilter.toUpperCase() : "total"} spend.`}
                items={optimizationItems.filter((item) => item.amount > 0)}
                type="optimization"
                onItemClick={(item) => setSelectedCategory(item)}
              />
            )}
            <SavingsCategoryCard
              title="Maitsys MSP Savings (Per-Provider Rates)"
              amount={providerFilter ? cspItems.reduce((s, i) => s + i.amount, 0) : cspTotal}
              percentage={getPctOfTotal(providerFilter ? cspItems.reduce((s, i) => s + i.amount, 0) : cspTotal)}
              subtitle={isBtpOnly
                ? `Maitsys's SAP partnership provides a ${btpRatePct}% reduction on SAP BTP consumption — applied automatically on all BTP billing.`
                : `Savings you get automatically via Maitsys's contracted MSP/CSP rates — Azure ${azureRatePct}%, AWS ${awsRatePct}%, BTP ${btpRatePct}%, GCP ${gcpRatePct}%.`}
              items={cspItems}
              type="csp"
              onItemClick={(item) => setSelectedCategory(item)}
            />
          </div>

          {/* Footer Tip */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="font-bold text-gray-900 dark:text-white">
                Tip:
              </span>{" "}
              Take action on the top optimization opportunities to maximize your
              savings. Recalculate after changes to see updated savings.
            </div>
            <button
              onClick={load}
              className="flex items-center gap-2 border border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors hover:border-blue-500"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Recalculate Savings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;
