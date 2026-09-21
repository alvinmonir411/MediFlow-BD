"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Pill, 
  Clock, 
  Calendar, 
  Plus, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RotateCw, 
  Camera, 
  Search, 
  X, 
  Save, 
  PauseCircle, 
  PlayCircle,
  Utensils
} from "lucide-react";

interface ScheduleItem {
  id: string;
  patientId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  foodTiming: string;
  startDate: string;
  endDate: string | null;
  reminderTimes: string[];
  isActive: boolean;
  dosesCount: number;
  createdAt: string;
}

interface MedicineCatalogItem {
  id: string;
  brand_name: string;
  generic_name: string;
  strength: string;
  dosage_form: string;
}

export default function MedicationSchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    medicineName: "",
    dosage: "1 Tablet",
    frequency: "1+0+1",
    foodTiming: "AFTER_FOOD",
    durationDays: "5",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  // Medicine Search Autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MedicineCatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const activePatientId = typeof window !== "undefined"
        ? localStorage.getItem("mediflow_active_patient_id")
        : null;

      const url = activePatientId
        ? `/api/v1/schedules?patientId=${encodeURIComponent(activePatientId)}`
        : `/api/v1/schedules`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setSchedules(json.data || []);
      }
    } catch (e) {
      console.error("Fetch schedules error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();

    const handlePatientChange = () => fetchSchedules();
    window.addEventListener("mediflow_patient_changed", handlePatientChange);
    return () => window.removeEventListener("mediflow_patient_changed", handlePatientChange);
  }, [fetchSchedules]);

  // Search Medicine Database
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/v1/medicines?q=${encodeURIComponent(searchQuery)}&limit=5`);
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenCreateModal = () => {
    setEditingSchedule(null);
    setFormData({
      medicineName: "",
      dosage: "1 Tablet",
      frequency: "1+0+1",
      foodTiming: "AFTER_FOOD",
      durationDays: "5",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
    setSearchQuery("");
    setSearchResults([]);
    setStatusMessage(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setFormData({
      medicineName: schedule.medicineName,
      dosage: schedule.dosage,
      frequency: schedule.frequency,
      foodTiming: schedule.foodTiming,
      durationDays: "5",
      startDate: schedule.startDate,
      endDate: schedule.endDate || "",
    });
    setSearchQuery(schedule.medicineName);
    setStatusMessage(null);
    setModalOpen(true);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/v1/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const json = await res.json();
      if (json.success) {
        fetchSchedules();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medicineName.trim()) {
      setStatusMessage({ type: "error", text: "Please provide a medicine name." });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const activePatientId = typeof window !== "undefined"
        ? localStorage.getItem("mediflow_active_patient_id")
        : null;

      if (editingSchedule) {
        // Edit Schedule
        const res = await fetch(`/api/v1/schedules/${editingSchedule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dosage: formData.dosage,
            frequency: formData.frequency,
            foodTiming: formData.foodTiming,
            endDate: formData.endDate || null,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to update schedule.");
      } else {
        // Create Schedule
        const res = await fetch(`/api/v1/schedules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: activePatientId,
            medicineName: formData.medicineName,
            dosage: formData.dosage,
            frequency: formData.frequency,
            foodTiming: formData.foodTiming,
            startDate: formData.startDate,
            durationDays: formData.durationDays,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to create schedule.");
      }

      setModalOpen(false);
      fetchSchedules();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save schedule." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectCatalogItem = (item: MedicineCatalogItem) => {
    setFormData({
      ...formData,
      medicineName: `${item.brand_name} ${item.strength}`,
      dosage: `1 ${item.dosage_form}`,
    });
    setSearchQuery(`${item.brand_name} ${item.strength}`);
    setSearchResults([]);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center">
            <Pill className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading medication schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            Medication Schedule Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Medication Schedules
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your daily medication schedules, reminder times, and food instructions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/prescriptions/new"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Camera className="w-4 h-4 text-teal-600" />
            <span>Scan Prescription</span>
          </Link>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Schedule</span>
          </button>
        </div>
      </div>

      {/* ── Schedules List Grid conforming to Section 10 spec ── */}
      {schedules.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 mx-auto">
            <Pill className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Medication Schedules Found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have no active medication schedules. You can create one manually or scan a prescription image to generate it automatically.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              + Create First Schedule
            </button>
            <Link
              href="/prescriptions/new"
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Scan Prescription
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 ${
                item.isActive
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400 shadow-sm"
                  : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-60"
              }`}
            >
              <div className="space-y-4">
                {/* Header: Medicine Name & Active Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {item.medicineName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                      <Utensils className="w-3.5 h-3.5 text-teal-600" />
                      <span>{item.foodTiming.replace(/_/g, " ")}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                      item.isActive
                        ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {item.isActive ? "Active" : "Paused"}
                  </span>
                </div>

                {/* Section 10 Spec Details Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-2.5 text-xs">
                  {/* Dose */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Dose:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{item.dosage}</strong>
                  </div>

                  {/* Reminder Times */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Time:</span>
                    <strong className="text-teal-600 dark:text-teal-400 font-bold">
                      {item.reminderTimes.join(", ")}
                    </strong>
                  </div>

                  {/* Frequency */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Frequency:</span>
                    <strong className="text-slate-900 dark:text-white font-bold">{item.frequency}</strong>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Duration:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">
                      {item.startDate} {item.endDate ? `to ${item.endDate}` : "• Ongoing"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleToggleActive(item.id, item.isActive)}
                  className="flex items-center gap-1 font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {item.isActive ? (
                    <>
                      <PauseCircle className="w-4 h-4 text-amber-500" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 text-emerald-500" />
                      <span>Resume</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(item)}
                  className="flex items-center gap-1 font-bold text-teal-600 hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Schedule</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT SCHEDULE MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingSchedule ? "Edit Medication Schedule" : "Create Medication Schedule"}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure dose, frequency, reminder times, and food instructions
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  statusMessage.type === "error"
                    ? "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSchedule} className="space-y-4">
              {/* Medicine Name with Autocomplete */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Medicine Name & Strength
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Search e.g. Napa 500mg, Seclo 20mg..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFormData({ ...formData, medicineName: e.target.value });
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>

                {/* Autocomplete Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-20 overflow-hidden">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectCatalogItem(item)}
                        className="w-full px-4 py-2.5 text-left text-xs hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <div>
                          <strong className="font-bold text-slate-900 dark:text-white">
                            {item.brand_name} {item.strength}
                          </strong>
                          <span className="text-[11px] text-slate-400 ml-2">
                            ({item.generic_name})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.dosage_form}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dose & Frequency Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Dose
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1 Tablet"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Frequency (দৈনিক মাত্রা)
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="1+0+1">1+0+1 (Morning & Night)</option>
                    <option value="1+1+1">1+1+1 (Morning, Noon & Night)</option>
                    <option value="1+0+0">1+0+0 (Morning Only)</option>
                    <option value="0+0+1">0+0+1 (Night Only)</option>
                    <option value="0+1+0">0+1+0 (Noon Only)</option>
                    <option value="1+1+0">1+1+0 (Morning & Noon)</option>
                  </select>
                </div>
              </div>

              {/* Food Instruction */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Food Instruction (খাওয়ার নিয়ম)
                </label>
                <select
                  value={formData.foodTiming}
                  onChange={(e) => setFormData({ ...formData, foodTiming: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="BEFORE_FOOD">Before Food (খাবারের পূর্বে)</option>
                  <option value="AFTER_FOOD">After Food (খাবারের পরে)</option>
                  <option value="EMPTY_STOMACH">Empty Stomach (খালি পেটে)</option>
                  <option value="WITH_FOOD">With Food (খাবারের সাথে)</option>
                  <option value="AS_NEEDED">As Needed (প্রয়োজনে)</option>
                </select>
              </div>

              {/* Start Date & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="e.g. 5"
                    value={formData.durationDays}
                    onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 disabled:opacity-60"
                >
                  {submitting ? "Saving..." : editingSchedule ? "Update Schedule" : "Create Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
