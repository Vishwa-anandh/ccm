import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Sun, Moon, CheckCircle2, XCircle, Clock, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const SYNC_ICON = {
  success: { Icon: CheckCircle2, cls: "text-emerald-500" },
  failed: { Icon: XCircle, cls: "text-red-500" },
  running: { Icon: Clock, cls: "text-amber-500" },
};

const timeAgo = (iso) => {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Navbar = ({ theme, toggleTheme, toggleMobileMenu }) => {
  const { user } = useAuth();
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Only fetch when the user is authenticated — avoids 401 on page refresh
    // while AuthContext is still hydrating from localStorage.
    if (!user) return;

    let cancelled = false;
    const fetchSync = () =>
      api
        .get("/sync-logs/last")
        .then((r) => {
          if (!cancelled) setLastSync(r.data);
        })
        .catch(() => {});
    fetchSync();
    const id = setInterval(fetchSync, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [user]);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleMobileMenu}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle Menu"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 shadow-sm hidden sm:flex">
            <img src="/logo_new.svg" alt="Logo" className="h-4 w-4" />
          </div>
          <div className="leading-none">
            <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              Maitsys
            </span>
            <span className="block text-[9px] font-bold text-gray-400tracking-wider mt-0.5">
              Cloud Cost Monitoring
            </span>
          </div>
        </div>

        {/* Right: last sync + theme + avatar */}
        <div className="flex items-center gap-2">
          {/* Last sync pill */}
          {lastSync &&
            (() => {
              const { Icon, cls } =
                SYNC_ICON[lastSync.status] ?? SYNC_ICON.running;
              const providerCls =
                lastSync.provider === "azure"
                  ? "text-blue-500"
                  : "text-orange-500";
              return (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800"
                  title={`${lastSync.account_name} · ${lastSync.provider?.toUpperCase()}`}
                >
                  <Icon className={`w-3 h-3 shrink-0 ${cls}`} />
                  <span
                    className={`text-[10px] font-bold  tracking-wide ${providerCls}`}
                  >
                    {lastSync.provider}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    ·
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    {timeAgo(lastSync.completed_at)}
                  </span>
                </div>
              );
            })()}

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </button>

          {/* User avatar */}
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-950" />
          </div>
        </div>
      </div>
    </header>
  );
};

Navbar.propTypes = {
  theme: PropTypes.string.isRequired,
  toggleTheme: PropTypes.func.isRequired,
};

export default Navbar;
