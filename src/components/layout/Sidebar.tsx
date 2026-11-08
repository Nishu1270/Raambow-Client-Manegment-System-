"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarClock,
  PhoneCall,
  UserCog,
  BarChart3,
  Settings,
  LogOut,
  CalendarDays,
  ShieldCheck,
  FileSpreadsheet,
  Trophy,
} from "lucide-react";
import { RamboowLogo } from "@/components/ui/RamboowLogo";
import { SessionUser } from "@/lib/auth";

interface SidebarProps {
  user: SessionUser | null;
  onCloseMobile?: () => void;
}

export function Sidebar({ user, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Clients", href: "/clients", icon: Users },
    { label: "Add Client", href: "/clients/new", icon: UserPlus },
    { label: "Follow-ups", href: "/follow-ups", icon: CalendarClock },
    { label: "Future Clients", href: "/future", icon: CalendarDays },
    ...(user?.role === "ADMIN"
      ? [{ label: "Converted Clients", href: "/converted", icon: Trophy }]
      : []),
    { label: "Call History", href: "/call-history", icon: PhoneCall },
    ...(user?.role === "ADMIN"
      ? [{ label: "Team", href: "/team", icon: UserCog }]
      : []),
    { label: "Data Management", href: "/data-management", icon: FileSpreadsheet },
    { label: "Reports", href: "/reports", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-72 h-full bg-white border-r border-slate-100 flex flex-col justify-between select-none">
      {/* Top Branding Section — rendered on desktop; on mobile the top header bar already displays the single top logo */}
      <div>
        {!onCloseMobile ? (
          <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-start bg-white overflow-hidden">
            <Link href="/dashboard" className="block w-full">
              <RamboowLogo size="md" showSubtitle={false} className="max-w-full" />
            </Link>
          </div>
        ) : (
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Navigation Menu</span>
          </div>
        )}

        {/* User Role Card */}
        {user && (
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-ramboow-navy-900 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 text-[10px] font-bold tracking-wider rounded uppercase ${
                      user.role === "ADMIN"
                        ? "bg-ramboow-red-50 text-ramboow-red-700 border border-ramboow-red-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                    }`}
                  >
                    {user.role === "ADMIN" ? (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        Admin
                      </>
                    ) : (
                      "Team Member"
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-290px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? "text-ramboow-red-400"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Logout */}
      <div className="p-4 border-t border-slate-100 bg-white space-y-3">
        {/* Subtle MSME Badge */}
        <div className="px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 text-[10px] text-slate-500 font-medium flex items-center justify-center gap-1.5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Govt. Reg. MSME Enterprise IN</span>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-ramboow-red-700 hover:bg-ramboow-red-50 rounded-xl transition-all border border-transparent hover:border-ramboow-red-200"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-ramboow-red-600" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
