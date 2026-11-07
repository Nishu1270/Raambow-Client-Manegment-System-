"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Search, UserPlus, Menu, Shield } from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { RamboowLogo } from "@/components/ui/RamboowLogo";

interface HeaderProps {
  user: SessionUser | null;
  onOpenSearch: () => void;
  onToggleMobileMenu: () => void;
}

export function Header({
  user,
  onOpenSearch,
  onToggleMobileMenu,
}: HeaderProps) {
  const [greeting, setGreeting] = useState("Good Morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-all">
      {/* Mobile Hamburger + Title / Mobile Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="lg:hidden">
          <Link href="/dashboard">
            <RamboowLogo size="md" showSubtitle={false} />
          </Link>
        </div>

        <div className="hidden lg:block">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
            <span>
              {greeting}, {user ? user.name.split(" ")[0] : "Team"}
            </span>
            <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            Manage your clients and follow-ups efficiently.
          </p>
        </div>
      </div>

      {/* Center/Right Actions: Global Search + Add Client */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Prominent Global Search Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3.5 py-2 text-xs sm:text-sm text-slate-500 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl transition-all shadow-2xs hover:border-slate-300 w-36 sm:w-64"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate text-left flex-1">Search clients or phone...</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            Ctrl+K
          </kbd>
        </button>

        {/* Quick Add Client Button */}
        <Link
          href="/clients/new"
          className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-ramboow-red-700 hover:bg-ramboow-red-800 rounded-xl transition-all shadow-sm shadow-ramboow-red-900/15 active:scale-95 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Client</span>
        </Link>
      </div>
    </header>
  );
}
