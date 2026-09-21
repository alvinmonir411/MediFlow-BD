"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  Upload,
  Camera,
  Heart,
  Phone,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Calendar,
  ChevronRight,
  RotateCw,
  TrendingUp,
  User
} from "lucide-react";
import confetti from "canvas-confetti";

interface PatientInfo {
  id: string;
  name: string;
  bloodGroup?: string | null;
  phone?: string | null;
  allergies?: string | null;
  emergencyContact?: string | null;
}

interface DoseItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  timeSlot: string;
  scheduledTime: string;
  scheduledAt: string;
  status: "SCHEDULED" | "REMINDER_SENT" | "TAKEN" | "MISSED" | "SKIPPED" | "CANCELLED" | "LATE";
  foodTiming: string;
  takenAt?: string;
  notes?: string | null;
}

interface PrescriptionItem {
  id: string;
  doctorName: string;
  hospitalName: string;
  prescriptionDate: string;
  status: string;
  medicineCount: number;
  medicinesSummary: string;
  createdAt: string;
}

interface EmergencyShortcut {
  patientName: string;
  bloodGroup: string;
  allergies: string[];
  emergencyContact: string | null;
  chronicConditions: string[];
}

interface DashboardData {
  patient: PatientInfo | null;
  metrics: {
    todayMedicines: number;
    taken: number;
    pending: number;
    missed: number;
  };
  adherence: number;
  upcomingDose: DoseItem | null;
  todaySchedule: DoseItem[];
  recentPrescriptions: PrescriptionItem[];
  emergencyShortcut: EmergencyShortcut | null;
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterSlot, setFilterSlot] = useState<string>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const activePatientId = typeof window !== "undefined"
        ? localStorage.getItem("mediflow_active_patient_id")
        : null;

      const url = activePatientId
        ? `/api/v1/dashboard?patientId=${encodeURIComponent(activePatientId)}`
        : `/api/v1/dashboard`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();

    const handlePatientChange = () => {
      fetchDashboard();
    };

    window.addEventListener("mediflow_patient_changed", handlePatientChange);
    return () => {
      window.removeEventListener("mediflow_patient_changed", handlePatientChange);
    };
  }, [fetchDashboard]);

  // Handle Mark Dose as Taken
  const handleTakeDose = async (doseId: string) => {
    setActionLoading(doseId);
    try {
      const res = await fetch("/api/v1/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doseId, action: "TAKEN" }),
      });
      const json = await res.json();
      if (json.success) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#0d9488", "#14b8a6", "#10b981", "#38bdf8"],
        });
        await fetchDashboard();
      }
    } catch (e) {
      console.error("Take dose error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Skip Dose
  const handleSkipDose = async (doseId: string) => {
    setActionLoading(doseId);
    try {
      const res = await fetch("/api/v1/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doseId, action: "SKIPPED", reason: "Patient skipped this dose" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchDashboard();
      }
    } catch (e) {
      console.error("Skip dose error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center">
            <Pill className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading your medication dashboard...</p>
        </div>
      </div>
    );
  }

  const patient = data?.patient;
  const metrics = data?.metrics || { todayMedicines: 0, taken: 0, pending: 0, missed: 0 };
  const upcoming = data?.upcomingDose;
  const schedule = data?.todaySchedule || [];
  const recentPrescriptions = data?.recentPrescriptions || [];
  const adherence = data?.adherence ?? 100;
  const emergency = data?.emergencyShortcut;

  // Filter schedule by slot
  const filteredSchedule = filterSlot === "ALL"
    ? schedule
    : schedule.filter((item) => item.timeSlot.toUpperCase() === filterSlot);

  // Today formatted
  const todayFormatted = new Intl.DateTimeFormat("en-BD", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* ── Patient Welcome & Quick Status Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Cloud Sync Active
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {todayFormatted}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Hello, {patient?.name || "Patient"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Here is your daily medication overview and adherence progress.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-60"
            title="Refresh dashboard"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-teal-600" : "text-slate-400"}`} />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <Link
            href="/prescriptions/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Upload Prescription</span>
          </Link>
        </div>
      </div>

      {/* ── 1. DASHBOARD CARDS (Exact 4 Metrics per Spec) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Today's Medication Overview
          </h2>
          <span className="text-[11px] text-slate-400">Real-time daily tracking</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today's Medicines */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Today's Medicines
              </span>
              <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Pill className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {metrics.todayMedicines}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total doses scheduled today
            </p>
          </div>

          {/* Card 2: Taken */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/50 shadow-sm hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Taken
              </span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {metrics.taken}
              </span>
            </div>
            <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70 mt-1 font-medium">
              Confirmed doses completed
            </p>
          </div>

          {/* Card 3: Pending */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-950/50 shadow-sm hover:border-amber-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Pending
              </span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                {metrics.pending}
              </span>
            </div>
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mt-1 font-medium">
              Remaining doses for today
            </p>
          </div>

          {/* Card 4: Missed */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-950/50 shadow-sm hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                Missed
              </span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {metrics.missed}
              </span>
            </div>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/70 mt-1 font-medium">
              Overdue or skipped doses
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. UPCOMING DOSE SPOTLIGHT ── */}
      {upcoming ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-teal-400/20 text-teal-200 border border-teal-300/30 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-teal-300" />
                  Upcoming Dose
                </span>
                <span className="text-xs text-teal-200/80 font-semibold">
                  Scheduled at {upcoming.scheduledTime} ({upcoming.timeSlot})
                </span>
              </div>

              <h3 className="text-2xl font-black tracking-tight text-white">
                {upcoming.medicineName}
              </h3>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-teal-100/90 font-medium">
                <span>Dose: <strong>{upcoming.dosage}</strong></span>
                <span>•</span>
                <span>Frequency: <strong>{upcoming.frequency}</strong></span>
                <span>•</span>
                <span>Instruction: <strong>{upcoming.foodTiming ? upcoming.foodTiming.replace(/_/g, " ") : "After Food"}</strong></span>
              </div>
            </div>

            {/* Quick Action Buttons for Upcoming Dose */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTakeDose(upcoming.id)}
                disabled={actionLoading === upcoming.id}
                className="px-6 py-3 rounded-2xl bg-teal-400 hover:bg-teal-300 active:scale-95 text-slate-950 font-black text-xs transition-all shadow-lg shadow-teal-400/20 flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionLoading === upcoming.id ? "Confirming..." : "Take Dose Now"}</span>
              </button>
              <button
                onClick={() => handleSkipDose(upcoming.id)}
                disabled={actionLoading === upcoming.id}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs transition-all border border-white/15"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      ) : schedule.length > 0 && metrics.pending === 0 ? (
        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-emerald-900 dark:text-white">
                All caught up for today! 🎉
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300/80">
                You have completed all {metrics.todayMedicines} scheduled medication doses for today. Keep up the good work!
              </p>
            </div>
          </div>
          <Link
            href="/doses"
            className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            View dose timeline <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ) : schedule.length === 0 ? (
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 flex-shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                No medication doses scheduled today
              </h4>
              <p className="text-xs text-slate-500">
                Upload or take a photo of your doctor's prescription to automatically generate your daily medication routine.
              </p>
            </div>
          </div>
          <Link
            href="/prescriptions/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 whitespace-nowrap self-start sm:self-auto"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan First Prescription</span>
          </Link>
        </div>
      ) : null}

      {/* ── 3. TWO-COLUMN LAYOUT: MAIN FEED + SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── LEFT / MAIN COLUMN (2 cols) ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* SECTION: Today's Medication Schedule */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-600" />
                  Today's Medication Schedule
                </h3>
                <p className="text-xs text-slate-400">
                  Daily doses with food instructions and direct confirmation
                </p>
              </div>

              {/* Slot Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs self-start sm:self-auto">
                {["ALL", "MORNING", "AFTERNOON", "EVENING", "NIGHT"].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setFilterSlot(slot)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                      filterSlot === slot
                        ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {slot === "ALL" ? "All" : slot.charAt(0) + slot.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Dose Cards List */}
            {filteredSchedule.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Pill className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs font-semibold text-slate-500">
                  {filterSlot === "ALL"
                    ? "No medications scheduled for today."
                    : `No medications scheduled for the ${filterSlot.toLowerCase()} slot.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSchedule.map((dose) => {
                  const isTaken = dose.status === "TAKEN";
                  const isSkipped = dose.status === "SKIPPED";
                  const isMissed = dose.status === "MISSED";
                  const isPending = dose.status === "SCHEDULED" || dose.status === "REMINDER_SENT";

                  return (
                    <div
                      key={dose.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isTaken
                          ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50"
                          : isMissed
                          ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                          : isSkipped
                          ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60"
                          : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-teal-400 shadow-sm"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {dose.scheduledTime}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {dose.timeSlot}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {dose.foodTiming ? dose.foodTiming.replace(/_/g, " ") : "After Food"}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {dose.medicineName}
                        </h4>

                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>Dose: <strong>{dose.dosage}</strong></span>
                          <span>•</span>
                          <span>Frequency: {dose.frequency}</span>
                          {isTaken && dose.takenAt && (
                            <>
                              <span>•</span>
                              <span className="text-teal-600 dark:text-teal-400 font-bold">
                                Taken at {dose.takenAt}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isTaken && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Taken
                          </span>
                        )}

                        {isMissed && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Missed
                          </span>
                        )}

                        {isSkipped && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-xl">
                            <XCircle className="w-3.5 h-3.5" />
                            Skipped
                          </span>
                        )}

                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTakeDose(dose.id)}
                              disabled={actionLoading === dose.id}
                              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Take</span>
                            </button>
                            <button
                              onClick={() => handleSkipDose(dose.id)}
                              disabled={actionLoading === dose.id}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                            >
                              Skip
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {schedule.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
                <Link
                  href="/doses"
                  className="text-xs font-bold text-teal-600 hover:underline inline-flex items-center gap-1"
                >
                  Manage Full Dose Schedule <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* SECTION: Recent Prescriptions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Recent Prescriptions
                </h3>
                <p className="text-xs text-slate-400">
                  Previously scanned and confirmed medical prescriptions
                </p>
              </div>
              <Link
                href="/prescriptions"
                className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
              >
                View all ({recentPrescriptions.length}) <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {recentPrescriptions.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No prescriptions uploaded yet
                </h4>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Upload an image of your physical prescription to extract medicines using Gemini AI.
                </p>
                <Link
                  href="/prescriptions/new"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Upload First Prescription
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentPrescriptions.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-400 transition-all bg-slate-50/50 dark:bg-slate-800/40 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                          {p.prescriptionDate}
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {p.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1">
                        {p.doctorName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {p.hospitalName}
                      </p>
                      {p.medicinesSummary && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-1 truncate">
                          💊 {p.medicinesSummary}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px]">
                        {p.medicineCount} {p.medicineCount === 1 ? "Medicine" : "Medicines"}
                      </span>
                      <Link
                        href="/prescriptions"
                        className="font-bold text-teal-600 hover:underline flex items-center gap-0.5 text-[11px]"
                      >
                        View Details <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT / SIDEBAR COLUMN (1 col) ── */}
        <div className="space-y-6">
          {/* SECTION: Adherence Percentage Widget */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Medication Adherence
              </h3>
              <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400">
                Today
              </span>
            </div>

            {/* Circular Ring Gauge */}
            <div className="flex flex-col items-center justify-center py-3">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-slate-100 dark:text-slate-800"
                    fill="transparent"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="8"
                    className={`${
                      adherence >= 80
                        ? "text-teal-500"
                        : adherence >= 50
                        ? "text-amber-500"
                        : "text-rose-500"
                    } transition-all duration-1000 ease-out`}
                    fill="transparent"
                    strokeDasharray={289.02}
                    strokeDashoffset={289.02 - (289.02 * (metrics.todayMedicines > 0 ? adherence : 100)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white block">
                    {metrics.todayMedicines > 0 ? `${adherence}%` : "100%"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Score
                  </span>
                </div>
              </div>

              <div className="text-center mt-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    metrics.todayMedicines === 0
                      ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      : adherence >= 80
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : adherence >= 50
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  {metrics.todayMedicines === 0
                    ? "Schedule Empty"
                    : adherence >= 80
                    ? "🌟 High Compliance"
                    : adherence >= 50
                    ? "⚠️ Moderate Compliance"
                    : "🚨 Action Needed"}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  {metrics.taken} of {metrics.todayMedicines} doses completed
                </p>
              </div>
            </div>

            {/* Breakdown Bars */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Taken
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {metrics.taken} ({metrics.todayMedicines > 0 ? Math.round((metrics.taken / metrics.todayMedicines) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Pending
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {metrics.pending} ({metrics.todayMedicines > 0 ? Math.round((metrics.pending / metrics.todayMedicines) * 100) : 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Missed
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {metrics.missed} ({metrics.todayMedicines > 0 ? Math.round((metrics.missed / metrics.todayMedicines) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* SECTION: Emergency Medical ID Shortcut */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-900 via-rose-800 to-slate-900 text-white shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-300" />
                </div>
                <h3 className="font-extrabold text-sm text-white">
                  Emergency Medical ID
                </h3>
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40">
                Offline Ready
              </span>
            </div>

            <p className="text-xs text-rose-100/80">
              One-click access to critical patient health information for first responders.
            </p>

            {/* Quick Emergency Stats */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-rose-200 text-[11px]">Blood Group:</span>
                <span className="font-black text-white px-2 py-0.5 rounded bg-rose-500/40 text-xs">
                  {emergency?.bloodGroup || patient?.bloodGroup || "Not set"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-rose-200 text-[11px] flex-shrink-0">Allergies:</span>
                <span className="font-semibold text-amber-200 text-[11px] text-right truncate">
                  {emergency?.allergies?.length ? emergency.allergies.join(", ") : "None recorded"}
                </span>
              </div>

              {emergency?.emergencyContact && (
                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-rose-200 text-[11px]">Emergency Call:</span>
                  <a
                    href={`tel:${emergency.emergencyContact}`}
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-white bg-rose-600 hover:bg-rose-500 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Contact</span>
                  </a>
                </div>
              )}
            </div>

            <Link
              href="/emergency-id"
              className="w-full py-2.5 px-4 rounded-xl bg-white text-rose-950 font-extrabold text-xs flex items-center justify-center gap-2 hover:bg-rose-50 active:scale-95 transition-all shadow-md"
            >
              <span>Open Emergency QR Card</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Actions Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Shortcuts
            </h4>

            <div className="space-y-1.5">
              <Link
                href="/prescriptions/new"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-700 dark:text-slate-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <span>Scan Prescription</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/doses"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-700 dark:text-slate-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                    <Pill className="w-3.5 h-3.5" />
                  </div>
                  <span>Dose History & Times</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/profile"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-700 dark:text-slate-200 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span>Patient Medical Profile</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
