import Link from "next/link";
import { ShieldCheck, AlertCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>
              <strong>PrescriptionMate BD</strong> — Prescription & Medication Management Platform.
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800/60">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              <strong>Medical Disclaimer:</strong> This system is not an AI doctor. Medication safety decisions require doctor/pharmacist confirmation.
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/audit-logs" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Audit Trail
            </Link>
            <span>•</span>
            <span className="text-slate-400">DGDA Compliant Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
