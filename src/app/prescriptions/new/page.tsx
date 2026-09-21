"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  ArrowRight,
  FileCheck2,
  Loader2,
  FileText,
  Clock,
  ChevronRight,
  HelpCircle,
  Eye
} from "lucide-react";
import confetti from "canvas-confetti";
import type { FullProcessedPrescription } from "@/lib/ai/gemini-ocr";
import type { ResolvedMedicineResult } from "@/lib/safety/medicine-resolver";

type UploadStage = "IDLE" | "UPLOADING" | "PROCESSING" | "AI_READING" | "REVIEW";

export default function UploadPrescriptionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [isDragging, setIsDragging] = useState(false);

  // Multi-stage upload progression
  const [stage, setStage] = useState<UploadStage>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<FullProcessedPrescription | null>(null);
  const [medicines, setMedicines] = useState<ResolvedMedicineResult[]>([]);
  const [confirming, setConfirming] = useState(false);

  // Process File
  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrorMessage("Please select a valid image file (JPG, PNG, WebP) or PDF.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("File size exceeds 20MB. Please choose a smaller image.");
      return;
    }

    setMimeType(file.type || "image/jpeg");
    setFileName(file.name);
    setFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setFileName(null);
    setFileSize(null);
    setExtractedData(null);
    setMedicines([]);
    setErrorMessage(null);
    setStage("IDLE");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  // Run 4-stage AI Scanner
  const handleRunGeminiOCR = async () => {
    if (!imagePreview) {
      setErrorMessage("Please select or capture a prescription image first.");
      return;
    }

    setErrorMessage(null);

    try {
      // Stage 1: Uploading...
      setStage("UPLOADING");
      await new Promise((r) => setTimeout(r, 600));

      // Stage 2: Processing...
      setStage("PROCESSING");
      await new Promise((r) => setTimeout(r, 700));

      // Stage 3: AI Reading Prescription...
      setStage("AI_READING");

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

      // Stage 4: Review Results
      setStage("REVIEW");
      setExtractedData(json.data);
      setMedicines(json.data.medicines);

      // Smooth scroll down to review section
      setTimeout(() => {
        const reviewSection = document.getElementById("prescription-review-section");
        if (reviewSection) {
          reviewSection.scrollIntoView({ behavior: "smooth" });
        }
      }, 200);
    } catch (err: any) {
      console.error(err);
      setStage("IDLE");
      setErrorMessage(err.message || "An unexpected error occurred while analyzing the prescription with Gemini AI.");
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
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#0d9488", "#14b8a6", "#10b981", "#38bdf8"],
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

  const isScanning = stage === "UPLOADING" || stage === "PROCESSING" || stage === "AI_READING";

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-16">
      {/* Hidden File Inputs */}
      {/* Gallery / File Input */}
      <input
        ref={fileInputRef}
        type="file"
        id="gallery-input"
        accept="image/*,.pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Dedicated Camera Input */}
      <input
        ref={cameraInputRef}
        type="file"
        id="camera-input"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── Page Header (Exact "Upload Prescription" per spec) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            AI Prescription Scanner
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Upload Prescription
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Capture or upload your doctor's prescription image. Gemini Vision extracts medicines into structured daily schedules.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" /> Human Review Required
          </span>
        </div>
      </div>

      {/* ── Error Message Alert ── */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs font-semibold animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-800 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── SECTION 5: Supported Input Selection ── */}
      {!imagePreview ? (
        <div className="space-y-6">
          {/* Dual Action Buttons: Camera & Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Camera Input Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="group p-6 rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-lg hover:shadow-teal-600/25 transition-all text-left flex items-center justify-between border border-teal-500/30 active:scale-[0.98]"
            >
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-white">
                  Take Photo with Camera
                </h3>
                <p className="text-xs text-teal-100/80">
                  Instant mobile or webcam capture with auto-focus
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-teal-200 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* 2. Gallery / File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between active:scale-[0.98]"
            >
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Choose from Gallery
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select prescription image or PDF from device
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 scale-[1.01]"
                : "border-slate-300 dark:border-slate-700 hover:border-teal-400 bg-slate-50/50 dark:bg-slate-900/50"
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Or drag & drop prescription image here
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPG, PNG, WebP or scanned PDF up to 20MB
            </p>
            <span className="mt-3 text-[11px] font-bold text-teal-600 hover:underline">
              Browse files from computer
            </span>
          </div>

          {/* Photo Clarity Tips */}
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <h5 className="font-bold text-slate-900 dark:text-white">
                Tips for Best AI Prescription Extraction:
              </h5>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Capture in good lighting and keep the prescription flat without shadows.</li>
                <li>Ensure medicine names, strengths (e.g. 500mg), and doses (1+0+1) are sharp.</li>
                <li>Both handwritten Bengali/English prescriptions and printed clinic slips are supported.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* ── Image Preview & Multi-Stage Scanner Area ── */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Image Preview Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Selected Prescription
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {fileName || "Captured Image"} {fileSize ? `(${fileSize})` : ""}
                  </p>
                </div>
                {!isScanning && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    title="Change prescription photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Preview Box */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 flex items-center justify-center max-h-80 group">
                <img
                  src={imagePreview}
                  alt="Prescription Preview"
                  className="max-h-80 w-full object-contain"
                />
              </div>

              {!isScanning && stage !== "REVIEW" && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" /> Retake Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-slate-500 hover:underline"
                  >
                    Choose Different File
                  </button>
                </div>
              )}
            </div>

            {/* Right: AI Scanner & Stage Tracker */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-1">
                  AI Pipeline
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Prescription Extraction Workflow
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  The document passes through schema validation and medicine catalog matching before confirmation.
                </p>
              </div>

              {/* ── 4-Stage Progression Stepper per spec ── */}
              <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                {/* Stage 1: Uploading... */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      stage === "UPLOADING"
                        ? "bg-teal-600 text-white animate-pulse"
                        : stage === "PROCESSING" || stage === "AI_READING" || stage === "REVIEW"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    {stage === "PROCESSING" || stage === "AI_READING" || stage === "REVIEW" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : stage === "UPLOADING" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "1"
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      Uploading...
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Transferring and preparing prescription image
                    </p>
                  </div>
                </div>

                {/* Stepper connector line */}
                <div className="w-0.5 h-3 bg-slate-200 dark:bg-slate-700 ml-4" />

                {/* Stage 2: Processing... */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      stage === "PROCESSING"
                        ? "bg-teal-600 text-white animate-pulse"
                        : stage === "AI_READING" || stage === "REVIEW"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    {stage === "AI_READING" || stage === "REVIEW" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : stage === "PROCESSING" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "2"
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      Processing...
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Optimizing contrast and formatting payload
                    </p>
                  </div>
                </div>

                {/* Stepper connector line */}
                <div className="w-0.5 h-3 bg-slate-200 dark:bg-slate-700 ml-4" />

                {/* Stage 3: AI Reading Prescription... */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      stage === "AI_READING"
                        ? "bg-teal-600 text-white animate-pulse"
                        : stage === "REVIEW"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    {stage === "REVIEW" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : stage === "AI_READING" ? (
                      <Sparkles className="w-4 h-4 animate-spin text-teal-200" />
                    ) : (
                      "3"
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      AI Reading Prescription...
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Gemini Vision analyzing doctor handwriting & medicines
                    </p>
                  </div>
                </div>

                {/* Stepper connector line */}
                <div className="w-0.5 h-3 bg-slate-200 dark:bg-slate-700 ml-4" />

                {/* Stage 4: Review Results */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      stage === "REVIEW"
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    {stage === "REVIEW" ? <CheckCircle2 className="w-4 h-4" /> : "4"}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      Review Results
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      User verifies extracted dosage before activating schedule
                    </p>
                  </div>
                </div>
              </div>

              {/* Start AI Scan Button */}
              {stage !== "REVIEW" ? (
                <button
                  type="button"
                  onClick={handleRunGeminiOCR}
                  disabled={isScanning}
                  className="w-full py-4 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 disabled:opacity-70"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        {stage === "UPLOADING"
                          ? "Uploading..."
                          : stage === "PROCESSING"
                          ? "Processing..."
                          : "AI Reading Prescription..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Start AI Prescription Scan</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <a
                    href="#prescription-review-section"
                    className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold text-center transition-colors shadow-sm"
                  >
                    Review Extracted Medicines ({medicines.length})
                  </a>
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    Upload Another
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION 6, 7, 8, 9: Extracted Results & Human Confirmation Studio ── */}
      {extractedData && stage === "REVIEW" && (
        <div id="prescription-review-section" className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800 animate-fadeIn">
          {/* Clinical Prescription Header */}
          <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-teal-600 uppercase tracking-wider block">
                Extracted Prescription Header
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                {extractedData.hospitalName}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Prescribed by: <strong>{extractedData.doctorName}</strong> • Date: {extractedData.prescriptionDate}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Gemini OCR Validated
              </span>
            </div>
          </div>

          {/* Safety Alert Interceptor */}
          {extractedData.safetyAlerts && extractedData.safetyAlerts.length > 0 && (
            <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-2">
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

          {/* Extracted Medicines List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Prescription Review ({medicines.length} Medicines)
                </h3>
                <p className="text-xs text-slate-500">
                  Verify or edit each medicine, dosage frequency, and food instruction before creating schedules.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Confident (≥90%)
                </span>
                <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Review (&lt;90%)
                </span>
              </div>
            </div>

            {/* Medicine Items */}
            <div className="space-y-3">
              {medicines.map((med, index) => {
                const isHigh = med.confidenceScore >= 0.90;

                return (
                  <div
                    key={index}
                    className={`p-5 rounded-3xl border transition-all ${
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
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isHigh
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                            }`}
                          >
                            Confidence: {Math.round(med.confidenceScore * 100)}%
                          </span>

                          {med.isAntibiotic && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                              Antibiotic Guard
                            </span>
                          )}
                        </div>

                        {med.matchedCatalogItem && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Catalog Match: <strong>{med.matchedCatalogItem.manufacturer}</strong> • Unit Price: ৳{med.matchedCatalogItem.unitPrice.toFixed(2)}
                          </p>
                        )}
                      </div>

                      {/* Editable Form Controls */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block uppercase">
                            Dose
                          </label>
                          <input
                            type="text"
                            value={med.dose}
                            onChange={(e) => handleUpdateMedicine(index, "dose", e.target.value)}
                            className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block uppercase">
                            Frequency
                          </label>
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => handleUpdateMedicine(index, "frequency", e.target.value)}
                            className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block uppercase">
                            Food Instruction
                          </label>
                          <select
                            value={med.foodTiming}
                            onChange={(e) => handleUpdateMedicine(index, "foodTiming", e.target.value)}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                          >
                            <option value="BEFORE_FOOD">Before Food (খাবারের পূর্বে)</option>
                            <option value="AFTER_FOOD">After Food (খাবারের পরে)</option>
                            <option value="EMPTY_STOMACH">Empty Stomach (খালি পেটে)</option>
                            <option value="WITH_FOOD">With Food (খাবারের সাথে)</option>
                            <option value="AS_NEEDED">As Needed (প্রয়োজনে)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block uppercase">
                            Duration
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={med.durationDays}
                              onChange={(e) => handleUpdateMedicine(index, "durationDays", parseInt(e.target.value) || 1)}
                              className="w-16 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                            />
                            <span className="text-xs text-slate-500">Days</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block uppercase">
                            Additional Instruction
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Drink plenty of water"
                            value={med.additionalInstructions || ""}
                            onChange={(e) => handleUpdateMedicine(index, "additionalInstructions", e.target.value)}
                            className="w-44 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                          />
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

          {/* Confirm & Activate Medication Routine Action */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 max-w-xl">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
                Human Confirmation
              </span>
              <h4 className="font-extrabold text-lg text-white">
                Confirm Prescription & Create Medication Routine
              </h4>
              <p className="text-xs text-teal-200/80">
                Clicking confirm activates these verified medicines into your daily medication schedule and begins dose tracking with reminders.
              </p>
            </div>

            <button
              onClick={handleConfirmPrescription}
              disabled={confirming || medicines.length === 0}
              className="px-6 py-3.5 rounded-2xl bg-teal-400 hover:bg-teal-300 active:scale-95 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-400/20 whitespace-nowrap disabled:opacity-60"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{confirming ? "Saving Routine..." : "Confirm Prescription"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
