"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RamboowLogo } from "@/components/ui/RamboowLogo";
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  UserPlus,
} from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingNotice, setPendingNotice] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPendingNotice("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.status === "PENDING") {
          setPendingNotice(data.error);
          return;
        }
        throw new Error(data.error || "Login failed.");
      }

      router.push(data.redirectUrl || "/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-white overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="relative z-10 px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between gap-4 border-b border-slate-100 bg-white">
        <Link href="/login" className="inline-flex items-center shrink-0">
          <RamboowLogo size="xl" showSubtitle={true} />
        </Link>

        {/* MSME Badge */}
        <div className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-200 bg-red-50/70 text-xs font-medium text-ramboow-red-700 shadow-2xs shrink-0 whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-ramboow-red-600 shrink-0" />
          <span>Govt. Registered MSME Enterprise</span>
          <span className="text-[10px] font-bold text-ramboow-red-800">IN</span>
        </div>
      </header>

      {/* Main Login Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 bg-white">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Pitch */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Production CRM Operations</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Modern solutions. <br />
              <span className="text-ramboow-red-700">Clean execution.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed">
              Fast, focused, and secure client pipeline and follow-up management built specifically for RaamBow TechSolutions.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Role-Based Access Control</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Admin Approval Workflow</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>End-to-End Audit Logging</span>
              </div>
            </div>
          </div>

          {/* Right Card: Login Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200 transition-all">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Team Sign In
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Enter your username or work email to access client pipelines.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Pending Approval Notice */}
              {pendingNotice && (
                <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-semibold mb-1">Registration Pending</p>
                    <p>{pendingNotice}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username or Work Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. consultant@raambow.com or username"
                      required
                      autoComplete="username"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-[11px] font-medium text-slate-600 hover:text-ramboow-red-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-ramboow-red-700 focus:ring-slate-900 border-slate-300"
                    />
                    <span>Remember me on this device</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-ramboow-red-700 hover:bg-ramboow-red-800 active:scale-[0.99] text-white text-sm font-semibold tracking-wide transition-all shadow-md shadow-ramboow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading ? "Authenticating..." : "Sign In to RaamBow"}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>

              {/* Public Registration Link */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  New team consultant or consultant applicant?
                </p>
                <Link
                  href="/register"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-ramboow-red-700 hover:text-ramboow-red-800 transition-colors py-1 px-2.5 rounded-lg hover:bg-red-50/70"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account &amp; Request Approval</span>
                </Link>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>RaamBow Client Management v1.0</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  System Operational
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Password Recovery Assistance
                </h3>
              </div>
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-600">
              <p className="leading-relaxed">
                For security reasons, CRM consultant credentials and password resets are managed directly by authorized system administrators.
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="font-semibold text-slate-900">How to request a reset:</p>
                <p className="text-slate-600 leading-relaxed">
                  Please reach out to your RaamBow TechSolutions system administrator via internal team channels to request a password reset. Authorized administrators can securely update your password through the Administrator Member Management console.
                </p>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setIsForgotPasswordOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-5 px-6 sm:px-12 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        © {new Date().getFullYear()} RaamBow TechSolutions. All rights reserved. Simple, Fast, Organized &amp; Secure.
      </footer>
    </div>
  );
}
