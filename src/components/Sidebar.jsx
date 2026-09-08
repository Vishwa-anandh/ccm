import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PiggyBank,
  FileBarChart,
  PieChart,
  BellRing,
  Users,
  Database,
  ChevronDown,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  User as UserIcon,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
} from "lucide-react";
import ProfileModal from "./ProfileModal";
import { useAuth } from "../context/AuthContext";
import { useConfirm } from "./ConfirmDialog";

/* ── Cloud icons ─────────────────────────────── */
const AzureIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path d="M5.90011 21L13.7001 21L19.4001 6.79999L12.1001 6.79999L5.90011 21Z" fill="currentColor" />
    <path d="M12.4001 21L12.4001 20.6L12.1001 21L12.4001 21ZM5.90011 21L0.100098 6.79999L6.8001 6.79999L9.9001 14.2L5.90011 21Z" fill="currentColor" />
    <path d="M12.3001 20.6L19.5001 3.5L12.6001 3.5L9.9001 10L12.3001 20.6Z" fill="#5EA0EF" />
  </svg>
);
AzureIcon.propTypes = { className: PropTypes.string };

const AwsIcon = ({ className }) => (
  <svg viewBox="0 0 96 96" className={className} fill="currentColor">
    <path d="M27.06 40.27c0 1.02.11 1.84.3 2.45.21.61.49 1.28.88 2 .14.23.2.46.2.67 0 .29-.18.58-.55.87l-1.83 1.22c-.26.17-.52.26-.76.26-.29 0-.58-.15-.87-.43a8.97 8.97 0 0 1-1.05-1.37 22.6 22.6 0 0 1-.9-1.74c-2.26 2.67-5.1 4-8.52 4-2.43 0-4.37-.7-5.79-2.08-1.42-1.39-2.14-3.24-2.14-5.56 0-2.46.87-4.46 2.62-5.97 1.75-1.51 4.08-2.27 7.02-2.27.97 0 1.97.08 3.01.23.84.12 1.87.38 2.76.59v-1.75c0-2.14-.45-3.76-1.33-4.86-.9-1.1-2.36-1.64-4.4-1.64-1 0-2 .12-2.97.38-.97.26-1.92.6-2.85 1.05-.43.2-.73.31-.9.35a1.6 1.6 0 0 1-.41.06c-.35 0-.52-.26-.52-.79v-1.25c0-.41.06-.73.2-.9.13-.18.38-.35.75-.52a15.5 15.5 0 0 1 3.37-1.22 16.1 16.1 0 0 1 4.14-.52c3.15 0 5.45.72 6.92 2.14 1.45 1.43 2.2 3.6 2.2 6.51v8.57zm-11.78 4.4c.94 0 1.9-.17 2.93-.52 1.03-.35 1.95-.98 2.73-1.86.46-.55.81-1.16 1-1.83.2-.67.3-1.48.3-2.43v-1.17a23.63 23.63 0 0 0-2.6-.5 21.2 21.2 0 0 0-2.64-.17c-1.89 0-3.27.37-4.2 1.13-.93.76-1.39 1.83-1.39 3.24 0 1.32.34 2.3 1.02 2.97.67.68 1.6 1.14 2.85 1.14zm22.68 3.05c-.46 0-.76-.08-.96-.26-.2-.17-.38-.52-.52-1.02L31.72 22.7c-.15-.52-.22-.87-.22-1.05 0-.41.2-.64.61-.64h2.5c.49 0 .8.08.98.26.2.17.35.52.49 1.02l4.4 17.34 4.08-17.34c.12-.52.29-.85.49-1.02.2-.17.52-.26 1-.26h2.04c.49 0 .81.08 1.01.26.2.17.38.52.49 1.02l4.14 17.55 4.54-17.55c.15-.52.32-.85.5-1.02.2-.17.52-.26.97-.26h2.37c.41 0 .62.21.62.64 0 .12-.02.26-.06.41-.04.15-.1.35-.18.64l-6.2 23.74c-.14.52-.32.85-.52 1.02-.2.17-.52.26-.96.26H52.1c-.49 0-.8-.08-1.01-.26-.2-.18-.38-.52-.49-1.05l-4.05-16.87-4.02 16.87c-.12.52-.29.87-.49 1.05-.2.18-.52.26-1.01.26h-2.08zm33.07.7c-1.37 0-2.73-.17-4.05-.5-1.31-.33-2.33-.7-3.02-1.1-.42-.24-.7-.5-.8-.73a1.85 1.85 0 0 1-.14-.7v-1.3c0-.52.2-.78.58-.78.15 0 .3.03.44.08.15.06.38.15.62.26.84.38 1.75.67 2.7.87.97.2 1.92.3 2.9.3 1.54 0 2.73-.27 3.57-.8.84-.52 1.28-1.28 1.28-2.25 0-.67-.2-1.22-.61-1.66-.41-.44-1.19-.84-2.32-1.22l-3.33-1.03c-1.68-.53-2.93-1.3-3.7-2.33-.78-1.01-1.17-2.14-1.17-3.35 0-.97.2-1.83.6-2.57.41-.73.97-1.37 1.67-1.89.7-.52 1.5-.9 2.43-1.17.93-.26 1.9-.38 2.93-.38.52 0 1.05.03 1.57.1.53.06 1.01.15 1.49.26.46.12.9.24 1.31.38.41.15.73.3.97.44.32.2.55.4.7.61.14.2.2.46.2.78v1.2c0 .52-.2.79-.58.79-.2 0-.52-.09-.93-.26a11.2 11.2 0 0 0-4.69-.99c-1.39 0-2.49.23-3.27.7-.78.47-1.17 1.17-1.17 2.14 0 .67.23 1.24.7 1.69.46.44 1.31.88 2.52 1.28l3.27 1.02c1.66.52 2.87 1.27 3.6 2.23.73.97 1.1 2.08 1.1 3.3 0 1-.2 1.9-.59 2.7-.4.8-.96 1.5-1.69 2.06-.73.58-1.6 1-2.61 1.3-1.05.32-2.16.47-3.35.47z" />
    <path d="M85.54 64.67C75.52 71.98 60.95 75.84 48.4 75.84c-17.52 0-33.3-6.47-45.23-17.24-1-.84-.1-2 1.07-1.34 12.88 7.5 28.79 12.02 45.23 12.02 11.09 0 23.29-2.3 34.52-7.07 1.69-.73 3.11 1.11 1.55 2.46z" />
    <path d="M89.72 59.9c-1.33-1.72-8.83-.82-12.2-.41-1.02.12-1.18-.77-.26-1.42 5.97-4.2 15.76-2.99 16.9-1.58 1.15 1.42-.3 11.23-5.9 15.92-.87.73-1.69.34-1.3-.61 1.25-3.13 4.1-10.19 2.76-11.9z" />
  </svg>
);
AwsIcon.propTypes = { className: PropTypes.string };

const BtpIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L20 8.5v7L12 19.82 4 15.5v-7l8-4.32zM8 10v4h2v-4H8zm3 0v4h2v-4h-2zm3 0v4h2v-4h-2z" />
  </svg>
);
BtpIcon.propTypes = { className: PropTypes.string };

const GcpIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93V18c0-.55-.45-1-1-1H8v-2c0-.55-.45-1-1-1H5.07C5.52 9.24 8.53 7 12 7c1.85 0 3.56.63 4.9 1.68L15.46 10.1C14.74 9.41 13.42 9 12 9c-2.76 0-5 2.24-5 5h2c0-1.65 1.35-3 3-3 .85 0 1.62.35 2.17.91L12.7 13.38C12.49 13.15 12.26 13 12 13c-.55 0-1 .45-1 1v1H9v2h2v2.93z"/>
  </svg>
);
GcpIcon.propTypes = { className: PropTypes.string };

/* ── Custom tooltip (replaces native title="" everywhere in the sidebar) ── */
const Tooltip = ({ label, icon: Icon, children, active = true, small = false }) => {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  if (!active) return children;

  const handleEnter = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect();
      setPos({ top: r.top + r.height / 2, left: r.right + 8 });
    }
  };

  return (
    <div ref={ref} onMouseEnter={handleEnter} onMouseLeave={() => setPos(null)} className="contents">
      {children}
      {pos && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ top: pos.top, left: pos.left, transform: "translateY(-50%)" }}
        >
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-[#EFF6FF] dark:border-r-[#1e3a8f]" />
          <div
            className={`flex items-center gap-2.5 rounded-xl whitespace-nowrap shadow-xl bg-[#EFF6FF] dark:bg-[#1e3a8f]/90 border-l-[3px] border-[#2563EB] dark:border-[#3B82F6] ${small ? "px-2.5 py-1.5" : "px-3 py-2.5"}`}
          >
            {Icon && <Icon className="w-5 h-5 shrink-0 text-[#2563EB] dark:text-[#3B82F6]" />}
            <span className="text-[13px] font-semibold text-[#2563EB] dark:text-[#3B82F6]">{label}</span>
          </div>
        </div>
      )}
    </div>
  );
};
Tooltip.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  active: PropTypes.bool,
  small: PropTypes.bool,
};

/* ── Tooltip wrapper for collapsed nav items specifically ────── */
const NavTooltip = ({ label, icon, children, collapsed }) => (
  <Tooltip label={label} icon={icon} active={collapsed}>
    {children}
  </Tooltip>
);
NavTooltip.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  children: PropTypes.node.isRequired,
  collapsed: PropTypes.bool.isRequired,
};

/* ── Disabled/soon item ─────────────────────── */
const DisabledNavItem = ({ icon: Icon, label, badge, iconColor, collapsed }) => (
  <NavTooltip label={`${label} (Coming Soon)`} icon={Icon} collapsed={collapsed}>
    <div className={`flex items-center rounded-xl text-sm font-semibold opacity-40 cursor-not-allowed select-none text-[#475569] dark:text-[#475569] transition-all duration-200
      ${collapsed ? "justify-center px-0 py-2.5 mx-auto w-10 h-10" : "gap-3 px-3 py-2.5"}`}>
      <Icon className={`w-5 h-5 shrink-0 ${iconColor || ""}`} />
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#E2E8F0] dark:bg-[#1a2744] text-[#94A3B8] dark:text-[#475569] tracking-wide">
          {badge}
        </span>
      )}
    </div>
  </NavTooltip>
);
DisabledNavItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  badge: PropTypes.string,
  iconColor: PropTypes.string,
  collapsed: PropTypes.bool,
};

/* ── Invoice-only locked item ───────────────── */
const LockedNavItem = ({ icon: Icon, label, collapsed }) => (
  <NavTooltip label={`${label} — not included in your plan`} icon={Icon} collapsed={collapsed}>
    <div className={`flex items-center rounded-xl text-sm font-semibold opacity-30 cursor-not-allowed select-none text-[#475569] dark:text-[#475569] transition-all duration-200
      ${collapsed ? "justify-center px-0 py-2.5 mx-auto w-10 h-10" : "gap-3 px-3 py-2.5"}`}>
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 tracking-wide border border-amber-200 dark:border-amber-800">
          Upgrade
        </span>
      )}
    </div>
  </NavTooltip>
);
LockedNavItem.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  collapsed: PropTypes.bool,
};

/* ── Helpers ─────────────────────────────────── */
const navItemCls = (isActive, iconOnly) =>
  `flex items-center rounded-xl text-sm font-semibold transition-all duration-200
  ${iconOnly ? "justify-center px-0 py-2.5 w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5 w-full"}
  ${isActive
    ? "bg-[#EFF6FF] dark:bg-[#1e3a8f]/20 text-[#2563EB] dark:text-[#3B82F6]"
    : "text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744]/60"
  }`;

const subNavItemCls = (isActive) =>
  `flex items-center gap-3 pl-11 pr-3 py-2 rounded-xl text-sm transition-colors duration-200
  ${isActive
    ? "text-[#2563EB] dark:text-[#3B82F6] font-bold bg-[#EFF6FF] dark:bg-[#1e3a8f]/20 border-l-2 border-[#2563EB] dark:border-[#3B82F6]"
    : "text-[#64748B] dark:text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#CBD5E1] border-l-2 border-transparent"
  }`;

const parseCloudPrefs = (cloudAccess, cloudPref) => {
  // Prefer the new cloudAccess array from subscription
  if (Array.isArray(cloudAccess) && cloudAccess.length > 0) {
    return {
      showAzure: cloudAccess.includes('azure'),
      showAws:   cloudAccess.includes('aws'),
      showBtp:   cloudAccess.includes('btp'),
      showGcp:   cloudAccess.includes('gcp'),
    };
  }
  // Fall back to legacy cloud_preference string
  const prefs  = new Set(cloudPref ? cloudPref.split(',') : []);
  const showAll = cloudPref === 'all' || cloudPref === 'both';
  return {
    showAzure: showAll || prefs.has('azure'),
    showAws:   showAll || prefs.has('aws'),
    showBtp:   showAll || prefs.has('btp'),
    showGcp:   showAll || prefs.has('gcp'),
  };
};

/* ── Nav body ─────────────────────────────────── */
const SidebarNav = ({
  iconOnly, closeMobileMenu,
  showAzure, showAws, showBtp, showGcp,
  isAdmin, invoiceOnly, showInvoice, features,
  savingsOpen, setSavingsOpen,
}) => {
  const sec = iconOnly ? "hidden" : "text-[10px] font-bold text-[#94A3B8] tracking-wider pt-4 pb-1 px-1";
  const ni  = (a) => navItemCls(a, iconOnly);

  return (
    <nav className={`flex-1 py-2 overflow-y-auto overflow-x-hidden space-y-0.5 sidebar-scroll ${iconOnly ? "px-2" : "px-3"}`}>

      {/* ── Dashboard ── */}
      <NavTooltip label="Dashboard" icon={LayoutDashboard} collapsed={iconOnly}>
        <NavLink to="/" end onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
          <LayoutDashboard className="w-5 h-5 shrink-0" />{!iconOnly && <span>Dashboard</span>}
        </NavLink>
      </NavTooltip>

      {/* ── Cloud Costs (hidden in invoice-only mode) ── */}
      {!invoiceOnly && (showAzure || showAws || showBtp) && (
        <p className={sec}>Cloud Costs</p>
      )}
      {!invoiceOnly && showAzure && (
        <NavTooltip label="Azure Costs" icon={AzureIcon} collapsed={iconOnly}>
          <NavLink to="/azure" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
            <AzureIcon className="w-5 h-5 text-blue-500 shrink-0" />{!iconOnly && <span>Azure Costs</span>}
          </NavLink>
        </NavTooltip>
      )}
      {!invoiceOnly && showAws && (
        <NavTooltip label="AWS Costs" icon={AwsIcon} collapsed={iconOnly}>
          <NavLink to="/aws" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
            <AwsIcon className="w-5 h-5 text-orange-500 shrink-0" />{!iconOnly && <span>AWS Costs</span>}
          </NavLink>
        </NavTooltip>
      )}
      {!invoiceOnly && showBtp && (
        <NavTooltip label="SAP BTP Costs" icon={BtpIcon} collapsed={iconOnly}>
          <NavLink to="/btp" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
            <BtpIcon className="w-5 h-5 text-[#0070F2] shrink-0" />{!iconOnly && <span>SAP BTP Costs</span>}
          </NavLink>
        </NavTooltip>
      )}
      {!invoiceOnly && showGcp && (
        <NavTooltip label="GCP Costs" icon={GcpIcon} collapsed={iconOnly}>
          <NavLink to="/gcp" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
            <GcpIcon className="w-5 h-5 text-brand-500 shrink-0" />{!iconOnly && <span>GCP Costs</span>}
          </NavLink>
        </NavTooltip>
      )}

      {/* ── Optimisation ── */}
      <p className={sec}>Optimisation</p>

      {features.recommendations ? (
        iconOnly ? (
          <NavTooltip label="Savings" icon={PiggyBank} collapsed={iconOnly}>
            <NavLink to="/recommendations" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
              <PiggyBank className="w-5 h-5 shrink-0 text-emerald-500" />
            </NavLink>
          </NavTooltip>
        ) : (
          <>
            <button
              onClick={() => setSavingsOpen(!savingsOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-emerald-600 dark:text-emerald-400 hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744]/60"
            >
              <div className="flex items-center gap-3">
                <PiggyBank className="w-5 h-5 shrink-0" />
                <span>Savings</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 tracking-wide">MSP</span>
              </div>
              {savingsOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
            </button>
            {savingsOpen && (
              <div className="space-y-0.5">
                <NavLink to="/recommendations" onClick={closeMobileMenu} className={({ isActive }) => subNavItemCls(isActive)}>
                  Savings Overview
                </NavLink>
              </div>
            )}
          </>
        )
      ) : (
        <LockedNavItem icon={PiggyBank} label="Savings" collapsed={iconOnly} />
      )}

      {/* ── Operations ── */}
      {showInvoice && <p className={sec}>Operations</p>}
      {showInvoice && (
        <NavTooltip label="Reports / Invoices" icon={FileBarChart} collapsed={iconOnly}>
          <NavLink to="/invoices" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
            <FileBarChart className="w-5 h-5 shrink-0" />{!iconOnly && <span>Reports / Invoices</span>}
          </NavLink>
        </NavTooltip>
      )}

      {!showInvoice && <p className={sec}>Operations</p>}
      {features.customerInvoicing ? (
        <NavTooltip label="Billing" icon={Receipt} collapsed={iconOnly}>
          <NavLink to="/billing" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
            <Receipt className="w-5 h-5 shrink-0" />{!iconOnly && <span>Billing</span>}
          </NavLink>
        </NavTooltip>
      ) : (
        <LockedNavItem icon={Receipt} label="Billing" collapsed={iconOnly} />
      )}

      {features.smartAlerts ? (
        <NavTooltip label="Smart Alerts" icon={BellRing} collapsed={iconOnly}>
          <NavLink to="/smart-alerts" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
            <BellRing className="w-5 h-5 shrink-0" />{!iconOnly && <span>Smart Alerts</span>}
          </NavLink>
        </NavTooltip>
      ) : (
        <LockedNavItem icon={BellRing} label="Smart Alerts" collapsed={iconOnly} />
      )}

      {/* ── Governance ── */}
      <p className={sec}>Governance</p>

      {features.budgets ? (
        <NavTooltip label="Budgets" icon={PieChart} collapsed={iconOnly}>
          <NavLink to="/budgets" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
            <PieChart className="w-5 h-5 shrink-0" />{!iconOnly && <span>Budgets</span>}
          </NavLink>
        </NavTooltip>
      ) : (
        <LockedNavItem icon={PieChart} label="Budgets" collapsed={iconOnly} />
      )}

      {/* ── Account ── */}
      <p className={sec}>Account</p>
      <NavTooltip label="Subscription" icon={CreditCard} collapsed={iconOnly}>
        <NavLink to="/subscription" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
          <CreditCard className="w-5 h-5 shrink-0" />{!iconOnly && <span>Subscription</span>}
        </NavLink>
      </NavTooltip>

      {/* ── Administration (admin/owner only) ── */}
      {isAdmin && (
        <>
          <p className={sec}>Administration</p>
          <NavTooltip label="User Management" icon={Users} collapsed={iconOnly}>
            <NavLink to="/users" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
              <Users className="w-5 h-5 shrink-0" />{!iconOnly && <span>User Management</span>}
            </NavLink>
          </NavTooltip>

          {features.syncLogs ? (
            <NavTooltip label="Sync Logs" icon={Database} collapsed={iconOnly}>
              <NavLink to="/sync-logs" onClick={closeMobileMenu} className={({ isActive }) => ni(isActive)}>
                <Database className="w-5 h-5 shrink-0" />{!iconOnly && <span>Sync Logs</span>}
              </NavLink>
            </NavTooltip>
          ) : (
            <LockedNavItem icon={Database} label="Sync Logs" collapsed={iconOnly} />
          )}
        </>
      )}
    </nav>
  );
};
SidebarNav.propTypes = {
  iconOnly:        PropTypes.bool.isRequired,
  closeMobileMenu: PropTypes.func.isRequired,
  showAzure:       PropTypes.bool.isRequired,
  showAws:         PropTypes.bool.isRequired,
  showBtp:         PropTypes.bool.isRequired,
  showGcp:         PropTypes.bool.isRequired,
  isAdmin:         PropTypes.bool.isRequired,
  invoiceOnly:     PropTypes.bool.isRequired,
  showInvoice:     PropTypes.bool.isRequired,
  features:        PropTypes.object.isRequired,
  savingsOpen:     PropTypes.bool.isRequired,
  setSavingsOpen:  PropTypes.func.isRequired,
};

/* ── Bottom bar ───────────────────────────────── */
const SidebarBottom = ({ iconOnly, theme, toggleTheme, user, onProfileClick, onLogout, isProfileMenuOpen, onProfileModalOpen }) => (
  <div className={`border-t border-[#E2E8F0] dark:border-[#1a2744] shrink-0 ${iconOnly ? "p-2 space-y-1.5" : "p-3 space-y-2"}`}>
    <NavTooltip label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} icon={theme === "dark" ? Moon : Sun} collapsed={iconOnly}>
      <div onClick={toggleTheme}
        className={`flex items-center cursor-pointer rounded-xl transition-colors bg-[#F8FAFC] dark:bg-[#121A2F] hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744] border border-[#E2E8F0] dark:border-[#1a2744]
          ${iconOnly ? "justify-center w-10 h-10 mx-auto" : "justify-between px-3 py-2 gap-3"}`}>
        <div className={`flex items-center ${iconOnly ? "" : "gap-3"}`}>
          {theme === "dark" ? <Moon className="w-4 h-4 text-[#2563EB]" /> : <Sun className="w-4 h-4 text-amber-500" />}
          {!iconOnly && <span className="text-sm font-semibold text-[#475569] dark:text-[#94A3B8]">Theme</span>}
        </div>
        {!iconOnly && <span className="text-xs font-bold text-[#94A3B8] capitalize">{theme || "system"}</span>}
      </div>
    </NavTooltip>

    <div className="relative">
      <NavTooltip label={user?.fullName || "Profile"} icon={UserIcon} collapsed={iconOnly}>
        <div onClick={onProfileClick}
          className={`flex items-center cursor-pointer rounded-xl transition-colors bg-[#F8FAFC] dark:bg-[#121A2F] hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744] border border-[#E2E8F0] dark:border-[#1a2744]
            ${iconOnly ? "justify-center w-10 h-10 mx-auto" : "justify-between px-3 py-2 gap-3"}`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {!iconOnly && (
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate max-w-[90px]" title={user?.fullName || "User"}>{user?.fullName || "User"}</p>
                <p className="text-[10px] text-[#94A3B8] truncate max-w-[90px]" title={user?.orgName || "Global Tenant"}>{user?.orgName || "Global Tenant"}</p>
              </div>
            )}
          </div>
          {!iconOnly && (
            <Tooltip label="Sign out" small>
              <button
                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                className="text-[#94A3B8] hover:text-red-500 transition-colors p-1 shrink-0"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </Tooltip>
          )}
        </div>
      </NavTooltip>

      {isProfileMenuOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-52 bg-white dark:bg-[#0B1023] border border-[#E2E8F0] dark:border-[#1a2744] rounded-xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#1a2744] bg-[#F8FAFC] dark:bg-[#121A2F]">
            <p className="text-sm font-bold text-[#0F172A] dark:text-white truncate" title={user?.fullName}>{user?.fullName}</p>
            <p className="text-xs text-[#94A3B8] truncate" title={user?.email}>{user?.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {user?.planType && (
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EFF6FF] dark:bg-[#1e3a8f]/30 text-[#2563EB] dark:text-[#3B82F6]">
                  {user.planType} Plan
                </span>
              )}
              {user?.invoiceOnly && !(user?.invoiceOnly && (user?.cloudAccess ?? []).length > 0) && (
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  Invoice Only
                </span>
              )}
            </div>
          </div>
          <div className="p-1">
            <button onClick={toggleTheme}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744]/60 rounded-lg transition-colors">
              <span className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
                Theme
              </span>
              <span className="text-xs font-bold text-[#94A3B8] capitalize">{theme || "system"}</span>
            </button>
            <button onClick={onProfileModalOpen}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#475569] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744]/60 rounded-lg transition-colors">
              <UserIcon className="w-4 h-4" />Profile &amp; Password
            </button>
            <button onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);
SidebarBottom.propTypes = {
  iconOnly:           PropTypes.bool.isRequired,
  theme:              PropTypes.string.isRequired,
  toggleTheme:        PropTypes.func.isRequired,
  user:               PropTypes.object,
  onProfileClick:     PropTypes.func.isRequired,
  onLogout:           PropTypes.func.isRequired,
  isProfileMenuOpen:  PropTypes.bool.isRequired,
  onProfileModalOpen: PropTypes.func.isRequired,
};

/* ── Main Sidebar ─────────────────────────────── */
const Sidebar = ({ theme, toggleTheme, isOpen, closeMobileMenu }) => {
  const location = useLocation();
  const { user, logout, invoiceOnly, cloudAccess, features } = useAuth();
  const confirm = useConfirm();
  const [collapsed, setCollapsed]           = useState(false);
  const [savingsOpen, setSavingsOpen]       = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHovering, setIsHovering]         = useState(false);

  const iconOnly = collapsed;
  const isAdmin  = user?.role === "admin" || user?.role === "owner";
  const { showAzure, showAws, showBtp, showGcp } = parseCloudPrefs(
    cloudAccess,
    user?.cloudPreference ?? null,
  );
  // Hybrid = invoice_only flag but cloud providers are also configured
  const isHybrid = invoiceOnly && cloudAccess.length > 0;
  const hideCloudMenus = invoiceOnly && !isHybrid;
  // Show invoice menu only when org has invoice access (invoice_only or hybrid)
  const showInvoice = invoiceOnly || isHybrid;
  const w = iconOnly ? "w-[68px]" : "w-64";

  useEffect(() => { setIsProfileMenuOpen(false); }, [location.pathname]);
  useEffect(() => { if (collapsed) setSavingsOpen(false); }, [collapsed]);

  const handleLogout = async () => {
    const ok = await confirm({
      title:        "Log out?",
      message:      "You will be returned to the login screen.",
      confirmLabel: "Log out",
      cancelLabel:  "Stay",
      variant:      "logout",
    });
    if (ok) logout();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <aside
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`fixed inset-y-0 left-0 z-50 h-screen ${w} bg-white dark:bg-[#0B1023] text-[#0F172A] dark:text-[#CBD5E1] border-r border-[#E2E8F0] dark:border-[#1a2744] flex flex-col transition-all duration-300 ease-in-out md:static md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>

        {/* Logo + collapse toggle. Collapsed: shows just the logo by
            default, swapping to the expand button on hover so the rail
            stays clean until you actually want to act on it. */}
        <div className={`flex items-center border-b border-[#E2E8F0] dark:border-[#1a2744] shrink-0 h-[64px] ${iconOnly ? "justify-center px-2" : "gap-3 px-4"}`}>
          {!iconOnly && (
            <>
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white shadow-md shadow-black/10 overflow-hidden shrink-0 border border-[#E2E8F0] dark:border-[#1a2744]">
                <img src="/app-logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-bold text-[#0F172A] dark:text-white leading-none truncate">Maitsys</h1>
                <p className="text-[10px] text-[#94A3B8] mt-0.5 font-bold tracking-wider">Cloud Cost Monitor</p>
              </div>
              <Tooltip label="Collapse sidebar">
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="flex items-center justify-center w-8 h-8 rounded-xl text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744] transition-all shrink-0"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </Tooltip>
            </>
          )}
          {iconOnly && (
            isHovering ? (
              <Tooltip label="Expand sidebar">
                <button
                  onClick={() => setCollapsed(false)}
                  className="flex items-center justify-center w-9 h-9 rounded-xl text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F1F5F9] dark:hover:bg-[#1a2744] transition-all shrink-0"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              </Tooltip>
            ) : (
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-white shadow-md shadow-black/10 overflow-hidden shrink-0 border border-[#E2E8F0] dark:border-[#1a2744]">
                <img src="/app-logo.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
            )
          )}
        </div>

        <SidebarNav
          iconOnly={iconOnly}
          closeMobileMenu={closeMobileMenu}
          showAzure={showAzure}
          showAws={showAws}
          showBtp={showBtp}
          showGcp={showGcp}
          isAdmin={isAdmin}
          invoiceOnly={hideCloudMenus}
          showInvoice={showInvoice}
          features={features}
          savingsOpen={savingsOpen}
          setSavingsOpen={setSavingsOpen}
        />

        <SidebarBottom
          iconOnly={iconOnly}
          theme={theme}
          toggleTheme={toggleTheme}
          user={user}
          onProfileClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          onLogout={handleLogout}
          isProfileMenuOpen={isProfileMenuOpen}
          onProfileModalOpen={() => { setIsProfileMenuOpen(false); setIsProfileModalOpen(true); }}
        />

        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  theme:           PropTypes.string.isRequired,
  toggleTheme:     PropTypes.func.isRequired,
  isOpen:          PropTypes.bool.isRequired,
  closeMobileMenu: PropTypes.func.isRequired,
};

export default Sidebar;
