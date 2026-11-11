"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CallResultBadge } from "@/components/ui/CallResultBadge";
import { LogCallModal } from "@/components/ui/LogCallModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyBadge } from "@/components/ui/CompanyBadge";
import { CompanySelector } from "@/components/ui/CompanySelector";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";
import { CLIENT_STATUSES, CompanyType } from "@/lib/constants";
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  MapPin,
  Briefcase,
  UserCheck,
  Calendar,
  Clock,
  PhoneCall,
  History,
  Edit,
  Trash2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  IndianRupee,
} from "lucide-react";

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLogCallOpen, setIsLogCallOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [editForm, setEditForm] = useState<any>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchClientDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.status === 403) {
        const json = await res.json();
        setError(json.error || "Access Denied: You do not have permission to view this client.");
        return;
      }
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to load client profile.");
      }
      const data = await res.json();
      setClient(data.client);
      setEditForm({
        name: data.client.name,
        phone: data.client.phone,
        companyName: data.client.companyName || "",
        company: data.client.company || "RAAMBOW",
        email: data.client.email || "",
        location: data.client.location || "",
        serviceId: data.client.serviceId || "",
        assignedToId: data.client.assignedToId || "",
        status: data.client.status,
        expectedStart: data.client.expectedStart || "",
        futureReason: data.client.futureReason || "",
        notes: data.client.notes || "",
        quotationAmount: data.client.quotationAmount ? String(data.client.quotationAmount) : "",
        quotationDetails: data.client.quotationDetails || "",
        advanceReceived: data.client.advanceReceived ? String(data.client.advanceReceived) : "",
        balancePayment: data.client.balancePayment ? String(data.client.balancePayment) : "",
        paymentStatus: data.client.paymentStatus || "PENDING",
        projectStarted: data.client.projectStarted ? data.client.projectStarted.split("T")[0] : "",
        projectDeadline: data.client.projectDeadline ? data.client.projectDeadline.split("T")[0] : "",
      });
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      });

    fetchClientDetails();

    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.team) setTeamMembers(data.team);
      });

    fetch("/api/services")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.services) setServices(data.services);
      });
  }, [clientId]);

  const handleStatusQuickChange = async (newStatus: string) => {
    if (!client || client.status === newStatus) return;
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchClientDetails();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setClient(data.client);
      setIsEditing(false);
      fetchClientDetails();
    } catch (err: any) {
      alert(err.message || "Failed to update client.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm(`Are you sure you want to delete client "${client.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/clients");
      } else {
        const json = await res.json();
        alert(json.error || "Failed to delete client.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-sm text-slate-500">
          Loading client profile...
        </div>
      </AppLayout>
    );
  }

  // Security Access Denied Screen (Requirement 6)
  if (error || !client) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-ramboow-red-700 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            {error || "Client Profile Unavailable"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            You do not have administrative permissions or assignment rights to view this client account.
          </p>
          <div className="pt-2">
            <Link
              href="/clients"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Permitted Clients</span>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Admin Controls */}
        <div className="flex items-center justify-between">
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clients Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEditing ? "Close Edit" : "Edit Client"}</span>
            </button>

            {isAdmin && (
              <button
                onClick={handleDeleteClient}
                title="Delete Client (Admin only)"
                className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Client Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            {/* Left: Avatar, Name, Company, Status */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ramboow-navy-900 to-slate-800 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-slate-900/10 shrink-0">
                {client.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {client.name}
                  </h1>
                  <CompanyBadge company={client.company} size="sm" />
                  <StatusBadge status={client.status} size="md" />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 mt-1.5">
                  {client.companyName && (
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {client.companyName}
                    </span>
                  )}
                  {client.service && (
                    <span className="flex items-center gap-1 text-slate-600">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {client.service.name}
                    </span>
                  )}
                  {client.location && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {client.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Status Dropdown & Primary Action Button ("+ Add Call / Update") */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-xs text-slate-400 font-semibold">Status:</span>
                <select
                  value={client.status}
                  onChange={(e) => handleStatusQuickChange(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {CLIENT_STATUSES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setIsLogCallOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl transition-all shadow-md shadow-ramboow-red-900/20 active:scale-95 shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                <span>+ Add Call / Update</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Assigned To</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1">
                <UserCheck className="w-4 h-4 text-ramboow-navy-700" />
                {client.assignedTo?.name || "Unassigned"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Last Contact</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {formatDate(client.lastContactAt)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Next Follow-up</span>
              <span className="font-bold text-amber-700 text-sm mt-0.5 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-amber-600" />
                {client.nextFollowUpAt
                  ? formatDateTime(client.nextFollowUpAt)
                  : "None scheduled"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-medium">Calls Logged</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1">
                <History className="w-4 h-4 text-slate-400" />
                {client.callHistories?.length || 0} updates
              </span>
            </div>
          </div>
        </div>

        {/* Edit Modal / Form if editing is toggled */}
        {isEditing && (
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-300 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Client Details</h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-medium"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                <input
                  type="text"
                  value={editForm.companyName}
                  onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service</label>
                <select
                  value={editForm.serviceId}
                  onChange={(e) => setEditForm({ ...editForm, serviceId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multi-Company Project Ownership (Admin Only) */}
            {isAdmin && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <CompanySelector
                  value={editForm.company || "RAAMBOW"}
                  onChange={(c: CompanyType) => setEditForm({ ...editForm, company: c })}
                  label="Assigned Project Company"
                />
              </div>
            )}

            {isAdmin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Consultant</label>
                <select
                  value={editForm.assignedToId || ""}
                  onChange={(e) => setEditForm({ ...editForm, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">-- Unassigned --</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role === "ADMIN" ? "Admin" : "Consultant"})
                    </option>
                  ))}
                  {client?.assignedTo && !teamMembers.some((m) => m.id === client.assignedTo.id) && (
                    <option key={client.assignedTo.id} value={client.assignedTo.id}>
                      {client.assignedTo.name} (Current)
                    </option>
                  )}
                </select>
              </div>
            )}

            {/* Quotation & Project Financials in Edit Form (Admin Only) */}
            {isAdmin && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-700" />
                    <span>Project Quotation &amp; Financials (Admin Only)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Confidential
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Agreed Quotation / Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={editForm.quotationAmount}
                      onChange={(e) => {
                        const q = e.target.value;
                        const adv = editForm.advanceReceived;
                        const bal = Math.max(0, (parseFloat(q) || 0) - (parseFloat(adv) || 0));
                        setEditForm({
                          ...editForm,
                          quotationAmount: q,
                          balancePayment: String(bal),
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Advance Received (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 20000"
                      value={editForm.advanceReceived}
                      onChange={(e) => {
                        const adv = e.target.value;
                        const q = editForm.quotationAmount;
                        const bal = Math.max(0, (parseFloat(q) || 0) - (parseFloat(adv) || 0));
                        setEditForm({
                          ...editForm,
                          advanceReceived: adv,
                          balancePayment: String(bal),
                        });
                      }}
                      className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white font-semibold text-emerald-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Balance Payment (₹)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={editForm.balancePayment ? `₹${editForm.balancePayment}` : "₹0"}
                      className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-amber-100/50 font-bold text-amber-900 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={editForm.paymentStatus}
                      onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white"
                    >
                      <option value="PENDING">Pending (Advance awaited)</option>
                      <option value="PARTIAL">Partial (Advance received)</option>
                      <option value="COMPLETED">Completed (Fully paid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Project Start Date
                    </label>
                    <input
                      type="date"
                      value={editForm.projectStarted}
                      onChange={(e) => setEditForm({ ...editForm, projectStarted: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Project Deadline
                    </label>
                    <input
                      type="date"
                      value={editForm.projectDeadline}
                      onChange={(e) => setEditForm({ ...editForm, projectDeadline: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quotation Scope / Payment Terms
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter agreed quote terms, deliverables, milestones..."
                    value={editForm.quotationDetails}
                    onChange={(e) => setEditForm({ ...editForm, quotationDetails: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white"
                  />
                </div>
              </div>
            )}

            {/* Requirement 3: Future Client Fields in Edit Form */}
            {editForm.status === "FUTURE" && (
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1">
                    Expected Project Start Date
                  </label>
                  <input
                    type="text"
                    value={editForm.expectedStart}
                    onChange={(e) => setEditForm({ ...editForm, expectedStart: e.target.value })}
                    placeholder="e.g. January 2027"
                    className="w-full px-3 py-2 text-xs border border-purple-300 rounded-xl bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1">
                    Future Interest Reason
                  </label>
                  <input
                    type="text"
                    value={editForm.futureReason}
                    onChange={(e) => setEditForm({ ...editForm, futureReason: e.target.value })}
                    placeholder="e.g. Budget starts next fiscal year"
                    className="w-full px-3 py-2 text-xs border border-purple-300 rounded-xl bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-3 py-2 text-xs border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                {saveLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* 2-Column Section: Client Information & Call History Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Client Information Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Client Information</span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">
                Profile Data
              </span>
            </h3>

            <div className="space-y-4 text-xs">
              {/* Phone with click to call */}
              <div>
                <span className="text-slate-400 font-medium block">Phone Number</span>
                <div className="flex items-center justify-between mt-1">
                  <a
                    href={`tel:${client.phone}`}
                    className="font-bold text-slate-900 text-sm hover:text-ramboow-red-700 transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{client.phone}</span>
                  </a>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-[10px] font-bold text-white bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded-lg"
                  >
                    Call
                  </a>
                </div>
              </div>

              {/* Owning Company */}
              <div>
                <span className="text-slate-400 font-medium block">Project Belongs To</span>
                <div className="mt-1">
                  <CompanyBadge company={client.company} size="sm" />
                </div>
              </div>

              {/* Company */}
              <div>
                <span className="text-slate-400 font-medium block">Company / Business</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {client.companyName || "Individual / Not Provided"}
                </span>
              </div>

              {/* Email */}
              <div>
                <span className="text-slate-400 font-medium block">Email Address</span>
                {client.email ? (
                  <a
                    href={`mailto:${client.email}`}
                    className="font-semibold text-ramboow-navy-700 hover:underline block mt-0.5"
                  >
                    {client.email}
                  </a>
                ) : (
                  <span className="text-slate-400 italic block mt-0.5">Not provided</span>
                )}
              </div>

              {/* Location */}
              <div>
                <span className="text-slate-400 font-medium block">Location</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {client.location || "Not provided"}
                </span>
              </div>

              {/* Service */}
              <div>
                <span className="text-slate-400 font-medium block">Service Requirement</span>
                <span className="font-semibold text-slate-800 block mt-0.5">
                  {client.service?.name || "General Inquiry"}
                </span>
              </div>

              {/* Requirement 3: Dedicated Display for Future Client Details */}
              {(client.expectedStart || client.futureReason || client.status === "FUTURE") && (
                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-950 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Future Client Details</span>
                  </div>

                  {client.expectedStart && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-purple-700 block">
                        Expected Project Start Date:
                      </span>
                      <strong className="text-sm font-black text-purple-950 block mt-0.5">
                        {client.expectedStart}
                      </strong>
                    </div>
                  )}

                  {client.futureReason && (
                    <div className="pt-1 border-t border-purple-200/60">
                      <span className="text-[10px] uppercase font-bold text-purple-700 block">
                        Future Interest Reason:
                      </span>
                      <p className="text-xs text-purple-900 mt-0.5 italic">
                        &ldquo;{client.futureReason}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quotation & Project Financials Display (Admin Only) */}
              {isAdmin && (
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-amber-700" />
                      Project Quotation
                    </span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                      Admin Only
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/60">
                      <span className="text-[10px] font-semibold text-slate-500 block">Agreed Price</span>
                      <strong className="text-sm font-black text-slate-900 block mt-0.5">
                        {client.quotationAmount ? `₹${Number(client.quotationAmount).toLocaleString("en-IN")}` : "Not Set"}
                      </strong>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/60">
                      <span className="text-[10px] font-semibold text-slate-500 block">Advance Paid</span>
                      <strong className="text-sm font-black text-emerald-700 block mt-0.5">
                        {client.advanceReceived ? `₹${Number(client.advanceReceived).toLocaleString("en-IN")}` : "₹0"}
                      </strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block">Balance Pending</span>
                      <strong className="text-sm font-black text-amber-900 block">
                        ₹{(Number(client.balancePayment) || Math.max(0, (Number(client.quotationAmount) || 0) - (Number(client.advanceReceived) || 0))).toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      client.paymentStatus === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : client.paymentStatus === "PARTIAL"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {client.paymentStatus || "PENDING"}
                    </span>
                  </div>

                  {(client.projectStarted || client.projectDeadline) && (
                    <div className="pt-2 border-t border-amber-200/60 text-[11px] space-y-1">
                      {client.projectStarted && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Kickoff:</span>
                          <span className="font-semibold text-slate-900">{formatDate(client.projectStarted)}</span>
                        </div>
                      )}
                      {client.projectDeadline && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Deadline:</span>
                          <span className="font-semibold text-slate-900">{formatDate(client.projectDeadline)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {client.quotationDetails && (
                    <div className="pt-2 border-t border-amber-200/60 text-xs text-amber-950">
                      <span className="text-[10px] font-bold text-amber-800 block uppercase">Scope / Notes:</span>
                      <p className="mt-0.5 italic">&ldquo;{client.quotationDetails}&rdquo;</p>
                    </div>
                  )}
                </div>
              )}

              {/* Assigned Team Member */}
              <div>
                <span className="text-slate-400 font-medium block">Assigned Member</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {client.assignedTo?.name ? client.assignedTo.name.charAt(0) : "?"}
                  </div>
                  <span className="font-semibold text-slate-800">
                    {client.assignedTo?.name || "Unassigned"}
                  </span>
                </div>
              </div>

              {/* Initial Notes */}
              {client.notes && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 font-medium block">Initial Notes</span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    &ldquo;{client.notes}&rdquo;
                  </p>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                Created on {formatDate(client.createdAt)}
              </div>
            </div>
          </div>

          {/* Right Column: Call / Update History Timeline (Requirement 4: Preserves Previous Status, New Status, Call Result, Notes, User, DateTime, Next Follow-up) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-ramboow-red-700" />
                  <span>Call &amp; Update History Timeline</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanent chronological log preserving previous status, new status, outcome, and notes. Never overwritten.
                </p>
              </div>

              <button
                onClick={() => setIsLogCallOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>+ Log Update</span>
              </button>
            </div>

            {/* Timeline Stream */}
            {client.callHistories && client.callHistories.length > 0 ? (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-slate-200">
                {client.callHistories.map((entry: any) => {
                  const hasTransition =
                    entry.previousStatus &&
                    entry.newStatus &&
                    entry.previousStatus !== entry.newStatus;

                  return (
                    <div key={entry.id} className="relative group">
                      {/* Timeline Node Dot */}
                      <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-ramboow-navy-700 flex items-center justify-center shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-ramboow-red-600"></div>
                      </div>

                      {/* Timeline Entry Card */}
                      <div className="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all">
                        {/* Top Header of History Record */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/60">
                          {/* Call Result & Status Transition (Requirement 4) */}
                          <div className="flex flex-wrap items-center gap-2">
                            <CallResultBadge result={entry.callResult} />

                            {hasTransition ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700">
                                <StatusBadge status={entry.previousStatus} size="sm" showDot={false} />
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <StatusBadge status={entry.newStatus} size="sm" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                <span className="text-slate-400 text-[11px]">Status:</span>
                                <StatusBadge status={entry.newStatus || entry.statusAtTime} size="sm" />
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span className="font-semibold text-slate-700">
                              {formatDate(entry.calledAt)}
                            </span>
                            <span>at {formatTime(entry.calledAt)}</span>
                          </div>
                        </div>

                        {/* Notes Body */}
                        <div className="py-3">
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                            {entry.notes}
                          </p>
                        </div>

                        {/* Footer Metadata: Updated By, Next Follow-up */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Updated by:</span>
                            <strong className="text-slate-800 font-semibold">
                              {entry.user?.name || "Team Member"}
                            </strong>
                          </div>

                          {entry.nextFollowUpAt && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              <span>
                                Next Follow-up: {formatDateTime(entry.nextFollowUpAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No call history yet"
                description="Click '+ Add Call / Update' to log the first discussion or outcome with this client."
                actionText="Record First Call"
                onAction={() => setIsLogCallOpen(true)}
                className="py-10"
              />
            )}
          </div>
        </div>
      </div>

      {/* Log Call Modal */}
      <LogCallModal
        isOpen={isLogCallOpen}
        onClose={() => setIsLogCallOpen(false)}
        clientId={client.id}
        clientName={client.name}
        currentStatus={client.status}
        onSuccess={() => fetchClientDetails()}
      />
    </AppLayout>
  );
}
