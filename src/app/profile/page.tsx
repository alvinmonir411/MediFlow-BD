"use client";

import { useEffect, useState } from "react";
import {
  User,
  Calendar,
  Heart,
  Phone,
  MapPin,
  ShieldAlert,
  Activity,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  UserCheck,
} from "lucide-react";

interface PatientProfile {
  id: string;
  name: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  phone: string | null;
  address: string | null;
  emergencyContact: string | null;
  allergies: string | null;
  chronicConditions: string | null;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function calculateAge(dob: string | null): string {
  if (!dob) return "";
  const diff = Date.now() - new Date(dob).getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} yrs`;
}

export default function ProfilePage() {
  const [patientId, setPatientId] = useState("");
  const [profile, setProfile] = useState<PatientProfile>({
    id: "",
    name: "",
    dateOfBirth: null,
    gender: "Male",
    bloodGroup: "B+",
    phone: "",
    address: "",
    emergencyContact: "",
    allergies: "",
    chronicConditions: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [activeSection, setActiveSection] = useState<"basic" | "medical">("basic");

  // Load patient data from Neon DB via /api/v1/auth/me
  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.patients?.length > 0) {
          const storedId = localStorage.getItem("mediflow_active_patient_id");
          const p: PatientProfile =
            json.patients.find((x: any) => x.id === storedId) || json.patients[0];
          setPatientId(p.id);
          setProfile({
            id: p.id,
            name: p.name || "",
            dateOfBirth: p.dateOfBirth || null,
            gender: p.gender || "Male",
            bloodGroup: p.bloodGroup || "B+",
            phone: p.phone || "",
            address: p.address || "",
            emergencyContact: p.emergencyContact || "",
            allergies: p.allergies || "",
            chronicConditions: p.chronicConditions || "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof PatientProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (status) setStatus(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    if (!profile.name.trim()) {
      setStatus({ type: "error", msg: "Full Name is required." });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/v1/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name.trim(),
          gender: profile.gender,
          bloodGroup: profile.bloodGroup,
          phone: profile.phone?.trim() || null,
          address: profile.address?.trim() || null,
          emergencyContact: profile.emergencyContact?.trim() || null,
          allergies: profile.allergies?.trim() || null,
          chronicConditions: profile.chronicConditions?.trim() || null,
          dateOfBirth: profile.dateOfBirth || null,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update profile.");

      setStatus({ type: "success", msg: "Profile updated successfully in Neon PostgreSQL!" });
      window.dispatchEvent(new Event("mediflow_patient_changed"));
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const age = calculateAge(profile.dateOfBirth);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading patient profile from Neon DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">

      {/* ── Page Header ── */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
          <UserCheck className="w-4 h-4" />
          Section 3 · Patient Profile
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          My Patient Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your health identity, emergency contacts, allergies, and medical conditions.
        </p>
      </div>

      {/* ── Profile Summary Card ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-500 shadow-xl shadow-teal-600/20 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black shadow-inner">
            {profile.name
              ? profile.name.trim().split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
              : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold truncate">{profile.name || "Your Name"}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs font-semibold text-white/80">
              {profile.gender && <span>{profile.gender}</span>}
              {profile.bloodGroup && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-white/40" /> {profile.bloodGroup}
                </span>
              )}
              {age && <span>{age} old</span>}
            </div>
            {profile.phone && (
              <p className="text-xs text-white/70 mt-1 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> {profile.phone}
              </p>
            )}
            {profile.address && (
              <p className="text-xs text-white/70 mt-0.5 flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" /> {profile.address}
              </p>
            )}
          </div>
          <div className="hidden sm:flex flex-col items-end gap-1.5 text-right">
            {profile.allergies && (
              <span className="text-[10px] bg-rose-500/30 text-white font-bold px-2.5 py-1 rounded-full">
                ⚠ Allergies
              </span>
            )}
            {profile.chronicConditions && (
              <span className="text-[10px] bg-amber-500/30 text-white font-bold px-2.5 py-1 rounded-full">
                📋 Conditions
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Section Tabs ── */}
      <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 w-fit">
        {(["basic", "medical"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveSection(tab)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSection === tab
                ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {tab === "basic" ? "👤 Basic Info" : "🏥 Medical Info"}
          </button>
        ))}
      </div>

      {/* ── Status Banner ── */}
      {status && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-semibold animate-fadeIn ${
            status.type === "success"
              ? "bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200"
              : "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-teal-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          )}
          <span>{status.msg}</span>
        </div>
      )}

      {/* ── Profile Form ── */}
      <form onSubmit={handleSave}>
        {/* SECTION: Basic Information */}
        {activeSection === "basic" && (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center">
                <User className="w-4 h-4 text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Basic Information</h3>
                <p className="text-[11px] text-slate-400">Name, date of birth, gender, blood group</p>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Dr. Rafiqul Islam"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Date of Birth
                {age && (
                  <span className="ml-2 text-teal-600 dark:text-teal-400 font-bold">(Age: {age})</span>
                )}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="date"
                  value={toDateInput(profile.dateOfBirth)}
                  onChange={(e) => handleChange("dateOfBirth", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Gender + Blood Group */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleChange("gender", g)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        profile.gender === g
                          ? "bg-teal-50 border-teal-500 text-teal-800 dark:bg-teal-950 dark:text-teal-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Blood Group
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => handleChange("bloodGroup", bg)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        profile.bloodGroup === bg
                          ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-400"
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="e.g. +880 1711-234567"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  value={profile.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="e.g. 12 Mirpur Road, Dhaka 1216, Bangladesh"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Saved to Neon PostgreSQL · Last updated: {new Date().toLocaleDateString("en-BD")}
              </p>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                ) : (
                  <><Save className="w-4 h-4" /><span>Save Basic Info</span></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* SECTION: Medical Information */}
        {activeSection === "medical" && (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Medical Information</h3>
                <p className="text-[11px] text-slate-400">Allergies, existing conditions, emergency contact</p>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Emergency Contact
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={profile.emergencyContact || ""}
                  onChange={(e) => handleChange("emergencyContact", e.target.value)}
                  placeholder="e.g. +880 1819-987654 (Father - Karim Hossain)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Displayed on your Emergency Medical ID for first responders.
              </p>
            </div>

            {/* Known Allergies */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <span className="text-rose-500">⚠</span> Known Drug Allergies
              </label>
              <textarea
                rows={3}
                value={profile.allergies || ""}
                onChange={(e) => handleChange("allergies", e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs, Aspirin, NSAIDs&#10;Enter each allergy on a new line or comma-separated"
                className="w-full px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-400 transition-colors resize-none"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                🛡 This triggers safety warnings when prescriptions contain these drugs.
              </p>
            </div>

            {/* Existing Conditions */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-500" /> Existing Chronic Conditions
              </label>
              <textarea
                rows={3}
                value={profile.chronicConditions || ""}
                onChange={(e) => handleChange("chronicConditions", e.target.value)}
                placeholder="e.g. Hypertension (উচ্চ রক্তচাপ), Type 2 Diabetes (ডায়াবেটিস), Asthma&#10;Enter each condition on a new line"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400 transition-colors resize-none"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Helps your care team understand your medical history.
              </p>
            </div>

            {/* Medical Notice */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 font-medium flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> PrescriptionMate BD is a medication management platform, not an AI doctor.
                Your medical data is securely stored and only used to help you manage your prescriptions and reminders.
              </span>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Saved to Neon PostgreSQL · Encrypted in transit
              </p>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                ) : (
                  <><Save className="w-4 h-4" /><span>Save Medical Info</span></>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ── Quick Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Blood Group",
            value: profile.bloodGroup || "—",
            icon: Heart,
            color: "rose",
          },
          {
            label: "Age",
            value: age || "—",
            icon: Calendar,
            color: "teal",
          },
          {
            label: "Allergies",
            value: profile.allergies
              ? profile.allergies.split(/[,\n]/).filter(Boolean).length + " noted"
              : "None recorded",
            icon: ShieldAlert,
            color: "amber",
          },
          {
            label: "Conditions",
            value: profile.chronicConditions
              ? profile.chronicConditions.split(/[,\n]/).filter(Boolean).length + " noted"
              : "None recorded",
            icon: Activity,
            color: "violet",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                color === "rose"
                  ? "bg-rose-50 dark:bg-rose-950/60"
                  : color === "teal"
                  ? "bg-teal-50 dark:bg-teal-950/60"
                  : color === "amber"
                  ? "bg-amber-50 dark:bg-amber-950/60"
                  : "bg-violet-50 dark:bg-violet-950/60"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  color === "rose"
                    ? "text-rose-600"
                    : color === "teal"
                    ? "text-teal-600"
                    : color === "amber"
                    ? "text-amber-600"
                    : "text-violet-600"
                }`}
              />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">{value}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
