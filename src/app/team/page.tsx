"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  UserCog,
  Users,
  UserPlus,
  Mail,
  Phone,
  ArrowRight,
  Trophy,
  HeartHandshake,
  CalendarDays,
  CalendarClock,
  X,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Check,
  UserX,
  UserCheck,
  Sparkles,
} from "lucide-react";

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "admins" | "rejected">("pending");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Add New Admin Modal state
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminFormError, setAdminFormError] = useState("");

  // Reset Password Modal state
  const [resetTargetUser, setResetTargetUser] = useState<any>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/members");
      if (res.status === 403) {
        setIsAdmin(false);
        return;
      }
      const json = await res.json();
      if (res.ok) {
        setData(json);
        setIsAdmin(true);
        // If no pending, default to approved tab if not already on a populated tab
        if (json.stats?.pendingCount === 0 && activeTab === "pending") {
          setActiveTab("approved");
        }
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleApprove = async (userId: string) => {
    setActionLoadingId(userId);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/admin/members/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to approve member.");
      setBannerMessage({ type: "success", text: resData.message });
      await fetchMembers();
    } catch (err: any) {
      setBannerMessage({ type: "error", text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("Are you sure you want to reject this registration request?")) return;
    setActionLoadingId(userId);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/admin/members/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to reject member.");
      setBannerMessage({ type: "success", text: resData.message });
      await fetchMembers();
    } catch (err: any) {
      setBannerMessage({ type: "error", text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActive = async (userId: string) => {
    setActionLoadingId(userId);
    setBannerMessage(null);
    try {
      const res = await fetch("/api/admin/members/toggle-active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to toggle status.");
      setBannerMessage({ type: "success", text: resData.message });
      await fetchMembers();
    } catch (err: any) {
      setBannerMessage({ type: "error", text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFormError("");
    if (adminPassword !== adminConfirmPassword) {
      setAdminFormError("Passwords do not match.");
      return;
    }
    if (adminPassword.length < 8) {
      setAdminFormError("Password must be at least 8 characters long.");
      return;
    }

    setAdminSubmitting(true);
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminName,
          username: adminUsername,
          email: adminEmail,
          phone: adminPhone,
          password: adminPassword,
          confirmPassword: adminConfirmPassword,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create administrator.");

      setBannerMessage({ type: "success", text: resData.message });
      setIsAddAdminOpen(false);
      setAdminName("");
      setAdminUsername("");
      setAdminEmail("");
      setAdminPhone("");
      setAdminPassword("");
      setAdminConfirmPassword("");
      await fetchMembers();
      setActiveTab("admins");
    } catch (err: any) {
      setAdminFormError(err.message);
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (resetNewPassword.length < 8) {
      setResetError("New password must be at least 8 characters long.");
      return;
    }
    setResetting(true);
    setResetError("");
    setResetSuccess("");

    try {
      const res = await fetch("/api/team/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resetTargetUser.id,
          newPassword: resetNewPassword,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to reset password.");
      setResetSuccess(`Password for ${resetTargetUser.name} has been successfully updated.`);
      setTimeout(() => {
        setResetTargetUser(null);
        setResetNewPassword("");
        setResetSuccess("");
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || "An error occurred.");
    } finally {
      setResetting(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetNewPassword(pwd);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-sm text-slate-500">
          Loading member directory and approvals...
        </div>
      </AppLayout>
    );
  }

  // Security Check: Restricted strictly to ADMIN
  if (isAdmin === false) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-ramboow-red-700 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Administrator Access Required
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Team management, consultant approvals, and administrator creation are restricted to authorized administrators.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const stats = data?.stats || {
    totalApproved: 0,
    pendingCount: 0,
    rejectedCount: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    totalAdmins: 0,
  };

  const filterList = (list: any[]) => {
    if (!searchTerm.trim()) return list || [];
    const term = searchTerm.toLowerCase();
    return (list || []).filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.username && item.username.toLowerCase().includes(term)) ||
        item.email.toLowerCase().includes(term)
    );
  };

  const pendingList = filterList(data?.pending || []);
  const approvedList = filterList(data?.approved || []);
  const adminList = filterList(data?.admins || []);
  const rejectedList = filterList(data?.rejected || []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <UserCog className="w-7 h-7 text-ramboow-navy-700" />
                <span>Member Management &amp; Approvals</span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review pending registration requests, manage consultant access, and administer team roles.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => setIsAddAdminOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>+ Add New Admin</span>
            </button>
          </div>
        </div>

        {/* Global Banner Alert */}
        {bannerMessage && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
              bannerMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
            <button
              onClick={() => setBannerMessage(null)}
              className="p-1 hover:opacity-75"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold">Pending Approvals</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">
              {stats.pendingCount}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold">Approved Members</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats.totalApproved}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold">Active Consultants</span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats.activeMembers}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-semibold">Administrators</span>
              <ShieldCheck className="w-4 h-4 text-ramboow-red-700" />
            </div>
            <div className="text-2xl font-black text-ramboow-red-700">
              {stats.totalAdmins}
            </div>
          </div>
        </div>

        {/* Tab Controls & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "pending"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Pending Approvals</span>
              {stats.pendingCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === "pending"
                      ? "bg-white text-amber-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {stats.pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("approved")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "approved"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Approved Members</span>
              <span className="text-[10px] opacity-75">({stats.totalApproved})</span>
            </button>

            <button
              onClick={() => setActiveTab("admins")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "admins"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Administrators</span>
              <span className="text-[10px] opacity-75">({stats.totalAdmins})</span>
            </button>

            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "rejected"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>Rejected</span>
              <span className="text-[10px] opacity-75">({stats.rejectedCount})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by name, username..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Tab 1: PENDING APPROVALS */}
        {activeTab === "pending" && (
          <div>
            {pendingList.length > 0 ? (
              <div className="space-y-3">
                {pendingList.map((applicant: any) => (
                  <div
                    key={applicant.id}
                    className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 font-black text-base flex items-center justify-center shrink-0 border border-amber-200">
                        {applicant.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {applicant.name}
                          </h4>
                          {applicant.username && (
                            <span className="text-xs font-semibold text-slate-500">
                              @{applicant.username}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                            Waiting for Approval
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {applicant.email}
                          </span>
                          {applicant.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {applicant.phone}
                            </span>
                          )}
                          <span className="text-slate-400">
                            • Applied: {new Date(applicant.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        onClick={() => handleReject(applicant.id)}
                        disabled={actionLoadingId === applicant.id}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleApprove(applicant.id)}
                        disabled={actionLoadingId === applicant.id}
                        className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Member</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="All caught up!"
                description="There are currently zero pending registration requests awaiting review."
                className="py-12 bg-white rounded-3xl border border-slate-200/80"
              />
            )}
          </div>
        )}

        {/* Tab 2: APPROVED MEMBERS */}
        {activeTab === "approved" && (
          <div>
            {approvedList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {approvedList.map((member: any) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white font-bold text-base flex items-center justify-center">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight">
                              {member.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              {member.username && <span>@{member.username}</span>}
                              <span
                                className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                                  member.active
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {member.active ? "Active" : "Deactivated"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-500 mb-5">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 pt-1">
                          Approved Member • Joined {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-600 mb-2">
                        <span>Assigned Clients:</span>
                        <strong className="font-bold text-slate-900">
                          {member._count?.assignedClients || 0}
                        </strong>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-2">
                      <Link
                        href={`/clients?assignedToId=${member.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-xl transition-all"
                      >
                        <span>Clients</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => {
                          setResetTargetUser(member);
                          setResetNewPassword("");
                          setResetError("");
                          setResetSuccess("");
                        }}
                        title={`Reset password for ${member.name}`}
                        className="flex items-center justify-center gap-1 py-2 px-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 rounded-xl transition-all"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(member.id)}
                        disabled={actionLoadingId === member.id}
                        title={member.active ? "Deactivate Account" : "Activate Account"}
                        className={`flex items-center justify-center gap-1 py-2 px-2.5 text-xs font-semibold rounded-xl transition-all ${
                          member.active
                            ? "bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {member.active ? (
                          <UserX className="w-3.5 h-3.5" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No approved members found"
                description="No team members match the search criteria."
                className="py-12 bg-white rounded-3xl border border-slate-200/80"
              />
            )}
          </div>
        )}

        {/* Tab 3: ADMINISTRATORS */}
        {activeTab === "admins" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Permanent CRM Administrators</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Only existing administrators can provision additional administrator accounts.
                </p>
              </div>
              <button
                onClick={() => setIsAddAdminOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shrink-0"
              >
                + Provision New Admin
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {adminList.map((adm: any) => (
                <div
                  key={adm.id}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-100">
                      <div className="w-12 h-12 rounded-2xl bg-ramboow-red-700 text-white font-extrabold text-lg flex items-center justify-center shadow-xs">
                        {adm.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {adm.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                            Administrator
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{adm.email}</span>
                      </div>
                      {adm.username && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold">@</span>
                          <span>{adm.username}</span>
                        </div>
                      )}
                      {adm.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{adm.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Admin ID: {adm.id.substring(0, 8)}...</span>
                    <span className="text-emerald-600 font-bold">Full Access</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: REJECTED REGISTRATIONS */}
        {activeTab === "rejected" && (
          <div>
            {rejectedList.length > 0 ? (
              <div className="space-y-3">
                {rejectedList.map((user: any) => (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">
                          {user.name}
                        </h4>
                        {user.username && (
                          <span className="text-xs text-slate-500">
                            @{user.username}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                          Rejected
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{user.email}</span>
                        {user.phone && <span>• {user.phone}</span>}
                        <span>• Rejection recorded</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApprove(user.id)}
                      disabled={actionLoadingId === user.id}
                      className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
                    >
                      Re-Review &amp; Approve
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={XCircle}
                title="No rejected registrations"
                description="No member applications have been rejected."
                className="py-12 bg-white rounded-3xl border border-slate-200/80"
              />
            )}
          </div>
        )}

        {/* Add New Admin Modal */}
        {isAddAdminOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-50 text-ramboow-red-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Provision New Administrator
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Creates an account with full CRM administrative rights
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddAdminOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                {adminFormError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{adminFormError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Full Name"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="e.g. admin_username"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@raambow.com"
                      required
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={adminPhone}
                      onChange={(e) => setAdminPhone(e.target.value)}
                      placeholder="+91 98201 XXXXX"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Admin Password (min 8) *
                    </label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={adminConfirmPassword}
                      onChange={(e) => setAdminConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div className="p-3 bg-red-50/60 border border-red-200/80 rounded-xl text-[11px] text-red-900 leading-relaxed">
                  <strong>Security Warning:</strong> This will grant full system administrator privileges including access to delete records, create admins, and approve members.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddAdminOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adminSubmitting}
                    className="px-5 py-2 text-xs font-semibold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {adminSubmitting ? "Creating Admin..." : "Confirm & Create Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Reset Member Password
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Member: <span className="font-semibold text-slate-700">{resetTargetUser.name}</span> ({resetTargetUser.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setResetTargetUser(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminResetPassword} className="p-6 space-y-4">
                {resetError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                {resetSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>New Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-semibold text-ramboow-navy-700 hover:text-ramboow-navy-900 underline"
                    >
                      Generate Random
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showResetPassword ? "text" : "password"}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 pr-10 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                  <strong>Security Note:</strong> The updated password takes effect immediately. Provide this new password to the member through a secure channel.
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setResetTargetUser(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetting || resetNewPassword.length < 8}
                    className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm disabled:opacity-50"
                  >
                    {resetting ? "Updating..." : "Save New Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
