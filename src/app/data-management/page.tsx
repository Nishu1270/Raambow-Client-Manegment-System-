"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CompanyBadge } from "@/components/ui/CompanyBadge";
import { CLIENT_STATUSES } from "@/lib/constants";
import {
  FileSpreadsheet,
  Upload,
  Download,
  History,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Filter,
  Users,
  ShieldAlert,
  ChevronDown,
  Layers,
  FileCheck,
  Calendar,
  Lock,
  Eye,
  Info,
  Check,
} from "lucide-react";

export default function DataManagementPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"import" | "export" | "history">("import");

  // Load current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser(data.user);
          if (data.user.role === "TEAM_MEMBER") {
            setActiveTab("export");
          }
        }
      })
      .catch((err) => console.error("Failed to load user:", err));
  }, []);

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <FileSpreadsheet className="w-5 h-5 text-ramboow-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Data Management
                </h1>
                <p className="text-sm text-slate-500">
                  Bulk client import, customized Excel exports, and data audit logs.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-2xl shadow-inner border border-slate-200">
            <button
              onClick={() => setActiveTab("import")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "import"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Upload className="w-4 h-4 text-ramboow-red-600" />
              <span>Import Clients</span>
            </button>

            <button
              onClick={() => setActiveTab("export")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "export"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Clients</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              <History className="w-4 h-4 text-indigo-600" />
              <span>Import History</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Import Clients */}
        {activeTab === "import" && (
          <ImportClientsTab currentUser={currentUser} />
        )}

        {/* Tab 2: Export Clients */}
        {activeTab === "export" && (
          <ExportClientsTab currentUser={currentUser} />
        )}

        {/* Tab 3: Import History */}
        {activeTab === "history" && (
          <ImportHistoryTab currentUser={currentUser} />
        )}
      </div>
    </AppLayout>
  );
}

// ============================================================================
// TAB 1: IMPORT CLIENTS COMPONENT
// ============================================================================
function ImportClientsTab({ currentUser }: { currentUser: any }) {
  const [step, setStep] = useState<"upload" | "preview" | "success">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Mapping state
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [duplicateHandling, setDuplicateHandling] = useState<"skip" | "update">("skip");
  const [defaultAssigneeId, setDefaultAssigneeId] = useState<string>("");
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "duplicate" | "invalid">("all");

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permission guard: Team members cannot perform company-wide imports
  if (currentUser && currentUser.role === "TEAM_MEMBER") {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Administrator Access Required</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Company-wide data import is restricted to administrators. Team members cannot upload or overwrite company client records.
        </p>
        <div className="pt-2">
          <Link
            href="/clients"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors shadow-xs"
          >
            <span>Return to Clients Directory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg("");

    if (selectedFile.size > 4.5 * 1024 * 1024) {
      setErrorMsg(
        `File size exceeds the 4.5 MB cloud limit (${(
          selectedFile.size /
          (1024 * 1024)
        ).toFixed(2)} MB). Please compress or split your spreadsheet.`
      );
      return;
    }

    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/data/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze spreadsheet.");
      }

      setPreviewData(data);
      setColumnMapping(data.columnMapping || {});
      if (data.users && data.users.length > 0) {
        setDefaultAssigneeId(data.users[0].id);
      }
      setStep("preview");
    } catch (err: any) {
      console.error("Analysis error:", err);
      setErrorMsg(err.message || "Failed to process the selected file.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Re-analyze when manual column mapping changes
  const handleReanalyzeMapping = async () => {
    if (!file) return;
    setAnalyzing(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("columnMapping", JSON.stringify(columnMapping));

      const res = await fetch("/api/data/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to re-analyze with updated mapping.");
      }

      setPreviewData(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Mapping validation failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Execute committed import
  const handleExecuteImport = async () => {
    if (!previewData || !previewData.rows) return;
    setIsExecuting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/data/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file?.name || previewData.fileName || "imported_clients.xlsx",
          rows: previewData.rows,
          duplicateHandling,
          defaultAssigneeId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute import.");
      }

      setExecutionResult(data);
      setStep("success");
    } catch (err: any) {
      console.error("Execution error:", err);
      setErrorMsg(err.message || "Failed to commit import.");
    } finally {
      setIsExecuting(false);
    }
  };

  // Download failed rows file
  const handleDownloadFailedRows = async () => {
    if (!executionResult || !executionResult.failedRecords) return;
    try {
      const res = await fetch("/api/data/import/failed-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          failedRecords: executionResult.failedRecords,
        }),
      });

      if (!res.ok) throw new Error("Could not download error file");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ramboow_Failed_Rows_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Error downloading error records:", err);
    }
  };

  // Reset to upload another file
  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setColumnMapping({});
    setExecutionResult(null);
    setErrorMsg("");
    setStep("upload");
  };

  // Filter preview rows
  const filteredRows = (previewData?.rows || []).filter((r: any) => {
    if (previewFilter === "valid") {
      return r.errors.length === 0 && !r.isDuplicateInDb && !r.isDuplicateInFile;
    }
    if (previewFilter === "duplicate") {
      return r.errors.length === 0 && (r.isDuplicateInDb || r.isDuplicateInFile);
    }
    if (previewFilter === "invalid") {
      return r.errors.length > 0;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Error notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Import Alert</p>
            <p>{errorMsg}</p>
          </div>
          <button
            onClick={() => setErrorMsg("")}
            className="text-rose-500 hover:text-rose-800 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* STEP 1: UPLOAD FILE */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Upload Client Spreadsheet
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Import prospective clients, contact information, service interests, and follow-ups.
                </p>
              </div>

              {/* Sample Template Download */}
              <a
                href="/api/data/import/template"
                download="Ramboow_Client_Import_Template.xlsx"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors border border-slate-200 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download Sample Template (.xlsx)</span>
              </a>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-ramboow-red-500 bg-ramboow-red-50/40"
                  : "border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInputChange}
              />

              <div className="w-16 h-16 rounded-2xl bg-white text-ramboow-red-700 border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-4">
                {analyzing ? (
                  <RefreshCw className="w-7 h-7 animate-spin text-ramboow-red-700" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900">
                {analyzing ? "Analyzing spreadsheet..." : "Drag & drop your client file here"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Supports Microsoft Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) and CSV (<strong>.csv</strong>) files
              </p>

              <div className="mt-5">
                <button
                  type="button"
                  disabled={analyzing}
                  className="px-5 py-2.5 rounded-xl bg-ramboow-red-700 hover:bg-ramboow-red-800 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50"
                >
                  Browse Files from Computer
                </button>
              </div>
            </div>

            {/* Import Best Practices Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Indian Phone Normalization</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Formats like 9876543210, 09876543210, or +91 98765 43210 are automatically standardized to +91 XXXXX XXXXX.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Smart Header Auto-Detection</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Common column labels like &quot;Mobile&quot;, &quot;Client Name&quot;, &quot;Company&quot;, &quot;Follow-up&quot; are automatically mapped.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Zero Silent Overwrites</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Existing clients are safeguarded. Duplicates can be safely skipped or explicitly updated only after your review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 & 3: COLUMN MAPPING & PREVIEW REPORT */}
      {step === "preview" && previewData && (
        <div className="space-y-6">
          {/* File summary banner */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ramboow-red-50 text-ramboow-red-700 border border-ramboow-red-200 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {file?.name || previewData.fileName}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Sheet: {previewData.sheetName}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {previewData.totalRows} data rows parsed & validated across {previewData.headers?.length} spreadsheet columns.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 transition-colors"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rows</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">{previewData.totalRows}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Found in spreadsheet</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-xs bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Valid Rows</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2">{previewData.validCount}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5">Ready for instant import</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-xs bg-amber-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Duplicates</span>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-amber-700 mt-2">{previewData.duplicateCount}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Existing phone match</p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-rose-200/80 shadow-xs bg-rose-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Invalid Rows</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-700 mt-2">{previewData.invalidCount}</p>
              <p className="text-[11px] text-rose-600 mt-0.5">Validation errors</p>
            </div>
          </div>

          {/* Column Mapping Section (Collapsible Accordion / Card) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Excel Column to RaamBow Field Mapping</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    Auto-Mapped
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm how spreadsheet columns correspond to CRM client fields. You can adjust dropdowns if needed.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReanalyzeMapping}
                disabled={analyzing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
                <span>Re-Validate Mapping</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {previewData.supportedFields?.map((field: any) => (
                <div
                  key={field.key}
                  className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800">
                      {field.label}
                    </label>
                    {field.required ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400">
                        Optional
                      </span>
                    )}
                  </div>

                  <select
                    value={columnMapping[field.key] || ""}
                    onChange={(e) =>
                      setColumnMapping({
                        ...columnMapping,
                        [field.key]: e.target.value,
                      })
                    }
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-ramboow-red-500 font-medium"
                  >
                    <option value="">— Not Mapped (Skip) —</option>
                    {previewData.headers?.map((h: string) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Import Execution Configuration: Duplicate Handling & Fallback Assignee */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900">
              Import Configuration &amp; Duplicate Handling
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duplicate Handling Radio */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  When a client phone number already exists:
                </label>

                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      duplicateHandling === "skip"
                        ? "border-slate-900 bg-slate-50 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="duplicateHandling"
                      value="skip"
                      checked={duplicateHandling === "skip"}
                      onChange={() => setDuplicateHandling("skip")}
                      className="mt-1 text-ramboow-red-600 focus:ring-ramboow-red-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Skip Duplicates (Default &amp; Recommended)
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Existing client records remain unchanged. Only fresh unique clients will be imported.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      duplicateHandling === "update"
                        ? "border-ramboow-red-600 bg-ramboow-red-50/30 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="duplicateHandling"
                      value="update"
                      checked={duplicateHandling === "update"}
                      onChange={() => setDuplicateHandling("update")}
                      className="mt-1 text-ramboow-red-600 focus:ring-ramboow-red-500"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        Update Existing Records (Explicit Confirmation)
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Updates existing client fields (name, service, notes, follow-up) for matching phone numbers.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Default Assignee Dropdown */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Default Team Member Assignment:
                </label>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <p className="text-xs text-slate-500">
                    If a spreadsheet row does not specify an assigned member (or the name is not found), assign to:
                  </p>
                  <select
                    value={defaultAssigneeId}
                    onChange={(e) => setDefaultAssigneeId(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-ramboow-red-500"
                  >
                    {previewData.users?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Rows Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">Spreadsheet Data Preview</h4>
                <span className="text-xs text-slate-500">
                  (Showing {filteredRows.length} of {previewData.totalRows} rows)
                </span>
              </div>

              {/* Preview Filter Pills */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    previewFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({previewData.totalRows})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter("valid")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    previewFilter === "valid"
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  Valid ({previewData.validCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter("duplicate")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    previewFilter === "duplicate"
                      ? "bg-amber-700 text-white"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  Duplicates ({previewData.duplicateCount})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewFilter("invalid")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    previewFilter === "invalid"
                      ? "bg-rose-700 text-white"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  Errors ({previewData.invalidCount})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/70 text-slate-700 sticky top-0 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Row</th>
                    <th className="py-2.5 px-3">Client Name</th>
                    <th className="py-2.5 px-3">Normalized Phone</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Assignee</th>
                    <th className="py-2.5 px-3">Validation Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRows.slice(0, 100).map((row: any) => (
                    <tr
                      key={row.rowNumber}
                      className={
                        row.errors.length > 0
                          ? "bg-rose-50/30"
                          : row.isDuplicateInDb
                          ? "bg-amber-50/20"
                          : "hover:bg-slate-50/60"
                      }
                    >
                      <td className="py-2.5 px-3 text-slate-400 font-mono">
                        #{row.rowNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{row.name || <span className="text-rose-500 italic">Missing Name</span>}</span>
                          <CompanyBadge company={row.company || "RAAMBOW"} size="xs" />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {row.phone || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {row.companyName || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={row.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {row.assignedToName || "Default"}
                      </td>
                      <td className="py-2.5 px-3">
                        {row.errors.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                            <XCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{row.errors[0]}</span>
                          </span>
                        ) : row.isDuplicateInDb ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Matches: &quot;{row.existingClientName}&quot; ({duplicateHandling === "skip" ? "Will Skip" : "Will Update"})
                            </span>
                          </span>
                        ) : row.isDuplicateInFile ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>Duplicate within file</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Valid</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commit Actions Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Ready to execute import?</p>
              <p className="text-xs text-slate-500">
                {duplicateHandling === "skip"
                  ? `${previewData.validCount} new records will be added. ${previewData.duplicateCount} duplicates will be skipped.`
                  : `${previewData.validCount} new records will be added. ${previewData.duplicateCount} existing records will be updated.`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExecuting}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 rounded-xl bg-ramboow-red-700 hover:bg-ramboow-red-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing into Database...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Confirm &amp; Import Clients</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: IMPORT RESULTS SUMMARY */}
      {step === "success" && executionResult && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">Import Completed Successfully</h2>
            <p className="text-sm text-slate-500 mt-1">
              File: <strong>{executionResult.fileName}</strong> has been processed into RaamBow Client Management.
            </p>
          </div>

          {/* Results Metric Pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-800 uppercase">Imported / Updated</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {(executionResult.importedCount || 0) + (executionResult.updatedCount || 0)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
              <p className="text-xs font-bold text-amber-800 uppercase">Skipped Duplicates</p>
              <p className="text-2xl font-black text-amber-700 mt-1">
                {executionResult.skippedCount || 0}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200">
              <p className="text-xs font-bold text-rose-800 uppercase">Failed Records</p>
              <p className="text-2xl font-black text-rose-700 mt-1">
                {executionResult.failedCount || 0}
              </p>
            </div>
          </div>

          {/* Download Failed Rows Button if any failed */}
          {executionResult.failedCount > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-rose-900">
                  {executionResult.failedCount} records could not be imported due to errors.
                </p>
                <p className="text-xs text-rose-700 mt-0.5">
                  You can download the failed rows file with detailed error descriptions.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadFailedRows}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs transition-colors shrink-0 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Failed Rows (.xlsx)</span>
              </button>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Import Another File
            </button>
            <Link
              href="/clients"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs inline-flex items-center justify-center gap-2"
            >
              <span>View Clients Directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB 2: EXPORT CLIENTS COMPONENT
// ============================================================================
function ExportClientsTab({ currentUser }: { currentUser: any }) {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["ALL"]);
  const [services, setServices] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("ALL");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Worksheet options
  const [includeCallHistory, setIncludeCallHistory] = useState(true);
  const [includeFutureDetails, setIncludeFutureDetails] = useState(true);
  const [includeFollowUps, setIncludeFollowUps] = useState(true);

  const [downloading, setDownloading] = useState(false);

  // Load team and services
  useEffect(() => {
    fetch("/api/services")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.services) setServices(data.services);
      })
      .catch((err) => console.error("Error loading services:", err));

    if (currentUser?.role === "ADMIN") {
      fetch("/api/team")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.team) setTeamMembers(data.team);
        })
        .catch((err) => console.error("Error loading team:", err));
    }
  }, [currentUser]);

  const toggleStatus = (statusId: string) => {
    if (statusId === "ALL") {
      setSelectedStatuses(["ALL"]);
      return;
    }

    let updated = selectedStatuses.filter((s) => s !== "ALL");
    if (updated.includes(statusId)) {
      updated = updated.filter((s) => s !== statusId);
    } else {
      updated.push(statusId);
    }

    if (updated.length === 0) {
      updated = ["ALL"];
    }
    setSelectedStatuses(updated);
  };

  const handleDownloadExport = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (!selectedStatuses.includes("ALL")) {
        params.append("status", selectedStatuses.join(","));
      } else {
        params.append("status", "ALL");
      }

      if (selectedServiceId !== "ALL") {
        params.append("serviceId", selectedServiceId);
      }

      if (currentUser?.role === "ADMIN" && selectedMemberId !== "ALL") {
        params.append("assignedToId", selectedMemberId);
      }

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      params.append("includeCallHistory", String(includeCallHistory));
      params.append("includeFutureDetails", String(includeFutureDetails));
      params.append("includeFollowUps", String(includeFollowUps));

      const res = await fetch(`/api/data/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ramboow_Clients_Export_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Export download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const isTeamMember = currentUser?.role === "TEAM_MEMBER";

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isTeamMember
              ? "Export Your Assigned Clients"
              : "Export Company Clients (All Team Records)"}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isTeamMember
              ? "Generate formatted Excel workbooks for your personal assigned accounts."
              : "Filter and download company-wide client lists, call logs, future leads, and follow-ups."}
          </p>
        </div>

        {isTeamMember && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Scoped to your assigned clients</span>
          </div>
        )}
      </div>

      {/* Filter 1: Client Status Selector */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          1. Select Client Statuses to Export
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toggleStatus("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedStatuses.includes("ALL")
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Statuses
          </button>

          {CLIENT_STATUSES.map((st) => {
            const isSelected = selectedStatuses.includes(st.id);
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => toggleStatus(st.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSelected ? "bg-ramboow-red-400" : st.dot
                  }`}
                />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter 2 & 3: Team Member, Service & Date Range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Team Member Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Team Member</label>
          {isTeamMember ? (
            <div className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-semibold flex items-center justify-between">
              <span>{currentUser?.name}</span>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
            </div>
          ) : (
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-ramboow-red-500"
            >
              <option value="ALL">All Team Members</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Service Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Service Category</label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-ramboow-red-500"
          >
            <option value="ALL">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Created From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-ramboow-red-500"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Created To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-ramboow-red-500"
          />
        </div>
      </div>

      {/* Worksheets to Include */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          2. Worksheets to Include in the Excel Workbook
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900">Clients Sheet</p>
              <p className="text-[11px] text-slate-500">Core client info (Always included)</p>
            </div>
          </div>

          <label className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white cursor-pointer flex items-center gap-3 transition-colors">
            <input
              type="checkbox"
              checked={includeCallHistory}
              onChange={(e) => setIncludeCallHistory(e.target.checked)}
              className="rounded text-ramboow-red-600 focus:ring-ramboow-red-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">Call History Sheet</p>
              <p className="text-[11px] text-slate-500">Call logs &amp; discussion notes</p>
            </div>
          </label>

          <label className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white cursor-pointer flex items-center gap-3 transition-colors">
            <input
              type="checkbox"
              checked={includeFutureDetails}
              onChange={(e) => setIncludeFutureDetails(e.target.checked)}
              className="rounded text-ramboow-red-600 focus:ring-ramboow-red-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">Future Clients Sheet</p>
              <p className="text-[11px] text-slate-500">Expected start date &amp; reasons</p>
            </div>
          </label>

          <label className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white cursor-pointer flex items-center gap-3 transition-colors">
            <input
              type="checkbox"
              checked={includeFollowUps}
              onChange={(e) => setIncludeFollowUps(e.target.checked)}
              className="rounded text-ramboow-red-600 focus:ring-ramboow-red-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">Follow-up Schedule</p>
              <p className="text-[11px] text-slate-500">Scheduled callback records</p>
            </div>
          </label>
        </div>
      </div>

      {/* Export Button */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-slate-500">
          The workbook will be formatted with auto-sized columns, structured headers, and clean date fields.
        </p>

        <button
          type="button"
          disabled={downloading}
          onClick={handleDownloadExport}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-ramboow-red-700 hover:bg-ramboow-red-800 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          {downloading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Generating Excel (.xlsx)...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Excel Export (.xlsx)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 3: IMPORT HISTORY COMPONENT
// ============================================================================
function ImportHistoryTab({ currentUser }: { currentUser: any }) {
  const [histories, setHistories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedErrorLog, setSelectedErrorLog] = useState<any[] | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/data/import/history");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load history.");
      setHistories(data.histories || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load import history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "ADMIN") {
      fetchHistory();
    }
  }, [currentUser]);

  if (currentUser && currentUser.role === "TEAM_MEMBER") {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Administrator Access Required</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Company import logs and audit histories are restricted to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Spreadsheet Import Audit Trail</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              History of all uploaded client spreadsheets, row counts, and error audits.
            </p>
          </div>

          <button
            onClick={fetchHistory}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-50 text-rose-800 text-xs border-b border-rose-200">
            {errorMsg}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Imported</th>
                <th className="py-3 px-4">Skipped</th>
                <th className="py-3 px-4">Failed</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : histories.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No spreadsheet imports recorded yet.
                  </td>
                </tr>
              ) : (
                histories.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{h.fileName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {h.uploadedBy?.name || "System"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(h.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{h.totalRows}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{h.importedRows}</td>
                    <td className="py-3 px-4 font-bold text-amber-700">{h.skippedRows}</td>
                    <td className="py-3 px-4 font-bold text-rose-700">{h.failedRows}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          h.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : h.status === "PARTIAL"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {h.errorLog ? (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              setSelectedErrorLog(JSON.parse(h.errorLog));
                            } catch {
                              setSelectedErrorLog([]);
                            }
                          }}
                          className="text-xs font-semibold text-ramboow-red-700 hover:text-ramboow-red-900 underline"
                        >
                          View {h.failedRows} Errors
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Log Viewer Modal */}
      {selectedErrorLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-2xl w-full shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Failed Records Log ({selectedErrorLog.length} rows)
              </h3>
              <button
                onClick={() => setSelectedErrorLog(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 text-xs">
              {selectedErrorLog.map((errItem: any, idx: number) => (
                <div key={idx} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Row #{errItem.rowNumber}: {errItem.name} ({errItem.phone})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {errItem.companyName || "No Company"}
                    </span>
                  </div>
                  <p className="text-rose-600 font-medium">
                    {errItem.errors ? errItem.errors.join("; ") : "Import failed."}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setSelectedErrorLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

