"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { GlobalSearchModal } from "@/components/ui/GlobalSearchModal";
import { SessionUser } from "@/lib/auth";
import { X } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch((err) => console.error("Failed to load user:", err));
  }, []);

  return (
    <div className="min-h-screen bg-white relative flex overflow-x-hidden font-sans text-slate-800">
      {/* Desktop Sidebar (Permanent) */}
      <div className="hidden lg:block w-72 shrink-0 fixed inset-y-0 left-0 z-40 border-r border-slate-100 shadow-2xs">
        <Sidebar user={user} />
      </div>

      {/* Mobile Drawer (Responsive Hamburger) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-80 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar
              user={user}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 relative z-10 bg-white">
        <Header
          user={user}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto bg-white">
          {children}
        </main>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
