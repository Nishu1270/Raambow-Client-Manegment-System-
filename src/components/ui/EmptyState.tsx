import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 bg-white/50 backdrop-blur-sm ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
        <Icon className="w-7 h-7 text-ramboow-navy-700" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl transition-all shadow-sm shadow-ramboow-red-900/10 active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

