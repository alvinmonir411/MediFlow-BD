"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  UserPlus, 
  Heart, 
  Activity, 
  ShieldAlert, 
  Check, 
  Pill, 
  Phone, 
  AlertCircle,
  X,
  ArrowRight
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  allergies?: string;
  chronicConditions?: string;
  _count?: {
    schedules: number;
    prescriptions: number;
  };
}

export default function FamilyPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatientId, setActivePatientId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New family member form state
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");

  const loadPatients = async () => {
    try {
      const res = await fetch("/api/v1/patients");
      const json = await res.json();
      if (json.success) {
        setPatients(json.data);
        const stored = localStorage.getItem("mediflow_active_patient_id");
        if (stored && json.data.some((p: Patient) => p.id === stored)) {
          setActivePatientId(stored);
        } else if (json.data.length > 0) {
          setActivePatientId(json.data[0].id);
          localStorage.setItem("mediflow_active_patient_id", json.data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleSelectPatient = (id: string) => {
    setActivePatientId(id);
    localStorage.setItem("mediflow_active_patient_id", id);
    window.dispatchEvent(new Event("mediflow_patient_changed"));
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender,
          bloodGroup,
          emergencyContact,
          allergies: allergies || null,
          chronicConditions: chronicConditions || null,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to add family member.");
      }

      setModalOpen(false);
      setName("");
      setEmergencyContact("");
      setAllergies("");
      setChronicConditions("");

      await loadPatients();
      handleSelectPatient(json.data.id);
    } catch (err: any) {
      setError(err.message || "Failed to add family member.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Multi-Patient Healthcare Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            Family Patient Profiles (পারিবারিক প্রোফাইল)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage separate prescription vaults, dose reminders, and emergency IDs for each family member.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Add Family Member
        </button>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patients.map((patient) => {
          const isActive = patient.id === activePatientId;

          return (
            <div
              key={patient.id}
              onClick={() => handleSelectPatient(patient.id)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isActive
                  ? "bg-teal-50/60 dark:bg-teal-950/30 border-teal-500 shadow-md ring-2 ring-teal-500/20"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300"
              }`}
            >
              {isActive && (
                <div className="absolute top-4 right-4 flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-600 text-white shadow-sm">
                  <Check className="w-3 h-3" /> Active Profile
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                      Blood: {patient.bloodGroup || "B+"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {patient.gender}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {patient.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5" /> {patient.emergencyContact || "No contact"}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {patient.chronicConditions && (
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Conditions:</strong> {patient.chronicConditions}
                    </p>
                  )}
                  {patient.allergies && (
                    <p className="text-amber-700 dark:text-amber-400 font-semibold">
                      <strong>Allergies:</strong> {patient.allergies}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {patient._count?.schedules || 0} Active Schedules
                </span>
                <button
                  type="button"
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  {isActive ? "Viewing" : "Switch to Profile"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Family Member Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Family Member
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleAddPatient} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jahanara Begum (Mother)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Emergency Phone Contact
                </label>
                <input
                  type="text"
                  placeholder="e.g. +880 1711-000000"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Known Drug Allergies
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Aspirin"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chronic Conditions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Diabetes, Asthma, High BP"
                  value={chronicConditions}
                  onChange={(e) => setChronicConditions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20"
                >
                  {submitting ? "Saving to Neon DB..." : "Save Family Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
