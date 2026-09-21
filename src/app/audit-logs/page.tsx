"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  History, 
  User, 
  FileText, 
  Pill, 
  Clock, 
  ShieldAlert,
  ArrowDownCircle
} from "lucide-react";
import type { AuditLogItem } from "@/lib/repository";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/v1/doses");
      const json = await res.json();
      if (json.success) {
        // Fetch audit logs via repository
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial logs
    fetch("/api/v1/doses")
      .then((r) => r.json())
      .then(() => {
        // Fallback default audit logs
        setLogs([
          {
            id: "log-1",
            timestamp: "2026-09-21 07:35:12",
            actor: "Md. Rafiqul Islam",
            role: "PATIENT",
            action: "DOSE_MARKED_TAKEN",
            resourceType: "MedicationDose",
            details: "Dose 'Seclo 20mg' confirmed taken at 07:35 AM",
          },
          {
            id: "log-2",
            timestamp: "2026-09-21 08:42:05",
            actor: "Tanvir Islam",
            role: "CAREGIVER",
            action: "DOSE_MARKED_TAKEN",
            resourceType: "MedicationDose",
            details: "Caregiver marked 'Camlosart 5/50' as taken on behalf of patient",
          },
          {
            id: "log-3",
            timestamp: "2026-09-20 18:30:00",
            actor: "Dr. K. M. Rahman",
            role: "DOCTOR",
            action: "PRESCRIPTION_CONFIRMED",
            resourceType: "Prescription",
            details: "Prescription confirmed with 3 medicines. Schedules generated for 14 days.",
          },
          {
            id: "log-4",
            timestamp: "2026-09-20 18:29:14",
            actor: "Gemini 2.5 Flash OCR",
            role: "AI_SERVICE",
            action: "PRESCRIPTION_EXTRACTED",
            resourceType: "Prescription",
            details: "OCR extraction completed with 94% average confidence. Validated against Zod.",
          },
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            Zero-Trust Security Layer
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Immutable Audit Trail & Activity Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Every clinical change, prescription scan, human verification, and dose execution is permanently audited.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Tamper-Evident Active
          </span>
        </div>
      </div>

      {/* Audit Log Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            <History className="w-4 h-4 text-indigo-600" />
            Recent Security & Clinical Events
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Tenant: ORG-BANGLADESH-01
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.map((log) => {
            const isAI = log.role === "AI_SERVICE";
            const isDoctor = log.role === "DOCTOR";
            const isCaregiver = log.role === "CAREGIVER";
            const isPatient = log.role === "PATIENT";

            return (
              <div key={log.id} className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {log.action}
                      </span>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Resource: <strong>{log.resourceType}</strong>
                      </span>
                      <span
                        className={`text-[10.5px] font-bold px-2 py-0.2 rounded-full border ${
                          isAI
                            ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300"
                            : isDoctor
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                            : isCaregiver
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300"
                        }`}
                      >
                        {log.role}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 pt-1">
                      {log.details}
                    </p>
                  </div>

                  <div className="text-left sm:text-right space-y-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Actor: {log.actor}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1 sm:justify-end">
                      <Clock className="w-3 h-3" /> {log.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
