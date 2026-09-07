import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle, ArrowLeft } from "lucide-react";
import api from "../api";
import AuthCarousel from "../components/AuthCarousel";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      await api.post("/auth/forgot-password", { email });
      setStatus("success");
      setMessage(
        "If an account exists with this email, a password reset link has been sent.",
      );
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.error ||
          "Failed to send reset link. Please try again.",
      );
    }
  };

  return (
    <div className="h-[100dvh] bg-[#0a0f1e] flex flex-col justify-center items-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-5xl h-full max-h-[700px] rounded-3xl sm:rounded-[2.5rem] shadow-[0_8px_60px_rgba(0,0,0,0.5)] border border-white/[0.06] flex overflow-hidden relative z-10 bg-[#0d1424]">
        {/* ── Left Form ── */}
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

          {status === "success" ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <CheckCircle className="w-14 h-14 text-emerald-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Check your inbox
                </h2>
                <p className="text-sm text-slate-400">{message}</p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                  Reset your password
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Enter your email address and we&apos;ll send you a reset link.
                </p>
              </div>

              {status === "error" && (
                <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl text-center font-medium">
                  {message}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-semibold text-slate-400  tracking-wider mb-2 ml-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-white/[0.05] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Reset Link <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* Footer */}
          <div className="mt-auto pt-5 border-t border-white/[0.06] flex flex-col items-center gap-1">
            <p className="text-[10px] text-slate-600 text-center">
              Direct Contact:{" "}
              <a
                href="mailto:contact@maitsys.com"
                className="hover:text-blue-400 transition-colors"
              >
                contact@maitsys.com
              </a>
              {" · "}
              <a
                href="https://www.maitsys.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
              >
                www.maitsys.com
              </a>
            </p>
            <p className="text-[9px] text-slate-700 tracking-wider">
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

export default ForgotPasswordPage;
