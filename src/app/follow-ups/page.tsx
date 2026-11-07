"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LogCallModal } from "@/components/ui/LogCallModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";
import {
  CalendarClock,
  Clock,
  Phone,
  Building2,
  PhoneCall,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function FollowUpsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assignedToId, setAssignedToId] = useState("ALL");
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Log Call Modal state
  const [activeCallClient, setActiveCallClient] = useState<any | null>(null);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const url =
        assignedToId && assignedToId !== "ALL"
          ? `/api/follow-ups?assignedToId=${assignedToId}`
          : "/api/follow-ups";
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load followups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();

    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.team) setTeamMembers(data.team);
      });
  }, [assignedToId]);

  const handleCallSuccess = () => {
    fetchFollowUps();
  };

  const overdue = data?.overdue || [];
  const today = data?.today || [];
  const upcoming = data?.upcoming || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarClock className="w-7 h-7 text-ramboow-navy-700" />
              <span>Follow-ups Tracker</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Organized by priority: Overdue calls, Today&apos;s schedule, and Upcoming appointments.
            </p>
          </div>

          {/* Filter by Team Member */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-400">Assignee:</span>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Team Members</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 1: OVERDUE (Visually obvious urgent alert styling) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-red-900 tracking-tight">
              OVERDUE FOLLOW-UPS ({overdue.length})
            </h3>
            <span className="text-xs text-red-600 font-medium hidden sm:inline">
              — Scheduled date has passed, call immediately
            </span>
          </div>

          {overdue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overdue.map((client: any) => (
                <div
                  key={client.id}
                  className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-bold text-slate-900 text-base hover:text-red-700 transition-colors"
                      >
                        {client.name}
                      </Link>
                      <StatusBadge status={client.status} size="sm" />
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.phone}</span>
                      </div>
                      {client.companyName && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.companyName}</span>
                        </div>
                      )}
                      {client.service && (
                        <p className="text-slate-500 font-medium">
                          {client.service.name}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Assigned: <strong>{client.assignedTo?.name || "Unassigned"}</strong>
                      </p>
                    </div>

                    <div className="mt-3 p-2 rounded-xl bg-red-100/70 border border-red-200 text-xs font-bold text-red-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-red-600" />
                      <span>Overdue Since: {formatDateTime(client.nextFollowUpAt)}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-red-200/60 flex items-center justify-between gap-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                    >
                      View Profile
                    </Link>

                    <button
                      onClick={() => setActiveCallClient(client)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl transition-all shadow-sm flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Log Call Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 text-center font-medium">
              No overdue follow-ups! Pipeline is up to date.
            </div>
          )}
        </div>

        {/* Section 2: TODAY */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              TODAY&apos;S FOLLOW-UPS ({today.length})
            </h3>
            <span className="text-xs text-amber-700 font-medium hidden sm:inline">
              — Scheduled for contact today
            </span>
          </div>

          {today.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {today.map((client: any) => (
                <div
                  key={client.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-bold text-slate-900 text-base hover:text-ramboow-red-700 transition-colors"
                      >
                        {client.name}
                      </Link>
                      <StatusBadge status={client.status} size="sm" />
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.phone}</span>
                      </div>
                      {client.companyName && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.companyName}</span>
                        </div>
                      )}
                      {client.service && (
                        <p className="text-slate-500 font-medium">
                          {client.service.name}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Assigned: <strong>{client.assignedTo?.name || "Unassigned"}</strong>
                      </p>
                    </div>

                    <div className="mt-3 p-2 rounded-xl bg-white border border-amber-200 text-xs font-bold text-amber-800 flex items-center gap-1.5 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Today at {formatTime(client.nextFollowUpAt)}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-amber-200/60 flex items-center justify-between gap-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                    >
                      View Profile
                    </Link>

                    <button
                      onClick={() => setActiveCallClient(client)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Record Call</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 text-center font-medium">
              No follow-ups scheduled for today.
            </div>
          )}
        </div>

        {/* Section 3: UPCOMING */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              UPCOMING FOLLOW-UPS ({upcoming.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              — Scheduled for future dates
            </span>
          </div>

          {upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map((client: any) => (
                <div
                  key={client.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link
                        href={`/clients/${client.id}`}
                        className="font-bold text-slate-900 text-base hover:text-ramboow-red-700 transition-colors"
                      >
                        {client.name}
                      </Link>
                      <StatusBadge status={client.status} size="sm" />
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.phone}</span>
                      </div>
                      {client.companyName && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.companyName}</span>
                        </div>
                      )}
                      {client.service && (
                        <p className="text-slate-500 font-medium">
                          {client.service.name}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Assigned: <strong>{client.assignedTo?.name || "Unassigned"}</strong>
                      </p>
                    </div>

                    <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{formatDateTime(client.nextFollowUpAt)}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                    >
                      <span>Open Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <button
                      onClick={() => setActiveCallClient(client)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3 text-slate-500" />
                      <span>Call Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 text-center font-medium">
              No upcoming future follow-ups recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Log Call Modal */}
      {activeCallClient && (
        <LogCallModal
          isOpen={!!activeCallClient}
          onClose={() => setActiveCallClient(null)}
          clientId={activeCallClient.id}
          clientName={activeCallClient.name}
          currentStatus={activeCallClient.status}
          onSuccess={handleCallSuccess}
        />
      )}
    </AppLayout>
  );
}

