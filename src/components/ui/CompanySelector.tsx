import React from "react";
import { COMPANIES, CompanyType } from "@/lib/constants";
import { CheckCircle2, Circle, Building } from "lucide-react";

interface CompanySelectorProps {
  value: string;
  onChange: (company: CompanyType) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
}

export function CompanySelector({
  value,
  onChange,
  disabled = false,
  label = "Company / Project Belongs To",
  required = true,
  error,
}: CompanySelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-slate-500" />
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
        <span className="text-[11px] font-medium text-slate-400">
          Mandatory Assignment
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMPANIES.map((company) => {
          const isSelected = value === company.id;
          const isRaambow = company.id === "RAAMBOW";

          return (
            <button
              key={company.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(company.id as CompanyType)}
              className={`relative text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-sm"
              } ${
                isSelected
                  ? isRaambow
                    ? "border-[#063B91] bg-blue-50/60 shadow-sm ring-2 ring-[#063B91]/20"
                    : "border-[#FACC15] bg-yellow-50/60 shadow-sm ring-2 ring-[#FACC15]/40"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Visual Company Color Swatch / Emblem */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs border"
                  style={{
                    backgroundColor: company.bgColor,
                    color: company.textColor,
                    borderColor: isRaambow
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.1)",
                  }}
                >
                  {company.id.charAt(0)}
                </div>

                {/* Company Name & Tagline */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                      {company.name}
                    </span>
                    <span
                      className="px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider shrink-0"
                      style={{
                        backgroundColor: company.bgColor,
                        color: company.textColor,
                      }}
                    >
                      {company.tagline}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {isRaambow
                      ? "Primary enterprise entity"
                      : "Secondary enterprise entity"}
                  </p>
                </div>
              </div>

              {/* Selection Checkmark */}
              <div className="shrink-0">
                {isSelected ? (
                  <CheckCircle2
                    className="w-5 h-5"
                    style={{
                      color: isRaambow ? "#063B91" : "#CA8A04",
                    }}
                  />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-600 mt-1 flex items-center gap-1">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
