"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CallResultBadge } from "@/components/ui/CallResultBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";
import { CALL_RESULTS, CLIENT_STATUSES } from "@/lib/constants";
import {
  PhoneCall,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

export default function CallHistoryPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [callResult, setCallResult] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [userId, setUserId] = useState("ALL");
  const [page, setPage] = useState(1);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setIsAdmin(data.user.role === "ADMIN");
      });

    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.team) setTeamMembers(data.team);
      });
  }, []);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });

      if (search.trim()) params.append("search", search.trim());
      if (callResult !== "ALL") params.append("callResult", callResult);
      if (status !== "ALL") params.append("status", status);
      if (userId !== "ALL") params.append("userId", userId);

      const res = await fetch(`/api/calls?${params.toString()}`);
      const data = await res.json();
      setCalls(data.calls || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load call history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [page, callResult, status, userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCalls();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <PhoneCall className="w-7 h-7 text-ramboow-navy-700" />
            <span>Master Call History</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Permanent historical log preserving previous status, new status, call result, and notes. Never overwritten.
          </p>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search calls by client name, phone, discussion notes..."
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Call Result Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Call Result
              </label>
              <select
                value={callResult}
                onChange={(e) => {
                  setCallResult(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white"
              >
                <option value="ALL">All Call Results</option>
                {CALL_RESULTS.map((cr) => (
                  <option key={cr.id} value={cr.id}>
                    {cr.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Client Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white"
              >
                <option value="ALL">All Statuses</option>
                {CLIENT_STATUSES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Member Filter (Admin only) */}
            {isAdmin ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Updated By Team Member
                </label>
                <select
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white"
                >
                  <option value="ALL">All Team Members</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Scope
                </label>
                <div className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-100 text-slate-600">
                  Your Activity &amp; Assigned Accounts
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Call History Table (Requirement 4: Shows Previous Status, New Status, Result, Notes, User, DateTime, Next Follow-up) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Loading call logs...
            </div>
          ) : calls.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                      <th className="py-3.5 px-4 sm:px-6">Date &amp; Time</th>
                      <th className="py-3.5 px-4">Client Details</th>
                      <th className="py-3.5 px-4">Updated By</th>
                      <th className="py-3.5 px-4">Call Result</th>
                      <th className="py-3.5 px-4">Status Transition</th>
                      <th className="py-3.5 px-4 min-w-[220px]">Discussion Notes</th>
                      <th className="py-3.5 px-4">Next Follow-up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calls.map((call) => {
                      const hasTransition =
                        call.previousStatus &&
                        call.newStatus &&
                        call.previousStatus !== call.newStatus;

                      return (
                        <tr key={call.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Date & Time */}
                          <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-slate-600 font-medium">
                            <span className="block font-semibold text-slate-900">
                              {formatDate(call.calledAt)}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatTime(call.calledAt)}
                            </span>
                          </td>

                          {/* Client */}
                          <td className="py-4 px-4">
                            <Link
                              href={`/clients/${call.client.id}`}
                              className="font-bold text-slate-900 hover:text-ramboow-red-700 flex items-center gap-1"
                            >
                              <span>{call.client.name}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>{call.client.phone}</span>
                              {call.client.companyName && (
                                <span>• {call.client.companyName}</span>
                              )}
                            </div>
                          </td>

                          {/* Updated By */}
                          <td className="py-4 px-4 whitespace-nowrap font-semibold text-slate-800">
                            {call.user.name}
                          </td>

                          {/* Call Result */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <CallResultBadge result={call.callResult} />
                          </td>

                          {/* Status Transition (Requirement 4) */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {hasTransition ? (
                              <div className="inline-flex items-center gap-1">
                                <StatusBadge status={call.previousStatus} size="sm" showDot={false} />
                                <ArrowRight className="w-3 h-3 text-slate-400" />
                                <StatusBadge status={call.newStatus} size="sm" />
                              </div>
                            ) : (
                              <StatusBadge status={call.newStatus || call.statusAtTime} size="sm" />
                            )}
                          </td>

                          {/* Discussion Notes */}
                          <td className="py-4 px-4 text-xs text-slate-700 leading-relaxed font-medium">
                            {call.notes}
                          </td>

                          {/* Next Follow up */}
                          <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-500">
                            {call.nextFollowUpAt ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <Calendar className="w-3 h-3 text-amber-600" />
                                <span>{formatDate(call.nextFollowUpAt)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 sm:px-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Showing {calls.length} of {total} call logs
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-slate-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={PhoneCall}
              title="No call history found"
              description="No calls matched your search criteria."
              className="py-12"
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
