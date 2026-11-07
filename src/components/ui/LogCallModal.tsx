"use client";

import React, { useState } from "react";
import { X, PhoneCall, Calendar, Clock, AlertCircle, Sparkles } from "lucide-react";
import { CALL_RESULTS, CLIENT_STATUSES } from "@/lib/constants";

interface LogCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  currentStatus: string;
  onSuccess: (updatedData: any) => void;
}

export function LogCallModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  currentStatus,
  onSuccess,
}: LogCallModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const [date, setDate] = useState(today);
  const [time, setTime] = useState(nowTime);
  const [callResult, setCallResult] = useState<string>("CONNECTED");
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>(currentStatus);
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("11:30");

  // Future Client fields (Requirement 3)
  const [expectedStart, setExpectedStart] = useState("");
  const [futureReason, setFutureReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError("Please enter call discussion notes.");
      return;
    }

    if (newStatus === "FUTURE" && (!expectedStart.trim() || !nextFollowUpDate)) {
      setError("For FUTURE clients, please specify the Expected Project Start Date and Next Follow-up Date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/clients/${clientId}/calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callResult,
          notes,
          newStatus,
          date,
          time,
          nextFollowUpDate: nextFollowUpDate || null,
          nextFollowUpTime: nextFollowUpTime || null,
          expectedStart: newStatus === "FUTURE" ? expectedStart : undefined,
          futureReason: newStatus === "FUTURE" ? futureReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log call update.");
      }

      onSuccess(data);
      onClose();
      // Reset form
      setNotes("");
      setNextFollowUpDate("");
      setExpectedStart("");
      setFutureReason("");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-ramboow-red-700" />
              <span>Record Call &amp; Status Update</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong className="text-slate-800">{clientName}</strong> (Current Status: {currentStatus})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Call Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Call Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Call Time *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Call Result */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Call Result *
            </label>
            <select
              value={callResult}
              onChange={(e) => setCallResult(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50 font-medium"
            >
              {CALL_RESULTS.map((cr) => (
                <option key={cr.id} value={cr.id}>
                  {cr.label}
                </option>
              ))}
            </select>
          </div>

          {/* Discussion Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discussion Notes / Summary *
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer asked for quotation, discussed website requirement, will decide after board review..."
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50 resize-none font-medium"
            />
          </div>

          {/* Client Status Transition */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Update Client Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50 font-semibold"
            >
              {CLIENT_STATUSES.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label} ({st.id}) {st.id === currentStatus ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Requirement 3: When FUTURE is selected as the client status, display Expected Start Date, Next Follow-up Date, and Future Interest Reason */}
          {newStatus === "FUTURE" && (
            <div className="p-4 rounded-2xl bg-purple-50/80 border-2 border-purple-200 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Future Client Planning</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">
                  Expected Project Start Date *
                </label>
                <input
                  type="text"
                  value={expectedStart}
                  onChange={(e) => setExpectedStart(e.target.value)}
                  placeholder="e.g. January 2027, Q2 2027, Post-Audit..."
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-purple-900 mb-1">
                  Future Interest Reason
                </label>
                <textarea
                  rows={2}
                  value={futureReason}
                  onChange={(e) => setFutureReason(e.target.value)}
                  placeholder="e.g. Needs budget clearance in Jan, relocating office..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium resize-none"
                />
              </div>
            </div>
          )}

          {/* Next Follow-up Section */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Schedule Next Follow-up {newStatus === "FUTURE" ? "(Required for Future Client)" : "(Optional)"}</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  required={newStatus === "FUTURE"}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Follow-up Time
                </label>
                <input
                  type="time"
                  value={nextFollowUpTime}
                  onChange={(e) => setNextFollowUpTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl transition-all shadow-sm shadow-ramboow-red-900/15 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Saving Update..." : "Save Call & Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
