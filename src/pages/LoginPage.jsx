import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Mail, ArrowRight, Key, Lock } from "lucide-react";
import AuthCarousel from "../components/AuthCarousel";
import { PasswordInput } from "../components/PasswordInput";

const LoginPage = () => {
  const { login, unlockAccount, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockToken, setUnlockToken] = useState("");
  const [unlockEmail, setUnlockEmail] = useState("");
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errParam = params.get("error");
    if (errParam === "account_deactivated") {
      setError(
        "Your company's access has been locked or deactivated by the Super Admin. Please contact support.",
      );
    } else if (errParam) {
      setError(errParam.replace(/_/g, " "));
    }
  }, [location.search]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { email, password } = formData;
    const result = await login(email, password);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error);
      if (result.isLocked) {
        setIsLocked(true);
        setUnlockEmail(email);
      }
    }
    setLoading(false);
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await unlockAccount(unlockEmail, unlockToken);
    if (result.success) {
      alert("Account unlocked! You can now login.");
      setIsLocked(false);
      setUnlockToken("");
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleNavigateToRegister = (e) => {
    e.preventDefault();
    navigate("/register");
  };

  return (
    <div className="h-[100dvh] bg-[#0a0f1e] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-5xl h-full max-h-[700px] rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_60px_rgba(0,0,0,0.5)] border border-white/[0.06] flex overflow-hidden relative z-10 bg-[#0d1424]">
        {/* ── Left Form Panel ── */}
        <div className="w-full lg:w-1/2 px-6 sm:px-12 py-8 flex flex-col justify-center relative overflow-y-auto bg-[#0d1424]">
          {/* Logo */}
          <div className="text-center mb-7">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl" />
                <img
                  src="/app-logo.png"
                  alt="Maitsys Logo"
                  className="relative w-20 h-20 rounded-2xl object-contain shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                />
              </div>
              <span className="text-slate-400 font-medium text-sm tracking-wide">
                Cloud Cost Monitoring
              </span>
            </div>
          </div>

          {!isLocked ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs p-3 rounded-xl text-center font-medium backdrop-blur-sm">
                Demo mode — no backend connected. Enter any email &amp;
                password to sign in.
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl text-center font-medium backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400  tracking-wider mb-2 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-white/[0.05] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2 ml-1">
                    <label className="block text-xs font-semibold text-slate-400  tracking-wider">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-white/[0.05] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form
              className="space-y-5 animate-in fade-in slide-in-from-bottom-4"
              onSubmit={handleUnlock}
            >
              <div className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm p-4 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <Lock size={15} /> Account Locked
                </div>
                <p className="text-xs text-purple-400/80">
                  This account has been secured. Enter the unlock token provided
                  to you.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl text-center font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400  tracking-wider mb-2 ml-1">
                  Unlock Token
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter unlock code"
                    value={unlockToken}
                    onChange={(e) => setUnlockToken(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 rounded-xl text-purple-300 placeholder-slate-600 bg-purple-500/10 border border-purple-500/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-mono font-bold text-lg tracking-widest text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/25 transition-all active:scale-95 disabled:opacity-60"
                >
                  {loading ? "Unlocking..." : "Unlock Account"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsLocked(false)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Go Back
                </button>
              </div>
            </form>
          )}

          <p className="mt-7 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              onClick={handleNavigateToRegister}
              className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Create Account
            </a>
          </p>

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

        {/* ── Right Carousel Panel ── */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <AuthCarousel />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
