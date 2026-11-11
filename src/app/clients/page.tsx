"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LogCallModal } from "@/components/ui/LogCallModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyBadge } from "@/components/ui/CompanyBadge";
import { formatDate } from "@/lib/utils";
import { CLIENT_STATUSES } from "@/lib/constants";
import {
  Users,
  Search,
  Plus,
  PhoneCall,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Building2,
  ExternalLink,
  Phone,
  Clock,
  Briefcase,
  UserCheck,
  Check,
} from "lucide-react";

function ClientsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialStatus = searchParams.get("status") || "ALL";

  const [clients, setClients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [company, setCompany] = useState("ALL");
  const [assignedToId, setAssignedToId] = useState("ALL");
  const [serviceId, setServiceId] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dropdown reference data
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>("TEAM_MEMBER");

  // Log Call Modal state
  const [activeCallClient, setActiveCallClient] = useState<any | null>(null);

  // Load user info & dropdown lists
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserRole(data.user.role);
        }
      });

    fetch("/api/team")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.team) setTeamMembers(data.team);
      })
      .catch((err) => console.error("Error loading team:", err));

    fetch("/api/services")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.services) setServices(data.services);
      })
      .catch((err) => console.error("Error loading services:", err));
  }, []);

  // Update status filter if query params change (e.g. clicked from dashboard card)
  useEffect(() => {
    const qStatus = searchParams.get("status");
    if (qStatus) {
      setStatus(qStatus);
      setPage(1);
    } else {
      setStatus("ALL");
    }
  }, [searchParams]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
      });

      if (search.trim()) params.append("search", search.trim());
      if (status && status !== "ALL") params.append("status", status);
      if (company && company !== "ALL") params.append("company", company);
      if (assignedToId && assignedToId !== "ALL") params.append("assignedToId", assignedToId);
      if (serviceId && serviceId !== "ALL") params.append("serviceId", serviceId);

      const res = await fetch(`/api/clients?${params.toString()}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setClients(data.clients || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, limit, status, company, assignedToId, serviceId, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchClients();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCallSuccess = () => {
    fetchClients();
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
    if (newStatus === "ALL") {
      router.push("/clients");
    } else {
      router.push(`/clients?status=${newStatus}`);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setCompany("ALL");
    setAssignedToId("ALL");
    setServiceId("ALL");
    setSortBy("newest");
    setPage(1);
    router.push("/clients");
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Add Client */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-ramboow-navy-700" />
            <span>Clients Directory</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {userRole === "ADMIN"
              ? `Manage and monitor all company client accounts (${total} total permitted records).`
              : `Manage your directly assigned clients (${total} total assigned records).`}
          </p>
        </div>

        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl shadow-sm shadow-ramboow-red-900/15 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </Link>
      </div>

      {/* Clear Quick Status Pill Bar (Requirement 5: Clear filters for all 9 statuses) */}
      <div className="bg-white rounded-2xl p-3 shadow-2xs border border-slate-200/80 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            onClick={() => handleStatusFilterChange("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              status === "ALL"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            All Clients
          </button>
          {CLIENT_STATUSES.map((st) => {
            const isSelected = status === st.id;
            return (
              <button
                key={st.id}
                onClick={() => handleStatusFilterChange(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${st.dot} ${
                    isSelected ? "ring-2 ring-white" : ""
                  }`}
                />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, phone number, company name, location, or reason..."
            className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
          />
        </div>

        {/* Multi-Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Company Filter (Multi-Company Project Management) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Company</span>
              {company !== "ALL" && (
                <span
                  className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline"
                  onClick={() => {
                    setCompany("ALL");
                    setPage(1);
                  }}
                >
                  Clear
                </span>
              )}
            </label>
            <select
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Companies</option>
              <option value="RAAMBOW">RAAMBOW</option>
              <option value="KATERNGERS">KATERNGERS</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Status Filter
            </label>
            <select
              value={status}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Statuses ({total})</option>
              {CLIENT_STATUSES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Member Filter (Only visible/controllable for Admin) */}
          {userRole === "ADMIN" ? (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Assigned Team Member
              </label>
              <select
                value={assignedToId}
                onChange={(e) => {
                  setAssignedToId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Team Members</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role === "ADMIN" ? "Admin" : "Member"})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Scope
              </label>
              <div className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-100 text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>My Assigned Clients</span>
              </div>
            </div>
          )}

          {/* Service Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Service Requirement
            </label>
            <select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Sort Order
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="newest">Newest Added First</option>
              <option value="oldest">Oldest First</option>
              <option value="recentlyContacted">Recently Contacted</option>
              <option value="upcomingFollowUp">Upcoming Follow-up</option>
              <option value="name">Client Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Clear Tag */}
        {(status !== "ALL" || (userRole === "ADMIN" && assignedToId !== "ALL") || serviceId !== "ALL" || search) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Filtered results active. Showing {clients.length} of {total} records.
            </span>
            <button
              onClick={clearFilters}
              className="text-ramboow-red-700 hover:text-ramboow-red-900 font-semibold"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Requirement 2: Improved Directory Table */}
      {/* Exact Column Order Requested:
          1. Client Name
          2. Phone Number
          3. Company
          4. Status
          5. Assigned To
          6. Service
          7. Last Contact
          8. Next Follow-up
          9. Actions
          Keep Client Name and Phone Number visible without requiring horizontal scrolling on normal desktop screens.
          Use responsive layouts on mobile.
      */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Loading clients...
          </div>
        ) : clients.length > 0 ? (
          <>
            {/* Desktop Table View (md and above) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    {/* 1. Client Name (Sticky left on desktop if needed, always visible) */}
                    <th className="py-3 px-4 font-extrabold text-slate-800 min-w-[170px] whitespace-nowrap">
                      1. Client Name
                    </th>
                    {/* 2. Phone Number (Visible directly next to name without scrolling) */}
                    <th className="py-3 px-3 font-extrabold text-slate-800 min-w-[135px] whitespace-nowrap">
                      2. Phone Number
                    </th>
                    {/* 3. Company */}
                    <th className="py-3 px-3 min-w-[130px]">
                      3. Company
                    </th>
                    {/* 4. Status */}
                    <th className="py-3 px-3 min-w-[115px] whitespace-nowrap">
                      4. Status
                    </th>
                    {/* 5. Assigned To */}
                    <th className="py-3 px-3 min-w-[120px] whitespace-nowrap">
                      5. Assigned To
                    </th>
                    {/* 6. Service */}
                    <th className="py-3 px-3 min-w-[130px]">
                      6. Service
                    </th>
                    {/* 7. Last Contact */}
                    <th className="py-3 px-3 min-w-[100px] whitespace-nowrap">
                      7. Last Contact
                    </th>
                    {/* 8. Next Follow-up */}
                    <th className="py-3 px-3 min-w-[115px] whitespace-nowrap">
                      8. Next Follow-up
                    </th>
                    {/* 9. Actions */}
                    <th className="py-3 px-4 text-right min-w-[110px] whitespace-nowrap">
                      9. Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Client Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/clients/${client.id}`}
                            className="hover:text-ramboow-red-700 transition-colors flex items-center gap-1.5"
                          >
                            <span className="font-bold">{client.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-ramboow-red-500 transition-colors" />
                          </Link>
                          <CompanyBadge company={client.company} size="xs" />
                        </div>
                        {client.location && (
                          <span className="block text-[11px] font-normal text-slate-400 truncate max-w-[160px]">
                            {client.location}
                          </span>
                        )}
                      </td>

                      {/* 2. Phone Number */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <a
                          href={`tel:${client.phone}`}
                          className="font-semibold text-slate-800 hover:text-ramboow-red-700 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{client.phone}</span>
                        </a>
                      </td>

                      {/* 3. Company */}
                      <td className="py-3.5 px-3 text-slate-600">
                        {client.companyName ? (
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[130px] font-medium">
                              {client.companyName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* 4. Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge status={client.status} size="sm" />
                      </td>

                      {/* 5. Assigned To */}
                      <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {client.assignedTo ? (
                          <span className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                              {client.assignedTo.name.charAt(0)}
                            </span>
                            <span className="truncate max-w-[105px]">
                              {client.assignedTo.name}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* 6. Service */}
                      <td className="py-3.5 px-3 text-slate-600">
                        {client.service ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium truncate max-w-[130px]">
                            {client.service.name}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* 7. Last Contact */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-500 font-medium">
                        {formatDate(client.lastContactAt)}
                      </td>

                      {/* 8. Next Follow-up */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {client.nextFollowUpAt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>{formatDate(client.nextFollowUpAt)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveCallClient(client)}
                            title="Log Call Update"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-900 transition-colors"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>

                          <Link
                            href={`/clients/${client.id}`}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards View (< md screens) */}
            <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3"
                >
                  {/* Top row: Name, Phone, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-base font-bold text-slate-900 hover:text-ramboow-red-700 flex items-center gap-1"
                        >
                          <span>{client.name}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                        <CompanyBadge company={client.company} size="xs" />
                      </div>
                      <a
                        href={`tel:${client.phone}`}
                        className="text-xs font-semibold text-ramboow-red-700 flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{client.phone}</span>
                      </a>
                    </div>
                    <StatusBadge status={client.status} size="sm" />
                  </div>

                  {/* Company & Service */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Company</span>
                      <span className="font-medium text-slate-800">
                        {client.companyName || "Individual"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Service</span>
                      <span className="font-medium text-slate-800 truncate block">
                        {client.service?.name || "General"}
                      </span>
                    </div>
                  </div>

                  {/* Assigned To & Dates */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned To</span>
                      <span className="font-medium text-slate-800">
                        {client.assignedTo?.name || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Next Follow-up</span>
                      <span className="font-semibold text-amber-700">
                        {formatDate(client.nextFollowUpAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <button
                      onClick={() => setActiveCallClient(client)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Log Call</span>
                    </button>

                    <Link
                      href={`/clients/${client.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-semibold"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-4 sm:px-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, total)} of {total} clients
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>

                <div className="flex items-center gap-1 ml-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-semibold text-slate-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            icon={Users}
            title="No clients found"
            description="No clients matched your selected search or filter criteria. Try resetting your filters."
            actionText="Reset Filters"
            onAction={clearFilters}
            className="py-12"
          />
        )}
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
    </div>
  );
}

export default function ClientsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading clients...</div>}>
        <ClientsContent />
      </Suspense>
    </AppLayout>
  );
}
