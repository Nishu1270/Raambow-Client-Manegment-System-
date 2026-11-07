"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Phone, Building2, Calendar, Clock, ArrowRight, UserCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [exactMatch, setExactMatch] = useState<any | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setExactMatch(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Trigger open handled by parent
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setExactMatch(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setExactMatch(data.exactPhoneMatch || null);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const navigateToClient = (id: string) => {
    onClose();
    router.push(`/clients/${id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by client name, phone number, company..."
            className="flex-1 bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-slate-400 bg-white border border-slate-200 rounded">
            ESC
          </kbd>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-sm text-slate-500">
              Searching clients...
            </div>
          )}

          {/* Exact Phone Number Match Spotlight Card (Section 17 requirement!) */}
          {!loading && exactMatch && (
            <div className="rounded-xl border-2 border-ramboow-navy-700 bg-slate-50/80 p-4 transition-all hover:bg-slate-100/80 cursor-pointer shadow-sm"
              onClick={() => navigateToClient(exactMatch.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ramboow-navy-700 bg-slate-200/70 px-2 py-0.5 rounded">
                  Exact Phone Match
                </span>
                <StatusBadge status={exactMatch.status} size="sm" />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {exactMatch.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-ramboow-red-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {exactMatch.phone}
                    </span>
                    {exactMatch.companyName && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {exactMatch.companyName}
                      </span>
                    )}
                    {exactMatch.service && (
                      <span className="text-slate-500">
                        {exactMatch.service.name}
                      </span>
                    )}
                  </div>
                </div>

                <button className="text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1 shrink-0">
                  <span>View Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Call History preview inside exact match */}
              <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Call: </span>
                  <strong className="text-slate-800">
                    {formatDate(exactMatch.lastContactAt)}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Next Follow-up: </span>
                  <strong className="text-slate-800">
                    {formatDate(exactMatch.nextFollowUpAt)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {!loading && results.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                Matching Clients ({results.length})
              </h5>
              {results.map((client) => (
                <div
                  key={client.id}
                  onClick={() => navigateToClient(client.id)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm group-hover:text-ramboow-red-700 transition-colors">
                        {client.name}
                      </span>
                      <StatusBadge status={client.status} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="font-medium text-slate-700">
                        {client.phone}
                      </span>
                      {client.companyName && (
                        <span>• {client.companyName}</span>
                      )}
                      {client.service && (
                        <span>• {client.service.name}</span>
                      )}
                      {client.assignedTo && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          {client.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Empty / Initial State */}
          {!loading && query && results.length === 0 && !exactMatch && (
            <div className="py-8 text-center text-sm text-slate-500">
              No clients found matching &ldquo;{query}&rdquo;.
            </div>
          )}

          {!query && (
            <div className="py-6 text-center text-xs text-slate-400">
              Type a name, phone number, or company name to search across your clients.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

