"use client";

import { useEffect, useState } from "react";
import { User, Phone, ShieldAlert, Activity, Heart, Save, Check, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const [patientId, setPatientId] = useState<string>("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [phone, setPhone] = useState("");
  const [allergies, setAllergies] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.patients?.length > 0) {
          const storedId = localStorage.getItem("mediflow_active_patient_id");
          const p = json.patients.find((x: any) => x.id === storedId) || json.patients[0];
          setPatientId(p.id);
          setName(p.name || "");
          setGender(p.gender || "Male");
          setBloodGroup(p.bloodGroup || "B+");
          setPhone(p.emergencyContact || "");
          setAllergies(p.allergies || "");
          setChronicConditions(p.chronicConditions || "");
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/v1/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender,
          bloodGroup,
          emergencyContact: phone,
          allergies,
          chronicConditions,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage("Profile updated successfully in Neon PostgreSQL!");
        window.dispatchEvent(new Event("mediflow_patient_changed"));
      } else {
        setMessage(json.error || "Failed to update profile.");
      }
    } catch (e: any) {
      setMessage(e.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
          <User className="w-4 h-4" />
          Patient Health Record
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          My Patient Profile (আমার প্রোফাইল)
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Update basic details, emergency contacts, known allergies, and chronic conditions.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-200">
          <Check className="w-4 h-4 text-teal-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-teal-600">
            1. Basic Information
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
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
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
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
              Emergency Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +880 1819-987654"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-rose-600">
            2. Important Medical Information
          </h3>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Known Drug Allergies
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Sulfa drugs, Aspirin"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            />
            <span className="text-[11px] text-slate-500 block mt-1">
              This triggers safety warnings when prescriptions containing these drugs are uploaded.
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Existing Chronic Conditions
            </label>
            <input
              type="text"
              value={chronicConditions}
              onChange={(e) => setChronicConditions(e.target.value)}
              placeholder="e.g. Hypertension (উচ্চ রক্তচাপ), Type 2 Diabetes, Asthma"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? "Updating in Neon DB..." : "Save Profile Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
