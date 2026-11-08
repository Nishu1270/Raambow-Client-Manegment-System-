"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import {
  Trophy,
  IndianRupee,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Phone,
  Search,
  ExternalLink,
  Edit,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Wallet,
  Coins,
  Sparkles,
} from "lucide-react";

export default function ConvertedClientsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalConverted: 0,
    totalProjectValue: 0,
    totalAdvanceReceived: 0,
    totalBalancePending: 0,
    completedPayments: 0,
    pendingPayments: 0,
  });

  // Filter & Search
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("ALL");

  // Project Management Modal
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [form, setForm] = useState({
    quotationAmount: "",
    advanceReceived: "",
    balancePayment: "",
    paymentStatus: "PENDING",
    projectStarted: "",
    projectDeadline: "",
    quotationDetails: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRes = await fetch("/api/auth/me");
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      if (userData.user.role !== "ADMIN") {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/converted");
      if (!res.ok) {
        throw new Error("Failed to load converted clients.");
      }
      const data = await res.json();
      setClients(data.clients || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error("Error loading converted clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setForm({
      quotationAmount: client.quotationAmount ? String(client.quotationAmount) : "",
      advanceReceived: client.advanceReceived ? String(client.advanceReceived) : "",
      balancePayment: client.balancePayment ? String(client.balancePayment) : "",
      paymentStatus: client.paymentStatus || "PENDING",
      projectStarted: client.projectStarted ? client.projectStarted.split("T")[0] : "",
      projectDeadline: client.projectDeadline ? client.projectDeadline.split("T")[0] : "",
      quotationDetails: client.quotationDetails || "",
    });
  };

  const handlePriceChange = (priceVal: string, advVal: string) => {
    const p = parseFloat(priceVal) || 0;
    const a = parseFloat(advVal) || 0;
    const bal = Math.max(0, p - a);
    let status = form.paymentStatus;
    if (p > 0 && bal === 0) {
      status = "COMPLETED";
    } else if (a > 0 && bal > 0) {
      status = "PARTIAL";
    } else {
      status = "PENDING";
    }
    setForm((prev) => ({
      ...prev,
      quotationAmount: priceVal,
      advanceReceived: advVal,
      balancePayment: String(bal),
      paymentStatus: status,
    }));
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setSaveLoading(true);

    try {
      const res = await fetch("/api/converted", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: editingClient.id,
          ...form,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update project.");
      }

      setEditingClient(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    } finally {
      setSaveLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search) ||
      (client.companyName && client.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (client.service?.name && client.service.name.toLowerCase().includes(search.toLowerCase()));

    const matchesPayment =
      paymentFilter === "ALL" || client.paymentStatus === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-sm text-slate-500">
          Loading converted clients & financial data...
        </div>
      </AppLayout>
    );
  }

  // Strict RBAC Access Guard
  if (currentUser?.role !== "ADMIN") {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-ramboow-red-700 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Administrative Access Only
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            The Converted Clients section and quotation financials are confidential and restricted strictly to system administrators.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Converted Clients & Projects
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Admin-exclusive management for closed deals, project kickoff dates, delivery deadlines, quotations, and payments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/clients?status=CONVERTED"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
            >
              View in Directory
            </Link>
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Converted */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Converted Deals
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight">
                {summary.totalConverted}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Deals successfully converted
              </p>
            </div>
          </div>

          {/* Total Value */}
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Total Quotation Value
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-300" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight">
                {formatCurrency(summary.totalProjectValue)}
              </div>
              <p className="text-xs text-blue-200 mt-1">
                Total agreed project revenue
              </p>
            </div>
          </div>

          {/* Advance Received */}
          <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                Advance Collected
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-emerald-300" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight text-emerald-100">
                {formatCurrency(summary.totalAdvanceReceived)}
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                Cash received into company
              </p>
            </div>
          </div>

          {/* Balance Pending */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-800 rounded-3xl p-5 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-200 uppercase tracking-wider">
                Pending Balance
              </span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <Coins className="w-4 h-4 text-amber-300" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black tracking-tight text-amber-100">
                {formatCurrency(summary.totalBalancePending)}
              </div>
              <p className="text-xs text-amber-200 mt-1">
                Due upon milestone / completion
              </p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client, phone, company, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Payment Status:
            </span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">All Payments</option>
              <option value="PENDING">Pending (Advance awaited)</option>
              <option value="PARTIAL">Partial (Advance received)</option>
              <option value="COMPLETED">Completed (Fully paid)</option>
            </select>
          </div>
        </div>

        {/* Converted Projects Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
          {filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-3 px-4 min-w-[200px]">Client / Company</th>
                    <th className="py-3 px-3 min-w-[130px]">Service</th>
                    <th className="py-3 px-3 min-w-[170px]">Project Timeline</th>
                    <th className="py-3 px-3 min-w-[120px]">Quotation (₹)</th>
                    <th className="py-3 px-3 min-w-[120px]">Advance (₹)</th>
                    <th className="py-3 px-3 min-w-[120px]">Balance (₹)</th>
                    <th className="py-3 px-3 min-w-[120px]">Payment Status</th>
                    <th className="py-3 px-3 min-w-[130px]">Assigned Consultant</th>
                    <th className="py-3 px-4 text-right min-w-[130px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => {
                    const price = client.quotationAmount || 0;
                    const advance = client.advanceReceived || 0;
                    const balance = client.balancePayment !== undefined ? client.balancePayment : Math.max(0, price - advance);
                    const isCompleted = client.paymentStatus === "COMPLETED" || (price > 0 && balance === 0);

                    // Deadline warning
                    let deadlineText = "No deadline set";
                    let isOverdue = false;
                    let isDueSoon = false;
                    if (client.projectDeadline) {
                      const dlDate = new Date(client.projectDeadline);
                      const now = new Date();
                      const diffDays = Math.ceil((dlDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      if (diffDays < 0) {
                        isOverdue = true;
                        deadlineText = `Overdue by ${Math.abs(diffDays)}d`;
                      } else if (diffDays <= 7) {
                        isDueSoon = true;
                        deadlineText = `Due in ${diffDays}d`;
                      } else {
                        deadlineText = `Due ${formatDate(client.projectDeadline)}`;
                      }
                    }

                    return (
                      <tr key={client.id} className="hover:bg-slate-50/80 transition-colors group">
                        {/* Client Name & Company */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <Link
                            href={`/clients/${client.id}`}
                            className="hover:text-ramboow-red-700 transition-colors flex items-center gap-1.5 font-bold"
                          >
                            <span>{client.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-ramboow-red-500 transition-colors" />
                          </Link>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {client.phone}
                            </span>
                            {client.companyName && (
                              <span>• {client.companyName}</span>
                            )}
                          </div>
                        </td>

                        {/* Service */}
                        <td className="py-3.5 px-3 text-slate-600">
                          {client.service ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              {client.service.name}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Project Timeline */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            {client.projectStarted && (
                              <div className="text-[11px] text-slate-600 flex items-center gap-1">
                                <span className="font-semibold text-slate-500">Started:</span>
                                <span>{formatDate(client.projectStarted)}</span>
                              </div>
                            )}
                            {client.projectDeadline ? (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                    isOverdue
                                      ? "bg-red-50 text-red-700 border border-red-200"
                                      : isDueSoon
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>{deadlineText}</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No deadline set</span>
                            )}
                          </div>
                        </td>

                        {/* Quotation Amount */}
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {price > 0 ? formatCurrency(price) : <span className="text-slate-300 font-normal">Not set</span>}
                        </td>

                        {/* Advance Received */}
                        <td className="py-3.5 px-3 font-semibold text-emerald-700">
                          {advance > 0 ? formatCurrency(advance) : <span className="text-slate-300 font-normal">₹0</span>}
                        </td>

                        {/* Balance Pending */}
                        <td className="py-3.5 px-3 font-bold">
                          {balance > 0 ? (
                            <span className="text-amber-700">{formatCurrency(balance)}</span>
                          ) : price > 0 ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Paid
                            </span>
                          ) : (
                            <span className="text-slate-300 font-normal">—</span>
                          )}
                        </td>

                        {/* Payment Status Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : client.paymentStatus === "PARTIAL"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCompleted
                                  ? "bg-emerald-500"
                                  : client.paymentStatus === "PARTIAL"
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            <span>
                              {isCompleted
                                ? "Completed"
                                : client.paymentStatus === "PARTIAL"
                                ? "Partial"
                                : "Pending"}
                            </span>
                          </span>
                        </td>

                        {/* Assigned Consultant */}
                        <td className="py-3.5 px-3 text-slate-700 font-medium">
                          {client.assignedTo?.name || <span className="text-slate-400 italic">Unassigned</span>}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEditModal(client)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-900 rounded-xl transition-all shadow-2xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Manage Project</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center">
              <EmptyState
                icon={Trophy}
                title="No Converted Clients Found"
                description={
                  search || paymentFilter !== "ALL"
                    ? "No converted deals match your current filters."
                    : "When a client is converted, their project kickoff, delivery deadline, quotation, and payment tracking will appear here."
                }
              />
            </div>
          )}
        </div>

        {/* Modal: Manage Project & Financials */}
        {editingClient && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Manage Project & Financials
                  </h3>
                  <p className="text-xs text-slate-500">
                    Client: <strong>{editingClient.name}</strong> ({editingClient.phone})
                  </p>
                </div>
                <button
                  onClick={() => setEditingClient(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Project Start Date
                    </label>
                    <input
                      type="date"
                      value={form.projectStarted}
                      onChange={(e) => setForm({ ...form, projectStarted: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Project Delivery Deadline
                    </label>
                    <input
                      type="date"
                      value={form.projectDeadline}
                      onChange={(e) => setForm({ ...form, projectDeadline: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Financials: Price, Advance, Balance */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <IndianRupee className="w-4 h-4 text-amber-700" />
                    <span>Project Financials & Quotation</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Fixed Project Price (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 50000"
                        value={form.quotationAmount}
                        onChange={(e) => handlePriceChange(e.target.value, form.advanceReceived)}
                        className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Advance Received (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 20000"
                        value={form.advanceReceived}
                        onChange={(e) => handlePriceChange(form.quotationAmount, e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white font-semibold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Balance Remaining (₹)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={form.balancePayment ? `₹${form.balancePayment}` : "₹0"}
                        className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-amber-100/50 font-bold text-amber-900 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={form.paymentStatus}
                      onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl bg-white font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="PENDING">Pending (Advance not yet received)</option>
                      <option value="PARTIAL">Partial (Advance received, balance pending)</option>
                      <option value="COMPLETED">Completed (Fully paid)</option>
                    </select>
                  </div>
                </div>

                {/* Scope & Quotation Details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project Scope / Quotation Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter agreed deliverables, milestones, tech stack, or payment terms..."
                    value={form.quotationDetails}
                    onChange={(e) => setForm({ ...form, quotationDetails: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingClient(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl transition-all shadow-sm"
                  >
                    {saveLoading ? "Saving Changes..." : "Save Project Details"}
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
