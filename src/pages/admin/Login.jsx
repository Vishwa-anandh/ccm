import React, { useState, useEffect } from "react";
import api from "../../api/adminApi";
import { ShieldAlert, ArrowRight, User } from "lucide-react";
import AuthCarousel from "../../components/AuthCarousel";
import { PasswordInput } from "../../components/PasswordInput";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect away if already authenticated
  useEffect(() => {
    if (localStorage.getItem("sa_token")) {
      window.location.replace("/admin/dashboard");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("sa_token", res.data.token);
      localStorage.setItem("sa_username", res.data.username);
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-white dark:bg-gray-950 p-4 sm:p-6 font-sans relative overflow-hidden">
      <div className="w-full max-w-5xl h-full max-h-[700px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.10)] flex overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
        {/* ── Left Form ── */}
        <div className="w-full lg:w-1/2 p-6 sm:p-12 flex flex-col justify-center relative overflow-y-auto">
          {/* Logo + title */}
          <div className="flex flex-col items-center justify-center gap-0 mb-8">
            <img
              src="/app-logo.png"
              alt="Maitsys Logo"
              className="w-24 h-24 object-contain"
            />
            <div className="text-center -mt-3">
              {/* <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Super Admin
              </h1> */}
              <p className="text-xs font-semibold text-brand-600 mt-0.5 tracking-widest">
                Authorized Access Only
              </p>
            </div>
          </div>

          {/* Secure access banner */}
          <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-800 dark:text-brand-300">
                Restricted Portal
              </p>
              <p className="text-[10px] text-brand-600 dark:text-brand-400 font-medium">
                This area is for authorized Maitsys administrators only.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl mb-5 text-sm font-medium text-center animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 outline-none transition-all"
                  placeholder="Enter admin username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                Password
              </label>
              <PasswordInput
                name="sa_password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-2xl font-bold focus:ring-2 focus:ring-offset-2 focus:ring-brand-600 transition-all shadow-lg shadow-brand-600/20 active:scale-95 mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating…" : "Secure Login"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-10 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-300 dark:text-gray-600 ">
              Maitsys Secure Portal · © 2026
            </p>
          </div>
        </div>

        {/* ── Right Carousel ── */}
        <div className="hidden lg:block lg:w-1/2 relative bg-slate-900 overflow-hidden">
          <AuthCarousel />
        </div>
      </div>
    </div>
  );
}
