"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CallResultBadge } from "@/components/ui/CallResultBadge";
import { LogCallModal } from "@/components/ui/LogCallModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatTime } from "@/lib/utils";
import {
  Users,
  Sparkles,
  HeartHandshake,
  CalendarClock,
  CalendarDays,
  XCircle,
  Trophy,
  PhoneMissed,
  ArrowRight,
  Clock,
  PhoneCall,
  AlertTriangle,
  BrainCircuit,
  Ban,
  UserCheck,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<"all" | "my">("all");
  const [activeCallClient, setActiveCallClient] = useState<any | null>(null);
  const router = useRouter();

  const fetchStats = async (currentScope: "all" | "my") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?scope=${currentScope}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      setData(json);
      // If user is a team member, synchronize scope to 'my'
      if (json.userRole === "TEAM_MEMBER") {
        setScope("my");
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(scope);
  }, [scope]);

  const counts = data?.counts || {
    TOTAL: 0,
    NEW: 0,
    INTERESTED: 0,
    FOLLOW_UP: 0,
    FUTURE: 0,
    THINKING: 0,
    NOT_INTERESTED: 0,
    NO_RESPONSE: 0,
    CONVERTED: 0,
    LOST: 0,
  };

  const isTeamMember = data?.userRole === "TEAM_MEMBER";

  // Requirement 5: All 9 status cards + Total Clients, all clickable with accurate dynamic counts
  const statCards = [
    {
      title: "Total Clients",
      count: counts.TOTAL,
      statusParam: "",
      icon: Users,
      color: "from-slate-900 to-slate-800 text-white",
      badgeColor: "bg-white/20 text-white",
      description: isTeamMember ? "Your assigned clients" : "All company clients in pipeline",
    },
    {
      title: "New",
      count: counts.NEW,
      statusParam: "NEW",
      icon: Sparkles,
      color: "from-blue-600 to-blue-700 text-white",
      badgeColor: "bg-blue-500/30 text-white",
      description: "Fresh inquiries waiting for contact",
    },
    {
      title: "Interested",
      count: counts.INTERESTED,
      statusParam: "INTERESTED",
      icon: HeartHandshake,
      color: "from-emerald-600 to-emerald-700 text-white",
      badgeColor: "bg-emerald-500/30 text-white",
      description: "High intent, actively engaging",
    },
    {
      title: "Follow-up",
      count: counts.FOLLOW_UP,
      statusParam: "FOLLOW_UP",
      icon: CalendarClock,
      color: "from-amber-600 to-amber-700 text-white",
      badgeColor: "bg-amber-500/30 text-white",
      description: "Pending scheduled conversation",
    },
    {
      title: "Future",
      count: counts.FUTURE,
      statusParam: "FUTURE",
      icon: CalendarDays,
      color: "from-purple-600 to-purple-700 text-white",
      badgeColor: "bg-purple-500/30 text-white",
      description: "Wants service later (next month/quarter)",
    },
    {
      title: "Thinking",
      count: counts.THINKING,
      statusParam: "THINKING",
      icon: BrainCircuit,
      color: "from-indigo-600 to-indigo-700 text-white",
      badgeColor: "bg-indigo-500/30 text-white",
      description: "Comparing quotes and evaluating",
    },
    {
      title: "Converted",
      count: counts.CONVERTED,
      statusParam: "CONVERTED",
      icon: Trophy,
      color: "from-ramboow-red-700 to-ramboow-red-900 text-white",
      badgeColor: "bg-ramboow-red-500/40 text-white",
      description: "Deals won & advance received",
    },
    {
      title: "Not Interested",
      count: counts.NOT_INTERESTED,
      statusParam: "NOT_INTERESTED",
      icon: XCircle,
      color: "from-slate-600 to-slate-700 text-white",
      badgeColor: "bg-slate-500/30 text-white",
      description: "Declined or hired external agency",
    },
    {
      title: "Lost",
      count: counts.LOST,
      statusParam: "LOST",
      icon: Ban,
      color: "from-rose-600 to-rose-700 text-white",
      badgeColor: "bg-rose-500/30 text-white",
      description: "Went with competitor or cancelled",
    },
    {
      title: "No Response",
      count: counts.NO_RESPONSE,
      statusParam: "NO_RESPONSE",
      icon: PhoneMissed,
      color: "from-orange-600 to-orange-700 text-white",
      badgeColor: "bg-orange-500/30 text-white",
      description: "Unanswered or engaged line",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Top Controls: Role Info & Scope */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Pipeline Overview
              </h2>
              {isTeamMember && (
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>My Assigned Clients</span>
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {isTeamMember
                ? "Displaying statistics and priority follow-ups for your assigned clients only."
                : "Real-time statistics across all company clients and follow-up priorities."}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Scope switcher strictly for ADMIN */}
            {data?.userRole === "ADMIN" && (
              <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                <button
                  onClick={() => setScope("all")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    scope === "all"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Company Clients
                </button>
                <button
                  onClick={() => setScope("my")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    scope === "my"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  My Assigned Clients
                </button>
              </div>
            )}

            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
            >
              <span>+ New Client</span>
            </Link>
          </div>
        </div>

        {/* Pending Member Approvals Action Banner for ADMIN */}
        {data?.userRole === "ADMIN" && (data?.pendingApprovalsCount || 0) > 0 && (
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-5 text-white shadow-lg shadow-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">
                  {data.pendingApprovalsCount} Registration Request{data.pendingApprovalsCount > 1 ? "s" : ""} Waiting for Approval
                </h3>
                <p className="text-xs text-white/90">
                  New consultants have submitted registrations. Any administrator can review and approve access.
                </p>
              </div>
            </div>
            <Link
              href="/team"
              className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all shrink-0 shadow-sm flex items-center gap-1.5"
            >
              <span>Review Requests ({data.pendingApprovalsCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Dynamic Statistics Cards Grid (All 9 Statuses + Total Clients) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pipeline Status Cards (Click card to filter permitted clients)
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {counts.TOTAL} Total Permitted Records
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              const href = card.statusParam
                ? `/clients?status=${card.statusParam}`
                : "/clients";

              return (
                <Link
                  key={card.title}
                  href={href}
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1 group cursor-pointer flex flex-col justify-between min-h-[140px]`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white/90">
                      {card.title}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg ${card.badgeColor} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {loading ? "..." : card.count}
                    </div>
                    <p className="text-[11px] text-white/70 line-clamp-1 mt-0.5">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-white/80 font-medium group-hover:text-white">
                    <span>View Clients</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Priority Action Alerts: Today's Follow-ups & Overdue Follow-ups */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Today's Follow-ups */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Follow-ups Due Today
                  </h3>
                  <p className="text-xs text-slate-500">
                    {data?.todayFollowUpsCount || 0} scheduled for today ({isTeamMember ? "Your clients" : "All team"})
                  </p>
                </div>
              </div>
              <Link
                href="/follow-ups"
                className="text-xs font-semibold text-ramboow-navy-700 hover:text-ramboow-red-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Loading follow-ups...
              </div>
            ) : (data?.todayFollowUps?.length || data?.upcomingFollowUps?.length) ? (
              <div className="space-y-2.5">
                {(data?.todayFollowUps?.length ? data.todayFollowUps : data.upcomingFollowUps).map((client: any) => (
                  <div
                    key={client.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-200 transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-bold text-sm text-slate-900 hover:text-ramboow-red-700 transition-colors truncate"
                        >
                          {client.name}
                        </Link>
                        <StatusBadge status={client.status} size="sm" />
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <a
                          href={`tel:${client.phone}`}
                          className="font-semibold text-slate-700 hover:text-ramboow-red-700"
                        >
                          {client.phone}
                        </a>
                        {client.companyName && (
                          <span>• {client.companyName}</span>
                        )}
                        {client.assignedTo && (
                          <span>• {client.assignedTo.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(client.nextFollowUpAt)}</span>
                      </div>

                      <button
                        onClick={() => setActiveCallClient(client)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl transition-all shadow-sm flex items-center gap-1"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Log Call</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="No follow-ups today"
                description="You are completely caught up with today's scheduled calls."
                className="py-6"
              />
            )}
          </div>

          {/* Right Column: Overdue Follow-ups */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-ramboow-red-700 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>Overdue Follow-ups</span>
                    {data?.overdueFollowUpsCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-700">
                        {data.overdueFollowUpsCount}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">Scheduled date has passed</p>
                </div>
              </div>
              <Link
                href="/follow-ups"
                className="text-xs font-semibold text-ramboow-red-700 hover:text-ramboow-red-800"
              >
                View
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Checking overdue...
              </div>
            ) : data?.overdueFollowUps?.length > 0 ? (
              <div className="space-y-2.5">
                {data.overdueFollowUps.map((client: any) => (
                  <div
                    key={client.id}
                    className="p-3.5 rounded-2xl border border-red-100 bg-red-50/40 hover:bg-red-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-bold text-sm text-slate-900 hover:text-red-700 truncate"
                        >
                          {client.name}
                        </Link>
                        <span className="text-[11px] font-bold text-red-600 bg-red-100/70 px-2 py-0.5 rounded">
                          Due {formatDate(client.nextFollowUpAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                        <span>{client.phone}</span>
                        <span>{client.assignedTo?.name || "Unassigned"}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveCallClient(client)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-sm flex items-center gap-1 self-end sm:self-center shrink-0"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Log Call</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Trophy}
                title="Zero Overdue Calls!"
                description="Great job! There are no overdue follow-ups pending in this pipeline."
                className="py-6"
              />
            )}
          </div>
        </div>

        {/* Recent Activity Stream */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-ramboow-navy-700" />
                <span>Recent Activity &amp; Updates</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isTeamMember
                  ? "Recent updates recorded for your assigned accounts."
                  : "Latest updates recorded across all company clients."}
              </p>
            </div>
            <Link
              href="/call-history"
              className="text-xs font-semibold text-ramboow-navy-700 hover:text-ramboow-red-700 flex items-center gap-1"
            >
              <span>Full Call History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Loading activity feed...
            </div>
          ) : data?.recentCalls?.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentCalls.map((call: any) => (
                <div
                  key={call.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2.5 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      <PhoneCall className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/clients/${call.client.id}`}
                          className="font-bold text-sm text-slate-900 hover:text-ramboow-red-700 hover:underline transition-colors truncate"
                        >
                          {call.client.name}
                        </Link>
                        {call.client.companyName && (
                          <span className="text-xs text-slate-500">
                            ({call.client.companyName})
                          </span>
                        )}
                        <CallResultBadge result={call.callResult} />
                        <StatusBadge status={call.statusAtTime} size="sm" />
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                        &ldquo;{call.notes}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0 sm:self-center pl-11 sm:pl-0">
                    <span className="font-medium text-slate-700">
                      By {call.user.name}
                    </span>
                    <span>•</span>
                    <span>{formatDate(call.calledAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PhoneCall}
              title="No call logs yet"
              description="Calls and updates will appear here once recorded."
              className="py-6"
            />
          )}
        </div>

        {/* Quick Log Call / Follow-up Action Modal */}
        {activeCallClient && (
          <LogCallModal
            isOpen={Boolean(activeCallClient)}
            onClose={() => setActiveCallClient(null)}
            clientId={activeCallClient.id}
            clientName={activeCallClient.name}
            currentStatus={activeCallClient.status}
            onSuccess={() => {
              setActiveCallClient(null);
              fetchStats(scope);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
