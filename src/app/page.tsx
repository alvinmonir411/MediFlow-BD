"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Pill, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Heart,
  XCircle,
  Camera
} from "lucide-react";
import confetti from "canvas-confetti";
import type { DoseItem, PatientProfile } from "@/lib/repository";

export default function DashboardPage() {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [adherence, setAdherence] = useState<number>(100);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDoses = async () => {
    try {
      const res = await fetch("/api/v1/doses");
      const json = await res.json();
      if (json.success && json.data) {
        setPatient(json.data.patient);
        setDoses(json.data.doses || []);
        setAdherence(json.data.adherence || 100);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoses();
  }, []);

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
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ["#0d9488", "#14b8a6", "#34d399", "#38bdf8"],
        });
        await fetchDoses();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSkipDose = async (doseId: string) => {
    setActionLoading(doseId);
    try {
      const res = await fetch("/api/v1/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doseId, action: "SKIPPED", reason: "Felt nauseous" }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchDoses();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingDoses = doses.filter((d) => d.status === "SCHEDULED");
  const takenDoses = doses.filter((d) => d.status === "TAKEN");

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Patient Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-200 border border-teal-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Cloud Sync Active
              </span>
              <span className="text-xs text-teal-300/80">Real-time</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {patient?.name || "Md. Rafiqul Islam"}
            </h1>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-teal-100/80">
              <span>Blood Group: <strong className="text-white px-2 py-0.5 rounded bg-rose-500/30 border border-rose-400/40">{patient?.bloodGroup || "B+"}</strong></span>
              <span>•</span>
              <span>Allergies: <strong className="text-amber-300">{patient?.allergies?.join(", ") || "None recorded"}</strong></span>
            </div>
          </div>

          {/* Adherence Score Ring */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-white/20"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-teal-400 transition-all duration-1000 ease-out"
                  fill="transparent"
                  strokeDasharray={163.3}
                  strokeDashoffset={163.3 - (163.3 * (doses.length > 0 ? adherence : 100)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-white">
                {doses.length > 0 ? `${adherence}%` : "100%"}
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold text-teal-200 block uppercase tracking-wider">
                Today's Adherence
              </span>
              <p className="text-sm font-bold text-white">
                {takenDoses.length} of {doses.length} Doses Taken
              </p>
              <span className="text-[11px] text-teal-300/80">
                {doses.length === 0 ? "Ready for new prescriptions" : adherence >= 80 ? "🌟 High Compliance" : "⚠️ Doses Due"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/prescriptions/new"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900 hover:border-teal-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
              Live OCR
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Scan Real Prescription
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Take photo or upload image. Gemini 3.6 Flash extracts medicines into structured JSON.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-teal-600">
            <span>Upload or Photo</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/doses"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <Pill className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {pendingDoses.length} Due
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
              Today's Medication
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Morning, noon, and night dose schedule tracked in real-time.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>View Timeline</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/emergency-id"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/60 hover:border-rose-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
              Offline ID
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
              Emergency Medical ID
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lock-screen emergency card with QR code, blood group, and emergency phone.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>View QR Card</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/audit-logs"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
              Audit Logs
            </span>
          </div>
          <div className="mt-4">
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              Security Audit Trail
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tamper-evident logs of every prescription scan, confirmation & dose.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-indigo-600">
            <span>Inspect Audit Trail</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Today's Medication Action Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Today's Medication Schedule
            </h2>
          </div>
          <Link
            href="/doses"
            className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            Manage Doses <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {doses.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Pill className="w-10 h-10 text-teal-600 mx-auto" />
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              No Medications Scheduled Today
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have not confirmed any prescriptions yet. Scan a prescription photo to auto-generate your daily schedule!
            </p>
            <Link
              href="/prescriptions/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20"
            >
              <Camera className="w-4 h-4" /> Scan First Prescription
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doses.map((dose) => {
              const isTaken = dose.status === "TAKEN";
              const isSkipped = dose.status === "SKIPPED";
              const isPending = dose.status === "SCHEDULED";

              return (
                <div
                  key={dose.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isTaken
                      ? "bg-teal-50/50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/60"
                      : isSkipped
                      ? "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-400"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {dose.scheduledTime}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                          {dose.timeSlot}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                        {dose.medicineName}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {dose.dosage} • {dose.foodTiming ? dose.foodTiming.replace("_", " ") : "After Food"}
                      </p>
                    </div>

                    {isTaken && (
                      <span className="flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Taken
                      </span>
                    )}
                    {isSkipped && (
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Skipped
                      </span>
                    )}
                    {isPending && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                        <Clock className="w-3.5 h-3.5" /> Due
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {isPending && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleTakeDose(dose.id)}
                        disabled={actionLoading === dose.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Take Now
                      </button>
                      <button
                        onClick={() => handleSkipDose(dose.id)}
                        disabled={actionLoading === dose.id}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all"
                      >
                        Skip
                      </button>
                    </div>
                  )}

                  {isTaken && dose.takenAt && (
                    <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-3 font-semibold">
                      ✓ Confirmed at {dose.takenAt}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
