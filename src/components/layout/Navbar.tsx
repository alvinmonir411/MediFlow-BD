"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Pill, 
  FileText, 
  Home,
  LayoutDashboard,
  Heart, 
  QrCode, 
  User, 
  LogOut, 
  ChevronDown,
  Menu, 
  X,
  ShieldCheck,
  Users
} from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface Patient {
  id: string;
  name: string;
  bloodGroup: string;
}

interface UserSession {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<UserSession | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/v1/auth/me");
      const json = await res.json();
      if (json.success) {
        if (json.authenticated && json.user) {
          setUser(json.user);
        } else {
          setUser(null);
        }
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
    fetchSession();

    const handlePatientChange = () => fetchSession();
    window.addEventListener("mediflow_patient_changed", handlePatientChange);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
        setPatientDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("mediflow_patient_changed", handlePatientChange);
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
    setProfileDropdownOpen(false);
    router.push("/login");
    router.refresh();
  };

  // Section 1: Navigation Links for normal users
  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/prescriptions", label: "Prescriptions", icon: FileText },
    { href: "/medications", label: "Medications", icon: Pill },
    { href: "/emergency-id", label: "Emergency ID", icon: QrCode },
  ];

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16" ref={dropdownRef}>
          {/* Logo / Website Name: PrescriptionMate BD */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white/20 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                  PrescriptionMate <span className="text-teal-600 dark:text-teal-400 font-black">BD</span>
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold tracking-tight leading-none">
                Healthcare • Trust • Simplicity
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Section 1) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/" && pathname === "") || (item.href === "/dashboard" && pathname === "/dashboard");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300 font-extrabold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-teal-600 dark:text-teal-400" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Active Patient Switcher + Auth Avatar / Login Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Family Patient Switcher */}
            {activePatient && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setPatientDropdownOpen(!patientDropdownOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight max-w-[120px] truncate">
                      {activePatient.name}
                    </span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold leading-none">
                      {activePatient.bloodGroup || "B+"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {patientDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-fadeIn">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Family Profiles
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
                        + Manage Family Profiles
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Authenticated User: Profile Avatar with Section 1 Dropdown */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setPatientDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-extrabold shadow-sm">
                    {getInitials(user.name)}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
                </button>

                {/* Profile Dropdown Menu (Section 1 Specification) */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email || user.phone || "Authenticated User"}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-400" />
                        Dashboard
                      </Link>

                      <Link
                        href="/prescriptions"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        Prescriptions
                      </Link>

                      <Link
                        href="/medications"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600"
                      >
                        <Pill className="w-4 h-4 text-slate-400" />
                        Medications
                      </Link>

                      <Link
                        href="/emergency-id"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-teal-600"
                      >
                        <QrCode className="w-4 h-4 text-slate-400" />
                        Emergency ID
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Unauthenticated: Show Login and Register buttons (Section 1) */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu hamburger button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1 animate-fadeIn">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-extrabold"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Auth / Profile Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 px-3 space-y-2">
              {user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                      {getInitials(user.name)}
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </span>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-400 py-1"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 py-1"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
