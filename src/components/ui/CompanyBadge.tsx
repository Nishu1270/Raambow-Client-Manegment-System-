import React from "react";
import { COMPANIES, DEFAULT_COMPANY, CompanyType } from "@/lib/constants";

interface CompanyBadgeProps {
  company?: string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
  showDot?: boolean;
}

export function CompanyBadge({
  company,
  size = "xs",
  className = "",
  showDot = true,
}: CompanyBadgeProps) {
  const normalized = (company || DEFAULT_COMPANY).toUpperCase();
  const config =
    COMPANIES.find((c) => c.id === normalized) ||
    COMPANIES.find((c) => c.id === DEFAULT_COMPANY)!;

  const sizeStyles = {
    xs: "px-2 py-0.5 text-[10px] font-bold rounded-md tracking-wider gap-1.5",
    sm: "px-2.5 py-0.5 text-xs font-bold rounded-lg tracking-wider gap-1.5",
    md: "px-3 py-1 text-xs font-extrabold rounded-xl tracking-wider gap-2",
  };

  const isRaambow = config.id === "RAAMBOW";

  return (
    <span
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        borderColor: isRaambow ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
      }}
      className={`inline-flex items-center uppercase select-none shrink-0 border shadow-2xs ${sizeStyles[size]} ${className}`}
      title={`Project belongs to: ${config.name} (${config.tagline})`}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{
            backgroundColor: isRaambow ? "#60A5FA" : "#171717",
          }}
        />
      )}
      <span className="leading-none">{config.name}</span>
    </span>
  );
}
