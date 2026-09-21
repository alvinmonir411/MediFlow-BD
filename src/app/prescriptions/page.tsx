"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Calendar, Building2, User, Pill, ArrowRight, ShieldCheck } from "lucide-react";

interface PrescriptionItem {
  id: string;
  doctorName?: string;
  hospitalName?: string;
  prescriptionDate?: string;
  status: string;
  createdAt: string;
  medicines: Array<{
    id: string;
    resolvedBrand?: string;
    rawName: string;
    strength?: string;
    dose: string;
    frequency: string;
    foodTiming: string;
  }>;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activePatientId = localStorage.getItem("mediflow_active_patient_id") || "default";
    fetch(`/api/v1/prescriptions?patientId=${activePatientId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setPrescriptions(json.data || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            Prescription Vault
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Prescription History (প্রেসক্রিপশন তালিকা)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View all previously scanned and verified prescriptions stored in your health record.
          </p>
        </div>

        <Link
          href="/prescriptions/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Upload Prescription
        </Link>
      </div>

      {/* Empty State */}
      {!loading && prescriptions.length === 0 && (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Prescriptions Uploaded Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload your physical prescription photo to let Gemini Vision AI organize your medication schedule.
            </p>
          </div>
          <Link
            href="/prescriptions/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Upload First Prescription
          </Link>
        </div>
      )}

      {/* Prescriptions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prescriptions.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {p.prescriptionDate ? new Date(p.prescriptionDate).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString()}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {p.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  {p.hospitalName || "Hospital / Medical Center"}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Doctor: <strong>{p.doctorName || "Registered Physician"}</strong>
                </p>
              </div>

              {/* Medicines Summary */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {p.medicines.length} Prescribed Medicines
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {p.medicines.map((m) => (
                    <span
                      key={m.id}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
                    >
                      {m.resolvedBrand || m.rawName} ({m.frequency})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-teal-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Human-Confirmed
              </span>
              <Link
                href="/doses"
                className="font-bold text-teal-600 hover:underline flex items-center gap-1"
              >
                View Active Schedules <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
