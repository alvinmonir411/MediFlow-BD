"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Pill, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  Activity, 
  Heart,
  QrCode,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/prescriptions/new", label: "Scan Prescription", icon: FileText, highlight: true },
    { href: "/doses", label: "Today's Doses", icon: Pill },
    { href: "/emergency-id", label: "Emergency ID", icon: QrCode },
    { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white/20 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  MediFlow <span className="text-teal-600 dark:text-teal-400 font-extrabold">BD</span>
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                  SaaS MVP
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                Prescription & Medication Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-semibold shadow-sm"
                      : item.highlight
                      ? "text-teal-600 hover:bg-teal-50/70 dark:text-teal-400 dark:hover:bg-slate-800"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-teal-600 dark:text-teal-400" : ""}`} />
                  {item.label}
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Active Patient Pill / Status */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/emergency-id"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                  Md. Rafiqul Islam
                </span>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold leading-none">
                  Blood: B+ (Positive)
                </span>
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
