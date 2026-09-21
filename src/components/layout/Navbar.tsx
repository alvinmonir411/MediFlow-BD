"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Pill, 
  FileText, 
  Activity, 
  Heart, 
  QrCode, 
  ShieldCheck, 
  Users, 
  Menu, 
  X,
  User,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useEffect, useState } from "react";

interface Patient {
  id: string;
  name: string;
  bloodGroup: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [user, setUser] = useState<any>(null);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);

  const fetchSessionAndPatients = async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      const json = await res.json();
      if (json.success) {
        setUser(json.user);
        setPatients(json.patients || []);

        const storedId = localStorage.getItem("mediflow_active_patient_id");
        if (storedId && json.patients?.length > 0) {
          const found = json.patients.find((p: Patient) => p.id === storedId);
          setActivePatient(found || json.patients[0]);
        } else if (json.patients?.length > 0) {
          setActivePatient(json.patients[0]);
          localStorage.setItem("mediflow_active_patient_id", json.patients[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessionAndPatients();

    const handlePatientChange = () => {
      fetchSessionAndPatients();
    };

    window.addEventListener("mediflow_patient_changed", handlePatientChange);
    return () => window.removeEventListener("mediflow_patient_changed", handlePatientChange);
  }, []);

  const handleSelectPatient = (patient: Patient) => {
    setActivePatient(patient);
    localStorage.setItem("mediflow_active_patient_id", patient.id);
    setPatientDropdownOpen(false);
    window.dispatchEvent(new Event("mediflow_patient_changed"));
    router.refresh();
  };

  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/prescriptions/new", label: "Scan Prescription", icon: FileText, highlight: true },
    { href: "/doses", label: "Today's Doses", icon: Pill },
    { href: "/family", label: "Family", icon: Users },
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
                  PrescriptionMate <span className="text-teal-600 dark:text-teal-400 font-extrabold">BD</span>
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 border border-teal-200 dark:border-teal-700">
                  Neon DB
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

          {/* Active Patient Switcher & Auth Pill */}
          <div className="hidden sm:flex items-center gap-3">
            {activePatient && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPatientDropdownOpen(!patientDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight max-w-[140px] truncate">
                      {activePatient.name}
                    </span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold leading-none">
                      Blood: {activePatient.bloodGroup || "B+"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {/* Switcher Dropdown */}
                {patientDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Family Profile
                    </div>
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          p.id === activePatient.id ? "text-teal-600 font-bold bg-teal-50/50 dark:bg-teal-950/40" : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.bloodGroup}</span>
                      </button>
                    ))}
                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <Link
                        href="/family"
                        onClick={() => setPatientDropdownOpen(false)}
                        className="block px-3 py-1.5 text-xs text-teal-600 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        + Add Family Member
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
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

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between px-3">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 py-1.5"
                >
                  <LogOut className="w-4 h-4" /> Sign Out ({user.name})
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-teal-600 py-1.5"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
