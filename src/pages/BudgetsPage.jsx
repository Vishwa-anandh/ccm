import React, { useState, useEffect } from "react";
import api from "../api/index";
import { getBudgets, createBudget, deleteBudget } from "../api/budgetApi";
import {
  getIntegrations,
  createIntegration,
  deleteIntegration,
} from "../api/integrationApi";
import {
  Plus,
  Trash2,
  BellRing,
  Settings,
  CircleDollarSign,
  Inbox,
  ShieldAlert,
} from "lucide-react";
import { fireToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";

const BudgetsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const canManageBudgets =
    isAdmin ||
    (user?.canViewAzure && !user?.azureReadOnly) ||
    (user?.canViewAws && !user?.awsReadOnly) ||
    (user?.canViewBtp && !user?.btpReadOnly) ||
    (user?.canViewGcp && !user?.gcpReadOnly);

  const [activeTab, setActiveTab] = useState("budgets");

  // Budgets State
  const [budgets, setBudgets] = useState([]);
  const [budgetForm, setBudgetForm] = useState({
    name: "",
    target_amount: "",
    alert_threshold: 80,
    scope_type: "organization",
    scope_value: "",
  });

  // Accounts for Scope Selection
  const [cloudAccounts, setCloudAccounts] = useState([]);

  // Integrations State
  const [integrations, setIntegrations] = useState([]);
  const [integrationForm, setIntegrationForm] = useState({
    provider: "email",
    webhook_url: "",
    email_addresses: "",
    alert_scope: "global",
    budget_id: "",
  });
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [b, i, awsRes, azureRes, btpRes, gcpRes] = await Promise.all([
        getBudgets(),
        getIntegrations(),
        api.get("/aws/accounts").catch(() => ({ data: [] })),
        api.get("/azure/accounts").catch(() => ({ data: [] })),
        api.get("/btp/accounts").catch(() => ({ data: [] })),
        api.get("/gcp/accounts").catch(() => ({ data: [] })),
      ]);
      setBudgets(b);
      setIntegrations(i);

      const awsAccounts = (awsRes.data || []).map((a) => ({
        id: a.id,
        name: `AWS - ${a.name || a.account_id}`,
        provider: "AWS",
      }));
      const azureAccounts = (azureRes.data || []).map((a) => ({
        id: a.id,
        name: `Azure - ${a.name || a.subscription_id}`,
        provider: "Azure",
      }));
      const btpAccounts = (btpRes.data || []).map((a) => ({
        id: a.id,
        name: `SAP BTP - ${a.name}`,
        provider: "BTP",
      }));
      const gcpAccounts = (gcpRes.data || []).map((a) => ({
        id: a.id,
        name: `GCP - ${a.name || a.projectId}`,
        provider: "GCP",
      }));
      setCloudAccounts([...awsAccounts, ...azureAccounts, ...btpAccounts, ...gcpAccounts]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...budgetForm };
      if (dataToSubmit.scope_type === "organization") {
        dataToSubmit.scope_value = "";
      }
      await createBudget(dataToSubmit);
      fireToast("Budget created successfully", "success");
      setBudgetForm({
        name: "",
        target_amount: "",
        alert_threshold: 80,
        scope_type: "organization",
        scope_value: "",
      });
      loadData();
    } catch (err) {
      fireToast("Failed to create budget", "error");
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await deleteBudget(id);
      fireToast("Budget deleted", "info");
      loadData();
    } catch (err) {
      fireToast("Failed to delete budget", "error");
    }
  };

  const handleCreateIntegration = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...integrationForm };
      if (payload.provider === "email") {
        if (emails.length === 0) {
          fireToast("Please add at least one email address", "warning");
          return;
        }
        payload.email_addresses = emails.join(",");
      }
      if (payload.alert_scope === "global") {
        payload.budget_id = "";
      } else if (!payload.budget_id) {
        fireToast("Please select a budget for this alert", "warning");
        return;
      }
      await createIntegration(payload);
      fireToast("Integration added successfully", "success");
      setIntegrationForm({
        provider: "email",
        webhook_url: "",
        email_addresses: "",
        alert_scope: "global",
        budget_id: "",
      });
      setEmails([]);
      loadData();
    } catch (err) {
      fireToast("Failed to add integration", "error");
    }
  };

  const handleAddEmail = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = emailInput.trim();
      if (val && !emails.includes(val) && val.includes("@")) {
        setEmails([...emails, val]);
        setEmailInput("");
      }
    }
  };

  const removeEmail = (email) => {
    setEmails(emails.filter((em) => em !== email));
  };

  const handleDeleteIntegration = async (id) => {
    try {
      await deleteIntegration(id);
      fireToast("Integration deleted", "info");
      loadData();
    } catch (err) {
      fireToast("Failed to delete integration", "error");
    }
  };

  return (
    <div className="p-4 sm:p-6 xl:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Budgets & Alerts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your spending limits and notification channels.
          </p>
        </div>
      </div>

      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("budgets")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "budgets"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Settings className="w-4 h-4" />
          Budgets
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === "integrations"
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <BellRing className="w-4 h-4" />
          Alert Integrations
        </button>
      </div>

      {activeTab === "budgets" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 h-fit shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              Create New Budget
            </h3>
            {canManageBudgets ? (
              <form onSubmit={handleCreateBudget} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Budget Name
                  </label>
                  <input
                    required
                    value={budgetForm.name}
                    onChange={(e) =>
                      setBudgetForm({ ...budgetForm, name: e.target.value })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                    placeholder="e.g. Q3 Engineering"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Budget Scope
                  </label>
                  <select
                    value={budgetForm.scope_type}
                    onChange={(e) =>
                      setBudgetForm({
                        ...budgetForm,
                        scope_type: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="organization">
                      Organization Wide (All Cloud Accounts)
                    </option>
                    <option value="account">Specific Cloud Account</option>
                  </select>
                </div>

                {budgetForm.scope_type === "account" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Select Account
                    </label>
                    <select
                      required
                      value={budgetForm.scope_value}
                      onChange={(e) =>
                        setBudgetForm({
                          ...budgetForm,
                          scope_value: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">-- Choose Account --</option>
                      {cloudAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Target Amount ($)
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={budgetForm.target_amount}
                    onChange={(e) =>
                      setBudgetForm({
                        ...budgetForm,
                        target_amount: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Alert Threshold (%)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="150"
                    value={budgetForm.alert_threshold}
                    onChange={(e) =>
                      setBudgetForm({
                        ...budgetForm,
                        alert_threshold: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Budget
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <ShieldAlert className="w-8 h-8 text-gray-400 mb-3" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Read-Only Mode
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  You do not have Full Access mode to create or manage budgets.
                </p>
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-4">
            {budgets.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg">
                    {b.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Target: ${Number(b.target_amount).toLocaleString()} • Alerts
                    at {b.alert_threshold}%
                    <br />
                    <span className="text-xstracking-wide opacity-70 mt-1 block">
                      Scope:{" "}
                      {b.scope_type === "organization"
                        ? "Organization Wide"
                        : `Account ID: ${b.scope_value}`}
                    </span>
                  </p>
                </div>
                {canManageBudgets && (
                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="text-red-500 hover:text-red-600 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {budgets.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 border-dashed rounded-2xl h-full">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-4">
                  <CircleDollarSign className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  No Budgets Found
                </h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  You haven't set up any budgets yet. Create one to start
                  monitoring your cloud spend and receive alerts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "integrations" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 h-fit shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              Add Notification Channel
            </h3>
            {canManageBudgets ? (
              <form onSubmit={handleCreateIntegration} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Provider
                  </label>
                  <select
                    value={integrationForm.provider}
                    onChange={(e) =>
                      setIntegrationForm({
                        ...integrationForm,
                        provider: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm mb-4"
                  >
                    <option value="email">Email</option>
                    <option value="teams">Microsoft Teams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Alert Scope
                  </label>
                  <select
                    value={integrationForm.alert_scope}
                    onChange={(e) =>
                      setIntegrationForm({
                        ...integrationForm,
                        alert_scope: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="global">Global Alert (All Budgets)</option>
                    <option value="budget_specific">Budget Based Alert</option>
                  </select>
                </div>

                {integrationForm.alert_scope === "budget_specific" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Select Budget
                    </label>
                    <select
                      value={integrationForm.budget_id}
                      onChange={(e) =>
                        setIntegrationForm({
                          ...integrationForm,
                          budget_id: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">-- Choose Budget --</option>
                      {budgets.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {integrationForm.provider === "teams" ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Webhook URL
                    </label>
                    <input
                      required
                      value={integrationForm.webhook_url}
                      onChange={(e) =>
                        setIntegrationForm({
                          ...integrationForm,
                          webhook_url: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Email Addresses (Type and press Enter)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {emails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                        >
                          {email}
                          <button
                            type="button"
                            onClick={() => removeEmail(email)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-100"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={handleAddEmail}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                      placeholder="user@company.com"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Channel
                </button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <ShieldAlert className="w-8 h-8 text-gray-400 mb-3" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Read-Only Mode
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  You do not have Full Access mode to manage integrations.
                </p>
              </div>
            )}
          </div>

          <div className="col-span-2 space-y-4">
            {integrations.map((i) => (
              <div
                key={i.id}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white capitalize">
                    {i.provider} Integration
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 break-all">
                    {i.provider === "teams" ? i.webhook_url : i.email_addresses}
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded">
                    {i.budget_id
                      ? `Budget Specific: ${budgets.find((b) => b.id === i.budget_id)?.name || "Unknown"}`
                      : "Global Alert"}
                  </span>
                </div>
                {canManageBudgets && (
                  <button
                    onClick={() => handleDeleteIntegration(i.id)}
                    className="text-red-500 hover:text-red-600 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg shrink-0 ml-4"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {integrations.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 border-dashed rounded-2xl h-full">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  No Channels Added
                </h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  You haven't set up any notification channels. Add one to
                  receive timely alerts about your cloud spend.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetsPage;
