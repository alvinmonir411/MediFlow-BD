"use client";

import { useState } from "react";
import { 
  Heart, 
  PhoneCall, 
  AlertTriangle, 
  ShieldAlert, 
  QrCode, 
  Printer, 
  Check, 
  Copy, 
  User, 
  Activity,
  Share2
} from "lucide-react";

export default function EmergencyIdPage() {
  const [copied, setCopied] = useState(false);

  const patient = {
    name: "Md. Rafiqul Islam (রফিকুল ইসলাম)",
    dob: "1964-03-12 (Age: 62)",
    gender: "Male",
    bloodGroup: "B+ (Positive)",
    primaryPhone: "+880 1711-234567",
    emergencyContact: {
      name: "Tanvir Islam (Son / Caregiver)",
      phone: "+880 1819-987654",
      altPhone: "+880 1712-000111",
      relationship: "Primary Caregiver",
    },
    allergies: [
      { name: "Penicillin", severity: "HIGH (Anaphylaxis / Severe Rash)" },
      { name: "Sulfa Drugs", severity: "MODERATE" },
    ],
    conditions: [
      "Hypertension (উচ্চ রক্তচাপ)",
      "Type 2 Diabetes Mellitus (ডায়াবেটিস)",
    ],
    currentMedicines: [
      "Camlosart 5/50 (Amlodipine + Losartan) - Morning",
      "Comprid 500mg (Metformin) - Afternoon",
      "Seclo 20mg (Omeprazole) - Morning (Empty stomach)",
      "Monas 10mg (Montelukast) - Night",
    ],
  };

  const handleCopy = () => {
    const text = `EMERGENCY MEDICAL ID:
Patient: ${patient.name}
Blood: ${patient.bloodGroup}
Allergies: Penicillin, Sulfa
Emergency Contact: ${patient.emergencyContact.name} - ${patient.emergencyContact.phone}
Conditions: ${patient.conditions.join(", ")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-rose-600 animate-pulse" />
            Offline Emergency Medical Profile
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Emergency Health ID & QR Card
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Life-critical information instantly readable by first-responders, hospitals, and family even with zero internet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Card
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Info"}
          </button>
        </div>
      </div>

      {/* Printable / Lock-screen Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white border-2 border-rose-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-rose-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/40">
                <Heart className="w-7 h-7 fill-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-rose-300 uppercase tracking-widest block">
                  MediFlow BD • Emergency Health ID
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {patient.name}
                </h2>
              </div>
            </div>

            {/* Blood Group Mega Badge */}
            <div className="flex items-center gap-3 bg-rose-600/30 px-5 py-2.5 rounded-2xl border border-rose-400/40 self-start sm:self-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-200 block">
                  Blood Group
                </span>
                <span className="text-2xl font-black text-white leading-none">
                  {patient.bloodGroup}
                </span>
              </div>
            </div>
          </div>

          {/* Quick First-Responder Call Button */}
          <div className="p-4 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
                Primary Emergency Contact
              </span>
              <p className="text-sm font-bold text-white">
                {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
              </p>
            </div>

            <a
              href={`tel:${patient.emergencyContact.phone}`}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all self-start sm:self-auto"
            >
              <PhoneCall className="w-4 h-4" />
              Call Now: {patient.emergencyContact.phone}
            </a>
          </div>

          {/* Critical Warnings: Allergies & Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Critical Drug Allergies
              </div>
              <ul className="space-y-1">
                {patient.allergies.map((allergy, i) => (
                  <li key={i} className="text-xs text-rose-200 font-semibold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <strong>{allergy.name}</strong> — {allergy.severity}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-teal-300 font-bold text-xs uppercase tracking-wider">
                <Activity className="w-4 h-4" />
                Chronic Conditions
              </div>
              <ul className="space-y-1">
                {patient.conditions.map((cond, i) => (
                  <li key={i} className="text-xs text-slate-200 font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    {cond}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Current Prescribed Medicines */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wider block">
              Active Daily Medications
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200 font-medium">
              {patient.currentMedicines.map((med, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {med}
                </div>
              ))}
            </div>
          </div>

          {/* Simulated QR Code for EMTs */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white text-slate-950 flex items-center justify-center">
                <QrCode className="w-10 h-10" />
              </div>
              <div>
                <span className="text-white font-bold block">EMT & First-Responder Scan</span>
                <span className="text-[11px] text-slate-400">
                  Scan to retrieve verified clinical history & emergency contacts.
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono text-slate-400">
              ID: MEDI-BD-PAT-101 • Offline Synced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
