"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CLIENT_STATUSES } from "@/lib/constants";
import {
  BarChart3,
  TrendingUp,
  Users,
  Trophy,
  PieChart,
  Briefcase,
  PhoneCall,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function ReportsPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setReport(data);
      })
      .catch((err) => console.error("Failed to load reports:", err))
      .finally(() => setLoading(false));
  }, []);

  const totals = report?.statusTotals || {
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

  const conversionPercentage =
    totals.TOTAL > 0
      ? ((totals.CONVERTED / totals.TOTAL) * 100).toFixed(1)
      : "0.0";

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-ramboow-navy-700" />
            <span>Reports &amp; Pipeline Analytics</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregated conversion metrics, team performance breakdowns, and service demand distribution.
          </p>
        </div>

        {/* Highlight KPI Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Portfolio Size
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                {loading ? "..." : totals.TOTAL}
              </div>
              <p className="text-xs text-slate-500 mt-1">Client accounts in CRM</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Won / Converted Clients
              </span>
              <div className="text-3xl sm:text-4xl font-black text-ramboow-red-700 mt-1">
                {loading ? "..." : totals.CONVERTED}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Overall Conversion: <strong>{conversionPercentage}%</strong>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-ramboow-red-50 flex items-center justify-center text-ramboow-red-700">
              <Trophy className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Call Updates Logged
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                {loading ? "..." : report?.totalCalls || 0}
              </div>
              <p className="text-xs text-slate-500 mt-1">Permanent interaction records</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700">
              <PhoneCall className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Status Distribution Grid (Section 16 Requirement) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-ramboow-navy-700" />
                <span>Client Status Breakdown</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribution of accounts across each phase of the consulting lifecycle.
              </p>
            </div>
            <Link
              href="/clients"
              className="text-xs font-semibold text-ramboow-red-700 hover:text-ramboow-red-900 flex items-center gap-1"
            >
              <span>View All Clients</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 pt-2">
            {CLIENT_STATUSES.map((st) => {
              const count = totals[st.id] || 0;
              const pct = totals.TOTAL > 0 ? ((count / totals.TOTAL) * 100).toFixed(0) : 0;

              return (
                <Link
                  key={st.id}
                  href={`/clients?status=${st.id}`}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-slate-300 hover:bg-slate-100/60 transition-all flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <StatusBadge status={st.id} size="sm" />
                    <span className="text-[11px] font-bold text-slate-400">
                      {pct}%
                    </span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900">
                      {count}
                    </span>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {st.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Team-Wise Performance Table (Section 16 Requirement) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-ramboow-navy-700" />
                <span>Team-Wise Statistics Table</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Performance by consultant across assigned volume and conversion metrics.
              </p>
            </div>
            <Link
              href="/team"
              className="text-xs font-semibold text-ramboow-navy-700 hover:text-ramboow-red-700 flex items-center gap-1"
            >
              <span>Manage Team</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4 sm:px-6">Team Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-center">Total Clients</th>
                  <th className="py-3 px-4 text-center">Interested</th>
                  <th className="py-3 px-4 text-center">Future</th>
                  <th className="py-3 px-4 text-center">Follow-ups</th>
                  <th className="py-3 px-4 text-center">Converted</th>
                  <th className="py-3 px-4 text-right">Conversion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report?.teamStats?.map((tm: any) => (
                  <tr key={tm.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                      <Link
                        href={`/clients?assignedToId=${tm.id}`}
                        className="hover:text-ramboow-red-700"
                      >
                        {tm.name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100">
                        {tm.role === "ADMIN" ? "Admin" : "Member"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {tm.total}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-emerald-700">
                      {tm.interested}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-purple-700">
                      {tm.future}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-amber-700">
                      {tm.followUp}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-ramboow-red-700">
                      {tm.converted}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {tm.conversionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Demand Breakdown */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-ramboow-navy-700" />
              <span>Service Requirement Popularity</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Which technology offerings are most requested by prospects.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            {report?.serviceDistribution?.map((srv: any) => (
              <div key={srv.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">{srv.name}</span>
                  <span className="text-slate-500 font-bold">
                    {srv.clientCount} clients ({srv.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-ramboow-navy-700 to-ramboow-red-700 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, srv.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

