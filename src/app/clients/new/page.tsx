"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { CLIENT_STATUSES, CompanyType } from "@/lib/constants";
import { CompanySelector } from "@/components/ui/CompanySelector";
import {
  UserPlus,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  UserCheck,
  Calendar,
  Clock,
  AlertCircle,
  Sparkles,
  HelpCircle,
  IndianRupee,
} from "lucide-react";

export default function AddClientPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    companyName: "",
    company: "RAAMBOW",
    email: "",
    location: "",
    serviceId: "",
    assignedToId: "",
    status: "NEW",
    notes: "",
    expectedStart: "",
    futureReason: "",
    nextFollowUpDate: "",
    nextFollowUpTime: "11:00",
    quotationAmount: "",
    quotationDetails: "",
    advanceReceived: "",
    paymentStatus: "PENDING",
    projectStarted: "",
    projectDeadline: "",
  });

  const [services, setServices] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("TEAM_MEMBER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    existingId?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserRole(data.user.role);
          setFormData((prev) => ({ ...prev, assignedToId: data.user.id }));
        }
      });

    fetch("/api/services")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.services) {
          setServices(data.services);
          if (data.services.length > 0) {
            setFormData((prev) => ({ ...prev, serviceId: data.services[0].id }));
          }
        }
      });

    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.team) {
          setTeamMembers(data.team);
        }
      });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setDuplicateWarning(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.company) {
      setError("Please select the company this project belongs to (RAAMBOW or KATERNGERS).");
      return;
    }

    if (!formData.name.trim()) {
      setError("Client Name is required.");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Phone Number is required.");
      return;
    }

    setLoading(true);
    setError("");
    setDuplicateWarning(null);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setDuplicateWarning({
            message: data.error,
            existingId: data.existingClientId,
          });
          return;
        }
        throw new Error(data.error || "Failed to create client.");
      }

      // Success -> Redirect to newly created client profile
      router.push(`/clients/${data.client.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clients</span>
          </Link>

          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Client Onboarding
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-sm border border-slate-200/80">
          <div className="mb-8 border-b border-slate-100 pb-5">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <UserPlus className="w-6 h-6 text-ramboow-red-700" />
              <span>Add New Client</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Store a client&apos;s phone number, initial requirement, and assign them to a team member.
            </p>
          </div>

          {/* Error / Duplicate Notification */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {duplicateWarning && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-800 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{duplicateWarning.message}</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    To prevent accidental duplicates, view the existing profile instead.
                  </p>
                </div>
              </div>
              {duplicateWarning.existingId && (
                <Link
                  href={`/clients/${duplicateWarning.existingId}`}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-xs shrink-0"
                >
                  View Profile
                </Link>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mandatory Company Selection (Multi-Company Project Management) */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs">
              <CompanySelector
                value={formData.company}
                onChange={(c: CompanyType) => {
                  setFormData((prev) => ({ ...prev, company: c }));
                  setError("");
                }}
                required
              />
            </div>

            {/* Primary Details: Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ravi Kumar"
                  required
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Phone Number *</span>
                  <span className="text-[11px] font-normal text-slate-400">Unique identifier</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Business Info: Company & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Company / Business Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="e.g. ABC Traders Pvt Ltd"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ravi@abctraders.in"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Location & Service */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Location (City / State)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Service / Requirement
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Assignment & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Assigned Team Member
                </label>
                {userRole === "ADMIN" ? (
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      name="assignedToId"
                      value={formData.assignedToId}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                    >
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role === "ADMIN" ? "Admin" : "Member"})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-semibold flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Assigned to You</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Initial Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-semibold"
                >
                  {CLIENT_STATUSES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.label} ({st.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Requirement 3: When FUTURE is selected as the client status, display Expected Project Start Date, Next Follow-up Date, and Future Interest Reason */}
            {formData.status === "FUTURE" && (
              <div className="p-5 rounded-3xl bg-purple-50/80 border-2 border-purple-200 space-y-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-purple-950 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Future Client Planning Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">
                      Expected Project Start Date *
                    </label>
                    <input
                      type="text"
                      name="expectedStart"
                      value={formData.expectedStart}
                      onChange={handleChange}
                      placeholder="e.g. January 2027, Q2 2027, Post-Audit..."
                      required
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                    />
                    <span className="text-[11px] text-purple-700 mt-1 block">
                      Target month or quarter when the client intends to commence.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1">
                      Next Follow-up Date *
                    </label>
                    <input
                      type="date"
                      name="nextFollowUpDate"
                      value={formData.nextFollowUpDate}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                    />
                    <span className="text-[11px] text-purple-700 mt-1 block">
                      When this date arrives, client will appear in Follow-ups without changing their FUTURE status.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-1">
                    Future Interest Reason *
                  </label>
                  <textarea
                    rows={2}
                    name="futureReason"
                    value={formData.futureReason}
                    onChange={handleChange}
                    placeholder="e.g. Relocating warehouse in December, financial budget allocated for Q1, waiting for new management onboard..."
                    required
                    className="w-full px-4 py-2 text-sm rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium resize-none"
                  />
                  <span className="text-[11px] text-purple-700 mt-0.5 block">
                    Reason why the client cannot start immediately but remains interested in the future.
                  </span>
                </div>
              </div>
            )}

            {/* Standard Follow-up Schedule (shown if NOT FUTURE, since FUTURE has its own dedicated follow-up date above) */}
            {formData.status !== "FUTURE" && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Schedule Follow-up (Optional)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      name="nextFollowUpDate"
                      value={formData.nextFollowUpDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Follow-up Time
                    </label>
                    <input
                      type="time"
                      name="nextFollowUpTime"
                      value={formData.nextFollowUpTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quotation & Project Price (Admin Only) */}
            {userRole === "ADMIN" && (
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
                    <IndianRupee className="w-4 h-4 text-amber-700" />
                    <span>Project Quotation &amp; Pricing (Admin Only)</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    Confidential
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Agreed Quotation / Fixed Price (₹)
                    </label>
                    <input
                      type="number"
                      name="quotationAmount"
                      placeholder="e.g. 50000"
                      value={formData.quotationAmount}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Advance Received (₹)
                    </label>
                    <input
                      type="number"
                      name="advanceReceived"
                      placeholder="e.g. 20000"
                      value={formData.advanceReceived}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white font-semibold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {formData.status === "CONVERTED" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-200/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Project Kickoff Date
                      </label>
                      <input
                        type="date"
                        name="projectStarted"
                        value={formData.projectStarted}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Project Delivery Deadline
                      </label>
                      <input
                        type="date"
                        name="projectDeadline"
                        value={formData.projectDeadline}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quotation Scope / Deliverables
                  </label>
                  <textarea
                    rows={2}
                    name="quotationDetails"
                    placeholder="Enter key deliverables, payment milestones, tech stack..."
                    value={formData.quotationDetails}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Initial Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Initial Notes / Context
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Mention how the lead was acquired or specific client expectations..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none font-medium"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <Link
                href="/clients"
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl transition-all shadow-md shadow-ramboow-red-900/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? "Saving Client..." : "Save & Open Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
