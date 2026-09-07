import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowRight, CheckCircle } from "lucide-react";
import api from "../api";
import { PasswordInput, PasswordStrength } from "../components/PasswordInput";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing password reset token.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setMessage("Password must be at least 8 characters long.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setStatus("success");
      setMessage("Your password has been successfully reset.");
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.error ||
          "Failed to reset password. The link may have expired.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col justify-center items-center px-4 font-sans relative overflow-hidden">
      {/* ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md bg-[#0d1424] rounded-3xl shadow-[0_8px_60px_rgba(0,0,0,0.5)] border border-white/[0.06] p-10 relative z-10">
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
            <p className="text-slate-400 text-xs font-medium tracking-wide">
              Cloud Cost Monitoring
            </p>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white">Create New Password</h2>
          <p className="text-sm text-slate-400 mt-1">
            Enter your new secure password below
          </p>
        </div>

        {status === "success" ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-14 h-14 text-emerald-400" />
              </div>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm font-medium">
              {message}
            </div>
            <Link
              to="/login"
              className="block w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white text-center bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98]"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {status === "error" && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl text-center font-medium">
                {message}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400  tracking-wider mb-2 ml-1">
                New Password
              </label>
              <PasswordInput
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                disabled={!token}
                className="py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-white/[0.05] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              />
              <PasswordStrength password={password} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400  tracking-wider mb-2 ml-1">
                Confirm Password
              </label>
              <PasswordInput
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                disabled={!token}
                className="py-3 rounded-xl text-sm text-white placeholder-slate-500 bg-white/[0.05] border border-white/[0.08] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !token}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "loading" ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Reset Password <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-[10px] font-bold tracking-widest text-slate-700 relative z-10">
        Powered by Maitsys
      </p>
    </div>
  );
};

export default ResetPasswordPage;
