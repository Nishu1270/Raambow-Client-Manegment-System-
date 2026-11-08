"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RamboowLogo } from "@/components/ui/RamboowLogo";
import {
  Settings,
  ShieldCheck,
  User,
  Database,
  Download,
  Building,
  CheckCircle2,
  HardDrive,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      });
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPassword) {
      setPwdError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 12) {
      setPwdError("New password must be at least 12 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirmation do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPwdError("New password must be different from your current password.");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }

      setPwdSuccess("Your password has been changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportCSV = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/clients?limit=1000");
      const data = await res.json();
      const clients = data.clients || [];

      // Build CSV
      const headers = [
        "Client Name",
        "Phone",
        "Company",
        "Email",
        "Location",
        "Service",
        "Status",
        "Assigned To",
        "Created Date",
      ];

      const rows = clients.map((c: any) => [
        `"${c.name}"`,
        `"${c.phone}"`,
        `"${c.companyName || ""}"`,
        `"${c.email || ""}"`,
        `"${c.location || ""}"`,
        `"${c.service?.name || ""}"`,
        `"${c.status}"`,
        `"${c.assignedTo?.name || ""}"`,
        `"${new Date(c.createdAt).toISOString()}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ramboow_clients_export_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export clients data.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-ramboow-navy-700" />
            <span>System Settings &amp; Preferences</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Application configurations, account security, and data export.
          </p>
        </div>

        {/* Current User Session Profile */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-ramboow-red-700" />
            <h3 className="font-bold text-slate-900 text-base">User Account Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-medium">Logged-in User</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {user?.name || "Loading..."}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-medium">Email Address</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                {user?.email || "Loading..."}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-medium">Assigned Role</span>
              <span className="font-bold text-ramboow-red-700 text-sm mt-0.5 block">
                {user?.role === "ADMIN" ? "Administrator (Full Access)" : "Team Member"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block font-medium">Session Status</span>
              <span className="font-bold text-emerald-700 text-sm mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active Secure HTTP-Only Cookie</span>
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5 text-ramboow-red-700" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">Change Account Password</h3>
              <p className="text-xs text-slate-500">
                Update your login credentials. Minimum 12 characters required.
              </p>
            </div>
          </div>

          {/* Feedback messages */}
          {pwdError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          {pwdSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pr-9 text-slate-800 focus:outline-none focus:ring-1 focus:ring-ramboow-red-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    New Password
                  </label>
                  <span
                    className={`text-[10px] font-bold ${newPassword.length >= 12 ? "text-emerald-600" : "text-slate-400"
                      }`}
                  >
                    {newPassword.length}/12 chars
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 12 characters"
                    required
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pr-9 text-slate-800 focus:outline-none focus:ring-1 focus:ring-ramboow-red-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    Confirm New Password
                  </label>
                  {confirmPassword && (
                    <span
                      className={`text-[10px] font-bold ${confirmPassword === newPassword
                          ? "text-emerald-600"
                          : "text-rose-600"
                        }`}
                    >
                      {confirmPassword === newPassword ? "Match" : "No match"}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 pr-9 text-slate-800 focus:outline-none focus:ring-1 focus:ring-ramboow-red-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Policy Hint */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Passwords are encrypted with bcrypt (12 salt rounds) and never stored in plain-text.
                </span>
              </span>

              <button
                type="submit"
                disabled={changingPassword || newPassword.length < 12 || newPassword !== confirmPassword}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {changingPassword ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Brand & Organization Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-ramboow-navy-700" />
            <h3 className="font-bold text-slate-900 text-base">Company &amp; Branding</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center gap-4 shrink-0">
              <RamboowLogo size="lg" showSubtitle={true} />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-200/80 bg-red-50 text-xs font-semibold text-ramboow-red-700 shrink-0 whitespace-nowrap">
              <ShieldCheck className="w-4 h-4 text-ramboow-red-600 shrink-0" />
              <span>Govt. Registered MSME Enterprise IN</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold block">Application Name</span>
              <span className="font-bold text-slate-800 text-sm block">RaamBow Client Management</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold block">Design Reference Motto</span>
              <span className="font-bold text-ramboow-red-700 text-sm block">Modern solutions. Clean execution.</span>
            </div>
          </div>
        </div>

        {/* Database & Data Export */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-5 h-5 text-ramboow-navy-700" />
            <h3 className="font-bold text-slate-900 text-base">Data Management &amp; Backup</h3>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-600" />
                <span>Export Client Records to CSV</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Download a clean, complete spreadsheet backup of all clients, phone numbers, and statuses.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={downloading}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? "Exporting..." : "Export CSV File"}</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
