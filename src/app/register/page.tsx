"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RamboowLogo } from "@/components/ui/RamboowLogo";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validations
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          phone,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setSubmittedSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between bg-white overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="relative z-10 p-6 sm:px-12 flex items-center justify-between border-b border-slate-100 bg-white">
        <Link href="/login" className="inline-block">
          <RamboowLogo size="xl" />
        </Link>

        <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-200 bg-red-50/70 text-xs font-medium text-ramboow-red-700 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-ramboow-red-600" />
          <span>Govt. Registered MSME Enterprise</span>
          <span className="text-[10px] font-bold text-ramboow-red-800">IN</span>
        </div>
      </header>

      {/* Main Registration Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 bg-white">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/50 border border-slate-200 transition-all">
            {submittedSuccess ? (
              /* Success Message Screen */
              <div className="text-center py-6 space-y-5 animate-in fade-in duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                  <Clock className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">
                    Registration Submitted
                  </h2>
                  <p className="text-sm font-semibold text-emerald-700 bg-emerald-50 py-2.5 px-4 rounded-xl border border-emerald-200 inline-block">
                    Status: PENDING ADMINISTRATOR APPROVAL
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your account has been created successfully. Your registration is waiting for administrator approval. You can log in after your account is approved.
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Registration Form Screen */
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600 mb-2">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Team Member Onboarding</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Create Team Account
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Fill in your details to register. All registrations require administrator review and approval before login access.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Full Name"
                          required
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Username *
                      </label>
                      <div className="relative">
                        <span className="text-xs text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 font-bold">@</span>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="username"
                          required
                          className="w-full pl-8 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Work Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="consultant@raambow.com"
                          required
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98201 XXXXX"
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Password (min 8 chars) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={8}
                          className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={8}
                          className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                    <strong>Note:</strong> Submitted registrations receive the <em>Team Member</em> role with <em>PENDING</em> approval status. An authorized administrator must review and approve your account before you can sign in.
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-ramboow-red-700 hover:bg-ramboow-red-800 active:scale-[0.99] text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-md shadow-ramboow-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>{loading ? "Submitting Registration..." : "Create Account & Request Approval"}</span>
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Already have an approved account?</span>
                  <Link
                    href="/login"
                    className="font-bold text-ramboow-navy-700 hover:text-ramboow-red-700 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 px-6 sm:px-12 text-center text-xs text-slate-400 border-t border-slate-100 bg-white">
        © {new Date().getFullYear()} RaamBow TechSolutions. All rights reserved. Simple, Fast, Organized &amp; Secure.
      </footer>
    </div>
  );
}

