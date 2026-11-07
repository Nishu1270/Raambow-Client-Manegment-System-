import React from "react";
import { CLIENT_STATUSES, ClientStatusType } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  size = "md",
  className = "",
  showDot = true,
}: StatusBadgeProps) {
  const config =
    CLIENT_STATUSES.find((s) => s.id === status) || {
      id: status,
      label: status,
      color: "bg-slate-100 text-slate-700 border-slate-200",
      dot: "bg-slate-400",
    };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
    lg: "px-3.5 py-1.5 text-sm font-semibold",
  };

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${config.color} ${sizeClasses[size]} ${className}`}
    >
      {showDot && (
        <span
          className={`rounded-full shrink-0 ${dotSizes[size]} ${config.dot}`}
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}

