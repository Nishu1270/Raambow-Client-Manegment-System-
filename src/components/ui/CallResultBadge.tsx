import React from "react";
import { CALL_RESULTS } from "@/lib/constants";
import { PhoneCall, PhoneMissed, PhoneForwarded, Clock, Calendar, AlertCircle } from "lucide-react";

interface CallResultBadgeProps {
  result: string;
  className?: string;
  showIcon?: boolean;
}

export function CallResultBadge({
  result,
  className = "",
  showIcon = true,
}: CallResultBadgeProps) {
  const config =
    CALL_RESULTS.find((r) => r.id === result) || {
      id: result,
      label: result,
      color: "bg-slate-100 text-slate-700 border-slate-200",
    };

  const renderIcon = () => {
    switch (result) {
      case "CONNECTED":
        return <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />;
      case "NO_RESPONSE":
        return <PhoneMissed className="w-3.5 h-3.5 text-amber-600" />;
      case "BUSY":
        return <AlertCircle className="w-3.5 h-3.5 text-orange-600" />;
      case "CALL_LATER":
        return <Clock className="w-3.5 h-3.5 text-blue-600" />;
      case "MEETING_SCHEDULED":
        return <Calendar className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <PhoneForwarded className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border ${config.color} ${className}`}
    >
      {showIcon && renderIcon()}
      <span>{config.label}</span>
    </span>
  );
}

