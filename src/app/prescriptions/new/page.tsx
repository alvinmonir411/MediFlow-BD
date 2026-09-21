"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Pill, 
  Building2, 
  UserCheck,
  Trash2,
  RefreshCw,
  Camera,
  Image as ImageIcon,
  X,
  ArrowRight
} from "lucide-react";
import confetti from "canvas-confetti";
import type { FullProcessedPrescription } from "@/lib/ai/gemini-ocr";
import type { ResolvedMedicineResult } from "@/lib/safety/medicine-resolver";

export default function NewPrescriptionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<FullProcessedPrescription | null>(null);
  const [medicines, setMedicines] = useState<ResolvedMedicineResult[]>([]);
  const [confirming, setConfirming] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setExtractedData(null);
    setMedicines([]);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRunGeminiOCR = async () => {
    if (!imagePreview) {
      setErrorMessage("Please select or capture a prescription image first.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/ai/extract-prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Failed to extract prescription.");
      }

      setExtractedData(json.data);
      setMedicines(json.data.medicines);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected error occurred while analyzing the prescription with Gemini.");
    } finally {
      setLoading(false);
    }
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
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/prescriptions/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: extractedData?.doctorName || "Doctor",
          hospitalName: extractedData?.hospitalName || "Prescription Medical Center",
          prescriptionDate: extractedData?.prescriptionDate,
          medicines,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to save prescription to database.");
      }

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#0f766e", "#14b8a6", "#38bdf8"],
      });

      setTimeout(() => {
        router.push("/doses");
      }, 1200);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Failed to save confirmed prescription.");
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
            Gemini 3.6 Flash Vision OCR
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Real Prescription Scanner & Verification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload or capture your real prescription photo. Structured JSON is extracted via Gemini Vision and verified against the Bangladesh Medicine Database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Human Confirmation Required
          </span>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload & Preview Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Box */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Step 1: Upload or Capture Prescription
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Ensure doctor's handwriting or printed medicine names are visible and well-lit.
            </p>
          </div>

          {!imagePreview ? (
            <div className="border-2 border-dashed border-teal-300 dark:border-teal-800 hover:border-teal-500 transition-colors rounded-2xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer">
              <input
                ref={fileInputRef}
                type="file"
                id="prescription-upload-input"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="prescription-upload-input" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                  <Camera className="w-8 h-8" />
                </div>
                <span className="font-bold text-sm text-slate-900 dark:text-white mt-4 block">
                  Click to Take Photo or Browse
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Supports JPG, PNG, WebP up to 15MB
                </span>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center max-h-72">
                <img
                  src={imagePreview}
                  alt="Prescription Preview"
                  className="max-h-72 w-full object-contain"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Image ready for Gemini Vision
                </span>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                >
                  Change Image
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleRunGeminiOCR}
            disabled={!imagePreview || loading}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              imagePreview && !loading
                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20 active:scale-[0.98]"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Gemini 3.6 Flash Analyzing Document..." : "Extract Medicines with Gemini AI"}
          </button>
        </div>

        {/* Step Instructions / Medical Safety Panel */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              Safety & Verification Architecture
            </div>
            <h3 className="text-lg font-bold text-white">
              Strictly Clinical — Never An "AI Doctor"
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              MediFlow BD uses Google Gemini Vision to read doctor's handwriting and convert it into structured medication schedules.
            </p>
            
            <div className="space-y-2 pt-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                <span><strong>AI Extracts:</strong> Identifies medicine brand, dose, frequency (e.g. 1+0+1), and food timing.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                <span><strong>Rule Engine Validates:</strong> Matches against Bangladesh DGDA database and checks for duplicate paracetamol or antibiotic course completion.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5" />
                <span><strong>Human Confirms:</strong> You review the list side-by-side with your physical prescription before committing to database.</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>AI Model: Gemini 3.6 Flash</span>
            <span>Storage: Secure Encrypted Cloud</span>
          </div>
        </div>
      </div>

      {/* Step 2: Extracted Results & Verification Studio */}
      {extractedData && !loading && (
        <div className="space-y-6 animate-fadeIn">
          {/* Clinical Header */}
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
                Gemini OCR Validated
              </span>
            </div>
          </div>

          {/* Safety Alert Interceptor */}
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

          {/* Extracted Medicines Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Extracted Medicines ({medicines.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Please review dosage, frequency, and timing before activating schedule.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> High (≥90%)
                </span>
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Review (&lt;90%)
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {medicines.map((med, index) => {
                const isHigh = med.confidenceScore >= 0.90;

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
                      {/* Left Info */}
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

                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                              isHigh
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800"
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

                      {/* Editable Form Controls */}
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

          {/* Confirm & Activate Action */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 max-w-xl">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                Save Medication Schedule
              </span>
              <h4 className="font-extrabold text-lg text-white">
                Confirm & Activate Real Medication Schedule
              </h4>
              <p className="text-xs text-teal-200/80">
                Clicking confirm activates this prescription and today's dose slots directly to your schedule and records an immutable audit log entry.
              </p>
            </div>

            <button
              onClick={handleConfirmPrescription}
              disabled={confirming || medicines.length === 0}
              className="px-6 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 whitespace-nowrap"
            >
              <CheckCircle2 className="w-5 h-5" />
              {confirming ? "Saving Schedule..." : "Confirm & Activate Schedule"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
