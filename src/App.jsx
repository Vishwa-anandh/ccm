import React from "react";
import PropTypes from "prop-types";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import AzureRoot from "./azure/AzureRoot";
import AwsRoot from "./aws/AwsRoot";
import BtpRoot from "./btp/BtpRoot";
import GcpRoot from "./gcp/GcpRoot";
import UserManagement from "./pages/UserManagement";
import InvoicesPage from "./pages/InvoicesPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import SyncLogsPage from "./pages/SyncLogsPage";
import BudgetsPage from "./pages/BudgetsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import ChatWidget from "./components/chat/ChatWidget";
import { ConfirmProvider } from "./components/ConfirmDialog";
import { ToastProvider } from "./components/ToastProvider";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import InvoiceDemoPage from "./pages/InvoiceDemoPage";
import InvoiceBuilderPage from "./pages/InvoiceBuilderPage";
import BillingPage from "./pages/billing/BillingPage";
import GenerateInvoicePage from "./pages/billing/GenerateInvoicePage";
import NotFoundPage from "./pages/NotFoundPage";
import SmartAlertsDashboard from "./pages/SmartAlertsDashboard";
import SubscriptionExpiredPage from "./pages/SubscriptionExpiredPage";
import SubscriptionManagementPage from "./pages/SubscriptionManagementPage";
import CloudPreferenceModal from "./components/CloudPreferenceModal";
import api from "./api";
import { ShieldOff } from "lucide-react";

const CACHE_TTL = 5 * 60 * 1000;
const isStale = (key) => {
  try {
    const d = JSON.parse(localStorage.getItem(key));
    return !d || Date.now() - d.ts > CACHE_TTL;
  } catch {
    return true;
  }
};

// Populate both summary caches in background right after login.
// By the time the user clicks Azure or AWS, data is already in localStorage → instant render.
const usePrefetch = (isAuthenticated, user) => {
  React.useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (user.canViewAzure && isStale("ccm_azure_summary")) {
      api
        .get("/azure/summary")
        .then((res) => {
          const data = res.data;
          const costs = {};
          let total = 0;
          data.forEach((a) => {
            costs[a.id] = a.totalCost;
            total += a.totalCost ?? 0;
          });
          const accounts = data.map((a) => ({
            id: a.id,
            name: a.name,
            subscriptionId: a.subscriptionId,
          }));
          localStorage.setItem(
            "ccm_azure_summary",
            JSON.stringify({ accounts, costs, total, ts: Date.now() }),
          );
        })
        .catch(() => {});
    }

    if (user.canViewAws && isStale("ccm_aws_summary")) {
      api
        .get("/aws/summary")
        .then((res) => {
          const data = res.data;
          const costs = {};
          let total = 0;
          data.forEach((a) => {
            costs[a.id] = a.totalCost ?? 0;
            total += a.totalCost ?? 0;
          });
          localStorage.setItem(
            "ccm_aws_summary",
            JSON.stringify({ costs, total, ts: Date.now() }),
          );
        })
        .catch(() => {});
    }

    if (user.canViewBtp && isStale("ccm_btp_summary")) {
      api
        .get("/btp/summary")
        .then((res) => {
          const data = res.data;
          const costs = {};
          let total = 0;
          (data.accounts ?? []).forEach((a) => {
            costs[a.id] = a.totalCost ?? 0;
            total += a.totalCost ?? 0;
          });
          localStorage.setItem(
            "ccm_btp_summary",
            JSON.stringify({ costs, total, ts: Date.now() }),
          );
        })
        .catch(() => {});
    }

    if (user.canViewGcp && isStale("ccm_gcp_summary")) {
      api
        .get("/gcp/summary")
        .then((res) => {
          const data = res.data;
          const costs = {};
          let total = 0;
          (data.accounts ?? []).forEach((a) => {
            costs[a.id] = a.totalCost ?? 0;
            total += a.totalCost ?? 0;
          });
          localStorage.setItem(
            "ccm_gcp_summary",
            JSON.stringify({ costs, total, ts: Date.now() }),
          );
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);
};

const isPrivileged = (user) => user?.role === "admin" || user?.role === "owner";

const AccessDenied = ({ label }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-8">
    <div className="max-w-md w-full text-center space-y-6">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 flex items-center justify-center mx-auto">
        <ShieldOff className="w-10 h-10 text-amber-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Access Restricted
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
          You don&apos;t have permission to view the{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {label}
          </span>{" "}
          section. Contact your administrator to request access.
        </p>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 text-left space-y-3">
        <p className="text-xs font-bold text-gray-400tracking-wider">
          What you need
        </p>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldOff className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {label} Access
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Ask your administrator to grant you the required permissions in
              User Management.
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
AccessDenied.propTypes = { label: PropTypes.string.isRequired };

const PermissionRoute = ({ check, label, children }) => {
  const { user } = useAuth();
  if (!user) return null;
  if (!check(user)) return <AccessDenied label={label} />;
  return children;
};
PermissionRoute.propTypes = {
  check: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const ProtectedLayout = ({ theme, toggleTheme }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  usePrefetch(isAuthenticated, user);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500">
        Loading application...
      </div>
    );
  if (!isAuthenticated) return <Navigate to="/login" />;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Sidebar - Handles both mobile and desktop inside */}
      <Sidebar
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top bar - Mobile only */}
        <div className="md:hidden">
          <Navbar
            theme={theme}
            toggleTheme={toggleTheme}
            toggleMobileMenu={toggleMobileMenu}
          />
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* AI Copilot */}
      <ChatWidget />

      {/* Onboarding Modal */}
      <CloudPreferenceModal />
    </div>
  );
};
ProtectedLayout.propTypes = {
  theme: PropTypes.string.isRequired,
  toggleTheme: PropTypes.func.isRequired,
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("sa_token");
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

function App() {
  const [theme, setTheme] = React.useState(
    localStorage.getItem("theme") || "light",
  );

  React.useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <AuthProvider>
      <ChatProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/subscription-expired" element={<SubscriptionExpiredPage />} />

                {/* Public demo route — no auth required */}
                <Route path="/invoice-demo" element={<InvoiceDemoPage />} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                <Route
                  element={
                    <ProtectedLayout theme={theme} toggleTheme={toggleTheme} />
                  }
                >
                  <Route path="/" element={<HomePage />} />
                  <Route
                    path="/azure/*"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u) || u.canViewAzure}
                        label="Azure"
                      >
                        <AzureRoot />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/aws/*"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u) || u.canViewAws}
                        label="AWS"
                      >
                        <AwsRoot />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/btp/*"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u) || u.canViewBtp}
                        label="SAP BTP"
                      >
                        <BtpRoot />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/gcp/*"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u) || u.canViewGcp}
                        label="Google Cloud"
                      >
                        <GcpRoot />
                      </PermissionRoute>
                    }
                  />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route
                    path="/billing/generate"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u)}
                        label="Generate Customer Invoice"
                      >
                        <GenerateInvoicePage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/recommendations"
                    element={<RecommendationsPage />}
                  />
                  <Route
                    path="/smart-alerts"
                    element={<SmartAlertsDashboard />}
                  />
                  <Route
                    path="/subscription"
                    element={<SubscriptionManagementPage />}
                  />
                  <Route
                    path="/budgets"
                    element={
                      <PermissionRoute
                        check={(u) =>
                          isPrivileged(u) || u.canViewAzure || u.canViewAws || u.canViewBtp
                        }
                        label="Budgets & Alerts"
                      >
                        <BudgetsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u)}
                        label="User Management"
                      >
                        <UserManagement />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/sync-logs"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u)}
                        label="Sync Logs"
                      >
                        <SyncLogsPage />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/invoice-builder"
                    element={
                      <PermissionRoute
                        check={(u) => isPrivileged(u)}
                        label="Invoice Builder"
                      >
                        <InvoiceBuilderPage />
                      </PermissionRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Router>
          </ConfirmProvider>
        </ToastProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
