"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Pill, 
  Clock, 
  FileText, 
  Building2, 
  UserCheck,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";
import type { FullProcessedPrescription } from "@/lib/ai/gemini-ocr";
import type { ResolvedMedicineResult } from "@/lib/safety/medicine-resolver";

export default function NewPrescriptionPage() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState<string>("fever_gastric");
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<FullProcessedPrescription | null>(null);
  const [medicines, setMedicines] = useState<ResolvedMedicineResult[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExtractPreset = async (presetKey: string) => {
    setSelectedPreset(presetKey);
    setLoading(true);
    setStatusMessage("Extracting structured clinical data via Gemini 2.5 Flash Vision...");

    try {
      const res = await fetch("/api/v1/ai/extract-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetKey }),
      });
      const json = await res.json();
      if (json.success) {
        setExtractedData(json.data);
        setMedicines(json.data.medicines);
        setStatusMessage(null);
      }
    } catch (e) {
      console.error(e);
      setStatusMessage("Extraction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage("Reading prescription image and sending to Gemini Vision...");

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/v1/ai/extract-prescription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        });
        const json = await res.json();
        if (json.success) {
          setExtractedData(json.data);
          setMedicines(json.data.medicines);
          setStatusMessage(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateMedicine = (index: number, field: string, value: any) => {
    const updated = [...medicines];
    (updated[index] as any)[field] = value;
    setMedicines(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleConfirmPrescription = async () => {
    if (medicines.length === 0) return;
    setConfirming(true);

    try {
      const res = await fetch("/api/v1/prescriptions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: extractedData?.doctorName || "Dr. K. M. Rahman",
          hospitalName: extractedData?.hospitalName || "Prescription Clinic",
          medicines,
        }),
      });
      const json = await res.json();
      if (json.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#0f766e", "#14b8a6", "#38bdf8"],
        });
        setTimeout(() => {
          router.push("/doses");
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Gemini 2.5 Flash Vision OCR
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Prescription Scanner & Human Verification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            "AI extracts, Doctor/Patient confirms." Structured clinical data validated with Zod & Bangladesh Medicine Database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Human-in-the-Loop Active
          </span>
        </div>
      </div>

      {/* Step 1: Upload or Choose Sample Preset */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live File Upload Box */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-teal-300 dark:border-teal-800 hover:border-teal-500 transition-colors flex flex-col items-center justify-center text-center group">
          <input
            type="file"
            id="prescription-file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="prescription-file" className="cursor-pointer flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white mt-3 block">
              Upload Prescription Photo
            </span>
            <span className="text-xs text-slate-500 mt-1 block">
              JPG, PNG, WebP up to 10MB
            </span>
            <span className="mt-3 text-xs font-semibold text-teal-600 bg-teal-50 dark:bg-teal-950 px-3 py-1 rounded-full">
              Browse Files or Camera
            </span>
          </label>
        </div>

        {/* Demo Bangladeshi Prescriptions */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Quick Test: Bangladeshi Clinical Prescriptions
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Select any realistic Bangladeshi prescription scenario to test instant extraction & safety checks:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <button
                type="button"
                onClick={() => handleExtractPreset("fever_gastric")}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  selectedPreset === "fever_gastric"
                    ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-200 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400"
                }`}
              >
                <span className="font-bold text-xs block text-teal-700 dark:text-teal-300">
                  Scenario 1: Fever & Gastric
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  Napa 500mg, Seclo 20mg, Bicozin (Square/Beximco)
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleExtractPreset("infection_antibiotic")}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  selectedPreset === "infection_antibiotic"
                    ? "bg-teal-50 dark:bg-teal-950/60 border-teal-500 text-teal-900 dark:text-teal-200 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400"
                }`}
              >
                <span className="font-bold text-xs block text-teal-700 dark:text-teal-300">
                  Scenario 2: Antibiotic Guard
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  Ciprocin 500mg (7-day fixed course), Sergel 20mg
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleExtractPreset("duplicate_warning")}
                className={`p-3.5 rounded-xl text-left border transition-all ${
                  selectedPreset === "duplicate_warning"
                    ? "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-900 dark:text-rose-200 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400"
                }`}
              >
                <span className="font-bold text-xs block text-rose-700 dark:text-rose-400">
                  Scenario 3: Safety Risk Flag
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                  Napa + Ace Plus (Duplicate Paracetamol Warning)
                </span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Ready to process via Gemini 2.5 Flash Vision
            </span>
            <button
              onClick={() => handleExtractPreset(selectedPreset)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Extracting..." : "Process Selected Prescription"}
            </button>
          </div>
        </div>
      </div>

      {/* Live Loading Feedback */}
      {loading && (
        <div className="p-6 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-teal-900 dark:text-teal-200">
              Analyzing Prescription Document
            </h4>
            <p className="text-xs text-teal-700 dark:text-teal-400">
              {statusMessage || "Gemini 2.5 Flash Vision is reading handwriting & matching Bangladesh drug databases..."}
            </p>
          </div>
        </div>
      )}

      {/* Extracted Prescription & Human Verification Studio */}
      {extractedData && !loading && (
        <div className="space-y-6">
          {/* Doctor & Hospital Clinical Header */}
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block">
                Prescription Source
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600" />
                {extractedData.hospitalName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Prescribed by: <strong>{extractedData.doctorName}</strong> • Date: {extractedData.prescriptionDate}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Zod Schema Validated
              </span>
            </div>
          </div>

          {/* Safety Alert Interceptor Banner (Deterministic Rule Engine) */}
          {extractedData.safetyAlerts && extractedData.safetyAlerts.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                Medical Safety Rule Interception
              </div>
              {extractedData.safetyAlerts.map((alert, idx) => (
                <p key={idx} className="text-xs text-rose-900 dark:text-rose-200 font-medium">
                  {alert}
                </p>
              ))}
            </div>
          )}

          {/* Extracted Medicines List (Human Verification) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Extracted Medicines ({medicines.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Verify dosage, frequency and timing before activating schedule.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> High (≥90%)
                </span>
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Review (75-89%)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {medicines.map((med, index) => {
                const isHigh = med.confidenceScore >= 0.90;
                const isMed = med.confidenceScore >= 0.75 && med.confidenceScore < 0.90;

                return (
                  <div
                    key={index}
                    className={`p-5 rounded-2xl border transition-all ${
                      med.isAntibiotic
                        ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left info & confidence */}
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-base text-slate-900 dark:text-white">
                            {med.resolvedBrand}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            {med.strength || "Standard"}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({med.resolvedGeneric})
                          </span>

                          {/* Confidence Score Pill */}
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              isHigh
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                : isMed
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                            }`}
                          >
                            Confidence: {Math.round(med.confidenceScore * 100)}%
                          </span>

                          {med.isAntibiotic && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                              Antibiotic Guard
                            </span>
                          )}
                        </div>

                        {med.matchedCatalogItem && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Verified Manufacturer: <strong>{med.matchedCatalogItem.manufacturer}</strong> • Unit Price: ৳{med.matchedCatalogItem.unitPrice.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Editable Inputs for Dosage, Frequency & Timing */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <label className="text-[10.5px] font-bold text-slate-500 block uppercase">
                            Dose
                          </label>
                          <input
                            type="text"
                            value={med.dose}
                            onChange={(e) => handleUpdateMedicine(index, "dose", e.target.value)}
                            className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-500 block uppercase">
                            Frequency
                          </label>
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedicine(index, "frequency", e.target.value)}
                            className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-500 block uppercase">
                            Food Timing
                          </label>
                          <select
                            value={med.foodTiming}
                            onChange={(e) => handleUpdateMedicine(index, "foodTiming", e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                          >
                            <option value="BEFORE_FOOD">Before Food (খাবারের পূর্বে)</option>
                            <option value="AFTER_FOOD">After Food (খাবারের পরে)</option>
                            <option value="EMPTY_STOMACH">Empty Stomach (খালি পেটে)</option>
                            <option value="WITH_FOOD">With Food (খাবারের সাথে)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10.5px] font-bold text-slate-500 block uppercase">
                            Duration
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={med.durationDays}
                              onChange={(e) => handleUpdateMedicine(index, "durationDays", parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                            />
                            <span className="text-xs text-slate-500">Days</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(index)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors self-end mb-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Disclaimer & Confirmation Action */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 max-w-xl">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                Human Confirmation Checkpoint
              </span>
              <h4 className="font-extrabold text-lg text-white">
                Confirm & Activate Medication Reminders
              </h4>
              <p className="text-xs text-teal-200/80">
                By clicking Confirm, you verify that you have reviewed the extracted medicines against the physical prescription. Alarms will be immediately scheduled.
              </p>
            </div>

            <button
              onClick={handleConfirmPrescription}
              disabled={confirming || medicines.length === 0}
              className="px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 whitespace-nowrap"
            >
              <CheckCircle2 className="w-5 h-5" />
              {confirming ? "Activating Schedules..." : "Confirm Prescription"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
