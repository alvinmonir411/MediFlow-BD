"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Pill, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Sun, 
  Sunset, 
  Moon, 
  Sparkles,
  Calendar,
  FileText,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";
import type { DoseItem } from "@/lib/repository";

export default function DosesPage() {
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [adherence, setAdherence] = useState(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeSlotFilter, setActiveSlotFilter] = useState<string>("ALL");

  const loadDoses = async () => {
    try {
      const res = await fetch("/api/v1/doses");
      const json = await res.json();
      if (json.success) {
        setDoses(json.data.doses || []);
        setAdherence(json.data.adherence || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoses();
  }, []);

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Audio policy
    }
  };

  const handleMarkTaken = async (doseId: string) => {
    playChime();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#14b8a6", "#10b981", "#38bdf8"],
    });

    try {
      const res = await fetch("/api/v1/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doseId, action: "TAKEN" }),
      });
      const json = await res.json();
      if (json.success) {
        loadDoses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSkip = async (doseId: string) => {
    try {
      const res = await fetch("/api/v1/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doseId, action: "SKIPPED", reason: "Skipped by patient" }),
      });
      const json = await res.json();
      if (json.success) {
        loadDoses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const slots = [
    { id: "ALL", label: "All Slots", count: doses.length },
    { id: "MORNING", label: "Morning (সকাল)", icon: Sun, count: doses.filter((d) => d.timeSlot === "MORNING").length },
    { id: "AFTERNOON", label: "Afternoon (দুপুর)", icon: Sun, count: doses.filter((d) => d.timeSlot === "AFTERNOON").length },
    { id: "NIGHT", label: "Night (রাত)", icon: Moon, count: doses.filter((d) => d.timeSlot === "NIGHT").length },
  ];

  const filteredDoses = activeSlotFilter === "ALL" 
    ? doses 
    : doses.filter((d) => d.timeSlot === activeSlotFilter);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Pill className="w-4 h-4" />
            Live Medication Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Today's Medication Schedule
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live doses synchronized with your medication schedule in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
              soundEnabled
                ? "bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-300"
                : "bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Sound {soundEnabled ? "On" : "Muted"}</span>
          </button>

          <Link
            href="/prescriptions/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm shadow-teal-600/20"
          >
            <FileText className="w-4 h-4" /> Scan New Prescription
          </Link>
        </div>
      </div>

      {/* Slots Filter Tabs */}
      {doses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSlotFilter(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSlotFilter === s.id
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-600/20"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-400"
              }`}
            >
              {s.icon && <s.icon className="w-3.5 h-3.5" />}
              <span>{s.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSlotFilter === s.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                {s.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty State if no doses */}
      {!loading && doses.length === 0 && (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 mx-auto">
            <Pill className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Active Doses Scheduled Today
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Scan your prescription photo with Gemini AI to extract medications and automatically schedule your daily doses.
            </p>
          </div>
          <Link
            href="/prescriptions/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all"
          >
            <FileText className="w-4 h-4" /> Scan Real Prescription Now
          </Link>
        </div>
      )}

      {/* Doses List */}
      <div className="space-y-4">
        {filteredDoses.map((dose) => {
          const isTaken = dose.status === "TAKEN";
          const isSkipped = dose.status === "SKIPPED";
          const isPending = dose.status === "SCHEDULED";

          return (
            <div
              key={dose.id}
              className={`p-6 rounded-3xl border transition-all ${
                isTaken
                  ? "bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/60"
                  : isSkipped
                  ? "bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    isTaken
                      ? "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300"
                      : isSkipped
                      ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      : "bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400"
                  }`}>
                    <Pill className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                        {dose.medicineName}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                        {dose.dosage}
                      </span>
                      <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md">
                        {dose.scheduledTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Generic: {dose.genericName || "Verified Formulation"}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {dose.foodTiming ? dose.foodTiming.replace("_", " ") : "AFTER FOOD"}
                      </span>
                      {dose.notes && (
                        <span className="text-slate-500 italic">
                          • {dose.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-3 sm:self-center">
                  {isPending && (
                    <>
                      <button
                        onClick={() => handleMarkTaken(dose.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Taken
                      </button>
                      <button
                        onClick={() => handleSkip(dose.id)}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition-all"
                      >
                        Skip
                      </button>
                    </>
                  )}

                  {isTaken && (
                    <div className="text-right">
                      <span className="flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                        <CheckCircle2 className="w-4 h-4" /> Confirmed Taken
                      </span>
                      {dose.takenAt && (
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 block mt-1">
                          Logged at {dose.takenAt}
                        </span>
                      )}
                    </div>
                  )}

                  {isSkipped && (
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
                      <XCircle className="w-4 h-4" /> Skipped
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
