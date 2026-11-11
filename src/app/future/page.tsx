"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LogCallModal } from "@/components/ui/LogCallModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyBadge } from "@/components/ui/CompanyBadge";
import { formatDate, formatDateTime } from "@/lib/utils";
import {
  CalendarDays,
  Calendar,
  Building2,
  Phone,
  PhoneCall,
  Clock,
  Sparkles,
  HelpCircle,
  UserCheck,
} from "lucide-react";

export default function FutureClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCallClient, setActiveCallClient] = useState<any | null>(null);

  const fetchFutureClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients?status=FUTURE&limit=50");
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error("Failed to load future clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFutureClients();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarDays className="w-7 h-7 text-purple-700" />
              <span>Future Clients Pipeline</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Prospects who requested contact at a later date (next month, next quarter, next year).
            </p>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-800">
            {clients.length} Future Prospects
          </div>
        </div>

        {/* Explain Rule Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/80 to-indigo-50/80 border border-purple-200/80 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-900 leading-relaxed">
            <strong>Rule for Future Clients:</strong> When their scheduled follow-up date arrives, they will appear in your <em>Follow-ups</em> section for proactive outreach, but will strictly retain their <strong>FUTURE</strong> status until a team member manually logs a call or modifies it.
          </div>
        </div>

        {/* Clients Cards Grid (Requirement 3: Displays Expected Project Start Date, Next Follow-up Date, and Future Interest Reason) */}
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Loading future prospects...
          </div>
        ) : clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {clients.map((client) => (
              <div
                key={client.id}
                className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-base font-bold text-slate-900 hover:text-purple-700 transition-colors"
                        >
                          {client.name}
                        </Link>
                        <CompanyBadge company={client.company} size="xs" />
                      </div>
                      {client.companyName && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {client.companyName}
                        </span>
                      )}
                    </div>
                    <StatusBadge status="FUTURE" size="sm" />
                  </div>

                  {/* Expected Project Start Date (Requirement 3) */}
                  <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 mb-3 space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                        Expected Project Start Date:
                      </span>
                      <span className="text-sm font-extrabold text-purple-950 block mt-0.5">
                        {client.expectedStart || "To be confirmed on next call"}
                      </span>
                    </div>

                    {/* Future Interest Reason (Requirement 3) */}
                    {client.futureReason && (
                      <div className="pt-2 border-t border-purple-200/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                          Future Interest Reason:
                        </span>
                        <p className="text-xs text-purple-900 mt-0.5 italic">
                          &ldquo;{client.futureReason}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                    {client.service && (
                      <p className="text-slate-500">
                        Requirement: <strong>{client.service.name}</strong>
                      </p>
                    )}
                    {client.assignedTo && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>Assigned to {client.assignedTo.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  {/* Next Follow-up Date (Requirement 3) */}
                  <div className="flex items-center justify-between text-xs mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Next Follow-up Date:
                    </span>
                    <strong className="text-slate-900 font-bold">
                      {client.nextFollowUpAt ? formatDate(client.nextFollowUpAt) : "Not set"}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      View Profile
                    </Link>

                    <button
                      onClick={() => setActiveCallClient(client)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Log Update</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="No future clients"
            description="Clients with delayed start timelines will appear here when marked with status = FUTURE."
            actionText="Browse Clients"
            onAction={() => window.location.assign("/clients")}
            className="py-12"
          />
        )}
      </div>

      {activeCallClient && (
        <LogCallModal
          isOpen={!!activeCallClient}
          onClose={() => setActiveCallClient(null)}
          clientId={activeCallClient.id}
          clientName={activeCallClient.name}
          currentStatus={activeCallClient.status}
          onSuccess={fetchFutureClients}
        />
      )}
    </AppLayout>
  );
}
